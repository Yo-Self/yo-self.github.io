"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the key is provided
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        ui_host: "https://us.posthog.com",
        
        // Exception Autocapture - automatically capture unhandled errors
        capture_exceptions: true,
        
        // Page tracking
        capture_pageview: false, // Disable automatic pageview capture as we'll do this manually
        capture_pageleave: true, // Track when users leave pages
        
        // Debug mode in development
        debug: process.env.NODE_ENV === "development",
        
        // Session recording
        disable_session_recording: false,
        
        // Privacy settings
        respect_dnt: false,
        
        // Performance monitoring
        capture_performance: true,
        
        // Autocapture settings
        autocapture: true,
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