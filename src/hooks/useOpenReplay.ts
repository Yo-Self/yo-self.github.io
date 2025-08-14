'use client'

import { useEffect, useState } from 'react'
import { tracker } from '@/lib/openreplay'

export function useOpenReplay() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsReady(true)
    }
  }, [])

  const setUserID = (userId: string) => {
    if (isReady && tracker) {
      tracker.setUserID(userId)
    }
  }

  const setMetadata = (key: string, value: any) => {
    if (isReady && tracker) {
      tracker.setMetadata(key, value)
    }
  }

  const setSessionData = (data: Record<string, any>) => {
    if (isReady && tracker) {
      // OpenReplay doesn't have setSessionData method, using setMetadata instead
      Object.entries(data).forEach(([key, value]) => {
        if (tracker) {
          tracker.setMetadata(key, value)
        }
      })
    }
  }

  const trackEvent = (event: string, payload?: any) => {
    if (isReady && tracker) {
      tracker.event(event, payload)
    }
  }

  const pause = () => {
    if (isReady && tracker) {
      // OpenReplay doesn't have pause method in current API
      console.warn('OpenReplay pause method not available in current API')
    }
  }

  const resume = () => {
    if (isReady && tracker) {
      // OpenReplay doesn't have resume method in current API
      console.warn('OpenReplay resume method not available in current API')
    }
  }

  const stop = () => {
    if (isReady && tracker) {
      // OpenReplay doesn't have stop method in current API
      console.warn('OpenReplay stop method not available in current API')
    }
  }

  return {
    setUserID,
    setMetadata,
    setSessionData,
    trackEvent,
    pause,
    resume,
    stop,
    isReady,
  }
}
