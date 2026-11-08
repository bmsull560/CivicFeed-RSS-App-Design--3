# ADR-006: Authentication Decision

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

Authentication and user accounts will be **deferred** from the MVP (Phases 1-4). The initial consumer release will continue to use browser-localStorage for preferences, reading state, bookmarks, and followed topics — as the current system does. Authentication will be reconsidered when cross-device synchronization, topic alerts, or personalized notifications become hard requirements.

## Rationale

The current architecture explicitly has no authentication (`API.md`: "Authentication: None — all endpoints are public"). Adding auth is a cross-cutting concern that touches every layer: API middleware, data ownership model, database schema (user tables, foreign keys), frontend auth state, session management, and security controls. The strategy's MVP (§9) focuses on six capabilities that can all be delivered without auth. Deferring auth avoids scope creep in an already-ambitious Phase 1-4 plan and keeps the initial release simpler to ship and test.

## Consequences

- No user tables, auth middleware, session tokens, or login flows are added in Phases 1-4.
- Personalization remains single-device via localStorage.
- Topic alerts (§6) are deferred until auth is in place.
- The `consumer_topics` column on `feeds` is a global mapping, not per-user.
- When auth is eventually added, the localStorage preferences will need a migration path to server-side user profiles.
- This decision should be revisited after Phase 4 when cross-device usage patterns are better understood.