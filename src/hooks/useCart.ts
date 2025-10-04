"use client";

import { useContext, useCallback, useMemo } from 'react';
import { useCart as useCartContext } from '../context/CartContext';
import { MenuItem } from '../types/restaurant';
import { CartItem, CartUtils } from '../types/cart';

/**
 * Hook principal para interagir com o carrinho de compras
 * Inclui funcionalidades básicas e utilitárias
 */
export function useCart() {
  const context = useCartContext();
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  // Funcionalidades adicionais calculadas
  const isEmpty = context.items.length === 0;
  const hasItems = context.items.length > 0;
  
  // Formatação de preços
  const formattedTotalPrice = useMemo(() => 
    CartUtils.formatPrice(context.totalPrice), 
    [context.totalPrice]
  );

  // Buscar item específico por ID
  const getItem = useCallback((itemId: string): CartItem | undefined => {
    return context.items.find(item => item.id === itemId);
  }, [context.items]);

  // Verificar se um prato específico já está no carrinho
  const isItemInCart = useCallback((dish: MenuItem, selectedComplements: Map<string, Set<string>>): boolean => {
    return context.items.some(item => 
      CartUtils.areItemsIdentical(item.dish, item.selectedComplements, dish, selectedComplements)
    );
  }, [context.items]);

  // Obter quantidade de um item específico no carrinho
  const getItemQuantity = useCallback((dish: MenuItem, selectedComplements: Map<string, Set<string>>): number => {
    const item = context.items.find(item => 
      CartUtils.areItemsIdentical(item.dish, item.selectedComplements, dish, selectedComplements)
    );
    return item?.quantity || 0;
  }, [context.items]);

  // Incrementar quantidade de um item
  const incrementQuantity = useCallback((itemId: string) => {
    const item = context.items.find(i => i.id === itemId);
    if (item) {
      context.updateQuantity(itemId, item.quantity + 1);
    }
  }, [context.items, context.updateQuantity]);

  // Decrementar quantidade de um item
  const decrementQuantity = useCallback((itemId: string) => {
    const item = context.items.find(i => i.id === itemId);
    if (item) {
      if (item.quantity <= 1) {
        context.removeItem(itemId);
      } else {
        context.updateQuantity(itemId, item.quantity - 1);
      }
    }
  }, [context.items, context.updateQuantity, context.removeItem]);

  // Estatísticas do carrinho
  const stats = useMemo(() => ({
    totalItems: context.totalItems,
    uniqueItems: context.items.length,
    totalPrice: context.totalPrice,
    formattedTotalPrice,
    isEmpty,
    hasItems,
  }), [context.totalItems, context.items.length, context.totalPrice, formattedTotalPrice, isEmpty, hasItems]);

  return {
    // Estado básico
    items: context.items,
    totalItems: context.totalItems,
    totalPrice: context.totalPrice,
    formattedTotalPrice,
    isEmpty,
    hasItems,
    stats,

    // Modal do carrinho
    isCartOpen: context.isCartOpen,
    openCart: context.openCart,
    closeCart: context.closeCart,

    // Ações principais
    addItem: context.addItem,
    removeItem: context.removeItem,
    updateQuantity: context.updateQuantity,
    clearCart: context.clearCart,
    setCurrentRestaurant: context.setCurrentRestaurant,
    cartRestaurantId: context.cartRestaurantId,

    // Funcionalidades utilitárias
    getItem,
    isItemInCart,
    getItemQuantity,
    incrementQuantity,
    decrementQuantity,
  };
}

/**
 * Hook específico para animações e feedback visual
 */
export function useCartAnimations() {
  const cart = useCart();
  return { ...cart };
}

// Re-exportar para compatibilidade
export { useCart as default };