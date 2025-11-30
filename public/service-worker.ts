/**
 * Service Worker for PWA functionality
 * Handles offline caching, push notifications, and background sync
 */

const CACHE_NAME = 'eventsphere-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

// Polyfill types for missing global events if needed
declare global {
  interface PushEvent extends Event {
    data?: {
      text(): string;
    };
    waitUntil(fn: Promise<any> | void): void;
  }
  interface SyncEvent extends Event {
    tag: string;
    lastChance: boolean;
    waitUntil(promise: Promise<any>): void;
  }
  interface NotificationEvent extends Event {
    action: string;
    notification: Notification & { close: () => void };
    waitUntil(promise: Promise<any>): void;
  }
  interface FetchEvent extends Event {
    request: Request;
    respondWith(response: Promise<Response> | Response): void;
  }
}

// Install event - cache static assets
self.addEventListener('install', (event: any) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // If no cache, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html').then((offlineResponse) => {
              return offlineResponse || new Response('Network error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
              });
            });
          }
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event: PushEvent) => {
  console.log('[ServiceWorker] Push notification received');

  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('EventSphere', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement background data sync logic
  console.log('[ServiceWorker] Syncing data...');
}

export { };
