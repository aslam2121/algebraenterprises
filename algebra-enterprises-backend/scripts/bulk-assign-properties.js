'use strict';

const { createStrapi } = require('@strapi/strapi');
const { safeDestroyStrapi } = require('./utils/safe-destroy-strapi');

const propertySchema = require('../src/api/property/content-types/property/schema.json');

const NEIGHBORHOOD_ATTRIBUTE_KEY = propertySchema.attributes.Neighborhood
  ? 'Neighborhood'
  : 'Neighbourhood';
const NEIGHBORHOOD_OPTIONS = propertySchema.attributes[NEIGHBORHOOD_ATTRIBUTE_KEY]?.options || [];
const NEIGHBORHOOD_SET = new Set(NEIGHBORHOOD_OPTIONS);

function getPropertyNeighborhood(property) {
  if (!property || typeof property !== 'object') {
    return '';
  }

  const value = property.Neighborhood ?? property.Neighbourhood;

  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : '';
  }

  return typeof value === 'string' ? value.trim() : '';
}

function parseArgs(argv) {
  const options = {
    apply: false,
    onlyUnassigned: false,
    neighborhoods: [],
    agentEmail: '',
    agentId: undefined,
    limit: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--only-unassigned') {
      options.onlyUnassigned = true;
      continue;
    }

    if (arg === '--agent-email') {
      options.agentEmail = String(argv[index + 1] || '').trim().toLowerCase();
      index += 1;
      continue;
    }

    if (arg === '--agent-id') {
      const parsedId = Number.parseInt(argv[index + 1], 10);
      if (Number.isNaN(parsedId) || parsedId < 1) {
        throw new Error('--agent-id must be a positive integer.');
      }
      options.agentId = parsedId;
      index += 1;
      continue;
    }

    if (arg === '--neighborhood') {
      const rawValue = String(argv[index + 1] || '');
      const parsedValues = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      options.neighborhoods.push(...parsedValues);
      index += 1;
      continue;
    }

    if (arg === '--limit') {
      const parsedLimit = Number.parseInt(argv[index + 1], 10);
      if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
        throw new Error('--limit must be a positive integer.');
      }
      options.limit = parsedLimit;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.agentEmail && !options.agentId) {
    throw new Error('Provide either --agent-email or --agent-id.');
  }

  if (options.agentEmail && options.agentId) {
    throw new Error('Use either --agent-email or --agent-id, not both.');
  }

  if (options.neighborhoods.length === 0) {
    throw new Error('Provide at least one --neighborhood value.');
  }

  const invalidNeighborhoods = options.neighborhoods.filter(
    (neighborhood) => !NEIGHBORHOOD_SET.has(neighborhood)
  );

  if (invalidNeighborhoods.length > 0) {
    throw new Error(
      `Invalid neighborhoods: ${invalidNeighborhoods.join(', ')}.`
    );
  }

  options.neighborhoods = [...new Set(options.neighborhoods)];

  return options;
}

async function findTargetAgent(strapi, options) {
  if (options.agentId) {
    return strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: options.agentId },
      select: ['id', 'username', 'email'],
      populate: { role: { select: ['id', 'name', 'type'] } },
    });
  }

  return strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: options.agentEmail },
    select: ['id', 'username', 'email'],
    populate: { role: { select: ['id', 'name', 'type'] } },
  });
}

async function findCandidateProperties(strapi, neighborhoods) {
  const properties = await strapi.db.query('api::property.property').findMany({
    where: {
      publishedAt: { $notNull: true },
    },
    populate: {
      Assigned_Agent: {
        select: ['id', 'username', 'email'],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return properties.filter((property) => neighborhoods.includes(getPropertyNeighborhood(property)));
}

async function assignProperties(options) {
  const strapi = createStrapi();

  try {
    await strapi.load();

    const agent = await findTargetAgent(strapi, options);

    if (!agent) {
      throw new Error('Target agent not found.');
    }

    const candidates = await findCandidateProperties(strapi, options.neighborhoods);
    const filteredCandidates = options.onlyUnassigned
      ? candidates.filter((property) => !property.Assigned_Agent)
      : candidates;
    const limitedCandidates = options.limit
      ? filteredCandidates.slice(0, options.limit)
      : filteredCandidates;

    const summary = {
      mode: options.apply ? 'apply' : 'dry-run',
      targetAgent: {
        id: agent.id,
        username: agent.username,
        email: agent.email,
        role: agent.role?.type || agent.role?.name || null,
      },
      neighborhoods: options.neighborhoods,
      onlyUnassigned: options.onlyUnassigned,
      matchedPublishedProperties: candidates.length,
      matchedAfterFilters: filteredCandidates.length,
      processedProperties: limitedCandidates.length,
      updated: 0,
      skippedAlreadyAssigned: 0,
      sample: [],
    };

    for (const property of limitedCandidates) {
      const currentAgentId = property.Assigned_Agent?.id || null;
      const alreadyAssignedToTarget = currentAgentId === agent.id;

      if (alreadyAssignedToTarget) {
        summary.skippedAlreadyAssigned += 1;
      }

      if (summary.sample.length < 20) {
        summary.sample.push({
          documentId: property.documentId,
          propertyCode: property.Property_Code,
          title: property.Title,
          neighborhood: getPropertyNeighborhood(property),
          currentAgent: property.Assigned_Agent
            ? {
                id: property.Assigned_Agent.id,
                email: property.Assigned_Agent.email || null,
                username: property.Assigned_Agent.username || null,
              }
            : null,
          nextAgentId: agent.id,
          action: alreadyAssignedToTarget ? 'skip' : 'assign',
        });
      }

      if (!options.apply || alreadyAssignedToTarget) {
        continue;
      }

      await strapi.documents('api::property.property').update({
        documentId: property.documentId,
        status: 'published',
        data: {
          Assigned_Agent: agent.id,
        },
      });

      summary.updated += 1;
    }

    return summary;
  } finally {
    await safeDestroyStrapi(strapi);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await assignProperties(options);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
