"use client";

import { useState, useCallback } from 'react';
import { useCart } from './useCart';
import { useCustomerData } from './useCustomerData';
import { useRestaurantBySlug } from './useRestaurantBySlug';
import { useCustomerCoordinates } from './useCustomerCoordinates';
import { calculateDeliveryFeeAndCoverage, NON_DELIVERY_DELIVERY_CALC } from '../utils/deliveryCalculator';
import { assertDeliveryReadyForCheckout } from '../utils/deliveryCheckoutGuard';
import { createOrderWithIdempotency } from '../utils/checkoutIdempotency';
import { useCheckoutLock } from '../context/CheckoutContext';
import { createInfinitePayCheckout } from '../services/infinitepayService';
import { Order, OrderItem } from '../types/order';
import { CartUtils } from '../types/cart';
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
  const { isCheckoutInProgress, withCheckoutLock } = useCheckoutLock();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePixCheckout = useCallback(async () => {
    if (isEmpty || isLoading || isLoadingRestaurant || isCheckoutInProgress) return;

    if (!restaurant?.id) {
      const msg = 'Restaurante não encontrado. Recarregue a página.';
      setError(msg);
      onError?.(new Error(msg));
      return;
    }

    await withCheckoutLock(async () => {
    setIsLoading(true);
    setError(null);
    const tableId = typeof window !== 'undefined' ? localStorage.getItem('table_id') : null;

    try {
      const isDeliveryRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/delivery');
      const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
      const isActuallyRetirada = isDeliveryRoute && deliveryMode === 'retirada';
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

      const itemsToCreate: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = items.map(item =>
        CartUtils.mapItemToOrderPayload(item)
      );

      const { order: newOrder, reusedExisting } = await createOrderWithIdempotency(
        orderToCreate,
        itemsToCreate,
        {
          restaurantId: restaurant.id,
          items,
          customerPhone: customerData.whatsapp,
          tableId,
          orderType: orderToCreate.order_type,
          deliveryCoordsLat: orderToCreate.delivery_coords_lat,
          deliveryCoordsLng: orderToCreate.delivery_coords_lng,
        },
      );

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

      Analytics.trackPaymentOrderCreated({ ...paymentCtx, orderId: newOrder.id, reusedExisting });

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
      if (errorMessage.includes('Muitos pedidos em pouco tempo')) {
        Analytics.trackOrderRateLimited(restaurant.id, tableId);
      }
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
    }, 'infinitepay_pix');
  }, [
    isEmpty,
    isLoading,
    isLoadingRestaurant,
    isCheckoutInProgress,
    withCheckoutLock,
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
