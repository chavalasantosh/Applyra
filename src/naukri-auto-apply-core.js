(function(root){
  'use strict';

  const VERSION = '2.9.2';
  const RUN_STATES = [
    'IDLE','PREPARING','SCANNING','SELECTING','SUBMITTING','WAITING_FOLLOWUP',
    'ANSWERING','VERIFYING','APPLIED','PARTIAL','PENDING','FAILED','CANCELLED','LIMIT_REACHED'
  ];
  const TERMINAL = new Set(['APPLIED','PARTIAL','FAILED','CANCELLED','LIMIT_REACHED']);
  const ALLOWED = {
    IDLE:['PREPARING','CANCELLED'],
    PREPARING:['SCANNING','FAILED','CANCELLED','LIMIT_REACHED'],
    SCANNING:['SELECTING','FAILED','CANCELLED'],
    SELECTING:['SUBMITTING','FAILED','CANCELLED'],
    SUBMITTING:['WAITING_FOLLOWUP','VERIFYING','PENDING','FAILED','CANCELLED'],
    WAITING_FOLLOWUP:['ANSWERING','VERIFYING','PENDING','FAILED','CANCELLED'],
    ANSWERING:['WAITING_FOLLOWUP','VERIFYING','PENDING','FAILED','CANCELLED'],
    VERIFYING:['APPLIED','PARTIAL','WAITING_FOLLOWUP','PENDING','FAILED','CANCELLED'],
    PENDING:['WAITING_FOLLOWUP','VERIFYING','APPLIED','PARTIAL','FAILED','CANCELLED'],
    APPLIED:[], PARTIAL:[], FAILED:[], CANCELLED:[], LIMIT_REACHED:[]
  };

  function clean(value,max=4000){
    return String(value == null ? '' : value).replace(/\s+/g,' ').trim().slice(0,max);
  }
  function lower(value){ return clean(value).toLowerCase(); }
  function normalizeKey(value){ return lower(value).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
  function csv(value){ return clean(value,1000).split(',').map(v=>normalizeKey(v)).filter(Boolean); }
  function now(){ return new Date().toISOString(); }
  function safeUrl(value){
    try { return new URL(String(value || '')); } catch { return null; }
  }

  function parseMultiApplyResp(value){
    const url = safeUrl(value);
    if(!url) return {};
    const raw = url.searchParams.get('multiApplyResp');
    if(!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      const out = {};
      for(const [id,code] of Object.entries(parsed)){
        const n = Number(code);
        if(clean(id,100) && Number.isFinite(n)) out[String(id)] = n;
      }
      return out;
    } catch { return {}; }
  }

  function classifyOutcome(value){
    const url = String(value || '');
    const responses = parseMultiApplyResp(url);
    const entries = Object.entries(responses);
    const successIds = entries.filter(([,c])=>c===200).map(([id])=>id);
    const followupIds = entries.filter(([,c])=>c===202).map(([id])=>id);
    const failedIds = entries.filter(([,c])=>c!==200 && c!==202).map(([id])=>id);
    const isSave = /\/myapply\/saveApply/i.test(url);
    const isAcp = /\/myapply\/showAcp/i.test(url);
    let status = 'pending';
    let terminal = false;
    let reason = '';

    if(entries.length){
      if(successIds.length === entries.length && isSave){
        status = 'applied'; terminal = true;
      } else if(successIds.length === entries.length){
        status = 'applied'; terminal = true;
      } else if(successIds.length && (followupIds.length || failedIds.length)){
        status = 'partial'; terminal = true;
        reason = followupIds.length ? 'Some jobs were applied while others need follow-up.' : 'Some jobs were applied while others failed.';
      } else if(followupIds.length){
        status = 'waiting-user'; terminal = true;
        reason = 'Naukri returned a follow-up state for the application.';
      } else if(failedIds.length){
        status = 'failed'; terminal = true;
        reason = 'Naukri returned a non-success application response.';
      }
    } else if(isSave){
      const parsedJobs = url.match(/[?&]strJobsarr=\[?([0-9, ]+)\]?/i)?.[1]?.split(',') || [];
      const extractedIds = parsedJobs.map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
      if(extractedIds.length){
        status = 'applied';
        terminal = true;
        successIds.push(...extractedIds);
        extractedIds.forEach(id => { responses[id] = 200; });
      }
    } else if(isAcp){
      status = 'waiting-user'; terminal = true;
      reason = 'Naukri opened the ACP/follow-up workflow.';
    }

    return {status,terminal,responses,successIds,followupIds,failedIds,url,reason};
  }

  function jobIdFromRecord(job={}){
    const explicit = clean(job.jobId || job.sourceJobId || job.externalId,80);
    if(explicit) return explicit;
    const source = `${job.url || ''} ${job.applyUrl || ''} ${job.sourcePage || ''}`;
    const hits = source.match(/\b\d{10,14}\b/g) || [];
    return hits[hits.length - 1] || '';
  }

  const RED_FLAG_PATTERN = /\b(security deposit|training fee|processing fee|registration fee|refundable fee|pay before|unpaid trial|commission only|service bond|employment bond|cheque deposit|deposit required|bond period|pay to work|telegram task|crypto investment|earn up to rs\.?\s*\d+.*(?:per day|daily))\b/i;

  function candidateMatches(item={},settings={},skipIds=new Set()){
    const jobId = clean(item.jobId,80);
    if(!jobId || !clean(item.title,240)) return false;
    if(skipIds.has(jobId)) return false;
    const body = `${clean(item.title)} ${clean(item.company)} ${clean(item.location)} ${clean(item.text,8000)}`.toLowerCase();
    if(/\balready applied\b|\bapplication sent\b|\bapplied on\b/i.test(body)) return false;
    if(settings.redFlagGuard && RED_FLAG_PATTERN.test(body)) return false;
    const includes = csv(settings.includeKeywords);
    const excludes = csv(settings.excludeKeywords);
    if(includes.length && !includes.some(term=>body.includes(term))) return false;
    if(excludes.length && excludes.some(term=>body.includes(term))) return false;
    return true;
  }


  function previewKey(settings={}){
    return JSON.stringify({
      batchSize:Math.max(1,Math.min(5,Number(settings.batchSize)||1)),
      includeKeywords:csv(settings.includeKeywords).sort(),
      excludeKeywords:csv(settings.excludeKeywords).sort(),
      redFlagGuard:settings.redFlagGuard!==false,
      skipKnownApplied:settings.skipKnownApplied!==false,
      answerVaultAssist:Boolean(settings.answerVaultAssist)
    });
  }

  function normalizeSelected(items=[]){
    const map = new Map();
    for(const item of Array.isArray(items)?items:[]){
      const jobId = clean(item?.jobId,80);
      if(!jobId || map.has(jobId)) continue;
      map.set(jobId,{
        jobId,
        title:clean(item?.title || 'Naukri job',240),
        company:clean(item?.company,180),
        location:clean(item?.location,180)
      });
    }
    return [...map.values()];
  }

  function createRun(settings={},meta={}){
    const at = now();
    return {
      id:`naukri-run-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      state:'PREPARING', startedAt:at, updatedAt:at, completedAt:'', heartbeatAt:at,
      tabId:null, settings:{
        batchSize:Math.max(1,Math.min(5,Number(settings.batchSize)||1)),
        includeKeywords:clean(settings.includeKeywords,500),
        excludeKeywords:clean(settings.excludeKeywords,500),
        openVisibleTab:settings.openVisibleTab!==false,
        answerVaultAssist:Boolean(settings.answerVaultAssist),
        skipKnownApplied:settings.skipKnownApplied!==false
      },
      selected:[], confirmedApplied:[], followup:[], failed:[],
      outcome:null, error:'', note:'', source:clean(meta.source || 'automation-center',80),
      events:[{at,state:'PREPARING',message:'Run created'}]
    };
  }

  function transitionRun(run,next,message='',patch={}){
    if(!run || !RUN_STATES.includes(run.state)) throw new Error('Invalid Auto Apply run state.');
    if(!RUN_STATES.includes(next)) throw new Error(`Unknown Auto Apply state: ${next}`);
    const allowed = ALLOWED[run.state] || [];
    if(!allowed.includes(next) && run.state !== next) throw new Error(`Cannot move Auto Apply from ${run.state} to ${next}.`);
    const at = now();
    const out = {...run,...patch,state:next,updatedAt:at,heartbeatAt:at};
    out.events=[...(run.events||[]),{at,state:next,message:clean(message,600)||next}].slice(-200);
    if(TERMINAL.has(next)) out.completedAt = out.completedAt || at;
    return out;
  }

  function heartbeat(run,patch={}){
    const at = now();
    return {...run,...patch,updatedAt:at,heartbeatAt:at};
  }

  function isRunStale(run,timeoutMinutes=10,at=Date.now()){
    if(!run || TERMINAL.has(run.state)) return false;
    const stamp = new Date(run.heartbeatAt || run.updatedAt || run.startedAt || 0).getTime();
    if(!Number.isFinite(stamp) || stamp<=0) return true;
    return at-stamp > Math.max(2,Number(timeoutMinutes)||10)*60000;
  }

  function resolveQuestion(question='',options=[],vault={}){
    const qi=root.NowCurryQuestionIntelligence;
    if(qi?.resolve) return qi.resolve(question,options,vault);
    return {matched:false,reason:'Question Intelligence core is unavailable.'};
  }

  function outcomeForSelected(selected=[],outcome={}){
    const list = normalizeSelected(selected);
    const success = new Set((outcome.successIds||[]).map(String));
    const follow = new Set((outcome.followupIds||[]).map(String));
    const failed = new Set((outcome.failedIds||[]).map(String));
    if(!success.size && outcome.status==='applied' && (list.length===1 || outcome.domAllApplied===true || (Number(outcome.appliedCount)>0 && Number(outcome.totalCount)>0 && Number(outcome.appliedCount)===Number(outcome.totalCount) && Number(outcome.totalCount)>=list.length))) for(const item of list) success.add(String(item.jobId));
    return {
      confirmedApplied:list.filter(x=>success.has(String(x.jobId))),
      followup:list.filter(x=>follow.has(String(x.jobId))),
      failed:list.filter(x=>failed.has(String(x.jobId))),
      unresolved:list.filter(x=>!success.has(String(x.jobId))&&!follow.has(String(x.jobId))&&!failed.has(String(x.jobId)))
    };
  }


  function mergeRunParts(run={},parts={}){
    const selected=normalizeSelected(run.selected||[]);
    const byId=new Map();
    for(const item of [...normalizeSelected(run.confirmedApplied||[]),...normalizeSelected(run.followup||[]),...normalizeSelected(run.failed||[]),...normalizeSelected(parts.confirmedApplied||[]),...normalizeSelected(parts.followup||[]),...normalizeSelected(parts.failed||[]),...selected]) byId.set(item.jobId,item);
    const confirmed=new Set(normalizeSelected(run.confirmedApplied||[]).map(x=>x.jobId));
    const follow=new Set(normalizeSelected(run.followup||[]).map(x=>x.jobId));
    const failed=new Set(normalizeSelected(run.failed||[]).map(x=>x.jobId));
    for(const item of normalizeSelected(parts.confirmedApplied||[])){ confirmed.add(item.jobId); follow.delete(item.jobId); failed.delete(item.jobId); }
    for(const item of normalizeSelected(parts.failed||[])){ if(!confirmed.has(item.jobId)){ failed.add(item.jobId); follow.delete(item.jobId); } }
    for(const item of normalizeSelected(parts.followup||[])){ if(!confirmed.has(item.jobId)&&!failed.has(item.jobId)) follow.add(item.jobId); }
    const order=[...selected.map(x=>x.jobId),...byId.keys()].filter((id,i,a)=>a.indexOf(id)===i);
    const list=(set)=>order.filter(id=>set.has(id)&&byId.has(id)).map(id=>byId.get(id));
    return {confirmedApplied:list(confirmed),followup:list(follow),failed:list(failed)};
  }

  function historyKey(entry={}){
    const jobId = clean(entry.jobId || entry.sourceJobId,80);
    if(jobId) return `naukri:${jobId}`;
    return `fallback:${normalizeKey(entry.title)}|${normalizeKey(entry.company)}|${clean(entry.occurredAt,10)}`;
  }

  root.NowCurryNaukriAutoApplyCore={
    VERSION,RUN_STATES,TERMINAL,ALLOWED,clean,lower,normalizeKey,csv,parseMultiApplyResp,classifyOutcome,
    jobIdFromRecord,candidateMatches,previewKey,normalizeSelected,createRun,transitionRun,heartbeat,isRunStale,
    resolveQuestion,outcomeForSelected,mergeRunParts,historyKey
  };
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryNaukriAutoApplyCore;
})(typeof globalThis!=='undefined'?globalThis:this);
