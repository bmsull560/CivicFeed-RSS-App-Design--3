import { desc, eq } from "drizzle-orm";
import { getDb } from "./connection";
import { feedEntriesCache, feedValidation, validationRuns } from "@db/schema";
import { feedRegistryById } from "@contracts/feedRegistry";

const FETCH_TIMEOUT_MS = 15_000;
/** Max redirect hops followed per feed fetch (each hop re-validated). */
const MAX_REDIRECT_HOPS = 3;
/** Max response body size accepted from a feed server (~5MB). */
export const MAX_FEED_BODY_BYTES = 5 * 1024 * 1024;

/** Host allowlist: only .gov / .mil origins may be fetched server-side. */
export function isAllowedFeedUrl(url: string): boolean {
  const allowed = checkAllowedFeedUrl(url);
  if (!allowed) {
    // Surface malformed registry entries / unexpected rejection reasons.
    console.warn(`[feeds] rejected feed URL (not an allowed .gov/.mil http(s) origin): ${url}`);
  }
  return allowed;
}

function checkAllowedFeedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    return host.endsWith(".gov") || host.endsWith(".mil");
  } catch {
    return false;
  }
}

export type FetchOutcome =
  | { kind: "ok"; xml: string; httpCode: number; latencyMs: number }
  | {
      kind: "blocked" | "dead" | "timeout";
      httpCode: number | null;
      latencyMs: number;
      error: string;
    };

/**
 * Read a response body with a hard byte cap. Returns null when the body
 * exceeds MAX_FEED_BODY_BYTES (the read is aborted at the cap, so an
 * oversized or endless body cannot exhaust memory).
 */
async function readBodyCapped(res: Response): Promise<string | null> {
  if (!res.body) {
    const text = await res.text();
    return new TextEncoder().encode(text).byteLength > MAX_FEED_BODY_BYTES
      ? null
      : text;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_FEED_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}

export async function fetchFeedRemote(url: string): Promise<FetchOutcome> {
  const started = Date.now();
  let current = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
      const res = await fetch(current, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        // Never auto-follow redirects: each Location target must be
        // re-validated against the .gov/.mil allowlist before fetching.
        redirect: "manual",
        headers: {
          "user-agent": "CivicFeed-Validator/1.0 (+civic research aggregator)",
          accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
      });
      const latencyMs = Date.now() - started;
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return {
            kind: "dead",
            httpCode: res.status,
            latencyMs,
            error: `HTTP ${res.status} redirect without Location header`,
          };
        }
        let next: string;
        try {
          // Relative redirect URLs resolve against the current URL.
          next = new URL(location, current).toString();
        } catch {
          return {
            kind: "dead",
            httpCode: res.status,
            latencyMs,
            error: "redirect to malformed Location URL",
          };
        }
        // A redirect off the allowlist is a policy rejection, not a transient
        // failure — reported as "dead" (least-wrong existing kind; "timeout"
        // would imply retryable).
        if (!isAllowedFeedUrl(next)) {
          return {
            kind: "dead",
            httpCode: res.status,
            latencyMs,
            error: "redirect to non-allowlisted host",
          };
        }
        current = next;
        continue;
      }
      if (res.status === 403 || res.status === 401) {
        return { kind: "blocked", httpCode: res.status, latencyMs, error: `HTTP ${res.status}` };
      }
      if (res.status === 404 || res.status === 410) {
        return { kind: "dead", httpCode: res.status, latencyMs, error: `HTTP ${res.status}` };
      }
      if (!res.ok) {
        // Other 4xx/5xx: treat 5xx as timeout-ish transient, 4xx as dead.
        const kind = res.status >= 500 ? "timeout" : "dead";
        return { kind, httpCode: res.status, latencyMs, error: `HTTP ${res.status}` };
      }
      const xml = await readBodyCapped(res);
      if (xml === null) {
        // Over-cap body: permanent policy rejection, reported as "dead"
        // (least-wrong existing kind; not transient, so not "timeout").
        return {
          kind: "dead",
          httpCode: res.status,
          latencyMs: Date.now() - started,
          error: "response body exceeds 5MB cap",
        };
      }
      return { kind: "ok", xml, httpCode: res.status, latencyMs: Date.now() - started };
    }
    return {
      kind: "dead",
      httpCode: null,
      latencyMs: Date.now() - started,
      error: `too many redirects (>${MAX_REDIRECT_HOPS})`,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = /timeout|abort/i.test(msg);
    return {
      kind: isTimeout ? "timeout" : "dead",
      httpCode: null,
      latencyMs,
      error: msg.slice(0, 500),
    };
  }
}

/** Lightweight item count for validation (frontend does real parsing). */
export function countItems(xml: string): number {
  const items = xml.match(/<item[\s>]/gi)?.length ?? 0;
  const entries = xml.match(/<entry[\s>]/gi)?.length ?? 0;
  return items + entries;
}

export async function getCachedFeed(feedId: string) {
  const rows = await getDb()
    .select()
    .from(feedEntriesCache)
    .where(eq(feedEntriesCache.feedId, feedId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertFeedCache(input: {
  feedId: string;
  feedName: string;
  xml: string | null;
  httpStatus: number | null;
  error: string | null;
}) {
  await getDb()
    .insert(feedEntriesCache)
    .values({
      feedId: input.feedId,
      feedName: input.feedName,
      xml: input.xml,
      httpStatus: input.httpStatus,
      error: input.error,
      fetchedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        feedName: input.feedName,
        xml: input.xml,
        httpStatus: input.httpStatus,
        error: input.error,
        fetchedAt: new Date(),
      },
    });
}

export async function getFeedPayload(feedId: string) {
  const entry = feedRegistryById.get(feedId);
  if (!entry) return { status: "unknown_feed" as const };
  if (!isAllowedFeedUrl(entry.rssUrl)) {
    return { status: "not_allowed" as const };
  }

  const cached = await getCachedFeed(feedId);
  const cacheFreshMs = 6 * 60 * 60 * 1000; // 6h
  if (
    cached?.xml &&
    cached.error == null &&
    Date.now() - cached.fetchedAt.getTime() < cacheFreshMs
  ) {
    return {
      status: "ok" as const,
      xml: cached.xml,
      fetchedAt: cached.fetchedAt,
      fromCache: true,
      httpStatus: cached.httpStatus,
    };
  }

  const outcome = await fetchFeedRemote(entry.rssUrl);
  if (outcome.kind === "ok") {
    await upsertFeedCache({
      feedId,
      feedName: entry.name,
      xml: outcome.xml,
      httpStatus: outcome.httpCode,
      error: null,
    });
    return {
      status: "ok" as const,
      xml: outcome.xml,
      fetchedAt: new Date(),
      fromCache: false,
      httpStatus: outcome.httpCode,
    };
  }

  await upsertFeedCache({
    feedId,
    feedName: entry.name,
    xml: cached?.xml ?? null,
    httpStatus: outcome.httpCode,
    error: outcome.error,
  });
  // Serve stale cache if we have it.
  if (cached?.xml) {
    return {
      status: "ok" as const,
      xml: cached.xml,
      fetchedAt: cached.fetchedAt,
      fromCache: true,
      httpStatus: cached.httpStatus,
      stale: true,
      error: outcome.error,
    };
  }
  return { status: "fetch_failed" as const, error: outcome.error };
}

export async function getValidationMap() {
  return getDb().select().from(feedValidation);
}

export type ValidationStatus = "working" | "blocked" | "dead" | "timeout";

export function classify(outcome: FetchOutcome): ValidationStatus {
  if (outcome.kind === "ok") {
    return countItems(outcome.xml) > 0 ? "working" : "dead";
  }
  return outcome.kind;
}

// In-flight guard: only one validation sweep may run at a time (the cron
// endpoint is otherwise an unauthenticated trigger for expensive fan-out).
let sweepInFlight = false;

/** Acquire the sweep mutex. Returns false when a sweep is already running. */
export function tryAcquireSweepLock(): boolean {
  if (sweepInFlight) return false;
  sweepInFlight = true;
  return true;
}

/** Release the sweep mutex (idempotent). */
export function releaseSweepLock(): void {
  sweepInFlight = false;
}

let warnedUnauthenticatedSweep = false;

/**
 * Warn once (at first use) when VALIDATION_SECRET is unset, meaning the
 * sweep trigger endpoints accept unauthenticated requests. Production
 * deployments set VALIDATION_SECRET.
 */
export function warnIfSweepUnauthenticated(): void {
  if (process.env.VALIDATION_SECRET || warnedUnauthenticatedSweep) return;
  warnedUnauthenticatedSweep = true;
  console.warn(
    "[feeds] VALIDATION_SECRET is not set — validation sweep endpoints are UNAUTHENTICATED; set it in production",
  );
}

export type SweepResult =
  | { runId: number; totals: Record<ValidationStatus, number>; checked: number }
  | { status: "already_running" };

export async function runValidationSweep(opts?: {
  feedIds?: string[];
  concurrency?: number;
}): Promise<SweepResult> {
  if (!tryAcquireSweepLock()) {
    return { status: "already_running" };
  }
  try {
    return await runValidationSweepInner(opts);
  } finally {
    releaseSweepLock();
  }
}

async function runValidationSweepInner(opts?: {
  feedIds?: string[];
  concurrency?: number;
}) {
  const db = getDb();
  const { feedRegistry } = await import("@contracts/feedRegistry");
  const targets = opts?.feedIds
    ? feedRegistry.filter((f) => opts.feedIds!.includes(f.id))
    : feedRegistry;
  const concurrency = opts?.concurrency ?? 8;

  const [run] = await db
    .insert(validationRuns)
    .values({ startedAt: new Date() })
    .$returningId();
  const runId = run.id;

  const totals: Record<ValidationStatus, number> = {
    working: 0,
    blocked: 0,
    dead: 0,
    timeout: 0,
  };

  const existing = await db.select().from(feedValidation);
  const prevById = new Map(existing.map((r) => [r.feedId, r]));

  let idx = 0;
  async function worker() {
    while (idx < targets.length) {
      const feed = targets[idx++];
      if (!isAllowedFeedUrl(feed.rssUrl)) {
        continue;
      }
      // Per-feed isolation: one DB/fetch error must not reject Promise.all
      // or abort the sweep for the remaining feeds.
      try {
        const outcome = await fetchFeedRemote(feed.rssUrl);
        const status = classify(outcome);
        totals[status] += 1;
        const prev = prevById.get(feed.id);
        const failStreak =
          status === "working" ? 0 : (prev?.failStreak ?? 0) + 1;
        await db
          .insert(feedValidation)
          .values({
            feedId: feed.id,
            lastCheckedAt: new Date(),
            lastStatus: status,
            httpCode: outcome.httpCode,
            latencyMs: outcome.latencyMs,
            failStreak,
          })
          .onDuplicateKeyUpdate({
            set: {
              lastCheckedAt: new Date(),
              lastStatus: status,
              httpCode: outcome.httpCode,
              latencyMs: outcome.latencyMs,
              failStreak,
            },
          });
        // Opportunistically refresh the cache for working feeds.
        if (outcome.kind === "ok") {
          await upsertFeedCache({
            feedId: feed.id,
            feedName: feed.name,
            xml: outcome.xml,
            httpStatus: outcome.httpCode,
            error: null,
          });
        }
      } catch (err) {
        console.error(`[feeds] sweep failed for feed ${feed.id}:`, err);
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: concurrency }, worker));
  } finally {
    // Always mark the run finished, even on failure — totals may be partial.
    await db
      .update(validationRuns)
      .set({ finishedAt: new Date(), totals })
      .where(eq(validationRuns.id, runId));
  }

  return { runId, totals, checked: targets.length };
}

export async function getLatestRun() {
  const rows = await getDb()
    .select()
    .from(validationRuns)
    .orderBy(desc(validationRuns.id))
    .limit(1);
  return rows[0] ?? null;
}
