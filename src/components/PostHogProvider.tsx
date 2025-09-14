"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the key is provided
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "https://us.i.posthog.com",
        ui_host: "https://us.posthog.com",
        capture_pageview: false, // Disable automatic pageview capture as we'll do this manually
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        debug: process.env.NODE_ENV === "development",
        // Disable session recording for privacy compliance
        disable_session_recording: false,
        // Respect user privacy settings
        respect_dnt: false,
      })
    } else {
      console.warn("PostHog key not provided, analytics disabled")
    }
  }, [])

  // If PostHog key is not provided, just return children without PostHog provider
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}