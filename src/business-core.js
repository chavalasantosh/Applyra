(function(root){
  'use strict';

  const VERSION='2.8.0-beta.8';
  const USAGE_EVENT='auto-apply-confirmed';
  const BETA_PLAN=Object.freeze({id:'beta',name:'Founding Beta',priceInr:0,monthlyAutoApply:300,profileBoost:true,answerVault:true,multiSource:true,analytics:true,label:'Founding Beta'});
  const PLANS=Object.freeze({beta:BETA_PLAN});
  const PLAN_ORDER=Object.freeze(['beta']);

  function clean(value,max=1000){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);}
  function now(){return new Date().toISOString();}
  function plan(){return BETA_PLAN;}
  function cycleKey(value=new Date()){
    const d=value instanceof Date?value:new Date(value);
    if(Number.isNaN(d.getTime())) return new Date().toISOString().slice(0,7);
    return d.toISOString().slice(0,7);
  }
  function newLocalId(){return `nc-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
  function createLocalAccount(input={}){
    const created=clean(input.createdAt,40)||now();
    return {
      schemaVersion:2,
      localAccountId:clean(input.localAccountId,120)||newLocalId(),
      displayName:clean(input.displayName,120),
      email:clean(input.email,200),
      plan:'beta',
      subscriptionStatus:'beta',
      billingMode:'not-connected',
      entitlementAuthority:'local-beta',
      paidEntitlementVerified:false,
      createdAt:created,
      updatedAt:clean(input.updatedAt,40)||created
    };
  }
  function normalizeAccount(input={}){return createLocalAccount({...input,localAccountId:clean(input.localAccountId,120)||newLocalId(),createdAt:clean(input.createdAt,40)||now(),updatedAt:clean(input.updatedAt,40)||now()});}
  function normalizeLedger(input=[]){
    const rows=Array.isArray(input)?input:[]; const seen=new Set(); const out=[];
    for(const row of rows){
      if(!row||typeof row!=='object') continue;
      const event=clean(row.event,80),externalId=clean(row.externalId,160),at=clean(row.at,40)||now();
      if(!event||!externalId) continue;
      const key=`${event}:${externalId}`; if(seen.has(key)) continue; seen.add(key);
      out.push({id:clean(row.id,160)||key,event,externalId,quantity:Math.max(1,Number(row.quantity)||1),source:clean(row.source,80),runId:clean(row.runId,160),at,cycle:clean(row.cycle,20)||cycleKey(at)});
    }
    return out.sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,5000);
  }
  function usageSummary(ledger=[],_account={},cycle=cycleKey()){
    const rows=normalizeLedger(ledger);
    const used=rows.filter(x=>x.event===USAGE_EVENT&&x.cycle===cycle).reduce((n,x)=>n+(Number(x.quantity)||0),0);
    const cap=BETA_PLAN.monthlyAutoApply;
    return {cycle,plan:BETA_PLAN,used,cap,remaining:Math.max(0,cap-used),percent:cap?Math.min(100,Math.round((used/cap)*100)):0};
  }
  function isServerVerified(){return false;}
  function effectivePlan(){return BETA_PLAN;}
  function entitlement(_account={},ledger=[],feature,cycle=cycleKey()){
    if(feature==='autoApply'){
      const usage=usageSummary(ledger,{},cycle);
      return {allowed:usage.remaining>0,reason:usage.remaining>0?'':'Monthly Founding Beta Auto Apply allowance reached.',requestedPlan:BETA_PLAN,plan:BETA_PLAN,...usage};
    }
    if(feature==='profileBoost') return {allowed:true,reason:'',requestedPlan:BETA_PLAN,plan:BETA_PLAN};
    if(feature==='answerVault') return {allowed:true,reason:'',requestedPlan:BETA_PLAN,plan:BETA_PLAN};
    if(feature==='analytics') return {allowed:true,reason:'',requestedPlan:BETA_PLAN,plan:BETA_PLAN};
    return {allowed:true,reason:'',requestedPlan:BETA_PLAN,plan:BETA_PLAN};
  }
  function effectiveAutoApplyAllowance({account={},ledger=[],dailyCap=30,todayApplied=0,batchSize=1,cycle=cycleKey()}={}){
    const ent=entitlement(account,ledger,'autoApply',cycle);
    const dailyRemaining=Math.max(0,Math.max(1,Number(dailyCap)||30)-Math.max(0,Number(todayApplied)||0));
    const requested=Math.max(1,Math.min(5,Number(batchSize)||1));
    const available=Math.max(0,Math.min(dailyRemaining,ent.remaining||0));
    return {...ent,dailyRemaining,requested,available,allowed:ent.allowed&&available>0,runBatchSize:Math.max(0,Math.min(requested,available)),reason:!ent.allowed?ent.reason:available<=0?'Daily application cap reached.':''};
  }
  function addUsage(ledger=[],items=[],meta={}){
    const existing=normalizeLedger(ledger); const seen=new Set(existing.map(x=>`${x.event}:${x.externalId}`)); const added=[]; const at=clean(meta.at,40)||now();
    for(const raw of Array.isArray(items)?items:[]){
      const externalId=clean(raw?.externalId||raw?.jobId||raw,160); if(!externalId) continue;
      const key=`${USAGE_EVENT}:${externalId}`; if(seen.has(key)) continue; seen.add(key);
      added.push({id:key,event:USAGE_EVENT,externalId,quantity:1,source:clean(meta.source,80)||'naukri',runId:clean(meta.runId,160),at,cycle:cycleKey(at)});
    }
    return {ledger:normalizeLedger([...added,...existing]),added};
  }
  function onboarding({vaultPercent=0,safety={},autoApply={},naukriConnected=false}={}){
    return [
      {id:'naukri',label:'Naukri session checked',done:Boolean(naukriConnected)},
      {id:'vault',label:'Answer Vault at least 70% complete',done:Number(vaultPercent)>=70},
      {id:'review',label:'Final-review protection enabled',done:safety?.requireFinalReview!==false},
      {id:'limits',label:'Daily application cap configured',done:Number(safety?.dailyCap)>0},
      {id:'preview',label:'At least one Auto Apply preview completed',done:Boolean(autoApply?.lastPreviewAt)}
    ];
  }
  function readiness(input={}){const items=onboarding(input);const done=items.filter(x=>x.done).length;return {items,done,total:items.length,percent:Math.round((done/items.length)*100)};}

  root.NowCurryBusinessCore={VERSION,USAGE_EVENT,PLAN_ORDER,PLANS,clean,plan,cycleKey,createLocalAccount,normalizeAccount,normalizeLedger,usageSummary,isServerVerified,effectivePlan,entitlement,effectiveAutoApplyAllowance,addUsage,onboarding,readiness};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryBusinessCore;
})(typeof globalThis!=='undefined'?globalThis:this);
