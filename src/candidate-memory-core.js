(() => {
'use strict';
const clean=(v,n=500)=>String(v??'').replace(/[\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const multi=(v,n=4000)=>String(v??'').replace(/\r/g,'').split('\n').map(x=>clean(x,500)).filter(Boolean).join('\n').slice(0,n);
const listText=(v,n=3000)=>Array.isArray(v)?v.map(x=>clean(typeof x==='string'?x:(x?.name||x?.title||x?.value||''),500)).filter(Boolean).join(', ').slice(0,n):clean(v,n);
const DEFAULT_MEMORY={currentLocation:'',preferredLocation:'',relocationCities:'',yearsExperience:'',experienceFacts:'',noticePeriod:'',lastWorkingDay:'',lastWorkingDayAnswer:'',availableFrom:'',currentCtc:'',expectedCtc:'',workAuthorization:'',remotePreference:'',relocation:'',fiveDayWfo:'',pfAllEmployments:'',formerEmployers:'',employerIds:'',capabilityFacts:'',linkedinUrl:'',portfolioUrl:'',githubUrl:'',reasonForChange:'',custom:[]};
const DEFAULT_PROFILE={name:'',email:'',phone:'',headline:'',summary:'',targetRoles:'',skills:'',yearsExperience:'',currentLocation:'',preferredLocation:'',currentCtc:'',expectedCtc:'',noticePeriod:'',employmentHistory:[]};
function normalizeHistory(v){return (Array.isArray(v)?v:[]).map(x=>({
  ...x,
  title:clean(x?.title||x?.designation||x?.role,180),
  company:clean(x?.company||x?.organization||x?.employer,180),
  period:clean(x?.period||x?.duration||x?.dateRange,160),
  description:clean(x?.description||x?.summary,2000)
})).filter(x=>x.title||x.company).slice(0,50)}
function lpa(v){const n=Number(v);return Number.isFinite(n)&&n>0?`${Math.round(n*100)/100} LPA`:clean(v,120)}
function profileFromLegacy(x={}){
  const history=normalizeHistory(x.employmentHistory?.length?x.employmentHistory:x.workHistory);
  const full=Number(x.fullTimeYears)||0, intern=Number(x.internshipYears)||0;
  const years=clean(x.yearsExperience,30)||(full||intern?String(Math.round((full+intern)*10)/10):'');
  const roles=listText(x.targetRoles||x.roles,1000);
  const skills=listText(x.skills,3000);
  const locations=listText(x.preferredLocation||x.locations,500);
  let expected=clean(x.expectedCtc,120);
  if(!expected){const lo=Number(x.salaryMin)||0,hi=Number(x.salaryMax)||0;if(lo&&hi&&hi!==lo)expected=`${lo} - ${hi} LPA`;else if(lo||hi)expected=lpa(lo||hi);}
  const notice=clean(x.noticePeriod,120)||(Number(x.noticePeriodDays)>0?`${Number(x.noticePeriodDays)} days`:(Number(x.noticePeriodDays)===0&&x.noticePeriodDays!==undefined&&x.noticePeriodDays!==null?'Immediate':''));
  return {
    ...x,
    name:clean(x.name,160),email:clean(x.email,240),phone:clean(x.phone,80),
    headline:clean(x.headline||x.currentTitle,240),summary:clean(x.summary,3000),
    targetRoles:roles,skills,yearsExperience:years,currentLocation:clean(x.currentLocation,160),preferredLocation:locations,
    currentCtc:clean(x.currentCtc,120)||lpa(x.currentSalary),expectedCtc:expected,noticePeriod:notice,
    employmentHistory:history
  };
}
function normalizeMemory(x={}){const o={...DEFAULT_MEMORY,...x}; for(const k of Object.keys(DEFAULT_MEMORY)){if(k==='custom')continue;o[k]=['experienceFacts','employerIds','capabilityFacts'].includes(k)?multi(o[k]):clean(o[k],2000)} o.custom=(Array.isArray(x.custom)?x.custom:[]).map(a=>({id:clean(a.id||crypto.randomUUID?.()||Date.now(),120),question:clean(a.question,1000),answer:clean(a.answer,1000),reviewed:a.reviewed!==false,source:clean(a.source||'user',80),updatedAt:a.updatedAt||new Date().toISOString()})).filter(a=>a.question&&a.answer);return o}
function normalizeProfile(x={}){const p=profileFromLegacy(x);return {...DEFAULT_PROFILE,...p,name:clean(p.name,160),email:clean(p.email,240),phone:clean(p.phone,80),headline:clean(p.headline,240),summary:clean(p.summary,3000),targetRoles:clean(p.targetRoles,1000),skills:clean(p.skills,3000),yearsExperience:clean(p.yearsExperience,30),currentLocation:clean(p.currentLocation,160),preferredLocation:clean(p.preferredLocation,500),currentCtc:clean(p.currentCtc,120),expectedCtc:clean(p.expectedCtc,120),noticePeriod:clean(p.noticePeriod,120),employmentHistory:normalizeHistory(p.employmentHistory)}}
function mergeProfileMissing(existing={},incoming={}){const a=normalizeProfile(existing),b=normalizeProfile(incoming),out={...a};for(const k of ['name','email','phone','headline','summary','targetRoles','skills','yearsExperience','currentLocation','preferredLocation','currentCtc','expectedCtc','noticePeriod'])if(!clean(out[k])&&clean(b[k]))out[k]=b[k];if(!out.employmentHistory.length&&b.employmentHistory.length)out.employmentHistory=b.employmentHistory;return normalizeProfile(out)}
function formerCompanies(history=[]){const names=[];for(const row of normalizeHistory(history)){if(!row.company)continue;const period=clean(row.period,160);const current=/(?:present|current|till date|currently)/i.test(period)||row.current===true||row.isCurrent===true;if(current)continue;if(!names.some(x=>x.toLowerCase()===row.company.toLowerCase()))names.push(row.company);}return names}
function memoryFromProfile(p,m={}){p=normalizeProfile(p);const o=normalizeMemory(m); if(!o.currentLocation)o.currentLocation=p.currentLocation;if(!o.preferredLocation)o.preferredLocation=p.preferredLocation;if(!o.yearsExperience&&Number(p.yearsExperience)>0)o.yearsExperience=String(p.yearsExperience);if(!o.noticePeriod&&p.noticePeriod)o.noticePeriod=p.noticePeriod;if(!o.currentCtc&&p.currentCtc)o.currentCtc=p.currentCtc;if(!o.expectedCtc&&p.expectedCtc)o.expectedCtc=p.expectedCtc;const former=formerCompanies(p.employmentHistory);if(!o.formerEmployers&&former.length)o.formerEmployers=former.join(', ');return o}
function readiness(c){const p=normalizeProfile(c?.profile||{}),m=normalizeMemory(c?.memory||{});const checks={identity:!!p.name,roles:!!p.targetRoles,skills:!!p.skills,experience:!!(m.yearsExperience||p.yearsExperience),location:!!(m.currentLocation||p.currentLocation),availability:!!(m.noticePeriod||m.availableFrom)};const done=Object.values(checks).filter(Boolean).length;return {score:Math.round(done/Object.keys(checks).length*100),checks}}
function createCandidate(input={}){const now=new Date().toISOString();return {id:clean(input.id||crypto.randomUUID?.()||`candidate-${Date.now()}`,120),status:input.status||'active',profile:normalizeProfile(input.profile||input),memory:memoryFromProfile(input.profile||input,input.memory||{}),resumes:Array.isArray(input.resumes)?input.resumes:[],createdAt:input.createdAt||now,updatedAt:input.updatedAt||now}}
function addReviewedAnswer(m,q,a,meta={}){m=normalizeMemory(m);const question=clean(q,1000),answer=clean(a,1000);if(!question||!answer)return m;m.custom=[...m.custom.filter(x=>x.question.toLowerCase()!==question.toLowerCase()),{id:clean(meta.id||`answer-${Date.now()}`,120),question,answer,reviewed:true,source:clean(meta.source||'user',80),updatedAt:meta.updatedAt||new Date().toISOString()}];return m}
globalThis.NowCurryCandidateMemory={VERSION:'2.8.0-beta.8.1',DEFAULT_MEMORY,DEFAULT_PROFILE,normalizeMemory,normalizeProfile,profileFromLegacy,mergeProfileMissing,memoryFromProfile,formerCompanies,readiness,createCandidate,addReviewedAnswer};
})();
