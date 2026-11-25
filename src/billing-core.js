(function(root){
  'use strict';

  const VERSION='1.1.0';
  const PROVIDER='razorpay';
  const PROVIDERS=Object.freeze(['razorpay','adyen','checkout','paddle','braintree','mollie']);
  const PERIODS=Object.freeze(['daily','weekly','monthly','quarterly','yearly']);
  const ACTIVE_STATUSES=Object.freeze(['created','authenticated','active','pending','halted','paused']);
  const PAID_STATUSES=Object.freeze(['active']);
  const PAYMENT_PREFERENCES=Object.freeze(['card','alternatives']);

  function clean(value,max=500){return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);}
  function normalizeSlug(value){return clean(value,80).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);}
  function normalizeCurrency(value){const c=clean(value||'INR',3).toUpperCase();return /^[A-Z]{3}$/.test(c)?c:'INR';}
  function normalizePaymentPreference(value){const v=clean(value,30).toLowerCase();return PAYMENT_PREFERENCES.includes(v)?v:'card';}
  function toSubunits(value){const n=Number(value);if(!Number.isFinite(n)||n<=0)return 0;return Math.round(n*100);}
  function fromSubunits(value){const n=Number(value);return Number.isFinite(n)?n/100:0;}
  function validatePlan(input={}){
    const name=clean(input.name,120),slug=normalizeSlug(input.slug||name),currency=normalizeCurrency(input.currency);
    const period=PERIODS.includes(clean(input.period,20).toLowerCase())?clean(input.period,20).toLowerCase():'monthly';
    const interval=Math.max(1,Math.min(12,Math.trunc(Number(input.interval)||1)));
    const totalCount=Math.max(1,Math.min(120,Math.trunc(Number(input.totalCount)||12)));
    const amountSubunits=Number.isInteger(Number(input.amountSubunits))?Math.trunc(Number(input.amountSubunits)):toSubunits(input.amount);
    const description=clean(input.description,280);
    const errors=[];
    if(name.length<2)errors.push('Plan name is required.');
    if(!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(slug))errors.push('Plan slug must contain only lowercase letters, numbers, hyphens or underscores.');
    if(amountSubunits<100)errors.push('Plan amount must be at least 1.00 in the selected currency.');
    if(period==='daily'&&interval<7)errors.push('Daily Razorpay plans require an interval of at least 7.');
    return {ok:errors.length===0,errors,plan:{name,slug,currency,period,interval,totalCount,amountSubunits,description}};
  }
  function normalizePlan(row={}){
    return {
      id:clean(row.id,80),slug:normalizeSlug(row.slug),name:clean(row.name,120),description:clean(row.description,280),provider:clean(row.provider||PROVIDER,40),
      providerPlanId:clean(row.provider_plan_id||row.providerPlanId,120),amountSubunits:Math.max(0,Math.trunc(Number(row.amount_subunits??row.amountSubunits)||0)),
      currency:normalizeCurrency(row.currency),period:PERIODS.includes(clean(row.period,20).toLowerCase())?clean(row.period,20).toLowerCase():'monthly',
      interval:Math.max(1,Math.trunc(Number(row.interval)||1)),totalCount:Math.max(1,Math.trunc(Number(row.total_count??row.totalCount)||12)),
      active:row.active!==false,entitlements:row.entitlements&&typeof row.entitlements==='object'?row.entitlements:{},createdAt:clean(row.created_at||row.createdAt,80),updatedAt:clean(row.updated_at||row.updatedAt,80)
    };
  }
  function normalizeSubscription(row={}){
    return {
      id:clean(row.id,120),provider:clean(row.provider||PROVIDER,40),providerSubscriptionId:clean(row.provider_subscription_id||row.providerSubscriptionId,120),
      planSlug:normalizeSlug(row.plan_slug||row.planSlug),status:clean(row.status||'unknown',40).toLowerCase(),checkoutUrl:safeCheckoutUrl(row.checkout_url||row.checkoutUrl),
      currentStart:Number(row.current_start??row.currentStart)||0,currentEnd:Number(row.current_end??row.currentEnd)||0,endedAt:Number(row.ended_at??row.endedAt)||0,
      cancelAtCycleEnd:Boolean(row.cancel_at_cycle_end??row.cancelAtCycleEnd),quantity:Math.max(1,Math.trunc(Number(row.quantity)||1)),
      createdAt:clean(row.created_at||row.createdAt,80),updatedAt:clean(row.updated_at||row.updatedAt,80)
    };
  }
  function isOpenSubscription(status){return ACTIVE_STATUSES.includes(clean(status,40).toLowerCase());}
  function hasPaidAccess(status){return PAID_STATUSES.includes(clean(status,40).toLowerCase());}
  function safeCheckoutUrl(value,supabaseUrl=''){
    const raw=clean(value,1800);if(!raw)return '';
    try{
      const u=new URL(raw);if(u.protocol!=='https:')return '';
      const host=u.hostname.toLowerCase();
      if(host==='stripe.com'||host.endsWith('.stripe.com')||host==='adyen.link'||host.endsWith('.adyen.link')||host==='paypal.com'||host.endsWith('.paypal.com')||host.endsWith('.myshopify.com')||host==='rzp.io'||host.endsWith('.razorpay.com')||host==='razorpay.com'||host.endsWith('.adyen.com')||host==='adyen.com'||host.endsWith('.checkout.com')||host==='checkout.com'||host.endsWith('.paddle.com')||host==='paddle.com'||host.endsWith('.mollie.com')||host==='mollie.com'||host.endsWith('.braintreegateway.com'))return u.toString();
      const sb=clean(supabaseUrl,800);
      if(sb){const s=new URL(sb);if(s.protocol==='https:'&&u.origin===s.origin&&['/functions/v1/checkout-launcher','/functions/v1/commerce-checkout'].includes(u.pathname)&&u.searchParams.has('token'))return u.toString();}
    }catch{}
    return '';
  }
  function formatMoney(subunits,currency='INR'){
    const amount=fromSubunits(subunits);const c=normalizeCurrency(currency);
    try{return new Intl.NumberFormat('en-IN',{style:'currency',currency:c,maximumFractionDigits:2}).format(amount);}catch{return `${c} ${amount.toFixed(2)}`;}
  }
  function periodLabel(plan={}){const p=normalizePlan(plan);const singular={daily:'day',weekly:'week',monthly:'month',quarterly:'quarter',yearly:'year'}[p.period]||p.period;return p.interval===1?`every ${singular}`:`every ${p.interval} ${singular}s`;}

  root.ApplyraBillingCore=Object.freeze({VERSION,PROVIDER,PROVIDERS,PERIODS,ACTIVE_STATUSES,PAID_STATUSES,PAYMENT_PREFERENCES,clean,normalizeSlug,normalizeCurrency,normalizePaymentPreference,toSubunits,fromSubunits,validatePlan,normalizePlan,normalizeSubscription,isOpenSubscription,hasPaidAccess,safeCheckoutUrl,formatMoney,periodLabel});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.ApplyraBillingCore;
})(typeof globalThis!=='undefined'?globalThis:this);
