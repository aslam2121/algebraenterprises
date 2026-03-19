'use strict';

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const propertySchema = require('../content-types/property/schema.json');

const MAX_IMAGE_WIDTH = 2400;
const MAX_IMAGE_HEIGHT = 2400;
const MAX_IMAGE_FILES = 12;
const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const JPEG_QUALITY = 82;
const PNG_QUALITY = 82;
const WEBP_QUALITY = 82;
const WATERMARK_TEXT = process.env.PROPERTY_IMAGE_WATERMARK || 'ALGEBRA ENTERPRISES';

const PROPERTY_TYPES = propertySchema.attributes.Property_Type.enum;
const LISTING_TYPES = propertySchema.attributes.Listing_Type.enum;
const STATUS_TYPES = propertySchema.attributes.Property_Status.enum;
const FEATURE_OPTIONS = propertySchema.attributes.Features.options;
const NEIGHBORHOOD_OPTIONS = propertySchema.attributes.Neighborhood.options;

const FEATURE_SET = new Set(FEATURE_OPTIONS);
const NEIGHBORHOOD_SET = new Set(NEIGHBORHOOD_OPTIONS);

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value) {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function normalizeInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number.parseInt(value, 10);

  if (Number.isNaN(normalized)) {
    throw new Error(`${fieldName} must be a whole number.`);
  }

  return normalized;
}

function normalizeDecimal(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);

  if (Number.isNaN(normalized)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return normalized;
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
}

function parseArrayField(value, fieldName) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeString).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[')) {
      let parsed;

      try {
        parsed = JSON.parse(trimmed);
      } catch (error) {
        throw new Error(`${fieldName} must be a valid JSON array.`);
      }

      if (!Array.isArray(parsed)) {
        throw new Error(`${fieldName} must be a valid JSON array.`);
      }

      return parsed.map(normalizeString).filter(Boolean);
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  throw new Error(`${fieldName} must be an array.`);
}

function normalizePropertyCode(value) {
  const normalized = normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  if (!normalized) {
    throw new Error('Property code is required.');
  }

  return normalized;
}

function ensureAllowedValue(value, allowedValues, fieldName) {
  if (!value) {
    return undefined;
  }

  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return value;
}

function ensureAllowedFeatures(features) {
  const invalid = features.filter((feature) => !FEATURE_SET.has(feature));

  if (invalid.length > 0) {
    throw new Error(`Features contain invalid options: ${invalid.join(', ')}.`);
  }

  return features;
}

function normalizeNeighborhood(value) {
  const [neighborhood] = parseArrayField(value, 'Neighborhood');

  if (!neighborhood) {
    throw new Error('Neighborhood is required.');
  }

  if (!NEIGHBORHOOD_SET.has(neighborhood)) {
    throw new Error('Neighborhood is invalid.');
  }

  return neighborhood;
}

function toDescriptionBlocks(value) {
  const text = normalizeString(value);

  if (!text) {
    return undefined;
  }

  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: 'paragraph',
      children: [{ type: 'text', text: paragraph }],
    }));
}

function parseRequestBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body.data === 'string') {
    return JSON.parse(body.data);
  }

  if (body.data && typeof body.data === 'object') {
    return body.data;
  }

  return body;
}

function extractImageFiles(files) {
  if (!files) {
    return [];
  }

  return [
    ...toArray(files.images),
    ...toArray(files.Images),
  ].filter(Boolean);
}

function buildPropertyData(body, agentId, imageIds = []) {
  const title = normalizeString(body.Title);
  const propertyAddress = normalizeString(body.Property_Address);

  if (!title) {
    throw new Error('Title is required.');
  }

  if (!propertyAddress) {
    throw new Error('Property address is required.');
  }

  const features = ensureAllowedFeatures(parseArrayField(body.Features, 'Features'));

  return {
    Title: title,
    Description: toDescriptionBlocks(body.Description),
    Price: normalizeDecimal(body.Price, 'Price'),
    Property_Type: ensureAllowedValue(body.Property_Type, PROPERTY_TYPES, 'Property type'),
    Listing_Type: ensureAllowedValue(body.Listing_Type, LISTING_TYPES, 'Listing type'),
    Property_Status: ensureAllowedValue(body.Property_Status || 'Live', STATUS_TYPES, 'Property status'),
    Bedrooms: normalizeInteger(body.Bedrooms, 'Bedrooms'),
    Bathrooms: normalizeInteger(body.Bathrooms, 'Bathrooms'),
    Area_Sqm: normalizeDecimal(body.Area_Sqm, 'Area (sqm)'),
    Area_sqft: normalizeDecimal(body.Area_sqft, 'Area (sqft)'),
    Area_Acre: normalizeDecimal(body.Area_Acre, 'Area (acre)'),
    Property_Code: normalizePropertyCode(body.Property_Code),
    Agent_Phone: normalizeOptionalString(body.Agent_Phone),
    Featured_Property: normalizeBoolean(body.Featured_Property),
    Property_Age: normalizeInteger(body.Property_Age, 'Property age'),
    Features: JSON.stringify(features),
    Neighborhood: normalizeNeighborhood(body.Neighborhood),
    Assigned_Agent: agentId,
    Property_Address: propertyAddress,
    Images: imageIds,
  };
}

function buildWatermarkSvg(width, height) {
  const fontSize = Math.max(20, Math.round(Math.min(width, height) * 0.035));
  const padding = Math.max(16, Math.round(fontSize * 0.65));
  const boxHeight = fontSize + padding * 2;
  const boxWidth = Math.min(
    Math.round(width * 0.75),
    Math.max(Math.round(width * 0.28), Math.round(WATERMARK_TEXT.length * fontSize * 0.72) + padding * 2)
  );
  const x = Math.max(0, width - boxWidth - padding);
  const y = Math.max(0, height - boxHeight - padding);
  const radius = Math.round(fontSize * 0.4);

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="${radius}" ry="${radius}" fill="rgba(10,22,40,0.45)" />
      <text
        x="${x + padding}"
        y="${y + padding + Math.round(fontSize * 0.8)}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="1"
        fill="rgba(255,255,255,0.9)"
      >${escapeXml(WATERMARK_TEXT)}</text>
    </svg>`
  );
}

function getOutputSpec(metadata) {
  const width = metadata.width || MAX_IMAGE_WIDTH;
  const height = metadata.height || MAX_IMAGE_HEIGHT;
  const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);

  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));

  if (metadata.format === 'png' && metadata.hasAlpha) {
    return { extension: '.png', mime: 'image/png', width: outputWidth, height: outputHeight };
  }

  if (metadata.format === 'webp') {
    return { extension: '.webp', mime: 'image/webp', width: outputWidth, height: outputHeight };
  }

  return { extension: '.jpg', mime: 'image/jpeg', width: outputWidth, height: outputHeight };
}

function sanitizeFileBaseName(filename, fallback) {
  const baseName = path.basename(filename || fallback, path.extname(filename || fallback));
  const cleaned = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || fallback;
}

function validateImageFiles(files) {
  if (files.length > MAX_IMAGE_FILES) {
    throw new Error(`You can upload up to ${MAX_IMAGE_FILES} images per property.`);
  }

  for (const file of files) {
    if (!file?.filepath) {
      throw new Error('One of the uploaded files could not be processed.');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error('Only image uploads are allowed.');
    }

    if (typeof file.size === 'number' && file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      throw new Error('Each uploaded image must be 15MB or smaller.');
    }
  }
}

async function processPropertyImages(files) {
  if (!files.length) {
    return { processedFiles: [], cleanup: async () => {} };
  }

  validateImageFiles(files);

  const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-property-'));
  const processedFiles = [];

  try {
    for (const [index, file] of files.entries()) {
      const metadata = await sharp(file.filepath).metadata();
      const spec = getOutputSpec(metadata);
      const fileBaseName = sanitizeFileBaseName(file.originalFilename, `property-image-${index + 1}`);
      const outputPath = path.join(workingDirectory, `${fileBaseName}-${Date.now()}-${index}${spec.extension}`);
      const watermark = buildWatermarkSvg(spec.width, spec.height);

      let pipeline = sharp(file.filepath)
        .rotate()
        .resize({
          width: MAX_IMAGE_WIDTH,
          height: MAX_IMAGE_HEIGHT,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .composite([{ input: watermark }]);

      if (spec.mime === 'image/png') {
        pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: PNG_QUALITY });
      } else if (spec.mime === 'image/webp') {
        pipeline = pipeline.webp({ quality: WEBP_QUALITY });
      } else {
        pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
      }

      await pipeline.toFile(outputPath);

      const stats = await fs.stat(outputPath);

      processedFiles.push({
        ...file,
        filepath: outputPath,
        size: stats.size,
        mimetype: spec.mime,
        originalFilename: `${fileBaseName}${spec.extension}`,
      });
    }

    return {
      processedFiles,
      cleanup: async () => {
        await fs.rm(workingDirectory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fs.rm(workingDirectory, { recursive: true, force: true });
    throw error;
  }
}

module.exports = {
  buildPropertyData,
  extractImageFiles,
  parseRequestBody,
  processPropertyImages,
};
