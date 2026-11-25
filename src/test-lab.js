(function(){
  'use strict';
  const Portal=globalThis.NowCurryPortalAdapters;
  const QI=globalThis.NowCurryQuestionIntelligence;
  const Extractor=globalThis.NowCurryExtractorCore;
  const Message=globalThis.NowCurryMessage;
  const $=id=>document.getElementById(id);
  if(!Portal||!QI||!Extractor||!Message) throw new Error('Test Lab core modules did not load.');

  const SYNTHETIC_VAULT=Object.freeze({
    currentLocation:'Hyderabad',preferredLocation:'Bengaluru, Hyderabad',relocation:'Yes',relocationCities:'Bengaluru, Hyderabad',
    yearsExperience:'4',experienceFacts:'AI/ML Engineer = 4\nLangGraph = 3\nLLM = 3\nTime Series Forecasting = 2\nClassification = 3',
    noticePeriod:'30 days',lastWorkingDay:'',lastWorkingDayAnswer:'NA - synthetic fixture',availableFrom:'',currentCtc:'20 LPA',expectedCtc:'30 LPA',
    workAuthorization:'Authorized in India',remotePreference:'Hybrid',fiveDayWfo:'Yes',pfAllEmployments:'Yes',formerEmployers:'Example Corp',
    employerIds:'Example Corp = TEST123',capabilityFacts:'Designed and deployed ML/DL models = Yes\nGenerative AI = Yes',custom:[]
  });

  function json(value){return JSON.stringify(value,null,2);}
  function row(name,ok,detail){return {name,ok:Boolean(ok),detail:String(detail||'')};}

  function runProviderTests(){
    const cases=[
      ['Naukri','https://www.naukri.com/job-listings-test-1234567890','naukri'],
      ['LinkedIn','https://www.linkedin.com/jobs/view/1234567890','linkedin'],
      ['Greenhouse','https://boards.greenhouse.io/example/jobs/1','greenhouse'],
      ['Lever','https://jobs.lever.co/example/abc','lever'],
      ['Ashby','https://jobs.ashbyhq.com/example/abc','ashby'],
      ['Workday','https://example.wd5.myworkdayjobs.com/en-US/jobs/job/abc','workday'],
      ['iCIMS','https://careers-example.icims.com/jobs/1/job','icims'],
      ['SmartRecruiters','https://jobs.smartrecruiters.com/Example/1-job','smartrecruiters'],
      ['Rippling','https://ats.rippling.com/example/jobs/abc','rippling'],
      ['Generic HTTPS','https://careers.example.com/jobs/abc','generic']
    ];
    const results=cases.map(([name,url,expected])=>{const actual=Portal.detect(url).id;return row(`Portal: ${name}`,actual===expected,`expected ${expected}; got ${actual}`);});
    try{Portal.createIntake({url:'http://example.com/jobs/1',title:'Test'});results.push(row('Reject non-HTTPS intake',false,'HTTP URL was accepted'));}catch{results.push(row('Reject non-HTTPS intake',true,'HTTP URL rejected'));}
    try{Portal.createIntake({url:'https://user:pass@example.com/jobs/1',title:'Test'});results.push(row('Reject embedded URL credentials',false,'Credential-bearing URL was accepted'));}catch{results.push(row('Reject embedded URL credentials',true,'Credential-bearing URL rejected'));}
    return results;
  }

  function runQuestionTests(){
    const cases=[
      ['LangGraph years','How many years of experience do you have with LangGraph?',['1','2','3','4'],'3'],
      ['Relocation','Are you willing to relocate to Bengaluru?',['Yes','No'],'Yes'],
      ['Former employer','Are you a former Example Corp employee?',['Yes','No'],'Yes'],
      ['WFO','Are you comfortable with 5-day WFO in Hyderabad?',['Yes','No'],'Yes'],
      ['Security challenge','Enter the OTP sent to your mobile',[],null]
    ];
    return cases.map(([name,q,options,expected])=>{
      const result=QI.resolve(q,options,SYNTHETIC_VAULT,{now:'2026-09-19T00:00:00Z'});
      if(name==='Security challenge') return row(`Question: ${name}`,result.security===true&&!result.matched,'security challenge stayed unresolved');
      return row(`Question: ${name}`,result.matched&&result.answer===expected,`expected ${expected}; got ${result.answer||result.reason||'unresolved'}`);
    });
  }

  function runExtractorTest(){
    const jobs=Extractor.extractJobs(document,'https://www.naukri.com/jobs-in-india');
    const job=jobs.find(x=>x.id==='1234567890'||x.title==='Synthetic GenAI Engineer');
    return [row('Extractor: synthetic Naukri card',Boolean(job&&job.company==='Example Labs'&&job.location==='Hyderabad'&&job.skills.includes('Python')),job?`${job.title} · ${job.company} · ${job.location} · ${job.skills.join(', ')}`:'No job extracted')];
  }

  function runMessageTest(){
    const req=Message.createRequest({type:'TEST'},{requestId:'test-correlation'});
    const res=Message.withResponseMeta(req,{ok:true});
    let pass=false;try{Message.validateResponse(req,res);pass=true;}catch{}
    let mismatchRejected=false;try{Message.validateResponse(req,{ok:true,__nc:{requestId:'wrong'}});}catch{mismatchRejected=true;}
    return [row('Messaging: correlated response',pass,'matching request ID accepted'),row('Messaging: mismatch rejection',mismatchRejected,'mismatched request ID rejected')];
  }

  function renderResults(rows){
    const passed=rows.filter(x=>x.ok).length;
    $('summary').textContent=`${passed}/${rows.length} checks passed. Synthetic test only.`;
    $('results').innerHTML=rows.map(r=>`<div class="result"><span><strong>${escapeHtml(r.name)}</strong><br><small>${escapeHtml(r.detail)}</small></span><strong class="${r.ok?'pass':'fail'}">${r.ok?'PASS':'FAIL'}</strong></div>`).join('');
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function runAll(){renderResults([...runProviderTests(),...runQuestionTests(),...runExtractorTest(),...runMessageTest()]);}

  $('detectBtn').addEventListener('click',()=>{
    const raw=$('portalUrl').value;
    try{const adapter=Portal.detect(raw);const intake=Portal.createIntake({url:raw,title:'Synthetic test role'});$('portalOutput').textContent=json({adapter:{id:adapter.id,label:adapter.label,mode:adapter.mode,capabilities:adapter.capabilities},intake:{provider:intake.provider,intake:intake.intake,url:intake.url}});}catch(e){$('portalOutput').textContent=`ERROR: ${e.message}`;}
  });
  $('resolveBtn').addEventListener('click',()=>{
    const options=$('options').value.split(',').map(x=>x.trim()).filter(Boolean);
    $('questionOutput').textContent=json(QI.resolve($('question').value,options,SYNTHETIC_VAULT,{now:'2026-09-19T00:00:00Z'}));
  });
  $('extractBtn').addEventListener('click',()=>{$('extractOutput').textContent=json(Extractor.extractJobs(document,'https://www.naukri.com/jobs-in-india'));});
  $('runAllBtn').addEventListener('click',runAll);
  $('backBtn').addEventListener('click',()=>location.href=chrome.runtime.getURL('apply-engine.html'));
  $('testLabBackBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else if (document.referrer && document.referrer.startsWith(chrome.runtime.getURL(''))) {
      window.location.href = document.referrer;
    } else {
      try { window.close(); } catch {}
      setTimeout(() => { window.location.href = 'index.html'; }, 100);
    }
  });
  runAll();
})();
