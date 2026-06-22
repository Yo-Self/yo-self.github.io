
/**
 * Stripe Checkout Service
 * 
 * Communicates with the Supabase Edge Function `stripe-checkout`
 * to create Stripe Checkout Sessions for cart payments.
 */

import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config';

const supabaseUrl = getSupabaseUrl();
const supabasePublishableKey = getSupabasePublishableKey();

export interface CreateCheckoutSessionParams {
  orderId: string;
  restaurantId: string;
  customerName?: string;
  customerPhone?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export async function confirmStripePayment(
  orderId: string,
  accessToken: string,
  sessionId?: string,
): Promise<{ confirmed: boolean; already_paid: boolean }> {
  if (!supabaseUrl) {
    throw new Error('Supabase URL não configurada.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabasePublishableKey}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      confirm_payment: true,
      access_token: accessToken,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  });

  if (response.status === 409) {
    return { confirmed: false, already_paid: false };
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ao confirmar pagamento (${response.status})`);
  }

  const data = await response.json();
  return {
    confirmed: data.confirmed === true,
    already_paid: data.already_paid === true,
  };
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  if (!supabaseUrl) {
    throw new Error('Supabase URL não configurada.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabasePublishableKey}`,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', details: '' }));
    const errMsg = errorData.details 
      ? `${errorData.error} (${errorData.details})`
      : (errorData.error || `Erro ao criar sessão de pagamento (${response.status})`);
    throw new Error(errMsg);
  }

  const data: CheckoutSessionResponse = await response.json();

  if (!data.checkout_url) {
    throw new Error('URL de checkout não retornada pelo servidor.');
  }

  return data;
}

export interface ExpressPaymentIntentResponse {
  payment_intent_client_secret: string;
}

export interface CreateExpressPaymentIntentParams {
  orderId: string;
  restaurantId: string;
  customerName?: string;
  customerPhone?: string;
}

export async function createExpressPaymentIntent(
  params: CreateExpressPaymentIntentParams
): Promise<ExpressPaymentIntentResponse> {
  if (!supabaseUrl) {
    throw new Error('Supabase URL não configurada.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabasePublishableKey}`,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      is_express_checkout: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', details: '' }));
    const errMsg = errorData.details 
      ? `${errorData.error} (${errorData.details})`
      : (errorData.error || `Erro ao criar payment intent (${response.status})`);
    throw new Error(errMsg);
  }

  const data: ExpressPaymentIntentResponse = await response.json();

  if (!data.payment_intent_client_secret) {
    throw new Error('Client secret não retornado pelo servidor.');
  }

  return data;
}
