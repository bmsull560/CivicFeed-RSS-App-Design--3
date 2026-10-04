# Verifier v3 — TDD Feed-Pipeline Acceptance Criteria

Objective: test-driven hardening of src/lib/rss.ts + src/lib/cache.ts (15 RED→GREEN cycles).

## Acceptance criteria
1. 15 new behavior tests exist (rss.test.ts 9, cache.test.ts 6), integration-style through public interfaces, mocks only at fetch/storage/clock boundaries.
2. New behaviors implemented test-first: non-https feed rejection with zero network attempts; 200-entry per-feed cache cap.
3. DI added backward-compatibly: fetchFeed options (fetchImpl/timeoutMs), configureCache (storage/now); useRssFeed untouched; no `any`.
4. Full suite green: `npx vitest run` exit 0 (42 tests total incl. prior 27).
5. `npm run build` exit 0.
6. No dataset regression: 0 `http://` rssUrls in feeds.ts (https rejection breaks no feed).
7. Runtime smoke: 11 routes render, 0 page errors.
