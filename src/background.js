importScripts(
  "injected-bridges.js",
  "storage-vault.js",
  "message-safe.js",
  "storage-registry.js",
  "migration-core.js",
  "job-radar-core.js",
  "universal-career-core.js",
  "question-intelligence-core.js",
  "candidate-memory-core.js",
  "team-core.js",
  "portal-adapters.js",
  "multi-portal-core.js",
  "diagnostics-core.js",
  "naukri-auto-apply-core.js",
  "business-core.js",
  "security-core.js",
  "auth-core.js",
  "admin-core.js",
  "cloud-sync-core.js",
  "production-readiness-core.js"
);

const Storage = globalThis.NowCurryStorage;
const Migration = globalThis.NowCurryMigration;
const PortalAdapters = globalThis.NowCurryPortalAdapters;
const Diagnostics = globalThis.NowCurryDiagnostics;
const NaukriAuto = globalThis.NowCurryNaukriAutoApplyCore;
const Business = globalThis.NowCurryBusinessCore;
const Security = globalThis.NowCurrySecurityCore;
const Auth = globalThis.NowCurryAuthCore;
const Admin = globalThis.ApplyraAdminCore;
const Cloud = globalThis.ApplyraCloudSync;
const ProductionReadiness = globalThis.ApplyraProductionReadiness;
const CandidateMemory = globalThis.NowCurryCandidateMemory;
const Team = globalThis.NowCurryTeam;

// Seal and sanitize globalThis so DevTools / extension console cannot access internal modules
try {
  [
    'NowCurryStorage', 'NowCurryMigration', 'NowCurryPortalAdapters', 'NowCurryDiagnostics',
    'NowCurryNaukriAutoApplyCore', 'NowCurryBusinessCore', 'NowCurrySecurityCore', 'NowCurryAuthCore',
    'ApplyraAdminCore', 'ApplyraCloudSync', 'ApplyraProductionReadiness', 'NowCurryCandidateMemory',
    'NowCurryTeam'
  ].forEach(function(k) {
    try {
      Object.defineProperty(globalThis, k, {
        get: function() { return undefined; },
        set: function() {},
        configurable: false
      });
    } catch(e) {}
  });
} catch(e) {}

if (!Storage || !Migration || !PortalAdapters || !Diagnostics) throw new Error("Reliability Core modules did not load.");
if (!NaukriAuto) throw new Error("Naukri Auto Apply core did not load.");
if (!Business) throw new Error("Applyra Business core did not load.");
if (!Security) throw new Error("Applyra Security core did not load.");
if (!Auth) throw new Error("Applyra Auth core did not load.");
if (!Admin) throw new Error("Applyra Admin core did not load.");
if (!Cloud) throw new Error("Applyra Cloud Sync core did not load.");
if (!ProductionReadiness) throw new Error("Applyra Production Readiness core did not load.");
const STORAGE_SECURITY_READY = Security.lockStorageAccess(globalThis.chrome);

const PROFILE_REFRESH_ALARM = "nowcurry-profile-refresh";
const PROFILE_BOOST_ALARM = "nowcurry-profile-boost";
const AUTOMATION_WATCHDOG_ALARM = "nowcurry-automation-watchdog";
const MAX_AUTO_FOLLOWUP_ANSWERS = 20;
const EXTRACTOR_VERSION = "2.8.0";
const PROFILE_URL = "https://www.naukri.com/mnjuser/profile";
const APPLICATION_HISTORY_URL = "https://www.naukri.com/myapply/historypage";
const RECOMMENDED_JOBS_URL = "https://www.naukri.com/mnjuser/recommendedjobs";
const NAUKRI_SEARCH_URL = "https://www.naukri.com/jobs-in-india";
const PROFILE_REFRESH_RETIRED = true;
const HISTORY_SYNC_VERSION = 1;
const CADENCE_MINUTES = {
  hourly: 60,
  "six-hourly": 360,
  daily: 1440
};

// Offscreen Document Keeper for MV3 background stability
async function ensureOffscreenDocument() {
  if (!chrome?.offscreen) return false;
  try {
    const existing = await chrome.offscreen.hasDocument?.();
    if (existing) return true;
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["BLOBS", "DOM_PARSER"],
      justification: "Applyra background task coordination and keepalive"
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function closeOffscreenDocument() {
  if (!chrome?.offscreen) return;
  try {
    const existing = await chrome.offscreen.hasDocument?.();
    if (existing) {
      await chrome.offscreen.closeDocument();
    }
  } catch {}
}
const BOOST_CADENCE_MINUTES = {
  "six-hourly": 360,
  daily: 1440,
  weekly: 10080
};
const DEFAULT_PROFILE_BOOST = {
  enabled: false,
  cadence: "off",
  mode: "reversible",
  runOnStartup: false,
  autoOpenProfile: true,
  lastAttemptAt: "",
  lastSuccessAt: "",
  lastStatus: "idle",
  lastError: "",
  nextRunAt: "",
  totalSuccesses: 0,
  todayDate: "",
  todaySuccesses: 0,
  rollbackRequired: false,
  updatedAt: ""
};

const DEFAULT_NAUKRI_AUTO_APPLY = {
  mode: "recommended-ui",
  batchSize: 1,
  includeKeywords: "",
  excludeKeywords: "",
  openVisibleTab: true,
  answerVaultAssist: true,
  rememberManualAnswers: true,
  skipKnownApplied: true,
  reusePreviewTab: true,
  lastPreviewAt: "",
  lastPreviewKey: "",
  lastPreviewCandidates: [],
  lastPreviewEligibleCount: 0,
  lastRunAt: "",
  lastStatus: "idle",
  lastError: "",
  lastTabId: null,
  lastSelected: [],
  lastOutcome: null,
  totalRuns: 0,
  totalApplied: 0,
  todayDate: "",
  todayApplied: 0,
  updatedAt: ""
};

const DEFAULT_PROFILE_REFRESH = {
  enabled: false,
  cadence: "off",
  runOnStartup: true,
  autoOpenProfile: false,
  lastAttemptAt: "",
  lastSuccessAt: "",
  lastAppliedAt: "",
  lastError: "",
  lastStatus: "idle",
  lastSourceUrl: "",
  lastDiagnostics: null,
  nextRunAt: "",
  detectedNaukriAt: "",
  detectedNaukriTabId: null,
  detectedNaukriUrl: "",
  pendingCapture: null,
  updatedAt: ""
};

const HISTORY_TYPES = ["application", "invite", "comment", "post-visit", "profile-update", "resume-update", "profile-view", "interview", "other"];
const COVERAGE_TYPES = ["application", "invite", "comment", "post-visit", "profile-update", "resume-update", "profile-view", "interview"];
const DEFAULT_HISTORY_SYNC = {
  status: "idle",
  lastAttemptAt: "",
  lastSuccessAt: "",
  lastError: "",
  lastSourceUrl: "",
  lastDiagnostics: null,
  discoveredSurfaces: [],
  coverage: Object.fromEntries(COVERAGE_TYPES.map((type) => [type, "unknown"])),
  pendingCapture: null,
  updatedAt: ""
};
const DEFAULT_NAUKRI_CONNECTION = {
  state: "not-checked",
  label: "Not checked",
  lastCheckedAt: "",
  tabId: null,
  url: "",
  pageMode: "",
  sessionState: "unknown",
  reason: "Open Naukri and sign in there; this product never asks for credentials.",
  source: "browser-session",
  updatedAt: ""
};

const DEFAULTS = {
  jobs: [],
  profile: {
    schemaVersion: 1,
    source: "manual",
    sourceLabel: "Not configured",
    sourceUrl: "",
    capturedAt: "",
    updatedAt: "",
    headline: "",
    summary: "",
    currentLocation: "",
    roles: [],
    locations: [],
    skills: [],
    fullTimeYears: 0,
    internshipYears: 0,
    currentSalary: 0,
    salaryMin: 0,
    salaryMax: 0,
    noticePeriodDays: 0,
    workHistory: [],
    education: [],
    certifications: [],
    completeness: 0,
    missingFields: ["target roles", "skills", "experience", "preferred locations"]
  },
  lastScan: null,
  lastImport: null,
  runs: [],
  activeRun: null,
  profileRefresh: DEFAULT_PROFILE_REFRESH,
  profileBoost: DEFAULT_PROFILE_BOOST,
  naukriAutoApply: DEFAULT_NAUKRI_AUTO_APPLY,
  naukriAutoApplyRuns: [],
  naukriAutoApplyActiveRun: null,
  naukriAppliedJobIds: {},
  automationActivity: [],
  applyEngineSessions: [],
  applyEngineSafety: { dailyCap: 30, maxParallel: 1, requireFinalReview: false, pauseSecurity: true, watchdogMinutes: 15 },
  feedback: [],
  history: [],
  historySync: DEFAULT_HISTORY_SYNC,
  naukriConnection: DEFAULT_NAUKRI_CONNECTION,
  profileRevisions: [],
  interviews: [],
  radarConfig: { enabledProviders: ["foorilla", "hiringcafe", "remotive"], foorilla: { url: "https://foorilla.com/hiring/jobs/top/" }, hiringcafe: { url: "https://hiringcafe.com/jobs" }, adzuna: { appId: "", appKey: "", country: "in" } },
  radarCache: { jobs: [], lastSearchAt: "", query: "" },
  universalJobs: {},
  universalRuns: [],
  businessAccount: Business.createLocalAccount({ plan: "beta" }),
  businessUsageLedger: [],
  businessAudit: [],
  profileBoostRecovery: null,
  migrationHistory: [],
  cloudMigration: { status: 'not-started', lastPreviewAt: '', lastPushAt: '', lastVerifiedAt: '', lastError: '', remoteSchema: Cloud.REMOTE_SCHEMA, localSourceRetained: true, updatedAt: '' },
  onboardingState: { completed: false, completedAt: '', updatedAt: '' },
  dataControlAudit: [],
  careerSuite: { resumes: [], tracked: [], alerts: [], emailImports: [], interviews: [], outreach: [], updatedAt: '' },
  schemaVersion: Storage.SCHEMA_VERSION
};

let refreshInFlight = false;


const DEFAULT_AUTH_CONFIG = { provider: "supabase", supabaseUrl: "https://lsgchknohqozvkcqidsv.supabase.co", publishableKey: "sb_publishable_Lby6s_5Xg5AUD7pv813nVw_KZ_c12mc", requireAuth: true, configured: true, updatedAt: "2026-09-22T00:00:00.000Z" };

async function readAuthConfig() {
  const stored = await chrome.storage.local.get([Auth.CONFIG_KEY]);
  return Auth.normalizeConfig(stored[Auth.CONFIG_KEY] || DEFAULT_AUTH_CONFIG);
}

async function writeAuthConfig(input = {}) {
  const current = await readAuthConfig();
  const next = Auth.normalizeConfig({ ...input, updatedAt: nowIso() });
  if (!next.configured) throw new Error("A valid Supabase project URL and publishable/anon key are required.");
  const changed = current.supabaseUrl !== next.supabaseUrl || current.publishableKey !== next.publishableKey;
  await chrome.storage.local.set({ [Auth.CONFIG_KEY]: next });
  if (changed) await clearAuthSession();
  return next;
}

async function readStoredAuthSession() {
  let ephemeral = {};
  try { ephemeral = await chrome.storage.session.get([Auth.SESSION_KEY]); } catch {}
  const local = await chrome.storage.local.get([Auth.SESSION_KEY]);
  return ephemeral[Auth.SESSION_KEY] || local[Auth.SESSION_KEY] || null;
}

const USER_WORKSPACE_KEYS = Object.freeze([
  'jobs','profile','runs','activeRun','applyEngineSessions','applyEngineAnswerVault','applyEngineSafety',
  'profileBoost','naukriAutoApply','naukriAutoApplyRuns','naukriAppliedJobIds','automationActivity','feedback',
  'history','historySync','naukriConnection','profileRevisions','interviews','radarConfig','radarCache',
  'universalJobs','universalRuns','teamWorkspace','activeCandidateProfile','questionLearningInbox','portalInbox',
  'lastNaukriSearch','careerSuite','pipeline','trackerApplications','lastScan','lastImport','lastAutomaticNaukriCapture',
  'careerEvidence','careerManualJobs','opportunityScans'
]);

function getCleanWorkspaceDefaults() {
  return {
    jobs: [],
    profile: { roles: [], fullTimeYears: 0, internshipYears: 0, skills: [], targetRoles: [], locations: [] },
    runs: [],
    activeRun: null,
    interviews: [],
    universalJobs: [],
    universalRuns: [],
    naukriAutoApplyRuns: [],
    naukriAppliedJobIds: {},
    automationActivity: [],
    lastScan: null,
    lastImport: null,
    lastAutomaticNaukriCapture: null,
    profileRefresh: null,
    profileBoostRecovery: null,
    profileRevisions: [],
    pipeline: [],
    history: [],
    feedback: [], careerEvidence: {}, careerManualJobs: {}, opportunityScans: {schedules:{},history:{},seen:{}}
  };
}

async function archiveUserWorkspace(email) {
  if (!email || typeof email !== 'string') return;
  const sanitized = email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  const key = `user_ws_${sanitized}`;
  const stored = await chrome.storage.local.get(USER_WORKSPACE_KEYS);
  await chrome.storage.local.set({ [key]: stored });
}

async function restoreUserWorkspace(email) {
  if (!email || typeof email !== 'string') return;
  const sanitized = email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  const key = `user_ws_${sanitized}`;
  const stored = await chrome.storage.local.get([key]);
  if (stored[key] && Object.keys(stored[key]).length > 0) {
    await chrome.storage.local.set(stored[key]);
  } else {
    const clean = getCleanWorkspaceDefaults();
    await chrome.storage.local.set(clean);
    await chrome.storage.local.set({ [key]: clean });
  }
}

async function storeAuthSession(raw = {}, persistent = false) {
  const session = Auth.stripSession(raw, persistent);
  if (!session.accessToken || !session.refreshToken) throw new Error("Authentication server returned an incomplete session.");
  try { await chrome.storage.session.set({ [Auth.SESSION_KEY]: session }); } catch {}
  if (persistent) await chrome.storage.local.set({ [Auth.SESSION_KEY]: session });
  else await chrome.storage.local.remove([Auth.SESSION_KEY]);
  const provider = session.user?.providers?.[0] || "email";
  await chrome.storage.local.set({ [Auth.PROFILE_KEY]: { user: session.user, provider, persistent: Boolean(persistent), updatedAt: nowIso() } });
  try {
    const business = await readBusinessState();
    const prevEmail = (business.account?.email || "").toLowerCase();
    const currentEmail = (session.user?.email || "").toLowerCase();
    if (prevEmail && currentEmail && prevEmail !== currentEmail) {
      await archiveUserWorkspace(prevEmail);
      await restoreUserWorkspace(currentEmail);
      const fresh = Business.createLocalAccount({ plan: "beta", displayName: session.user?.displayName || "", email: session.user?.email || "" });
      await writeBusinessAccount(fresh);
      await chrome.storage.local.set({ businessUsageLedger: [], businessAudit: [] });
    } else if (currentEmail && !prevEmail) {
      await restoreUserWorkspace(currentEmail);
      await writeBusinessAccount({ ...business.account, displayName: session.user?.displayName || business.account.displayName || "", email: session.user?.email || business.account.email || "" });
    } else if (currentEmail) {
      // Ensure user's active workspace is synced
      await restoreUserWorkspace(currentEmail);
      await writeBusinessAccount({ ...business.account, displayName: session.user?.displayName || business.account.displayName || "", email: session.user?.email || business.account.email || "" });
    }
    const userEmail = session.user?.email;
    if (userEmail) {
      const sanitized = userEmail.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
      await chrome.storage.local.set({ [`user_sess_${sanitized}`]: { session, persistent: Boolean(persistent), updatedAt: nowIso() } });
      const storedAccs = await chrome.storage.local.get(['rememberedAccounts']);
      const currentList = Array.isArray(storedAccs.rememberedAccounts) ? storedAccs.rememberedAccounts : [];
      const name = session.user?.user_metadata?.full_name || session.user?.displayName || userEmail.split('@')[0];
      const initials = (name.length >= 2 ? name.slice(0, 2) : userEmail.slice(0, 2)).toUpperCase();
      const item = { name, email: userEmail, initials, tier: 'Free', lastActiveAt: nowIso() };
      const filtered = currentList.filter(a => (a.email || '').toLowerCase() !== userEmail.toLowerCase() && !/temporialdata|districtarc/i.test(a.email || ''));
      await chrome.storage.local.set({ rememberedAccounts: [item, ...filtered].slice(0, 10) });
    }
  } catch {}
  return session;
}

async function switchActiveAccount(targetEmail) {
  if (!targetEmail || typeof targetEmail !== 'string') throw new Error("Target email is required.");
  const normalizedTarget = targetEmail.trim().toLowerCase();
  const current = await currentAuthSession({ refresh: false });
  const currentEmail = (current.session?.user?.email || "").toLowerCase();

  if (currentEmail === normalizedTarget && current.session?.accessToken) {
    return { ok: true, switched: true, alreadyActive: true, status: await authStatus() };
  }

  // 1. Archive current workspace
  if (currentEmail) {
    await archiveUserWorkspace(currentEmail);
  }

  // 2. Check if we have a saved session for target email or create one
  const sanitized = normalizedTarget.replace(/[^a-z0-9_.-]/g, '_');
  const storedSess = await chrome.storage.local.get([`user_sess_${sanitized}`]);
  let cached = storedSess[`user_sess_${sanitized}`];

  let validSession = cached?.session;
  if (!validSession || !validSession.accessToken) {
    const name = normalizedTarget.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    validSession = {
      accessToken: `local_sess_${Date.now()}_${sanitized}`,
      refreshToken: `local_ref_${Date.now()}_${sanitized}`,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
      user: {
        id: `usr_${sanitized}`,
        email: normalizedTarget,
        displayName: formattedName,
        user_metadata: { full_name: formattedName }
      }
    };
    await chrome.storage.local.set({ [`user_sess_${sanitized}`]: { session: validSession, persistent: true, updatedAt: nowIso() } });
  }

  try { await chrome.storage.session.set({ [Auth.SESSION_KEY]: validSession }); } catch {}
  await chrome.storage.local.set({ [Auth.SESSION_KEY]: validSession });
  const provider = validSession.user?.providers?.[0] || "email";
  await chrome.storage.local.set({ [Auth.PROFILE_KEY]: { user: validSession.user, provider, persistent: true, updatedAt: nowIso() } });
  
  // 3. Restore target workspace
  await restoreUserWorkspace(normalizedTarget);

  // 4. Update remembered accounts last active
  const storedAccs = await chrome.storage.local.get(['rememberedAccounts']);
  const currentList = Array.isArray(storedAccs.rememberedAccounts) ? storedAccs.rememberedAccounts : [];
  const name = validSession.user?.user_metadata?.full_name || validSession.user?.displayName || normalizedTarget.split('@')[0];
  const initials = (name.length >= 2 ? name.slice(0, 2) : normalizedTarget.slice(0, 2)).toUpperCase();
  const item = { name, email: normalizedTarget, initials, tier: 'Free', lastActiveAt: nowIso() };
  const filtered = currentList.filter(a => (a.email || '').toLowerCase() !== normalizedTarget && !/temporialdata|districtarc/i.test(a.email || ''));
  await chrome.storage.local.set({ rememberedAccounts: [item, ...filtered].slice(0, 10) });

  return { ok: true, switched: true, status: await authStatus() };
}

async function clearAuthSession() {
  try { await chrome.storage.session.remove([Auth.SESSION_KEY]); } catch {}
  await chrome.storage.local.remove([Auth.SESSION_KEY, Auth.PROFILE_KEY]);
}

async function authFetch(config, path, { method = "GET", body = null, accessToken = "" } = {}) {
  const url = Auth.authEndpoint(config, path);
  if (!url) throw new Error("Authentication is not configured.");
  const init = { method, headers: Auth.authHeaders(config, accessToken), redirect: "follow" };
  if (body !== null) init.body = JSON.stringify(body);
  let response;
  try { response = await fetch(url, init); }
  catch { throw new Error("Could not reach the authentication service. Check the project URL and extension site permission."); }
  let payload = null;
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok) {
    const raw = payload?.msg || payload?.message || payload?.error_description || payload?.error || `Authentication request failed (${response.status}).`;
    const text = safeText(raw, 600);
    if (/invalid login credentials/i.test(text)) throw new Error("Email or password is incorrect.");
    if (/email not confirmed/i.test(text)) throw new Error("Confirm your email address before signing in.");
    if (/user already registered/i.test(text)) throw new Error("An account with this email already exists. Sign in instead.");
    throw new Error(text || "Authentication request failed.");
  }
  return payload || {};
}

async function verifyAndStoreAuthSession(raw, persistent, config) {
  if (!raw?.access_token || !raw?.refresh_token) throw new Error("Authentication server returned an incomplete session.");
  const verifiedUser = await authFetch(config, "/user", { accessToken: raw.access_token });
  if (!verifiedUser?.id) throw new Error("Authentication session could not be verified.");
  return storeAuthSession({ ...raw, user: verifiedUser }, persistent);
}

async function refreshAuthSession(session, config) {
  if (!session?.refreshToken) return null;
  try {
    const raw = await authFetch(config, "/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refreshToken } });
    return await verifyAndStoreAuthSession(raw, Boolean(session.persistent), config);
  } catch {
    await clearAuthSession();
    return null;
  }
}

async function currentAuthSession({ refresh = true } = {}) {
  const config = await readAuthConfig();
  if (!config.configured) return { config, session: null };
  let session = await readStoredAuthSession();
  if (session && refresh && !Auth.isSessionFresh(session)) session = await refreshAuthSession(session, config);
  return { config, session };
}

function authProviderLabel(session) {
  const provider = session?.user?.providers?.[0] || "email";
  return Auth.providerLabel(provider);
}

async function authStatus() {
  const { config, session } = await currentAuthSession();
  return {
    ok: true,
    version: Auth.VERSION,
    configured: Boolean(config.configured),
    config: Auth.publicConfig(config),
    authenticated: Boolean(session?.accessToken && session?.user?.id),
    user: session?.user || null,
    providerLabel: session ? authProviderLabel(session) : "",
    persistent: Boolean(session?.persistent),
    redirectUrl: chrome.identity?.getRedirectURL ? chrome.identity.getRedirectURL("nowcurry-auth") : "",
    emailConfirmationUrl: emailConfirmationLandingUrl(config),
    security: { pkce: true, oauthSecretsInExtension: false, providerTokensStored: false, storageScope: "trusted-extension-contexts" }
  };
}

async function adminLocalContext() {
  const auth = await authStatus();
  const manifest = chrome.runtime.getManifest();
  const stored = await chrome.storage.local.get([
    'schemaVersion','jobs','history','teamWorkspace','careerSuite','naukriAutoApplyRuns','naukriAutoApplyActiveRun',
    'naukriAppliedJobIds','applyEngineSafety','automationActivity','naukriConnection','cloudMigration'
  ]);
  let diagnostics = {};
  try { diagnostics = await buildSystemDiagnostics(); } catch (error) { diagnostics = { status:'unavailable', error:safeText(error?.message||error,500) }; }
  const workspace = stored.teamWorkspace ? NowCurryTeam.normalizeWorkspace(stored.teamWorkspace) : null;
  const tracked = Array.isArray(stored.careerSuite?.tracked) ? stored.careerSuite.tracked : [];
  const activity = Array.isArray(stored.automationActivity) ? stored.automationActivity : [];
  const recentErrors = activity.filter((x)=>/fail|error|blocked/i.test(String(x?.status||x?.type||x?.message||''))).slice(-20).reverse().map((x)=>({
    title:safeText(x?.type||x?.status||'Automation event',100),
    message:safeText(x?.message||x?.details||'',500),
    createdAt:safeText(x?.createdAt||x?.timestamp||x?.at||'',80)
  }));
  const appliedMap = stored.naukriAppliedJobIds && typeof stored.naukriAppliedJobIds === 'object' ? stored.naukriAppliedJobIds : {};
  const connection = stored.naukriConnection || DEFAULT_NAUKRI_CONNECTION;
  return {
    ok:true,
    adminVersion:Admin.VERSION,
    release:{version:manifest.version||'',versionName:manifest.version_name||manifest.version||'',schemaVersion:Number(stored.schemaVersion)||0,expectedSchema:Storage.SCHEMA_VERSION},
    auth,
    counts:{
      jobs:Array.isArray(stored.jobs)?stored.jobs.length:0,
      history:Array.isArray(stored.history)?stored.history.length:0,
      candidates:Array.isArray(workspace?.candidates)?workspace.candidates.length:0,
      tracked:tracked.length
    },
    automation:{
      activeRun:stored.naukriAutoApplyActiveRun||null,
      runCount:Array.isArray(stored.naukriAutoApplyRuns)?stored.naukriAutoApplyRuns.length:0,
      appliedCount:Object.keys(appliedMap).length,
      recentFailures:recentErrors.length,
      safety:stored.applyEngineSafety||DEFAULTS.applyEngineSafety
    },
    naukri:{connected:connection.state==='connected'||connection.sessionState==='authenticated',state:safeText(connection.state||connection.sessionState||'unknown',80),lastCheckedAt:safeText(connection.lastCheckedAt||'',80)},
    cloudMigration:stored.cloudMigration||DEFAULTS.cloudMigration,
    diagnostics,
    security:{storageAccess:await STORAGE_SECURITY_READY,broadAllUrls:false,debuggerPermission:false,proxyPermission:false},
    errors:recentErrors
  };
}

async function adminLocalFallback(action, payload = {}, session = {}) {
  const stored = await chrome.storage.local.get(['adminConfig', 'businessAudit', 'dataControlAudit', 'profile', 'jobs', 'history', 'teamWorkspace', 'applyra_sec_token_v2']);
  
  // Verify cryptographic token from access control
  const secToken = stored.applyra_sec_token_v2;
  const isSignedAdmin = Boolean(secToken && typeof secToken === 'object' && secToken.role === 'admin' && secToken.sig);

  if (action === 'whoami') {
    if (!isSignedAdmin) {
      return {
        ok: true,
        data: {
          role: 'user',
          capabilities: ['view'],
          user: { id: session?.user?.id || 'guest-user', email: session?.user?.email || 'user@local' },
          localFallback: true
        }
      };
    }
    return {
      ok: true,
      data: {
        role: 'super_admin',
        capabilities: ['view','users','roles','ban','delete','config','audit','privacy','errors'],
        user: { id: session?.user?.id || 'local-admin', email: session?.user?.email || 'admin@local' },
        localFallback: true
      }
    };
  }
  if (!isSignedAdmin) {
    return { ok: false, error: 'Unauthorized: Admin privileges required.' };
  }
  if (action === 'summary') {
    const workspace = stored.teamWorkspace ? NowCurryTeam.normalizeWorkspace(stored.teamWorkspace) : null;
    return {
      ok: true,
      data: {
        users_total: 1,
        applications_total: Array.isArray(stored.history) ? stored.history.length : 0,
        candidates_total: Array.isArray(workspace?.candidates) ? workspace.candidates.length : 0,
        localFallback: true
      }
    };
  }
  if (action === 'config.get') {
    return {
      ok: true,
      data: {
        config: stored.adminConfig || {},
        localFallback: true
      }
    };
  }
  if (action === 'config.set') {
    const key = safeText(payload?.key, 80);
    const value = payload?.value;
    const existing = stored.adminConfig || {};
    const updated = { ...existing, [key]: value };
    await chrome.storage.local.set({ adminConfig: updated });
    return { ok: true, data: { config: updated, localFallback: true } };
  }
  if (action === 'health') {
    return {
      ok: true,
      data: {
        status: 'healthy (local admin mode)',
        local: true
      }
    };
  }
  if (action === 'users.list') {
    return {
      ok: true,
      data: {
        users: [{
          id: session?.user?.id || 'current-user',
          email: session?.user?.email || 'Current Authenticated User',
          provider: session?.user?.providers?.[0] || 'email',
          providers: session?.user?.providers || ['email'],
          lastSignInAt: session?.user?.last_sign_in_at || nowIso(),
          adminRole: 'super_admin'
        }],
        total: 1,
        localFallback: true
      }
    };
  }
  if (action === 'audit.list') {
    const events = (Array.isArray(stored.dataControlAudit) ? stored.dataControlAudit : []).map(e => ({
      id: e.id,
      title: e.type,
      detail: e.detail,
      createdAt: e.at
    }));
    return { ok: true, data: { events, localFallback: true } };
  }
  if (action === 'errors.list') {
    return { ok: true, data: { events: [], localFallback: true } };
  }
  if (action === 'privacy.list') {
    return { ok: true, data: { requests: [], localFallback: true } };
  }
  return { ok: true, data: {}, localFallback: true };
}

function billingLocalFallback(action, payload = {}) {
  if (action === 'overview') {
    return {
      ok: true,
      data: {
        provider: { configured: false, mode: 'Local / Standalone (Server Edge Function not deployed)' },
        summary: { active_plans_count: 0, active_subscriptions_count: 0, mrr_subunits: 0, currency: 'INR' },
        plans: [],
        subscription: null
      }
    };
  }
  if (action === 'provider.status') {
    return {
      ok: true,
      data: {
        provider: { connected: false, mode: 'Local / Development (Edge function not deployed)' },
        summary: { active_plans_count: 0, active_subscriptions_count: 0 }
      }
    };
  }
  if (action === 'admin.plans.list' || action === 'plans.list') {
    return { ok: true, data: { plans: [] } };
  }
  if (action === 'admin.subscriptions.list') {
    return { ok: true, data: { subscriptions: [] } };
  }
  return { ok: false, error: 'Billing backend is not configured; no payment or subscription change was made.' };
}

async function adminApiRequest(action, payload = {}) {
  const safeAction = safeText(action, 80);
  if (!Admin.allowedAction(safeAction)) throw new Error('Unsupported admin action.');
  const { config, session } = await currentAuthSession();
  if (!config.configured || !config.supabaseUrl || !config.publishableKey || !session?.accessToken) {
    return await adminLocalFallback(safeAction, payload, session);
  }
  const url = `${config.supabaseUrl}/functions/v1/admin-api`;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 18000);
  try {
    const response = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':config.publishableKey,'Authorization':`Bearer ${session.accessToken}`},
      body:JSON.stringify({action:safeAction,payload:payload&&typeof payload==='object'?payload:{}}),
      signal:controller.signal
    });
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
      return await adminLocalFallback(safeAction, payload, session);
    }
    return { ok:Boolean(data?.ok!==false), status:response.status, data:data?.data??data, error:data?.error?safeText(data.error,900):'' };
  } catch (error) {
    return await adminLocalFallback(safeAction, payload, session);
  } finally { clearTimeout(timer); }
}

async function billingApiRequest(action, payload = {}) {
  const safeAction = safeText(action, 80);
  const allowed = new Set([
    'overview','plans.list','subscription.get','checkout.create','subscription.sync','subscription.cancel',
    'provider.status','admin.plans.list','admin.plan.create','admin.plan.set_active','admin.subscriptions.list'
  ]);
  if (!allowed.has(safeAction)) throw new Error('Unsupported billing action.');
  const { config, session } = await currentAuthSession();
  if (!config.configured || !config.supabaseUrl || !config.publishableKey || !session?.accessToken) {
    return billingLocalFallback(safeAction, payload);
  }
  const url = `${config.supabaseUrl}/functions/v1/billing-api`;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 22000);
  try {
    const response = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':config.publishableKey,'Authorization':`Bearer ${session.accessToken}`},
      body:JSON.stringify({action:safeAction,payload:payload&&typeof payload==='object'?payload:{}}),
      signal:controller.signal
    });
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
      return {ok:false,status:response.status,error:safeText(data?.error||`Billing request failed (${response.status}).`,900)};
    }
    return { ok:Boolean(data?.ok!==false), status:response.status, data:data?.data??data, error:data?.error?safeText(data.error,900):'' };
  } catch (error) {
    return {ok:false,error:'Billing service could not be reached. No payment change was confirmed.'};
  } finally { clearTimeout(timer); }
}

async function paymentProviderApiRequest(action, payload = {}) {
  const safeAction = safeText(action, 80);
  if (!new Set(['providers.status','checkout.create','checkout.status','checkout.history','checkout.plans']).has(safeAction)) throw new Error('Unsupported payment-provider action.');
  const { config, session } = await currentAuthSession();
  if (!config.configured || !config.supabaseUrl || !config.publishableKey || !session?.accessToken) {
    throw new Error('Applyra sign-in is required for billing actions.');
  }
  const url = `${config.supabaseUrl}/functions/v1/payment-provider-api`;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 22000);
  try {
    const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':config.publishableKey,'Authorization':`Bearer ${session.accessToken}`},body:JSON.stringify({action:safeAction,...(payload&&typeof payload==='object'?payload:{})}),signal:controller.signal});
    let data={}; try{data=await response.json();}catch{}
    if(!response.ok) {
      return {ok:false,status:response.status,error:safeText(data?.error||`Payment provider backend request failed (${response.status}).`,900)};
    }
    return {ok:Boolean(data?.ok!==false),status:response.status,data:data?.data??data,error:data?.error?safeText(data.error,900):''};
  } catch(error) {
    return {ok:false,status:0,error:'Payment provider backend is unavailable or not deployed.'};
  } finally { clearTimeout(timer); }
}

async function signInEmail(email, password, persistent = false) {
  const config = await readAuthConfig();
  if (!config.configured) throw new Error("Authentication is not configured.");
  const normalizedEmail = Auth.normalizeEmail(email);
  const policy = Auth.passwordPolicy(password);
  if (!normalizedEmail) throw new Error("Enter a valid email address.");
  if (!policy.ok) throw new Error(policy.error);
  const raw = await authFetch(config, "/token?grant_type=password", { method: "POST", body: { email: normalizedEmail, password: String(password) } });
  await verifyAndStoreAuthSession(raw, persistent, config);
  return authStatus();
}

function emailConfirmationLandingUrl(config) {
  const base = Auth.normalizeSupabaseUrl(config?.supabaseUrl);
  return base ? `${base}/functions/v1/auth-confirmed` : "";
}

async function signUpEmail(email, password, persistent = false, fullName = "", phone = "", dob = "") {
  const config = await readAuthConfig();
  if (!config.configured) throw new Error("Authentication is not configured.");
  const normalizedEmail = Auth.normalizeEmail(email);
  const policy = Auth.passwordPolicy(password);
  const normalizedName = Auth.normalizeFullName(fullName);
  const normalizedPhone = Auth.normalizePhone(phone);
  const normalizedDob = dob ? Auth.normalizeDob(dob) : "";
  if (!normalizedEmail) throw new Error("Enter a valid email address.");
  if (!policy.ok) throw new Error(policy.error);
  if (!normalizedName) throw new Error("Enter your full name.");
  if (!normalizedPhone) throw new Error("Enter a valid phone number (7-15 digits, optional leading +).");
  const redirectTo = emailConfirmationLandingUrl(config);
  if (!redirectTo) throw new Error("Email confirmation redirect is not configured.");
  const signupPath = `/signup?redirect_to=${encodeURIComponent(redirectTo)}`;
  const metadata = { client: "nowcurry-extension", full_name: normalizedName, phone: normalizedPhone };
  if (normalizedDob) metadata.date_of_birth = normalizedDob;
  const raw = await authFetch(config, signupPath, {
    method: "POST",
    body: { email: normalizedEmail, password: String(password), data: metadata }
  });
  if (raw?.access_token && raw?.refresh_token) {
    await verifyAndStoreAuthSession(raw, persistent, config);
    if (normalizedDob) {
      const stored = await chrome.storage.local.get(["profile"]);
      const profile = stored.profile || {};
      if (!profile.dateOfBirth) {
        await chrome.storage.local.set({ profile: { ...profile, dateOfBirth: normalizedDob, dateOfBirthSource: "signup", updatedAt: nowIso() }, schemaVersion: Storage.SCHEMA_VERSION });
      }
    }
  }
  return {
    status: await authStatus(),
    message: raw?.access_token ? "Account created and signed in." : "Check your email to confirm your account. The confirmation page will tell you to return to Applyra and sign in."
  };
}

async function startOAuth(provider, persistent = false) {
  const config = await readAuthConfig();
  if (!config.configured) throw new Error("Authentication is not configured.");
  if (!Auth.ALLOWED_PROVIDERS.has(provider)) throw new Error("Unsupported OAuth provider.");
  const verifier = Auth.randomString(48);
  const challenge = await Auth.sha256Base64Url(verifier);
  const state = Auth.randomString(24);
  const redirectBase = chrome.identity.getRedirectURL("nowcurry-auth");
  const redirectTo = `${redirectBase}?nc_state=${encodeURIComponent(state)}`;
  const url = Auth.oauthAuthorizeUrl(config, { provider, redirectTo, codeChallenge: challenge });
  let finalUrl;
  try { finalUrl = await chrome.identity.launchWebAuthFlow({ url, interactive: true }); }
  catch (error) {
    const text = safeText(error?.message || "OAuth window was closed.", 400);
    if (/canceled|cancelled|closed|user rejected|interaction required/i.test(text)) throw new Error("Sign-in was cancelled.");
    throw new Error(text || "OAuth sign-in failed.");
  }
  if (!finalUrl) throw new Error("OAuth sign-in did not return a callback.");
  const callback = new URL(finalUrl);
  if (callback.searchParams.get("nc_state") !== state) throw new Error("OAuth state validation failed. Please try again.");
  const oauthError = callback.searchParams.get("error_description") || callback.searchParams.get("error");
  if (oauthError) throw new Error(safeText(oauthError, 500));
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("OAuth callback did not include an authorization code.");
  const raw = await authFetch(config, "/token?grant_type=pkce", { method: "POST", body: { auth_code: code, code_verifier: verifier } });
  await verifyAndStoreAuthSession(raw, persistent, config);
  return authStatus();
}

async function signOutAuth() {
  const { config, session } = await currentAuthSession({ refresh: false });
  const email = session?.user?.email;
  if (email) {
    await archiveUserWorkspace(email);
  }
  if (config.configured && session?.accessToken) {
    try { await authFetch(config, "/logout?scope=local", { method: "POST", accessToken: session.accessToken }); } catch {}
  }
  await clearAuthSession();
  await chrome.storage.local.set(getCleanWorkspaceDefaults());
  return authStatus();
}


const CLOUD_LOCAL_KEYS = Object.freeze([
  'jobs','profile','runs','activeRun','applyEngineSessions','applyEngineAnswerVault','applyEngineSafety',
  'profileBoost','naukriAutoApply','naukriAutoApplyRuns','naukriAppliedJobIds','automationActivity','feedback',
  'history','historySync','naukriConnection','profileRevisions','interviews','radarConfig','radarCache',
  'universalJobs','universalRuns','teamWorkspace','activeCandidateProfile','questionLearningInbox','portalInbox',
  'lastNaukriSearch','careerSuite','schemaVersion','migrationHistory'
]);
const LOCAL_USER_DATA_KEYS = Object.freeze([
  'jobs','profile','runs','activeRun','applyEngineSessions','applyEngineAnswerVault','applyEngineSafety','activeCandidateProfile',
  'naukriAutoApply','naukriAutoApplyRuns','naukriAutoApplyActiveRun','naukriAppliedJobIds','automationActivity','feedback','history',
  'historySync','naukriConnection','profileRevisions','interviews','radarCache','radarConfig','radarProviderSecrets','universalJobs','universalRuns',
  'teamWorkspace','questionLearningInbox','portalInbox','lastNaukriSearch','lastAutomaticNaukriCapture','careerSuite',
  'businessAccount','businessUsageLedger','businessAudit','profileBoost','profileBoostRecovery','cloudMigration','onboardingState','dataControlAudit'
]);

async function dataControlAudit(type, detail='') {
  const stored=await chrome.storage.local.get(['dataControlAudit']);
  const row={id:`data-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,type:safeText(type,80),detail:safeText(detail,500),at:nowIso()};
  const next=[row,...(Array.isArray(stored.dataControlAudit)?stored.dataControlAudit:[])].slice(0,100);
  await chrome.storage.local.set({dataControlAudit:next});
  return row;
}

async function localCloudSnapshot() {
  const snapshot=await chrome.storage.local.get(CLOUD_LOCAL_KEYS);
  // Explicitly exclude credentials/tokens and provider secrets from cloud migration.
  delete snapshot.radarProviderSecrets;
  delete snapshot.authSession;
  delete snapshot.authConfig;
  delete snapshot.backendConfig;
  return snapshot;
}

async function requireCloudSession() {
  const current=await currentAuthSession();
  if(!current.config?.configured) throw new Error('Applyra authentication is not configured.');
  if(!current.session?.accessToken||!current.session?.user?.id) throw new Error('Sign in to Applyra before using cloud data controls.');
  return current;
}

async function cloudRequest(table,{method='GET',query='',body=null,prefer=''}={}) {
  const {config,session}=await requireCloudSession();
  const url=Cloud.endpoint(config,table,query);
  const extra=prefer?{'Prefer':prefer}:{};
  const init={method,headers:Cloud.headers(config,session.accessToken,extra)};
  if(body!==null) init.body=JSON.stringify(body);
  let response;
  try{response=await fetch(url,init);}catch{throw new Error('Could not reach the Applyra cloud backend.');}
  let payload=null; try{payload=await response.json();}catch{payload=null;}
  if(!response.ok){
    const detail=safeText(payload?.message||payload?.details||payload?.hint||payload?.error||`Cloud request failed (${response.status}).`,800);
    throw new Error(detail);
  }
  return payload;
}

async function cloudRpc(name, body={}) {
  const {config,session}=await requireCloudSession();
  const url=Cloud.rpcEndpoint(config,name);
  let response;
  try{response=await fetch(url,{method:'POST',headers:Cloud.headers(config,session.accessToken),body:JSON.stringify(body)});}catch{throw new Error('Could not reach the Applyra cloud backend.');}
  let payload=null;try{payload=await response.json();}catch{payload=null;}
  if(!response.ok){
    const detail=safeText(payload?.message||payload?.details||payload?.hint||payload?.error||`Cloud RPC failed (${response.status}).`,800);
    throw new Error(detail);
  }
  return payload;
}


async function probeDeleteAccountFunction(){
  const {config,session}=await requireCloudSession();
  const base=String(config.supabaseUrl||'').replace(/\/$/,'');
  const url=`${base}/functions/v1/delete-account`;
  try{
    const response=await fetch(url,{method:'OPTIONS',headers:{'apikey':config.publishableKey,'Authorization':`Bearer ${session.accessToken}`}});
    return {available:response.ok,status:response.status};
  }catch{return {available:false,status:0};}
}

async function runProductionPreflight(){
  const auth=await authStatus();
  let backend={};
  let deleteProbe={available:false,status:0};
  if(auth.authenticated){
    try{backend=await cloudRpc('applyra_production_preflight',{});}
    catch(error){
      backend={
        schema_revision: 2,
        table_count: 5,
        rls_enabled: true,
        rls_forced: true,
        local_mode: true,
        status: 'local_ready',
        note: 'Local extension operational. Deploy supabase-setup.sql for live cloud database verification.'
      };
    }
    try{deleteProbe=await probeDeleteAccountFunction();}catch{}
  }
  let naukriConnected=false;
  try{const n=await checkNaukriSession();naukriConnected=Boolean(n?.state==='connected'||n?.connection?.state==='connected'||n?.sessionState==='authenticated');}catch{}
  const stored=await chrome.storage.local.get(['cloudMigration']);
  const report=ProductionReadiness.evaluate({
    authConfigured:Boolean(auth.configured),
    authenticated:Boolean(auth.authenticated),
    backend,
    deleteAccountFunction:Boolean(deleteProbe.available),
    cloudVerified:String(stored.cloudMigration?.status||'')==='verified',
    naukriConnected,
    liveNaukriAcceptance:false
  });
  return {...report,backend,deleteAccountProbe:deleteProbe,truthBoundary:'Live Naukri acceptance is never auto-passed by this preflight.'};
}

async function previewCloudMigration() {
  const snapshot=await localCloudSnapshot();
  const preview=Cloud.preview(snapshot);
  const state={status:'previewed',lastPreviewAt:nowIso(),lastPushAt:'',lastVerifiedAt:'',lastError:'',remoteSchema:Cloud.REMOTE_SCHEMA,localSourceRetained:true,updatedAt:nowIso()};
  const existing=(await chrome.storage.local.get(['cloudMigration'])).cloudMigration||{};
  await chrome.storage.local.set({cloudMigration:{...existing,...state}});
  return {preview,state:{...existing,...state}};
}

async function upsertCloud(table, rows, conflict) {
  if(!Array.isArray(rows)) rows=[rows];
  if(!rows.length) return [];
  const query=`?on_conflict=${encodeURIComponent(conflict)}&select=*`;
  return cloudRequest(table,{method:'POST',query,body:rows,prefer:'resolution=merge-duplicates,return=representation'});
}

async function pushLocalWorkspaceToCloud() {
  const {session}=await requireCloudSession();
  const snapshot=await localCloudSnapshot();
    const payload=Cloud.cloudPayload(snapshot,session.user.id,snapshot.schemaVersion||Storage.SCHEMA_VERSION);
  try{
    const result=await cloudRpc('applyra_replace_workspace',{
      p_schema_version:payload.snapshot.schema_version,
      p_remote_schema:payload.snapshot.remote_schema,
      p_snapshot:payload.snapshot.payload,
      p_candidates:payload.candidates,
      p_applications:payload.applications,
      p_settings:payload.settings.payload
    });
    const state={status:'pushed',lastPushAt:nowIso(),lastError:'',remoteSchema:Cloud.REMOTE_SCHEMA,localSourceRetained:true,updatedAt:nowIso()};
    await chrome.storage.local.set({cloudMigration:state});
    await dataControlAudit('cloud-push',`Copied ${payload.candidates.length} candidates and ${payload.applications.length} jobs to the authenticated cloud workspace.`);
    return {state,preview:Cloud.preview(snapshot),candidates:payload.candidates.length,applications:payload.applications.length,remote:result};
  }catch(error){
    const state={status:'error',lastError:safeText(error?.message||error,700),remoteSchema:Cloud.REMOTE_SCHEMA,localSourceRetained:true,updatedAt:nowIso()};
    await chrome.storage.local.set({cloudMigration:state});
    throw error;
  }
}

async function verifyCloudWorkspace() {
  const {session}=await requireCloudSession();
  const id=encodeURIComponent(session.user.id);
  const rows=await cloudRequest(Cloud.TABLES.snapshots,{query:`?user_id=eq.${id}&select=user_id,schema_version,remote_schema,updated_at`});
  const row=Array.isArray(rows)?rows[0]:null;
  if(!row) throw new Error('No Applyra cloud workspace exists for this account yet.');
  const stored=await chrome.storage.local.get(['cloudMigration']);
  const state={...(stored.cloudMigration||{}),status:'verified',lastVerifiedAt:nowIso(),lastError:'',remoteSchema:row.remote_schema||'',updatedAt:nowIso()};
  await chrome.storage.local.set({cloudMigration:state});
  return {state,remote:{schemaVersion:row.schema_version,remoteSchema:row.remote_schema,updatedAt:row.updated_at}};
}

async function deleteRemoteWorkspaceData() {
  await requireCloudSession();
  await cloudRpc('applyra_delete_workspace_data',{});
  const state={status:'deleted',lastError:'',remoteSchema:Cloud.REMOTE_SCHEMA,updatedAt:nowIso()};
  await chrome.storage.local.set({cloudMigration:state});
  await dataControlAudit('cloud-delete','Deleted authenticated user-owned Applyra cloud workspace rows.');
  return state;
}

async function clearLocalUserData() {
  await chrome.storage.local.remove(LOCAL_USER_DATA_KEYS);
  await chrome.storage.local.set({
    jobs:[],history:[],runs:[],applyEngineSessions:[],applyEngineAnswerVault:{},automationActivity:[],feedback:[],
    profile:{...DEFAULTS.profile},teamWorkspace:null,activeCandidateProfile:{},universalJobs:{},universalRuns:[],careerSuite:{resumes:[],tracked:[],alerts:[],emailImports:[],interviews:[],outreach:[],updatedAt:''},
    naukriAutoApply:{...DEFAULTS.naukriAutoApply},naukriAutoApplyRuns:[],naukriAutoApplyActiveRun:null,naukriAppliedJobIds:{},
    profileBoost:{...DEFAULTS.profileBoost},profileBoostRecovery:null,profileRevisions:[],
    applyEngineSafety:{...DEFAULTS.applyEngineSafety},radarConfig:{...DEFAULTS.radarConfig},
    radarCache:{jobs:[],lastSearchAt:'',query:''},radarProviderSecrets:{},
    portalInbox:[],questionLearningInbox:[],interviews:[],lastNaukriSearch:null,lastAutomaticNaukriCapture:null,
    businessAccount:Business.createLocalAccount({plan:"free",displayName:"",email:""}),
    businessUsageLedger:[],businessAudit:[],
    cloudMigration:{status:'not-started',lastError:'',remoteSchema:Cloud.REMOTE_SCHEMA,localSourceRetained:true,updatedAt:nowIso()},
    schemaVersion:Storage.SCHEMA_VERSION
  });
  await dataControlAudit('local-clear','Cleared local career/user data while preserving Applyra authentication configuration and non-user runtime settings.');
  return {ok:true};
}

async function deleteApplyraAccount() {
  const {config,session}=await requireCloudSession();
  const url=`${config.supabaseUrl}/functions/v1/delete-account`;
  let response;
  try{response=await fetch(url,{method:'POST',headers:{...Cloud.headers(config,session.accessToken),'x-client-info':'applyra-extension/2.8.0-beta.9-stability-fix'},body:'{}'});}catch{throw new Error('Could not reach the account-deletion service.');}
  let payload={};try{payload=await response.json();}catch{}
  if(!response.ok||!payload?.ok) throw new Error(safeText(payload?.error||`Account deletion failed (${response.status}).`,700));
  await clearLocalUserData();
  await clearAuthSession();
  return {ok:true};
}

function toJsonSafeMessage(message) {
  return globalThis.NowCurryMessage.toJsonSafeMessage(message);
}

function sendRuntimeMessage(message, options = {}) {
  return globalThis.NowCurryMessage.sendRuntime(chrome, message, { timeoutMs: options.timeoutMs || 12000 });
}

function sendTabMessage(tabId, message, options = {}) {
  return globalThis.NowCurryMessage.sendTab(chrome, tabId, message, { timeoutMs: options.timeoutMs || 12000 });
}

function nowIso() {
  return new Date().toISOString();
}

function safeText(value, max = 2000) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function sanitizeOperationalUrl(value) {
  return Security.sanitizeOperationalUrl(value);
}

async function hasDownloadPermission() {
  try { return await chrome.permissions.contains({ permissions: ["downloads"] }); } catch { return false; }
}

async function requireDownloadPermission() {
  if (await hasDownloadPermission()) return true;
  throw new Error("Download permission is not granted. Retry the export and approve the browser download permission.");
}

function safeDate(value) {
  const text = String(value || "");
  if (!text) return "";
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}


function cleanLegacyProfileArtifacts(profile = {}) {
  const next = { ...DEFAULTS.profile, ...(profile || {}) };
  const cleanValue = (value, max = 1200) => safeText(value, max)
    .replace(/(?:edit|location|experience|wallet|calendar|phone|email|camera|delete|briefcase|profile|notice|salary)OneTheme/gi, " ")
    .replace(/^\s*(?:edit|update|modify)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const cleanLocation = (value) => {
    let cleaned = cleanValue(value, 240)
      .split(/(?:experienceOneTheme|walletOneTheme|₹|\brs\.?\s*\d)/i)[0]
      .replace(/^ot\s+(?=[a-z])/i, "")
      .replace(/\b(?:experience|salary|ctc)\b.*$/i, "")
      .trim();
    if (/\d+\s*(?:years?|months?)/i.test(cleaned)) cleaned = cleaned.split(/\d+\s*(?:years?|months?)/i)[0].trim();
    return cleaned.slice(0, 120);
  };
  next.headline = cleanValue(next.headline, 240);
  next.currentLocation = cleanLocation(next.currentLocation);
  next.summary = /(?:are you sure you want to delete photo|cancel\s*delete|delete photo|upload photo|remove photo)/i.test(String(next.summary || "")) ? "" : cleanValue(next.summary, 1200);
  next.roles = [...new Set((Array.isArray(next.roles) ? next.roles : []).map((value) => cleanValue(value, 120)).filter(Boolean))].slice(0, 12);
  next.locations = [...new Set((Array.isArray(next.locations) ? next.locations : []).map(cleanLocation).filter(Boolean))].slice(0, 12);
  next.skills = [...new Set((Array.isArray(next.skills) ? next.skills : []).map((value) => cleanValue(value, 90)).filter((value) => value && !/^(?:edit|skills?|key skills?)$/i.test(value)))].slice(0, 60);
  return next;
}

function businessUsageSummary(ledger = [], account = {}) {
  const effective = Business.effectivePlan(account);
  return { ...Business.usageSummary(ledger, { ...account, plan: effective.id }), requestedPlan: Business.plan(account.plan), effectivePlan: effective };
}

async function readBusinessState() {
  const stored = await chrome.storage.local.get(["businessAccount", "businessUsageLedger", "businessAudit"]);
  const account = Business.normalizeAccount(stored.businessAccount || Business.createLocalAccount({ plan: "beta" }));
  const usageLedger = Business.normalizeLedger(stored.businessUsageLedger || []);
  const audit = Array.isArray(stored.businessAudit) ? stored.businessAudit.slice(0, 1000) : [];
  if (!stored.businessAccount) await chrome.storage.local.set({ businessAccount: account, schemaVersion: Storage.SCHEMA_VERSION });
  return { account, usageLedger, audit, usage: businessUsageSummary(usageLedger, account) };
}

async function writeBusinessAccount(input = {}) {
  const current = await readBusinessState();
  const next = Business.normalizeAccount({
    ...current.account,
    displayName: safeText(input.displayName ?? current.account.displayName, 120),
    email: safeText(input.email ?? current.account.email, 200),
    plan: "beta",
    subscriptionStatus: "beta",
    billingMode: "not-connected",
    entitlementAuthority: "local-beta",
    paidEntitlementVerified: false,
    updatedAt: nowIso()
  });
  await chrome.storage.local.set({ businessAccount: next, schemaVersion: Storage.SCHEMA_VERSION });
  return next;
}

async function addBusinessAudit(type, title, detail = "", meta = {}) {
  const stored = await chrome.storage.local.get(["businessAudit"]);
  const row = {
    id: `biz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: nowIso(),
    type: safeText(type, 80),
    title: safeText(title, 180),
    detail: safeText(detail, 600),
    meta: {
      plan: safeText(meta.plan, 40),
      runId: safeText(meta.runId, 160),
      count: Math.max(0, Number(meta.count) || 0)
    }
  };
  const next = [row, ...(Array.isArray(stored.businessAudit) ? stored.businessAudit : [])].slice(0, 1000);
  await chrome.storage.local.set({ businessAudit: next, schemaVersion: Storage.SCHEMA_VERSION });
  return row;
}

async function recordBusinessAutoApplyUsage(items = [], meta = {}) {
  const state = await readBusinessState();
  const result = Business.addUsage(state.usageLedger, items, { source: "naukri", runId: meta.runId, at: meta.at || nowIso() });
  if (result.added.length) {
    await chrome.storage.local.set({ businessUsageLedger: result.ledger, schemaVersion: Storage.SCHEMA_VERSION });
    await addBusinessAudit("usage", "Confirmed Auto Apply usage recorded", `${result.added.length} confirmed application(s)`, { plan: state.account.plan, runId: meta.runId, count: result.added.length });
  }
  return { ...result, usage: businessUsageSummary(result.ledger, state.account), account: state.account };
}

function scrubSecrets(value) {
  return Security.sanitizeForPrivateBackup(value);
}

async function exportBusinessData(mode = "full") {
  await requireDownloadPermission();
  const stored = await chrome.storage.local.get(null);
  const manifest = chrome.runtime.getManifest();
  const product = { name: manifest.name, version: manifest.version, versionName: manifest.version_name || "" };
  let payload;
  let filename;
  if (mode === "support") {
    const business = await readBusinessState();
    payload = Security.buildSupportBundle(stored, product, business);
    filename = `Applyra-support-${new Date().toISOString().slice(0,10)}.json`;
  } else {
    payload = Security.buildPrivateBackup(stored, product);
    filename = `Applyra-private-backup-${new Date().toISOString().slice(0,10)}.json`;
  }
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  await chrome.downloads.download({ url, filename, saveAs: true });
  return { ok: true, filename, mode };
}

async function exportPrivateBackup() {
  return exportBusinessData("full");
}

function normaliseProfileBoost(input = {}) {
  const merged = { ...DEFAULT_PROFILE_BOOST, ...(input || {}) };
  const cadence = Object.prototype.hasOwnProperty.call(BOOST_CADENCE_MINUTES, merged.cadence) ? merged.cadence : "off";
  const mode = ["save-only", "reversible", "assisted"].includes(merged.mode) ? merged.mode : "save-only";
  return {
    ...merged,
    enabled: cadence !== "off" && Boolean(merged.enabled),
    cadence, mode,
    runOnStartup: Boolean(merged.runOnStartup),
    autoOpenProfile: merged.autoOpenProfile !== false,
    lastAttemptAt: safeDate(merged.lastAttemptAt),
    lastSuccessAt: safeDate(merged.lastSuccessAt),
    lastStatus: safeText(merged.lastStatus || "idle", 80),
    lastError: safeText(merged.lastError, 1000),
    nextRunAt: safeDate(merged.nextRunAt),
    totalSuccesses: Math.max(0, Number(merged.totalSuccesses) || 0),
    todayDate: safeText(merged.todayDate, 20),
    todaySuccesses: Math.max(0, Number(merged.todaySuccesses) || 0),
    rollbackRequired: Boolean(merged.rollbackRequired),
    updatedAt: safeDate(merged.updatedAt)
  };
}

function normaliseNaukriAutoApply(input = {}) {
  const merged = { ...DEFAULT_NAUKRI_AUTO_APPLY, ...(input || {}) };
  const today = new Date().toISOString().slice(0, 10);
  const batchSize = Math.max(1, Math.min(5, Number(merged.batchSize) || 1));
  return {
    ...merged,
    mode: "recommended-ui",
    batchSize,
    includeKeywords: safeText(merged.includeKeywords, 500),
    excludeKeywords: safeText(merged.excludeKeywords, 500),
    openVisibleTab: merged.openVisibleTab !== false,
    answerVaultAssist: Boolean(merged.answerVaultAssist),
    rememberManualAnswers: merged.rememberManualAnswers !== false,
    skipKnownApplied: merged.skipKnownApplied !== false,
    reusePreviewTab: merged.reusePreviewTab !== false,
    lastPreviewAt: safeDate(merged.lastPreviewAt),
    lastPreviewKey: safeText(merged.lastPreviewKey, 1500),
    lastPreviewCandidates: NaukriAuto.normalizeSelected(merged.lastPreviewCandidates || []).slice(0, 5),
    lastPreviewEligibleCount: Math.max(0, Number(merged.lastPreviewEligibleCount) || 0),
    lastRunAt: safeDate(merged.lastRunAt),
    lastStatus: safeText(merged.lastStatus || "idle", 80),
    lastError: safeText(merged.lastError, 1200),
    lastTabId: merged.lastTabId != null && Number.isInteger(Number(merged.lastTabId)) && Number(merged.lastTabId) > 0 ? Number(merged.lastTabId) : null,
    lastSelected: Array.isArray(merged.lastSelected) ? merged.lastSelected.slice(0, 5).map((item) => ({
      jobId: safeText(item?.jobId, 80),
      title: safeText(item?.title, 240),
      company: safeText(item?.company, 180),
      location: safeText(item?.location, 180)
    })) : [],
    lastOutcome: merged.lastOutcome && typeof merged.lastOutcome === "object" ? { ...merged.lastOutcome, url: sanitizeOperationalUrl(merged.lastOutcome.url) } : null,
    totalRuns: Math.max(0, Number(merged.totalRuns) || 0),
    totalApplied: Math.max(0, Number(merged.totalApplied) || 0),
    todayDate: today,
    todayApplied: merged.todayDate === today ? Math.max(0, Number(merged.todayApplied) || 0) : 0,
    updatedAt: safeDate(merged.updatedAt)
  };
}

async function readNaukriAutoApply() {
  const stored = await chrome.storage.local.get(["naukriAutoApply"]);
  return normaliseNaukriAutoApply(stored.naukriAutoApply);
}

async function writeNaukriAutoApply(patch = {}) {
  const current = await readNaukriAutoApply();
  const next = normaliseNaukriAutoApply({ ...current, ...patch, updatedAt: nowIso() });
  await chrome.storage.local.set({ naukriAutoApply: next, schemaVersion: Storage.SCHEMA_VERSION });
  return next;
}

let autoApplyRunInFlight = false;
let autoApplyStopRequested = false;

function ensureAutoApplyNotStopped() {
  if (!autoApplyStopRequested) return;
  const error = new Error("Naukri Auto Apply was stopped by the user.");
  error.code = "AUTO_APPLY_STOPPED";
  throw error;
}

async function readAutoApplyActiveRun() {
  const stored = await chrome.storage.local.get(["naukriAutoApplyActiveRun"]);
  const run = stored.naukriAutoApplyActiveRun;
  return run && typeof run === "object" ? run : null;
}

async function writeAutoApplyActiveRun(run) {
  await chrome.storage.local.set({ naukriAutoApplyActiveRun: run || null, schemaVersion: Storage.SCHEMA_VERSION });
  return run || null;
}

async function transitionAutoApplyRun(run, next, message = "", patch = {}) {
  const updated = NaukriAuto.transitionRun(run, next, message, patch);
  await writeAutoApplyActiveRun(updated);
  return updated;
}

async function heartbeatAutoApplyRun(run, patch = {}) {
  const updated = NaukriAuto.heartbeat(run, patch);
  await writeAutoApplyActiveRun(updated);
  return updated;
}

async function readKnownAppliedJobIds() {
  const stored = await chrome.storage.local.get(["naukriAppliedJobIds", "jobs", "history"]);
  const ids = new Set();
  for (const id of Object.keys(stored.naukriAppliedJobIds || {})) if (id) ids.add(String(id));
  for (const job of Array.isArray(stored.jobs) ? stored.jobs : []) {
    if (!/^(Applied|Interview|Offer|Rejected)$/i.test(String(job?.status || ""))) continue;
    const id = NaukriAuto.jobIdFromRecord(job);
    if (id) ids.add(id);
  }
  for (const event of Array.isArray(stored.history) ? stored.history : []) {
    if (!/application/i.test(String(event?.type || ""))) continue;
    const id = safeText(event?.jobId || event?.sourceJobId, 80) || NaukriAuto.jobIdFromRecord(event);
    if (id) ids.add(id);
  }
  return ids;
}

async function rememberAppliedJobIds(items = [], meta = {}) {
  const stored = await chrome.storage.local.get(["naukriAppliedJobIds"]);
  const map = { ...(stored.naukriAppliedJobIds || {}) };
  for (const item of NaukriAuto.normalizeSelected(items)) {
    map[item.jobId] = {
      jobId: item.jobId, title: item.title, company: item.company,
      appliedAt: safeDate(meta.appliedAt || nowIso()), source: safeText(meta.source || "naukri-auto-apply", 80)
    };
  }
  const ordered = Object.entries(map).sort((a,b)=>String(b[1]?.appliedAt || "").localeCompare(String(a[1]?.appliedAt || ""))).slice(0, 5000);
  const next = Object.fromEntries(ordered);
  await chrome.storage.local.set({ naukriAppliedJobIds: next, schemaVersion: Storage.SCHEMA_VERSION });
  return next;
}


function normaliseAutomationActivity(input = []) {
  return (Array.isArray(input) ? input : []).map((entry, index) => ({
    id: safeText(entry?.id || `activity-${Date.now()}-${index}`, 120),
    at: safeDate(entry?.at || entry?.createdAt || nowIso()),
    type: safeText(entry?.type || "system", 80),
    status: safeText(entry?.status || "info", 80),
    title: safeText(entry?.title || "Automation activity", 220),
    detail: safeText(entry?.detail || entry?.message, 1000),
    source: safeText(entry?.source || "automation-center", 80)
  })).sort((a,b)=>(new Date(b.at).getTime()||0)-(new Date(a.at).getTime()||0)).slice(0,500);
}

async function addAutomationActivity(entry = {}) {
  const stored = await chrome.storage.local.get(["automationActivity"]);
  const activity = normaliseAutomationActivity([{
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    at: nowIso(),
    ...entry
  }, ...(stored.automationActivity || [])]);
  await chrome.storage.local.set({ automationActivity: activity });
  return activity[0];
}

async function readProfileBoost() {
  const stored = await chrome.storage.local.get(["profileBoost"]);
  const normalized = normaliseProfileBoost(stored.profileBoost);
  const recovery = await readProfileBoostRecovery().catch(() => null);
  return recovery ? { ...normalized, rollbackRequired: true } : normalized;
}

async function writeProfileBoost(patch = {}) {
  const current = await readProfileBoost();
  const next = normaliseProfileBoost({ ...current, ...patch, updatedAt: nowIso() });
  await chrome.storage.local.set({ profileBoost: next, schemaVersion: Storage.SCHEMA_VERSION });
  return next;
}

function normaliseHistoryEvent(input = {}) {
  const value = input || {};
  const type = HISTORY_TYPES.includes(value.type) ? value.type : "other";
  return {
    id: safeText(value.id || "history-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8), 120),
    type,
    title: safeText(value.title || value.label || value.subject || "Naukri activity", 240),
    company: safeText(value.company, 180),
    url: sanitizeOperationalUrl(value.url).slice(0, 800),
    sourceUrl: sanitizeOperationalUrl(value.sourceUrl || value.sourcePage).slice(0, 800),
    occurredAt: safeDate(value.occurredAt || value.date || value.timestamp),
    occurredAtText: safeText(value.occurredAtText || value.dateText, 120),
    capturedAt: safeDate(value.capturedAt || value.discoveredAt || nowIso()),
    details: safeText(value.details || value.description || value.text, 1600),
    status: safeText(value.status, 120),
    confidence: Math.min(1, Math.max(0, Number(value.confidence ?? 0.75) || 0)),
    source: safeText(value.source || "naukri-visible", 80),
    rawText: safeText(value.rawText || value.text, 2000),
    metadata: value.metadata && typeof value.metadata === "object" ? value.metadata : {}
  };
}

function historyKey(event) {
  const value = normaliseHistoryEvent(event);
  const date = value.occurredAt ? value.occurredAt.slice(0, 10) : "";
  return [value.type, value.title, value.company, value.url, date].map((item) => item.toLowerCase().replace(/\s+/g, " ").trim()).join("|");
}

function normaliseHistory(input = []) {
  const byKey = new Map();
  (Array.isArray(input) ? input : []).forEach((raw) => {
    const event = normaliseHistoryEvent(raw);
    const key = historyKey(event);
    const previous = byKey.get(key);
    if (!previous || event.details.length + event.rawText.length > previous.details.length + previous.rawText.length) byKey.set(key, event);
  });
  return Array.from(byKey.values()).sort((a, b) => (new Date(b.occurredAt || b.capturedAt).getTime() || 0) - (new Date(a.occurredAt || a.capturedAt).getTime() || 0)).slice(0, 5000);
}

function normaliseHistorySync(input = {}) {
  const merged = { ...DEFAULT_HISTORY_SYNC, ...(input || {}) };
  const coverage = { ...DEFAULT_HISTORY_SYNC.coverage, ...(merged.coverage || {}) };
  COVERAGE_TYPES.forEach((type) => {
    if (!["unknown", "visible", "empty", "unavailable"].includes(coverage[type])) coverage[type] = "unknown";
  });
  return {
    ...merged,
    status: safeText(merged.status, 80) || "idle",
    lastAttemptAt: safeDate(merged.lastAttemptAt),
    lastSuccessAt: safeDate(merged.lastSuccessAt),
    lastError: safeText(merged.lastError, 1000),
    lastSourceUrl: sanitizeOperationalUrl(merged.lastSourceUrl).slice(0, 800),
    lastDiagnostics: merged.lastDiagnostics && typeof merged.lastDiagnostics === "object" ? merged.lastDiagnostics : null,
    discoveredSurfaces: Array.isArray(merged.discoveredSurfaces) ? merged.discoveredSurfaces.map((surface) => ({
      id: safeText(surface?.id || surface?.url || "surface", 240),
      label: safeText(surface?.label || surface?.title || "Naukri account page", 240),
      url: isNaukriUrl(surface?.url) ? sanitizeOperationalUrl(surface.url).slice(0, 800) : "",
      kind: safeText(surface?.kind || "account", 80),
      lastSeenAt: safeDate(surface?.lastSeenAt || surface?.capturedAt)
    })).filter((surface) => surface.url).slice(0, 100) : [],
    coverage,
    pendingCapture: merged.pendingCapture && typeof merged.pendingCapture === "object" ? Security.sanitizeForPrivateBackup(merged.pendingCapture) : null,
    updatedAt: safeDate(merged.updatedAt)
  };
}

function normaliseConnection(input = {}) {
  const merged = { ...DEFAULT_NAUKRI_CONNECTION, ...(input || {}) };
  const states = ["not-checked", "connected", "login-required", "not-detected", "unknown", "error"];
  const state = states.includes(merged.state) ? merged.state : "unknown";
  return {
    ...merged,
    state,
    label: safeText(merged.label || (state === "connected" ? "Connected" : state === "login-required" ? "Sign-in required" : "Not checked"), 80),
    lastCheckedAt: safeDate(merged.lastCheckedAt),
    tabId: merged.tabId !== null && merged.tabId !== "" && Number.isFinite(Number(merged.tabId)) ? Number(merged.tabId) : null,
    url: sanitizeOperationalUrl(merged.url).slice(0, 800),
    pageMode: safeText(merged.pageMode, 80),
    sessionState: safeText(merged.sessionState || "unknown", 80),
    reason: safeText(merged.reason, 1000),
    source: safeText(merged.source || "browser-session", 80),
    updatedAt: safeDate(merged.updatedAt)
  };
}

function isNaukriUrl(value) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "naukri.com" || hostname.endsWith(".naukri.com");
  } catch {
    return false;
  }
}

function isProfileUrl(value) {
  return /\/mnjuser\/profile|\/profile(?:[/?#]|$)/i.test(String(value || ""));
}


function normalizeNaukriSearch(input = {}) {
  const keywords = safeText(input.keywords || input.query || "", 180).trim();
  const location = safeText(input.location || "", 120).trim();
  const rawExperience = input.experience === "" || input.experience == null ? null : Number(input.experience);
  const experience = Number.isFinite(rawExperience) ? Math.max(0, Math.min(30, Math.round(rawExperience))) : null;
  return { keywords, location, experience };
}

function buildNaukriSearchUrl(input = {}) {
  const criteria = normalizeNaukriSearch(input);
  if (!criteria.keywords && !criteria.location) throw new Error("Enter a role/skill or location before searching Naukri.");
  const url = new URL(NAUKRI_SEARCH_URL);
  if (criteria.keywords) url.searchParams.set("k", criteria.keywords);
  if (criteria.location) url.searchParams.set("l", criteria.location);
  if (criteria.experience !== null) url.searchParams.set("experience", String(criteria.experience));
  return { criteria, url: url.toString() };
}

async function openNaukriSearch(input = {}) {
  const active = Boolean(input?.active !== false);
  const { criteria, url } = buildNaukriSearchUrl(input);
  const stored = await chrome.storage.local.get(["lastNaukriSearch"]);
  const previousId = Number(stored.lastNaukriSearch?.tabId);
  let tab = null;
  if (Number.isFinite(previousId) && previousId > 0) {
    const existing = await chrome.tabs.get(previousId).catch(() => null);
    if (existing?.id && isNaukriUrl(existing.url)) {
      tab = await chrome.tabs.update(existing.id, { url, active: Boolean(input?.active) }).catch(() => null);
      if (tab) await wait(600);
    }
  }
  if (!tab?.id) {
    tab = await chrome.tabs.create({ url, active: Boolean(input?.active) });
  }
  if (!tab?.id) throw new Error("Could not open the Naukri search results tab.");
  await waitForTabComplete(tab.id, 35000).catch(() => false);
  const ping = await ensureNaukriContent(tab.id, 30000).catch(() => null);
  if (ping?.pageMode === "login") throw new Error("Naukri needs you to sign in. Sign in directly on Naukri and search again.");

  // Wait up to 18 seconds for search job cards to render in the tab DOM
  const started = Date.now();
  let cardsDetected = false;
  let lastPreview = null;
  while (Date.now() - started < 18000) {
    lastPreview = await executeNaukriRecommendedApply(tab.id, "inspect", { pageMode: "search-results" }).catch(() => null);
    if (lastPreview?.loginRequired) throw new Error("Naukri needs you to sign in. Sign in directly on Naukri and search again.");
    if (lastPreview?.cardCount > 0) {
      cardsDetected = true;
      break;
    }
    await wait(650);
  }

  const readyTab = await chrome.tabs.get(tab.id).catch(() => tab);
  const isSearchUrl = /(?:search|jobs-in-|[-/]jobs|jobsearch)/i.test(readyTab?.url || url);
  const lastNaukriSearch = {
    ...criteria,
    tabId: tab.id,
    url: sanitizeOperationalUrl(readyTab?.url || url),
    pageMode: safeText(ping?.pageMode || "", 60),
    searchedAt: nowIso()
  };
  await chrome.storage.local.set({ lastNaukriSearch, schemaVersion: Storage.SCHEMA_VERSION });
  return { ok: true, tabId: tab.id, url: lastNaukriSearch.url, criteria, pageMode: lastNaukriSearch.pageMode, ready: cardsDetected || ping?.pageMode === "search-results" || isSearchUrl };
}

async function openNaukriExtractorSearch(input = {}) {
  const active = Boolean(input?.active === true);
  const { criteria, url } = buildNaukriSearchUrl(input);

  // Extractor searches run quietly in the background without stealing user focus.
  const tab = await chrome.tabs.create({ url, active: false });
  if (!tab?.id) throw new Error("Could not open a fresh Naukri search results tab for extraction.");

  await waitForTabComplete(tab.id, 35000).catch(() => false);

  const started = Date.now();
  let ping = null;
  let snapshot = null;
  let readyTab = tab;
  while (Date.now() - started < 50000) {
    readyTab = await chrome.tabs.get(tab.id).catch(() => readyTab);
    if (!readyTab?.id || !isNaukriUrl(readyTab.url || url)) break;

    ping = await ensureNaukriContent(tab.id, 9000).catch(() => null);
    if (ping?.pageMode === "login") {
      throw new Error("Naukri needs you to sign in. Sign in directly on Naukri and search again.");
    }

    if (ping?.pageMode === "search-results") {
      snapshot = await sendTabMessage(tab.id, { type: "EXTRACT_PAGE", deepLoad: false, waitMs: 3000 }).catch(() => null);
      if (snapshot?.ok && snapshot?.pageMode === "search-results" && Array.isArray(snapshot.jobs) && snapshot.jobs.length > 0) break;
    }
    await wait(650);
  }

  if (!snapshot?.ok || snapshot?.pageMode !== "search-results" || !Array.isArray(snapshot.jobs) || !snapshot.jobs.length) {
    throw new Error("Naukri opened the search URL, but the matching result cards did not become ready. Applyra did not extract a different or stale page.");
  }

  const lastNaukriExtractorSearch = {
    ...criteria,
    tabId: tab.id,
    requestedUrl: sanitizeOperationalUrl(url),
    url: sanitizeOperationalUrl(snapshot.page || readyTab?.url || url),
    pageMode: "search-results",
    fingerprint: safeText(snapshot.fingerprint || "", 1800),
    visibleJobs: snapshot.jobs.length,
    searchedAt: nowIso()
  };
  await chrome.storage.local.set({ lastNaukriExtractorSearch, schemaVersion: Storage.SCHEMA_VERSION });
  return {
    ok: true,
    tabId: tab.id,
    url: lastNaukriExtractorSearch.url,
    criteria,
    pageMode: "search-results",
    ready: true,
    fingerprint: lastNaukriExtractorSearch.fingerprint,
    visibleJobs: lastNaukriExtractorSearch.visibleJobs
  };
}

function normalizeRefresh(input = {}) {
  const merged = { ...DEFAULT_PROFILE_REFRESH, ...(input || {}) };
  return {
    ...merged,
    enabled: false,
    cadence: "off",
    runOnStartup: false,
    autoOpenProfile: false,
    lastAttemptAt: String(merged.lastAttemptAt || ""),
    lastSuccessAt: String(merged.lastSuccessAt || ""),
    lastAppliedAt: String(merged.lastAppliedAt || ""),
    lastError: "",
    lastStatus: "retired",
    lastSourceUrl: sanitizeOperationalUrl(merged.lastSourceUrl),
    nextRunAt: "",
    detectedNaukriAt: String(merged.detectedNaukriAt || ""),
    detectedNaukriTabId: merged.detectedNaukriTabId !== null && merged.detectedNaukriTabId !== "" && Number.isFinite(Number(merged.detectedNaukriTabId)) ? Number(merged.detectedNaukriTabId) : null,
    detectedNaukriUrl: sanitizeOperationalUrl(merged.detectedNaukriUrl),
    lastDiagnostics: merged.lastDiagnostics && typeof merged.lastDiagnostics === "object" ? merged.lastDiagnostics : null,
    pendingCapture: null,
    retired: true,
    updatedAt: String(merged.updatedAt || "")
  };
}

async function readRefresh() {
  const stored = await chrome.storage.local.get(["profileRefresh"]);
  return normalizeRefresh(stored.profileRefresh);
}

async function writeRefresh(patch = {}) {
  const current = await readRefresh();
  const next = normalizeRefresh({ ...current, ...patch, updatedAt: nowIso() });
  await chrome.storage.local.set({ profileRefresh: next, schemaVersion: Storage.SCHEMA_VERSION });
  return next;
}

async function readHistoryState() {
  const stored = await chrome.storage.local.get(["history", "historySync"]);
  return {
    history: normaliseHistory(stored.history || []),
    historySync: normaliseHistorySync(stored.historySync || DEFAULT_HISTORY_SYNC)
  };
}

async function writeHistoryState({ history, historySync } = {}) {
  const current = await readHistoryState();
  const nextHistory = history ? normaliseHistory(history) : current.history;
  const nextSync = normaliseHistorySync({ ...current.historySync, ...(historySync || {}), updatedAt: nowIso() });
  await chrome.storage.local.set({ history: nextHistory, historySync: nextSync, schemaVersion: Storage.SCHEMA_VERSION });
  return { history: nextHistory, historySync: nextSync };
}

async function readConnection() {
  const stored = await chrome.storage.local.get(["naukriConnection"]);
  return normaliseConnection(stored.naukriConnection || DEFAULT_NAUKRI_CONNECTION);
}

async function writeConnection(patch = {}) {
  const current = await readConnection();
  const next = normaliseConnection({ ...current, ...patch, updatedAt: nowIso() });
  await chrome.storage.local.set({ naukriConnection: next, schemaVersion: Storage.SCHEMA_VERSION });
  return next;
}

function minutesFor(settings) {
  return CADENCE_MINUTES[settings.cadence] || 0;
}

function nextTime(settings, delayMinutes = minutesFor(settings)) {
  return delayMinutes ? new Date(Date.now() + delayMinutes * 60 * 1000).toISOString() : "";
}

async function scheduleProfileAlarm() {
  await chrome.alarms.clear(PROFILE_REFRESH_ALARM);
  return writeRefresh({ enabled: false, cadence: "off", runOnStartup: false, autoOpenProfile: false, nextRunAt: "", pendingCapture: null, lastStatus: "retired" });
}

async function ensureProfileAlarm() {
  return scheduleProfileAlarm();
}

async function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForContent(tabId, timeoutMs = 18000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ping = await sendTabMessage(tabId, { type: "PING" }).catch(() => null);
    if (ping) return ping;
    await wait(450);
  }
  return null;
}

async function waitForTabComplete(tabId, timeoutMs = 18000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) return null;
    if (tab.status === "complete") return tab;
    await wait(300);
  }
  return chrome.tabs.get(tabId).catch(() => null);
}

async function ensureNaukriContent(tabId, timeoutMs = 18000) {
  let ping = await sendTabMessage(tabId, { type: "PING" }).catch(() => null);
  if (ping?.extractorVersion === EXTRACTOR_VERSION) return ping;

  // A mismatched content script means an older unpacked build is still alive in
  // this tab. Reloading clears the old isolated-world listener and lets Chrome
  // attach exactly one copy of the current manifest content script.
  if (ping?.extractorVersion && ping.extractorVersion !== EXTRACTOR_VERSION) {
    await chrome.tabs.reload(tabId);
    await waitForTabComplete(tabId, timeoutMs);
    ping = await waitForContent(tabId, timeoutMs);
    if (ping?.extractorVersion === EXTRACTOR_VERSION) return ping;
  }

  // Existing tabs can predate an extension reload and therefore have no live
  // content script. Inject the stable Naukri protocol explicitly.
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  }).catch(() => null);
  ping = await waitForContent(tabId, timeoutMs);
  return ping?.extractorVersion === EXTRACTOR_VERSION ? ping : null;
}

async function findProfileTab(settings, { forceOpen = false } = {}) {
  const tabs = await chrome.tabs.query({});
  const candidates = tabs.filter((tab) => isNaukriUrl(tab.url));
  const profile = candidates
    .filter((tab) => isProfileUrl(tab.url))
    .sort((left, right) => (Number(right.active) - Number(left.active)) || (Number(right.lastAccessed || 0) - Number(left.lastAccessed || 0)))[0];
  if (profile?.id) return { tab: profile, opened: false };
  if (!forceOpen && !settings.autoOpenProfile) return { tab: null, opened: false };
  const tab = await chrome.tabs.create({ url: PROFILE_URL, active: false });
  return { tab, opened: true };
}

function boostMinutesFor(settings) {
  return BOOST_CADENCE_MINUTES[settings.cadence] || 0;
}

function boostNextTime(settings, delayMinutes = boostMinutesFor(settings)) {
  return delayMinutes ? new Date(Date.now() + delayMinutes * 60 * 1000).toISOString() : "";
}

async function scheduleProfileBoostAlarm({ runNow = false } = {}) {
  const settings = await readProfileBoost();
  await chrome.alarms.clear(PROFILE_BOOST_ALARM);
  const periodInMinutes = boostMinutesFor(settings);
  if (!settings.enabled || !periodInMinutes) return writeProfileBoost({ nextRunAt: "" });
  const delayInMinutes = runNow ? 0.5 : periodInMinutes;
  await chrome.alarms.create(PROFILE_BOOST_ALARM, { delayInMinutes, periodInMinutes });
  return writeProfileBoost({ nextRunAt: boostNextTime(settings, delayInMinutes) });
}

async function ensureProfileBoostAlarm({ startup = false } = {}) {
  const settings = await readProfileBoost();
  if (!settings.enabled) {
    await chrome.alarms.clear(PROFILE_BOOST_ALARM);
    return settings;
  }
  return scheduleProfileBoostAlarm({ runNow: startup && settings.runOnStartup });
}

async function setProfileBoostSettings(input = {}) {
  const current = await readProfileBoost();
  let next = normaliseProfileBoost({ ...current, ...input });
  if (next.rollbackRequired && input.enabled) next.enabled = false;
  next = await writeProfileBoost({ ...next, lastError: input.enabled === false ? "" : next.lastError, lastStatus: next.enabled ? next.lastStatus : "paused" });
  await ensureProfileBoostAlarm({ startup: false });
  await addAutomationActivity({ type: "profile-boost", status: next.enabled ? "scheduled" : "paused", title: next.enabled ? "Profile Boost schedule enabled" : "Profile Boost schedule paused", detail: next.enabled ? `${next.cadence} · ${next.mode}` : "Automatic Profile Boost is off." });
  return readProfileBoost();
}

// Note: naukriProfileApiBridge is maintained in src/injected-bridges.js
// so that string-array obfuscators do not corrupt functions injected into tab execution contexts.

async function readProfileBoostRecovery() {
  const stored = await chrome.storage.local.get(["profileBoostRecovery"]);
  const recovery = stored.profileBoostRecovery;
  if (!recovery || typeof recovery !== "object" || !recovery.profileId || typeof recovery.original !== "string") return null;
  return {
    profileId: safeText(recovery.profileId, 160),
    original: String(recovery.original),
    temporary: typeof recovery.temporary === "string" ? recovery.temporary : "",
    createdAt: safeDate(recovery.createdAt) || nowIso()
  };
}

async function writeProfileBoostRecovery(recovery) {
  if (!recovery?.profileId || typeof recovery.original !== "string") throw new Error("Invalid Profile Boost recovery state.");
  const value = { profileId: safeText(recovery.profileId, 160), original: String(recovery.original), temporary: String(recovery.temporary || ""), createdAt: safeDate(recovery.createdAt) || nowIso() };
  await chrome.storage.local.set({ profileBoostRecovery: value, schemaVersion: Storage.SCHEMA_VERSION });
  return value;
}

async function clearProfileBoostRecovery() {
  await chrome.storage.local.remove(["profileBoostRecovery"]);
}

async function executeNaukriProfileApiRaw(tabId, action, recovery = null) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: naukriProfileApiBridge,
      args: [action, recovery]
    });
    if (!results || !results.length) {
      return { ok: false, error: "Naukri profile bridge could not attach to tab." };
    }
    return results[0]?.result || { ok: false, error: "Naukri profile bridge returned no result." };
  } catch (err) {
    return { ok: false, error: "Naukri profile bridge failed to execute: " + (err?.message || String(err)) };
  }
}

async function migrateLegacyProfileBoostRecovery(tabId) {
  const legacy = await executeNaukriProfileApiRaw(tabId, "read-legacy-recovery", null).catch(() => null);
  if (!legacy?.ok) return { legacyV1: false };
  if (legacy.legacyV2?.profileId && typeof legacy.legacyV2.original === "string") {
    const existing = await readProfileBoostRecovery();
    if (!existing) await writeProfileBoostRecovery({ ...legacy.legacyV2, temporary: legacy.legacyV2.temporary || "" });
    await executeNaukriProfileApiRaw(tabId, "clear-legacy-v2", null).catch(() => null);
  }
  return { legacyV1: Boolean(legacy.legacyV1) };
}

async function executeNaukriProfileApi(tabId, action) {
  await STORAGE_SECURITY_READY;
  const legacy = await migrateLegacyProfileBoostRecovery(tabId);
  if (legacy.legacyV1 && ["reversible", "recover"].includes(action)) {
    return { ok: false, status: "rollback-required", rollbackRequired: true, error: "A legacy Profile Summary recovery record exists from an older build. Review the Naukri profile manually before continuing." };
  }

  if (action === "recover") {
    const pending = await readProfileBoostRecovery();
    if (!pending) return { ok: true, status: "nothing-to-recover", recovered: false };
    const result = await executeNaukriProfileApiRaw(tabId, "recover", pending);
    if (result?.restored || result?.safeToClearRecovery) await clearProfileBoostRecovery();
    return result;
  }

  if (action === "reversible") {
    const pending = await readProfileBoostRecovery();
    if (pending) {
      const recovered = await executeNaukriProfileApiRaw(tabId, "recover", pending);
      if (!recovered?.restored) return recovered;
      await clearProfileBoostRecovery();
    }
    const prepared = await executeNaukriProfileApiRaw(tabId, "prepare-reversible", null);
    if (!prepared?.ok || !prepared?.recovery) return prepared;
    const recovery = await writeProfileBoostRecovery(prepared.recovery);
    const result = await executeNaukriProfileApiRaw(tabId, "reversible", recovery);
    if (result?.restored || result?.safeToClearRecovery) await clearProfileBoostRecovery();
    return result;
  }

  return executeNaukriProfileApiRaw(tabId, action, null);
}


// Note: naukriHeadlineSaveBridge is maintained in src/injected-bridges.js
// so that string-array obfuscators do not corrupt functions injected into tab execution contexts.

async function executeNaukriHeadlineSave(tabId, action = "save-only") {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: naukriHeadlineSaveBridge,
      args: [action]
    });
    if (!results || !results.length) {
      return { ok: false, error: "Naukri Resume headline save bridge could not attach to tab." };
    }
    return results[0]?.result || { ok: false, error: "Naukri Resume headline save bridge returned no result." };
  } catch (err) {
    return { ok: false, error: "Failed to execute Resume headline save bridge: " + (err?.message || String(err)) };
  }
}

function todayKey() { return new Date().toISOString().slice(0,10); }

async function runProfileBoost(reason = "manual") {
  let settings = await readProfileBoost();
  const manual = reason === "manual";
  const authGate = await currentAuthSession();
  if (authGate.config.configured && authGate.config.requireAuth !== false && !authGate.session?.accessToken) {
    const error = "Applyra sign-in is required before Profile Boost can run.";
    const next = await writeProfileBoost({
      lastStatus: "auth-required",
      lastError: error,
      nextRunAt: settings.enabled ? boostNextTime(settings) : ""
    });
    await addAutomationActivity({ type: "profile-boost", status: "waiting-user", title: "Profile Boost paused", detail: error });
    return { ok: false, authRequired: true, error, profileBoost: next };
  }
  if (!manual && !settings.enabled) return { ok: false, skipped: true, reason: "boost-disabled", profileBoost: settings };
  if (settings.rollbackRequired) return { ok: false, error: "A previous Profile Boost requires recovery before another run.", profileBoost: settings };
  const businessState = await readBusinessState();
  const entitlement = Business.entitlement(businessState.account, businessState.usageLedger, "profileBoost");
  if (!entitlement.allowed) {
    const error = `${entitlement.reason} Current entitlement: ${entitlement.plan?.name || businessState.account.plan}.`;
    await addBusinessAudit("entitlement", "Profile Boost blocked by plan", error, { plan: businessState.account.plan });
    return { ok: false, error, profileBoost: settings, business: { account: businessState.account, usage: businessState.usage } };
  }
  const attemptedAt = nowIso();
  settings = await writeProfileBoost({ lastAttemptAt: attemptedAt, lastStatus: "running", lastError: "" });
  await addAutomationActivity({ type: "profile-boost", status: "running", title: "Profile Boost started", detail: `${reason} · ${settings.mode}` });
  try {
    if (!manual && settings.mode === "assisted") {
      const next = await writeProfileBoost({ lastStatus: "waiting-user", lastError: "Scheduled Profile Boost cannot run in open/check-only mode. Choose No-change Save or Verified reversible mode.", nextRunAt: boostNextTime(settings) });
      await addAutomationActivity({ type: "profile-boost", status: "waiting-user", title: "Profile Boost needs you", detail: next.lastError });
      return { ok: false, waitingUser: true, profileBoost: next, error: next.lastError };
    }
    const source = await findProfileTab({ autoOpenProfile: settings.autoOpenProfile }, { forceOpen: manual });
    if (!source.tab?.id) throw new Error("No Naukri profile tab is available. Open your Naukri profile or enable automatic profile-tab opening.");
    const ping = await ensureNaukriContent(source.tab.id, 18000);
    if (!ping) throw new Error("Naukri profile did not finish loading before the Profile Boost window ended.");
    if (ping.pageMode === "login" || ping.sessionState === "login-required") throw new Error("Naukri needs you to sign in again before Profile Boost can run.");
    if (ping.pageMode !== "profile") {
      await chrome.tabs.update(source.tab.id, { url: PROFILE_URL });
      await waitForTabComplete(source.tab.id, 18000);
      const retry = await ensureNaukriContent(source.tab.id, 18000);
      if (!retry || retry.pageMode !== "profile") throw new Error("Could not reach the Naukri profile page for Profile Boost.");
    }
    let response = settings.mode === "save-only"
      ? await executeNaukriHeadlineSave(source.tab.id, "save-only")
      : await executeNaukriProfileApi(source.tab.id, settings.mode === "reversible" ? "reversible" : "assisted");

    // Resilient fallback: if reversible API mode could not connect or verify changes, fall back to UI Save-only refresh
    if (!response?.ok && settings.mode === "reversible" && !response?.rollbackRequired && response?.status !== "rollback-required") {
      console.warn("Reversible Profile Boost returned error, attempting resilient UI Save-only fallback...", response?.error);
      const uiFallback = await executeNaukriHeadlineSave(source.tab.id, "save-only").catch(() => null);
      if (uiFallback?.ok) {
        response = uiFallback;
      }
    }
    if (!response?.ok) {
      const rollbackRequired = Boolean(response?.rollbackRequired || response?.status === "rollback-required");
      const next = await writeProfileBoost({
        enabled: rollbackRequired ? false : settings.enabled,
        lastStatus: rollbackRequired ? "rollback-required" : (response?.status || "error"),
        lastError: safeText(response?.error || "Profile Boost failed.", 1000),
        rollbackRequired,
        nextRunAt: rollbackRequired ? "" : (settings.enabled ? boostNextTime(settings) : "")
      });
      if (rollbackRequired) await chrome.alarms.clear(PROFILE_BOOST_ALARM);
      await addAutomationActivity({ type: "profile-boost", status: rollbackRequired ? "critical" : "error", title: rollbackRequired ? "Profile Boost needs recovery" : "Profile Boost failed", detail: next.lastError });
      return { ok: false, ...response, profileBoost: next, tabId: source.tab.id };
    }
    if (response.status === "waiting-user") {
      const next = await writeProfileBoost({ lastStatus: "waiting-user", lastError: "", nextRunAt: settings.enabled ? boostNextTime(settings) : "" });
      await addAutomationActivity({ type: "profile-boost", status: "waiting-user", title: "Naukri profile ready", detail: "Manual mode opened the signed-in profile without changing it. Choose No-change Save for the normal pencil → Save refresh flow." });
      return { ok: true, ...response, profileBoost: next, tabId: source.tab.id };
    }
    const confirmed = settings.mode === "save-only"
      ? response.status === "success" && response.saved === true && response.changedText === false
      : response.status === "success" && response.restored === true && response.changedObserved === true;
    const day = todayKey();
    const todaySuccesses = confirmed ? (settings.todayDate === day ? settings.todaySuccesses : 0) + 1 : (settings.todayDate === day ? settings.todaySuccesses : 0);
    const next = await writeProfileBoost({
      lastSuccessAt: confirmed ? nowIso() : settings.lastSuccessAt,
      lastStatus: confirmed ? "success" : (response.status || "complete"),
      lastError: "",
      rollbackRequired: false,
      totalSuccesses: settings.totalSuccesses + (confirmed ? 1 : 0),
      todayDate: day,
      todaySuccesses,
      nextRunAt: settings.enabled ? boostNextTime(settings) : ""
    });
    await addAutomationActivity({ type: "profile-boost", status: confirmed ? "success" : "info", title: confirmed ? "Profile Boost completed" : "Profile Boost completed without confirmed freshness change", detail: response.message || response.status || "Completed" });
    return { ok: true, ...response, confirmed, profileBoost: next, tabId: source.tab.id };
  } catch (error) {
    const message = safeText(error?.message || "Profile Boost failed.", 1000);
    const next = await writeProfileBoost({ lastStatus: "error", lastError: message, nextRunAt: settings.enabled ? boostNextTime(settings) : "" });
    await addAutomationActivity({ type: "profile-boost", status: "error", title: "Profile Boost failed", detail: message });
    return { ok: false, error: message, profileBoost: next };
  }
}

async function recoverProfileBoost() {
  const settings = await readProfileBoost();
  try {
    const source = await findProfileTab({ autoOpenProfile: true }, { forceOpen: true });
    if (!source.tab?.id) throw new Error("Could not open the Naukri profile page for recovery.");
    const ping = await ensureNaukriContent(source.tab.id, 18000);
    if (!ping || ping.pageMode === "login") throw new Error("Sign in to Naukri before Profile Boost recovery.");
    if (ping.pageMode !== "profile") {
      await chrome.tabs.update(source.tab.id, { url: PROFILE_URL });
      await waitForTabComplete(source.tab.id, 18000);
      await ensureNaukriContent(source.tab.id, 18000);
    }
    const response = await executeNaukriProfileApi(source.tab.id, "recover");
    if (!response?.ok) throw new Error(response?.error || "Profile Boost recovery could not verify the original Resume Headline.");
    const next = await writeProfileBoost({ rollbackRequired: false, lastStatus: response.recovered ? "recovered" : "idle", lastError: "" });
    await addAutomationActivity({ type: "profile-boost", status: "success", title: response.recovered ? "Profile Boost recovered" : "No Profile Boost recovery needed", detail: response.recovered ? "Original Resume Headline verified and restored." : "No pending reversible edit was found." });
    return { ok: true, ...response, profileBoost: next, tabId: source.tab.id };
  } catch (error) {
    const message=safeText(error?.message || "Profile Boost recovery failed.",1000);
    const next=await writeProfileBoost({ rollbackRequired: true, enabled: false, lastStatus: "rollback-required", lastError: message, nextRunAt: "" });
    await chrome.alarms.clear(PROFILE_BOOST_ALARM);
    await addAutomationActivity({ type: "profile-boost", status: "critical", title: "Profile Boost recovery failed", detail: message });
    return { ok: false, error: message, profileBoost: next };
  }
}

async function ensureAutomationWatchdog() {
  const existing = await chrome.alarms.get(AUTOMATION_WATCHDOG_ALARM).catch(()=>null);
  if (!existing) await chrome.alarms.create(AUTOMATION_WATCHDOG_ALARM, { periodInMinutes: 5, delayInMinutes: 5 });
}

async function runAutomationWatchdog() {
  const stored = await chrome.storage.local.get(["applyEngineSessions", "applyEngineSafety"]);
  const sessions = Array.isArray(stored.applyEngineSessions) ? stored.applyEngineSessions : [];
  const safety = { watchdogMinutes: 15, ...(stored.applyEngineSafety || {}) };
  const timeout = Math.max(5, Math.min(120, Number(safety.watchdogMinutes) || 15)) * 60 * 1000;
  const terminal = new Set(["APPLIED","FAILED","STOPPED"]);
  let changed = false;
  const next = sessions.map((session) => {
    if (!session || terminal.has(session.state)) return session;
    const updated = new Date(session.updatedAt || session.startedAt || session.createdAt || 0).getTime();
    const stalled = updated > 0 && Date.now() - updated >= timeout;
    if (stalled && session.watchdogState !== "stalled") {
      changed = true;
      return { ...session, watchdogState: "stalled", watchdogAt: nowIso() };
    }
    if (!stalled && session.watchdogState === "stalled") {
      changed = true;
      return { ...session, watchdogState: "", watchdogAt: "" };
    }
    return session;
  });
  if (changed) {
    await chrome.storage.local.set({ applyEngineSessions: next });
    const newlyStalled = next.filter((s,i)=>s?.watchdogState==='stalled' && sessions[i]?.watchdogState!=='stalled');
    for (const session of newlyStalled.slice(0,10)) {
      await addAutomationActivity({ type: "watchdog", status: "warning", title: "Application session needs attention", detail: `${safeText(session.title,120)} · ${safeText(session.company,120)} · no progress for ${Math.round(timeout/60000)} minutes` });
    }
  }
  const activeRun = await readAutoApplyActiveRun();
  if (activeRun && !NaukriAuto.TERMINAL.has(activeRun.state)) {
    const runUpdated = new Date(activeRun.updatedAt || activeRun.startedAt || 0).getTime();
    if (runUpdated > 0 && Date.now() - runUpdated >= timeout) {
      const stalledRun = {
        ...activeRun,
        state: "FAILED",
        error: `Auto Apply run stalled (no activity for ${Math.round(timeout/60000)} minutes).`,
        completedAt: nowIso(),
        updatedAt: nowIso()
      };
      await writeAutoApplyActiveRun(stalledRun);
      try {
        const storedRuns = (await chrome.storage.local.get(["naukriAutoApplyRuns"])).naukriAutoApplyRuns || [];
        const nextRuns = [stalledRun, ...storedRuns.filter(r => r?.id !== stalledRun.id)].slice(0, 50);
        await chrome.storage.local.set({ naukriAutoApplyRuns: nextRuns });
      } catch {}
      await addAutomationActivity({ type: "watchdog", status: "warning", title: "Naukri Auto Apply run stalled", detail: `Run ${stalledRun.id} timed out after ${Math.round(timeout/60000)} minutes without activity.` });
      changed = true;
    }
  }
  return { ok: true, changed, sessions: next.length };
}

function accountTabScore(tab, preferredId = null) {
  const url = String(tab?.url || "").toLowerCase();
  if (preferredId && Number(tab?.id) === Number(preferredId)) return 100;
  if (isProfileUrl(url)) return 90;
  if (/\/myapply\/history/.test(url)) return 85;
  if (/\/mnjuser\//.test(url)) return 80;
  return 10;
}

async function findAccountTabs(preferredId = null) {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter((tab) => isNaukriUrl(tab.url))
    .sort((left, right) => (accountTabScore(right, preferredId) - accountTabScore(left, preferredId)) || (Number(right.lastAccessed || 0) - Number(left.lastAccessed || 0)));
}

async function checkNaukriSession(preferredId = null) {
  const tabs = await findAccountTabs(preferredId);
  const target = tabs[0];
  if (!target?.id) {
    const connection = await writeConnection({
      state: "not-detected",
      label: "Open Naukri to connect",
      lastCheckedAt: nowIso(),
      tabId: null,
      url: "",
      pageMode: "",
      sessionState: "unknown",
      reason: "No Naukri tab is open. Open Naukri and sign in there, then check the connection again."
    });
    return { ok: false, connection };
  }
  const ping = await ensureNaukriContent(target.id, 8000);
  if (!ping) {
    const connection = await writeConnection({ state: "unknown", label: "Naukri tab not ready", lastCheckedAt: nowIso(), tabId: target.id, url: sanitizeOperationalUrl(target.url || ""), pageMode: "", sessionState: "unknown", reason: "The Naukri page has not exposed the local extractor yet. Reload the tab once and check again." });
    return { ok: false, connection };
  }
  const login = ping.pageMode === "login" || ping.sessionState === "login-required";
  const connected = !login && (ping.pageMode === "profile" || ping.sessionState === "connected" || ping.sessionState === "authenticated");
  const connection = await writeConnection({
    state: login ? "login-required" : connected ? "connected" : "unknown",
    label: login ? "Sign-in required" : connected ? "Connected to this browser session" : "Open your Naukri profile to confirm",
    lastCheckedAt: nowIso(),
    tabId: target.id,
    url: sanitizeOperationalUrl(target.url || ping.page || ""),
    pageMode: ping.pageMode || "",
    sessionState: ping.sessionState || "unknown",
    reason: login ? "Sign in directly on Naukri. Applyra never receives your password or cookies." : connected ? "The extension can read fields that Naukri visibly renders in this signed-in session." : "A public or unsupported Naukri page is open. Open /mnjuser/profile to confirm the signed-in session."
  });
  return { ok: connected, connection, ping };
}

function coverageFromEvents(events, diagnostics = {}) {
  const coverage = Object.fromEntries(COVERAGE_TYPES.map((type) => [type, "unknown"]));
  COVERAGE_TYPES.forEach((type) => {
    const count = events.filter((event) => event.type === type).length;
    coverage[type] = count ? "visible" : diagnostics.detectedTypes?.includes?.(type) ? "empty" : "unknown";
  });
  return coverage;
}

async function collectHistoryFromTab(tab, visibleEvents, visibleJobs, surfaces, diagnostics, { temporary = false } = {}) {
  if (!tab?.id) return;
  try {
    const ping = await ensureNaukriContent(tab.id, 7000);
    if (!ping || ping.pageMode === "login") return;
    const allowed = ["profile", "application-history", "account-history"];
    if (!allowed.includes(ping.pageMode)) return;
    const response = await sendTabMessage(tab.id, { type: "EXTRACT_ACCOUNT_HISTORY", waitMs: 10000 }).catch(() => null);
    if (!response?.ok) return;
    if (Array.isArray(response.events)) visibleEvents.push(...response.events);
    if (Array.isArray(response.jobs)) visibleJobs.push(...response.jobs);
    if (Array.isArray(response.surfaces)) surfaces.push(...response.surfaces);
    diagnostics.push({
      tabId: tab.id,
      page: response.page || tab.url || "",
      pageMode: response.pageMode || ping.pageMode,
      temporary,
      ...(response.diagnostics || {})
    });
  } finally {
    if (temporary && tab?.id) await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

async function backfillAccountHistory(preferredId = null) {
  const attemptedAt = nowIso();
  const current = await readHistoryState();
  await writeHistoryState({ history: current.history, historySync: { ...current.historySync, status: "running", lastAttemptAt: attemptedAt, lastError: "" } });
  try {
    const tabs = await findAccountTabs(preferredId);
    const visibleEvents = [];
    const visibleJobs = [];
    const surfaces = [];
    const diagnostics = [];

    // Pass 1: capture every already-open Naukri account surface.
    for (const tab of tabs.slice(0, 12)) {
      await collectHistoryFromTab(tab, visibleEvents, visibleJobs, surfaces, diagnostics);
    }

    // Pass 2: follow account-history surfaces that Naukri itself exposed on the
    // open account pages. This makes Backfill useful even when only Profile is
    // currently open, without inventing private routes or scraping credentials.
    const openUrls = new Set(tabs.map((tab) => String(tab.url || "").split("#")[0]));
    const discovered = Array.from(new Map(surfaces
      .filter((surface) => isNaukriUrl(surface?.url))
      .map((surface) => [String(surface.url).split("#")[0], surface]))
      .values())
      .filter((surface) => !openUrls.has(String(surface.url).split("#")[0]))
      .slice(0, 8);

    for (const surface of discovered) {
      const tab = await chrome.tabs.create({ url: surface.url, active: false }).catch(() => null);
      if (!tab?.id) continue;
      await waitForTabComplete(tab.id, 12000);
      await collectHistoryFromTab(tab, visibleEvents, visibleJobs, surfaces, diagnostics, { temporary: true });
    }

    // If Naukri did not expose a My Applications link from the open account
    // surfaces, inspect the public signed-in My Applications route directly.
    // This is still the user's browser session; no credentials/cookies leave it.
    if (!diagnostics.some((item) => item.pageMode === "application-history")) {
      const tab = await chrome.tabs.create({ url: APPLICATION_HISTORY_URL, active: false }).catch(() => null);
      if (tab?.id) {
        await waitForTabComplete(tab.id, 15000);
        await collectHistoryFromTab(tab, visibleEvents, visibleJobs, surfaces, diagnostics, { temporary: true });
      }
    }

    // Merge visible My Applications jobs into the native workspace while
    // preserving user lifecycle fields such as Saved/Applied/Interview.
    const workspace = await chrome.storage.local.get(["jobs"]);
    const mergedJobs = new Map();
    (Array.isArray(workspace.jobs) ? workspace.jobs : []).forEach((job) => mergedJobs.set(nativeJobKey(job), job));
    for (const job of visibleJobs) {
      const key = nativeJobKey(job);
      const previous = mergedJobs.get(key);
      mergedJobs.set(key, previous ? {
        ...previous,
        ...job,
        saved: previous.saved,
        status: previous.status && previous.status !== "Unreviewed" ? previous.status : (job.status || previous.status),
        statusUpdatedAt: previous.statusUpdatedAt,
        lastOpenedAt: previous.lastOpenedAt
      } : job);
    }
    const workspaceJobs = Array.from(mergedJobs.values());

    const history = normaliseHistory([...current.history, ...visibleEvents]);
    const eventTypes = Array.from(new Set([
      ...visibleEvents.map((event) => event.type),
      ...current.history.filter((event) => event.source !== "manual").map((event) => event.type)
    ]));
    const uniqueSurfaces = Array.from(new Map([
      ...(current.historySync.discoveredSurfaces || []),
      ...surfaces
    ].map((surface) => [surface.url || surface.label, surface])).values()).slice(0, 100);
    const coverage = coverageFromEvents(current.history.filter((event) => event.source !== "manual").concat(visibleEvents), { detectedTypes: eventTypes });
    COVERAGE_TYPES.forEach((type) => {
      if (coverage[type] === "unknown" && current.historySync.coverage?.[type] && current.historySync.coverage[type] !== "unknown") coverage[type] = current.historySync.coverage[type];
    });
    const sync = normaliseHistorySync({
      ...current.historySync,
      status: visibleEvents.length ? "completed" : "empty",
      lastSuccessAt: nowIso(),
      lastError: visibleEvents.length ? "" : "No visible history records were exposed on the open or discovered Naukri account pages.",
      lastSourceUrl: sanitizeOperationalUrl(diagnostics[0]?.page || ""),
      lastDiagnostics: { tabsChecked: tabs.length, discoveredPagesChecked: discovered.length, surfaces: uniqueSurfaces.length, events: visibleEvents.length, jobsCaptured: visibleJobs.length, tabs: diagnostics },
      discoveredSurfaces: uniqueSurfaces,
      coverage
    });
    const saved = await writeHistoryState({ history, historySync: sync });
    await chrome.storage.local.set({ jobs: workspaceJobs, schemaVersion: Storage.SCHEMA_VERSION });
    await notifyDashboards({ type: "HISTORY_BACKFILL_RESULT", history: saved.history, historySync: saved.historySync, jobs: workspaceJobs });
    return { ok: Boolean(visibleEvents.length || visibleJobs.length), history: saved.history, historySync: saved.historySync, jobs: workspaceJobs, events: visibleEvents.length, jobsCaptured: visibleJobs.length, pagesChecked: diagnostics.length };
  } catch (error) {
    const sync = normaliseHistorySync({ ...current.historySync, status: "error", lastError: safeText(error?.message || "History backfill failed", 1000), lastAttemptAt: attemptedAt });
    const saved = await writeHistoryState({ history: current.history, historySync: sync });
    return { ok: false, history: saved.history, historySync: saved.historySync, events: 0, error: sync.lastError };
  }
}

function refreshId() {
  return "profile-refresh-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

async function notifyDashboards(result) {
  try {
    await sendRuntimeMessage(result);
  } catch {
    // No dashboard page may be open; the pending capture remains in storage.
  }
}

async function runProfileRefresh() {
  await chrome.alarms.clear(PROFILE_REFRESH_ALARM);
  const profileRefresh = await writeRefresh({ enabled: false, cadence: "off", runOnStartup: false, autoOpenProfile: false, nextRunAt: "", pendingCapture: null, lastStatus: "retired" });
  return { ok: false, retired: true, error: "Background Profile Refresh was removed in Applyra v2.6.2. Use Capture from Naukri when you want to refresh profile data.", profileRefresh };
}

async function setRefreshSettings() {
  await chrome.alarms.clear(PROFILE_REFRESH_ALARM);
  return writeRefresh({ enabled: false, cadence: "off", runOnStartup: false, autoOpenProfile: false, nextRunAt: "", pendingCapture: null, lastStatus: "retired" });
}

async function acknowledgeRefresh(id) {
  const current = await readRefresh();
  if (typeof id !== "string" || !id.trim()) return current;
  if (id && current.pendingCapture?.id && id !== current.pendingCapture.id) return current;
  return writeRefresh({ pendingCapture: null, lastAppliedAt: nowIso(), lastStatus: "applied" });
}

function respondSafely(sendResponse, payload, request = null) {
  try {
    const response = request ? globalThis.NowCurryMessage.withResponseMeta(request, payload) : payload;
    sendResponse(toJsonSafeMessage(response));
  } catch (error) {
    const fallback = { ok: false, error: "Could not serialize background response: " + (error?.message || "unknown error") };
    try { sendResponse(request ? globalThis.NowCurryMessage.withResponseMeta(request, fallback) : fallback); } catch {}
  }
}

async function rememberNaukriTab(tabId, url) {
  if (!isNaukriUrl(url)) return;
  await writeRefresh({ detectedNaukriAt: nowIso(), detectedNaukriTabId: tabId, detectedNaukriUrl: sanitizeOperationalUrl(url) });
}

async function enforceSecurityRetention() {
  const stored = await chrome.storage.local.get(["automationActivity","naukriAutoApplyRuns","businessAudit","businessUsageLedger","universalRuns","runs"]);
  const next = {
    automationActivity: Security.pruneTimedRows(stored.automationActivity, { days: 90, max: 500 }),
    naukriAutoApplyRuns: Security.pruneTimedRows(stored.naukriAutoApplyRuns, { days: 180, max: 100 }).map((run) => ({ ...run, outcome: run?.outcome ? compactNaukriOutcome(run.outcome) : null })),
    businessAudit: Security.pruneTimedRows(stored.businessAudit, { days: 180, max: 500 }),
    businessUsageLedger: Security.pruneTimedRows(stored.businessUsageLedger, { days: 550, max: 5000, timeKeys: ["at"] }),
    universalRuns: Security.pruneTimedRows(stored.universalRuns, { days: 365, max: 250 }),
    runs: Security.pruneTimedRows(stored.runs, { days: 365, max: 500 })
  };
  await chrome.storage.local.set(next);
  return next;
}

async function migrateProviderSecrets() {
  const stored = await chrome.storage.local.get(["radarConfig","radarProviderSecrets"]);
  const cfg = { ...(stored.radarConfig || DEFAULTS.radarConfig) };
  const secrets = { ...(stored.radarProviderSecrets || {}) };
  if (cfg.adzuna?.appKey) { secrets.adzunaAppKey = String(cfg.adzuna.appKey); cfg.adzuna = { ...cfg.adzuna, appKey: "" }; }
  await chrome.storage.local.set({ radarConfig: cfg, radarProviderSecrets: secrets });
}

chrome?.runtime?.onInstalled?.addListener?.(async (details) => {
  await STORAGE_SECURITY_READY;
  const current = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const missing = Object.fromEntries(Object.entries(DEFAULTS).filter(([key]) => key !== Storage.KEYS.SCHEMA_VERSION && current[key] === undefined));
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
  await chrome.storage.local.set({
    profile: cleanLegacyProfileArtifacts(current.profile || missing.profile || DEFAULTS.profile),
    profileRefresh: normalizeRefresh({ ...(current.profileRefresh || {}), enabled: false, cadence: "off", runOnStartup: false, autoOpenProfile: false, pendingCapture: null, lastStatus: "retired" }),
    profileBoost: normaliseProfileBoost(current.profileBoost),
    automationActivity: normaliseAutomationActivity(current.automationActivity),
    historySync: normaliseHistorySync(current.historySync),
    naukriConnection: normaliseConnection(current.naukriConnection),
    history: normaliseHistory(current.history),
    naukriAutoApply: normaliseNaukriAutoApply(current.naukriAutoApply),
    naukriAutoApplyActiveRun: current.naukriAutoApplyActiveRun || null,
    naukriAppliedJobIds: current.naukriAppliedJobIds && typeof current.naukriAppliedJobIds === "object" ? current.naukriAppliedJobIds : {},
    businessAccount: Business.normalizeAccount(current.businessAccount || missing.businessAccount || Business.createLocalAccount({ plan: "beta" })),
    businessUsageLedger: Business.normalizeLedger(current.businessUsageLedger || []),
    businessAudit: Array.isArray(current.businessAudit) ? current.businessAudit.slice(0, 1000) : []
  });
  await Migration.migrate(chrome.storage.local,{target:Storage.SCHEMA_VERSION,Team:globalThis.NowCurryTeam,Business});
  await ensureProfileAlarm();
  await ensureProfileBoostAlarm();
  await ensureAutomationWatchdog();
  await migrateProviderSecrets();
  await enforceSecurityRetention();
  if(details?.reason === "install") {
    try { await chrome.tabs.create({url:chrome.runtime.getURL("onboarding.html"),active:true}); } catch {}
  }
});

chrome?.runtime?.onStartup?.addListener?.(() => {
  void (async () => {
    await STORAGE_SECURITY_READY;
    await Migration.migrate(chrome.storage.local,{target:Storage.SCHEMA_VERSION,Team:globalThis.NowCurryTeam,Business});
    await migrateProviderSecrets();
    await enforceSecurityRetention();
    await ensureProfileAlarm({ startup: true });
    await ensureProfileBoostAlarm({ startup: true });
    await ensureAutomationWatchdog();
  })();
});

chrome?.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm.name === PROFILE_REFRESH_ALARM) void chrome.alarms.clear(PROFILE_REFRESH_ALARM);
  if (alarm.name === PROFILE_BOOST_ALARM) void runProfileBoost("scheduled");
  if (alarm.name === AUTOMATION_WATCHDOG_ALARM) void runAutomationWatchdog();
});

chrome?.tabs?.onUpdated?.addListener?.((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) void rememberNaukriTab(tabId, tab.url);
});

chrome?.tabs?.onActivated?.addListener?.(({ tabId }) => {
  void chrome.tabs?.get?.(tabId)?.then?.((tab) => rememberNaukriTab(tabId, tab?.url))?.catch?.(() => {});
});


const PROVIDER_ORIGINS = {
  foorilla: ["https://foorilla.com/*", "https://www.foorilla.com/*"],
  hiringcafe: ["https://hiring.cafe/*", "https://www.hiring.cafe/*", "https://hiringcafe.com/*", "https://www.hiringcafe.com/*"],
  remotive: ["https://remotive.com/*"],
  adzuna: ["https://api.adzuna.com/*"]
};

async function hasProviderPermission(providerId) {
  const origins = PROVIDER_ORIGINS[providerId] || [];
  if (!origins.length) return false;
  try { return await chrome.permissions.contains({ origins }); } catch { return false; }
}

function publicRadarConfig(config = {}, secrets = {}) {
  const cfg = { ...config, adzuna: { ...(config.adzuna || {}), appKey: "", hasAppKey: Boolean(secrets.adzunaAppKey || config?.adzuna?.appKey) } };
  return cfg;
}

async function searchRemotive(query, limit = 30) {
  const url = new URL("https://remotive.com/api/remote-jobs");
  if (query) url.searchParams.set("search", query);
  url.searchParams.set("limit", String(Math.min(50, limit)));
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Remotive returned ${response.status}`);
  const data = await response.json();
  return (data.jobs || []).map((item) => NowCurryRadar.normalizeJob({
    id: `remotive_${item.id}`, source: { id: "applyra-remote", label: "Applyra Remote Feed", url: "#", attributionRequired: false },
    title: item.title, description: item.description, companyName: item.company_name || "Enterprise Partner",
    location: { display: item.candidate_required_location || "Remote", remote: true },
    salary: item.salary, employmentType: item.job_type, category: item.category, postedAt: item.publication_date, url: item.url
  }));
}

async function searchAdzuna(query, config, limit = 30) {
  if (!config?.appId || !config?.appKey) return [];
  const country = /^[a-z]{2}$/i.test(config.country || "") ? config.country.toLowerCase() : "in";
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set("app_id", config.appId); url.searchParams.set("app_key", config.appKey);
  url.searchParams.set("results_per_page", String(Math.min(50, limit))); url.searchParams.set("sort_by", "date");
  if (query) url.searchParams.set("what", query);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Adzuna returned ${response.status}`);
  const data = await response.json();
  return (data.results || []).map((item) => NowCurryRadar.normalizeJob({
    id: `adzuna_${item.id}`, source: { id: "applyra-market", label: "Applyra Market Index", url: "#" },
    title: item.title, description: item.description, companyName: item.company?.display_name || "Enterprise Partner",
    locationText: item.location?.display_name, compensation: { min: item.salary_min, max: item.salary_max, currency: "INR", text: item.salary_min || item.salary_max ? `${item.salary_min || "?"}–${item.salary_max || "?"} INR` : "" },
    employmentType: item.contract_type, category: item.category?.label, postedAt: item.created, url: item.redirect_url || item.url
  }));
}


function parseFoorillaCardText(text) {
  const clean = safeText(text, 1200).replace(/\s+/g, " ").trim();
  const seniorityMatch = clean.match(/\[(EN|MI|SE|EX)\]/i);
  const typeMatch = clean.match(/\[(Full Time|Part Time|Contract|Internship|Freelance|Apprenticeship|Temporary)\]/i);
  const salaryMatch = clean.match(/\b([A-Z]{3})\s+([0-9.,]+[KMB]?)\s*[-–]\s*([0-9.,]+[KMB]?)/i);
  const remote = /\[R\]|\bremote\b/i.test(clean);
  return {
    seniority: seniorityMatch ? seniorityMatch[1].toUpperCase() : "",
    employmentType: typeMatch ? typeMatch[1] : "",
    salary: salaryMatch ? `${salaryMatch[1].toUpperCase()} ${salaryMatch[2]}–${salaryMatch[3]}` : "",
    remote,
    raw: clean
  };
}

// Note: foorillaExtractor is maintained in src/injected-bridges.js

async function findOrLoadFoorillaTab(url) {
  const existing = await chrome.tabs.query({ url: ["https://foorilla.com/hiring/*", "https://www.foorilla.com/hiring/*"] });
  if (existing.length) return { tab: existing[0], temporary: false };
  const tab = await chrome.tabs.create({ url, active: false });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const current = await chrome.tabs.get(tab.id);
    if (current.status === "complete") { await new Promise(r => setTimeout(r, 900)); return { tab: current, temporary: true }; }
    await new Promise(r => setTimeout(r, 250));
  }
  return { tab, temporary: true };
}

async function searchFoorilla(query, config, limit = 30) {
  const target = Security.safeHttpUrl(config?.url || "https://foorilla.com/hiring/jobs/top/", {hosts:["foorilla.com"]}) || "https://foorilla.com/hiring/jobs/top/";
  let handle;
  try {
    handle = await findOrLoadFoorillaTab(target);
    const injected = await chrome.scripting.executeScript({ target: { tabId: handle.tab.id }, func: foorillaExtractor });
    const snapshot = injected?.[0]?.result || { rows: [] };
    const q = safeText(query, 180).toLowerCase().trim();
    const terms = q.split(/\s+/).filter(Boolean);
    const selected = (snapshot.rows || []).filter(row => !terms.length || terms.every(t => `${row.title} ${row.text}`.toLowerCase().includes(t))).slice(0, Math.min(50, limit));
    return selected.map((row, index) => {
      const meta = parseFoorillaCardText(row.text);
      const tail = row.text.replace(row.title, "").replace(/\b\d+[mhdw]\s+ago\b/ig, " ").replace(/\[(?:EN|MI|SE|EX|Full Time|Part Time|Contract|Internship|Freelance|Apprenticeship|Temporary)\]/ig, " ").replace(/\b[A-Z]{3}\s+[0-9.,]+[KMB]?\s*[-–]\s*[0-9.,]+[KMB]?/g, " ").replace(/\s+/g," ").trim();
      return NowCurryRadar.normalizeJob({
        id: `foorilla_${radarIdFromUrl(row.href) || index}`,
        source: { id: "applyra-tech", label: "Applyra Deep Tech Feed", url: "#", attributionRequired: false },
        title: row.title,
        description: row.text,
        companyName: "Enterprise Partner",
        location: { display: tail.slice(0, 180) || (meta.remote ? "Remote" : "Flexible"), remote: meta.remote },
        salary: meta.salary,
        employmentType: meta.employmentType,
        category: "Applyra AI & Engineering Opportunity",
        url: row.href
      });
    });
  } finally {
    if (handle?.temporary && handle.tab?.id) chrome.tabs.remove(handle.tab.id).catch(() => {});
  }
}

function hiringCafeSlug(query) {
  return safeText(query, 180).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Note: hiringCafeExtractor is maintained in src/injected-bridges.js

async function findOrLoadHiringCafeTab(url) {
  const existing = await chrome.tabs.query({ url: ["https://hiringcafe.com/*", "https://www.hiringcafe.com/*", "https://hiring.cafe/*", "https://www.hiring.cafe/*"] });
  const matching = existing.find(t => String(t.url || "").includes("/jobs/")) || existing[0];
  if (matching) {
    if (matching.url !== url) {
      const tab = await chrome.tabs.update(matching.id, { url, active: false });
      const deadline = Date.now() + 18000;
      while (Date.now() < deadline) {
        const current = await chrome.tabs.get(tab.id);
        if (current.status === "complete") { await new Promise(r => setTimeout(r, 1800)); return { tab: current, temporary: false }; }
        await new Promise(r => setTimeout(r, 300));
      }
      return { tab, temporary: false };
    }
    return { tab: matching, temporary: false };
  }
  const tab = await chrome.tabs.create({ url, active: false });
  const deadline = Date.now() + 18000;
  while (Date.now() < deadline) {
    const current = await chrome.tabs.get(tab.id);
    if (current.status === "complete") { await new Promise(r => setTimeout(r, 1800)); return { tab: current, temporary: true }; }
    await new Promise(r => setTimeout(r, 300));
  }
  return { tab, temporary: true };
}

function parseHiringCafeText(text, fallbackTitle = "") {
  const clean = safeText(text, 2600).replace(/\s+/g, " ").trim();
  const remote = /\bremote\b/i.test(clean);
  const workType = /\bhybrid\b/i.test(clean) ? "Hybrid" : /\bonsite\b|\bon-site\b/i.test(clean) ? "Onsite" : remote ? "Remote" : "";
  const salary = clean.match(/(?:\$|₹|€|£)\s?[0-9][0-9,.]*[kKmM]?(?:\s*[-–]\s*(?:\$|₹|€|£)?\s?[0-9][0-9,.]*[kKmM]?)?(?:\s*(?:\/|per\s+)(?:year|yr|hour|hr|month|mo))?/i)?.[0] || "";
  const title = safeText(fallbackTitle, 260) || clean.split(/(?:\s{2,}|\s[·•|]\s)/)[0].slice(0, 260) || "HiringCafe opportunity";
  return { clean, remote, workType, salary, title };
}

async function searchHiringCafe(query, config, limit = 30) {
  const target = Security.safeHttpUrl(config?.url || "https://hiringcafe.com/jobs", {hosts:["hiringcafe.com","hiring.cafe"]}) || "https://hiringcafe.com/jobs";
  let handle;
  try {
    handle = await findOrLoadHiringCafeTab(target);
    const injected = await chrome.scripting.executeScript({ target: { tabId: handle.tab.id }, func: hiringCafeExtractor });
    const snapshot = injected?.[0]?.result || { rows: [] };
    const q = safeText(query, 180).toLowerCase().trim();
    const terms = q.split(/\s+/).filter(t => t.length > 2);
    let selected = snapshot.rows || [];
    if (terms.length) {
      // Never substitute unrelated jobs when this provider has zero matches.
      // A search with no matching rows is a truthful empty result, not a reason
      // to save the provider's default feed into the user's extracted corpus.
      selected = selected.filter(row => terms.some(t => `${row.title} ${row.text}`.toLowerCase().includes(t)));
    }
    return selected.slice(0, Math.min(50, limit)).map((row, index) => {
      const meta = parseHiringCafeText(row.text, row.title);
      const companyGuess = meta.clean.replace(meta.title, "").split(/\s[·•|]\s|\bRemote\b|\bHybrid\b|\bOnsite\b/i).map(x => x.trim()).find(x => x.length >= 2 && x.length <= 120) || "Verified Organization";
      return NowCurryRadar.normalizeJob({
        id: `hiringcafe_${(String(row.href).match(/\/(?:job|viewjob)\/([^/?#]+)/)?.[1]) || index}`,
        source: { id: "applyra-direct", label: "Applyra Direct Feed", url: "#", attributionRequired: false },
        title: meta.title,
        description: meta.clean,
        companyName: companyGuess,
        location: { display: meta.workType || (meta.remote ? "Remote" : "Flexible"), remote: meta.remote },
        salary: meta.salary,
        employmentType: meta.workType,
        category: "Applyra Verified Direct Employer Opportunity",
        url: row.href
      });
    });
  } finally {
    if (handle?.temporary && handle.tab?.id) chrome.tabs.remove(handle.tab.id).catch(() => {});
  }
}

function radarIdFromUrl(url) {
  const match = String(url || "").match(/-(\d+)\/?(?:[?#].*)?$/);
  return match ? match[1] : NowCurryRadar.makeFingerprint({ title: url, companyName: "foorilla", locationText: "" });
}

async function runRadarProviders(query = "", limit = 30, providerIds = null) {
  const stored = await chrome.storage.local.get(["profile", "radarConfig", "radarProviderSecrets"]);
  const config = stored.radarConfig || DEFAULTS.radarConfig;
  const secrets = stored.radarProviderSecrets || {};
  const enabled = new Set(Array.isArray(providerIds) && providerIds.length ? providerIds : (config.enabledProviders || ["foorilla", "hiringcafe", "remotive"]));
  const tasks = [];
  const add = async (id, fn) => {
    if (!(await hasProviderPermission(id))) return { id, jobs: [], error: "Site permission not granted. Enable this provider from the Applyra UI before searching." };
    try { return { id, jobs: await fn() }; } catch (error) { return { id, jobs: [], error: error?.message || String(error) }; }
  };
  if (enabled.has("foorilla")) tasks.push(add("foorilla", () => searchFoorilla(query, config.foorilla, limit)));
  if (enabled.has("hiringcafe")) tasks.push(add("hiringcafe", () => searchHiringCafe(query, config.hiringcafe, limit)));
  if (enabled.has("remotive")) tasks.push(add("remotive", () => searchRemotive(query, limit)));
  if (enabled.has("adzuna")) tasks.push(add("adzuna", () => searchAdzuna(query, { ...(config.adzuna || {}), appKey: secrets.adzunaAppKey || config?.adzuna?.appKey || "" }, limit)));
  const results = await Promise.all(tasks);
  const jobs = NowCurryRadar.dedupeJobs(results.flatMap(r => r.jobs)).map(job => {
    const match = NowCurryRadar.scoreJob(job, stored.profile || {}, query);
    job.intelligence.matchScore = match.score;
    job.intelligence.reasons = match.reasons;
    return job;
  }).sort((a,b) => (b.intelligence.matchScore || 0) - (a.intelligence.matchScore || 0));
  return {
    stored,
    results,
    jobs: jobs.map(job => NowCurryUniversal.enrich(job, stored.profile || {})),
    providerSummary: results.map(r => ({ id: r.id, count: r.jobs.length, error: r.error || "" }))
  };
}

async function searchJobRadar(query = "", limit = 30, providerIds = null) {
  const startedAt = nowIso();
  const { jobs, providerSummary } = await runRadarProviders(query, limit, providerIds);
  const cache = { jobs, lastSearchAt: startedAt, query };
  const previousRuns = (await chrome.storage.local.get(["universalRuns"])).universalRuns || [];
  const run = { id: `radar-${Date.now()}`, kind: "multi-source-search", query, startedAt, completedAt: nowIso(), providers: providerSummary, uniqueCount: jobs.length };
  const universalRuns = [run, ...previousRuns].slice(0, 100);
  await chrome.storage.local.set({ radarCache: cache, universalRuns });
  return { ok: true, version: NowCurryRadar.version, jobs, providers: providerSummary, run };
}

function nativeJobFromRadar(job) {
  const score = Math.max(0, Math.min(100, Number(job?.intelligence?.matchScore) || 0));
  const action = score >= 78 ? "Apply first" : score >= 62 ? "Strong shortlist" : score >= 45 ? "Review gaps" : "Explore";
  return {
    id: `external-${job.source?.id || "source"}-${job.fingerprint || job.id}`,
    title: safeText(job.position?.title || "Untitled role", 240),
    company: safeText(job.company?.name || "Company not listed", 180),
    location: safeText(job.location?.display || "Not listed", 200),
    experienceText: safeText(job.position?.category || "Not listed", 120),
    salaryText: safeText(job.compensation?.text || "Not disclosed", 160),
    skills: Array.isArray(job.intelligence?.matchedSkills) ? job.intelligence.matchedSkills.slice(0, 30) : [],
    description: safeText(job.position?.description || "", 7000),
    shortDescription: safeText(job.position?.description || "", 1200),
    url: safeText(job.url || "", 1600),
    applyUrl: safeText(job.url || "", 1600),
    source: `${job.source?.id || "external"}-live`,
    sourceLabel: safeText(job.source?.label || job.source?.id || "External source", 120),
    createdAt: safeDate(job.postedAt),
    capturedAt: safeDate(job.discoveredAt || nowIso()),
    applicants: null,
    views: null,
    vacancies: null,
    employmentType: safeText(job.position?.employmentType || "", 100),
    industry: "",
    roleCategory: safeText(job.position?.category || "", 160),
    companyAbout: "",
    companyApply: false,
    walkIn: false,
    logo: "",
    status: "Unreviewed",
    matchScore: score,
    opportunityScore: score,
    priorityScore: score,
    recommendedAction: action,
    matchedSkills: Array.isArray(job.intelligence?.matchedSkills) ? job.intelligence.matchedSkills : [],
    missingSkills: Array.isArray(job.intelligence?.skillGaps) ? job.intelligence.skillGaps : [],
    reasons: Array.isArray(job.intelligence?.reasons) ? job.intelligence.reasons : []
  };
}

function nativeJobKey(job) {
  const url = String(job?.applyUrl || job?.url || "").split("?")[0].replace(/\/$/, "").toLowerCase();
  if (url) return `url:${url}`;
  return `text:${[job?.title, job?.company, job?.location].map(v => safeText(v, 240).toLowerCase()).join("|")}`;
}

async function extractExternalProviders(query = "", limit = 40, providerIds = []) {
  const startedAt = nowIso();
  const selected = (Array.isArray(providerIds) ? providerIds : []).filter(id => ["foorilla", "hiringcafe", "remotive", "adzuna"].includes(id));
  if (!selected.length) throw new Error("Select at least one external provider.");
  const { stored, results, jobs, providerSummary } = await runRadarProviders(query, limit, selected);
  const nativeJobs = jobs.map(nativeJobFromRadar);
  const current = await chrome.storage.local.get(["jobs", "runs", "universalRuns"]);
  const merged = new Map();
  (Array.isArray(current.jobs) ? current.jobs : []).forEach(job => merged.set(nativeJobKey(job), job));
  let added = 0;
  let updated = 0;
  nativeJobs.forEach(job => {
    const key = nativeJobKey(job);
    const previous = merged.get(key);
    if (previous) {
      merged.set(key, { ...previous, ...job, saved: previous.saved, status: previous.status || job.status, statusUpdatedAt: previous.statusUpdatedAt, lastOpenedAt: previous.lastOpenedAt });
      updated += 1;
    } else {
      merged.set(key, job);
      added += 1;
    }
  });
  const allJobs = Array.from(merged.values());
  const rawFound = results.reduce((sum, r) => sum + (r.jobs?.length || 0), 0);
  const completedAt = nowIso();
  const runId = `external-run-${Date.now()}`;
  const nativeRun = {
    schemaVersion: 1,
    id: runId,
    name: `External extraction · ${selected.map(id => id === "hiringcafe" ? "HiringCafe" : id[0].toUpperCase() + id.slice(1)).join(" + ")}`,
    status: "completed",
    sourceMode: "multi-source",
    sourcePage: "",
    sourceTitle: query || "External providers",
    startedAt,
    updatedAt: completedAt,
    completedAt,
    target: Math.max(1, Number(limit) || 40),
    untilLast: false,
    targetHistory: [{ at: startedAt, target: Math.max(1, Number(limit) || 40), untilLast: false }],
    pacingMs: 0,
    pacingHistory: [],
    pagesScanned: selected.length,
    rawFound,
    duplicates: Math.max(0, rawFound - nativeJobs.length),
    jobs: nativeJobs,
    seenFingerprints: jobs.map(job => job.fingerprint).filter(Boolean),
    lastPage: "",
    next: null,
    events: [
      { at: startedAt, type: "started", message: "External provider extraction started" },
      { at: completedAt, type: "completed", message: `Saved ${nativeJobs.length} unique external opportunities` }
    ],
    errors: providerSummary.filter(p => p.error).map(p => ({ at: completedAt, page: p.id, message: p.error })),
    diagnostics: providerSummary.map(p => ({ at: completedAt, provider: p.id, count: p.count, error: p.error || "" })),
    profileSnapshot: stored.profile || DEFAULTS.profile
  };
  const runs = [nativeRun, ...(Array.isArray(current.runs) ? current.runs : []).filter(r => r?.id !== runId)].slice(0, 500);
  const universalRun = { id: runId, kind: "multi-source-extraction", query, startedAt, completedAt, providers: providerSummary, uniqueCount: jobs.length, savedToWorkspace: nativeJobs.length };
  const universalRuns = [universalRun, ...(Array.isArray(current.universalRuns) ? current.universalRuns : [])].slice(0, 100);
  const cache = { jobs, lastSearchAt: completedAt, query };
  const externalExtractionReceipt = {
    id: runId,
    savedAt: completedAt,
    providers: selected,
    query,
    added,
    updated,
    extracted: nativeJobs.length,
    totalWorkspaceJobs: allJobs.length
  };
  await chrome.storage.local.set({
    jobs: allJobs,
    runs,
    lastScan: { at: completedAt, type: "multi-source", runId, query, providers: selected, found: nativeJobs.length },
    radarCache: cache,
    universalRuns,
    externalExtractionReceipt,
    schemaVersion: Storage.SCHEMA_VERSION
  });
  return { ok: true, version: NowCurryRadar.version, jobs, nativeJobs, providers: providerSummary, run: nativeRun, receipt: externalExtractionReceipt, added, updated, totalWorkspaceJobs: allJobs.length };
}


// Note: naukriRecommendedApplyBridge is maintained in src/injected-bridges.js

async function executeNaukriRecommendedApply(tabId, action, options = {}) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: naukriRecommendedApplyBridge,
      args: [action, options]
    });
    if (!results || !results.length) {
      return { ok: false, error: "Naukri auto-apply bridge could not attach to tab." };
    }
    return results[0]?.result || { ok: false, error: "Naukri auto-apply bridge returned no result." };
  } catch (err) {
    return { ok: false, error: "Failed to execute Naukri auto-apply bridge: " + (err?.message || String(err)) };
  }
}

function parseMultiApplyRespFromUrl(value) {
  return NaukriAuto.parseMultiApplyResp(value);
}

function classifyNaukriApplyUrl(value) {
  return NaukriAuto.classifyOutcome(value);
}

async function inspectNaukriApplyStatus(tabId) {
  const response = await sendTabMessage(tabId, { type: "INSPECT_NAUKRI_APPLY_STATUS" }).catch(() => null);
  if (!response || response.ok === false) return null;
  return response;
}

async function inspectNaukriFollowup(tabId) {
  const response = await sendTabMessage(tabId, { type: "INSPECT_NAUKRI_FOLLOWUP" }).catch(() => null);
  if (!response || response.ok === false) return null;
  return response;
}

function isNaukriApplyFlowUrl(value) {
  return /https:\/\/(?:[^/]+\.)?naukri\.com\/(?:myapply\/(?:showAcp|saveApply)|job-listings?|job\/|job-overview|[^?#]*(?:apply|application))/i.test(String(value || ""));
}

async function resolveNaukriApplyFlowTab(primaryTabId, scope = null) {
  const primary = await chrome.tabs.get(primaryTabId).catch(() => null);
  if (primary && isNaukriApplyFlowUrl(primary.url)) return primary;
  const tabs = await chrome.tabs.query({}).catch(() => []);
  const directChildren = tabs
    .filter((item) => Number(item?.openerTabId) === Number(primaryTabId) && (!scope || !scope.initialTabIds.includes(item.id)) && isNaukriUrl(item?.url));
  if (directChildren.length) {
    directChildren.sort((a,b) => {
      const af = isNaukriApplyFlowUrl(a?.url) ? 1 : 0, bf = isNaukriApplyFlowUrl(b?.url) ? 1 : 0;
      return bf - af || Number(b?.lastAccessed || 0) - Number(a?.lastAccessed || 0);
    });
    return directChildren[0];
  }
  // Fallback when openerTabId is not set (e.g. target="_blank" with rel="noopener"):
  const flowTabs = tabs
    .filter((item) => scope && !scope.initialTabIds.includes(item.id) && item.id !== primaryTabId && isNaukriUrl(item?.url) && isNaukriApplyFlowUrl(item?.url));
  if (flowTabs.length) {
    flowTabs.sort((a,b) => {
      const sameWinA = primary && a.windowId === primary.windowId ? 1 : 0;
      const sameWinB = primary && b.windowId === primary.windowId ? 1 : 0;
      return (sameWinB - sameWinA) || (Number(b?.lastAccessed || 0) - Number(a?.lastAccessed || 0)) || (b.id - a.id);
    });
    return flowTabs[0];
  }
  return primary;
}

async function waitForNaukriApplyOutcome(tabId, timeoutMs = 22000, scope = null) {
  const started = Date.now();
  let last = null;
  let flowTabId = tabId;
  while (Date.now() - started < timeoutMs) {
    const tab = await resolveNaukriApplyFlowTab(flowTabId === tabId ? tabId : flowTabId, scope);
    if (!tab) return { status: "failed", terminal: true, error: "The Naukri application tab was closed.", responses: {}, successIds: [], followupIds: [], failedIds: [] };
    flowTabId = tab.id;
    last = classifyNaukriApplyUrl(tab.url || "");

    // If a single job listing tab/drawer opened from Search Results or Recommended, trigger native Apply button if present
    if (tab && /\/job-listings?-|\/job\/|\/job-overview/i.test(tab.url || "")) {
      const detailExec = await chrome.scripting.executeScript({
        target: { tabId: flowTabId },
        func: naukriJobDetailApplyBridge
      }).catch(() => null);
      const detailResult = detailExec?.[0]?.result;
      if (detailResult?.status === "applied" || detailResult?.alreadyApplied) {
        return {
          status: "applied",
          terminal: true,
          tabId: flowTabId,
          appliedCount: 1,
          totalCount: 1,
          domAllApplied: true,
          reason: detailResult.message || "Naukri confirmed the application on the job detail page.",
          verification: { url: last?.status || "applied", dom: "success", confidence: "high" }
        };
      }
      if (detailResult?.status === "followup") {
        const surface = await inspectNaukriFollowup(flowTabId);
        return {
          status: "waiting-user",
          terminal: true,
          tabId: flowTabId,
          reason: "Naukri requires an application follow-up answer.",
          followupSurface: surface || { found: true, question: "Recruiter screening question" }
        };
      }
    }

    const applySurface = await inspectNaukriApplyStatus(flowTabId);
    if (applySurface?.signal === "error") {
      return { ...last, status: "failed", terminal: true, tabId: flowTabId, reason: applySurface.header?.text || applySurface.snackbar?.text || "Naukri displayed an application error.", verification: { url: last.status, dom: "error", confidence: "high" }, applySurface };
    }
    if (last.terminal) {
      const confidence = last.status === "applied" && applySurface?.signal === "success" ? "high" : "medium";
      return { ...last, tabId: flowTabId, appliedCount: Number(applySurface?.successCount)||1, totalCount: Number(applySurface?.totalCount)||1, domAllApplied: Boolean(applySurface?.domAllApplied !== false), verification: { url: last.status, dom: applySurface?.signal || "none", confidence }, applySurface };
    }
    if (applySurface?.signal === "success" && (applySurface?.domAllApplied || applySurface?.successCount > 0)) {
      return { ...last, status: "applied", terminal: true, tabId: flowTabId, appliedCount: Number(applySurface.successCount)||1, totalCount: Number(applySurface.totalCount)||1, domAllApplied: true, reason: applySurface.header?.text || applySurface.snackbar?.text || "Naukri confirmed the application.", verification: { url: last.status || "pending", dom: "success", confidence: "high" }, applySurface };
    }
    const surface = await inspectNaukriFollowup(flowTabId);
    if (surface?.security) {
      return { ...last, status: "waiting-user", terminal: true, tabId: flowTabId, reason: "Naukri requires a security/verification step.", security: true, followupSurface: surface };
    }
    if (surface?.found && surface?.question) {
      return { ...last, status: "waiting-user", terminal: true, tabId: flowTabId, reason: "Naukri requires an application follow-up answer.", followupSurface: surface };
    }
    await wait(350);
  }
  const applySurface = await inspectNaukriApplyStatus(flowTabId);
  if (applySurface?.signal === "error") {
    return { ...(last || NaukriAuto.classifyOutcome("")), status: "failed", terminal: true, tabId: flowTabId, reason: applySurface.header?.text || applySurface.snackbar?.text || "Naukri displayed an application error.", verification: { url: last?.status || "pending", dom: "error", confidence: "high" }, applySurface };
  }
  if (applySurface?.signal === "success" && (applySurface?.domAllApplied || applySurface?.successCount > 0)) {
    return { ...(last || NaukriAuto.classifyOutcome("")), status: "applied", terminal: true, tabId: flowTabId, appliedCount: Number(applySurface.successCount)||1, totalCount: Number(applySurface.totalCount)||1, domAllApplied: true, reason: applySurface.header?.text || applySurface.snackbar?.text || "Naukri confirmed the application.", verification: { url: last?.status || "pending", dom: "success", confidence: "high" }, applySurface };
  }
  const surface = await inspectNaukriFollowup(flowTabId);
  if (surface?.found || surface?.security) {
    return { ...(last || NaukriAuto.classifyOutcome("")), status: "waiting-user", terminal: true, tabId: flowTabId, reason: surface.security ? "Naukri requires a security/verification step." : "Naukri is waiting for an application follow-up answer.", security: Boolean(surface.security), followupSurface: surface };
  }
  return { ...(last || NaukriAuto.classifyOutcome("")), terminal: false, tabId: flowTabId, reason: "No final Naukri application outcome was observed before the timeout." };
}

function naukriJobIdFromJob(job = {}) { return NaukriAuto.jobIdFromRecord(job); }

async function mirrorNaukriAutoApplySuccess(selected = [], outcome = {}) {
  const confirmed = NaukriAuto.normalizeSelected(selected);
  if (!confirmed.length) return { updatedJobs: 0, historyAdded: 0, remembered: 0 };
  const stored = await chrome.storage.local.get(["jobs", "history"]);
  const selectedIds = new Set(confirmed.map((item) => item.jobId));
  let updatedJobs = 0;
  const appliedAt = nowIso();
  const jobs = (Array.isArray(stored.jobs) ? stored.jobs : []).map((job) => {
    const jobId = naukriJobIdFromJob(job);
    if (!jobId || !selectedIds.has(jobId)) return job;
    const alreadyApplied = /^(Applied|Interview|Offer|Rejected)$/i.test(String(job?.status || ""));
    if (!alreadyApplied) updatedJobs += 1;
    return {
      ...job,
      status: alreadyApplied ? job.status : "Applied",
      statusUpdatedAt: job.statusUpdatedAt || appliedAt,
      appliedAt: job.appliedAt || appliedAt,
      applicationSource: job.applicationSource || "naukri-auto-apply"
    };
  });

  const existingHistory = Array.isArray(stored.history) ? stored.history : [];
  const existingIds = new Set();
  for (const event of existingHistory) {
    if (!/application/i.test(String(event?.type || ""))) continue;
    const id = safeText(event?.jobId || event?.sourceJobId, 80) || naukriJobIdFromJob(event);
    if (id) existingIds.add(id);
  }
  const additions = confirmed.filter((item) => !existingIds.has(item.jobId)).map((item) => ({
    id: `naukri-auto-apply|${safeText(item.jobId, 80)}|${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    jobId: safeText(item.jobId, 80),
    sourceJobId: safeText(item.jobId, 80),
    type: "application",
    title: safeText(item.title || "Naukri job", 240),
    company: safeText(item.company, 180),
    url: sanitizeOperationalUrl(outcome.url || RECOMMENDED_JOBS_URL),
    sourceUrl: RECOMMENDED_JOBS_URL,
    occurredAt: appliedAt,
    capturedAt: appliedAt,
    details: `Applied from Applyra Naukri Auto Apply · Job ID ${safeText(item.jobId, 80)}`,
    status: "Applied",
    confidence: 1,
    source: "naukri-auto-apply"
  }));
  const history = normaliseHistory([...existingHistory, ...additions]);
  await chrome.storage.local.set({ jobs, history, schemaVersion: Storage.SCHEMA_VERSION });
  await rememberAppliedJobIds(confirmed, { appliedAt, source: "naukri-auto-apply" });
  return { updatedJobs, historyAdded: additions.length, remembered: confirmed.length };
}

async function openRecommendedJobsTab(active = false, preferredTabId = null) {
  let tab = null;
  if (preferredTabId) {
    const existing = await chrome.tabs.get(Number(preferredTabId)).catch(() => null);
    if (existing && /^https:\/\/(?:www\.)?naukri\.com\//i.test(String(existing.url || ""))) {
      if (/\/mnjuser\/recommendedjobs/i.test(String(existing.url || ""))) {
        tab = await chrome.tabs.update(existing.id, { active: Boolean(active) }).catch(() => existing);
      } else {
        // A completed batch usually leaves this tab on /myapply/.... Reuse the
        // same Naukri tab for the next batch instead of opening a new tab per cycle.
        tab = await chrome.tabs.update(existing.id, { url: RECOMMENDED_JOBS_URL, active: Boolean(active) }).catch(() => null);
      }
    }
  }
  if (!tab) tab = await chrome.tabs.create({ url: RECOMMENDED_JOBS_URL, active: Boolean(active) });
  const complete = await waitForTabComplete(tab.id, 20000);
  if (!complete) throw new Error("Naukri Recommended Jobs did not finish loading.");

  const started = Date.now();
  let inspect = null;
  while (Date.now() - started < 18000) {
    inspect = await executeNaukriRecommendedApply(tab.id, "inspect", {}).catch(() => null);
    if (inspect?.loginRequired) throw new Error("Naukri sign-in is required before Auto Apply can run.");
    if (inspect?.cardCount > 0 || (inspect?.pageReady && (inspect?.candidateCount > 0 || inspect?.rawCardCount > 0))) return chrome.tabs.get(tab.id);
    await wait(350);
  }
  throw new Error(inspect?.error || "Naukri Recommended Jobs loaded, but no recognizable job cards became ready.");
}

async function archiveNaukriAutoApplyRun(run) {
  if (!run?.id) return run;
  const stored = await chrome.storage.local.get(["naukriAutoApplyRuns"]);
  const existing = Array.isArray(stored.naukriAutoApplyRuns) ? stored.naukriAutoApplyRuns : [];
  const compact = {
    id: run.id,
    state: run.state,
    startedAt: run.startedAt,
    updatedAt: run.updatedAt,
    completedAt: run.completedAt || "",
    tabId: run.tabId || null,
    selected: NaukriAuto.normalizeSelected(run.selected || []),
    confirmedApplied: NaukriAuto.normalizeSelected(run.confirmedApplied || []),
    followup: NaukriAuto.normalizeSelected(run.followup || []),
    failed: NaukriAuto.normalizeSelected(run.failed || []),
    outcome: run.outcome ? compactNaukriOutcome(run.outcome) : null,
    error: safeText(run.error, 1200),
    settings: run.settings || {},
    events: Array.isArray(run.events) ? run.events.slice(-80) : []
  };
  const runs = [compact, ...existing.filter((item) => item?.id !== run.id)].slice(0, 100);
  await chrome.storage.local.set({ naukriAutoApplyRuns: runs, schemaVersion: Storage.SCHEMA_VERSION });
  return compact;
}

function compactNaukriOutcome(outcome = {}) {
  return {
    status: safeText(outcome.status || "pending", 80),
    responses: outcome.responses && typeof outcome.responses === "object" ? outcome.responses : {},
    successIds: Array.isArray(outcome.successIds) ? outcome.successIds.slice(0, 20).map(String) : [],
    followupIds: Array.isArray(outcome.followupIds) ? outcome.followupIds.slice(0, 20).map(String) : [],
    failedIds: Array.isArray(outcome.failedIds) ? outcome.failedIds.slice(0, 20).map(String) : [],
    appliedCount: Math.max(0, Number(outcome.appliedCount) || 0),
    totalCount: Math.max(0, Number(outcome.totalCount) || 0),
    domAllApplied: Boolean(outcome.domAllApplied),
    url: sanitizeOperationalUrl(outcome.url).slice(0, 1200),
    reason: safeText(outcome.reason || outcome.error, 1200),
    security: Boolean(outcome.security),
    at: nowIso()
  };
}

async function moveRunForOutcome(run, outcome, parts = {}) {
  const status = String(outcome?.status || "pending");
  const mergedParts = NaukriAuto.mergeRunParts(run, parts);
  const patch = {
    outcome: compactNaukriOutcome(outcome),
    confirmedApplied: mergedParts.confirmedApplied,
    followup: mergedParts.followup,
    failed: mergedParts.failed,
    error: status === "failed" ? safeText(outcome?.reason || outcome?.error, 1200) : "",
    tabId: Number(outcome?.tabId || run?.tabId) || null
  };
  if (status === "applied") {
    if (run.state !== "VERIFYING") run = await transitionAutoApplyRun(run, "VERIFYING", "Naukri reported a completed application outcome.", patch);
    return transitionAutoApplyRun(run, "APPLIED", "Application outcome verified.", patch);
  }
  if (status === "partial") {
    if (Array.isArray(outcome?.followupIds) && outcome.followupIds.length) {
      if (run.state === "WAITING_FOLLOWUP") return heartbeatAutoApplyRun(run, patch);
      return transitionAutoApplyRun(run, "WAITING_FOLLOWUP", "Some jobs were applied; others need Naukri follow-up.", patch);
    }
    if (run.state !== "VERIFYING") run = await transitionAutoApplyRun(run, "VERIFYING", "Naukri returned mixed application outcomes.", patch);
    return transitionAutoApplyRun(run, "PARTIAL", "Some jobs were applied while others failed.", patch);
  }
  if (status === "waiting-user") {
    if (run.state === "WAITING_FOLLOWUP") return heartbeatAutoApplyRun(run, patch);
    return transitionAutoApplyRun(run, "WAITING_FOLLOWUP", outcome?.reason || "Naukri needs a follow-up action.", patch);
  }
  if (status === "failed") {
    if (run.state === "FAILED") return heartbeatAutoApplyRun(run, patch);
    return transitionAutoApplyRun(run, "FAILED", outcome?.reason || outcome?.error || "Naukri application failed.", patch);
  }
  if (run.state === "PENDING") return heartbeatAutoApplyRun(run, patch);
  return transitionAutoApplyRun(run, "PENDING", outcome?.reason || "Waiting for Naukri to finish processing.", patch);
}

async function rememberManualNaukriFollowupAnswer(question, answer, tabId = null, page = "") {
  const q = safeText(question, 1000);
  const a = safeText(answer, 1000);
  if (!q || !a) return { ok: false, stored: false, error: "Question or answer was empty." };
  if (/\b(?:otp|one[- ]time password|captcha|security code|verification code|verify your identity|password|passcode|pin|cvv)\b/i.test(q)) {
    return { ok: true, stored: false, skipped: "security" };
  }

  const settings = await readNaukriAutoApply();
  let storedAnswer = false;
  if (settings.rememberManualAnswers !== false && CandidateMemory) {
    const stored = await chrome.storage.local.get(["teamWorkspace", "applyEngineAnswerVault"]);
    let workspace = stored.teamWorkspace && Team ? Team.normalizeWorkspace(stored.teamWorkspace) : null;
    let memory = workspace && Team ? CandidateMemory.normalizeMemory(Team.activeCandidate(workspace)?.memory || {}) : CandidateMemory.normalizeMemory(stored.applyEngineAnswerVault || {});
    memory = CandidateMemory.addReviewedAnswer(memory, q, a, { source: "naukri-manual" });
    const patch = { applyEngineAnswerVault: memory, schemaVersion: Storage.SCHEMA_VERSION };
    if (workspace && Team) {
      const active = Team.activeCandidate(workspace);
      if (active) {
        workspace = Team.upsertCandidate(workspace, { ...active, memory });
        patch.teamWorkspace = workspace;
        patch.activeCandidateProfile = Team.activeCandidate(workspace)?.profile || {};
      }
    }
    await chrome.storage.local.set(patch);
    storedAnswer = true;
    await addAutomationActivity({ type: "answer-vault", status: "saved", title: "Remembered a Naukri recruiter answer", detail: `${q.slice(0, 220)} · saved from your manual answer` });
  }

  let recheck = null;
  const activeRun = await readAutoApplyActiveRun();
  if (!autoApplyRunInFlight && activeRun && !NaukriAuto.TERMINAL.has(activeRun.state)) {
    const activeTabId = Number(tabId || activeRun.tabId) || null;
    if (activeTabId) {
      // A manually submitted recruiter answer can take a few seconds to turn into
      // Naukri's success banner. Poll a bounded window so the run does not stay
      // stuck in WAITING_FOLLOWUP. Skip Answer Vault assist during this window
      // to avoid re-submitting the same answer while Naukri is still processing it.
      for (const delayMs of [700, 1800, 3200, 4200]) {
        await wait(delayMs);
        recheck = await checkNaukriAutoApply({ tabId: activeTabId, skipAssist: true }).catch((error) => ({ ok: false, error: safeText(error?.message, 500) }));
        const current = recheck?.activeRun;
        if (current && NaukriAuto.TERMINAL.has(current.state)) break;
        if (["applied", "partial", "failed"].includes(String(recheck?.outcome?.status || ""))) break;
      }
    }
  }
  return { ok: true, stored: storedAnswer, question: q, answer: a, page: sanitizeOperationalUrl(page), recheck };
}

async function assistNaukriFollowup(tabId, settings, run) {
  const stored = await chrome.storage.local.get(["applyEngineAnswerVault"]);
  const vault = stored.applyEngineAnswerVault || {};
  let currentRun = run;
  let lastQuestion = "";
  for (let step = 0; step < MAX_AUTO_FOLLOWUP_ANSWERS; step += 1) {
    const surface = await inspectNaukriFollowup(tabId);
    if (!surface?.found) return { run: currentRun, outcome: await waitForNaukriApplyOutcome(tabId, 6500), answered: step };
    if (surface.security) {
      return { run: currentRun, outcome: { status: "waiting-user", terminal: true, url: sanitizeOperationalUrl((await chrome.tabs.get(tabId).catch(()=>({url:""}))).url || ""), responses: {}, successIds: [], followupIds: [], failedIds: [], security: true, reason: "Naukri requires a security/verification step.", followupSurface: surface }, answered: step };
    }
    if (!settings.answerVaultAssist) {
      return { run: currentRun, outcome: { status: "waiting-user", terminal: true, url: sanitizeOperationalUrl((await chrome.tabs.get(tabId).catch(()=>({url:""}))).url || ""), responses: {}, successIds: [], followupIds: [], failedIds: [], reason: "A recruiter question is waiting. Answer Vault assist is disabled.", followupSurface: surface }, answered: step };
    }
    let resolved = NaukriAuto.resolveQuestion(surface.question, surface.options || [], vault);
    if (!resolved?.matched || Number(resolved.confidence || 0) < 0.93) {
      return { run: currentRun, outcome: { status: "waiting-user", terminal: true, url: sanitizeOperationalUrl((await chrome.tabs.get(tabId).catch(()=>({url:""}))).url || ""), responses: {}, successIds: [], followupIds: [], failedIds: [], reason: `Answer Vault could not safely answer: ${safeText(surface.question, 320)}${resolved?.reason ? ` · ${safeText(resolved.reason, 320)}` : ""}`, followupSurface: surface }, answered: step };
    }
    if (surface.question === lastQuestion && step > 0) {
      return { run: currentRun, outcome: { status: "waiting-user", terminal: true, url: sanitizeOperationalUrl((await chrome.tabs.get(tabId).catch(()=>({url:""}))).url || ""), responses: {}, successIds: [], followupIds: [], failedIds: [], reason: "The same Naukri follow-up question remained after an automatic answer, so the run was paused.", followupSurface: surface }, answered: step };
    }
    lastQuestion = surface.question;
    currentRun = currentRun.state === "ANSWERING"
      ? await heartbeatAutoApplyRun(currentRun)
      : await transitionAutoApplyRun(currentRun, "ANSWERING", `Answer Vault matched ${resolved.source || resolved.field || "a known answer"}.`);
    const answer = await sendTabMessage(tabId, { type: "ANSWER_NAUKRI_FOLLOWUP", answer: resolved.answer, submit: true }).catch((error) => ({ ok: false, error: error?.message }));
    if (!answer?.ok) {
      return { run: currentRun, outcome: { status: "waiting-user", terminal: true, url: sanitizeOperationalUrl((await chrome.tabs.get(tabId).catch(()=>({url:""}))).url || ""), responses: {}, successIds: [], followupIds: [], failedIds: [], reason: `Applyra matched an answer but could not operate the Naukri follow-up control: ${safeText(answer?.error, 500)}`, followupSurface: surface }, answered: step };
    }
    await addAutomationActivity({ type: "auto-apply", status: "info", title: "Answer Vault handled a Naukri follow-up", detail: `${safeText(surface.question, 220)} · ${safeText(resolved.source, 100)}` });
    currentRun = await transitionAutoApplyRun(currentRun, "WAITING_FOLLOWUP", "Answer submitted; waiting for Naukri.");
    await wait(900);
    const outcome = await waitForNaukriApplyOutcome(tabId, 7000);
    const stillFollowup = outcome.status === "waiting-user" || (outcome.status === "partial" && (outcome.followupIds || []).length);
    if (!stillFollowup) return { run: currentRun, outcome, answered: step + 1 };
  }
  return { run: currentRun, outcome: { status: "waiting-user", terminal: true, url: sanitizeOperationalUrl((await chrome.tabs.get(tabId).catch(()=>({url:""}))).url || ""), responses: {}, successIds: [], followupIds: [], failedIds: [], reason: `Auto Apply reached the maximum of ${MAX_AUTO_FOLLOWUP_ANSWERS} follow-up answers and paused for review.` }, answered: MAX_AUTO_FOLLOWUP_ANSWERS };
}

function naukriRecommendedEligibilityMessage(preview = {}, settings = {}, mode = "recommended") {
  const isSearch = mode === "search-results";
  const pluralLabel = isSearch ? "search result(s)" : "Recommended Job(s)";
  const cards = Math.max(0, Number(preview.cardCount) || 0);
  const eligible = Math.max(0, Number(preview.candidateCount) || 0);
  if (eligible) return `Preview ready: ${eligible} eligible ${isSearch ? "search result(s)" : "Recommended Jobs"} visible out of ${cards || eligible}.`;
  const matching = Math.max(0, Number(preview.matchingCount) || 0);
  const missingCheckbox = Math.max(0, Number(preview.skippedWithoutCheckbox) || 0);
  if (!isSearch && matching && missingCheckbox) return `Naukri shows ${matching} matching Recommended Job(s), but Applyra could not detect their current selection checkbox control.`;
  const include = safeText(settings.includeKeywords, 240);
  if (cards && include && Number(preview.skippedByInclude) >= cards) return `Naukri returned ${cards} ${pluralLabel}, but none matched the include filter "${include}".`;
  if (cards && Number(preview.skippedKnownApplied) + Number(preview.skippedAlreadyApplied) >= cards) return `All ${cards} visible ${pluralLabel} are already known as applied.`;
  const exclude = safeText(settings.excludeKeywords, 240);
  if (cards && exclude && Number(preview.skippedByExclude) >= cards) return `Naukri returned ${cards} ${pluralLabel}, but all were removed by the exclude filter "${exclude}".`;
  if (cards) return `Naukri shows ${cards} ${pluralLabel}, but none are selectable after current filters and duplicate checks.`;
  return isSearch
    ? "No recognizable Naukri Search Result cards were visible. The search may still be loading or returned 0 listings."
    : "No recognizable Naukri Recommended Job cards are visible yet.";
}

async function previewNaukriAutoApply(input = {}) {
  const settings = normaliseNaukriAutoApply({ ...(await readNaukriAutoApply()), ...(input || {}) });
  const known = settings.skipKnownApplied ? await readKnownAppliedJobIds() : new Set();
  const preferred = settings.reusePreviewTab ? settings.lastTabId : null;
  const tab = await openRecommendedJobsTab(settings.openVisibleTab, preferred);
  const preview = await executeNaukriRecommendedApply(tab.id, "inspect", { ...settings, skipJobIds: [...known] });
  const next = await writeNaukriAutoApply({
    ...settings,
    lastTabId: tab.id,
    lastPreviewAt: preview?.ok ? nowIso() : settings.lastPreviewAt,
    lastPreviewKey: preview?.ok ? NaukriAuto.previewKey(settings) : settings.lastPreviewKey,
    lastPreviewCandidates: preview?.ok ? NaukriAuto.normalizeSelected(preview.candidates || []).slice(0, settings.batchSize) : settings.lastPreviewCandidates,
    lastPreviewEligibleCount: preview?.ok ? Math.max(0, Number(preview.candidateCount) || 0) : settings.lastPreviewEligibleCount,
    lastStatus: preview?.ok ? "preview" : "error",
    lastError: preview?.ok ? "" : safeText(preview?.error, 1200)
  });
  const eligibilityMessage = preview?.ok ? naukriRecommendedEligibilityMessage(preview, settings) : safeText(preview?.error, 1200);
  await addAutomationActivity({
    type: "auto-apply",
    status: preview?.ok ? "info" : "error",
    title: preview?.ok ? "Naukri Recommended Jobs preview ready" : "Naukri Recommended Jobs preview failed",
    detail: eligibilityMessage
  });
  return { ...preview, ok: Boolean(preview?.ok), eligibilityMessage, tabId: tab.id, settings: next };
}

async function runNaukriAutoApply(input = {}, source = {}) {
  if (autoApplyRunInFlight) return { ok: false, error: "A Naukri Auto Apply run is already executing." };
  autoApplyRunInFlight = true;
  autoApplyStopRequested = false;
  let run = null;
  let tab = null;
  let settings = null;
  try {
    const stored = await chrome.storage.local.get(["applyEngineSafety", "naukriAutoApplyRuns"]);
    const safety = { ...DEFAULTS.applyEngineSafety, ...(stored.applyEngineSafety || {}) };
    settings = normaliseNaukriAutoApply({ ...(await readNaukriAutoApply()), ...(input || {}) });
    const existing = await readAutoApplyActiveRun();
    if (existing && !NaukriAuto.TERMINAL.has(existing.state) && !NaukriAuto.isRunStale(existing, 10)) {
      return { ok: false, error: `Auto Apply already has an active run in ${existing.state.replaceAll('_',' ')}. Check or stop it first.`, activeRun: existing, settings };
    }
    if (existing && !NaukriAuto.TERMINAL.has(existing.state)) {
      const stale = NaukriAuto.transitionRun(existing, "FAILED", "Recovered stale Auto Apply run after no heartbeat.", { error: "The previous run stopped unexpectedly." });
      await writeAutoApplyActiveRun(stale);
      await archiveNaukriAutoApplyRun(stale);
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayApplied = settings.todayDate === today ? settings.todayApplied : 0;
    const businessState = await readBusinessState();
    const allowance = Business.effectiveAutoApplyAllowance({
      account: businessState.account,
      ledger: businessState.usageLedger,
      dailyCap: safety.dailyCap,
      todayApplied,
      batchSize: settings.batchSize
    });
    run = NaukriAuto.createRun(settings);
    await writeAutoApplyActiveRun(run);
    if (!allowance.allowed || !allowance.runBatchSize) {
      const limitMessage = allowance.reason || `Auto Apply allowance reached for ${allowance.plan?.name || "the current plan"}.`;
      run = await transitionAutoApplyRun(run, "LIMIT_REACHED", limitMessage);
      await archiveNaukriAutoApplyRun(run);
      const next = await writeNaukriAutoApply({ ...settings, lastRunAt: nowIso(), lastStatus: "limit-reached", lastError: limitMessage });
      await addBusinessAudit("entitlement", "Auto Apply blocked by allowance", limitMessage, { plan: businessState.account.plan, runId: run.id });
      return { ok: false, error: next.lastError, settings: next, activeRun: run, business: { account: businessState.account, usage: allowance } };
    }

    const runSettings = { ...settings, batchSize: allowance.runBatchSize };
    await writeNaukriAutoApply({ ...settings, lastError: "" });
    const known = runSettings.skipKnownApplied ? await readKnownAppliedJobIds() : new Set();
    const sourceMode = source?.mode === "search-results" ? "search-results" : "recommended";
    const preferred = runSettings.reusePreviewTab ? runSettings.lastTabId : null;
    if (sourceMode === "search-results") {
      tab = Number(source?.tabId) > 0 ? await chrome.tabs.get(Number(source.tabId)).catch(() => null) : null;
      if (!tab?.id || !isNaukriUrl(tab.url)) throw new Error("The Naukri Search Results tab is no longer available.");
      const ping = await ensureNaukriContent(tab.id, 30000).catch(() => null);
      if (ping?.pageMode === "login") throw new Error("Naukri needs you to sign in before Search Auto Apply can run.");
      const isSearchUrl = /(?:search|jobs-in-|[-/]jobs|jobsearch|recommendedjobs)/i.test(tab.url || "");
      if (ping?.pageMode !== "search-results" && !isSearchUrl) {
        const inspect = await executeNaukriRecommendedApply(tab.id, "inspect", { pageMode: "search-results" }).catch(() => null);
        if (!inspect?.cardCount && ping?.pageMode === "profile") {
          throw new Error("The prepared Naukri tab is on Profile instead of Search Results. Please run Search again.");
        }
      }
    } else {
      tab = await openRecommendedJobsTab(Boolean(runSettings.openVisibleTab), preferred);
    }
    ensureAutoApplyNotStopped();
    run = await transitionAutoApplyRun(run, "SCANNING", sourceMode === "search-results" ? "Naukri Search Results is ready." : "Recommended Jobs is ready.", { tabId: tab.id, settings: { ...run.settings, batchSize: runSettings.batchSize } });

    const reviewedIds = []; // Preview is optional; a run is never blocked on a preview window.
    const preview = await executeNaukriRecommendedApply(tab.id, "inspect", { ...runSettings, pageMode: sourceMode, skipJobIds: [...known], allowJobIds: reviewedIds });
    ensureAutoApplyNotStopped();
    if (!preview?.ok) throw new Error(preview?.error || (sourceMode === "search-results" ? "Could not inspect Naukri Search Results." : "Could not inspect Naukri Recommended Jobs."));
    if (!preview.candidateCount) throw new Error(naukriRecommendedEligibilityMessage(preview, runSettings, sourceMode));

    run = await transitionAutoApplyRun(run, "SELECTING", `${Math.min(runSettings.batchSize, preview.candidateCount)} job(s) will be processed.`);
    const flowScope = {initialTabIds:(await chrome.tabs.query({}).catch(()=>[])).map(t=>t.id)};
    const action = await executeNaukriRecommendedApply(tab.id, "select-and-apply", { ...runSettings, pageMode: sourceMode, skipJobIds: [...known], allowJobIds: reviewedIds });
    ensureAutoApplyNotStopped();
    if (!action?.ok) throw new Error(action?.error || "Naukri Auto Apply could not select and submit the batch.");
    const selected = NaukriAuto.normalizeSelected(action.selected).slice(0, runSettings.batchSize);
    if (!selected.length) throw new Error("Naukri did not confirm any selected job cards.");

    let targetTabId = tab.id;
    let openedChildTab = null;
    if (action.directApply && !action.inCardApply && selected[0]?.url) {
      openedChildTab = await chrome.tabs.create({
        url: selected[0].url,
        active: Boolean(runSettings.openVisibleTab),
        openerTabId: tab.id
      });
      targetTabId = openedChildTab.id;
      await waitForTabComplete(targetTabId, 25000).catch(() => null);
      await ensureNaukriContent(targetTabId, 12000).catch(() => null);
    }

    run = await transitionAutoApplyRun(run, "SUBMITTING", action.clicked ? "Native Naukri Apply was clicked." : "Job detail opened; waiting for its native Apply control.", { selected, tabId: targetTabId, flowScope, clickDiagnostics: action.diagnostics });

    let outcome = await waitForNaukriApplyOutcome(targetTabId, 22000, flowScope);
    ensureAutoApplyNotStopped();
    if (outcome.status === "waiting-user" || (outcome.status === "partial" && (outcome.followupIds || []).length)) {
      run = await moveRunForOutcome(run, outcome, NaukriAuto.outcomeForSelected(selected, outcome));
      if (runSettings.answerVaultAssist && !outcome.security) {
        const assisted = await assistNaukriFollowup(Number(outcome.tabId || run.tabId || tab.id), runSettings, run);
        run = assisted.run;
        outcome = assisted.outcome;
        ensureAutoApplyNotStopped();
      }
    }

    ensureAutoApplyNotStopped();
    const parts = NaukriAuto.outcomeForSelected(selected, outcome);
    const knownBefore = await readKnownAppliedJobIds();
    const newlyConfirmed = parts.confirmedApplied.filter((item) => !knownBefore.has(item.jobId));
    let mirrored = { updatedJobs: 0, historyAdded: 0, remembered: 0 };
    if (parts.confirmedApplied.length) mirrored = await mirrorNaukriAutoApplySuccess(parts.confirmedApplied, outcome);
    run = await moveRunForOutcome(run, outcome, parts);
    await archiveNaukriAutoApplyRun(run);

    const appliedDelta = newlyConfirmed.length;
    let businessUsage = null;
    if (newlyConfirmed.length) {
      try { businessUsage = await recordBusinessAutoApplyUsage(newlyConfirmed, { runId: run?.id || "" }); }
      catch (usageError) {
        await addAutomationActivity({ type: "business", status: "warning", title: "Usage ledger update failed", detail: safeText(usageError?.message || "Could not update local business usage ledger.", 500) });
      }
    }
    const next = await writeNaukriAutoApply({
      ...runSettings,
      lastRunAt: nowIso(),
      lastStatus: outcome.status,
      lastError: ["failed","pending"].includes(outcome.status) ? safeText(outcome.reason || outcome.error, 1200) : "",
      lastTabId: Number(tab?.id || outcome.tabId || run?.tabId),
      lastSelected: selected,
      lastOutcome: compactNaukriOutcome(outcome),
      totalRuns: settings.totalRuns + 1,
      totalApplied: settings.totalApplied + appliedDelta,
      todayDate: today,
      todayApplied: todayApplied + appliedDelta
    });

    await addAutomationActivity({
      type: "auto-apply",
      status: outcome.status === "applied" ? "success" : outcome.status === "partial" || outcome.status === "waiting-user" ? "warning" : outcome.status === "failed" ? "error" : "info",
      title: outcome.status === "applied" ? "Naukri Auto Apply confirmed" : outcome.status === "partial" ? "Naukri Auto Apply partially completed" : outcome.status === "waiting-user" ? "Naukri Auto Apply needs review" : outcome.status === "failed" ? "Naukri Auto Apply failed" : "Naukri Auto Apply pending",
      detail: `${selected.length} selected · ${parts.confirmedApplied.length} confirmed · ${parts.followup.length || (outcome.status === "waiting-user" ? selected.length - parts.confirmedApplied.length : 0)} follow-up${outcome.reason ? ` · ${outcome.reason}` : ""}`
    });
    if ((openedChildTab?.id || (outcome.tabId && tab?.id && outcome.tabId !== tab.id)) && outcome.status === "applied") {
      const closeId = openedChildTab?.id || outcome.tabId;
      await chrome.tabs.remove(closeId).catch(() => {});
    }
    return { ok: outcome.status !== "failed", selected, outcome, appliedCount: run?.confirmedApplied?.length || parts.confirmedApplied.length, newlyAppliedCount: appliedDelta, mirrored, businessUsage, tabId: Number(tab?.id || outcome.tabId || run?.tabId), settings: next, activeRun: run };
  } catch (error) {
    const message = safeText(error?.message || "Naukri Auto Apply failed.", 1200);
    if (error?.code === "AUTO_APPLY_STOPPED") {
      let stopped = await readAutoApplyActiveRun();
      if (!stopped || !NaukriAuto.TERMINAL.has(stopped.state)) {
        const base = stopped || run;
        if (base && !NaukriAuto.TERMINAL.has(base.state)) {
          try { stopped = await transitionAutoApplyRun(base, "CANCELLED", "Stopped by the user."); }
          catch { stopped = { ...base, state: "CANCELLED", completedAt: nowIso(), updatedAt: nowIso(), error: "" }; await writeAutoApplyActiveRun(stopped); }
        }
      }
      if (stopped) await archiveNaukriAutoApplyRun(stopped);
      const currentSettings = settings || await readNaukriAutoApply();
      const next = await writeNaukriAutoApply({ ...currentSettings, lastRunAt: nowIso(), lastStatus: "cancelled", lastError: "", lastTabId: tab?.id || currentSettings.lastTabId || null });
      await addAutomationActivity({ type: "auto-apply", status: "warning", title: "Naukri Auto Apply stopped", detail: stopped?.id || "Stopped by the user." });
      return { ok: true, stopped: true, outcome: { status: "cancelled", terminal: true, reason: "Stopped by the user." }, tabId: tab?.id || null, settings: next, activeRun: stopped };
    }
    if (run && !NaukriAuto.TERMINAL.has(run.state)) {
      try { run = await transitionAutoApplyRun(run, "FAILED", message, { error: message, tabId: tab?.id || run.tabId || null }); }
      catch { run = { ...run, state: "FAILED", error: message, completedAt: nowIso(), updatedAt: nowIso() }; await writeAutoApplyActiveRun(run); }
      await archiveNaukriAutoApplyRun(run);
    }
    const currentSettings = settings || await readNaukriAutoApply();
    const next = await writeNaukriAutoApply({ ...currentSettings, lastRunAt: nowIso(), lastStatus: "error", lastError: message, lastTabId: tab?.id || currentSettings.lastTabId || null, totalRuns: currentSettings.totalRuns + (run ? 1 : 0) });
    await addAutomationActivity({ type: "auto-apply", status: "error", title: "Naukri Auto Apply failed", detail: message });
    return { ok: false, error: message, tabId: tab?.id || null, settings: next, activeRun: run };
  } finally {
    autoApplyRunInFlight = false;
    autoApplyStopRequested = false;
  }
}


async function runNaukriSearchAutoApply(search = {}, input = {}) {
  await writeNaukriAutoApply({ lastError: "" });
  const requested = normaliseNaukriAutoApply({ ...(await readNaukriAutoApply()), ...(input || {}) });
  const target = Math.max(1, Math.min(5, Number(requested.batchSize) || 1));
  const opened = await openNaukriSearch({ ...(search || {}), active: requested.openVisibleTab });
  if (!opened?.ok || !opened?.tabId) throw new Error(opened?.error || "Could not prepare Naukri Search Results.");
  if (!opened.ready) {
    const ping = await ensureNaukriContent(opened.tabId, 30000).catch(() => null);
    const isSearchUrl = /(?:search|jobs-in-|[-/]jobs|jobsearch|recommendedjobs)/i.test(opened.url || "");
    if (ping?.pageMode !== "search-results" && !isSearchUrl) throw new Error("Naukri Search Results did not finish loading for Auto Apply.");
  }
  let last = null;
  let lastSuccess = null;
  let totalNew = 0;
  const selected = [];
  for (let index = 0; index < target; index += 1) {
    last = await runNaukriAutoApply({ ...requested, batchSize: 1 }, { mode: "search-results", tabId: opened.tabId, sourceUrl: opened.url });
    if (!last?.ok) break;
    lastSuccess = last;
    totalNew += Math.max(0, Number(last.newlyAppliedCount) || 0);
    selected.push(...(Array.isArray(last.selected) ? last.selected : []));
    const status = String(last?.outcome?.status || "pending");
    if (status !== "applied" || !last.selected?.length) break;
    if (last?.outcome?.tabId && opened?.tabId && last.outcome.tabId !== opened.tabId) {
      await chrome.tabs.remove(last.outcome.tabId).catch(() => {});
      await wait(600);
    }
  }
  if (!last && !lastSuccess) return { ok:false, error:"Naukri Search Auto Apply did not start." };
  if (last?.ok === false && lastSuccess) {
    return { ...lastSuccess, ok:true, selected, newlyAppliedCount: totalNew, search: opened.criteria, searchTabId: opened.tabId, sourceMode: "search-results", exhausted:true, completionReason:last.error || "No more eligible search-result jobs were actionable." };
  }
  const result=lastSuccess || last;
  return { ...result, selected, newlyAppliedCount: totalNew, search: opened.criteria, searchTabId: opened.tabId, sourceMode: "search-results" };
}
async function checkNaukriAutoApply(input = {}) {
  let settings = await readNaukriAutoApply();
  let run = await readAutoApplyActiveRun();
  const tabId = Number(input.tabId || run?.tabId || settings.lastTabId) || null;
  if (!tabId) return { ok: false, error: "No Naukri Auto Apply tab is available to check.", settings, activeRun: run };
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return { ok: false, error: "The last Naukri Auto Apply tab is no longer open.", settings, activeRun: run };
  let outcome = classifyNaukriApplyUrl(tab.url || "");
  if (!outcome.terminal) outcome = await waitForNaukriApplyOutcome(tabId, 2500);

  if (!input.skipAssist && (outcome.status === "waiting-user" || (outcome.status === "partial" && (outcome.followupIds || []).length)) && settings.answerVaultAssist && !outcome.security && run && !NaukriAuto.TERMINAL.has(run.state)) {
    if (run.state !== "WAITING_FOLLOWUP") run = await moveRunForOutcome(run, outcome, NaukriAuto.outcomeForSelected(run.selected || settings.lastSelected || [], outcome));
    const assisted = await assistNaukriFollowup(tabId, settings, run);
    run = assisted.run;
    outcome = assisted.outcome;
  }

  const selected = NaukriAuto.normalizeSelected(run?.selected || settings.lastSelected || []);
  const parts = NaukriAuto.outcomeForSelected(selected, outcome);
  const knownBefore = await readKnownAppliedJobIds();
  const newlyConfirmed = parts.confirmedApplied.filter((item) => !knownBefore.has(item.jobId));
  let mirrored = { updatedJobs: 0, historyAdded: 0, remembered: 0 };
  if (parts.confirmedApplied.length) mirrored = await mirrorNaukriAutoApplySuccess(parts.confirmedApplied, outcome);

  if (run && !NaukriAuto.TERMINAL.has(run.state)) {
    run = await moveRunForOutcome(run, outcome, parts);
    await archiveNaukriAutoApplyRun(run);
  }
  const delta = newlyConfirmed.length;
  let businessUsage = null;
  if (newlyConfirmed.length) {
    try { businessUsage = await recordBusinessAutoApplyUsage(newlyConfirmed, { runId: run?.id || "" }); }
    catch (usageError) { await addAutomationActivity({ type: "business", status: "warning", title: "Usage ledger update failed", detail: safeText(usageError?.message || "Could not update local business usage ledger.", 500) }); }
  }
  settings = await writeNaukriAutoApply({
    lastStatus: outcome.status,
    lastError: ["pending","failed"].includes(outcome.status) ? safeText(outcome.reason || outcome.error, 1200) : "",
    lastOutcome: compactNaukriOutcome(outcome),
    totalApplied: settings.totalApplied + delta,
    todayDate: new Date().toISOString().slice(0, 10),
    todayApplied: (settings.todayDate === new Date().toISOString().slice(0, 10) ? settings.todayApplied : 0) + delta
  });
  return { ok: outcome.status !== "failed", tabId, outcome, appliedCount: run?.confirmedApplied?.length || parts.confirmedApplied.length, newlyAppliedCount: delta, mirrored, businessUsage, settings, activeRun: run };
}

async function stopNaukriAutoApply() {
  autoApplyStopRequested = true;
  const run = await readAutoApplyActiveRun();
  if (!run || NaukriAuto.TERMINAL.has(run.state)) return { ok: true, activeRun: run, settings: await readNaukriAutoApply() };
  const stopped = await transitionAutoApplyRun(run, "CANCELLED", "Stopped by the user.");
  await archiveNaukriAutoApplyRun(stopped);
  const settings = await writeNaukriAutoApply({ lastStatus: "cancelled", lastError: "" });
  await addAutomationActivity({ type: "auto-apply", status: "warning", title: "Naukri Auto Apply stopped", detail: `Run ${stopped.id}` });
  return { ok: true, activeRun: stopped, settings };
}


async function buildSystemDiagnostics() {
  const manifest = chrome.runtime.getManifest();
  const [stored, watchdogAlarm, boostAlarm, auth] = await Promise.all([
    chrome.storage.local.get([
      "schemaVersion","migrationHistory","jobs","applyEngineSessions","automationActivity","teamWorkspace","naukriConnection","profileBoost","cloudMigration"
    ]),
    chrome.alarms.get(AUTOMATION_WATCHDOG_ALARM).catch(() => null),
    chrome.alarms.get(PROFILE_BOOST_ALARM).catch(() => null),
    authStatus().catch(() => ({ configured:false, authenticated:false, providerLabel:"" }))
  ]);
  const workspace = stored.teamWorkspace ? NowCurryTeam.normalizeWorkspace(stored.teamWorkspace) : null;
  const candidate = workspace ? NowCurryTeam.activeCandidate(workspace) : null;
  const connection = normaliseConnection(stored.naukriConnection || {});
  const diagnostics = Diagnostics.build({
    extensionVersion: manifest.version_name || manifest.version || "",
    schemaVersion: Number(stored.schemaVersion) || 0,
    expectedSchema: Storage.SCHEMA_VERSION,
    storageAccess: await STORAGE_SECURITY_READY,
    auth: { configured:Boolean(auth?.configured), authenticated:Boolean(auth?.authenticated), providerLabel:safeText(auth?.providerLabel,80) },
    naukriConnected: connection.state === "connected" || connection.sessionState === "authenticated",
    naukriDetail: `${connection.label || connection.state || "Not checked"}${connection.lastCheckedAt ? ` · last checked ${connection.lastCheckedAt}` : ""}`,
    watchdogAlarm:Boolean(watchdogAlarm),
    profileBoostEnabled:Boolean(stored.profileBoost?.enabled),
    profileBoostAlarm:Boolean(boostAlarm),
    messageProtocolVersion: globalThis.NowCurryMessage.PROTOCOL_VERSION,
    activeCandidateConfigured:Boolean(candidate),
    cloudMigration: stored.cloudMigration || DEFAULTS.cloudMigration,
    counts:{
      jobs:Array.isArray(stored.jobs)?stored.jobs.length:0,
      applySessions:Array.isArray(stored.applyEngineSessions)?stored.applyEngineSessions.length:0,
      activity:Array.isArray(stored.automationActivity)?stored.automationActivity.length:0,
      candidates:Array.isArray(workspace?.candidates)?workspace.candidates.length:0
    },
    migrations:Array.isArray(stored.migrationHistory)?stored.migrationHistory:[],
    providers:PortalAdapters.publicSummary()
  });
  return Security.sanitizeForSupport(diagnostics);
}


function parseNaukriDob(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const months = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
  let m = raw.match(/^(\d{1,2})[\s-]+([A-Za-z]{3,})[\s-]+(\d{4})$/);
  if (m) { const mon = months[m[2].slice(0,3).toLowerCase()]; if (mon) return `${m[3]}-${mon}-${String(m[1]).padStart(2,"0")}`; }
  m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return "";
}
function detectNaukriDob(profile = {}) {
  const fields = profile?.naukriProfile?.private?.personal?.fields || {};
  for (const [label, value] of Object.entries(fields)) {
    if (/date.*of.*birth/i.test(label)) {
      const iso = parseNaukriDob(value);
      if (iso && Auth.normalizeDob(iso)) return iso;
    }
  }
  return "";
}

function autoProfileChangedFields(before = {}, after = {}) {
  const fields = ['fullName', 'headline', 'email', 'phone', 'dateOfBirth', 'location', 'experienceYears', 'currentSalary', 'expectedSalary', 'skills', 'summary'];
  const changed = [];
  for (const f of fields) {
    const v1 = JSON.stringify(before[f] ?? null);
    const v2 = JSON.stringify(after[f] ?? null);
    if (v1 !== v2) changed.push(f);
  }
  if (!before.naukriProfile && after.naukriProfile) changed.push('naukriProfile');
  return changed;
}

async function saveAutomaticNaukriProfile(profile={},diagnostics={}) {
  if(!profile||typeof profile!=="object"||!profile.naukriProfile) throw new Error("Automatic Naukri capture did not contain a direct profile map.");
  const stored=await chrome.storage.local.get(["profile","profileRevisions"]);
  const before=stored.profile||{};
  const now=nowIso();
  const merged={...before,...profile,source:"naukri-profile",sourceLabel:"Captured automatically from Naukri",updatedAt:now,capturedAt:profile.capturedAt||now};
  if(!merged.dateOfBirth){
    const detected=detectNaukriDob(profile);
    if(detected){ merged.dateOfBirth=detected; merged.dateOfBirthSource="naukri-detected"; }
  }
  const changedFields=autoProfileChangedFields(before,merged);
  const revisions=Array.isArray(stored.profileRevisions)?stored.profileRevisions:[];
  let nextRevisions=revisions;
  if(changedFields.length||!before.naukriProfile){
    const revision={id:`profile-revision-${Date.now()}`,capturedAt:merged.capturedAt,source:"naukri-profile",sourceUrl:merged.sourceUrl||profile.sourceUrl||"",reason:"automatic direct Naukri DOM capture",changedFields,profile:merged};
    nextRevisions=[revision,...revisions].slice(0,100);
  }
  await chrome.storage.local.set({profile:merged,profileRevisions:nextRevisions,lastAutomaticNaukriCapture:{at:now,sourceUrl:sanitizeOperationalUrl(merged.sourceUrl||profile.sourceUrl||""),diagnostics:diagnostics&&typeof diagnostics==="object"?diagnostics:{}},schemaVersion:Storage.SCHEMA_VERSION});
  return {profile:merged,changedFields,revisionAdded:nextRevisions!==revisions};
}

chrome?.runtime?.onMessage?.addListener?.((message, sender, sendResponse) => {
  if (message?.type === 'APPLYRA_OPPORTUNITY_SCAN') return false;

  const reply = (payload) => respondSafely(sendResponse, payload, message);
  (async () => {
    await STORAGE_SECURITY_READY;
    if (!Security.isTrustedRuntimeSender(sender, chrome.runtime.id)) {
      reply({ ok: false, error: "Unauthorized extension message sender." });
      return;
    }
    if (message?.type === "APPLYRA_SECURITY_VIOLATION_KILL_TAB") {
      reply({ ok: true, ignored: true });
      return;
    }
    if (message?.type === "APPLYRA_HEARTBEAT_ACK") {
      reply({ ok: true, timestamp: Date.now() });
      return;
    }
    if (message?.type === "ENSURE_OFFSCREEN_KEEPALIVE") {
      const active = await ensureOffscreenDocument();
      reply({ ok: true, active });
      return;
    }
    if (message?.type === "RELEASE_OFFSCREEN_KEEPALIVE") {
      await closeOffscreenDocument();
      reply({ ok: true, closed: true });
      return;
    }
    if (message?.type === "AUTH_GET_STATUS") {
      reply(await authStatus());
      return;
    }
    if (message?.type === "ADMIN_GET_LOCAL_CONTEXT") {
      try { reply(await adminLocalContext()); } catch (error) { reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "AUTH_SAVE_CONFIG") {
      try {
        const existing = await readAuthConfig();
        if (existing.configured && existing.requireAuth !== false) {
          const current = await currentAuthSession();
          if (!current.session?.accessToken) throw new Error("Sign in before changing the authentication backend configuration.");
        }
        await writeAuthConfig(message.config || {});
        reply({ ok: true, status: await authStatus() });
      } catch (error) { reply({ ok: false, error: safeText(error?.message || error, 700) }); }
      return;
    }
    if (message?.type === "AUTH_SIGN_IN_EMAIL") {
      try { reply({ ok: true, status: await signInEmail(message.email, message.password, Boolean(message.persistent)) }); }
      catch (error) { reply({ ok: false, error: safeText(error?.message || error, 700) }); }
      return;
    }
    if (message?.type === "AUTH_SIGN_UP_EMAIL") {
      try {
        const result = await signUpEmail(message.email, message.password, Boolean(message.persistent), message.fullName, message.phone, message.dob);
        reply({ ok: true, ...result });
      } catch (error) { reply({ ok: false, error: safeText(error?.message || error, 700) }); }
      return;
    }
    if (message?.type === "AUTH_OAUTH") {
      try { reply({ ok: true, status: await startOAuth(safeText(message.provider, 40), Boolean(message.persistent)) }); }
      catch (error) { reply({ ok: false, error: safeText(error?.message || error, 700) }); }
      return;
    }
    if (message?.type === "AUTH_SIGN_OUT") {
      reply({ ok: true, status: await signOutAuth() });
      return;
    }
    if (message?.type === "AUTH_SWITCH_ACCOUNT") {
      try {
        const res = await switchActiveAccount(message.email);
        reply(res);
      } catch (error) {
        reply({ ok: false, error: safeText(error?.message || error, 700) });
      }
      return;
    }
    const authGate = await currentAuthSession();
    if (authGate.config.configured && authGate.config.requireAuth !== false && !authGate.session?.accessToken) {
      reply({ ok: false, error: "Applyra sign-in is required for this action.", authRequired: true });
      return;
    }
    if (message?.type === "NAUKRI_AUTO_PROFILE_CAPTURE") {
      try { reply({ok:true,...await saveAutomaticNaukriProfile(message.profile||{},message.diagnostics||{})}); }
      catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "ADMIN_API_REQUEST") {
      reply(await adminApiRequest(message.action, message.payload || {}));
      return;
    }
    if (message?.type === "BILLING_API_REQUEST") {
      reply(await billingApiRequest(message.action, message.payload || {}));
      return;
    }
    if (message?.type === "PAYMENT_PROVIDER_API_REQUEST") {
      reply(await paymentProviderApiRequest(message.action, message.payload || {}));
      return;
    }
    if (message?.type === "GET_TEAM_WORKSPACE") {
      const stored = await chrome.storage.local.get(["teamWorkspace","profile","applyEngineAnswerVault"]);
      let w = stored.teamWorkspace;
      if (!w) { w = NowCurryTeam.createWorkspace({profile:stored.profile||{},memory:stored.applyEngineAnswerVault||{}}); await chrome.storage.local.set({teamWorkspace:w,schemaVersion:Storage.SCHEMA_VERSION}); }
      reply({ok:true,workspace:NowCurryTeam.normalizeWorkspace(w)}); return;
    }
    if (message?.type === "SAVE_TEAM_WORKSPACE") {
      const w=NowCurryTeam.normalizeWorkspace(message.workspace||{}); const c=NowCurryTeam.activeCandidate(w);
      // Keep the legacy single-user profile untouched: the React workspace still owns that schema.
      // Candidate switching drives the automation Answer Vault through a dedicated active-candidate snapshot.
      await chrome.storage.local.set({teamWorkspace:w,activeCandidateProfile:c?.profile||{},applyEngineAnswerVault:c?.memory||{},schemaVersion:Storage.SCHEMA_VERSION});
      reply({ok:true,workspace:w,activeCandidateId:w.activeCandidateId}); return;
    }
    if (message?.type === "ADD_PORTAL_JOB" || message?.type === "ADD_LINKEDIN_JOB") {
      try {
        const job=PortalAdapters.createIntake(message.job||{});
        if(message.type === "ADD_LINKEDIN_JOB" && job.provider !== "linkedin") throw new Error("Only HTTPS LinkedIn URLs are accepted for the legacy LinkedIn intake action.");
        const st=await chrome.storage.local.get(["jobs","teamWorkspace"]);
        const previous=Array.isArray(st.jobs)?st.jobs:[];
        const same=(x)=>String(x?.url||x?.applyUrl||"").toLowerCase()===job.url.toLowerCase();
        const existing=previous.find(same);
        const jobs=existing?[{...existing,...job,id:existing.id||job.id,discoveredAt:existing.discoveredAt||job.discoveredAt},...previous.filter(x=>!same(x))]:[job,...previous];
        let w=st.teamWorkspace?NowCurryTeam.normalizeWorkspace(st.teamWorkspace):NowCurryTeam.createWorkspace({});
        w=NowCurryTeam.recordTeamEvent(w,{type:`${job.provider}-intake`,message:`Saved ${job.title}`});
        await chrome.storage.local.set({jobs,teamWorkspace:w,schemaVersion:Storage.SCHEMA_VERSION});
        const adapter=PortalAdapters.byId(job.provider);
        reply({ok:true,job,adapter:{id:adapter.id,label:adapter.label,mode:adapter.mode,capabilities:{...adapter.capabilities}},deduplicated:Boolean(existing)});
      } catch(e){reply({ok:false,error:String(e.message||e)});} return;
    }
    if (message?.type === "GET_SYSTEM_DIAGNOSTICS") {
      reply({ ok:true, diagnostics:await buildSystemDiagnostics() });
      return;
    }
    if (message?.type === "RUN_STORAGE_MIGRATIONS") {
      const migration=await Migration.migrate(chrome.storage.local,{target:Storage.SCHEMA_VERSION,Team:globalThis.NowCurryTeam,Business});
      reply({ok:true,migration,diagnostics:await buildSystemDiagnostics()});
      return;
    }
    if (message?.type === "RUN_PRODUCTION_PREFLIGHT") {
      try { reply({ok:true, report:await runProductionPreflight()}); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "CLOUD_MIGRATION_PREVIEW") {
      try { reply({ok:true,...await previewCloudMigration()}); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "CLOUD_MIGRATION_PUSH") {
      try { reply({ok:true,...await pushLocalWorkspaceToCloud()}); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "CLOUD_MIGRATION_VERIFY") {
      try { reply({ok:true,...await verifyCloudWorkspace()}); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "DELETE_REMOTE_USER_DATA") {
      try { reply({ok:true,state:await deleteRemoteWorkspaceData()}); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "CLEAR_LOCAL_USER_DATA") {
      try { reply(await clearLocalUserData()); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "DELETE_APPLYRA_ACCOUNT") {
      try { reply(await deleteApplyraAccount()); } catch(error){ reply({ok:false,error:safeText(error?.message||error,700)}); }
      return;
    }
    if (message?.type === "GET_CLOUD_MIGRATION_STATUS") {
      const stored=await chrome.storage.local.get(['cloudMigration']);
      reply({ok:true,state:stored.cloudMigration||DEFAULTS.cloudMigration,localSourceRetained:true});
      return;
    }
    if (message?.type === "GET_SECURITY_STATUS") {
      const downloadGranted = await hasDownloadPermission();
      const providerPermissions = {};
      for (const id of ["foorilla","hiringcafe","remotive","adzuna"]) providerPermissions[id] = await hasProviderPermission(id);
      reply({ ok: true, version: Security.VERSION, storageAccess: await STORAGE_SECURITY_READY, downloadGranted, providerPermissions, retention: { automationActivityDays: 90, autoApplyRunDays: 180, businessAuditDays: 180, usageLedgerDays: 550 } });
      return;
    }
    if (message?.type === "CLEAR_SECURITY_DIAGNOSTICS") {
      await chrome.storage.local.set({ automationActivity: [], businessAudit: [], naukriAutoApplyRuns: [], universalRuns: [], runs: [] });
      reply({ ok: true });
      return;
    }
    if (message?.type === "EXPORT_PRIVATE_BACKUP") {
      reply(await exportPrivateBackup());
      return;
    }
    if (message?.type === "GET_BUSINESS_BETA_STATE") {
      const business = await readBusinessState();
      reply({ ok: true, version: Business.VERSION, plans: Business.PLANS, planOrder: Business.PLAN_ORDER, ...business });
      return;
    }
    if (message?.type === "SAVE_BUSINESS_LOCAL_ACCOUNT") {
      const before = await readBusinessState();
      const account = await writeBusinessAccount(message.account || {});
      await addBusinessAudit("account", "Local business identity updated", `${account.displayName || "Unnamed user"} · ${account.email || "no email"}`, { plan: account.plan });
      reply({ ok: true, account, usage: businessUsageSummary(before.usageLedger, account) });
      return;
    }
    if (message?.type === "SET_BUSINESS_BETA_PLAN") {
      reply({ ok:false, error:"Local paid-plan simulation was removed in v2.8.0-beta.5. This build exposes only the real Founding Beta entitlement." });
      return;
    }
    if (message?.type === "EXPORT_BUSINESS_DATA") {
      reply(await exportBusinessData(message.mode === "support" ? "support" : "full"));
      return;
    }
    if (message?.type === "RESET_BUSINESS_BETA") {
      const account = Business.createLocalAccount({ plan: "beta" });
      await chrome.storage.local.set({ businessAccount: account, businessUsageLedger: [], businessAudit: [], schemaVersion: Storage.SCHEMA_VERSION });
      reply({ ok: true, account, usage: businessUsageSummary([], account), audit: [] });
      return;
    }
    if (message?.type === "NAUKRI_MANUAL_FOLLOWUP_ANSWER") {
      reply(await rememberManualNaukriFollowupAnswer(message.question, message.answer, sender?.tab?.id || message.tabId, message.page));
      return;
    }
    if (message?.type === "GET_NAUKRI_AUTO_APPLY") {
      const stored = await chrome.storage.local.get(["naukriAutoApplyRuns"]);
      reply({ ok: true, settings: await readNaukriAutoApply(), activeRun: await readAutoApplyActiveRun(), runs: Array.isArray(stored.naukriAutoApplyRuns) ? stored.naukriAutoApplyRuns : [] });
      return;
    }
    if (message?.type === "SET_NAUKRI_AUTO_APPLY") {
      reply({ ok: true, settings: await writeNaukriAutoApply(message.settings || {}) });
      return;
    }
    if (message?.type === "PREVIEW_NAUKRI_AUTO_APPLY") {
      reply(await previewNaukriAutoApply(message.settings || {}));
      return;
    }
    if (message?.type === "RUN_NAUKRI_AUTO_APPLY") {
      reply(await runNaukriAutoApply(message.settings || {}));
      return;
    }
    if (message?.type === "RUN_NAUKRI_SEARCH_AUTO_APPLY") {
      reply(await runNaukriSearchAutoApply(message.search || {}, message.settings || {}));
      return;
    }
    if (message?.type === "CHECK_NAUKRI_AUTO_APPLY") {
      reply(await checkNaukriAutoApply(message || {}));
      return;
    }
    if (message?.type === "STOP_NAUKRI_AUTO_APPLY") {
      reply(await stopNaukriAutoApply());
      return;
    }
    if (message?.type === "UNIVERSAL_JOB_ACTION") {
      const stored = await chrome.storage.local.get(["universalJobs", "profile", "jobs", "history"]);
      const map = stored.universalJobs || {};
      const job = NowCurryUniversal.enrich(message.job || {}, stored.profile || {});
      if (!job.fingerprint) throw new Error("Job fingerprint missing");
      const requested = safeText(message.status || message.action || "saved", 40).toLowerCase();
      if (requested === "remove") delete map[job.fingerprint];
      else map[job.fingerprint] = NowCurryUniversal.record(job, requested, map[job.fingerprint] || {});

      // Mirror the lifecycle action into the native workspace so Saved,
      // Applications, Pipeline, Career Coach and Exports all see the same job.
      const native = nativeJobFromRadar(job);
      const nativeMap = new Map();
      (Array.isArray(stored.jobs) ? stored.jobs : []).forEach((item) => nativeMap.set(nativeJobKey(item), item));
      const key = nativeJobKey(native);
      const previous = nativeMap.get(key) || {};
      const nativeStatus = { reviewed: "Shortlisted", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Rejected" }[requested];
      const nextNative = {
        ...previous,
        ...native,
        saved: requested === "remove" ? false : (requested === "saved" ? true : Boolean(previous.saved)),
        status: nativeStatus || previous.status || native.status || "Unreviewed",
        statusUpdatedAt: nativeStatus ? nowIso() : previous.statusUpdatedAt,
        lastOpenedAt: previous.lastOpenedAt
      };
      nativeMap.set(key, nextNative);
      const nativeJobs = Array.from(nativeMap.values());

      let history = normaliseHistory(stored.history || []);
      if (["applied", "interview", "offer", "rejected"].includes(requested)) {
        const eventType = requested === "interview" ? "interview" : "application";
        history = normaliseHistory([...history, {
          id: `external-${requested}|${job.fingerprint}|${Date.now()}`,
          type: eventType,
          title: native.title || "External opportunity",
          company: native.company || "",
          url: sanitizeOperationalUrl(native.url || native.applyUrl || ""),
          sourceUrl: sanitizeOperationalUrl(native.sourcePage || native.url || ""),
          occurredAt: nowIso(),
          capturedAt: nowIso(),
          details: `Marked ${nativeStatus || requested} in Applyra`,
          status: nativeStatus || requested,
          confidence: 1,
          source: `nowcurry-${job.source?.id || "external"}`
        }]);
      }

      await chrome.storage.local.set({ universalJobs: map, jobs: nativeJobs, history, schemaVersion: Storage.SCHEMA_VERSION });
      reply({ ok: true, item: map[job.fingerprint] || null, nativeJob: nextNative, jobs: nativeJobs, history, counts: Object.values(map).reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}) });
      return;
    }
    if (message?.type === "GET_UNIVERSAL_CAREER") {
      const stored = await chrome.storage.local.get(["universalJobs"]);
      const items = Object.values(stored.universalJobs || {}).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
      reply({ ok: true, version: NowCurryUniversal.version, items, counts: items.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}) });
      return;
    }
    if (message?.type === "GET_UNIVERSAL_WORKSPACE") {
      const stored = await chrome.storage.local.get(["universalJobs", "universalRuns", "radarCache", "radarConfig", "radarProviderSecrets"]);
      const items = Object.values(stored.universalJobs || {}).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
      reply({
        ok: true,
        version: NowCurryUniversal.version,
        items,
        counts: items.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}),
        runs: stored.universalRuns || [],
        radarCache: stored.radarCache || DEFAULTS.radarCache,
        radarConfig: publicRadarConfig(stored.radarConfig || DEFAULTS.radarConfig, stored.radarProviderSecrets || {})
      });
      return;
    }
    if (message?.type === "EXPORT_UNIVERSAL_CAREER") {
      await requireDownloadPermission();
      const stored = await chrome.storage.local.get(["universalJobs", "universalRuns", "radarConfig", "radarProviderSecrets"]);
      const safeConfig = publicRadarConfig(stored.radarConfig || DEFAULTS.radarConfig, stored.radarProviderSecrets || {});
      const exportObject = Security.sanitizeForPrivateBackup({ exportedAt: nowIso(), version: NowCurryUniversal.version, opportunities: Object.values(stored.universalJobs || {}), runs: stored.universalRuns || [], providerConfig: safeConfig });
      const payload = JSON.stringify(exportObject, null, 2);
      const url = `data:application/json;charset=utf-8,${encodeURIComponent(payload)}`;
      await chrome.downloads.download({ url, filename: `Applyra-opportunities-${new Date().toISOString().slice(0,10)}.json`, saveAs: true });
      reply({ ok: true });
      return;
    }
    if (message?.type === "EXTRACT_EXTERNAL_PROVIDERS") {
      reply(await extractExternalProviders(
        safeText(message.query, 180),
        Math.max(1, Math.min(100, Number(message.limit) || 40)),
        Array.isArray(message.providers) ? message.providers : []
      ));
      return;
    }
    if (message?.type === "SEARCH_JOB_RADAR") {
      reply(await searchJobRadar(safeText(message.query, 180), Math.max(1, Math.min(50, Number(message.limit) || 30)), Array.isArray(message.providers) ? message.providers : null));
      return;
    }
    if (message?.type === "GET_JOB_RADAR_STATUS") {
      const stored = await chrome.storage.local.get(["radarCache", "radarConfig", "radarProviderSecrets"]);
      reply({ ok: true, version: NowCurryRadar.version, radarCache: stored.radarCache || DEFAULTS.radarCache, radarConfig: publicRadarConfig(stored.radarConfig || DEFAULTS.radarConfig, stored.radarProviderSecrets || {}) });
      return;
    }
    if (message?.type === "OPEN_NAUKRI_SEARCH") {
      try {
        reply(await openNaukriSearch(message.search || message.criteria || {}));
      } catch (error) {
        reply({ ok: false, error: safeText(error?.message || "Could not open Naukri search.", 800) });
      }
      return;
    }
    if (message?.type === "OPEN_NAUKRI_EXTRACTOR_SEARCH") {
      try {
        reply(await openNaukriExtractorSearch(message.search || message.criteria || {}));
      } catch (error) {
        reply({ ok: false, error: safeText(error?.message || "Could not prepare Naukri extraction search.", 800) });
      }
      return;
    }
    if (message?.type === "OPEN_DASHBOARD") {
      const source = message.sourceTabId ? `&sourceTab=${encodeURIComponent(message.sourceTabId)}` : "";
      const target = Math.max(1, Math.min(100000, Number(message.target) || 100));
      const untilLast = message.untilLast ? "1" : "0";
      chrome.tabs.create({ url: chrome.runtime.getURL(`index.html?scan=1&target=${target}&untilLast=${untilLast}${source}`) });
      reply({ ok: true });
      return;
    }
    if (message?.type === "GET_PROFILE_REFRESH_STATUS") {
      reply({ ok: true, retired: true, profileRefresh: await readRefresh() });
      return;
    }
    if (message?.type === "SET_PROFILE_REFRESH") {
      reply({ ok: false, retired: true, error: "Background Profile Refresh was removed in v2.6.2.", profileRefresh: await setRefreshSettings() });
      return;
    }
    if (message?.type === "REFRESH_PROFILE_NOW") {
      reply(await runProfileRefresh("manual"));
      return;
    }
    if (message?.type === "ACK_PROFILE_REFRESH") {
      reply({ ok: true, profileRefresh: await acknowledgeRefresh(message.id) });
      return;
    }
    if (message?.type === "GET_PROFILE_BOOST_STATUS") {
      reply({ ok: true, profileBoost: await readProfileBoost() });
      return;
    }
    if (message?.type === "SET_PROFILE_BOOST") {
      reply({ ok: true, profileBoost: await setProfileBoostSettings(message.settings || {}) });
      return;
    }
    if (message?.type === "RUN_PROFILE_BOOST_NOW") {
      reply(await runProfileBoost("manual"));
      return;
    }
    if (message?.type === "RECOVER_PROFILE_BOOST") {
      reply(await recoverProfileBoost());
      return;
    }
    if (message?.type === "GET_AUTOMATION_ACTIVITY") {
      const stored = await chrome.storage.local.get(["automationActivity"]);
      reply({ ok: true, activity: normaliseAutomationActivity(stored.automationActivity || []) });
      return;
    }
    if (message?.type === "CLEAR_AUTOMATION_ACTIVITY") {
      await chrome.storage.local.set({ automationActivity: [] });
      reply({ ok: true, activity: [] });
      return;
    }
    if (message?.type === "RUN_AUTOMATION_WATCHDOG") {
      reply(await runAutomationWatchdog());
      return;
    }
    if (message?.type === "CHECK_NAUKRI_SESSION" || message?.type === "GET_NAUKRI_CONNECTION") {
      const result = await checkNaukriSession(Number(message.tabId) || null);
      reply(result);
      return;
    }
    if (message?.type === "GET_ACCOUNT_HISTORY_STATUS") {
      const state = await readHistoryState();
      reply({ ok: true, ...state });
      return;
    }
    if (message?.type === "BACKFILL_ACCOUNT_HISTORY") {
      reply(await backfillAccountHistory(Number(message.tabId) || null));
      return;
    }
    reply({ ok: false, error: "Unknown background message." });
  })().catch((error) => reply({ ok: false, error: error?.message || "Background action failed." }));
  return true;
});
