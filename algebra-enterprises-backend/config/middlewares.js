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

function extractOrigins(...values) {
  return values
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === 'string') {
        return value.split(',');
      }

      return [value];
    })
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
}

module.exports = ({ env }) => {
  const mediaHosts = new Set([
    'res.cloudinary.com',
    ...extractHostnames(env('R2_PUBLIC_URL'), env('R2_ENDPOINT')),
  ]);
  const corsOrigins = [
    ...new Set(
      extractOrigins(
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        env('FRONTEND_URL'),
        env.array('CORS_ORIGINS', [])
      )
    ),
  ];

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
    {
      name: 'strapi::cors',
      config: {
        origin: corsOrigins,
        credentials: true,
      },
    },
    'global::rate-limit',
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
