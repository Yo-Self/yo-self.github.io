'use client';

import { useEffect } from 'react';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';

// Função para detectar se a aplicação está rodando como PWA/Web App instalado
const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Detecta PWA no Android/Desktop (display-mode: standalone)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Detecta PWA no iOS (navigator.standalone)
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // Detecta se foi aberto via manifest (start_url)
  const hasStartUrlParams = window.location.search.includes('utm_source=web_app_manifest');
  
  return isStandalone || isIOSStandalone || hasStartUrlParams;
};

export default function A2HSUrlTagger() {
  const { isRestaurantPage, currentRoute } = useCurrentRoute();

  useEffect(() => {
    // Só executa se estiver em modo PWA/Web App instalado
    if (!isPWAMode()) return;
    
    if (!isRestaurantPage) return;
    const slug = currentRoute.split('/')[2];
    if (!slug) return;

    const hash = `#rest=${encodeURIComponent(slug)}`;
    const base = `${window.location.origin}/restaurant/${slug}`;

    // Se já tiver o hash correto, não fazer nada
    if (window.location.hash === hash) return;

    // Grudar o hash sem recarregar (apenas em modo PWA)
    try {
      const newUrl = `${base}${hash}`;
      history.replaceState(null, '', newUrl);
    } catch {}
  }, [isRestaurantPage, currentRoute]);

  return null;
}
