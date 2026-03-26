'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
const { errors } = require('@strapi/utils');

const {
  buildPropertyData,
  extractImageFiles,
  parseRequestBody,
  processPropertyImages,
} = require('../utils/agent-property');

const { ValidationError } = errors;
const RETRYABLE_UPLOAD_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH']);
const RETRYABLE_UPLOAD_MESSAGE_FRAGMENTS = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPropertyNeighbourhoodValue(property) {
  const value = property?.Neighbourhood ?? property?.Neighborhood;

  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }

  return typeof value === 'string' ? value : '';
}

function matchesNeighbourhoodFilter(property, filterValue) {
  const neighbourhood = getPropertyNeighbourhoodValue(property).toLowerCase();

  if (!neighbourhood) {
    return false;
  }

  if (typeof filterValue === 'string') {
    return neighbourhood === filterValue.toLowerCase();
  }

  if (!filterValue || typeof filterValue !== 'object') {
    return true;
  }

  const exactValue = typeof filterValue.$eq === 'string' ? filterValue.$eq : null;
  if (exactValue) {
    return neighbourhood === exactValue.toLowerCase();
  }

  const exactInsensitiveValue = typeof filterValue.$eqi === 'string' ? filterValue.$eqi : null;
  if (exactInsensitiveValue) {
    return neighbourhood === exactInsensitiveValue.toLowerCase();
  }

  const containsValue = typeof filterValue.$contains === 'string' ? filterValue.$contains : null;
  if (containsValue) {
    return neighbourhood.includes(containsValue.toLowerCase());
  }

  const containsInsensitiveValue = typeof filterValue.$containsi === 'string' ? filterValue.$containsi : null;
  if (containsInsensitiveValue) {
    return neighbourhood.includes(containsInsensitiveValue.toLowerCase());
  }

  return true;
}

function flattenErrorCodes(error) {
  const nestedErrors = Array.isArray(error?.errors) ? error.errors : [];
  const codes = [error?.code, ...nestedErrors.map((nestedError) => nestedError?.code)].filter(Boolean);
  return [...new Set(codes)];
}

function flattenErrorMessages(error) {
  const nestedErrors = Array.isArray(error?.errors) ? error.errors : [];
  const messages = [error?.message, ...nestedErrors.map((nestedError) => nestedError?.message)]
    .filter((message) => typeof message === 'string')
    .map((message) => message.trim())
    .filter(Boolean);
  return [...new Set(messages)];
}

function getReadableUploadErrorMessage(error) {
  const nestedMessages = flattenErrorMessages(error).filter((message) => message !== error?.message?.trim());
  const primaryMessage = typeof error?.message === 'string' ? error.message.trim() : '';

  if (
    flattenErrorMessages(error).some((message) => (
      RETRYABLE_UPLOAD_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))
    ))
  ) {
    return 'The media storage connection was interrupted during upload. Please try again.';
  }

  if (nestedMessages.length > 0) {
    return nestedMessages.join('; ');
  }

  if (primaryMessage) {
    return primaryMessage;
  }

  return 'Unknown upload error.';
}

function isRetryableUploadError(error) {
  return flattenErrorCodes(error).some((code) => RETRYABLE_UPLOAD_CODES.has(code))
    || flattenErrorMessages(error).some((message) => (
      RETRYABLE_UPLOAD_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))
    ));
}

async function uploadProcessedImages(strapi, processedFiles, maxAttempts = 3) {
  const uploadedFiles = [];

  try {
    for (const file of processedFiles) {
      let lastError;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const uploadedBatch = await strapi.plugin('upload').service('upload').upload({
            data: {},
            files: [file],
          });
          uploadedFiles.push(...uploadedBatch);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;

          if (!isRetryableUploadError(error) || attempt === maxAttempts) {
            throw error;
          }

          await sleep(500 * attempt);
        }
      }
    }

    return uploadedFiles;
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map((file) => strapi.plugin('upload').service('upload').remove(file))
      );
    }

    const readableMessage = getReadableUploadErrorMessage(error);
    throw new Error(`Media upload failed: ${readableMessage}`);
  }
}

async function getAssignedPropertyForUser(strapi, userId, documentId) {
  const userWithProps = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { properties: { select: ['id', 'documentId'] } },
  });

  const matchedProperty = (userWithProps?.properties || []).find(
    (property) => property.documentId === documentId
  );

  if (!matchedProperty) {
    return null;
  }

  return strapi.db.query('api::property.property').findOne({
    where: { id: matchedProperty.id },
    populate: { Images: true },
  });
}

module.exports = createCoreController('api::property.property', ({ strapi }) => ({

  async find(ctx) {
    const rawFilters = ctx.query?.filters || {};
    const neighbourhoodFilter = rawFilters.Neighbourhood ?? rawFilters.Neighborhood;

    if (!neighbourhoodFilter) {
      return super.find(ctx);
    }

    await this.validateQuery(ctx);

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const normalizedFilters = { ...(sanitizedQuery.filters || {}) };

    delete normalizedFilters.Neighbourhood;
    delete normalizedFilters.Neighborhood;

    const page = Math.max(parseInt(sanitizedQuery.pagination?.page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(sanitizedQuery.pagination?.pageSize, 10) || 25, 1);

    const { results } = await strapi.service('api::property.property').find({
      ...sanitizedQuery,
      filters: normalizedFilters,
      pagination: {
        page: 1,
        pageSize: 1000,
      },
    });

    const filteredResults = results.filter((property) => matchesNeighbourhoodFilter(property, neighbourhoodFilter));
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + pageSize);
    const sanitizedResults = await this.sanitizeOutput(paginatedResults, ctx);

    return this.transformResponse(sanitizedResults, {
      pagination: {
        page,
        pageSize,
        pageCount: filteredResults.length > 0 ? Math.ceil(filteredResults.length / pageSize) : 0,
        total: filteredResults.length,
      },
    });
  },

  async findMyProperties(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // Step 1 — Get assigned property IDs from user side
      const userWithProps = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: { properties: { select: ['id', 'documentId'] } },
      });

      const allProps = userWithProps?.properties || [];

      // Deduplicate by documentId
      const seen = new Set();
      const uniqueIds = [];
      for (const p of allProps) {
        if (!seen.has(p.documentId)) {
          seen.add(p.documentId);
          uniqueIds.push(p.id);
        }
      }

      if (uniqueIds.length === 0) {
        ctx.body = { data: [] };
        return;
      }

      // Step 2 — Fetch full property data including private Address field
      // No select array = returns ALL fields including private ones
      // Safe because this endpoint requires authentication
      const properties = await strapi.db.query('api::property.property').findMany({
        where: { id: { $in: uniqueIds } },
        populate: { Images: true },
      });

      ctx.body = { data: properties };
    } catch (e) {
      console.error('findMyProperties error:', e);
      ctx.internalServerError('Something went wrong: ' + e.message);
    }
  },

  async createMyProperty(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    let cleanupProcessedImages = async () => {};
    let uploadedImages = [];

    try {
      const body = parseRequestBody(ctx.request.body);
      const imageFiles = extractImageFiles(ctx.request.files);
      const propertyData = buildPropertyData(body, user.id);

      const existingProperty = await strapi.documents('api::property.property').findFirst({
        fields: ['documentId'],
        filters: { Property_Code: propertyData.Property_Code },
      });

      if (existingProperty) {
        throw new ValidationError('Property code already exists.');
      }

      if (imageFiles.length > 0) {
        const processed = await processPropertyImages(imageFiles, propertyData.Property_Code);
        cleanupProcessedImages = processed.cleanup;

        uploadedImages = await uploadProcessedImages(strapi, processed.processedFiles);

        propertyData.Images = uploadedImages.map((file) => file.id);
      }

      await strapi.documents('api::property.property').create({
        status: 'published',
        data: propertyData,
      });

      const createdProperty = await strapi.db.query('api::property.property').findOne({
        where: { Property_Code: propertyData.Property_Code },
        populate: { Images: true },
        orderBy: { createdAt: 'desc' },
      });

      ctx.status = 201;
      ctx.body = { data: createdProperty };
    } catch (error) {
      if (uploadedImages.length > 0) {
        await Promise.allSettled(
          uploadedImages.map((file) => strapi.plugin('upload').service('upload').remove(file))
        );
      }

      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message);
      }

      if (error instanceof SyntaxError) {
        return ctx.badRequest('Invalid request payload.');
      }

      if (error.message) {
        console.error('createMyProperty error:', error);
        return ctx.badRequest(error.message);
      }

      console.error('createMyProperty error:', error);
      return ctx.internalServerError('Unable to create property right now.');
    } finally {
      await cleanupProcessedImages();
    }
  },

  async updateMyProperty(ctx) {
    const user = ctx.state.user;
    const { documentId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    let cleanupProcessedImages = async () => {};
    let uploadedImages = [];
    let previousImages = [];

    try {
      const existingProperty = await getAssignedPropertyForUser(strapi, user.id, documentId);

      if (!existingProperty) {
        return ctx.notFound('Property not found.');
      }

      previousImages = existingProperty.Images || [];

      const body = parseRequestBody(ctx.request.body);
      const imageFiles = extractImageFiles(ctx.request.files);
      const propertyData = buildPropertyData(
        body,
        user.id,
        previousImages.map((file) => file.id)
      );

      const duplicateProperty = await strapi.documents('api::property.property').findFirst({
        fields: ['documentId'],
        filters: { Property_Code: propertyData.Property_Code },
      });

      if (duplicateProperty && duplicateProperty.documentId !== documentId) {
        throw new ValidationError('Property code already exists.');
      }

      if (imageFiles.length > 0) {
        const processed = await processPropertyImages(imageFiles, propertyData.Property_Code);
        cleanupProcessedImages = processed.cleanup;

        uploadedImages = await uploadProcessedImages(strapi, processed.processedFiles);

        propertyData.Images = uploadedImages.map((file) => file.id);
      }

      await strapi.documents('api::property.property').update({
        documentId,
        status: 'published',
        data: propertyData,
      });

      const updatedProperty = await getAssignedPropertyForUser(strapi, user.id, documentId);

      if (imageFiles.length > 0 && previousImages.length > 0) {
        await Promise.allSettled(
          previousImages.map((file) => strapi.plugin('upload').service('upload').remove(file))
        );
      }

      ctx.body = { data: updatedProperty };
    } catch (error) {
      if (uploadedImages.length > 0) {
        await Promise.allSettled(
          uploadedImages.map((file) => strapi.plugin('upload').service('upload').remove(file))
        );
      }

      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message);
      }

      if (error instanceof SyntaxError) {
        return ctx.badRequest('Invalid request payload.');
      }

      if (error.message) {
        console.error('updateMyProperty error:', error);
        return ctx.badRequest(error.message);
      }

      console.error('updateMyProperty error:', error);
      return ctx.internalServerError('Unable to update property right now.');
    } finally {
      await cleanupProcessedImages();
    }
  },

}));
