/* Applyra 3.0 — Strict Evidence-Backed Answer Vault Suggestions (Zero Unsupported Inference) */

/**
 * Extracts strictly explicit, evidence-backed Answer Vault suggestions from
 * stored candidate data. Never infers work authorization, relocation consent,
 * per-skill experience from total career years, capability confirmations,
 * or arbitrary URLs as portfolios, and never falls back across candidates.
 */
export function deriveVaultSuggestions(store = {}) {
  const tw = store.teamWorkspace || {};
  const candidates = Array.isArray(tw.candidates) ? tw.candidates : [];
  const activeCand = tw.activeCandidateId
    ? candidates.find((c) => c && c.id === tw.activeCandidateId) || null
    : null;

  // Strict candidate isolation: never fall back to 'local-profile' when a team candidate is active.
  const candId = activeCand ? activeCand.id : 'local-profile';
  const profile = activeCand ? (activeCand.profile || {}) : (store.profile || {});
  const ev = (store.careerEvidence && store.careerEvidence[candId]) || {};
  const np = profile.naukriProfile || {};
  const idInfo = np.identity || {};
  const cp = np.careerProfile || {};

  const items = [];
  const add = (key, label, value, source) => {
    const clean = String(value ?? '').trim();
    if (!clean) return;
    items.push({ key, label, value: clean, source });
  };

  add('currentLocation', 'Current location', idInfo.currentLocation || profile.currentLocation, idInfo.currentLocation ? 'Naukri Identity' : 'Stored Profile');

  const prefLocs = [
    ...(Array.isArray(ev.preferredLocations) ? ev.preferredLocations : []),
    ...(Array.isArray(cp.preferredWorkLocations) ? cp.preferredWorkLocations : []),
    ...(Array.isArray(profile.locations) ? profile.locations : [])
  ].map((s) => String(s || '').trim()).filter(Boolean);
  const uniqLocs = [...new Set(prefLocs)];
  if (uniqLocs.length) {
    add('preferredLocation', 'Preferred location', uniqLocs[0], 'Preferred Work Locations');
  }

  const yrs = ev.confirmedYears ?? idInfo.experienceYears ?? profile.fullTimeYears ?? profile.yearsExperience;
  if (yrs !== '' && yrs !== null && yrs !== undefined && Number.isFinite(Number(yrs))) {
    add('yearsExperience', 'Years of experience', String(yrs), ev.confirmedYears !== undefined && ev.confirmedYears !== null ? 'Confirmed Career Evidence' : 'Naukri Identity / Profile');
  }

  const noticeDays = Number(idInfo.noticePeriodDays ?? profile.noticePeriodDays);
  const noticeText = idInfo.noticePeriod || (Number.isFinite(noticeDays) && (idInfo.noticePeriodDays !== undefined || profile.noticePeriodDays !== undefined)
    ? (noticeDays === 0 ? 'Immediate' : `${noticeDays} days`)
    : '');
  add('noticePeriod', 'Notice period', noticeText, 'Naukri Identity / Profile');

  const currentCtc = idInfo.currentSalaryText || (profile.currentSalary ? `${profile.currentSalary} LPA` : '');
  add('currentCtc', 'Current CTC', currentCtc, 'Naukri Identity / Profile');

  const expectedCtc = cp.preferredAnnualSalaryText || (profile.salaryMax ? `${profile.salaryMax} LPA` : profile.salaryMin ? `${profile.salaryMin} LPA` : '');
  add('expectedCtc', 'Expected CTC', expectedCtc, 'Career Profile Preferences');

  // Only include per-skill experience if explicitly recorded in itSkills with its own experienceYears
  const skillPairs = [];
  const seenSkill = new Set();
  for (const it of np.itSkills || []) {
    const name = String(it?.skillText || '').trim();
    const skillYrs = it?.experienceYears;
    if (name && skillYrs !== '' && skillYrs !== null && skillYrs !== undefined && Number.isFinite(Number(skillYrs)) && Number(skillYrs) > 0 && !seenSkill.has(name.toLowerCase())) {
      seenSkill.add(name.toLowerCase());
      skillPairs.push(`${name} = ${skillYrs}`);
    }
  }
  if (skillPairs.length) {
    add('experienceFacts', 'Experience facts', skillPairs.join('\n'), 'Naukri IT Skills (explicit per-skill years)');
  }

  const employers = [...new Set([
    ...(Array.isArray(profile.workHistory) ? profile.workHistory.map((w) => w?.company) : []),
    ...(Array.isArray(np.employment) ? np.employment.map((w) => w?.company) : [])
  ].map((c) => String(c || '').trim()).filter(Boolean))];
  if (employers.length) {
    add('formerEmployers', 'Former employers', employers.join(', '), 'Employment History');
  }

  // Only take explicitly labeled profile links from onlineProfiles / workSamples or direct LinkedIn/GitHub URLs
  const onlineProfiles = Array.isArray(np.accomplishments?.onlineProfiles) ? np.accomplishments.onlineProfiles : [];
  const resumeText = ev.resume?.text || '';
  const urlsInText = [...new Set((resumeText.match(/https?:\/\/[^\s<>"')]+/gi) || []).map((u) => u.replace(/[.,;]+$/, '')))];

  const linkedinUrl = onlineProfiles.find((p) => /linkedin\.com\/in\//i.test(p?.link || ''))?.link
    || urlsInText.find((u) => /linkedin\.com\/in\//i.test(u))
    || '';
  add('linkedinUrl', 'LinkedIn URL', linkedinUrl, 'Online Profiles / Resume Links');

  const githubUrl = onlineProfiles.find((p) => /github\.com\//i.test(p?.link || ''))?.link
    || urlsInText.find((u) => /github\.com\//i.test(u))
    || '';
  add('githubUrl', 'GitHub URL', githubUrl, 'Online Profiles / Resume Links');

  const explicitPortfolio = onlineProfiles.find((p) => /\bportfolio\b/i.test(String(p?.title || '')) && /^https?:\/\//i.test(String(p?.link || '')))?.link || '';
  add('portfolioUrl', 'Portfolio URL', explicitPortfolio, 'Naukri Online Profiles (explicitly labeled Portfolio)');

  return items;
}
