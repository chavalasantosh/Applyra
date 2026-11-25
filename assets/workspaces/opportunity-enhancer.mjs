/* Applyra 3.0 — Milestone M6 Opportunity Workspace Controls */
const VIEW_KEY = 'applyra-opp-view';
const TARGET_ROUTES = new Set(['Extractor', 'Saved', 'Scheduled scans', 'Applications']);

export function syncOpportunityWorkspace(route) {
  const existing = document.getElementById('apOppToolbar');
  if (!TARGET_ROUTES.has(route)) {
    if (existing) existing.remove();
    return;
  }

  const host = document.querySelector('.table-wrap') || document.querySelector('.applyra-integrated') || document.querySelector('.extractor-console');
  if (!host || !host.parentElement) return;

  let bar = document.getElementById('apOppToolbar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'apOppToolbar';
    bar.className = 'ap-opp-toolbar';

    const left = document.createElement('div');
    left.className = 'ap-cc-meta';
    left.textContent = 'View density & keyboard: g+e Extractor · g+s Scans · Ctrl+K Search';

    const seg = document.createElement('div');
    seg.className = 'ap-segmented';
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Workspace view mode');

    let savedView = 'table';
    try { savedView = localStorage.getItem(VIEW_KEY) || 'table'; } catch {}

    const applyView = (mode) => {
      document.documentElement.setAttribute('data-ap-view', mode);
      try { localStorage.setItem(VIEW_KEY, mode); } catch {}
      seg.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
      });
    };

    for (const [mode, label] of [['table', 'Comfortable'], ['compact', 'Compact']]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.mode = mode;
      btn.textContent = label;
      btn.setAttribute('aria-pressed', String(savedView === mode));
      btn.addEventListener('click', () => applyView(mode));
      seg.appendChild(btn);
    }

    applyView(savedView);
    bar.append(left, seg);
    host.parentElement.insertBefore(bar, host);
  }
}
