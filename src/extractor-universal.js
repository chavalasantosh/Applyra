(() => {
  'use strict';

  const ID = 'nowcurry-unified-extractor-search';
  const LEGACY_IDS = ['nowcurry-universal-extractor', 'nowcurry-naukri-direct-search'];
  const STYLE_ID = 'nowcurry-unified-extractor-style';
  const SOURCES = [
    ['naukri', 'Active Extraction Feed', 'Current workspace extractor'],
    ['foorilla', 'Applyra AI Radar', 'High-growth tech channel'],
    ['hiringcafe', 'Applyra Direct Feed', 'Enterprise partner channel'],
    ['remotive', 'Applyra Remote Radar', 'Calibrated distributed channel'],
    ['adzuna', 'Applyra Market Index', 'Calibrated role feed']
  ];
  const PROVIDER_ORIGINS = {
    foorilla: ['https://foorilla.com/*', 'https://www.foorilla.com/*'],
    hiringcafe: ['https://hiring.cafe/*', 'https://www.hiring.cafe/*', 'https://hiringcafe.com/*', 'https://www.hiringcafe.com/*'],
    remotive: ['https://remotive.com/*'],
    adzuna: ['https://api.adzuna.com/*']
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const send = (message, timeoutMs = 25000) => globalThis.NowCurryMessage.sendRuntime(chrome, message, { timeoutMs });
  const storageGet = (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  const storageSet = (value) => new Promise((resolve) => chrome.storage.local.set(value, resolve));

  function exactHeading(text) {
    const wanted = text.toLowerCase();
    const headings = [...document.querySelectorAll('#root h1,#root h2,#root h3,#root h4,#root [role="heading"]')];
    return headings.find((element) => (element.textContent || '').trim().toLowerCase() === wanted) || null;
  }

  function isExtractorPage() {
    return Boolean(document.querySelector('.extractor-console') || exactHeading('Naukri data extractor'));
  }

  function extractorConsole() {
    // During an auto-started scan the H2 changes from "Choose the job target"
    // to "Extraction in progress" before this enhancement script mounts.
    // Resolve the actual console directly so the unified search never disappears
    // merely because extraction has already started.
    return document.querySelector('.extractor-console') || null;
  }

  function removeLegacyPanels() {
    LEGACY_IDS.forEach((id) => document.getElementById(id)?.remove());
  }

  function removeRetiredProfileRefresh() {
    document.querySelectorAll('.automation-panel,.profile-refresh-summary').forEach((panel) => {
      const text = (panel.textContent || '').toLowerCase();
      if (text.includes('background profile refresh') || text.includes('automatic refresh cadence') || text.includes('automatic profile refresh')) panel.remove();
    });
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${ID}{margin:14px 0 16px;padding:16px 18px;border:1px solid #bfd0ee;border-radius:12px;background:#f8fbff;color:#17233d;font-family:inherit;box-shadow:0 1px 2px rgba(16,35,70,.03)}
#${ID} *{box-sizing:border-box}#${ID} .ux-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px}#${ID} .ux-title{font-size:14px;font-weight:850}#${ID} .ux-sub{font-size:11px;color:#65738b;line-height:1.45;margin-top:4px}#${ID} .ux-badge{font-size:9px;font-weight:850;letter-spacing:.05em;background:#e9f1ff;color:#1459dc;padding:5px 8px;border-radius:999px;white-space:nowrap}
#${ID} .ux-search{display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:9px;align-items:center}#${ID} input[type="search"]{height:43px;border:1px solid #ccd8e9;border-radius:10px;background:#fff;color:#17233d;padding:0 12px;font:inherit;font-size:12px;outline:none}#${ID} input[type="search"]:focus{border-color:#2864db;box-shadow:0 0 0 3px rgba(40,100,219,.1)}#${ID} button{height:43px;border:1px solid #1760e8;border-radius:10px;background:#1760e8;color:#fff;padding:0 15px;font-weight:800;cursor:pointer;white-space:nowrap}#${ID} button:disabled{opacity:.55;cursor:wait}
#${ID} .ux-portals{display:flex;flex-wrap:wrap;gap:7px;margin:11px 0 4px}#${ID} .ux-portal{display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid #d9e3f1;border-radius:9px;background:#fff;font-size:10.5px;cursor:pointer}#${ID} .ux-portal small{color:#7b8798}#${ID} .ux-status{min-height:16px;margin-top:9px;font-size:10.5px;color:#65738b;line-height:1.45}#${ID} .ux-status.ok{color:#18703c}#${ID} .ux-status.error{color:#b23a32}#${ID} .ux-summary{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#${ID} .ux-chip{font-size:9.5px;font-weight:750;padding:5px 7px;border-radius:999px;background:#edf4ff;color:#2b5ea9}
@media(max-width:900px){#${ID} .ux-search{grid-template-columns:1fr}#${ID} .ux-search button{width:100%}}
`;
    document.head.appendChild(style);
  }

  async function ensureProviderPermissions(providers) {
    if (!chrome.permissions?.contains) return true;
    const origins = [...new Set((providers || []).flatMap((id) => PROVIDER_ORIGINS[id] || []))];
    if (!origins.length) return true;
    try {
      const hasAll = await chrome.permissions.contains({ origins });
      if (hasAll) return true;
    } catch {}
    if (!chrome.permissions?.request) return false;
    return chrome.permissions.request({ origins }).catch(() => false);
  }

  async function loadDefaults(root) {
    try {
      const stored = await storageGet(['unifiedExtractorSelection']);
      // Portal choice is explicit. A fresh install starts with Naukri only so the
      // visible Naukri result page and the native extraction cannot be silently
      // mixed with unrelated external-provider rows. Saved user choices persist.
      const selected = Array.isArray(stored.unifiedExtractorSelection)
        ? new Set(stored.unifiedExtractorSelection)
        : new Set(['naukri']);
      root.querySelectorAll('[data-provider]').forEach((node) => {
        node.checked = selected.has(node.dataset.provider);
      });
      // Search field must remain empty and clean with its placeholder.
      // Profile headline and summary belong exclusively in the user's profile, NOT the search field.
      const queryInput = root.querySelector('[data-query]');
      if (queryInput) {
        queryInput.value = '';
      }
    } catch {}
  }

  async function saveSelection(root) {
    const selected = [...root.querySelectorAll('[data-provider]:checked')].map((node) => node.dataset.provider);
    await storageSet({ unifiedExtractorSelection: selected });
  }

  function createPanel() {
    const root = document.createElement('section');
    root.id = ID;
    root.innerHTML = `
      <div class="ux-head">
        <div><div class="ux-title">Applyra Unified Job Radar</div><div class="ux-sub">Search across all Applyra calibrated channels into your private workspace. All candidate intelligence remains inside Applyra.</div></div>
        <span class="ux-badge">ONE SEARCH</span>
      </div>
      <div class="ux-search">
        <input data-query type="search" maxlength="180" placeholder="Role, skills, keywords or company">
        <button data-run type="button">Search Applyra Channels</button>
      </div>
      <div class="ux-portals">${SOURCES.map(([id, label, note]) => `<label class="ux-portal"><input type="checkbox" data-provider="${id}"><span><b>${label}</b>${note ? ` · <small>${note}</small>` : ''}</span></label>`).join('')}</div>
      <div class="ux-status">Select channels, enter a role or skill, and search directly into your workspace.</div>
      <div class="ux-summary"></div>`;
    return root;
  }

  function showProviderSummary(root, response) {
    const providers = response?.providers || [];
    const jobs = response?.jobs || [];
    root.querySelector('.ux-summary').innerHTML = providers.map((provider) => `<span class="ux-chip">${esc(provider.id)}: ${provider.error ? 'error' : esc(provider.count)}</span>`).join('') + (jobs.length ? `<span class="ux-chip">Unique: ${jobs.length}</span>` : '');
  }

  async function runUnifiedSearch(root) {
    const button = root.querySelector('[data-run]');
    const status = root.querySelector('.ux-status');
    const query = root.querySelector('[data-query]').value.trim();
    const nativeTarget = document.querySelector('input[aria-label="Unique-job target"]');
    const limit = Math.max(1, Math.min(200, Number(nativeTarget?.value) || 40));
    const selected = [...root.querySelectorAll('[data-provider]:checked')].map((node) => node.dataset.provider);
    const useNaukri = selected.includes('naukri');
    const external = selected.filter((id) => id !== 'naukri');

    if (!query) {
      status.className = 'ux-status error';
      status.textContent = 'Enter one role, skill, keyword or company to search.';
      return;
    }
    if (!selected.length) {
      status.className = 'ux-status error';
      status.textContent = 'Select at least one job portal.';
      return;
    }

    button.disabled = true;
    root.querySelector('.ux-summary').innerHTML = '';
    status.className = 'ux-status';
    try {
      await saveSelection(root);

      if (external.length) {
        status.textContent = `Searching ${external.length} active channel${external.length === 1 ? '' : 's'}…`;
        const granted = await ensureProviderPermissions(external);
        let activeExternal = external;
        if (!granted) {
          activeExternal = [];
          for (const id of external) {
            const orgs = PROVIDER_ORIGINS[id] || [];
            if (!orgs.length || await chrome.permissions?.contains?.({ origins: orgs }).catch(() => false)) {
              activeExternal.push(id);
            }
          }
        }
        if (activeExternal.length > 0) {
          const response = await send({ type: 'EXTRACT_EXTERNAL_PROVIDERS', query, providers: activeExternal, limit }, 45000);
          if (!response?.ok) throw new Error(response?.error || 'Channel search failed.');
          showProviderSummary(root, response);
          status.className = 'ux-status ok';
          status.textContent = `Saved ${response.nativeJobs?.length || response.jobs?.length || 0} unique opportunities to the workspace.`;
        } else if (!useNaukri) {
          throw new Error('Required channel permission was not granted. Please approve the permission prompt or search Naukri directly.');
        }
      }

      if (useNaukri) {
        status.className = 'ux-status';
        status.textContent = external.length ? 'External jobs saved. Connecting to Naukri search in background…' : 'Connecting to Naukri search in background…';
        const opened = await send({ type: 'OPEN_NAUKRI_EXTRACTOR_SEARCH', search: { keywords: query, experience: '', location: '', active: false } }, 60000);
        if (!opened?.ok || !opened?.ready || !opened?.tabId) throw new Error(opened?.error || 'Naukri search results did not become ready for extraction.');
        status.className = 'ux-status ok';
        status.textContent = `Naukri rendered ${opened.visibleJobs || 'the'} matching result cards. Starting extraction from that exact fresh tab…`;
        const params = new URLSearchParams({ scan: '1', target: String(limit), sourceTab: String(opened.tabId) });
        location.assign(chrome.runtime.getURL(`index.html?${params.toString()}`));
        return;
      }

      status.className = 'ux-status ok';
      if (!external.length) status.textContent = 'Search completed.';
    } catch (error) {
      status.className = 'ux-status error';
      status.textContent = `Error: ${error?.message || String(error)}`;
    } finally {
      button.disabled = false;
    }
  }

  function mount() {
    const existing = document.getElementById(ID);
    if (!isExtractorPage()) {
      existing?.remove();
      return;
    }
    removeRetiredProfileRefresh();
    removeLegacyPanels();
    if (existing?.isConnected) return;
    const consoleRoot = extractorConsole();
    const head = consoleRoot?.querySelector?.('.extractor-console-head');
    if (!consoleRoot || !head) return;
    installStyles();
    const root = createPanel();
    // Keep the one-query + portal filters visible at the top of the real
    // Extractor console, including while an auto-started run is active.
    head.insertAdjacentElement('afterend', root);
    loadDefaults(root);
    root.querySelector('[data-run]').addEventListener('click', () => runUnifiedSearch(root));
    root.querySelector('[data-query]').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); runUnifiedSearch(root); }
    });
  }

  let timer = 0;
  const schedule = (delay = 120) => {
    clearTimeout(timer);
    timer = setTimeout(mount, delay);
  };
  document.addEventListener('DOMContentLoaded', () => schedule(120), { once: true });
  window.addEventListener('popstate', () => schedule(100));
  window.addEventListener('hashchange', () => schedule(100));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(120); });
  // React tab changes are user-driven even when the URL stays stable. Mount after
  // those clicks instead of polling the whole dashboard forever.
  document.addEventListener('click', () => schedule(90), { capture: true, passive: true });
  // React can auto-start extraction before the enhancement script mounts.
  // Retry for a finite startup window only; do not install a permanent DOM poller.
  [250, 700, 1400, 2600, 4500, 7000, 10000].forEach((delay) => window.setTimeout(() => schedule(0), delay));
})();
