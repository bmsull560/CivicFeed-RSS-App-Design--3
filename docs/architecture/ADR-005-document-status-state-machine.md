# ADR-005: Document Status State Machine

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

Government documents will carry an explicit `document_type` and, where applicable, a `legislative_status` that follows a defined state machine. Document types include: `announcement`, `proposed_rule`, `final_rule`, `legislation`, `vote`, `economic_data`, `report`, `implementation`, and `other`. For legislative and regulatory items, the status state machine is: `proposed` → `public_comment` → `final_decision` → `implementation`. The `document_type` is stored on `article_cache`; the status lifecycle is rendered as a timeline in the UI.

## Rationale

The strategy's "killer feature" (§4) is answering "what happened, and why does it matter?" — which requires distinguishing a proposal from an enacted law. Presenting a proposed rule as if it were already law is the highest-risk failure mode for a government news product. An explicit type + status model prevents this by making the distinction structural, not cosmetic.

## Consequences

- Migration 6 adds `document_type TEXT` to `article_cache` with a CHECK constraint on allowed values.
- The AI enrichment pipeline must classify document type during processing (Phase 2).
- The frontend Story Detail page renders a status timeline component (Phase 3).
- Not all document types have a lifecycle — `economic_data`, `report`, and `announcement` are point-in-time.
- The status state machine is initially populated by AI classification; manual curation or API-provided metadata (e.g., Congress.gov bill status) can override.