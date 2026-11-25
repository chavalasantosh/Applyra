(function(root){
  'use strict';

  const VERSION = '2.8.0-beta.9-stability-fix';
  const TERMINAL = new Set(['APPLIED','FAILED','STOPPED']);
  const STATES = ['READY','OPENING_JOB','FILLING','WAITING_USER','VERIFYING','APPLIED','FAILED','STOPPED'];
  const ALLOWED = {
    READY: ['OPENING_JOB','STOPPED'],
    OPENING_JOB: ['FILLING','WAITING_USER','FAILED','STOPPED'],
    FILLING: ['WAITING_USER','VERIFYING','FAILED','STOPPED'],
    WAITING_USER: ['FILLING','VERIFYING','FAILED','STOPPED'],
    VERIFYING: ['APPLIED','WAITING_USER','FAILED','STOPPED'],
    APPLIED: [], FAILED: [], STOPPED: []
  };

  function text(v, max=5000){
    return String(v ?? '').replace(/\s+/g,' ').trim().slice(0,max);
  }
  function lower(v){ return text(v).toLowerCase(); }
  function now(){ return new Date().toISOString(); }
  function canonicalUrl(v){
    const raw=text(v,2000); if(!raw) return '';
    try { const u=new URL(raw); u.hash=''; return u.toString(); } catch { return raw; }
  }
  function sourceId(job){
    return lower(job?.source?.id || job?.sourceLabel || job?.source || '').replace(/[^a-z0-9_-]+/g,'-') || 'unknown';
  }
  function applicationUrl(job){
    return canonicalUrl(job?.applyUrl || job?.url || job?.job?.applyUrl || job?.job?.url || '');
  }
  function title(job){ return text(job?.title || job?.position?.title || job?.job?.title || job?.job?.position?.title || 'Untitled role',240); }
  function company(job){ return text(job?.company?.name || job?.company || job?.job?.company?.name || job?.job?.company || 'Company not listed',180); }
  function location(job){ return text(job?.location?.display || job?.location || job?.job?.location?.display || job?.job?.location || 'Not listed',180); }
  function matchScore(job){ return Math.max(0,Math.min(100,Number(job?.matchScore ?? job?.intelligence?.matchScore ?? job?.job?.matchScore ?? job?.job?.intelligence?.matchScore ?? 0)||0)); }
  function status(job){ return text(job?.status || job?.job?.status || 'Unreviewed',60); }
  function saved(job){ return Boolean(job?.saved || job?.status==='saved' || job?.job?.saved || job?.job?.status==='saved'); }
  function fingerprint(job){
    const u=applicationUrl(job); if(u) return `url:${u.toLowerCase()}`;
    const explicit=text(job?.fingerprint || job?.job?.fingerprint || job?.id || job?.job?.id,500);
    if(explicit) return explicit;
    return `text:${lower(title(job))}|${lower(company(job))}|${lower(location(job))}`;
  }

  function detectApplicationProvider(input){
    const url=typeof input==='string'?canonicalUrl(input):applicationUrl(input);
    const registry=globalThis.NowCurryPortalAdapters;
    if(registry?.detect){
      const adapter=registry.detect(url);
      return {id:adapter.id,label:adapter.label,mode:adapter.mode,capabilities:{...adapter.capabilities}};
    }
    let host=''; try{host=new URL(url).hostname.toLowerCase();}catch{}
    if(host==='naukri.com'||host.endsWith('.naukri.com')) return {id:'naukri',label:'Naukri',mode:'native-browser-session'};
    if(host==='linkedin.com'||host.endsWith('.linkedin.com')) return {id:'linkedin',label:'LinkedIn',mode:'user-assisted-intake'};
    if(host.includes('greenhouse.io')) return {id:'greenhouse',label:'Greenhouse',mode:'user-assisted-intake'};
    if(host.includes('lever.co')) return {id:'lever',label:'Lever',mode:'user-assisted-intake'};
    if(host.includes('ashbyhq.com')) return {id:'ashby',label:'Ashby',mode:'user-assisted-intake'};
    if(host.includes('myworkdayjobs.com')||host.includes('workday.com')) return {id:'workday',label:'Workday',mode:'user-assisted-intake'};
    if(host.includes('icims.com')) return {id:'icims',label:'iCIMS',mode:'user-assisted-intake'};
    if(host.includes('smartrecruiters.com')) return {id:'smartrecruiters',label:'SmartRecruiters',mode:'user-assisted-intake'};
    if(host.includes('rippling.com')) return {id:'rippling',label:'Rippling',mode:'user-assisted-intake'};
    return {id:'generic',label:host||'External site',mode:'user-assisted-intake'};
  }

  function normalizeJob(job, universalRecord){
    const raw=universalRecord?.job || job?.job || job || {};
    const id=fingerprint(raw);
    return {
      id,
      fingerprint: text(raw.fingerprint || universalRecord?.fingerprint || id,500),
      title:title(raw), company:company(raw), location:location(raw),
      url:applicationUrl(raw), source:sourceId(raw),
      sourceLabel:text(raw?.source?.label || raw?.sourceLabel || raw?.source || 'Unknown source',120),
      matchScore:matchScore(raw), status: universalRecord?.status || status(raw),
      saved: saved(raw) || universalRecord?.status==='saved', raw
    };
  }

  function mergeJobs(nativeJobs=[], universalJobs={}){
    const map=new Map();
    (Array.isArray(nativeJobs)?nativeJobs:[]).forEach(job=>{ const n=normalizeJob(job); map.set(n.id,n); });
    const records=Array.isArray(universalJobs)?universalJobs:Object.values(universalJobs||{});
    records.forEach(rec=>{
      const n=normalizeJob(rec?.job||rec, rec?.job?rec:null);
      const prev=map.get(n.id);
      map.set(n.id, prev ? {...prev,...n, raw:{...prev.raw,...n.raw}, saved:prev.saved||n.saved, status:n.status||prev.status} : n);
    });
    return [...map.values()].sort((a,b)=>b.matchScore-a.matchScore || a.title.localeCompare(b.title));
  }

  function createSession(job, opts={}){
    const provider=detectApplicationProvider(job);
    const at=now();
    const id=`apply-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    return {
      id, jobId:job.id||fingerprint(job), fingerprint:job.fingerprint||fingerprint(job),
      title:title(job), company:company(job), url:applicationUrl(job), source:sourceId(job),
      provider, state:'READY', tabId:null, createdAt:at, updatedAt:at,
      startedAt:'', completedAt:'', error:'', note:'',
      events:[{at,state:'READY',message:'Session created'}],
      requireFinalReview:opts.requireFinalReview!==false
    };
  }

  function transition(session,next,message=''){
    if(!session || !STATES.includes(session.state)) throw new Error('Invalid session state.');
    if(!STATES.includes(next)) throw new Error(`Unknown state: ${next}`);
    if(!ALLOWED[session.state].includes(next)) throw new Error(`Cannot move from ${session.state} to ${next}.`);
    const at=now();
    const out={...session,state:next,updatedAt:at,events:[...(session.events||[]),{at,state:next,message:text(message,500)||next}]};
    if(next==='OPENING_JOB'&&!out.startedAt) out.startedAt=at;
    if(TERMINAL.has(next)) out.completedAt=at;
    return out;
  }

  function answerCompletion(vault={}){
    const important=['currentLocation','preferredLocation','yearsExperience','noticePeriod','expectedCtc','workAuthorization','remotePreference','relocationCities','experienceFacts'];
    const done=important.filter(k=>text(vault[k]).length>0).length;
    return {done,total:important.length,percent:Math.round(done/important.length*100)};
  }

  function sessionHealth(session={},watchdogMinutes=15,at=Date.now()){
    if(!session || TERMINAL.has(session.state)) return {status:'terminal',stalled:false,ageMinutes:0};
    const stamp=new Date(session.updatedAt||session.startedAt||session.createdAt||0).getTime();
    if(!Number.isFinite(stamp)||stamp<=0) return {status:'unknown',stalled:false,ageMinutes:0};
    const ageMinutes=Math.max(0,Math.floor((Number(at)-stamp)/60000));
    const limit=Math.max(5,Math.min(120,Number(watchdogMinutes)||15));
    const stalled=session.watchdogState==='stalled'||ageMinutes>=limit;
    return {status:stalled?'stalled':'healthy',stalled,ageMinutes,limit};
  }

  root.NowCurryApplyCore={VERSION,STATES,ALLOWED,text,canonicalUrl,sourceId,applicationUrl,title,company,location,matchScore,status,saved,fingerprint,detectApplicationProvider,normalizeJob,mergeJobs,createSession,transition,answerCompletion,sessionHealth};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryApplyCore;
})(typeof globalThis!=='undefined'?globalThis:this);
