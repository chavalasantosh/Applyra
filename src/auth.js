(function(){
  'use strict';
  const Core=globalThis.NowCurryAuthCore;
  const $=id=>document.getElementById(id);
  let mode='signin';
  let lastStatus=null;

  function msg(type,payload={}){return globalThis.NowCurryMessage.sendRuntime(chrome,{type,...payload},{timeoutMs:20000});}
  function setStatus(text,kind='info'){const el=$('status');el.textContent=text||'';el.className=`status ${text?'show ':''}${kind}`.trim();}
  function setBusy(busy){['googleBtn','linkedinBtn','outlookBtn','emailSubmit','saveSetupBtn','signoutBtn','checkNaukriBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=Boolean(busy);});}
  function setMode(next){mode=next==='signup'?'signup':'signin';$('signinTab').classList.toggle('active',mode==='signin');$('signupTab').classList.toggle('active',mode==='signup');$('confirmWrap').classList.toggle('hidden',mode!=='signup');$('fullNameWrap').classList.toggle('hidden',mode!=='signup');$('phoneWrap').classList.toggle('hidden',mode!=='signup');$('dobWrap').classList.toggle('hidden',mode!=='signup');$('dobNote').classList.toggle('hidden',mode!=='signup');$('password').autocomplete=mode==='signup'?'new-password':'current-password';$('confirmPassword').required=mode==='signup';$('fullName').required=mode==='signup';$('phone').required=mode==='signup';$('emailSubmit').textContent=mode==='signup'?'Create account':'Sign in';}
  function safeReturn(){
    const raw=new URLSearchParams(location.search).get('return');
    if(!raw) return '';
    const allowed=new Set(['index.html','apply-engine.html','popup.html','test-lab.html','onboarding.html','admin.html','billing.html','career-suite.html','naukri-profile.html','company-intel.html']);
    return allowed.has(raw)?raw:'';
  }
  function goBack(){
    const ret = safeReturn();
    location.replace(chrome.runtime.getURL(ret || 'index.html'));
  }
  function initials(name,email){const source=String(name||email||'AP').trim();const parts=source.split(/\s+/).filter(Boolean);return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:source.slice(0,2)).toUpperCase();}
  async function render(status){
    lastStatus=status;
    const configured=Boolean(status?.configured);
    const authed=Boolean(status?.authenticated);
    $('authForms').classList.toggle('hidden',authed);
    $('accountView').classList.toggle('show',authed);
    $('title').textContent=authed?'Your Applyra account':'Sign in to Applyra';
    $('subtitle').textContent=authed?'Account authentication is active. Connect job portals separately.':'One account for your private career workspace. Portal passwords never pass through Applyra.';
    for(const id of ['googleBtn','linkedinBtn','outlookBtn','emailSubmit']){const el=$(id);el.disabled=false;el.title=configured?'':'Configure authentication in the Admin Console first.';}
    $('supabaseUrl').value=status?.config?.supabaseUrl||'';
    $('requireAuth').checked=status?.config?.requireAuth!==false;
    {
      const oauth=status?.redirectUrl||chrome.identity.getRedirectURL('nowcurry-auth');
      const email=status?.emailConfirmationUrl||(status?.config?.supabaseUrl?`${status.config.supabaseUrl}/functions/v1/auth-confirmed`:'');
      $('redirectHint').textContent=`OAuth redirect allow-list: ${oauth}** · Email confirmation redirect/Site URL: ${email||'configure Supabase first'}`;
    }
    if(!configured){
      const isDev = await globalThis.ApplyraAccessControl?.isDevMode?.();
      if (isDev) {
        const setupEl = $('setup');
        if (setupEl) {
          setupEl.classList.remove('hidden');
          setupEl.open = true;
        }
        setStatus('Developer Mode: Supabase authentication is not configured yet. Configure below or test locally.','info');
      } else {
        setStatus('Welcome to Applyra. Enter your credentials or continue to your workspace.','info');
      }
    }
    if(authed){
      const user=status.user||{};$('accountName').textContent=user.displayName||'Signed in';$('accountEmail').textContent=user.email||'';$('accountProvider').textContent=`Provider: ${status.providerLabel||'Account'}${status.persistent?' · remembered on this browser':' · session only'}`;
      const a=$('avatar');a.textContent=initials(user.displayName,user.email);a.innerHTML='';
      if(user.avatarUrl){const img=document.createElement('img');img.src=user.avatarUrl;img.alt='';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{a.innerHTML='';a.textContent=initials(user.displayName,user.email);},{once:true});a.appendChild(img);}else a.textContent=initials(user.displayName,user.email);
      await checkNaukri(false);
    }
  }
  async function refresh(){const status=await msg('AUTH_GET_STATUS');if(!status?.ok)throw new Error(status?.error||'Could not read authentication state.');await render(status);return status;}
  async function ensureProviderPermission(){
    const config=lastStatus?.config;if(!config?.supabaseUrl)throw new Error('Configure authentication first.');
    const origin=Core.hostPattern(config);if(!origin)throw new Error('Invalid Supabase project URL.');
    const has=await chrome.permissions.contains({origins:[origin]});if(has)return true;
    return chrome.permissions.request({origins:[origin]});
  }
  async function oauth(provider){
    const label=provider==='google'?'Google':provider==='linkedin_oidc'?'LinkedIn':'Microsoft';
    setBusy(true);setStatus(`Opening ${label}…`,'info');
    try{if(!(await ensureProviderPermission()))throw new Error('Supabase host permission is required for authentication.');const r=await msg('AUTH_OAUTH',{provider,persistent:$('remember').checked});if(!r?.ok)throw new Error(r?.error||'Authentication failed.');setStatus('Signed in securely.','good');await render(r.status);}
    catch(e){setStatus(e.message||'Authentication failed.','bad');}finally{setBusy(false);}
  }
  async function submitEmail(event){
    event.preventDefault();setBusy(true);setStatus('', 'info');
    try{
      const email=$('email').value.trim(),password=$('password').value;
      const fullName=$('fullName').value.trim(),phone=$('phone').value.trim(),dob=$('dob').value.trim();
      if(mode==='signup'&&password!==$('confirmPassword').value)throw new Error('Passwords do not match.');
      if(mode==='signup'&&!Core.normalizeFullName(fullName))throw new Error('Enter your full name.');
      if(mode==='signup'&&!Core.normalizePhone(phone))throw new Error('Enter a valid phone number.');
      if(mode==='signup'&&dob&&!Core.normalizeDob(dob))throw new Error('Enter a valid date of birth, or leave it blank.');
      const policy=Core.passwordPolicy(password);if(!policy.ok)throw new Error(policy.error);
      if(!Core.normalizeEmail(email))throw new Error('Enter a valid email address.');
      if(!(await ensureProviderPermission()))throw new Error('Supabase host permission is required for authentication.');
      const type=mode==='signup'?'AUTH_SIGN_UP_EMAIL':'AUTH_SIGN_IN_EMAIL';
      const extra=mode==='signup'?{fullName,phone,dob}:{};
      const r=await msg(type,{email,password,persistent:$('remember').checked,...extra});
      $('password').value='';$('confirmPassword').value='';
      if(!r?.ok)throw new Error(r?.error||'Authentication failed.');
      if(r.status?.authenticated){setStatus(mode==='signup'?'Account created and signed in.':'Signed in securely.','good');await render(r.status);}else{setStatus(r.message||'Check your email to confirm your account, then sign in.','good');}
    }catch(e){$('password').value='';$('confirmPassword').value='';setStatus(e.message||'Authentication failed.','bad');}finally{setBusy(false);}
  }
  async function saveSetup(){
    setBusy(true);setStatus('Validating configuration…','info');
    try{
      const url=Core.normalizeSupabaseUrl($('supabaseUrl').value);const keyCheck=Core.validatePublishableKey($('publishableKey').value);
      if(!url)throw new Error('Use a valid https://…supabase.co project URL.');if(!keyCheck.ok)throw new Error(keyCheck.error);
      const origin=`${url}/*`;const granted=await chrome.permissions.request({origins:[origin]});if(!granted)throw new Error('Permission to contact the Supabase auth domain was not granted.');
      const r=await msg('AUTH_SAVE_CONFIG',{config:{supabaseUrl:url,publishableKey:keyCheck.key,requireAuth:$('requireAuth').checked}});if(!r?.ok)throw new Error(r?.error||'Could not save configuration.');$('publishableKey').value='';setStatus('Secure authentication configuration saved.','good');await render(r.status);
    }catch(e){setStatus(e.message||'Could not save auth configuration.','bad');}finally{setBusy(false);}
  }
  async function signout(){setBusy(true);try{const r=await msg('AUTH_SIGN_OUT');if(!r?.ok)throw new Error(r?.error||'Sign out failed.');setStatus('Signed out.','good');await render(r.status);}catch(e){setStatus(e.message,'bad');}finally{setBusy(false);}}
  async function switchUser(){setBusy(true);try{const r=await msg('AUTH_SIGN_OUT');if(r?.status)await render(r.status);setMode('signin');setStatus('Signed out of current account. Please sign in with your other account.','info');}catch(e){setStatus(e.message||'Could not switch account.','bad');}finally{setBusy(false);}}
  async function checkNaukri(show=true){
    try{const r=await msg('CHECK_NAUKRI_SESSION');const c=r?.connection;$('naukriState').textContent=c?.reason||'Open Naukri, sign in there, then check again.';if(show)setStatus(r?.ok?'Naukri browser session connected.':'Naukri is not connected yet.',r?.ok?'good':'info');}catch(e){if(show)setStatus(e.message||'Could not check Naukri.','bad');}
  }

  $('signinTab').addEventListener('click',()=>setMode('signin'));$('signupTab').addEventListener('click',()=>setMode('signup'));
  $('showPassword').addEventListener('click',()=>{const input=$('password');const next=input.type==='password'?'text':'password';input.type=next;$('showPassword').textContent=next==='password'?'Show':'Hide';});
  $('googleBtn').addEventListener('click',()=>oauth('google'));$('linkedinBtn').addEventListener('click',()=>oauth('linkedin_oidc'));$('outlookBtn').addEventListener('click',()=>oauth('azure'));$('emailForm').addEventListener('submit',submitEmail);$('saveSetupBtn').addEventListener('click',saveSetup);$('adminConsoleBtn').addEventListener('click',()=>location.href='admin.html');$('billingBtn').addEventListener('click',()=>location.href='billing.html');$('signoutBtn').addEventListener('click',signout);$('switchUserBtn')?.addEventListener('click',switchUser);$('continueBtn').addEventListener('click',goBack);$('openNaukriBtn').addEventListener('click',()=>chrome.tabs.create({url:'https://www.naukri.com/mnjuser/profile'}));$('checkNaukriBtn').addEventListener('click',()=>checkNaukri(true));
  $('authBackBtn')?.addEventListener('click', (e) => { e.preventDefault(); goBack(); });

  // Developer mode easter egg (5 clicks on version trigger toggles dev mode)
  let devClicks = 0;
  const versionTrigger = $('versionTrigger');
  if (versionTrigger) {
    versionTrigger.addEventListener('click', async () => {
      devClicks++;
      if (devClicks >= 5) {
        devClicks = 0;
        const isDev = await globalThis.ApplyraAccessControl?.toggleDevMode?.();
        setStatus(isDev ? 'Developer Mode Enabled. Setup options unlocked.' : 'Developer Mode Disabled.', 'good');
        const setupEl = $('setup');
        if (setupEl) {
          setupEl.classList.toggle('hidden', !isDev);
          setupEl.open = isDev;
        }
      }
    });
  }

  setMode('signin');refresh().catch(e=>setStatus(e.message||'Authentication failed to initialize.','bad'));
})();
