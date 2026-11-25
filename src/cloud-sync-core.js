(function(root){
  'use strict';

  const VERSION='1.1.0';
  const REMOTE_SCHEMA='applyra-v1';
  const TABLES=Object.freeze({
    snapshots:'applyra_workspace_snapshots',
    candidates:'applyra_candidates',
    applications:'applyra_applications',
    settings:'applyra_settings',
    audit:'applyra_audit_events'
  });

  function clean(value,max=3000){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);}
  function endpoint(config,table,query=''){
    const base=String(config?.supabaseUrl||'').replace(/\/$/,'');
    if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(base)) throw new Error('A valid Supabase project URL is required.');
    if(!Object.values(TABLES).includes(table)) throw new Error('Unknown Applyra cloud table.');
    return `${base}/rest/v1/${table}${query||''}`;
  }
  function rpcEndpoint(config,name){
    const base=String(config?.supabaseUrl||'').replace(/\/$/,'');
    if(!/^https:\/\/[^/]+\.supabase\.co$/i.test(base)) throw new Error('A valid Supabase project URL is required.');
    if(!['applyra_replace_workspace','applyra_delete_workspace_data','applyra_production_preflight'].includes(String(name||''))) throw new Error('Unknown Applyra cloud RPC.');
    return `${base}/rest/v1/rpc/${name}`;
  }
  function headers(config,accessToken,extra={}){
    const key=clean(config?.publishableKey,2500);
    const token=clean(accessToken,5000);
    if(!key||!token) throw new Error('A verified Applyra session is required for cloud data operations.');
    return {'apikey':key,'Authorization':`Bearer ${token}`,'Content-Type':'application/json','Accept':'application/json',...extra};
  }
  function candidateRows(snapshot,userId){
    const w=snapshot?.teamWorkspace||{};
    return (Array.isArray(w.candidates)?w.candidates:[]).map(c=>({
      user_id:userId,
      local_id:clean(c.id,180),
      name:clean(c.name||c.profile?.name,300),
      status:clean(c.status||'active',60),
      profile:c.profile&&typeof c.profile==='object'?c.profile:{},
      memory:c.memory&&typeof c.memory==='object'?c.memory:{},
      updated_at:new Date().toISOString()
    })).filter(x=>x.local_id);
  }
  function applicationRows(snapshot,userId){
    const jobs=Array.isArray(snapshot?.jobs)?snapshot.jobs:[];
    return jobs.map((j,i)=>({
      user_id:userId,
      fingerprint:clean(j.fingerprint||j.id||j.jobId||j.url||`local-${i}`,500),
      payload:j&&typeof j==='object'?j:{},
      updated_at:new Date().toISOString()
    })).filter(x=>x.fingerprint);
  }
  function settingsRow(snapshot,userId){
    const keys=['applyEngineSafety','naukriAutoApply','profileBoost','radarConfig','activeCandidateProfile','careerSuite'];
    const payload={}; for(const k of keys) if(snapshot?.[k]!==undefined) payload[k]=snapshot[k];
    return {user_id:userId,payload,updated_at:new Date().toISOString()};
  }
  function snapshotRow(snapshot,userId,schemaVersion){
    return {user_id:userId,schema_version:Number(schemaVersion)||0,remote_schema:REMOTE_SCHEMA,payload:snapshot,updated_at:new Date().toISOString()};
  }
  function preview(snapshot={}){
    const workspace=snapshot.teamWorkspace||{};
    return Object.freeze({
      schemaVersion:Number(snapshot.schemaVersion)||0,
      candidates:Array.isArray(workspace.candidates)?workspace.candidates.length:0,
      jobs:Array.isArray(snapshot.jobs)?snapshot.jobs.length:0,
      history:Array.isArray(snapshot.history)?snapshot.history.length:0,
      sessions:Array.isArray(snapshot.applyEngineSessions)?snapshot.applyEngineSessions.length:0,
      answerVaultFields:Object.values(snapshot.applyEngineAnswerVault||{}).filter(v=>Array.isArray(v)?v.length:Boolean(String(v??'').trim())).length,
      includesPortalPasswords:false,
      includesAuthTokens:false,
      remoteSchema:REMOTE_SCHEMA
    });
  }
  function cloudPayload(snapshot,userId,schemaVersion){
    return {
      snapshot:snapshotRow(snapshot,userId,schemaVersion),
      candidates:candidateRows(snapshot,userId),
      applications:applicationRows(snapshot,userId),
      settings:settingsRow(snapshot,userId)
    };
  }

  root.ApplyraCloudSync=Object.freeze({VERSION,REMOTE_SCHEMA,TABLES,clean,endpoint,rpcEndpoint,headers,preview,cloudPayload});
  if(typeof module!=='undefined'&&module.exports) module.exports=root.ApplyraCloudSync;
})(typeof globalThis!=='undefined'?globalThis:this);
