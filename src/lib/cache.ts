import type { RssEntry, CacheEntry } from "../types";

const CACHE_KEY = "civicfeed_v2_cache";
const MAX_CACHED_FEEDS = 50;
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES_PER_FEED = 200;

interface CacheConfig {
  storage: Storage;
  now: () => number;
}

let config: CacheConfig = {
  storage: typeof localStorage !== "undefined" ? localStorage : (undefined as unknown as Storage),
  now: () => Date.now(),
};

export function configureCache(overrides: Partial<CacheConfig>): void {
  config = { ...config, ...overrides };
}

export function resetCacheConfig(): void {
  config = { storage: localStorage, now: () => Date.now() };
}

function loadCache(): CacheEntry[] {
  try {
    const raw = config.storage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[cache] failed to load cache, treating as empty", e);
    return [];
  }
}

function saveCache(entries: CacheEntry[]): void {
  try {
    config.storage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (e) {
    if (e instanceof Error && e.name === "QuotaExceededError") {
      const half = Math.floor(entries.length / 2);
      const reduced = entries
        .sort((a, b) => b.accessedAt - a.accessedAt)
        .slice(0, Math.max(half, 25));
      try {
        config.storage.setItem(CACHE_KEY, JSON.stringify(reduced));
      } catch (retryError) {
        console.warn("[cache] quota retry failed, cache write dropped", retryError);
      }
    }
  }
}

export function getCachedFeed(feedId: string): CacheEntry | null {
  const cache = loadCache();
  const entry = cache.find(e => e.feedId === feedId);
  if (!entry) return null;
  if (config.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  entry.accessedAt = config.now();
  saveCache(cache);
  return entry;
}

export function setCachedFeed(feedId: string, entries: RssEntry[]): void {
  const cache = loadCache();
  entries = entries.slice(0, MAX_ENTRIES_PER_FEED);
  const existingIdx = cache.findIndex(e => e.feedId === feedId);
  const now = config.now();
  if (existingIdx >= 0) {
    cache[existingIdx] = { feedId, entries, fetchedAt: now, accessedAt: now };
  } else {
    if (cache.length >= MAX_CACHED_FEEDS) {
      cache.sort((a, b) => a.accessedAt - b.accessedAt);
      cache.shift();
    }
    cache.push({ feedId, entries, fetchedAt: now, accessedAt: now });
  }
  saveCache(cache);
}

export function invalidateFeed(feedId: string): void {
  const cache = loadCache();
  saveCache(cache.filter(e => e.feedId !== feedId));
}

export function invalidateAll(): void {
  try {
    config.storage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn("[cache] failed to clear cache", e);
  }
}

export function getCacheStats(): { totalCached: number; oldestFetch: number | null } {
  const cache = loadCache();
  if (cache.length === 0) return { totalCached: 0, oldestFetch: null };
  return { totalCached: cache.length, oldestFetch: Math.min(...cache.map(e => e.fetchedAt)) };
}

export function getAllCachedEntries(): { feedId: string; feedName: string; entries: RssEntry[] }[] {
  return loadCache()
    .filter(e => config.now() - e.fetchedAt <= CACHE_TTL_MS)
    .map(e => ({ feedId: e.feedId, feedName: e.entries[0]?.feedName || e.feedId, entries: e.entries }));
}
