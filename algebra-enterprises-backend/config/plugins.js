const dns = require('dns');
const https = require('https');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

const r2HttpsAgent = new https.Agent({
  keepAlive: false,
  maxSockets: 1,
  lookup(hostname, options, callback) {
    const wantsAll = typeof options === 'object' && options?.all === true;
    const hints = typeof options === 'object' && typeof options?.hints === 'number' ? options.hints : 0;

    return dns.lookup(
      hostname,
      {
        family: 4,
        all: wantsAll,
        hints,
      },
      callback
    );
  },
});

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('R2_PUBLIC_URL') || undefined,
        rootPath: env('R2_ROOT_PATH') || undefined,
        s3Options: {
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY_ID'),
            secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
          },
          region: env('R2_REGION', 'auto'),
          endpoint: env('R2_ENDPOINT'),
          maxAttempts: env.int('R2_MAX_ATTEMPTS', 8),
          forcePathStyle: env.bool('R2_FORCE_PATH_STYLE', true),
          requestHandler: new NodeHttpHandler({
            httpsAgent: r2HttpsAgent,
            connectionTimeout: env.int('R2_CONNECTION_TIMEOUT_MS', 120000),
            requestTimeout: env.int('R2_REQUEST_TIMEOUT_MS', 600000),
          }),
          params: {
            Bucket: env('R2_BUCKET'),
            ACL: env('R2_ACL') || undefined,
            signedUrlExpires: env.int('R2_SIGNED_URL_EXPIRES', 15 * 60),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
