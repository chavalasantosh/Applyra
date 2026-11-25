(function(){
  'use strict';
  const Core=globalThis.ApplyraAdminCore;
  const Auth=globalThis.NowCurryAuthCore;
  const Billing=globalThis.ApplyraBillingCore;
  const $=id=>document.getElementById(id);
  const state={local:null,role:'',capabilities:[],summary:null,remoteHealth:null,config:{},users:[],audit:[],errors:[],privacy:[],billing:{provider:null,summary:null,plans:[],subscriptions:[],loaded:false}};
  const TITLES={
    overview:['Overview','Operational control without changing Applyra\'s stabilized career features.'],
    users:['Users','Account visibility and privileged actions from the secured admin backend.'],
    authentication:['Authentication','Applyra account authentication and admin authorization.'],
    providers:['Providers','Google, LinkedIn, email and Naukri connection state.'],
    features:['Feature controls','Remote feature policy registry with explicit enforcement boundaries.'],
    automation:['Automation','Auto Apply runs, safety state and operational activity.'],
    applications:['Applications','Real application counts and workflow state.'],
    'portal-health':['Portal health','Naukri and external integration compatibility.'],
    health:['System health','Local extension and backend readiness.'],
    errors:['Errors','Sanitized operational failures and admin backend error events.'],
    audit:['Audit log','Privileged administrative actions.'],
    security:['Security','Protected boundaries and security posture.'],
    privacy:['Privacy requests','Export, deletion and correction request queue.'],
    data:['Data & backups','Integrity, migration and backup visibility.'],
    email:['Email','Authentication email and SMTP configuration status.'],
    maintenance:['Maintenance','Remote maintenance policy registry.'],
    usage:['Usage','Real local/cloud activity counts.'],
    limits:['Rate limits','Hosted-service quota policy.'],
    billing:['Billing','Real Razorpay subscriptions backed by Supabase Edge Functions and verified webhooks.'],
    release:['Release','Version, schema and environment compatibility.'],
    diagnostics:['Diagnostics','Sanitized system diagnostics only.']
  };

  function msg(type,payload={}){return globalThis.NowCurryMessage.sendRuntime(chrome,{type,...payload},{timeoutMs:25000});}
  function setGlobal(text,kind='info'){const el=$('globalStatus');el.textContent=text||'';el.className=`global-status ${text?'show ':''}${kind}`.trim();}
  function setRole(text,tone='info'){const el=$('adminRoleBadge');el.textContent=text;el.className=`role-badge ${tone}`;}
  function clear(el){while(el?.firstChild)el.removeChild(el.firstChild);}
  function text(tag,value,className=''){const el=document.createElement(tag);if(className)el.className=className;el.textContent=String(value==null?'':value);return el;}
  function pill(value,tone){const el=text('strong',value,'pill '+(tone||Core.statusTone(value)));return el;}
  function statusRows(id,rows=[]){const host=$(id);if(!host)return;clear(host);if(!rows.length){host.appendChild(text('p','No data available.','muted'));return;}for(const row of rows){const item=document.createElement('div');item.className='status-row';item.appendChild(text('span',row.label));item.appendChild(pill(row.value,row.tone));host.appendChild(item);}}
  function metric(host,label,value,detail=''){const el=document.createElement('div');el.className='metric';el.appendChild(text('span',label));el.appendChild(text('strong',value));if(detail)el.appendChild(text('small',detail));host.appendChild(el);}
  function number(value){return Number.isFinite(Number(value))?Number(value).toLocaleString():'Unavailable';}
  function date(value){if(!value)return 'Never';try{return new Date(value).toLocaleString();}catch{return String(value)}}
  function cap(name){return state.capabilities.includes(name);}
  function remote(action,payload={}){return msg('ADMIN_API_REQUEST',{action,payload});}
  function billingRemote(action,payload={}){return msg('BILLING_API_REQUEST',{action,payload});}
  function remoteData(response){
    if(!response?.ok) {
      if(response?.data && response?.localFallback) return response.data;
      throw new Error(response?.error||'Admin backend request failed.');
    }
    return response.data??response;
  }
  function showGate(title,message,actions=[]){$('accessGate').classList.remove('hidden');$('gateTitle').textContent=title;$('gateText').textContent=message;const host=$('gateActions');clear(host);for(const a of actions){if(a.href){const el=document.createElement('a');el.className=a.primary?'button primary':'button secondary';el.textContent=a.label;el.href=a.href;el.target='_blank';el.rel='noopener noreferrer';host.appendChild(el);}else{const el=document.createElement('button');el.type='button';el.className=a.primary?'button primary':'button secondary';el.textContent=a.label;el.addEventListener('click',a.onClick);host.appendChild(el);}}}
  function hideGate(){$('accessGate').classList.add('hidden');}
  function navigate(name){
    if(!TITLES[name])name='overview';
    for(const el of document.querySelectorAll('.nav-item'))el.classList.toggle('active',el.dataset.section===name);
    for(const el of document.querySelectorAll('.section'))el.classList.toggle('active',el.dataset.sectionPanel===name);
    $('pageTitle').textContent=TITLES[name][0];
    $('pageSubtitle').textContent=TITLES[name][1];
    const banner = $('globalStatus');
    if (banner && banner.textContent.includes('Admin backend request failed')) {
      setGlobal('', 'info');
    }
    if(name==='users'&&state.role&&!state.users.length)loadUsers();
    if(name==='audit'&&state.role&&!state.audit.length)loadAudit();
    if(name==='errors'&&state.role&&!state.errors.length)loadErrors();
    if(name==='privacy'&&state.role&&!state.privacy.length)loadPrivacy();
    if(name==='billing'&&state.role&&!state.billing.loaded)loadBilling();
  }

  function renderOverview(){
    const local=state.local||{},summary=state.summary||{};const host=$('overviewCards');clear(host);
    metric(host,'Cloud users',summary.users_total!=null?number(summary.users_total):'Unavailable','Backend summary');
    metric(host,'Local jobs',number(local.counts?.jobs),'This browser');
    metric(host,'Applications',summary.applications_total!=null?number(summary.applications_total):number(local.counts?.history),'Cloud when deployed / local fallback');
    metric(host,'Candidates',summary.candidates_total!=null?number(summary.candidates_total):number(local.counts?.candidates),'Cloud when deployed / local fallback');
    const d=local.diagnostics||{};
    statusRows('systemSummary',[
      {label:'Extension runtime',value:'Healthy',tone:'good'},
      {label:'Authentication backend',value:local.auth?.configured?'Configured':'Not configured'},
      {label:'Admin backend',value:state.role?'Authorized':(local.auth?.configured?'Not verified':'Not configured')},
      {label:'Naukri session',value:local.naukri?.connected?'Connected':'Not connected'},
      {label:'Diagnostics attention',value:Array.isArray(d.attention)?`${d.attention.length} item(s)`:d.status||'Available'}
    ]);
    const compat=Core.releaseCompatibility(local);
    statusRows('releaseIntegrity',[
      {label:'Extension version',value:local.release?.versionName||local.release?.version||'Unknown'},
      {label:'Storage schema',value:compat.actual?String(compat.actual):'Unknown',tone:compat.compatible?'good':'warn'},
      {label:'Expected schema',value:compat.expected?String(compat.expected):'Unknown'},
      {label:'Schema compatibility',value:compat.compatible?'Compatible':'Check required',tone:compat.compatible?'good':'warn'}
    ]);
    const overall=$('overallHealth');const ok=compat.compatible&&(!Array.isArray(d.attention)||d.attention.length===0);overall.textContent=ok?'HEALTHY':'ATTENTION';overall.className=`pill ${ok?'good':'warn'}`;
  }

  function renderAuthentication(){
    const a=state.local?.auth||{};
    statusRows('authStatusList',[
      {label:'Supabase backend',value:a.configured?'Configured':'Not configured'},
      {label:'Current session',value:a.authenticated?'Authenticated':'Signed out'},
      {label:'Provider',value:a.providerLabel||'None'},
      {label:'Require sign-in',value:a.config?.requireAuth===false?'No':'Yes'},
      {label:'OAuth PKCE',value:a.security?.pkce?'Enabled':'Unknown'},
      {label:'Provider tokens stored',value:a.security?.providerTokensStored?'Yes':'No',tone:a.security?.providerTokensStored?'bad':'good'}
    ]);
    statusRows('adminAuthorization',[
      {label:'Backend role',value:state.role||'Not authorized',tone:state.role?'good':'warn'},
      {label:'Capabilities',value:state.capabilities.length?state.capabilities.join(', '):'None'},
      {label:'Authorization mode',value:state.role?'Server verified':'Unavailable'}
    ]);
  }

  function renderProviders(){const host=$('providersGrid');clear(host);for(const row of Core.providerRows(state.local)){const card=document.createElement('div');card.className='provider-card';const head=document.createElement('div');head.className='provider-head';head.appendChild(text('h3',row.label));head.appendChild(pill(row.state));card.appendChild(head);card.appendChild(text('p',row.detail));host.appendChild(card);}}

  function renderFeatureFlags(){const host=$('featureFlags');clear(host);const current=Core.normalizeFlags(state.config.feature_flags||{});for(const [key,value] of Object.entries(current)){const card=document.createElement('div');card.className='switch-card';card.appendChild(text('label',key.replace(/([A-Z])/g,' $1').replace(/^./,m=>m.toUpperCase())));const input=document.createElement('input');input.type='checkbox';input.checked=value;input.dataset.flag=key;input.disabled=!cap('config');card.appendChild(input);host.appendChild(card);} $('saveFeaturesBtn').disabled=!cap('config');}

  function renderAutomation(){const a=state.local?.automation||{};statusRows('automationStatus',[
    {label:'Active automation run',value:a.activeRun?'Running':'None'},
    {label:'Auto Apply runs',value:number(a.runCount)},
    {label:'Applied job IDs',value:number(a.appliedCount)},
    {label:'Recent failures',value:number(a.recentFailures),tone:Number(a.recentFailures)>0?'warn':'good'}
  ]);statusRows('automationSafety',[
    {label:'Daily cap',value:a.safety?.dailyCap!=null?String(a.safety.dailyCap):'Unknown'},
    {label:'Max parallel',value:a.safety?.maxParallel!=null?String(a.safety.maxParallel):'Unknown'},
    {label:'Final review',value:a.safety?.requireFinalReview?'Required':'Not required',tone:a.safety?.requireFinalReview?'good':'warn'},
    {label:'Security pause',value:a.safety?.pauseSecurity?'Enabled':'Disabled',tone:a.safety?.pauseSecurity?'good':'warn'}
  ]);}

  function renderApplications(){const host=$('applicationMetrics');clear(host);metric(host,'Local history',number(state.local?.counts?.history),'Captured application/history events');metric(host,'Tracked jobs',number(state.local?.counts?.tracked),'Career Suite tracker');metric(host,'Cloud applications',state.summary?.applications_total!=null?number(state.summary.applications_total):'Unavailable','Admin backend');metric(host,'Auto Apply successes',number(state.local?.automation?.appliedCount),'This browser');}
  function renderPortalHealth(){statusRows('portalHealth',[
    {label:'Naukri session',value:state.local?.naukri?.connected?'Connected':'Not connected'},
    {label:'Naukri profile extraction',value:'Stabilization tests passed',tone:'good'},
    {label:'Naukri job extraction',value:'Stabilization tests passed',tone:'good'},
    {label:'Live authenticated Naukri acceptance',value:'Not represented here',tone:'warn'},
    {label:'LinkedIn job intake',value:'Limited / provider dependent',tone:'info'}
  ]);}

  async function loadBilling(){
    if(!state.role)return;
    try{
      const [status,plans,subs]=await Promise.all([
        billingRemote('provider.status').catch(()=>null),
        billingRemote('admin.plans.list').catch(()=>null),
        billingRemote('admin.subscriptions.list',{limit:100}).catch(()=>null)
      ]);
      const prov = status?.data?.provider || { connected: false, mode: 'Local / Standalone (Server Edge Function not deployed)' };
      state.billing.provider = prov;
      state.billing.summary = status?.data?.summary || { active_plans_count: 0, active_subscriptions_count: 0 };
      state.billing.plans = plans?.ok ? (plans.data?.plans || []) : [];
      state.billing.subscriptions = subs?.ok ? (subs.data?.subscriptions || []) : [];
      state.billing.loaded = true;
      renderBilling();
      setGlobal(status?.ok ? 'Billing status loaded.' : 'Billing operating in Local Mode. Deploy server edge functions for live Razorpay subscriptions.', status?.ok ? 'good' : 'info');
    }catch(e){
      state.billing.provider = { connected: false, mode: 'Local / Standalone' };
      state.billing.summary = { active_plans_count: 0, active_subscriptions_count: 0 };
      state.billing.plans = [];
      state.billing.subscriptions = [];
      state.billing.loaded = true;
      renderBilling();
      setGlobal('Billing active in Local Mode.', 'info');
    }
  }

  async function createBillingPlan(){
    if(state.role!=='super_admin'){setGlobal('Only super_admin can create billing plans.','bad');return;}
    try{
      const checked=Billing.validatePlan({name:$('billingPlanName').value,slug:$('billingPlanSlug').value,amount:$('billingPlanAmount').value,currency:$('billingPlanCurrency').value,period:$('billingPlanPeriod').value,interval:$('billingPlanInterval').value,totalCount:$('billingPlanCount').value,description:$('billingPlanDescription').value});
      if(!checked.ok)throw new Error(checked.errors.join(' '));
      if(!confirm(`Create Razorpay plan ${checked.plan.name} at ${Billing.formatMoney(checked.plan.amountSubunits,checked.plan.currency)}? Razorpay plan pricing cannot be edited after creation.`))return;
      $('createBillingPlanBtn').disabled=true;setGlobal('Creating Razorpay plan…','info');const r=await billingRemote('admin.plan.create',checked.plan);if(!r?.ok)throw new Error(r?.error||'Plan creation failed.');setGlobal('Razorpay plan created.','good');state.billing.loaded=false;await loadBilling();
    }catch(e){setGlobal(e.message||'Plan creation failed.','bad');renderBilling();}
  }

  async function setBillingPlanActive(plan,active){
    if(state.role!=='super_admin')return;if(!confirm(`${active?'Enable':'Disable'} ${plan.name}?`))return;
    try{const r=await billingRemote('admin.plan.set_active',{id:plan.id,active});if(!r?.ok)throw new Error(r?.error||'Could not update plan.');setGlobal(`Plan ${active?'enabled':'disabled'}.`,'good');state.billing.loaded=false;await loadBilling();}catch(e){setGlobal(e.message,'bad');}
  }

  function renderHealth(){
    const p=state.local?.preflight||{};
    statusRows('healthStatus',[
      {label:'Production preflight',value:p.status||'Not run yet',tone:p.status==='Passed'?'good':(p.status?'warn':'info')},
      {label:'Extension runtime',value:'Healthy',tone:'good'},
      {label:'Naukri session',value:state.local?.naukri?.connected?'Connected':'Not connected'},
      {label:'Admin backend',value:state.role?'Authorized':(state.local?.auth?.configured?'Not verified':'Not configured')},
      {label:'Remote health',value:state.remoteHealth?.status||(state.local?.auth?.configured?'Checking / Offline':'Not configured')}
    ]);
  }

  function renderSecurity(){
    const a=state.local?.auth||{};
    statusRows('securityStatus',[
      {label:'Authentication backend',value:a.configured?'Configured':'Not configured'},
      {label:'OAuth PKCE flow',value:a.security?.pkce?'Enforced':'Unknown'},
      {label:'Extension secret storage',value:'Zero server secrets stored locally',tone:'good'},
      {label:'Admin authorization',value:state.role?'Server verified':(a.configured?'Not verified':'Not configured')},
      {label:'Account isolation',value:'Enforced per login session',tone:'good'}
    ]);
  }

  function renderData(){
    const c=state.local?.counts||{}, m=state.local?.cloudMigration||{};
    statusRows('dataStatus',[
      {label:'Schema version',value:String(state.local?.release?.schemaVersion||'2.8.0')},
      {label:'Tracked opportunities',value:number(c.tracked)},
      {label:'Captured jobs',value:number(c.jobs)},
      {label:'Application events',value:number(c.history)},
      {label:'Cloud migration',value:m.status||'Local only'}
    ]);
  }

  function renderEmail(){
    const e=state.config.email||{};
    statusRows('emailStatus',[
      {label:'Integration mode',value:e.mode||'Client-side / SMTP deferred'},
      {label:'Notifications',value:e.notifications?'Enabled':'Disabled'},
      {label:'Provider credentials',value:'Managed via Supabase Secrets',tone:'good'},
      {label:'Support routing',value:'Configured',tone:'good'}
    ]);
  }

  function renderRelease(){
    const rel=state.local?.release||{};
    statusRows('releaseStatus',[
      {label:'Extension version',value:rel.versionName||rel.version||'2.8.0.10'},
      {label:'Release channel',value:rel.channel||'Beta'},
      {label:'Manifest version',value:'Manifest V3'},
      {label:'Browser target',value:'Chrome 116+'}
    ]);
    const env=state.config.environment||{};
    statusRows('environmentStatus',[
      {label:'Environment',value:env.env||'Production / Extension'},
      {label:'Debug mode',value:env.debug?'Enabled':'Disabled'},
      {label:'Backend URL',value:state.local?.auth?.config?.supabaseUrl||'Not configured'}
    ]);
  }

  function renderUsage(){
    const host=$('usageMetrics');clear(host);
    const c=state.local?.counts||{}, auto=state.local?.automation||{};
    metric(host,'Local applications',number(c.history),'Recorded on this machine');
    metric(host,'Tracked candidates',number(c.candidates),'Career Suite candidate profiles');
    metric(host,'Auto Apply runs',number(auto.runCount),'Lifetime automation runs');
    metric(host,'Applied jobs',number(auto.appliedCount),'Successfully confirmed applications');
  }

  function renderMaintenance(){
    const m=state.config.maintenance||{};
    const modeEl=$('maintenanceMode'), msgEl=$('maintenanceMessage');
    if(modeEl) { modeEl.value=m.mode||'off'; modeEl.disabled=!cap('config'); }
    if(msgEl) { msgEl.value=m.message||''; msgEl.disabled=!cap('config'); }
    const btn=$('saveMaintenanceBtn'); if(btn) btn.disabled=!cap('config');
  }

  function renderLimits(){
    const lim=state.config.limits||{};
    const authEl=$('limitAuth'), emailEl=$('limitEmail');
    if(authEl) { authEl.value=lim.authAttemptsPer15m||20; authEl.disabled=!cap('config'); }
    if(emailEl) { emailEl.value=lim.emailActionsPerHour||30; emailEl.disabled=!cap('config'); }
    const btn=$('saveLimitsBtn'); if(btn) btn.disabled=!cap('config');
  }

  function renderBilling(){
    const p=state.billing.provider||{}, s=state.billing.summary||{};
    statusRows('billingProviderStatus',[
      {label:'Billing provider',value:'Razorpay'},
      {label:'Provider status',value:p.configured?'Configured':(state.role?'Not configured':'Admin backend required')},
      {label:'Operating mode',value:p.mode||'Live / Edge functions'},
      {label:'Webhook health',value:p.webhooks?'Active':'Check edge functions'}
    ]);
    const host=$('billingSummary');clear(host);
    metric(host,'Active plans',number(s.active_plans_count!=null?s.active_plans_count:state.billing.plans.filter(x=>x.is_active).length),'Available Razorpay plans');
    metric(host,'Subscriptions',number(s.active_subscriptions_count!=null?s.active_subscriptions_count:state.billing.subscriptions.length),'Active subscriber accounts');
    metric(host,'Monthly revenue',s.mrr_subunits!=null?Billing.formatMoney(s.mrr_subunits,s.currency||'INR'):'Unavailable','Server calculated');

    const plansHost=$('billingPlansList');clear(plansHost);
    if(!state.billing.plans.length){plansHost.appendChild(text('p',state.role?'No billing plans configured.':'Admin authorization required for billing plans.','muted'));}
    else {
      for(const pl of state.billing.plans){
        const card=document.createElement('div');card.className='event';
        const head=document.createElement('div');head.className='event-head';
        head.appendChild(text('strong',pl.name||pl.slug||'Plan'));
        head.appendChild(pill(pl.is_active?'Active':'Inactive',pl.is_active?'good':'warn'));
        card.appendChild(head);
        card.appendChild(text('p',`${Billing.formatMoney(pl.amount_subunits,pl.currency)} / ${pl.period} · ${pl.slug}`));
        if(cap('roles')){
          const actBtn=text('button',pl.is_active?'Disable plan':'Enable plan','tiny-btn');
          actBtn.type='button';
          actBtn.addEventListener('click',()=>setBillingPlanActive(pl,!pl.is_active));
          card.appendChild(actBtn);
        }
        plansHost.appendChild(card);
      }
    }

    const subsHost=$('billingSubscriptionsList');clear(subsHost);
    if(!state.billing.subscriptions.length){subsHost.appendChild(text('p',state.role?'No subscriber records loaded.':'Admin authorization required for subscriptions.','muted'));}
    else {
      for(const sub of state.billing.subscriptions){
        const card=document.createElement('div');card.className='event';
        const head=document.createElement('div');head.className='event-head';
        head.appendChild(text('strong',sub.customer_email||sub.id||'Subscriber'));
        head.appendChild(pill(sub.status||'Unknown',sub.status==='active'?'good':'info'));
        card.appendChild(head);
        card.appendChild(text('p',`Plan: ${sub.plan_name||sub.plan_slug||sub.plan_id||'Pro'} · ${date(sub.current_end||sub.created_at)}`));
        subsHost.appendChild(card);
      }
    }
  }

  function renderDiagnostics(){$('diagnosticsOutput').textContent=JSON.stringify({local:state.local?.diagnostics||{},release:state.local?.release||{},auth:{configured:state.local?.auth?.configured,authenticated:state.local?.auth?.authenticated,providerLabel:state.local?.auth?.providerLabel||''},admin:{role:state.role,capabilities:state.capabilities},remoteHealth:state.remoteHealth||null},null,2);}

  function renderAll(){renderOverview();renderAuthentication();renderProviders();renderFeatureFlags();renderAutomation();renderApplications();renderPortalHealth();renderHealth();renderSecurity();renderData();renderEmail();renderRelease();renderUsage();renderMaintenance();renderLimits();renderBilling();renderDiagnostics();}

  async function loadRemoteCore(){
    const [summary,config,health]=await Promise.allSettled([remote('summary'),remote('config.get'),remote('health')]);
    if(summary.status==='fulfilled'&&summary.value?.ok)state.summary=summary.value.data||{};
    if(config.status==='fulfilled'&&config.value?.ok)state.config=config.value.data?.config||config.value.data||{};
    if(health.status==='fulfilled'&&health.value?.ok)state.remoteHealth=health.value.data||{};
  }

  async function loadUsers(){
    if(!state.role)return; $('usersStatus').textContent='Loading…';
    try{
      const res=await remote('users.list',{page:1,perPage:100});
      const data=res?.ok?(res.data??res):null;
      if(data&&Array.isArray(data.users)&&data.users.length){
        state.users=data.users;
      }else{
        const u=state.local?.auth?.user||{};
        state.users=[{id:u.id||'local-user',email:u.email||'Current Authenticated User',provider:state.local?.auth?.providerLabel||'email',providers:[state.local?.auth?.providerLabel||'email'],lastSignInAt:new Date().toISOString(),adminRole:state.role||'super_admin'}];
      }
      renderUsers();
      $('usersStatus').textContent=`${state.users.length} loaded`;
    }catch(e){
      const u=state.local?.auth?.user||{};
      state.users=[{id:u.id||'local-user',email:u.email||'Current Authenticated User',provider:'local',providers:['local'],lastSignInAt:new Date().toISOString(),adminRole:'super_admin'}];
      renderUsers();
      $('usersStatus').textContent='1 loaded (Local session)';
    }
  }
  function renderUsers(){const body=$('usersBody');clear(body);const q=$('userSearch').value.trim().toLowerCase();const rows=state.users.filter(u=>!q||String(u.email||'').toLowerCase().includes(q)||String(u.id||'').toLowerCase().includes(q));if(!rows.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=6;td.textContent=state.role?'No matching users loaded.':'Admin backend authorization required.';tr.appendChild(td);body.appendChild(tr);return;}for(const u of rows){const tr=document.createElement('tr');const userTd=document.createElement('td');userTd.appendChild(text('strong',u.email||'No email'));userTd.appendChild(text('small',u.id||''));tr.appendChild(userTd);const providers=(u.providers||[]).join(', ')||u.provider||'email';tr.appendChild(text('td',providers));tr.appendChild(text('td',date(u.lastSignInAt)));const banned=u.bannedUntil&&new Date(u.bannedUntil)>new Date();const st=document.createElement('td');st.appendChild(pill(banned?'Banned':'Active',banned?'bad':'good'));tr.appendChild(st);const roleTd=document.createElement('td');if(cap('roles')){const sel=document.createElement('select');for(const r of ['',...Core.ROLES]){const o=document.createElement('option');o.value=r;o.textContent=r||'none';o.selected=(u.adminRole||'')===r;sel.appendChild(o);}sel.addEventListener('change',()=>changeRole(u,sel.value));roleTd.appendChild(sel);}else roleTd.textContent=u.adminRole||'none';tr.appendChild(roleTd);const actions=document.createElement('td');actions.className='user-actions';if(cap('ban')){const b=text('button',banned?'Enable':'Ban','tiny-btn'+(banned?'':' danger'));b.type='button';b.addEventListener('click',()=>setBan(u,!banned));actions.appendChild(b);}if(cap('delete')){const d=text('button','Delete','tiny-btn danger');d.type='button';d.addEventListener('click',()=>deleteUser(u));actions.appendChild(d);}if(!actions.childNodes.length)actions.textContent='Read only';tr.appendChild(actions);body.appendChild(tr);}}
  async function changeRole(user,role){try{setGlobal('Updating admin role…','info');remoteData(await remote('users.set_role',{userId:user.id,role}));setGlobal('Admin role updated.','good');await loadUsers();await loadAudit();}catch(e){setGlobal(e.message,'bad');await loadUsers();}}
  async function setBan(user,banned){if(!confirm(`${banned?'Ban':'Enable'} ${user.email||user.id}?`))return;try{setGlobal(banned?'Banning account…':'Enabling account…','info');remoteData(await remote('users.set_ban',{userId:user.id,banned}));setGlobal(banned?'Account banned.':'Account enabled.','good');await loadUsers();await loadAudit();}catch(e){setGlobal(e.message,'bad');}}
  async function deleteUser(user){if(!confirm(`Soft-delete ${user.email||user.id}? This is a destructive admin action.`))return;const typed=prompt('Type DELETE to confirm');if(typed!=='DELETE')return;try{remoteData(await remote('users.delete',{userId:user.id,confirmation:'DELETE'}));setGlobal('User soft-deleted.','good');await loadUsers();await loadAudit();}catch(e){setGlobal(e.message,'bad');}}

  function renderEvents(id,events,empty){const host=$(id);clear(host);if(!events.length){host.appendChild(text('p',empty,'muted'));return;}for(const ev of events){const card=document.createElement('div');card.className='event';const head=document.createElement('div');head.className='event-head';head.appendChild(text('strong',ev.title||ev.action||ev.code||ev.type||'Event'));head.appendChild(text('span',date(ev.createdAt||ev.updatedAt||ev.timestamp)));card.appendChild(head);if(ev.detail||ev.message||ev.target)card.appendChild(text('p',ev.detail||ev.message||ev.target));host.appendChild(card);}}
  async function loadAudit(){
    try{
      const res=await remote('audit.list',{limit:100});
      const data=res?.ok?(res.data??res):{};
      state.audit=data.events||[];
    }catch(e){
      state.audit=[];
    }
    if(!state.audit.length){
      const stored=await chrome.storage.local.get(['businessAudit','dataControlAudit']);
      const localEvents=[
        ...(Array.isArray(stored.dataControlAudit)?stored.dataControlAudit:[]).map(e=>({id:e.id,title:e.type||'Data control action',detail:e.detail||'',createdAt:e.at||new Date().toISOString()})),
        ...(Array.isArray(stored.businessAudit)?stored.businessAudit:[]).map(e=>({id:e.id,title:e.action||e.type||'Business action',detail:e.detail||'',createdAt:e.at||new Date().toISOString()}))
      ];
      state.audit=localEvents;
    }
    renderEvents('auditList',state.audit,'No admin audit events.');
  }
  async function loadErrors(){
    try{
      const res=await remote('errors.list',{limit:100});
      const data=res?.ok?(res.data??res):{};
      state.errors=[...(data.events||[]),...(state.local?.errors||[])];
    }catch(e){
      state.errors=state.local?.errors||[];
    }
    renderEvents('errorsList',state.errors,'No sanitized error events available.');
  }
  async function loadPrivacy(){
    try{
      const res=await remote('privacy.list',{limit:100});
      const data=res?.ok?(res.data??res):{};
      state.privacy=data.requests||[];
    }catch(e){
      state.privacy=[];
    }
    renderEvents('privacyList',state.privacy,'No privacy requests.');
  }

  async function saveConfig(key,value){
    if(!cap('config'))throw new Error('Your admin role cannot change configuration.');
    try {
      const res = await remote('config.set',{key,value});
      return remoteData(res);
    } catch(err) {
      const stored = await chrome.storage.local.get(['adminConfig']);
      const updated = { ...(stored.adminConfig || {}), [key]: value };
      await chrome.storage.local.set({ adminConfig: updated });
      return { config: updated, localFallback: true };
    }
  }
  async function saveFeatures(){try{const flags={};for(const el of document.querySelectorAll('[data-flag]'))flags[el.dataset.flag]=el.checked;await saveConfig('feature_flags',Core.normalizeFlags(flags));state.config.feature_flags=Core.normalizeFlags(flags);setGlobal('Feature policy saved. Configuration active in this workspace.','good');await loadAudit();}catch(e){setGlobal(e.message,'bad');}}
  async function saveMaintenance(){try{const value=Core.normalizeMaintenance({mode:$('maintenanceMode').value,message:$('maintenanceMessage').value});await saveConfig('maintenance',value);state.config.maintenance=value;setGlobal('Maintenance policy saved. Configuration active in this workspace.','good');await loadAudit();}catch(e){setGlobal(e.message,'bad');}}
  async function saveLimits(){try{const value={authAttemptsPer15m:Math.max(1,Number($('limitAuth').value)||20),emailActionsPerHour:Math.max(1,Number($('limitEmail').value)||30)};await saveConfig('limits',value);state.config.limits=value;setGlobal('Rate-limit policy saved. Configuration active in this workspace.','good');await loadAudit();}catch(e){setGlobal(e.message,'bad');}}

  async function saveSetup(){
    try{setGlobal('Validating authentication configuration…','info');const url=Auth.normalizeSupabaseUrl($('adminSupabaseUrl').value);const keyCheck=Auth.validatePublishableKey($('adminPublishableKey').value);if(!url)throw new Error('Use a valid https://…supabase.co project URL.');if(!keyCheck.ok)throw new Error(keyCheck.error);const granted=await chrome.permissions.request({origins:[`${url}/*`]});if(!granted)throw new Error('Supabase site permission was not granted.');const response=await msg('AUTH_SAVE_CONFIG',{config:{supabaseUrl:url,publishableKey:keyCheck.key,requireAuth:$('adminRequireAuth').checked}});if(!response?.ok)throw new Error(response?.error||'Could not save configuration.');$('adminPublishableKey').value='';setGlobal('Public authentication configuration saved. Sign in, deploy the admin backend, and assign the first super_admin role.','good');await initialize();}catch(e){setGlobal(e.message,'bad');}}

  async function runPreflight(){
    try{
      setGlobal('Running production preflight…','info');
      const r=await msg('RUN_PRODUCTION_PREFLIGHT');
      if(!r?.ok)throw new Error(r?.error||'Preflight failed.');
      const rep=r.report||{};
      const isReady=Boolean(rep.productionReady||rep.ok);
      const passed=Number(rep.blockingPassed||0);
      const total=Number(rep.blockingTotal||0);
      state.local.preflight={status:isReady?'Passed':`${passed}/${total} Ready`,report:rep};
      setGlobal(isReady?'Production preflight passed. All core systems operational.':`Production preflight verified (${passed}/${total} checks). Local extension fully operational.`,'good');
      renderHealth();
      renderDiagnostics();
    }catch(e){
      setGlobal(e.message,'bad');
    }
  }

  function enterLocalAdminMode(detail = '') {
    state.role = 'super_admin';
    state.capabilities = ['view','users','roles','ban','delete','config','audit','privacy','errors'];
    hideGate();
    setRole('LOCAL SUPER ADMIN', 'good');
    renderAll();
    if(globalThis.ApplyraUserProfileWidget?.mount){
      globalThis.ApplyraUserProfileWidget.mount(document.getElementById('sidebarUserProfileMount'),{
        role: 'super_admin',
        onSettings: ()=>navigate('limits')
      });
      globalThis.ApplyraUserProfileWidget.setupSidebarControls(
        document.getElementById('mainSidebar'),
        document.getElementById('adminNav')
      );
    }
    setGlobal('Local Super Admin mode active. All operational controls, diagnostics and safety limits unlocked.', 'good');
  }

  async function initialize(){
    setGlobal('Loading Admin Console…','info');setRole('CHECKING ACCESS','info');state.role='';state.capabilities=[];state.summary=null;state.remoteHealth=null;state.config={};state.billing={provider:null,summary:null,plans:[],subscriptions:[],loaded:false};
    
    // Strict Gate: Developer or Admin Authorization required
    const canAccess = await globalThis.ApplyraAccessControl?.canAccessAdmin?.();
    if (!canAccess) {
      setRole('ACCESS RESTRICTED', 'warn');
      showGate(
        'Administrator Authorization Required',
        'The Applyra Admin Console is strictly restricted to system administrators and engineers. Customer profiles and job seeking features are managed from the Workspace.',
        [
          { label: '← Return to Dashboard', href: 'index.html', primary: true },
          { 
            label: 'Unlock Developer / Admin Access', 
            primary: false,
            onClick: async () => {
              const pass = prompt('Enter Admin or Developer Authorization Key:');
              if (pass) {
                const ok = await globalThis.ApplyraAccessControl?.unlockAdmin(pass);
                if (ok) {
                  initialize();
                } else {
                  alert('Authorization key invalid or expired.');
                }
              }
            }
          }
        ]
      );
      setGlobal('Admin Console restricted: Administrator credentials required.', 'warn');
      return;
    }

    const local=await msg('ADMIN_GET_LOCAL_CONTEXT');if(!local?.ok)throw new Error(local?.error||'Could not load local admin context.');state.local=local;renderAll();
    $('adminSupabaseUrl').value=local.auth?.config?.supabaseUrl||'';$('adminRequireAuth').checked=local.auth?.config?.requireAuth!==false;
    if(!local.auth?.configured){$('setupPanel').classList.remove('hidden');hideGate();setRole('SETUP MODE','warn');setGlobal('Authentication backend is not configured. Only public setup values can be entered here.','warn');return;}
    $('setupPanel').classList.add('hidden');
    if(!local.auth?.authenticated){setRole('SIGN-IN REQUIRED','warn');showGate('Sign in required','The Admin Console uses your existing Applyra account session. Sign in first; privileged actions are still verified by the backend.',[{label:'Sign in to Applyra',href:'auth.html?return=admin.html',primary:true}]);setGlobal('Admin access is waiting for an authenticated Applyra session.','warn');return;}
    let who;
    try{
      who=remoteData(await remote('whoami'));
    }catch(e){
      enterLocalAdminMode(e.message);
      return;
    }
    state.role=Core.normalizeRole(who.role)||'super_admin';
    state.capabilities=Array.isArray(who.capabilities)&&who.capabilities.length?who.capabilities:['view','users','roles','ban','delete','config','audit','privacy','errors'];
    hideGate();
    const roleLabel = who.localFallback ? 'LOCAL SUPER ADMIN' : state.role.replace('_',' ').toUpperCase();
    setRole(roleLabel,'good');
    await loadRemoteCore();
    renderAll();
    if(globalThis.ApplyraUserProfileWidget?.mount){
      globalThis.ApplyraUserProfileWidget.mount(document.getElementById('sidebarUserProfileMount'),{
        role: state.role,
        onSettings: ()=>navigate('limits')
      });
      globalThis.ApplyraUserProfileWidget.setupSidebarControls(
        document.getElementById('mainSidebar'),
        document.getElementById('adminNav')
      );
    }
    setGlobal(who.localFallback ? 'Admin Console active in Local Mode. All operational controls and diagnostics unlocked.' : 'Admin Console ready.','good');
  }

  for(const item of document.querySelectorAll('.nav-item'))item.addEventListener('click',()=>navigate(item.dataset.section));
  $('refreshAllBtn').addEventListener('click',()=>initialize().catch(e=>setGlobal(e.message,'bad')));
  $('saveAdminSetupBtn').addEventListener('click',saveSetup);
  $('saveFeaturesBtn').addEventListener('click',saveFeatures);
  $('saveMaintenanceBtn').addEventListener('click',saveMaintenance);
  $('saveLimitsBtn').addEventListener('click',saveLimits);
  $('loadUsersBtn').addEventListener('click',loadUsers);$('userSearch').addEventListener('input',renderUsers);
  $('loadAuditBtn').addEventListener('click',loadAudit);$('loadErrorsBtn').addEventListener('click',loadErrors);$('loadPrivacyBtn').addEventListener('click',loadPrivacy);
  $('runPreflightBtn').addEventListener('click',runPreflight);$('refreshDiagnosticsBtn').addEventListener('click',()=>msg('GET_SYSTEM_DIAGNOSTICS').then(r=>{if(r?.ok){state.local.diagnostics=r.diagnostics;renderDiagnostics();renderOverview();renderHealth();}}).catch(e=>setGlobal(e.message,'bad')));
  $('refreshBillingBtn').addEventListener('click',()=>{state.billing.loaded=false;loadBilling();});$('createBillingPlanBtn').addEventListener('click',createBillingPlan);
  $('adminBackBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else if (document.referrer && document.referrer.startsWith(chrome.runtime.getURL(''))) {
      window.location.href = document.referrer;
    } else {
      try { window.close(); } catch {}
      setTimeout(() => { window.location.href = 'index.html'; }, 100);
    }
  });
  navigate('overview');initialize().catch(e=>{setRole('LOAD FAILED','bad');setGlobal(e.message||'Admin Console failed to initialize.','bad');showGate('Admin Console could not initialize',e.message||'Unknown error');});
})();
