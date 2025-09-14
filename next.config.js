/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages - apenas em produção
  trailingSlash: process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test',
  // Para repositório yo-self.github.io, não precisamos de basePath
  // basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
  
  // Note: Rewrites don't work with static export, so we use direct PostHog endpoints in PostHogProvider
  // API routes are excluded from static export automatically by Next.js
  
  // Configure webpack to handle the API route exclusion during static export
  webpack: (config, { isServer, webpack, dev }) => {
    // Default webpack config for all environments
    const baseConfig = {
      // Fix for Node.js built-in modules
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        },
      },
    };

    if (isServer && !dev) {
      // Define self in Node.js environment to prevent "self is not defined" errors
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'global',
        })
      );
    }

    Object.assign(config, baseConfig);
    
    return config;
  },
  
  // Test environment specific config
  ...(process.env.NODE_ENV === 'test' && {
    experimental: {
      optimizeCss: false,
    },
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
      
      // Disable problematic CSS plugins during tests
      config.plugins = config.plugins.filter(plugin => 
        plugin.constructor.name !== 'CssMinimizerPlugin'
      );
      
      return config;
    },
  }),
};

export default nextConfig;
