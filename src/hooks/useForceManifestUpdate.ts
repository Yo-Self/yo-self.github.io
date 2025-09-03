import { useEffect, useRef, useCallback } from 'react';
import { useCurrentRoute } from './useCurrentRoute';

export function useForceManifestUpdate() {
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();
  const manifestRef = useRef<string>('');
  const disableSw = process.env.NEXT_PUBLIC_DISABLE_SW === 'true';

  const updateManifestLink = useCallback((route: string, name: string) => {
    if (disableSw) return;
    try {
      // Criar manifest dinâmico
      const dynamicManifest = {
        name: `${name}`,
        short_name: name,
        description: `Cardápio digital de ${name}`,
        start_url: route,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'pt-BR',
        categories: ['food', 'lifestyle', 'utilities'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          }
        ]
      };

      // Criar blob com timestamp para evitar cache
      const manifestWithTimestamp = {
        ...dynamicManifest,
        _timestamp: Date.now()
      };

      const manifestBlob = new Blob([JSON.stringify(manifestWithTimestamp, null, 2)], {
        type: 'application/json'
      });
      
      const manifestUrl = URL.createObjectURL(manifestBlob);
      
      // Encontrar e atualizar o link do manifest
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink) {
        // Remover URL anterior se existir
        if ((manifestLink as any).dataset.blobUrl) {
          URL.revokeObjectURL((manifestLink as any).dataset.blobUrl as string);
        }
        
        // Atualizar com nova URL
        manifestLink.href = manifestUrl;
        (manifestLink as any).dataset.blobUrl = manifestUrl;
        
        // Forçar atualização removendo e readicionando
        manifestLink.remove();
        document.head.appendChild(manifestLink);
      } else {
        // Criar novo link se não existir
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        (manifestLink as any).dataset.blobUrl = manifestUrl;
        document.head.appendChild(manifestLink);
      }

      console.log('useForceManifestUpdate: Manifest link updated for route:', route);
      
      // Estratégia adicional: forçar reconhecimento do novo manifest
      setTimeout(() => {
        const event = new Event('manifestupdate', { bubbles: true });
        document.dispatchEvent(event);
        console.log('useForceManifestUpdate: Dispatched manifestupdate event');
      }, 100);

    } catch (error) {
      console.error('useForceManifestUpdate: Error updating manifest:', error);
    }
  }, [disableSw]);

  const forceServiceWorkerUpdate = useCallback(() => {
    if (disableSw) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('useForceManifestUpdate: Found service worker, forcing update');
          // Forçar atualização do service worker
          registration.update();
        });
      });
    }
  }, [disableSw]);

  const updateCriticalMetaTags = (name: string, route: string) => {
    // Atualizar meta tags críticas para iOS
    const criticalTags = [
      { name: 'apple-mobile-web-app-title', content: `${name}` },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { property: 'og:title', content: `${name}` },
      { property: 'og:url', content: `${window.location.origin}${route}` },
    ];

    criticalTags.forEach(({ name, property, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let metaTag = document.querySelector(selector) as HTMLMetaElement;
      
      if (metaTag) {
        metaTag.content = content;
      } else {
        metaTag = document.createElement('meta');
        if (property) {
          metaTag.setAttribute('property', property);
        } else if (name) {
          metaTag.setAttribute('name', name);
        }
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    });

    // Atualizar título da página
    document.title = `${name}`;
    
    console.log('useForceManifestUpdate: Critical meta tags updated for:', name);
  };

  useEffect(() => {
    if (disableSw) return;
    if (isRestaurantPage && restaurantName && currentRoute !== manifestRef.current) {
      console.log('useForceManifestUpdate: Forcing manifest update for:', restaurantName, 'at route:', currentRoute);
      
      // Estratégia 1: Atualizar manifest link
      updateManifestLink(currentRoute, restaurantName);
      
      // Estratégia 2: Forçar reload do service worker
      forceServiceWorkerUpdate();
      
      // Estratégia 3: Atualizar meta tags críticas
      updateCriticalMetaTags(restaurantName, currentRoute);
      
      manifestRef.current = currentRoute;
    }
  }, [currentRoute, isRestaurantPage, restaurantName, disableSw, forceServiceWorkerUpdate, updateManifestLink]);

  return {
    currentRoute,
    isRestaurantPage,
    restaurantName,
    forceUpdate: () => {
      if (disableSw) return;
      if (isRestaurantPage && restaurantName) {
        updateManifestLink(currentRoute, restaurantName);
      }
    }
  };
}
