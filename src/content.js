(() => {
  const EXTRACTOR_VERSION = "2.8.0";
  if (globalThis.__NOWCURRY_EXTRACTOR_VERSION__ === EXTRACTOR_VERSION) return;
  globalThis.__NOWCURRY_EXTRACTOR_VERSION__ = EXTRACTOR_VERSION;

  const core = globalThis.NowCurryExtractorCore;
  if (!core) {
    console.error("Applyra extractor core did not load.");
    return;
  }

  function toJsonSafeMessage(message) {
    const shared = globalThis.NowCurryMessage?.toJsonSafeMessage;
    if (shared) return shared(message);
    const encoded = JSON.stringify(message, (_key, value) => {
      if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") return undefined;
      if (typeof value === "bigint") throw new TypeError("BigInt values are not supported");
      return value;
    });
    if (encoded === undefined) throw new TypeError("The message must be a JSON value");
    return JSON.parse(encoded);
  }

  function respondSafely(sendResponse, payload, request = null) {
    try {
      const response=request&&globalThis.NowCurryMessage?.withResponseMeta?globalThis.NowCurryMessage.withResponseMeta(request,payload):payload;
      sendResponse(toJsonSafeMessage(response));
    } catch (error) {
      const fallback={ ok: false, error: "Could not serialize extractor response: " + (error?.message || "unknown error") };
      try{sendResponse(request&&globalThis.NowCurryMessage?.withResponseMeta?globalThis.NowCurryMessage.withResponseMeta(request,fallback):fallback);}catch{}
    }
  }

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  let suppressManualFollowupCaptureUntil = 0;
  let lastManualFollowupSignature = '';
  let lastManualFollowupCapturedAt = 0;

  function surfaceCounts() {
    const page = window.location.href;
    const pageMode = core.pageMode(page);
    const cardNodes = new Set();
    core.CARD_SELECTORS.forEach((selector) => document.querySelectorAll(selector).forEach((node) => cardNodes.add(node)));
    const historyNodes = new Set();
    core.HISTORY_CARD_SELECTORS.forEach((selector) => document.querySelectorAll(selector).forEach((node) => {
      const text = String(node.innerText || node.textContent || "");
      if (/\b(?:applied|application status|recruiter action|profile viewed|under review|not selected|shortlisted|interview)\b/i.test(text)) historyNodes.add(node);
    }));
    const profileNodes = new Set();
    if (pageMode === "profile" || /\/profile|\/mnjuser/i.test(page) || document.querySelector("#lazyResumeHead, #lazyKeySkills, .profilePage, [class*='profilePage']")) {
      core.PROFILE_SELECTORS && Object.values(core.PROFILE_SELECTORS).forEach((selectors) => selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => profileNodes.add(node));
      }));
      [".profilePage", "#lazyResumeHead", "#lazyKeySkills", "#lazyProfileSummary", "#lazyEmployment"].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => profileNodes.add(node));
      });
    }
    const bodyText = String(document.body?.innerText || document.body?.textContent || "");
    const accountPage = ["profile", "application-history", "account-history"].includes(pageMode);
    const accountHistory = accountPage && core.extractAccountHistory ? core.extractAccountHistory(document, page) : null;
    const accountSurfaces = accountHistory?.surfaces || (accountPage && core.accountSurfaceLinks ? core.accountSurfaceLinks(document, page) : []);
    return {
      pageMode,
      jobLinks: document.querySelectorAll("a[href*='/job-listings-'], a[href*='/job/'], a[href*='job-overview'], [data-job-id]").length,
      knownCards: cardNodes.size,
      historyCards: historyNodes.size,
      profileNodes: profileNodes.size,
      profileEvidence: /(?:key skills?|professional summary|total experience|current location|work experience)/i.test(bodyText),
      accountEvents: accountHistory?.events?.length || 0,
      accountSurfaces: accountSurfaces.length,
      readyState: document.readyState
    };
  }

  async function waitForJobSurface(timeoutMs = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const counts = surfaceCounts();
      if (counts.jobLinks > 0 || counts.knownCards > 0 || counts.historyCards > 0) return counts;
      try {
        window.scrollBy(0, 15);
        await wait(150);
        window.scrollBy(0, -15);
      } catch {}
      await wait(300);
    }
    return surfaceCounts();
  }

  function profileDirectDiagnostics(profile) {
    const map = profile?.naukriProfile || {};
    const sections = map.sections || {};
    const entries = Object.entries(sections);
    const present = entries.filter(([, value]) => value?.present).map(([key]) => key);
    const loaded = entries.filter(([, value]) => value?.present && value?.loaded).map(([key]) => key);
    const pending = entries.filter(([, value]) => value?.present && !value?.loaded).map(([key]) => key);
    return { map, sections, present, loaded, pending };
  }

  function profileCaptureScore(profile) {
    const evidence = profile?.diagnostics?.profileEvidence || {};
    const direct = profileDirectDiagnostics(profile);
    let score = 0;
    if (profile?.headline) score += 3;
    if (profile?.currentLocation) score += 2;
    if (Array.isArray(profile?.skills) && profile.skills.length) score += 2;
    if (Array.isArray(profile?.roles) && profile.roles.length) score += 1;
    if (profile?.fullTimeYears || profile?.internshipYears || evidence.totalExperience) score += 2;
    if (Array.isArray(profile?.workHistory) && profile.workHistory.length) score += 2;
    if (profile?.summary) score += 1;
    if (profile?.noticePeriodDays || profile?.currentSalary || profile?.salaryMin || profile?.salaryMax) score += 1;
    // Exact Naukri section hydration matters more than broad page-text evidence.
    score += Math.min(6, direct.loaded.length * 0.5);
    if (direct.map?.resume?.fileName) score += 0.5;
    if (Array.isArray(direct.map?.education) && direct.map.education.length) score += 0.5;
    if (Array.isArray(direct.map?.projects) && direct.map.projects.length) score += 0.5;
    return score;
  }

  function profileCaptureEvidenceCount(profile) {
    const evidence = profile?.diagnostics?.profileEvidence || {};
    const direct = profileDirectDiagnostics(profile);
    return [
      Boolean(profile?.headline),
      Boolean(profile?.currentLocation),
      Boolean(Array.isArray(profile?.skills) && profile.skills.length),
      Boolean(Array.isArray(profile?.roles) && profile.roles.length),
      Boolean(profile?.fullTimeYears || profile?.internshipYears || evidence.totalExperience),
      Boolean(Array.isArray(profile?.workHistory) && profile.workHistory.length),
      Boolean(direct.map?.profileSummary),
      Boolean(Array.isArray(direct.map?.education) && direct.map.education.length),
      Boolean(Array.isArray(direct.map?.projects) && direct.map.projects.length)
    ].filter(Boolean).length;
  }

  function profileCoreReadiness(profile) {
    const evidence = profile?.diagnostics?.profileEvidence || {};
    const direct = profileDirectDiagnostics(profile);
    const signals = {
      identity: Boolean(profile?.headline || (Array.isArray(profile?.roles) && profile.roles.length) || profile?.naukriProfile?.identity?.name || profile?.naukriProfile?.identity?.currentTitle),
      location: Boolean(profile?.currentLocation || profile?.naukriProfile?.identity?.currentLocation),
      skills: Boolean(Array.isArray(profile?.skills) && profile.skills.length),
      experience: Boolean((Array.isArray(profile?.workHistory) && profile.workHistory.length) || profile?.fullTimeYears || profile?.internshipYears || evidence.totalExperience || profile?.naukriProfile?.identity?.experienceYears),
      summary: Boolean(profile?.summary || direct.map?.profileSummary || profile?.naukriProfile?.profileSummary)
    };
    const count = Object.values(signals).filter(Boolean).length;
    return { ready: count >= 1 || signals.identity || signals.skills || signals.experience || direct.loaded.length > 0, count, signals };
  }

  function profileCaptureFingerprint(profile) {
    const direct = profileDirectDiagnostics(profile);
    return JSON.stringify({
      headline: profile?.headline || "",
      location: profile?.currentLocation || "",
      skills: Array.isArray(profile?.skills) ? profile.skills.slice(0, 8) : [],
      roles: Array.isArray(profile?.roles) ? profile.roles.slice(0, 4) : [],
      years: [profile?.fullTimeYears || 0, profile?.internshipYears || 0],
      work: Array.isArray(profile?.workHistory) ? profile.workHistory.length : 0,
      summary: profile?.summary || "",
      directLoaded: direct.loaded,
      directPending: direct.pending,
      education: direct.map?.education?.length || 0,
      projects: direct.map?.projects?.length || 0,
      itSkills: direct.map?.itSkills?.length || 0,
      accomplishments: Object.values(direct.map?.accomplishments || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0)
    });
  }

  async function waitForProfileSurface(timeoutMs = 15000) {
    const startedAt = Date.now();
    let best = profileSnapshot();
    let bestScore = profileCaptureScore(best.profile);
    let stableFingerprint = profileCaptureFingerprint(best.profile);
    let stableRounds = 0;

    while (Date.now() - startedAt < timeoutMs) {
      await wait(350);
      const candidate = profileSnapshot();
      const score = profileCaptureScore(candidate.profile);
      if (score > bestScore || (score === bestScore && profileCaptureEvidenceCount(candidate.profile) > profileCaptureEvidenceCount(best.profile))) {
        best = candidate;
        bestScore = score;
      }

      const fingerprint = profileCaptureFingerprint(candidate.profile);
      if (fingerprint === stableFingerprint) stableRounds += 1;
      else { stableFingerprint = fingerprint; stableRounds = 0; }

      const coreReady = profileCoreReadiness(candidate.profile);
      if (coreReady.ready && stableRounds >= 1) return candidate;
    }
    return best;
  }

  async function waitForAccountSurface(timeoutMs = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const counts = surfaceCounts();
      if (counts.accountEvents > 0 || counts.accountSurfaces > 0 || counts.pageMode === "application-history" || counts.pageMode === "account-history") return counts;
      await wait(350);
    }
    return surfaceCounts();
  }

  async function hydrateLazyResults() {
    const originalY = window.scrollY;
    let stableRounds = 0;
    let lastHeight = 0;

    for (let step = 0; step < 24 && stableRounds < 3; step += 1) {
      const height = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
      window.scrollTo({ top: height, behavior: "instant" });
      await wait(220);
      const nextHeight = Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);
      stableRounds = nextHeight === lastHeight ? stableRounds + 1 : 0;
      lastHeight = nextHeight;
    }

    window.scrollTo({ top: originalY, behavior: "instant" });
    await wait(120);
  }

  async function hydrateProfileSurface({ includeOptional = false } = {}) {
    const originalY = window.scrollY;
    const sectionMap = core.NAUKRI_PROFILE_SECTION_MAP || {};
    const coreKeys = ['top','resumeHeadline','keySkills','employment','profileSummary','careerProfile'];
    const keys = includeOptional ? Object.keys(sectionMap) : coreKeys;
    const selectors = [...new Set(keys.map((key) => sectionMap[key]?.root).filter(Boolean))];
    const docHeight = () => Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0);

    // First touch only the page bands needed to make Naukri mount its core lazy
    // profile widgets. Stop as soon as a truthful core snapshot is available.
    for (const ratio of [0, 0.34, 0.68, 1]) {
      if (profileCoreReadiness(profileSnapshot().profile).ready) break;
      window.scrollTo({ top: Math.floor(docHeight() * ratio), behavior: 'instant' });
      await wait(240);
    }

    // Then target known section containers once. Optional sections enrich a saved
    // core profile but never block the initial automatic capture.
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      node.scrollIntoView({ block: 'center', behavior: 'instant' });
      await wait(220);
      for (const more of Array.from(node.querySelectorAll?.('a.morelink') || [])) {
        const label = String(more.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^read more$/i.test(label)) {
          // Naukri can expose Read more anchors with javascript: href values.
          // Calling element.click() asks Chromium to execute that URL, which is
          // blocked by extension CSP. Prevent only the default navigation while
          // still dispatching the normal click event to Naukri's own handlers.
          const blockJavascriptNavigation = (event) => event.preventDefault();
          more.addEventListener('click', blockJavascriptNavigation, { capture: true, once: true });
          more.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window
          }));
          await wait(70);
        }
      }
    }

    window.scrollTo({ top: originalY, behavior: 'instant' });
    await wait(140);
  }

  function snapshot() {
    const page = window.location.href;
    const extracted = core.extractPage(document, page);
    const jobs = extracted.jobs;
    const next = core.nextPage(document, page);
    return {
      ok: true,
      extractorVersion: EXTRACTOR_VERSION,
      jobs,
      pageMode: extracted.mode,
      page,
      title: document.title,
      fingerprint: core.pageFingerprint(jobs, page),
      next,
      diagnostics: surfaceCounts()
    };
  }

  function profileSnapshot() {
    const page = window.location.href;
    const capturedAt = new Date().toISOString();
    const profile = core.extractProfile(document, page, capturedAt);
    return {
      ok: true,
      extractorVersion: EXTRACTOR_VERSION,
      profile,
      pageMode: core.pageMode(page),
      page,
      title: document.title,
      diagnostics: { ...surfaceCounts(), ...(profile.diagnostics || {}) }
    };
  }

  function accountHistorySnapshot() {
    const page = window.location.href;
    const extracted = core.extractAccountHistory(document, page);
    return {
      ok: true,
      extractorVersion: EXTRACTOR_VERSION,
      pageMode: extracted.pageMode,
      page,
      title: document.title,
      events: extracted.events || [],
      jobs: extracted.jobs || [],
      surfaces: extracted.surfaces || [],
      diagnostics: { ...surfaceCounts(), ...(extracted.diagnostics || {}) }
    };
  }


  function visibleNode(node) {
    if (!node || !(node instanceof Element)) return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function normalText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function securityChallengePresent() {
    const text = normalText(document.body?.innerText || document.body?.textContent || "");
    return /\b(?:captcha|one[- ]time password|otp|security code|verification code|verify your identity|password|passcode|pin|cvv)\b/i.test(text);
  }

  function followupContainers() {
    const selectors = [
      '[role="dialog"]',
      '[aria-modal="true"]',
      '[class*="chatbot"]',
      '[class*="chat-bot"]',
      '[class*="chatBot"]',
      '[class*="apply"] [class*="question"]',
      '[class*="questionnaire"]',
      '[data-testid*="question"]'
    ];
    const nodes = [];
    const seen = new Set();
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => {
        if (!seen.has(node) && visibleNode(node)) {
          seen.add(node);
          nodes.push(node);
        }
      });
    }
    return nodes;
  }

  function formControls(container) {
    const root = container || document;
    return [...root.querySelectorAll('textarea, input:not([type="hidden"]), select, button, [role="button"], [role="radio"], [role="option"], [contenteditable="true"], [tabindex="0"]')]
      .filter(visibleNode);
  }

  function inferQuestion(container) {
    const root = container || document;
    const botQuestions = [...root.querySelectorAll('.botItem .botMsg span, .botMsg span, [class*="botMsg"] span')]
      .filter(visibleNode)
      .map((node) => normalText(node.textContent))
      .filter((text) => text.length >= 4 && text.length <= 700)
      .filter((text) => !/^(yes|no|next|continue|save|submit|apply|cancel|close|skip)$/i.test(text));
    if (botQuestions.length) return botQuestions[botQuestions.length - 1];
    const candidates = [...root.querySelectorAll('[data-testid*="question"], [class*="question"], legend, label, h1, h2, h3, h4, p, span')]
      .filter(visibleNode)
      .map((node) => normalText(node.textContent))
      .filter((text) => text.length >= 4 && text.length <= 700)
      .filter((text) => !/^(yes|no|next|continue|save|submit|apply|cancel|close|skip)$/i.test(text));
    if (candidates.length) {
      const scored = candidates.map((text) => ({
        text,
        score: (/\?$/.test(text) ? 4 : 0) + (/\b(?:are you|do you|what|where|when|how|which|please|enter|select|current|expected|notice|experience|location|salary|ctc|relocat|authori[sz]|remote|employee|wfo|working day|pf)\b/i.test(text) ? 3 : 0) + Math.min(2, text.split(' ').length / 12)
      })).sort((a,b)=>b.score-a.score || b.text.length-a.text.length);
      if (scored[0]?.score >= 2) return scored[0].text;
    }
    const text = normalText(root.innerText || root.textContent || "");
    return text.slice(0, 700);
  }

  function optionText(node) {
    if (!node) return "";
    if (node.tagName === "INPUT") {
      const id = node.id;
      const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : node.closest('label');
      return normalText(label?.textContent || node.value || node.getAttribute('aria-label'));
    }
    return normalText(node.getAttribute?.('aria-label') || node.textContent || node.getAttribute?.('value'));
  }

  function isSubmitControl(node) {
    const text = normalText(node?.textContent || node?.getAttribute?.('aria-label'));
    return /^(next|continue|save|submit|send|apply|done|proceed)$/i.test(text);
  }

  function manualAnswerFromContainer(container) {
    const root = container || document;
    const checked = [...root.querySelectorAll('input[type="radio"]:checked,input[type="checkbox"]:checked,[role="radio"][aria-checked="true"],[role="option"][aria-selected="true"],[aria-pressed="true"]')].filter(visibleNode);
    if (checked.length) return optionText(checked[checked.length - 1]);
    const select = [...root.querySelectorAll('select')].filter(visibleNode).find((node) => node.value);
    if (select) return normalText(select.selectedOptions?.[0]?.textContent || select.value);
    const fields = [...root.querySelectorAll('textarea,input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]),[contenteditable="true"]')].filter(visibleNode);
    for (let i = fields.length - 1; i >= 0; i -= 1) {
      const node = fields[i];
      const value = normalText(node.matches?.('[contenteditable="true"]') ? node.textContent : node.value);
      if (value) return value;
    }
    return '';
  }

  function bestManualFollowupRoot(target = null) {
    const containers = followupContainers();
    const containing = target ? containers.filter((container) => container.contains?.(target)) : [];
    const pool = containing.length ? containing : containers;
    const ranked = pool.map((container) => ({
      container,
      question: inferQuestion(container),
      answer: manualAnswerFromContainer(container),
      chatbot: Boolean(container.matches?.('.chatbot_Drawer, ._chatBotContainer, [class*="chatbot_Drawer"]') || container.querySelector?.('[contenteditable="true"]'))
    }))
      .filter((item) => item.question && item.answer)
      .sort((a,b) => (Number(b.chatbot)-Number(a.chatbot)) || b.question.length-a.question.length);
    return ranked[0]?.container || null;
  }

  function emitManualFollowupAnswer(root) {
    if (!root || Date.now() < suppressManualFollowupCaptureUntil || securityChallengePresent()) return false;
    const question = inferQuestion(root);
    const answer = manualAnswerFromContainer(root);
    if (!question || !answer || /\b(?:otp|one[- ]time password|captcha|security code|verification code|password|passcode|pin|cvv)\b/i.test(question)) return false;
    const signature = `${question.toLowerCase()}\n${answer.toLowerCase()}`;
    const now = Date.now();
    if (signature === lastManualFollowupSignature && now - lastManualFollowupCapturedAt < 5000) return false;
    lastManualFollowupSignature = signature;
    lastManualFollowupCapturedAt = now;
    try {
      chrome.runtime.sendMessage({ type: 'NAUKRI_MANUAL_FOLLOWUP_ANSWER', question, answer, page: location.href }).catch?.(()=>{});
      return true;
    } catch { return false; }
  }

  function captureManualFollowupBeforeSubmit(event) {
    if (Date.now() < suppressManualFollowupCaptureUntil || securityChallengePresent()) return;
    const submit = event?.target?.closest?.('button,[role="button"],[tabindex="0"],.sendMsg');
    if (!submit || !isSubmitControl(submit)) return;
    emitManualFollowupAnswer(bestManualFollowupRoot(submit));
  }

  function captureManualFollowupOnFormSubmit(event) {
    emitManualFollowupAnswer(bestManualFollowupRoot(event?.target || null));
  }

  function captureManualFollowupOnEnter(event) {
    if (event?.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const field = event?.target?.closest?.('input:not([type="hidden"]),[contenteditable="true"]');
    if (!field) return;
    emitManualFollowupAnswer(bestManualFollowupRoot(field));
  }

  function captureManualFollowupOnChoice(event) {
    const choice = event?.target?.closest?.('select,input[type="radio"],input[type="checkbox"]');
    if (!choice) return;
    emitManualFollowupAnswer(bestManualFollowupRoot(choice));
  }

  function captureManualFollowupRoleChoice(event) {
    const choice = event?.target?.closest?.('[role="radio"],[role="option"]');
    if (!choice) return;
    setTimeout(() => emitManualFollowupAnswer(bestManualFollowupRoot(choice)), 0);
  }

  function inspectNaukriFollowup() {
    const page = location.href;
    const security = securityChallengePresent();
    const containers = followupContainers();
    const ranked = containers.map((container) => ({
      container,
      controls: formControls(container),
      question: inferQuestion(container),
      chatbot: Boolean(container.matches?.('.chatbot_Drawer, ._chatBotContainer, [class*="chatbot_Drawer"]') || container.querySelector?.('[contenteditable="true"]'))
    }))
      .filter((x) => x.controls.length || x.question)
      .sort((a,b) => (Number(b.chatbot)-Number(a.chatbot)) || b.controls.length - a.controls.length || b.question.length-a.question.length);
    const selected = ranked[0] || { container: null, controls: [], question: '' };
    if (!selected.container) {
      return { ok: true, page, security, found: false, question: "", options: [], inputCount: 0, containerFound: false, diagnostics: { containers: containers.length, controls: 0 } };
    }
    const root = selected.container;
    const inputs = selected.controls.filter((node) => node.matches('textarea, input:not([type="hidden"]), select, [contenteditable="true"]'));
    const optionNodes = selected.controls.filter((node) => node.matches('button,[role="button"],[role="radio"],[role="option"],input[type="radio"],input[type="checkbox"],[tabindex="0"]'))
      .filter((node) => !isSubmitControl(node));
    const options = [...new Set(optionNodes.map(optionText).filter((text) => text && text.length <= 200 && !/^(next|continue|save|submit|send|apply|cancel|close|skip)$/i.test(text)))].slice(0, 30);
    const question = selected.question || inferQuestion(root);
    return {
      ok: true,
      page,
      security,
      found: Boolean(question && (inputs.length || options.length || selected.container)),
      question,
      options,
      inputCount: inputs.length,
      containerFound: Boolean(selected.container),
      controlKind: inputs.some((node)=>node.matches('[contenteditable="true"]')) ? 'contenteditable' : inputs[0]?.tagName?.toLowerCase() || (options.length ? 'options' : 'unknown'),
      diagnostics: { containers: containers.length, controls: selected.controls.length, chatbot: Boolean(selected.chatbot) }
    };
  }

  function inspectNaukriApplyStatus() {
    const page = location.href;
    const header = [...document.querySelectorAll('.apply-status-header')].find(visibleNode) || null;
    const headerText = normalText(header?.innerText || header?.textContent || '');
    const headerSuccess = Boolean(header?.querySelector('.naukicon-check_circle'));
    const headerError = Boolean(header?.querySelector('.naukicon-ot-error_small'));
    const headerWarning = Boolean(header?.querySelector('.naukicon-ot-warning'));

    const activeSnackbars = [...document.querySelectorAll('.ss-snackbar.ss-snackbar-active')].filter(visibleNode);
    const snackbar = activeSnackbars[activeSnackbars.length - 1] || null;
    const snackbarText = normalText(snackbar?.innerText || snackbar?.textContent || '');
    const snackbarSuccess = Boolean(snackbar?.classList?.contains('ss-snackbar-success'));
    const snackbarError = Boolean(snackbar?.classList?.contains('ss-snackbar-error'));
    const snackbarWarning = Boolean(snackbar?.classList?.contains('ss-snackbar-warning'));

    const genericStatuses = [...document.querySelectorAll('[role="alert"],[role="status"],[class*="snackbar"],[class*="toast"],[class*="apply-status"],[class*="application-status"]')].filter(visibleNode);
    const genericText = normalText(genericStatuses.map((node) => node.innerText || node.textContent || '').join(' ')).slice(0, 1200);
    const bodyText = normalText(document.body?.innerText || document.body?.textContent || '').slice(0, 3000);
    const bodySuccess = /(?:you have successfully applied|application (?:has been )?(?:submitted|sent) successfully|applied successfully to|application submitted successfully)/i.test(bodyText);

    const appliedControl = [...document.querySelectorAll('button#already-applied, [class*="already-applied"], [class*="alreadyApplied"], button, [role="button"]')].find((node) => {
      if (!visibleNode(node)) return false;
      const t = normalText(node.innerText || node.textContent || '');
      return /^(?:already applied|applied)$/i.test(t) || node.id === 'already-applied' || /(?:already-applied|alreadyApplied)/i.test(node.className || '');
    });
    const alreadyAppliedOnPage = Boolean(appliedControl);

    const genericSuccess = /(?:successfully\s+applied|application\s+(?:was\s+)?(?:submitted|sent)|applied\s+successfully|application\s+successful)/i.test(genericText) || bodySuccess || alreadyAppliedOnPage;
    const genericError = /(?:application\s+(?:failed|could not be submitted)|unable\s+to\s+apply|something went wrong.*apply|apply\s+failed)/i.test(genericText);

    const isSaveApplyPage = /\/myapply\/saveApply/i.test(location.href);
    let signal = 'none';
    if (headerError || snackbarError || genericError) signal = 'error';
    else if (headerWarning || snackbarWarning) signal = 'warning';
    else if (headerSuccess || snackbarSuccess || genericSuccess || isSaveApplyPage) signal = 'success';

    const successText = headerText || snackbarText || genericText || (alreadyAppliedOnPage ? 'Already applied' : '');
    const countMatch = successText.match(/successful\s+for\s+(\d+)\s+out\s+of\s+(\d+)\s+jobs?/i) || successText.match(/(\d+)\s+out\s+of\s+(\d+)\s+(?:jobs?\s+)?(?:were\s+)?successful/i);
    const successCount = countMatch ? Number(countMatch[1]) : (signal === 'success' ? 1 : 0);
    const totalCount = countMatch ? Number(countMatch[2]) : (signal === 'success' ? 1 : 0);

    const domAllApplied = Boolean(
      signal === 'success' && (
        (countMatch && successCount > 0 && totalCount > 0 && successCount === totalCount) ||
        (!countMatch && successCount >= 1)
      )
    );

    return {
      ok: true,
      page,
      signal,
      successCount,
      totalCount,
      domAllApplied,
      header: {
        found: Boolean(header),
        success: headerSuccess,
        error: headerError,
        warning: headerWarning,
        text: headerText.slice(0, 500)
      },
      snackbar: {
        found: Boolean(snackbar),
        success: snackbarSuccess,
        error: snackbarError,
        warning: snackbarWarning,
        text: snackbarText.slice(0, 500)
      },
      generic: {
        found: genericStatuses.length > 0 || bodySuccess || alreadyAppliedOnPage,
        success: genericSuccess,
        error: genericError,
        text: genericText.slice(0, 500)
      }
    };
  }

  function setNativeValue(node, value) {
    if (node?.matches?.('[contenteditable="true"]')) {
      node.focus();
      node.textContent = String(value ?? '');
      try { node.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: String(value ?? '') })); } catch {}
      try { node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(value ?? '') })); } catch { node.dispatchEvent(new Event('input', { bubbles: true })); }
      node.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const proto = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc?.set) desc.set.call(node, value); else node.value = value;
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function answerNaukriFollowup(answer, options = {}) {
    if (securityChallengePresent()) return { ok: false, security: true, error: 'Security challenge detected; Applyra will not answer it.' };
    suppressManualFollowupCaptureUntil = Date.now() + 1800;
    const value = normalText(answer);
    if (!value) return { ok: false, error: 'No approved Candidate Memory value was provided.' };
    const containers = followupContainers();
    const ranked = containers.map((container) => ({
      container,
      controls: formControls(container),
      question: inferQuestion(container),
      chatbot: Boolean(container.matches?.('.chatbot_Drawer, ._chatBotContainer, [class*="chatbot_Drawer"]') || container.querySelector?.('[contenteditable="true"]'))
    }))
      .filter((x) => x.controls.length || x.question)
      .sort((a,b) => (Number(b.chatbot)-Number(a.chatbot)) || b.controls.length - a.controls.length);
    const root = ranked[0]?.container || null;
    const controls = ranked[0]?.controls || [];
    if (!root) return { ok: false, error: 'No Naukri follow-up dialog/chat container is visible.' };
    const optionSelector='button,[role="button"],[role="radio"],[role="option"],input[type="radio"],input[type="checkbox"],[tabindex="0"]';
    const targetOption = controls.find((node) => {
      if (!node.matches(optionSelector) || isSubmitControl(node)) return false;
      return normalText(optionText(node)).toLowerCase() === value.toLowerCase();
    }) || controls.find((node) => {
      if (!node.matches(optionSelector) || isSubmitControl(node)) return false;
      const t = normalText(optionText(node)).toLowerCase();
      const v = value.toLowerCase();
      return t && v && (t.includes(v) || v.includes(t));
    });
    let action = '';
    if (targetOption) {
      const clickable = targetOption.matches('input') ? (targetOption.closest('label') || targetOption) : targetOption;
      clickable.scrollIntoView?.({block:'center'});
      clickable.click();
      action = 'option-clicked';
    } else {
      const field = controls.find((node) => node.matches('textarea,input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]),select,[contenteditable="true"]'));
      if (!field) return { ok: false, error: 'No compatible answer control was found for this Naukri follow-up.' };
      if (field instanceof HTMLSelectElement) {
        const option = [...field.options].find((opt) => normalText(opt.textContent || opt.value).toLowerCase() === value.toLowerCase())
          || [...field.options].find((opt) => normalText(opt.textContent || opt.value).toLowerCase().includes(value.toLowerCase()));
        if (!option) return { ok: false, error: 'The approved Candidate Memory value is not available in the Naukri select options.' };
        setNativeValue(field, option.value);
      } else {
        setNativeValue(field, value);
      }
      action = field.matches?.('[contenteditable="true"]') ? 'contenteditable-filled' : 'field-filled';
    }
    await wait(220);
    let submitted = false;
    if (options.submit !== false) {
      const submitRoots=[root, root.closest?.('.chatbot_Drawer'), document.querySelector?.('.chatbot_Drawer'), document];
      let submit=null;
      for(const sr of submitRoots.filter(Boolean)){
        submit=[...sr.querySelectorAll('button,[role="button"],[tabindex="0"],.sendMsg')].filter(visibleNode).find(isSubmitControl);
        if(submit)break;
      }
      const disabled=submit?.disabled || submit?.getAttribute?.('aria-disabled') === 'true' || submit?.closest?.('.send')?.classList?.contains('disabled');
      if (submit && !disabled) {
        submit.click();
        submitted = true;
      } else if (submit && disabled) {
        await wait(300);
        const stillDisabled=submit.disabled || submit.getAttribute?.('aria-disabled') === 'true' || submit.closest?.('.send')?.classList?.contains('disabled');
        if(!stillDisabled){submit.click();submitted=true;}
      }
    }
    return { ok: true, action, submitted, answer: value, page: location.href };
  }

  let automaticProfileCaptureRunning = false;
  let automaticProfileCaptureDone = false;
  let automaticProfileCaptureAttempts = 0;
  let automaticProfileCaptureTimer = 0;
  let automaticProfileCaptureUrl = window.location.href;

  function scheduleAutomaticProfileCapture(delay = 700) {
    if (core.pageMode(window.location.href) !== 'profile' || automaticProfileCaptureDone || automaticProfileCaptureRunning) return;
    window.clearTimeout(automaticProfileCaptureTimer);
    automaticProfileCaptureTimer = window.setTimeout(() => automaticProfileCapture(), Math.max(150, delay));
  }

  async function automaticProfileCapture() {
    if (automaticProfileCaptureDone || automaticProfileCaptureRunning || core.pageMode(window.location.href) !== 'profile') return;
    automaticProfileCaptureRunning = true;
    automaticProfileCaptureAttempts += 1;
    let shouldRetry = false;
    try {
      // Naukri can mount profile sections several seconds after document_idle, and
      // SPA navigation can reach /profile without reloading this content script.
      // Keep capture independent from user scrolling by hydrating the page ourselves.
      await hydrateProfileSurface({ includeOptional: false });
      const result = await waitForProfileSurface(automaticProfileCaptureAttempts === 1 ? 6500 : 4500);
      const direct = profileDirectDiagnostics(result.profile);
      const evidenceCount = profileCaptureEvidenceCount(result.profile);
      const coreReady = profileCoreReadiness(result.profile);
      if (coreReady.ready) {
        const response = await chrome.runtime.sendMessage({type:'NAUKRI_AUTO_PROFILE_CAPTURE',profile:result.profile,diagnostics:{...(result.diagnostics||{}),captureScore:profileCaptureScore(result.profile),captureEvidenceCount:evidenceCount,coreProfileReady:true,coreSignals:coreReady.signals,pendingProfileSections:direct.pending,loadedProfileSections:direct.loaded,automaticAttempt:automaticProfileCaptureAttempts}}).catch(()=>null);
        automaticProfileCaptureDone = Boolean(response?.ok);
        shouldRetry = !automaticProfileCaptureDone;
        // One bounded enrichment pass may add optional lazy sections after the core
        // profile is safely stored. It is never a prerequisite for success.
        if (automaticProfileCaptureDone && direct.pending.length) {
          window.setTimeout(async () => {
            try {
              await hydrateProfileSurface({ includeOptional: true });
              const enriched = await waitForProfileSurface(2600);
              if (profileCaptureScore(enriched.profile) > profileCaptureScore(result.profile)) {
                const enrichedDirect = profileDirectDiagnostics(enriched.profile);
                await chrome.runtime.sendMessage({type:'NAUKRI_AUTO_PROFILE_CAPTURE',profile:enriched.profile,diagnostics:{...(enriched.diagnostics||{}),captureScore:profileCaptureScore(enriched.profile),captureEvidenceCount:profileCaptureEvidenceCount(enriched.profile),coreProfileReady:true,enrichment:true,pendingProfileSections:enrichedDirect.pending,loadedProfileSections:enrichedDirect.loaded}}).catch(()=>null);
              }
            } catch {}
          }, 700);
        }
      } else { shouldRetry = true; }
    } catch {
      shouldRetry = true;
    } finally {
      automaticProfileCaptureRunning = false;
    }
    if (shouldRetry && !automaticProfileCaptureDone && automaticProfileCaptureAttempts < 3) {
      scheduleAutomaticProfileCapture(1400 + automaticProfileCaptureAttempts * 500);
    }
  }

  function detectVerificationState() {
    const text = (document.body ? document.body.innerText : '').toLowerCase();
    const hasChallenge = Boolean(
      document.querySelector('iframe[src*="captcha"], iframe[src*="challenge"], .g-recaptcha, .h-captcha, #cf-turnstile, [data-sitekey]') ||
      text.includes('verify you are human') ||
      text.includes('press & hold') ||
      text.includes('security check') ||
      text.includes('complete the security check') ||
      text.includes('enter the characters you see')
    );
    const isLogin = Boolean(
      window.location.pathname.includes('/login') ||
      window.location.pathname.includes('/signin') ||
      document.querySelector('form[action*="login"], input[type="password"]')
    );
    return { hasChallenge, isLogin };
  }

  async function handle(message) {
    const isTop = window === window.top;
    const verification = detectVerificationState();

    if (!isTop && message?.type === "PING") {
      return { ok: true, isFrame: true, frameUrl: window.location.href, extractorVersion: EXTRACTOR_VERSION, hasChallenge: verification.hasChallenge };
    }

    if (verification.hasChallenge && (message?.type === "EXTRACT_PAGE" || message?.type === "EXTRACT_PROFILE")) {
      return {
        ok: false,
        requiresVerification: true,
        error: "Verification required on this tab. Please complete the security check to continue.",
        page: window.location.href
      };
    }

    if (message?.type === "PING") {
      let pageMode = core.pageMode(window.location.href);
      const diagnostics = surfaceCounts();
      if (verification.hasChallenge) {
        pageMode = "verification-required";
      } else if (diagnostics.historyCards > 0 || /\/myapply\/(?:history|savedjobs)|\/application\b/i.test(window.location.href)) {
        pageMode = "application-history";
      } else if (/(?:recommendedjobs|jobs-in-|[-/]jobs|jobsearch|search)/i.test(window.location.href) || diagnostics.knownCards > 0 || diagnostics.jobLinks > 0) {
        pageMode = "search-results";
      } else if (/\/mnjuser\/profile|\/profile(?:[/?#]|$)/i.test(window.location.href) || (diagnostics.profileNodes > 0 && !diagnostics.knownCards)) {
        pageMode = "profile";
      }
      return { ok: true, extractorVersion: EXTRACTOR_VERSION, page: window.location.href, title: document.title, pageMode, sessionState: verification.hasChallenge ? "verification-required" : (core.sessionState ? core.sessionState(document, pageMode) : pageMode === "login" ? "login-required" : "unknown"), diagnostics, hasChallenge: verification.hasChallenge };
    }

    if (message?.type === "EXTRACT_PAGE") {
      const requestedWait = Number(message.waitMs);
      await waitForJobSurface(Number.isFinite(requestedWait) && requestedWait >= 0 ? requestedWait : 15000);
      if (message.deepLoad !== false) await hydrateLazyResults();
      let result = snapshot();
      if (!result.jobs.length) {
        await wait(900);
        result = snapshot();
      }
      return result;
    }

    if (message?.type === "EXTRACT_PROFILE") {
      const requestedWait = Number(message.waitMs);
      const timeoutMs = Number.isFinite(requestedWait) && requestedWait >= 0 ? requestedWait : 15000;
      await hydrateProfileSurface({ includeOptional: false });
      let result = await waitForProfileSurface(timeoutMs);
      let coreReady = profileCoreReadiness(result.profile);
      if (!coreReady.ready) {
        await hydrateProfileSurface({ includeOptional: true });
        result = await waitForProfileSurface(Math.min(4500, Math.max(1200, timeoutMs)));
        coreReady = profileCoreReadiness(result.profile);
      }
      const direct = profileDirectDiagnostics(result.profile);
      const evidenceCount = profileCaptureEvidenceCount(result.profile);
      return {
        ...result,
        ok: true,
        diagnostics: { ...(result.diagnostics || {}), captureScore: profileCaptureScore(result.profile), captureEvidenceCount: evidenceCount, coreProfileReady: true, coreSignals: coreReady.signals, pendingProfileSections: direct.pending, loadedProfileSections: direct.loaded }
      };
    }

    if (message?.type === "OPEN_PROFILE_SECTION") {
      const section = String(message.section || "");
      const action = String(message.action || "review").toLowerCase();
      const index = Number.isFinite(Number(message.index)) ? Math.max(0, Number(message.index)) : null;
      const cfg = core.NAUKRI_PROFILE_SECTION_MAP?.[section];
      if (!cfg?.root) return { ok: false, error: "Unknown Naukri profile section." };
      const root = document.querySelector(cfg.root);
      if (!root) return { ok: false, error: `Naukri has not rendered the ${section} section on this page yet.` };

      root.scrollIntoView({ block: "center", behavior: "smooth" });
      if (action === "review") {
        const oldOutline = root.style.outline;
        const oldOffset = root.style.outlineOffset;
        root.style.outline = "3px solid #275df5";
        root.style.outlineOffset = "4px";
        setTimeout(() => { root.style.outline = oldOutline; root.style.outlineOffset = oldOffset; }, 1800);
        return { ok: true, section, action: "review", itemCount: cfg.item ? document.querySelectorAll(cfg.item).length : 0 };
      }

      let control = null;
      if (section === "accomplishments" && message.subsection) {
        const subKey = String(message.subsection || "");
        const subCfg = core.NAUKRI_ACCOMPLISHMENT_SECTION_MAP?.[subKey];
        if (!subCfg) return { ok: false, error: "Unknown Naukri accomplishment subsection." };
        if (action === "add" && subCfg.add) control = document.querySelector(`#lazyAccomplishment ${subCfg.add}`);
        if (action === "edit" && index !== null && subCfg.item && subCfg.itemEdit) {
          const rows = Array.from(document.querySelectorAll(`#lazyAccomplishment ${subCfg.item}`)).filter((row) => row.querySelector?.(subCfg.itemEdit));
          control = rows[index]?.querySelector?.(subCfg.itemEdit) || null;
        }
      }
      if (!control && index !== null && cfg.item && cfg.itemEdit && action === "edit") {
        const rows = Array.from(document.querySelectorAll(cfg.item));
        control = rows[index]?.querySelector?.(cfg.itemEdit) || null;
      }
      if (!control && action === "edit" && cfg.edit) control = document.querySelector(cfg.edit);
      if (!control && action === "add" && cfg.add) control = document.querySelector(cfg.add);
      if (!control && action === "update" && cfg.update) control = document.querySelector(cfg.update);
      if (!control && action === "download" && cfg.download) control = document.querySelector(cfg.download);
      if (!control) return { ok: false, error: `${action} is not available for the ${section} section in the current Naukri DOM.` };
      control.scrollIntoView({ block: "center", behavior: "smooth" });
      control.click();
      return { ok: true, section, action, index, clicked: true };
    }

    if (message?.type === "OPEN_PROFILE_EDITOR") {
      const candidates = Array.from(document.querySelectorAll("button, a, [role='button'], [aria-label]"));
      const edit = candidates.find((node) => {
        const text = `${node.getAttribute("aria-label") || ""} ${node.textContent || ""}`.replace(/\s+/g, " ").trim();
        return /^(edit|edit profile|edit resume|modify profile)$/i.test(text) || /\bedit profile\b/i.test(text);
      });
      if (!edit) return { ok: false, error: "Naukri did not expose an Edit profile control on this page." };
      edit.scrollIntoView({ block: "center", behavior: "smooth" });
      edit.click();
      return { ok: true, mode: message.kind === "major" ? "major" : "minor", action: "edit-opened" };
    }

    if (message?.type === "EXTRACT_ACCOUNT_HISTORY") {
      const requestedWait = Number(message.waitMs);
      await waitForAccountSurface(Number.isFinite(requestedWait) && requestedWait >= 0 ? requestedWait : 15000);
      let result = accountHistorySnapshot();
      if (!result.events.length && result.pageMode !== "application-history") {
        await wait(900);
        result = accountHistorySnapshot();
      }
      return result;
    }

    if (message?.type === "DISCOVER_ACCOUNT_SURFACES") {
      await waitForAccountSurface(Number(message.waitMs) || 5000);
      const page = window.location.href;
      return { ok: true, extractorVersion: EXTRACTOR_VERSION, page, pageMode: core.pageMode(page), surfaces: core.accountSurfaceLinks ? core.accountSurfaceLinks(document, page) : [], sessionState: core.sessionState ? core.sessionState(document, core.pageMode(page)) : "unknown", diagnostics: surfaceCounts() };
    }

    if (message?.type === "CLICK_APPLY" || message?.type === "TRIGGER_NAUKRI_APPLY") {
      const applySelectors = [
        "button.multi-apply-button", "button[class*='multi-apply']",
        "button.apply-button", "button[class*='apply-button']", "button[class*='styles_apply-btn']",
        "button[class*='applyBtn']", "button[class*='apply-btn']", "button#apply-button",
        ".apply-button", "button.apply"
      ];
      let btn = null;
      for (const sel of applySelectors) {
        const found = document.querySelector(sel);
        if (found && !found.disabled && found.offsetParent !== null) { btn = found; break; }
      }
      if (!btn) {
        const candidates = [...document.querySelectorAll("button, [role='button'], a.button")];
        btn = candidates.find(b => {
          if (b.disabled || b.offsetParent === null) return false;
          const txt = (b.innerText || b.textContent || "").trim();
          return /^\s*apply(?:\s+on\s+company\s+site)?\s*$/i.test(txt);
        });
      }
      const pageText = (document.body?.innerText || "").toLowerCase();
      const alreadyApplied = pageText.includes("already applied") || (btn && /already applied/i.test(btn.innerText || ""));
      if (alreadyApplied) {
        return { ok: true, applied: false, alreadyApplied: true, message: "Already applied on Naukri." };
      }
      if (!btn) {
        return { ok: false, error: "No visible Apply button found on this page." };
      }
      btn.click();
      return { ok: true, applied: true, message: "Clicked Apply successfully." };
    }

    if (message?.type === "CLICK_NEXT") {
      const node = core.findNextNode(document);
      if (!node) return { ok: false, error: "No enabled next-page control was found." };
      window.setTimeout(() => node.click(), 60);
      return { ok: true, extractorVersion: EXTRACTOR_VERSION, mode: "click", page: window.location.href };
    }

    if (message?.type === "INSPECT_NAUKRI_APPLY_STATUS") return inspectNaukriApplyStatus();
    if (message?.type === "INSPECT_NAUKRI_FOLLOWUP") return inspectNaukriFollowup();
    if (message?.type === "ANSWER_NAUKRI_FOLLOWUP") return answerNaukriFollowup(message.answer, { submit: message.submit !== false });

    return { ok: false, error: "Unknown extractor message." };
  }

  function isNaukriPageMode(mode) {
    return ["profile", "search-results", "application-history", "account-history", "job-detail"].includes(mode);
  }

  document.addEventListener('click', captureManualFollowupBeforeSubmit, true);
  document.addEventListener('submit', captureManualFollowupOnFormSubmit, true);
  document.addEventListener('keydown', captureManualFollowupOnEnter, true);
  document.addEventListener('change', captureManualFollowupOnChoice, true);
  document.addEventListener('click', captureManualFollowupRoleChoice, true);

  chrome?.runtime?.onMessage?.addListener?.((message, _sender, sendResponse) => {
    handle(message)
      .then((result) => respondSafely(sendResponse, result, message))
      .catch((error) => respondSafely(sendResponse, { ok: false, error: error?.message || "Could not read this Naukri page." }, message));
    return true;
  });

  function monitorAutomaticProfileCapture() {
    const href = window.location.href;
    if (href !== automaticProfileCaptureUrl) {
      automaticProfileCaptureUrl = href;
      automaticProfileCaptureDone = false;
      automaticProfileCaptureAttempts = 0;
      window.clearTimeout(automaticProfileCaptureTimer);
    }
    if (core.pageMode(href) === 'profile' && !automaticProfileCaptureDone && !automaticProfileCaptureRunning && automaticProfileCaptureAttempts < 3) {
      scheduleAutomaticProfileCapture(450);
    }
  }

  monitorAutomaticProfileCapture();
  window.addEventListener('load', () => scheduleAutomaticProfileCapture(300), { once: true });
  // Naukri is a SPA; a low-frequency URL/mount check is safer and far cheaper than
  // a whole-document MutationObserver, while still catching late profile hydration.
  window.setInterval(monitorAutomaticProfileCapture, 1400);
})();


  // Automatic return from Naukri confirmation page (myapply/saveApply)
  function handleConfirmationPage() {
    if (!window.location.href.includes('/myapply/saveApply')) return;
    if (document.getElementById('applyraConfirmationBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'applyraConfirmationBanner';
    banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#059669;color:#ffffff;padding:12px 20px;border-radius:12px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.25);z-index:9999999;display:flex;align-items:center;gap:12px;animation:slideDown 0.3s ease-out;';
    
    let secondsLeft = 5;
    banner.innerHTML = `
      <span>🎉 <strong>Application Confirmed!</strong> Next batch starting in <span id="applyraCountdown" style="text-decoration:underline;">${secondsLeft}</span>s...</span>
      <button id="applyraContinueNow" style="background:#ffffff;color:#059669;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px;">Continue to Next Jobs ➔</button>
      <button id="applyraStayHere" style="background:transparent;color:#d1fae5;border:1px solid #a7f3d0;padding:6px 10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;">Stay here</button>
    `;
    document.body.appendChild(banner);

    let cancelled = false;
    const countdownEl = document.getElementById('applyraCountdown');
    const timer = setInterval(() => {
      if (cancelled) { clearInterval(timer); return; }
      secondsLeft -= 1;
      if (countdownEl) countdownEl.textContent = String(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(timer);
        window.location.href = 'https://www.naukri.com/mnjuser/recommendedjobs';
      }
    }, 1000);

    document.getElementById('applyraContinueNow')?.addEventListener('click', () => {
      clearInterval(timer);
      window.location.href = 'https://www.naukri.com/mnjuser/recommendedjobs';
    });
    document.getElementById('applyraStayHere')?.addEventListener('click', () => {
      cancelled = true;
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleConfirmationPage);
  } else {
    handleConfirmationPage();
  }
