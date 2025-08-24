"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MenuItem } from '../types/restaurant';
import { 
  CartItem, 
  CartContextType, 
  SerializableCart,
  CartUtils
} from '../types/cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'digital-menu-cart';
const CART_STORAGE_VERSION = '1.0';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carrega o carrinho do localStorage na inicialização
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart: SerializableCart = JSON.parse(savedCart);
        
        // Verificar se é uma versão compatível e não muito antiga (7 dias)
        const isRecentCart = Date.now() - parsedCart.timestamp < 7 * 24 * 60 * 60 * 1000;
        
        if (parsedCart.items && isRecentCart) {
          const cartItems = parsedCart.items.map(CartUtils.serializableToItem);
          setItems(cartItems);
        } else {
          // Limpar carrinho antigo ou incompatível
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar carrinho do localStorage:', error);
      // Em caso de erro, limpar localStorage
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Salva o carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      if (items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        const serializableCart: SerializableCart = {
          items: items.map(CartUtils.itemToSerializable),
          timestamp: Date.now(),
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializableCart));
      }
    } catch (error) {
      console.warn('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [items, isInitialized]);

  // Calcula totais dinamicamente
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const addItem = useCallback((dish: MenuItem, selectedComplements: Map<string, Set<string>>) => {
    const unitPrice = CartUtils.calculateUnitPrice(dish, selectedComplements);
    const itemId = CartUtils.generateItemId(dish, selectedComplements);

    setItems(prevItems => {
      // Verificar se já existe um item idêntico
      const existingItemIndex = prevItems.findIndex(item => 
        CartUtils.areItemsIdentical(item.dish, item.selectedComplements, dish, selectedComplements)
      );

      if (existingItemIndex >= 0) {
        // Item já existe - aumentar quantidade
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: unitPrice * newQuantity,
        };
        
        return updatedItems;
      } else {
        // Novo item - adicionar ao carrinho
        const newItem: CartItem = {
          id: itemId,
          dish,
          selectedComplements: new Map(selectedComplements),
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
        };
        
        return [...prevItems, newItem];
      }
    });

    // Feedback visual opcional - pode ser usado para mostrar animação
    console.log(`Item adicionado ao carrinho: ${dish.name}`);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
        }
        return item;
      })
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setIsCartOpen(false);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  // Funcionalidades adicionais para melhor UX
  const incrementQuantity = useCallback((itemId: string) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  }, []);

  const decrementQuantity = useCallback((itemId: string) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity - 1);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  }, []);

  // Context value
  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isCartOpen,
    openCart,
    closeCart,
  };

  // Adicionar funcionalidades extras ao contexto se necessário
  const extendedValue = {
    ...value,
    incrementQuantity,
    decrementQuantity,
    isInitialized,
  };

  return (
    <CartContext.Provider value={extendedValue as CartContextType}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Hook adicional para funcionalidades estendidas
export function useCartExtended() {
  const context = useContext(CartContext) as any;
  if (context === undefined) {
    throw new Error('useCartExtended must be used within a CartProvider');
  }
  return {
    ...context,
    incrementQuantity: context.incrementQuantity,
    decrementQuantity: context.decrementQuantity,
    isInitialized: context.isInitialized,
  };
}
