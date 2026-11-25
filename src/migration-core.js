(function(root){
  'use strict';

  const VERSION='1.3.0';
  function now(){return new Date().toISOString();}
  function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
  function row(from,to,label){return {from,to,label,at:now()};}
  function appendHistory(history,item){return [...(Array.isArray(history)?history:[]),item].slice(-50);}

  function migrate10to11(snapshot={},deps={}){
    const out={};
    const Team=deps.Team;
    const Business=deps.Business;
    let workspace=snapshot.teamWorkspace;
    if(workspace&&Team?.normalizeWorkspace){
      workspace=Team.normalizeWorkspace(workspace);
      workspace={...workspace,schemaVersion:11,updatedAt:workspace.updatedAt||now()};
      out.teamWorkspace=workspace;
      const active=Team.activeCandidate?.(workspace);
      if(active){
        out.activeCandidateProfile=active.profile||{};
        out.applyEngineAnswerVault=active.memory||{};
      }
    }

    if(Business?.normalizeAccount){
      const account=Business.normalizeAccount(snapshot.businessAccount||{});
      out.businessAccount={
        ...account,
        plan:'beta',
        subscriptionStatus:'beta',
        billingMode:'not-connected',
        entitlementAuthority:'local-beta',
        paidEntitlementVerified:false,
        updatedAt:now()
      };
    }

    out.migrationHistory=appendHistory(snapshot.migrationHistory,row(10,11,'Reliability Core: centralized schema, candidate snapshot sync, removed local paid-plan simulation'));
    out.schemaVersion=11;
    return out;
  }


  function migrate11to12(snapshot={}){
    const out={};
    out.cloudMigration={
      status:'not-started',
      lastPreviewAt:'',
      lastPushAt:'',
      lastVerifiedAt:'',
      lastError:'',
      remoteSchema:'applyra-v1',
      localSourceRetained:true,
      updatedAt:now()
    };
    out.onboardingState={completed:false,completedAt:'',updatedAt:now()};
    out.dataControlAudit=Array.isArray(snapshot.dataControlAudit)?snapshot.dataControlAudit.slice(-100):[];
    out.migrationHistory=appendHistory(snapshot.migrationHistory,row(11,12,'Applyra Production Foundation: cloud migration state, onboarding state, and privacy-control audit'));
    out.schemaVersion=12;
    return out;
  }

  function migrate12to13(snapshot={}){
    const base=snapshot.careerSuite&&typeof snapshot.careerSuite==='object'?snapshot.careerSuite:{};
    const arr=k=>Array.isArray(base[k])?base[k]:[];
    return {careerSuite:{resumes:arr('resumes'),tracked:arr('tracked'),alerts:arr('alerts'),emailImports:arr('emailImports'),interviews:arr('interviews'),outreach:arr('outreach'),updatedAt:now()},migrationHistory:appendHistory(snapshot.migrationHistory,row(12,13,'Career Suite: resumes, ATS, matching, tracker, interview, outreach, intelligence and alerts')),schemaVersion:13};
  }


  function migrate13to14(snapshot={}){
    return {researchEngine:{status:'not-verified',lastCheckedAt:'',lastUsedAt:'',lastError:'',modules:{},updatedAt:now()},migrationHistory:appendHistory(snapshot.migrationHistory,row(13,14,'Research Bridge: authenticated SanTOK + Somaya + Threshold Onset service state')),schemaVersion:14};
  }

  function plan(snapshot={},target=14){
    const start=Math.max(0,number(snapshot.schemaVersion,0));
    const steps=[];
    let current=start;
    // Pre-v10 builds were already normalized by the existing install repair path.
    if(current<10){steps.push({from:current,to:10,label:'Legacy install normalization baseline'});current=10;}
    if(current<11&&target>=11){steps.push({from:10,to:11,label:'Reliability Core migration'});current=11;}
    if(current<12&&target>=12){steps.push({from:11,to:12,label:'Applyra Production Foundation migration'});current=12;}
    if(current<13&&target>=13){steps.push({from:12,to:13,label:'Applyra Career Suite migration'});current=13;}
    if(current<14&&target>=14){steps.push({from:13,to:14,label:'Applyra Research Bridge migration'});current=14;}
    return {from:start,to:current,target,steps,pending:current<target};
  }

  async function migrate(storageApi,{target=14,Team=null,Business=null}={}){
    if(!storageApi?.get||!storageApi?.set) throw new Error('Chrome storage API is required for migrations.');
    const snapshot=await storageApi.get(null);
    const migrationPlan=plan(snapshot,target);
    let current=Math.max(0,number(snapshot.schemaVersion,0));
    let working={...snapshot};
    const applied=[];

    if(current<10){
      // The install/startup normalization path has already repaired legacy shapes.
      const item=row(current,10,'Legacy install normalization baseline');
      working.migrationHistory=appendHistory(working.migrationHistory,item);
      working.schemaVersion=10;
      await storageApi.set({migrationHistory:working.migrationHistory,schemaVersion:10});
      applied.push(item); current=10;
    }
    if(current<11&&target>=11){
      const patch=migrate10to11(working,{Team,Business});
      await storageApi.set(patch);
      working={...working,...patch};
      applied.push(working.migrationHistory?.[working.migrationHistory.length-1]||row(10,11,'Reliability Core migration'));
      current=11;
    }
    if(current<12&&target>=12){
      const patch=migrate11to12(working);
      await storageApi.set(patch);
      working={...working,...patch};
      applied.push(working.migrationHistory?.[working.migrationHistory.length-1]||row(11,12,'Applyra Production Foundation migration'));
      current=12;
    }
    if(current<13&&target>=13){const patch=migrate12to13(working);await storageApi.set(patch);working={...working,...patch};applied.push(working.migrationHistory?.[working.migrationHistory.length-1]||row(12,13,'Applyra Career Suite migration'));current=13;}
    if(current<14&&target>=14){const patch=migrate13to14(working);await storageApi.set(patch);working={...working,...patch};applied.push(working.migrationHistory?.[working.migrationHistory.length-1]||row(13,14,'Applyra Research Bridge migration'));current=14;}
    return {ok:true,version:VERSION,from:migrationPlan.from,to:current,target,applied,pending:current<target,history:working.migrationHistory||[]};
  }

  root.NowCurryMigration=Object.freeze({VERSION,plan,migrate,migrate10to11,migrate11to12,migrate12to13,migrate13to14});
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryMigration;
})(typeof globalThis!=='undefined'?globalThis:this);
