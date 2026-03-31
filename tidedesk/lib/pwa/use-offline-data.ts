"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithOfflineCache } from "./offline-db";

interface UseOfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  refresh: () => void;
}

/**
 * Hook that fetches JSON from `url`, caching in IndexedDB.
 * When offline, transparently returns cached data.
 */
export function useOfflineData<T = unknown>(
  url: string | null,
  ttlMs?: number
): UseOfflineDataResult<T> {
  const [result, setResult] = useState<{
    data: T | null;
    error: string | null;
    offline: boolean;
    settled: boolean;
  }>({ data: null, error: null, offline: false, settled: !url });
  const [tick, setTick] = useState(0);

  const [prevUrl, setPrevUrl] = useState(url);
  if (prevUrl !== url) {
    setPrevUrl(url);
    setResult({ data: null, error: null, offline: false, settled: !url });
  }

  const refresh = useCallback(() => {
    setResult((prev) => ({ ...prev, settled: false }));
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    fetchWithOfflineCache<T>(url, undefined, ttlMs)
      .then(({ data: d, offline: o }) => {
        if (cancelled) return;
        setResult({ data: d, error: null, offline: o, settled: true });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setResult((prev) => ({
          ...prev,
          error: err.message,
          settled: true,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [url, ttlMs, tick]);

  return {
    data: result.data,
    loading: !result.settled,
    error: result.error,
    offline: result.offline,
    refresh,
  };
}
