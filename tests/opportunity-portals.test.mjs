import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildPortalSearchUrl,opportunityPortalSources,visiblePortalJobs} from '../assets/opportunities/opportunity-view.mjs';

test('scan screen offers India-facing searches beyond the two public feeds',()=>{
 const ids=opportunityPortalSources.map(p=>p.id);
 for(const id of ['naukri','linkedin','indeed','foundit','shine','timesjobs','instahyre','wellfound'])assert.ok(ids.includes(id),id);
});

test('visible Naukri job cards are imported while unrelated links are ignored',()=>{
 const card={innerText:'Python Engineer Example Corp Bengaluru Python SQL MLOps · Full time',parentElement:null};
 const title={href:'https://www.naukri.com/job-listings-python-engineer-123456789012?src=search',innerText:'Python Engineer',parentElement:card};
 const unrelated={href:'https://www.naukri.com/mnjuser/profile',innerText:'My profile',parentElement:card};
 const previous=globalThis.document;
 globalThis.document={querySelectorAll:()=>[title,unrelated]};
 try{const rows=visiblePortalJobs('naukri');assert.equal(rows.length,1);assert.equal(rows[0].title,'Python Engineer');assert.match(rows[0].description,/MLOps/);assert.equal(new URL(rows[0].url).hash,'');}
 finally{globalThis.document=previous;}
});

test('portal search URLs carry role and India location safely',()=>{
 for(const id of opportunityPortalSources.map(p=>p.id)){
  const url=new URL(buildPortalSearchUrl(id,'ML & MLOps','Bengaluru, India'));
  assert.equal(url.protocol,'https:');
  assert.match(url.hostname,/naukri|linkedin|indeed|foundit|shine|timesjobs|instahyre|wellfound/);
  const query=decodeURIComponent(url.search);
  assert.ok(query.includes('ML & MLOps')||url.pathname.includes('ml-mlops'));
 }
 assert.throws(()=>buildPortalSearchUrl('unknown','Python'));
});
