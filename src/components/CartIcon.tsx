"use client";

import React from 'react';
import { useCart } from '../hooks/useCart';

interface CartIconProps {
  className?: string;
  size?: number;
}

export default function CartIcon({ className = "w-6 h-6", size }: CartIconProps) {
  const sizeProps = size ? { width: size, height: size } : {};
  
  return (
    <img
      {...sizeProps}
      className={className}
      src="/order.svg"
      alt="order"
      aria-hidden="true"
    />
  );
}

// Componente específico para o header
export function CartIconHeader() {
  const { totalItems, isEmpty, openCart } = useCart();
  
  // Não renderiza se o carrinho estiver vazio
  if (isEmpty) {
    return null;
  }
  return (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors duration-200 shadow-lg"
      aria-label={`Carrinho com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
      title="Abrir carrinho"
    >
      <CartIcon className="w-5 h-5 text-white" />
      
      {/* Badge com contador */}
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white animate-bounce">
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </button>
  );
}