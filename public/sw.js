// Sathi service worker (hand-written, see CLAUDE.md stack).
// Offline model: HTML pages network-first with cache fallback; static assets cache-first.
// Client-side (RSC) navigations that fail offline fall back to a full page load in
// Next.js, which then hits the cached HTML below.
const CACHE_NAME = "sathi-v4";
// The pre-pivot /plan is no longer linked from anywhere, so it is no longer
// worth a trekker's bytes. Community is left out on purpose: the landing page
// says it needs a connection, and precaching it would quietly make that a lie.
const PAGES = ["/", "/trek", "/sos", "/routes", "/routes/ebc", "/settings", "/offline"];
const STATIC = ["/manifest.webmanifest", "/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png"];

// Precache the pages trekkers need offline and every script/style they reference.
async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(STATIC);
  const assets = new Set();
  for (const page of PAGES) {
    try {
      const response = await fetch(page, { credentials: "same-origin" });
      // A redirect (e.g. to /login) must never be cached as the page.
      if (!response.ok || response.redirected) continue;
      const html = await response.clone().text();
      await cache.put(page, response);
      for (const match of html.matchAll(/\/_next\/static\/[^"'\s)]+/g)) assets.add(match[0]);
    } catch {
      // A page that fails now is cached the first time it's visited online.
    }
  }
  await Promise.all([...assets].map((url) => cache.add(url).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/basemaps-assets/") ||
    url.pathname.startsWith("/maplibre/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(url.pathname)
            .then((cached) => cached || caches.match("/offline"))
            .then((cached) => cached || Response.error()),
        ),
    );
  }
});
