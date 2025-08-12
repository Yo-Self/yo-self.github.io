/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  // Mantemos trailingSlash, mas precisamos garantir que acessos sem barra sejam redirecionados pelo 404/not-found
  trailingSlash: true,
};

export default nextConfig;
