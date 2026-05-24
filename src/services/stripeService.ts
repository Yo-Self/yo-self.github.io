
/**
 * Stripe Checkout Service
 * 
 * Communicates with the Supabase Edge Function `stripe-checkout`
 * to create Stripe Checkout Sessions for cart payments.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export interface CheckoutItem {
  name: string;
  description?: string;
  quantity: number;
  price_cents: number; // Price in centavos (BRL)
}

export interface CreateCheckoutSessionParams {
  orderId: string;
  restaurantId: string;
  items: CheckoutItem[];
  customerName?: string;
  customerPhone?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Creates a Stripe Checkout Session via the Supabase Edge Function.
 * Returns the checkout URL to redirect the user to.
 */
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
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      items: params.items,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ao criar sessão de pagamento (${response.status})`);
  }

  const data: CheckoutSessionResponse = await response.json();

  if (!data.checkout_url) {
    throw new Error('URL de checkout não retornada pelo servidor.');
  }

  return data;
}
