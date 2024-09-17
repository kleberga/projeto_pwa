const CACHE_NAME = 'static-cache-1';
const CACHE_ASSETS = [
    '/icons/icon-144x144.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
    event.waitUntill(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CACHE_ASSETS)
                .catch((error) => {
                    console.error('Falha ao adicionar os recursos ao cache: ' + error)
                });
        })
    )
})