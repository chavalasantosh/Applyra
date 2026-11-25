# Applyra 3.0 — Development Plan

## 1. Mission & Scope
Transform **Applyra 2.9.2** (`manifest_version: 3`) into **Applyra 3.0**, a cohesive, SaaS-grade career intelligence and job application platform that preserves 100% of existing Chrome extension capabilities, storage compatibility, background workers, content scripts, and security boundaries.

## 2. Non-Negotiable Constraints
- **Manifest V3 & CSP:** `script-src 'self'; object-src 'self';` — all executable JS must be locally bundled; zero runtime CDN scripts or inline event handlers.
- **Storage & Data Continuity:** Preserve `chrome.storage.local` schemas (`ApplyraStorageVault` AES-GCM v3 encryption, `careerEvidence`, `teamWorkspace`, `jobs`, `universalJobs`, `careerSuite`, `careerManualJobs`, `businessAccount`, `rememberedAccounts`).
- **Truthfulness & Safety Boundaries:** Never fabricate jobs, salary figures, match scores, or application outcomes; preserve user confirmation gates, portal security boundaries, and disabled/marked unfinished payment flows.
- **No Unverified Rewrites:** Incremental migration with compatibility adapters; verify every milestone against `node --test tests/*.test.*` and live Chrome DevTools / Playwright checks.

## 3. Architecture & Migration Strategy
1. **Milestone M0–M1 (Current):** Establish verified baseline (`47/47` passing unit tests, 313 total files / 23.88 MB, no `.git` yet — initialize Git baseline & untouched backup before M2).
2. **Milestone M2 (Frontend Architecture):**
   - Introduce a root `package.json` + Vite + React + TypeScript build pipeline in a dedicated `web-src/` (or `app/`) directory that compiles into extension-ready static bundles (`assets/main-*.js`) without touching `src/` core workers (`background.js`, `content.js`, `storage-vault.js`, `naukri-auto-apply-core.js`).
   - Keep `scripts/build-secure-artifacts.mjs` working for shared runtime/worker bundles while migrating the pre-compiled `assets/main-5HBZNLr_.js` React dashboard into readable, maintainable TSX modules.
   - Adopt compatibility adapters for `chrome.runtime.sendMessage`, `chrome.storage.local`, and `assets/career-intelligence/` + `assets/opportunities/`.
3. **Milestone M3 (Design System):**
   - Replace ad-hoc per-page CSS overrides (`theme.css` + 15 separate CSS files) with a unified token layer (`tokens.css`) supporting Light and Dark themes, semantic surfaces, tabular typography, consistent spacing/radii, and `prefers-reduced-motion`.
   - Reuse and standardize Applyra's existing SVG/PNG brand and sidebar icon set (`assets/applyra-sidebar-icons/`, `assets/brand/`).
4. **Milestone M4–M12 (Incremental Surface Redesign):**
   - **M4 Shell:** Collapsible sidebar with grouped navigation, breadcrumbs, `Cmd/Ctrl+K` command palette, top-right Day/Night toggle, and sticky bottom-left account switcher.
   - **M5 Dashboard (`#Overview`):** Career Command Center driven strictly by real `chrome.storage.local` metrics and actionable empty states.
   - **M6–M9 Core Workspaces:** Job Discovery & Opportunity Scans, Application Engine, Resume & Career Intelligence, and Company & Comp Radar.
   - **M10–M12 Supporting Surfaces:** Auth, Onboarding, Naukri Profile, Career Suite, Billing (with unfinished gateways clearly marked), Settings, Admin, Test Lab, and Popup.
5. **Milestone M13–M16 (Polish, Performance, Validation, RC1):**
   - Selective micro-interactions (respecting `prefers-reduced-motion`), list virtualization for 1,500+ job rows, full regression/CSP/a11y testing, and Applyra 3.0 RC1 packaging.

## 4. Universal Agent Arsenal Selection
- **Selector Query:** `Applyra 3.0 complete Chrome Manifest V3 SaaS UI UX redesign, frontend architecture, browser integration, engineering and production validation`
- **Selected Global Core Skills:** `ui-ux-pro-max`, `frontend-design`, `impeccable`, `taste-skill`, `understand`
- **Selected On-Demand Pack Skills:** `frontend-ui-engineering`, `ui-styling`, `react-vite-dashboard`
- **Component & Tooling Candidates (subject to MV3 CSP & license review):** `shadcn-ui/ui`, `ibelick/motion-primitives`, `animate-ui/animate-ui`, `cosscom/ui`
- **MCP Servers:** `chrome-devtools`, `playwright`, `context7`
