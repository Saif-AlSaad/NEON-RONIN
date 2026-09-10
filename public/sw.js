const CACHE_NAME = "neon-ronin-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return (
        res ||
        fetch(e.request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            if (e.request.url.startsWith("http")) {
              cache.put(e.request, fetchRes.clone());
            }
            return fetchRes;
          });
        })
      );
    }).catch(() => caches.match("./index.html"))
  );
});
