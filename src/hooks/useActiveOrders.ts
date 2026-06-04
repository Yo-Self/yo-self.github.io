"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'active_orders_v2';
const LEGACY_IDS_KEY = 'active_order_ids_string';
const TOKENS_KEY = 'order_access_tokens';

export type ActiveOrderEntry = {
  orderId: string;
  restaurantId: string;
};

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

function persistEntries(entries: ActiveOrderEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

function loadAllEntries(): ActiveOrderEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActiveOrderEntry[];
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (e) => typeof e?.orderId === 'string' && e.orderId.trim() !== '',
        );
      }
    }
  } catch {
    /* migrate from legacy below */
  }

  const legacy = localStorage.getItem(LEGACY_IDS_KEY);
  if (!legacy) return [];

  const migrated = legacy
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((orderId) => ({ orderId, restaurantId: '' }));

  if (migrated.length > 0) {
    persistEntries(migrated);
    localStorage.removeItem(LEGACY_IDS_KEY);
  }

  return migrated;
}

/**
 * Active orders scoped to the current restaurant when `restaurantId` is provided.
 */
export function useActiveOrders(restaurantId?: string | null) {
  const [entries, setEntries] = useState<ActiveOrderEntry[]>([]);

  const reload = useCallback(() => {
    setEntries(loadAllEntries());
  }, []);

  useEffect(() => {
    reload();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_IDS_KEY) {
        reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reload]);

  const activeOrderIds = useMemo(() => {
    const ids = entries.map((e) => e.orderId);
    if (!restaurantId) return ids;
    return entries.filter((e) => e.restaurantId === restaurantId).map((e) => e.orderId);
  }, [entries, restaurantId]);

  const getOrderAccessToken = useCallback((orderId: string): string | null => {
    const map = readTokenMap();
    return map[orderId] || null;
  }, []);

  const addActiveOrderId = useCallback(
    (orderId: string, accessToken?: string, orderRestaurantId?: string) => {
      if (typeof window === 'undefined' || !orderId.trim()) return;

      const rid = orderRestaurantId?.trim() || '';
      const current = loadAllEntries();
      const without = current.filter((e) => e.orderId !== orderId);
      const next = [...without, { orderId, restaurantId: rid }];
      persistEntries(next);
      setEntries(next);

      if (accessToken) {
        const map = readTokenMap();
        map[orderId] = accessToken;
        writeTokenMap(map);
      }
    },
    [],
  );

  const removeActiveOrderId = useCallback((orderId: string) => {
    if (typeof window === 'undefined') return;
    const next = loadAllEntries().filter((e) => e.orderId !== orderId);
    persistEntries(next);
    setEntries(next);

    const map = readTokenMap();
    delete map[orderId];
    writeTokenMap(map);
  }, []);

  return { activeOrderIds, addActiveOrderId, removeActiveOrderId, getOrderAccessToken };
}
