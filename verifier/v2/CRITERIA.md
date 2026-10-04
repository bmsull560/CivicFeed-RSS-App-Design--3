# Verifier v2 — Security Remediation Acceptance Criteria

Objective: remediate security review items (1) safeUrl allowlist, (2) CSP meta, (3) DOMParser strip-tags swap — plus the build-entry contamination discovered during remediation.

## Acceptance criteria
1. `src/lib/url.ts` exports `safeUrl` with http/https-only allowlist; EntryCard applies it to `entry.link`.
2. EntryCard `stripHtml` uses inert DOMParser; no `innerHTML` assignment on feed content remains in app code (`grep innerHTML src --exclude ui/` → none outside chart.tsx static config).
3. `index.html` contains Content-Security-Policy meta with `script-src 'self'` and a proper Vite entry `<script type="module" src="/src/main.tsx">`; stale root `assets/` bundle removed.
4. Rebuilt `dist/` bundle hash differs from stale Ns7uMTWt/DLVuhvGE and contains refactored+remediated code (validateDataset/synthesized/safeUrl markers present).
5. `npx vitest run` exit 0 incl. new safeUrl suite; `npm run build` exit 0.
6. Runtime smoke: all 11 routes render, 0 page errors, 0 CSP violations.
