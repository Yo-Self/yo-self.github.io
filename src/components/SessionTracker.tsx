"use client";

import { useEffect } from 'react';
import Analytics, { getCurrentRestaurantId } from '../lib/analytics';

export default function SessionTracker() {
  useEffect(() => {
    const restaurantId = getCurrentRestaurantId() || 'unknown';
    
    // Track session start
    Analytics.trackSessionStart(restaurantId);

    // Set up beforeunload listener for session end
    const handleBeforeUnload = () => {
      Analytics.trackSessionEnd(restaurantId);
    };

    // Set up visibility change listener for app backgrounding
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        Analytics.trackSessionEnd(restaurantId);
      } else if (document.visibilityState === 'visible') {
        Analytics.trackSessionStart(restaurantId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}