"use client";

import { useState, useCallback } from 'react';
import { useCart } from './useCart';
import { useCustomerData } from './useCustomerData';
import { useRestaurantBySlug } from './useRestaurantBySlug';
import { useCustomerCoordinates } from './useCustomerCoordinates';
import { calculateDeliveryFeeAndCoverage, NON_DELIVERY_DELIVERY_CALC } from '../utils/deliveryCalculator';
import { buildFullDeliveryAddress } from '../utils/deliveryAddress';
import { assertDeliveryReadyForCheckout } from '../utils/deliveryCheckoutGuard';
import {
  getCustomerFormValidationError,
  resolveCustomerFormMode,
} from '../utils/customerFormValidation';
import { createOrderWithIdempotency } from '../utils/checkoutIdempotency';
import { useCheckoutLock } from '../context/CheckoutContext';
import { createCheckoutSession } from '../services/stripeService';
import { Order, OrderItem } from '../types/order';
import { CartUtils } from '../types/cart';
import Analytics from '../lib/analytics';
import { paymentContextFromCart } from '../lib/paymentAnalytics';
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
  const { isCheckoutInProgress, withCheckoutLock } = useCheckoutLock();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(async () => {
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
      const customerFormMode = resolveCustomerFormMode({
        isDeliveryRoute,
        deliveryMode,
      });
      const formError = getCustomerFormValidationError(customerFormMode, customerData, {
        hasCoordinates: !!customerCoordinates?.coordinates,
      });
      if (formError) {
        throw new Error(formError.message);
      }

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
        ? buildFullDeliveryAddress(customerData.address, customerData.number, customerData.complement)
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
        paymentMethod: 'stripe_card',
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
      const successUrl = `${currentUrl}?payment_success=true&payment_method=stripe_card&order_id=${newOrder.id}${tokenParam}`;
      const cancelUrl = `${currentUrl}?payment_cancelled=true&payment_method=stripe_card&order_id=${newOrder.id}${tokenParam}`;

      addActiveOrderId(newOrder.id, newOrder.customer_access_token, restaurant.id);

      const session = await createCheckoutSession({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
        accessToken: newOrder.customer_access_token!,
        customerName: customerData.name,
        customerPhone: customerData.whatsapp,
        successUrl,
        cancelUrl,
      });

      Analytics.trackPaymentCheckoutSessionCreated({
        ...paymentCtx,
        orderId: newOrder.id,
        sessionId: session.session_id,
      });

      Analytics.trackPaymentRedirectStarted({ ...paymentCtx, orderId: newOrder.id });

      window.location.href = session.checkout_url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar pagamento.';
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
            paymentMethod: 'stripe_card',
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
        component: 'useStripeCheckout',
        action: 'initiate_checkout',
        restaurantId: restaurant?.id,
        itemCount: items.length,
        totalPrice,
        payment_method: 'stripe_card',
      });
    } finally {
      setIsLoading(false);
    }
    }, 'stripe_card');
  }, [isEmpty, isLoading, isLoadingRestaurant, isCheckoutInProgress, withCheckoutLock, restaurant, customerData, items, totalPrice, customerCoordinates, onError, deliveryMode, addActiveOrderId]);

  return { initiateCheckout, isLoading, error };
}
