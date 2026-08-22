/* Service Worker — macht die Seite offline benutzbar.
   Strategie: Zuerst das Netz, bei Erfolg die Antwort in den Cache legen.
   Ohne Verbindung kommt der letzte gespeicherte Stand. So sieht man unterwegs
   auch im Funkloch die Zahlen vom letzten Aufruf, statt einer Fehlerseite. */
const CACHE = 'cryptobiz-v3';
const KERN = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(KERN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET') return;
    // Kurse kommen live von Binance und gehoeren nie in den Cache
    if (url.hostname.includes('binance.com') || url.hostname.includes('coingecko.com')) return;
    if (url.origin !== location.origin) return;

    e.respondWith(
        fetch(e.request)
            .then(res => {
                if (res && res.status === 200) {
                    const kopie = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, kopie));
                }
                return res;
            })
            .catch(() => caches.match(e.request).then(t => t || caches.match('./index.html')))
    );
});
