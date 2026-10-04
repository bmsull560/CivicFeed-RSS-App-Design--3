import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

/**
 * Try to fetch a feed's raw XML via the tRPC backend. Returns null when the
 * backend is unavailable (e.g. static deployment) or does not return xml,
 * so callers can fall back to the public CORS-proxy chain.
 */
export async function fetchFeedViaBackend(feedId: string): Promise<{ xml: string } | null> {
  try {
    const result = await client.feeds.getFeed.query({ feedId });
    if (result.status === "ok" && typeof result.xml === "string" && result.xml.length > 0) {
      return { xml: result.xml };
    }
    return null;
  } catch (err) {
    console.warn("[backendFeed] fallback to proxies:", err);
    return null;
  }
}
