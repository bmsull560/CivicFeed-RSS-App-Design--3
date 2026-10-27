# ADR-004: Ingestion Adapter Pattern

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

CivicFeed's ingestion layer will be abstracted behind an `IngestionAdapter` interface with three methods: `fetch()` (retrieve raw content from the source), `parse()` (parse raw content into structured documents), and `normalize()` (convert parsed documents into the canonical `RssEntry` shape for caching). The existing RSS pipeline will be refactored into an `RssAdapter` class that implements this interface. Future non-RSS sources (Congress.gov API, Federal Register API, Federal Reserve data feeds, Census Bureau data) will each be implemented as their own adapter.

## Rationale

The strategy document correctly identifies that RSS alone is insufficient (§5) — the product needs Congress.gov API, Federal Register, Federal Reserve feeds, and Census data. Without an adapter abstraction, each new source would require duplicating the fetch→parse→cache pipeline. The adapter pattern provides a common contract, makes each source independently testable, and allows the scheduler to treat all sources uniformly.

## Consequences

- New file: `backend/src/ingestion-adapter.ts` defining the `IngestionAdapter` interface and `NormalizedArticle` type.
- `rss.ts`, `rss-parser.ts`, and `cache.ts` are refactored into `RssAdapter` implementing the interface.
- The scheduler (`scheduler.ts`) and article route handler (`articlesRouter.ts`) consume the adapter interface, not concrete RSS functions.
- All existing behavior (circuit breaker, retry with jitter, SSRF protection, cache TTL) is preserved in the refactor.
- New adapters in Phase 4 can be added by implementing the interface without touching the scheduler or cache layers.