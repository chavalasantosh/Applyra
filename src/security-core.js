(function(root){
  'use strict';

  const VERSION='2.6.1';
  const SENSITIVE_KEY_RE=/(^|_|-)(access.?token|refresh.?token|token|cookie|authorization|password|passwd|secret|session|api.?key|appkey|private.?key|credential)(_|-|$)/i;
  const SENSITIVE_QUERY_RE=/^(?:resId|id|sid|mid|logstr|multiApplyResp|authorization|auth|token|access_token|refresh_token|session|sessionId|rt|nauk_rt|nauk_sid)$/i;
  const EMAIL_RE=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig;
  const BEARER_RE=/(?:ACCESSTOKEN|Bearer)\s*=*\s*[A-Za-z0-9._~+\/-]{24,}/ig;
  const JWT_RE=/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

  function clean(value,max=2000){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch{return null;}}
  function isNaukriUrl(value){
    try{const h=new URL(String(value||'')).hostname.toLowerCase();return h==='naukri.com'||h.endsWith('.naukri.com');}catch{return false;}
  }
  function safeHttpUrl(value,{hosts=null}={}){
    try{
      const u=new URL(String(value||''));
      if(u.protocol!=='https:'&&u.protocol!=='http:') return '';
      if(Array.isArray(hosts)&&hosts.length){
        const h=u.hostname.toLowerCase();
        const allowed=hosts.some(raw=>{const x=String(raw||'').toLowerCase().replace(/^\*\./,'');return h===x||h.endsWith('.'+x);});
        if(!allowed) return '';
      }
      return u.href;
    }catch{return '';}
  }
  function sanitizeOperationalUrl(value){
    const text=clean(value,5000); if(!text) return '';
    try{
      const u=new URL(text);
      u.hash='';
      if(isNaukriUrl(u.href)){
        if(/\/myapply\/(?:saveApply|showAcp)(?:[/?#]|$)/i.test(u.pathname)){
          u.search='';
          return `${u.origin}${u.pathname}`;
        }
        for(const key of [...u.searchParams.keys()]) if(SENSITIVE_QUERY_RE.test(key)) u.searchParams.delete(key);
      }
      return u.toString();
    }catch{return text.replace(BEARER_RE,'[redacted]').replace(JWT_RE,'[redacted]');}
  }
  function sanitizeString(value,{support=false}={}){
    let out=String(value==null?'':value).replace(BEARER_RE,'[redacted]').replace(JWT_RE,'[redacted]');
    out=out.replace(/https?:\/\/[^\s\"'<>]+/gi,(raw)=>{
      const trailing=(raw.match(/[),.;!?]+$/)||[''])[0];
      const core=trailing?raw.slice(0,-trailing.length):raw;
      return sanitizeOperationalUrl(core)+trailing;
    });
    if(support) out=out.replace(EMAIL_RE,'[redacted-email]');
    return out;
  }
  function sanitize(value,key='',options={}){
    if(SENSITIVE_KEY_RE.test(String(key||''))) return '[redacted]';
    if(Array.isArray(value)) return value.map(v=>sanitize(v,key,options));
    if(value&&typeof value==='object'){
      const out={};
      for(const [k,v] of Object.entries(value)) out[k]=sanitize(v,k,options);
      return out;
    }
    if(typeof value==='string') return sanitizeString(value,options);
    return value;
  }
  function sanitizeForSupport(value){return sanitize(value,'',{support:true});}
  function sanitizeForPrivateBackup(value){return sanitize(value,'',{support:false});}

  const PRIVATE_BACKUP_KEYS=[
    'jobs','profile','lastScan','lastImport','runs','profileRefresh','profileBoost','naukriAutoApply','naukriAutoApplyRuns',
    'naukriAppliedJobIds','teamWorkspace','activeCandidateProfile','questionLearningInbox','portalInbox','backendConfig','applyEngineAnswerVault','applyEngineSafety','feedback','history','historySync','naukriConnection',
    'profileRevisions','interviews','radarConfig','radarCache','universalJobs','universalRuns','businessAccount','businessUsageLedger',
    'businessAudit','careerSuite','researchEngine','migrationHistory','schemaVersion','careerEvidence','careerManualJobs','opportunityScans'
  ];
  function buildPrivateBackup(storage={},product={}){
    const data={};
    for(const key of PRIVATE_BACKUP_KEYS){
      if(storage[key]===undefined) continue;
      if(key==='radarConfig'){
        const cfg=clone(storage[key])||{};
        if(cfg.adzuna){cfg.adzuna={...cfg.adzuna,appKey:'',appId:cfg.adzuna.appId?'[configured]':''};}
        data[key]=cfg;
      }else if(key==='naukriAutoApplyRuns'){
        data[key]=(Array.isArray(storage[key])?storage[key]:[]).map(run=>({
          ...run,
          outcome: run?.outcome?{...run.outcome,url:sanitizeOperationalUrl(run.outcome.url)}:run?.outcome
        }));
      }else data[key]=storage[key];
    }
    delete data.profileBoostRecovery;
    delete data.naukriAutoApplyActiveRun;
    return sanitizeForPrivateBackup({
      format:'nowcurry-private-backup',formatVersion:2,exportedAt:new Date().toISOString(),product,data
    });
  }

  function supportRun(run={}){
    return {
      id:clean(run.id,160),state:clean(run.state,80),startedAt:clean(run.startedAt,40),updatedAt:clean(run.updatedAt,40),completedAt:clean(run.completedAt,40),
      selectedCount:Array.isArray(run.selected)?run.selected.length:0,
      confirmedCount:Array.isArray(run.confirmedApplied)?run.confirmedApplied.length:0,
      followupCount:Array.isArray(run.followup)?run.followup.length:0,
      failedCount:Array.isArray(run.failed)?run.failed.length:0,
      outcome:run.outcome?{status:clean(run.outcome.status,80),reason:clean(run.outcome.reason||run.outcome.error,500),security:Boolean(run.outcome.security),url:sanitizeOperationalUrl(run.outcome.url)}:null,
      error:clean(run.error,500)
    };
  }
  function buildSupportBundle(storage={},product={},business={}){
    const settings=storage.naukriAutoApply||{};
    const boost=storage.profileBoost||{};
    const safety=storage.applyEngineSafety||{};
    const activity=(Array.isArray(storage.automationActivity)?storage.automationActivity:[]).slice(0,100).map(x=>({
      at:clean(x.at,40),type:clean(x.type,80),status:clean(x.status,80),title:clean(x.title,180),source:clean(x.source,80)
    }));
    const audit=(Array.isArray(storage.businessAudit)?storage.businessAudit:[]).slice(0,100).map(x=>({
      at:clean(x.at,40),type:clean(x.type,80),title:clean(x.title,180),meta:{plan:clean(x?.meta?.plan,40),count:Number(x?.meta?.count)||0}
    }));
    const recentRuns=(Array.isArray(storage.naukriAutoApplyRuns)?storage.naukriAutoApplyRuns:[]).slice(0,20).map(supportRun);
    const payload={
      format:'nowcurry-support-bundle',formatVersion:2,exportedAt:new Date().toISOString(),product,
      security:{storageScope:'trusted-extension-contexts',rawUrlsIncluded:false,credentialsIncluded:false},
      business:{plan:clean(business?.account?.plan,40),subscriptionStatus:clean(business?.account?.subscriptionStatus,40),billingMode:clean(business?.account?.billingMode,40),usage:business?.usage||{}},
      safety:{dailyCap:Number(safety.dailyCap)||0,maxParallel:Number(safety.maxParallel)||0,requireFinalReview:safety.requireFinalReview!==false,pauseSecurity:safety.pauseSecurity!==false,watchdogMinutes:Number(safety.watchdogMinutes)||0},
      autoApply:{settings:{batchSize:Number(settings.batchSize)||1,openVisibleTab:settings.openVisibleTab!==false,answerVaultAssist:Boolean(settings.answerVaultAssist),skipKnownApplied:settings.skipKnownApplied!==false,reusePreviewTab:settings.reusePreviewTab!==false,lastStatus:clean(settings.lastStatus,80),lastError:clean(settings.lastError,500),totalRuns:Number(settings.totalRuns)||0,totalApplied:Number(settings.totalApplied)||0,todayApplied:Number(settings.todayApplied)||0},recentRuns},
      profileBoost:{enabled:Boolean(boost.enabled),cadence:clean(boost.cadence,40),mode:clean(boost.mode,40),lastStatus:clean(boost.lastStatus,80),lastError:clean(boost.lastError,500),rollbackRequired:Boolean(boost.rollbackRequired),totalSuccesses:Number(boost.totalSuccesses)||0},
      activity,businessAudit:audit
    };
    return sanitizeForSupport(payload);
  }

  function isTrustedRuntimeSender(sender={},runtimeId=''){
    if(!runtimeId||sender?.id!==runtimeId) return false;
    const prefix=`chrome-extension://${runtimeId}/`;
    const candidates=[sender?.url,sender?.origin,sender?.documentUrl].filter(Boolean).map(String);
    if(candidates.some(v=>v.startsWith(prefix))) return true;
    // Authorized content scripts running in a tab (e.g., on Naukri)
    if(sender?.tab && candidates.some(v=>isNaukriUrl(v))) return true;
    // Service-worker-originated runtime notifications have our extension id but no tab/page URL.
    if(!sender?.tab && candidates.length===0) return true;
    return false;
  }

  function ageCutoff(days){return Date.now()-Math.max(1,Number(days)||1)*86400000;}
  function pruneTimedRows(rows=[],{days=90,max=500,timeKeys=['updatedAt','completedAt','at','startedAt','capturedAt']}={}){
    const cutoff=ageCutoff(days);
    return (Array.isArray(rows)?rows:[]).filter(row=>{
      if(!row||typeof row!=='object') return false;
      const raw=timeKeys.map(k=>row[k]).find(Boolean); if(!raw) return true;
      const ts=new Date(raw).getTime(); return !Number.isFinite(ts)||ts>=cutoff;
    }).slice(0,Math.max(1,Number(max)||500));
  }

  async function lockStorageAccess(chromeApi=root.chrome){
    const result={local:false,session:false};
    try{if(chromeApi?.storage?.local?.setAccessLevel){await chromeApi.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});result.local=true;}}catch{}
    try{if(chromeApi?.storage?.session?.setAccessLevel){await chromeApi.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});result.session=true;}}catch{}
    return result;
  }

  root.NowCurrySecurityCore={VERSION,SENSITIVE_KEY_RE,clean,clone,isNaukriUrl,safeHttpUrl,sanitizeOperationalUrl,sanitizeString,sanitize,sanitizeForSupport,sanitizeForPrivateBackup,buildPrivateBackup,buildSupportBundle,isTrustedRuntimeSender,pruneTimedRows,lockStorageAccess};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurrySecurityCore;
})(typeof globalThis!=='undefined'?globalThis:this);
