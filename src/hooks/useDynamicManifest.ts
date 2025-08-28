import { useEffect } from 'react';
import { useCurrentRoute } from './useCurrentRoute';

export function useDynamicManifest() {
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();

  useEffect(() => {
    // Só modificar o manifest se estivermos em uma página de restaurante
    if (isRestaurantPage && restaurantName) {
      updateManifestForRestaurant(currentRoute, restaurantName);
    } else {
      // Reset para o manifest padrão
      resetManifest();
    }
  }, [currentRoute, isRestaurantPage, restaurantName]);

  const updateManifestForRestaurant = (route: string, name: string) => {
    // Criar um novo manifest dinâmico
    const dynamicManifest = {
      name: `${name} - Cardápio`,
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
    try {
      // Criar um blob com o novo manifest
      const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
        type: 'application/json'
      });
      
      // Criar URL para o blob
      const manifestUrl = URL.createObjectURL(manifestBlob);
      
      // Encontrar e atualizar o link do manifest
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink) {
        // Remover URL anterior se existir
        if (manifestLink.dataset.blobUrl) {
          URL.revokeObjectURL(manifestLink.dataset.blobUrl);
        }
        
        // Atualizar com nova URL
        manifestLink.href = manifestUrl;
        manifestLink.dataset.blobUrl = manifestUrl;
      } else {
        // Criar novo link se não existir
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        manifestLink.dataset.blobUrl = manifestUrl;
        document.head.appendChild(manifestLink);
      }

      console.log('Manifest atualizado para:', manifestData.start_url);
    } catch (error) {
      console.error('Erro ao atualizar manifest:', error);
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
