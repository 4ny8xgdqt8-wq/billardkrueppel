const CACHE_NAME = "billard-v16.6";
const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "logo.png",
  "logo_html.png",
  "css/main.css",
  "css/animations.css",
  "css/modals.css",
  "lib/chart.umd.min.js",
  "lib/confetti.min.js",
  "js/achievements-data.js",
  "js/elo-calc.js",
  "js/filters.js",
  "js/stats-renderer.js",
  "js/match-controller.js",
  "js/firebase-service.js",
  "js/app.js",
  "worker.js",
  "avatars/Daniel.webp",
  "avatars/Thorsten.webp",
  "avatars/Peter.webp",
];

// Installation: Dateien in den Cache laden
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }),
  );
  self.skipWaiting();
});

// Aktivierung: Alte Caches löschen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch: Stale-While-Revalidate Strategie
// Liefert sofort aus dem Cache für Speed, aktualisiert aber im Hintergrund.
self.addEventListener("fetch", (event) => {
  // Firebase- und Google-Auth-Anfragen ignorieren (die brauchen Echtzeit-Daten)
  if (
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("identitytoolkit.googleapis.com") ||
    event.request.url.includes("securetoken.googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Gib die Cache-Antwort zurück, falls vorhanden, sonst warte auf das Netzwerk
        return cachedResponse || fetchPromise;
      });
    }),
  );
});
