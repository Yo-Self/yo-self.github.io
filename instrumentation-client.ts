import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.05,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    ignoreErrors: [
      'ResizeObserver loop',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /ERR_BLOCKED_BY_CLIENT/,
      /Loading chunk [\d]+ failed/,
      /ChunkLoadError/,
    ],

    beforeSend(event) {
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url)
          url.searchParams.delete('phone')
          url.searchParams.delete('email')
          url.searchParams.delete('address')
          event.request.url = url.toString()
        } catch {
          // keep original url
        }
      }
      return event
    },
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
