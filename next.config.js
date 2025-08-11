/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '.' : '',
};

export default nextConfig;
