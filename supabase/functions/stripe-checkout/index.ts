import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { priceOrderItemsFromMenu } from '../_shared/order-pricing.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { assertAllowedCheckoutUrl, CheckoutUrlError } from '../_shared/checkoutUrls.ts'
import { confirmStripeOrderPayment } from '../_shared/stripeOrderPayment.ts'

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
  items?: LineItem[]
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  success_url?: string
  cancel_url?: string
  apple_pay_payment_data?: string
  use_payment_sheet?: boolean
  is_express_checkout?: boolean
  confirm_payment?: boolean
  access_token?: string
  session_id?: string
}

interface OrderItemRow {
  dish_id: string
  quantity: number
  price_at_time_of_order: number
  selected_complements: { complement_id?: string; name?: string; price?: number }[] | null
  dishes: { name: string; price: number } | { name: string; price: number }[] | null
}

interface ValidatedCheckout {
  lineItems: LineItem[]
  totalAmountCents: number
  stripeConnectId: string | null
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function encodeStripeParams(params: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (value === null || value === undefined) {
      continue
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          parts.push(encodeStripeParams(item as Record<string, unknown>, `${fullKey}[${index}]`))
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else if (typeof value === 'object') {
      parts.push(encodeStripeParams(value as Record<string, unknown>, fullKey))
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
    }
  }

  return parts.filter(Boolean).join('&')
}

function complementDescription(complements: OrderItemRow['selected_complements']): string | undefined {
  if (!complements || !Array.isArray(complements) || complements.length === 0) return undefined
  return complements.map((c) => c.name).filter(Boolean).join(', ')
}

async function loadAndValidateCheckout(
  supabase: SupabaseClient,
  orderId: string,
  restaurantId: string,
): Promise<{ ok: true; data: ValidatedCheckout } | { ok: false; response: Response }> {
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('stripe_connect_id, online_payment, table_payment, open, is_open_for_orders, online_ordering_enabled')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    return { ok: false, response: jsonResponse({ error: 'Restaurant not found' }, 404) }
  }

  if (!restaurant.open || !restaurant.is_open_for_orders) {
    return { ok: false, response: jsonResponse({ error: 'Restaurant is not accepting orders' }, 403) }
  }

  if (restaurant.online_ordering_enabled === false) {
    return { ok: false, response: jsonResponse({ error: 'Online ordering is disabled for this restaurant' }, 403) }
  }

  if (!restaurant.online_payment && !restaurant.table_payment) {
    return { ok: false, response: jsonResponse({ error: 'Online payment is not enabled for this restaurant' }, 403) }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      restaurant_id,
      status,
      total_price,
      delivery_fee,
      order_type,
      order_items (
        dish_id,
        quantity,
        price_at_time_of_order,
        selected_complements,
        dishes ( name, price )
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { ok: false, response: jsonResponse({ error: 'Order not found' }, 404) }
  }

  if (order.restaurant_id !== restaurantId) {
    return { ok: false, response: jsonResponse({ error: 'Order does not belong to this restaurant' }, 403) }
  }

  if (order.status !== 'pending_payment') {
    return { ok: false, response: jsonResponse({ error: 'Order is not awaiting payment' }, 409) }
  }

  if (order.order_type === 'delivery' && !restaurant.online_payment) {
    return { ok: false, response: jsonResponse({ error: 'Delivery orders require online payment' }, 403) }
  }

  const orderItems = (order.order_items || []) as OrderItemRow[]
  if (orderItems.length === 0) {
    return { ok: false, response: jsonResponse({ error: 'Order has no items' }, 400) }
  }

  const priced = await priceOrderItemsFromMenu(supabase, restaurantId, orderItems)
  if (!priced.ok) {
    console.error('Menu price validation failed:', { orderId, error: priced.error })
    return { ok: false, response: jsonResponse({ error: 'Order total validation failed' }, 400) }
  }

  const lineItems: LineItem[] = priced.items.map((item, index) => ({
    name: item.description,
    description: complementDescription(orderItems[index]?.selected_complements ?? null),
    quantity: item.quantity,
    price_cents: item.unitCents,
  }))

  const deliveryFee = Number(order.delivery_fee) || 0

  if (deliveryFee > 0) {
    lineItems.push({
      name: 'Taxa de Entrega',
      description: 'Frete para entrega no endereço informado',
      quantity: 1,
      price_cents: deliveryFee,
    })
  }

  const computedTotal = priced.itemsTotalCents + deliveryFee
  if (computedTotal !== order.total_price) {
    console.error('Order total mismatch:', {
      orderId,
      computedTotal,
      storedTotal: order.total_price,
    })
    return { ok: false, response: jsonResponse({ error: 'Order total validation failed' }, 400) }
  }

  return {
    ok: true,
    data: {
      lineItems,
      totalAmountCents: order.total_price,
      stripeConnectId: restaurant.stripe_connect_id || null,
    },
  }
}

function warnIfUnrestrictedStripeKey(secretKey: string) {
  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_')) {
    console.warn(
      'STRIPE_SECRET_KEY is an unrestricted secret key (sk_). Prefer a Restricted API Key (rk_) with only the permissions required for checkout.'
    )
  }
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || req.headers.get('x-real-ip')
    || 'unknown'
}

async function enforceRateLimits(
  supabase: SupabaseClient,
  orderId: string,
  clientIp: string,
  isConfirmPayment: boolean,
): Promise<Response | null> {
  const { data: ipAllowed, error: ipError } = await supabase.rpc('check_edge_function_rate_limit', {
    p_scope: 'stripe-checkout:ip',
    p_identifier: clientIp,
    p_max_requests: 30,
    p_window_seconds: 60,
  })

  if (ipError) {
    console.error('Rate limit check failed (ip):', ipError)
  } else if (ipAllowed !== true) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429)
  }

  const { data: orderAllowed, error: orderError } = await supabase.rpc('check_edge_function_rate_limit', {
    p_scope: isConfirmPayment ? 'stripe-checkout:confirm' : 'stripe-checkout:order',
    p_identifier: orderId,
    p_max_requests: isConfirmPayment ? 30 : 5,
    p_window_seconds: 300,
  })

  if (orderError) {
    console.error('Rate limit check failed (order):', orderError)
  } else if (orderAllowed !== true) {
    return jsonResponse({ error: 'Too many checkout attempts for this order.' }, 429)
  }

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const body: CheckoutRequest = await req.json()
    const {
      order_id,
      restaurant_id,
      customer_name,
      customer_phone,
      customer_email,
      success_url,
      cancel_url,
      apple_pay_payment_data,
      use_payment_sheet,
      is_express_checkout,
      confirm_payment,
      access_token,
      session_id,
    } = body

    if (!order_id) {
      return jsonResponse({ error: 'order_id is required' }, 400)
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return jsonResponse({ error: 'Stripe is not configured' }, 500)
    }
    warnIfUnrestrictedStripeKey(stripeSecretKey)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey =
      Deno.env.get('SB_SECRET_KEY') ??
      Deno.env.get('SUPABASE_SECRET_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const rateLimitResponse = await enforceRateLimits(supabase, order_id, getClientIp(req), confirm_payment === true)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    if (confirm_payment) {
      if (!access_token) {
        return jsonResponse({ error: 'access_token is required for payment confirmation' }, 400)
      }

      const result = await confirmStripeOrderPayment(supabase, order_id, stripeSecretKey, {
        accessToken: access_token,
        checkoutSessionId: session_id,
      })

      if (!result.ok) {
        return jsonResponse({ error: result.error }, result.status ?? 400)
      }

      return jsonResponse({
        confirmed: !result.alreadyPaid,
        already_paid: result.alreadyPaid,
        order_id: result.orderId,
        payment_intent_id: result.paymentIntentId,
      }, 200)
    }

    if (!restaurant_id) {
      return jsonResponse({ error: 'restaurant_id is required' }, 400)
    }
    if (!use_payment_sheet && !is_express_checkout && !apple_pay_payment_data && !success_url) {
      return jsonResponse({ error: 'success_url is required' }, 400)
    }
    if (!use_payment_sheet && !is_express_checkout && !apple_pay_payment_data && !cancel_url) {
      return jsonResponse({ error: 'cancel_url is required' }, 400)
    }

    try {
      if (success_url) assertAllowedCheckoutUrl(success_url, 'success_url')
      if (cancel_url) assertAllowedCheckoutUrl(cancel_url, 'cancel_url')
    } catch (err) {
      if (err instanceof CheckoutUrlError) {
        return jsonResponse({ error: err.message }, 400)
      }
      throw err
    }

    const validation = await loadAndValidateCheckout(supabase, order_id, restaurant_id)
    if (!validation.ok) {
      return validation.response
    }

    const { lineItems, totalAmountCents, stripeConnectId } = validation.data
    const stripeAccountHeader = stripeConnectId ? { 'Stripe-Account': stripeConnectId } : {}

    if (use_payment_sheet || is_express_checkout) {
      const paymentIntentParams: Record<string, unknown> = {
        amount: String(totalAmountCents),
        currency: 'brl',
        'automatic_payment_methods[enabled]': 'true',
        'metadata[order_id]': order_id,
        'metadata[restaurant_id]': restaurant_id,
      }

      if (customer_email) paymentIntentParams['receipt_email'] = customer_email
      if (customer_name) paymentIntentParams['metadata[customer_name]'] = customer_name
      if (customer_phone) paymentIntentParams['metadata[customer_phone]'] = customer_phone

      const piResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...stripeAccountHeader,
        },
        body: encodeStripeParams(paymentIntentParams),
      })

      const piData = await piResponse.json()
      if (!piResponse.ok) {
        console.error('Stripe PaymentIntent API error:', JSON.stringify(piData))
        return jsonResponse({
          error: 'Failed to create PaymentIntent',
          details: piData.error?.message || 'Unknown Stripe error',
        }, piResponse.status)
      }

      // PI id is persisted only after payment confirmation (webhook or confirm_payment).

      return jsonResponse({ payment_intent_client_secret: piData.client_secret }, 200)
    }

    if (apple_pay_payment_data) {
      if (!access_token) {
        return jsonResponse({ error: 'access_token is required for Apple Pay confirmation' }, 400)
      }

      const tokenResponse = await fetch('https://api.stripe.com/v1/tokens', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...stripeAccountHeader,
        },
        body: encodeStripeParams({ pk_token: apple_pay_payment_data }),
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok) {
        console.error('Stripe Token API error for Apple Pay:', JSON.stringify(tokenData))
        return jsonResponse({
          success: false,
          error: tokenData.error?.message || 'Failed to tokenize Apple Pay payment',
        }, 200)
      }

      const paymentIntentParams: Record<string, unknown> = {
        amount: String(totalAmountCents),
        currency: 'brl',
        payment_method_data: {
          type: 'card',
          card: { token: tokenData.id },
        },
        confirm: 'true',
        metadata: { order_id, restaurant_id },
      }

      const piResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...stripeAccountHeader,
        },
        body: encodeStripeParams(paymentIntentParams),
      })

      const piData = await piResponse.json()
      if (!piResponse.ok) {
        console.error('Stripe PaymentIntent API error for Apple Pay:', JSON.stringify(piData))
        return jsonResponse({
          success: false,
          error: piData.error?.message || 'Failed to confirm Apple Pay payment',
        }, 200)
      }

      if (piData.status === 'succeeded') {
        const confirmResult = await confirmStripeOrderPayment(supabase, order_id, stripeSecretKey, {
          paymentIntentId: piData.id,
          accessToken: access_token,
        })
        if (!confirmResult.ok) {
          console.error('Apple Pay succeeded but order confirm failed:', confirmResult.error)
        }
      }

      return jsonResponse({ success: true, payment_intent_id: piData.id }, 200)
    }

    const stripeParams: Record<string, unknown> = {
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: success_url!.includes('{CHECKOUT_SESSION_ID}')
        ? success_url
        : `${success_url}${success_url!.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      metadata: { order_id, restaurant_id },
      line_items: lineItems.map((item) => ({
        price_data: {
          currency: 'brl',
          unit_amount: String(item.price_cents),
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
          },
        },
        quantity: String(item.quantity),
      })),
    }

    if (customer_email) stripeParams.customer_email = customer_email
    stripeParams.payment_intent_data = {
      metadata: {
        order_id,
        restaurant_id,
        ...(customer_name ? { customer_name } : {}),
        ...(customer_phone ? { customer_phone } : {}),
      },
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...stripeAccountHeader,
      },
      body: encodeStripeParams(stripeParams),
    })

    const session = await stripeResponse.json()
    if (!stripeResponse.ok) {
      console.error('Stripe API error:', JSON.stringify(session))
      return jsonResponse({
        error: 'Failed to create checkout session',
        details: session.error?.message || 'Unknown Stripe error',
      }, stripeResponse.status)
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order_id)
      .eq('status', 'pending_payment')

    if (updateError) {
      console.error('Error updating order with session ID:', updateError)
    }

    return jsonResponse({ checkout_url: session.url, session_id: session.id }, 200)
  } catch (error) {
    console.error('Unexpected error in stripe-checkout:', error)
    await captureEdgeException(error, {
      functionName: 'stripe-checkout',
      extra: { path: req.url, method: req.method },
    })
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
