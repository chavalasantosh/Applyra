# Applyra 3.0 — Milestones

| Milestone | Scope | Status | Exit Criteria |
| --- | --- | --- | --- |
| **M0** | Baseline Preservation | **Complete** | Git baseline committed on `master`, `applyra-3.0-dev` branch created, 313-file inventory & `47/47` baseline tests verified. |
| **M1** | Complete Application Intelligence | **Complete** | `architecture-audit.md`, `feature-parity-matrix.md`, and storage/message contracts documented from source inspection. |
| **M2** | Frontend Architecture Modernization | **Complete (Foundation)** | `package.json` (`npm test`, `build:bundles`, `check`) and typed MV3 compatibility adapters (`web-src/types.ts`, `web-src/chrome-adapter.ts`) created. |
| **M3** | Applyra Design System | **Complete** | Unified `tokens.css` (light/dark) + `tabular-nums` + `theme.css` integration across all 15 HTML pages. |
| **M4** | Application Shell | **Complete** | `src/applyra-shell.js` (`Ctrl/Cmd+K` command palette, topbar search trigger), topbar Day/Night toggle, and sticky bottom-left profile widget. |
| **M5** | Advanced Dashboard (`#Overview`) | **Partial (Alpha 1)** | `assets/workspaces/overview-center.mjs`: live Pipeline Funnel & Quick Actions added; full React/TSX chart rewrite pending M2 Vite pipeline. |
| **M6** | Job Discovery & Opportunity Scans | **Partial (Alpha 1)** | `assets/workspaces/opportunity-enhancer.mjs`: density switcher & shortcuts added; full virtualized table & detail side panel pending M2 Vite pipeline. |
| **M7** | Application Engine & Tracking | **Partial (Alpha 1)** | `apply-engine.html` + `ops-center.mjs` + `vault-suggestions.mjs`: live 5-stat strip & explicit-approval provenance review; full operations redesign pending. |
| **M8** | Resume & Career Intelligence | **Partial (Alpha 1)** | `assets/career-intelligence/*` live analysis & parser fixes + split workbench; full interactive studio pending. |
| **M9** | Company & Market Intelligence | **Partial (Alpha 1)** | `company-intel.html` + `company-enhancer.mjs`: provenance strip added; full visualizations & comparison tables pending. |
| **M10** | Auth, Onboarding & Profiles | Pending | `auth.html`, `onboarding.html`, `#Profile`, `naukri-profile.html`, `career-suite.html` aligned to unified shell & tokens. |
| **M11** | Billing, Settings & Admin | Pending | `billing.html`, `#Settings`, `admin.html`, `test-lab.html`, `#Account history`, `#Exports` with clear unfinished-payment guards. |
| **M12** | Browser Popup & Notifications | Pending | `popup.html` & `download-toast` aligned to Applyra 3.0 design tokens and compact action ergonomics. |
| **M13** | Advanced UI Engineering | Pending | Intentional micro-interactions, accessible dialogs/popovers, `prefers-reduced-motion` compliance. |
| **M14** | Performance Engineering | Pending | Profiled initial load, virtualized large job tables (1,500+ rows), reduced unnecessary React rerenders. |
| **M15** | Production Validation | Pending | `node --test`, new regression tests, Chrome DevTools & Playwright checks across light/dark, keyboard nav, CSP, MV3. |
| **M16** | Applyra 3.0 Release Candidate | Pending | Loadable RC1 package, migration/design docs, feature parity report, security review, arsenal provenance log. |
