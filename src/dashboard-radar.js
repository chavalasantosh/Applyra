(() => {
  'use strict';
  // 4.7.6 lock: Overview must not own a second job-search experience.
  // Search belongs only to Extractor. This compatibility script removes any
  // stale Job Radar card left in an already-open dashboard and does nothing else.
  const removeRetiredRadar = () => document.getElementById('nowcurry-job-radar')?.remove();
  removeRetiredRadar();
  document.addEventListener('DOMContentLoaded', removeRetiredRadar, { once: true });
  window.addEventListener('popstate', removeRetiredRadar);
  window.addEventListener('hashchange', removeRetiredRadar);
  document.addEventListener('click', () => window.setTimeout(removeRetiredRadar, 0), { capture: true, passive: true });
})();
