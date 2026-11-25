/* Applyra 3.0 — Milestone M7 Application Operations Center Strip */
function syncOpsStrip() {
  const main = document.querySelector('.page-shell main');
  if (!main) return;

  let strip = document.getElementById('apOpsStrip');
  if (!strip) {
    strip = document.createElement('section');
    strip.id = 'apOpsStrip';
    strip.className = 'ap-ops-strip';
    strip.setAttribute('aria-label', 'Live operations summary');
    main.insertBefore(strip, main.firstChild);
  }

  const read = (id) => (document.getElementById(id)?.textContent || '0').trim();
  const items = [
    { label: 'Ready Queue', value: read('metricQueue') },
    { label: 'Active Sessions', value: read('metricActive') },
    { label: 'Needs Attention', value: read('metricAttention') },
    { label: 'Confirmed Today', value: read('metricAutoApply') },
    { label: 'Vault Readiness', value: read('metricVault') }
  ];

  strip.replaceChildren();
  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'ap-ops-stat';
    const sp = document.createElement('span');
    sp.textContent = item.label;
    const st = document.createElement('strong');
    st.textContent = item.value;
    card.append(sp, st);
    strip.appendChild(card);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncOpsStrip);
} else {
  syncOpsStrip();
}

const metricsHost = document.querySelector('.metrics');
if (metricsHost && typeof MutationObserver !== 'undefined') {
  new MutationObserver(syncOpsStrip).observe(metricsHost, { childList: true, subtree: true, characterData: true });
}
