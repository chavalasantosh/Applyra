# Applyra 2.9.2 — Architecture Audit (Milestone M1)

## 1. Repository Inventory (Observed)
- **Total files:** 313 files (excluding `node_modules`/`.git`), **23.88 MB** total.
- **Breakdown by type:** `.png` (90), `.js` (85), `.svg` (27), `.css` (16), `.html` (15), `.ts` (13), `.md` (12), `.mjs` (11), `.cjs` (9), `.sql` (7), `.py` (4), `.json` (3), `.whl` (3), `.zip` (2), `.yml` (1), `.toml` (1), `.txt` (1), `.log` (1), `(none)` (2).
- **Version control:** No `.git` directory present in workspace; no root `package.json`.

## 2. Manifest V3 & Security Boundaries (`manifest.json`)
- **Manifest Version:** `3` (`version: "2.9.2"`, `version_name: "2.9.2-integrated-workspace"`).
- **Action Popup:** `popup.html` (`16px` and `32px` brand icons).
- **Background Service Worker:** `background-scheduled.js` (242 B wrapper importing/booting `background.js`, 505 KB).
- **Content Scripts:** `content.js` (165 KB) injected on `https://www.naukri.com/*` and `https://*.naukri.com/*` at `document_idle` (`all_frames: true`).
- **CSP:** `script-src 'self'; object-src 'self';` — strictly forbids inline scripts and remote JS.
- **Permissions:** `storage`, `unlimitedStorage`, `activeTab`, `tabs`, `scripting`, `alarms`, `identity`, `downloads`, `notifications`, `offscreen`.
- **Host Permissions:** `naukri.com`, `remotive.com`, `arbeitnow.com`, `api.adzuna.com`, `127.0.0.1`, `localhost`.
- **Optional Host Permissions:** `linkedin.com`, `indeed.co.in` / `in.indeed.com`, `foundit.in`, `shine.com`, `timesjobs.com`, `instahyre.com`, `wellfound.com`, `foorilla.com`, `hiring.cafe` / `hiringcafe.com`, `*.supabase.co`.

## 3. Source vs. Shipped Runtime Architecture
Applyra uses a **hybrid two-tier frontend + assembled-bundle runtime**:
1. **Compiled React Dashboard (`index.html`):**
   - Loads `assets/dashboard-runtime.js` (assembled from `src/message-safe.js`, `src/storage-vault.js`, `src/access-control.js`, `src/download-toast.js`, `src/user-profile-widget.js`, `src/dashboard-radar.js`, `src/extractor-universal.js`, `src/dashboard-overview.js`).
   - Loads pre-built React SPA bundle `assets/main-5HBZNLr_.js` + `assets/main-irYfKfmz.css` (plus a source copy at `src/assets/main-5HBZNLr_.js`).
   - Dynamically mounts ES modules for `#Resume` (`assets/career-intelligence/ui.mjs` + `resume-view.html`) and `#Scheduled scans` (`assets/opportunities/opportunity-view.mjs` + `scans-view.html`).
2. **Standalone Extension Pages (13 additional HTML pages):**
   - `popup.html`, `apply-engine.html`, `career-intelligence.html`, `career-suite.html`, `company-intel.html`, `naukri-profile.html`, `auth.html`, `onboarding.html`, `billing.html`, `admin.html`, `test-lab.html`, `offscreen.html`.
   - Assembled into root monolithic `.js` bundles by `scripts/build-secure-artifacts.mjs` from `src/*.js`.
3. **Shared Theme & Controls Layer:**
   - `theme.css` + `theme-controls.js` (`src/theme-controls.js`) provide light/dark tokens (`[data-theme="dark"]` default), `chrome.storage.local` + `localStorage` sync, and the animated Day/Night toggle.
4. **Backend & Toolkits:**
   - `supabase/functions/` (12 Edge Functions + 2 shared TypeScript modules) and `supabase/migrations/` (6 SQL migrations + `supabase-setup.sql`).
   - Local Python automation toolkits: `job_auto_apply_pro.py`, `job_auto_apply_toolkit.py`, and wheels in `modules/`.

## 4. Storage & Runtime Contracts
- **Encrypted Local Storage:** `storage-vault.js` wraps `chrome.storage.local` with AES-GCM v3 (`__ap_enc_v3`) keyed per extension ID.
- **Core Keys:** `jobs`, `universalJobs`, `careerSuite`, `careerEvidence`, `careerManualJobs`, `teamWorkspace`, `profile`, `rememberedAccounts`, `businessAccount`, `applyraTheme`.
- **Background Messaging:** `AUTH_GET_STATUS`, `AUTH_SWITCH_ACCOUNT`, `AUTH_SIGN_OUT`, `RUN_NAUKRI_AUTO_APPLY`, scheduled scan alarms, and toolkit bridge messages via `message-safe.js`.

## 5. Baseline Verification (`node --test tests/*.test.*`)
- **Result:** **47 / 47 passed**, `0` failed (`5234.82ms`).
- **Test Files (11):** `applyra-toolkit.test.cjs`, `auto-apply-bridge.test.cjs`, `career-intelligence.test.cjs`, `commerce-and-radar.test.cjs`, `extractor-pagination.test.cjs`, `native-workspace.test.cjs`, `opportunity-portals.test.mjs`, `opportunity-scans.test.cjs`, `resume-parser.test.mjs`, `scan-ui.test.cjs`, `shipped-worker.test.cjs`.
