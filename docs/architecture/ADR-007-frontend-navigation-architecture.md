# ADR-007: Frontend Navigation Architecture

- **Status:** proposed
- **Date:** 2026-10-25
- **Owners:** Architecture team
- **Supersedes:** none

## Decision

The frontend will adopt a **dual-navigation** model: topic-first for consumers (6 life topics as primary navigation) with department-category navigation retained as a secondary axis for power users who want to inspect specific agency sources. The existing feed-centric pages (`FeedDirectory`, `FeedDetail`, `EntryDetail`) remain accessible. New topic-oriented pages (`TopicHub`, `StoryDetail`) will be added alongside them, not replacing them.

## Rationale

The strategy explicitly calls for organizing news around everyday life (§3) while preserving the ability to follow specific agencies and inspect sources. A pure replacement (topics only, removing department navigation) would alienate the existing power-user base. A pure addition (topics as just another filter) would fail to deliver the consumer experience. Dual navigation serves both audiences: the default experience is topic-first, and power users can switch to source inspection.

## Consequences

- New routes: `/topic/:topicKey` (topic hub page), `/story/:entryId` (structured story detail).
- Existing routes (`/feeds`, `/feed/:id`, `/entry/:feedId/:entryId`) are preserved.
- The navigation component gains a primary topic bar and a secondary "Browse by Agency" access point.
- The `thematicHubs` in `src/lib/hubs.tsx` are replaced or augmented by the new consumer topic taxonomy.
- This is a Phase 3 deliverable; Phase 1 only establishes the ADR and the taxonomy data.