const CACHE_NAME = 'billard-v9';
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

// Fetch: Stale-While-Revalidate Strategie
// Liefert sofort aus dem Cache für Speed, aktualisiert aber im Hintergrund.
self.addEventListener('fetch', (event) => {
  // Firebase-Anfragen ignorieren (die brauchen Echtzeit-Daten)
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        // Gib die Cache-Antwort zurück, falls vorhanden, sonst warte auf das Netzwerk
        return cachedResponse || fetchPromise;
      });
    })
  );
});