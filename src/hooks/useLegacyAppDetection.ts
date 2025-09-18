'use client';

import { useEffect, useState } from 'react';

export function useLegacyAppDetection() {
  const [isLegacyApp, setIsLegacyApp] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);

  useEffect(() => {
    const detectLegacyApp = () => {
      // Detectar se é um web app instalado (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isStandalone) {
        console.log('📱 Web app instalado detectado');
        
        // Verificar se há service workers antigos
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            if (registrations.length > 0) {
              console.log('⚠️ Service workers antigos detectados:', registrations.length);
              
              // Verificar se algum service worker está ativo
              const hasActiveSW = registrations.some(reg => reg.active);
              
              if (hasActiveSW) {
                console.log('🚨 Service worker ativo detectado - pode ser versão antiga');
                setIsLegacyApp(true);
                setShowCleanup(true);
              }
            }
          });
        }

        // Verificar se há caches antigos
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            const oldCaches = cacheNames.filter(name => 
              name.includes('restaurant-app-v') && 
              !name.includes('1758201797440') // Versão atual
            );
            
            if (oldCaches.length > 0) {
              console.log('🚨 Caches antigos detectados:', oldCaches);
              setIsLegacyApp(true);
              setShowCleanup(true);
            }
          });
        }

        // Verificar se há dados antigos no localStorage
        const hasOldData = localStorage.getItem('offline-state') || 
                          localStorage.getItem('restaurant-app-v') ||
                          Object.keys(localStorage).some(key => 
                            key.includes('restaurant-app') || 
                            key.includes('sw-cache')
                          );
        
        if (hasOldData) {
          console.log('🚨 Dados antigos detectados no localStorage');
          setIsLegacyApp(true);
          setShowCleanup(true);
        }
      }
    };

    // Detectar imediatamente
    detectLegacyApp();

    // Detectar também quando a página carrega completamente
    const handleLoad = () => {
      setTimeout(detectLegacyApp, 1000);
    };

    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const dismissCleanup = () => {
    setShowCleanup(false);
  };

  return {
    isLegacyApp,
    showCleanup,
    dismissCleanup,
  };
}
