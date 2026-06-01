"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe, Stripe, StripeError } from '@stripe/stripe-js';
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

// Singleton instances to avoid re-loading Stripe
let stripePromise: Promise<Stripe | null> | null = null;
let currentStripeAccount: string | null = null;

const getStripe = (stripeAccount?: string) => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('Stripe publishable key is missing');
    return null;
  }
  
  // Create a new instance if account changes or not initialized
  if (!stripePromise || currentStripeAccount !== (stripeAccount || null)) {
    currentStripeAccount = stripeAccount || null;
    stripePromise = loadStripe(publishableKey, stripeAccount ? { stripeAccount } : undefined);
  }
  
  return stripePromise;
};

// Inner component that actually uses the hooks from Elements
const ExpressCheckoutInner = ({ 
  restaurantId,
  onAvailabilityChange,
  setDebugInfo,
}: { 
  restaurantId: string;
  onAvailabilityChange: (isAvailable: boolean) => void;
  setDebugInfo: (info: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalPrice, isEmpty } = useCart();
  const { customerData } = useCustomerData();
  const { restaurant } = useRestaurantBySlug(restaurantId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = useCallback(async (event: any) => {
    if (!stripe || !elements || !restaurant) {
      event.resolve(); // Stop loading state
      return;
    }

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Erro ao validar os detalhes do pagamento');
        event.resolve({ type: 'error', error: submitError });
        return;
      }

      // 1. Create order in Supabase
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

      // 2. Format checkout items
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

      // 3. Create PaymentIntent via Edge Function
      const piResponse = await createExpressPaymentIntent({
        orderId: newOrder.id,
        restaurantId: restaurant.id,
        items: checkoutItems,
        customerName: customerData.name,
        customerPhone: customerData.whatsapp,
      });

      // 4. Track Analytics
      Analytics.trackCartCheckout(items, totalPrice, restaurant.id, 'stripe_express');

      const currentUrl = window.location.href.split('?')[0];
      const returnUrl = `${currentUrl}?payment_success=true&order_id=${newOrder.id}`;

      // 5. Confirm Payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: piResponse.payment_intent_client_secret,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Erro ao processar pagamento');
        event.resolve({ type: 'error', error });
      } else {
        // Redirection should happen automatically for web flows.
        event.resolve(); 
      }
    } catch (err: any) {
      console.error('Express Checkout Error:', err);
      setErrorMessage(err.message || 'Erro interno ao processar');
      event.resolve({ type: 'error', error: { message: err.message } as StripeError });
    }
  }, [stripe, elements, restaurant, items, totalPrice, customerData]);

  if (isEmpty) return null;

  const handleReady = (event: any) => {
    const { availablePaymentMethods, error } = event;
    const isAvailable = availablePaymentMethods && (availablePaymentMethods.applePay || availablePaymentMethods.googlePay || availablePaymentMethods.link);
    onAvailabilityChange(!!isAvailable);
    
    // Set debug info to help understand why it might not be showing
    if (error) {
      setDebugInfo(`Erro Stripe: ${error.message}`);
    } else if (!availablePaymentMethods) {
      setDebugInfo(`Stripe não retornou métodos. Evento: ${JSON.stringify(event)}`);
    } else {
      setDebugInfo(
        `Apple Pay: ${availablePaymentMethods.applePay ? '✅ Sim' : '❌ Não'} | ` +
        `Google Pay: ${availablePaymentMethods.googlePay ? '✅ Sim' : '❌ Não'} | ` +
        `Link: ${availablePaymentMethods.link ? '✅ Sim' : '❌ Não'}`
      );
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full min-h-[44px] overflow-hidden rounded-xl">
        <ExpressCheckoutElement 
          onConfirm={handleConfirm} 
          onReady={handleReady}
          onLoadError={({ error }: any) => setDebugInfo(`Erro Load: ${error?.message || 'Desconhecido'}`)}
          options={{
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
            buttonTheme: {
              applePay: 'white-outline',
            }
          }}
        />
      </div>
      {errorMessage && (
        <div className="text-red-500 text-xs mt-2 text-center">
          {errorMessage}
        </div>
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
  const [isAvailable, setIsAvailable] = useState<boolean>(false); // starts false (hidden) until ready
  const [debugInfo, setDebugInfo] = useState<string>("Verificando disponibilidade de carteiras digitais...");

  useEffect(() => {
    if (!isLoading && restaurant) {
      // Safely initialize stripe promise once we know the connect ID
      const promise = getStripe(restaurant.stripe_connect_id);
      setStripePromiseObj(promise);
    }
  }, [isLoading, restaurant, restaurant?.stripe_connect_id]);

  if (isEmpty || isLoading || !restaurant || !stripePromiseObj) {
    return null;
  }

  const amountCents = Math.round(totalPrice * 100);

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`${isAvailable ? 'w-full' : 'hidden'} flex items-center justify-center ${className}`}>
        <Elements 
          stripe={stripePromiseObj} 
          options={{ 
            mode: 'payment', 
            amount: amountCents > 0 ? amountCents : 100, // Amount must be > 0
            currency: 'brl',
          }}
        >
          <ExpressCheckoutInner 
            restaurantId={restaurantId} 
            onAvailabilityChange={setIsAvailable}
            setDebugInfo={setDebugInfo}
          />
        </Elements>
      </div>
      
      {/* Campo de debug para o logista ver o motivo da ocultação */}
      {!isAvailable && (
        <div className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono text-center">
          <strong>Debug Apple/Google Pay:</strong><br/>
          {debugInfo}<br/>
          <span className="text-gray-400 mt-1 block">
            Se Apple Pay for &quot;Não&quot;, verifique no Painel Stripe se o domínio foi registrado e se você tem um cartão configurado no Wallet.
          </span>
        </div>
      )}
    </div>
  );
}
