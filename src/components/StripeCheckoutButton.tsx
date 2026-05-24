"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useRestaurantBySlug } from '../hooks/useRestaurantBySlug';

interface StripeCheckoutButtonProps {
  restaurantId?: string;
  className?: string;
}

export default function StripeCheckoutButton({
  restaurantId = "default",
  className = "",
}: StripeCheckoutButtonProps) {
  const { totalItems, formattedTotalPrice, isEmpty } = useCart();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(restaurantId);
  
  const { initiateCheckout, isLoading, error } = useStripeCheckout({
    restaurantId,
    onError: (err) => {
      // Error is already tracked in the hook, just show alert
      alert(`Erro no pagamento: ${err.message}`);
    },
  });

  // Don't render if cart is empty
  if (isEmpty) {
    return null;
  }

  // Don't render while still loading restaurant info
  if (isLoadingRestaurant) {
    return null;
  }

  return (
    <button
      onClick={initiateCheckout}
      disabled={isLoading || isEmpty || isLoadingRestaurant || !restaurant}
      className={`
        w-full flex items-center justify-center gap-2 sm:gap-3 
        px-3 sm:px-6 py-3.5 sm:py-4 
        bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700
        text-white font-semibold 
        rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200 
        transform hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-violet-300
        disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50
        ${className}
      `}
      aria-label={`Pagar pedido com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} via cartão`}
    >
      {/* Credit Card Icon */}
      <svg 
        className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" 
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
        <span className="text-base sm:text-lg font-bold whitespace-nowrap">
          {isLoading ? 'Processando...' : 'Pagar Agora'}
        </span>
        <span className="text-xs opacity-90 truncate hidden sm:block">
          {`${totalItems} ${totalItems === 1 ? 'item' : 'itens'} • R$ ${formattedTotalPrice}`}
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
