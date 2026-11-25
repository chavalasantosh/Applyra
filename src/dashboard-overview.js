(() => {
  'use strict';

  const ID = 'applyra-overview-health';
  const STYLE_ID = 'applyra-overview-health-style';
  const KEYS = ['jobs', 'runs', 'activeRun', 'profile', 'lastAutomaticNaukriCapture', 'lastScan'];
  let stateCache = {};
  let initialLoadStarted = false;

  const storageGet = (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  const safeArray = (value) => Array.isArray(value) ? value : [];
  const dateText = (value) => {
    if (!value) return 'Not yet';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : 'Not yet';
  };

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${ID}{margin:0 0 16px;padding:15px 16px;border:1px solid #d5dfed;border-radius:12px;background:#fff;color:#17213a;font-family:inherit;box-shadow:0 1px 2px rgba(18,35,70,.025)}
#${ID} *{box-sizing:border-box}#${ID} .aoh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:11px}#${ID} .aoh-title{font-size:13px;font-weight:850}#${ID} .aoh-sub{font-size:10.5px;color:#69768b;margin-top:3px;line-height:1.4}#${ID} .aoh-badge{font-size:9px;font-weight:850;letter-spacing:.05em;color:#315b99;background:#edf4ff;border-radius:999px;padding:5px 8px;white-space:nowrap}
#${ID} .aoh-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}#${ID} .aoh-card{border:1px solid #e0e7f0;border-radius:9px;padding:9px 10px;background:#fbfcfe;min-width:0}#${ID} .aoh-label{font-size:9.5px;color:#748197;text-transform:uppercase;letter-spacing:.045em;font-weight:800}#${ID} .aoh-value{font-size:13px;font-weight:850;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#${ID} .aoh-note{font-size:9.5px;color:#718096;margin-top:3px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${ID} .aoh-next{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #e7edf5}#${ID} .aoh-next strong{display:block;font-size:11px}#${ID} .aoh-next span{display:block;font-size:10px;color:#6d798d;margin-top:2px}#${ID} .aoh-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}#${ID} button{border:1px solid #cdd9ea;border-radius:8px;background:#fff;color:#20324f;padding:6px 9px;font:inherit;font-size:9.5px;font-weight:800;cursor:pointer}#${ID} button.primary{background:#1760e8;border-color:#1760e8;color:#fff}
@media(max-width:1000px){#${ID} .aoh-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#${ID} .aoh-next{align-items:flex-start;flex-direction:column}#${ID} .aoh-actions{justify-content:flex-start}}
`;
    document.head.appendChild(style);
  }

  function navigate(label) {
    const buttons = [...document.querySelectorAll('button,a')];
    const target = buttons.find((element) => (element.textContent || '').trim() === label);
    target?.click();
  }

  function derive(state) {
    const jobs = safeArray(state.jobs);
    const runs = safeArray(state.runs);
    const applied = jobs.filter((job) => /^applied$/i.test(String(job?.status || job?.applicationStatus || ''))).length;
    const interviews = jobs.filter((job) => /interview/i.test(String(job?.status || job?.applicationStatus || ''))).length;
    const offers = jobs.filter((job) => /offer/i.test(String(job?.status || job?.applicationStatus || ''))).length;
    const sourceNames = [...new Set(jobs.map((job) => job?.source?.id || job?.source || job?.portal || '').filter(Boolean).map(String))];
    const latestRun = runs.slice().sort((a, b) => new Date(b?.updatedAt || b?.endedAt || b?.startedAt || 0) - new Date(a?.updatedAt || a?.endedAt || a?.startedAt || 0))[0] || state.activeRun || null;
    const capture = state.lastAutomaticNaukriCapture || {};
    const profileAt = capture.at || capture.capturedAt || capture.updatedAt || state.profile?.capturedAt || state.profile?.updatedAt || '';
    const lastScan = state.lastScan || {};

    let next = { title: 'Workspace ready', note: 'Continue from the workflow that needs attention.', action: 'Extractor' };
    const hasProfile = Boolean(state.profile && (state.profile.headline || (Array.isArray(state.profile.skills) && state.profile.skills.length) || state.profile.fullName || state.profile.name || state.profile.naukriProfile));
    if (!hasProfile) next = { title: 'Capture your profile', note: 'Open your Naukri profile; Applyra will hydrate lazy sections and capture automatically.', action: 'Profile' };
    else if (!jobs.length) next = { title: 'Build your job corpus', note: 'Use one Extractor query and select the portals you want.', action: 'Extractor' };
    else if (!applied && !interviews && !offers) next = { title: 'Corpus ready for action', note: `${jobs.length} captured jobs are available; review and move the best opportunities into your pipeline.`, action: 'Applications' };

    return {
      jobs: jobs.length,
      sourceNames,
      applied,
      interviews,
      offers,
      lastRun: latestRun ? `${latestRun.status || 'saved'} · ${dateText(latestRun.updatedAt || latestRun.endedAt || latestRun.startedAt)}` : 'No run yet',
      lastScan: lastScan?.at ? dateText(lastScan.at) : 'Not yet',
      profileAt: dateText(profileAt),
      profileNote: capture?.diagnostics?.coreProfileReady
        ? `Core saved · ${(capture.diagnostics.loadedProfileSections || []).length} section(s) loaded${(capture.diagnostics.pendingProfileSections || []).length ? ` · ${(capture.diagnostics.pendingProfileSections || []).length} enriching` : ''}`
        : 'Latest saved Naukri/profile evidence',
      next
    };
  }

  function create() {
    const root = document.createElement('section');
    root.id = ID;
    root.innerHTML = `
      <div class="aoh-head"><div><div class="aoh-title">Workspace health</div><div class="aoh-sub">Corpus, pipeline, profile freshness and extraction state from the data Applyra already has. No extra score is calculated here.</div></div><span class="aoh-badge">OVERVIEW</span></div>
      <div class="aoh-grid">
        <div class="aoh-card"><div class="aoh-label">Job corpus</div><div class="aoh-value" data-jobs>—</div><div class="aoh-note" data-sources>—</div></div>
        <div class="aoh-card"><div class="aoh-label">Pipeline</div><div class="aoh-value" data-pipeline>—</div><div class="aoh-note" data-lastscan>—</div></div>
        <div class="aoh-card"><div class="aoh-label">Profile capture</div><div class="aoh-value" data-profile>—</div><div class="aoh-note" data-profile-note>—</div></div>
        <div class="aoh-card"><div class="aoh-label">Latest run</div><div class="aoh-value" data-lastrun>—</div><div class="aoh-note">Recoverable extraction state</div></div>
      </div>
      <div class="aoh-next"><div><strong data-next-title>Checking workspace…</strong><span data-next-note></span></div><div class="aoh-actions"><button data-open-extractor class="primary">Extractor</button><button data-auto-apply class="primary" style="background:#059669;border-color:#059669;margin-left:8px;">🚀 Auto-Apply Top Matches</button></div></div>`;
    root.querySelector('[data-open-extractor]').addEventListener('click', () => navigate('Extractor'));
    root.querySelector('[data-auto-apply]')?.addEventListener('click', async () => {
      const btn = root.querySelector('[data-auto-apply]');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = '🚀 Starting Auto Apply Loop…';

      try {
        let totalApplied = 0;
        const maxBatches = 5;

        for (let batch = 1; batch <= maxBatches; batch++) {
          btn.textContent = `🚀 Applying Batch ${batch}/${maxBatches} (5 jobs)…`;
          
          const resp = await chrome.runtime.sendMessage({
            type: 'RUN_NAUKRI_AUTO_APPLY',
            settings: { batchSize: 5, openVisibleTab: true }
          }).catch(e => ({ ok: false, error: e?.message }));

          if (!resp?.ok) {
            console.warn(`[Applyra] Batch ${batch} halted:`, resp?.error);
            break;
          }

          const newly = Number(resp?.newlyAppliedCount || resp?.appliedCount || 5);
          totalApplied += newly;
          btn.textContent = `✓ Batch ${batch} done (${totalApplied} jobs). Next in 3s…`;

          await new Promise(r => setTimeout(r, 3500));

          const tabId = resp?.tabId;
          if (tabId && globalThis.chrome?.tabs?.update) {
            await chrome.tabs.update(tabId, { url: 'https://www.naukri.com/mnjuser/recommendedjobs' }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
          }
        }

        btn.textContent = `🎉 Done! ${totalApplied} Jobs Applied.`;
      } catch (err) {
        btn.textContent = '⚠️ Auto Apply stopped';
      } finally {
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🚀 Auto-Apply Top Matches';
          }
        }, 5000);
      }
    });
    return root;
  }

  function render(root) {
    if (!root?.isConnected) return;
    try {
      const view = derive(stateCache);
      root.querySelector('[data-jobs]').textContent = `${view.jobs} jobs`;
      root.querySelector('[data-sources]').textContent = view.sourceNames.length ? `${view.sourceNames.length} source${view.sourceNames.length === 1 ? '' : 's'} · ${view.sourceNames.slice(0, 3).join(', ')}` : 'No source data yet';
      root.querySelector('[data-pipeline]').textContent = `${view.applied} applied · ${view.interviews} interview · ${view.offers} offer`;
      root.querySelector('[data-lastscan]').textContent = `Last extraction: ${view.lastScan}`;
      root.querySelector('[data-profile]').textContent = view.profileAt;
      root.querySelector('[data-profile-note]').textContent = view.profileNote;
      root.querySelector('[data-lastrun]').textContent = view.lastRun;
      root.querySelector('[data-next-title]').textContent = view.next.title;
      root.querySelector('[data-next-note]').textContent = view.next.note;
    } catch {
      root.querySelector('[data-next-title]').textContent = 'Overview data is temporarily unavailable';
      root.querySelector('[data-next-note]').textContent = 'The rest of the dashboard remains usable.';
    }
  }

  async function hydrateOnce(root) {
    if (initialLoadStarted) return;
    initialLoadStarted = true;
    try {
      stateCache = await storageGet(KEYS);
      render(root || document.getElementById(ID));
    } catch {}
  }

  function mount() {
    const metricStrip = document.querySelector('section.metric-strip');
    const existing = document.getElementById(ID);
    if (!metricStrip) {
      existing?.remove();
      return;
    }
    installStyles();
    if (existing?.isConnected) return;
    const root = create();
    metricStrip.insertAdjacentElement('afterend', root);
    if (initialLoadStarted) render(root); else hydrateOnce(root);
  }

  let renderTimer = 0;
  chrome?.storage?.onChanged?.addListener?.((changes, area) => {
    if (area !== 'local') return;
    let relevant = false;
    for (const key of KEYS) {
      if (!(key in changes)) continue;
      stateCache[key] = changes[key]?.newValue;
      relevant = true;
    }
    if (!relevant) return;
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => render(document.getElementById(ID)), 120);
  });

  document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 180), { once: true });
  window.addEventListener('popstate', () => setTimeout(mount, 80));
  window.addEventListener('hashchange', () => setTimeout(mount, 80));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(mount, 100); });
  document.addEventListener('click', () => setTimeout(mount, 80), { capture: true, passive: true });
  setTimeout(mount, 500);
  setTimeout(mount, 1200);
  setTimeout(mount, 2600);
})();
