import type { RssEntry } from "./rss-parser.js";

// ─── Ingestion Adapter Interface ─────────────────────────────────
//
// Abstract interface for feed/article ingestion sources.
// The existing RSS pipeline implements this via RssAdapter.
// Future sources (Congress.gov API, Federal Register, Federal Reserve,
// Census Bureau) will each provide their own adapter implementation.
//
// See ADR-004 for the full decision record.

/** Raw content fetched from a source, before parsing. */
export interface RawDocument {
  content: string;
  status: number;
  ok: boolean;
  error: string | null;
}

/** Result of a complete fetch+parse+normalize cycle. */
export interface FetchResult {
  entries: RssEntry[];
  error: string | null;
}

/**
 * An ingestion adapter knows how to fetch raw content from a source,
 * parse it into structured entries, and normalize those entries into
 * the canonical RssEntry shape for caching and enrichment.
 *
 * Each adapter encapsulates one source type (RSS, REST API, dataset, etc.).
 * The scheduler and article router consume this interface without knowing
 * the underlying source type.
 */
export interface IngestionAdapter {
  /** Human-readable adapter name (e.g. "rss", "congress-api"). */
  readonly name: string;

  /**
   * Fetch raw content from a source URL.
   * Implementations should handle transport-level concerns
   * (timeouts, redirects, SSRF protection) but NOT parsing.
   */
  fetch(url: string): Promise<RawDocument>;

  /**
   * Parse raw content into structured entries.
   * Returns an empty array if the raw content is not valid/parseable.
   */
  parse(raw: RawDocument, feedId: string, feedName: string): RssEntry[];

  /**
   * Normalize and validate parsed entries.
   * Implementations should handle deduplication, date normalization,
   * content cleanup, and validation warnings.
   */
  normalize(entries: RssEntry[], feedId: string): RssEntry[];
}