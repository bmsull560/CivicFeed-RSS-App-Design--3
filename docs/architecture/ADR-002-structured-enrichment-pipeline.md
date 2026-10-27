# ADR-002: Structured Enrichment Pipeline

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

The AI enrichment pipeline will evolve from a single monolithic `enrichArticle()` call (producing one summary string + tags) into a multi-step pipeline where each enrichment dimension is a discrete, independently cacheable step. Steps include: document type classification, consumer topic assignment, structured summary generation (what happened / why care / what next), evidence tier assignment, and keyword extraction. Each step can be queued, processed, cached, and fallback-handled independently.

## Rationale

The consumer news strategy demands structured output across 4+ dimensions per article. A monolithic AI call that produces all fields is brittle — if one field fails validation, the entire enrichment is discarded. Independent steps allow partial enrichment (e.g., classification succeeds even if summarization fails), independent retry, and independent caching. This also bounds cost: high-cost steps (structured summarization) can be throttled independently of low-cost steps (classification).

## Consequences

- The `enrichment_jobs` table may need to evolve to support sub-tasks or multiple job types.
- The `ai.ts` module will be refactored into discrete functions: `classifyDocumentType()`, `assignConsumerTopics()`, `generateStructuredSummary()`, `assignEvidenceTier()`, `extractKeywords()`.
- Each step has its own Zod schema for output validation and its own extractive fallback.
- The enrichment queue worker processes steps in dependency order (classify → summarize → tier).
- This is a Phase 2 deliverable; Phase 1 only establishes the ADR.