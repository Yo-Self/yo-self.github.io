"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import Analytics from '../lib/analytics';

interface CheckoutContextValue {
  isCheckoutInProgress: boolean;
  acquireCheckoutLock: (source?: string) => boolean;
  releaseCheckoutLock: () => void;
  withCheckoutLock: <T>(fn: () => Promise<T>, source?: string) => Promise<T | undefined>;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const lockRef = useRef(false);
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false);

  const acquireCheckoutLock = useCallback((source?: string): boolean => {
    if (lockRef.current) {
      Analytics.trackCheckoutLockBlocked(source);
      return false;
    }
    lockRef.current = true;
    setIsCheckoutInProgress(true);
    return true;
  }, []);

  const releaseCheckoutLock = useCallback(() => {
    lockRef.current = false;
    setIsCheckoutInProgress(false);
  }, []);

  const withCheckoutLock = useCallback(
    async <T,>(fn: () => Promise<T>, source?: string): Promise<T | undefined> => {
      if (!acquireCheckoutLock(source)) {
        return undefined;
      }
      try {
        return await fn();
      } finally {
        releaseCheckoutLock();
      }
    },
    [acquireCheckoutLock, releaseCheckoutLock],
  );

  const value: CheckoutContextValue = {
    isCheckoutInProgress,
    acquireCheckoutLock,
    releaseCheckoutLock,
    withCheckoutLock,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckoutLock(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckoutLock must be used within a CheckoutProvider');
  }
  return context;
}
