/// <reference lib="webworker" />

const CACHE_VERSION = "v1";
const STATIC_CACHE = `tidedesk-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tidedesk-runtime-${CACHE_VERSION}`;
const API_CACHE = `tidedesk-api-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/dashboard",
  "/beach",
  "/bookings",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const CACHEABLE_API_PATTERNS = [
  /\/api\/bookings/,
  /\/api\/customers/,
  /\/api\/equipment/,
  /\/api\/dashboard/,
  /\/api\/business/,
  /\/api\/public\/schools/,
];

const MUTATION_URLS = [
  "/api/bookings",
  "/api/rentals",
  "/api/check-in",
];

// ─── Install ───────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith("tidedesk-") &&
                k !== STATIC_CACHE &&
                k !== RUNTIME_CACHE &&
                k !== API_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategies ──────────────────────────────────────

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isCacheableApi(url) {
  return CACHEABLE_API_PATTERNS.some((rx) => rx.test(url.pathname));
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ico)$/i.test(
    url.pathname
  );
}

function isNextDataOrRsc(url) {
  return (
    url.pathname.startsWith("/_next/") ||
    url.searchParams.has("_rsc") ||
    url.searchParams.has("__flight__")
  );
}

/**
 * Network-first with cache fallback.
 * Used for navigation and API data — always try fresh first.
 */
async function networkFirst(request, cacheName, timeoutMs = 3000) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(id);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || null;
  }
}

/**
 * Stale-while-revalidate: serve cache immediately, update in background.
 * Used for API data shown on dashboard/beach.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise);
}

/**
 * Cache-first with network fallback.
 * Used for static assets (JS, CSS, images, fonts).
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return null;
  }
}

// ─── Main fetch handler ────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") {
    event.respondWith(handleMutation(request));
    return;
  }

  // Static assets → cache-first
  if (isStaticAsset(url) || isNextDataOrRsc(url)) {
    event.respondWith(
      cacheFirst(request, RUNTIME_CACHE).then(
        (r) => r || fetch(request)
      )
    );
    return;
  }

  // Cacheable API calls → stale-while-revalidate
  if (isApiRequest(url) && isCacheableApi(url)) {
    event.respondWith(
      staleWhileRevalidate(request, API_CACHE).then(
        (r) => r || new Response('{"error":"offline"}', {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Navigation → network-first with offline fallback
  if (isNavigationRequest(request)) {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).then(async (r) => {
        if (r) return r;
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response("Offline", { status: 503 });
      })
    );
    return;
  }
});

// ─── Mutation queueing (Background Sync) ───────────────────
async function handleMutation(request) {
  try {
    return await fetch(request);
  } catch {
    if (request.method === "POST" || request.method === "PATCH") {
      const body = await request.clone().text();
      await enqueueSync({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body,
        timestamp: Date.now(),
      });
      return new Response(
        JSON.stringify({ queued: true, message: "Saved offline — will sync when back online." }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response('{"error":"offline"}', {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── IndexedDB sync queue ──────────────────────────────────
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("tidedesk-sync", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueSync(item) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    tx.objectStore("queue").add(item);
    tx.oncomplete = () => {
      resolve();
      if (self.registration && "sync" in self.registration) {
        self.registration.sync.register("tidedesk-sync");
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function drainSyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction("queue", "readonly");
  const store = tx.objectStore("queue");

  const items = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      const resp = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (resp.ok || resp.status < 500) {
        const delTx = db.transaction("queue", "readwrite");
        delTx.objectStore("queue").delete(item.id);
        await new Promise((r) => { delTx.oncomplete = r; });
      }
    } catch {
      break;
    }
  }

  const remaining = await new Promise((resolve) => {
    const countTx = db.transaction("queue", "readonly");
    const req = countTx.objectStore("queue").count();
    req.onsuccess = () => resolve(req.result);
  });

  self.clients.matchAll().then((clients) => {
    clients.forEach((c) =>
      c.postMessage({ type: "SYNC_COMPLETE", remaining })
    );
  });
}

// ─── Background Sync event ─────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "tidedesk-sync") {
    event.waitUntil(drainSyncQueue());
  }
});

// ─── Periodic retry on message ─────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "RETRY_SYNC") {
    drainSyncQueue();
  }
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
