
import { supabase as clientSupabase } from '@/lib/supabase/client';
import { confirmStripePayment } from './stripeService';

export interface CustomerOrderStatus {
  status: string;
  restaurant_name: string;
  delivery_type?: string;
  is_paid: boolean;
}

export function isPaidOrderStatus(status: string): boolean {
  return status !== 'pending_payment' && status !== 'cancelled';
}

export async function fetchCustomerOrderStatus(
  orderId: string,
  accessToken: string
): Promise<CustomerOrderStatus | null> {
  if (!clientSupabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await clientSupabase.rpc('get_customer_order_status', {
    p_order_id: orderId,
    p_access_token: accessToken,
  });

  if (error) {
    throw error;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const row = data as Record<string, unknown>;
  const status = String(row.status ?? 'pending');
  return {
    status,
    restaurant_name: String(row.restaurant_name ?? 'Restaurante'),
    delivery_type: row.delivery_type ? String(row.delivery_type) : undefined,
    is_paid: row.is_paid === true || isPaidOrderStatus(status),
  };
}

export async function waitForCustomerOrderPayment(
  orderId: string,
  accessToken: string,
  options?: { maxAttempts?: number; intervalMs?: number; stripeSessionId?: string }
): Promise<CustomerOrderStatus | null> {
  const maxAttempts = options?.maxAttempts ?? 15;
  const intervalMs = options?.intervalMs ?? 2000;
  const stripeSessionId = options?.stripeSessionId;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt === 0 || attempt % 3 === 0) {
      try {
        await confirmStripePayment(orderId, accessToken, stripeSessionId);
      } catch (err) {
        console.warn('Stripe payment confirmation attempt failed:', err);
      }
    }

    const status = await fetchCustomerOrderStatus(orderId, accessToken);
    if (!status) {
      return null;
    }
    if (status.is_paid) {
      return status;
    }
    if (status.status === 'cancelled') {
      return status;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return fetchCustomerOrderStatus(orderId, accessToken);
}

export async function cancelCustomerOrder(
  orderId: string,
  accessToken: string
): Promise<boolean> {
  if (!clientSupabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await clientSupabase.rpc('cancel_customer_order', {
    p_order_id: orderId,
    p_access_token: accessToken,
  });

  if (error) {
    throw error;
  }

  return data === true;
}
