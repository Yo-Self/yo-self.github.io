"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';
import { usePathname } from 'next/navigation';
import { useCustomerCoordinates } from '../hooks/useCustomerCoordinates';
import { useCustomerData } from '../hooks/useCustomerData';
import { calculateDeliveryFeeAndCoverage } from '../utils/deliveryCalculator';

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
  const { totalPrice, totalItems, formattedTotalPrice, isEmpty } = useCart();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  const pathname = usePathname();
  const isDeliveryRoute = pathname ? pathname.startsWith('/delivery') : true;
  const isActuallyDelivery = isDeliveryRoute && deliveryMode === 'delivery';
  const isActuallyRetirada = isDeliveryRoute && deliveryMode === 'retirada';
  const { customerCoordinates } = useCustomerCoordinates();
  const { customerData } = useCustomerData();

  const deliveryCalc = React.useMemo(() => {
    if (!isActuallyDelivery || !restaurant) return { covered: true, fee: 0, reason: undefined };
    return calculateDeliveryFeeAndCoverage(restaurant, customerCoordinates?.coordinates || null);
  }, [isActuallyDelivery, restaurant, customerCoordinates?.coordinates]);

  const deliveryFee = deliveryCalc.fee / 100;
  const deliveryCovered = deliveryCalc.covered;
  const isDeliveryOutsideCoverage = isActuallyDelivery && !deliveryCovered && deliveryCalc.reason !== 'waiting_location';

  const isMinOrderNotMet = isActuallyDelivery && restaurant?.min_order_value && totalPrice < restaurant.min_order_value && restaurant?.open !== false;

  const { initiateCheckout, isLoading, error } = useStripeCheckout({
    restaurantId,
    deliveryMode,
    onError: (err) => {
      // Error is already tracked in the hook, just show alert
      alert(`Erro no pagamento: ${err.message}`);
    },
  });

  const handleCheckoutClick = () => {
    if (isActuallyDelivery) {
      if (!customerData.name?.trim()) {
        alert('Por favor, informe seu Nome antes de continuar com o pagamento.');
        return;
      }
      if (!customerData.address?.trim()) {
        alert('Por favor, informe seu Endereço antes de continuar com o pagamento.');
        return;
      }
      if (!customerData.number?.trim()) {
        alert('Por favor, informe o Número do endereço antes de continuar com o pagamento.');
        return;
      }
      if (!customerData.whatsapp?.trim()) {
        alert('Por favor, informe seu Telefone antes de continuar com o pagamento.');
        return;
      }
    } else {
      if (!customerData.name?.trim()) {
        alert('Por favor, informe seu Nome antes de continuar com o pagamento.');
        return;
      }
      if (!customerData.whatsapp?.trim()) {
        alert('Por favor, informe seu Telefone antes de continuar com o pagamento.');
        return;
      }
    }
    
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

  const isCustomerDataValid = isActuallyDelivery 
    ? (!!customerData.name?.trim() && !!customerData.address?.trim() && !!customerData.number?.trim() && !!customerData.whatsapp?.trim())
    : (!!customerData.name?.trim() && !!customerData.whatsapp?.trim());

  const isNativelyDisabled = isLoading || isEmpty || isLoadingRestaurant || !restaurant || isMinOrderNotMet || isDeliveryOutsideCoverage || (isActuallyDelivery && deliveryCalc.reason === 'waiting_location');

  return (
    <button
      onClick={handleCheckoutClick}
      disabled={isNativelyDisabled}
      className={`
        w-full flex items-center justify-center gap-1.5 sm:gap-3 
        px-2 sm:px-6 py-3.5 sm:py-4 
        font-semibold rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200 
        transform hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-violet-300
        disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50
        ${isNativelyDisabled 
          ? 'bg-gray-300 text-gray-500 border border-transparent' 
          : (!isCustomerDataValid 
              ? 'bg-gray-300 text-gray-600 border border-transparent'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white')
        }
        ${className}
      `}
      aria-label={`Pagar pedido com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} via cartão`}
    >
      {/* Credit Card Icon */}
      <svg 
        className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" 
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

      {/* Button Text */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs sm:text-base font-bold whitespace-normal sm:whitespace-nowrap leading-tight">
          {isLoading 
            ? 'Processando...' 
            : isDeliveryOutsideCoverage 
              ? 'Sem Cobertura' 
              : (isActuallyDelivery && deliveryCalc.reason === 'waiting_location') 
                ? 'Informe o Endereço' 
                : 'Pagar com cartão'}
        </span>
        <span className="text-xs opacity-90 truncate hidden sm:block">
          {isDeliveryOutsideCoverage
            ? 'Endereço fora da área de entrega'
            : (isActuallyDelivery && deliveryCalc.reason === 'waiting_location')
              ? 'Preencha os dados acima'
              : `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} • R$ ${isActuallyDelivery && deliveryCovered ? totalPriceWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : formattedTotalPrice}`}
        </span>
      </div>

      {/* Arrow Icon */}
      <svg 
        className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 hidden sm:block" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M14 5l7 7m0 0l-7 7m7-7H3" 
        />
      </svg>

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
