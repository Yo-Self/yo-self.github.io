import posthogJs from 'posthog-js'
import type { PostHog } from 'posthog-js'

const isProduction = process.env.NODE_ENV === 'production'
const areEnvValid = process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST

let posthog: PostHog | null = null

if (isProduction && areEnvValid) {
  posthog = posthogJs.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    // Enable debug mode in development
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    },
    // Disable capturing by default in development
    capture_pageview: process.env.NODE_ENV === 'production',
  })
}

export { posthog }
