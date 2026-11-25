import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
};
const ADMIN_ROLES = new Set(['super_admin','admin']);
const SUPER_ROLES = new Set(['super_admin']);
const OPEN_SUBSCRIPTION_STATES = new Set(['created','authenticated','active','pending','halted','paused']);
const PERIODS = new Set(['daily','weekly','monthly','quarterly','yearly']);

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});}
function clean(value:unknown,max=1000){return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);}
function slug(value:unknown){return clean(value,80).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);}
function safeObject(value:unknown){return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}
function nowIso(){return new Date().toISOString();}
function secretMap(name:string){try{return JSON.parse(Deno.env.get(name)||'{}') as Record<string,string>;}catch{return {};}}
function serviceKey(){return secretMap('SUPABASE_SECRET_KEYS').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';}
function publicKey(){return secretMap('SUPABASE_PUBLISHABLE_KEYS').default || Deno.env.get('SUPABASE_ANON_KEY') || '';}
function providerConfigured(){return Boolean(Deno.env.get('RAZORPAY_KEY_ID')&&Deno.env.get('RAZORPAY_KEY_SECRET'));}
function basicAuth(){const id=Deno.env.get('RAZORPAY_KEY_ID')||'',secret=Deno.env.get('RAZORPAY_KEY_SECRET')||'';if(!id||!secret)throw new Error('Razorpay billing secrets are not configured in Supabase.');return `Basic ${btoa(`${id}:${secret}`)}`;}
function providerSummary(){return {id:'razorpay',configured:providerConfigured(),keyIdConfigured:Boolean(Deno.env.get('RAZORPAY_KEY_ID')),secretConfigured:Boolean(Deno.env.get('RAZORPAY_KEY_SECRET')),webhookSecretConfigured:Boolean(Deno.env.get('RAZORPAY_WEBHOOK_SECRET')),checkoutMode:'card-first'};}
const textEncoder=new TextEncoder();
function b64u(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function checkoutToken(payload:Record<string,unknown>){const secret=Deno.env.get('RAZORPAY_KEY_SECRET')||'';if(!secret)throw new Error('Razorpay billing secret is not configured.');const encoded=b64u(textEncoder.encode(JSON.stringify(payload)));const key=await crypto.subtle.importKey('raw',textEncoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,textEncoder.encode(encoded)));return `${encoded}.${b64u(sig)}`;}
async function checkoutLauncherUrl(userId:string,localSubscriptionId:string,providerSubscriptionId:string,preference:unknown){const mode=clean(preference,30).toLowerCase()==='alternatives'?'alternatives':'card';const token=await checkoutToken({v:1,uid:userId,sid:localSubscriptionId,psid:providerSubscriptionId,mode,exp:Math.floor(Date.now()/1000)+600});const base=clean(Deno.env.get('SUPABASE_URL'),800);if(!base)throw new Error('Supabase URL is unavailable.');return `${base.replace(/\/$/,'')}/functions/v1/checkout-launcher?token=${encodeURIComponent(token)}`;}

async function razorpay(path:string,{method='GET',body}: {method?:string,body?:unknown}={}){
  const response=await fetch(`https://api.razorpay.com/v1${path}`,{method,headers:{Authorization:basicAuth(),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  let payload:any={};try{payload=await response.json();}catch{}
  if(!response.ok){const message=clean(payload?.error?.description||payload?.error?.reason||payload?.message||`Razorpay request failed (${response.status}).`,900);throw new Error(message);}
  return payload;
}

function planOut(row:any){return {id:row.id,slug:row.slug,name:row.name,description:row.description,provider:row.provider,providerPlanId:row.provider_plan_id,amountSubunits:Number(row.amount_subunits)||0,currency:row.currency,period:row.period,interval:Number(row.interval)||1,totalCount:Number(row.total_count)||12,active:Boolean(row.active),entitlements:row.entitlements||{},createdAt:row.created_at,updatedAt:row.updated_at};}
function subOut(row:any,planSlug=''){if(!row)return null;return {id:row.id,provider:row.provider,providerSubscriptionId:row.provider_subscription_id,planSlug:planSlug||row.plan_slug||'',status:row.status,checkoutUrl:row.checkout_url||'',quantity:Number(row.quantity)||1,currentStart:Number(row.current_start)||0,currentEnd:Number(row.current_end)||0,endedAt:Number(row.ended_at)||0,cancelAtCycleEnd:Boolean(row.cancel_at_cycle_end),createdAt:row.created_at,updatedAt:row.updated_at};}

Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'POST required'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL')||'',pub=publicKey(),svc=serviceKey();
    if(!url||!pub||!svc)return json({ok:false,error:'Supabase server environment is incomplete.'},500);
    const authHeader=req.headers.get('Authorization')||'';
    if(!authHeader.startsWith('Bearer '))return json({ok:false,error:'Authentication required.'},401);
    const userClient=createClient(url,pub,{global:{headers:{Authorization:authHeader}},auth:{persistSession:false,autoRefreshToken:false}});
    const service=createClient(url,svc,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userError}=await userClient.auth.getUser();
    if(userError||!user)return json({ok:false,error:'Authentication required.'},401);
    const body=safeObject(await req.json().catch(()=>({})));const action=clean(body.action,80),payload=safeObject(body.payload);

    const getRole=async()=>{const {data}=await service.from('applyra_admin_roles').select('role,active').eq('user_id',user.id).maybeSingle();return data?.active?clean(data.role,40):'';};
    const requireAdmin=async(superOnly=false)=>{const role=await getRole();if(!(superOnly?SUPER_ROLES:ADMIN_ROLES).has(role))throw Object.assign(new Error(superOnly?'super_admin role required.':'Admin role required.'),{status:403});return role;};
    const audit=async(name:string,targetId='',detail:Record<string,unknown>={})=>{await service.from('applyra_admin_audit_events').insert({actor_user_id:user.id,action:`billing.${name}`,target_type:'billing',target_id:clean(targetId,160),payload:detail});};

    if(action==='overview'||action==='plans.list'||action==='subscription.get'){
      const {data:plans,error:plansError}=await service.from('applyra_billing_plans').select('*').eq('active',true).order('amount_subunits',{ascending:true});if(plansError)throw plansError;
      const {data:sub,error:subError}=await service.from('applyra_billing_subscriptions').select('*,applyra_billing_plans(slug)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(subError)throw subError;
      const shapedSub=sub?subOut(sub,(sub as any).applyra_billing_plans?.slug||''):null;
      if(action==='plans.list')return json({ok:true,data:{plans:(plans||[]).map(planOut),provider:providerSummary()}});
      if(action==='subscription.get')return json({ok:true,data:{subscription:shapedSub,provider:providerSummary()}});
      return json({ok:true,data:{plans:(plans||[]).map(planOut),subscription:shapedSub,provider:providerSummary()}});
    }

    if(action==='checkout.create'){
      if(!providerConfigured())return json({ok:false,error:'Razorpay is not configured yet. Ask an admin to configure billing secrets.'},503);
      const planSlug=slug(payload.planSlug);if(!planSlug)return json({ok:false,error:'Plan is required.'},400);
      const paymentPreference=clean(payload.paymentPreference,30).toLowerCase()==='alternatives'?'alternatives':'card';
      const {data:plan,error:planError}=await service.from('applyra_billing_plans').select('*').eq('slug',planSlug).eq('active',true).maybeSingle();if(planError)throw planError;if(!plan)return json({ok:false,error:'Billing plan is unavailable.'},404);

      // Serialize subscription creation per user. Without this, two near-simultaneous clicks can
      // both pass the local "no open subscription" check and create two provider subscriptions.
      const {data:lockToken,error:lockError}=await service.rpc('applyra_acquire_billing_checkout_lock',{p_user_id:user.id,p_ttl_seconds:120});
      if(lockError)throw lockError;
      if(!lockToken)return json({ok:false,error:'A billing checkout is already being created. Try again in a moment.'},409);
      try{
        const {data:existing,error:existingError}=await service.from('applyra_billing_subscriptions').select('*,applyra_billing_plans(slug)').eq('user_id',user.id).in('status',[...OPEN_SUBSCRIPTION_STATES]).order('created_at',{ascending:false}).limit(1).maybeSingle();if(existingError)throw existingError;
        if(existing){
          let checkoutUrl=clean(existing.checkout_url,1200),current=existing;
          // Recover a missing hosted checkout link from Razorpay instead of creating another
          // subscription. Active subscriptions may legitimately have no checkout URL to open.
          if(!checkoutUrl&&existing.provider_subscription_id){
            const remote=await razorpay(`/subscriptions/${encodeURIComponent(existing.provider_subscription_id)}`);
            checkoutUrl=clean(remote?.short_url,1200);
            const recovered={
              status:clean(remote?.status||existing.status,40),
              checkout_url:checkoutUrl,
              quantity:Number(remote?.quantity)||Number(existing.quantity)||1,
              current_start:Number(remote?.current_start)||Number(existing.current_start)||0,
              current_end:Number(remote?.current_end)||Number(existing.current_end)||0,
              ended_at:Number(remote?.ended_at)||Number(existing.ended_at)||0,
              last_provider_sync_at:nowIso(),
              updated_at:nowIso()
            };
            const {data:updated,error:updateError}=await service.from('applyra_billing_subscriptions').update(recovered).eq('id',existing.id).eq('user_id',user.id).select('*,applyra_billing_plans(slug)').single();
            if(updateError)throw updateError;
            current=updated;
          }
          const existingSlug=(current as any).applyra_billing_plans?.slug||'';
          const launchUrl=await checkoutLauncherUrl(user.id,current.id,current.provider_subscription_id,paymentPreference);
          return json({ok:true,data:{reused:true,checkoutUrl:launchUrl,providerCheckoutUrl:checkoutUrl,paymentPreference,subscription:subOut(current,existingSlug)}});
        }

        const notes={applyra_user_id:user.id,applyra_plan_slug:plan.slug,applyra_email:clean(user.email,220)};
        const created=await razorpay('/subscriptions',{method:'POST',body:{plan_id:plan.provider_plan_id,total_count:Number(plan.total_count)||12,quantity:1,customer_notify:true,notes}});
        const providerId=clean(created?.id,120),checkoutUrl=clean(created?.short_url,1200);if(!providerId)throw new Error('Razorpay did not return a subscription ID.');
        const row={user_id:user.id,plan_id:plan.id,provider:'razorpay',provider_subscription_id:providerId,status:clean(created?.status||'created',40),checkout_url:checkoutUrl,quantity:Number(created?.quantity)||1,current_start:Number(created?.current_start)||0,current_end:Number(created?.current_end)||0,ended_at:Number(created?.ended_at)||0,cancel_at_cycle_end:false,last_provider_sync_at:nowIso(),updated_at:nowIso()};
        const {data:saved,error:saveError}=await service.from('applyra_billing_subscriptions').insert(row).select('*').single();
        if(saveError){
          // Provider creation succeeded but local persistence failed. Cancel immediately so a
          // dangling recurring mandate is not left behind without an Applyra record.
          try{await razorpay(`/subscriptions/${encodeURIComponent(providerId)}/cancel`,{method:'POST',body:{cancel_at_cycle_end:0}});}catch{}
          throw saveError;
        }
        const launchUrl=await checkoutLauncherUrl(user.id,saved.id,providerId,paymentPreference);
        return json({ok:true,data:{checkoutUrl:launchUrl,providerCheckoutUrl:checkoutUrl,paymentPreference,subscription:subOut(saved,plan.slug)}});
      }finally{
        await service.rpc('applyra_release_billing_checkout_lock',{p_user_id:user.id,p_token:lockToken}).catch(()=>{});
      }
    }

    if(action==='subscription.sync'){
      const {data:existing,error}=await service.from('applyra_billing_subscriptions').select('*,applyra_billing_plans(slug)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;if(!existing)return json({ok:true,data:{subscription:null}});
      if(!providerConfigured())return json({ok:true,data:{subscription:subOut(existing,(existing as any).applyra_billing_plans?.slug||''),provider:providerSummary(),synced:false}});
      const remote=await razorpay(`/subscriptions/${encodeURIComponent(existing.provider_subscription_id)}`);
      const update={status:clean(remote?.status||existing.status,40),current_start:Number(remote?.current_start)||0,current_end:Number(remote?.current_end)||0,ended_at:Number(remote?.ended_at)||0,quantity:Number(remote?.quantity)||1,last_provider_sync_at:nowIso(),updated_at:nowIso()};
      const {data:saved,error:saveError}=await service.from('applyra_billing_subscriptions').update(update).eq('id',existing.id).eq('user_id',user.id).select('*').single();if(saveError)throw saveError;
      return json({ok:true,data:{subscription:subOut(saved,(existing as any).applyra_billing_plans?.slug||''),provider:providerSummary(),synced:true}});
    }

    if(action==='subscription.cancel'){
      if(!providerConfigured())return json({ok:false,error:'Razorpay is not configured.'},503);
      const {data:existing,error}=await service.from('applyra_billing_subscriptions').select('*,applyra_billing_plans(slug)').eq('user_id',user.id).in('status',[...OPEN_SUBSCRIPTION_STATES]).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;if(!existing)return json({ok:false,error:'No cancellable subscription was found.'},404);
      const atCycleEnd=payload.atCycleEnd!==false;const remote=await razorpay(`/subscriptions/${encodeURIComponent(existing.provider_subscription_id)}/cancel`,{method:'POST',body:{cancel_at_cycle_end:atCycleEnd?1:0}});
      const update={status:clean(remote?.status||existing.status,40),cancel_at_cycle_end:atCycleEnd,current_start:Number(remote?.current_start)||Number(existing.current_start)||0,current_end:Number(remote?.current_end)||Number(existing.current_end)||0,ended_at:Number(remote?.ended_at)||Number(existing.ended_at)||0,last_provider_sync_at:nowIso(),updated_at:nowIso()};
      const {data:saved,error:saveError}=await service.from('applyra_billing_subscriptions').update(update).eq('id',existing.id).eq('user_id',user.id).select('*').single();if(saveError)throw saveError;
      return json({ok:true,data:{subscription:subOut(saved,(existing as any).applyra_billing_plans?.slug||'')}});
    }

    if(action==='provider.status'){
      await requireAdmin(false);const {data,error}=await service.rpc('applyra_billing_summary');if(error)throw error;return json({ok:true,data:{provider:providerSummary(),summary:data||{}}});
    }

    if(action==='admin.plans.list'){
      await requireAdmin(false);const {data,error}=await service.from('applyra_billing_plans').select('*').order('created_at',{ascending:false});if(error)throw error;return json({ok:true,data:{plans:(data||[]).map(planOut),provider:providerSummary()}});
    }

    if(action==='admin.plan.create'){
      await requireAdmin(true);if(!providerConfigured())return json({ok:false,error:'Razorpay secrets are not configured in Supabase.'},503);
      const name=clean(payload.name,120),planSlug=slug(payload.slug||name),description=clean(payload.description,280),currency=clean(payload.currency||'INR',3).toUpperCase(),period=clean(payload.period||'monthly',20).toLowerCase();
      const interval=Math.max(1,Math.min(12,Math.trunc(Number(payload.interval)||1))),totalCount=Math.max(1,Math.min(120,Math.trunc(Number(payload.totalCount)||12))),amountSubunits=Math.trunc(Number(payload.amountSubunits)||0);
      if(name.length<2||!planSlug||amountSubunits<100||!/^[A-Z]{3}$/.test(currency)||!PERIODS.has(period))return json({ok:false,error:'Valid name, slug, amount, currency and billing period are required.'},400);
      if(period==='daily'&&interval<7)return json({ok:false,error:'Daily Razorpay plans require interval >= 7.'},400);
      const providerPlan=await razorpay('/plans',{method:'POST',body:{period,interval,item:{name,amount:amountSubunits,currency,description},notes:{applyra_plan_slug:planSlug}}});
      const providerPlanId=clean(providerPlan?.id,120);if(!providerPlanId)throw new Error('Razorpay did not return a plan ID.');
      const {data,error}=await service.from('applyra_billing_plans').insert({slug:planSlug,name,description,provider:'razorpay',provider_plan_id:providerPlanId,amount_subunits:amountSubunits,currency,period,interval,total_count:totalCount,active:true,entitlements:safeObject(payload.entitlements),created_by:user.id,updated_at:nowIso()}).select('*').single();if(error)throw error;
      await audit('plan.create',data.id,{slug:planSlug,providerPlanId,amountSubunits,currency,period,interval,totalCount});return json({ok:true,data:{plan:planOut(data)}});
    }

    if(action==='admin.plan.set_active'){
      await requireAdmin(true);const id=clean(payload.id,120),active=Boolean(payload.active);if(!id)return json({ok:false,error:'Plan ID is required.'},400);
      const {data,error}=await service.from('applyra_billing_plans').update({active,updated_at:nowIso()}).eq('id',id).select('*').single();if(error)throw error;await audit('plan.set_active',id,{active});return json({ok:true,data:{plan:planOut(data)}});
    }

    if(action==='admin.subscriptions.list'){
      await requireAdmin(false);const limit=Math.max(1,Math.min(200,Math.trunc(Number(payload.limit)||100)));const {data,error}=await service.from('applyra_billing_subscriptions').select('*,applyra_billing_plans(slug,name)').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return json({ok:true,data:{subscriptions:(data||[]).map((x:any)=>({...subOut(x,x.applyra_billing_plans?.slug||''),planName:x.applyra_billing_plans?.name||'',userId:x.user_id}))}});
    }

    return json({ok:false,error:'Unsupported billing action.'},400);
  }catch(error:any){return json({ok:false,error:clean(error?.message||'Billing request failed.',900)},Number(error?.status)||500);}
});
