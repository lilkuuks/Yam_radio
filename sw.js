const STATIC_CACHE = 'yam-static-v2';
const RUNTIME_CACHE = 'yam-runtime-v1';
const FONT_CACHE = 'yam-fonts-v1';
const CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE, FONT_CACHE]);

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './Assets/YAM.png',
  './Assets/icon-192.png',
  './Assets/icon-512.png',
  './Assets/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('yam-') && !CURRENT_CACHES.has(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function updateCache(cacheName, request) {
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(cacheName, request, fallbackRequest, event) {
  const cached = await caches.match(request) ||
    (fallbackRequest ? await caches.match(fallbackRequest) : null);
  const network = updateCache(cacheName, request).catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  const response = await network;
  if (response) return response;
  return new Response('YAM Radio is temporarily offline.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return updateCache(cacheName, request);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(staleWhileRevalidate(RUNTIME_CACHE, request, './index.html', event));
      return;
    }

    event.respondWith(staleWhileRevalidate(STATIC_CACHE, request, null, event));
    return;
  }

  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(FONT_CACHE, request));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(FONT_CACHE, request, null, event));
  }
});
