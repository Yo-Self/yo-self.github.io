'use client'

import { useEffect } from 'react'
import '../lib/openreplay'

export default function Analytics() {
  useEffect(() => {
    // Analytics are initialized in the lib files
    // This component just ensures they're loaded on the client side
    // PostHog is now handled by the PostHogProvider in layout.tsx
  }, [])

  return null
}
