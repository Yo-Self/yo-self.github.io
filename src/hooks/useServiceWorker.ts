import { useEffect, useState } from 'react';
import { useCurrentRoute } from './useCurrentRoute';

export function useServiceWorker() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();

  const disableSw = process.env.NEXT_PUBLIC_DISABLE_SW === 'true';

  useEffect(() => {
    if (disableSw) {
      return;
    }

    // Detectar Safari
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Verificar se já está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação (não funciona no Safari)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
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
          if (isRestaurantPage) {
            console.log('Installing restaurant app:', restaurantName);
          }
        } else {
          console.log('User dismissed the install prompt');
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

  return {
    isInstalled,
    showInstallPrompt,
    installApp,
    currentRoute,
    isSafari,
  };
}
