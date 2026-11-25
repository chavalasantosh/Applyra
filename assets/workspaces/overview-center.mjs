/* Applyra 3.0 — Milestone M5 Career Command Center (#Overview) */
function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function readOverviewSnapshot() {
  if (typeof chrome === 'undefined' || !chrome?.storage?.local) {
    return Promise.resolve({ jobs: [], universalJobs: {}, careerEvidence: {}, scheduledScans: [], runs: [] });
  }
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['jobs', 'universalJobs', 'careerEvidence', 'scheduledScans', 'runs', 'teamWorkspace'], (res) => {
        resolve(res || {});
      });
    } catch {
      resolve({});
    }
  });
}

function goPage(file) {
  if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
    location.href = chrome.runtime.getURL(file);
  } else {
    location.href = file;
  }
}

export async function renderOverviewCommandCenter(isOverviewActive) {
  const existing = document.getElementById('apCommandCenter');
  if (!isOverviewActive()) {
    if (existing) existing.remove();
    return;
  }

  const anchor = document.getElementById('applyra-overview-health') || document.querySelector('.metric-strip');
  if (!anchor || !anchor.parentElement) return;

  const snap = await readOverviewSnapshot();
  if (!isOverviewActive()) return;

  const jobs = [...safeArr(snap.jobs), ...Object.values(snap.universalJobs || {})];
  const dedup = new Map();
  for (const j of jobs) {
    const id = j?.id || j?.url || j?.title;
    if (id && !dedup.has(id)) dedup.set(id, j);
  }
  const all = [...dedup.values()];
  const total = all.length;
  const strong = all.filter((j) => Number(j?.fitScore ?? j?.score ?? j?.matchScore ?? j?.profileFit ?? 0) >= 70).length;
  const applied = all.filter((j) => /^applied$/i.test(String(j?.status || j?.applicationStatus || ''))).length;
  const interview = all.filter((j) => /interview/i.test(String(j?.status || j?.applicationStatus || ''))).length;
  const offer = all.filter((j) => /offer/i.test(String(j?.status || j?.applicationStatus || ''))).length;

  const evidenceCount = Object.values(snap.careerEvidence || {}).filter((e) => e?.resume?.text).length;
  const activeScans = safeArr(snap.scheduledScans).filter((s) => s && s.enabled !== false).length;

  let host = document.getElementById('apCommandCenter');
  if (!host) {
    host = document.createElement('section');
    host.id = 'apCommandCenter';
    host.className = 'ap-command-center';
    host.setAttribute('aria-label', 'Career Command Center');
    anchor.insertAdjacentElement('afterend', host);
  }

  const maxBase = Math.max(total, 1);
  const stages = [
    { label: 'Captured jobs', count: total, cls: '' },
    { label: 'Strong fit (70+)', count: strong, cls: 'info' },
    { label: 'Applied', count: applied, cls: 'ok' },
    { label: 'Interviews', count: interview, cls: 'warn' },
    { label: 'Offers', count: offer, cls: 'ok' }
  ];

  host.replaceChildren();

  const funnelCard = document.createElement('article');
  funnelCard.className = 'ap-cc-card';
  const fHead = document.createElement('div');
  fHead.className = 'ap-cc-head';
  const fTitle = document.createElement('h3');
  fTitle.textContent = 'Pipeline Funnel (Live Storage)';
  const fMeta = document.createElement('span');
  fMeta.className = 'ap-cc-meta';
  fMeta.textContent = total ? `${total} unique listings` : 'No jobs captured yet';
  fHead.append(fTitle, fMeta);

  const list = document.createElement('div');
  list.className = 'ap-funnel-list';
  for (const st of stages) {
    const row = document.createElement('div');
    row.className = 'ap-funnel-row';
    const lbl = document.createElement('span');
    lbl.className = 'ap-funnel-label';
    lbl.textContent = st.label;
    const track = document.createElement('div');
    track.className = 'ap-funnel-track';
    const fill = document.createElement('div');
    fill.className = 'ap-funnel-fill' + (st.cls ? ' ' + st.cls : '');
    fill.style.width = total ? `${Math.max(st.count > 0 ? 4 : 0, Math.round((st.count / maxBase) * 100))}%` : '0%';
    track.appendChild(fill);
    const cnt = document.createElement('span');
    cnt.className = 'ap-funnel-count';
    cnt.textContent = String(st.count);
    row.append(lbl, track, cnt);
    list.appendChild(row);
  }
  funnelCard.append(fHead, list);

  const actionsCard = document.createElement('article');
  actionsCard.className = 'ap-cc-card';
  const aHead = document.createElement('div');
  aHead.className = 'ap-cc-head';
  const aTitle = document.createElement('h3');
  aTitle.textContent = 'Workspace Readiness & Actions';
  const aMeta = document.createElement('span');
  aMeta.className = 'ap-cc-meta';
  aMeta.textContent = `${evidenceCount} resume(s) · ${activeScans} active scan(s)`;
  aHead.append(aTitle, aMeta);

  const grid = document.createElement('div');
  grid.className = 'ap-actions-grid';
  const quickActions = [
    { title: 'Resume Studio', sub: evidenceCount ? 'Review skill gaps & JDs' : 'Upload PDF/DOCX resume', run: () => { location.hash = '#Resume'; } },
    { title: 'Scheduled Scans', sub: activeScans ? `${activeScans} active schedule(s)` : 'Configure automated discovery', run: () => { location.hash = '#Scheduled%20scans'; } },
    { title: 'Operations Center', sub: 'Review queue & Auto-Apply', run: () => goPage('apply-engine.html') },
    { title: 'Comp & Company Intel', sub: 'Salary & leveling evidence', run: () => goPage('company-intel.html') }
  ];
  for (const qa of quickActions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ap-quick-btn';
    const s = document.createElement('strong');
    s.textContent = qa.title;
    const d = document.createElement('span');
    d.textContent = qa.sub;
    btn.append(s, d);
    btn.addEventListener('click', qa.run);
    grid.appendChild(btn);
  }
  actionsCard.append(aHead, grid);

  host.append(funnelCard, actionsCard);
}
