"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { usePathname } from 'next/navigation';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { useCustomerData } from '../hooks/useCustomerData';
import { calculateDeliveryFeeAndCoverage } from '../utils/deliveryCalculator';
import { assertDeliveryReadyForCheckout } from '../utils/deliveryCheckoutGuard';
import {
  getCustomerFormValidationError,
  isCustomerFormComplete,
  resolveCustomerFormMode,
} from '../utils/customerFormValidation';
import { useRestaurantTablePayment } from '../hooks/useRestaurantTablePayment';
import {
  checkoutActionButtonMinHeightClass,
  checkoutActionButtonPaddingClass,
  checkoutActionContentClass,
  checkoutActionIconClass,
  checkoutActionLabelClass,
  checkoutActionLabelWrapMobileClass,
  checkoutActionSubtitleClass,
  checkoutActionTextColumnClass,
} from './cart/checkoutButtonLayout';
import Analytics from '../lib/analytics';
import { paymentContextFromCart } from '../lib/paymentAnalytics';
import { useCheckoutLock } from '../context/CheckoutContext';
import { trackPaymentFormValidationFailed } from '../lib/trackPaymentButtonValidation';

interface StripeCheckoutButtonProps {
  restaurantId?: string;
  className?: string;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
}

export default function StripeCheckoutButton({
  restaurantId = "default",
  className = "",
  deliveryMode,
}: StripeCheckoutButtonProps) {
  const { items, totalPrice, totalItems, formattedTotalPrice, isEmpty } = useCart();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const pathname = usePathname();
  const isDeliveryRoute = pathname ? pathname.startsWith('/delivery') : true;
  const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
  const { customerCoordinates } = useCustomerCoordinates();
  const { customerData } = useCustomerData();
  const { tablePayment: dbTablePayment } = useRestaurantTablePayment(restaurantId);
  const tablePayment = isDeliveryRoute ? false : dbTablePayment;
  const customerFormMode = resolveCustomerFormMode({
    isDeliveryRoute,
    deliveryMode,
    tablePayment,
  });
  const isCustomerDataValid = isCustomerFormComplete(customerFormMode, customerData, {
    hasCoordinates: !!customerCoordinates?.coordinates,
  });

  const deliveryCalc = React.useMemo(() => {
    if (!isActuallyDelivery || !restaurant) return { covered: true, fee: 0, reason: undefined };
    return calculateDeliveryFeeAndCoverage(restaurant, customerCoordinates?.coordinates || null);
  }, [isActuallyDelivery, restaurant, customerCoordinates?.coordinates]);

  const deliveryFee = deliveryCalc.fee / 100;
  const deliveryCovered = deliveryCalc.covered;
  const isDeliveryOutsideCoverage = isActuallyDelivery && !deliveryCovered && deliveryCalc.reason !== 'missing_coordinates';

  const isMinOrderNotMet = isActuallyDelivery && restaurant?.min_order_value && totalPrice < restaurant.min_order_value && restaurant?.open !== false;

  const { isCheckoutInProgress } = useCheckoutLock();

  const { initiateCheckout, isLoading, error } = useStripeCheckout({
    restaurantId,
    deliveryMode,
    onError: (err) => {
      // Error is already tracked in the hook, just show alert
      alert(`Erro no pagamento: ${err.message}`);
    },
  });

  const handleCheckoutClick = () => {
    if (!restaurant) return;

    const fail = (field: string, message: string) => {
      trackPaymentFormValidationFailed({
        restaurant,
        items,
        totalPrice,
        paymentMethod: 'stripe_card',
        validationField: field,
        deliveryMode,
        isDeliveryRoute,
        customerData,
      });
      alert(message);
    };

    const formError = getCustomerFormValidationError(customerFormMode, customerData, {
      hasCoordinates: !!customerCoordinates?.coordinates,
    });
    if (formError) {
      fail(formError.field, formError.message);
      return;
    }

    if (isActuallyDelivery) {
      try {
        assertDeliveryReadyForCheckout({
          isDelivery: isActuallyDelivery,
          coordinates: customerCoordinates?.coordinates,
          deliveryCalc,
        });
      } catch (err) {
        fail('delivery_coordinates', err instanceof Error ? err.message : 'Endereço de entrega inválido.');
        return;
      }
    }

    const totalWithShipping = totalPrice + (isActuallyDelivery && deliveryCovered ? deliveryFee : 0);
    Analytics.trackPaymentMethodClicked(
      paymentContextFromCart({
        restaurant,
        items,
        subtotalValue: totalPrice,
        totalValue: totalWithShipping,
        paymentMethod: 'stripe_card',
        deliveryMode,
        isDeliveryRoute,
        deliveryFeeCents: isActuallyDelivery && deliveryCovered ? deliveryCalc.fee : 0,
        deliveryCovered,
        deliveryReason: deliveryCalc.reason,
        customerData,
      }),
    );

    initiateCheckout();
  };

  // Don't render if cart is empty
  if (isEmpty) {
    return null;
  }

  // Don't render while still loading restaurant info
  if (isLoadingRestaurant) {
    return null;
  }

  const totalPriceWithShipping = totalPrice + (isActuallyDelivery && deliveryCovered ? deliveryFee : 0);

  const isNativelyDisabled = isLoading || isEmpty || isLoadingRestaurant || !restaurant || isMinOrderNotMet || isDeliveryOutsideCoverage || (isActuallyDelivery && !deliveryCovered) || isCheckoutInProgress || !isCustomerDataValid;

  return (
    <button
      onClick={handleCheckoutClick}
      disabled={isNativelyDisabled}
      className={`
        relative w-full min-w-0 flex items-center justify-center
        ${checkoutActionButtonMinHeightClass}
        ${checkoutActionButtonPaddingClass}
        font-semibold rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200 
        transform hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-violet-300
        disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50
        ${isNativelyDisabled 
          ? 'bg-gray-300 text-gray-500 border border-transparent' 
          : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
        }
        ${className}
      `}
      aria-label={`Pagar pedido com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} via cartão`}
    >
      <span className={checkoutActionContentClass}>
        <svg
          className={checkoutActionIconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>

        <span className={checkoutActionTextColumnClass}>
          <span className={`${checkoutActionLabelClass} ${checkoutActionLabelWrapMobileClass}`}>
            {isLoading
              ? 'Processando...'
              : isDeliveryOutsideCoverage
                ? 'Sem Cobertura'
                : (isActuallyDelivery && deliveryCalc.reason === 'waiting_location')
                  ? 'Informe o Endereço'
                  : 'Pagar com cartão'}
          </span>
          <span className={checkoutActionSubtitleClass}>
            {isDeliveryOutsideCoverage
              ? 'Endereço fora da área de entrega'
              : (isActuallyDelivery && deliveryCalc.reason === 'waiting_location')
                ? 'Preencha os dados acima'
                : `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} • R$ ${isActuallyDelivery && deliveryCovered ? totalPriceWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : formattedTotalPrice}`}
          </span>
        </span>
      </span>

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-violet-700/50 rounded-xl">
          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
