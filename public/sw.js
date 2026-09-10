const CACHE_NAME = "neon-ronin-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Navigation requests (HTML): Always fetch from network to avoid stale cache!
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request).then((networkRes) => {
          if (e.request.url.startsWith("http")) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkRes.clone());
            });
          }
          return networkRes;
        })
      );
    })
  );
});
