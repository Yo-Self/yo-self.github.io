import { useEffect, useCallback } from 'react';
import { useCurrentRoute } from './useCurrentRoute';

export function useDynamicManifest() {
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();
  const disableSw = process.env.NEXT_PUBLIC_DISABLE_SW === 'true';

  const updateManifest = useCallback((manifestData: any) => {
    if (disableSw) {
      console.log('updateManifest: Service Worker disabled, skipping manifest update');
      return;
    }
    try {
      console.log('updateManifest: Updating manifest with data:', manifestData);
      
      // Criar blob URL para o manifest dinâmico
      const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
        type: 'application/json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      console.log('updateManifest: Created blob URL:', manifestUrl);
      
      // Encontrar e atualizar o link do manifest
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink) {
        console.log('updateManifest: Found existing manifest link:', manifestLink.href);
        
        // Remover URL anterior se existir (blob)
        if ((manifestLink as any).dataset.blobUrl) {
          URL.revokeObjectURL((manifestLink as any).dataset.blobUrl as string);
          delete (manifestLink as any).dataset.blobUrl;
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

      }


    } catch (error) {
      console.error('updateManifest: Error updating manifest:', error);
    }
  }, [disableSw]);

  const updateManifestForRestaurant = useCallback((route: string, name: string) => {
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
  }, [disableSw, updateManifest]);

  const resetManifest = useCallback(() => {
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

    console.log('resetManifest: Created default manifest:', defaultManifest);
    updateManifest(defaultManifest);
  }, [disableSw, updateManifest]);



  useEffect(() => {
    if (disableSw) return;
    
    // Só modificar o manifest se estivermos em uma página de restaurante
    if (isRestaurantPage && restaurantName) {
      updateManifestForRestaurant(currentRoute, restaurantName);
    } else {
      resetManifest();
    }
  }, [currentRoute, isRestaurantPage, restaurantName, disableSw, resetManifest, updateManifestForRestaurant]);

  return {
    currentRoute,
    isRestaurantPage,
    restaurantName,
    updateManifestForRestaurant,
    resetManifest
  };
}
