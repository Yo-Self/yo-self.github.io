/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages - apenas em produção
  trailingSlash: process.env.NODE_ENV === 'production',
  // Para repositório yo-self.github.io, não precisamos de basePath
  // basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
};

export default nextConfig;
