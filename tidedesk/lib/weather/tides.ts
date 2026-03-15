/**
 * Tide extremes service – fetches high/low tide times from Stormglass.
 * Uses in-memory cache (1h TTL) to reduce API usage on serverless.
 */
import { fetchTideExtremes, type TideExtreme } from "@/integrations/stormglass";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CacheEntry = {
  tides: TideExtreme[];
  fetchedAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Get tide extremes (high/low) for the next ~48h.
 * Results are cached for 1 hour.
 */
export async function getTides(lat: number, lng: number): Promise<TideExtreme[]> {
  const key = cacheKey(lat, lng);
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.tides;
  }

  const tides = await fetchTideExtremes(lat, lng);
  memoryCache.set(key, { tides, fetchedAt: now });
  return tides;
}
