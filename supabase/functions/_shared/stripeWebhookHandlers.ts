import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { captureEdgeException } from './sentry.ts'

type JsonResponse = (body: Record<string, unknown>, status: number) => Response

type WebhookOrderContext = {
  id: string
  status: string
  total_price: number
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  restaurant_id: string
  stripe_connect_id: string | null
}

function resolveStripeConnectId(
  restaurants: { stripe_connect_id?: string | null } | { stripe_connect_id?: string | null }[] | null,
): string | null {
  if (!restaurants) return null
  if (Array.isArray(restaurants)) {
    return restaurants[0]?.stripe_connect_id ?? null
  }
  return restaurants.stripe_connect_id ?? null
}

export function getOrderIdFromStripeObject(stripeObj: Record<string, unknown>): string | null {
  const metadata = stripeObj.metadata as Record<string, string> | undefined
  const orderId = metadata?.order_id
  return typeof orderId === 'string' && orderId.length > 0 ? orderId : null
}

export function getPaymentIntentId(
  eventType: string,
  stripeObj: Record<string, unknown>,
): string | null {
  if (eventType === 'checkout.session.completed') {
    const pi = stripeObj.payment_intent
    return typeof pi === 'string' ? pi : null
  }
  if (eventType === 'payment_intent.succeeded' || eventType === 'payment_intent.payment_failed') {
    return typeof stripeObj.id === 'string' ? stripeObj.id : null
  }
  if (eventType === 'charge.refunded') {
    const pi = stripeObj.payment_intent
    return typeof pi === 'string' ? pi : null
  }
  return null
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

function validateConnectAccount(
  connectAccount: string | null,
  restaurantConnectId: string | null,
): boolean {
  if (restaurantConnectId) {
    return connectAccount === restaurantConnectId
  }
  return connectAccount === null
}

async function loadWebhookOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<WebhookOrderContext | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total_price,
      stripe_payment_intent_id,
      stripe_checkout_session_id,
      restaurant_id,
      restaurants ( stripe_connect_id )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    status: data.status,
    total_price: data.total_price,
    stripe_payment_intent_id: data.stripe_payment_intent_id ?? null,
    stripe_checkout_session_id: data.stripe_checkout_session_id ?? null,
    restaurant_id: data.restaurant_id,
    stripe_connect_id: resolveStripeConnectId(
      data.restaurants as { stripe_connect_id?: string | null } | { stripe_connect_id?: string | null }[] | null,
    ),
  }
}

function rejectConnectMismatch(
  orderId: string,
  connectAccount: string | null,
  restaurantConnectId: string | null,
  eventType: string,
  jsonResponse: JsonResponse,
): Response {
  console.error('Stripe Connect account mismatch for webhook:', {
    orderId,
    connectAccount,
    restaurantConnectId,
    eventType,
  })
  return jsonResponse({ error: 'Stripe Connect account mismatch' }, 403)
}

/** Binds checkout session when webhook wins the race against stripe-checkout DB write. */
async function ensureCheckoutSessionBinding(
  supabase: SupabaseClient,
  order: WebhookOrderContext,
  sessionId: string | null,
): Promise<boolean> {
  if (!sessionId) return false
  if (order.stripe_checkout_session_id === sessionId) return true
  if (order.stripe_checkout_session_id) return false

  const { data, error } = await supabase
    .from('orders')
    .update({ stripe_checkout_session_id: sessionId })
    .eq('id', order.id)
    .eq('status', 'pending_payment')
    .is('stripe_checkout_session_id', null)
    .select('stripe_checkout_session_id')
    .maybeSingle()

  if (error) {
    console.error('Failed to bind checkout session on webhook:', { orderId: order.id, sessionId, error })
    return false
  }

  if (data?.stripe_checkout_session_id === sessionId) {
    order.stripe_checkout_session_id = sessionId
    console.log('Bound checkout session via webhook race recovery:', { orderId: order.id, sessionId })
    return true
  }

  return false
}

/** Binds payment intent when webhook wins the race against stripe-checkout DB write. */
async function ensurePaymentIntentBinding(
  supabase: SupabaseClient,
  order: WebhookOrderContext,
  paymentIntentId: string | null,
): Promise<boolean> {
  if (!paymentIntentId) return false
  if (order.stripe_payment_intent_id === paymentIntentId) return true
  if (order.stripe_payment_intent_id) return false

  const { data, error } = await supabase
    .from('orders')
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq('id', order.id)
    .eq('status', 'pending_payment')
    .is('stripe_payment_intent_id', null)
    .select('stripe_payment_intent_id')
    .maybeSingle()

  if (error) {
    console.error('Failed to bind payment intent on webhook:', { orderId: order.id, paymentIntentId, error })
    return false
  }

  if (data?.stripe_payment_intent_id === paymentIntentId) {
    order.stripe_payment_intent_id = paymentIntentId
    console.log('Bound payment intent via webhook race recovery:', { orderId: order.id, paymentIntentId })
    return true
  }

  return false
}

export async function recordStripeWebhookEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  orderId: string | null,
): Promise<void> {
  const { error } = await supabase.from('stripe_webhook_events').insert({
    event_id: eventId,
    order_id: orderId,
    event_type: eventType,
  })
  if (error) {
    console.error('Error recording Stripe webhook event:', error)
  }
}

export async function handleStripePaymentSuccess(
  supabase: SupabaseClient,
  event: { id: string; type: string },
  stripeObj: Record<string, unknown>,
  connectAccount: string | null,
  jsonResponse: JsonResponse,
): Promise<Response> {
  const orderId = getOrderIdFromStripeObject(stripeObj)
  const paymentIntent = getPaymentIntentId(event.type, stripeObj)
  const sessionId = event.type === 'checkout.session.completed' && typeof stripeObj.id === 'string'
    ? stripeObj.id
    : null

  if (!orderId) {
    console.error(`${event.type} event missing order_id in metadata`)
    return jsonResponse({
      received: true,
      warning: `Missing order_id in metadata for ${event.type}`,
    }, 200)
  }

  const order = await loadWebhookOrder(supabase, orderId)
  if (!order) {
    console.error('Order not found for webhook:', orderId)
    return jsonResponse({ error: 'Order not found' }, 500)
  }

  if (!validateConnectAccount(connectAccount, order.stripe_connect_id)) {
    return rejectConnectMismatch(orderId, connectAccount, order.stripe_connect_id, event.type, jsonResponse)
  }

  if (event.type === 'checkout.session.completed') {
    const sessionBound = await ensureCheckoutSessionBinding(supabase, order, sessionId)
    if (!sessionBound) {
      console.error('Checkout session mismatch for webhook:', {
        orderId,
        sessionId,
        storedSessionId: order.stripe_checkout_session_id,
      })
      return jsonResponse({ error: 'Checkout session mismatch' }, 403)
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    if (!paymentIntent) {
      return jsonResponse({ error: 'Missing payment intent id' }, 400)
    }
    if (order.stripe_payment_intent_id && order.stripe_payment_intent_id !== paymentIntent) {
      console.error('Payment intent mismatch for webhook:', {
        orderId,
        paymentIntent,
        storedPaymentIntentId: order.stripe_payment_intent_id,
      })
      return jsonResponse({ error: 'Payment intent mismatch' }, 403)
    }
    if (!order.stripe_payment_intent_id) {
      await ensurePaymentIntentBinding(supabase, order, paymentIntent)
    }
    if (!order.stripe_payment_intent_id && !order.stripe_checkout_session_id) {
      console.error('Payment intent succeeded without prior checkout binding:', { orderId, paymentIntent })
      return jsonResponse({ error: 'Payment intent not bound to order' }, 403)
    }
  }

  if (order.status !== 'pending_payment') {
    console.log(`Order ${orderId} already in status '${order.status}', skipping transition`)
    await recordStripeWebhookEvent(supabase, event.id, event.type, orderId)
    return jsonResponse({ received: true, skipped: true }, 200)
  }

  const paidAmountCents = getPaidAmountCents(event.type, stripeObj)
  if (paidAmountCents === null || paidAmountCents !== order.total_price) {
    console.error('Payment amount mismatch:', {
      orderId,
      expected: order.total_price,
      received: paidAmountCents,
      eventType: event.type,
    })
    return jsonResponse({ error: 'Payment amount mismatch' }, 400)
  }

  const updateData: Record<string, unknown> = {
    status: 'new',
    payment_provider: 'stripe',
  }
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
    return jsonResponse({ error: 'Failed to update order' }, 500)
  }

  await recordStripeWebhookEvent(supabase, event.id, event.type, orderId)
  console.log(`Order ${orderId} updated via ${event.type}: status=new, payment_intent=${paymentIntent}`)
  return jsonResponse({ received: true, order_id: orderId }, 200)
}

export async function handleStripePaymentFailed(
  supabase: SupabaseClient,
  event: { id: string; type: string },
  stripeObj: Record<string, unknown>,
  connectAccount: string | null,
  jsonResponse: JsonResponse,
): Promise<Response> {
  const orderId = getOrderIdFromStripeObject(stripeObj)
  const paymentIntentId = getPaymentIntentId(event.type, stripeObj)
  const lastError = stripeObj.last_payment_error as Record<string, unknown> | undefined
  const failureMessage = typeof lastError?.message === 'string' ? lastError.message : 'unknown'

  if (!orderId) {
    console.warn('payment_intent.payment_failed without order_id metadata', { paymentIntentId })
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, warning: 'Missing order_id in metadata' }, 200)
  }

  const order = await loadWebhookOrder(supabase, orderId)
  if (!order) {
    console.error('Order not found for payment failure:', orderId)
    return jsonResponse({ error: 'Order not found' }, 500)
  }

  if (!validateConnectAccount(connectAccount, order.stripe_connect_id)) {
    return rejectConnectMismatch(orderId, connectAccount, order.stripe_connect_id, event.type, jsonResponse)
  }

  if (paymentIntentId && order.stripe_payment_intent_id && order.stripe_payment_intent_id !== paymentIntentId) {
    console.warn('Ignoring payment failure for mismatched payment intent:', {
      orderId,
      paymentIntentId,
      storedPaymentIntentId: order.stripe_payment_intent_id,
    })
    await recordStripeWebhookEvent(supabase, event.id, event.type, orderId)
    return jsonResponse({ received: true, ignored: true }, 200)
  }

  console.log(`Payment failed for order ${orderId} (status=${order.status}): ${failureMessage}`)

  if (order.status === 'pending_payment') {
    await captureEdgeException(new Error(`Stripe payment failed: ${failureMessage}`), {
      functionName: 'stripe-webhook',
      tags: { stripe_event: 'payment_intent.payment_failed' },
      extra: { orderId, paymentIntentId, failureMessage },
    })
  }

  await recordStripeWebhookEvent(supabase, event.id, event.type, orderId)
  return jsonResponse({ received: true, order_id: orderId, failed: true }, 200)
}

export async function handleCheckoutSessionExpired(
  supabase: SupabaseClient,
  event: { id: string; type: string },
  stripeObj: Record<string, unknown>,
  connectAccount: string | null,
  jsonResponse: JsonResponse,
): Promise<Response> {
  const orderId = getOrderIdFromStripeObject(stripeObj)
  const sessionId = typeof stripeObj.id === 'string' ? stripeObj.id : null

  if (!orderId) {
    console.warn('checkout.session.expired without order_id metadata', { sessionId })
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, warning: 'Missing order_id in metadata' }, 200)
  }

  const order = await loadWebhookOrder(supabase, orderId)
  if (!order) {
    console.error('Order not found for expired checkout:', orderId)
    return jsonResponse({ error: 'Order not found' }, 500)
  }

  if (!validateConnectAccount(connectAccount, order.stripe_connect_id)) {
    return rejectConnectMismatch(orderId, connectAccount, order.stripe_connect_id, event.type, jsonResponse)
  }

  const sessionBound = await ensureCheckoutSessionBinding(supabase, order, sessionId)
  if (!sessionBound) {
    console.error('Expired checkout session mismatch:', {
      orderId,
      sessionId,
      storedSessionId: order.stripe_checkout_session_id,
    })
    return jsonResponse({ error: 'Checkout session mismatch' }, 403)
  }

  if (order.status === 'pending_payment') {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending_payment')

    if (updateError) {
      console.error('Error cancelling order after expired checkout:', updateError)
      return jsonResponse({ error: 'Failed to cancel order' }, 500)
    }

    console.log(`Order ${orderId} cancelled after checkout.session.expired (session=${sessionId})`)
  } else {
    console.log(`checkout.session.expired for order ${orderId} in status ${order.status}, no change`)
  }

  await recordStripeWebhookEvent(supabase, event.id, event.type, orderId)
  return jsonResponse({ received: true, order_id: orderId, cancelled: order.status === 'pending_payment' }, 200)
}

export async function handleChargeRefunded(
  supabase: SupabaseClient,
  event: { id: string; type: string },
  stripeObj: Record<string, unknown>,
  connectAccount: string | null,
  jsonResponse: JsonResponse,
): Promise<Response> {
  const paymentIntentId = getPaymentIntentId(event.type, stripeObj)
  const amount = typeof stripeObj.amount === 'number' ? stripeObj.amount : null
  const amountRefunded = typeof stripeObj.amount_refunded === 'number' ? stripeObj.amount_refunded : 0
  const fullyRefunded = stripeObj.refunded === true
    || (amount !== null && amountRefunded >= amount)

  if (!paymentIntentId) {
    console.warn('charge.refunded without payment_intent', { chargeId: stripeObj.id })
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, warning: 'Missing payment_intent on charge' }, 200)
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total_price,
      stripe_payment_intent_id,
      restaurants ( stripe_connect_id )
    `)
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (orderError) {
    console.error('Error loading order for refund:', orderError)
    return jsonResponse({ error: 'Failed to load order' }, 500)
  }

  if (!order) {
    console.warn('No order found for refunded charge', { paymentIntentId })
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, warning: 'Order not found for payment_intent' }, 200)
  }

  const restaurantConnectId = resolveStripeConnectId(
    order.restaurants as { stripe_connect_id?: string | null } | { stripe_connect_id?: string | null }[] | null,
  )

  if (!validateConnectAccount(connectAccount, restaurantConnectId)) {
    return rejectConnectMismatch(order.id, connectAccount, restaurantConnectId, event.type, jsonResponse)
  }

  if (fullyRefunded && order.status !== 'cancelled') {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error cancelling order after full refund:', updateError)
      return jsonResponse({ error: 'Failed to update order after refund' }, 500)
    }

    console.log(`Order ${order.id} cancelled after full refund (PI=${paymentIntentId})`)
  } else if (!fullyRefunded) {
    console.log(`Partial refund on order ${order.id}: ${amountRefunded}/${amount} cents — status unchanged`)
  }

  await recordStripeWebhookEvent(supabase, event.id, event.type, order.id)
  return jsonResponse({
    received: true,
    order_id: order.id,
    fully_refunded: fullyRefunded,
  }, 200)
}

export async function handleAccountUpdated(
  supabase: SupabaseClient,
  event: { id: string; type: string },
  stripeObj: Record<string, unknown>,
  connectAccount: string | null,
  jsonResponse: JsonResponse,
): Promise<Response> {
  const accountId = typeof stripeObj.id === 'string' ? stripeObj.id : connectAccount
  if (!accountId) {
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, warning: 'Missing account id' }, 200)
  }

  const chargesEnabled = stripeObj.charges_enabled === true
  const detailsSubmitted = stripeObj.details_submitted === true
  const payoutsEnabled = stripeObj.payouts_enabled === true
  const readyForPayments = chargesEnabled && detailsSubmitted

  const { data: restaurants, error: listError } = await supabase
    .from('restaurants')
    .select('id, name, online_payment')
    .eq('stripe_connect_id', accountId)

  if (listError) {
    console.error('Error loading restaurants for account.updated:', listError)
    return jsonResponse({ error: 'Failed to load restaurants' }, 500)
  }

  if (!restaurants || restaurants.length === 0) {
    console.log(`account.updated for ${accountId}: no linked restaurant`)
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, linked_restaurants: 0 }, 200)
  }

  let disabledCount = 0
  for (const restaurant of restaurants) {
    if (!readyForPayments && restaurant.online_payment) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ online_payment: false, updated_at: new Date().toISOString() })
        .eq('id', restaurant.id)

      if (updateError) {
        console.error(`Failed to disable online_payment for restaurant ${restaurant.id}:`, updateError)
        continue
      }

      disabledCount += 1
      console.log(
        `Disabled online_payment for restaurant ${restaurant.id} (${restaurant.name}) — ` +
        `charges_enabled=${chargesEnabled}, details_submitted=${detailsSubmitted}, payouts_enabled=${payoutsEnabled}`,
      )
    }
  }

  await recordStripeWebhookEvent(supabase, event.id, event.type, null)
  return jsonResponse({
    received: true,
    account_id: accountId,
    linked_restaurants: restaurants.length,
    online_payment_disabled: disabledCount,
    ready_for_payments: readyForPayments,
  }, 200)
}
