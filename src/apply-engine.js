(() => {
  'use strict';
  if (window.location.protocol === 'file:' || !globalThis.chrome?.runtime?.id) {
    const showWarning = () => {
      const el = document.getElementById('fileProtocolWarning');
      if (el) el.style.display = 'block';
    };
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', showWarning);
    } else {
      showWarning();
    }
  }
  const Message = globalThis.NowCurryMessage;
  const Storage = globalThis.NowCurryStorage;
  const PortalAdapters = globalThis.NowCurryPortalAdapters;
  const Core = globalThis.NowCurryApplyCore;
  const Business = globalThis.NowCurryBusinessCore;
  const CandidateMemory = globalThis.NowCurryCandidateMemory;
  const Team = globalThis.NowCurryTeam;
  const MultiPortal = globalThis.NowCurryMultiPortal;
  if (!Message || !Storage || !PortalAdapters) throw new Error('Reliability Core modules not loaded.');
  if (!Core) throw new Error('Automation Center core not loaded.');
  if (!Business) throw new Error('Business core not loaded.');
  if (!CandidateMemory || !Team || !MultiPortal) throw new Error('Integrated platform cores did not load.');

  const DEFAULT_VAULT = {currentLocation:'',preferredLocation:'',relocationCities:'',yearsExperience:'',experienceFacts:'',noticePeriod:'',lastWorkingDay:'',lastWorkingDayAnswer:'',availableFrom:'',currentCtc:'',expectedCtc:'',workAuthorization:'',remotePreference:'',relocation:'',fiveDayWfo:'',pfAllEmployments:'',formerEmployers:'',employerIds:'',capabilityFacts:'',linkedinUrl:'',portfolioUrl:'',githubUrl:'',reasonForChange:'',custom:[]};
  const DEFAULT_SAFETY = {dailyCap:30,maxParallel:1,requireFinalReview:false,pauseSecurity:true,watchdogMinutes:15};
  const DEFAULT_BOOST = {enabled:false,cadence:'off',mode:'reversible',runOnStartup:false,autoOpenProfile:true,lastAttemptAt:'',lastSuccessAt:'',lastStatus:'idle',lastError:'',nextRunAt:'',totalSuccesses:0,todayDate:'',todaySuccesses:0,rollbackRequired:false};
  const DEFAULT_AUTO = {mode:'recommended-ui',batchSize:1,includeKeywords:'',excludeKeywords:'',redFlagGuard:true,openVisibleTab:true,answerVaultAssist:true,rememberManualAnswers:true,skipKnownApplied:true,reusePreviewTab:true,lastPreviewAt:'',lastPreviewKey:'',lastPreviewCandidates:[],lastPreviewEligibleCount:0,lastRunAt:'',lastStatus:'idle',lastError:'',lastTabId:null,lastSelected:[],lastOutcome:null,totalRuns:0,totalApplied:0,todayDate:'',todayApplied:0};
  const DISCOVERY = [
    ['Applyra Live Market Engine', 'Continuous calibrated intelligence stream'],
    ['Applyra Deep Tech & AI', 'High-growth engineering opportunities'],
    ['Applyra Direct Employer Network', 'Verified organizational hiring feeds'],
    ['Applyra Global Remote Radar', 'Calibrated distributed positions']
  ];
  const state={jobs:[],sessions:[],vault:{...DEFAULT_VAULT},workspace:null,safety:{...DEFAULT_SAFETY},profileBoost:{...DEFAULT_BOOST},autoApply:{...DEFAULT_AUTO},autoRuns:[],autoActiveRun:null,activity:[],naukri:null,naukriConnection:null,business:{account:Business.createLocalAccount({plan:'beta'}),usageLedger:[],usage:null,audit:[],plans:Business.PLANS},auth:null,diagnostics:null,cloud:{state:null,localSourceRetained:true,preview:null},productionPreflight:null};
  let autoRunLoopRequested=false;
  let autoRunLoopSummary={batch:0,confirmed:0,lastMessage:''};
  const $=(id)=>document.getElementById(id);
  function safeHttpUrl(value){
    try{const u=new URL(String(value||''));return u.protocol==='https:'||u.protocol==='http:'?u.href:'';}catch{return '';}
  }
  const fallbackStorage = {
    async get(keys) {
      const res = {};
      const keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
      for (const k of keyList) {
        try {
          const val = localStorage.getItem(`applyra_${k}`);
          if (val !== null) res[k] = JSON.parse(val);
          else if (typeof keys === 'object' && !Array.isArray(keys) && keys[k] !== undefined) res[k] = keys[k];
        } catch {
          if (typeof keys === 'object' && !Array.isArray(keys) && keys[k] !== undefined) res[k] = keys[k];
        }
      }
      return res;
    },
    async set(obj) {
      for (const [k, v] of Object.entries(obj || {})) {
        try { localStorage.setItem(`applyra_${k}`, JSON.stringify(v)); } catch {}
      }
    }
  };

  async function handleLocalSimulatedMessage(payload) {
    const type = payload?.type;
    if (type === 'GET_NAUKRI_AUTO_APPLY') {
      const stored = await fallbackStorage.get(['naukriAutoApply', 'naukriAutoApplyRuns']);
      return { ok: true, settings: { ...DEFAULT_AUTO, ...(stored.naukriAutoApply || {}) }, runs: stored.naukriAutoApplyRuns || [] };
    }
    if (type === 'SET_NAUKRI_AUTO_APPLY') {
      await fallbackStorage.set({ naukriAutoApply: payload.settings || {} });
      return { ok: true, settings: payload.settings };
    }
    if (type === 'PREVIEW_NAUKRI_AUTO_APPLY') {
      const candidates = [
        { jobId: 'sample-1', title: 'Senior Software Engineer (Full Stack)', company: 'Tech Corp India', location: 'Bengaluru / Hybrid', url: 'https://www.naukri.com' },
        { jobId: 'sample-2', title: 'Lead AI / ML Engineer', company: 'DeepScale Systems', location: 'Hyderabad / Remote', url: 'https://www.naukri.com' },
        { jobId: 'sample-3', title: 'Frontend Specialist (React / Next.js)', company: 'Innovate Labs', location: 'Pune / Flexible', url: 'https://www.naukri.com' }
      ];
      const settings = { ...(payload.settings || {}), lastPreviewAt: new Date().toISOString(), lastPreviewCandidates: candidates, lastPreviewEligibleCount: candidates.length, lastStatus: 'preview', lastError: '' };
      await fallbackStorage.set({ naukriAutoApply: settings });
      return { ok: true, candidateCount: candidates.length, candidates, eligibilityMessage: `Preview ready (Local demo mode): ${candidates.length} candidates loaded. To connect to live Naukri tabs, launch from the extension icon in Brave/Chrome toolbar.`, settings };
    }
    if (type === 'RUN_NAUKRI_AUTO_APPLY') {
      toast('Live Naukri auto-apply requires running inside the browser extension (Brave/Chrome). Use the toolbar extension icon.');
      return { ok: false, error: 'Live Naukri tab execution requires running from the browser extension toolbar. On file://, preview and settings are enabled in local demo mode.' };
    }
    if (type === 'CHECK_NAUKRI_CONNECTION') {
      return { ok: true, connected: false, message: 'Standalone preview mode. Sign in to Naukri in Brave/Chrome to use live portal features.' };
    }
    if (type === 'GET_TEAM_WORKSPACE') {
      const stored = await fallbackStorage.get(['teamWorkspace']);
      return { ok: true, workspace: stored.teamWorkspace || null };
    }
    if (type === 'SAVE_TEAM_WORKSPACE') {
      await fallbackStorage.set({ teamWorkspace: payload.workspace });
      return { ok: true };
    }
    return { ok: true };
  }

  const api={
    async get(keys){
      if(globalThis.chrome?.storage?.local) return chrome.storage.local.get(keys);
      return fallbackStorage.get(keys);
    },
    async set(obj){
      if(globalThis.chrome?.storage?.local) return chrome.storage.local.set(obj);
      return fallbackStorage.set(obj);
    },
    async message(payload,options={}){
      if(globalThis.chrome?.runtime?.sendMessage) return Message.sendRuntime(chrome,payload,options);
      return handleLocalSimulatedMessage(payload);
    },
    async open(url, active=false){
      const safe=safeHttpUrl(url);if(!safe) throw new Error('Blocked an invalid or non-HTTP(S) URL.');
      if(globalThis.chrome?.tabs?.create) return chrome.tabs.create({url:safe,active:Boolean(active)});
      window.open(safe, '_blank');
      return {url: safe};
    },
    async updateTab(id,url, active=false){
      const safe=safeHttpUrl(url);if(!safe) throw new Error('Blocked an invalid or non-HTTP(S) URL.');
      if(id&&globalThis.chrome?.tabs?.update) return chrome.tabs.update(id,{active:Boolean(active),url:safe});
      return api.open(safe, active);
    }
  };

  async function ensureDownloadPermission(){
    if(!globalThis.chrome?.permissions?.request) return true;
    return chrome.permissions.request({permissions:['downloads']}).catch(()=>false);
  }

  function toast(message){ const el=$('toast'); el.textContent=message; el.hidden=false; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.hidden=true,3600); }
  function escapeHtml(v){ return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function sessionActive(s){ return !['APPLIED','FAILED','STOPPED'].includes(s.state); }
  function dateLabel(value){ if(!value) return 'Never'; const d=new Date(value); return Number.isNaN(d.getTime())?String(value):d.toLocaleString(); }
  function statusLabel(value){ return String(value||'idle').replaceAll('-',' ').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()); }

  async function logActivity(type,status,title,detail=''){
    const stored=await api.get(['automationActivity']);
    const next=[{id:`activity-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),type,status,title,detail,source:'automation-center'},...(Array.isArray(stored.automationActivity)?stored.automationActivity:[])].slice(0,500);
    state.activity=next;
    await api.set({automationActivity:next});
    renderActivity();
  }

  function syncVaultFromWorkspace(){
    if(!state.workspace) return;
    const active=Team.activeCandidate(state.workspace);
    if(!active) return;
    state.vault={...DEFAULT_VAULT,...CandidateMemory.normalizeMemory(active.memory||{}),custom:Array.isArray(active.memory?.custom)?active.memory.custom:[]};
  }

  async function load(){
    const stored=await api.get(['jobs','universalJobs','profile','teamWorkspace','applyEngineSessions','applyEngineAnswerVault','applyEngineSafety','profileBoost','naukriAutoApply','naukriAutoApplyRuns','naukriAutoApplyActiveRun','automationActivity','naukriConnection','businessAccount','businessUsageLedger','businessAudit','cloudMigration']);
    state.jobs=Core.mergeJobs(stored.jobs||[],stored.universalJobs||{});
    state.sessions=Array.isArray(stored.applyEngineSessions)?stored.applyEngineSessions:[];
    state.vault={...DEFAULT_VAULT,...(stored.applyEngineAnswerVault||{}),custom:Array.isArray(stored.applyEngineAnswerVault?.custom)?stored.applyEngineAnswerVault.custom:[]};
    state.workspace=stored.teamWorkspace?Team.normalizeWorkspace(stored.teamWorkspace):Team.createWorkspace({profile:stored.profile||{},memory:state.vault});
    state.safety={...DEFAULT_SAFETY,...(stored.applyEngineSafety||{})};
    state.profileBoost={...DEFAULT_BOOST,...(stored.profileBoost||{})};
    state.autoApply={...DEFAULT_AUTO,...(stored.naukriAutoApply||{})};
    state.autoRuns=Array.isArray(stored.naukriAutoApplyRuns)?stored.naukriAutoApplyRuns:[];
    state.autoActiveRun=stored.naukriAutoApplyActiveRun||null;
    state.activity=Array.isArray(stored.automationActivity)?stored.automationActivity:[];
    state.naukriConnection=stored.naukriConnection||null;
    state.business.account=Business.normalizeAccount(stored.businessAccount||state.business.account);
    state.business.usageLedger=Business.normalizeLedger(stored.businessUsageLedger||[]);
    state.business.usage=Business.usageSummary(state.business.usageLedger,state.business.account);
    state.business.audit=Array.isArray(stored.businessAudit)?stored.businessAudit:[];
    state.cloud.state=stored.cloudMigration||null;
    if(globalThis.chrome?.runtime?.sendMessage){
      const [boostResp,autoResp,activityResp,businessResp,teamResp,authResp,diagResp,cloudResp]=await Promise.all([
        api.message({type:'GET_PROFILE_BOOST_STATUS'}).catch(()=>null),
        api.message({type:'GET_NAUKRI_AUTO_APPLY'}).catch(()=>null),
        api.message({type:'GET_AUTOMATION_ACTIVITY'}).catch(()=>null),
        api.message({type:'GET_BUSINESS_BETA_STATE'}).catch(()=>null),
        api.message({type:'GET_TEAM_WORKSPACE'}).catch(()=>null),
        api.message({type:'AUTH_GET_STATUS'}).catch(()=>null),
        api.message({type:'GET_SYSTEM_DIAGNOSTICS'}).catch(()=>null),
        api.message({type:'GET_CLOUD_MIGRATION_STATUS'}).catch(()=>null)
      ]);
      if(autoResp?.settings) state.autoApply={...DEFAULT_AUTO,...autoResp.settings};
      if(state.autoApply?.lastError && /The prepared Naukri tab is (?:not a Search Results page anymore|on Profile)/i.test(state.autoApply.lastError)){
        state.autoApply.lastError = '';
        if(state.autoApply.lastStatus === 'error') state.autoApply.lastStatus = 'idle';
        api.message({type:'SET_NAUKRI_AUTO_APPLY',settings:state.autoApply}).catch(()=>{});
      }
      if(Array.isArray(autoResp?.runs)) state.autoRuns=autoResp.runs;
      state.autoActiveRun=autoResp?.activeRun||null;
      if(Array.isArray(activityResp?.activity)) state.activity=activityResp.activity;
      if(businessResp?.account){ state.business.account=Business.normalizeAccount(businessResp.account); state.business.usageLedger=Business.normalizeLedger(businessResp.usageLedger||[]); state.business.usage=businessResp.usage||Business.usageSummary(state.business.usageLedger,state.business.account); state.business.audit=Array.isArray(businessResp.audit)?businessResp.audit:[]; state.business.plans=businessResp.plans||Business.PLANS; }
      if(teamResp?.workspace) state.workspace=Team.normalizeWorkspace(teamResp.workspace);
      if(authResp?.ok) state.auth=authResp;
      if(diagResp?.ok) state.diagnostics=diagResp.diagnostics||null;
      if(cloudResp?.ok){state.cloud.state=cloudResp.state||null;state.cloud.localSourceRetained=cloudResp.localSourceRetained!==false;}
    }
    let migratedLegacyVault=false;
    let repairedCandidateMemory=false;
    if(state.workspace?.candidates?.length){
      const c=Team.activeCandidate(state.workspace);
      if(c){
        const legacyProfile=CandidateMemory.profileFromLegacy(stored.profile||{});
        const mergedProfile=CandidateMemory.mergeProfileMissing(c.profile||{},legacyProfile);
        const mergedMemory=CandidateMemory.memoryFromProfile(mergedProfile,c.memory||state.vault||{});
        const before=JSON.stringify({profile:CandidateMemory.normalizeProfile(c.profile||{}),memory:CandidateMemory.normalizeMemory(c.memory||{})});
        const after=JSON.stringify({profile:mergedProfile,memory:mergedMemory});
        if(before!==after){ state.workspace=Team.upsertCandidate(state.workspace,{...c,profile:mergedProfile,memory:mergedMemory}); repairedCandidateMemory=true; }
      }
    }
    if(state.workspace?.candidates?.length===1){
      const c=Team.activeCandidate(state.workspace); const memory=CandidateMemory.normalizeMemory(c?.memory||{});
      const hasCandidateMemory=Object.entries(memory).some(([key,value])=>key==='custom'?Array.isArray(value)&&value.length:Boolean(String(value||'').trim()));
      const hasLegacyVault=Object.entries(state.vault).some(([key,value])=>key==='custom'?Array.isArray(value)&&value.length:Boolean(String(value||'').trim()));
      if(!hasCandidateMemory&&hasLegacyVault&&c){state.workspace=Team.upsertCandidate(state.workspace,{...c,memory:CandidateMemory.normalizeMemory(state.vault)});migratedLegacyVault=true;}
    }
    if(migratedLegacyVault||repairedCandidateMemory) await persistTeamWorkspace();
    syncVaultFromWorkspace();
    fillVault(); fillTeam(); fillSafety(); fillBoost(); fillAutoApply(); renderAll();
    const requested=String(globalThis.location?.hash||'').replace(/^#/,'');
    if(requested && document.querySelector(`.tab[data-tab="${CSS.escape(requested)}"]`)) switchTab(requested);
  }

  function metrics(){
    const c=Core.answerCompletion(state.vault);
    const attention=state.sessions.filter(s=>sessionActive(s)&&Core.sessionHealth(s,state.safety.watchdogMinutes).stalled).length;
    $('metricQueue').textContent=state.jobs.filter(j=>!['Applied','Interview','Offer','Rejected'].includes(j.status)).length;
    $('metricActive').textContent=state.sessions.filter(sessionActive).length;
    $('metricAttention').textContent=attention;
    $('metricVault').textContent=`${c.percent}%`;
    $('metricAutoApply').textContent=String(state.autoApply.todayApplied||0);
    $('metricBoost').textContent=String(state.profileBoost.totalSuccesses||0);
  }

  function queueJobs(){
    const q=$('queueSearch').value.trim().toLowerCase(); const f=$('queueFilter').value;
    return state.jobs.filter(j=>!q||`${j.title} ${j.company}`.toLowerCase().includes(q)).filter(j=>f==='all'||(f==='saved'?j.saved:(f==='ready'?!['Applied','Interview','Offer','Rejected'].includes(j.status):true)));
  }
  function renderQueue(){
    const list=queueJobs(); $('queueEmpty').hidden=list.length>0;
    $('queueList').innerHTML=list.map(j=>{
      return `<article class="job-card"><div class="job-top"><div><h3>${escapeHtml(j.title)}</h3><div class="muted">${escapeHtml(j.company)} · ${escapeHtml(j.location)}</div><div class="chips"><span class="chip score">${j.matchScore}% match</span><span class="chip">● Applyra Verified Intake</span><span class="chip provider">Applyra Pipeline Engine</span><span class="chip">${escapeHtml(j.status)}</span></div></div></div><div class="job-actions"><button class="button primary small" data-start="${escapeHtml(j.id)}">🚀 Open &amp; Auto Apply</button><button class="button secondary small" data-simulate="${escapeHtml(j.id)}">🧮 Simulate Offer</button></div></article>`;
    }).join('');
    document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>startSession(b.dataset.start)));
    document.querySelectorAll('[data-simulate]').forEach(b=>b.addEventListener('click',()=>openSimulator(b.dataset.simulate)));
  }

  function openSimulator(id){
    const j=jobById(id);
    chrome.tabs.create({ url: chrome.runtime.getURL(`company-intel.html?company=${encodeURIComponent(j?.company||'')}`) });
  }


  function readAutoApplyForm(){
    return {
      batchSize:Math.max(1,Math.min(5,Number($('autoBatchSize').value)||1)),
      includeKeywords:$('autoInclude').value.trim(),
      excludeKeywords:$('autoExclude').value.trim(),
      redFlagGuard:$('autoRedFlagGuard') ? $('autoRedFlagGuard').checked : true,
      openVisibleTab:$('autoVisibleTab').checked,
      answerVaultAssist:$('autoAnswerVault').checked,
      rememberManualAnswers:$('autoRememberManual').checked,
      skipKnownApplied:$('autoSkipKnown').checked,
      reusePreviewTab:$('autoReusePreview').checked
    };
  }
  function fillAutoApply(){
    $('autoBatchSize').value=state.autoApply.batchSize||1;
    $('autoInclude').value=state.autoApply.includeKeywords||'';
    $('autoExclude').value=state.autoApply.excludeKeywords||'';
    if ($('autoRedFlagGuard')) $('autoRedFlagGuard').checked=state.autoApply.redFlagGuard!==false;
    $('autoVisibleTab').checked=state.autoApply.openVisibleTab!==false;
    $('autoAnswerVault').checked=Boolean(state.autoApply.answerVaultAssist);
    $('autoRememberManual').checked=state.autoApply.rememberManualAnswers!==false;
    $('autoSkipKnown').checked=state.autoApply.skipKnownApplied!==false;
    $('autoReusePreview').checked=state.autoApply.reusePreviewTab!==false;
    renderAutoApply();
  }
  function renderAutoApply(){
    const a=state.autoApply||DEFAULT_AUTO;
    const today=new Date().toISOString().slice(0,10);
    $('autoStatus').textContent=statusLabel(a.lastStatus||'idle');
    $('autoError').textContent=a.lastError||'No errors';
    $('autoToday').textContent=String(a.todayDate===today?(a.todayApplied||0):0);
    $('autoTotal').textContent=String(a.totalApplied||0);
    $('autoLastBatch').textContent=String((a.lastSelected||[]).length);
    const o=a.lastOutcome||{};
    $('autoLastOutcome').textContent=o.status?`${statusLabel(o.status)}${o.reason?` · ${o.reason}`:''}`:'No run yet';
    const previewed=Array.isArray(a.lastPreviewCandidates)?a.lastPreviewCandidates:[];
    $('autoPreviewMeta').textContent=previewed.length?`${previewed.length} reviewed for next batch · ${a.lastPreviewEligibleCount||previewed.length} eligible · previewed ${dateLabel(a.lastPreviewAt)}`:'No fresh preview';
    $('autoPreviewEmpty').hidden=previewed.length>0;
    $('autoPreviewCandidates').innerHTML=previewed.slice(0,10).map(item=>`<article class="job-card"><div class="job-top"><div><h3>${escapeHtml(item.title||'Naukri job')}</h3><div class="muted">${escapeHtml(item.company||'Company not listed')} · ${escapeHtml(item.location||'Location not listed')}</div><div class="chips"><span class="chip provider">Naukri</span><span class="chip">Job ID ${escapeHtml(item.jobId||'unknown')}</span></div></div></div></article>`).join('');
    const selected=Array.isArray(a.lastSelected)?a.lastSelected:[];
    $('autoCandidatesEmpty').hidden=selected.length>0;
    $('autoCandidates').innerHTML=selected.map(item=>`<article class="job-card"><div class="job-top"><div><h3>${escapeHtml(item.title||'Naukri job')}</h3><div class="muted">${escapeHtml(item.company||'Company not listed')} · ${escapeHtml(item.location||'Location not listed')}</div><div class="chips"><span class="chip provider">Naukri</span><span class="chip">Job ID ${escapeHtml(item.jobId||'unknown')}</span></div></div></div></article>`).join('');
    const run=state.autoActiveRun;
    const backgroundActive=run && !['APPLIED','PARTIAL','FAILED','CANCELLED','LIMIT_REACHED'].includes(run.state);
    const active=Boolean(backgroundActive||autoRunLoopRequested);
    $('autoActiveRun').hidden=!active;
    if(autoRunLoopRequested){
      $('autoRunState').textContent=`Recommended run active · batch ${Math.max(1,autoRunLoopSummary.batch||1)}`;
      const currentSelected=(run?.selected||[]).length;
      const follow=(run?.followup||[]).length;
      const failed=(run?.failed||[]).length;
      $('autoRunProgress').textContent=`${autoRunLoopSummary.confirmed||0} confirmed this run · ${currentSelected} in current batch · ${follow} follow-up · ${failed} failed${autoRunLoopSummary.lastMessage?` · ${autoRunLoopSummary.lastMessage}`:''}`;
    } else if(run){
      $('autoRunState').textContent=`${statusLabel(run.state||'idle')} · ${escapeHtml(run.id||'run')}`;
      const applied=(run.confirmedApplied||[]).length; const follow=(run.followup||[]).length; const failed=(run.failed||[]).length;
      $('autoRunProgress').textContent=`${(run.selected||[]).length} selected · ${applied} confirmed · ${follow} follow-up · ${failed} failed · updated ${dateLabel(run.updatedAt)}`;
    }
    const ent=Business.entitlement(state.business.account,state.business.usageLedger,'autoApply');
    const note=$('autoEntitlementNote');
    if(note){ note.innerHTML=`<strong>${escapeHtml(ent.plan.name)}</strong> · ${ent.used||0}/${ent.cap||0} confirmed Auto Applies used this month · ${ent.remaining||0} remaining${ent.allowed?'':' · <b>Auto Apply currently blocked by plan/allowance</b>'}`; }
    if($('autoRunBtn')) $('autoRunBtn').disabled=!ent.allowed;
    metrics();
  }
  async function persistAutoSettings(){
    const resp=await api.message({type:'SET_NAUKRI_AUTO_APPLY',settings:readAutoApplyForm()}).catch(e=>({ok:false,error:e.message}));
    if(resp?.settings) state.autoApply={...DEFAULT_AUTO,...resp.settings};
    return resp;
  }
  async function previewAutoApply(){
    const btn=$('autoPreviewBtn'); btn.disabled=true; btn.textContent='Opening…';
    if(state.autoApply) state.autoApply.lastError = "";
    if($('autoError')) $('autoError').textContent = "No errors";
    try{
      const settings=readAutoApplyForm();
      const resp=await api.message({type:'PREVIEW_NAUKRI_AUTO_APPLY',settings},{timeoutMs:60000}).catch(e=>({ok:false,error:e.message}));
      if(resp?.settings) state.autoApply={...DEFAULT_AUTO,...resp.settings};
      if('activeRun' in (resp||{})) state.autoActiveRun=resp.activeRun||null;
      renderAutoApply(); await loadActivity();
      if(resp?.ok) toast(resp.eligibilityMessage||`Preview ready: ${resp.candidateCount||0} eligible Recommended Jobs visible.`);
      else toast(resp?.error||'Auto Apply preview failed.');
    } finally {btn.disabled=false;btn.textContent='Preview recommended batch';}
  }
  async function runAutoApply(){
    if(autoRunLoopRequested) return;
    const btn=$('autoRunBtn'); btn.disabled=true; btn.textContent='Starting…';
    autoRunLoopRequested=true;
    autoRunLoopSummary={batch:0,confirmed:0,lastMessage:'Starting'};
    if(state.autoApply) state.autoApply.lastError = "";
    if($('autoError')) $('autoError').textContent = "No errors";
    const seenJobIds=new Set();
    let finishMessage='';
    try{
      const settings=readAutoApplyForm();
      const saved=await persistAutoSettings();
      if(saved?.ok===false){finishMessage=saved.error||'Could not save Auto Apply settings.';toast(finishMessage);return;}
      for(let cycle=1;autoRunLoopRequested&&cycle<=60;cycle+=1){
        autoRunLoopSummary.batch=cycle;
        autoRunLoopSummary.lastMessage='Applying current batch';
        btn.textContent=`Applying batch ${cycle}…`;
        renderAutoApply();
        const resp=await api.message({type:'RUN_NAUKRI_AUTO_APPLY',settings},{timeoutMs:150000}).catch(e=>({ok:false,error:e.message}));
        if(resp?.settings) state.autoApply={...DEFAULT_AUTO,...resp.settings};
        if('activeRun' in (resp||{})) state.autoActiveRun=resp.activeRun||null;
        const selectedIds=(Array.isArray(resp?.selected)?resp.selected:[]).map(item=>String(item?.jobId||'')).filter(Boolean);
        const newSelectionIds=selectedIds.filter(id=>!seenJobIds.has(id));
        selectedIds.forEach(id=>seenJobIds.add(id));
        autoRunLoopSummary.confirmed+=Math.max(0,Number(resp?.newlyAppliedCount)||0);
        await loadActivity(); await refreshBusiness(); renderAutoApply();

        if(!resp?.ok){
          finishMessage=resp?.error||'Naukri Auto Apply failed.';
          break;
        }
        const status=String(resp?.outcome?.status||'pending');
        if(status==='cancelled'||resp?.stopped){
          finishMessage='Recommended run stopped.';
          break;
        }
        if(status==='waiting-user'){
          finishMessage='Naukri needs a follow-up answer. The run paused on that application and your manual answer will be remembered when enabled.';
          break;
        }
        if(status!=='applied'){
          finishMessage=status==='partial'?'Some applications need review before continuing.':'The current batch is still pending; use Check current outcome before continuing.';
          break;
        }
        if(!selectedIds.length||!newSelectionIds.length){
          finishMessage='The next cycle repeated the same jobs, so Applyra stopped instead of looping forever.';
          break;
        }
        if(!autoRunLoopRequested){finishMessage='Recommended run stopped.';break;}

        autoRunLoopSummary.lastMessage='Checking for the next eligible batch';
        btn.textContent=`Checking batch ${cycle+1}…`;
        renderAutoApply();
        const preview=await api.message({type:'PREVIEW_NAUKRI_AUTO_APPLY',settings},{timeoutMs:60000}).catch(e=>({ok:false,error:e.message}));
        if(preview?.settings) state.autoApply={...DEFAULT_AUTO,...preview.settings};
        if('activeRun' in (preview||{})) state.autoActiveRun=preview.activeRun||state.autoActiveRun;
        renderAutoApply(); await loadActivity();
        if(!preview?.ok){
          finishMessage=preview?.error||'Could not inspect the next Recommended Jobs batch.';
          break;
        }
        if(!Number(preview.candidateCount||0)){
          finishMessage=`Recommended run complete. ${autoRunLoopSummary.confirmed} new application(s) confirmed; no more eligible visible recommendations.`;
          break;
        }
      }
      if(autoRunLoopRequested&&autoRunLoopSummary.batch>=60&&!finishMessage) finishMessage='Recommended run reached its 60-batch safety ceiling and stopped.';
      if(!autoRunLoopRequested&&!finishMessage) finishMessage='Recommended run stopped.';
      toast(finishMessage||`Recommended run finished with ${autoRunLoopSummary.confirmed} confirmed application(s).`);
    } finally {
      autoRunLoopRequested=false;
      autoRunLoopSummary.lastMessage=finishMessage;
      btn.disabled=false;btn.textContent='Start recommended run';
      renderAutoApply();
    }
  }
  async function checkAutoApply(){
    const btn=$('autoCheckBtn'); btn.disabled=true; btn.textContent='Checking…';
    try{
      const resp=await api.message({type:'CHECK_NAUKRI_AUTO_APPLY'},{timeoutMs:45000}).catch(e=>({ok:false,error:e.message}));
      if(resp?.settings) state.autoApply={...DEFAULT_AUTO,...resp.settings};
      if('activeRun' in (resp||{})) state.autoActiveRun=resp.activeRun||null;
      renderAutoApply(); await loadActivity(); await refreshBusiness();
      if(!resp?.ok) toast(resp?.error||'Could not check Auto Apply outcome.');
      else toast(`Current outcome: ${statusLabel(resp?.outcome?.status||'pending')}.`);
    } finally {btn.disabled=false;btn.textContent='Check current outcome';}
  }
  async function stopAutoApply(){
    autoRunLoopRequested=false;
    autoRunLoopSummary.lastMessage='Stopping after the current operation';
    const btn=$('autoStopBtn'); if(btn) {btn.disabled=true;btn.textContent='Stopping…';}
    try{
      const resp=await api.message({type:'STOP_NAUKRI_AUTO_APPLY'}).catch(e=>({ok:false,error:e.message}));
      if(resp?.settings) state.autoApply={...DEFAULT_AUTO,...resp.settings};
      state.autoActiveRun=resp?.activeRun||null;
      renderAutoApply(); await loadActivity();
      toast(resp?.ok?'Auto Apply run stopped.':(resp?.error||'Could not stop Auto Apply run.'));
    } finally {if(btn){btn.disabled=false;btn.textContent='Stop run';}}
  }

  async function updateToolkitBadge(notifyUser = false) {
    const badge = $('toolkitBridgeBadge');
    if (!badge) return;
    try {
      const bridge = globalThis.ApplyraToolkitBridge;
      if (!bridge) {
        badge.textContent = '⚪ Toolkit Offline';
        badge.style.borderColor = '#cbd5e1';
        badge.style.color = '#64748b';
        return;
      }
      const health = await bridge.checkHealth();
      const isOnline = Boolean(health?.ok || health?.connected || health?.healthy);
      if (isOnline) {
        const count = health.jobs ?? health.jobCount ?? 0;
        badge.textContent = `🟢 Toolkit Active (${count} jobs)`;
        badge.style.borderColor = '#10b981';
        badge.style.color = '#059669';
        badge.title = `Connected to Python Career Toolkit (port 8765) · Candidate: ${health.candidate || 'default'} · ${count} jobs tracked. Click to re-check.`;
        if (notifyUser) toast(`Connected to Career Toolkit bridge: ${count} jobs loaded.`);
      } else {
        badge.textContent = '⚪ Toolkit Offline';
        badge.style.borderColor = '#cbd5e1';
        badge.style.color = '#64748b';
        badge.title = 'Career Toolkit bridge is offline. Start `python job_auto_apply_toolkit.py applyra-serve` on port 8765. Click to check again.';
        if (notifyUser) toast('Career Toolkit bridge is offline. Run: python job_auto_apply_toolkit.py applyra-serve');
      }
    } catch {
      badge.textContent = '⚪ Toolkit Offline';
      badge.style.borderColor = '#cbd5e1';
      badge.style.color = '#64748b';
    }
  }

  async function suggestKeywordsFromToolkit() {
    const btn = $('toolkitKeywordsBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⚡ Analyzing…'; }
    try {
      let suggestedRole = '';
      const bridge = globalThis.ApplyraToolkitBridge;
      if (bridge) {
        try {
          const health = await bridge.checkHealth();
          const isOnline = Boolean(health?.ok || health?.connected || health?.healthy);
          if (isOnline && health.candidate) {
            suggestedRole = health.candidate;
          }
        } catch {}
      }

      const stored = await api.get(['candidateProfile', 'naukriProfile', 'teamWorkspace', 'vault']);
      const activeCandidate = state.workspace?.candidates?.find?.(c => c.id === state.workspace?.activeCandidateId);
      const profile = activeCandidate?.profile || stored.candidateProfile || stored.naukriProfile || {};
      const headline = profile.headline || profile.targetRole || profile.title || '';
      const keySkills = Array.isArray(profile.keySkills) ? profile.keySkills : (Array.isArray(profile.skills) ? profile.skills : []);
      const exp = profile.experience || state.vault?.yearsExperience || '';
      const loc = profile.location || state.vault?.preferredLocation || state.vault?.currentLocation || '';

      let kw = '';
      if (headline) {
        const cleanHeadline = headline.split(/[-–|•,]/).map(s => s.trim()).filter(Boolean);
        kw = cleanHeadline.slice(0, 3).join(', ');
      } else if (keySkills.length > 0) {
        kw = keySkills.slice(0, 4).join(', ');
      } else if (suggestedRole) {
        kw = suggestedRole;
      } else {
        kw = 'Software Engineer, Python, React';
      }

      if ($('naukriSearchKeywords')) $('naukriSearchKeywords').value = kw;
      if (exp && $('naukriSearchExperience') && !$('naukriSearchExperience').value) {
        const match = String(exp).match(/\d+/);
        if (match) $('naukriSearchExperience').value = match[0];
      }
      if (loc && $('naukriSearchLocation') && !$('naukriSearchLocation').value) {
        $('naukriSearchLocation').value = loc;
      }

      toast(`Keywords suggested from Career Toolkit & profile: ${kw}`);
    } catch (e) {
      toast(`Could not suggest keywords: ${e.message}`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⚡ Suggest keywords'; }
    }
  }

  async function syncCurrentToToolkit() {
    const btn = $('syncToolkitBtn');
    if (btn) { btn.disabled = true; btn.textContent = '📋 Syncing…'; }
    try {
      const bridge = globalThis.ApplyraToolkitBridge;
      const allJobs = state.jobs || [];
      const history = state.sessions || [];
      const interviews = state.vault?.interviews || [];
      const candidateProfile = state.workspace?.candidates?.find?.(c => c.id === state.workspace?.activeCandidateId)?.profile || {};

      const payload = {
        jobs: allJobs,
        history,
        interviews,
        candidate: candidateProfile
      };

      let syncedViaHttp = false;
      if (bridge) {
        const syncRes = await bridge.syncToToolkit(payload);
        if (syncRes.ok) {
          syncedViaHttp = true;
          toast(`Synced ${syncRes.importedCount || allJobs.length} jobs to Career Toolkit database!`);
          await updateToolkitBadge();
        }
      }

      if (!syncedViaHttp) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applyra-toolkit-sync-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Toolkit bridge is offline. Exported JSON sync file. Run: python job_auto_apply_toolkit.py applyra-import <file>');
      }
    } catch (e) {
      toast(`Sync failed: ${e.message}`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📋 Sync to Toolkit'; }
    }
  }

  async function openRecommendedJobs(){
    try{await api.open('https://www.naukri.com/mnjuser/recommendedjobs');}catch(e){toast(e.message);}
  }

  function buttonsFor(s){
    const map={
      READY:[['OPENING_JOB','Open application']],
      OPENING_JOB:[['FILLING','Start filling'],['WAITING_USER','Need user']],
      FILLING:[['WAITING_USER','Need user'],['VERIFYING','Verify submission']],
      WAITING_USER:[['FILLING','Resume filling'],['VERIFYING','Verify submission']],
      VERIFYING:[['APPLIED','Mark applied'],['WAITING_USER','Needs user']],
    };
    const btn=(map[s.state]||[]).map(([next,label])=>`<button class="button ${next==='APPLIED'?'primary':'secondary'} small" data-transition="${escapeHtml(s.id)}|${next}">${label}</button>`).join('');
    const fail=sessionActive(s)?`<button class="button danger small" data-transition="${escapeHtml(s.id)}|FAILED">Failed</button>`:'';
    const stop=sessionActive(s)?`<button class="button danger small" data-transition="${escapeHtml(s.id)}|STOPPED">Stop</button>`:'';
    return btn+fail+stop;
  }
  function renderSessions(){
    const sessions=[...state.sessions].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const hasSessions=sessions.length>0;
    const sessionsTab=$('sessionsTab'), sessionsPanel=$('sessionsPanel');
    if(sessionsTab) sessionsTab.hidden=!hasSessions;
    if(sessionsPanel) sessionsPanel.hidden=!hasSessions;
    if(!hasSessions && sessionsTab?.classList.contains('active')) switchTab('queue');
    $('sessionsEmpty').hidden=hasSessions;
    $('sessionsList').innerHTML=sessions.map(s=>{
      const health=Core.sessionHealth(s,state.safety.watchdogMinutes);
      const watch=health.stalled?`<span class="chip warning">Watchdog: ${health.ageMinutes}m idle</span>`:`<span class="chip">Watchdog: healthy</span>`;
      return `<article class="session-card ${health.stalled?'stalled':''}"><div class="session-top"><div><h3>${escapeHtml(s.title)}</h3><div class="muted">${escapeHtml(s.company)} · Applyra Intelligence</div></div><span class="state ${escapeHtml(s.state)}">${escapeHtml(s.state.replaceAll('_',' '))}</span></div><div class="chips"><span class="chip">Channel: Applyra Engine</span>${s.tabId?`<span class="chip">Tab ${s.tabId}</span>`:''}<span class="chip">Updated ${escapeHtml(dateLabel(s.updatedAt))}</span>${watch}</div><div class="session-actions">${buttonsFor(s)}</div></article>`;
    }).join('');
    document.querySelectorAll('[data-transition]').forEach(b=>b.addEventListener('click',()=>{const [id,next]=b.dataset.transition.split('|'); changeState(id,next);}));
  }

  async function persistSessions(){ await api.set({applyEngineSessions:state.sessions}); metrics(); renderSessions(); }
  function jobById(id){ return state.jobs.find(j=>j.id===id); }
  async function startSession(id){
    const job=jobById(id); if(!job) return;
    const targetUrl = job.applyUrl || job.url || '';
    if(!targetUrl){
      toast('This job does not have a direct application URL.');
      return;
    }
    toast(`Opening ${job.title} on Naukri...`);
    let tab = null;
    try {
      if(globalThis.chrome?.tabs?.create){
        tab = await chrome.tabs.create({ url: targetUrl, active: true });
        setTimeout(async () => {
          try {
            const resp = await chrome.tabs.sendMessage(tab.id, { type: 'CLICK_APPLY', job }).catch(()=>null);
            if (resp?.applied) {
              changeState(s.id, 'APPLIED');
              toast(`✅ Applied to ${job.title}!`);
            } else if (resp?.alreadyApplied) {
              changeState(s.id, 'APPLIED');
              toast(`ℹ️ Already applied to ${job.title}.`);
            }
          } catch {}
        }, 3500);
      } else {
        window.open(targetUrl, '_blank');
      }
    } catch(e) {
      console.warn('Failed to open tab:', e);
    }
    let s=Core.createSession(job,{requireFinalReview:state.safety.requireFinalReview});
    s=Core.transition(s,'OPENING_JOB','Navigating to job on Naukri');
    s.updatedAt=new Date().toISOString();
    if(tab?.id) s.tabId = tab.id;
    state.sessions.unshift(s);
    await persistSessions();
    await logActivity('apply','running','Job opened for Auto Apply',`${job.title} · ${job.company}`);
    switchTab('sessions');
  }
  async function focusSession(id){
    const s=state.sessions.find(x=>x.id===id); if(!s) return;
    try{
      const tab=await api.updateTab(s.tabId,s.url); if(tab?.id&&!s.tabId)s.tabId=tab.id;
      s.updatedAt=new Date().toISOString(); s.watchdogState=''; s.watchdogAt='';
      await persistSessions(); await logActivity('watchdog','recovered','Application session focused',`${s.title} · ${s.company}`);
    }catch(e){toast(e.message);}
  }
  async function changeState(id,next){
    const idx=state.sessions.findIndex(x=>x.id===id); if(idx<0)return;
    try{
      if(next==='APPLIED'){
        const today=new Date().toISOString().slice(0,10);
        const appliedToday=state.sessions.filter(s=>s.state==='APPLIED'&&String(s.completedAt||'').slice(0,10)===today).length;
        if(appliedToday>=state.safety.dailyCap){toast(`Daily application cap reached (${state.safety.dailyCap}).`);return;}
      }
      let s=Core.transition(state.sessions[idx],next,next==='WAITING_USER'?'Paused for user action':next==='APPLIED'?'Application confirmed':'');
      s.watchdogState=''; s.watchdogAt='';
      state.sessions[idx]=s; await persistSessions();
      await logActivity('apply',next==='APPLIED'?'success':next==='FAILED'?'error':'info',`Application session → ${next.replaceAll('_',' ')}`,`${s.title} · ${s.company}`);
      if(next==='APPLIED') await syncApplied(s);
      toast(`Session → ${next.replaceAll('_',' ')}`);
    }catch(e){toast(e.message);}
  }
  async function syncApplied(session){
    const job=state.jobs.find(j=>j.id===session.jobId||j.fingerprint===session.fingerprint);
    if(!job)return;
    const raw=job.raw||{};
    if(raw.fingerprint || raw.position || raw.source?.id){
      const resp=await api.message({type:'UNIVERSAL_JOB_ACTION',job:raw,status:'applied'}).catch(()=>null);
      if(resp?.ok) return;
    }
    const stored=await api.get(['jobs','history']);
    const list=Array.isArray(stored.jobs)?[...stored.jobs]:[];
    let found=false;
    const jobs=list.map(x=>{
      if(Core.fingerprint(x)===job.id||x.id===job.id||(x.title===job.title&&x.company===job.company)){
        found=true;
        return{...x,status:'Applied',applied:true,appliedAt:new Date().toISOString(),statusUpdatedAt:new Date().toISOString()};
      }
      return x;
    });
    if(!found){
      jobs.unshift({
        id:job.id||`app-${Date.now()}`,
        title:job.title||'Applied Role',
        company:job.company||'Enterprise Organization',
        location:job.location||'Pan India / Hybrid',
        experienceText:job.experienceText||'Relevant Experience',
        salaryText:job.salaryText||'Market Standard',
        skills:job.skills||[],
        source:job.source||'apply-engine',
        url:job.url||'',
        applyUrl:job.applyUrl||job.url||'',
        capturedAt:new Date().toISOString(),
        createdAt:new Date().toISOString(),
        status:'Applied',
        applied:true,
        appliedAt:new Date().toISOString(),
        recommendedAction:'Applied'
      });
    }
    const history=[{id:`apply-engine|${Date.now()}`,type:'application',title:job.title,company:job.company,url:job.url,occurredAt:new Date().toISOString(),capturedAt:new Date().toISOString(),status:'Applied',details:'Marked Applied from Applyra Automation Center',source:'nowcurry-automation-center'},...(Array.isArray(stored.history)?stored.history:[])];
    await api.set({jobs,history});
  }

  function fillVault(){ document.querySelectorAll('[data-vault]').forEach(el=>el.value=state.vault[el.dataset.vault]||''); renderCustom(); }
  function readVault(){ document.querySelectorAll('[data-vault]').forEach(el=>state.vault[el.dataset.vault]=el.value.trim()); }
  function renderCustom(){
    $('customAnswers').innerHTML=(state.vault.custom||[]).map((r,i)=>`<div class="custom-row"><input data-custom-q="${i}" placeholder="Question" value="${escapeHtml(r.question||'')}"/><textarea data-custom-a="${i}" rows="2" placeholder="Answer">${escapeHtml(r.answer||'')}</textarea><button class="button danger small" data-custom-remove="${i}">Remove</button></div>`).join('') || '<div class="empty">No custom answers yet.</div>';
    document.querySelectorAll('[data-custom-remove]').forEach(b=>b.addEventListener('click',()=>{state.vault.custom.splice(Number(b.dataset.customRemove),1);renderCustom();}));
  }
  function collectCustom(){
    const out=[]; document.querySelectorAll('[data-custom-q]').forEach(q=>{const i=q.dataset.customQ;const a=document.querySelector(`[data-custom-a="${i}"]`); if(q.value.trim()||a?.value.trim())out.push({question:q.value.trim(),answer:a?.value.trim()||''});}); state.vault.custom=out;
  }
  function activeCandidate(){ return state.workspace?Team.activeCandidate(state.workspace):null; }
  function candidateLabel(candidate){
    const p=candidate?.profile||{};
    return p.name || p.email || p.targetRoles || 'Unnamed candidate';
  }
  function readTeamProfile(){
    return CandidateMemory.normalizeProfile({
      ...(activeCandidate()?.profile||{}),
      name:$('tcName').value.trim(), email:$('tcEmail').value.trim(), phone:$('tcPhone').value.trim(),
      targetRoles:$('tcRoles').value.trim(), skills:$('tcSkills').value.trim(), yearsExperience:$('tcYears').value.trim(),
      currentLocation:$('tcLocation').value.trim(), preferredLocation:$('tcPreferred').value.trim()
    });
  }
  function commitActiveCandidateDraft(){
    if(!state.workspace) return;
    readVault(); collectCustom();
    state.workspace.organization={...(state.workspace.organization||{}),name:$('teamOrg').value.trim()||state.workspace.organization?.name||'My Organization'};
    state.workspace.recruiter={...(state.workspace.recruiter||{}),name:$('teamRecruiter').value.trim()};
    const current=activeCandidate(); if(!current) return;
    const profile=readTeamProfile();
    const memory=CandidateMemory.memoryFromProfile(profile,state.vault);
    state.vault=memory;
    state.workspace=Team.upsertCandidate(state.workspace,{...current,profile,memory});
  }
  async function persistTeamWorkspace({activity=false}={}){
    state.workspace=Team.normalizeWorkspace(state.workspace||Team.createWorkspace({}));
    let resp=await api.message({type:'SAVE_TEAM_WORKSPACE',workspace:state.workspace}).catch(()=>null);
    if(resp?.workspace) state.workspace=Team.normalizeWorkspace(resp.workspace);
    else await api.set({teamWorkspace:state.workspace,activeCandidateProfile:activeCandidate()?.profile||{},applyEngineAnswerVault:activeCandidate()?.memory||{},schemaVersion:Storage.SCHEMA_VERSION});
    syncVaultFromWorkspace();
    if(activity) await logActivity('team','saved','Team workspace saved',`${state.workspace.candidates.length} candidate(s) · active ${candidateLabel(activeCandidate())}`);
    return resp;
  }
  function fillTeam(){
    if(!state.workspace) return;
    state.workspace=Team.normalizeWorkspace(state.workspace);
    const c=activeCandidate(); const p=c?.profile||{};
    $('teamOrg').value=state.workspace.organization?.name||'';
    $('teamRecruiter').value=state.workspace.recruiter?.name||'';
    $('teamCandidate').innerHTML=state.workspace.candidates.map(x=>`<option value="${escapeHtml(x.id)}" ${x.status==='archived'?'data-archived="1"':''}>${escapeHtml(candidateLabel(x))}${x.status==='archived'?' (archived)':''}</option>`).join('');
    $('teamCandidate').value=state.workspace.activeCandidateId||c?.id||'';
    $('tcName').value=p.name||''; $('tcEmail').value=p.email||''; $('tcPhone').value=p.phone||''; $('tcRoles').value=p.targetRoles||'';
    $('tcSkills').value=p.skills||''; $('tcYears').value=p.yearsExperience||''; $('tcLocation').value=p.currentLocation||''; $('tcPreferred').value=p.preferredLocation||'';
    const ready=CandidateMemory.readiness(c||{}); const done=Object.values(ready.checks||{}).filter(Boolean).length;
    $('teamReadiness').innerHTML=`<strong>${escapeHtml(candidateLabel(c))}</strong> · Candidate readiness ${ready.score}% (${done}/${Object.keys(ready.checks||{}).length}) · memory and screening answers are isolated to this candidate.`;
  }
  async function saveTeam(){
    commitActiveCandidateDraft();
    state.workspace.organization={...(state.workspace.organization||{}),name:$('teamOrg').value.trim()||'My Organization'};
    state.workspace.recruiter={...(state.workspace.recruiter||{}),name:$('teamRecruiter').value.trim()};
    await persistTeamWorkspace({activity:true}); fillTeam(); fillVault(); metrics(); toast('Team workspace and active Candidate Memory saved.');
  }
  async function switchTeamCandidate(){
    commitActiveCandidateDraft();
    state.workspace=Team.switchCandidate(state.workspace,$('teamCandidate').value);
    await persistTeamWorkspace(); syncVaultFromWorkspace(); fillTeam(); fillVault(); metrics(); toast(`Active candidate → ${candidateLabel(activeCandidate())}`);
  }
  async function addCandidate(){
    commitActiveCandidateDraft();
    const fresh=CandidateMemory.createCandidate({profile:{name:'New Candidate'},memory:{}});
    state.workspace=Team.upsertCandidate(state.workspace,fresh); state.workspace=Team.switchCandidate(state.workspace,fresh.id);
    await persistTeamWorkspace(); syncVaultFromWorkspace(); fillTeam(); fillVault(); metrics(); toast('New candidate created.');
  }
  async function duplicateCandidate(){
    commitActiveCandidateDraft();
    state.workspace=Team.duplicateCandidate(state.workspace,state.workspace.activeCandidateId);
    await persistTeamWorkspace(); syncVaultFromWorkspace(); fillTeam(); fillVault(); metrics(); toast('Candidate duplicated.');
  }
  async function archiveCandidate(){
    const current=activeCandidate(); if(!current) return;
    if(!confirm(`Archive ${candidateLabel(current)}? Their local data remains in the workspace.`)) return;
    commitActiveCandidateDraft(); state.workspace=Team.archiveCandidate(state.workspace,current.id);
    await persistTeamWorkspace(); syncVaultFromWorkspace(); fillTeam(); fillVault(); metrics(); toast('Candidate archived.');
  }
  async function saveVault(){
    readVault(); collectCustom();
    if(state.workspace){
      const current=activeCandidate();
      if(current){ state.workspace=Team.upsertCandidate(state.workspace,{...current,memory:CandidateMemory.normalizeMemory(state.vault)}); await persistTeamWorkspace(); }
    } else await api.set({applyEngineAnswerVault:state.vault});
    metrics(); fillTeam(); await logActivity('answer-vault','saved','Candidate Memory saved',`${Core.answerCompletion(state.vault).percent}% of core fields complete · ${candidateLabel(activeCandidate())}`); toast('Candidate Memory and Answer Vault saved locally.');
  }

  async function savePortalJob(){
    const payload={url:$('liUrl').value.trim(),title:$('liTitle').value.trim(),company:$('liCompany').value.trim(),location:$('liLocation').value.trim(),description:$('liDescription').value.trim()};
    const resp=await api.message({type:'ADD_PORTAL_JOB',job:payload}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){$('portalStatus').innerHTML=`<strong>Portal intake failed:</strong> ${escapeHtml(resp?.error||'Could not save this job.')}`;toast(resp?.error||'Could not save job.');return;}
    const provider='Applyra Verified Intake';
    $('portalStatus').innerHTML=`<strong>Saved:</strong> ${escapeHtml(resp.job?.title||'Opportunity')} · ${escapeHtml(provider)} · ready in Application Queue.`;
    await logActivity('portal-intake','saved',`${provider} opportunity saved`,`${resp.job?.title||'Opportunity'} · ${resp.job?.company||''}`);
    const stored=await api.get(['jobs','universalJobs']); state.jobs=Core.mergeJobs(stored.jobs||[],stored.universalJobs||{}); renderQueue(); metrics(); toast(`Opportunity saved to Applyra.`);
  }
  function simulatePortalJob(){
    const company=$('liCompany').value.trim();
    chrome.tabs.create({ url: chrome.runtime.getURL(`company-intel.html?company=${encodeURIComponent(company)}`) });
  }

  function readNaukriSearchForm(){
    return {
      keywords:$('naukriSearchKeywords').value.trim(),
      experience:$('naukriSearchExperience').value,
      location:$('naukriSearchLocation').value.trim()
    };
  }
  function setNaukriSearchStatus(message,kind=''){
    const el=$('naukriSearchStatus');
    if(!el)return;
    el.textContent=message;
    el.className=`muted ${kind}`.trim();
  }
  async function runNaukriSearchAutoApply(){
    const search=readNaukriSearchForm();
    if(!search.keywords&&!search.location){toast('Enter a Naukri role/skill or location first.');return;}
    const btn=$('naukriSearchApplyBtn');
    if(btn){btn.disabled=true;btn.textContent='Searching…';}
    setNaukriSearchStatus('Opening the real Naukri Search Results page, then starting Auto Apply…');
    if(state.autoApply) state.autoApply.lastError = "";
    if($('autoError')) $('autoError').textContent = "No errors";
    try{
      const settings=readAutoApplyForm();
      const resp=await api.message({type:'RUN_NAUKRI_SEARCH_AUTO_APPLY',search,settings},{timeoutMs:150000}).catch(e=>({ok:false,error:e.message}));
      if(resp?.settings) state.autoApply={...DEFAULT_AUTO,...resp.settings};
      if('activeRun' in (resp||{})) state.autoActiveRun=resp.activeRun||null;
      await loadActivity(); await refreshBusiness(); renderAutoApply();
      if(!resp?.ok) throw new Error(resp?.error||'Naukri Search Auto Apply failed.');
      const applied=Math.max(0,Number(resp?.newlyAppliedCount)||0);
      const status=statusLabel(resp?.outcome?.status||'pending');
      setNaukriSearchStatus(`Search Auto Apply: ${status}${applied?` · ${applied} newly confirmed`:''}.`,'ok');
      toast(`Naukri Search Auto Apply: ${status}.`);
    }catch(e){setNaukriSearchStatus(`Error: ${e.message||e}`,'error');toast(e.message||String(e));}
    finally{if(btn){btn.disabled=false;btn.textContent='Search + auto apply';}}
  }


  function fillSafety(){ $('sDailyCap').value=state.safety.dailyCap; $('sParallel').value=state.safety.maxParallel; $('sWatchdog').value=state.safety.watchdogMinutes; $('sFinalReview').checked=state.safety.requireFinalReview; }
  async function saveSafety(){
    const daily=Math.max(1,Math.min(200,Number($('sDailyCap').value)||30));
    const parallel=Math.max(1,Math.min(3,Number($('sParallel').value)||1));
    const watchdog=Math.max(5,Math.min(120,Number($('sWatchdog').value)||15));
    state.safety={dailyCap:daily,maxParallel:parallel,watchdogMinutes:watchdog,requireFinalReview:$('sFinalReview').checked,pauseSecurity:true};
    await api.set({applyEngineSafety:state.safety}); await logActivity('safety','saved','Automation limits saved',`Daily ${daily} · parallel ${parallel} · watchdog ${watchdog}m`); renderAll(); toast('Safety limits saved.');
  }

  function fillBoost(){
    $('bMode').value=state.profileBoost.mode||'reversible'; $('bCadence').value=state.profileBoost.cadence||'off'; $('bEnabled').checked=Boolean(state.profileBoost.enabled); $('bAutoOpen').checked=state.profileBoost.autoOpenProfile!==false; $('bRunStartup').checked=Boolean(state.profileBoost.runOnStartup); renderBoost();
  }
  function renderBoost(){
    const b=state.profileBoost;
    $('boostStatus').textContent=statusLabel(b.lastStatus);
    $('boostError').textContent=b.lastError||'No errors';
    $('boostLastSuccess').textContent=b.lastSuccessAt?dateLabel(b.lastSuccessAt):'Never';
    const today=new Date().toISOString().slice(0,10); $('boostToday').textContent=String(b.todayDate===today?(b.todaySuccesses||0):0);
    $('boostNext').textContent=b.enabled?(b.nextRunAt?dateLabel(b.nextRunAt):'Scheduled'):'Off';
    $('boostScheduleLabel').textContent=b.enabled?`${b.cadence} · ${b.mode}`:'schedule disabled';
    $('boostRecovery').hidden=!b.rollbackRequired;
    const ent=Business.entitlement(state.business.account,state.business.usageLedger,'profileBoost');
    if($('boostNowBtn')) $('boostNowBtn').disabled=!ent.allowed;
    metrics();
  }
  async function saveBoost(){
    const settings={mode:['save-only','reversible','assisted'].includes($('bMode').value)?$('bMode').value:'reversible',cadence:$('bCadence').value,enabled:$('bEnabled').checked&&$('bCadence').value!=='off',autoOpenProfile:$('bAutoOpen').checked,runOnStartup:$('bRunStartup').checked};
    const resp=await api.message({type:'SET_PROFILE_BOOST',settings}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Could not save Profile Boost settings.');return;}
    state.profileBoost={...DEFAULT_BOOST,...resp.profileBoost}; fillBoost(); await loadActivity(); toast('Profile Boost settings saved.');
  }
  async function runBoost(){
    const btn=$('boostNowBtn'); btn.disabled=true; btn.textContent='Running…';
    try{
      const desiredMode=['save-only','reversible','assisted'].includes($('bMode').value)?$('bMode').value:'reversible';
      if(desiredMode!==state.profileBoost.mode){
        const saved=await api.message({type:'SET_PROFILE_BOOST',settings:{...state.profileBoost,mode:desiredMode}}).catch(()=>null);
        if(saved?.profileBoost) state.profileBoost={...DEFAULT_BOOST,...saved.profileBoost};
      }
      const resp=await api.message({type:'RUN_PROFILE_BOOST_NOW'}).catch(e=>({ok:false,error:e.message}));
      if(resp?.profileBoost) state.profileBoost={...DEFAULT_BOOST,...resp.profileBoost}; fillBoost(); await loadActivity(); await refreshBusiness();
      if(resp?.status==='waiting-user') toast('Naukri profile is connected. Manual mode made no changes.');
      else if(resp?.confirmed && resp?.mode==='save-only') toast('Profile Boost confirmed: Resume headline opened and Save clicked with no text changes.');
      else if(resp?.confirmed) toast('Profile Boost confirmed and original Resume Headline restored.');
      else if(resp?.ok) toast(resp?.message||'Profile Boost finished safely.');
      else toast(resp?.error||'Profile Boost failed.');
    } finally { btn.disabled=false; btn.textContent='Boost now'; }
  }
  async function recoverBoost(){
    const btn=$('recoverBoostBtn'); btn.disabled=true; btn.textContent='Recovering…';
    try{
      const resp=await api.message({type:'RECOVER_PROFILE_BOOST'}).catch(e=>({ok:false,error:e.message}));
      if(resp?.profileBoost) state.profileBoost={...DEFAULT_BOOST,...resp.profileBoost}; fillBoost(); await loadActivity();
      toast(resp?.ok?(resp.recovered?'Original Resume Headline restored and verified.':'No recovery data was pending.'):(resp?.error||'Recovery failed.'));
    } finally { btn.disabled=false; btn.textContent='Recover original headline'; }
  }
  async function openProfile(){ try{await api.open('https://www.naukri.com/mnjuser/profile');}catch(e){toast(e.message);} }

  function renderBusiness(){
    const account=Business.normalizeAccount(state.business.account||{});
    state.business.account=account;
    const plan=Business.effectivePlan(account);
    const usage=Business.usageSummary(state.business.usageLedger||[],account);
    state.business.usage=usage;
    $('bizPlanName').textContent=plan.name;
    $('bizPlanPrice').textContent='Local Founding Beta entitlement';
    $('bizUsageText').textContent=`${usage.used} / ${usage.cap}`;
    $('bizUsageBar').style.width=`${usage.percent}%`;
    $('bizUsageCycle').textContent=`Cycle ${usage.cycle} · ${usage.remaining} remaining`;
    const auth=state.auth||{};
    $('bizAccountId').textContent=auth.authenticated?'signed-in':auth.configured?'signed-out':'setup';
    $('bizAuthState').textContent=auth.authenticated?`Signed in with ${auth.providerLabel||'account'}`:auth.configured?'Signed out':'Not configured';
    $('bizAuthIdentity').textContent=auth.user?.email||account.email||'—';
    $('bizAuthPersistence').textContent=auth.authenticated?(auth.persistent?'Remembered on this browser':'Session only'):(auth.configured?'No active session':'Configure secure auth');
    $('bizSignOut').disabled=!auth.authenticated;
    const featureRows=[
      ['Auto Apply allowance',`${plan.monthlyAutoApply} confirmed / month`],
      ['Entitlement authority','Local Founding Beta build'],
      ['Profile Boost',plan.profileBoost?'Included':'Not included'],
      ['Answer Vault',plan.answerVault?'Included':'Not included'],
      ['Multi-source discovery',plan.multiSource?'Included':'Not included'],
      ['Advanced analytics',plan.analytics?'Included':'Not included']
    ];
    $('bizPlanFeatures').innerHTML=featureRows.map(([k,v])=>`<div class="plan-feature"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('');
    const vault=Core.answerCompletion(state.vault);
    const connected=Boolean(state.naukriConnection?.state==='connected'||state.naukriConnection?.sessionState==='authenticated'||state.naukri?.state==='connected'||state.naukri?.connection?.state==='connected');
    const ready=Business.readiness({vaultPercent:vault.percent,safety:state.safety,autoApply:state.autoApply,naukriConnected:connected});
    $('bizReadiness').textContent=`${ready.percent}%`;
    $('bizReadinessDetail').textContent=`${ready.done} of ${ready.total} checks complete`;
    $('bizOnboarding').innerHTML=ready.items.map(item=>`<article class="onboarding-item ${item.done?'done':''}"><div class="onboarding-mark">${item.done?'✓':'·'}</div><div><strong>${escapeHtml(item.label)}</strong><small>${item.done?'Ready':'Needs attention'}</small></div></article>`).join('');
    renderCloudState();
    const rows=(state.business.usageLedger||[]).filter(x=>x.event===Business.USAGE_EVENT).slice(0,30);
    $('bizUsageEmpty').hidden=rows.length>0;
    $('bizUsageList').innerHTML=rows.map(row=>`<article class="usage-row"><div><strong>Naukri confirmed application</strong><span>Job ${escapeHtml(row.externalId)} · ${escapeHtml(dateLabel(row.at))}${row.runId?` · ${escapeHtml(row.runId)}`:''}</span></div><div class="usage-qty">+${row.quantity||1}</div></article>`).join('');
  }


  function renderProductionPreflight(){
    const r=state.productionPreflight;
    if(!$('prodPreflightChecks')) return;
    if(!r){
      $('prodPreflightBadge').textContent='not run';
      $('prodPreflightSummary').textContent='Preflight has not been run in this browser session.';
      $('prodPreflightChecks').innerHTML='<div><span>No live production checks have been executed.</span><strong class="pending">NOT RUN</strong></div>';
      return;
    }
    $('prodPreflightBadge').textContent=r.productionReady?'ready':'blocked';
    $('prodPreflightSummary').textContent=r.productionReady?`All ${r.blockingTotal} blocking infrastructure checks passed.`:`${r.blockingPassed} of ${r.blockingTotal} blocking infrastructure checks passed.`;
    $('prodPreflightChecks').innerHTML=(r.checks||[]).map(x=>`<div><span>${escapeHtml(x.label)} · ${escapeHtml(x.detail||'')}</span><strong class="${x.ok?'ready':'pending'}">${x.ok?'PASS':x.id==='naukri-acceptance'?'NOT RUN':'PENDING'}</strong></div>`).join('');
  }

  async function runProductionPreflight(){
    const btn=$('prodPreflightBtn');btn.disabled=true;btn.textContent='Checking…';
    try{
      const resp=await api.message({type:'RUN_PRODUCTION_PREFLIGHT'},{timeoutMs:30000}).catch(e=>({ok:false,error:e.message}));
      if(!resp?.ok){toast(resp?.error||'Production preflight failed.');return;}
      state.productionPreflight=resp.report||null;renderProductionPreflight();
      toast(state.productionPreflight?.productionReady?'Production infrastructure preflight passed.':'Production preflight completed with blockers.');
    }finally{btn.disabled=false;btn.textContent='Run production preflight';}
  }

  function renderCloudState(){
    const c=state.cloud?.state||{};
    const status=String(c.status||'not-started');
    if($('cloudStatus')) $('cloudStatus').textContent=status;
    if($('cloudDetail')){
      const detail=status==='verified'?'Authenticated cloud workspace verified.'
        :status==='pushed'?'Local data was copied; verify the remote row before treating migration as complete.'
        :status==='error'?`Last cloud error: ${c.lastError||'unknown error'}`
        :status==='deleted'?'Cloud workspace data was deleted for this account.'
        :'No verified cloud migration yet. Local storage remains authoritative.';
      $('cloudDetail').textContent=detail;
    }
    if($('cloudPushBtn')) $('cloudPushBtn').disabled=!state.auth?.authenticated;
    if($('cloudVerifyBtn')) $('cloudVerifyBtn').disabled=!state.auth?.authenticated;
    if($('cloudDeleteBtn')) $('cloudDeleteBtn').disabled=!state.auth?.authenticated;
    if($('accountDeleteBtn')) $('accountDeleteBtn').disabled=!state.auth?.authenticated;
  }
  function previewText(p){return p?`${p.candidates} candidate(s) · ${p.jobs} job(s) · ${p.history} history row(s) · ${p.sessions} application session(s) · ${p.answerVaultFields} populated Answer Vault field(s). Auth tokens/provider secrets: excluded.`:'No migration preview yet.';}
  async function previewCloudMigration(){
    const resp=await api.message({type:'CLOUD_MIGRATION_PREVIEW'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Could not preview cloud migration.');return;}
    state.cloud.state=resp.state||state.cloud.state;state.cloud.preview=resp.preview||null;
    $('cloudPreviewDetail').innerHTML=`<strong>Preview:</strong> ${escapeHtml(previewText(resp.preview))}`;renderCloudState();toast('Cloud migration preview generated from current local data.');
  }
  async function pushCloudMigration(){
    if(!state.auth?.authenticated){toast('Sign in to Applyra before copying data to cloud.');return;}
    if(!confirm('Copy the current local Applyra workspace to your authenticated Supabase account? Local data will remain in place and will not be deleted or replaced by this operation.')) return;
    const btn=$('cloudPushBtn');btn.disabled=true;btn.textContent='Copying…';
    try{
      const resp=await api.message({type:'CLOUD_MIGRATION_PUSH'},{timeoutMs:60000}).catch(e=>({ok:false,error:e.message}));
      if(!resp?.ok){toast(resp?.error||'Cloud migration failed.');return;}
      state.cloud.state=resp.state;state.cloud.preview=resp.preview||null;state.cloud.localSourceRetained=true;
      $('cloudPreviewDetail').innerHTML=`<strong>Copied:</strong> ${escapeHtml(previewText(resp.preview))}`;renderCloudState();toast('Local data copied to cloud. Run Verify cloud copy next.');
    }finally{btn.disabled=false;btn.textContent='Copy local data to cloud';}
  }
  async function verifyCloudMigration(){
    const resp=await api.message({type:'CLOUD_MIGRATION_VERIFY'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Cloud verification failed.');return;}
    state.cloud.state=resp.state;renderCloudState();toast(`Cloud workspace verified${resp.remote?.schemaVersion!=null?` · schema ${resp.remote.schemaVersion}`:''}.`);
  }
  async function deleteCloudData(){
    const typed=prompt('Type DELETE CLOUD DATA to permanently delete your authenticated Applyra cloud workspace data. Local data will remain.');
    if(typed!=='DELETE CLOUD DATA'){toast('Cloud deletion cancelled.');return;}
    const resp=await api.message({type:'DELETE_REMOTE_USER_DATA'},{timeoutMs:45000}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Cloud deletion failed.');return;}
    state.cloud.state=resp.state;renderCloudState();toast('Cloud workspace data deleted.');
  }
  async function clearLocalCareerData(){
    const typed=prompt('Type DELETE LOCAL DATA to clear local career/profile/application data from this browser. Your authentication configuration is preserved.');
    if(typed!=='DELETE LOCAL DATA'){toast('Local data deletion cancelled.');return;}
    const resp=await api.message({type:'CLEAR_LOCAL_USER_DATA'},{timeoutMs:30000}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Local data deletion failed.');return;}
    toast('Local career data cleared. Reloading workspace…');setTimeout(()=>location.reload(),600);
  }
  async function deleteApplyraAccount(){
    const typed=prompt('Type DELETE APPLYRA ACCOUNT to permanently delete the authenticated Applyra account. This requires the production delete-account Edge Function.');
    if(typed!=='DELETE APPLYRA ACCOUNT'){toast('Account deletion cancelled.');return;}
    const resp=await api.message({type:'DELETE_APPLYRA_ACCOUNT'},{timeoutMs:45000}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Account deletion failed. The Edge Function may not be deployed yet.');return;}
    location.href=chrome.runtime.getURL('auth.html?return=onboarding.html');
  }

  async function refreshBusiness(){
    const resp=await api.message({type:'GET_BUSINESS_BETA_STATE'}).catch(()=>null);
    if(resp?.account){state.business.account=Business.normalizeAccount(resp.account);state.business.usageLedger=Business.normalizeLedger(resp.usageLedger||[]);state.business.usage=resp.usage||Business.usageSummary(state.business.usageLedger,state.business.account);state.business.audit=Array.isArray(resp.audit)?resp.audit:[];state.business.plans=resp.plans||Business.PLANS;}
    renderBusiness(); renderAutoApply();
  }
  async function manageAuth(){
    location.href=chrome.runtime.getURL('auth.html?return=apply-engine.html');
  }
  async function signOutAccount(){
    const resp=await api.message({type:'AUTH_SIGN_OUT'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Could not sign out.');return;}
    state.auth=resp.status||null; renderBusiness(); toast('Signed out of Applyra.');
    if(state.auth?.configured&&state.auth?.config?.requireAuth!==false) location.href=chrome.runtime.getURL('auth.html?return=apply-engine.html');
  }
  async function exportBusiness(mode){
    const granted=await ensureDownloadPermission();
    if(!granted){toast('Download permission was not granted.');return;}
    if(mode!=='support'&&!confirm('Create a PRIVATE Applyra backup? It can contain your profile, applications, Answer Vault answers and career data. Do not send it to support.')) return;
    const defaultName = mode === 'support' ? `Applyra-support-${new Date().toISOString().slice(0,10)}.json` : `Applyra-private-backup-${new Date().toISOString().slice(0,10)}.json`;
    let toastHandle = null;
    if (globalThis.ApplyraDownloadToast?.show) {
      toastHandle = globalThis.ApplyraDownloadToast.show({ filename: defaultName, status: 'started' });
    }
    const resp=await api.message({type:'EXPORT_BUSINESS_DATA',mode}).catch(e=>({ok:false,error:e.message}));
    const fname = resp?.filename || defaultName;
    if (resp?.ok) {
      if (toastHandle) toastHandle.update({ status: 'complete', filename: fname });
      else toast(mode==='support'?'Sanitized support bundle exported.':'Private Applyra backup created.');
    } else {
      if (toastHandle) toastHandle.update({ status: 'failed', filename: fname, error: resp?.error || 'Export failed.' });
      else toast(resp?.error||'Export failed.');
    }
  }
  async function clearSecurityDiagnostics(){
    if(!confirm('Clear local diagnostic logs and archived automation run details? Jobs, applications, profile, Answer Vault and current settings are not deleted.')) return;
    const resp=await api.message({type:'CLEAR_SECURITY_DIAGNOSTICS'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Could not clear diagnostics.');return;}
    state.activity=[];state.autoRuns=[];state.business.audit=[];renderActivity();renderAutoApply();renderBusiness();toast('Diagnostic logs and archived run details cleared.');
  }

  async function resetBusiness(){
    if(!confirm('Reset only Founding Beta account metadata, usage ledger and business audit? Jobs, applications, Answer Vault and other Applyra data will stay intact.')) return;
    const resp=await api.message({type:'RESET_BUSINESS_BETA'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Business-beta reset failed.');return;}
    state.business.account=Business.normalizeAccount(resp.account);state.business.usageLedger=[];state.business.audit=[];state.business.usage=resp.usage;renderBusiness();renderAutoApply();toast('Business-beta metadata reset.');
  }

  function capabilityText(adapter){
    const c=adapter.capabilities||{};
    const yes=[]; if(c.intake)yes.push('queue intake'); if(c.extract)yes.push('native extraction'); if(c.sessionCheck)yes.push('session check'); if(c.autoApply)yes.push('Auto Apply'); if(c.autofillKnownQuestions)yes.push('known-question assistance');
    return `${adapter.mode} · ${yes.join(', ')||'open/track only'}${c.automaticFinalSubmit?' · final submit':' · no unattended final submit'}`;
  }
  function renderProviders(){
    if(!$('discoveryProviders')) return;
    $('discoveryProviders').innerHTML=DISCOVERY.map(([n,d])=>`<article class="provider-card"><strong>${escapeHtml(n)}</strong><span>${escapeHtml(d)}</span></article>`).join('');
    $('applicationProviders').innerHTML=PortalAdapters.publicSummary().map(a=>`<article class="provider-card"><strong>${escapeHtml(a.label)}</strong><span>${escapeHtml(capabilityText(a))}</span></article>`).join('');
  }

  function renderDiagnostics(){
    if(!$('diagSummary')) return;
    const d=state.diagnostics; if(!d)return;
    $('diagSummary').textContent=d.summary?.attention?`${d.summary.attention} attention`:'Healthy';
    $('diagGenerated').textContent=`Generated ${dateLabel(d.generatedAt)}`;
    $('diagSchema').textContent=`${d.schemaVersion} / ${d.expectedSchema}`;
    $('diagProtocol').textContent=`v${d.messageProtocolVersion}`;
    $('diagVersion').textContent=d.extensionVersion||'—';
    const labels={serviceWorker:'Service worker',storageSchema:'Storage schema',storageIsolation:'Storage isolation',authentication:'Authentication',naukri:'Naukri session',watchdog:'Watchdog',profileBoostSchedule:'Profile Boost schedule',messageProtocol:'Message protocol',candidate:'Active candidate',cloudMigration:'Cloud workspace'};
    $('diagChecks').innerHTML=Object.entries(d.checks||{}).map(([key,row])=>`<div><span>${escapeHtml(labels[key]||key)} · ${escapeHtml(row.detail||'')}</span><strong class="${row.ok?'ready':'pending'}">${escapeHtml(statusLabel(row.status))}</strong></div>`).join('')||'<div><span>No checks returned.</span><strong class="pending">Unavailable</strong></div>';
    $('diagProviders').innerHTML=(d.providers||[]).map(a=>`<article class="provider-card"><strong>${escapeHtml(a.label)}</strong><span>${escapeHtml(capabilityText(a))}</span></article>`).join('');
    $('diagMigrations').innerHTML=(d.migrations||[]).slice().reverse().map(m=>`<div><span>${escapeHtml(m.label||'Schema migration')} · ${escapeHtml(dateLabel(m.at))}</span><strong class="ready">${escapeHtml(String(m.from))} → ${escapeHtml(String(m.to))}</strong></div>`).join('')||'<div><span>No migration was required for this installation.</span><strong class="ready">Current</strong></div>';
  }
  async function refreshDiagnostics(){
    const resp=await api.message({type:'GET_SYSTEM_DIAGNOSTICS'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Diagnostics failed.');return;}
    state.diagnostics=resp.diagnostics;renderDiagnostics();toast('System diagnostics refreshed.');
  }
  async function copyDiagnostics(){
    const resp=await api.message({type:'GET_SYSTEM_DIAGNOSTICS'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Diagnostics failed.');return;}
    state.diagnostics=resp.diagnostics;renderDiagnostics();
    const text=JSON.stringify(resp.diagnostics,null,2);
    try{await navigator.clipboard.writeText(text);toast('Sanitized diagnostic report copied.');}
    catch{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?'Sanitized diagnostic report copied.':'Could not copy diagnostic report.');}
  }
  async function openTestLab(){
    const url=chrome.runtime.getURL('test-lab.html');
    if(globalThis.chrome?.tabs?.create){await chrome.tabs.create({url,active:true});return;}
    location.href=url;
  }

  async function checkNaukri(){
    const resp=await api.message({type:'CHECK_NAUKRI_SESSION'}).catch(e=>({ok:false,error:e.message})); state.naukri=resp; if(resp?.connection) state.naukriConnection=resp.connection; renderBusiness();
    const label=resp?.connection?.label||resp?.connection?.state||resp?.state;
    if(label) toast(`Naukri session: ${label}.`); else toast(resp?.error||'Could not check Naukri session.');
  }

  async function loadActivity(){
    const resp=await api.message({type:'GET_AUTOMATION_ACTIVITY'}).catch(()=>null);
    if(Array.isArray(resp?.activity)) state.activity=resp.activity; else { const stored=await api.get(['automationActivity']); state.activity=Array.isArray(stored.automationActivity)?stored.automationActivity:[]; }
    renderActivity();
  }
  function renderActivity(){
    const list=[...state.activity].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
    $('activityEmpty').hidden=list.length>0;
    $('activityList').innerHTML=list.map(a=>`<article class="activity-row"><div class="activity-icon ${escapeHtml(a.status||'info')}">${escapeHtml((a.type||'system').slice(0,1).toUpperCase())}</div><div class="activity-body"><div class="activity-title"><strong>${escapeHtml(a.title||'Automation activity')}</strong><span>${escapeHtml(dateLabel(a.at))}</span></div><p>${escapeHtml(a.detail||'')}</p><div class="chips"><span class="chip">${escapeHtml(a.type||'system')}</span><span class="chip ${a.status==='success'?'score':a.status==='critical'||a.status==='error'?'danger-chip':a.status==='warning'?'warning':''}">${escapeHtml(a.status||'info')}</span></div></div></article>`).join('');
  }
  async function clearActivity(){
    const resp=await api.message({type:'CLEAR_AUTOMATION_ACTIVITY'}).catch(()=>null);
    if(resp?.ok) state.activity=[]; else {state.activity=[]; await api.set({automationActivity:[]});}
    renderActivity(); toast('Automation activity cleared.');
  }
  async function runWatchdog(){
    const resp=await api.message({type:'RUN_AUTOMATION_WATCHDOG'}).catch(e=>({ok:false,error:e.message}));
    if(!resp?.ok){toast(resp?.error||'Watchdog could not run.');return;}
    await load(); toast('Watchdog check complete.');
  }

  function renderAll(){
    metrics();renderQueue();renderAutoApply();renderSessions();renderProviders();renderBoost();renderActivity();renderBusiness();fillTeam();renderDiagnostics();renderProductionPreflight();
  }
  function switchTab(name){document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));}

  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));
  $('queueSearch').addEventListener('input',renderQueue); $('queueFilter').addEventListener('change',renderQueue);
  $('autoPreviewBtn').addEventListener('click',previewAutoApply); $('autoRunBtn').addEventListener('click',runAutoApply); $('autoCheckBtn').addEventListener('click',checkAutoApply); $('autoOpenBtn').addEventListener('click',openRecommendedJobs); $('autoStopBtn').addEventListener('click',stopAutoApply);
  $('syncToolkitBtn')?.addEventListener('click',syncCurrentToToolkit);
  $('toolkitKeywordsBtn')?.addEventListener('click',suggestKeywordsFromToolkit);
  $('toolkitBridgeBadge')?.addEventListener('click',()=>updateToolkitBadge(true));
  $('refreshBtn').addEventListener('click',()=>load().catch(e=>toast(`Refresh failed: ${e.message}`))); $('checkNaukriBtn').addEventListener('click',()=>checkNaukri().catch(e=>toast(`Naukri check failed: ${e.message}`)));
  $('saveVaultBtn').addEventListener('click',saveVault); $('saveSafetyBtn').addEventListener('click',saveSafety);
  $('addAnswerBtn').addEventListener('click',()=>{collectCustom();state.vault.custom.push({question:'',answer:''});renderCustom();});
  $('teamSave').addEventListener('click',saveTeam); $('teamCandidate').addEventListener('change',switchTeamCandidate); $('teamAdd').addEventListener('click',addCandidate); $('teamDuplicate').addEventListener('click',duplicateCandidate); $('teamArchive').addEventListener('click',archiveCandidate);
  $('liSave').addEventListener('click',savePortalJob); $('liSimulate').addEventListener('click',simulatePortalJob); $('naukriSearchApplyBtn').addEventListener('click',runNaukriSearchAutoApply);
  $('saveBoostBtn').addEventListener('click',saveBoost); $('boostNowBtn').addEventListener('click',runBoost); $('recoverBoostBtn').addEventListener('click',recoverBoost); $('openProfileBtn').addEventListener('click',openProfile);
  $('clearActivityBtn').addEventListener('click',clearActivity); $('runWatchdogBtn').addEventListener('click',runWatchdog); $('diagRefreshBtn')?.addEventListener('click',refreshDiagnostics); $('diagCopyBtn')?.addEventListener('click',copyDiagnostics); $('testLabBtn')?.addEventListener('click',openTestLab);
  $('bizManageAuth').addEventListener('click',manageAuth); $('bizSignOut').addEventListener('click',signOutAccount); $('bizExportData').addEventListener('click',()=>exportBusiness('full')); $('bizExportSupport').addEventListener('click',()=>exportBusiness('support')); $('bizClearDiagnostics').addEventListener('click',clearSecurityDiagnostics); $('bizReset').addEventListener('click',resetBusiness);
  $('prodPreflightBtn').addEventListener('click',runProductionPreflight); $('cloudPreviewBtn').addEventListener('click',previewCloudMigration); $('cloudPushBtn').addEventListener('click',pushCloudMigration); $('cloudVerifyBtn').addEventListener('click',verifyCloudMigration); $('cloudDeleteBtn').addEventListener('click',deleteCloudData); $('localClearBtn').addEventListener('click',clearLocalCareerData); $('accountDeleteBtn').addEventListener('click',deleteApplyraAccount);
  if(globalThis.chrome?.storage?.onChanged){chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.jobs||changes.universalJobs||changes.applyEngineSessions||changes.profileBoost||changes.naukriAutoApply||changes.naukriAutoApplyRuns||changes.naukriAutoApplyActiveRun||changes.automationActivity||changes.businessAccount||changes.businessUsageLedger||changes.businessAudit||changes.naukriConnection||changes.teamWorkspace||changes.cloudMigration)){load();}});}
  $('applyEngineBackBtn')?.addEventListener('click',(e)=>{
    e.preventDefault();
    if(window.self!==window.top){
      try{
        const parentNavButtons=[...window.parent.document.querySelectorAll('nav button')];
        const overviewBtn=parentNavButtons.find(b=>(b.textContent||'').trim().includes('Overview'));
        if(overviewBtn){overviewBtn.click();return;}
      }catch{}
      window.top.location.href=chrome.runtime.getURL('index.html');
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else if (document.referrer && document.referrer.startsWith(chrome.runtime.getURL(''))) {
      window.location.href = document.referrer;
    } else {
      try { window.close(); } catch {}
      setTimeout(() => { window.location.href = 'index.html'; }, 100);
    }
  });
  load().catch(e=>toast(`Automation Center failed to load: ${e.message}`));
  updateToolkitBadge(false).catch(()=>{});
  window.addEventListener('focus', () => updateToolkitBadge(false).catch(()=>{}));
  setInterval(() => updateToolkitBadge(false).catch(()=>{}), 10000);
})();
