"use client";

import { useState, useCallback } from 'react';
import { useCart } from './useCart';
import { useCustomerData } from './useCustomerData';
import { useRestaurantBySlug } from './useRestaurantBySlug';
import { useCustomerCoordinates } from './useCustomerCoordinates';
import { calculateDeliveryFeeAndCoverage } from '../utils/deliveryCalculator';
import { createOrder } from '../services/orderService';
import { createCheckoutSession } from '../services/stripeService';
import { Order, OrderItem } from '../types/order';
import Analytics from '../lib/analytics';
import { useActiveOrders } from './useActiveOrders';

interface UseStripeCheckoutOptions {
  restaurantId: string;
  onError?: (error: Error) => void;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
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
  onError,
  deliveryMode
}: UseStripeCheckoutOptions): UseStripeCheckoutReturn {
  const { items, totalPrice, isEmpty } = useCart();
  const { customerData } = useCustomerData();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const { customerCoordinates } = useCustomerCoordinates();
  const { addActiveOrderId } = useActiveOrders();
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
      const isDeliveryRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/delivery');
      const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
      const isActuallyRetirada = isDeliveryRoute && deliveryMode === 'retirada';
      const tableId = typeof window !== 'undefined' ? localStorage.getItem('table_id') : null;

      const deliveryCalc = isActuallyDelivery
        ? calculateDeliveryFeeAndCoverage(restaurant, customerCoordinates?.coordinates || null)
        : { covered: true, fee: 0, reason: undefined, distanceKm: null };

      if (isActuallyDelivery && !deliveryCalc.covered) {
        throw new Error(
          deliveryCalc.reason === 'exclusion_zone'
            ? `Endereço indisponível para entrega na região: ${deliveryCalc.zoneName}`
            : deliveryCalc.reason === 'waiting_location'
              ? 'Por favor, informe seu endereço de entrega antes de pagar.'
              : `Endereço fora da área de entrega do restaurante (limite de ${restaurant.delivery_max_distance || 10} km).`
        );
      }

      const deliveryFee = deliveryCalc.fee / 100;
      const fullDeliveryAddress = isActuallyDelivery 
        ? `${customerData.address || ''}${customerData.number ? ', ' + customerData.number : ''}${customerData.complement ? ' - ' + customerData.complement : ''}`
        : undefined;

      const isRetirada = isActuallyRetirada || (!isDeliveryRoute && tableId === 'retirada');
      const orderToCreate: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        restaurant_id: restaurant.id,
        table_name: isActuallyRetirada ? 'Retirada' : (!isDeliveryRoute && tableId ? (isRetirada ? 'Retirada' : `Mesa ${tableId}`) : undefined),
        customer_info: {
          name: customerData.name || (!isDeliveryRoute && tableId ? (isRetirada ? 'Cliente Retirada' : `Cliente Mesa ${tableId}`) : undefined),
          phone: customerData.whatsapp,
          delivery_type: isActuallyDelivery ? 'delivery' : (isRetirada ? 'takeout' : 'dine_in'),
          address: isActuallyDelivery ? (customerData.address || null) : (tableId ? (isRetirada ? 'Retirada' : `Mesa ${tableId}`) : null),
        },
        total_price: Math.round((totalPrice + (isActuallyDelivery && deliveryCalc.covered ? deliveryFee : 0)) * 100),
        status: 'pending_payment',
        order_type: isActuallyDelivery ? 'delivery' : (isRetirada ? 'pickup' : 'dine_in'),
        delivery_fee: isActuallyDelivery && deliveryCalc.covered ? deliveryCalc.fee : 0,
        delivery_distance: isActuallyDelivery && deliveryCalc.covered ? deliveryCalc.distanceKm : null,
        delivery_address: fullDeliveryAddress,
        delivery_coords_lat: isActuallyDelivery && customerCoordinates.coordinates ? customerCoordinates.coordinates.latitude : null,
        delivery_coords_lng: isActuallyDelivery && customerCoordinates.coordinates ? customerCoordinates.coordinates.longitude : null,
        delivery_address_details: isActuallyDelivery ? {
          street: customerData.address,
          number: customerData.number,
          complement: customerData.complement
        } : null,
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

      const currentUrl = window.location.href.split('?')[0];
      const tokenParam = newOrder.customer_access_token
        ? `&order_token=${newOrder.customer_access_token}`
        : '';
      const successUrl = `${currentUrl}?payment_success=true&order_id=${newOrder.id}${tokenParam}`;
      const cancelUrl = `${currentUrl}?payment_cancelled=true&order_id=${newOrder.id}${tokenParam}`;

      addActiveOrderId(newOrder.id, newOrder.customer_access_token);

      const session = await createCheckoutSession({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
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
  }, [isEmpty, isLoading, isLoadingRestaurant, restaurant, customerData, items, totalPrice, customerCoordinates, onError, deliveryMode, addActiveOrderId]);

  return { initiateCheckout, isLoading, error };
}
