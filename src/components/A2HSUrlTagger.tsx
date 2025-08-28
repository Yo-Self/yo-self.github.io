'use client';

import { useEffect } from 'react';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';

export default function A2HSUrlTagger() {
  const { isRestaurantPage, currentRoute } = useCurrentRoute();

  useEffect(() => {
    if (!isRestaurantPage) return;
    const slug = currentRoute.split('/')[2];
    if (!slug) return;

    const hash = `#rest=${encodeURIComponent(slug)}`;
    const base = `${window.location.origin}/restaurant/${slug}`;

    // Se já tiver o hash correto, não fazer nada
    if (window.location.hash === hash) return;

    // Grudar o hash sem recarregar
    try {
      const newUrl = `${base}${hash}`;
      history.replaceState(null, '', newUrl);
    } catch {}
  }, [isRestaurantPage, currentRoute]);

  return null;
}
