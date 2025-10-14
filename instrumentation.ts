/**
 * Next.js Instrumentation File
 * Provides hooks for monitoring and error tracking in server-side code
 * Documentation: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export function register() {
  // No-op for initialization
  // This is called once when Next.js server starts
}

/**
 * Hook called when a request error occurs
 * Captures server-side errors and sends them to PostHog
 */
export const onRequestError = async (
  err: Error,
  request: {
    path: string
    method: string
    headers: {
      cookie?: string
      [key: string]: string | undefined
    }
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
    revalidateReason: 'on-demand' | 'stale' | undefined
    renderType: 'dynamic' | 'dynamic-resume'
  }
) => {
  // Only run in Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getPostHogServer } = require('./src/lib/posthog')
      const posthog = getPostHogServer()

      if (!posthog) {
        console.warn('PostHog server instance not available for error tracking')
        return
      }

      // Extract distinct_id from PostHog cookie
      let distinctId: string | null = null

      if (request.headers.cookie) {
        const cookieString = request.headers.cookie
        
        // PostHog cookie format: ph_<project_id>_posthog
        const postHogCookieMatch = cookieString.match(/ph_[^=]+_posthog=([^;]+)/)

        if (postHogCookieMatch && postHogCookieMatch[1]) {
          try {
            const decodedCookie = decodeURIComponent(postHogCookieMatch[1])
            const postHogData = JSON.parse(decodedCookie)
            distinctId = postHogData.distinct_id
          } catch (e) {
            console.error('Error parsing PostHog cookie:', e)
          }
        }
      }

      // Capture the exception with context
      await posthog.captureException(err, {
        distinct_id: distinctId || 'anonymous',
        $set: {
          error_path: request.path,
          error_method: request.method,
          router_kind: context.routerKind,
          route_path: context.routePath,
          route_type: context.routeType,
          render_source: context.renderSource,
          render_type: context.renderType,
        },
      })

      // Flush immediately to ensure the event is sent
      await posthog.flush()

      console.error('Server-side error captured by PostHog:', {
        error: err.message,
        path: request.path,
        distinctId: distinctId || 'anonymous',
      })
    } catch (captureError) {
      // Don't throw if PostHog capture fails
      console.error('Failed to capture error in PostHog:', captureError)
    }
  }
}
