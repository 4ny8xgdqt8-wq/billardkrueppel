const CACHE_NAME = 'billard-v5.4';
const ASSETS = [
  './',
  'index.html',
  'Chart.js',
  'worker.js',
  'logo.png',
  'logo_html.png',
  'manifest.json',
  'avatars/Daniel.webp',
  'avatars/Thorsten.webp',
  'avatars/Peter.webp',
];

// Installation: Dateien in den Cache laden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Erst im Cache suchen, dann Netzwerk (Cache-First-Strategie)
self.addEventListener('fetch', (event) => {
  // Firebase-Anfragen ignorieren (die brauchen Echtzeit-Daten)
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});