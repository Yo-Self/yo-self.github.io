import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { captureEdgeException } from './sentry.ts'

type JsonResponse = (body: Record<string, unknown>, status: number) => Response

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
  jsonResponse: JsonResponse,
): Promise<Response> {
  const orderId = getOrderIdFromStripeObject(stripeObj)
  const paymentIntent = getPaymentIntentId(event.type, stripeObj)

  if (!orderId) {
    console.error(`${event.type} event missing order_id in metadata`)
    return jsonResponse({
      received: true,
      warning: `Missing order_id in metadata for ${event.type}`,
    }, 200)
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, total_price')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('Order not found for webhook:', orderId, orderError)
    return jsonResponse({ error: 'Order not found' }, 500)
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

  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) {
    console.error('Order not found for payment failure:', orderId)
    return jsonResponse({ error: 'Order not found' }, 500)
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
  jsonResponse: JsonResponse,
): Promise<Response> {
  const orderId = getOrderIdFromStripeObject(stripeObj)
  const sessionId = typeof stripeObj.id === 'string' ? stripeObj.id : null

  if (!orderId) {
    console.warn('checkout.session.expired without order_id metadata', { sessionId })
    await recordStripeWebhookEvent(supabase, event.id, event.type, null)
    return jsonResponse({ received: true, warning: 'Missing order_id in metadata' }, 200)
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('Order not found for expired checkout:', orderId, orderError)
    return jsonResponse({ error: 'Order not found' }, 500)
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
    .select('id, status, total_price')
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
