'use client'

import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

export type ObservabilityContext = {
  restaurantId?: string
  restaurantSlug?: string
  deliveryMode?: string
  isPwa?: boolean
}

function isSentryEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
}

function isPostHogEnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
    posthog.__loaded
  )
}

export function setObservabilityContext(ctx: ObservabilityContext): void {
  if (ctx.restaurantId || ctx.restaurantSlug) {
    Sentry.setTags({
      ...(ctx.restaurantId ? { restaurant_id: ctx.restaurantId } : {}),
      ...(ctx.restaurantSlug ? { restaurant_slug: ctx.restaurantSlug } : {}),
    })
  }

  if (isPostHogEnabled()) {
    const props: Record<string, string | boolean> = {}
    if (ctx.restaurantId) props.restaurant_id = ctx.restaurantId
    if (ctx.restaurantSlug) props.restaurant_slug = ctx.restaurantSlug
    if (ctx.deliveryMode) props.delivery_mode = ctx.deliveryMode
    if (typeof ctx.isPwa === 'boolean') props.is_pwa = ctx.isPwa
    posthog.register(props)

    if (ctx.restaurantId) {
      posthog.group('restaurant', ctx.restaurantId, {
        slug: ctx.restaurantSlug ?? ctx.restaurantId,
      })
    }
  }

  if (isSentryEnabled() && isPostHogEnabled()) {
    try {
      Sentry.setTag('posthog_distinct_id', posthog.get_distinct_id())
    } catch {
      // ignore
    }
  }
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown> & {
    tags?: Record<string, string>
    feature?: string
  },
): string | undefined {
  const normalized =
    error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error')

  const { tags, feature, ...extra } = context ?? {}

  let sentryEventId: string | undefined
  if (isSentryEnabled()) {
    sentryEventId = Sentry.captureException(normalized, {
      extra,
      tags: {
        app: 'web-version',
        ...(feature ? { feature } : {}),
        ...tags,
      },
    })
  }

  if (isPostHogEnabled()) {
    try {
      posthog.capture('technical_error', {
        error_name: normalized.name,
        error_message: normalized.message,
        feature_area: feature,
        sentry_event_id: sentryEventId,
        ...extra,
      })
    } catch {
      // ignore analytics failures
    }
  }

  return sentryEventId
}
