/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [];
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
