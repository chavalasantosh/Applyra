/* Applyra 3.0 — Milestone M4 Shell Breadcrumbs & Keyboard Shortcuts */
const ROUTE_META = {
  Overview: ['Workspace', 'Overview'],
  Resume: ['Career Intel', 'Resume & Profile'],
  'Scheduled scans': ['Discovery', 'Scheduled Scans'],
  Extractor: ['Discovery', 'Job Extractor'],
  Applications: ['Pipeline', 'Applications'],
  Runs: ['Pipeline', 'Extraction Runs'],
  'Account history': ['Workspace', 'Account History'],
  Intelligence: ['Career Intel', 'Skill Intelligence'],
  'Study Guide': ['Career Intel', 'Study Guide'],
  'Career coach': ['Career Intel', 'Career Coach'],
  'Automation Center': ['Automation', 'Automation Center'],
  Pipeline: ['Pipeline', 'Pipeline Board'],
  Saved: ['Discovery', 'Saved Jobs'],
  Exports: ['Workspace', 'Exports'],
  Profile: ['Account', 'Profile'],
  Settings: ['Account', 'Settings'],
  'Help & feedback': ['Account', 'Help & Feedback']
};

export function currentRouteName() {
  const activeNav = document.querySelector('.sidebar .nav-item.active');
  if (activeNav) {
    const txt = (activeNav.textContent || '').trim();
    if (ROUTE_META[txt]) return txt;
  }
  const raw = decodeURIComponent((location.hash || '#Overview').replace(/^#/, '')).trim();
  return raw || 'Overview';
}

export function initShellEnhancements(onRouteChange) {
  function syncBreadcrumb() {
    const brandLockup = document.querySelector('header.topbar .brand-lockup');
    if (!brandLockup) return;
    let crumb = document.getElementById('apTopbarBreadcrumb');
    if (!crumb) {
      crumb = document.createElement('div');
      crumb.id = 'apTopbarBreadcrumb';
      crumb.className = 'ap-breadcrumb';
      crumb.setAttribute('aria-label', 'Current section');
      brandLockup.insertAdjacentElement('afterend', crumb);
    }
    const route = currentRouteName();
    const [group, label] = ROUTE_META[route] || ['Workspace', route];
    crumb.replaceChildren();
    const g = document.createElement('span');
    g.textContent = group + ' / ';
    const l = document.createElement('strong');
    l.textContent = label;
    crumb.append(g, l);
  }

  let gArmedAt = 0;
  function onKeyDown(ev) {
    const tag = ev.target?.tagName || '';
    if (ev.ctrlKey || ev.metaKey || ev.altKey || /INPUT|TEXTAREA|SELECT/.test(tag) || ev.target?.isContentEditable) return;
    const k = ev.key.toLowerCase();
    const now = Date.now();
    if (k === 'g') {
      gArmedAt = now;
      return;
    }
    if (now - gArmedAt <= 900) {
      gArmedAt = 0;
      const map = { o: '#Overview', r: '#Resume', s: '#Scheduled%20scans', e: '#Extractor', p: '#Pipeline', a: '#Applications' };
      if (map[k]) {
        ev.preventDefault();
        location.hash = map[k];
      }
    }
  }

  function handleRoute() {
    syncBreadcrumb();
    onRouteChange?.(currentRouteName());
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('popstate', () => setTimeout(handleRoute, 40));
  document.addEventListener('click', (ev) => {
    if (ev.target?.closest?.('.sidebar .nav-item')) setTimeout(handleRoute, 40);
  }, { capture: true, passive: true });
  document.addEventListener('keydown', onKeyDown);

  const obs = new MutationObserver(() => {
    if (document.querySelector('header.topbar .brand-lockup') && !document.getElementById('apTopbarBreadcrumb')) {
      syncBreadcrumb();
    }
  });
  if (document.body) obs.observe(document.body, { childList: true, subtree: true });
  handleRoute();

  return () => {
    window.removeEventListener('hashchange', handleRoute);
    document.removeEventListener('keydown', onKeyDown);
    obs.disconnect();
  };
}
