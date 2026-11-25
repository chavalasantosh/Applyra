# Applyra 3.0 — Design System Plan (Milestone M3 Blueprint)

## 1. Design Direction ("Operate" Mode)
Applyra is a high-frequency, data-dense **Career Command Center** (inspired by Linear's crisp keyboard-first navigation, Vercel's restrained surfaces, Stripe's tabular data clarity, and Raycast's command ergonomics). It avoids generic AI gradients, decorative glassmorphism, and inconsistent page-level styling.

## 2. Token Architecture (`tokens.css` → Dark & Light Themes)
- **Surfaces (Dark Default):**
  - `--bg-canvas`: `#090d16` (app canvas)
  - `--bg-surface`: `#0f1624` (cards, sidebar, topbar)
  - `--bg-surface-elevated`: `#162033` (popovers, drawers, active hover)
  - `--bg-subtle`: `#111a2b` (inputs, table headers, secondary wells)
- **Surfaces (Light Mode):**
  - `--bg-canvas`: `#f6f8fc`, `--bg-surface`: `#ffffff`, `--bg-surface-elevated`: `#f1f5f9`, `--bg-subtle`: `#eef2f7`
- **Borders & Elevation:** Hairline `1px solid` borders (`rgba(148, 163, 184, 0.16)` dark / `#e2e8f0` light); shadows reserved strictly for popovers, modals, and command palette.
- **Brand & Semantic Accents:**
  - Primary Action: `#2563eb` (hover `#1d4ed8`, subtle tint `rgba(37, 99, 235, 0.14)`)
  - Semantic Status: Success (`#10b981`), Warning (`#f59e0b`), Danger (`#ef4444`), Info (`#38bdf8`) — always paired with text/icon labels, never color-only.
- **Typography:**
  - UI Sans: `Inter, ui-sans-serif, system-ui, sans-serif`
  - Numeric/Metric Alignment: `font-variant-numeric: tabular-nums` on all scores, job counts, salaries, and timestamps.
  - Scale: `12px` metadata/labels, `13px` dense table/nav items, `14px` body/controls, `18px–22px` section headings, `24px–28px` page titles.

## 3. Component & Interaction Standards
- **Shell:** Fixed `56px` topbar (sidebar toggle, brand, breadcrumbs/context, quick actions, Settings, Day/Night pill), collapsible `224px` sidebar with grouped sections + sticky bottom profile switcher, and `Ctrl/Cmd+K` command palette.
- **Tables & Lists:** Sticky headers, `44px` comfortable row height, keyboard row navigation, virtualized rendering for 1,500+ job rows.
- **Forms & Feedback:** Visible labels, inline validation errors, optimistic status toasts (`aria-live="polite"`), and clear empty states with one primary next action.
- **Motion:** Functional state transitions (`150ms–220ms cubic-bezier(0.22, 1, 0.36, 1)`) for drawers, popovers, and theme switch; full `@media (prefers-reduced-motion: reduce)` support.
- **Iconography:** Unified stroke-weight SVG icons + existing `assets/applyra-sidebar-icons/` and `assets/brand/` assets (no emoji icons in production UI chrome).
