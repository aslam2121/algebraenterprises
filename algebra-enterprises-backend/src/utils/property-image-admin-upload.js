'use strict';

const { processPropertyImages } = require('../api/property/utils/agent-property');

const PROPERTY_UID = 'api::property.property';
const PROPERTY_IMAGE_FIELD = 'images';

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

function isPropertyImageUpload(body, files) {
  if (toFilesArray(files).length === 0) {
    return false;
  }

  return normalizeString(body?.ref) === PROPERTY_UID
    && normalizeFieldName(body?.field) === PROPERTY_IMAGE_FIELD;
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

async function preparePropertyImageUpload(strapi, body, files) {
  if (!isPropertyImageUpload(body, files)) {
    return null;
  }

  const propertyCode = await resolvePropertyCode(strapi, body.refId);

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
