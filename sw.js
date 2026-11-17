// Offline support: cache the app shell and question bank; refresh them in the background.
const CACHE = "samfunn-v1";
const CORE = ["./", "index.html", "content.json", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/favicon.png"];
const INDEX = new URL("index.html", self.registration.scope).href;
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {           // Google Fonts: cache what we get, use cache when offline
    e.respondWith(caches.open(CACHE).then(c => fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => c.match(req))));
    return;
  }
  const key = req.mode === "navigate" ? INDEX : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(key);
    const fresh = fetch(req).then(r => { if (r.ok) c.put(key, r.clone()); return r; }).catch(() => cached);
    return cached || fresh;                        // stale-while-revalidate
  }));
});
