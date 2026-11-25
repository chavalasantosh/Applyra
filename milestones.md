# Applyra 3.0 — Milestones

| Milestone | Scope | Status | Exit Criteria |
| --- | --- | --- | --- |
| **M0** | Baseline Preservation | **In Progress (Audit Complete)** | File inventory recorded (313 files, 23.88 MB), `47/47` baseline tests passing; create untouched 2.9.2 backup & initialize Git branch before M2 edits. |
| **M1** | Complete Application Intelligence | **Complete** | `architecture-audit.md`, `feature-parity-matrix.md`, and storage/message contracts documented from source inspection. |
| **M2** | Frontend Architecture Modernization | Pending | `package.json`, Vite + React + TS source for dashboard (`#Overview`..`#Help & feedback`), compatibility adapters for Chrome MV3 runtime/storage, reproducible build. |
| **M3** | Applyra Design System | Pending | Unified `tokens.css` (light/dark), typography scale, surface/border/focus tokens, button/input/table/card/badge primitives (`design-system-plan.md`). |
| **M4** | Application Shell | Pending | Collapsible sidebar with groups, command palette (`Ctrl/Cmd+K`), topbar actions, Day/Night toggle, sticky account switcher, preserved hash routes. |
| **M5** | Advanced Dashboard (`#Overview`) | Pending | Career Command Center using live storage data, truthful empty states, match-evidence summary, quick actions. |
| **M6** | Job Discovery & Opportunity Scans | Pending | `#Extractor`, `#Scheduled scans`, `#Saved` unified filtering/sorting, clear separation of fetched vs stored vs scheduled jobs. |
| **M7** | Application Engine & Tracking | Pending | `apply-engine.html`, `#Pipeline`, `#Applications`, `#Runs` with clear queue/applied/failed/waiting-user states and safety gates. |
| **M8** | Resume & Career Intelligence | Pending | `#Resume`, `career-intelligence.html`, `#Intelligence`, `#Study Guide`, `#Career coach` unified workspace with local PDF/DOCX/TXT parsing. |
| **M9** | Company & Market Intelligence | Pending | `company-intel.html` with evidence tables, salary/leveling breakdowns, sample-size/freshness disclosures. |
| **M10** | Auth, Onboarding & Profiles | Pending | `auth.html`, `onboarding.html`, `#Profile`, `naukri-profile.html`, `career-suite.html` aligned to unified shell & tokens. |
| **M11** | Billing, Settings & Admin | Pending | `billing.html`, `#Settings`, `admin.html`, `test-lab.html`, `#Account history`, `#Exports` with clear unfinished-payment guards. |
| **M12** | Browser Popup & Notifications | Pending | `popup.html` & `download-toast` aligned to Applyra 3.0 design tokens and compact action ergonomics. |
| **M13** | Advanced UI Engineering | Pending | Intentional micro-interactions, accessible dialogs/popovers, `prefers-reduced-motion` compliance. |
| **M14** | Performance Engineering | Pending | Profiled initial load, virtualized large job tables (1,500+ rows), reduced unnecessary React rerenders. |
| **M15** | Production Validation | Pending | `node --test`, new regression tests, Chrome DevTools & Playwright checks across light/dark, keyboard nav, CSP, MV3. |
| **M16** | Applyra 3.0 Release Candidate | Pending | Loadable RC1 package, migration/design docs, feature parity report, security review, arsenal provenance log. |
