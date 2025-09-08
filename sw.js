const CACHE_NAME = 'restaurant-app-v1';

// Função para obter URLs para cache baseado na URL atual
function getUrlsToCache() {
  // URLs base sempre incluídas
  const baseUrls = [
    '/',
    '/offline',
    '/about',
    '/organization'
  ];
  
  // Adicionar rotas de restaurante comuns
  baseUrls.push('/restaurant');
  
  return baseUrls;
}

// Função para cachear a página atual quando necessário
async function cacheCurrentPage(request) {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(request);
  
  if (response.ok) {
    await cache.put(request, response.clone());
    console.log('Cached current page:', request.url);
    
    // Se for uma página de restaurante, cachear também recursos relacionados
    if (request.url.includes('/restaurant/')) {
      const restaurantBase = request.url.split('/restaurant/')[0] + '/restaurant';
      try {
        const baseResponse = await fetch(restaurantBase);
        if (baseResponse.ok) {
          await cache.put(restaurantBase, baseResponse.clone());
          console.log('Cached restaurant base:', restaurantBase);
        }
      } catch (error) {
        console.log('Could not cache restaurant base:', error);
      }
    }
  }
  
  return response;
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        const urlsToCache = getUrlsToCache();
        console.log('Caching URLs:', urlsToCache);
        
        // Cache URLs individualmente para evitar falhas
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.log(`Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Interceptar requisições para o manifest
  if (event.request.url.includes('manifest.json')) {
    console.log('SW: Intercepting manifest request');
    
    // Verificar se estamos em uma página de restaurante
    const currentUrl = new URL(event.request.url);
    const referrer = event.request.referrer || '';
    
    // Se a referência for uma página de restaurante, retornar manifest personalizado
    if (referrer.includes('/restaurant/')) {
      const restaurantSlug = referrer.split('/restaurant/')[1]?.split('/')[0];
      if (restaurantSlug) {
        const restaurantName = restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const dynamicManifest = {
          name: `${restaurantName}`,
          short_name: restaurantName,
          description: `Cardápio digital de ${restaurantName}`,
          start_url: `/restaurant/${restaurantSlug}`,
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
        
        console.log('SW: Returning dynamic manifest for:', restaurantName);
        event.respondWith(new Response(JSON.stringify(dynamicManifest), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }));
        return;
      }
    }
  }
  
  // Para outras requisições, usar cache normal
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Se não estiver em cache e for uma navegação, cachear a página
        if (event.request.mode === 'navigate') {
          return cacheCurrentPage(event.request);
        }
        
        // Para outros recursos, buscar da rede
        return fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
