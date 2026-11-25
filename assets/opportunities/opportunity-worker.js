(() => {
'use strict';
const C=ApplyraOpportunities, KEY='opportunityScans', ALARM='applyra.opportunities';
let queue=Promise.resolve();
const serial=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
async function read(){const raw=(await chrome.storage.local.get(KEY))[KEY]||{};return {...raw,schedules:raw.schedules||{},history:raw.history||{},seen:raw.seen||{}};}
async function context(){
 const s=await chrome.storage.local.get(['teamWorkspace','activeCandidateProfile','profile','careerEvidence']);
 const w=s.teamWorkspace, candidates=Array.isArray(w?.candidates)?w.candidates.filter(c=>c.status!=='archived'):[];
 const activeId=w?.activeCandidateId;
 const c=candidates.find(candidate=>candidate.id===activeId)||(candidates.length===1?candidates[0]:null);
 if(w&&candidates.length>1&&!c)throw Error('Choose the active candidate in Applyra before saving or running a scan.');
 const profileSource=c?.profile||(s.activeCandidateProfile&&Object.keys(s.activeCandidateProfile).length?s.activeCandidateProfile:s.profile)||{};
 const id=c?.id||'local-profile';
 return {id,name:profileSource.name||'Current profile',profile:profileSource,evidence:s.careerEvidence?.[id]||{}};
}
async function arm(state){
 const times=Object.values(state.schedules).filter(s=>s.enabled).map(s=>s.nextRun).filter(Number.isFinite);
 if(times.length)await chrome.alarms.create(ALARM,{when:Math.max(Date.now()+1000,Math.min(...times))});else await chrome.alarms.clear(ALARM);
}
async function feed(url,parse){
 const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`HTTP ${r.status}`);
 return parse(await r.json());
}
async function scan(state,id,manual=false){
 const s=state.schedules[id];if(!s)throw Error('Save a schedule first.');
 const data=await chrome.storage.local.get(['teamWorkspace','activeCandidateProfile','profile','careerEvidence','jobs','universalJobs','careerSuite','careerManualJobs','radarConfig','radarProviderSecrets','radarCache']);
 const candidate=data.teamWorkspace?.candidates?.find(c=>c.id===id&&c.status!=='archived');
 const rawProfile=candidate?.profile||(id==='local-profile'?(data.activeCandidateProfile&&Object.keys(data.activeCandidateProfile).length?data.activeCandidateProfile:data.profile):null);
 const evidence=data.careerEvidence?.[id]||{};const profile=rawProfile?{...rawProfile,skills:[...new Set([...C.list(rawProfile.skills),...ApplyraCareerIntelligence.skills(Object.values(ApplyraCareerIntelligence.sources(rawProfile,evidence)).join(' '))])]}:null;
 if(!profile){s.enabled=false;s.error='Candidate unavailable; schedule paused.';return;}
 const started=Date.now();
 const feeds=await Promise.allSettled([
  feed('https://remotive.com/api/remote-jobs',d=>{if(!Array.isArray(d.jobs))throw Error('Invalid Remotive response');return d.jobs.map(j=>({title:j.title,company:j.company_name,description:j.description,location:j.candidate_required_location||'Remote — eligibility unspecified',url:j.url,postedAt:j.publication_date,source:'Remotive',salary:j.salary||''}));}),
  feed('https://www.arbeitnow.com/api/job-board-api',d=>{if(!Array.isArray(d.data))throw Error('Invalid Arbeitnow response');return d.data.map(j=>({title:j.title,company:j.company_name,description:j.description,location:(j.location||'')+(j.remote?' · Remote':''),url:j.url,postedAt:j.created_at?new Date(j.created_at*1000).toISOString():'',source:'Arbeitnow',salary:''}));})
 ]);
 const warnings=feeds.flatMap((r,i)=>r.status==='rejected'?[`${['Remotive','Arbeitnow'][i]}: ${r.reason.message}`]:[]);
 const jobs=feeds.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 const radarJobs=(data.radarCache?.jobs||[]).map(j=>({id:j.fingerprint||j.id,title:j.position?.title||j.title,company:j.company?.name||j.companyName||'',description:j.position?.description||j.description||'',location:j.location?.display||j.locationText||'',url:j.url,postedAt:j.postedAt||'',source:j.source?.label||j.source?.id||'Job Radar',salary:j.compensation?.text||j.salary||''})).filter(j=>/^https:\/\//i.test(String(j.url||'')));
 const localJobs=[...ApplyraCareerIntelligence.jobsFromStorage(data,id),...(data.careerManualJobs?.[id]||[])].filter(j=>!['applied','interview','offer','rejected'].includes(String(j.status).toLowerCase())).map(j=>({...j,source:j.sourceLabel||j.provider||'Saved workspace',postedAt:j.postedAt||'',salary:j.salary||''}));
 const allJobs=[...jobs,...radarJobs,...localJobs];
 const assessment=C.rankDetailed(allJobs,profile,s,manual?{}:(state.seen[id]||{}),started);
 const shortlist=assessment.shortlist;
 const portalSources=[...new Set([...localJobs.map(j=>j.source),...radarJobs.map(j=>j.source)].filter(x=>x&&x!=='Saved workspace'))];
 const run={at:started,trigger:manual?'manual':'scheduled',status:warnings.length===2&&!localJobs.length&&!radarJobs.length?'failed':warnings.length?'partial':'complete',warnings,shortlist,checked:allJobs.length,localCount:localJobs.length,radarCount:radarJobs.length,filterCounts:assessment.filterCounts,profileSkillCount:assessment.profileSkillCount,portalSources,feedSources:feeds.flatMap((r,i)=>r.status==='fulfilled'?[['Remotive','Arbeitnow'][i]]:[]),evidenceSources:['stored profile',...(evidence.resume?.text?['resume']:[]),...(evidence.linkedin?.text?['LinkedIn']:[]),...(evidence.naukri?.text?['Naukri snapshot']:[])]};
 state.history[id]=[run,...(state.history[id]||[])].slice(0,12);
 state.seen[id]=Object.fromEntries(Object.entries(state.seen[id]||{}).filter(([,t])=>started-t<90*86400000));
 shortlist.forEach(j=>state.seen[id][j.url]=started);
 s.lastRun=started;s.error=warnings.join(' | ');s.nextRun=C.nextRun(s,Date.now());
 await chrome.storage.local.set({[KEY]:state});
 if(shortlist.length)await chrome.notifications.create('applyra-opportunities',{type:'basic',iconUrl:'assets/brand/icon128.png',title:'Applyra opportunity shortlist',message:`${shortlist.length} new matches. Open Career Suite to review.`}).catch(()=>{});
}
async function due(){
 const state=await read();
 for(const s of Object.values(state.schedules))if(s.enabled&&!Number.isFinite(s.nextRun)){try{s.nextRun=C.nextRun(C.validate(s));}catch(e){s.enabled=false;s.error=e.message;}}
 for(const [id,s] of Object.entries(state.schedules))if(s.enabled&&s.nextRun<=Date.now()){
  try{await scan(state,id);}catch(e){s.error=e.message;s.nextRun=Date.now()+3600000;}
 }
 await chrome.storage.local.set({[KEY]:state});await arm(state);
}
chrome.alarms.onAlarm.addListener(a=>{if(a.name===ALARM)serial(due).catch(console.error);});
chrome.runtime.onStartup.addListener(()=>serial(due).catch(console.error));
chrome.runtime.onInstalled.addListener(()=>serial(due).catch(console.error));
chrome.notifications.onClicked.addListener(id=>{if(id==='applyra-opportunities')chrome.tabs.create({url:chrome.runtime.getURL('career-suite.html#opportunity-scans')});});
async function dispatch(msg){
 const ctx=await context(), state=await read();
 if(msg.action==='save'){
  const s=C.validate(msg.schedule);state.schedules[ctx.id]={...s,nextRun:C.nextRun(s),lastRun:state.schedules[ctx.id]?.lastRun||null};
  await chrome.storage.local.set({[KEY]:state});await arm(state);
 }else if(msg.action==='run'){
  if(msg.schedule){const settings=C.validate(msg.schedule);state.schedules[ctx.id]={...state.schedules[ctx.id],...settings,nextRun:C.nextRun(settings)};}
  if(!state.schedules[ctx.id])throw Error('Enter target roles and scan settings first.');
  await scan(state,ctx.id,true);await chrome.storage.local.set({[KEY]:state});await arm(state);
 }else if(msg.action!=='get')throw Error('Unknown scan action.');
 return {context:ctx,schedule:state.schedules[ctx.id],history:state.history[ctx.id]||[]};
}
function trusted(sender){return sender?.id===chrome.runtime.id&&(!sender.url||sender.url.startsWith(chrome.runtime.getURL('')));}
chrome.runtime.onMessage?.addListener((msg,sender,reply)=>{
 if(msg?.type!=='APPLYRA_OPPORTUNITY_SCAN')return false;
 if(!trusted(sender)){reply({ok:false,error:'Open the scan page inside Applyra.'});return false;}
 serial(()=>dispatch(msg)).then(data=>reply({ok:true,data})).catch(e=>reply({ok:false,error:e.message}));
 return true;
});
// Compatibility for pages from the previous build that are still open.
chrome.runtime.onConnect.addListener(port=>{
 if(port.name!=='applyra-opportunities')return;
 if(!trusted(port.sender)){port.disconnect();return;}
 port.onMessage.addListener(msg=>serial(()=>dispatch(msg))
  .then(data=>{try{port.postMessage({id:msg.id,ok:true,data});}catch{}})
  .catch(e=>{try{port.postMessage({id:msg.id,ok:false,error:e.message});}catch{}}));
});
serial(due).catch(console.error);
})();
