const CACHE_NAME = 'cheerscorner-pos-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// Install Service Worker and cache local assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the new version to take over immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate and clean up old v1 caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Intercept network requests and cache external files (like Tailwind and Fonts)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return; // Only cache standard web requests

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. Return the cached file if we already have it
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. If not in cache, fetch it from the internet
            return fetch(event.request).then((networkResponse) => {
                // Verify it's a valid response before caching
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                    return networkResponse;
                }

                // 3. Save a copy of the Tailwind CSS/Fonts to the cache for offline use
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                console.log('Offline: Could not fetch', event.request.url);
            });
        })
    );
});