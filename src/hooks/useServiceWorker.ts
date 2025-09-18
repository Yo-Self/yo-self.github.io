'use client';

import { useEffect, useState } from 'react';
import { useCurrentRoute } from './useCurrentRoute';
import Analytics, { getCurrentRestaurantId } from '../lib/analytics';

export function useServiceWorker() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();

  const disableSw = process.env.NEXT_PUBLIC_DISABLE_SW === 'true';

  useEffect(() => {
    // TEMPORÁRIO: Desabilitar service worker completamente para resolver erros
    console.log('Service worker temporarily disabled to fix cache and redirect errors');
    
    // Limpar todos os service workers existentes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('Unregistering service worker:', registration.scope);
          registration.unregister();
        });
      });
    }

    // Detectar Safari
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Limpar todos os caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          console.log('Deleting cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }

    // Verificar se já está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      Analytics.trackPWALaunched(getCurrentRestaurantId() || 'unknown');
    }

    // Capturar evento de instalação (não funciona no Safari)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      Analytics.trackAppInstallPromptShown(getCurrentRestaurantId() || 'unknown');
      console.log('beforeinstallprompt event captured');
    };

    // Capturar evento de app instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [disableSw]);

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        console.log('Showing install prompt...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt for route:', currentRoute);
          Analytics.trackAppInstallPromptClicked('install', getCurrentRestaurantId() || 'unknown');
          if (isRestaurantPage) {
            console.log('Installing restaurant app:', restaurantName);
          }
        } else {
          console.log('User dismissed the install prompt');
          Analytics.trackAppInstallPromptClicked('dismiss', getCurrentRestaurantId() || 'unknown');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      } finally {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    } else {
      console.log('No deferred prompt available');
    }
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          // Tell the waiting service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          setShowUpdatePrompt(false);
        }
      });
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return {
    isInstalled,
    showInstallPrompt,
    showUpdatePrompt,
    installApp,
    updateApp,
    dismissUpdate,
    currentRoute,
    isSafari,
  };
}
