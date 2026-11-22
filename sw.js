// Service worker: guarda la app completa para usarla sin internet.
// Con internet siempre trae la versión más nueva; sin internet usa la copia guardada.
const CACHE = 'campamento-2026-v8';
const FILES = ['./', './index.html', './data.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Primero internet (máx. 3 s); si no hay señal, la copia guardada.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
      const r = await fetch(req, { cache: 'no-cache', signal: ctl.signal }); clearTimeout(t);
      if (r && r.ok) { c.put(req, r.clone()); return r; }
      throw new Error('bad');
    } catch (err) {
      return (await c.match(req, { ignoreSearch: true })) ||
        (req.mode === 'navigate' ? await c.match('./index.html') : Response.error());
    }
  })());
});
