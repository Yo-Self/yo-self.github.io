"use client";

import { useContext, useCallback, useMemo } from 'react';
import { useCart as useCartContext, useCartExtended } from '../context/CartContext';
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

    // Funcionalidades utilitárias
    getItem,
    isItemInCart,
    getItemQuantity,
  };
}

/**
 * Hook estendido com funcionalidades avançadas
 */
export function useCartAdvanced() {
  const basicCart = useCart();
  const extendedContext = useCartExtended();

  // Funcionalidades de incremento/decremento
  const incrementQuantity = useCallback((itemId: string) => {
    extendedContext.incrementQuantity(itemId);
  }, [extendedContext]);

  const decrementQuantity = useCallback((itemId: string) => {
    extendedContext.decrementQuantity(itemId);
  }, [extendedContext]);

  // Adicionar item com quantidade específica
  const addItemWithQuantity = useCallback((
    dish: MenuItem, 
    selectedComplements: Map<string, Set<string>>, 
    quantity: number = 1
  ) => {
    for (let i = 0; i < quantity; i++) {
      basicCart.addItem(dish, selectedComplements);
    }
  }, [basicCart]);

  // Obter valor total de uma categoria específica
  const getTotalByCategory = useCallback((category: string): number => {
    return basicCart.items
      .filter(item => item.dish.category === category || item.dish.categories.includes(category))
      .reduce((total, item) => total + item.totalPrice, 0);
  }, [basicCart.items]);

  // Obter items por categoria
  const getItemsByCategory = useCallback((category: string): CartItem[] => {
    return basicCart.items.filter(item => 
      item.dish.category === category || item.dish.categories.includes(category)
    );
  }, [basicCart.items]);

  // Limpar carrinho com confirmação
  const clearCartWithConfirmation = useCallback((confirmMessage?: string): boolean => {
    const message = confirmMessage || 'Tem certeza que deseja limpar o carrinho?';
    if (window.confirm(message)) {
      basicCart.clearCart();
      return true;
    }
    return false;
  }, [basicCart]);

  // Análise de complementos mais populares
  const getComplementsAnalysis = useCallback(() => {
    const complementsCount = new Map<string, number>();
    
    basicCart.items.forEach(item => {
      item.selectedComplements.forEach((complements) => {
        complements.forEach(complement => {
          complementsCount.set(complement, (complementsCount.get(complement) || 0) + item.quantity);
        });
      });
    });

    return Array.from(complementsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 complementos
  }, [basicCart.items]);

  return {
    ...basicCart,
    
    // Funcionalidades estendidas
    isInitialized: extendedContext.isInitialized,
    incrementQuantity,
    decrementQuantity,
    addItemWithQuantity,
    
    // Análises e filtros
    getTotalByCategory,
    getItemsByCategory,
    getComplementsAnalysis,
    
    // Utilitários
    clearCartWithConfirmation,
  };
}

/**
 * Hook específico para animações e feedback visual
 */
export function useCartAnimations() {
  const cart = useCart();

  // Estado para animações de adição
  const [isAdding, setIsAdding] = React.useState(false);
  const [lastAddedItem, setLastAddedItem] = React.useState<string | null>(null);

  const addItemWithAnimation = useCallback(async (
    dish: MenuItem, 
    selectedComplements: Map<string, Set<string>>
  ) => {
    setIsAdding(true);
    cart.addItem(dish, selectedComplements);
    setLastAddedItem(dish.name);
    
    // Reset animation state after delay
    setTimeout(() => {
      setIsAdding(false);
      setLastAddedItem(null);
    }, 1000);
  }, [cart]);

  return {
    ...cart,
    isAdding,
    lastAddedItem,
    addItemWithAnimation,
  };
}

// Re-exportar para compatibilidade
export { useCart as default };

// Import React para useCartAnimations
import React from 'react';
