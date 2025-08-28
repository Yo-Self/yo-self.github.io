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
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
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
