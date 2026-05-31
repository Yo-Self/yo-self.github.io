"use client";

import { useState, useCallback } from 'react';
import { useCart } from './useCart';
import { useCustomerData } from './useCustomerData';
import { useRestaurantBySlug } from './useRestaurantBySlug';
import { CartUtils } from '../types/cart';
import { createOrder } from '../services/orderService';
import { createCheckoutSession, CheckoutItem } from '../services/stripeService';
import { Order, OrderItem } from '../types/order';
import Analytics from '../lib/analytics';

interface UseStripeCheckoutOptions {
  restaurantId: string;
  onError?: (error: Error) => void;
}

interface UseStripeCheckoutReturn {
  initiateCheckout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gerenciar o fluxo de checkout Stripe.
 * 
 * 1. Cria order no Supabase com status 'pending_payment'
 * 2. Chama Edge Function para criar Stripe Checkout Session
 * 3. Redireciona o usuário para a página do Stripe
 */
export function useStripeCheckout({ 
  restaurantId, 
  onError 
}: UseStripeCheckoutOptions): UseStripeCheckoutReturn {
  const { items, totalPrice, isEmpty } = useCart();
  const { customerData } = useCustomerData();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(async () => {
    if (isEmpty || isLoading || isLoadingRestaurant) return;

    if (!restaurant?.id) {
      const msg = 'Restaurante não encontrado. Recarregue a página.';
      setError(msg);
      onError?.(new Error(msg));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create order in Supabase with pending_payment status
      const orderToCreate: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        restaurant_id: restaurant.id,
        customer_info: {
          name: customerData.name,
          phone: customerData.whatsapp,
        },
        total_price: Math.round(totalPrice * 100),
        status: 'pending_payment',
      };

      const itemsToCreate: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = items.map(item => ({
        dish_id: item.dish.id,
        quantity: item.quantity,
        price_at_time_of_order: Math.round(parseFloat(item.dish.price.replace(',', '.')) * 100),
        selected_complements: Array.from(item.selectedComplements.entries()).flatMap(
          ([groupTitle, selections]) =>
            Array.from(selections).map(complementName => {
              const group = item.dish.complement_groups?.find(g => g.title === groupTitle);
              const complement = group?.complements.find(c => c.name === complementName);
              return {
                complement_id: complement?.id || 'unknown',
                name: complementName,
                price: Math.round(parseFloat(complement?.price.replace(',', '.') || '0') * 100),
              };
            })
        ),
        sent_to_kitchen: item.dish.needs_preparation !== false,
      }));

      const newOrder = await createOrder(orderToCreate, itemsToCreate);

      // 2. Build checkout items (including complements in the price)
      const checkoutItems: CheckoutItem[] = items.map(item => {
        const unitPriceCents = Math.round(CartUtils.calculateUnitPrice(item.dish, item.selectedComplements) * 100);
        
        // Build complement description
        const complementDesc = Array.from(item.selectedComplements.entries())
          .flatMap(([, selections]) => Array.from(selections))
          .join(', ');

        return {
          name: item.dish.name,
          description: complementDesc || item.dish.description?.substring(0, 100) || undefined,
          quantity: item.quantity,
          price_cents: unitPriceCents,
        };
      });

      // 3. Build success/cancel URLs
      const currentUrl = window.location.href.split('?')[0]; // Clean URL without query params
      const successUrl = `${currentUrl}?payment_success=true&order_id=${newOrder.id}`;
      const cancelUrl = `${currentUrl}?payment_cancelled=true&order_id=${newOrder.id}`;

      // 4. Create Stripe Checkout Session via Edge Function
      const session = await createCheckoutSession({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
        items: checkoutItems,
        customerName: customerData.name,
        customerPhone: customerData.whatsapp,
        successUrl,
        cancelUrl,
      });

      // 5. Track analytics
      Analytics.trackCartCheckout(items, totalPrice, restaurant.id, 'stripe');

      // 6. Redirect to Stripe Checkout
      window.location.href = session.checkout_url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar pagamento.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));

      Analytics.trackError(err instanceof Error ? err : new Error(errorMessage), {
        component: 'useStripeCheckout',
        action: 'initiate_checkout',
        restaurantId: restaurant?.id,
        itemCount: items.length,
        totalPrice,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEmpty, isLoading, isLoadingRestaurant, restaurant, customerData, items, totalPrice, onError]);

  return { initiateCheckout, isLoading, error };
}
