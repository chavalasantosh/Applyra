(function(root){
'use strict';
const clean=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const list=v=>(Array.isArray(v)?v:String(v??'').split(/[,;\n|]/)).map(clean).filter(Boolean);
const SKILLS=['Python','SQL','Excel','Power BI','Tableau','DAX','Power Query','Machine learning','Deep learning','NLP','Computer Vision','Transformers','MLOps','LLM','GenAI','RAG','LangChain','LangGraph','LangSmith','Hugging Face','OpenAI','FAISS','Pinecone','Chroma','Vector DB','MLflow','PyTorch','TensorFlow','scikit-learn','Pandas','NumPy','Spark','PySpark','Databricks','Snowflake','Airflow','dbt','ETL','AWS','Azure','GCP','Docker','Kubernetes','Terraform','Git','CI/CD','Linux','FastAPI','Flask','Django','Java','JavaScript','TypeScript','React','Next.js','Node.js','C++','C#','R','Scala','Statistics','A/B testing','Data modeling','Data engineering','Data analysis','Automation','REST','GraphQL','PostgreSQL','MongoDB','Redis'];
const ALIASES={'GenAI':['generative ai','generative artificial intelligence'],'LLM':['large language model','large language models','llms'],'NLP':['natural language processing'],'GCP':['google cloud'],'AWS':['amazon web services'],'Power BI':['powerbi'],'scikit-learn':['sklearn'],'Node.js':['nodejs'],'Next.js':['nextjs'],'CI/CD':['ci cd','continuous integration','github actions'],'RAG':['retrieval augmented generation','retrieval-augmented generation'],'Machine learning':['machine-learning'],'Data analysis':['data analytics'],'Hugging Face':['huggingface']};
function has(text,term){return [term,...(ALIASES[term]||[])].some(t=>new RegExp('(^|[^a-z0-9])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text));}
function skills(text){return SKILLS.filter(s=>has(text,s));}
function sources(profile={},evidence={}){
 const base=[profile.headline,profile.summary,...list(profile.skills),JSON.stringify(profile.employmentHistory||profile.workHistory||[])].join('\n');
 return {profile:base,resume:evidence.resume?.text||'',naukri:evidence.naukri?.text||'',linkedin:evidence.linkedin?.text||''};
}
function normalizeJob(j){const v=j.job||j;return {id:String(v.id||v.fingerprint||v.url||v.applyUrl||[v.title||v.position?.title,v.company?.name||v.company,v.location?.display||v.location].join('|')),title:clean(v.title||v.position?.title||'Untitled role'),company:clean(v.company?.name||v.company||v.companyName),description:clean(v.description||v.position?.description||v.jobDescription||v.jd||''),location:clean(v.location?.display||v.location||v.locationText),experience:clean(v.experienceText||v.experience||''),url:clean(v.url||v.applyUrl||v.link),postedAt:v.postedAt||v.publication_date||v.created_at||'',salaryText:clean(v.salaryText||v.salary||''),source:clean(v.source||''),sourceLabel:clean(v.sourceLabel||''),provider:clean(v.provider||''),status:clean(j.status||v.status),appliedAt:j.appliedAt||v.appliedAt||(['applied','interview','offer','rejected'].includes(clean(j.status||v.status).toLowerCase())?(j.createdAt||v.createdAt):null),candidateId:j.candidateId||v.candidateId||''};}
function jobsFromStorage(s,id){const rows=[...(Array.isArray(s.jobs)?s.jobs:[]),...Object.values(s.universalJobs||{}),...(s.careerSuite?.tracked||[])];const m=new Map();for(const row of rows){const j=normalizeJob(row);if(j.candidateId&&j.candidateId!==id)continue;const old=m.get(j.id);if(!old)m.set(j.id,j);else m.set(j.id,{...old,...j,description:j.description.length>old.description.length?j.description:old.description,appliedAt:j.appliedAt||old.appliedAt,url:j.url||old.url});}return [...m.values()];}
function requiredYears(text){const r=String(text).match(/\b(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|professional|work|hands-on))?\s*(?:experience)?/i);return r?{min:+r[1],max:r[2]?+r[2]:null}:null;}
function years(profile,evidence){const explicit=evidence.confirmedYears;const p=profile.yearsExperience??profile.fullTimeYears;if(explicit!==''&&explicit!==null&&explicit!==undefined&&Number.isFinite(+explicit)&&+explicit>=0)return +explicit;if(p!==undefined&&p!==null&&p!==''&&Number.isFinite(+p)&&+p>=0)return +p;return null;}
function analyzeJob(job,profile={},evidence={}){
 const j=normalizeJob(job),src=sources(profile,evidence),req=skills(j.description),matched=req.filter(s=>Object.values(src).some(v=>has(v,s))),resume=req.filter(s=>has(src.resume,s)),profileMatches=req.filter(s=>[src.profile,src.naukri,src.linkedin].some(v=>has(v,s)));
 const missing=req.filter(s=>!matched.includes(s)),resumeGaps=req.filter(s=>!resume.includes(s)&&profileMatches.includes(s));
 const exp=requiredYears(j.experience)||requiredYears(j.description),actual=years(profile,evidence);
 const expFit=exp&&actual!==null?actual>=exp.min:null;
 const locations=list(evidence.preferredLocations||profile.preferredLocation||profile.locations||profile.currentLocation),loc=j.location.toLowerCase();
 const aliases=v=>v.toLowerCase().replace(/bangalore/g,'bengaluru').replace(/gurgaon/g,'gurugram');
 const locationFit=loc&&locations.length?locations.some(l=>{const al=aliases(l),aj=aliases(loc);return al&&aj&&(aj.includes(al)||al.includes(aj));}):null;
 const score=j.description&&req.length?Math.round(100*matched.length/req.length):null;
 return {...j,score,requirements:req,matched,missing,resumeGaps,resumeScore:src.resume&&req.length?Math.round(100*resume.length/req.length):null,profileScore:req.length?Math.round(100*profileMatches.length/req.length):null,experience:{required:exp,actual,fit:expFit},locationFit,highFit:score!==null&&score>=70&&expFit!==false&&locationFit!==false,evidence:matched.map(skill=>({skill,sources:Object.entries(src).filter(([,text])=>has(text,skill)).map(([name])=>name)})),unknowns:[...(!j.description?['Full job description missing; paste it to assess requirements.']:!req.length?['No supported technical requirements detected; manual review needed.']:[]),...(expFit===null?['Experience fit not established.']:[]),...(locationFit===null?['Location fit not established.']:[]),...(/remote/i.test(j.location)?['Remote eligibility and country restrictions must be checked.']:[])]};
}
function guidance(profile,e={},jobs=[]){
 const src=sources(profile,e),out=[];const add=(priority,area,issue,action,evidence)=>out.push({priority,area,issue,action,evidence});
 const resume=src.resume;
 if(!resume)add('High','Resume','No uploaded resume','Upload a resume and review its extracted text before analysis.','No resume evidence saved.');
 else {
  for(const [label,pattern] of [['Experience',/\b(experience|employment|work history|career history|internships?|projects?)\b/i],['Skills',/\b(skills|technologies|technical expertise|tech stack|competencies|tools)\b/i],['Education',/\b(education|qualification|academic|degree|b\.?tech|m\.?tech|bachelor|master)\b/i]])if(!pattern.test(resume))add('High','Resume',label+' section not detected','Use a clear '+label+' heading and add only accurate details.','Heading not found in extracted text.');
  if(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resume))add('High','Resume','Contact email not detected','Add a professional email address in selectable text.','No email pattern found.');
  const lines=resume.split(/\n/).map(v=>v.trim()).filter(Boolean),bullets=lines.filter(l=>/^[-•*▪]|^(built|developed|designed|implemented|automated|led|improved|reduced|created|managed|analyzed|delivered)\b/i.test(l));
  const weak=bullets.filter(l=>!/(\d+(?:\.\d+)?\+?\s*(?:%|x\b|k\b|m\b|users|hours|hrs|seconds|sec|minutes|min|ms|records|requests|days|rows|clients|teams|pipelines|models|mb|gb|tb)|₹|\$|€|£)/i.test(l));
  if(weak.length)add('High','Resume','Impact is not quantified in some bullets','Add measured scale or outcomes where you can substantiate them. Template: Built [system] using [tools], improving [metric] from [before] to [after].',weak.slice(0,2).join('\n'));
  if(!/https?:\/\/|github\.com|linkedin\.com|gitlab\.com|kaggle\.com|huggingface\.co|\b(github|linkedin|portfolio)\b/i.test(resume))add('Medium','Resume','No portfolio/profile link detected','Include a working GitHub, portfolio or LinkedIn URL relevant to your target role.','No recognizable URL found.');
 }
 for(const platform of ['naukri','linkedin']){
  if(!src[platform]){add('High',platform==='naukri'?'Naukri':'LinkedIn','Profile evidence missing','Paste your headline, summary/About, skills and experience. Applyra cannot assess unprovided sections.','No profile snapshot saved.');continue;}
  const known=skills(resume||src.profile),missing=known.filter(s=>!has(src[platform],s));
  if(missing.length)add('Medium',platform==='naukri'?'Naukri':'LinkedIn','Skills supported elsewhere are not visible here','If these skills are current and relevant, add them with concrete project evidence: '+missing.slice(0,8).join(', '), 'Present in '+(resume?'resume':'stored profile')+', absent from supplied '+platform+' text.');
  if(src[platform].length<250)add('Medium',platform==='naukri'?'Naukri':'LinkedIn','Very little profile text supplied','Add relevant projects, responsibilities and outcomes to your profile; paste the complete sections if this was only an excerpt.','Supplied text is under 250 characters.');
 }
 const count={};for(const j of jobs){for(const skill of j.resumeGaps||[])count[skill]=(count[skill]||0)+1;}
 if(Object.keys(count).length)add('High','Resume','Job requirements are supported by your profile but absent from your resume','Review and add truthful project evidence for: '+Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([s,n])=>`${s} (${n} roles)`).join(', '),'Compared with loaded job descriptions.');
 if(jobs.some(j=>j.experience.fit===false))add('High','Targeting','Some roles ask for more experience than recorded','Prioritize roles closer to your confirmed experience; keep stretch roles intentional.','Experience requirements exceed your recorded years in one or more roles.');
 return out;
}
function summarize(rows,now=Date.now()){
 const recent=rows.filter(j=>{const t=Date.parse(j.appliedAt);return Number.isFinite(t)&&t<=now&&t>=now-7*86400000;});
 const known=recent.filter(j=>j.score!==null),exp=recent.filter(j=>j.experience.fit!==null),loc=recent.filter(j=>j.locationFit!==null);
 const cKnown=rows.filter(j=>j.score!==null),cExp=rows.filter(j=>j.experience.fit!==null),cLoc=rows.filter(j=>j.locationFit!==null);
 return {total:recent.length,assessed:known.length,highFit:known.filter(j=>j.highFit).length,experience:exp.length?Math.round(100*exp.filter(j=>j.experience.fit).length/exp.length):null,experienceAssessed:exp.length,location:loc.length?Math.round(100*loc.filter(j=>j.locationFit).length/loc.length):null,locationAssessed:loc.length,corpusTotal:rows.length,corpusAssessed:cKnown.length,corpusHighFit:cKnown.filter(j=>j.highFit).length,corpusExpAssessed:cExp.length,corpusExpFit:cExp.filter(j=>j.experience.fit).length,corpusLocAssessed:cLoc.length,corpusLocFit:cLoc.filter(j=>j.locationFit).length};
}
root.ApplyraCareerIntelligence={clean,list,skills,sources,normalizeJob,jobsFromStorage,requiredYears,analyzeJob,guidance,summarize};
if(typeof module!=='undefined')module.exports=root.ApplyraCareerIntelligence;
})(globalThis);
