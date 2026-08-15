/* Leftover / broken workers were intercepting CloudFront logo fetches and
   returning no Response (console: Failed to convert value to 'Response').
   This file exists so /sw.js is a valid worker, then it uninstalls itself. */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        if ("navigate" in client) client.navigate(client.url);
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
