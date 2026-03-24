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
          forcePathStyle: env.bool('R2_FORCE_PATH_STYLE', true),
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
