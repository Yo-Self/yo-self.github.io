'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DynamicManifestUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    // Verificar se estamos em uma página de restaurante
    const restaurantMatch = pathname.match(/^\/restaurant\/([^\/]+)/);
    
    if (restaurantMatch) {
      const slug = restaurantMatch[1];
      const restaurantName = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
      
      // Criar manifest dinâmico
      const dynamicManifest = {
        name: restaurantName,
        short_name: restaurantName,
        description: `Cardápio digital de ${restaurantName}`,
        start_url: `/restaurant/${slug}?utm_source=web_app_manifest`,
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
            purpose: 'any'
          },
          {
            src: '/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          }
        ]
      };

      // Criar blob URL para o manifest dinâmico
      const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
        type: 'application/json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      // Encontrar e atualizar o link do manifest
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink) {
        // Remover URL anterior se existir (blob)
        if ((manifestLink as any).dataset.blobUrl) {
          URL.revokeObjectURL((manifestLink as any).dataset.blobUrl as string);
        }
        
        // Atualizar href
        manifestLink.href = manifestUrl;
        (manifestLink as any).dataset.blobUrl = manifestUrl;
      } else {
        // Criar novo link se não existir
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        (manifestLink as any).dataset.blobUrl = manifestUrl;
        document.head.appendChild(manifestLink);
      }
    } else {
      // Reset para o manifest padrão
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink && (manifestLink as any).dataset.blobUrl) {
        // Remover blob URL
        URL.revokeObjectURL((manifestLink as any).dataset.blobUrl as string);
        delete (manifestLink as any).dataset.blobUrl;
        
        // Reset para manifest padrão
        manifestLink.href = '/manifest.webmanifest';
      }
    }
  }, [pathname]);

  return null;
}
