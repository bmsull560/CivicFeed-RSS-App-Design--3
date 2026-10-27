import type { IngestionAdapter, RawDocument, FetchResult } from "./ingestion-adapter.js";
import { guardedFetch } from "./url-security.js";
import { parseRssXml, type RssEntry } from "./rss-parser.js";
import { db } from "./db.js";
import { logger } from "./logger.js";

// ─── Configuration ───────────────────────────────────────────────

const SUCCESS_INTERVAL_MS = 15 * 60 * 1000;
const FAILURE_INTERVAL_MS = 5 * 60 * 1000;

const MAX_RETRIES = 2; // 1 initial attempt + 2 retries = 3 total
const RETRY_BASE_MS = 500;
const RETRY_MAX_MS = 4_000;

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 5 * 60 * 1000;

// ─── Circuit Breaker ─────────────────────────────────────────────

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureAt: number | null;
  openedAt: number | null;
}

// ─── RssAdapter ──────────────────────────────────────────────────

/**
 * RSS/Atom feed ingestion adapter.
 *
 * Encapsulates the full RSS fetch→parse→validate pipeline behind the
 * IngestionAdapter interface. Preserves all existing behavior:
 * circuit breaker, retry with exponential backoff + jitter,
 * SSRF protection via guardedFetch, and feed fetch status tracking.
 *
 * See ADR-004 for the adapter pattern decision.
 */
export class RssAdapter implements IngestionAdapter {
  readonly name = "rss";

  private circuitBreakers = new Map<string, CircuitBreaker>();

  // ── IngestionAdapter implementation ──────────────────────────

  async fetch(url: string): Promise<RawDocument> {
    return guardedFetch(url);
  }

  parse(raw: RawDocument, feedId: string, feedName: string): RssEntry[] {
    if (!raw.ok) return [];
    return parseRssXml(raw.content, feedId, feedName);
  }

  normalize(entries: RssEntry[], feedId: string): RssEntry[] {
    this.validateEntries(entries, feedId);
    return entries;
  }

  // ── Full fetch cycle (circuit breaker + retry + parse + normalize) ──

  async fetchFeed(url: string, feedId: string, feedName: string): Promise<FetchResult> {
    const cb = this.getCircuitBreaker(feedId);
    const now = Date.now();

    if (!this.shouldAllow(cb, now)) {
      const remainingMs = (cb.openedAt ?? now) + CIRCUIT_OPEN_MS - now;
      const message = `Circuit breaker open for feed ${feedId} (${Math.ceil(remainingMs / 1000)}s remaining)`;
      logger.warn("feed fetch circuit breaker open", { feedId, remainingMs });
      this.recordFeedFailure(feedId, message, now);
      return { entries: [], error: message };
    }

    logger.info("feed fetch attempt", { feedId, url });

    let lastError = "";
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = this.backoffMs(attempt - 1);
        logger.info("feed fetch retry", { feedId, attempt, delayMs: delay });
        await this.sleep(delay);
      }

      const raw = await this.fetch(url);

      if (raw.ok) {
        const entries = this.parse(raw, feedId, feedName);
        if (entries.length === 0) {
          const message = "No entries parsed";
          logger.warn("feed fetch returned no entries", { feedId });
          lastError = message;
          continue;
        }

        this.normalize(entries, feedId);
        this.recordFeedSuccess(feedId, now);
        this.recordCircuitSuccess(cb, feedId);
        logger.info("feed fetch success", { feedId, entryCount: entries.length });
        return { entries, error: null };
      }

      lastError = raw.error || `HTTP ${raw.status}`;
      const isRetryable =
        raw.status >= 500 || raw.status === 429 || raw.status === 408 || raw.status === 0;

      logger.warn("feed fetch attempt failed", {
        feedId,
        attempt,
        status: raw.status,
        error: lastError,
        retryable: isRetryable,
      });

      if (!isRetryable) break;
    }

    this.recordFeedFailure(feedId, lastError, now);
    this.recordCircuitFailure(cb, feedId, now);
    logger.warn("feed fetch failed after retries", {
      feedId,
      error: lastError,
      attempts: MAX_RETRIES + 1,
    });
    return { entries: [], error: lastError };
  }

  // ── Circuit breaker helpers ───────────────────────────────────

  private getCircuitBreaker(feedId: string): CircuitBreaker {
    let cb = this.circuitBreakers.get(feedId);
    if (!cb) {
      cb = { state: "closed", failures: 0, lastFailureAt: null, openedAt: null };
      this.circuitBreakers.set(feedId, cb);
    }
    return cb;
  }

  private shouldAllow(cb: CircuitBreaker, now = Date.now()): boolean {
    if (cb.state === "closed") return true;
    if (cb.state === "open") {
      if (cb.openedAt && now - cb.openedAt >= CIRCUIT_OPEN_MS) {
        cb.state = "half-open";
        logger.info("circuit breaker half-open", { state: "half-open" });
        return true;
      }
      return false;
    }
    return true;
  }

  private recordCircuitSuccess(cb: CircuitBreaker, feedId: string) {
    if (cb.state !== "closed") {
      logger.info("circuit breaker closed", { feedId });
    }
    cb.state = "closed";
    cb.failures = 0;
    cb.lastFailureAt = null;
    cb.openedAt = null;
  }

  private recordCircuitFailure(cb: CircuitBreaker, feedId: string, now = Date.now()) {
    cb.failures += 1;
    cb.lastFailureAt = now;

    if (cb.state === "half-open") {
      cb.state = "open";
      cb.openedAt = now;
      logger.warn("circuit breaker opened after half-open failure", {
        feedId,
        failures: cb.failures,
      });
      return;
    }

    if (cb.failures >= CIRCUIT_FAILURE_THRESHOLD) {
      cb.state = "open";
      cb.openedAt = now;
      logger.warn("circuit breaker opened", { feedId, failures: cb.failures });
    }
  }

  // ── Feed status tracking ──────────────────────────────────────

  private recordFeedSuccess(feedId: string, now = Date.now()) {
    const stmt = db.prepare(`
      INSERT INTO feed_fetch_status (feed_id, last_success_at, attempt_count, success_count, next_fetch_at)
      VALUES (?, ?, 1, 1, ?)
      ON CONFLICT(feed_id) DO UPDATE SET
        last_success_at = excluded.last_success_at,
        attempt_count = attempt_count + 1,
        success_count = success_count + 1,
        next_fetch_at = excluded.next_fetch_at,
        last_error_message = NULL
    `);
    stmt.run(feedId, now, now + SUCCESS_INTERVAL_MS);
  }

  private recordFeedFailure(feedId: string, errorMessage: string, now = Date.now()) {
    const stmt = db.prepare(`
      INSERT INTO feed_fetch_status (feed_id, last_error_at, last_error_message, attempt_count, failure_count, next_fetch_at)
      VALUES (?, ?, ?, 1, 1, ?)
      ON CONFLICT(feed_id) DO UPDATE SET
        last_error_at = excluded.last_error_at,
        last_error_message = excluded.last_error_message,
        attempt_count = attempt_count + 1,
        failure_count = failure_count + 1,
        next_fetch_at = excluded.next_fetch_at
    `);
    stmt.run(feedId, now, errorMessage, now + FAILURE_INTERVAL_MS);
  }

  // ── Validation ────────────────────────────────────────────────

  private validateEntries(entries: RssEntry[], feedId: string) {
    const seenIds = new Set<string>();
    const now = Date.now();
    const issues: string[] = [];

    for (const entry of entries) {
      if (!entry.title || entry.title.trim().length === 0) {
        issues.push(`Entry ${entry.id} has empty title`);
      }
      if (!entry.link || entry.link.trim().length === 0) {
        issues.push(`Entry ${entry.id} has empty link`);
      }
      if (seenIds.has(entry.id)) {
        issues.push(`Duplicate entry id: ${entry.id}`);
      }
      seenIds.add(entry.id);
      const pubTime = new Date(entry.pubDate).getTime();
      if (!isNaN(pubTime) && pubTime > now + 10 * 60 * 1000) {
        issues.push(`Entry ${entry.id} has future date: ${entry.pubDate}`);
      }
    }

    if (issues.length > 0) {
      logger.warn("feed validation issues", { feedId, issues: issues.slice(0, 5) });
    }
  }

  // ── Utilities ─────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private backoffMs(attempt: number): number {
    const base = RETRY_BASE_MS * 2 ** attempt;
    const capped = Math.min(base, RETRY_MAX_MS);
    return Math.floor(Math.random() * capped);
  }

  // ── Test helpers ──────────────────────────────────────────────

  /** Reset circuit-breaker state for a feed; useful in tests. */
  resetCircuitBreaker(feedId: string) {
    this.circuitBreakers.delete(feedId);
  }

  /** Get circuit-breaker state for a feed; useful for observability. */
  getCircuitBreakerState(feedId: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(feedId);
  }
}

/** Singleton instance for use by the scheduler and article router. */
export const rssAdapter = new RssAdapter();