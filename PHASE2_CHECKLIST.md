# Phase 2 Verification Checklist — CivicFeed Design System Transformation

> **Status**: Ready to execute once terminal access is restored  
> **Prerequisites**: Phase 1 complete (semantic tokens, new pages, routing, no duplicate functions, FeedCard onNavigate fixed)

---

## 1. Build & Static Analysis Gates

| Gate | Command | Expected Result | Notes |
|------|---------|-----------------|-------|
| **Frontend lint** | `npm run lint` | ✅ 0 errors | ESLint + Prettier |
| **Frontend format check** | `npm run format:check` | ✅ 0 changes | Prettier |
| **Frontend type-check** | `npm run type-check` | ✅ 0 errors | `tsc -b` |
| **Frontend build** | `npm run build` | ✅ Success | Vite production build |
| **Backend lint** | `cd backend && npm run lint` | ✅ 0 errors | ESLint |
| **Backend type-check** | `cd backend && npm run type-check` | ✅ 0 errors | `tsc --noEmit` |
| **Backend tests** | `cd backend && npm test` | ✅ All pass | Vitest unit tests |

**Full verification command** (run once):
```bash
npm run lint && npm run format:check && npm run type-check && npm run build && cd backend && npm run lint && npm run type-check && npm test
```

---

## 2. Playwright E2E Test Coverage — New Surfaces

### 2.1 Categories Page (`/categories`)
| Scenario | Test ID | Selectors / Actions | Assertions |
|----------|---------|---------------------|------------|
| Page loads with hubs & categories | `categories-load` | `goto('/categories')` | Heading "Categories" visible; hub cards render |
| Expand/collapse category (mouse) | `categories-expand` | Click category header | Feed list toggles; chevron rotates |
| Expand/collapse category (keyboard) | `categories-expand-keyboard` | Focus header → press Enter/Space | Feed list toggles; focus remains on header |
| Health progress bar renders | `categories-health` | Locate progress bar per category | Width matches working/total ratio; color = success/warning/destructive |
| Search filters categories | `categories-search` | Fill search input | Only matching categories shown |
| "Custom feeds only" toggle | `categories-custom-toggle` | Check checkbox | Only user-added feeds shown |
| OPML export downloads file | `categories-export` | Click "Export OPML" | `.opml` file downloaded |
| OPML import adds feeds | `categories-import` | Upload valid OPML | Toast/alert shows imported count; feeds appear |
| Add custom feed via dialog | `categories-add-feed` | Click "Add Feed" → fill form → save | Feed appears in Custom Feeds grid |
| Edit custom feed | `categories-edit-feed` | Click edit on user feed → modify → save | Changes persist |
| Remove custom feed | `categories-remove-feed` | Click remove on user feed → confirm | Feed removed from list |
| Navigate to feed detail | `categories-navigate-feed` | Click feed card (compact) | URL = `/feed/{id}`; feed detail loads |
| Navigate to feed detail (grid) | `categories-navigate-feed-grid` | Click feed card (grid) | URL = `/feed/{id}`; feed detail loads |

### 2.2 Settings Page (`/settings`)
| Scenario | Test ID | Selectors / Actions | Assertions |
|----------|---------|---------------------|------------|
| All 5 tabs render | `settings-tabs` | `goto('/settings')` | Tabs: General, Profile, Activity, Data, About |
| **General** — Theme toggle | `settings-theme` | Click Light/Dark/System | `html` class updates; persists in localStorage |
| **General** — Density selector | `settings-density` | Click Compact/Comfortable/Spacious | `--density` CSS var updates; UI spacing changes |
| **General** — Reduced motion | `settings-reduced-motion` | Toggle switch | `prefers-reduced-motion` respected |
| **General** — Default view | `settings-default-view` | Click List/Grid | Preference saved; Feed Directory uses it |
| **Profile** — Edit fields | `settings-profile` | Fill name/title/agency/avatar URL | Values saved to localStorage; avatar renders |
| **Activity** — Digest frequency | `settings-digest` | Select dropdown option | Preference saved |
| **Activity** — Followed hubs | `settings-hubs` | Click hub chips | Chips toggle selected state; saved |
| **Data** — Export OPML | `settings-export` | Click "Export OPML" | File downloads with current subscriptions (not full catalog) |
| **Data** — Import OPML | `settings-import` | Upload OPML file | Feeds imported; toast shows count |
| **Data** — Clear all data | `settings-clear` | Click "Clear Data" → confirm dialog → "Yes" | localStorage cleared; page reloads; onboarding resets |
| **About** — Version & links | `settings-about` | Verify content | Version, architecture, non-goals, links present |

### 2.3 Activity Page (`/activity`)
| Scenario | Test ID | Selectors / Actions | Assertions |
|----------|---------|---------------------|------------|
| Page loads with derived notifications | `activity-load` | `goto('/activity')` | Heading "Activity" visible; list renders |
| Urgency badges render correctly | `activity-urgency` | Check badge colors | Alert=destructive, High=warning, Update=primary, Announcement=secondary |
| Filter by urgency | `activity-filter-urgency` | Click urgency chips | List filters to selected urgency |
| Filter by source | `activity-filter-source` | Select source dropdown | List filters to selected feed |
| Filter by date range | `activity-filter-date` | Select date range | List filters to range |
| Clear filters | `activity-clear` | Click "Clear Filters" | All filters reset; full list shown |
| Navigate to feed from activity | `activity-navigate` | Click activity item | URL = `/feed/{id}` or `/entry/{feedId}/{entryId}` |
| Empty state when no activity | `activity-empty` | Mock empty backend | "No activity" message with "Adjust Filters" action |
| Notifications respect followed hubs | `activity-followed-hubs` | Set followed hubs in Settings → reload Activity | Only items from followed hubs appear (or are prioritized) |

### 2.4 Regression — Existing Critical Paths
| Path | Test ID | Key Assertions |
|------|---------|----------------|
| Dashboard → Feed Directory → Feed Detail → Entry Detail | `journey-full` | All hops work; back navigation works |
| Reading Stream filters (source, status, search) | `journey-reading-filters` | Filters apply; clear works |
| Bookmarks / Archive persistence | `journey-bookmarks-archive` | Toggle → refresh → state persists |
| Search results → Entry Detail | `journey-search` | Search → click result → entry loads |
| Recap page loads | `journey-recap` | Categories, top tags, "View all" links work |
| Onboarding flow (first visit) | `journey-onboarding` | 3 steps complete → dashboard personalized |

---

## 3. Accessibility Audit (WCAG 2.2 AA)

### 3.1 Automated Axe Scans (extend `civicfeed-accessibility.spec.ts`)
Add new pages to the `pages` array:
```typescript
const pages: A11yPage[] = [
  // ...existing
  { path: "/categories", name: "Categories", waitSelector: "h1:has-text('Categories')" },
  { path: "/settings", name: "Settings", waitSelector: "h1:has-text('Settings')" },
  { path: "/activity", name: "Activity", waitSelector: "h1:has-text('Activity')" },
];
```

### 3.2 Manual Audit Checklist per New Page

| Criterion | Categories | Settings | Activity |
|-----------|------------|----------|----------|
| **Keyboard navigation** | Tab through all interactive elements; focus visible | Tab through tabs, form fields, dialogs | Tab through filters, list items |
| **Focus management** | Dialogs trap focus; return focus on close | Dialogs (FeedForm, AlertDialog) trap focus | N/A |
| **ARIA labels/roles** | Buttons have `aria-label`; progress bars have `role="progressbar"` | Form labels associated; switches have `role="switch"` | List has `role="feed"`; buttons labeled |
| **Color contrast** | Semantic tokens meet 4.5:1 (text) / 3:1 (UI) | Same | Same |
| **Dark mode contrast spot-check** | Urgency badges (if any) & health progress bars meet 4.5:1 in dark | N/A | Urgency badges (Alert/High/Update/Announcement) meet 4.5:1 in dark |
| **Reduced motion** | Animations disabled when `prefers-reduced-motion` | Same | Same |
| **Screen reader** | NVDA/VoiceOver: headings, landmarks, live regions announced | Form errors announced; tab panel announced | Activity updates announced |
| **Zoom 200%** | No horizontal scroll; content reflows | Form fields stack; dialogs fit | List stacks; filters stack |

### 3.3 Specific Component Audits
- **FeedCard** (all variants): `onNavigate` button is keyboard-accessible; status dot has `aria-label`
- **CategoryCard**: Health progress bar has `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
- **EmptyState** (all variants): Icon decorative (`aria-hidden`); action button accessible
- **Settings tabs**: `aria-selected`, `aria-controls`, `role="tabpanel"`
- **AlertDialog** (Clear Data): `role="alertdialog"`, `aria-modal="true"`, focus trap

---

## 4. Visual Regression (Optional but Recommended)
- Capture baseline screenshots for: Dashboard, Categories, Settings (each tab), Activity, Feed Directory, Feed Detail, Entry Detail, Reading Stream, Bookmarks, Archive, Search, Recap, NotFound
- Compare against baseline after Phase 1 changes
- Threshold: ≤ 0.5% pixel difference

---

## 5. Performance Spot-Checks
| Metric | Target | Tool |
|--------|--------|------|
| **LCP (Dashboard)** | < 2.5s | Lighthouse / WebPageTest |
| **CLS** | < 0.1 | Lighthouse |
| **TB** | < 200ms | Lighthouse |
| **Bundle size (gzipped)** | < 200 KB JS | `npm run build` → check `dist` |

**Baseline comparison**: If Lighthouse CI / WebPageTest config exists, capture pre-Phase-1 baseline (tagged commit) and compare against post-Phase-1 build. Record deltas in PR description.

---

## 6. Backend Compatibility Smoke Tests
| Endpoint | Method | Test |
|----------|--------|------|
| `/api/feeds` | GET | Returns catalog with `status`, `category`, `priority` |
| `/api/feeds/:id/articles` | GET | Returns entries with `aiSummary`, `aiTags` |
| `/api/articles/recent` | GET | Supports `limit`, `source` params |
| `/api/search` | GET | Returns highlighted results |
| `/api/recap` | GET | Returns weekly structure |
| `/api/stats/feeds` | GET | Returns health counts |
| `/api/feeds/:id/status` | GET | Returns fetch diagnostics |
| `/api/feeds/:id/health` | GET | Returns health checks |

---

## 7. Token System Validation
- [ ] All `hsl(var(--*))` references resolve in browser DevTools
- [ ] Dark mode: all tokens have `.dark` overrides
- [ ] No hardcoded `slate-`, `blue-`, `red-`, `green-`, `amber-`, `emerald-` in app components (only in shadcn/ui primitives)
- [ ] **No remaining `text-slate-*`, `bg-slate-*`, `border-slate-*`, `text-blue-*`, `bg-blue-*`, `border-blue-*`, `text-red-*`, `bg-red-*`, `border-red-*`, `text-green-*`, `bg-green-*`, `border-green-*`, `text-amber-*`, `bg-amber-*`, `border-amber-*`, `text-emerald-*`, `bg-emerald-*`, `border-emerald-*` outside `src/components/ui/**`** (grep to verify)
- [ ] Badge variants render: `badge`, `badge-outline`, `badge-destructive`, `badge-success`, `badge-warning`, `badge-primary`, `badge-secondary`
- [ ] Urgency badges: `badge-destructive` (Alert), `badge-warning` (High), `badge-primary` (Update), `badge-secondary` (Announcement)
- [ ] Status dots: `status-working`, `status-blocked`, `status-unverified`
- [ ] Density utilities: `density-compact`, `density-comfortable`, `density-spacious`
- [ ] Entry content: `.entry-content` renders prose with Lora/Inter

---

## 8. Documentation Updates (Post-Verification)
- [ ] Update `CHANGELOG.md` with Phase 1 changes
- [ ] Document token system in `docs/design-tokens.md` (colors, typography, spacing, components)
- [ ] Update `README.md` with new routes/screenshots
- [ ] Record any ADRs for architectural decisions (e.g., semantic token approach)

---

## 9. Execution Order (Recommended)

```bash
# 0. Install dependencies (FIRST TIME ONLY)
npm install                    # root workspace (already done)
cd backend && npm install && cd ..   # backend workspace (already done)

# 1. Static gates (fast feedback) - RUN FROM ROOT
cd /d C:\Users\BBB\CivicFeed\CivicFeed-RSS-App-Design--3
npm run lint && npm run format:check && npm run type-check

# 2. Build - RUN FROM ROOT
npm run build

# 3. Backend - RUN FROM ROOT
cd backend && npm run lint && npm run type-check && npm test && cd ..

# 4. E2E (headed for debugging, then headless) - RUN FROM ROOT
npm run test:install  # if first run (installs Playwright browsers)
npm run test          # full suite

# 5. Accessibility (subset) - RUN FROM ROOT
npm run verify:accessibility

# 6. Visual regression (if configured)
# npx playwright test --update-snapshots

# 7. Performance
# npx lighthouse http://localhost:4173 --view
```

---

## 10. Rollback Criteria
If any of the following occur, **stop and revert Phase 1**:
- Build fails with TypeScript errors introduced by token changes
- > 2 new Axe violations on new pages (excluding pre-existing)
- Critical user journey (Dashboard → Feed → Entry) broken
- Bundle size increases > 20% without justification
- Dark mode contrast failures on new components

---

## 11. Sign-Off
| Role | Name | Date | Status |
|------|------|------|--------|
| Frontend Lead | | | ☐ |
| Accessibility Reviewer | | | ☐ |
| QA Lead | | | ☐ |
| Product Owner | | | ☐ |

---

*Generated after Phase 1 completion. Update as tests are executed.*

---

## 12. File Location & Commit
- **Checklist location**: `PHASE2_CHECKLIST.md` (repo root)
- **Recommended**: Move to `docs/phase2-checklist.md` and commit with Phase 2 PR
- **Reference in PR**: Link checklist in PR description for traceability