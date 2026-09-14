/**
 * High-Performance Image Local Cache Engine
 * Uses the browser CacheStorage API ('ashley-media-cache-v1') + In-Memory Object URL Map.
 * Provides 0ms instantaneous loading from local disk after first fetch / page reload,
 * eliminating network delays and lag when opening cards or modals.
 */

import { useState, useEffect } from 'react';

const CACHE_NAME = 'ashley-media-cache-v1';
const memoryCache = new Map(); // In-memory map: url -> blobObjectUrl
const inFlightRequests = new Map(); // url -> Promise<string>

/**
 * Checks if CacheStorage is supported in the current environment
 */
function isCacheStorageAvailable() {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Retrieves an image from Memory or CacheStorage, or fetches and caches it.
 * Returns a local blob: URL for instantaneous rendering.
 */
export async function getCachedImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return '';

  // 1. Instant Memory Cache (0ms in RAM)
  if (memoryCache.has(url)) {
    return memoryCache.get(url);
  }

  // 2. Prevent duplicate concurrent fetches for the same URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url);
  }

  const fetchPromise = (async () => {
    try {
      if (isCacheStorageAvailable()) {
        const cache = await window.caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse && cachedResponse.ok) {
          const blob = await cachedResponse.blob();
          if (blob && blob.size > 0) {
            const objectUrl = URL.createObjectURL(blob);
            memoryCache.set(url, objectUrl);
            return objectUrl;
          }
        }

        // Not in cache, fetch from network and persist into CacheStorage
        const networkResponse = await fetch(url, { mode: 'cors' });
        if (networkResponse.ok) {
          // Clone response because response body can only be consumed once
          await cache.put(url, networkResponse.clone()).catch(() => {});
          const blob = await networkResponse.blob();
          if (blob && blob.size > 0) {
            const objectUrl = URL.createObjectURL(blob);
            memoryCache.set(url, objectUrl);
            return objectUrl;
          }
        }
      } else {
        // Fallback: fetch blob directly
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          memoryCache.set(url, objectUrl);
          return objectUrl;
        }
      }
    } catch (err) {
      // On any network or CORS error, fall back to the original URL
    } finally {
      inFlightRequests.delete(url);
    }

    return url;
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Pre-caches an image in the background without blocking the UI.
 * Ideal for onHover on cards, pre-loading hero images before the user clicks.
 */
export function preloadAndCacheImage(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return;
  if (memoryCache.has(url)) return;

  // Use requestIdleCallback if available, otherwise setTimeout
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      getCachedImageUrl(url).catch(() => {});
    }, { timeout: 1500 });
  } else {
    setTimeout(() => {
      getCachedImageUrl(url).catch(() => {});
    }, 100);
  }
}

/**
 * React Hook: useCachedImage
 * Returns { src, isLoaded }
 * If the image is already in memory or CacheStorage, returns the local blob URL immediately.
 */
export function useCachedImage(rawUrl) {
  const [src, setSrc] = useState(() => {
    if (!rawUrl) return '';
    if (memoryCache.has(rawUrl)) return memoryCache.get(rawUrl);
    return rawUrl;
  });
  const [isLoaded, setIsLoaded] = useState(() => Boolean(rawUrl && memoryCache.has(rawUrl)));

  useEffect(() => {
    if (!rawUrl) {
      setSrc('');
      setIsLoaded(false);
      return;
    }

    if (memoryCache.has(rawUrl)) {
      setSrc(memoryCache.get(rawUrl));
      setIsLoaded(true);
      return;
    }

    let isMounted = true;
    getCachedImageUrl(rawUrl).then((cachedUrl) => {
      if (isMounted) {
        setSrc(cachedUrl);
        setIsLoaded(true);
      }
    }).catch(() => {
      if (isMounted) {
        setSrc(rawUrl);
        setIsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawUrl]);

  return { src, isLoaded };
}
