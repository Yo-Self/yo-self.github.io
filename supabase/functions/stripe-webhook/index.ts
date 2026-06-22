import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { captureEdgeException } from '../_shared/sentry.ts'
import {
  handleAccountUpdated,
  handleChargeRefunded,
  handleCheckoutSessionExpired,
  handleStripePaymentFailed,
  handleStripePaymentSuccess,
} from '../_shared/stripeWebhookHandlers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIMESTAMP_TOLERANCE_SECONDS = 300

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
): Promise<boolean> {
  const elements = signatureHeader.split(',')
  let timestamp: string | null = null
  const signatures: string[] = []

  for (const element of elements) {
    const [key, value] = element.split('=', 2)
    if (key === 't') timestamp = value
    else if (key === 'v1') signatures.push(value)
  }

  if (!timestamp || signatures.length === 0) {
    console.error('Invalid Stripe-Signature header: missing timestamp or v1 signature')
    return false
  }

  const eventTimestamp = parseInt(timestamp, 10)
  const currentTimestamp = Math.floor(Date.now() / 1000)

  if (Math.abs(currentTimestamp - eventTimestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    console.error('Webhook timestamp outside tolerance window:', {
      eventAge: currentTimestamp - eventTimestamp,
      tolerance: TIMESTAMP_TOLERANCE_SECONDS,
    })
    return false
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return signatures.some((sig) => timingSafeEqual(sig, expectedSignature))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  let result = 0
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i]
  }

  return result === 0
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return jsonResponse({ error: 'Webhook secret not configured' }, 500)
    }

    const rawBody = await req.text()
    const signatureHeader = req.headers.get('stripe-signature')
    if (!signatureHeader) {
      return jsonResponse({ error: 'Missing stripe-signature header' }, 400)
    }

    const isValid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
    if (!isValid) {
      return jsonResponse({ error: 'Invalid webhook signature' }, 401)
    }

    const event = JSON.parse(rawBody)
    const connectAccount = typeof event.account === 'string' ? event.account : null
    console.log(`Received Stripe event: ${event.type} (${event.id})${connectAccount ? ` account=${connectAccount}` : ''}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey =
      Deno.env.get('SB_SECRET_KEY') ??
      Deno.env.get('SUPABASE_SECRET_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle()

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`)
      return jsonResponse({ received: true, duplicate: true }, 200)
    }

    const stripeObj = event.data?.object as Record<string, unknown> | undefined
    if (!stripeObj) {
      return jsonResponse({ error: 'Missing event data object' }, 400)
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'payment_intent.succeeded':
        return await handleStripePaymentSuccess(supabase, event, stripeObj, jsonResponse)
      case 'payment_intent.payment_failed':
        return await handleStripePaymentFailed(supabase, event, stripeObj, jsonResponse)
      case 'checkout.session.expired':
        return await handleCheckoutSessionExpired(supabase, event, stripeObj, jsonResponse)
      case 'charge.refunded':
        return await handleChargeRefunded(supabase, event, stripeObj, jsonResponse)
      case 'account.updated':
        return await handleAccountUpdated(supabase, event, stripeObj, connectAccount, jsonResponse)
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
        return jsonResponse({ received: true, unhandled: true }, 200)
    }
  } catch (error) {
    console.error('Unexpected error in stripe-webhook:', error)
    await captureEdgeException(error, {
      functionName: 'stripe-webhook',
      extra: { path: req.url, method: req.method },
    })
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
