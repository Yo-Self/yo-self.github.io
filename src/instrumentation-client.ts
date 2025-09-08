// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://64f9a6baa4ad1a64c7aef41044acdd4d@o4509968277897216.ingest.us.sentry.io/4509968279273472",

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Add optional integrations for additional features
  integrations: [
    // Session Replay - records user sessions for debugging
    Sentry.replayIntegration({
      // Mask all text content to protect user privacy
      maskAllText: true,
      // Block all media elements
      blockAllMedia: true,
    }),
    // User Feedback - allows users to submit feedback
    Sentry.feedbackIntegration({
      colorScheme: "system",
      showBranding: false,
    }),
    // Console Logging - automatically capture console logs
    Sentry.consoleLoggingIntegration({ 
      levels: ["log", "error", "warn"] 
    }),
  ],

  // Performance monitoring
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Session Replay configuration
  // Capture Replay for 10% of all sessions in production, 100% in development
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Capture Replay for 100% of sessions with an error
  replaysOnErrorSampleRate: 1.0,

  // Additional configuration
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't send network errors that are likely user-related
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes('NetworkError')) {
          return null;
        }
      }
    }
    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  // Note: debug option is not available in production builds
  debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true',
});

// Performance monitoring for router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;