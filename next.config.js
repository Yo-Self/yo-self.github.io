/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages - apenas em produção
  trailingSlash: process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test',
  // Para repositório yo-self.github.io, não precisamos de basePath
  // basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
  
  // Rewrites para PostHog
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  // Necessário para suportar requisições de API com barra no final do PostHog
  skipTrailingSlashRedirect: true,
  
  // Desabilitar otimização CSS durante testes para evitar erros de compilação
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
        
        // Define self in Node.js environment to prevenir erros de "self is not defined"
        config.plugins.push(
          new webpack.DefinePlugin({
            self: 'global',
          })
        );
      }
      
      // Desabilitar plugins CSS problemáticos durante testes
      config.plugins = config.plugins.filter(plugin => 
        plugin.constructor.name !== 'CssMinimizerPlugin'
      );
      
      return config;
    },
  }),
  
  // Configuração padrão para produção e desenvolvimento
  ...(process.env.NODE_ENV !== 'test' && {
    webpack: (config, { isServer, webpack }) => {
      // Fix for Node.js built-in modules
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
      }
      
      if (isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        };
        
        // Define self in Node.js environment para prevenir erros de "self is not defined"
        config.plugins.push(
          new webpack.DefinePlugin({
            self: 'global',
          })
        );
      }
      
      return config;
    },
  }),
};

export default nextConfig;
