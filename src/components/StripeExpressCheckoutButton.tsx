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
import { createOrder } from '../services/orderService';
import { createExpressPaymentIntent } from '../services/stripeService';
import { Order, OrderItem } from '../types/order';
import { CartUtils } from '../types/cart';
import Analytics from '../lib/analytics';

interface StripeExpressCheckoutButtonProps {
  restaurantId?: string;
  className?: string;
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

function isApplePayAvailable(methods: AvailablePaymentMethods): boolean {
  return methods?.applePay?.available === true;
}

const ExpressCheckoutInner = ({
  restaurantId,
  onAvailabilityChange,
}: {
  restaurantId: string;
  onAvailabilityChange: (available: boolean, methods: AvailablePaymentMethods) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalPrice, isEmpty } = useCart();
  const { customerData } = useCustomerData();
  const { restaurant } = useRestaurantBySlug(restaurantId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = useCallback(async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements || !restaurant) {
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

      const isDeliveryRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/delivery');
      const tableId = typeof window !== 'undefined' ? localStorage.getItem('table_id') : null;

      const orderToCreate: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        restaurant_id: restaurant.id,
        table_name: !isDeliveryRoute && tableId ? `Mesa ${tableId}` : undefined,
        customer_info: {
          name: customerData.name || (!isDeliveryRoute && tableId ? `Cliente Mesa ${tableId}` : undefined),
          phone: customerData.whatsapp,
          delivery_type: isDeliveryRoute ? 'delivery' : 'dine_in',
          address: isDeliveryRoute ? (customerData.address || null) : (tableId ? `Mesa ${tableId}` : null),
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

      const checkoutItems = items.map(item => {
        const unitPriceCents = Math.round(CartUtils.calculateUnitPrice(item.dish, item.selectedComplements) * 100);
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

      const piResponse = await createExpressPaymentIntent({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
        items: checkoutItems,
        customerName: customerData.name,
        customerPhone: customerData.whatsapp,
      });

      Analytics.trackCartCheckout(items, totalPrice, restaurant.id, 'stripe_express');

      const currentUrl = window.location.href.split('?')[0];
      const returnUrl = `${currentUrl}?payment_success=true&order_id=${newOrder.id}`;

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
        event.paymentFailed({ message });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno ao processar';
      console.error('Express Checkout Error:', err);
      setErrorMessage(message);
      event.paymentFailed({ message });
    }
  }, [stripe, elements, restaurant, items, totalPrice, customerData]);

  if (isEmpty) return null;

  return (
    <div className="h-full min-h-[52px] w-full flex flex-col justify-center">
      <ExpressCheckoutElement
        onConfirm={handleConfirm}
        onAvailablePaymentMethodsChange={(event) => {
          onAvailabilityChange(isApplePayAvailable(event.paymentMethods), event.paymentMethods);
        }}
        options={{
          paymentMethods: {
            // 'auto' mostra o botão com o cartão principal quando o cliente já tem Apple Pay ativo
            applePay: 'auto',
            googlePay: 'never',
            link: 'never',
            amazonPay: 'never',
            paypal: 'never',
          },
          buttonType: {
            applePay: 'plain',
          },
          buttonTheme: {
            applePay: 'black',
          },
          buttonHeight: 52,
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
}: StripeExpressCheckoutButtonProps) {
  const { totalPrice, isEmpty } = useCart();
  const { restaurant, isLoading } = useRestaurantBySlug(restaurantId);
  const [stripePromiseObj, setStripePromiseObj] = useState<Promise<Stripe | null> | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState<boolean | null>(null);
  const [debugMethods, setDebugMethods] = useState<AvailablePaymentMethods>(undefined);

  const amountCents = Math.round(totalPrice * 100);

  useEffect(() => {
    if (!isLoading && restaurant) {
      setStripePromiseObj(getStripe(restaurant.stripe_connect_id));
    }
  }, [isLoading, restaurant, restaurant?.stripe_connect_id]);

  const handleAvailabilityChange = useCallback((available: boolean, methods: AvailablePaymentMethods) => {
    setApplePayAvailable(available);
    if (isDev) {
      setDebugMethods(methods);
    }
  }, []);

  if (isEmpty || isLoading || !restaurant || !stripePromiseObj) {
    return null;
  }

  if (isDev && applePayAvailable === false) {
    return (
      <div className={`text-[10px] text-gray-400 font-mono p-2 border border-dashed rounded-lg ${className}`}>
        Apple Pay indisponível: {JSON.stringify(debugMethods)}
      </div>
    );
  }

  if (applePayAvailable === false) {
    return null;
  }

  const isVisible = applePayAvailable === true;

  return (
    <div
      className={`flex flex-col min-w-0 ${isVisible ? className : 'hidden'}`}
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
        />
      </Elements>
    </div>
  );
}
