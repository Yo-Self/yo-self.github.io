"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MenuItem } from '../types/restaurant';
import { 
  CartItem, 
  CartContextType, 
  SerializableCarts,
  RestaurantCart,
  CartUtils
} from '../types/cart';
import Analytics from '../lib/analytics';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CARTS_STORAGE_KEY = 'digital-menu-carts';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [allCarts, setAllCarts] = useState<{[restaurantId: string]: RestaurantCart}>({});
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedCarts = localStorage.getItem(CARTS_STORAGE_KEY);
      if (savedCarts) {
        const parsedCarts: SerializableCarts = JSON.parse(savedCarts);
        const loadedCarts: {[restaurantId: string]: RestaurantCart} = {};
        for (const restaurantId in parsedCarts) {
          const serializableCart = parsedCarts[restaurantId];
          const items = serializableCart.items.map(CartUtils.serializableToItem);
          loadedCarts[restaurantId] = {
            items,
            totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
          };
        }
        setAllCarts(loadedCarts);
      }
    } catch (error) {
      console.warn('Error loading carts from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const serializableCarts: SerializableCarts = {};
      for (const restaurantId in allCarts) {
        const cart = allCarts[restaurantId];
        serializableCarts[restaurantId] = {
          items: cart.items.map(CartUtils.itemToSerializable),
        };
      }
      localStorage.setItem(CARTS_STORAGE_KEY, JSON.stringify(serializableCarts));
    } catch (error) {
      console.warn('Error saving carts to localStorage:', error);
    }
  }, [allCarts, isInitialized]);

  const currentCart = currentRestaurantId ? allCarts[currentRestaurantId] || { items: [], totalItems: 0, totalPrice: 0 } : { items: [], totalItems: 0, totalPrice: 0 };

  const setCurrentRestaurant = useCallback((restaurantId: string) => {
    setCurrentRestaurantId(restaurantId);
  }, []);

  const updateCart = (restaurantId: string, newCart: RestaurantCart) => {
    const newAllCarts = { ...allCarts, [restaurantId]: newCart };
    newAllCarts[restaurantId] = {
      ...newCart,
      totalItems: newCart.items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newCart.items.reduce((sum, item) => sum + item.totalPrice, 0),
    };
    setAllCarts(newAllCarts);
  };

  const addItem = useCallback((dish: MenuItem, selectedComplements: Map<string, Set<string>>) => {
    if (!currentRestaurantId) return;

    const unitPrice = CartUtils.calculateUnitPrice(dish, selectedComplements);
    const itemId = CartUtils.generateItemId(dish, selectedComplements);
    
    const cart = allCarts[currentRestaurantId] || { items: [], totalItems: 0, totalPrice: 0 };
    const newItems = [...cart.items];
    const existingItemIndex = newItems.findIndex(item => item.id === itemId);

    if (existingItemIndex >= 0) {
      const existingItem = newItems[existingItemIndex];
      const newQuantity = existingItem.quantity + 1;
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: unitPrice * newQuantity,
      };
      Analytics.trackCartQuantityChanged(existingItem, existingItem.quantity, newQuantity, currentRestaurantId);
    } else {
      const newItem: CartItem = {
        id: itemId,
        dish,
        selectedComplements: new Map(selectedComplements),
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
      };
      newItems.push(newItem);
      Analytics.trackCartItemAdded(dish, selectedComplements, 1, currentRestaurantId);
    }
    updateCart(currentRestaurantId, { ...cart, items: newItems });
  }, [currentRestaurantId, allCarts]);

  const removeItem = useCallback((itemId: string) => {
    if (!currentRestaurantId) return;
    const cart = allCarts[currentRestaurantId];
    if (!cart) return;

    const itemToRemove = cart.items.find(item => item.id === itemId);
    if (itemToRemove) {
      Analytics.trackCartItemRemoved(itemToRemove, currentRestaurantId);
    }
    const newItems = cart.items.filter(item => item.id !== itemId);
    updateCart(currentRestaurantId, { ...cart, items: newItems });
  }, [currentRestaurantId, allCarts]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (!currentRestaurantId) return;
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const cart = allCarts[currentRestaurantId];
    if (!cart) return;

    const newItems = cart.items.map(item => {
      if (item.id === itemId) {
        Analytics.trackCartQuantityChanged(item, item.quantity, quantity, currentRestaurantId);
        return {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity,
        };
      }
      return item;
    });
    updateCart(currentRestaurantId, { ...cart, items: newItems });
  }, [currentRestaurantId, allCarts, removeItem]);

  const clearCart = useCallback(() => {
    if (!currentRestaurantId) return;
    const cart = allCarts[currentRestaurantId];
    if (cart) {
      Analytics.trackCartCleared(cart.items.length, cart.totalPrice, currentRestaurantId);
    }
    updateCart(currentRestaurantId, { items: [], totalItems: 0, totalPrice: 0 });
    setIsCartOpen(false);
  }, [currentRestaurantId, allCarts]);

  const openCart = useCallback(() => {
    if (currentRestaurantId) {
      Analytics.trackCartOpened(currentCart.totalItems, currentCart.totalPrice, currentRestaurantId);
    }
    setIsCartOpen(true);
  }, [currentRestaurantId, currentCart]);

  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value: CartContextType = {
    items: currentCart.items,
    totalItems: currentCart.totalItems,
    totalPrice: currentCart.totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isCartOpen,
    openCart,
    closeCart,
    setCurrentRestaurant,
    cartRestaurantId: currentRestaurantId,
  };

  return (
    <CartContext.Provider value={value}>
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
