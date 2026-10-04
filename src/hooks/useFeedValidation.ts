import { useEffect, useMemo, useRef } from "react";
import { trpc } from "../providers/trpc";

export type FeedValidationStatus = "working" | "blocked" | "dead" | "timeout";

/**
 * Map of feedId -> last validation status from the backend validation sweep.
 * Returns an empty map when the backend is unreachable (static deployment).
 */
export function useFeedValidation(): Map<string, FeedValidationStatus> {
  const query = trpc.feeds.getValidationStatus.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const hadErrorRef = useRef(false);
  useEffect(() => {
    const hasError = Boolean(query.error);
    if (hasError && !hadErrorRef.current) {
      console.warn("[useFeedValidation] validation status unavailable:", query.error);
    }
    hadErrorRef.current = hasError;
  }, [query.error]);

  return useMemo(() => {
    const map = new Map<string, FeedValidationStatus>();
    if (query.error || !query.data) return map;
    for (const row of query.data.statuses) {
      map.set(row.feedId, row.lastStatus);
    }
    return map;
  }, [query.data, query.error]);
}

/** Last validated status for a single feed, or null if unknown/unavailable. */
export function useFeedStatus(feedId: string): FeedValidationStatus | null {
  const statuses = useFeedValidation();
  return statuses.get(feedId) ?? null;
}
