'use strict';

const fs = require('fs');
const path = require('path');

const { parse } = require('csv-parse/sync');
const { createStrapi } = require('@strapi/strapi');
const { safeDestroyStrapi } = require('./utils/safe-destroy-strapi');
const propertySchema = require('../src/api/property/content-types/property/schema.json');

const DEFAULT_CSV_PATH = path.resolve(__dirname, '../../algebra-address-rent.csv');
const PRICE_EPSILON = 1e-9;
const NEIGHBORHOOD_ATTRIBUTE_KEY = propertySchema.attributes.Neighborhood
  ? 'Neighborhood'
  : 'Neighbourhood';

function parseArgs(argv) {
  const options = {
    apply: false,
    csvPath: DEFAULT_CSV_PATH,
    limit: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--csv') {
      options.csvPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--limit') {
      const rawLimit = argv[index + 1];
      const parsedLimit = Number.parseInt(rawLimit, 10);

      if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
        throw new Error('--limit must be a positive integer.');
      }

      options.limit = parsedLimit;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizeCsvCell(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function canonicalizeNeighborhood(value) {
  return normalizeCsvCell(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeAddress(value) {
  const normalized = normalizeCsvCell(value).replace(/^`+/, '');
  return normalized === '\\' ? '' : normalized;
}

function normalizePrice(value, rowNumber) {
  const normalized = normalizeCsvCell(value)
    .replace(/\s+/g, '')
    .replace(/`+/g, '')
    .replace(/\.{2,}/g, '.');

  if (!normalized) {
    return null;
  }

  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?|\.\d+)([lLkK])$/);
  if (!match) {
    throw new Error(`CSV row ${rowNumber} has an invalid Price value: ${value}`);
  }

  const amount = Number(match[1]);
  if (Number.isNaN(amount)) {
    throw new Error(`CSV row ${rowNumber} has an invalid Price value: ${value}`);
  }

  if (match[2].toLowerCase() === 'k') {
    return Number((amount / 100).toFixed(4));
  }

  return amount;
}

function getCsvNeighborhood(row) {
  return normalizeCsvCell(row.Neighbourhood || row.Neighborhood);
}

function readCsvRows(csvPath) {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function isSummaryRow(record) {
  return record.neighborhood.toLowerCase() === 'total'
    || record.propertyCode.toLowerCase() === 'total'
    || (
      record.neighborhood.toLowerCase() === 'total'
      && !record.address
      && record.price === null
    );
}

function parseRecords(rows) {
  const parsedRecords = [];
  const duplicateRows = [];
  const seenCodes = new Map();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const record = {
      rowNumber,
      neighborhood: getCsvNeighborhood(row),
      propertyCode: normalizeCsvCell(row.Property_Code).toLowerCase(),
      address: normalizeAddress(row.Property_Address),
      price: normalizePrice(row.Price, rowNumber),
      rawPrice: normalizeCsvCell(row.Price),
    };

    if (isSummaryRow(record)) {
      return;
    }

    if (!record.propertyCode) {
      throw new Error(`CSV row ${rowNumber} is missing Property_Code.`);
    }

    if (seenCodes.has(record.propertyCode)) {
      duplicateRows.push({
        propertyCode: record.propertyCode,
        rows: [seenCodes.get(record.propertyCode), rowNumber],
      });
      return;
    }

    seenCodes.set(record.propertyCode, rowNumber);
    parsedRecords.push(record);
  });

  return {
    records: parsedRecords,
    duplicateRows,
  };
}

function priceChanged(currentPrice, nextPrice) {
  if (currentPrice === null || currentPrice === undefined) {
    return nextPrice !== null;
  }

  if (nextPrice === null) {
    return true;
  }

  return Math.abs(Number(currentPrice) - nextPrice) > PRICE_EPSILON;
}

function getPropertyNeighborhood(property) {
  if (!property || typeof property !== 'object') {
    return '';
  }

  return normalizeCsvCell(property.Neighborhood || property.Neighbourhood);
}

async function findPublishedPropertyByCode(strapi, propertyCode) {
  return strapi.db.query('api::property.property').findOne({
    where: {
      Property_Code: propertyCode,
      publishedAt: { $notNull: true },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

async function importRows(options) {
  const rawRows = readCsvRows(options.csvPath);
  const { records, duplicateRows } = parseRecords(rawRows);

  if (duplicateRows.length > 0) {
    throw new Error(`Duplicate Property_Code rows found: ${JSON.stringify(duplicateRows)}`);
  }

  const limitedRecords = options.limit ? records.slice(0, options.limit) : records;
  const summary = {
    csvPath: options.csvPath,
    totalCsvRows: rawRows.length,
    processedRecords: limitedRecords.length,
    duplicateRows,
    missingProperties: [],
    neighborhoodMismatches: [],
    matchedPublishedProperties: 0,
    wouldUpdate: 0,
    updated: 0,
    unchanged: 0,
    blankPrices: 0,
    clearedPrices: 0,
    blankAddresses: 0,
    clearedAddresses: 0,
    sample: [],
  };

  const strapi = createStrapi();

  try {
    await strapi.load();

    for (const [index, record] of limitedRecords.entries()) {
      const currentProperty = await findPublishedPropertyByCode(strapi, record.propertyCode);

      if (!currentProperty) {
        summary.missingProperties.push({
          row: record.rowNumber,
          propertyCode: record.propertyCode,
          neighborhood: record.neighborhood,
        });
        continue;
      }

      summary.matchedPublishedProperties += 1;

      const currentNeighborhood = getPropertyNeighborhood(currentProperty);
      const nextNeighborhood = currentNeighborhood || record.neighborhood;
      if (
        record.neighborhood
        && currentNeighborhood
        && canonicalizeNeighborhood(record.neighborhood) !== canonicalizeNeighborhood(currentNeighborhood)
      ) {
        summary.neighborhoodMismatches.push({
          row: record.rowNumber,
          propertyCode: record.propertyCode,
          csvNeighborhood: record.neighborhood,
          propertyNeighborhood: currentNeighborhood,
        });
      }

      const currentAddress = normalizeAddress(currentProperty.Property_Address);
      const nextAddress = record.address;
      const currentPrice = currentProperty.Price === null || currentProperty.Price === undefined
        ? null
        : Number(currentProperty.Price);
      const nextPrice = record.price;

      const addressDidChange = currentAddress !== nextAddress;
      const priceDidChange = priceChanged(currentPrice, nextPrice);

      if (nextAddress === '') {
        summary.blankAddresses += 1;
        if (addressDidChange) {
          summary.clearedAddresses += 1;
        }
      }

      if (nextPrice === null) {
        summary.blankPrices += 1;
        if (priceDidChange) {
          summary.clearedPrices += 1;
        }
      }

      if (!addressDidChange && !priceDidChange) {
        summary.unchanged += 1;
        continue;
      }

      summary.wouldUpdate += 1;

      if (summary.sample.length < 15) {
        summary.sample.push({
          propertyCode: record.propertyCode,
          neighborhood: currentNeighborhood || record.neighborhood || null,
          currentAddress,
          nextAddress,
          currentPrice,
          nextPrice,
        });
      }

      if (!options.apply) {
        continue;
      }

      await strapi.documents('api::property.property').update({
        documentId: currentProperty.documentId,
        status: 'published',
        data: {
          [NEIGHBORHOOD_ATTRIBUTE_KEY]: nextNeighborhood,
          Property_Address: nextAddress,
          Price: nextPrice,
        },
      });

      summary.updated += 1;

      if ((index + 1) % 50 === 0) {
        console.log(JSON.stringify({
          progress: index + 1,
          processedRecords: limitedRecords.length,
          apply: options.apply,
        }));
      }
    }

    return summary;
  } finally {
    await safeDestroyStrapi(strapi);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await importRows(options);

  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run',
    ...summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
