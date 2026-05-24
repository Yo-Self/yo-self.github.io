import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Maximum allowed age of a webhook event (5 minutes) */
const TIMESTAMP_TOLERANCE_SECONDS = 300

/**
 * Verifies the Stripe webhook signature using HMAC-SHA256.
 *
 * Stripe-Signature header format:
 *   t=<timestamp>,v1=<signature>[,v1=<signature>...]
 *
 * Signed payload = "<timestamp>.<raw_body>"
 */
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<boolean> {
  // Parse the header
  const elements = signatureHeader.split(',')
  let timestamp: string | null = null
  const signatures: string[] = []

  for (const element of elements) {
    const [key, value] = element.split('=', 2)
    if (key === 't') {
      timestamp = value
    } else if (key === 'v1') {
      signatures.push(value)
    }
  }

  if (!timestamp || signatures.length === 0) {
    console.error('Invalid Stripe-Signature header: missing timestamp or v1 signature')
    return false
  }

  // Check timestamp tolerance to prevent replay attacks
  const eventTimestamp = parseInt(timestamp, 10)
  const currentTimestamp = Math.floor(Date.now() / 1000)

  if (Math.abs(currentTimestamp - eventTimestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    console.error('Webhook timestamp outside tolerance window:', {
      eventAge: currentTimestamp - eventTimestamp,
      tolerance: TIMESTAMP_TOLERANCE_SECONDS,
    })
    return false
  }

  // Compute expected signature: HMAC-SHA256 of "{timestamp}.{rawBody}"
  const signedPayload = `${timestamp}.${rawBody}`
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  )

  // Convert to hex string
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Compare against all provided v1 signatures (Stripe may rotate secrets)
  return signatures.some((sig) => timingSafeEqual(sig, expectedSignature))
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  let result = 0
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i]
  }

  return result === 0
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get secrets
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read raw body for signature verification (must read before parsing JSON)
    const rawBody = await req.text()

    // Verify webhook signature
    const signatureHeader = req.headers.get('stripe-signature')
    if (!signatureHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isValid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse event
    const event = JSON.parse(rawBody)

    console.log(`Received Stripe event: ${event.type} (${event.id})`)

    // Handle checkout.session.completed or payment_intent.succeeded
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const isSession = event.type === 'checkout.session.completed'
      const stripeObj = event.data.object

      const orderId = stripeObj.metadata?.order_id
      const paymentIntent = isSession ? stripeObj.payment_intent : stripeObj.id

      if (!orderId) {
        console.error(`${event.type} event missing order_id in metadata`)
        // Still return 200 to acknowledge receipt — Stripe will keep retrying otherwise
        return new Response(
          JSON.stringify({ received: true, warning: `Missing order_id in metadata for ${event.type}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update order in Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase environment variables')
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const updateData: Record<string, any> = {
        status: 'new',
      }

      if (paymentIntent) {
        updateData.stripe_payment_intent_id = paymentIntent
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order:', updateError)
        // Return 500 so Stripe retries
        return new Response(
          JSON.stringify({ error: 'Failed to update order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Order ${orderId} updated via ${event.type}: status=new, payment_intent=${paymentIntent}`)
    }

    // Acknowledge all events with 200 (even unhandled types)
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in stripe-webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
