function extractHostnames(...values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = ({ env }) => {
  const mediaHosts = new Set([
    'res.cloudinary.com',
    ...extractHostnames(env('R2_PUBLIC_URL'), env('R2_ENDPOINT')),
  ]);

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': [
              "'self'",
              'data:',
              'blob:',
              ...mediaHosts,
            ],
            'media-src': [
              "'self'",
              'data:',
              'blob:',
              ...mediaHosts,
            ],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    'strapi::cors',
    'global::rate-limit',
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
