/**
 * Applyra Tab-Injected Bridges
 *
 * CRITICAL ARCHITECTURAL REQUIREMENT:
 * These functions are executed directly inside external browser tabs via
 * `chrome.scripting.executeScript({ func: ... })`.
 *
 * They MUST be 100% self-contained:
 * 1. ZERO references to background service worker scope or external variables.
 * 2. MUST NOT be transformed by string-array obfuscators (which inject references
 *    to outer-scope decryptors that do not exist inside target browser tabs).
 * 3. Every bridge must have top-level try/catch to return structured error objects
 *    instead of causing unhandled rejections that return undefined.
 */

/* ========================================================================== */
/* 1. NAUKRI PROFILE API BRIDGE (Profile Boost Reversible & Probe)           */
/* ========================================================================== */

async function naukriProfileApiBridge(action = "probe", recoveryInput = null) {
  try {
    const PROFILE_API = "/cloudgateway-mynaukri/resman-aggregator-services/v2/users/self?expand_level=4";
    const DASHBOARD_API = "/cloudgateway-mynaukri/resman-aggregator-services/v0/users/self/dashboard";
    const UPDATE_API = "/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/fullprofiles";

    const LEGACY_HEADLINE_RECOVERY_KEY = "nowcurry.profileBoost.headlineRecovery.v2";
    const LEGACY_PROFILE_RECOVERY_KEY = "nowcurry.profileBoost.recovery.v1";
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const baseHeaders = {
      accept: "application/json",
      appid: "105",
      clientid: "d3skt0p",
      systemid: "Naukri",
      "x-requested-with": "XMLHttpRequest"
    };

    const readJson = async (response) => {
      try {
        const text = await response.text();
        if (!text) return {};
        return JSON.parse(text);
      } catch {
        return {};
      }
    };

    const findKey = (value, names, depth = 0) => {
      if (depth > 12 || value == null) return null;
      if (Array.isArray(value)) {
        for (const item of value) {
          const hit = findKey(item, names, depth + 1);
          if (hit != null && hit !== "") return hit;
        }
        return null;
      }
      if (typeof value !== "object") return null;
      for (const [key, child] of Object.entries(value)) {
        if (names.has(String(key).toLowerCase()) && (typeof child === "string" || typeof child === "number")) {
          return String(child);
        }
      }
      for (const child of Object.values(value)) {
        const hit = findKey(child, names, depth + 1);
        if (hit != null && hit !== "") return hit;
      }
      return null;
    };

    const domHeadline = () => {
      try {
        const node = document.querySelector(
          "#lazyResumeHead [class*='resumeHeadline'], #lazyResumeHead [class*='headline'], #lazyResumeHead, [data-testid*='headline' i], [class*='resumeHeadline' i]"
        );
        const text = String(node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim();
        return text.replace(/^(?:resume headline|headline)\s*[:\-]?\s*/i, "").replace(/\s+edit$/i, "").trim();
      } catch {
        return "";
      }
    };

    const domProfileId = () => {
      try {
        if (window.naukriAppData?.profileId) return String(window.naukriAppData.profileId);
        if (window.naukriUserData?.profileId) return String(window.naukriUserData.profileId);
        if (window.__INITIAL_STATE__?.profile?.profileId) return String(window.__INITIAL_STATE__.profile.profileId);
        if (window._nc_profileId) return String(window._nc_profileId);
      } catch {}

      try {
        const imgs = [...document.querySelectorAll("img[src*='/profiles/']")];
        for (const img of imgs) {
          const m = String(img.src || "").match(/\/profiles\/([^/]+)\/photo/i);
          if (m?.[1]) return m[1];
        }
      } catch {}

      try {
        const html = document.documentElement?.innerHTML || "";
        const match = html.match(/["']profileId["']\s*[:=]\s*["']([^"']+)["']/i) || html.match(/\/profiles\/([a-zA-Z0-9_-]{8,})\//i);
        return match?.[1] || "";
      } catch {
        return "";
      }
    };

    const fetchSelf = async () => {
      let lastError = "";
      for (const url of [PROFILE_API, DASHBOARD_API]) {
        try {
          const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store", headers: baseHeaders });
          if (!response.ok) {
            lastError = `${url} returned ${response.status}`;
            continue;
          }
          const data = await readJson(response);
          const profileId = findKey(data, new Set(["profileid", "profile_id"])) || domProfileId();
          const resumeHeadline = findKey(data, new Set(["resumeheadline", "resume_headline"])) || domHeadline();
          if (profileId || resumeHeadline) {
            return { ok: true, profileId: profileId || "", resumeHeadline: resumeHeadline || "", source: url };
          }
        } catch (error) {
          lastError = error?.message || String(error);
        }
      }
      const profileId = domProfileId();
      const resumeHeadline = domHeadline();
      if (profileId || resumeHeadline) {
        return { ok: true, profileId: profileId || "", resumeHeadline: resumeHeadline || "", source: "dom-fallback" };
      }
      return { ok: false, profileId: "", resumeHeadline: "", error: lastError || "Could not read the signed-in Naukri profile." };
    };

    const updateHeadline = async (profileId, resumeHeadline) => {
      const response = await fetch(UPDATE_API, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { ...baseHeaders, "content-type": "application/json", "x-http-method-override": "PUT" },
        body: JSON.stringify({ profile: { resumeHeadline }, profileId })
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(`Naukri headline update returned HTTP ${response.status}.`);
      return { ok: true, status: response.status, body };
    };

    const verifyHeadline = async (expected) => {
      for (let i = 0; i < 5; i += 1) {
        await sleep(i === 0 ? 650 : 450);
        const current = await fetchSelf();
        if (current.ok && current.resumeHeadline === expected) return { ok: true, current };
      }
      return { ok: false };
    };

    const readLegacyV2 = () => {
      try {
        const raw = sessionStorage.getItem(LEGACY_HEADLINE_RECOVERY_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const hasLegacyV1 = () => {
      try {
        return Boolean(sessionStorage.getItem(LEGACY_PROFILE_RECOVERY_KEY));
      } catch {
        return false;
      }
    };

    if (action === "read-legacy-recovery") {
      const legacyV2 = readLegacyV2();
      return { ok: true, legacyV2: legacyV2?.profileId && typeof legacyV2?.original === "string" ? legacyV2 : null, legacyV1: hasLegacyV1() };
    }

    if (action === "clear-legacy-v2") {
      try { sessionStorage.removeItem(LEGACY_HEADLINE_RECOVERY_KEY); } catch {}
      return { ok: true };
    }

    if (action === "probe") {
      const current = await fetchSelf();
      if (!current.ok) return current;
      return {
        ok: Boolean(current.profileId && current.resumeHeadline),
        status: "ready",
        hasProfileId: Boolean(current.profileId),
        hasHeadline: Boolean(current.resumeHeadline),
        headlineLength: current.resumeHeadline?.length || 0,
        source: current.source
      };
    }

    if (action === "assisted") {
      const current = await fetchSelf();
      if (!current.ok || !current.profileId) {
        return { ok: false, status: "not-ready", error: current.error || "Could not resolve the signed-in Naukri profile ID." };
      }
      return {
        ok: true,
        status: "waiting-user",
        mode: "assisted",
        ready: true,
        message: "Naukri profile is connected. Manual mode leaves the profile unchanged; use No-change Save to open Resume headline and save it without editing."
      };
    }

    const recovery = recoveryInput && typeof recoveryInput === "object" ? recoveryInput : null;

    if (action === "recover") {
      if (!recovery?.profileId || typeof recovery.original !== "string") {
        return { ok: true, status: "nothing-to-recover", recovered: false };
      }
      const active = await fetchSelf();
      if (!active.ok || !active.profileId) {
        return { ok: false, status: "recovery-profile-unavailable", rollbackRequired: true, recovered: false, error: active.error || "Could not verify which signed-in Naukri profile owns this recovery record." };
      }
      if (String(active.profileId) !== String(recovery.profileId)) {
        return { ok: false, status: "recovery-profile-mismatch", rollbackRequired: true, recovered: false, error: "This recovery record belongs to a different Naukri profile. Sign in to the original account before recovery; Applyra will not update another profile ID." };
      }
      try {
        await updateHeadline(recovery.profileId, recovery.original);
        const verified = await verifyHeadline(recovery.original);
        if (!verified.ok) {
          return { ok: false, status: "rollback-required", rollbackRequired: true, recovered: false, error: "Naukri accepted the recovery request, but the original Resume Headline could not be verified." };
        }
        return { ok: true, status: "recovered", recovered: true, restored: true };
      } catch (error) {
        return { ok: false, status: "rollback-required", rollbackRequired: true, recovered: false, error: error?.message || "Resume Headline recovery failed." };
      }
    }

    if (action === "prepare-reversible") {
      const current = await fetchSelf();
      if (!current.ok || !current.profileId) {
        return { ok: false, status: "not-ready", error: current.error || "Could not resolve the signed-in Naukri profile ID." };
      }
      const original = String(current.resumeHeadline || "");
      if (!original.trim()) {
        return { ok: false, status: "empty-headline", error: "Resume Headline is empty. Applyra will not invent content just to trigger profile freshness." };
      }
      if (original.length >= 250 && !/[.!?]$/.test(original)) {
        return { ok: false, status: "headline-at-limit", error: "Resume Headline is at its limit, so a safe reversible micro-edit was not attempted." };
      }
      const temporary = /[.!?]$/.test(original) ? original.slice(0, -1) : `${original}.`;
      if (!temporary || temporary === original) {
        return { ok: false, status: "no-safe-change", error: "Could not create a safe reversible Resume Headline change." };
      }
      return { ok: true, status: "prepared", recovery: { profileId: current.profileId, original, temporary, createdAt: new Date().toISOString() } };
    }

    if (action !== "reversible") {
      return { ok: false, status: "unsupported", error: "Unsupported Profile Boost action." };
    }

    if (!recovery?.profileId || typeof recovery.original !== "string" || typeof recovery.temporary !== "string") {
      return { ok: false, status: "missing-recovery", rollbackRequired: true, error: "Secure Profile Boost recovery state is missing." };
    }

    const current = await fetchSelf();
    if (!current.ok || String(current.profileId || "") !== String(recovery.profileId || "")) {
      return { ok: false, status: "profile-changed", safeToClearRecovery: true, error: "The active Naukri profile changed before Profile Boost started." };
    }

    if (current.resumeHeadline !== recovery.original) {
      if (current.resumeHeadline === recovery.temporary) {
        try {
          await updateHeadline(recovery.profileId, recovery.original);
          const restored = (await verifyHeadline(recovery.original)).ok;
          return restored
            ? { ok: false, status: "recovered-before-run", restored: true, safeToClearRecovery: true, error: "A pending temporary headline was restored before a new Profile Boost run." }
            : { ok: false, status: "rollback-required", rollbackRequired: true, error: "A pending temporary headline still requires recovery." };
        } catch (error) {
          return { ok: false, status: "rollback-required", rollbackRequired: true, error: error?.message || "Pending headline recovery failed." };
        }
      }
      return { ok: false, status: "headline-changed", safeToClearRecovery: true, error: "Resume Headline changed after preparation, so the reversible update was cancelled." };
    }

    let changedObserved = false;
    try {
      await updateHeadline(recovery.profileId, recovery.temporary);
      changedObserved = (await verifyHeadline(recovery.temporary)).ok;
      await updateHeadline(recovery.profileId, recovery.original);
      const restored = (await verifyHeadline(recovery.original)).ok;
      if (!restored) {
        return { ok: false, status: "rollback-required", mode: "reversible", rollbackRequired: true, changedObserved, error: "The temporary Resume Headline update was sent, but Applyra could not verify restoration of the original text." };
      }
      return {
        ok: true,
        status: changedObserved ? "success" : "normalized-no-change",
        mode: "reversible",
        restored: true,
        safeToClearRecovery: true,
        changedObserved,
        message: changedObserved
          ? "Verified reversible Resume Headline refresh completed and the original headline was restored."
          : "Naukri did not expose the temporary change during verification; the original Resume Headline is restored."
      };
    } catch (error) {
      try {
        await updateHeadline(recovery.profileId, recovery.original);
        const restored = (await verifyHeadline(recovery.original)).ok;
        if (restored) {
          return { ok: false, status: "restored-after-error", restored: true, safeToClearRecovery: true, error: error?.message || "Profile Boost failed after the original headline was safely restored." };
        }
      } catch {}
      return { ok: false, status: "rollback-required", rollbackRequired: true, changedObserved, error: error?.message || "Profile Boost failed and the original Resume Headline still requires verification." };
    }
  } catch (bridgeError) {
    return { ok: false, error: "Naukri profile bridge exception: " + (bridgeError?.message || String(bridgeError)) };
  }
}

/* ========================================================================== */
/* 2. NAUKRI HEADLINE SAVE BRIDGE (Profile Boost No-Change UI Save)          */
/* ========================================================================== */

async function naukriHeadlineSaveBridge(action = "save-only") {
  try {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const norm = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const visible = (el) => {
      if (!el || !el.isConnected) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const waitFor = async (fn, timeout = 10000, interval = 120) => {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        const value = fn();
        if (value) return value;
        await sleep(interval);
      }
      return null;
    };

    const exactText = (el, value) => norm(el?.textContent).toLowerCase() === String(value).toLowerCase();

    const resumeHeading = () => {
      const preferred = [...document.querySelectorAll("#lazyResumeHead h1,#lazyResumeHead h2,#lazyResumeHead h3,#lazyResumeHead h4,#lazyResumeHead [class*='title'],#lazyResumeHead [class*='heading']")]
        .find((el) => visible(el) && /^resume headline$/i.test(norm(el.textContent)));
      if (preferred) return preferred;

      const lazy = document.querySelector("#lazyResumeHead");
      if (lazy && visible(lazy)) return lazy;

      const all = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,div,span,p,label,[class*='resumeHeadline']")]
        .filter((el) => visible(el) && /^resume headline$/i.test(norm(el.textContent)));
      all.sort((a, b) => (a.childElementCount - b.childElementCount) || (a.getBoundingClientRect().top - b.getBoundingClientRect().top));
      return all[0] || null;
    };

    const ancestorChain = (el, max = 6) => {
      const out = [];
      let cur = el;
      for (let i = 0; cur && i < max; i += 1, cur = cur.parentElement) out.push(cur);
      return out;
    };

    const candidateScore = (el, heading, root) => {
      if (!visible(el) || el === heading || el.contains(heading)) return -1e9;
      const text = norm(el.textContent).toLowerCase();
      if (/^(save|cancel|improve with ai)$/i.test(text)) return -1e9;
      const aria = norm(el.getAttribute?.("aria-label")).toLowerCase();
      const title = norm(el.getAttribute?.("title")).toLowerCase();
      const cls = String(el.className?.baseVal ?? el.className ?? "").toLowerCase();
      let score = 0;
      if (/edit|pencil/.test(`${aria} ${title} ${cls}`)) score += 120;
      if (el.matches?.("button,[role='button'],a,[tabindex],[onclick]")) score += 30;
      if (el.querySelector?.("svg,i,[class*='edit'],[class*='pencil']")) score += 18;
      if (root?.contains(el)) score += 20;
      const hr = heading.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      const dx = er.left - hr.right;
      const dy = Math.abs((er.top + er.height / 2) - (hr.top + hr.height / 2));
      if (dx >= -20 && dx <= 260 && dy <= 80) score += Math.max(0, 90 - Math.abs(dx) * 0.15 - dy * 0.7);
      if (text.length > 80) score -= 80;
      if (el.closest?.("nav,aside")) score -= 200;
      return score;
    };

    const findEdit = (heading) => {
      const roots = [];
      const lazy = document.querySelector("#lazyResumeHead");
      if (lazy) roots.push(lazy);
      roots.push(...ancestorChain(heading, 6));
      const seen = new Set();
      let best = null;
      let bestScore = -1e9;
      for (const root of roots) {
        if (!root || seen.has(root)) continue;
        seen.add(root);
        const direct = root.querySelectorAll?.("[aria-label*='edit' i],[title*='edit' i],[class*='edit' i],[class*='pencil' i],button,[role='button'],a,[tabindex],[onclick]") || [];
        for (const raw of direct) {
          let el = raw;
          if (raw.tagName === "SVG" || raw.tagName === "I") el = raw.closest("button,[role='button'],a,[tabindex],[onclick]") || raw.parentElement || raw;
          const score = candidateScore(el, heading, root);
          if (score > bestScore) { best = el; bestScore = score; }
        }
      }
      return bestScore >= 45 ? best : null;
    };

    const findDialog = () => {
      const candidates = [...document.querySelectorAll("[role='dialog'],[aria-modal='true'],[class*='modal' i],[class*='drawer' i],[class*='overlay' i]")]
        .filter(visible)
        .filter((el) => /resume headline/i.test(norm(el.textContent)) && /\bsave\b/i.test(norm(el.textContent)));
      if (candidates.length) return candidates.sort((a,b)=>a.getBoundingClientRect().width-b.getBoundingClientRect().width)[0];
      const save = [...document.querySelectorAll("button,[role='button']")].find((el) => visible(el) && exactText(el, "Save"));
      if (!save) return null;
      for (const root of ancestorChain(save, 8)) {
        if (/resume headline/i.test(norm(root.textContent))) return root;
      }
      return null;
    };

    const findSave = (dialog) => [...dialog.querySelectorAll("button,[role='button'],input[type='submit']")]
      .find((el) => visible(el) && !el.disabled && (/^save$/i.test(norm(el.textContent)) || /^save$/i.test(norm(el.value)) || /^save$/i.test(norm(el.getAttribute?.("aria-label")))));

    const heading = await waitFor(resumeHeading, 12000);
    if (!heading) return { ok: false, status: "headline-section-missing", error: "Could not locate the Resume headline section on the current Naukri profile page." };
    const edit = findEdit(heading);
    if (!edit) return { ok: false, status: "edit-control-missing", error: "Resume headline was found, but its pencil/edit control could not be identified safely." };
    if (action === "probe") return { ok: true, status: "ready", hasHeadline: true, hasEditControl: true };

    edit.click();
    const dialog = await waitFor(findDialog, 8000);
    if (!dialog) return { ok: false, status: "editor-not-opened", error: "The Resume headline pencil was clicked, but the editor popup did not appear." };
    const save = await waitFor(() => findSave(dialog), 5000);
    if (!save) return { ok: false, status: "save-control-missing", error: "Resume headline editor opened, but its Save button could not be located or is disabled." };

    const editable = dialog.querySelector("textarea,input:not([type='hidden']),[contenteditable='true']");
    const valueBefore = editable ? ("value" in editable ? String(editable.value ?? "") : String(editable.textContent ?? "")) : "";

    let saveRequest = null;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const originalFetch = window.fetch;
    const targetPath = "/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/fullprofiles";
    const restoreNetworkHooks = () => {
      try { XMLHttpRequest.prototype.open = originalXHROpen; } catch {}
      try { XMLHttpRequest.prototype.send = originalXHRSend; } catch {}
      try { if (originalFetch) window.fetch = originalFetch; } catch {}
    };

    try {
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        try { this.__ncProfileBoost = { method: String(method || ""), url: String(url || "") }; } catch {}
        return originalXHROpen.call(this, method, url, ...rest);
      };
      XMLHttpRequest.prototype.send = function(body) {
        try {
          const meta = this.__ncProfileBoost;
          if (meta && meta.url.includes(targetPath)) {
            this.addEventListener("loadend", () => {
              saveRequest = { transport: "xhr", method: meta.method, url: meta.url, status: Number(this.status || 0), ok: this.status >= 200 && this.status < 300 };
            }, { once: true });
          }
        } catch {}
        return originalXHRSend.call(this, body);
      };
      if (typeof originalFetch === "function") {
        window.fetch = async function(input, init) {
          const url = typeof input === "string" ? input : String(input?.url || "");
          const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET");
          const response = await originalFetch.apply(this, arguments);
          if (url.includes(targetPath)) saveRequest = { transport: "fetch", method, url, status: Number(response.status || 0), ok: response.ok };
          return response;
        };
      }

      save.click();
      await waitFor(() => saveRequest, 8000, 120);
    } finally {
      restoreNetworkHooks();
    }

    const valueAfter = editable ? ("value" in editable ? String(editable.value ?? "") : String(editable.textContent ?? "")) : valueBefore;
    if (editable && valueBefore !== valueAfter) {
      return { ok: false, status: "unexpected-edit", error: "The Resume headline editor value changed unexpectedly. Applyra did not count this run as a safe no-change refresh." };
    }

    const modalStillOpen = dialog.isConnected && visible(dialog);
    if (saveRequest?.ok) {
      return {
        ok: true,
        status: "success",
        saved: true,
        mode: "save-only",
        changedText: false,
        modalStillOpen,
        saveRequestStatus: saveRequest.status,
        saveTransport: saveRequest.transport,
        message: modalStillOpen
          ? "Naukri accepted the unchanged Resume headline Save request. The same-page editor remained open, which is valid."
          : "Naukri accepted the unchanged Resume headline Save request."
      };
    }

    return {
      ok: true,
      status: "save-clicked-unverified",
      saved: true,
      mode: "save-only",
      changedText: false,
      modalStillOpen,
      message: "Save was clicked without changing the Resume headline, but Applyra did not observe Naukri's save request. This UI-only run was not counted as a confirmed boost; use Verified reversible API mode for confirmed refreshes."
    };
  } catch (bridgeError) {
    return { ok: false, error: "Resume headline save exception: " + (bridgeError?.message || String(bridgeError)) };
  }
}

/* ========================================================================== */
/* 3. NAUKRI RECOMMENDED AUTO-APPLY BRIDGE                                    */
/* ========================================================================== */

async function naukriRecommendedApplyBridge(action = "inspect", options = {}) {
  try {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const text = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const csv = (value) => text(value).split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    const includes = csv(options.includeKeywords);
    const excludes = csv(options.excludeKeywords);
    const skipIds = new Set((Array.isArray(options.skipJobIds) ? options.skipJobIds : []).map(String));
    const allowIds = new Set((Array.isArray(options.allowJobIds) ? options.allowJobIds : []).map(String));
    const bodyText = text(document.body?.innerText || document.body?.textContent);
    const requestedMode = options.pageMode === "search-results" ? "search-results" : "recommended";
    const recommendedReady = /\/mnjuser\/(?:recommendedjobs|recommended-jobs)|\/recommendedjobs|\/recommended-jobs/i.test(location.pathname)
      || /\brecommended jobs for you\b/i.test(bodyText);
    const searchReady = requestedMode === "search-results";
    const pageReady = requestedMode === "search-results" ? searchReady : recommendedReady;
    const pageLabel = requestedMode === "search-results" ? "Naukri Search Results" : "Naukri Recommended Jobs";
    const loginRequired = /\/nlogin\/|\/login/i.test(location.pathname) || /\b(?:login|sign in) to continue\b/i.test(bodyText);
    const CARD_SELECTOR = [
      ".srp-jobtuple-wrapper", ".cust-job-tuple", "article.jobTuple", ".jobTuple",
      "[data-job-id]", "[class*='jobTuple']", "[class*='job-tuple']",
      "[class*='styles_job-listing']", "[class*='styles_jlc']", "[class*='job-card']", "[class*='jobCard']",
      "article[class*='job']", "[data-testid*='job-tuple']", "[class*='srp-container'] article",
      "[class*='tuple']", "[class*='srp-tuple']", "[class*='srpJobTuple']", "article"
    ].join(",");
    const TITLE_SELECTOR = [
      "a.title", "a[class*='title']", "a[href*='/job-listings']", "a[href*='/job/']", "a[href*='job-overview']",
      "[class*='job-title']", "[class*='jobTitle']", "[class*='job_title']", "[class*='title'] a", "[class*='title']",
      "[class*='designation']", "[data-testid*='title']", "h2 a", "h3 a", "h2", "h3", ".title"
    ].join(",");
    const COMPANY_SELECTOR = [
      ".subTitle", ".comp-name", "[class*='companyInfo'] .subTitle", "[class*='company-name']",
      "[class*='companyName']", "[class*='company']", "[data-testid*='company']"
    ].join(",");
    const LOCATION_SELECTOR = [
      ".locWdth", ".location", "[class*='location'] [title]", "[class*='location']", "[class*='locWdth']", "[data-testid*='location']"
    ].join(",");
    const CHECKBOX_SELECTOR = [
      "input[type='checkbox']", "[role='checkbox']", ".tuple-check-box", "[class*='tuple-check-box']",
      "[class*='check-box']", "[class*='checkbox']", "[class*='tuple-icon-checkbox']", "[class*='tuple-icon-Checked']",
      "i[class*='checkbox']", "i[class*='Checked']", "span[class*='checkbox']", ".ni-job-tuple-icon-checkbox"
    ].join(",");
    const DIRECT_APPLY_SELECTOR = [
      "button", "[role='button']", "a[href]", "input[type='button']", "input[type='submit']"
    ].join(",");

    const first = (root, selector) => root?.querySelector?.(selector) || null;
    const attrOrText = (node) => text(node?.getAttribute?.("title") || node?.getAttribute?.("aria-label") || node?.textContent);
    const jobUrlFor = (card) => {
      const anchor = first(card, "a[href*='/job-listings-'],a[href*='/job-listing-'],a[href*='/job/'],a[href*='job-overview']")
        || first(card, "a.title,a[class*='title'],[class*='title'] a,h2 a,h3 a");
      try {
        const url = anchor?.href ? new URL(anchor.href, location.href) : null;
        return url && url.protocol === "https:" && /(^|\.)naukri\.com$/i.test(url.hostname)
          && /\/job-listings?-|\/job\/|job-overview/i.test(url.pathname) ? url.href : "";
      } catch { return ""; }
    };
    const jobIdFor = (card, url) => {
      const direct = text(card?.getAttribute?.("data-job-id") || first(card, "[data-job-id]")?.getAttribute?.("data-job-id"));
      if (direct) return direct;
      const raw = text(url);
      const queryMatch = raw.match(/[?&](?:jobid|jobId|jid)=([^&#]+)/i);
      if (queryMatch) return decodeURIComponent(queryMatch[1]);
      const hits = raw.match(/\b\d{8,16}\b/g) || [];
      if (hits.length) return hits[hits.length - 1];
      const pathMatch = raw.match(/-(\d{6,})(?:[/?#]|$)/);
      if (pathMatch) return pathMatch[1];
      return raw ? `url:${raw.split(/[?#]/)[0]}` : "";
    };
    const cardInfo = (card) => {
      const titleNode = first(card, TITLE_SELECTOR);
      const url = jobUrlFor(card);
      return {
        jobId: jobIdFor(card, url),
        title: attrOrText(titleNode),
        company: attrOrText(first(card, COMPANY_SELECTOR)),
        location: attrOrText(first(card, LOCATION_SELECTOR)),
        url,
        text: text(card?.innerText || card?.textContent)
      };
    };
    const checkboxFor = (card) => first(card, CHECKBOX_SELECTOR);
    const directApplyFor = (card) => {
      const controls = [...(card?.querySelectorAll?.(DIRECT_APPLY_SELECTOR) || [])];
      const explicit = controls.find((node) => {
        if (isHidden(node) || node.disabled || node.getAttribute?.("aria-disabled") === "true") return false;
        const label = text(node.value || node.innerText || node.textContent || node.getAttribute?.("aria-label") || node.getAttribute?.("title"));
        if (/^(?:apply|apply now|apply job|apply to this job)$/i.test(label)) return true;
        const href = text(node.getAttribute?.("href"));
        return node.tagName === "A" && /(?:apply|applyjob|apply-job)/i.test(href) && !/job-listings?|job-detail/i.test(href);
      });
      return explicit || null;
    };
    const nestedInput = (node) => node?.matches?.("input[type='checkbox']") ? node : first(node, "input[type='checkbox']");
    const nestedRole = (node) => node?.getAttribute?.("role") === "checkbox" ? node : first(node, "[role='checkbox']");
    const hasUsableCheckbox = (checkbox) => {
      if (!checkbox) return false;
      const input = nestedInput(checkbox);
      if (input) return !input.disabled;
      const role = nestedRole(checkbox);
      if (role) return role.getAttribute?.("aria-disabled") !== "true";
      return checkbox.getAttribute?.("aria-disabled") !== "true";
    };
    const labelForInput = (input) => {
      if (!input?.id) return null;
      return [...document.querySelectorAll("label[for]")].find((node) => node.getAttribute("for") === input.id) || null;
    };
    const clickTargetFor = (checkbox) => {
      if (!checkbox) return null;
      const input = nestedInput(checkbox);
      if (input) return labelForInput(input) || input;
      const role = nestedRole(checkbox);
      if (role) return role;
      const explicitIcon = first(checkbox, "i.naukicon-ot-checkbox,i[class*='checkbox'],i[class*='Checked'],[class*='tuple-icon'],span[class*='checkbox']");
      if (explicitIcon) return explicitIcon;
      const parentLabel = checkbox.closest("label");
      if (parentLabel) return parentLabel;
      return checkbox;
    };
    const selectedState = (checkbox, card) => {
      if (!checkbox) return false;
      const input = nestedInput(checkbox);
      if (input?.checked) return true;
      const role = nestedRole(checkbox);
      if (role?.getAttribute?.("aria-checked") === "true") return true;
      if (checkbox.getAttribute?.("aria-checked") === "true") return true;
      if (card?.querySelector?.("input[type='checkbox']:checked,[role='checkbox'][aria-checked='true']")) return true;
      const icon = first(checkbox, "i,span,[role='checkbox']") || checkbox;
      const classes = `${checkbox.className || ''} ${icon?.className || ''} ${card?.className || ''}`;
      return /(?:^|\s|_|-)(?:checked|selected|active|tick|Checked)(?:$|\s|_|-)|checkbox[_-]?(?:checked|selected)|naukicon[^\s]*(?:checked|selected|tick)|tuple-icon-Checked/i.test(classes);
    };
    const RED_FLAG_REGEX = /\b(security deposit|training fee|processing fee|registration fee|refundable fee|pay before|unpaid trial|commission only|service bond|employment bond|cheque deposit|deposit required|bond period|pay to work|telegram task|crypto investment|earn up to rs\.?\s*\d+.*(?:per day|daily))\b/i;
    const matchReason = (item) => {
      if (!item.jobId || !item.title) return "missing-identity";
      if (skipIds.has(String(item.jobId))) return "known-applied";
      if (allowIds.size && !allowIds.has(String(item.jobId))) return "not-reviewed";
      if (/\balready applied\b|\bapplication sent\b|\bapplied on\b/i.test(item.text)) return "already-applied";
      const hay = `${item.title} ${item.company} ${item.location} ${item.text}`.toLowerCase();
      if (options.redFlagGuard && RED_FLAG_REGEX.test(hay)) return "red-flag-blocked";
      if (includes.length && !includes.some((term) => hay.includes(term))) return "include-filter";
      if (excludes.length && excludes.some((term) => hay.includes(term))) return "exclude-filter";
      return "eligible";
    };
    const buttonEnabled = (button) => Boolean(button && !isHidden(button) && !button.disabled && button.getAttribute?.("aria-disabled") !== "true");
    const isHidden = (node) => {
      if (!node || node.hidden || node.getAttribute?.("aria-hidden") === "true") return true;
      const style = getComputedStyle(node);
      return style.display === "none" || style.visibility === "hidden" || node.getClientRects().length === 0;
    };
    const waitUntil = async (predicate, timeoutMs = 1800, stepMs = 90) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (predicate()) return true;
        await sleep(stepMs);
      }
      return Boolean(predicate());
    };

    let rawCards = [...document.querySelectorAll(CARD_SELECTOR)];
    if (!rawCards.length) {
      await waitUntil(() => document.querySelectorAll(CARD_SELECTOR).length > 0, 5000, 150);
      rawCards = [...document.querySelectorAll(CARD_SELECTOR)];
    }

    const canonical = new Map();
    for (const card of rawCards) {
      const item = cardInfo(card);
      if (!item.jobId || !item.title) continue;
      const checkbox = checkboxFor(card);
      const directApply = directApplyFor(card);
      const score = (hasUsableCheckbox(checkbox) ? 1000 : 0) + (directApply ? 700 : 0) + (card.hasAttribute?.("data-job-id") ? 100 : 0) + Math.min(80, item.text.length / 20);
      const previous = canonical.get(String(item.jobId));
      if (!previous || score > previous.score) canonical.set(String(item.jobId), { card, item, checkbox, directApply, score });
    }
    const all = [...canonical.values()];
    const cards = all.map((row) => row.card);
    const reasonCounts = all.reduce((acc, row) => {
      const reason = matchReason(row.item);
      row.reason = reason;
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
    const matching = all.filter((row) => row.reason === "eligible");
    const candidates = matching.filter(({ checkbox }) => hasUsableCheckbox(checkbox));
    const directCandidates = matching.filter(({ checkbox, directApply, item }) => !hasUsableCheckbox(checkbox) && Boolean(directApply || item.url));
    const actionable = candidates.length
      ? [...candidates, ...directCandidates]
      : directCandidates;
    const insideJobCard = (node) => cards.some((card) => card === node || card.contains?.(node));
    const findApplyButton = () => {
      const explicit = [
        "button.multi-apply-button", "button[class*='multi-apply']", "[class*='multi-apply'][role='button']",
        "button[data-testid*='apply']", "[role='button'][data-testid*='apply']",
        "button.apply-button", "button[class*='apply-button']", "button[class*='styles_apply-btn']",
        "button[class*='applyBtn']", "button[class*='apply-btn']", "[class*='apply-button']",
        "button#apply-button", ".apply-button", "button.apply"
      ];
      for (const selector of explicit) {
        for (const node of document.querySelectorAll(selector)) {
          if (!insideJobCard(node) && buttonEnabled(node)) return node;
        }
      }
      const controls = [...document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit'],a.button")];
      return controls.find((node) => {
        if (insideJobCard(node) || isHidden(node) || node.disabled) return false;
        const label = text(node.value || node.innerText || node.textContent || node.getAttribute?.("aria-label"));
        return /^apply(?:\s*(?:\(|\bto\b|\bfor\b)?\s*\d*\s*(?:selected)?\s*(?:jobs?)?\s*\)?)?$/i.test(label) ||
               /^apply\s+now$/i.test(label) ||
               /^apply$/i.test(label);
      }) || null;
    };
    let applyButton = findApplyButton();
    const inspect = {
      ok: pageReady && !loginRequired,
      page: location.href,
      pageReady,
      loginRequired,
      cardCount: all.length,
      rawCardCount: rawCards.length,
      matchingCount: matching.length,
      selectableCount: candidates.length,
      directApplyCount: directCandidates.length,
      candidateCount: actionable.length,
      skippedKnownApplied: reasonCounts["known-applied"] || 0,
      skippedAlreadyApplied: reasonCounts["already-applied"] || 0,
      skippedRedFlag: reasonCounts["red-flag-blocked"] || 0,
      skippedByInclude: reasonCounts["include-filter"] || 0,
      skippedByExclude: reasonCounts["exclude-filter"] || 0,
      skippedNotReviewed: reasonCounts["not-reviewed"] || 0,
      skippedMissingIdentity: reasonCounts["missing-identity"] || 0,
      skippedWithoutCheckbox: matching.filter(({ checkbox, directApply, item }) => !hasUsableCheckbox(checkbox) && !directApply && !item.url).length,
      applyButtonFound: Boolean(applyButton),
      applyButtonDisabled: !buttonEnabled(applyButton),
      candidates: actionable.slice(0, 50).map(({ item }) => item)
    };
    if (loginRequired) return { ...inspect, ok: false, error: "Naukri sign-in is required." };
    if (action === "inspect") return inspect;
    if (action !== "select-and-apply") return { ok: false, error: "Unsupported Naukri auto-apply bridge action." };
    if (!pageReady) return { ok: false, error: `${pageLabel} page is not active.` };
    if (!actionable.length) return { ...inspect, ok: false, error: `No actionable ${pageLabel} matched the current filters.` };

    if (!candidates.length && (directCandidates.length || actionable.length)) {
      const targetRow = directCandidates[0] || actionable[0];
      const { card, item, directApply } = targetRow;
      const explicitInCard = directApply?.tagName !== "A" ? directApply : null;
      if (explicitInCard) {
        explicitInCard.scrollIntoView?.({ block: "center", behavior: "instant" });
        explicitInCard.click?.();
        return { ok: true, clicked: true, directApply: true, inCardApply: true, selected: [item], selectedCount: 1, page: location.href, clickedAt: new Date().toISOString(), diagnostics: inspect };
      }
      if (!item.url) return { ok: false, error: "No supported Naukri job detail link is available for this card.", diagnostics: inspect };
      return { ok: true, clicked: false, directApply: true, inCardApply: false, openJobUrl: item.url, selected: [item], selectedCount: 1, page: location.href, clickedAt: new Date().toISOString(), diagnostics: inspect };
    }

    const fireClick = (node) => {
      if (!node) return;
      node.scrollIntoView?.({ block: "center", behavior: "instant" });
      try {
        node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      } catch {}
      node.click?.();
    };

    for (const { card, checkbox } of all) {
      if (!hasUsableCheckbox(checkbox) || !selectedState(checkbox, card)) continue;
      const target = clickTargetFor(checkbox);
      fireClick(target);
      await waitUntil(() => !selectedState(checkbox, card), 900, 75);
    }

    const requestedLimit = Math.max(1, Math.min(5, Number(options.batchSize) || 1));
    const limit = requestedLimit;
    const degradedToSingle = candidates.length > 0 && requestedLimit > 1;
    const selected = [];
    let unverifiedSelectionUsed = false;
    for (const { card, item, checkbox } of candidates) {
      if (selected.length >= limit || unverifiedSelectionUsed) break;
      const target = clickTargetFor(checkbox);
      if (!target) continue;
      const beforeButton = findApplyButton();
      const buttonWasEnabled = buttonEnabled(beforeButton);
      fireClick(target);

      const confirmed = await waitUntil(() => selectedState(checkbox, card), 1400, 80);
      if (confirmed) {
        selected.push(item);
        continue;
      }

      const enabledAfterClick = await waitUntil(() => buttonEnabled(findApplyButton()), 1800, 80);
      if (!buttonWasEnabled && enabledAfterClick && !unverifiedSelectionUsed && selected.length === 0) {
        selected.push(item);
        unverifiedSelectionUsed = true;
        break;
      }
      if (buttonWasEnabled) {
        break;
      }
    }

    if (!selected.length) {
      if (candidates.length && candidates[0]?.item?.url) {
        const fallbackTarget = candidates[0];
        const direct = fallbackTarget.directApply || directApplyFor(fallbackTarget.card);
        const explicitInCard = direct?.tagName !== "A" ? direct : null;
        if (explicitInCard) {
          fireClick(explicitInCard);
          return { ok: true, clicked: true, directApply: true, inCardApply: true, selected: [fallbackTarget.item], selectedCount: 1, page: location.href, clickedAt: new Date().toISOString(), fallbackUsed: true, diagnostics: inspect };
        }
        return {
          ok: true,
          clicked: false,
          directApply: true,
          inCardApply: false,
          openJobUrl: fallbackTarget.item.url,
          selected: [fallbackTarget.item],
          selectedCount: 1,
          page: location.href,
          clickedAt: new Date().toISOString(),
          fallbackUsed: true,
          diagnostics: inspect
        };
      }
      return {
        ok: false,
        error: candidates.length ? "Naukri did not confirm any selected job checkbox." : "No selectable Naukri recommended jobs were available.",
        selected: [],
        diagnostics: { ...inspect, selectedCount: 0 }
      };
    }

    applyButton = findApplyButton();
    const enabled = await waitUntil(() => buttonEnabled(findApplyButton()), 2600, 100);
    applyButton = findApplyButton();
    if (!applyButton || !enabled) {
      if (selected.length === 1) {
        const selectedRow = all.find((row) => String(row.item?.jobId) === String(selected[0]?.jobId));
        const direct = selectedRow?.directApply || directApplyFor(selectedRow?.card);
        const explicitInCard = direct?.tagName !== "A" ? direct : null;
        if (explicitInCard) {
          fireClick(explicitInCard);
          return { ok: true, clicked: true, directApply: true, inCardApply: true, selected, selectedCount: selected.length, page: location.href, clickedAt: new Date().toISOString(), unverifiedSelectionUsed, diagnostics: inspect };
        }
        if (!selected[0]?.url) return { ok: false, error: "No supported Naukri job detail link or Apply control is available.", selected, diagnostics: inspect };
        return { ok: true, clicked: false, directApply: true, inCardApply: false, openJobUrl: selected[0]?.url, selected, selectedCount: selected.length, page: location.href, clickedAt: new Date().toISOString(), unverifiedSelectionUsed, diagnostics: inspect };
      }
      return {
        ok: false,
        error: "Naukri did not expose an enabled bulk Apply button or a native Apply control for the selected job.",
        selected,
        diagnostics: { ...inspect, selectedCount: selected.length, applyButtonFound: Boolean(applyButton), applyButtonDisabled: !buttonEnabled(applyButton), unverifiedSelectionUsed }
      };
    }
    fireClick(applyButton);
    return { ok: true, clicked: true, selected, selectedCount: selected.length, page: location.href, clickedAt: new Date().toISOString(), unverifiedSelectionUsed, degradedToSingle, requestedBatchSize: requestedLimit, diagnostics: inspect };
  } catch (bridgeError) {
    return { ok: false, error: "Naukri auto-apply bridge exception: " + (bridgeError?.message || String(bridgeError)) };
  }
}

/* ========================================================================== */
/* 4. FOORILLA EXTRACTOR BRIDGE                                               */
/* ========================================================================== */

function foorillaExtractor() {
  try {
    const absolute = (href) => { try { return new URL(href, location.href).href; } catch { return ""; } };
    const anchors = [...document.querySelectorAll("a[href*='/hiring/jobs/']")];
    const seen = new Set();
    const rows = [];
    for (const anchor of anchors) {
      const href = absolute(anchor.getAttribute("href"));
      if (!href || seen.has(href) || /\/hiring\/jobs\/(?:top)?\/?(?:[?#].*)?$/.test(href)) continue;
      const title = String(anchor.innerText || anchor.textContent || "").replace(/\s+/g," ").trim();
      if (!title || title.length < 3 || /^(latest|followed|saved|companies|following|viewed|applied|top)$/i.test(title)) continue;
      const container = anchor.closest("li, article, [class*='job'], [class*='card'], [class*='item'], div") || anchor.parentElement;
      const text = String(container?.innerText || container?.textContent || title).replace(/\s+/g," ").trim().slice(0,1600);
      rows.push({ href, title, text });
      seen.add(href);
      if (rows.length >= 120) break;
    }
    return { page: location.href, title: document.title, rows };
  } catch {
    return { page: location.href, title: document.title, rows: [] };
  }
}

/* ========================================================================== */
/* 5. HIRINGCAFE EXTRACTOR BRIDGE                                            */
/* ========================================================================== */

function hiringCafeExtractor() {
  try {
    const absolute = (href) => { try { return new URL(href, location.href).href; } catch { return ""; } };
    const anchors = [...document.querySelectorAll("a[href*='/job/'], a[href*='/viewjob/']")];
    const seen = new Set();
    const rows = [];
    for (const anchor of anchors) {
      const href = absolute(anchor.getAttribute("href"));
      if (!href || seen.has(href)) continue;
      const container = anchor.closest("article, li, [class*='job'], [class*='card'], [class*='result'], [role='listitem']") || anchor.parentElement?.parentElement || anchor.parentElement;
      const text = String(container?.innerText || container?.textContent || anchor.innerText || "").replace(/\s+/g, " ").trim().slice(0, 2600);
      const anchorText = String(anchor.innerText || anchor.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text.length < 8) continue;
      const titleNode = container?.querySelector("h1,h2,h3,h4,[class*='title'],[data-testid*='title']");
      const title = String(titleNode?.innerText || titleNode?.textContent || anchorText || "").replace(/\s+/g, " ").trim().slice(0, 260);
      rows.push({ href, title, text });
      seen.add(href);
      if (rows.length >= 120) break;
    }
    return { page: location.href, title: document.title, rows };
  } catch {
    return { page: location.href, title: document.title, rows: [] };
  }
}

/* ========================================================================== */
/* 6. NAUKRI JOB DETAIL APPLY BRIDGE                                         */
/* ========================================================================== */

function naukriJobDetailApplyBridge() {
  try {
    const isHidden = (n) => {
      if (!n || n.hidden || n.getAttribute("aria-hidden") === "true") return true;
      const style = getComputedStyle(n);
      return style.display === "none" || style.visibility === "hidden" || n.getClientRects().length === 0;
    };
    const jobKey = location.origin + location.pathname;
    if (window.__applyraJobDetailApplyJobKey !== jobKey) {
      window.__applyraJobDetailApplyJobKey = jobKey;
      window.__applyraJobDetailApplyClicked = false;
    }
    const text = (v) => String(v || '').replace(/\s+/g, ' ').trim();
    const bodyText = text(document.body?.innerText || document.body?.textContent || '');

    // 1. Check for confirmed applied or already applied states
    const alreadyAppliedBtn = [...document.querySelectorAll("button, [role='button'], a, input[type='button']")].find((n) => {
      if (isHidden(n)) return false;
      const t = text(n.value || n.innerText || n.textContent);
      const cls = String(n.className || '');
      return n.id === 'already-applied' || /^(?:already applied|applied)$/i.test(t) || /(?:already-applied|alreadyApplied)/i.test(cls);
    });
    const successMsg = /(?:you have successfully applied|application (?:has been )?(?:submitted|sent) successfully|applied successfully to|application submitted successfully)/i.test(bodyText);

    if (alreadyAppliedBtn || successMsg) {
      window.__applyraJobDetailApplyClicked = true;
      return { ok: true, status: "applied", alreadyApplied: true, clicked: false, message: successMsg ? "Successfully applied" : "Already applied" };
    }

    // 2. Check for active follow-up questions / chatbot drawer
    const chatbot = document.querySelector('.chatbot_Drawer, ._chatBotContainer, [class*="chatbot_Drawer"], [class*="chatbot_container"], [role="dialog"][aria-modal="true"]');
    if (chatbot && !isHidden(chatbot)) {
      window.__applyraJobDetailApplyClicked = true;
      return { ok: true, status: "followup", alreadyApplied: false, clicked: true, message: "Naukri follow-up or screening drawer is open" };
    }

    // 3. If already clicked previously, check for any visible success toasts / snackbars
    const activeSnackbar = document.querySelector('.ss-snackbar.ss-snackbar-active, [class*="snackbar"][class*="success"], [role="alert"]');
    if (activeSnackbar && !isHidden(activeSnackbar)) {
      const snText = text(activeSnackbar.innerText || activeSnackbar.textContent);
      if (/\b(?:failed|unable|error|not applied|not submitted|unsuccessful)\b/i.test(snText)) {
        return { ok: false, status: "failed", clicked: Boolean(window.__applyraJobDetailApplyClicked), error: snText };
      }
      if (/(?:successfully applied|applied successfully|application (?:has been )?(?:submitted|sent)(?: successfully)?|already applied)/i.test(snText)) {
        return { ok: true, status: "applied", alreadyApplied: true, clicked: true, message: snText };
      }
    }

    if (window.__applyraJobDetailApplyClicked) {
      return { ok: true, status: "waiting", alreadyApplied: false, clicked: true };
    }

    // 4. Find Apply button
    const controls = [...document.querySelectorAll("button, [role='button'], a[href*='apply'], a.apply-button, [class*='apply']")];
    const btn = controls.find((n) => {
      if (isHidden(n) || n.disabled || n.getAttribute?.("aria-disabled") === "true") return false;
      const t = text(n.innerText || n.textContent);
      const cls = String(n.className || '');
      const isApplyText = /^(?:apply|apply on company site|apply on website|apply now|i am interested|quick apply|easy apply)$/i.test(t) ||
        /\b(?:apply now|apply on company site|apply on website)\b/i.test(t) ||
        (/^(?:apply)$/i.test(t.split('\n')[0]?.trim()));
      const isApplyClass = /(?:^|\s)(?:apply-button|apply_button|applyBtn|apply-btn|styles_apply-button)(?:\s|$|__)/i.test(cls);
      const isApplyId = /^(?:apply-button|apply_button|applyBtn)$/i.test(n.id || '');
      return isApplyText || isApplyClass || isApplyId;
    });

    if (btn) {
      btn.scrollIntoView?.({ block: "center", behavior: "instant" });
      try {
        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      } catch {}
      btn.click();
      window.__applyraJobDetailApplyClicked = true;
      return { ok: true, status: "clicked", clicked: true, alreadyApplied: false, control: { label: text(btn.innerText || btn.textContent || btn.value), id: btn.id || "", tag: btn.tagName }, jobKey };
    }

    return { ok: false, status: "not-found", error: "Apply button not found on job detail page" };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}
