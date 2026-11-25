(function(root){
  'use strict';

  const VERSION='1.0.0';
  const ROLES=Object.freeze(['super_admin','admin','support','read_only']);
  const ACTIONS=Object.freeze([
    'whoami','summary','users.list','users.get','users.set_role','users.set_ban','users.delete',
    'config.get','config.set','audit.list','privacy.list','privacy.update','errors.list','health'
  ]);
  const CONFIG_KEYS=Object.freeze(['feature_flags','maintenance','environment','email','provider_policy','limits','billing']);
  const DEFAULT_FLAGS=Object.freeze({
    googleLogin:true,linkedinLogin:true,emailLogin:true,naukriConnector:true,
    profileExtraction:true,naukriSearch:true,autoApply:true,answerVault:true,candidateMemory:true,
    careerSuite:true,gmailSync:false,linkedinIntegration:false,
    diagnostics:true,developerTestLab:false
  });
  const ROLE_CAPABILITIES=Object.freeze({
    super_admin:['view','users','roles','ban','delete','config','audit','privacy','errors'],
    admin:['view','users','ban','config','audit','privacy','errors'],
    support:['view','users','privacy','errors'],
    read_only:['view','audit','errors']
  });

  function clean(value,max=500){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);}
  function normalizeRole(value){const role=clean(value,40).toLowerCase();return ROLES.includes(role)?role:'';}
  function isAdminRole(value){return Boolean(normalizeRole(value));}
  function can(role,capability){const r=normalizeRole(role);return Boolean(r&&ROLE_CAPABILITIES[r]?.includes(clean(capability,60)));}
  function allowedAction(action){return ACTIONS.includes(clean(action,80));}
  function normalizeFlags(input={}){
    const out={};
    for(const [key,value] of Object.entries(DEFAULT_FLAGS)) out[key]=typeof input?.[key]==='boolean'?input[key]:value;
    return out;
  }
  function normalizeMaintenance(input={}){
    const mode=['off','cloud-only','automation-paused','authenticated-actions-paused'].includes(input?.mode)?input.mode:'off';
    return {mode,message:clean(input?.message||'',280),updatedAt:clean(input?.updatedAt||'',60)};
  }
  function maskEmail(value){
    const email=clean(value,320).toLowerCase(); const at=email.indexOf('@');
    if(at<1)return email; const left=email.slice(0,at),right=email.slice(at+1);
    const shown=left.length<=2?left[0]:(left.slice(0,2)); return `${shown}${'*'.repeat(Math.max(1,Math.min(8,left.length-shown.length)))}@${right}`;
  }
  function statusTone(value){
    const s=clean(value,80).toLowerCase();
    if(/healthy|active|connected|configured|pass|ok|ready|enabled/.test(s))return 'good';
    if(/fail|offline|error|blocked|disabled|degraded/.test(s))return 'bad';
    if(/unknown|not configured|not tested|unavailable|backend required|not deployed/.test(s))return 'warn';
    return 'info';
  }
  function safeConfigValue(key,value){
    if(!CONFIG_KEYS.includes(key))return null;
    if(key==='feature_flags')return normalizeFlags(value||{});
    if(key==='maintenance')return normalizeMaintenance(value||{});
    if(value==null||typeof value!=='object'||Array.isArray(value))return {};
    const encoded=JSON.stringify(value); if(encoded.length>12000)throw new Error('Configuration payload is too large.');
    return JSON.parse(encoded);
  }
  function providerRows(local={}){
    const configured=Boolean(local?.auth?.configured);
    return [
      {id:'email',label:'Email / Password',state:configured?'Backend configured':'Not configured',detail:'Supabase email authentication.'},
      {id:'google',label:'Google / Gmail',state:configured?'Not verified':'Not configured',detail:'Provider is configured in Supabase Auth, then verified by an actual login.'},
      {id:'linkedin_oidc',label:'LinkedIn',state:configured?'Not verified':'Not configured',detail:'Provider is configured in Supabase Auth, then verified by an actual login.'},
      {id:'naukri',label:'Naukri',state:local?.naukri?.connected?'Connected':'Not connected',detail:'Browser-session connector. Applyra never stores a Naukri password or OTP.'}
    ];
  }
  function releaseCompatibility(local={}){
    const expected=Number(local?.release?.expectedSchema)||0,actual=Number(local?.release?.schemaVersion)||0;
    return {compatible:Boolean(expected&&actual===expected),expected,actual};
  }

  root.ApplyraAdminCore=Object.freeze({VERSION,ROLES,ACTIONS,CONFIG_KEYS,DEFAULT_FLAGS,ROLE_CAPABILITIES,clean,normalizeRole,isAdminRole,can,allowedAction,normalizeFlags,normalizeMaintenance,maskEmail,statusTone,safeConfigValue,providerRows,releaseCompatibility});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.ApplyraAdminCore;
})(typeof globalThis!=='undefined'?globalThis:this);
