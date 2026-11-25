const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(process.env.APPLYRA_BRIDGE_TEST_FILE||path.join(__dirname,'../src/injected-bridges.js'),'utf8');
function node(tag,label='',attrs={}){return {tagName:tag,textContent:label,innerText:label,style:{},className:'',clicks:0,getAttribute(k){return attrs[k]??null;},hasAttribute(k){return k in attrs;},querySelector(){return null;},querySelectorAll(){return [];},getClientRects(){return [{}];},contains(n){return this===n;},scrollIntoView(){},dispatchEvent(){},click(){this.clicks++;},closest(){return null;},matches(s){return tag==='INPUT'&&s.includes('checkbox');}};}
function fixture({checkbox=false,broken=false,button=true,heading=false,bulk=false,url=true}={}){
 const title=node(heading?'H2':'A','Python Engineer');const anchor=node('A','Python Engineer');anchor.href=url?'https://www.naukri.com/job-listings-python-engineer-123456789012':'';
 const apply=button?node('BUTTON','Apply'):null;const check=checkbox?node('INPUT','',{type:'checkbox'}):null;if(check){check.checked=false;check.click=function(){this.clicks++;if(!broken)this.checked=!this.checked;};}
 const card=node('ARTICLE','Python Engineer · Example',{ 'data-job-id':'123456789012'});
 card.querySelector=s=>{if(s.includes('input[type=\'checkbox\']:checked'))return check?.checked?check:null;if(s.includes('input[type=\'checkbox\']'))return check;if(s.includes('a[href'))return s.startsWith('a.title')?title:anchor;return null;};
 card.querySelectorAll=()=>[...(apply?[apply]:[]),title];card.contains=n=>[card,title,anchor,check,apply].includes(n);
 const bulkButton=bulk?node('BUTTON','Apply'):null;
 const doc={body:{innerText:'Recommended jobs for you'},querySelectorAll(s){if(s==='label[for]')return [];if(s.includes('.srp-jobtuple-wrapper'))return [card];if(s.startsWith('button')||s.startsWith('[class'))return bulkButton?[bulkButton]:[];return [];},querySelector(){return null;}};
 let tick=0;class Clock extends Date {static now(){tick+=200;return tick;}}
 const ctx={document:doc,location:{pathname:'/mnjuser/recommendedjobs',href:'https://www.naukri.com/mnjuser/recommendedjobs',origin:'https://www.naukri.com'},URL,Date:Clock,setTimeout:f=>{f();},window:{},MouseEvent:function(){},getComputedStyle:n=>({display:n.style.display||'block',visibility:'visible'})};vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,apply,check,title,bulkButton,run:()=>ctx.naukriRecommendedApplyBridge('select-and-apply',{batchSize:1})};
}
test('direct Apply clicks the element once, not a boolean',async()=>{const f=fixture();const r=await f.run();assert.equal(r.ok,true);assert.equal(f.apply.clicks,1);assert.equal(r.inCardApply,true);});
test('heading-only card opens job URL instead of reporting an imaginary click',async()=>{const f=fixture({button:false,heading:true});const r=await f.run();assert.equal(r.ok,true);assert.equal(r.inCardApply,false);assert.equal(r.clicked,false);assert.match(r.openJobUrl,/job-listings/);assert.equal(f.title.clicks,0);});
test('broken checkbox falls back to actual in-card Apply',async()=>{const f=fixture({checkbox:true,broken:true});const r=await f.run();assert.equal(r.ok,true);assert.equal(f.apply.clicks,1);assert.equal(r.fallbackUsed,true);});
test('checked job without bulk button uses actual in-card Apply',async()=>{const f=fixture({checkbox:true});const r=await f.run();assert.equal(r.ok,true);assert.equal(f.apply.clicks,1);});
test('verified checkbox and bulk Apply still work',async()=>{const f=fixture({checkbox:true,bulk:true});const r=await f.run();assert.equal(r.ok,true);assert.equal(f.bulkButton.clicks,1);assert.equal(f.apply.clicks,0);});
test('missing action and job URL fails explicitly',async()=>{const f=fixture({button:false,heading:true,url:false});const r=await f.run();assert.equal(r.ok,false);assert.equal(f.title.clicks,0);});
function detail(){
 const f=fixture(), apply=node('BUTTON','Apply');let toast=null,modal=null;
 f.ctx.location.pathname='/job-listings-first-123456789012';
 f.ctx.document.body.innerText='Python Engineer';
 f.ctx.document.querySelectorAll=()=>[apply];
 f.ctx.document.querySelector=s=>s.includes('chatbot')?modal:s.includes('snackbar')?toast:null;
 return {...f,apply,toast:n=>toast=n,modal:n=>modal=n,run:()=>f.ctx.naukriJobDetailApplyBridge()};
}
test('detail click is suppressed on same job but reset for next SPA job',()=>{const f=detail();assert.equal(f.run().status,'clicked');assert.equal(f.run().status,'waiting');assert.equal(f.apply.clicks,1);f.ctx.location.pathname='/job-listings-second-123456789013';assert.equal(f.run().status,'clicked');assert.equal(f.apply.clicks,2);});
test('failed native click remains retryable',()=>{const f=detail();f.apply.click=()=>{throw Error('click failed');};assert.equal(f.run().ok,false);f.apply.click=function(){this.clicks++;};assert.equal(f.run().status,'clicked');assert.equal(f.apply.clicks,1);});
test('failed submission toast is never an application success',()=>{const f=detail();f.toast(node('DIV','Application not submitted: error'));const r=f.run();assert.equal(r.status,'failed');assert.equal(r.ok,false);assert.equal(f.apply.clicks,0);});
test('CSS-hidden screening drawer does not block Apply',()=>{const f=detail(),m=node('DIV','Question');m.style.display='none';f.modal(m);assert.equal(f.run().status,'clicked');assert.equal(f.apply.clicks,1);});
