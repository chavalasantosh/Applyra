/* Applyra 3.0 — Modular Workspace Bootloader */
import { initShellEnhancements, currentRouteName } from './shell.mjs';
import { renderOverviewCommandCenter } from './overview-center.mjs';
import { syncOpportunityWorkspace } from './opportunity-enhancer.mjs';

let scheduled = null;
function refreshRoute(route) {
  if (scheduled) cancelAnimationFrame(scheduled);
  scheduled = requestAnimationFrame(() => {
    const activeRoute = route || currentRouteName();
    renderOverviewCommandCenter(() => currentRouteName() === 'Overview').catch((err) => {
      console.warn('[Applyra 3.0] Overview Command Center error:', err);
    });
    syncOpportunityWorkspace(activeRoute);
  });
}

initShellEnhancements(refreshRoute);

const obs = new MutationObserver(() => {
  const route = currentRouteName();
  if (route === 'Overview' && !document.getElementById('apCommandCenter')) {
    if (document.getElementById('applyra-overview-health') || document.querySelector('.metric-strip')) {
      refreshRoute('Overview');
    }
  } else if (['Extractor', 'Saved', 'Scheduled scans', 'Applications'].includes(route) && !document.getElementById('apOppToolbar')) {
    if (document.querySelector('.table-wrap, .applyra-integrated, .extractor-console')) {
      syncOpportunityWorkspace(route);
    }
  }
});
if (document.body) obs.observe(document.body, { childList: true, subtree: true });

if (typeof chrome !== 'undefined' && chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener(() => {
    if (currentRouteName() === 'Overview') refreshRoute('Overview');
  });
}
