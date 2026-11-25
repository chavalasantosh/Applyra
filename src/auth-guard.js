(function(){
  'use strict';
  const current=document.currentScript;
  const page=current?.dataset?.page||'';
  const entry=current?.dataset?.entry||'';
  const overlay=document.createElement('div');
  overlay.id='nowcurry-auth-guard';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#f7f9fc;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif;color:#17213a';
  overlay.innerHTML='<div style="text-align:center"><div style="font-weight:900;letter-spacing:.12em;font-size:11px;color:#1459df">APPLYRA</div><div style="margin-top:10px;font-size:13px">Checking secure session…</div></div>';
  document.documentElement.appendChild(overlay);

  function loadScript(src,type='classic'){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;if(type==='module')s.type='module';s.onload=()=>{try{s.remove();}catch{}resolve();};s.onerror=()=>{try{s.remove();}catch{}reject(new Error(`Could not load ${src}`));};(document.body||document.documentElement).appendChild(s);});}
  async function boot(){
    try{
      const status=await globalThis.NowCurryMessage.sendRuntime(chrome,{type:'AUTH_GET_STATUS'},{timeoutMs:12000});
      if(status?.configured&&status?.config?.requireAuth!==false&&!status?.authenticated){
        const ret=page==='index'?'index.html':page==='test-lab'?'test-lab.html':page==='career-suite'?'career-suite.html':page==='naukri-profile'?'naukri-profile.html':'apply-engine.html';
        location.replace(chrome.runtime.getURL(`auth.html?return=${encodeURIComponent(ret)}`));return;
      }
      if(document.readyState==='loading') await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
      overlay.remove();
      if(page==='index'){
        if(entry) await loadScript(entry,'module');
        await loadScript('./dashboard-radar.js');
        await loadScript('./extractor-universal.js');
        await loadScript('./dashboard-overview.js');
      }else if(page==='apply-engine'){
        await loadScript('./apply-engine.js');
      }else if((page==='test-lab'||page==='career-suite'||page==='naukri-profile')&&entry){
        await loadScript(entry);
      }
    }catch(error){
      if(!overlay.parentNode) (document.body||document.documentElement).appendChild(overlay);
      overlay.innerHTML=`<div style="max-width:420px;padding:24px;text-align:center"><strong>Applyra could not verify the local session.</strong><div style="margin-top:8px;font-size:12px;color:#6b7488">${String(error?.message||error)}</div></div>`;
    }
  }
  boot();
})();
