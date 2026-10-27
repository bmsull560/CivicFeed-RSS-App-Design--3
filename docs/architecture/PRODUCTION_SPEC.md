# CivicFeed Production Specification

**Version:** 1.0 | **Date:** 2026-10-26 | **Status:** Approved for Implementation

---

## 1. Executive Summary

This specification defines the complete, production-ready CivicFeed application based on:
- Verified repository capabilities (React 19 + Vite + Express + SQLite)
- Accepted product decisions (local-only identity, derived notifications, local preference hub, read-only catalog with local controls, phased Civic Clarity adoption)
- Architectural constraints from `AGENTS.md`, `ARCHITECTURE.md`, `PRODUCT_VISION.md`

**Scope:** Frontend implementation only. No backend contract changes, no authentication, no cloud sync, no new databases.

---

## 2. Repository Evidence & Validated Assumptions

| Capability | Status | Evidence |
|------------|--------|----------|
| Feed catalog (590+ feeds, 18 categories) | ✅ Implemented | `backend/src/feeds.ts` |
| Backend RSS fetch/parse/cache/enrich | ✅ Implemented | `backend/src/rss.ts`, `cache.ts`, `ai.ts`, `enrichment-queue.ts` |
| FTS5 search | ✅ Implemented | `backend/src/search.ts` |
| Weekly recap generation | ✅ Implemented | `backend/src/recap.ts` |
| Feed health validation | ✅ Implemented | `backend/src/feed-health.ts` |
| User preferences (localStorage) | ✅ Implemented | `src/lib/userData.ts` — `UserPreferences` with `followedHubs`, `digestFrequency`, `reduceMotion`, `defaultView` |
| User feeds (local add/edit/disable/OPML) | ✅ Implemented | `src/lib/userData.ts` — `UserFeed`, `createUserFeed`, `addUserFeed`, `updateUserFeed`, `removeUserFeed`, `importUserFeeds` |
| Article state (read/bookmark/archive) | ✅ Implemented | `src/lib/userData.ts` — `ArticleState` |
| Thematic hubs (5 hubs mapping to categories) | ✅ Implemented | `src/lib/hubs.tsx` — `thematicHubs` |
| Dashboard, Directory, FeedDetail, ReadingStream, EntryDetail, Bookmarks, Archive, Search, Recap | ✅ Implemented | `src/pages/*.tsx` (10 pages) |
| Sidebar navigation with hubs | ✅ Implemented | `src/components/Sidebar.tsx` |
| Header with search + theme toggle | ✅ Implemented | `src/components/Header.tsx` |
| shadcn/ui component library | ✅ Implemented | `src/components/ui/*.tsx` (64 components) |
| Tailwind CSS with CSS variables | ✅ Implemented | `src/index.css` — HSL color tokens |
| Current fonts: Inter (sans) + Merriweather (serif headings) | ✅ Implemented | `src/index.css` |
| CI pipeline (lint, format, type-check, build, E2E) | ✅ Working | `.github/workflows/ci.yml` |
| Backend unit tests (71 passing) | ✅ Working | `backend/src/*.test.ts` |
| Playwright E2E + accessibility tests | ✅ Working | `tests/e2e/*.spec.ts` |

**Missing Pages (per design):** Categories, Settings, Notifications
**Missing Backend Endpoints:** `/api/user/profile`, `/api/notifications`, `/api/keys` — **will not be added** (per accepted decisions)

---

## 3. Design Decisions & Rationale

### 3.1 Identity & Persistence: Local-Only Profile
- **Decision:** Add `userProfile` to `UserPreferences` in `localStorage`
- **Fields:** `{ name: string; title: string; agency: string; avatarUrl: string }`
- **Rationale:** Preserves architecture; satisfies design's "Analyst Identity" visually; honest about limitations
- **UI Label:** "Local Profile (stored on this device only)"

### 3.2 Notifications & Urgency: Derived Activity Center
- **Decision:** Build "Activity" page from existing verified signals
- **Signals & Urgency Mapping:**
  - Feed health `fail` → **Alert** (source unavailable)
  - AI enrichment tags containing `breaking`, `urgent`, `emergency` → **High** (AI-assessed)
  - New articles in followed feeds/hubs (last 24h) → **Update** (new content)
  - Feed health `warn` or stale (>24h no fetch) → **Announcement** (system status)
  - Recap generated → **Announcement** (digest ready)
- **No new backend module.** Frontend aggregates from `/api/feeds/:id/health`, `/api/articles/recent`, `/api/recap`, enrichment queue status (if exposed)
- **UI Label:** "Activity" (not "Notifications") — clearly derived, not pushed

### 3.3 Settings: Local Preference Hub
- **Tabs:** General, Profile, Activity, Data, About
- **No API Keys tab** — omitted per decision (browser localStorage is not a secret vault)
- **General:** Theme, Density, Reduced Motion, Default View (list/grid)
- **Profile:** Local profile editor (name, title, agency, avatar URL) with clear "device-only" notice
- **Activity:** Urgency display thresholds, digest frequency (realtime/daily/weekly)
- **Data:** OPML Import/Export, Clear Local Data (with confirmation)
- **About:** Version, links to GitHub, license, privacy note

### 3.4 Categories: Read-Only Catalog with Local Controls
- **Page:** `/categories` (new route)
- **Display:** All 18 categories from catalog with feed counts, working/blocked status
- **Controls:** Enable/disable toggle per feed (writes to `localStorage` user feeds)
- **Custom Feeds:** Appear in "Custom" category with edit/delete
- **OPML Import/Export:** Prominent actions
- **No backend catalog edits** — `feeds.ts` remains single source of truth

### 3.5 Visual Design System: Phased Civic Clarity Adoption

#### Phase 1 Tokens (Immediate)
```css
/* Color - Liberty Blue anchor with semantic tokens */
--civic-liberty: 205 51% 23%;        /* #1D3557 - brand anchor */
--civic-liberty-light: 205 45% 35%;  /* lighter for hover */
--civic-liberty-dark: 205 55% 15%;   /* darker for active */
--civic-gold: 38 92% 50%;            /* #D97706 - accent */
--civic-sage: 142 50% 42%;           /* #2F855A - success/positive */

/* Typography */
--font-serif: "Lora", Georgia, serif;    /* headings */
--font-sans: "Inter", system-ui, sans-serif; /* body */

/* Type Scale */
--text-display: 3.5rem / 1.1;      /* 56px - hero */
--text-h1: 2.25rem / 1.2;          /* 36px */
--text-h2: 1.875rem / 1.3;         /* 30px */
--text-h3: 1.5rem / 1.4;           /* 24px */
--text-body: 1rem / 1.6;           /* 16px */
--text-sm: 0.875rem / 1.5;         /* 14px */
--text-xs: 0.75rem / 1.5;          /* 12px */
```

#### Phase 2: Component Refinement (cards, buttons, inputs, navigation)
#### Phase 3: Motion, density, dark-mode refinement

**Accessibility Target:** WCAG 2.2 AA baseline. Validate every token combination.

---

## 4. Page & Navigation Inventory

| Route | Page Component | Status | Design Screen | Notes |
|-------|---------------|--------|---------------|-------|
| `/` | `Dashboard` | ✅ Exists | Dashboard | Enhance: priority feeds, recent updates, category overview, activity trends |
| `/feeds` | `FeedDirectory` | ✅ Exists | Directory | Enhance: filter chips, follow state, pagination/virtualization |
| `/categories` | `Categories` | 🆕 New | Categories | Read-only catalog + local controls |
| `/feed/:id` | `FeedDetail` | ✅ Exists | — | Enhance: feed health, article list |
| `/reading` | `ReadingStream` | ✅ Exists | — | Enhance: keyboard nav, density |
| `/entry/:feedId/:entryId` | `EntryDetail` | ✅ Exists | — | Enhance: typography, source prominence |
| `/bookmarks` | `Bookmarks` | ✅ Exists | — | |
| `/archive` | `Archive` | ✅ Exists | — | |
| `/search` | `SearchResults` | ✅ Exists | — | |
| `/recap` | `Recap` | ✅ Exists | — | |
| `/activity` | `Activity` | 🆕 New | Notifications | Derived from verified signals |
| `/settings` | `Settings` | 🆕 New | Settings | Local preference hub |
| `*` | `NotFound` | ✅ Exists | — | |

**Navigation Updates:**
- Sidebar: Add "Categories" and "Activity" nav items
- Header: Search remains; theme toggle remains
- Settings accessible via user menu or sidebar footer

---

## 5. Component & Interaction Specifications

### 5.1 Shared Components (New/Enhanced)

| Component | Purpose | Location |
|-----------|---------|----------|
| `FeedCard` | Feed display with follow toggle, health dot, category badge | `src/components/FeedCard.tsx` (enhance existing) |
| `CategoryCard` | Category overview with count, health summary | `src/components/CategoryCard.tsx` (enhance existing) |
| `EntryCard` | Article preview with source, date, AI summary badge, actions | `src/components/EntryCard.tsx` (enhance existing) |
| `ActivityItem` | Notification-style item with urgency badge, timestamp, action | `src/components/ActivityItem.tsx` (new) |
| `ProfileEditor` | Local profile form with device-only notice | `src/components/ProfileEditor.tsx` (new) |
| `OPMLImportExport` | File upload/download for feed portability | `src/components/OPMLImportExport.tsx` (new) |
| `DataDangerZone` | Clear local data with confirmation | `src/components/DataDangerZone.tsx` (new) |
| `EmptyState` | Consistent empty states across pages | `src/components/EmptyState.tsx` (enhance existing) |
| `LoadingSkeleton` | Consistent loading placeholders | `src/components/LoadingSkeleton.tsx` (new) |

### 5.2 Interaction Patterns

| Interaction | Pattern | Accessibility |
|-------------|---------|---------------|
| Follow/Unfollow feed | Toggle switch in FeedCard + keyboard (Space/Enter) | `aria-pressed`, `role="switch"` |
| Category filter | Chips in Directory + URL sync (`?category=`) | `aria-selected`, keyboard arrows |
| Search | Header combobox + `/search` page | `role="combobox"`, `aria-expanded` |
| Theme toggle | Button with icon swap | `aria-label`, `aria-pressed` |
| Density toggle | Radio group in Settings | `role="radiogroup"` |
| OPML import | File input + drag-drop | `accept=".opml,application/xml"` |
| Destructive actions | Confirm dialog (radix AlertDialog) | Focus trap, `aria-modal` |

---

## 6. Capability Matrix

| Feature | Implemented | Partially Implemented | Missing | Intentionally Excluded |
|---------|-------------|----------------------|---------|------------------------|
| Feed catalog display | ✅ | | | |
| Feed follow (local) | ✅ | | | |
| User-added feeds | ✅ | | | |
| OPML import/export | ✅ | | | |
| Article read/bookmark/archive | ✅ | | | |
| Search (FTS5) | ✅ | | | |
| Weekly recap | ✅ | | | |
| Feed health | ✅ | | | |
| AI enrichment (async) | ✅ | | | |
| Thematic hubs | ✅ | | | |
| **Categories page** | | | 🆕 | |
| **Settings page** | | | 🆕 | |
| **Activity page** | | | 🆕 | |
| **Local profile** | | | 🆕 | |
| Cloud sync | | | | ❌ Non-goal |
| Authentication | | | | ❌ Non-goal |
| API Keys management | | | | ❌ Non-goal (localStorage not secure) |
| Push notifications | | | | ❌ Non-goal |
| Real-time updates | | | | ❌ Non-goal |
| Vector search | | | | ❌ Non-goal |
| Audio TTS | | | | ❌ Non-goal |

---

## 7. Acceptance Criteria

### 7.1 Accessibility (WCAG 2.2 AA)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Space, Escape, Arrow keys)
- [ ] Visible focus indicators on all focusable elements
- [ ] Semantic HTML structure (headings, landmarks, lists)
- [ ] Color contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text, UI components)
- [ ] Reduced motion respected (`prefers-reduced-motion`)
- [ ] ARIA labels/roles on custom components (combobox, switch, dialog, tabs)
- [ ] Screen reader tested (NVDA/VoiceOver) on critical paths

### 7.2 Responsive Design
- [ ] Mobile (<640px): Single column, collapsible sidebar, touch targets ≥ 44px
- [ ] Tablet (640-1024px): Two-column where appropriate, sidebar overlay
- [ ] Desktop (>1024px): Full sidebar, multi-column layouts
- [ ] No horizontal overflow at any breakpoint

### 7.3 Privacy & Local Data
- [ ] All user data in `localStorage` only (no backend user endpoints)
- [ ] Clear "device-only" labels on profile, follow state, preferences
- [ ] OPML export includes user-added feeds + enabled/disabled state
- [ ] Clear local data removes all `localStorage` keys with confirmation
- [ ] No credentials or API secrets in `localStorage`

### 7.4 Performance
- [ ] Directory: Virtualized list or pagination for 590+ feeds
- [ ] Dashboard: Recent entries limited to 50, memoized filters
- [ ] Images: Lazy loaded, appropriate sizes
- [ ] Bundle: Code-split by route (React.lazy + Suspense)

### 7.5 Truthful System States
- [ ] Loading states on all async operations
- [ ] Empty states with actionable guidance
- [ ] Error states with retry/recovery options
- [ ] Stale data indicators (cache age, feed health)
- [ ] AI content clearly labeled (summary source, fallback notice)
- [ ] No fabricated metrics, trends, or unread counts

---

## 8. Implementation Plan (Prioritized)

### Sprint 1: Design Tokens + Shared Components (Highest Value)
1. **Define semantic design tokens** in `src/index.css` (Phase 1 colors, typography, spacing)
2. **Update shadcn/ui components** to use new tokens
3. **Create/Enhance shared components:** `FeedCard`, `CategoryCard`, `EntryCard`, `LoadingSkeleton`, `EmptyState`
4. **Verify:** Build passes, no visual regressions, contrast audit

### Sprint 2: Dashboard + Directory (Core Experience)
1. **Dashboard:** Strong heading, priority feeds (followed + priority=1), recent updates (followed hubs), category overview cards, activity trends (derived from recap/health)
2. **FeedDirectory:** Filter chips (category, hub, priority, status), virtualized feed list, follow toggle, search integration
3. **Verify:** E2E tests for critical paths, responsive, keyboard nav

### Sprint 3: Categories + Settings + Activity (New Pages)
1. **Categories page:** Catalog view with counts, health, enable/disable, custom feeds section, OPML actions
2. **Settings page:** 5 tabs (General, Profile, Activity, Data, About) with working controls
3. **Activity page:** Aggregated view from verified signals with urgency badges
3. **Navigation:** Sidebar updates, route registration in `App.tsx`
4. **Verify:** All new pages functional, persisted state survives reload

### Sprint 4: Article Reading + Search + Recap (Refinement)
1. **EntryDetail:** Typography upgrade (Lora), source prominence, AI summary labeling, action consistency
2. **SearchResults:** Empty/error states, result highlighting, facet filters
3. **Recap:** Category grouping, tag clouds, freshness indicators
4. **Verify:** Reading flow, mobile readability, accessibility

### Sprint 5: Polish + Verification
1. **Cross-browser:** Chrome, Firefox, Safari (Playwright)
2. **Accessibility audit:** axe-core + manual keyboard/screen reader
3. **Performance:** Lighthouse, bundle analysis
4. **Documentation:** Update README, CHANGELOG
5. **Production build verification:** `npm run verify`

---

## 9. Dependencies & Risks

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Lora font loading | Layout shift, performance | `font-display: swap`, preload, system fallback |
| shadcn/ui token migration | Component breakage | Incremental, test each component, visual regression |
| Virtualization (590 feeds) | New dependency | Use `@tanstack/react-virtual` (lightweight, maintained) |
| Activity signal aggregation | Missing enrichment tags | Graceful degradation — show "Update" only if AI tags unavailable |
| localStorage quota | Data loss on clear | Warn on export before clear, document 5MB limit |

---

## 10. Verification Commands

```bash
# Frontend
npm run lint
npm run format:check
npm run type-check
npm run build
npm run verify:browser          # Playwright E2E
npm run verify:accessibility    # axe-core

# Backend (unchanged)
cd backend
npm run lint
npm run type-check
npm run test

# Full verification
npm run verify
```

---

## 11. Known Defects & Unresolved Dependencies

| Item | Status | Notes |
|------|--------|-------|
| Backend `/api/articles/recent` pagination | Deferred | Current endpoint returns all recent; client-side slice |
| Enrichment queue status endpoint | Not exposed | Activity page uses `/api/recap` + feed health as proxy |
| Feed health real-time updates | Polling only | 15-min cache TTL; manual refresh available |
| OPML export includes disabled static feeds | Known | Exports user feeds only; static feeds always enabled |
| No backend API versioning | Accepted | Local-first; no breaking changes expected |

---

## 12. Governance Compliance

- ✅ No protected files modified (`AGENTS.md`, `ARCHITECTURE.md`, `PRODUCT_VISION.md`, `SECURITY.md`, `CODEOWNERS`)
- ✅ No authentication, cloud sync, new databases, migrations, external dependencies
- ✅ No credentials in localStorage
- ✅ No Git operations performed
- ✅ Existing routes preserved (`/`, `/feeds`, `/feed/:id`, `/reading`, `/entry/:feedId/:entryId`, `/bookmarks`, `/archive`, `/search`, `/recap`)
- ✅ New routes additive only (`/categories`, `/activity`, `/settings`)

---

## 13. Recommended Next Steps

1. **Immediate:** Begin Sprint 1 — Design tokens + shared components
2. **Parallel:** Add `@tanstack/react-virtual` for Directory virtualization
3. **After Sprint 2:** Validate Dashboard/Directory with real feed data
4. **Before Sprint 3:** Confirm Activity signal aggregation works with current backend
5. **Ongoing:** Run `npm run verify` after each sprint

---

*This specification is the single source of truth for implementation. Deviations require documented justification.*