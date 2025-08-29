import { useEffect } from 'react';
import { useCurrentRoute } from './useCurrentRoute';

export function useDynamicManifest() {
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();
  const disableSw = process.env.NEXT_PUBLIC_DISABLE_SW === 'true';

  useEffect(() => {
    if (disableSw) return;
    console.log('useDynamicManifest: Route changed to:', currentRoute);
    console.log('useDynamicManifest: isRestaurantPage:', isRestaurantPage);
    console.log('useDynamicManifest: restaurantName:', restaurantName);
    
    // Só modificar o manifest se estivermos em uma página de restaurante
    if (isRestaurantPage && restaurantName) {
      console.log('useDynamicManifest: Updating manifest for restaurant:', restaurantName);
      updateManifestForRestaurant(currentRoute, restaurantName);
    } else {
      console.log('useDynamicManifest: Resetting to default manifest');
      resetManifest();
    }
  }, [currentRoute, isRestaurantPage, restaurantName, disableSw]);

  const updateManifestForRestaurant = (route: string, name: string) => {
    if (disableSw) return;
    // Criar um novo manifest dinâmico
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

    // Atualizar o manifest dinamicamente
    updateManifest(dynamicManifest);
  };

  const resetManifest = () => {
    if (disableSw) return;
    // Reset para o manifest padrão
    const defaultManifest = {
      name: 'Restaurant App',
      short_name: 'Restaurant',
      description: 'Aplicativo de restaurante com cardápio digital e pedidos',
      start_url: '/',
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

    updateManifest(defaultManifest);
  };

  const updateManifest = (manifestData: any) => {
    if (disableSw) return;
    try {
      console.log('updateManifest: Updating manifest with data:', manifestData);
      
      // Criar um blob com o novo manifest
      const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
        type: 'application/json'
      });
      
      // Criar URL para o blob
      const manifestUrl = URL.createObjectURL(manifestBlob);
      console.log('updateManifest: Created blob URL:', manifestUrl);
      
      // Encontrar e atualizar o link do manifest
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink) {
        console.log('updateManifest: Found existing manifest link:', manifestLink.href);
        
        // Remover URL anterior se existir
        if ((manifestLink as any).dataset.blobUrl) {
          URL.revokeObjectURL((manifestLink as any).dataset.blobUrl as string);
          console.log('updateManifest: Revoked previous blob URL');
        }
        
        // Atualizar com nova URL
        manifestLink.href = manifestUrl;
        (manifestLink as any).dataset.blobUrl = manifestUrl;
        console.log('updateManifest: Updated manifest link to:', manifestUrl);
      } else {
        console.log('updateManifest: Creating new manifest link');
        // Criar novo link se não existir
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        (manifestLink as any).dataset.blobUrl = manifestUrl;
        document.head.appendChild(manifestLink);
        console.log('updateManifest: Added new manifest link to head');
      }

      // Forçar atualização do manifest no navegador
      setTimeout(() => {
        console.log('updateManifest: Forcing manifest refresh...');
        // Tentar forçar o navegador a reconhecer o novo manifest
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
              console.log('updateManifest: Found service worker registration');
            });
          });
        }
      }, 100);

      console.log('updateManifest: Manifest successfully updated for:', manifestData.start_url);
    } catch (error) {
      console.error('updateManifest: Error updating manifest:', error);
    }
  };

  return {
    currentRoute,
    isRestaurantPage,
    restaurantName,
    updateManifestForRestaurant,
    resetManifest
  };
}
