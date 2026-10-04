// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { FetchState, RssEntry } from "../../types";

vi.mock("../../lib/rss", () => ({
  fetchFeed: vi.fn(),
  parseRssXml: vi.fn(),
}));
vi.mock("../../lib/backendFeed", () => ({
  fetchFeedViaBackend: vi.fn(),
}));
vi.mock("../../lib/cache", () => ({
  getCachedFeed: vi.fn(),
  setCachedFeed: vi.fn(),
}));

import { useRssFeed } from "../useRssFeed";
import { fetchFeed, parseRssXml } from "../../lib/rss";
import { fetchFeedViaBackend } from "../../lib/backendFeed";
import { getCachedFeed } from "../../lib/cache";

const mockFetchFeed = vi.mocked(fetchFeed);
const mockParseRssXml = vi.mocked(parseRssXml);
const mockBackend = vi.mocked(fetchFeedViaBackend);
const mockGetCached = vi.mocked(getCachedFeed);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type HookResult = FetchState & { refresh: () => void };

interface HookHandle<T> {
  result: { current: T };
  unmount: () => void;
}

function renderHook<T>(hook: () => T): HookHandle<T> {
  const result = { current: undefined as unknown as T };
  function Probe(): null {
    result.current = hook();
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(Probe));
  });
  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

const sampleEntry: RssEntry = {
  id: "e1",
  title: "Entry",
  link: "https://example.com/1",
  description: "desc",
  pubDate: "2026-01-01",
  feedId: "f1",
  feedName: "Feed One",
  fetchedAt: 0,
};

describe("useRssFeed bounded retry", () => {
  let handle: HookHandle<HookResult> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGetCached.mockReturnValue(null);
  });

  afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
  });

  it("gives up after at most 3 retries with 2s/4s/8s backoff and stays in error state", async () => {
    mockBackend.mockResolvedValue(null);
    mockFetchFeed.mockResolvedValue({ entries: [], error: "boom" });

    handle = renderHook(() => useRssFeed("https://example.com/rss", "f1", "Feed One"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(handle.result.current.status).toBe("error");
    expect(handle.result.current.error).toBe("boom");
    expect(mockFetchFeed).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mockFetchFeed).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(mockFetchFeed).toHaveBeenCalledTimes(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(mockFetchFeed).toHaveBeenCalledTimes(4);

    // No further retries: timers exhausted, stable error state.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mockFetchFeed).toHaveBeenCalledTimes(4);
    expect(handle.result.current.status).toBe("error");
    expect(handle.result.current.error).toBe("boom");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("short-circuits the proxy chain when the backend returns XML", async () => {
    mockBackend.mockResolvedValue({ xml: "<rss/>" });
    mockParseRssXml.mockReturnValue([sampleEntry]);

    handle = renderHook(() => useRssFeed("https://example.com/rss", "f1", "Feed One"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(handle.result.current.status).toBe("success");
    expect(handle.result.current.entries).toEqual([sampleEntry]);
    expect(mockFetchFeed).not.toHaveBeenCalled();
  });

  it("short-circuits everything on a cache hit", async () => {
    mockGetCached.mockReturnValue({
      feedId: "f1",
      entries: [sampleEntry],
      fetchedAt: 1234,
      accessedAt: 1234,
    });

    handle = renderHook(() => useRssFeed("https://example.com/rss", "f1", "Feed One"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(handle.result.current.status).toBe("success");
    expect(handle.result.current.entries).toEqual([sampleEntry]);
    expect(handle.result.current.lastFetched).toBe(1234);
    expect(mockBackend).not.toHaveBeenCalled();
    expect(mockFetchFeed).not.toHaveBeenCalled();
  });
});
