'use strict';

const fs = require('fs');
const path = require('path');

const { parse } = require('csv-parse/sync');
const { createStrapi } = require('@strapi/strapi');

const { buildPropertyData } = require('../src/api/property/utils/agent-property');
const propertySchema = require('../src/api/property/content-types/property/schema.json');

const DEFAULT_CSV_PATH = path.resolve(__dirname, '../../algebra_properties_data.csv');
const DEFAULT_PARKING_CSV_PATH = path.resolve(__dirname, '../../algebra_Parking.csv');
const LISTING_TYPE_ALIASES = {
  'For Rent, For Sale': 'For Rent and For Sale',
};
const TITLE_CODE_PATTERN = /\(([^)]+)\)\s*$/;
const NEIGHBORHOOD_ATTRIBUTE_KEY = propertySchema.attributes.Neighborhood
  ? 'Neighborhood'
  : 'Neighbourhood';
const NEIGHBORHOOD_SET = new Set(propertySchema.attributes[NEIGHBORHOOD_ATTRIBUTE_KEY]?.options || []);

function parseArgs(argv) {
  const options = {
    apply: false,
    csvPath: DEFAULT_CSV_PATH,
    parkingCsvPath: fs.existsSync(DEFAULT_PARKING_CSV_PATH) ? DEFAULT_PARKING_CSV_PATH : undefined,
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

    if (arg === '--parking-csv') {
      options.parkingCsvPath = path.resolve(process.cwd(), argv[index + 1]);
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

function normalizeListingType(value) {
  const normalized = normalizeCsvCell(value);
  return LISTING_TYPE_ALIASES[normalized] || normalized;
}

function getNeighborhoodValue(source) {
  if (!source || typeof source !== 'object') {
    return '';
  }

  if (Array.isArray(source.Neighborhood)) {
    return typeof source.Neighborhood[0] === 'string' ? source.Neighborhood[0].trim() : '';
  }

  if (typeof source.Neighborhood === 'string') {
    return source.Neighborhood.trim();
  }

  if (Array.isArray(source.Neighbourhood)) {
    return typeof source.Neighbourhood[0] === 'string' ? source.Neighbourhood[0].trim() : '';
  }

  if (typeof source.Neighbourhood === 'string') {
    return source.Neighbourhood.trim();
  }

  return '';
}

function normalizeParkingValue(value, fieldName) {
  const normalized = normalizeCsvCell(value).toLowerCase();

  if (!normalized || normalized === 'no') {
    return '';
  }

  if (normalized === 'yes') {
    return '1';
  }

  if (/^\d+$/.test(normalized)) {
    return normalized;
  }

  throw new Error(`${fieldName} must be blank, yes/no, or a whole number.`);
}

function readCsvRows(csvPath) {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function readParkingRows(csvPath) {
  if (!csvPath) {
    return [];
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function buildParkingMap(rows) {
  const parkingByCode = new Map();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const propertyCode = normalizeCsvCell(row.Property_Code);

    if (!propertyCode) {
      throw new Error(`Parking CSV row ${rowNumber} is missing Property_Code.`);
    }

    parkingByCode.set(
      propertyCode,
      normalizeParkingValue(row.Parking, `Parking CSV row ${rowNumber} Parking`)
    );
  });

  return parkingByCode;
}

function mergeRowsByPropertyCode(rows) {
  const mergedByCode = new Map();
  const duplicateSummaries = [];
  const titleCodeMismatches = [];
  let listingTypeAliasCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const normalizedRow = {
      Title: normalizeCsvCell(row.Title),
      [NEIGHBORHOOD_ATTRIBUTE_KEY]: getNeighborhoodValue(row),
      Listing_Type: normalizeListingType(row.Listing_Type),
      Property_Code: normalizeCsvCell(row.Property_Code),
      Rooms: normalizeCsvCell(row.Rooms),
      Property_Type: normalizeCsvCell(row.Property_Type),
      Parking: normalizeParkingValue(row.Parking, `CSV row ${rowNumber} Parking`),
      Bedrooms: normalizeCsvCell(row.Bedrooms),
      Bathrooms: normalizeCsvCell(row.Bathrooms),
      Directions: normalizeCsvCell(row.Directions),
      Features: normalizeCsvCell(row.Features),
    };

    if (!normalizedRow.Property_Code) {
      throw new Error(`CSV row ${rowNumber} is missing Property_Code.`);
    }

    if (!normalizedRow.Title) {
      throw new Error(`CSV row ${rowNumber} is missing Title.`);
    }

    if (normalizeCsvCell(row.Listing_Type) !== normalizedRow.Listing_Type) {
      listingTypeAliasCount += 1;
    }

    const titleCodeMatch = normalizedRow.Title.match(TITLE_CODE_PATTERN);
    if (titleCodeMatch && titleCodeMatch[1] !== normalizedRow.Property_Code) {
      titleCodeMismatches.push({
        row: rowNumber,
        propertyCode: normalizedRow.Property_Code,
        title: normalizedRow.Title,
      });
    }

    const existing = mergedByCode.get(normalizedRow.Property_Code);

    if (!existing) {
      mergedByCode.set(normalizedRow.Property_Code, {
        ...normalizedRow,
        _rowNumbers: [rowNumber],
      });
      return;
    }

    const conflicts = [];
    for (const [field, value] of Object.entries(normalizedRow)) {
      if (!value || field === 'Property_Code') {
        continue;
      }

      const previousValue = existing[field];
      if (!previousValue) {
        existing[field] = value;
        continue;
      }

      if (previousValue !== value) {
        conflicts.push({
          field,
          from: previousValue,
          to: value,
        });
        existing[field] = value;
      }
    }

    existing._rowNumbers.push(rowNumber);
    duplicateSummaries.push({
      propertyCode: normalizedRow.Property_Code,
      rows: [...existing._rowNumbers],
      conflicts,
    });
  });

  return {
    records: [...mergedByCode.values()],
    duplicateSummaries,
    titleCodeMismatches,
    listingTypeAliasCount,
  };
}

function applyParkingOverlay(records, parkingByCode) {
  if (!parkingByCode.size) {
    return {
      records,
      parkingOverlayMatches: 0,
      parkingOverlayOnlyCodes: [],
    };
  }

  let parkingOverlayMatches = 0;
  const seenCodes = new Set(records.map((record) => record.Property_Code));

  const updatedRecords = records.map((record) => {
    if (!parkingByCode.has(record.Property_Code)) {
      return record;
    }

    parkingOverlayMatches += 1;
    return {
      ...record,
      Parking: parkingByCode.get(record.Property_Code),
    };
  });

  return {
    records: updatedRecords,
    parkingOverlayMatches,
    parkingOverlayOnlyCodes: [...parkingByCode.keys()].filter((code) => !seenCodes.has(code)),
  };
}

function resolveNeighborhood(record, currentProperty) {
  const csvNeighborhood = getNeighborhoodValue(record);
  if (csvNeighborhood) {
    return csvNeighborhood;
  }

  const currentNeighborhood = getNeighborhoodValue(currentProperty);
  if (currentNeighborhood) {
    return currentNeighborhood;
  }

  const titlePrefix = record.Title.replace(TITLE_CODE_PATTERN, '').trim();
  if (NEIGHBORHOOD_SET.has(titlePrefix)) {
    return titlePrefix;
  }

  return '';
}

function buildImportData(record, currentProperty) {
  const currentImages = currentProperty?.Images || [];
  const resolvedNeighborhood = resolveNeighborhood(record, currentProperty);

  const body = {
    Title: record.Title || currentProperty?.Title,
    Description: undefined,
    Price: currentProperty?.Price,
    Property_Type: record.Property_Type || currentProperty?.Property_Type,
    Listing_Type: record.Listing_Type || currentProperty?.Listing_Type,
    Property_Status: currentProperty?.Property_Status || 'Live',
    Bedrooms: record.Bedrooms || currentProperty?.Bedrooms,
    Bathrooms: record.Bathrooms || currentProperty?.Bathrooms,
    Area_Sqm: currentProperty?.Area_Sqm,
    Area_sqft: currentProperty?.Area_sqft,
    Area_Acre: currentProperty?.Area_Acre,
    Property_Code: record.Property_Code || currentProperty?.Property_Code,
    Agent_Phone: currentProperty?.Agent_Phone,
    Featured_Property: currentProperty?.Featured_Property,
    Property_Age: currentProperty?.Property_Age,
    Features: record.Features || currentProperty?.Features,
    [NEIGHBORHOOD_ATTRIBUTE_KEY]: resolvedNeighborhood,
    Property_Address: '',
    Rooms: record.Rooms || currentProperty?.Rooms,
    Parking: record.Parking,
    Directions: record.Directions || currentProperty?.Directions,
  };

  let propertyData;

  try {
    propertyData = buildPropertyData(
        body,
        currentProperty?.Assigned_Agent?.id,
        currentImages.map((image) => image.id),
        { allowEmptyAddress: true }
      );
  } catch (error) {
    error.message = `${error.message} [Property_Code=${record.Property_Code}]`;
    throw error;
  }

  if (currentProperty?.Description) {
    propertyData.Description = currentProperty.Description;
  }

  return {
    propertyData,
    clearedAddress: propertyData.Property_Address === '',
    derivedNeighborhood: !getNeighborhoodValue(record) && !!resolvedNeighborhood,
  };
}

async function findPublishedPropertyByCode(strapi, propertyCode) {
  return strapi.db.query('api::property.property').findOne({
    where: {
      Property_Code: propertyCode,
      publishedAt: { $notNull: true },
    },
    populate: {
      Images: true,
      Assigned_Agent: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

async function importRows(options) {
  const rawRows = readCsvRows(options.csvPath);
  const parkingRows = readParkingRows(options.parkingCsvPath);
  const parkingByCode = buildParkingMap(parkingRows);
  const {
    records,
    duplicateSummaries,
    titleCodeMismatches,
    listingTypeAliasCount,
  } = mergeRowsByPropertyCode(rawRows);
  const {
    records: recordsWithParking,
    parkingOverlayMatches,
    parkingOverlayOnlyCodes,
  } = applyParkingOverlay(records, parkingByCode);
  const limitedRecords = options.limit ? recordsWithParking.slice(0, options.limit) : recordsWithParking;

  const strapi = createStrapi();
  const summary = {
    csvPath: options.csvPath,
    parkingCsvPath: options.parkingCsvPath || null,
    totalCsvRows: rawRows.length,
    totalParkingRows: parkingRows.length,
    uniquePropertyCodes: records.length,
    processedRecords: limitedRecords.length,
    listingTypeAliasCount,
    parkingOverlayMatches,
    parkingOverlayOnlyCodes,
    duplicateCodes: duplicateSummaries.filter((entry, index, all) => (
      all.findIndex((candidate) => candidate.propertyCode === entry.propertyCode) === index
    )),
    titleCodeMismatches,
    unmatchedColumns: [],
    created: 0,
    updated: 0,
    clearedAddresses: 0,
    derivedNeighborhoodsApplied: 0,
    sample: [],
  };

  try {
    await strapi.load();

    for (const [index, record] of limitedRecords.entries()) {
      const currentProperty = await findPublishedPropertyByCode(strapi, record.Property_Code);
      const {
        propertyData,
        clearedAddress,
        derivedNeighborhood,
      } = buildImportData(record, currentProperty);

      if (clearedAddress) {
        summary.clearedAddresses += 1;
      }

      if (derivedNeighborhood) {
        summary.derivedNeighborhoodsApplied += 1;
      }

      if (summary.sample.length < 12) {
        summary.sample.push({
          propertyCode: record.Property_Code,
          action: currentProperty ? 'update' : 'create',
          title: propertyData.Title,
          listingType: propertyData.Listing_Type,
          propertyType: propertyData.Property_Type || null,
          bedrooms: propertyData.Bedrooms ?? null,
          bathrooms: propertyData.Bathrooms ?? null,
          rooms: propertyData.Rooms ?? null,
          parking: propertyData.Parking ?? null,
          directions: propertyData.Directions || null,
          features: propertyData.Features,
          clearedAddress,
        });
      }

      if (!options.apply) {
        continue;
      }

      if (currentProperty) {
        await strapi.documents('api::property.property').update({
          documentId: currentProperty.documentId,
          status: 'published',
          data: propertyData,
        });
        summary.updated += 1;
      } else {
        await strapi.documents('api::property.property').create({
          status: 'published',
          data: propertyData,
        });
        summary.created += 1;
      }

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
    await strapi.destroy();
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
