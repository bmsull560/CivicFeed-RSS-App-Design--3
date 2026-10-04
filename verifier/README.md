# Verifier index

## v1 — 2026-09-29 (created)
Measures: RFC #15 implementation acceptance — build passes, vitest boundary suite (map exhaustiveness, direction pins, no-fabrication, view contracts, dataset integrity), vocabulary quarantine in pages/components, alias removal, runtime smoke of 11 routes.
See v1/CRITERIA.md. Run records appended under runs/.

## v2 — 2026-10-02 (created)
Measures: security remediation acceptance — safeUrl allowlist applied, inert DOMParser strip-tags, CSP meta, Vite entry integrity (stale-bundle contamination fixed), rebuilt bundle freshness markers, vitest incl. safeUrl suite, runtime smoke with CSP-violation monitoring.
Differs from v1: adds security-specific checks and bundle-content freshness verification (function-name greps replaced by string-literal markers since minification renames functions).

## v3 — 2026-10-03 (created)
Measures: TDD feed-pipeline acceptance — 15 new behavior tests (parsing, proxy fallback, cache TTL/LRU/quota) through public interfaces, two test-first security behaviors (https rejection, 200-entry cap), backward-compatible DI, dataset no-regression check, full-suite + build + runtime smoke.
Differs from v2: focuses on test-boundary coverage of rss.ts/cache.ts rather than security sinks; adds dataset compatibility check for the new https rejection.

