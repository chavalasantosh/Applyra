(function(root){
  'use strict';

  const VERSION='1.0.0';
  const ADAPTERS=Object.freeze({
    naukri:Object.freeze({id:'naukri',label:'Naukri',hosts:['naukri.com'],mode:'native-browser-session',capabilities:{intake:true,open:true,extract:true,sessionCheck:true,autoApply:true,autofillKnownQuestions:true,automaticFinalSubmit:false}}),
    linkedin:Object.freeze({id:'linkedin',label:'LinkedIn',hosts:['linkedin.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    greenhouse:Object.freeze({id:'greenhouse',label:'Greenhouse',hosts:['greenhouse.io'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    lever:Object.freeze({id:'lever',label:'Lever',hosts:['lever.co'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    ashby:Object.freeze({id:'ashby',label:'Ashby',hosts:['ashbyhq.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    workday:Object.freeze({id:'workday',label:'Workday',hosts:['myworkdayjobs.com','workday.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    icims:Object.freeze({id:'icims',label:'iCIMS',hosts:['icims.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    smartrecruiters:Object.freeze({id:'smartrecruiters',label:'SmartRecruiters',hosts:['smartrecruiters.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    rippling:Object.freeze({id:'rippling',label:'Rippling',hosts:['rippling.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    aijobs:Object.freeze({id:'aijobs',label:'AI Jobs',hosts:['aijobs.ai'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    foorilla:Object.freeze({id:'foorilla',label:'Foorilla',hosts:['foorilla.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    jobsinai:Object.freeze({id:'jobsinai',label:'Jobs in AI',hosts:['jobsinai.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    jobbordai:Object.freeze({id:'jobbordai',label:'Jobbord AI',hosts:['jobbordai.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    builtin:Object.freeze({id:'builtin',label:'BuiltIn Tech',hosts:['builtin.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    jobtensor:Object.freeze({id:'jobtensor',label:'Jobtensor',hosts:['jobtensor.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    wellfound:Object.freeze({id:'wellfound',label:'Wellfound (AngelList)',hosts:['wellfound.com','angel.co'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    ycombinator:Object.freeze({id:'ycombinator',label:'Y Combinator Jobs',hosts:['ycombinator.com','workatastartup.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    welcometothejungle:Object.freeze({id:'welcometothejungle',label:'Welcome to the Jungle',hosts:['welcometothejungle.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    hiringcafe:Object.freeze({id:'hiringcafe',label:'HiringCafe',hosts:['hiringcafe.com','hiring.cafe'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    levelsfyi:Object.freeze({id:'levelsfyi',label:'Levels.fyi',hosts:['levels.fyi'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    dice:Object.freeze({id:'dice',label:'Dice Tech',hosts:['dice.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    remotive:Object.freeze({id:'remotive',label:'Remotive',hosts:['remotive.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    weworkremotely:Object.freeze({id:'weworkremotely',label:'We Work Remotely',hosts:['weworkremotely.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    kalibrr:Object.freeze({id:'kalibrr',label:'Kalibrr',hosts:['kalibrr.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    openjobshq:Object.freeze({id:'openjobshq',label:'OpenJobs HQ',hosts:['openjobshq.com'],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:true,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}}),
    generic:Object.freeze({id:'generic',label:'External job site',hosts:[],mode:'user-assisted-intake',capabilities:{intake:true,open:true,extract:false,sessionCheck:false,autoApply:false,autofillKnownQuestions:false,automaticFinalSubmit:false}})
  });

  function text(value,max=3000){return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);}
  function parseHttps(value){
    let url; try{url=new URL(text(value,4000));}catch{throw new Error('Enter a valid job URL.');}
    if(url.protocol!=='https:') throw new Error('Only HTTPS job URLs are accepted.');
    if(url.username||url.password) throw new Error('Job URLs containing embedded credentials are not accepted.');
    url.hash=''; return url;
  }
  function hostMatches(host,base){return host===base||host.endsWith('.'+base);}
  function detect(value){
    let url; try{url=parseHttps(typeof value==='string'?value:value?.url||value?.applyUrl||'');}catch{return ADAPTERS.generic;}
    const host=url.hostname.toLowerCase();
    for(const adapter of Object.values(ADAPTERS)){
      if(adapter.id==='generic') continue;
      if(adapter.hosts.some(base=>hostMatches(host,base))) return adapter;
    }
    return ADAPTERS.generic;
  }
  function byId(id){return ADAPTERS[text(id,60).toLowerCase()]||ADAPTERS.generic;}
  function createIntake(input={}){
    const url=parseHttps(input.url||input.applyUrl||'');
    const adapter=detect(url.href);
    const title=text(input.title,240);
    if(!title) throw new Error('Job title is required.');
    const at=new Date().toISOString();
    return {
      id:`${adapter.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      source:'Applyra',
      sourceLabel:text(input.sourceLabel,100)||'Applyra Verified Intake',
      provider:adapter.id,
      candidateId:text(input.candidateId,120),
      providerMode:adapter.mode,
      url:url.href,
      applyUrl:url.href,
      title,
      company:text(input.company,180),
      location:text(input.location,180),
      description:text(input.description,12000),
      status:'Unreviewed',
      saved:true,
      discoveredAt:at,
      updatedAt:at,
      intake:'user-assisted'
    };
  }
  function publicSummary(){
    return Object.values(ADAPTERS).map(a=>({id:a.id,label:a.label,mode:a.mode,capabilities:{...a.capabilities}}));
  }

  root.NowCurryPortalAdapters=Object.freeze({VERSION,ADAPTERS,detect,byId,createIntake,publicSummary});
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryPortalAdapters;
})(typeof globalThis!=='undefined'?globalThis:this);
