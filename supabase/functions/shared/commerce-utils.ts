export const clean=(v,max=2000)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
export const env=n=>clean(Deno.env.get(n)||'',5000);
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const minorDigits=c=>['JPY','KRW','VND','CLP','XAF','XOF','XPF'].includes(c)?0:['BHD','KWD','OMR','JOD','TND'].includes(c)?3:2;
export const major=(n,c)=> (Number(n)/10**minorDigits(c)).toFixed(minorDigits(c));
export const minor=(n,c)=>Math.round(Number(n)*10**minorDigits(c));
export async function remote(url,init={}){const r=await fetch(url,{...init,signal:AbortSignal.timeout(20000)});const text=await r.text();let d;try{d=JSON.parse(text);}catch{d={};}if(!r.ok)throw Error(`Payment provider rejected the request (${r.status}). Check server configuration.`);return d;}
export async function sign(value){const secret=env('CHECKOUT_SESSION_SECRET');if(secret.length<32)throw Error('CHECKOUT_SESSION_SECRET must contain at least 32 characters.');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
export async function token(id){const payload=btoa(JSON.stringify({id,exp:Math.floor(Date.now()/1000)+3600}));return payload+'.'+await sign(payload);}
export async function verifyToken(value){const [p,s]=String(value||'').split('.');if(!p||!s||!equal(await sign(p),s))throw Error('Invalid checkout session.');const out=JSON.parse(atob(p));if(out.exp<Math.floor(Date.now()/1000))throw Error('Checkout session expired.');return out.id;}
export function serverUrl(path){return env('SUPABASE_URL').replace(/\/$/,'')+'/functions/v1/'+path;}
export function returnUrl(){return serverUrl('payment-return');}
export function providerBase(id){
 if(id==='stripe')return 'https://api.stripe.com/v1';
 if(id==='adyen'){const override=env('ADYEN_CHECKOUT_BASE_URL');if(override){const u=new URL(override);if(u.protocol!=='https:'||!/(^|\.)adyen\.com$/.test(u.hostname))throw Error('Invalid Adyen API base.');return override.replace(/\/$/,'');}return 'https://checkout-test.adyen.com/v72';}
 if(id==='checkout')return env('CHECKOUT_LIVE')==='true'?'https://api.checkout.com':'https://api.sandbox.checkout.com';
 if(id==='paddle')return env('PADDLE_LIVE')==='true'?'https://api.paddle.com':'https://sandbox-api.paddle.com';
 if(id==='paypal')return env('PAYPAL_LIVE')==='true'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
 if(id==='cashfree')return env('CASHFREE_LIVE')==='true'?'https://api.cashfree.com/pg':'https://sandbox.cashfree.com/pg';
 throw Error('Unknown provider base.');
}
export function safeHosted(value,provider){try{const u=new URL(value);if(u.protocol!=='https:')return '';const hosts={stripe:['stripe.com'],adyen:['adyen.link'],checkout:['checkout.com'],paddle:['paddle.com'],mollie:['mollie.com'],paypal:['paypal.com'],shopify:[env('SHOPIFY_STORE_DOMAIN')],braintree:[new URL(env('SUPABASE_URL')).hostname],cashfree:[new URL(env('SUPABASE_URL')).hostname]};return (hosts[provider]||[]).some(h=>h&&(u.hostname===h||u.hostname.endsWith('.'+h)))?u.href:'';}catch{return '';}}
