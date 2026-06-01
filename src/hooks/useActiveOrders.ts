"use client";

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'active_order_ids_string';

export function useActiveOrders() {
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>([]);

  const loadActiveOrders = () => {
    if (typeof window === 'undefined') return [];
    const currentString = localStorage.getItem(STORAGE_KEY) || '';
    return currentString.split(',').filter(id => id.trim() !== '');
  };

  useEffect(() => {
    setActiveOrderIds(loadActiveOrders());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setActiveOrderIds(loadActiveOrders());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addActiveOrderId = (orderId: string) => {
    if (typeof window === 'undefined') return;
    const currentIds = loadActiveOrders();
    if (!currentIds.includes(orderId)) {
      const newIds = [...currentIds, orderId];
      localStorage.setItem(STORAGE_KEY, newIds.join(','));
      setActiveOrderIds(newIds);
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    }
  };

  const removeActiveOrderId = (orderId: string) => {
    if (typeof window === 'undefined') return;
    const currentIds = loadActiveOrders();
    const newIds = currentIds.filter(id => id !== orderId);
    localStorage.setItem(STORAGE_KEY, newIds.join(','));
    setActiveOrderIds(newIds);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  return { activeOrderIds, addActiveOrderId, removeActiveOrderId };
}
