const NC_UNIVERSAL_VERSION = '1.0.0';
const PIPELINE = ['discovered','reviewed','saved','applied','interview','offer','rejected','archived'];
function clean(v,m=5000){return String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,m)}
function words(v){return [...new Set(clean(v).toLowerCase().replace(/[^a-z0-9+#. -]/g,' ').split(/\s+/).filter(x=>x.length>2))]}
function enrich(job, profile={}){
  const known=new Set(words([...(profile.skills||[]),...(profile.roles||[])].join(' ')));
  const required=words([job.position?.title,job.position?.description,job.position?.category].join(' ')).filter(x=>x.length>3);
  const stop=new Set(['with','from','that','this','your','will','have','work','role','team','years','experience','skills','looking','about','company','remote','job','using','into','their','they','you']);
  const meaningful=required.filter(x=>!stop.has(x));
  const matched=meaningful.filter(x=>known.has(x)).slice(0,12);
  const missing=meaningful.filter(x=>!known.has(x)).slice(0,8);
  return {...job,intelligence:{...(job.intelligence||{}),matchedSkills:matched,skillGaps:missing,studyGuide:missing.slice(0,5).map((s,i)=>({skill:s,priority:i<2?'high':'medium',action:`Review ${s} fundamentals and prepare one project/interview example.`})),coach:{summary:(job.intelligence?.matchScore||0)>=80?'Strong-fit opportunity: prioritize review and application.':(job.intelligence?.matchScore||0)>=60?'Potential fit: review gaps before applying.':'Exploratory fit: inspect requirements before investing application time.',nextActions:['Review match reasons',missing.length?`Address top gap: ${missing[0]}`:'Tailor resume to the role','Verify role requirements in Applyra and optimize match']}}};
}
function record(job,status='saved',existing={}){const now=new Date().toISOString();return {fingerprint:job.fingerprint,job,status:PIPELINE.includes(status)?status:'saved',source:job.source?.id||'unknown',createdAt:existing.createdAt||now,updatedAt:now,history:[...(existing.history||[]),{status,at:now}]}}
globalThis.NowCurryUniversal={version:NC_UNIVERSAL_VERSION,PIPELINE,enrich,record};
