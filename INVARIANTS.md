# Invariants — frozen 2026-10-04

These constraints are immutable for the duration of the production-finish swarm run.
Workers may not rewrite anything this file covers. Baseline: master @ 2ae39de
(42/42 vitest tests pass, `tsc -b` clean, `npm run build` succeeds).

## Interfaces

- `src/lib/rss.ts`: `parseRssXml(xmlText: string, feedId: string, feedName: string): RssEntry[]` is the ONLY XML parser; `fetchFeed(url, feedId, feedName, options?: FetchFeedOptions): Promise<FetchResult>` signature and `FetchResult { entries, error }` shape unchanged.
- `src/lib/cache.ts`: `getCachedFeed(feedId)`, `setCachedFeed(feedId, entries)`, `configureCache(partial)`, `resetCacheConfig()` — signatures unchanged. The DI seam (storage + clock injection) must be preserved.
- `src/lib/backendFeed.ts`: `fetchFeedViaBackend(feedId: string): Promise<{ xml: string } | null>` — must keep returning `null` on any failure (fallback contract).
- tRPC router (`api/router.ts`): procedure names and input schemas frozen — `ping`, `feeds.getFeed({feedId})`, `feeds.getValidationStatus()`, `feeds.runValidation({secret?, feedIds?})`. Response union shapes from `getFeedPayload` (`status: "ok" | "unknown_feed" | "not_allowed" | "fetch_failed"`) unchanged.
- `api/queries/feeds.ts` public functions: `isAllowedFeedUrl`, `fetchFeedRemote` (FetchOutcome union), `countItems`, `classify`, `getFeedPayload`, `getValidationMap`, `runValidationSweep`, `getLatestRun` — signatures and return-shape discriminants unchanged.
- `db/schema.ts`: table names, column names, and the `last_status` enum values (`working|blocked|dead|timeout`) are frozen. Additive columns only, and none needed this run.
- `contracts/feedRegistry.ts`: exports `FeedRegistryEntry`, `feedRegistry`, `feedRegistryById` — frozen shape.
- Domain seam (`src/lib/domain/*`): public exports of `index.ts` barrel frozen; pages/components must keep importing domain data only via the barrel.
- `src/providers/trpc.tsx` and graft-generated files (`api/lib/`, `api/queries/connection.ts`, `drizzle.config.ts`, `.env`): never modified.

## Typing strictness

- TypeScript `strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. No `any` (string unions, not enums). Type-only imports via `import type`.
- No new untyped boundaries; every new function fully annotated.

## Conventions

- Frontend error handling: result-union returns over throwing. Backend fetch layer: discriminated-union outcomes. Resilience pattern = backend → proxy chain → error UI (kept, but must become observable where a node contract says so).
- Frontend code never imports `api/` at runtime; the ONLY `api/router` imports are type-only (`AppRouter`) in `src/providers/trpc.tsx` and `src/lib/backendFeed.ts`.
- HashRouter stays. Node 20, Tailwind 3.4.19, Vite 7.2.4, React 19 — no dependency upgrades, no new runtime dependencies except with coordinator approval.
- Tests: vitest, colocated in `__tests__/`, behavior-through-public-interface style; existing 42 tests must stay green UNMODIFIED.

## Forbidden changes

- No schema renames/drops; no `db:push --force`; no modification of `.env` values.
- No rewrite of `src/lib/domain/*`, `api/lib/`, or graft infrastructure.
- No router change (HashRouter), no new top-level route files without coordinator signoff.
- No changes to the 505-entry feed registry contents (drift fixes go through the generator/check node only).
- No edits to the existing 42 tests; new tests are additive only.
