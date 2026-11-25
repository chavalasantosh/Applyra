let activeNaukriTab = null;
let radarEnabledProviders = ["foorilla", "hiringcafe", "remotive"];
const EXTRACTOR_VERSION = "2.8.0";

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

function sendRuntimeMessage(message) {
  return globalThis.NowCurryMessage.sendRuntime(chrome, message, { timeoutMs: 12000 });
}

function sendTabMessage(tabId, message) {
  return globalThis.NowCurryMessage.sendTab(chrome, tabId, message, { timeoutMs: 12000 });
}

function isNaukriUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "naukri.com" || hostname.endsWith(".naukri.com");
  } catch {
    return false;
  }
}

function safeHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

async function openAuthPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  let returnUrl = '';
  if (tab?.url) {
    try {
      const parsed = new URL(tab.url);
      if (parsed.protocol === 'chrome-extension:' && parsed.hostname === chrome.runtime.id) {
        const file = parsed.pathname.replace(/^\//, '');
        if (file && file !== 'index.html' && file !== 'auth.html') {
          returnUrl = file + parsed.search;
        }
      }
    } catch {}
  }
  const target = returnUrl ? `auth.html?return=${encodeURIComponent(returnUrl)}` : 'auth.html';
  return chrome.tabs.create({ url: chrome.runtime.getURL(target) });
}

let authGateInitialized = false;

async function initializeAuthGate() {
  const accountStatus = document.getElementById("account-status");
  const appContent = document.getElementById("app-content");
  const gate = document.getElementById("auth-gate");
  const action = document.getElementById("account-action");
  const open = document.getElementById("auth-open");
  const logoutBtn = document.getElementById("account-logout");

  if (!authGateInitialized) {
    action?.addEventListener("click", openAuthPage);
    open?.addEventListener("click", openAuthPage);
    logoutBtn?.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "...";
      try {
        await sendRuntimeMessage({ type: "AUTH_SIGN_OUT" });
      } catch (err) {
        console.error("Sign out error:", err);
      }
      await initializeAuthGate();
      logoutBtn.disabled = false;
      logoutBtn.textContent = "Log out";
    });
    authGateInitialized = true;
  }

  const auth = await sendRuntimeMessage({ type: "AUTH_GET_STATUS" }).catch(() => null);
  if (!auth?.ok) {
    if (accountStatus) accountStatus.textContent = "Auth status unavailable";
    if (logoutBtn) logoutBtn.style.display = "none";
    return true;
  }
  if (!auth.configured) {
    if (accountStatus) accountStatus.textContent = "Secure login not configured yet";
    if (action) action.textContent = "Set up";
    if (logoutBtn) logoutBtn.style.display = "none";
    return true;
  }
  if (auth.authenticated) {
    if (accountStatus) accountStatus.textContent = `${auth.user?.email || "Signed in"} · ${auth.providerLabel || "Account"}`;
    if (action) action.textContent = "Manage";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    appContent?.classList.remove("hidden");
    gate?.classList.add("hidden");
    return true;
  }
  if (accountStatus) accountStatus.textContent = "Signed out";
  if (action) action.textContent = "Sign in";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (auth.config?.requireAuth !== false) {
    appContent?.classList.add("hidden");
    gate?.classList.remove("hidden");
    const statusText = document.getElementById("status-text");
    if (statusText) statusText.textContent = "Sign in to unlock your Applyra workspace.";
    return false;
  }
  return true;
}


async function refreshVisibleStats() {
  const data = await chrome.storage.local.get(["jobs", "runs", "history"]);
  document.getElementById("job-count").textContent = Array.isArray(data.jobs) ? data.jobs.length : 0;
  document.getElementById("run-count").textContent = Array.isArray(data.runs) ? data.runs.length : 0;
  document.getElementById("history-count").textContent = Array.isArray(data.history) ? data.history.length : 0;
}

async function ensureDownloadPermission() {
  return chrome.permissions.request({ permissions: ["downloads"] }).catch(() => false);
}

const PROVIDER_ORIGINS = {
  foorilla: ["https://foorilla.com/*", "https://www.foorilla.com/*"],
  hiringcafe: ["https://hiring.cafe/*", "https://www.hiring.cafe/*", "https://hiringcafe.com/*", "https://www.hiringcafe.com/*"],
  remotive: ["https://remotive.com/*"],
  adzuna: ["https://api.adzuna.com/*"]
};

async function ensureRadarPermissions() {
  if (!chrome.permissions?.contains) return true;
  const origins = [...new Set(radarEnabledProviders.flatMap((id) => PROVIDER_ORIGINS[id] || []))];
  if (!origins.length) return true;
  try {
    const hasAll = await chrome.permissions.contains({ origins });
    if (hasAll) return true;
  } catch {}
  if (!chrome.permissions?.request) return false;
  return chrome.permissions.request({ origins }).catch(() => false);
}

async function backupLocalData() {
  const granted = await ensureDownloadPermission();
  if (!granted) throw new Error("Download permission was not granted.");
  const response = await sendRuntimeMessage({ type: "EXPORT_PRIVATE_BACKUP" });
  if (!response?.ok) throw new Error(response?.error || "Private backup failed.");
  return response;
}


function openDashboard({ scan = false, profile = false, history = false, settings = false, target = 100, untilLast = false } = {}) {
  const source = activeNaukriTab?.id ? `&sourceTab=${encodeURIComponent(activeNaukriTab.id)}` : "";
  const query = settings
    ? "?settings=1"
    : profile
    ? `?profile=1${source}`
    : history
    ? `?history=1${source}`
    : scan ? `?scan=1&target=${encodeURIComponent(target)}&untilLast=${untilLast ? "1" : "0"}${source}` : "";
  chrome.tabs.create({ url: chrome.runtime.getURL(`index.html${query}`) });
  window.close();
}

function openAutomationCenter(section = "") {
  chrome.tabs.create({ url: chrome.runtime.getURL(`apply-engine.html${section ? `#${encodeURIComponent(section)}` : ""}`) });
  window.close();
}
function openCareerSuite() { chrome.tabs.create({ url: chrome.runtime.getURL('career-suite.html') }); window.close(); }
function openCompanyIntel() { chrome.tabs.create({ url: chrome.runtime.getURL('company-intel.html') }); window.close(); }
function openNaukriProfileMirror(capture=false) { chrome.tabs.create({ url: chrome.runtime.getURL(`naukri-profile.html${capture ? '?capture=1' : ''}`) }); window.close(); }


async function initializeCandidateSwitcher() {
  const select = document.getElementById("active-candidate");
  const meta = document.getElementById("candidate-meta");
  const manage = document.getElementById("candidate-manage");
  if (!select || !meta || !manage) return;
  manage.addEventListener("click", () => openAutomationCenter("team"));
  const resp = await sendRuntimeMessage({ type: "GET_TEAM_WORKSPACE" }).catch(() => null);
  const workspace = resp?.workspace;
  const candidates = Array.isArray(workspace?.candidates) ? workspace.candidates : [];
  if (!candidates.length) {
    select.innerHTML = '<option value="">No candidates yet</option>';
    select.disabled = true; meta.textContent = "create one"; return;
  }
  select.innerHTML = candidates.map((candidate) => {
    const profile = candidate?.profile || {};
    const label = profile.name || profile.email || profile.targetRoles || "Unnamed candidate";
    const archived = candidate.status === "archived" ? " (archived)" : "";
    return `<option value="${String(candidate.id || "").replace(/[&<>"']/g, "")}">${label.replace(/[&<>]/g, "")}${archived}</option>`;
  }).join("");
  select.value = workspace.activeCandidateId || candidates[0].id;
  meta.textContent = `${candidates.filter((c) => c.status !== "archived").length} active`;
  select.addEventListener("change", async () => {
    const next = { ...workspace, activeCandidateId: select.value, updatedAt: new Date().toISOString() };
    const saved = await sendRuntimeMessage({ type: "SAVE_TEAM_WORKSPACE", workspace: next }).catch(() => null);
    if (!saved?.ok) { meta.textContent = "switch failed"; return; }
    meta.textContent = "switched";
  });
}

async function resolveActiveBrowserTab() {
  // Brave/Chromium can reject current-window resolution in popup contexts.
  // Prefer the last focused browser window, then fall back to any active tab.
  const attempts = [
    { active: true, lastFocusedWindow: true },
    { active: true }
  ];
  for (const query of attempts) {
    try {
      const tabs = await chrome.tabs.query(query);
      const tab = Array.isArray(tabs) ? tabs.find((candidate) => Number.isFinite(candidate?.id)) : null;
      if (tab) return tab;
    } catch {}
  }
  return null;
}

async function initialize() {
  const authAllowed = await initializeAuthGate();
  if (!authAllowed) return;
  const tab = await resolveActiveBrowserTab();
  const status = document.getElementById("status");
  const statusText = document.getElementById("status-text");
  const start = document.getElementById("start");
  const current = document.getElementById("current");
  const targetLabel = document.getElementById("target-label");
  const targetInput = document.getElementById("target");
  const untilLastInput = document.getElementById("until-last");
  const automationTitle = document.getElementById("automation-title");
  const automationText = document.getElementById("automation-text");
  let mode = "unsupported";
  await refreshVisibleStats().catch(() => {});
  await initializeCandidateSwitcher().catch(() => {});
  const radarStatus = await sendRuntimeMessage({ type: "GET_JOB_RADAR_STATUS" }).catch(() => null);
  if (Array.isArray(radarStatus?.radarConfig?.enabledProviders) && radarStatus.radarConfig.enabledProviders.length) radarEnabledProviders = radarStatus.radarConfig.enabledProviders;

  if (chrome.runtime?.sendMessage) {
    const automation = await sendRuntimeMessage({ type: "GET_PROFILE_REFRESH_STATUS" }).catch(() => null);
    const schedule = automation?.profileRefresh;
    if (automation?.retired) {
      automationTitle.textContent = "Profile refresh is manual";
      automationText.textContent = "Background refresh is retired. Use Profile Mirror → Capture from Naukri when you want to refresh it.";
    } else if (schedule?.enabled) {
      automationTitle.textContent = "Profile automation enabled";
      automationText.textContent = `${schedule.cadence === "six-hourly" ? "Every 6 hours" : schedule.cadence === "hourly" ? "Every hour" : "Once a day"} · next check ${schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString([], { hour: "numeric", minute: "2-digit" }) : "soon"}`;
    } else {
      automationTitle.textContent = "Profile refresh is manual";
      automationText.textContent = "Use Profile Mirror → Capture from Naukri when you want to refresh it.";
    }
  }

  if (tab?.id && isNaukriUrl(tab.url)) {
    activeNaukriTab = tab;
    let ping = await sendTabMessage(tab.id, { type: "PING" }).catch(() => null);
    if (ping?.extractorVersion && ping.extractorVersion !== EXTRACTOR_VERSION) {
      // Never stack two content-script generations in the same isolated world.
      // Reload first so the old listener is removed, then let the current
      // manifest script attach cleanly.
      await chrome.tabs.reload(tab.id);
      const deadline = Date.now() + 18000;
      ping = null;
      while (Date.now() < deadline && !ping) {
        await new Promise(resolve => setTimeout(resolve, 450));
        ping = await sendTabMessage(tab.id, { type: "PING" }).catch(() => null);
      }
    }
    if (!ping || ping.extractorVersion !== EXTRACTOR_VERSION) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      ping = await sendTabMessage(tab.id, { type: "PING" });
    }
    const inspector = document.getElementById("page-inspector");
    if (ping) {
      const d = ping.diagnostics || {};
      const cards = d.jobCards ?? d.cards ?? d.links ?? "—";
      inspector.textContent = `Live page inspector: ${ping.pageMode || "unknown"} · session ${ping.sessionState || "unknown"} · visible items ${cards}`;
    } else {
      inspector.textContent = "Live page inspector: content script did not respond.";
    }
    if (ping?.pageMode === "search-results") {
      mode = "scan";
      status.classList.add("ready");
      statusText.textContent = "Search Results detected. Ready to extract job cards.";
    } else if (ping?.pageMode === "application-history") {
      mode = "scan";
      status.classList.add("ready");
      statusText.textContent = "My Applications detected. Ready to extract your application history.";
      targetLabel.innerHTML = "Application target<br><small>Change it during the run.</small>";
      start.textContent = "Extract application history";
      current.textContent = "Extract this history page only";
    } else if (ping?.pageMode === "account-history") {
      mode = "history";
      status.classList.add("ready");
      statusText.textContent = "Naukri account activity detected. Backfill the visible history into your private timeline.";
      targetLabel.innerHTML = "History backfill<br><small>Only records visible on this page are captured.</small>";
      targetInput.disabled = true;
      untilLastInput.disabled = true;
      start.textContent = "Backfill visible account history";
      current.textContent = "Open history workspace";
    } else if (ping?.pageMode === "profile") {
      mode = "profile";
      status.classList.add("ready");
      statusText.textContent = "Naukri profile detected. Capture the visible job-fit fields for this user.";
      targetLabel.innerHTML = "Profile capture<br><small>No credentials are read or stored.</small>";
      targetInput.disabled = true;
      untilLastInput.disabled = true;
      start.textContent = "Capture my Naukri profile";
      current.textContent = "Open profile workspace";
    } else {
      const labels = { login: "Sign in directly on Naukri first. Applyra never asks for your Naukri password.", "job-detail": "This is one job detail. Open My Applications or Search Results." };
      statusText.textContent = labels[ping?.pageMode] || "Unsupported Naukri page. Open My Applications or Search Results.";
      start.disabled = true;
      current.disabled = true;
    }
  } else {
    statusText.textContent = "Open Naukri, sign in there, then open your Profile, My Applications, or Search Results. The workspace and CSV import still work.";
    start.disabled = true;
    current.disabled = true;
  }

  start.addEventListener("click", () => {
    if (mode === "profile") {
      openNaukriProfileMirror(true);
      return;
    }
    if (mode === "history") {
      openDashboard({ history: true });
      return;
    }
    const target = Math.max(1, Math.min(100000, Number(document.getElementById("target").value) || 100));
    const untilLast = document.getElementById("until-last").checked;
    openDashboard({ scan: true, target, untilLast });
  });
  current.addEventListener("click", () => mode === "profile"
    ? openNaukriProfileMirror(false)
    : mode === "history" ? openDashboard({ history: true }) : openDashboard({ scan: true, target: 1, untilLast: false }));
  document.getElementById("open").addEventListener("click", () => openDashboard());
  document.getElementById("automation-center").addEventListener("click", () => openAutomationCenter());
  document.getElementById("career-suite")?.addEventListener("click", () => openCareerSuite());
  document.getElementById("company-intel")?.addEventListener("click", () => openCompanyIntel());
  document.getElementById("admin-console")?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("admin.html") });
    window.close();
  });
  document.getElementById("settings").addEventListener("click", () => openDashboard({ settings: true }));
  document.getElementById("quick-search").addEventListener("click", () => openCompanyIntel());
  document.getElementById("quick-profile").addEventListener("click", () => openCareerSuite());
  document.getElementById("profile-mirror")?.addEventListener("click", () => openNaukriProfileMirror(false));
  document.getElementById("backup").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const old = button.textContent;
    if (!confirm("Create a PRIVATE Applyra backup? It may contain your profile, applications, Answer Vault answers and career data. Do not send this file to support.")) return;
    button.disabled = true; button.textContent = "Preparing…";
    if (globalThis.ApplyraDownloadToast) {
      ApplyraDownloadToast.show({ filename: "Applyra-private-backup.json", status: "started" });
    }
    try {
      const res = await backupLocalData();
      button.textContent = "✓ Private backup ready";
      if (globalThis.ApplyraDownloadToast) {
        ApplyraDownloadToast.show({ filename: res?.filename || "Applyra-private-backup.json", status: "complete" });
      }
    }
    catch (error) {
      button.textContent = "Backup failed";
      console.error(error);
      if (globalThis.ApplyraDownloadToast) {
        ApplyraDownloadToast.show({ filename: "Applyra-private-backup.json", status: "error", error: error?.message || "Failed" });
      }
    }
    setTimeout(() => { button.disabled = false; button.textContent = old; }, 1800);
  });
  document.getElementById("refresh-stats").addEventListener("click", refreshVisibleStats);

  // Apply Access Control DOM guards (hides admin console for normal users)
  if (globalThis.ApplyraAccessControl) {
    globalThis.ApplyraAccessControl.applyDOMGuards();
  }

  // Developer mode easter egg (5 clicks on version badge in popup)
  let badgeClicks = 0;
  const versionBadge = document.getElementById("version-badge");
  if (versionBadge) {
    versionBadge.addEventListener("click", async () => {
      badgeClicks++;
      if (badgeClicks >= 5) {
        badgeClicks = 0;
        const isDev = await globalThis.ApplyraAccessControl?.toggleDevMode?.();
        await globalThis.ApplyraAccessControl?.applyDOMGuards?.();
        if (globalThis.ApplyraDownloadToast) {
          ApplyraDownloadToast.show({
            filename: isDev ? "Developer Mode Enabled" : "Developer Mode Disabled",
            status: "complete"
          });
        }
      }
    });
  }
}

initialize().catch((error) => {
  document.getElementById("status-text").textContent = error?.message || "Could not inspect this tab.";
});

async function searchRadar() {
  const input = document.getElementById("radar-query");
  const button = document.getElementById("radar-search");
  const meta = document.getElementById("radar-meta");
  const results = document.getElementById("radar-results");
  if (!input || !button || !meta || !results) return;
  const query = input.value.trim();
  button.disabled = true; button.textContent = "…"; meta.textContent = "Searching Applyra Live Radar index…"; results.innerHTML = "";
  try {
    const granted = await ensureRadarPermissions();
    if (!granted) throw new Error("Provider site permission was not granted.");
    const response = await sendRuntimeMessage({ type: "SEARCH_JOB_RADAR", query, limit: 25 });
    if (!response?.ok) throw new Error(response?.error || "Radar search failed");
    meta.textContent = `${response.jobs.length} calibrated opportunities in Applyra Radar`;
    if (!response.jobs.length) { results.innerHTML = '<div class="radar-job"><b>No matches yet</b><small>Try a broader role or skill.</small></div>'; return; }
    response.jobs.slice(0, 8).forEach(job => {
      const node = document.createElement("div"); node.className = "radar-job";
      const score = Number.isFinite(job.intelligence?.matchScore) ? `${job.intelligence.matchScore}%` : "";
      node.innerHTML = `<span class="radar-score">${score}</span><b></b><small></small>`;
      node.querySelector("b").textContent = job.position?.title || "Untitled role";
      const salary = job.compensation?.text ? ` · ${job.compensation.text}` : "";
      node.querySelector("small").textContent = `${job.company?.name || "Enterprise Employer"} · ${job.location?.display || "Location not listed"}${salary} · Applyra Verified Feed`;
      node.addEventListener("click", () => {
        openCompanyIntel();
      });
      results.appendChild(node);
    });
  } catch (error) { meta.textContent = error?.message || "Radar search failed"; }
  finally { button.disabled = false; button.textContent = "Search"; }
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("radar-search"); const input = document.getElementById("radar-query");
  button?.addEventListener("click", searchRadar); input?.addEventListener("keydown", e => { if (e.key === "Enter") searchRadar(); });
});
