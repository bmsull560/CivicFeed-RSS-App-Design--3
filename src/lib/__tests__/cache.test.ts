// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { RssEntry } from "../../types";
import {
  getCachedFeed,
  setCachedFeed,
  invalidateAll,
  configureCache,
  resetCacheConfig,
} from "../cache";

function makeEntry(id: string): RssEntry {
  return {
    id,
    title: `Title ${id}`,
    link: `https://example.com/${id}`,
    description: "",
    pubDate: "2024-01-01T00:00:00.000Z",
    feedId: "f",
    feedName: "F",
    fetchedAt: 0,
  };
}

function makeEntries(n: number): RssEntry[] {
  return Array.from({ length: n }, (_, i) => makeEntry(`e${i}`));
}

function makeStorage(): { storage: Storage; data: Map<string, string> } {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
  return { storage, data };
}

describe("cache", () => {
  beforeEach(() => {
    resetCacheConfig();
    invalidateAll();
    localStorage.clear();
  });

  it("returns a freshly stored feed from getCachedFeed", () => {
    setCachedFeed("f1", makeEntries(3));
    const hit = getCachedFeed("f1");
    expect(hit).not.toBeNull();
    expect(hit!.feedId).toBe("f1");
    expect(hit!.entries).toHaveLength(3);
  });

  it("treats a stored feed older than the TTL as a miss", () => {
    let now = 1_000_000;
    const { storage } = makeStorage();
    configureCache({ storage, now: () => now });
    setCachedFeed("f1", makeEntries(2));
    expect(getCachedFeed("f1")).not.toBeNull();
    now += 16 * 60 * 1000; // beyond 15-minute TTL
    expect(getCachedFeed("f1")).toBeNull();
  });

  it("evicts the least-recently-accessed feed when storing beyond the max feed count", () => {
    let now = 0;
    const { storage } = makeStorage();
    configureCache({ storage, now: () => now });
    for (let i = 0; i < 50; i++) {
      now += 1;
      setCachedFeed(`feed-${i}`, makeEntries(1));
    }
    // touch the oldest feed so it is no longer least-recently-accessed
    now += 1;
    expect(getCachedFeed("feed-0")).not.toBeNull();
    // overflow with one more feed
    now += 1;
    setCachedFeed("feed-new", makeEntries(1));
    expect(getCachedFeed("feed-0")).not.toBeNull(); // touched one survives
    expect(getCachedFeed("feed-1")).toBeNull(); // least recently accessed evicted
    expect(getCachedFeed("feed-new")).not.toBeNull();
  });

  it("evicts roughly half the entries and retries successfully on a quota-exceeded error", () => {
    let now = 0;
    const { storage, data } = makeStorage();
    configureCache({ storage, now: () => now });
    for (let i = 0; i < 40; i++) {
      now += 1;
      setCachedFeed(`feed-${i}`, makeEntries(1));
    }
    const fullSize = data.get("civicfeed_v2_cache")!.length;
    // impose a quota that cannot fit 41 feeds but fits the reduced set (~25)
    let quota = Math.floor(fullSize * 0.7);
    const realSetItem = storage.setItem.bind(storage);
    let quotaHits = 0;
    storage.setItem = (k: string, v: string) => {
      if (v.length > quota) {
        quotaHits += 1;
        const err = new Error("quota");
        err.name = "QuotaExceededError";
        throw err;
      }
      realSetItem(k, v);
    };
    now += 1;
    setCachedFeed("feed-overflow", makeEntries(1));
    expect(quotaHits).toBeGreaterThan(0);
    const stored = JSON.parse(data.get("civicfeed_v2_cache")!) as unknown[];
    // roughly half of 41 feeds survive (implementation keeps max(half, 25))
    expect(stored.length).toBeGreaterThanOrEqual(20);
    expect(stored.length).toBeLessThanOrEqual(26);
    quota = Number.POSITIVE_INFINITY;
    expect(getCachedFeed("feed-overflow")).not.toBeNull();
  });

  it("treats corrupted JSON in storage as a miss without throwing", () => {
    const { storage, data } = makeStorage();
    configureCache({ storage });
    data.set("civicfeed_v2_cache", "{not valid json!!!");
    expect(() => getCachedFeed("f1")).not.toThrow();
    expect(getCachedFeed("f1")).toBeNull();
    // cache recovers: a fresh store works afterwards
    setCachedFeed("f1", makeEntries(1));
    expect(getCachedFeed("f1")).not.toBeNull();
  });

  it("works with the default config (no configureCache call) using the wall clock", async () => {
    vi.resetModules();
    const fresh = await import("../cache");
    // intentionally NO configureCache/resetCacheConfig call: default config must
    // use Date.now, not a self-recursive clock
    fresh.setCachedFeed("fresh-1", makeEntries(2));
    const hit = fresh.getCachedFeed("fresh-1");
    expect(hit).not.toBeNull();
    expect(hit!.feedId).toBe("fresh-1");
    expect(hit!.entries).toHaveLength(2);
    // wall-clock TTL semantics: fetchedAt should be close to Date.now()
    expect(Math.abs(Date.now() - hit!.fetchedAt)).toBeLessThan(10_000);
    fresh.invalidateAll();
  });

  it("keeps quota-retry working with the default config (no configureCache call)", async () => {
    vi.resetModules();
    const fresh = await import("../cache");
    localStorage.clear();
    for (let i = 0; i < 40; i++) {
      fresh.setCachedFeed(`df-${i}`, makeEntries(1));
    }
    const fullSize = localStorage.getItem("civicfeed_v2_cache")!.length;
    const quota = Math.floor(fullSize * 0.7);
    const realSetItem = localStorage.setItem.bind(localStorage);
    let quotaHits = 0;
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation((k: string, v: string) => {
        if (v.length > quota) {
          quotaHits += 1;
          const err = new Error("quota");
          err.name = "QuotaExceededError";
          throw err;
        }
        realSetItem(k, v);
      });
    try {
      fresh.setCachedFeed("df-overflow", makeEntries(1));
      expect(quotaHits).toBeGreaterThan(0);
      const stored = JSON.parse(localStorage.getItem("civicfeed_v2_cache")!) as unknown[];
      expect(stored.length).toBeGreaterThanOrEqual(20);
      expect(stored.length).toBeLessThanOrEqual(26);
    } finally {
      spy.mockRestore();
      fresh.invalidateAll();
    }
  });

  it("warns via console.warn when stored cache JSON is corrupted", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { storage, data } = makeStorage();
      configureCache({ storage });
      data.set("civicfeed_v2_cache", "{not valid json!!!");
      expect(getCachedFeed("f1")).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("[cache]"),
        expect.anything(),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("caps stored entries per feed at 200", () => {
    setCachedFeed("f1", makeEntries(250));
    const hit = getCachedFeed("f1");
    expect(hit).not.toBeNull();
    expect(hit!.entries).toHaveLength(200);
    expect(hit!.entries[0].id).toBe("e0");
    expect(hit!.entries[199].id).toBe("e199");
  });
});
