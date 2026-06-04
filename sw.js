// Basic service worker — caches static assets for offline shell
const CACHE = 'shared-kitchen-v1';
const ASSETS = [
    'assets/css/app.css',
    'assets/js/app.js',
    'manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Only cache GET requests for assets
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|svg|json)$/)) {
        e.respondWith(
            caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
                const clone = resp.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone).catch(()=>{}));
                return resp;
            }).catch(() => caches.match(e.request)))
        );
    }
});
