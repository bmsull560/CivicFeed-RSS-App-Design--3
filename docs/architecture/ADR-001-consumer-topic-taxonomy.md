# ADR-001: Consumer Topic Taxonomy

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

CivicFeed will adopt a 6-topic consumer-facing taxonomy as the primary navigation axis for end users, parallel to the existing 21-category government-department taxonomy which remains the backend organizational scheme. The 6 consumer topics are: **Cost of Living**, **Taxes & Your Money**, **Health & Safety**, **Jobs & Wages**, **Laws & Decisions**, and **Your Community**.

## Rationale

Users think about groceries, income, healthcare, and safety — not whether information came from the USDA, FTC, Treasury, or Commerce Department. The existing 21 government-department categories serve backend organization and power-user source inspection but are poor primary navigation for consumers. A parallel taxonomy lets us serve both audiences: consumers navigate by life topic, power users drill into departments.

## Consequences

- Every feed in `backend/src/feeds.ts` must be mapped to one or more consumer topics.
- The `feeds` table and `article_cache` table each gain a `consumer_topics` column (JSON array).
- Frontend navigation will eventually offer topic-first browsing alongside the existing category view.
- The topic taxonomy is a curated artifact — mappings require editorial judgment and are not auto-generated.
- Topic definitions live in a shared module accessible to both frontend and backend.