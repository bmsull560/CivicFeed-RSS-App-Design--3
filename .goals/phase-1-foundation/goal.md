# Goal: Phase 1 Foundation — Consumer Government News Architecture

## User Request

Implement Phase 1: Foundation (Sprints 1-2) of the Consumer Government News Strategy architectural evolution. This phase establishes the architectural decisions, data model extensions, and ingestion abstraction needed before any consumer-facing features can be built. The four deliverables are:

1. **7 Architecture Decision Records** (ADR-001 through ADR-007) as lightweight decision documents
2. **Consumer topic taxonomy** — a 6-topic taxonomy (Cost of Living, Taxes & Your Money, Health & Safety, Jobs & Wages, Laws & Decisions, Your Community) with all 590+ feeds mapped to topics
3. **Schema migration** — Migration 6 adding `document_type`, `evidence_tier`, `consumer_topics` columns to `article_cache`; Migration 7 adding `consumer_topics` column to `feeds`
4. **IngestionAdapter interface** — define the adapter interface and refactor existing RSS pipeline (`rss.ts` + `rss-parser.ts` + `cache.ts`) into an `RssAdapter` implementation

## Refined Goal

Establish the architectural foundation for evolving CivicFeed from a Level 1 "Government RSS Reader" into a Level 2 "Government News Intelligence" platform. This means: (a) documenting the key architectural decisions that govern the evolution, (b) defining the consumer-facing topic taxonomy and mapping every existing feed to it, (c) extending the database schema to support document type classification, evidence tiering, and consumer topic assignment, and (d) abstracting the ingestion layer behind an adapter interface so that non-RSS sources (Congress.gov API, Federal Register, etc.) can be added in later phases without rewriting the core pipeline.

## Acceptance Criteria

- [ ] AC1: Seven ADR files exist at `docs/architecture/ADR-001` through `ADR-007` covering: Consumer Topic Taxonomy, Structured Enrichment Pipeline, Evidence Tier Model, Ingestion Adapter Pattern, Document Status State Machine, Authentication Decision, and Frontend Navigation Architecture. Each ADR is 1-2 paragraphs with decision, rationale, and consequences.
- [ ] AC2: A consumer topic taxonomy file exists (location TBD by Builder — suggested `src/lib/consumerTopics.ts` or `backend/src/consumer-topics.ts`) defining the 6 consumer life topics with labels, descriptions, and icons. A feed-to-topic mapping covers all 590+ feeds in `backend/src/feeds.ts`.
- [ ] AC3: Migration 6 adds `document_type TEXT`, `evidence_tier TEXT`, and `consumer_topics TEXT` columns to `article_cache`. Migration 7 adds `consumer_topics TEXT` column to `feeds`. Both migrations apply cleanly to a fresh database and are idempotent.
- [ ] AC4: An `IngestionAdapter` interface is defined (suggested: `backend/src/ingestion-adapter.ts`) with `fetch()`, `parse()`, and `normalize()` methods. The existing RSS pipeline (`rss.ts`, `rss-parser.ts`, `cache.ts`) is refactored into an `RssAdapter` that implements this interface. All existing behavior is preserved.
- [ ] AC5: All existing quality gates pass: root `npm run lint`, `npm run format:check`, `npm run type-check`, `npm run build`, and backend `npm run lint`, `npm run type-check`, `npm test`.
- [ ] AC6: No existing tests are weakened or removed. New tests are added for the IngestionAdapter interface contract and the RssAdapter implementation.

## Scope Boundaries

**In scope:**
- Creating 7 ADR markdown files in `docs/architecture/`
- Defining the 6-topic consumer taxonomy and mapping all feeds
- Writing Migration 6 and Migration 7 in `backend/src/migrations.ts`
- Defining the `IngestionAdapter` TypeScript interface
- Refactoring `rss.ts`, `rss-parser.ts`, and `cache.ts` into an `RssAdapter` class
- Adding tests for the adapter contract
- Updating `DATA_MODEL.md` to reflect new columns
- Updating `ARCHITECTURE.md` to reflect the adapter pattern

**Out of scope:**
- Any AI pipeline changes (structured extraction, multi-step enrichment)
- Any frontend UI changes (topic navigation, onboarding, Story Detail page)
- Non-RSS ingestion adapters (Congress.gov, Federal Register, etc.)
- Change detection / "what changed" implementation
- Cross-feed deduplication
- Authentication or user accounts
- Any changes to `PRODUCT_VISION.md` or `AGENTS.md`
- Production deployment

## Applicable Project Conventions

**Quality gate command:**
```bash
npm run lint && npm run format:check && npm run type-check && npm run build && cd backend && npm run lint && npm run type-check && npm test
```

**Commit convention:**
- Conventional commits: `type(scope): description` (≤72 chars)
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Builder marker: `[B]` in title (e.g., `feat(backend): [B] add IngestionAdapter interface`)
- Inspector marker: `[I]` in title (e.g., `chore(docs): [I] flag missing ADR rationale`)
- Assisted-by trailer: `Assisted-by: OpenAI:GPT-5.6 Luna` (Builder) or `Assisted-by: OpenAI:GPT-5.6 Sol` (Inspector)

**Guidelines:**
- `AGENTS.md` — project overview, required commands, scope boundaries, architectural constraints, coding conventions, testing expectations
- `docs/governance/CHANGE_GATES.md` — 10 change gates (Capability Discovery, Necessity, Contract Resolution, Source-of-Truth Control, Architecture, Security, Scope, Drift Control, plus 2 more)
- `docs/governance/DECISION_TEMPLATE.md` — full ADR template (use lightweight subset for this phase)

**Rules (from AGENTS.md):**
- Strict TypeScript everywhere; avoid `any`. Use `unknown` + narrowing.
- Format all files with Prettier (`npm run format`).
- Keep changes minimal and reviewable; do not mix unrelated refactors.
- Prefer explicit error handling with structured logging.
- Express route handlers must validate inputs at trust boundaries.
- Add or update unit tests for new backend behavior.
- Do not weaken tests or skip assertions.
- Mock external RSS/AI services in unit tests.
- Never commit secrets, API keys, or credentials.
- External HTTP calls must use timeouts, bounded retries with jitter.
- Re-thrown errors should preserve the original cause.

**Key architectural constraints (from ARCHITECTURE.md):**
1. Single source of truth for feeds: `backend/src/feeds.ts`
2. Backend owns RSS: all fetching, parsing, caching in backend
3. No public CORS proxies
4. Async enrichment: AI runs in background queue
5. No double caching: HTTP cache headers over localStorage

**Existing migration system (from migrations.ts):**
- Numbered, transactional, idempotent migrations
- Schema-drift protection (refuses to start if DB ahead of code)
- Current migrations: 1 (initial_schema), 2 (fts5_search_index), 3 (feed_fetch_status), 4 (feed_health_status), 5 (enrichment_jobs_queue)
- New migrations must be added to `civicfeedMigrations` array with next sequential IDs (6, 7)