import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
};
const ROLES = ['super_admin','admin','support','read_only'] as const;
type Role = typeof ROLES[number];
const CONFIG_KEYS = new Set(['feature_flags','maintenance','environment','email','provider_policy','limits','billing']);
const CAPABILITIES: Record<Role,string[]> = {
  super_admin:['view','users','roles','ban','delete','config','audit','privacy','errors'],
  admin:['view','users','ban','config','audit','privacy','errors'],
  support:['view','users','privacy','errors'],
  read_only:['view','audit','errors'],
};

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});}
function clean(value:unknown,max=1000){return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);}
function safeObject(value:unknown){if(!value||typeof value!=='object'||Array.isArray(value))return {};const raw=JSON.stringify(value);if(raw.length>16000)throw new Error('Payload too large');return JSON.parse(raw);}
function normalizeRole(value:unknown):Role|''{const r=clean(value,40) as Role;return ROLES.includes(r)?r:'';}
function can(role:Role,capability:string){return CAPABILITIES[role].includes(capability);}
function maskEmail(value:string){const [left,right]=String(value||'').split('@');if(!right)return value||'';const shown=left.length<=2?left.slice(0,1):left.slice(0,2);return `${shown}${'*'.repeat(Math.max(1,Math.min(8,left.length-shown.length)))}@${right}`;}
function userView(user:any,role:Role,adminRole=''){
  const providers=[...(user?.app_metadata?.providers||[])];if(user?.app_metadata?.provider)providers.push(user.app_metadata.provider);
  const email=clean(user?.email,320);const privileged=role==='super_admin'||role==='admin';
  return {id:clean(user?.id,120),email:privileged?email:maskEmail(email),providers:[...new Set(providers.map((x:any)=>clean(x,60)).filter(Boolean))],createdAt:clean(user?.created_at,80),lastSignInAt:clean(user?.last_sign_in_at,80),bannedUntil:clean(user?.banned_until,80),emailConfirmedAt:clean(user?.email_confirmed_at,80),adminRole:normalizeRole(adminRole)};
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
  const supabaseUrl=Deno.env.get('SUPABASE_URL')||'';
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
  const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!supabaseUrl||!anonKey||!serviceRole)return json({ok:false,error:'Admin backend is not configured'},503);
  const authorization=req.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer '))return json({ok:false,error:'Authentication required'},401);

  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:userData,error:userError}=await userClient.auth.getUser();
  const caller=userData.user;
  if(userError||!caller?.id)return json({ok:false,error:'Invalid or expired session'},401);

  const service=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}});
  const {data:roleRow,error:roleError}=await service.from('applyra_admin_roles').select('role,active').eq('user_id',caller.id).maybeSingle();
  if(roleError)return json({ok:false,error:'Admin role lookup failed'},500);
  const role=normalizeRole(roleRow?.role);
  if(!role||roleRow?.active!==true)return json({ok:false,error:'This account does not have an active Applyra admin role'},403);

  let body:any={};
  try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON'},400);}
  const action=clean(body?.action,80);const payload=body?.payload&&typeof body.payload==='object'?body.payload:{};

  async function audit(name:string,targetType='',targetId='',detail:Record<string,unknown>={}){
    await service.from('applyra_admin_audit_events').insert({actor_user_id:caller.id,action:name,target_type:clean(targetType,80),target_id:clean(targetId,180),payload:safeObject(detail)});
  }
  function requireCap(capability:string){if(!can(role,capability))throw Object.assign(new Error('Your admin role is not allowed to perform this action.'),{status:403});}

  try{
    if(action==='whoami')return json({ok:true,data:{user:{id:caller.id,email:caller.email||''},role,capabilities:CAPABILITIES[role]}});
    if(action==='summary'){
      requireCap('view');const {data,error}=await service.rpc('applyra_admin_summary');if(error)throw error;return json({ok:true,data:data||{}});
    }
    if(action==='health'){
      requireCap('view');
      const {error}=await service.from('applyra_admin_config').select('key').limit(1);
      return json({ok:true,data:{database:error?'Degraded':'Healthy',auth:'Healthy',adminApi:'Healthy',checkedAt:new Date().toISOString()}});
    }
    if(action==='config.get'){
      requireCap('view');const {data,error}=await service.from('applyra_admin_config').select('key,value,updated_at').order('key');if(error)throw error;
      const config:Record<string,unknown>={};for(const row of data||[])config[row.key]=row.value;return json({ok:true,data:{config}});
    }
    if(action==='config.set'){
      requireCap('config');const key=clean(payload?.key,80);if(!CONFIG_KEYS.has(key))return json({ok:false,error:'Unsupported admin configuration key'},400);const value=safeObject(payload?.value);
      const {error}=await service.from('applyra_admin_config').upsert({key,value,updated_by:caller.id,updated_at:new Date().toISOString()},{onConflict:'key'});if(error)throw error;
      await audit('config.set','config',key,{keys:Object.keys(value)});return json({ok:true,data:{key,value}});
    }
    if(action==='users.list'){
      requireCap('users');const page=Math.max(1,Math.min(1000,Number(payload?.page)||1));const perPage=Math.max(1,Math.min(200,Number(payload?.perPage)||100));
      const {data,error}=await service.auth.admin.listUsers({page,perPage});if(error)throw error;const ids=(data?.users||[]).map((u:any)=>u.id);
      const roleMap=new Map<string,string>();if(ids.length){const {data:roles}=await service.from('applyra_admin_roles').select('user_id,role').in('user_id',ids);for(const r of roles||[])roleMap.set(r.user_id,r.role);}
      return json({ok:true,data:{page,perPage,users:(data?.users||[]).map((u:any)=>userView(u,role,roleMap.get(u.id)||''))}});
    }
    if(action==='users.get'){
      requireCap('users');const userId=clean(payload?.userId,120);if(!userId)return json({ok:false,error:'User ID is required'},400);const {data,error}=await service.auth.admin.getUserById(userId);if(error)throw error;const {data:r}=await service.from('applyra_admin_roles').select('role').eq('user_id',userId).maybeSingle();return json({ok:true,data:{user:userView(data.user,role,r?.role||'')}});
    }
    if(action==='users.set_role'){
      requireCap('roles');const userId=clean(payload?.userId,120),nextRole=normalizeRole(payload?.role);if(!userId)return json({ok:false,error:'User ID is required'},400);if(userId===caller.id)return json({ok:false,error:'Self role changes are blocked from the Admin Console.'},400);
      if(!nextRole){await service.from('applyra_admin_roles').delete().eq('user_id',userId);const {data:u}=await service.auth.admin.getUserById(userId);await service.auth.admin.updateUserById(userId,{app_metadata:{...(u.user?.app_metadata||{}),applyra_role:null}});await audit('users.set_role','user',userId,{role:'none'});return json({ok:true,data:{userId,role:''}});}
      const {error}=await service.from('applyra_admin_roles').upsert({user_id:userId,role:nextRole,active:true,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;const {data:u}=await service.auth.admin.getUserById(userId);const {error:ue}=await service.auth.admin.updateUserById(userId,{app_metadata:{...(u.user?.app_metadata||{}),applyra_role:nextRole}});if(ue)throw ue;await audit('users.set_role','user',userId,{role:nextRole});return json({ok:true,data:{userId,role:nextRole}});
    }
    if(action==='users.set_ban'){
      requireCap('ban');const userId=clean(payload?.userId,120),banned=payload?.banned===true;if(!userId)return json({ok:false,error:'User ID is required'},400);if(userId===caller.id)return json({ok:false,error:'Self-ban is blocked from the Admin Console.'},400);const {error}=await service.auth.admin.updateUserById(userId,{ban_duration:banned?'876000h':'none'} as any);if(error)throw error;await audit('users.set_ban','user',userId,{banned});return json({ok:true,data:{userId,banned}});
    }
    if(action==='users.delete'){
      requireCap('delete');const userId=clean(payload?.userId,120);if(!userId||payload?.confirmation!=='DELETE')return json({ok:false,error:'Explicit DELETE confirmation is required'},400);if(userId===caller.id)return json({ok:false,error:'Self-delete is blocked from the Admin Console.'},400);const {error}=await service.auth.admin.deleteUser(userId,true);if(error)throw error;await audit('users.delete','user',userId,{softDelete:true});return json({ok:true,data:{userId,deleted:true,soft:true}});
    }
    if(action==='audit.list'){
      requireCap('audit');const limit=Math.max(1,Math.min(200,Number(payload?.limit)||100));const {data,error}=await service.from('applyra_admin_audit_events').select('id,actor_user_id,action,target_type,target_id,payload,created_at').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return json({ok:true,data:{events:(data||[]).map((x:any)=>({title:x.action,target:`${x.target_type||''}${x.target_id?`: ${x.target_id}`:''}`,createdAt:x.created_at,detail:JSON.stringify(x.payload||{}).slice(0,1000)}))}});
    }
    if(action==='errors.list'){
      requireCap('errors');const limit=Math.max(1,Math.min(200,Number(payload?.limit)||100));const {data,error}=await service.from('applyra_admin_error_events').select('id,code,feature,message,extension_version,created_at').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return json({ok:true,data:{events:(data||[]).map((x:any)=>({code:x.code,title:`${x.feature||'system'} · ${x.code||'ERROR'}`,message:clean(x.message,800),createdAt:x.created_at}))}});
    }
    if(action==='privacy.list'){
      requireCap('privacy');const limit=Math.max(1,Math.min(200,Number(payload?.limit)||100));const {data,error}=await service.from('applyra_privacy_requests').select('id,user_id,request_type,status,detail,created_at,updated_at').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return json({ok:true,data:{requests:(data||[]).map((x:any)=>({id:x.id,title:`${x.request_type} · ${x.status}`,detail:JSON.stringify(x.detail||{}).slice(0,1000),createdAt:x.created_at,updatedAt:x.updated_at}))}});
    }
    if(action==='privacy.update'){
      requireCap('privacy');const id=clean(payload?.id,120),status=clean(payload?.status,40);if(!id||!['requested','processing','completed','failed','cancelled'].includes(status))return json({ok:false,error:'Valid request ID and status are required'},400);const {error}=await service.from('applyra_privacy_requests').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;await audit('privacy.update','privacy_request',id,{status});return json({ok:true,data:{id,status}});
    }
    return json({ok:false,error:'Unsupported admin action'},400);
  }catch(error:any){return json({ok:false,error:clean(error?.message||'Admin request failed',900)},Number(error?.status)||500);}
});
