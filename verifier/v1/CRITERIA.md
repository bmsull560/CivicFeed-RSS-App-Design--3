# Verifier v1 — RFC #15 Implementation Acceptance Criteria

Objective: implement GitHub issue RFC #15 (deepen the domain-model seam) in /mnt/agents/output/app.

## Acceptance criteria

1. **Build passes**: `npm run build` exit 0 (tsc -b && vite build).
2. **Boundary tests pass**: vitest suite exists and `npx vitest run` exit 0, covering:
   a. map exhaustiveness over real data files (no unmapped enum values; no mapping to "other"/collapsed targets unless whitelisted in LOSSY_MAPPINGS)
   b. direction/polarity pins: "regulated-by" does NOT invert edge orientation; "amends" direction preserved; significance 1 ↔ "milestone"
   c. no-fabrication invariants: adapted project claim count == input claim count; every claim in exactly one question; fabricated fields carry synthesized markers; buildTraceHistory returns null instead of casting when sources missing
   d. view-model contracts: unknown slug/id → undefined; ResolvedRef fallback shape when existsInGraph === false
   e. integrity: validateDataset() passes over real dataset
3. **Vocabulary quarantine**: `grep -r "from \"../data/" src/pages src/components` returns matches ONLY for feed-related imports (feeds data) in Dashboard/ExplorePage/FeedDirectory/FeedDetail/Header/Sidebar — no imports of data/topics, data/entities, data/timeline, data/research, data/sources in pages/components.
4. **Alias cleanup**: `toModelEntity`/`toModelProject` no longer exist as exports (canonical names only).
5. **Mapping fixes present**: source inspection shows corrected direction mapping for regulated-by/amends and documented significance polarity.
6. **Runtime smoke**: all 11 routes render main-region content in headless Chromium without page errors (reuse playwright probe).
7. **modelAdapters.ts**: either removed with imports migrated, or reduced to a deprecated re-export shim from the new domain module.

## Verification commands
- build: `cd /mnt/agents/output/app && npm run build`
- tests: `cd /mnt/agents/output/app && npx vitest run`
- quarantine: `grep -rn "data/\(topics\|entities\|timeline\|research\|sources\)" src/pages src/components` (expect empty)
- aliases: `grep -rn "toModelEntity\|toModelProject" src` (expect empty)
- runtime: playwright probe of 11 routes
