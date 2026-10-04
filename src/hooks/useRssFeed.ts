import { useState, useEffect, useRef, useCallback } from "react";
import type { FetchState } from "../types";
import { fetchFeed, parseRssXml } from "../lib/rss";
import { fetchFeedViaBackend } from "../lib/backendFeed";
import { getCachedFeed, setCachedFeed } from "../lib/cache";

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [2000, 4000, 8000] as const;

/** Resolves true when the delay elapsed, false when aborted first. */
function waitWithAbort(ms: number, signal: AbortSignal, timerRef: { current: ReturnType<typeof setTimeout> | null }): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      timerRef.current = null;
      resolve(true);
    }, ms);
    timerRef.current = timer;
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        timerRef.current = null;
        resolve(false);
      },
      { once: true },
    );
  });
}

export function useRssFeed(feedUrl: string, feedId: string, feedName: string): FetchState & { refresh: () => void } {
  const [state, setState] = useState<FetchState>({ status: "idle", entries: [], error: null, lastFetched: null });
  const abortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(async (force: boolean) => {
    if (!feedUrl) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!force) {
      const cached = getCachedFeed(feedId);
      if (cached && cached.entries.length > 0) {
        setState({ status: "success", entries: cached.entries, error: null, lastFetched: cached.fetchedAt });
        return;
      }
    }
    for (let attempt = 0; ; attempt += 1) {
      setState(s => ({ ...s, status: "loading", error: null }));
      // Backend-first: try the tRPC backend, then fall back to the proxy chain.
      const backend = await fetchFeedViaBackend(feedId);
      if (controller.signal.aborted) return;
      if (backend) {
        const entries = parseRssXml(backend.xml, feedId, feedName);
        if (entries.length > 0) {
          setCachedFeed(feedId, entries);
          setState({ status: "success", entries, error: null, lastFetched: Date.now() });
          return;
        }
      }
      const result = await fetchFeed(feedUrl, feedId, feedName);
      if (controller.signal.aborted) return;
      if (!result.error && result.entries.length > 0) {
        setCachedFeed(feedId, result.entries);
        setState({ status: "success", entries: result.entries, error: null, lastFetched: Date.now() });
        return;
      }
      setState({ status: "error", entries: [], error: result.error || "No entries found", lastFetched: null });
      if (attempt >= MAX_RETRIES) return;
      const elapsed = await waitWithAbort(RETRY_BACKOFF_MS[attempt], controller.signal, retryTimerRef);
      if (!elapsed || controller.signal.aborted) return;
    }
  }, [feedUrl, feedId, feedName]);

  useEffect(() => {
    void doFetch(false);
    // Aborting also clears any pending retry timer via waitWithAbort's abort listener.
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [doFetch]);

  const refresh = useCallback(() => { void doFetch(true); }, [doFetch]);
  return { ...state, refresh };
}
