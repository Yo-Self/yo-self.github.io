"use client";

import { useState, useCallback } from 'react';
import { useCart } from './useCart';
import { useCustomerData } from './useCustomerData';
import { useRestaurantBySlug } from './useRestaurantBySlug';
import { useCustomerCoordinates } from './useCustomerCoordinates';
import { calculateDeliveryFeeAndCoverage, NON_DELIVERY_DELIVERY_CALC } from '../utils/deliveryCalculator';
import { assertDeliveryReadyForCheckout } from '../utils/deliveryCheckoutGuard';
import { createOrder } from '../services/orderService';
import { createInfinitePayCheckout } from '../services/infinitepayService';
import { Order, OrderItem } from '../types/order';
import Analytics from '../lib/analytics';
import { paymentContextFromCart } from '../lib/paymentAnalytics';
import { useActiveOrders } from './useActiveOrders';

interface UseInfinitePayCheckoutOptions {
  restaurantId: string;
  onError?: (error: Error) => void;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
}

interface UseInfinitePayCheckoutReturn {
  initiatePixCheckout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * PIX checkout via InfinitePay (opt-in per restaurant).
 * Mirrors useStripeCheckout without modifying the Stripe flow.
 */
export function useInfinitePayCheckout({
  restaurantId,
  onError,
  deliveryMode,
}: UseInfinitePayCheckoutOptions): UseInfinitePayCheckoutReturn {
  const { items, totalPrice, isEmpty } = useCart();
  const { customerData } = useCustomerData();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const { customerCoordinates } = useCustomerCoordinates();
  const { addActiveOrderId } = useActiveOrders();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePixCheckout = useCallback(async () => {
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
        : NON_DELIVERY_DELIVERY_CALC;

      assertDeliveryReadyForCheckout({
        isDelivery: isActuallyDelivery,
        coordinates: customerCoordinates?.coordinates,
        deliveryCalc,
      });

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
          complement: customerData.complement,
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
            }),
        ),
        sent_to_kitchen: item.dish.needs_preparation !== false,
      }));

      const newOrder = await createOrder(orderToCreate, itemsToCreate);

      const totalWithDelivery =
        totalPrice + (isActuallyDelivery && deliveryCalc.covered ? deliveryFee : 0);

      const paymentCtx = paymentContextFromCart({
        restaurant,
        items,
        subtotalValue: totalPrice,
        totalValue: totalWithDelivery,
        paymentMethod: 'infinitepay_pix',
        deliveryMode,
        isDeliveryRoute,
        deliveryFeeCents: isActuallyDelivery && deliveryCalc.covered ? deliveryCalc.fee : 0,
        deliveryCovered: deliveryCalc.covered,
        deliveryReason: deliveryCalc.reason,
        tableId,
        customerData,
      });

      Analytics.trackPaymentOrderCreated({ ...paymentCtx, orderId: newOrder.id });

      const currentUrl = window.location.href.split('?')[0];
      const tokenParam = newOrder.customer_access_token
        ? `&order_token=${newOrder.customer_access_token}`
        : '';
      const successUrl = `${currentUrl}?payment_success=true&payment_provider=infinitepay&payment_method=infinitepay_pix&capture_method=pix&order_id=${newOrder.id}${tokenParam}`;
      const cancelUrl = `${currentUrl}?payment_cancelled=true&payment_provider=infinitepay&payment_method=infinitepay_pix&order_id=${newOrder.id}${tokenParam}`;

      addActiveOrderId(newOrder.id, newOrder.customer_access_token, restaurant.id);

      const session = await createInfinitePayCheckout({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
        customerName: customerData.name,
        customerPhone: customerData.whatsapp,
        successUrl,
        cancelUrl,
      });

      Analytics.trackPaymentCheckoutSessionCreated({
        ...paymentCtx,
        orderId: newOrder.id,
        sessionId: session.slug ?? undefined,
      });

      Analytics.trackPaymentRedirectStarted({ ...paymentCtx, orderId: newOrder.id });

      window.location.href = session.checkout_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar pagamento PIX.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));

      if (restaurant?.id) {
        Analytics.trackPaymentFailed({
          ...paymentContextFromCart({
            restaurant,
            items,
            subtotalValue: totalPrice,
            totalValue: totalPrice,
            paymentMethod: 'infinitepay_pix',
            deliveryMode,
            isDeliveryRoute:
              typeof window !== 'undefined' &&
              window.location.pathname.startsWith('/delivery'),
            tableId: typeof window !== 'undefined' ? localStorage.getItem('table_id') : null,
            customerData,
          }),
          errorMessage,
        });
      }

      Analytics.trackError(err instanceof Error ? err : new Error(errorMessage), {
        component: 'useInfinitePayCheckout',
        action: 'initiate_pix_checkout',
        restaurantId: restaurant?.id,
        itemCount: items.length,
        totalPrice,
        payment_method: 'infinitepay_pix',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    isEmpty,
    isLoading,
    isLoadingRestaurant,
    restaurant,
    customerData,
    items,
    totalPrice,
    customerCoordinates,
    onError,
    deliveryMode,
    addActiveOrderId,
  ]);

  return { initiatePixCheckout, isLoading, error };
}
