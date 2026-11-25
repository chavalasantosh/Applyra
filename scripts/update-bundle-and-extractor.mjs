import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

// --- 1. Modify src/assets/main-5HBZNLr_.js ---
const mainPath = path.join(ROOT_DIR, 'src', 'assets', 'main-5HBZNLr_.js');
let mainContent = fs.readFileSync(mainPath, 'utf8');

// A. Brand lockup text: Replace "Applyra <em>Career Intelligence</em>" and "<small>Local-first</small>" with only "Applyra"
const brandTarget = '(0,L.jsxs)(`span`,{children:[`Applyra `,(0,L.jsx)(`em`,{children:`Career Intelligence`})]}),(0,L.jsx)(`small`,{children:`Local-first`})';
const brandRepl = '(0,L.jsx)(`span`,{className:`brand-title`,children:`Applyra`}),(0,L.jsx)(`small`,{style:{display:`none`},children:``})';
if (mainContent.includes(brandTarget)) {
  mainContent = mainContent.replace(brandTarget, brandRepl);
  console.log('[main.js] Brand header simplified strictly to Applyra.');
} else {
  console.warn('[main.js] Warning: brandTarget not matched!');
}

// B. Product metadata in downloads/exports:
mainContent = mainContent.replaceAll('product:`Applyra Career Intelligence`', 'product:`Applyra`');
console.log('[main.js] Updated product export strings to "Applyra".');

// C. We(e, preferHistory): Tab prioritizer
const weTarget = 'async function We(e){if(Number.isFinite(e)&&e>0){let t=await chrome.tabs.get(e).catch(()=>null);if(t&&Br(t.url))return t}let t=await chrome.tabs.query({}),n=e=>{let t=String(e.url||``).toLowerCase();return/\\/myapply\\/history/.test(t)?5:/\\/(?:[^/?#]+-)?jobs-in-|\\/[^/?#]+-jobs(?:-|\\?|$)/.test(t)?4:/recommendedjobs|jobsearch|search/.test(t)?3:e.active?2:1};return t.filter(e=>Br(e.url)).sort((e,t)=>n(t)-n(e)||Number(t.lastAccessed||0)-Number(e.lastAccessed||0))[0]||null}';

const weRepl = 'async function We(e,preferHistory=!1){if(Number.isFinite(e)&&e>0){let t=await chrome.tabs.get(e).catch(()=>null);if(t&&Br(t.url))return t}let t=await chrome.tabs.query({}),n=e=>{let t=String(e.url||``).toLowerCase();if(preferHistory)return/\\/myapply\\/history/.test(t)?6:e.active?4:1;if(/\\/(?:[^/?#]+-)?jobs-in-|\\/[^/?#]+-jobs(?:-|\\?|$)|jobsearch|search/.test(t))return 6;if(/recommendedjobs|mnjuser\\/recommendedjobs|\\/mnjuser\\/feed/.test(t))return 5;if(e.active&&Br(e.url))return 4;if(/\\/myapply\\/history/.test(t))return 2;return 1};return t.filter(e=>Br(e.url)).sort((e,t)=>n(t)-n(e)||Number(t.lastAccessed||0)-Number(e.lastAccessed||0))[0]||null}';

if (mainContent.includes(weTarget)) {
  mainContent = mainContent.replace(weTarget, weRepl);
  console.log('[main.js] Fixed We() tab selection to prioritize search results and demote myapply/history.');
} else {
  console.warn('[main.js] Warning: weTarget not matched!');
}

// D. ct(e={}): Search navigation & routing fix
// Locate the segment from `let o=t;try{let i=new URLSearchParams(window.location.search)` to `c={...c,pageMode:[`search-results`,`application-history`].includes(c?.pageMode)?c.pageMode:(s.url.includes(`myapply`)?`application-history`:`search-results`)};`
const ctOldSegment = 'let o=t;try{let i=new URLSearchParams(window.location.search),s=await We(Number(i.get(`sourceTab`)));if(t){let e=t.next?.url||t.lastPage||t.sourcePage;e&&(!s?.id||s.url!==e)&&(s=await chrome.tabs.create({url:e,active:!1}),await Lr(900))}if(!s?.id)throw Error(`Open Naukri My Applications or a Search Results page, then start from the extension button on that tab.`);let c=await Ke(s.id);if(c?.diagnostics?.historyCards>0||/\\/myapply|application/i.test(s.url||``)){c={...c,pageMode:`application-history`}}else if(c?.diagnostics?.jobCards>0||c?.diagnostics?.jobLinks>0||/(?:job|search|recommend|mnjuser|feed)/i.test(s.url||``)){c={...c,pageMode:`search-results`}}else if(![`search-results`,`application-history`].includes(c?.pageMode)){let targetUrl=(String(e?.label||S).toLowerCase().includes(`application`)||String(e?.sourceMode||``).includes(`application`))?`https://www.naukri.com/myapply/history`:`https://www.naukri.com/mnjuser/recommendedjobs`;v(e=>({...e,message:`Opening ${targetUrl.includes(`myapply`)?`My Applications`:`Search Results`}…`}));try{await chrome.tabs.update(s.id,{url:targetUrl});await Lr(1800);let fresh=await Ke(s.id).catch(()=>null);fresh&&(c=fresh)}catch{}}c={...c,pageMode:[`search-results`,`application-history`].includes(c?.pageMode)?c.pageMode:(s.url.includes(`myapply`)?`application-history`:`search-results`)};';

const ctNewSegment = 'let o=t;try{let urlParams=new URLSearchParams(window.location.search),searchLabel=String(e.label||S||``).trim(),isExplicitHistory=e.sourceMode===`application-history`||/application|applied|myapply/i.test(searchLabel),s=await We(Number(urlParams.get(`sourceTab`)),isExplicitHistory);if(t){let e=t.next?.url||t.lastPage||t.sourcePage;e&&(!s?.id||s.url!==e)&&(s=await chrome.tabs.create({url:e,active:!1}),await Lr(900))}let targetSearchUrl=``;if(searchLabel&&!isExplicitHistory){let slug=encodeURIComponent(searchLabel.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``));targetSearchUrl=`https://www.naukri.com/${slug?slug+`-jobs`:`jobs`}?k=${encodeURIComponent(searchLabel)}`}if(!s?.id){if(targetSearchUrl){v(el=>({...el,message:`Opening Naukri search for \"${searchLabel}\"…`})),s=await chrome.tabs.create({url:targetSearchUrl,active:!1}),await Lr(3000)}else throw Error(`Open a Naukri search results page or recommended jobs in Chrome, then start extraction.`)}if(targetSearchUrl){let currentUrl=String(s.url||``).toLowerCase(),slug=encodeURIComponent(searchLabel.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)).toLowerCase(),alreadyOnQuery=(currentUrl.includes(slug)||currentUrl.includes(encodeURIComponent(searchLabel).toLowerCase()))&&currentUrl.includes(`-jobs`);if(!alreadyOnQuery||currentUrl.includes(`/myapply`)||currentUrl.includes(`/mnjuser/profile`)){v(el=>({...el,message:`Searching Naukri for \"${searchLabel}\"…`})),await chrome.tabs.update(s.id,{url:targetSearchUrl}),await Lr(3000)}}else if(!isExplicitHistory&&String(s.url||``).includes(`/myapply`)){let recUrl=`https://www.naukri.com/mnjuser/recommendedjobs`;v(el=>({...el,message:`Opening Recommended Jobs on Naukri…`})),await chrome.tabs.update(s.id,{url:recUrl}),await Lr(3000)}let c=await Ke(s.id);c={...c,pageMode:isExplicitHistory?`application-history`:`search-results`};';

if (mainContent.includes(ctOldSegment)) {
  mainContent = mainContent.replace(ctOldSegment, ctNewSegment);
  console.log('[main.js] Fixed ct() search query navigation and tab routing.');
} else {
  console.warn('[main.js] Warning: ctOldSegment not matched!');
}

fs.writeFileSync(mainPath, mainContent, 'utf8');
console.log('[main.js] Wrote updated main bundle.');

// --- 2. Update src/extractor-core.js NEXT_SELECTORS ---
const extractorCorePath = path.join(ROOT_DIR, 'src', 'extractor-core.js');
let extractorContent = fs.readFileSync(extractorCorePath, 'utf8');

const oldNextSelectors = `  const NEXT_SELECTORS = [
    "a[rel='next']",
    "a[aria-label='Next']",
    "button[aria-label='Next']",
    "a[title='Next']",
    "button[title='Next']",
    "a.fright",
    "#lastCompMark a[href]:last-of-type",
    "[class*='pagination'] a[href]:last-of-type",
    "[class*='pagination'] a:last-child",
    "[class*='pagination'] button:last-child"
  ];`;

const newNextSelectors = `  const NEXT_SELECTORS = [
    "a[rel='next']",
    "a[aria-label='Next']",
    "button[aria-label='Next']",
    "a[title='Next']",
    "button[title='Next']",
    "a.styles_btn-secondary__2As-H",
    "a[class*='btn-secondary']",
    "a[class*='styles_btn'][class*='secondary']",
    "[class*='styles_pages'] a:last-child",
    "[class*='styles_pages'] a[href]:last-of-type",
    "[class*='pagination'] a[class*='secondary']",
    "a.fright",
    "#lastCompMark a[href]:last-of-type",
    "[class*='pagination'] a[href]:last-of-type",
    "[class*='pagination'] a:last-child",
    "[class*='pagination'] button:last-child"
  ];`;

if (extractorContent.includes(oldNextSelectors)) {
  extractorContent = extractorContent.replace(oldNextSelectors, newNextSelectors);
  console.log('[extractor-core.js] Enhanced NEXT_SELECTORS for Naukri desktop pagination.');
}

const oldFindNextNode = `  function findNextNode(documentRef) {
    for (const selector of NEXT_SELECTORS) {
      const node = documentRef.querySelector ? documentRef.querySelector(selector) : null;
      if (node && !isDisabled(node)) return node;
    }
    const candidates = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll("a, button")) : [];
    return candidates.find((node) => !isDisabled(node) && /^(?:next|next page|›|»|>)$/i.test(clean(node.innerText || node.textContent || node.getAttribute?.("aria-label")))) || null;
  }`;

const newFindNextNode = `  function findNextNode(documentRef) {
    for (const selector of NEXT_SELECTORS) {
      const node = documentRef.querySelector ? documentRef.querySelector(selector) : null;
      if (node && !isDisabled(node)) return node;
    }
    const candidates = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll("a, button")) : [];
    return candidates.find((node) => {
      if (isDisabled(node)) return false;
      const text = clean(node.innerText || node.textContent || node.getAttribute?.("aria-label") || "");
      if (/^(?:next|next page|›|»|>)$/i.test(text)) return true;
      if (/\\bnext\\b/i.test(text) && node.closest?.("[class*='pagination'], [class*='pages'], [class*='styles_pages']")) return true;
      const aria = node.getAttribute?.("aria-label") || "";
      if (/next/i.test(aria)) return true;
      return false;
    }) || null;
  }`;

if (extractorContent.includes(oldFindNextNode)) {
  extractorContent = extractorContent.replace(oldFindNextNode, newFindNextNode);
  console.log('[extractor-core.js] Enhanced findNextNode candidate matcher.');
}

fs.writeFileSync(extractorCorePath, extractorContent, 'utf8');

// --- 3. Update src/portal-adapters.js branding ---
const portalAdaptersPath = path.join(ROOT_DIR, 'src', 'portal-adapters.js');
let portalContent = fs.readFileSync(portalAdaptersPath, 'utf8');
portalContent = portalContent.replaceAll("source:'Applyra Career Intelligence'", "source:'Applyra'");
fs.writeFileSync(portalAdaptersPath, portalContent, 'utf8');
console.log('[portal-adapters.js] Cleaned branding to Applyra.');

// --- 4. Update src/user-profile-widget.js ---
const widgetPath = path.join(ROOT_DIR, 'src', 'user-profile-widget.js');
let widgetContent = fs.readFileSync(widgetPath, 'utf8');

// Replace location.href = chrome.runtime.getURL('admin.html#diagnostics')
widgetContent = widgetContent.replaceAll("location.href = chrome.runtime.getURL('admin.html#diagnostics');", "location.href = chrome.runtime.getURL('index.html');");

// Ensure brandLockup strictly shows Applyra
const brandLockupCheck = `    if (brandLockup) {
      const existingBrandMark = brandLockup.querySelector('.brand-mark');
      if (existingBrandMark && !existingBrandMark.querySelector('.applyra-product-brand-img')) {
        const iconUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
          ? chrome.runtime.getURL('assets/brand/applyra-icon.png')
          : 'assets/brand/applyra-icon.png';
        existingBrandMark.innerHTML = \`<img src="\${iconUrl}" class="applyra-product-brand-img" alt="Applyra Logo" />\`;
      }
    }`;

const brandLockupReplacement = `    if (brandLockup) {
      const existingBrandMark = brandLockup.querySelector('.brand-mark');
      if (existingBrandMark && !existingBrandMark.querySelector('.applyra-product-brand-img')) {
        const iconUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
          ? chrome.runtime.getURL('assets/brand/applyra-icon.png')
          : 'assets/brand/applyra-icon.png';
        existingBrandMark.innerHTML = \`<img src="\${iconUrl}" class="applyra-product-brand-img" alt="Applyra Logo" />\`;
      }
      // Strictly enforce "Only Applyra" - strip any sub-tags like Career Intelligence or local-first
      const titleSpan = Array.from(brandLockup.querySelectorAll('span')).find(s => !s.classList.contains('brand-mark'));
      if (titleSpan) titleSpan.innerHTML = 'Applyra';
      brandLockup.querySelectorAll('small, em').forEach(el => el.remove());
    }`;

if (widgetContent.includes(brandLockupCheck)) {
  widgetContent = widgetContent.replace(brandLockupCheck, brandLockupReplacement);
  console.log('[user-profile-widget.js] Enforced "Only Applyra" in header brand lockup.');
}
fs.writeFileSync(widgetPath, widgetContent, 'utf8');

console.log('=== Updates completed successfully! ===');
