/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages
  trailingSlash: true,
  // Para repositório yo-self.github.io, não precisamos de basePath
  // basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
};

export default nextConfig;
