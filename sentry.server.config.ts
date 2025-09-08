// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://64f9a6baa4ad1a64c7aef41044acdd4d@o4509968277897216.ingest.us.sentry.io/4509968279273472",

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Performance monitoring
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Additional server-side configuration
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't send certain types of errors that are not actionable
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Filter out common non-critical errors
          const message = error.message.toLowerCase();
          if (message.includes('econnreset') || 
              message.includes('enotfound') || 
              message.includes('timeout')) {
            return null;
          }
        }
      }
    }
    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  // Note: debug option is not available in production builds
  debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true',
});
