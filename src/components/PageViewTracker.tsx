"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Analytics, { getCurrentRestaurantId } from '../lib/analytics';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on navigation
    Analytics.trackPageView(pathname, getCurrentRestaurantId() || 'unknown');
  }, [pathname]);

  return null;
}