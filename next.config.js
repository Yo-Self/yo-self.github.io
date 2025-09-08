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

// Injected content via Sentry wizard below

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "yo-self",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
