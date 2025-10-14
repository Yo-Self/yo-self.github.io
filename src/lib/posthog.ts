import { PostHog } from 'posthog-node'

let posthogInstance: PostHog | null = null

/**
 * Get PostHog server-side singleton instance
 * This is used for server-side error tracking and analytics
 * Following PostHog's recommended pattern for Next.js server-side integration
 */
export function getPostHogServer(): PostHog | null {
  // Only create client if PostHog key is available
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog key not provided, server-side tracking disabled')
    return null
  }

  if (!posthogInstance) {
    posthogInstance = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }

  return posthogInstance
}

// Legacy export for backwards compatibility
export default function PostHogClient() {
  return getPostHogServer()
}