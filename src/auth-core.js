(function(root){
  'use strict';

  const VERSION='2.8.0-beta.8';
  const CONFIG_KEY='authConfig';
  const SESSION_KEY='authSession';
  const PROFILE_KEY='authProfile';
  const ALLOWED_PROVIDERS=new Set(['google','linkedin_oidc','azure']);

  function clean(value,max=2000){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);}
  function base64Url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function randomString(bytes=32){const arr=new Uint8Array(bytes);crypto.getRandomValues(arr);return base64Url(arr);}
  async function sha256Base64Url(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));return base64Url(new Uint8Array(digest));}
  function decodeJwtPayload(token){
    try{
      const part=String(token||'').split('.')[1]; if(!part) return null;
      const normalized=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');
      return JSON.parse(atob(normalized));
    }catch{return null;}
  }
  function normalizeSupabaseUrl(value){
    try{
      const u=new URL(clean(value,500));
      if(u.protocol!=='https:') return '';
      if(!/(^|\.)supabase\.co$/i.test(u.hostname)) return '';
      u.pathname='';u.search='';u.hash='';
      return u.origin;
    }catch{return '';}
  }
  function validatePublishableKey(value){
    const key=clean(value,2500);
    if(!key) return {ok:false,error:'Supabase publishable/anon key is required.'};
    if(/^sb_secret_/i.test(key)) return {ok:false,error:'Secret/service keys must never be stored in the extension. Use only a publishable/anon key.'};
    if(/^sb_publishable_/i.test(key)) return {ok:true,key};
    const payload=decodeJwtPayload(key);
    if(payload?.role==='service_role'||payload?.role==='supabase_admin') return {ok:false,error:'Service-role/admin keys are forbidden in the extension.'};
    if(payload?.role==='anon') return {ok:true,key};
    return {ok:false,error:'Use a Supabase publishable key (sb_publishable_…) or legacy anon key.'};
  }
  function normalizeConfig(input={}){
    const supabaseUrl=normalizeSupabaseUrl(input.supabaseUrl);
    const keyCheck=validatePublishableKey(input.publishableKey);
    return {
      provider:'supabase',
      supabaseUrl,
      publishableKey:keyCheck.ok?keyCheck.key:'',
      requireAuth:input.requireAuth!==false,
      configured:Boolean(supabaseUrl&&keyCheck.ok),
      updatedAt:clean(input.updatedAt,40)
    };
  }
  function publicConfig(input={}){
    const cfg=normalizeConfig(input);
    return {provider:cfg.provider,supabaseUrl:cfg.supabaseUrl,configured:cfg.configured,requireAuth:cfg.requireAuth,updatedAt:cfg.updatedAt};
  }
  function hostPattern(config={}){const url=normalizeSupabaseUrl(config.supabaseUrl);return url?`${url}/*`:'';}
  function passwordPolicy(password){
    const text=String(password||'');
    if(text.length<12) return {ok:false,error:'Use at least 12 characters.'};
    if(text.length>128) return {ok:false,error:'Password is too long (maximum 128 characters).'};
    if(/^\s+$/.test(text)) return {ok:false,error:'Password cannot be only spaces.'};
    return {ok:true};
  }
  function normalizeEmail(email){const out=clean(email,320).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out)?out:'';}
  function normalizeFullName(name){const out=clean(name,120);return out.length>=2?out:'';}
  function normalizePhone(phone){const out=clean(phone,20).replace(/[^\d+]/g,'');return /^\+?\d{7,15}$/.test(out)?out:'';}
  function normalizeDob(dob){
    const out=clean(dob,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(out)) return '';
    const d=new Date(`${out}T00:00:00Z`);
    if(Number.isNaN(d.getTime())) return '';
    const ageMs=Date.now()-d.getTime();
    const years=ageMs/(365.25*24*3600*1000);
    return years>=13&&years<=120?out:'';
  }
  function sanitizeUser(user={}){
    const appMetadata=user.app_metadata||{};
    const identities=Array.isArray(user.identities)?user.identities.map(x=>clean(x?.provider,60)).filter(Boolean):[];
    if(appMetadata.provider) identities.push(clean(appMetadata.provider,60));
    if(Array.isArray(appMetadata.providers)) identities.push(...appMetadata.providers.map(x=>clean(x,60)).filter(Boolean));
    const metadata=user.user_metadata||{};
    return {
      id:clean(user.id,120),
      email:clean(user.email,320),
      emailConfirmedAt:clean(user.email_confirmed_at||user.confirmed_at,60),
      displayName:clean(metadata.full_name||metadata.name||metadata.user_name||'',180),
      avatarUrl:/^https:\/\//i.test(String(metadata.avatar_url||metadata.picture||''))?clean(metadata.avatar_url||metadata.picture,1200):'',
      providers:[...new Set(identities)].slice(0,12),
      lastSignInAt:clean(user.last_sign_in_at,60),
      createdAt:clean(user.created_at,60)
    };
  }
  function stripSession(raw={},persistent=false){
    const user=sanitizeUser(raw.user||{});
    const expiresIn=Math.max(60,Number(raw.expires_in)||3600);
    return {
      accessToken:clean(raw.access_token,8000),
      refreshToken:clean(raw.refresh_token,8000),
      tokenType:clean(raw.token_type||'bearer',40),
      expiresAt:Number(raw.expires_at)||Math.floor(Date.now()/1000)+expiresIn,
      persistent:Boolean(persistent),
      user,
      providerTokensStored:false,
      updatedAt:new Date().toISOString()
    };
  }
  function isSessionFresh(session={},skewSeconds=90){return Boolean(session?.accessToken&&Number(session.expiresAt)>(Date.now()/1000+skewSeconds));}
  function providerLabel(provider){return provider==='google'?'Google':provider==='linkedin_oidc'?'LinkedIn':provider==='azure'?'Microsoft / Outlook':'Email';}
  function authEndpoint(config,path){const base=normalizeSupabaseUrl(config?.supabaseUrl);if(!base) return '';return `${base}/auth/v1${path.startsWith('/')?path:`/${path}`}`;}
  function authHeaders(config,accessToken=''){
    const key=normalizeConfig(config).publishableKey;
    const headers={'Content-Type':'application/json','apikey':key};
    if(accessToken) headers.Authorization=`Bearer ${accessToken}`;
    return headers;
  }
  function oauthAuthorizeUrl(config,{provider,redirectTo,codeChallenge}){
    if(!ALLOWED_PROVIDERS.has(provider)) throw new Error('Unsupported OAuth provider.');
    const url=new URL(authEndpoint(config,'/authorize'));
    url.searchParams.set('provider',provider);
    url.searchParams.set('redirect_to',redirectTo);
    url.searchParams.set('code_challenge',codeChallenge);
    url.searchParams.set('code_challenge_method','s256');
    return url.toString();
  }

  root.NowCurryAuthCore={VERSION,CONFIG_KEY,SESSION_KEY,PROFILE_KEY,ALLOWED_PROVIDERS,clean,randomString,sha256Base64Url,decodeJwtPayload,normalizeSupabaseUrl,validatePublishableKey,normalizeConfig,publicConfig,hostPattern,passwordPolicy,normalizeEmail,normalizeFullName,normalizePhone,normalizeDob,sanitizeUser,stripSession,isSessionFresh,providerLabel,authEndpoint,authHeaders,oauthAuthorizeUrl};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryAuthCore;
})(typeof globalThis!=='undefined'?globalThis:this);
