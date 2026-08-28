const CACHE_NAME = "pharmacy-cache-v1";
const OFFLINE_URL = "/offline.html";

// Assets to precache
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png"
];

// Install event - cache offline assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      logger("Caching precache assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            logger("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle network errors by serving offline fallback
self.addEventListener("fetch", (event) => {
  // Only handle navigation requests (page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch((err) => {
        logger("Network request failed, serving offline page:", err);
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
  } else {
    // For other assets, try cache first, fall back to network
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

function logger(...args) {
  console.log("[ServiceWorker]", ...args);
}

// Handle incoming push events
self.addEventListener("push", (event) => {
  logger("Push received");
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "New Notification";
    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/",
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    logger("Error parsing push payload", err);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  logger("Notification clicked");
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
