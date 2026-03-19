const dns = require('dns');
const https = require('https');

const cloudinaryIpv4Agent = new https.Agent({
  keepAlive: true,
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
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {
          agent: cloudinaryIpv4Agent,
        },
        uploadStream: {
          agent: cloudinaryIpv4Agent,
        },
        delete: {
          agent: cloudinaryIpv4Agent,
        },
      },
    },
  },
});
