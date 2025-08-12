/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
};

export default nextConfig;
