/* Applyra 3.0 — Milestone M7 Application Operations Center Strip & Explicit Vault Review */
import { deriveVaultSuggestions } from './vault-suggestions.mjs';

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

function showToastMessage(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToastMessage._t);
  showToastMessage._t = setTimeout(() => { toast.hidden = true; }, 3500);
}

function readStorage(keys) {
  if (typeof chrome === 'undefined' || !chrome?.storage?.local) return Promise.resolve({});
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (res) => resolve(res || {}));
    } catch {
      resolve({});
    }
  });
}

function applySuggestionToField(key, value) {
  const el = document.querySelector(`[data-vault="${key}"]`);
  if (!el) return false;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

async function openVaultReview() {
  const panel = document.querySelector('[data-panel="answers"]');
  if (!panel) return;
  const store = await readStorage(['profile', 'careerEvidence', 'teamWorkspace']);
  const suggestions = deriveVaultSuggestions(store);

  const pending = suggestions.filter((s) => {
    const el = document.querySelector(`[data-vault="${s.key}"]`);
    return el && !String(el.value || '').trim();
  });

  let tray = document.getElementById('apVaultReviewTray');
  if (!tray) {
    tray = document.createElement('div');
    tray.id = 'apVaultReviewTray';
    tray.className = 'ap-cc-card';
    tray.style.marginBottom = '14px';
    const grid = panel.querySelector('.form-grid');
    if (grid) panel.insertBefore(tray, grid);
  }

  tray.replaceChildren();
  const head = document.createElement('div');
  head.className = 'ap-cc-head';
  const title = document.createElement('h3');
  title.textContent = pending.length
    ? `Review ${pending.length} evidence-backed suggestion(s)`
    : 'No new empty fields to suggest from stored evidence';
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';

  if (pending.length) {
    const approveAll = document.createElement('button');
    approveAll.type = 'button';
    approveAll.className = 'button primary';
    approveAll.textContent = 'Approve all';
    approveAll.addEventListener('click', () => {
      let count = 0;
      for (const s of pending) {
        if (applySuggestionToField(s.key, s.value)) count += 1;
      }
      tray.remove();
      showToastMessage(`Applied ${count} approved suggestion(s). Click Save Answer Vault to persist.`);
    });
    actions.appendChild(approveAll);
  }

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'button secondary';
  dismiss.textContent = 'Dismiss';
  dismiss.addEventListener('click', () => tray.remove());
  actions.appendChild(dismiss);
  head.append(title, actions);
  tray.appendChild(head);

  if (pending.length) {
    const list = document.createElement('div');
    list.className = 'ap-funnel-list';
    for (const s of pending) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.gap = '10px';
      row.style.padding = '8px 10px';
      row.style.borderRadius = 'var(--ap-r-sm)';
      row.style.background = 'var(--ap-subtle)';

      const info = document.createElement('div');
      const strong = document.createElement('strong');
      strong.style.display = 'block';
      strong.style.fontSize = '12.5px';
      strong.textContent = `${s.label}: ${s.value.length > 80 ? s.value.slice(0, 80) + '…' : s.value}`;
      const meta = document.createElement('span');
      meta.className = 'ap-cc-meta';
      meta.textContent = `Source: ${s.source}`;
      info.append(strong, meta);

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'button secondary';
      applyBtn.textContent = 'Approve';
      applyBtn.addEventListener('click', () => {
        applySuggestionToField(s.key, s.value);
        row.remove();
        showToastMessage(`Approved ${s.label}. Click Save Answer Vault to persist.`);
      });

      row.append(info, applyBtn);
      list.appendChild(row);
    }
    tray.appendChild(list);
  }
}

function initOpsCenter() {
  syncOpsStrip();
  const btn = document.getElementById('autoFillVaultBtn');
  if (btn && !btn.dataset.apWired) {
    btn.dataset.apWired = '1';
    btn.addEventListener('click', () => { openVaultReview(); });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOpsCenter);
} else {
  initOpsCenter();
}

const metricsHost = document.querySelector('.metrics');
if (metricsHost && typeof MutationObserver !== 'undefined') {
  new MutationObserver(syncOpsStrip).observe(metricsHost, { childList: true, subtree: true, characterData: true });
}
