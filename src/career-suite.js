(() => {
  'use strict';
  const Core=globalThis.ApplyraCareerSuite, Team=globalThis.NowCurryTeam;
  if(!Core||!Team) throw new Error('Career Suite dependencies not loaded.');
  const $=id=>document.getElementById(id); const now=()=>new Date().toISOString();
  const state={workspace:null,candidate:null,profile:{},suite:{resumes:[],tracked:[],alerts:[],emailImports:[],interviews:[],outreach:[],updatedAt:''},jobs:[],lastMatched:null,lastOutreach:null};
  function html(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function safeDate(d){if(!d)return 'Recently';try{const t=new Date(d);return isNaN(t.getTime())?'Recently':t.toLocaleString();}catch{return 'Recently';}}
  async function load(){
    const s=await chrome.storage.local.get(['teamWorkspace','profile','careerSuite','jobs','universalJobs','applyEngineSessions']);
    state.workspace=s.teamWorkspace?Team.normalizeWorkspace(s.teamWorkspace):Team.createWorkspace({profile:s.profile||{}}); state.candidate=Team.activeCandidate(state.workspace); state.profile=s.profile||{};
    const raw=s.careerSuite&&typeof s.careerSuite==='object'?s.careerSuite:{}; state.suite={...state.suite,...raw,resumes:Array.isArray(raw.resumes)?raw.resumes:[],tracked:Array.isArray(raw.tracked)?raw.tracked:[],alerts:Array.isArray(raw.alerts)?raw.alerts:[],emailImports:Array.isArray(raw.emailImports)?raw.emailImports:[],interviews:Array.isArray(raw.interviews)?raw.interviews:[],outreach:Array.isArray(raw.outreach)?raw.outreach:[]};
    const native=Array.isArray(s.jobs)?s.jobs:[]; const universal=Object.values(s.universalJobs||{}).map(x=>x.job?{...x.job,status:x.status,history:x.history}:x);
    const jobMap=new Map(); for(const j of [...native,...universal]){const jid=Core.clean(j?.id||j?.fingerprint||'',180);if(jid&&!jobMap.has(jid))jobMap.set(jid,j);else if(!jid)jobMap.set(Math.random().toString(),j);}
    state.jobs=[...jobMap.values()];
    // Mirror terminal/active application sessions into the tracker without deleting user-maintained rows.
    const existing=new Map(state.suite.tracked.map(x=>[x.id,x])); for(const ses of (Array.isArray(s.applyEngineSessions)?s.applyEngineSessions:[])){const id=Core.clean(ses.fingerprint||ses.jobId||ses.id,180);if(!id)continue;const status=ses.state==='APPLIED'?'applied':ses.state==='FAILED'?'rejected':existing.get(id)?.status||'saved';existing.set(id,{...Core.normalizeTracked(existing.get(id)||{}),id,candidateId:existing.get(id)?.candidateId||state.candidate?.id||'',title:ses.title||existing.get(id)?.title||'',company:ses.company||existing.get(id)?.company||'',url:ses.url||existing.get(id)?.url||'',status,source:ses.source||existing.get(id)?.source||'apply-session',updatedAt:ses.updatedAt||now()});}
    state.suite.tracked=[...existing.values()]; renderAll();
  }
  async function save(){
    state.suite.updatedAt=now();
    try {
      const s = await chrome.storage.local.get(['jobs']);
      const currentJobs = Array.isArray(s.jobs) ? [...s.jobs] : [];
      const jobMap = new Map();
      currentJobs.forEach(j => {
        const key = Core.clean(j?.id || `${j?.title}|${j?.company}`, 180);
        if (key) jobMap.set(key, j);
      });
      for (const t of state.suite.tracked) {
        const key = Core.clean(t.id || `${t.title}|${t.company}`, 180);
        if (!key) continue;
        const prev = jobMap.get(key) || {};
        const capStatus = /interview/i.test(t.status) ? 'Interview' : /offer/i.test(t.status) ? 'Offer' : /reject/i.test(t.status) ? 'Rejected' : /shortlist/i.test(t.status) ? 'Shortlisted' : 'Applied';
        jobMap.set(key, {
          ...prev,
          id: prev.id || t.id || key,
          title: t.title || prev.title || 'Tracked Application',
          company: t.company || prev.company || 'Enterprise Organization',
          status: capStatus,
          statusUpdatedAt: now(),
          applied: true,
          appliedAt: prev.appliedAt || t.updatedAt || now(),
          source: t.source || prev.source || 'career-suite',
          url: t.url || prev.url || '',
          applyUrl: t.url || prev.applyUrl || '',
          location: prev.location || 'Pan India / Hybrid',
          experienceText: prev.experienceText || 'Relevant Experience',
          salaryText: prev.salaryText || 'Market Standard'
        });
      }
      await chrome.storage.local.set({careerSuite:state.suite,jobs:Array.from(jobMap.values()),schemaVersion:14});
    } catch(err) {
      await chrome.storage.local.set({careerSuite:state.suite,schemaVersion:14});
    }
    renderAll();
  }
  function currentResumes(){return state.suite.resumes.filter(r=>!r.candidateId||!state.candidate?.id||r.candidateId===state.candidate?.id);}
  function currentTracked(){return state.suite.tracked.filter(t=>!t.candidateId||!state.candidate?.id||t.candidateId===state.candidate?.id);}
  function latestResume(){return currentResumes().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]||null;}
  function currentJob(){return state.lastMatched?.job||{title:$('matchTitle').value,company:$('matchCompany').value,description:$('matchDescription').value};}
  function renderAll(){renderResume();renderTracker();renderAlerts();refreshInsights(false);}
  function renderResume(){const rows=currentResumes().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));if(!rows.length){$('resumeResult').textContent='No resume variant generated yet.';return;}const r=rows[0];$('resumeResult').textContent=`${r.name}\nTarget: ${r.targetRole}\nSaved variants for this candidate: ${rows.length}\n\n${r.text}`;}
  function renderTracker(){const rows=currentTracked().map(Core.normalizeTracked).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));const a=Core.trackerAnalytics(rows);$('mTracked').textContent=a.total;$('mApplied').textContent=a.applied;$('mInterview').textContent=`${a.interviewRate}%`;$('mOffer').textContent=`${a.offerRate}%`;$('trackerList').innerHTML=rows.slice(0,50).map(x=>`<div class="item"><b>${html(x.title||'Untitled')} · ${html(x.company||'Enterprise Organization')}</b><small>Applyra Pipeline · updated ${html(safeDate(x.updatedAt))}</small><div class="row" style="margin-top:6px"><select data-status="${html(x.id)}">${Core.PIPELINE.map(s=>`<option value="${s}" ${s===x.status?'selected':''}>${s}</option>`).join('')}</select><button class="secondary" data-sim="${html(x.company||'')}">🧮 Sim Comp</button><button class="danger" data-remove="${html(x.id)}">Remove</button></div></div>`).join('')||'<div class="item"><b>No tracked opportunities yet.</b><small>Save a matched job or import an application email.</small></div>';
    document.querySelectorAll('[data-status]').forEach(el=>el.addEventListener('change',async()=>{const i=state.suite.tracked.findIndex(x=>x.id===el.dataset.status);if(i>=0){const prev=Core.normalizeTracked(state.suite.tracked[i]);state.suite.tracked[i]={...prev,status:el.value,updatedAt:now(),history:[...(prev.history||[]),{status:el.value,at:now()}]};await save();}}));
    document.querySelectorAll('[data-remove]').forEach(el=>el.addEventListener('click',async()=>{state.suite.tracked=state.suite.tracked.filter(x=>x.id!==el.dataset.remove);await save();}));
    document.querySelectorAll('[data-sim]').forEach(el=>el.addEventListener('click',()=>{const url=`company-intel.html?company=${encodeURIComponent(el.dataset.sim||'')}`;if(globalThis.chrome?.tabs?.create&&globalThis.chrome?.runtime?.getURL){chrome.tabs.create({url:chrome.runtime.getURL(url)});}else{window.open(url,'_blank');}}));
  }
  function renderAlerts(){const rows=state.suite.alerts.filter(a=>!a.candidateId||!state.candidate?.id||a.candidateId===state.candidate?.id);$('alertsResult').textContent=rows.length?rows.map(a=>{const matches=state.jobs.filter(j=>Core.evaluateAlert(a,j,state.candidate,state.profile).match).length;return `${a.name} · keywords ${a.keywords||'any'} · locations ${a.locations||'any'} · min ${a.minScore}% · current matches ${matches}`;}).join('\n'):'No alert rules yet.';}
  async function buildResume(){const r=Core.buildResume(state.candidate,state.profile,{targetRole:$('resumeRole').value,name:$('resumeName').value,summary:$('resumeSummary').value});r.candidateId=state.candidate?.id||'';state.suite.resumes.unshift(r);state.suite.resumes=state.suite.resumes.slice(0,60);await save();}
  async function scanResume(){const r=latestResume();if(!r){$('atsResult').textContent='Build a resume variant first.';return;}const jobText=$('atsJob').value;const local=Core.atsScan(r.text,jobText);$('atsResult').textContent=`ATS heuristic: ${local.score}/100 · ${local.grade}
Word count: ${local.wordCount}${local.keywordCoverage!==null?`
Job keyword coverage: ${local.keywordCoverage}%`:''}

Issues: ${local.issues.length?local.issues.join(' | '):'None detected'}
Suggestions: ${local.suggestions.length?local.suggestions.join(' | '):'No structural suggestions'}${local.missingKeywords.length?`
Missing job terms to review: ${local.missingKeywords.join(', ')}`:''}`;}
  async function doMatch(){const job={title:$('matchTitle').value,company:$('matchCompany').value,description:$('matchDescription').value,location:''};const m=Core.matchJob(job,state.candidate,state.profile);state.lastMatched={job,match:m};$('matchResult').textContent=`Local match: ${m.score}% · ${m.reason}
Matched: ${m.matched.join(', ')||'No strong keyword overlap yet'}
Gaps to verify: ${m.missing.join(', ')||'No obvious keyword gaps'}`;return state.lastMatched;}
  async function saveMatched(){const x=state.lastMatched||await doMatch();const id=`career-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;state.suite.tracked.unshift(Core.normalizeTracked({id,candidateId:state.candidate?.id||'',title:x.job.title,company:x.job.company,status:'saved',source:'career-suite',createdAt:now(),updatedAt:now()}));await save();}
  async function parseEmail(){const input=$('emailText').value;if(!input.trim()){$('emailResult').textContent='Paste an email first.';return;}const parsed=Core.parseJobEmail(input);if(!parsed.recognized){$('emailResult').textContent=`Not imported. ${parsed.evidence}`;return;}const id=`email-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;state.suite.emailImports.unshift({...parsed,id,at:now(),candidateId:state.candidate?.id||''});state.suite.emailImports=state.suite.emailImports.slice(0,500);state.suite.tracked.unshift(Core.normalizeTracked({id,candidateId:state.candidate?.id||'',title:parsed.title||'Application',company:parsed.company,status:parsed.status,source:'email-import',createdAt:now(),updatedAt:now()}));$('emailResult').textContent=`Status: ${parsed.status}\nRole: ${parsed.title||'not detected'}\nCompany: ${parsed.company||'not detected'}\n${parsed.evidence}`;await save();}
  function interview(){const plan=Core.interviewPlan(currentJob(),state.candidate,state.profile);state.suite.interviews.unshift({...plan,id:`interview-${Date.now()}`,candidateId:state.candidate?.id||'',createdAt:now()});state.suite.interviews=state.suite.interviews.slice(0,100);$('interviewResult').textContent=`Role: ${plan.role} · match ${plan.matchScore}%\n\nQuestions:\n${plan.questions.map((q,i)=>`${i+1}. ${q}`).join('\n')}\n\nPrep:\n${plan.prep.map(x=>`• ${x}`).join('\n')}`;save();}
  function outreach(){const d=Core.outreachDraft(currentJob(),state.candidate,state.profile);if(d.blocked){state.lastOutreach=null;$('outreachResult').textContent=`Not generated. ${d.error}`;return;}state.lastOutreach=d;state.suite.outreach.unshift({...d,id:`outreach-${Date.now()}`,candidateId:state.candidate?.id||'',createdAt:now()});state.suite.outreach=state.suite.outreach.slice(0,100);$('outreachResult').textContent=`Subject: ${d.subject}\n\n${d.body}`;save();}
  function refreshInsights(saveFlag=true){const x=Core.careerInsights(currentTracked(),state.candidate,state.profile);$('insightsResult').textContent=`Tracked: ${x.analytics.total} · Applied: ${x.analytics.applied} · Interview rate: ${x.analytics.interviewRate}% · Offer rate: ${x.analytics.offerRate}%\n\n${x.insights.map(i=>`• ${i}`).join('\n')}`;if(saveFlag)state.suite.lastInsightAt=now();}
  async function saveAlert(){const rule={id:`alert-${Date.now()}`,candidateId:state.candidate?.id||'',name:Core.clean($('alertName').value||'Priority jobs',120),keywords:Core.clean($('alertKeywords').value,600),locations:Core.clean($('alertLocations').value,600),minScore:Math.max(0,Math.min(100,Number($('alertScore').value)||0)),createdAt:now(),updatedAt:now()};state.suite.alerts.unshift(rule);await save();}
  function ask(){const q=$('copilotPrompt').value;const answer=Core.copilot(q,{tracked:currentTracked(),candidate:state.candidate,profile:state.profile,resumes:currentResumes(),jobText:$('atsJob').value});$('copilotResult').textContent=answer;}
  function download(name,text,type='text/plain'){
    if(globalThis.ApplyraDownloadToast?.download){
      return globalThis.ApplyraDownloadToast.download(name,text,type);
    }
    const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function csv(){const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const lines=[['Title','Company','Status','Source','Updated','URL'].map(q).join(',')];for(const x of currentTracked().map(Core.normalizeTracked))lines.push([x.title,x.company,x.status,x.source,x.updatedAt,x.url].map(q).join(','));download(`applyra-tracker-${new Date().toISOString().slice(0,10)}.csv`,lines.join('\n'),'text/csv');}
  function bind(){
    $('buildResume').addEventListener('click',buildResume);$('scanResume').addEventListener('click',scanResume);$('matchJob').addEventListener('click',doMatch);$('saveMatchedJob').addEventListener('click',saveMatched);$('parseEmail').addEventListener('click',parseEmail);$('buildInterview').addEventListener('click',interview);$('buildOutreach').addEventListener('click',outreach);$('refreshInsights').addEventListener('click',()=>refreshInsights(true));$('saveAlert').addEventListener('click',saveAlert);$('askCopilot').addEventListener('click',ask);$('exportCsv').addEventListener('click',csv);
    $('copyResume').addEventListener('click',async()=>{const r=latestResume();if(r)await navigator.clipboard.writeText(r.text);});$('exportResume').addEventListener('click',()=>{const r=latestResume();if(r)download(`${r.name.replace(/[^a-z0-9_-]+/gi,'-')}.txt`,r.text);});$('copyOutreach').addEventListener('click',async()=>{if(state.lastOutreach)await navigator.clipboard.writeText(`${state.lastOutreach.subject}\n\n${state.lastOutreach.body}`);});
    $('careerBackBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else if (document.referrer && globalThis.chrome?.runtime?.getURL && document.referrer.startsWith(chrome.runtime.getURL(''))) {
        window.location.href = document.referrer;
      } else {
        try { window.close(); } catch {}
        setTimeout(() => { window.location.href = 'index.html'; }, 100);
      }
    });
    globalThis.chrome?.storage?.onChanged?.addListener((changes,area)=>{if(area==='local'&&(changes.teamWorkspace||changes.profile||changes.careerSuite||changes.applyEngineSessions||changes.jobs||changes.universalJobs))load().catch(console.error);});
  }
  bind();load().catch(e=>{document.body.innerHTML=`<main class="shell"><div class="truth"><strong>Career Suite failed to load.</strong><br>${html(e.message)}</div></main>`;});
})();
