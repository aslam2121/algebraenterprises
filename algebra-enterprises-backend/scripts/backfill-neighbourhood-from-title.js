'use strict';

const { createStrapi } = require('@strapi/strapi');

const propertySchema = require('../src/api/property/content-types/property/schema.json');

const TITLE_CODE_PATTERN = /\s*\([^)]+\)\s*$/;
const NEIGHBOURHOOD_ATTRIBUTE_KEY = propertySchema.attributes.Neighborhood
  ? 'Neighborhood'
  : 'Neighbourhood';
const NEIGHBOURHOOD_OPTIONS = propertySchema.attributes[NEIGHBOURHOOD_ATTRIBUTE_KEY]?.options || [];
const TITLE_ALIASES = new Map([
  ['panchsheel enclave', 'Pansheel Enclave'],
]);

function parseArgs(argv) {
  const options = {
    apply: false,
    limit: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--apply') {
      options.apply = true;
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

function normalizeTitleValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getCurrentNeighbourhood(row) {
  const value = row?.Neighbourhood ?? row?.Neighborhood;
  return typeof value === 'string' ? value.trim() : '';
}

function getTitlePrefix(title) {
  return String(title || '').replace(TITLE_CODE_PATTERN, '').trim();
}

function resolveNeighbourhoodFromTitle(titlePrefix) {
  if (!titlePrefix) {
    return '';
  }

  const exactMatch = NEIGHBOURHOOD_OPTIONS.find((option) => option === titlePrefix);
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedTitle = normalizeTitleValue(titlePrefix);

  if (TITLE_ALIASES.has(normalizedTitle)) {
    return TITLE_ALIASES.get(normalizedTitle);
  }

  return NEIGHBOURHOOD_OPTIONS.find((option) => normalizeTitleValue(option) === normalizedTitle) || '';
}

async function run(options) {
  const strapi = createStrapi();
  const summary = {
    processed: 0,
    updated: 0,
    unresolved: [],
    sample: [],
  };

  try {
    await strapi.load();

    const rows = await strapi.db.query('api::property.property').findMany({
      where: {
        publishedAt: { $notNull: true },
      },
      orderBy: {
        Property_Code: 'asc',
      },
    });

    const missingRows = rows.filter((row) => !getCurrentNeighbourhood(row));
    const limitedRows = options.limit ? missingRows.slice(0, options.limit) : missingRows;

    summary.processed = limitedRows.length;

    for (const row of limitedRows) {
      const titlePrefix = getTitlePrefix(row.Title);
      const resolvedNeighbourhood = resolveNeighbourhoodFromTitle(titlePrefix);

      if (!resolvedNeighbourhood) {
        summary.unresolved.push({
          propertyCode: row.Property_Code,
          title: row.Title,
          titlePrefix,
        });
        continue;
      }

      if (summary.sample.length < 20) {
        summary.sample.push({
          propertyCode: row.Property_Code,
          titlePrefix,
          neighbourhood: resolvedNeighbourhood,
        });
      }

      if (!options.apply) {
        continue;
      }

      await strapi.documents('api::property.property').update({
        documentId: row.documentId,
        status: 'published',
        data: {
          [NEIGHBOURHOOD_ATTRIBUTE_KEY]: resolvedNeighbourhood,
        },
      });

      summary.updated += 1;
    }

    return summary;
  } finally {
    await strapi.destroy();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await run(options);

  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run',
    neighbourhoodAttributeKey: NEIGHBOURHOOD_ATTRIBUTE_KEY,
    ...summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
