/* Service Worker der VIP-Seite (Dashboard 2.0). Zuerst das Netz, bei Erfolg
   in den Cache. Ohne Verbindung kommt der letzte Stand statt einer Fehlerseite.
   Live-Kurse und fremde Server gehoeren nie in den Cache. */
const CACHE = 'cryptobiz2-202610101132';
const KERN = ['./', './index.html', './manifest.webmanifest', './assets/icon-192.png', './css/app.css', './js/app.js', './js/nav.js'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(KERN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;
    e.respondWith(
        // no-cache: beim Server nachfragen (ETag), sonst mischt der Browser bis zu
        // 10 Minuten alte Module mit neuen Daten. Unveraenderte Dateien kommen als 304.
        fetch(e.request, { cache: 'no-cache' })
            .then(res => {
                if (res && res.status === 200) {
                    const kopie = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, kopie));
                }
                return res;
            })
            .catch(() => caches.match(e.request, { ignoreSearch: true }).then(t => t || caches.match('./index.html')))
    );
});
