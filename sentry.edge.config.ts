// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://64f9a6baa4ad1a64c7aef41044acdd4d@o4509968277897216.ingest.us.sentry.io/4509968279273472",

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring for edge runtime
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  // Note: debug option is not available in production builds
  debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true',
});
