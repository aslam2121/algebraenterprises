function remotePatternFromUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const mediaRemotePatterns = [
  remotePatternFromUrl(process.env.R2_PUBLIC_URL),
  remotePatternFromUrl(process.env.R2_ENDPOINT),
].filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '1337' },
      { protocol: 'http', hostname: '127.0.0.1', port: '1337' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      ...mediaRemotePatterns,
    ],
  },
  experimental: {
    webpackBuildWorker: false,
  },
};

export default nextConfig;
