'use client';

import { useEffect, useCallback } from 'react';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';
import { useCurrentRestaurant } from '@/hooks/useCurrentRestaurant';

export default function DynamicMetaTags() {
  const { currentRoute, isRestaurantPage, restaurantName } = useCurrentRoute();
  const restaurantId = useCurrentRestaurant();

  const setCanonical = useCallback((absoluteUrl: string) => {
    const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (existing) {
      existing.href = absoluteUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = absoluteUrl;
      document.head.appendChild(link);
    }
  }, []);

  const updateManifestLink = useCallback((route: string, name: string) => {
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

    // Criar blob e atualizar link
    const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
      type: 'application/json'
    });
    
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (manifestLink) {
      // Remover URL anterior se existir
      if (manifestLink.dataset.blobUrl) {
        URL.revokeObjectURL(manifestLink.dataset.blobUrl);
      }
      
      manifestLink.href = manifestUrl;
      manifestLink.dataset.blobUrl = manifestUrl;
    } else {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      manifestLink.dataset.blobUrl = manifestUrl;
      document.head.appendChild(manifestLink);
    }

    console.log('DynamicMetaTags: Manifest link updated for route:', route);
  }, []);

  const resetManifestLink = useCallback(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink && manifestLink.dataset.blobUrl) {
      URL.revokeObjectURL(manifestLink.dataset.blobUrl);
      manifestLink.href = '/manifest.json';
      delete manifestLink.dataset.blobUrl;
    }
  }, []);

  const updateMetaTags = useCallback((name: string, route: string) => {
    // Atualizar meta tags existentes ou criar novas
    const metaTags = [
      { name: 'apple-mobile-web-app-title', content: `${name}` },
      { name: 'application-name', content: `${name}` },
      { name: 'msapplication-TileColor', content: '#000000' },
      { name: 'theme-color', content: '#000000' },
      { property: 'og:title', content: `${name}` },
      { property: 'og:description', content: `Cardápio digital de ${name}` },
      { property: 'og:url', content: `${window.location.origin}${route}` },
      { name: 'twitter:title', content: `${name}` },
      { name: 'twitter:description', content: `Cardápio digital de ${name}` },
    ];

    metaTags.forEach(({ name, property, content }) => {
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

    // Atualizar o título da página
    document.title = `${name}`;
    
    // Forçar atualização do manifest link
    updateManifestLink(route, name);
  }, [updateManifestLink]);

  const setFavicon = useCallback((iconUrl: string) => {
    // Replace generic rel=icon without sizes (common precedence)
    let generic = document.querySelector('link[rel="icon"]:not([sizes])') as HTMLLinkElement | null;
    if (!generic) {
      generic = document.createElement('link');
      generic.rel = 'icon';
      document.head.appendChild(generic);
    }
    generic.href = iconUrl;

    // Update or create sized icons without forcing type
    const ensureLink = (rel: string, sizes?: string) => {
      let link = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (sizes) link.sizes = sizes as any;
        document.head.appendChild(link);
      }
      return link;
    };
    ensureLink('icon', '32x32')!.href = iconUrl;
    ensureLink('icon', '16x16')!.href = iconUrl;
    ensureLink('apple-touch-icon')!.href = iconUrl;
    ensureLink('shortcut icon')!.href = iconUrl;
  }, []);

  const resetFavicon = useCallback(() => {
    const defaults = {
      generic: '/favicon.svg',
      icon32: '/favicon-32x32.png',
      icon16: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.ico',
    } as const;
    const setIfFound = (selector: string, href: string) => {
      const el = document.querySelector(selector) as HTMLLinkElement | null;
      if (el) el.href = href;
    };
    setIfFound('link[rel="icon"]:not([sizes])', defaults.generic);
    setIfFound('link[rel="icon"][sizes="32x32"]', defaults.icon32);
    setIfFound('link[rel="icon"][sizes="16x16"]', defaults.icon16);
    setIfFound('link[rel="apple-touch-icon"]', defaults.apple);
    setIfFound('link[rel="shortcut icon"]', defaults.shortcut);
  }, []);

  const resetMetaTags = useCallback(() => {
    // Reset para valores padrão
    const metaTags = [
      { name: 'apple-mobile-web-app-title', content: 'Restaurant App' },
      { name: 'application-name', content: 'Restaurant App' },
      { name: 'msapplication-TileColor', content: '#000000' },
      { name: 'theme-color', content: '#000000' },
      { property: 'og:title', content: 'Restaurant App' },
      { property: 'og:description', content: 'Aplicativo de restaurante com cardápio digital e pedidos' },
      { property: 'og:url', content: window.location.origin },
      { name: 'twitter:title', content: 'Restaurant App' },
      { name: 'twitter:description', content: 'Aplicativo de restaurante com cardápio digital e pedidos' },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      const metaTag = document.querySelector(selector) as HTMLMetaElement;
      if (metaTag) {
        metaTag.content = content;
      }
    });

    // Reset do título
    document.title = 'Restaurant App';
    
    // Reset do manifest link
    resetManifestLink();
  }, [resetManifestLink]);

  useEffect(() => {
    if (isRestaurantPage && restaurantName) {
      console.log('DynamicMetaTags: Setting meta tags for restaurant:', restaurantName);
      
      // Atualizar meta tags para forçar o salvamento da rota atual
      updateMetaTags(restaurantName, currentRoute);
      setCanonical(`${window.location.origin}${currentRoute}`);
      // Se houver imagem do restaurante embutida na página via meta (opcional) ou padrão baseada no slug/id
      const metas = Array.from(document.querySelectorAll('meta[property="og:image"]')) as HTMLMetaElement[];
      const imageFromMeta = metas.length > 0 ? metas[metas.length - 1].content : '';
      const logoUrl = imageFromMeta || '';
      if (logoUrl) setFavicon(logoUrl);
    } else {
      console.log('DynamicMetaTags: Resetting meta tags to default');
      resetMetaTags();
      setCanonical(window.location.origin);
      resetFavicon();
    }
  }, [currentRoute, isRestaurantPage, restaurantName, restaurantId, updateMetaTags, resetMetaTags, setFavicon, resetFavicon]);

  // Componente não renderiza nada
  return null;
}
