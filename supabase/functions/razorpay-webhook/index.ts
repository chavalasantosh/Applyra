import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type, x-razorpay-signature, x-razorpay-event-id','Access-Control-Allow-Methods':'POST, OPTIONS'};
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});}
function clean(value:unknown,max=1000){return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);}
function secretMap(name:string){try{return JSON.parse(Deno.env.get(name)||'{}') as Record<string,string>;}catch{return {};}}
function serviceKey(){return secretMap('SUPABASE_SECRET_KEYS').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';}
function bytesToHex(bytes:Uint8Array){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
function constantTimeEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function hmacHex(secret:string,body:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body))));}
async function sha256Hex(text:string){return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))));}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'POST required'},405);
  try{
    const webhookSecret=Deno.env.get('RAZORPAY_WEBHOOK_SECRET')||'';if(!webhookSecret)return json({ok:false,error:'Webhook secret is not configured.'},503);
    const raw=await req.text();const signature=clean(req.headers.get('x-razorpay-signature'),256);if(!signature)return json({ok:false,error:'Missing Razorpay signature.'},401);
    const expected=await hmacHex(webhookSecret,raw);if(!constantTimeEqual(expected,signature))return json({ok:false,error:'Invalid Razorpay webhook signature.'},401);
    let event:any;try{event=JSON.parse(raw);}catch{return json({ok:false,error:'Invalid JSON.'},400);}
    const url=Deno.env.get('SUPABASE_URL')||'',svc=serviceKey();if(!url||!svc)return json({ok:false,error:'Supabase server environment is incomplete.'},500);
    const service=createClient(url,svc,{auth:{persistSession:false,autoRefreshToken:false}});
    const eventType=clean(event?.event,100)||'unknown';const subscription=event?.payload?.subscription?.entity||null;const payment=event?.payload?.payment?.entity||null;
    const providerSubscriptionId=clean(subscription?.id||payment?.subscription_id,120);const providerPaymentId=clean(payment?.id,120);
    const providerEventId=clean(req.headers.get('x-razorpay-event-id'),200)||await sha256Hex(`${eventType}:${raw}`);
    const metadata={status:clean(subscription?.status||payment?.status,60),amount:Number(payment?.amount)||0,currency:clean(payment?.currency,3),method:clean(payment?.method,40),createdAt:Number(subscription?.created_at||payment?.created_at)||0};
    const {error:eventError}=await service.from('applyra_billing_events').upsert({provider:'razorpay',provider_event_id:providerEventId,event_type:eventType,provider_subscription_id:providerSubscriptionId,provider_payment_id:providerPaymentId,signature_verified:true,metadata},{onConflict:'provider_event_id',ignoreDuplicates:true});if(eventError)throw eventError;
    if(providerSubscriptionId){
      const update:any={updated_at:new Date().toISOString(),last_provider_sync_at:new Date().toISOString()};
      if(subscription?.status)update.status=clean(subscription.status,40);
      if(subscription?.current_start!=null)update.current_start=Number(subscription.current_start)||0;
      if(subscription?.current_end!=null)update.current_end=Number(subscription.current_end)||0;
      if(subscription?.ended_at!=null)update.ended_at=Number(subscription.ended_at)||0;
      if(subscription?.quantity!=null)update.quantity=Math.max(1,Number(subscription.quantity)||1);
      if(eventType==='subscription.cancelled')update.cancel_at_cycle_end=true;
      const {error:updateError}=await service.from('applyra_billing_subscriptions').update(update).eq('provider_subscription_id',providerSubscriptionId);if(updateError)throw updateError;
    }
    return json({ok:true,accepted:true});
  }catch(error:any){return json({ok:false,error:clean(error?.message||'Webhook failed.',900)},500);}
});
