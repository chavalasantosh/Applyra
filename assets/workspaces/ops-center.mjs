/* Applyra 3.0 — Milestone M7 Application Operations Center Strip & Evidence-Backed Vault Auto-Fill */
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

function extractUrls(text) {
  const m = String(text || '').match(/https?:\/\/[^\s<>"')]+/gi) || [];
  return [...new Set(m.map((u) => u.replace(/[.,;]+$/, '')))];
}

function deriveVaultSuggestions(store) {
  const tw = store.teamWorkspace || {};
  const activeCand = (tw.candidates || []).find((c) => c.id === tw.activeCandidateId) || null;
  const profile = activeCand?.profile || store.profile || {};
  const candId = activeCand?.id || 'local-profile';
  const ev = store.careerEvidence?.[candId] || store.careerEvidence?.['local-profile'] || {};
  const np = profile.naukriProfile || {};
  const idInfo = np.identity || {};
  const cp = np.careerProfile || {};

  const resumeText = ev.resume?.text || '';
  const naukriText = ev.naukri?.text || '';
  const linkedinText = ev.linkedin?.text || '';
  const allText = [resumeText, naukriText, linkedinText].filter(Boolean).join('\n');

  const onlineLinks = [
    ...(np.accomplishments?.onlineProfiles || []).map((x) => x.link),
    ...(np.accomplishments?.workSamples || []).map((x) => x.link),
    ...extractUrls(allText)
  ].filter((u) => /^https?:\/\//i.test(String(u || '')));

  const linkedinUrl = onlineLinks.find((u) => /linkedin\.com\/in\//i.test(u)) || '';
  const githubUrl = onlineLinks.find((u) => /github\.com\//i.test(u)) || '';
  const portfolioUrl = onlineLinks.find((u) => !/linkedin\.com|github\.com|naukri\.com/i.test(u)) || '';

  const currentLoc = idInfo.currentLocation || profile.currentLocation || '';
  const prefLocList = [
    ...(Array.isArray(ev.preferredLocations) ? ev.preferredLocations : []),
    ...(Array.isArray(cp.preferredWorkLocations) ? cp.preferredWorkLocations : []),
    ...(Array.isArray(profile.locations) ? profile.locations : [])
  ].map((s) => String(s || '').trim()).filter(Boolean);
  const uniqLocs = [...new Set(prefLocList)];
  const prefLoc = uniqLocs[0] || currentLoc;

  const yrs = ev.confirmedYears ?? (idInfo.experienceYears || profile.fullTimeYears || profile.yearsExperience || '');
  const yrsStr = yrs !== '' && yrs !== null && yrs !== undefined ? String(yrs) : '';

  const noticeDays = Number(idInfo.noticePeriodDays ?? profile.noticePeriodDays);
  const noticePeriod = idInfo.noticePeriod || (Number.isFinite(noticeDays) ? (noticeDays === 0 ? 'Immediate' : `${noticeDays} days`) : '');

  const currentCtc = idInfo.currentSalaryText || (profile.currentSalary ? `${profile.currentSalary} LPA` : '');
  const expectedCtc = cp.preferredAnnualSalaryText || (profile.salaryMax ? `${profile.salaryMax} LPA` : profile.salaryMin ? `${profile.salaryMin} LPA` : '');

  const isIndia = /\bindia\b|bengaluru|bangalore|hyderabad|pune|chennai|mumbai|delhi|noida|gurugram|gurgaon/i.test(currentLoc + ' ' + uniqLocs.join(' '));
  const hasRemote = uniqLocs.some((l) => /remote/i.test(l));
  const remotePref = hasRemote && uniqLocs.length > 1 ? 'Flexible' : hasRemote ? 'Remote' : '';

  const employers = [...new Set([
    ...(Array.isArray(profile.workHistory) ? profile.workHistory.map((w) => w?.company) : []),
    ...(Array.isArray(np.employment) ? np.employment.map((w) => w?.company) : [])
  ].map((c) => String(c || '').trim()).filter(Boolean))];

  const skillPairs = [];
  const seenSkill = new Set();
  for (const it of np.itSkills || []) {
    const name = String(it?.skillText || '').trim();
    const y = it?.experienceYears || yrsStr || '';
    if (name && y && !seenSkill.has(name.toLowerCase())) {
      seenSkill.add(name.toLowerCase());
      skillPairs.push(`${name} = ${y}`);
    }
  }
  const fallbackSkills = [...(np.keySkills || []), ...(Array.isArray(profile.skills) ? profile.skills : [])];
  for (const sk of fallbackSkills) {
    const name = String(sk || '').trim();
    if (name && yrsStr && !seenSkill.has(name.toLowerCase())) {
      seenSkill.add(name.toLowerCase());
      skillPairs.push(`${name} = ${yrsStr}`);
    }
    if (skillPairs.length >= 12) break;
  }

  const capFacts = [];
  const top3 = [...seenSkill].slice(0, 3);
  if (top3.length) capFacts.push(`Hands-on experience with ${top3.join(', ')} = Yes`);
  if (employers.length) capFacts.push(`Worked at ${employers[0]} = Yes`);

  const todayIso = new Date().toISOString().slice(0, 10);
  const isImmediate = /immediate/i.test(noticePeriod) || noticeDays === 0;

  return {
    currentLocation: currentLoc,
    preferredLocation: prefLoc,
    yearsExperience: yrsStr,
    noticePeriod,
    currentCtc,
    expectedCtc,
    workAuthorization: isIndia ? 'Authorized in India' : '',
    remotePreference: remotePref,
    relocation: uniqLocs.length > 1 ? 'Yes' : '',
    relocationCities: uniqLocs.join(', '),
    availableFrom: isImmediate ? todayIso : '',
    lastWorkingDayAnswer: isImmediate ? 'NA - Immediate joiner' : (noticePeriod ? `NA - ${noticePeriod} notice period` : ''),
    experienceFacts: skillPairs.join('\n'),
    formerEmployers: employers.join(', '),
    capabilityFacts: capFacts.join('\n'),
    linkedinUrl,
    portfolioUrl,
    githubUrl
  };
}

async function autoFillVault({ notify = true } = {}) {
  const store = await readStorage(['profile', 'careerEvidence', 'teamWorkspace']);
  const suggestions = deriveVaultSuggestions(store);
  let filled = 0;
  document.querySelectorAll('[data-vault]').forEach((el) => {
    const key = el.dataset.vault;
    const val = suggestions[key];
    if (!String(el.value || '').trim() && val) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      filled += 1;
    }
  });
  if (notify) {
    showToastMessage(
      filled
        ? `Auto-filled ${filled} empty field(s) from your stored profile & resume. Review and click Save Answer Vault.`
        : 'All derivable fields from your stored profile & resume are already filled.'
    );
  }
}

function initOpsCenter() {
  syncOpsStrip();
  const btn = document.getElementById('autoFillVaultBtn');
  if (btn && !btn.dataset.apWired) {
    btn.dataset.apWired = '1';
    btn.addEventListener('click', () => autoFillVault({ notify: true }));
  }
  setTimeout(() => autoFillVault({ notify: false }), 450);
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
