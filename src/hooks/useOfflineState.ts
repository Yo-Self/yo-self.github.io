'use client';

import { useEffect, useState } from 'react';

interface OfflineState {
  isOffline: boolean;
  lastRestaurantUrl: string | null;
  lastRestaurantName: string | null;
}

export function useOfflineState() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOffline: false,
    lastRestaurantUrl: null,
    lastRestaurantName: null,
  });

  useEffect(() => {
    // Carregar estado salvo do localStorage
    const savedState = localStorage.getItem('offline-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setOfflineState(parsed);
      } catch (e) {
        console.log('Erro ao carregar estado offline:', e);
      }
    }

    // Detectar mudanças de conectividade
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada');
      setOfflineState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      console.log('📴 Conexão perdida');
      setOfflineState(prev => ({ ...prev, isOffline: true }));
    };

    // Detectar restaurante atual antes de ficar offline
    const saveCurrentRestaurant = () => {
      const currentPath = window.location.pathname;
      const restaurantMatch = currentPath.match(/\/restaurant\/([^\/]+)/);
      
      if (restaurantMatch) {
        const restaurantSlug = restaurantMatch[1];
        const restaurantName = restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const newState = {
          isOffline: true,
          lastRestaurantUrl: currentPath,
          lastRestaurantName: restaurantName,
        };
        
        setOfflineState(newState);
        localStorage.setItem('offline-state', JSON.stringify(newState));
        
        console.log('💾 Restaurante salvo para modo offline:', restaurantName);
      }
    };

    // Escutar mensagens do service worker
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'SAVE_OFFLINE_STATE') {
        const offlineData = event.data.data;
        setOfflineState(offlineData);
        localStorage.setItem('offline-state', JSON.stringify(offlineData));
        console.log('💾 Estado offline salvo pelo service worker:', offlineData.lastRestaurantName);
      }
    };

    // Adicionar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', saveCurrentRestaurant);
    
    // Escutar mensagens do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    // Salvar restaurante atual periodicamente
    const saveInterval = setInterval(saveCurrentRestaurant, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', saveCurrentRestaurant);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      
      clearInterval(saveInterval);
    };
  }, []);

  const clearOfflineState = () => {
    localStorage.removeItem('offline-state');
    setOfflineState({
      isOffline: false,
      lastRestaurantUrl: null,
      lastRestaurantName: null,
    });
  };

  return {
    ...offlineState,
    clearOfflineState,
  };
}
