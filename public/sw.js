// Cache version - increment this when you want to force cache refresh
const CACHE_VERSION = 1759603109898; // Increment this for each deployment
const CACHE_NAME = `restaurant-app-v${CACHE_VERSION}`;

// URLs that should never be cached (Next.js internal files)
const NEVER_CACHE_PATTERNS = [
  /_next\/static\/chunks\/webpack-.*\.js$/,
  /_next\/static\/chunks\/\d+\..*\.js$/,
  /_next\/static\/chunks\/pages\/.*\.js$/,
  /_next\/static\/chunks\/main-.*\.js$/,
  /_next\/static\/chunks\/framework-.*\.js$/,
  /_next\/static\/css\/.*\.css$/,
  /_next\/static\/.*\.js$/,
  /\.hot-update\.js$/,
  /_next\/static\/media\/.*$/,
  /_next\/webpack-runtime\.js$/,
  /_next\/static\/chunks\/polyfills-.*\.js$/,
  /_next\/static\/chunks\/app\/.*\.js$/,
];

// Check if a URL should never be cached
function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Check if a cached response is stale (older than 1 hour)
function isStaleResponse(response) {
  const cacheDate = response.headers.get('sw-cache-date');
  if (!cacheDate) return true;
  
  const cacheTime = new Date(cacheDate).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  return (now - cacheTime) > oneHour;
}

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
  const requestUrl = event.request.url;
  
  // Never cache Next.js chunks and internal files
  if (shouldNeverCache(requestUrl)) {
    console.log('SW: Not caching Next.js internal file:', requestUrl);
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Interceptar requisições para o manifest - DESABILITADO para Safari
  // Safari não permite service workers servirem manifests com redirecionamentos
  if (event.request.url.includes('manifest.json')) {
    console.log('SW: Skipping manifest interception for Safari compatibility');
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Para outras requisições, usar cache normal com verificação de stale
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se temos uma resposta em cache, verificar se não está stale
        if (response && !isStaleResponse(response)) {
          console.log('SW: Serving from cache:', event.request.url);
          return response;
        }
        
        // Se a resposta está stale ou não existe, buscar da rede
        console.log('SW: Fetching from network (stale or missing):', event.request.url);
        
        return fetch(event.request)
          .then((networkResponse) => {
            // Se a resposta da rede foi bem-sucedida, cachear com timestamp
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              responseToCache.headers.set('sw-cache-date', new Date().toISOString());
              
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('SW: Network failed, trying stale cache:', event.request.url);
            
            // Salvar restaurante atual antes de ir offline
            if (event.request.mode === 'navigate') {
              saveCurrentRestaurant(event.request);
            }
            
            // Se a rede falhou, tentar usar cache stale como fallback
            if (response) {
              console.log('SW: Using stale cache as fallback:', event.request.url);
              return response;
            }
            
            // Se não há cache nem rede, mostrar página offline para navegação
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }
            
            // Para outros recursos, falhar
            throw new Error('Network request failed and no cache available');
          });
      })
      .catch(() => {
        // If both cache and network fail, show offline page for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }
        // For other requests, let them fail
        throw new Error('Request failed');
      })
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new service worker, cleaning old caches');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Detect and clear corrupted cache
      detectAndClearCorruptedCache(),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('SW: New service worker activated and controlling all clients');
    })
  );
});

// Function to save current restaurant before going offline
function saveCurrentRestaurant(request) {
  try {
    const url = new URL(request.url);
    const restaurantMatch = url.pathname.match(/\/restaurant\/([^\/]+)/);
    
    if (restaurantMatch) {
      const restaurantSlug = restaurantMatch[1];
      const restaurantName = restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const offlineState = {
        isOffline: true,
        lastRestaurantUrl: url.pathname,
        lastRestaurantName: restaurantName,
        timestamp: Date.now()
      };
      
      // Store in IndexedDB or localStorage via postMessage
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SAVE_OFFLINE_STATE',
            data: offlineState
          });
        });
      });
      
      console.log('SW: Saved restaurant for offline:', restaurantName);
    }
  } catch (error) {
    console.log('SW: Error saving restaurant:', error);
  }
}

// Function to detect and clear corrupted cache
async function detectAndClearCorruptedCache() {
  try {
    const cacheNames = await caches.keys();
    const currentTime = Date.now();
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('restaurant-app-v')) {
        const cacheVersion = parseInt(cacheName.split('v')[1]);
        const cacheAge = currentTime - cacheVersion;
        
        // If cache is older than 24 hours, it might be corrupted
        if (cacheAge > maxCacheAge) {
          console.log('SW: Detected old cache, clearing:', cacheName);
          await caches.delete(cacheName);
        }
      }
    }
  } catch (error) {
    console.log('SW: Error detecting corrupted cache:', error);
  }
}

// Listen for message from client to force cache refresh
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'FORCE_REFRESH') {
    // Clear all caches and reload
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // Notify all clients to reload
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'DETECT_CORRUPTED_CACHE') {
    detectAndClearCorruptedCache();
  }
});
