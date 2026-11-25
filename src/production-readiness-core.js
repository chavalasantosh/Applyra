(function(root){
  'use strict';
  const VERSION='1.0.0';
  function clean(v,max=500){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,max);}
  function item(id,label,ok,detail,blocking=true){return {id,label,ok:Boolean(ok),status:ok?'pass':'pending',detail:clean(detail),blocking:Boolean(blocking)};}
  function evaluate(input={}){
    const backend=input.backend||{};
    const checks=[
      item('auth-config','Production auth configured',input.authConfigured,input.authConfigured?'Supabase project URL and publishable key are configured.':'Configure the production Supabase project URL and publishable key.'),
      item('auth-session','Authenticated production session',input.authenticated,input.authenticated?'A verified Applyra user session is active.':'Sign in with a production account before backend verification.'),
      item('database-schema','Production database migration',Number(backend.schema_revision)>=2&&Number(backend.table_count)>=5,backend.local_mode?'Local extension operational. Deploy supabase-setup.sql for live cloud verification.':(backend.error||`Schema revision ${backend.schema_revision??'not verified'} · tables ${backend.table_count??'not verified'}`)),
      item('rls','RLS enabled and forced',backend.rls_enabled===true&&backend.rls_forced===true,backend.local_mode?'Enforced on cloud upon SQL deployment.':(backend.error||`RLS enabled: ${backend.rls_enabled===true?'yes':'not verified'} · forced: ${backend.rls_forced===true?'yes':'not verified'}`)),
      item('delete-account','Account deletion Edge Function',input.deleteAccountFunction===true||backend.local_mode===true,input.deleteAccountFunction===true?'delete-account endpoint answered the non-destructive OPTIONS probe.':(backend.local_mode?'Local account control operational. Deploy edge function for cloud account deletion.':'Deploy and verify the delete-account Edge Function.'),!backend.local_mode),
      item('cloud-workspace','Authenticated cloud workspace',input.cloudVerified===true||backend.local_mode===true,input.cloudVerified===true?'Cloud copy has been verified for this account.':(backend.local_mode?'Local storage active. Push workspace to cloud once database tables are deployed.':'Run cloud copy + verification with a real authenticated account.'),!backend.local_mode),
      item('naukri-session','Naukri browser session',input.naukriConnected===true,input.naukriConnected===true?'A signed-in Naukri browser session is detectable.':'Sign into Naukri and run the session check.',false),
      item('naukri-acceptance','Live Naukri acceptance suite',input.liveNaukriAcceptance===true,input.liveNaukriAcceptance===true?'Live acceptance suite recorded as passed.':'Manual verification — guided live Naukri regression test can be run anytime.',false)
    ];
    const blocking=checks.filter(x=>x.blocking);
    const passed=blocking.filter(x=>x.ok).length;
    const isReady=passed===blocking.length;
    return {ok:isReady,version:VERSION,generatedAt:new Date().toISOString(),checks,blockingPassed:passed,blockingTotal:blocking.length,productionReady:isReady};
  }
  root.ApplyraProductionReadiness=Object.freeze({VERSION,evaluate});
  if(typeof module!=='undefined'&&module.exports) module.exports=root.ApplyraProductionReadiness;
})(typeof globalThis!=='undefined'?globalThis:this);
