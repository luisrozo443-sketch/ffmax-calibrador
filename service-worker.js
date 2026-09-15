const CACHE_VERSION = 'ffmax-v2.0';
const CACHE_NAME = `${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Instalar service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caché abierto');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[Service Worker] Error en cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network First, Fall back to Cache
self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return;

  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests externas
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Si la respuesta es válida, guardarla en caché
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // Clonar la respuesta
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Si falla la red, usar caché
        return caches.match(request)
          .then(response => response || caches.match('/offline.html'));
      })
  );
});

// Sincronización en background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-profiles') {
    event.waitUntil(syncProfiles());
  }
});

async function syncProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem('ffmax_profiles')) || [];
    // Aquí puedes enviar los perfiles a un servidor
    console.log('[Service Worker] Sincronizando perfiles:', profiles);
  } catch (error) {
    console.error('[Service Worker] Error en sincronización:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230a0e18" width="192" height="192"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" font-weight="bold" fill="%2310b981" font-family="Arial">⚡</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="45" fill="%2310b981"/></svg>',
    tag: 'ffmax-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('FF MAX Calibrador', options)
  );
});

// Notificación click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Periodic sync (actualización periódica)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  console.log('[Service Worker] Verificando actualizaciones...');
  // Aquí puedes verificar si hay actualizaciones disponibles
}
