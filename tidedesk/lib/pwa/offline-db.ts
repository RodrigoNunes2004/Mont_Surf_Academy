"use client";

/**
 * Lightweight IndexedDB wrapper for offline API data caching.
 *
 * Stores JSON responses keyed by API path with TTL-based expiry.
 * Used by the dashboard, bookings list, and beach mode to display
 * stale data when the network is unavailable.
 */

const DB_NAME = "tidedesk-offline";
const DB_VERSION = 1;
const STORE_NAME = "api-cache";
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  cachedAt: number;
  ttl: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedData<T = unknown>(
  key: string
): Promise<{ data: T; stale: boolean } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        const age = Date.now() - entry.cachedAt;
        resolve({ data: entry.data, stale: age > entry.ttl });
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedData<T = unknown>(
  key: string,
  data: T,
  ttl = DEFAULT_TTL_MS
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const entry: CacheEntry<T> = { key, data, cachedAt: Date.now(), ttl };
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } catch {
    // Silently fail
  }
}

/**
 * Fetch with offline fallback.
 * Tries network first; on success stores the response in IndexedDB.
 * On failure, returns the cached version (if any).
 */
export async function fetchWithOfflineCache<T = unknown>(
  url: string,
  init?: RequestInit,
  ttl = DEFAULT_TTL_MS
): Promise<{ data: T; offline: boolean }> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    setCachedData(url, data, ttl);
    return { data, offline: false };
  } catch {
    const cached = await getCachedData<T>(url);
    if (cached) {
      return { data: cached.data, offline: true };
    }
    throw new Error("Network unavailable and no cached data");
  }
}
