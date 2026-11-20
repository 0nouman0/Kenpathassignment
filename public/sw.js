const CACHE_NAME = 'sweety-pwa-cache-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/manifest.json', '/icon.svg'])
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Never intercept API endpoints or non-GET requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
