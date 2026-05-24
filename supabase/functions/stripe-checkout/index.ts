import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LineItem {
  name: string
  description?: string
  quantity: number
  price_cents: number
}

interface CheckoutRequest {
  order_id: string
  restaurant_id: string
  items: LineItem[]
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  success_url?: string
  cancel_url?: string
  apple_pay_payment_data?: string
  use_payment_sheet?: boolean
}

/**
 * Encodes an object into Stripe-compatible x-www-form-urlencoded format.
 * Handles nested objects and arrays using Stripe's bracket notation,
 * e.g. line_items[0][price_data][currency] = 'brl'
 */
function encodeStripeParams(params: Record<string, any>, prefix = ''): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (value === null || value === undefined) {
      continue
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          parts.push(encodeStripeParams(item, `${fullKey}[${index}]`))
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else if (typeof value === 'object') {
      parts.push(encodeStripeParams(value, fullKey))
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
    }
  }

  return parts.filter(Boolean).join('&')
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
    const body: CheckoutRequest = await req.json()
    const { order_id, restaurant_id, items, customer_name, customer_phone, customer_email, success_url, cancel_url, apple_pay_payment_data, use_payment_sheet } = body

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!restaurant_id) {
      return new Response(
        JSON.stringify({ error: 'restaurant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'items array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!use_payment_sheet && !apple_pay_payment_data && !success_url) {
      return new Response(
        JSON.stringify({ error: 'success_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!use_payment_sheet && !apple_pay_payment_data && !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'cancel_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate each line item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.name || !item.quantity || !item.price_cents) {
        return new Response(
          JSON.stringify({ error: `Item at index ${i} is missing required fields (name, quantity, price_cents)` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (item.quantity < 1) {
        return new Response(
          JSON.stringify({ error: `Item at index ${i} must have quantity >= 1` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (item.price_cents < 1) {
        return new Response(
          JSON.stringify({ error: `Item at index ${i} must have price_cents >= 1` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PaymentIntent Flow for Native iOS PaymentSheet
    if (use_payment_sheet) {
      try {
        const totalAmountCents = items.reduce((acc, item) => acc + (item.price_cents * item.quantity), 0)

        const paymentIntentParams: Record<string, any> = {
          'amount': String(totalAmountCents),
          'currency': 'brl',
          'automatic_payment_methods[enabled]': 'true',
          'metadata[order_id]': order_id,
          'metadata[restaurant_id]': restaurant_id,
        }

        if (customer_email) {
          paymentIntentParams['receipt_email'] = customer_email
        }
        if (customer_name) {
          paymentIntentParams['metadata[customer_name]'] = customer_name
        }
        if (customer_phone) {
          paymentIntentParams['metadata[customer_phone]'] = customer_phone
        }

        const encodedPIBody = encodeStripeParams(paymentIntentParams)

        const piResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: encodedPIBody,
        })

        const piData = await piResponse.json()

        if (!piResponse.ok) {
          console.error('Stripe PaymentIntent API error:', JSON.stringify(piData))
          return new Response(
            JSON.stringify({
              error: 'Failed to create PaymentIntent',
              details: piData.error?.message || 'Unknown Stripe error',
            }),
            { status: piResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update order in Supabase with the stripe_payment_intent_id
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          const { error: updateError } = await supabase
            .from('orders')
            .update({ stripe_payment_intent_id: piData.id })
            .eq('id', order_id)

          if (updateError) {
            console.error('Error updating order with payment intent ID:', updateError)
          }
        }

        return new Response(
          JSON.stringify({
            payment_intent_client_secret: piData.client_secret,
            publishable_key: Deno.env.get('STRIPE_PUBLISHABLE_KEY') || '',
            secret_key: Deno.env.get('STRIPE_SECRET_KEY') || '',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err: any) {
        console.error('Error in PaymentSheet PaymentIntent creation:', err)
        return new Response(
          JSON.stringify({ error: err.message || 'Internal error creating PaymentIntent' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Direct Apple Pay processing flow
    if (apple_pay_payment_data) {
      try {
        // 1. Create a Stripe Token with the Apple Pay tokenized decrypted payload
        const tokenParams = {
          'pk_token': apple_pay_payment_data,
        }
        const encodedTokenBody = encodeStripeParams(tokenParams)
        
        const tokenResponse = await fetch('https://api.stripe.com/v1/tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: encodedTokenBody,
        })
        
        const tokenData = await tokenResponse.json()
        
        if (!tokenResponse.ok) {
          console.error('Stripe Token API error for Apple Pay:', JSON.stringify(tokenData))
          return new Response(
            JSON.stringify({
              success: false,
              error: tokenData.error?.message || 'Failed to tokenize Apple Pay payment',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const stripeToken = tokenData.id // tok_xxxx
        
        // 2. Create and confirm a PaymentIntent using the Stripe Token
        const totalAmountCents = items.reduce((acc, item) => acc + (item.price_cents * item.quantity), 0)
        
        const paymentIntentParams = {
          'amount': String(totalAmountCents),
          'currency': 'brl',
          'payment_method_data': {
            'type': 'card',
            'card': {
              'token': stripeToken,
            }
          },
          'confirm': 'true',
          'metadata': {
            order_id,
            restaurant_id,
          }
        }
        
        const encodedPIBody = encodeStripeParams(paymentIntentParams)
        
        const piResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: encodedPIBody,
        })
        
        const piData = await piResponse.json()
        
        if (!piResponse.ok) {
          console.error('Stripe PaymentIntent API error for Apple Pay:', JSON.stringify(piData))
          return new Response(
            JSON.stringify({
              success: false,
              error: piData.error?.message || 'Failed to confirm Apple Pay payment',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // 3. Update order status in Supabase to 'new' and record Stripe payment intent ID
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              stripe_payment_intent_id: piData.id,
              status: 'new'
            })
            .eq('id', order_id)
            
          if (updateError) {
            console.error('Error updating order on Apple Pay success:', updateError)
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            payment_intent_id: piData.id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err: any) {
        console.error('Error in Apple Pay processing:', err)
        return new Response(
          JSON.stringify({
            success: false,
            error: err.message || 'Internal error during direct Apple Pay checkout',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Build Stripe Checkout Session params
    // Uses inline price_data so we don't need to pre-create products/prices
    const stripeParams: Record<string, any> = {
      'payment_method_types': ['card'],
      'mode': 'payment',
      'success_url': success_url.includes('{CHECKOUT_SESSION_ID}')
        ? success_url
        : `${success_url}${success_url.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': cancel_url,
      'metadata': {
        order_id,
        restaurant_id,
      },
      'line_items': items.map((item) => ({
        'price_data': {
          'currency': 'brl',
          'unit_amount': String(item.price_cents),
          'product_data': {
            'name': item.name,
            ...(item.description ? { 'description': item.description } : {}),
          },
        },
        'quantity': String(item.quantity),
      })),
    }

    // Add optional customer email
    if (customer_email) {
      stripeParams['customer_email'] = customer_email
    }

    // Add customer name/phone as payment_intent_data metadata
    if (customer_name || customer_phone) {
      stripeParams['payment_intent_data'] = {
        'metadata': {
          ...(customer_name ? { customer_name } : {}),
          ...(customer_phone ? { customer_phone } : {}),
        },
      }
    }

    // Call Stripe API to create Checkout Session
    const encodedBody = encodeStripeParams(stripeParams)

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encodedBody,
    })

    const session = await stripeResponse.json()

    if (!stripeResponse.ok) {
      console.error('Stripe API error:', JSON.stringify(session))
      return new Response(
        JSON.stringify({
          error: 'Failed to create checkout session',
          details: session.error?.message || 'Unknown Stripe error',
        }),
        { status: stripeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update order in Supabase with the Stripe checkout session ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error: updateError } = await supabase
        .from('orders')
        .update({ stripe_checkout_session_id: session.id })
        .eq('id', order_id)

      if (updateError) {
        // Log but don't fail — the checkout session was already created
        console.error('Error updating order with session ID:', updateError)
      }
    }

    // Return the checkout URL and session ID
    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in stripe-checkout:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
