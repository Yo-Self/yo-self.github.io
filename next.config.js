/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test' ? 'export' : undefined,
  images: { unoptimized: true },
  // Configuração para GitHub Pages - apenas em produção
  trailingSlash: process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test',
  // Para repositório yo-self.github.io, não precisamos de basePath
  // basePath: process.env.NODE_ENV === 'production' ? '/restaurant' : '',
  
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
        
        // Define self in Node.js environment to prevent "self is not defined" errors
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
  }),
};

export default nextConfig;
