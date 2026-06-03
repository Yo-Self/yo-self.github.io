"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'active_order_ids_string';
const TOKENS_KEY = 'order_access_tokens';

function readTokenMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeTokenMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(map));
}

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

  const getOrderAccessToken = useCallback((orderId: string): string | null => {
    const map = readTokenMap();
    return map[orderId] || null;
  }, []);

  const addActiveOrderId = (orderId: string, accessToken?: string) => {
    if (typeof window === 'undefined') return;
    const currentIds = loadActiveOrders();
    if (!currentIds.includes(orderId)) {
      const newIds = [...currentIds, orderId];
      localStorage.setItem(STORAGE_KEY, newIds.join(','));
      setActiveOrderIds(newIds);
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    }
    if (accessToken) {
      const map = readTokenMap();
      map[orderId] = accessToken;
      writeTokenMap(map);
    }
  };

  const removeActiveOrderId = (orderId: string) => {
    if (typeof window === 'undefined') return;
    const currentIds = loadActiveOrders();
    const newIds = currentIds.filter(id => id !== orderId);
    localStorage.setItem(STORAGE_KEY, newIds.join(','));
    setActiveOrderIds(newIds);

    const map = readTokenMap();
    delete map[orderId];
    writeTokenMap(map);

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  return { activeOrderIds, addActiveOrderId, removeActiveOrderId, getOrderAccessToken };
}
