# Applyra 2.9.1 — integrated workspace

Extract the archive. In chrome://extensions, load this folder as an unpacked extension or reload the existing extension after replacing its files. Confirm version 2.9.1, close older Applyra tabs, and reopen the dashboard. Keep the same extension installation when possible to retain its local data.

Use the existing sidebar:

- **Resume**: upload a resume, review the extracted text, save it, and inspect the improvement plan and job analysis. Naukri/LinkedIn text can be supplied separately. Saving resume evidence refreshes dashboard job scores; it does not rewrite the saved profile.
- **Scheduled scans**: set target roles and location preferences, then select **Scan now**. A saved schedule is not required for a manual scan. For recurring scans, select Every day / Every week / Every month, enable recurring scans and save the schedule.

These are native views inside the existing dashboard; the existing header, sidebar, history and original screens remain in place. Extra navigation strips from previous previews have been removed. Manual scans refresh current matches on every run. Scheduled scans still suppress previously surfaced matches.

Chrome must run for browser-based scheduled scans. Scans assess saved jobs plus Remotive/Arbeitnow feeds; they do not search all Naukri or LinkedIn jobs. Live browser acceptance and live Naukri submission have not been performed here. Payment deployment and lifecycle work listed in docs/2.9.0-IMPLEMENTATION.md remains unfinished.

Read docs/2.9.1-REWORK.md for changes and validation. The SaaS feature roadmap remains in docs/SAAS-FEATURE-ROADMAP.md.
