'use strict';

const { processPropertyImages } = require('../api/property/utils/agent-property');

const PROPERTY_UID = 'api::property.property';
const PROPERTY_IMAGE_FIELD = 'images';
const CONTENT_MANAGER_PROPERTY_ROUTE_TYPES = new Set(['collection-types', 'single-types']);

function toFilesArray(files) {
  if (!files) {
    return [];
  }

  return Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFieldName(value) {
  return normalizeString(value).toLowerCase();
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseFileInfo(value) {
  if (Array.isArray(value)) {
    return value.map(parseFileInfo);
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return value && typeof value === 'object' ? { ...value } : {};
}

function withProcessedNames(fileInfo, processedFiles) {
  if (processedFiles.length === 0) {
    return fileInfo;
  }

  const parsed = parseFileInfo(fileInfo);

  if (Array.isArray(parsed)) {
    return processedFiles.map((file, index) => ({
      ...(parsed[index] && typeof parsed[index] === 'object' ? parsed[index] : {}),
      name: file.originalFilename,
    }));
  }

  return {
    ...(parsed && typeof parsed === 'object' ? parsed : {}),
    name: processedFiles[0].originalFilename,
  };
}

function getPathSegments(urlLike) {
  const normalized = normalizeString(urlLike);

  if (!normalized) {
    return [];
  }

  try {
    const pathname = new URL(normalized, 'http://localhost').pathname || '';

    return pathname
      .split('/')
      .map((segment) => safeDecodeURIComponent(segment))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getPropertyUploadContext(body, headers, files) {
  if (toFilesArray(files).length === 0) {
    return null;
  }

  if (
    normalizeString(body?.ref) === PROPERTY_UID
    && normalizeFieldName(body?.field) === PROPERTY_IMAGE_FIELD
  ) {
    return {
      refId: normalizeString(body?.refId),
      source: 'request-body',
    };
  }

  const segments = getPathSegments(headers?.referer || headers?.referrer);
  const contentManagerIndex = segments.indexOf('content-manager');

  if (contentManagerIndex === -1) {
    return null;
  }

  const routeType = segments[contentManagerIndex + 1];
  const slug = segments[contentManagerIndex + 2];
  const entryId = segments[contentManagerIndex + 3];

  if (!CONTENT_MANAGER_PROPERTY_ROUTE_TYPES.has(routeType) || slug !== PROPERTY_UID) {
    return null;
  }

  if (!entryId || entryId === 'clone' || entryId === 'configurations') {
    return null;
  }

  return {
    refId: entryId,
    source: 'referer',
  };
}

async function resolvePropertyCode(strapi, refId) {
  const normalizedRefId = normalizeString(refId);

  if (!normalizedRefId) {
    return null;
  }

  if (/^\d+$/.test(normalizedRefId)) {
    const property = await strapi.db.query(PROPERTY_UID).findOne({
      where: { id: Number.parseInt(normalizedRefId, 10) },
      select: ['Property_Code'],
    });

    return property?.Property_Code || null;
  }

  const property = await strapi.documents(PROPERTY_UID).findOne({
    documentId: normalizedRefId,
    fields: ['Property_Code'],
  });

  return property?.Property_Code || null;
}

async function preparePropertyImageUpload(strapi, ctx) {
  const body = ctx?.request?.body || {};
  const files = ctx?.request?.files?.files;
  const headers = ctx?.request?.headers || {};
  const uploadContext = getPropertyUploadContext(body, headers, files);

  if (!uploadContext?.refId) {
    return null;
  }

  const propertyCode = await resolvePropertyCode(strapi, uploadContext.refId);

  if (!propertyCode) {
    return null;
  }

  const originalFiles = toFilesArray(files);
  const { processedFiles, cleanup } = await processPropertyImages(originalFiles, propertyCode);

  return {
    cleanup,
    body: Object.prototype.hasOwnProperty.call(body || {}, 'fileInfo')
      ? {
          ...body,
          fileInfo: withProcessedNames(body.fileInfo, processedFiles),
        }
      : body,
    files: Array.isArray(files) ? processedFiles : processedFiles[0],
  };
}

module.exports = {
  preparePropertyImageUpload,
};
