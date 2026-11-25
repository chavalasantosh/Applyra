(function(root){
  'use strict';

  const VERSION='2.8.0-beta.2-integrated-platform';
  function clean(v,max=2000){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,max);}
  function key(v){return clean(v).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
  function list(v){return clean(v,4000).split(/[,;\n|]+/).map(key).filter(Boolean);}
  function yesNo(v){const k=key(v);if(/^(yes|y|true|1)$/.test(k))return'Yes';if(/^(no|n|false|0)$/.test(k))return'No';if(/^(na|n a|not applicable)$/.test(k))return'NA';return'';}
  function security(q){return /\b(?:otp|one[- ]time password|captcha|security code|verification code|verify your identity|password|passcode|pin|cvv)\b/i.test(clean(q));}

  const ALIASES=new Map([
    ['lang graph','langgraph'],['langgraph','langgraph'],['llms','llm'],['llm s','llm'],['large language models','llm'],['large language model','llm'],
    ['gen ai','generative ai'],['genai','generative ai'],['generative artificial intelligence','generative ai'],
    ['time series forcasting','time series forecasting'],['time series forecast','time series forecasting'],['ml','machine learning'],['ai ml','ai ml'],['ai ml engineer','ai ml engineer']
  ]);
  function subjectKey(v){let k=key(v).replace(/\bfundamentals?\b/g,'').replace(/\btechnology\b/g,'').replace(/\bskills?\b/g,'').replace(/\s+/g,' ').trim();return ALIASES.get(k)||k;}
  function parsePairs(raw){
    if(Array.isArray(raw)) return raw.map(x=>({name:clean(x?.name||x?.subject||x?.key),value:clean(x?.value??x?.years??x?.answer)})).filter(x=>x.name&&x.value);
    return String(raw||'').split(/\n+/).map(line=>{
      const m=line.match(/^\s*(.+?)\s*(?:=|:|\|)\s*(.+?)\s*$/);return m?{name:clean(m[1]),value:clean(m[2])}:null;
    }).filter(Boolean);
  }
  function similarity(a,b){
    a=subjectKey(a);b=subjectKey(b);if(!a||!b)return 0;if(a===b)return 1;if(a.includes(b)||b.includes(a))return .96;
    const A=new Set(a.split(' ')),B=new Set(b.split(' '));const common=[...A].filter(x=>B.has(x)).length;return common/Math.max(A.size,B.size,1);
  }
  function findPair(raw,subject,min=.68){
    let best=null;for(const row of parsePairs(raw)){const score=similarity(row.name,subject);if(score>=min&&(!best||score>best.score))best={...row,score};}return best;
  }
  function optionText(opt){return clean(opt?.value??opt?.text??opt?.label??opt,500);}
  function optionMatch(answer,options=[]){
    if(!Array.isArray(options)||!options.length)return{answer:clean(answer,1000),option:null};
    const a=key(answer);if(!a)return{answer:'',option:null};
    let found=options.find(o=>key(optionText(o))===a);
    if(!found) found=options.find(o=>{const k=key(optionText(o));return k&&(k.includes(a)||a.includes(k));});
    return found?{answer:optionText(found),option:found}:{answer:'',option:null};
  }
  function customMatch(custom,q){
    const qk=key(q);let partial=null;
    for(const row of Array.isArray(custom)?custom:[]){const rq=key(row?.question||row?.q||row?.prompt);const ans=clean(row?.answer??row?.a??row?.value,1000);if(!rq||!ans)continue;if(rq===qk)return{answer:ans,confidence:1,source:'custom-exact'};if(qk.includes(rq)||rq.includes(qk))partial=partial||{answer:ans,confidence:.94,source:'custom-partial'};}
    return partial;
  }
  function extractExperienceSubject(q){
    const t=clean(q).replace(/[?]+$/,'');
    const patterns=[
      /how many years?(?: of)? experience do you have (?:in|with|as)\s+(.+)$/i,
      /how many years? of experience do you have (?:in|with|as)\s+(.+)$/i,
      /years? of experience (?:in|with|as)\s+(.+)$/i,
      /experience as an?\s+(.+)$/i
    ];
    for(const re of patterns){const m=t.match(re);if(m)return clean(m[1],240);}
    return'';
  }
  function cityTokens(v){return list(v).map(x=>x.replace(/\b(india|india experience.*)$/,'').trim()).filter(Boolean);}
  function extractCity(q){
    const t=clean(q);
    const patterns=[/residing in\s+([A-Za-z][A-Za-z .-]{1,50}?)(?:\s+or\b|\?|$)/i,/relocate to\s+([A-Za-z][A-Za-z .-]{1,50}?)(?:\?|$)/i,/location is\s+([A-Za-z][A-Za-z .-]{1,50}?)(?:\.|,|\?|\s+are\b)/i,/work (?:from|in)\s+([A-Za-z][A-Za-z .-]{1,50}?)(?:\?|$)/i];
    for(const re of patterns){const m=t.match(re);if(m)return key(m[1]);}return'';
  }
  function knownCities(vault){return [...new Set([...cityTokens(vault.currentLocation),...cityTokens(vault.preferredLocation),...cityTokens(vault.relocationCities)])];}
  function cityAllowed(city,vault){if(!city)return null;const c=key(city);if(cityTokens(vault.currentLocation).some(x=>x.includes(c)||c.includes(x)))return true;if(cityTokens(vault.relocationCities).some(x=>x.includes(c)||c.includes(x)))return true;if(cityTokens(vault.preferredLocation).some(x=>x.includes(c)||c.includes(x)))return true;const rel=yesNo(vault.relocation);if(rel==='Yes')return true;if(rel==='No')return false;return null;}
  function chooseCityOption(options,vault){
    const priority=[...cityTokens(vault.currentLocation),...cityTokens(vault.preferredLocation),...cityTokens(vault.relocationCities)];
    for(const wanted of priority){const found=(options||[]).find(o=>{const k=key(optionText(o));return k&&k!=='skip this question'&&(k===wanted||k.includes(wanted)||wanted.includes(k));});if(found)return{answer:optionText(found),option:found,source:'vault:location-choice',confidence:.99};}
    return null;
  }
  function extractEmployer(q){
    const t=clean(q);
    let m=t.match(/(?:ex|former)[- ]?([A-Za-z0-9&. _-]{2,80}?)\s+employee/i);if(m)return clean(m[1]);
    m=t.match(/(?:worked|employed)\s+(?:at|with)\s+([A-Za-z0-9&. _-]{2,80}?)(?:\?|,|$)/i);return m?clean(m[1]):'';
  }
  function formerEmployers(vault){return list(vault.formerEmployers);}
  function employerId(vault,company){const row=findPair(vault.employerIds,company,.72);return row?.value||'';}
  function parseDate(v){const raw=clean(v,120);if(!raw)return null;const d=new Date(raw);return Number.isFinite(d.getTime())?d:null;}
  function dateFromQuestion(q){const m=clean(q).match(/\b(\d{1,2}[-\s\/](?:[A-Za-z]{3,9}|\d{1,2})[-\s\/]\d{4})\b/);return m?parseDate(m[1]):null;}
  function earliestAvailability(vault,nowDate=new Date()){
    const explicit=parseDate(vault.availableFrom);if(explicit)return{date:explicit,source:'vault:availableFrom'};
    const lwd=parseDate(vault.lastWorkingDay);if(lwd){const d=new Date(lwd);d.setDate(d.getDate()+1);return{date:d,source:'vault:lastWorkingDay'};}
    const np=clean(vault.noticePeriod);if(/negotiab/i.test(np))return null;const m=np.match(/(\d{1,3})\s*(?:days?|d)\b/i);if(m){const d=new Date(nowDate);d.setHours(0,0,0,0);d.setDate(d.getDate()+Number(m[1]));return{date:d,source:'vault:noticePeriod'};}return null;
  }
  function capabilityMatch(raw,q){
    const qk=` ${key(q)} `;
    let best=null;
    for(const row of parsePairs(raw)){
      const rk=key(row.name);
      const exactPhrase=rk&&qk.includes(` ${rk} `);
      const score=exactPhrase?.995:similarity(row.name,q);
      if(score>=.5&&(!best||score>best.score)){const yn=yesNo(row.value);if(yn)best={answer:yn,score,source:'vault:capabilityFacts'};}
    }
    return best;
  }
  function booleanFromExperience(q,vault){
    if(!/\b(?:prior experience|experience with|do you have experience|have you worked with)\b/i.test(q))return null;
    const qk=subjectKey(q);let best=null;for(const row of parsePairs(vault.experienceFacts)){const score=similarity(row.name,qk);const n=Number.parseFloat(row.value);if(Number.isFinite(n)&&n>0&&score>=.45&&(!best||score>best.score))best={answer:'Yes',score,source:'vault:experienceFacts'};}return best;
  }

  const BASIC=[
    {key:'currentLocation',patterns:[/current location/,/where are you currently located/,/present location/]},
    {key:'preferredLocation',patterns:[/preferred location/,/preferred city/,/preferred work location/,/location preference/]},
    {key:'yearsExperience',patterns:[/total experience/,/overall experience/]},
    {key:'noticePeriod',patterns:[/notice period/,/joining time/,/days? to join/]},
    {key:'currentCtc',patterns:[/current ctc/,/current salary/,/present ctc/,/present salary/]},
    {key:'expectedCtc',patterns:[/expected ctc/,/expected salary/,/salary expectation/,/expected compensation/]},
    {key:'workAuthorization',patterns:[/work authori[sz]ation/,/authori[sz]ed to work/]},
    {key:'remotePreference',patterns:[/remote work/,/work from home/,/hybrid work/,/work mode/]},
    {key:'linkedinUrl',patterns:[/linkedin/]},{key:'portfolioUrl',patterns:[/portfolio/]},{key:'githubUrl',patterns:[/github/]},
    {key:'reasonForChange',patterns:[/reason for change/,/why.*change/,/reason.*leaving/]}
  ];

  function finalize(answer,options,meta={}){const selected=optionMatch(answer,options);if(options?.length&&!selected.answer)return{matched:false,reason:'The approved answer does not match an available option.',...meta};return{matched:true,answer:selected.answer||clean(answer,1000),option:selected.option,confidence:meta.confidence??.97,source:meta.source||'vault',field:meta.field,intent:meta.intent};}

  function resolve(question='',options=[],vault={},context={}){
    const q=clean(question,1500);if(!q)return{matched:false,reason:'No question text was available.'};
    if(security(q))return{matched:false,security:true,reason:'Security challenge must stay user-controlled.'};
    const custom=customMatch(vault.custom,q);if(custom)return finalize(custom.answer,options,{...custom,intent:'custom'});

    const expSubject=extractExperienceSubject(q);
    if(expSubject){const row=findPair(vault.experienceFacts,expSubject,.66);if(row)return finalize(row.value,options,{confidence:Math.max(.95,row.score),source:`vault:experience:${row.name}`,intent:'experience-years'});return{matched:false,intent:'experience-years',reason:`No approved experience fact matched “${clean(expSubject,120)}”.`};}

    const company=extractEmployer(q);
    if(company){const former=formerEmployers(vault);if(!former.length)return{matched:false,intent:'former-employer',reason:'Former-employer history is empty.'};const ck=key(company);const matched=former.some(x=>x===ck||x.includes(ck)||ck.includes(x));if(matched){if(/employee\s*id|employee id|emp id/i.test(q)){const id=employerId(vault,company);if(!id)return{matched:false,intent:'former-employer',reason:`${company} is in employment history, but no employee ID is stored.`};return finalize(id,options,{confidence:.99,source:'vault:employer-id',intent:'former-employer'});}return finalize('Yes',options,{confidence:.99,source:'vault:formerEmployers',intent:'former-employer'});}const noAnswer=/mention\s+na|if\s+no.*\bna\b/i.test(q)?'NA':'No';return finalize(noAnswer,options,{confidence:.98,source:'vault:formerEmployers',intent:'former-employer'});}

    if(/pf.*(?:all|every).*employ|provident fund.*(?:all|every).*employ/i.test(q)){const a=yesNo(vault.pfAllEmployments);return a?finalize(a,options,{confidence:.99,source:'vault:pfAllEmployments',intent:'pf-history'}):{matched:false,intent:'pf-history',reason:'PF-for-all-employments answer is not configured.'};}

    if(/last working day|lwd\b/i.test(q)){const a=clean(vault.lastWorkingDayAnswer||vault.lastWorkingDay,500);return a?finalize(a,options,{confidence:.99,source:'vault:lastWorkingDay',intent:'last-working-day'}):{matched:false,intent:'last-working-day',reason:'Last working day answer is not configured.'};}

    if(/join on or before|can you join by|available (?:on|before|by)/i.test(q)){const target=dateFromQuestion(q);const avail=earliestAvailability(vault,context.now?new Date(context.now):new Date());if(!target)return{matched:false,intent:'join-by-date',reason:'Could not parse the requested joining date.'};if(!avail)return{matched:false,intent:'join-by-date',reason:'Available-from date is uncertain. Set Available from or a non-negotiable notice period.'};return finalize(avail.date<=target?'Yes':'No',options,{confidence:.99,source:avail.source,intent:'join-by-date'});}

    if(/5[- ]?day.*(?:wfo|work from office|office)|comfortable.*(?:wfo|work from office)/i.test(q)){const pref=yesNo(vault.fiveDayWfo);if(!pref)return{matched:false,intent:'five-day-wfo',reason:'5-day WFO preference is not configured.'};const city=extractCity(q);if(pref==='Yes'&&city){const allowed=cityAllowed(city,vault);if(allowed===false)return finalize('No',options,{confidence:.98,source:'vault:fiveDayWfo+location',intent:'five-day-wfo'});if(allowed===null)return{matched:false,intent:'five-day-wfo',reason:`5-day WFO is allowed, but ${city} is not in the approved location list.`};}return finalize(pref,options,{confidence:.99,source:'vault:fiveDayWfo',intent:'five-day-wfo'});}

    if(/select.*city|which city|city.*(?:residing|relocate)/i.test(q)&&options?.length){const pick=chooseCityOption(options,vault);return pick?{matched:true,...pick,intent:'city-choice'}:{matched:false,intent:'city-choice',reason:'None of the available cities match current/preferred/relocation locations.'};}

    if(/residing in|willing to relocate|relocate to/i.test(q)){const city=extractCity(q);if(city){const allowed=cityAllowed(city,vault);if(allowed!==null)return finalize(allowed?'Yes':'No',options,{confidence:.98,source:'vault:location-policy',intent:'relocation-city'});}const r=yesNo(vault.relocation);if(r)return finalize(r,options,{confidence:.97,source:'vault:relocation',intent:'relocation'});}

    const cap=capabilityMatch(vault.capabilityFacts,q);if(cap)return finalize(cap.answer,options,{confidence:Math.max(.94,cap.score),source:cap.source,intent:'capability'});
    const byExp=booleanFromExperience(q,vault);if(byExp)return finalize(byExp.answer,options,{confidence:Math.max(.94,byExp.score),source:byExp.source,intent:'experience-capability'});

    const qk=key(q);
    for(const rule of BASIC){if(!rule.patterns.some(re=>re.test(qk)))continue;const raw=clean(vault?.[rule.key],1000);if(!raw)return{matched:false,field:rule.key,reason:`Answer Vault field ${rule.key} is empty.`};return finalize(raw,options,{confidence:.97,source:`vault:${rule.key}`,field:rule.key,intent:'basic'});}
    return{matched:false,reason:'No safe Candidate Memory mapping matched this question.'};
  }

  root.NowCurryQuestionIntelligence={VERSION,clean,key,list,yesNo,subjectKey,parsePairs,similarity,findPair,optionMatch,extractExperienceSubject,extractEmployer,extractCity,earliestAvailability,resolve};
})(typeof globalThis!=='undefined'?globalThis:this);
