/**
 * Next.js Instrumentation File
 * Server-side error monitoring via Sentry
 * Documentation: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import * as Sentry from '@sentry/nextjs'

export function register() {
  // Called once when Next.js server starts (dev / build only for static export)
}

export const onRequestError = Sentry.captureRequestError
