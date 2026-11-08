# ADR-003: Evidence Tier Model

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

Every article and AI-generated claim in CivicFeed will carry an explicit evidence tier from a four-level classification: **source_statement** (what the agency said), **verified_record** (what an authoritative document or dataset confirms), **ai_explanation** (a generated interpretation of available evidence), and **unresolved** (what cannot yet be established). The tier is stored as a TEXT column on `article_cache` and rendered as a visible trust indicator in the UI.

## Rationale

The product strategy identifies trust as the most important design requirement (§8). A government press release must not receive the same evidentiary weight as a final regulation, recorded vote, or published dataset. Without explicit tiering, AI summaries risk being presented as fact. The four-tier model creates a clear, renderable separation that users can understand and that the system can enforce (e.g., AI explanations are never displayed without a source_statement or verified_record anchor).

## Consequences

- Migration 6 adds `evidence_tier TEXT` to `article_cache` with a CHECK constraint.
- The AI enrichment pipeline must assign tiers during processing (Phase 2).
- The frontend must render tier badges/indicators on article cards and story detail pages (Phase 3).
- Default tier for newly ingested articles before enrichment is `source_statement`.
- Tier assignment rules: RSS items default to `source_statement`; items backed by .gov datasets or official records can be upgraded to `verified_record`; AI-generated content is always `ai_explanation`; uncertain or conflicting information is `unresolved`.