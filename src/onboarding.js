(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const msg=(type,payload={})=>globalThis.NowCurryMessage.sendRuntime(chrome,{type,...payload},{timeoutMs:15000});
  function setStep(name,ready,label,text){const row=$(`step-${name}`);row.classList.toggle('ready',Boolean(ready));row.classList.toggle('attention',!ready);$(`${name}State`).textContent=label;$(`${name}Text`).textContent=text;}
  async function refresh(){
    $('overall').textContent='Checking setup…';$('overallDetail').textContent='Reading verified extension state';
    const [auth,naukri,team,cloud]=await Promise.all([
      msg('AUTH_GET_STATUS').catch(e=>({ok:false,error:e.message})),
      msg('CHECK_NAUKRI_SESSION').catch(e=>({ok:false,error:e.message})),
      msg('GET_TEAM_WORKSPACE').catch(e=>({ok:false,error:e.message})),
      msg('GET_CLOUD_MIGRATION_STATUS').catch(e=>({ok:false,error:e.message}))
    ]);
    const stored=await chrome.storage.local.get(['profile','applyEngineAnswerVault','onboardingState']);
    const authReady=Boolean(auth?.configured&&auth?.authenticated);
    setStep('account',authReady,authReady?'Ready':auth?.configured?'Sign in':'Not configured',authReady?`Signed in as ${auth.user?.email||'authenticated account'}.`:auth?.configured?'Authentication backend is configured, but there is no active session.':'Production authentication has not been configured yet.');
    const nReady=Boolean(naukri?.ok&&(naukri.connection?.state==='connected'||naukri.connection?.sessionState==='authenticated'));
    setStep('naukri',nReady,nReady?'Connected':'Not connected',naukri?.connection?.reason||'Open Naukri and sign in there; Applyra does not collect the credentials.');
    const p=stored.profile||{};const pReady=Boolean(p.headline||p.summary||(Array.isArray(p.skills)&&p.skills.length)||(Array.isArray(p.roles)&&p.roles.length));
    setStep('profile',pReady,pReady?'Profile found':'Needs review',pReady?`Saved profile data detected${p.updatedAt?` · updated ${new Date(p.updatedAt).toLocaleString()}`:''}.`:'No meaningful saved profile data was detected yet.');
    const v=stored.applyEngineAnswerVault||{};const fields=Object.values(v).filter(x=>Array.isArray(x)?x.length:Boolean(String(x??'').trim())).length;const vReady=fields>=3;
    setStep('vault',vReady,vReady?'Started':'Needs review',vReady?`${fields} approved Answer Vault fields contain values.`:'Open Answer Vault and add only facts you approve for screening assistance.');
    const c=cloud?.state||{};const cReady=c.status==='verified';
    setStep('cloud',cReady,cReady?'Verified':auth?.configured?'Not migrated':'Not configured',cReady?`Cloud workspace verified${c.lastVerifiedAt?` · ${new Date(c.lastVerifiedAt).toLocaleString()}`:''}.`:'Cloud migration is not considered ready until the backend schema is deployed, data is pushed, and Applyra verifies the remote row.');
    const ready=[authReady,nReady,pReady,vReady,cReady].filter(Boolean).length;
    $('overall').textContent=`${ready} of 5 setup checks verified`;$('overallDetail').textContent=ready===5?'Production-foundation onboarding is complete.':'You can use local features while unfinished production setup remains clearly visible.';
    if(ready===5){await chrome.storage.local.set({onboardingState:{completed:true,completedAt:new Date().toISOString(),updatedAt:new Date().toISOString()}});}
  }
  $('refresh').addEventListener('click',refresh);
  $('accountBtn').addEventListener('click',()=>location.href=chrome.runtime.getURL('auth.html?return=onboarding.html'));
  $('naukriBtn').addEventListener('click',()=>chrome.tabs.create({url:'https://www.naukri.com/mnjuser/profile'}));
  $('naukriCheck').addEventListener('click',refresh);
  $('profileBtn').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('index.html')}));
  $('vaultBtn').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('apply-engine.html#answers')}));
  $('cloudBtn').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('apply-engine.html#business')}));
  $('workspaceBtn').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('index.html')}));
  $('automationBtn').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('apply-engine.html')}));
  $('onboardingBackBtn')?.addEventListener('click', (e) => {
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
  refresh().catch(e=>{$('overall').textContent='Setup check failed';$('overallDetail').textContent=String(e?.message||e);});
})();
