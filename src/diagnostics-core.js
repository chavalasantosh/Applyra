(function(root){
  'use strict';
  const VERSION='1.1.0';
  function text(v,max=300){return String(v??'').replace(/\s+/g,' ').trim().slice(0,max);}
  function health(ok,detail=''){return {status:ok?'healthy':'attention',ok:Boolean(ok),detail:text(detail,500)};}
  function build(input={}){
    const checks={
      serviceWorker:health(true,'Background service worker responded.'),
      storageSchema:health(Number(input.schemaVersion)===Number(input.expectedSchema),`Schema ${input.schemaVersion||0} / expected ${input.expectedSchema||0}`),
      storageIsolation:health(Boolean(input.storageAccess?.local),input.storageAccess?.local?'Local storage restricted to trusted extension contexts.':'Storage access-level lock unavailable.'),
      authentication: input.auth?.configured ? health(Boolean(input.auth?.authenticated),input.auth?.authenticated?`Signed in${input.auth?.providerLabel?` with ${input.auth.providerLabel}`:''}.`:'Authentication configured but no active session.') : {status:'not-configured',ok:true,detail:'Authentication backend not configured.'},
      naukri: input.naukriConnected ? health(true,'Naukri browser session detected.') : {status:'not-connected',ok:true,detail:text(input.naukriDetail||'Naukri session not currently connected.',500)},
      watchdog:health(Boolean(input.watchdogAlarm),'Automation watchdog alarm is registered.'),
      profileBoostSchedule: input.profileBoostEnabled ? health(Boolean(input.profileBoostAlarm),'Profile Boost enabled; schedule alarm is registered.') : {status:'off',ok:true,detail:'Profile Boost schedule is off.'},
      messageProtocol:health(Number(input.messageProtocolVersion)>=1,`Protocol v${input.messageProtocolVersion||0}`),
      candidate: input.activeCandidateConfigured ? health(true,'Active candidate is configured.') : {status:'not-configured',ok:true,detail:'No active candidate configured.'},
      cloudMigration: input.auth?.configured ? (input.cloudMigration?.status==='verified' ? health(true,'Authenticated cloud workspace copy is verified.') : {status:text(input.cloudMigration?.status||'not-started',80),ok:false,detail:text(input.cloudMigration?.lastError||'Cloud workspace has not been verified yet.',500)}) : {status:'not-configured',ok:true,detail:'Cloud verification is unavailable until authentication is configured.'}
    };
    const attention=Object.values(checks).filter(x=>!x.ok).length;
    return {
      version:VERSION,
      generatedAt:new Date().toISOString(),
      extensionVersion:text(input.extensionVersion,80),
      schemaVersion:Number(input.schemaVersion)||0,
      expectedSchema:Number(input.expectedSchema)||0,
      messageProtocolVersion:Number(input.messageProtocolVersion)||0,
      checks,
      summary:{attention,total:Object.keys(checks).length,healthy:Object.values(checks).filter(x=>x.ok).length},
      counts:{jobs:Number(input.counts?.jobs)||0,applySessions:Number(input.counts?.applySessions)||0,activity:Number(input.counts?.activity)||0,candidates:Number(input.counts?.candidates)||0},
      migrations:Array.isArray(input.migrations)?input.migrations.slice(-10):[],
      providers:Array.isArray(input.providers)?input.providers:[]
    };
  }
  root.NowCurryDiagnostics=Object.freeze({VERSION,health,build});
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryDiagnostics;
})(typeof globalThis!=='undefined'?globalThis:this);
