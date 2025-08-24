/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages - apenas em produção
  trailingSlash: process.env.NODE_ENV === 'production',
  // Para repositório yo-self.github.io, não precisamos de basePath
  // basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
  // Fix for Tone.js and other libraries that use 'self'
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      
      // Define self in Node.js environment to prevent "self is not defined" errors
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'global',
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
