"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
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
    Sentry.startSpan(
      {
        op: 'cart.load',
        name: 'Load cart from localStorage',
      },
      (span) => {
        try {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (savedCart) {
            const parsedCart: SerializableCart = JSON.parse(savedCart);
            
            // Verificar se é uma versão compatível e não muito antiga (7 dias)
            const isRecentCart = Date.now() - parsedCart.timestamp < 7 * 24 * 60 * 60 * 1000;
            
            if (parsedCart.items && isRecentCart) {
              const cartItems = parsedCart.items.map(CartUtils.serializableToItem);
              setItems(cartItems);
              span.setAttribute('items_count', cartItems.length);
              span.setAttribute('cart_age_days', Math.floor((Date.now() - parsedCart.timestamp) / (24 * 60 * 60 * 1000)));
            } else {
              // Limpar carrinho antigo ou incompatível
              localStorage.removeItem(CART_STORAGE_KEY);
              span.setAttribute('cart_cleared', 'incompatible_or_old');
            }
          } else {
            span.setAttribute('cart_found', false);
          }
          span.setStatus('ok');
        } catch (error) {
          console.warn('Erro ao carregar carrinho do localStorage:', error);
          Sentry.captureException(error, {
            tags: { component: 'CartProvider', action: 'load_cart' },
            extra: { storageKey: CART_STORAGE_KEY }
          });
          // Em caso de erro, limpar localStorage
          localStorage.removeItem(CART_STORAGE_KEY);
          span.setStatus('internal_error');
          span.recordException(error as Error);
        } finally {
          setIsInitialized(true);
        }
      }
    );
  }, []);

  // Salva o carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      if (items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        // Verificar se CartUtils está disponível e tem os métodos necessários
        if (!CartUtils || typeof CartUtils.itemToSerializable !== 'function') {
          console.error('CartUtils não está disponível ou não tem o método itemToSerializable');
          return;
        }
        
        const serializableCart: SerializableCart = {
          items: items.map(item => {
            try {
              return CartUtils.itemToSerializable(item);
            } catch (itemError) {
              console.error('Erro ao serializar item:', item, itemError);
              // Retornar um item básico em caso de erro
              return {
                id: item.id,
                dish: item.dish,
                selectedComplements: [],
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              };
            }
          }),
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
    return Sentry.startSpan(
      {
        op: 'cart.add_item',
        name: `Add item: ${dish.name}`,
        attributes: {
          dish_id: dish.id,
          dish_name: dish.name,
          dish_price: dish.price,
          complements_count: selectedComplements.size,
        }
      },
      (span) => {
        try {
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
        span.setStatus('ok');
        span.setAttribute('action', 'item_added');
        } catch (error) {
          Sentry.captureException(error, {
            tags: { component: 'CartProvider', action: 'add_item' },
            extra: { dishId: dish.id, dishName: dish.name }
          });
          span.setStatus('internal_error');
          span.recordException(error as Error);
          throw error;
        }
      }
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    return Sentry.startSpan(
      {
        op: 'cart.remove_item',
        name: 'Remove item from cart',
        attributes: { item_id: itemId }
      },
      (span) => {
        try {
          setItems(prevItems => {
            const itemToRemove = prevItems.find(item => item.id === itemId);
            if (itemToRemove) {
              span.setAttribute('item_name', itemToRemove.dish.name);
              span.setAttribute('item_quantity', itemToRemove.quantity);
            }
            return prevItems.filter(item => item.id !== itemId);
          });
          span.setStatus('ok');
        } catch (error) {
          Sentry.captureException(error, {
            tags: { component: 'CartProvider', action: 'remove_item' },
            extra: { itemId }
          });
          span.setStatus('internal_error');
          span.recordException(error as Error);
          throw error;
        }
      }
    );
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
    return Sentry.startSpan(
      {
        op: 'cart.clear',
        name: 'Clear cart',
      },
      (span) => {
        try {
          const itemsCount = items.length;
          const totalValue = totalPrice;
          
          setItems([]);
          setIsCartOpen(false);
          
          span.setAttribute('items_cleared', itemsCount);
          span.setAttribute('total_value_cleared', totalValue);
          span.setStatus('ok');
        } catch (error) {
          Sentry.captureException(error, {
            tags: { component: 'CartProvider', action: 'clear_cart' }
          });
          span.setStatus('internal_error');
          span.recordException(error as Error);
          throw error;
        }
      }
    );
  }, [items.length, totalPrice]);

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
