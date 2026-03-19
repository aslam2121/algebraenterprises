/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '1337' },
      { protocol: 'http', hostname: '127.0.0.1', port: '1337' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  experimental: {
    webpackBuildWorker: false,
  },
};

export default nextConfig;
