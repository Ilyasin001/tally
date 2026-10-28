// Minimal offline support: network first, falling back to the last cached copy.
const CACHE = 'tally-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (new URL(request.url).origin === location.origin || request.url.includes('fonts.g'))) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match(self.registration.scope))),
  )
})
