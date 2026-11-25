(function(root){
'use strict';
const clean=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const list=v=>(Array.isArray(v)?v:String(v||'').split(/[,;\n]/)).map(clean).filter(Boolean);
function validate(s){
 if(!['daily','weekly','monthly'].includes(s.frequency))throw Error('Choose daily, weekly or monthly.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))throw Error('Choose a valid time.');
 if(!Number.isInteger(+s.weekday)||+s.weekday<0||+s.weekday>6)throw Error('Choose a weekday.');
 if(!Number.isInteger(+s.monthday)||+s.monthday<1||+s.monthday>31)throw Error('Choose a day from 1 to 31.');
 if(!list(s.roles).length)throw Error('Add at least one target role.');
 if(!Number.isFinite(+s.minScore)||+s.minScore<0||+s.minScore>100)throw Error('Match threshold must be 0–100.');
 return {...s,roles:list(s.roles).slice(0,20),locations:list(s.locations).slice(0,20),minScore:+s.minScore,weekday:+s.weekday,monthday:+s.monthday,enabled:!!s.enabled};
}
function nextRun(s,now=Date.now()){
 const [h,m]=s.time.split(':').map(Number), n=new Date(now);
 for(let i=0;i<370;i++){
  const d=new Date(n.getFullYear(),n.getMonth(),n.getDate()+i,h,m,0,0);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  if(d.getTime()>now&&(s.frequency==='daily'||s.frequency==='weekly'&&d.getDay()===+s.weekday||s.frequency==='monthly'&&d.getDate()===Math.min(+s.monthday,last)))return d.getTime();
 }
 throw Error('Cannot calculate next scan.');
}
const terms=['Python','SQL','Excel','Power BI','Tableau','business intelligence','analytics','machine learning','deep learning','MLOps','LLM','GenAI','RAG','LangChain','MLflow','PyTorch','TensorFlow','scikit-learn','Pandas','NumPy','Spark','Databricks','Snowflake','Airflow','dbt','ETL','AWS','Azure','GCP','Docker','Kubernetes','Terraform','Git','CI/CD','Linux','FastAPI','Flask','Django','Java','JavaScript','TypeScript','React','Node.js','C++','C#','R','Scala','statistics','A/B testing','data modeling','data engineering','data analysis','automation','REST','GraphQL','PostgreSQL','MongoDB','Redis'];
const aliases={
 'machine learning engineer':['machine learning engineer','ml engineer','ai/ml engineer','ai ml engineer'],
 'natural language processing engineer':['natural language processing engineer','nlp engineer','language model engineer'],
 'ai ml engineer':['ai/ml engineer','ai ml engineer','artificial intelligence engineer','machine learning engineer','ml engineer'],
 'data & ai':['data and ai','data ai','data engineer','data scientist','ai engineer'],
 'business intelligence':['business intelligence','bi developer','bi analyst','power bi developer'],
 'python automation':['python automation','automation engineer','python developer','python engineer'],
 'analytics':['analytics','data analyst','analytics engineer','business analyst'],
 'mlops':['mlops','machine learning operations','ml platform engineer'],
 'data engineering':['data engineering','data engineer','analytics engineer']
};
function normalized(value){return clean(value).toLowerCase().replace(/node\.js/g,'nodejs').replace(/&/g,' and ').replace(/[^a-z0-9+#]+/g,' ').replace(/\s+/g,' ').trim();}
function has(text,term){const h=normalized(text),t=normalized(term);return !!t&&(` ${h} `).includes(` ${t} `);}
function roleMatches(text,role){const h=` ${normalized(text)} `,key=normalized(role),options=aliases[key]||[role];if(options.some(option=>{const t=normalized(option);return !!t&&h.includes(` ${t} `);}))return true;const tokens=key.split(' ').filter(t=>!['engineer','developer','analyst','specialist','manager','senior','staff','lead'].includes(t));return tokens.length>1&&tokens.every(t=>h.includes(` ${t} `));}
function locationMatches(listing,desired){const norm=v=>normalized(v).replace(/bangalore/g,'bengaluru').replace(/gurgaon/g,'gurugram').replace(/new delhi/g,'delhi');const place=norm(listing);if(/\bremote\b/.test(place))return true;return desired.some(item=>place.includes(norm(item)));}
function rankDetailed(jobs,profile,s,seen={},now=Date.now()){
 const known=list(profile?.skills),used=new Set(),results=[],filters={invalidOrDuplicate:0,stale:0,roleMismatch:0,locationMismatch:0,noEvidence:0,belowThreshold:0};
 const roles=list(s.roles),locations=list(s.locations);
 for(const j of jobs){
  const url=String(j.url||'').trim();if(!/^https:\/\//i.test(url)||used.has(url)||seen[url]){filters.invalidOrDuplicate++;continue;}used.add(url);
  const description=clean(j.description),title=clean(j.title),hay=`${title} ${description}`,loc=clean(j.location);
  if(j.postedAt&&Number.isFinite(Date.parse(j.postedAt))&&(now-Date.parse(j.postedAt)>45*86400000||Date.parse(j.postedAt)>now+86400000)){filters.stale++;continue;}
  const matchingRoles=roles.filter(t=>roleMatches(title,t)||roleMatches(hay,t));if(!matchingRoles.length){filters.roleMismatch++;continue;}
  const locationFit=locations.length?locationMatches(loc,locations):true;if(!locationFit){filters.locationMismatch++;continue;}
  const requirements=terms.filter(t=>has(description,t));const matched=known.filter(t=>has(hay,t));if(!matched.length){filters.noEvidence++;continue;}
  const matchedRequirements=requirements.filter(t=>known.some(k=>has(k,t)));
  const gaps=requirements.filter(t=>!known.some(k=>has(k,t)));
  const roleScore=roleMatches(title,matchingRoles[0])?30:22;
  const skillScore=Math.min(52,Math.round(18+matchedRequirements.length*8+Math.min(10,matched.length*2)));
  const locationScore=locations.length?(locationFit?10:0):8;
  const score=Math.min(98,roleScore+skillScore+locationScore+8);
  if(score<s.minScore){filters.belowThreshold++;continue;}
  const experience=description.match(/\b\d+(?:\s*[-–]\s*\d+)?\+?\s+years?(?:\s+of)?\s+experience\b/i)?.[0];
  results.push({...j,description:undefined,score,fit:`Role: ${matchingRoles.slice(0,2).join(', ')}. Profile/resume evidence: ${matched.slice(0,6).join(', ')}.`,requirements:[...requirements.slice(0,10),experience].filter(Boolean).join(', ')||'Review the full listing.',gaps:(gaps.length?`Not supported in recorded profile/resume: ${gaps.slice(0,6).join(', ')}. `:'')+(locations.length&&/\bremote\b/i.test(loc)?'Remote location; confirm India eligibility. ':'')+'Verify seniority and current vacancy with the employer.'});
 }
 results.sort((a,b)=>b.score-a.score||Date.parse(b.postedAt||0)-Date.parse(a.postedAt||0));
 return {shortlist:results.slice(0,5),filterCounts:filters,total:jobs.length,profileSkillCount:known.length};
}
function rank(jobs,profile,s,seen={},now=Date.now()){return rankDetailed(jobs,profile,s,seen,now).shortlist;}
root.ApplyraOpportunities={validate,nextRun,rank,rankDetailed,list,clean};
})(globalThis);
