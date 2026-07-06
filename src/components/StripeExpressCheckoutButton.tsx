"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  loadStripe,
  Stripe,
  StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../hooks/useCart';
import { useCustomerData } from '../hooks/useCustomerData';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { calculateDeliveryFeeAndCoverage, NON_DELIVERY_DELIVERY_CALC } from '../utils/deliveryCalculator';
import { assertDeliveryReadyForCheckout } from '../utils/deliveryCheckoutGuard';
import { createOrderWithIdempotency } from '../utils/checkoutIdempotency';
import { useCheckoutLock } from '../context/CheckoutContext';
import { createExpressPaymentIntent } from '../services/stripeService';
import { Order, OrderItem } from '../types/order';
import { CartUtils } from '../types/cart';
import Analytics from '../lib/analytics';
import { paymentContextFromCart } from '../lib/paymentAnalytics';
import { trackPaymentFormValidationFailed } from '../lib/trackPaymentButtonValidation';
import { usePathname } from 'next/navigation';
import { useActiveOrders } from '../hooks/useActiveOrders';
import {
  checkoutActionButtonMinHeightClass,
  checkoutExpressWalletButtonHeightPx,
} from './cart/checkoutButtonLayout';

interface StripeExpressCheckoutButtonProps {
  restaurantId?: string;
  className?: string;
  /** Informa o pai quando Apple Pay / Google Pay ficam visíveis (para ajustar largura do botão de cartão). */
  onWalletAvailabilityChange?: (visible: boolean) => void;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
}

const isDev = process.env.NODE_ENV === 'development';

// Singleton instances to avoid re-loading Stripe
let stripePromise: Promise<Stripe | null> | null = null;
let currentStripeAccount: string | null = null;

const getStripe = (stripeAccount?: string) => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('Stripe publishable key is missing');
    return null;
  }

  if (!stripePromise || currentStripeAccount !== (stripeAccount || null)) {
    currentStripeAccount = stripeAccount || null;
    stripePromise = loadStripe(publishableKey, stripeAccount ? { stripeAccount } : undefined);
  }

  return stripePromise;
};

type AvailablePaymentMethods =
  StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent['paymentMethods'];

function isWalletPayAvailable(methods: AvailablePaymentMethods): boolean {
  return (
    methods?.applePay?.available === true ||
    methods?.googlePay?.available === true
  );
}

const ExpressCheckoutInner = ({
  restaurantId,
  onAvailabilityChange,
  isMinOrderNotMet,
  minOrderMessage,
  isDeliveryRoute,
  deliveryMode,
}: {
  restaurantId: string;
  onAvailabilityChange: (available: boolean, methods: AvailablePaymentMethods) => void;
  isMinOrderNotMet: boolean;
  minOrderMessage: string;
  isDeliveryRoute: boolean;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalPrice, isEmpty } = useCart();
  const { customerData } = useCustomerData();
  const { customerCoordinates } = useCustomerCoordinates();
  const { restaurant } = useRestaurantBySlug(restaurantId);
  const { addActiveOrderId } = useActiveOrders();
  const { acquireCheckoutLock, releaseCheckoutLock } = useCheckoutLock();
  const confirmInFlightRef = React.useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
  const isActuallyRetirada = isDeliveryRoute && deliveryMode === 'retirada';

  const handleConfirm = useCallback(async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements || !restaurant) {
      return;
    }

    if (confirmInFlightRef.current) {
      event.paymentFailed({ message: 'Pagamento já em processamento.' });
      return;
    }

    if (!acquireCheckoutLock('stripe_express')) {
      event.paymentFailed({ message: 'Outro checkout está em andamento.' });
      return;
    }

    confirmInFlightRef.current = true;

    if (isMinOrderNotMet) {
      releaseCheckoutLock();
      confirmInFlightRef.current = false;
      event.paymentFailed({ message: minOrderMessage });
      return;
    }

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        const message = submitError.message || 'Erro ao validar os detalhes do pagamento';
        setErrorMessage(message);
        event.paymentFailed({ message });
        return;
      }

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
        delivery_address: fullDeliveryAddress ?? null,
        delivery_coords_lat: isActuallyDelivery && customerCoordinates?.coordinates ? customerCoordinates.coordinates.latitude : null,
        delivery_coords_lng: isActuallyDelivery && customerCoordinates?.coordinates ? customerCoordinates.coordinates.longitude : null,
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
      addActiveOrderId(newOrder.id, newOrder.customer_access_token, restaurant.id);

      const paymentCtx = paymentContextFromCart({
        restaurant,
        items,
        subtotalValue: totalPrice,
        totalValue: totalPrice,
        paymentMethod: 'stripe_express',
        deliveryMode,
        isDeliveryRoute,
        tableId,
        customerData,
      });

      Analytics.trackPaymentOrderCreated({ ...paymentCtx, orderId: newOrder.id, reusedExisting });

      const piResponse = await createExpressPaymentIntent({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
        accessToken: newOrder.customer_access_token!,
        customerName: customerData.name,
        customerPhone: customerData.whatsapp,
      });

      Analytics.trackPaymentCheckoutSessionCreated({
        ...paymentCtx,
        orderId: newOrder.id,
        sessionId: undefined,
      });

      const currentUrl = window.location.href.split('?')[0];
      const tokenParam = newOrder.customer_access_token
        ? `&order_token=${newOrder.customer_access_token}`
        : '';
      const returnUrl = `${currentUrl}?payment_success=true&payment_method=stripe_express&order_id=${newOrder.id}${tokenParam}`;

      Analytics.trackPaymentRedirectStarted({ ...paymentCtx, orderId: newOrder.id });

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: piResponse.payment_intent_client_secret,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        const message = error.message || 'Erro ao processar pagamento';
        setErrorMessage(message);
        Analytics.trackPaymentFailed({
          ...paymentContextFromCart({
            restaurant,
            items,
            subtotalValue: totalPrice,
            totalValue: totalPrice,
            paymentMethod: 'stripe_express',
            deliveryMode,
            isDeliveryRoute,
            tableId,
            customerData,
          }),
          orderId: newOrder.id,
          errorMessage: message,
        });
        event.paymentFailed({ message });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno ao processar';
      console.error('Express Checkout Error:', err);
      setErrorMessage(message);
      if (restaurant) {
        Analytics.trackPaymentFailed({
          ...paymentContextFromCart({
            restaurant,
            items,
            subtotalValue: totalPrice,
            totalValue: totalPrice,
            paymentMethod: 'stripe_express',
            deliveryMode,
            isDeliveryRoute,
            tableId: typeof window !== 'undefined' ? localStorage.getItem('table_id') : null,
            customerData,
          }),
          errorMessage: message,
        });
      }
      event.paymentFailed({ message });
    } finally {
      releaseCheckoutLock();
      confirmInFlightRef.current = false;
    }
  }, [
    stripe,
    elements,
    restaurant,
    items,
    totalPrice,
    customerData,
    isMinOrderNotMet,
    minOrderMessage,
    isDeliveryRoute,
    isActuallyDelivery,
    isActuallyRetirada,
    deliveryMode,
    customerCoordinates,
    addActiveOrderId,
    acquireCheckoutLock,
    releaseCheckoutLock,
  ]);

  if (isEmpty) return null;
    
  const isCustomerDataValid = isActuallyDelivery 
    ? (!!customerData.name?.trim() && !!customerData.address?.trim() && !!customerData.number?.trim() && !!customerData.whatsapp?.trim())
    : (!!customerData.name?.trim() && !!customerData.whatsapp?.trim());

  return (
    <div className={`w-full flex flex-col justify-center transition-all duration-200 ${checkoutActionButtonMinHeightClass} ${!isCustomerDataValid ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      <ExpressCheckoutElement
        onClick={({ resolve }) => {
          if (!restaurant) return;

          const tableId = typeof window !== 'undefined' ? localStorage.getItem('table_id') : null;
          const expressCtx = paymentContextFromCart({
            restaurant,
            items,
            subtotalValue: totalPrice,
            totalValue: totalPrice,
            paymentMethod: 'stripe_express',
            deliveryMode,
            isDeliveryRoute,
            tableId,
            customerData,
          });

          const throwError = (field: string, msg: string) => {
            trackPaymentFormValidationFailed({
              restaurant,
              items,
              totalPrice,
              paymentMethod: 'stripe_express',
              validationField: field,
              deliveryMode,
              isDeliveryRoute,
              customerData,
            });
            alert(msg);
            resolve({
              applePay: { error: { message: msg } },
              googlePay: { error: { message: msg } },
            } as any);
          };

          if (isActuallyDelivery) {
            if (!customerData.name?.trim()) {
              return throwError('customer_name', 'Por favor, informe seu Nome antes de continuar com o pagamento.');
            }
            if (!customerData.address?.trim()) {
              return throwError('customer_address', 'Por favor, informe seu Endereço antes de continuar com o pagamento.');
            }
            if (!customerData.number?.trim()) {
              return throwError('customer_number', 'Por favor, informe o Número do endereço antes de continuar com o pagamento.');
            }
            if (!customerData.whatsapp?.trim()) {
              return throwError('customer_phone', 'Por favor, informe seu Telefone antes de continuar com o pagamento.');
            }
          } else {
            if (!customerData.name?.trim()) {
              return throwError('customer_name', 'Por favor, informe seu Nome antes de continuar com o pagamento.');
            }
            if (!customerData.whatsapp?.trim()) {
              return throwError('customer_phone', 'Por favor, informe seu Telefone antes de continuar com o pagamento.');
            }
          }

          Analytics.trackPaymentMethodClicked(expressCtx);
          resolve();
        }}
        onConfirm={handleConfirm}
        onAvailablePaymentMethodsChange={(event) => {
          const walletAvailable = isWalletPayAvailable(event.paymentMethods) && !isMinOrderNotMet;
          onAvailabilityChange(walletAvailable, event.paymentMethods);
          if (restaurant) {
            Analytics.trackPaymentWalletAvailability({
              ...paymentContextFromCart({
                restaurant,
                items,
                subtotalValue: totalPrice,
                totalValue: totalPrice,
                paymentMethod: 'stripe_express',
                deliveryMode,
                isDeliveryRoute,
                tableId: typeof window !== 'undefined' ? localStorage.getItem('table_id') : null,
                customerData,
              }),
              available: walletAvailable,
              walletApplePay: event.paymentMethods?.applePay?.available === true,
              walletGooglePay: event.paymentMethods?.googlePay?.available === true,
            });
          }
        }}
        options={{
          paymentMethods: {
            // 'auto' mostra o botão com o cartão principal quando o cliente já tem carteira ativa
            applePay: 'auto',
            googlePay: 'auto',
            link: 'never',
            amazonPay: 'never',
            paypal: 'never',
          },
          buttonType: {
            applePay: 'plain',
            googlePay: 'plain',
          },
          buttonTheme: {
            applePay: 'black',
            googlePay: 'black',
          },
          buttonHeight: checkoutExpressWalletButtonHeightPx,
          layout: {
            maxColumns: 1,
            maxRows: 1,
          },
        }}
      />
      {errorMessage && (
        <p className="text-red-500 text-xs mt-1 text-center" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default function StripeExpressCheckoutButton({
  restaurantId = "default",
  className = "",
  onWalletAvailabilityChange,
  deliveryMode,
}: StripeExpressCheckoutButtonProps) {
  const { totalPrice, isEmpty } = useCart();
  const { restaurant, isLoading } = useRestaurantBySlug(restaurantId);
  const pathname = usePathname();
  const isDeliveryRoute = pathname?.startsWith('/delivery') || false;
  const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
  const minOrderValue = restaurant?.min_order_value || 0;
  const isMinOrderNotMet = isActuallyDelivery && totalPrice < minOrderValue && restaurant?.open !== false;
  const minOrderMessage =
    minOrderValue > 0
      ? `O pedido mínimo para delivery é de R$ ${minOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      : 'Pedido mínimo não atingido.';

  const [stripePromiseObj, setStripePromiseObj] = useState<Promise<Stripe | null> | null>(null);
  const [walletPayAvailable, setWalletPayAvailable] = useState<boolean | null>(null);
  const [debugMethods, setDebugMethods] = useState<AvailablePaymentMethods>(undefined);

  const amountCents = Math.round(totalPrice * 100);

  useEffect(() => {
    if (!isLoading && restaurant) {
      setStripePromiseObj(getStripe(restaurant.stripe_connect_id));
    }
  }, [isLoading, restaurant, restaurant?.stripe_connect_id]);

  useEffect(() => {
    if (isMinOrderNotMet) {
      setWalletPayAvailable(false);
      onWalletAvailabilityChange?.(false);
    }
  }, [isMinOrderNotMet, onWalletAvailabilityChange]);

  const handleAvailabilityChange = useCallback((available: boolean, methods: AvailablePaymentMethods) => {
    const effectiveAvailable = available && !isMinOrderNotMet;
    setWalletPayAvailable(effectiveAvailable);
    onWalletAvailabilityChange?.(effectiveAvailable);
    if (isDev) {
      setDebugMethods(methods);
    }
  }, [isMinOrderNotMet, onWalletAvailabilityChange]);

  if (isEmpty || isLoading || !restaurant || !stripePromiseObj) {
    return null;
  }

  if (isMinOrderNotMet) {
    return null;
  }

  if (walletPayAvailable === false) {
    return null;
  }

  const isVisible = walletPayAvailable === true;

  return (
    <div
      className={`flex h-full w-full min-w-0 flex-col ${checkoutActionButtonMinHeightClass} ${isVisible ? className : 'hidden'}`}
      aria-hidden={!isVisible}
    >
      <Elements
        stripe={stripePromiseObj}
        options={{
          mode: 'payment',
          amount: amountCents > 0 ? amountCents : 100,
          currency: 'brl',
        }}
      >
        <ExpressCheckoutInner
          restaurantId={restaurantId}
          onAvailabilityChange={handleAvailabilityChange}
          isMinOrderNotMet={isMinOrderNotMet}
          minOrderMessage={minOrderMessage}
          isDeliveryRoute={isDeliveryRoute}
          deliveryMode={deliveryMode}
        />
      </Elements>
    </div>
  );
}
