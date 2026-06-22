import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type ConfirmStripePaymentResult =
  | { ok: true; orderId: string; paymentIntentId: string; alreadyPaid: boolean }
  | { ok: false; error: string; status?: number }

function resolveStripeConnectId(
  restaurants: { stripe_connect_id?: string | null } | { stripe_connect_id?: string | null }[] | null,
): string | null {
  if (!restaurants) return null
  if (Array.isArray(restaurants)) {
    return restaurants[0]?.stripe_connect_id ?? null
  }
  return restaurants.stripe_connect_id ?? null
}

export async function retrieveStripePaymentIntent(
  paymentIntentId: string,
  stripeSecretKey: string,
  stripeConnectId: string | null,
): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
  }
  if (stripeConnectId) {
    headers['Stripe-Account'] = stripeConnectId
  }

  const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, { headers })
  if (!response.ok) {
    console.error('Failed to retrieve PaymentIntent:', paymentIntentId, await response.text())
    return null
  }

  return await response.json()
}

export async function findStripePaymentIntentByOrderId(
  orderId: string,
  stripeSecretKey: string,
  stripeConnectId: string | null,
): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
  }
  if (stripeConnectId) {
    headers['Stripe-Account'] = stripeConnectId
  }

  const query = encodeURIComponent(`metadata['order_id']:'${orderId}'`)
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/search?query=${query}&limit=10`,
    { headers },
  )

  if (!response.ok) {
    console.error('Failed to search PaymentIntents for order:', orderId, await response.text())
    return null
  }

  const payload = await response.json()
  const intents = (payload.data || []) as Record<string, unknown>[]
  if (intents.length === 0) {
    return null
  }

  const succeeded = intents.find((intent) => intent.status === 'succeeded')
  if (succeeded) {
    return succeeded
  }

  return intents[0] ?? null
}

async function resolvePaymentIntentForOrder(
  orderId: string,
  stripeSecretKey: string,
  stripeConnectId: string | null,
  knownPaymentIntentId?: string | null,
): Promise<{ paymentIntent: Record<string, unknown>; paymentIntentId: string } | null> {
  if (knownPaymentIntentId) {
    const paymentIntent = await retrieveStripePaymentIntent(
      knownPaymentIntentId,
      stripeSecretKey,
      stripeConnectId,
    )
    if (paymentIntent && typeof paymentIntent.id === 'string') {
      return { paymentIntent, paymentIntentId: paymentIntent.id }
    }
  }

  const paymentIntent = await findStripePaymentIntentByOrderId(orderId, stripeSecretKey, stripeConnectId)
  if (!paymentIntent || typeof paymentIntent.id !== 'string') {
    return null
  }

  return { paymentIntent, paymentIntentId: paymentIntent.id }
}

export async function confirmStripeOrderPayment(
  supabase: SupabaseClient,
  orderId: string,
  stripeSecretKey: string,
  options?: { accessToken?: string; paymentIntentId?: string },
): Promise<ConfirmStripePaymentResult> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, total_price, stripe_payment_intent_id, customer_access_token, restaurant_id, restaurants(stripe_connect_id)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { ok: false, error: 'Order not found', status: 404 }
  }

  if (!options?.accessToken) {
    return { ok: false, error: 'access_token is required', status: 403 }
  }

  if (order.customer_access_token !== options.accessToken) {
    return { ok: false, error: 'Invalid access token', status: 403 }
  }

  const stripeConnectId = resolveStripeConnectId(
    order.restaurants as { stripe_connect_id?: string | null } | { stripe_connect_id?: string | null }[] | null,
  )

  const resolved = await resolvePaymentIntentForOrder(
    orderId,
    stripeSecretKey,
    stripeConnectId,
    options?.paymentIntentId || order.stripe_payment_intent_id,
  )

  if (!resolved) {
    return { ok: false, error: 'No payment intent found for order', status: 404 }
  }

  const { paymentIntent, paymentIntentId } = resolved

  if (order.status !== 'pending_payment') {
    return {
      ok: true,
      orderId,
      paymentIntentId,
      alreadyPaid: true,
    }
  }

  const paymentStatus = String(paymentIntent.status || '')
  if (paymentStatus !== 'succeeded') {
    return { ok: false, error: `Payment not completed (status: ${paymentStatus})`, status: 409 }
  }

  const metadata = paymentIntent.metadata as Record<string, string> | undefined
  if (metadata?.order_id && metadata.order_id !== orderId) {
    return { ok: false, error: 'Payment intent order mismatch', status: 400 }
  }

  const paidAmountCents = typeof paymentIntent.amount === 'number' ? paymentIntent.amount : null
  if (paidAmountCents === null || paidAmountCents !== order.total_price) {
    console.error('Payment amount mismatch on confirm:', {
      orderId,
      expected: order.total_price,
      received: paidAmountCents,
    })
    return { ok: false, error: 'Payment amount mismatch', status: 400 }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'new',
      stripe_payment_intent_id: paymentIntentId,
      payment_provider: 'stripe',
    })
    .eq('id', orderId)
    .eq('status', 'pending_payment')

  if (updateError) {
    console.error('Error updating order on Stripe confirm:', updateError)
    return { ok: false, error: 'Failed to update order', status: 500 }
  }

  return { ok: true, orderId, paymentIntentId, alreadyPaid: false }
}
