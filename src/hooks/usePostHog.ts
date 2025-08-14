'use client'

import { useEffect, useState } from 'react'
import { posthog } from '@/lib/posthog'

export function usePostHog() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsReady(true)
    }
  }, [])

  const track = (event: string, properties?: Record<string, any>) => {
    if (isReady && posthog) {
      posthog.capture(event, properties)
    }
  }

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (isReady && posthog) {
      posthog.identify(userId, properties)
    }
  }

  const setUserProperties = (properties: Record<string, any>) => {
    if (isReady && posthog) {
      // PostHog doesn't have set method, using setPersonProperties instead
      posthog.setPersonProperties(properties)
    }
  }

  const reset = () => {
    if (isReady && posthog) {
      posthog.reset()
    }
  }

  return {
    track,
    identify,
    setUserProperties,
    reset,
    isReady,
  }
}
