let tracker: any = null

// OpenReplay is disabled when Sentry is configured (use Sentry Replay + PostHog session replay instead)
if (typeof window !== 'undefined') {
  import('@openreplay/tracker').then(({ default: Tracker }) => {
    const isProduction = process.env.NODE_ENV === 'production'
    const openReplayKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY
    const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)

    if (isProduction && openReplayKey && !sentryEnabled) {
      tracker = new Tracker({
        projectKey: openReplayKey,
        respectDoNotTrack: true,
        captureIFrames: true,
      })

      tracker.start()
    }
  }).catch(() => {
    console.log('OpenReplay not available')
  })
}

export { tracker }
