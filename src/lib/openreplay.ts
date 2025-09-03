let tracker: any = null

// Only run on client side
if (typeof window !== 'undefined') {
  import('@openreplay/tracker').then(({ default: Tracker }) => {
    const isProduction = process.env.NODE_ENV === 'production'
    const areEnvValid = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY

    // Check that OpenReplay is client-side and only in production
    if (isProduction && areEnvValid) {
      tracker = new Tracker({
        projectKey: process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY!,
        // Disable in development by default
        respectDoNotTrack: true,
        // Capture network requests
        captureIFrames: true,
      })

      // Start tracking
      tracker.start()
    }
  }).catch(() => {
    // Silently fail if OpenReplay is not available
    console.log('OpenReplay not available')
  })
}

export { tracker }
