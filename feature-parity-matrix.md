# Applyra 3.0 — Feature Parity Matrix (Milestone M1)

| Area | Current Entry Point / Module | Core Capabilities to Preserve | Target Milestone |
| --- | --- | --- | --- |
| **Application Shell** | `index.html`, `assets/main-5HBZNLr_.js`, `src/user-profile-widget.js`, `theme-controls.js` | Hash routing, collapsible sidebar, sidebar search, topbar actions, Day/Night toggle, sticky account switcher & popover | M4 |
| **Overview Dashboard** | `index.html#Overview`, `src/dashboard-overview.js` | Real job counts, strong profile fit, workspace health, Career Pulse, filters (experience, location, action, status, min fit), sorted job table, CSV import/export | M5 |
| **Resume & Career Intel** | `index.html#Resume`, `career-intelligence.html`, `assets/career-intelligence/*` | Local PDF/DOCX/TXT/MD parsing, candidate switcher, Naukri/LinkedIn evidence, 7-day fit/exp/loc rings, improvement plan, job-by-job analysis, manual JD analyzer, JSON export | M8 |
| **Scheduled Scans & Discovery** | `index.html#Scheduled scans`, `#Extractor`, `assets/opportunities/*`, `src/extractor-universal.js`, `src/opportunity-worker.js` | Multi-portal search (Naukri, Remotive, Arbeitnow, Adzuna, optional portals), pagination, scheduled chrome alarms, deduping & freshness | M6 |
| **Auto Apply & Pipeline** | `apply-engine.html`, `index.html#Pipeline`, `#Applications`, `#Runs`, `src/naukri-auto-apply-core.js`, `content.js` | Queue state, batch/1-click auto-apply, screening drawer handling, retry/stop/pause, truthful submission outcome classification (never faking success) | M7 |
| **Company & Comp Intel** | `company-intel.html`, `src/company-intel.js`, `src/company-intel-core.js` | Employer/role salary evidence, leveling rows, job radar links, sample-size/missing-data transparency | M9 |
| **Career Suite & Profile** | `career-suite.html`, `naukri-profile.html`, `index.html#Profile`, `#Career coach`, `#Study Guide`, `#Intelligence` | Candidate memory, Naukri profile mirror, interview log, study plan, Answer Vault | M8 / M10 |
| **Auth & Onboarding** | `auth.html`, `onboarding.html`, `src/auth.js`, `src/onboarding.js` | PKCE OAuth / email auth, account switching, 5-step verified setup checklist, portal security boundary notice | M10 |
| **Billing, Settings, Admin, Test Lab** | `billing.html`, `index.html#Settings`, `admin.html`, `test-lab.html`, `supabase/functions/*` | Tier/entitlement checks, multi-gateway checkout guards (unfinished gateways clearly marked), admin gate, diagnostics | M11 |
| **Popup & Notifications** | `popup.html`, `src/popup.js`, `src/download-toast.js`, `offscreen.html` | Quick status, scan/apply launch, theme toggle, non-blocking toast notifications | M12 |
