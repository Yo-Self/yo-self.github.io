
/**
 * InfinitePay PIX Checkout Service
 *
 * Communicates with Supabase Edge Function `infinitepay-checkout`.
 * Only used when restaurant has pix_payment_enabled = true.
 */

import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config';

const supabaseUrl = getSupabaseUrl();
const supabasePublishableKey = getSupabasePublishableKey();

export interface CreateInfinitePayCheckoutParams {
  orderId: string;
  restaurantId: string;
  accessToken: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface InfinitePayCheckoutResponse {
  checkout_url: string;
  slug?: string | null;
}

export async function createInfinitePayCheckout(
  params: CreateInfinitePayCheckoutParams,
): Promise<InfinitePayCheckoutResponse> {
  if (!supabaseUrl) {
    throw new Error('Supabase URL não configurada.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/infinitepay-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabasePublishableKey}`,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      access_token: params.accessToken,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', details: '' }));
    const errMsg = errorData.details
      ? `${errorData.error} (${errorData.details})`
      : (errorData.error || `Erro ao criar link PIX (${response.status})`);
    throw new Error(errMsg);
  }

  const data: InfinitePayCheckoutResponse = await response.json();

  if (!data.checkout_url) {
    throw new Error('URL de checkout PIX não retornada pelo servidor.');
  }

  return data;
}
