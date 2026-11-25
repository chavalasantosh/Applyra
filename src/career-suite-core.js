(function(root){
  'use strict';
  const VERSION='2.8.0-beta.8';
  const PIPELINE=['saved','applied','interview','offer','rejected','archived'];
  const clean=(v,n=6000)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/[\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
  const uniq=a=>[...new Set((a||[]).map(x=>clean(x,160)).filter(Boolean))];
  const arr=v=>Array.isArray(v)?v:clean(v).split(/[,;\n|]/).map(x=>clean(x,120)).filter(Boolean);
  const words=v=>clean(v,25000).toLowerCase().replace(/[^a-z0-9+#. -]/g,' ').split(/\s+/).filter(x=>x.length>2);
  const STOP=new Set('with from that this your will have work role team years experience skills looking about company remote job using into their they you our are for and the but not all any can has had was were what when where how why who'.split(' '));
  const JOB_NOISE=new Set('salary salaries compensation compensated benefits benefit annual annually annum package pay paid stipend wage wages 401 401k diversity inclusion equal opportunity employer applicants applicant ordinance fair chance law legal insurance retirement vacation sick maternity bonding holidays lpa ctc inr usd per phone tel mobile email whatsapp call'.split(' '));
  const jobToken=v=>clean(v,120).toLowerCase().replace(/^[.,;:!?()\[\]{}\"']+|[.,;:!?()\[\]{}\"']+$/g,'');
  const meaningfulJobTokens=v=>words(v).map(jobToken).filter(x=>x.length>2&&!STOP.has(x)&&!JOB_NOISE.has(x)&&!/^\d+(?:[.,]\d+)?$/.test(x)&&!/^\+?\d[\d-]{5,}$/.test(x)&&!/^\d{4}$/.test(x));
  function profileView(candidate={},legacy={}){
    const p=candidate?.profile||{}; const m=candidate?.memory||{}; const src={...legacy,...p};
    return {
      name:clean(src.name||src.fullName,160), email:clean(src.email,240), phone:clean(src.phone,80),
      headline:clean(src.headline||src.targetRoles,500), summary:clean(src.summary||m.experienceFacts,3000),
      targetRoles:uniq([...(arr(src.targetRoles)),...(Array.isArray(src.roles)?src.roles:[])]),
      skills:uniq([...(arr(src.skills)),...(Array.isArray(legacy.skills)?legacy.skills:[])]),
      yearsExperience:clean(src.yearsExperience||legacy.fullTimeYears||m.yearsExperience,40),
      currentLocation:clean(src.currentLocation||legacy.currentLocation||m.currentLocation,200),
      preferredLocations:uniq([...(arr(src.preferredLocation)),...(Array.isArray(legacy.locations)?legacy.locations:[]),...(arr(m.preferredLocation)),...(arr(m.relocationCities))]),
      employmentHistory:Array.isArray(src.employmentHistory)&&src.employmentHistory.length?src.employmentHistory:(Array.isArray(legacy.workHistory)?legacy.workHistory:[]),
      education:Array.isArray(src.education)&&src.education.length?src.education:(Array.isArray(legacy.education)?legacy.education:[]),
      certifications:Array.isArray(src.certifications)&&src.certifications.length?src.certifications:(Array.isArray(legacy.certifications)?legacy.certifications:[]),
      links:uniq([m.linkedinUrl,m.githubUrl,m.portfolioUrl]),
      memory:m
    };
  }
  function experienceLine(x={}){
    const title=clean(x.title||x.designation||x.role||x.position,160); const company=clean(x.company||x.companyName||x.organization||x.employer,160);
    const period=clean(x.period||x.duration||[x.startDate,x.endDate].filter(Boolean).join(' – '),120); const desc=clean(x.description||x.summary||x.details||x.responsibilities,2500);
    return [ [title,company].filter(Boolean).join(' — '), period, desc ].filter(Boolean);
  }
  function buildResume(candidate={},legacy={},options={}){
    const p=profileView(candidate,legacy); const role=clean(options.targetRole||p.targetRoles[0]||p.headline||'Target role',180);
    const summary=clean(options.summary||p.summary||`${p.yearsExperience?`${p.yearsExperience} years of experience. `:''}${p.skills.slice(0,8).length?`Core skills: ${p.skills.slice(0,8).join(', ')}.`:''}`,1600);
    const lines=[]; lines.push(p.name||'Candidate');
    const contact=[p.email,p.phone,p.currentLocation,...p.links].filter(Boolean).join(' | '); if(contact) lines.push(contact);
    lines.push(''); lines.push(`TARGET ROLE: ${role}`); if(summary){lines.push('');lines.push('PROFESSIONAL SUMMARY');lines.push(summary);}
    if(p.skills.length){lines.push('');lines.push('CORE SKILLS');lines.push(p.skills.join(' • '));}
    if(p.employmentHistory.length){lines.push('');lines.push('EXPERIENCE'); for(const item of p.employmentHistory){for(const l of experienceLine(item)) lines.push(l); lines.push('');}}
    if(p.education.length){lines.push('EDUCATION'); for(const e of p.education){lines.push(clean(typeof e==='string'?e:[e.degree||e.qualification,e.institution||e.school,e.year].filter(Boolean).join(' — '),700));}}
    if(p.certifications.length){lines.push('');lines.push('CERTIFICATIONS');for(const c of p.certifications)lines.push(clean(typeof c==='string'?c:[c.name,c.issuer,c.year].filter(Boolean).join(' — '),500));}
    const text=lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
    return {id:`resume-${Date.now()}`,name:clean(options.name||`${role} Resume`,120),targetRole:role,summary,skills:p.skills,text,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),source:'local-resume-builder'};
  }
  function atsScan(resumeText='',jobText=''){
    const rawResume=String(resumeText??'').replace(/<[^>]*>/g,' ').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000b-\u001f]+/g,' ');
    const resume=clean(rawResume,40000), job=clean(jobText,40000); const issues=[],suggestions=[]; let score=0;
    const hasContact=/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(resume); score+=hasContact?10:0; if(!hasContact)issues.push('Email address not detected.');
    const hasPhone=/(?:\+?\d[\s-]?){8,15}/.test(resume); score+=hasPhone?6:0; if(!hasPhone)suggestions.push('Add a phone number if appropriate for the role.');
    const sections=['summary','skills','experience','education']; const found=sections.filter(s=>new RegExp(`\\b${s}\\b`,'i').test(resume)); score+=found.length*8; for(const s of sections.filter(x=>!found.includes(x))) suggestions.push(`Add a clear ${s} section.`);
    const bulletish=(rawResume.match(/(?:^|\n)\s*[•*-]\s+/gm)||[]).length; score+=Math.min(10,bulletish*2);
    const metrics=(resume.match(/\b\d+(?:\.\d+)?\s*(?:%|x|k|m|million|billion|users|requests|hours|days|months|years)\b/gi)||[]).length; score+=Math.min(12,metrics*3); if(!metrics)suggestions.push('Add measurable outcomes where truthful (%, scale, time, cost, users, throughput).');
    const len=resume.split(/\s+/).filter(Boolean).length; if(len>=250&&len<=1100) score+=12; else if(len>=120&&len<=1500)score+=7; else suggestions.push('Keep the resume concise and information-dense; roughly 1–2 pages is usually easier to scan.');
    let keywordCoverage=null,matched=[],missing=[];
    if(job){const r=new Set(words(resume).map(jobToken));const j=meaningfulJobTokens(job);const freq={};for(const x of j)freq[x]=(freq[x]||0)+1;const important=Object.keys(freq).sort((a,b)=>freq[b]-freq[a]).slice(0,35);matched=important.filter(x=>r.has(x));missing=important.filter(x=>!r.has(x));keywordCoverage=important.length?Math.round(matched.length/important.length*100):100;score+=Math.round(keywordCoverage*0.2);if(missing.length)suggestions.push(`Review missing role keywords only if genuinely applicable: ${missing.slice(0,8).join(', ')}.`);}else score+=10;
    score=Math.max(0,Math.min(100,score));
    return {score,grade:score>=85?'Strong':score>=70?'Good':score>=55?'Needs work':'Weak',issues,suggestions,keywordCoverage,matchedKeywords:matched.slice(0,12),missingKeywords:missing.slice(0,12),wordCount:len};
  }
  function matchJob(job={},candidate={},legacy={}){
    const p=profileView(candidate,legacy);
    const known=new Set(words([...p.skills,...p.targetRoles,p.summary].join(' ')));
    const jobReqText=clean([job.title,job.position?.title,job.description,job.position?.description].join(' '),30000);
    const tokens=meaningfulJobTokens(jobReqText);
    const freq={};for(const t of tokens)freq[t]=(freq[t]||0)+1;
    const important=Object.keys(freq).sort((a,b)=>freq[b]-freq[a]).slice(0,45);
    const matched=important.filter(x=>known.has(x));
    const missing=important.filter(x=>!known.has(x));
    let score=important.length?Math.round(100*matched.length/important.length):50;
    const locText=clean([job.location?.display,job.location].filter(x=>typeof x==='string').join(' '),500).toLowerCase();
    if(p.preferredLocations.some(l=>locText&&locText.includes(l.toLowerCase()))) score+=5;
    score=Math.max(0,Math.min(98,score));
    return {score,matched:matched.slice(0,12),missing:missing.slice(0,10),reason:score>=80?'Strong profile overlap':score>=60?'Moderate profile overlap':'Low profile overlap'};
  }
  function normalizeTracked(row={}){
    const now=new Date().toISOString();
    const job=row.job||row;
    const company=typeof row.company==='string'&&row.company?row.company:(typeof job.company==='string'?job.company:(job.company?.name||''));
    const location=typeof row.location==='string'&&row.location?row.location:(typeof job.location==='string'?job.location:(job.location?.display||''));
    return {
      id:clean(row.id||row.fingerprint||job.fingerprint||job.id||`job-${Date.now()}`,180),
      candidateId:clean(row.candidateId||job.candidateId||'',180),
      title:clean(row.title||job.title||job.position?.title,260),
      company:clean(company,220),
      location:clean(location,220),
      url:clean(row.url||job.url,1600),
      status:PIPELINE.includes(row.status)?row.status:'saved',
      source:clean(row.source||job.source?.label||job.source?.id,100),
      createdAt:row.createdAt||now,
      updatedAt:row.updatedAt||now,
      history:Array.isArray(row.history)?row.history:[]
    };
  }
  function trackerAnalytics(rows=[]){const apps=(rows||[]).map(normalizeTracked);const counts=Object.fromEntries(PIPELINE.map(s=>[s,apps.filter(x=>x.status===s).length]));const total=apps.length,applied=counts.applied+counts.interview+counts.offer+counts.rejected,interviews=counts.interview+counts.offer,offers=counts.offer;const pct=(a,b)=>b?Math.round(a/b*100):0;return {total,counts,applied,interviews,offers,interviewRate:pct(interviews,applied),offerRate:pct(offers,Math.max(1,interviews)),active:apps.filter(x=>!['offer','rejected','archived'].includes(x.status)).length};}
  function parseJobEmail(text=''){
    const raw=clean(text,30000);const low=raw.toLowerCase();
    if(!raw)return {recognized:false,status:'',title:'',company:'',evidence:'No email text supplied.',rawPreview:''};
    const urlOnly=/^https?:\/\/\S+$/i.test(raw);
    let status='';
    if(/offer|congratulations.+offer|pleased to offer/.test(low))status='offer';
    else if(/interview|schedule.+call|technical round|assessment|screening call/.test(low))status='interview';
    else if(/unfortunately|not moving forward|rejected|other candidates/.test(low))status='rejected';
    else if(/application received|thanks for applying|application submitted|we received your application/.test(low))status='applied';
    const company=(raw.match(/(?:at|from|with)\s+([A-Z][A-Za-z0-9& .'-]{2,60})/)||[])[1]||'';
    const role=(raw.match(/(?:role|position|job|application)\s*(?:for|:)?\s*([A-Z][A-Za-z0-9+/# .'-]{2,90})/i)||[])[1]||'';
    const recognized=Boolean(status)&&!urlOnly;
    return {recognized,status:recognized?status:'',title:clean(role,160),company:clean(company,160),evidence:recognized?`Detected ${status} language in the imported email.`:(urlOnly?'A URL by itself is not an application email.':'No reliable application-status phrase detected.'),rawPreview:raw.slice(0,700)};
  }
  function interviewPlan(job={},candidate={},legacy={}){
    const p=profileView(candidate,legacy);const match=matchJob(job,candidate,legacy);const role=clean(job.title||job.position?.title||p.targetRoles[0]||'the role',180);const q=[`Walk me through your background and why it fits ${role}.`,`Describe one project where you used ${p.skills[0]||'your strongest technical skill'} end-to-end.`,`Tell me about a difficult production problem you diagnosed and how you verified the fix.`,`How do you prioritize correctness, reliability and delivery speed when requirements conflict?`];for(const s of match.missing.slice(0,3))q.push(`This role mentions ${s}. What relevant experience do you have, and where are your gaps?`);return {role,matchScore:match.score,questions:q.slice(0,8),prep:[`Prepare a 60–90 second introduction tailored to ${role}.`,'Prepare two STAR stories with measurable outcomes.',match.missing.length?`Review these job-specific gaps: ${match.missing.slice(0,5).join(', ')}.`:'Focus on concrete project depth and trade-offs.']};
  }
  function outreachDraft(job={},candidate={},legacy={},kind='recruiter'){
    const p=profileView(candidate,legacy);const role=clean(job.title||job.position?.title||p.targetRoles[0]||'the role',160),company=clean(job.company?.name||job.company||'your team',120),name=clean(p.name,160);
    if(!name)return {kind,blocked:true,error:'Candidate name is required before generating recruiter outreach.',subject:'',body:''};
    const skill=p.skills.slice(0,3).join(', ');const subject=`Interest in ${role} — ${name}`;const body=`Hi,\n\nI’m reaching out about the ${role} opportunity at ${company}. My background includes ${skill||'relevant experience for the role'}${p.yearsExperience?` with ${p.yearsExperience} years of experience`:''}. I’d be glad to share concise examples of work that map to the role requirements.\n\nIf the position is still active, would you be open to a short conversation?\n\nBest,\n${name}`;return {kind,blocked:false,subject,body};
  }
  function careerInsights(rows=[],candidate={},legacy={}){const a=trackerAnalytics(rows);const p=profileView(candidate,legacy);const insights=[];if(a.applied>=8&&a.interviewRate<15)insights.push('Interview conversion is low relative to application volume. Tighten role targeting and resume alignment before increasing volume.');if(a.interviews>=4&&a.offerRate<20)insights.push('Interview-to-offer conversion is low. Focus interview practice on role-specific depth, examples, and closing questions.');if(!p.skills.length)insights.push('Profile skills are incomplete, reducing match quality.');if(!p.targetRoles.length)insights.push('Target roles are not defined, making discovery and matching less precise.');if(!insights.length)insights.push('No obvious funnel bottleneck is visible yet. Keep application statuses current so conversion insights stay meaningful.');return {analytics:a,insights};}
  function evaluateAlert(rule={},job={},candidate={},legacy={}){const m=matchJob(job,candidate,legacy);const hay=clean([job.title,job.position?.title,job.company?.name,job.company,job.location?.display,job.location,job.description,job.position?.description].join(' ')).toLowerCase();const terms=arr(rule.keywords).map(x=>x.toLowerCase());const locs=arr(rule.locations).map(x=>x.toLowerCase());const termOk=!terms.length||terms.some(t=>hay.includes(t));const locOk=!locs.length||locs.some(t=>hay.includes(t));const threshold=Math.max(0,Math.min(100,Number(rule.minScore)||0));return {match:termOk&&locOk&&m.score>=threshold,score:m.score,reason:!termOk?'Keyword mismatch':!locOk?'Location mismatch':m.score<threshold?'Below score threshold':'Matched alert'};}
  function copilot(prompt='',ctx={}){const q=clean(prompt,1200).toLowerCase();const rows=ctx.tracked||[];const c=ctx.candidate||{};const legacy=ctx.profile||{};const p=profileView(c,legacy);const analytics=trackerAnalytics(rows);if(/resume|ats/.test(q)){const latest=(ctx.resumes||[])[0];const scan=atsScan(latest?.text||'',ctx.jobText||'');return `Resume guidance: ${latest?`latest variant scores ${scan.score}/100 (${scan.grade}).`:'create a role-specific resume variant first.'} ${scan.suggestions.slice(0,2).join(' ')}`;}if(/interview/.test(q))return `Interview funnel: ${analytics.interviews} interview-stage applications from ${analytics.applied} applied (${analytics.interviewRate}%). Prepare two measurable STAR stories and role-specific technical examples.`;if(/job|match|role/.test(q))return `Your profile currently targets ${p.targetRoles.join(', ')||'no explicit roles yet'} with ${p.skills.length} recorded skills. Prioritize jobs with strong overlap and verify missing requirements before applying.`;if(/application|tracker|funnel|offer/.test(q))return `Tracker: ${analytics.applied} applied, ${analytics.interviews} interview-stage, ${analytics.offers} offers, ${analytics.interviewRate}% interview conversion.`;return `I can ground guidance in your local Applyra profile, resumes, jobs and application tracker. Current profile: ${p.targetRoles[0]||p.headline||'target role not set'}, ${p.skills.length} skills, ${analytics.total} tracked opportunities.`;}
  root.ApplyraCareerSuite=Object.freeze({VERSION,PIPELINE,clean,arr,words,profileView,buildResume,atsScan,matchJob,normalizeTracked,trackerAnalytics,parseJobEmail,interviewPlan,outreachDraft,careerInsights,evaluateAlert,copilot});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.ApplyraCareerSuite;
})(typeof globalThis!=='undefined'?globalThis:this);
