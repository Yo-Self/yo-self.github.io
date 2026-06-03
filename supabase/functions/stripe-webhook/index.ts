import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIMESTAMP_TOLERANCE_SECONDS = 300

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
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
    ['sign']
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

function getPaidAmountCents(eventType: string, stripeObj: Record<string, unknown>): number | null {
  if (eventType === 'checkout.session.completed') {
    const amount = stripeObj.amount_total
    return typeof amount === 'number' ? amount : null
  }

  if (eventType === 'payment_intent.succeeded') {
    const amount = stripeObj.amount
    return typeof amount === 'number' ? amount : null
  }

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawBody = await req.text()
    const signatureHeader = req.headers.get('stripe-signature')
    if (!signatureHeader) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isValid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = JSON.parse(rawBody)
    console.log(`Received Stripe event: ${event.type} (${event.id})`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle()

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const stripeObj = event.data.object as Record<string, unknown>
      const orderId = (stripeObj.metadata as Record<string, string> | undefined)?.order_id
      const paymentIntent = event.type === 'checkout.session.completed'
        ? stripeObj.payment_intent
        : stripeObj.id

      if (!orderId) {
        console.error(`${event.type} event missing order_id in metadata`)
        return new Response(JSON.stringify({
          received: true,
          warning: `Missing order_id in metadata for ${event.type}`,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, total_price')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error('Order not found for webhook:', orderId, orderError)
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (order.status !== 'pending_payment') {
        console.log(`Order ${orderId} already in status '${order.status}', skipping transition`)
        await supabase.from('stripe_webhook_events').insert({
          event_id: event.id,
          order_id: orderId,
          event_type: event.type,
        })
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const paidAmountCents = getPaidAmountCents(event.type, stripeObj)
      if (paidAmountCents === null || paidAmountCents !== order.total_price) {
        console.error('Payment amount mismatch:', {
          orderId,
          expected: order.total_price,
          received: paidAmountCents,
          eventType: event.type,
        })
        return new Response(JSON.stringify({ error: 'Payment amount mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updateData: Record<string, unknown> = { status: 'new' }
      if (paymentIntent) {
        updateData.stripe_payment_intent_id = paymentIntent
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('status', 'pending_payment')

      if (updateError) {
        console.error('Error updating order:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update order' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: eventInsertError } = await supabase.from('stripe_webhook_events').insert({
        event_id: event.id,
        order_id: orderId,
        event_type: event.type,
      })

      if (eventInsertError) {
        console.error('Error recording webhook event:', eventInsertError)
      }

      console.log(`Order ${orderId} updated via ${event.type}: status=new, payment_intent=${paymentIntent}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error in stripe-webhook:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
