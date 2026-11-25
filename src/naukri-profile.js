const $ = (id) => document.getElementById(id);
const statusNode = $('status');
let currentProfile = null;
let profileTabId = null;

const text = (v) => String(v ?? '').trim();
const list = (v) => Array.isArray(v) ? v : [];
const safeJson = (v) => { try { return JSON.stringify(v); } catch { return ''; } };

function setStatus(message, tone='') {
  statusNode.textContent = message;
  statusNode.className = `status ${tone}`.trim();
}

function el(tag, cls='', content='') {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content !== undefined && content !== null) node.textContent = String(content);
  return node;
}

function button(label, action, opts={}) {
  const b = el('button', opts.primary ? 'primary small' : 'secondary small', label);
  b.disabled = Boolean(opts.disabled);
  b.addEventListener('click', action);
  return b;
}

function kvTable(values={}) {
  const dl = el('dl','kv');
  for (const [key,value] of Object.entries(values)) {
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && !value.length)) continue;
    dl.append(el('dt','',key));
    dl.append(el('dd','',Array.isArray(value) ? value.join(', ') : value));
  }
  if (!dl.children.length) dl.append(el('div','empty','No captured values in this section.'));
  return dl;
}

async function sendToProfileTab(tabId, payload) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, payload);
    if (res) return res;
  } catch {}
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => null);
  } catch {}
  return await chrome.tabs.sendMessage(tabId, payload).catch(e => ({ ok: false, error: e.message || String(e) }));
}

async function findProfileTab({openIfMissing=false}={}) {
  const tabs = await chrome.tabs.query({ url: ['https://www.naukri.com/*','https://*.naukri.com/*'] }).catch(()=>[]);
  for (const tab of tabs) {
    if (!tab.id) continue;
    const ping = await sendToProfileTab(tab.id, { type: 'PING' }).catch(() => null);
    if (ping?.pageMode === 'profile' || (ping?.diagnostics?.profileNodes > 0) || /\/profile|\/mnjuser\/profile/i.test(tab.url || '')) {
      profileTabId = tab.id;
      return tab;
    }
  }
  if (openIfMissing) {
    const tab = await chrome.tabs.create({url:'https://www.naukri.com/mnjuser/profile',active:false});
    profileTabId = tab.id || null;
    return tab;
  }
  profileTabId = null;
  return null;
}

async function profileAction(section, action='review', index=null, subsection='') {
  const tab = await findProfileTab({openIfMissing:true});
  if (!tab?.id) return setStatus('Could not open the Naukri profile tab.','error');
  if (!String(tab.url||'').includes('naukri.com/mnjuser')) {
    setStatus('Naukri profile opened. Wait for it to load, then retry the section action.');
    return;
  }
  const payload={type:'OPEN_PROFILE_SECTION',section,action};
  if (index !== null) payload.index=index;
  if (subsection) payload.subsection=subsection;
  const result=await sendToProfileTab(tab.id,payload);
  if (!result?.ok) setStatus(result?.error || `Could not ${action} ${section}.`,'error');
  else { await chrome.tabs.update(tab.id,{active:true}); setStatus(`${section}: ${action} opened on Naukri.`,'ok'); }
}

function capabilityActions(section, cap={}, extra={}) {
  const wrap=el('div','actions');
  wrap.append(button('Review',()=>profileAction(section,'review')));
  if (cap.canEdit) wrap.append(button('Edit',()=>profileAction(section,'edit')));
  if (cap.canAdd) wrap.append(button('Add',()=>profileAction(section,'add')));
  if (cap.canUpdate) wrap.append(button('Update',()=>profileAction(section,'update')));
  if (extra.download) wrap.append(button('Download',()=>profileAction(section,'download')));
  return wrap;
}

function card(title, section, body, opts={}) {
  const c=el('section',`card ${opts.wide?'wide':''} ${opts.private?'private':''}`.trim());
  const head=el('div','card-head');
  const titleWrap=el('div');
  const h=el('h2','',title);
  const cap=currentProfile?.naukriProfile?.sections?.[section] || {};
  const state=el('span',`section-state ${cap.present && !cap.loaded ? 'pending':''}`,cap.present ? (cap.loaded?'loaded':'pending') : 'not on page');
  h.append(state); titleWrap.append(h);
  if (opts.subtitle) titleWrap.append(el('small','',opts.subtitle));
  head.append(titleWrap, capabilityActions(section,cap,opts));
  c.append(head);
  const bd=el('div','card-body');
  bd.append(body); c.append(bd);
  return c;
}

function chips(items) {
  const wrap=el('div','chips');
  for (const item of list(items)) wrap.append(el('span','chip',item));
  if (!wrap.children.length) wrap.append(el('span','empty','No captured values.'));
  return wrap;
}

function itemList(rows, render, section='', allowEdit=false) {
  const wrap=el('div','list');
  list(rows).forEach((row,index)=>{
    const item=el('div','item');
    const top=el('div','item-row');
    const content=render(row,index);
    if (content instanceof Node) top.append(content); else top.append(el('strong','',content));
    if (allowEdit) top.append(button('Edit',()=>profileAction(section,'edit',index)));
    item.append(top); wrap.append(item);
  });
  if (!wrap.children.length) wrap.append(el('div','empty','No captured entries.'));
  return wrap;
}

function renderSummary(profile) {
  const p=profile?.naukriProfile||{}; const i=p.identity||{};
  const values=[['Current title',i.currentTitle||profile.headline],['Location',i.currentLocation||profile.currentLocation],['Experience',i.experienceText||`${profile.fullTimeYears||0} years`],['Current CTC',i.currentSalaryText||`${profile.currentSalary||0} LPA`],['Sections',`${p.diagnostics?.loadedSections||0}/${p.diagnostics?.presentSections||0} loaded`]];
  const root=$('summary'); root.replaceChildren();
  values.forEach(([k,v])=>{const s=el('div','stat');s.append(el('small','',k),el('strong','',v||'—'));root.append(s)});
}

function renderAccomplishments(a={}) {
  const root=el('div');
  const groups=[['Online profiles','onlineProfiles'],['Work samples','workSamples'],['Publications','publications'],['Presentations','presentations'],['Patents','patents'],['Certifications','certifications']];
  for (const [label,key] of groups) {
    const header=el('div','item-row'); header.append(el('div','subhead',label));
    header.append(button('Add',()=>profileAction('accomplishments','add',null,key)));
    root.append(header);
    const rows=list(a[key]);
    const block=el('div','list');
    rows.forEach((row,index)=>{const item=el('div','item');const r=el('div','item-row');const left=el('div');left.append(el('strong','',row.title||'Untitled')); if(row.provider)left.append(el('span','',row.provider)); if(row.details||row.validity)left.append(el('span','',row.details||row.validity)); if(row.link)left.append(el('span','',row.link)); if(row.description)left.append(el('p','',row.description));r.append(left,button('Edit',()=>profileAction('accomplishments','edit',index,key)));item.append(r);block.append(item)});
    if(!rows.length) block.append(el('div','empty','No entries.'));
    root.append(block);
  }
  return root;
}

function renderProfile(profile) {
  currentProfile=profile||{}; const p=currentProfile.naukriProfile||{}; const sections=$('sections'); sections.replaceChildren(); renderSummary(currentProfile);
  sections.append(card('Identity / top profile','top',kvTable({'Full name':p.identity?.fullName,'Current title':p.identity?.currentTitle,'Company':p.identity?.currentCompany,'Location':p.identity?.currentLocation,'Experience':p.identity?.experienceText,'Salary':p.identity?.currentSalaryText,'Notice period':p.identity?.noticePeriod,'Profile updated':p.identity?.profileUpdatedAt}),{wide:true}));
  sections.append(card('Resume','resume',kvTable({'File':p.resume?.fileName,'Uploaded':p.resume?.uploadedOn}),{download:Boolean(p.resume?.canDownload)}));
  sections.append(card('Resume headline','resumeHeadline',kvTable({'Headline':p.resumeHeadline}),{}));
  sections.append(card('Key skills','keySkills',chips(p.keySkills),{wide:true}));
  sections.append(card('Employment','employment',itemList(p.employment,(r)=>{const d=el('div');d.append(el('strong','',r.title||'Role'),el('span','',`${r.company||''}${r.type?' · '+r.type:''}${r.period?' · '+r.period:''}`));if(r.noticePeriod)d.append(el('span','',r.noticePeriod));if(r.description)d.append(el('p','',r.description));if(r.projects?.length)d.append(el('span','',`Projects: ${r.projects.join(', ')}`));if(r.topSkills?.length)d.append(el('span','',`Top skills: ${r.topSkills.join(', ')}`));return d},'employment',true),{wide:true}));
  sections.append(card('Education','education',itemList(p.education,(r)=>{const d=el('div');d.append(el('strong','',[r.level,r.specialization].filter(Boolean).join(' · ')),el('span','',[r.institution,r.period,r.mode].filter(Boolean).join(' · ')));return d},'education',true)));
  sections.append(card('IT skills','itSkills',itemList(p.itSkills,(r)=>{const d=el('div');d.append(el('strong','',r.skillText),el('span','',[r.lastUsed,r.experience].filter(Boolean).join(' · ')));return d},'itSkills',true)));
  sections.append(card('Projects','projects',itemList(p.projects,(r)=>{const d=el('div');d.append(el('strong','',r.title),el('span','',[r.organization,r.period].filter(Boolean).join(' · ')));if(r.description)d.append(el('p','',r.description));return d},'projects',true),{wide:true}));
  sections.append(card('Profile summary','profileSummary',kvTable({'Summary':p.profileSummary}),{wide:true}));
  sections.append(card('Accomplishments','accomplishments',renderAccomplishments(p.accomplishments||{}),{wide:true}));
  sections.append(card('Career profile','careerProfile',kvTable(p.careerProfile?.fields||{}),{wide:true}));
  const privateRoot=el('details'); const privSummary=el('summary','','Private profile fields (local mirror only)'); privateRoot.append(privSummary); privateRoot.append(kvTable({...p.private?.personal?.fields,'Phone':p.private?.contact?.phone,'Email':p.private?.contact?.email}));
  privateRoot.append(el('div','subhead','Languages')); privateRoot.append(itemList(p.private?.personal?.languages,(r)=>`${r.language} · ${r.proficiency} · R:${r.read?'Y':'N'} W:${r.write?'Y':'N'} S:${r.speak?'Y':'N'}`));
  sections.append(card('Personal details','personalDetails',privateRoot,{private:true,wide:true}));
  sections.append(card('Diversity & inclusion','diversity',kvTable(p.private?.diversity?.fields||{}),{private:true}));
  sections.append(card('Quick links','quickLinks',itemList(p.quickLinks,(r)=>`${r.label}${r.action?' · '+r.action:''}`)));
}

function changedLegacyFields(before={}, after={}) {
  const fields=['headline','summary','currentLocation','roles','locations','skills','fullTimeYears','internshipYears','currentSalary','salaryMin','salaryMax','noticePeriodDays','workHistory','education','certifications'];
  return fields.filter((key)=>safeJson(before[key])!==safeJson(after[key]));
}

async function saveCapture(profile) {
  const stored=await chrome.storage.local.get(['profile','profileRevisions']);
  const before=stored.profile||{};
  const now=new Date().toISOString();
  const merged={...before,...profile,source:'naukri-profile',sourceLabel:'Captured from Naukri',updatedAt:now,capturedAt:profile.capturedAt||now};
  const revision={id:`profile-revision-${Date.now()}`,capturedAt:merged.capturedAt,source:'naukri-profile',sourceUrl:merged.sourceUrl||'',reason:'direct Naukri DOM capture',changedFields:changedLegacyFields(before,merged),profile:merged};
  const revisions=[revision,...list(stored.profileRevisions)].slice(0,100);
  await chrome.storage.local.set({profile:merged,profileRevisions:revisions});
  return merged;
}

async function captureNow() {
  const b=$('capture'); b.disabled=true; const old=b.textContent; b.textContent='Capturing…';
  try {
    const tab=await findProfileTab({openIfMissing:false});
    if(!tab?.id){ await findProfileTab({openIfMissing:true}); setStatus('Opened Naukri profile. Let it finish loading, then click Capture & save now again.'); return; }
    setStatus('Walking every mapped Naukri profile section and waiting for lazy sections…');
    let result=await sendToProfileTab(tab.id,{type:'EXTRACT_PROFILE',waitMs:30000});
    if(!result?.ok && (result?.partial || /timed out|finish rendering|receiving end|message port/i.test(String(result?.error||'')))) {
      setStatus('Naukri is still hydrating the profile. Retrying this capture automatically…');
      await new Promise(resolve=>setTimeout(resolve,2500));
      result=await sendToProfileTab(tab.id,{type:'EXTRACT_PROFILE',waitMs:30000});
    }
    if(!result?.ok && !result?.profile) throw new Error(result?.error||'Profile capture failed.');
    const profileData = result.profile || result;
    const saved=await saveCapture(profileData);
    renderProfile(saved);
    const loaded=result.diagnostics?.loadedProfileSections?.length ?? saved.naukriProfile?.diagnostics?.loadedSections ?? 0;
    const present=saved.naukriProfile?.diagnostics?.presentSections ?? 0;
    setStatus(`Captured and saved the exact Naukri map. ${loaded}/${present} detected sections loaded. Matching fields and the private mirror were kept separate.`,'ok');
  } catch(e) { setStatus(e.message||String(e),'error'); }
  finally { b.disabled=false;b.textContent=old; }
}

$('capture').addEventListener('click',captureNow);
$('open-naukri').addEventListener('click',async()=>{const t=await findProfileTab({openIfMissing:true});if(t?.id)chrome.tabs.update(t.id,{active:true})});
$('backBtn')?.addEventListener('click', (e) => {
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


chrome.storage.onChanged?.addListener((changes, area) => {
  if (area !== 'local' || !changes.profile?.newValue) return;
  const next=changes.profile.newValue||{};
  if(next.naukriProfile?.source==='naukri-direct-dom' || next.source==='naukri-profile'){
    renderProfile(next);
    setStatus(`Naukri profile captured automatically ${next.capturedAt||next.updatedAt||''}. No manual page scrolling was required.`,'ok');
  }
});
(async function init(){
  const stored=await chrome.storage.local.get(['profile']);
  const profile=stored.profile||{};
  renderProfile(profile);
  if(profile.naukriProfile?.source==='naukri-direct-dom') setStatus(`Loaded saved direct Naukri profile captured ${profile.naukriProfile.capturedAt||''}.`,'ok');
  else setStatus('No full direct Naukri mirror saved yet. Open your Naukri profile; Applyra will walk the lazy sections and capture automatically. Manual Capture remains available as a retry.');
  if (new URLSearchParams(location.search).get('capture') === '1') setTimeout(captureNow, 250);
})();
