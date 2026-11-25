(() => {
  'use strict';
  const CM=globalThis.NowCurryCandidateMemory;
  const now=()=>new Date().toISOString();
  const id=(p)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const WORKSPACE_SCHEMA=11;

  function createWorkspace(seed={}){
    const candidates=(seed.candidates||[]).map(CM.createCandidate);
    if(!candidates.length) candidates.push(CM.createCandidate({profile:seed.profile||{},memory:seed.memory||{}}));
    const orgId=seed.activeOrganizationId||seed.organization?.id||id('org');
    const recruiterId=seed.activeRecruiterId||seed.recruiter?.id||id('recruiter');
    return {
      schemaVersion:WORKSPACE_SCHEMA,
      organization:{id:orgId,name:seed.organization?.name||seed.organizationName||'My Organization'},
      recruiter:{id:recruiterId,name:seed.recruiter?.name||seed.recruiterName||'',email:seed.recruiter?.email||''},
      activeOrganizationId:orgId,
      activeRecruiterId:recruiterId,
      activeCandidateId:seed.activeCandidateId||candidates[0].id,
      candidates,
      history:Array.isArray(seed.history)?seed.history:[],
      createdAt:seed.createdAt||now(),
      updatedAt:seed.updatedAt||now()
    };
  }
  function normalizeWorkspace(w={}){
    const out=createWorkspace({...w,candidates:Array.isArray(w.candidates)?w.candidates:[]});
    out.organization={...out.organization,...(w.organization||{})};
    out.recruiter={...out.recruiter,...(w.recruiter||{})};
    out.history=Array.isArray(w.history)?w.history:[];
    out.createdAt=w.createdAt||out.createdAt;
    out.updatedAt=w.updatedAt||out.updatedAt;
    out.schemaVersion=WORKSPACE_SCHEMA;
    if(!out.candidates.some(c=>c.id===out.activeCandidateId)) out.activeCandidateId=out.candidates.find(c=>c.status!=='archived')?.id||out.candidates[0]?.id||'';
    return out;
  }
  function activeCandidate(w){w=normalizeWorkspace(w);return w.candidates.find(c=>c.id===w.activeCandidateId)||w.candidates[0];}
  function upsertCandidate(w,c){w=normalizeWorkspace(w);c=CM.createCandidate(c);const i=w.candidates.findIndex(x=>x.id===c.id);if(i>=0)w.candidates[i]={...w.candidates[i],...c,updatedAt:now()};else w.candidates.push(c);w.updatedAt=now();return w;}
  function switchCandidate(w,cid){w=normalizeWorkspace(w);if(w.candidates.some(c=>c.id===cid&&c.status!=='archived'))w.activeCandidateId=cid;w.updatedAt=now();return w;}
  function duplicateCandidate(w,cid){w=normalizeWorkspace(w);const c=w.candidates.find(x=>x.id===cid);if(!c)return w;const copy=CM.createCandidate({...structuredClone(c),id:id('candidate'),profile:{...c.profile,name:`${c.profile.name||'Candidate'} Copy`},createdAt:now(),updatedAt:now()});w.candidates.push(copy);w.activeCandidateId=copy.id;w.updatedAt=now();return w;}
  function archiveCandidate(w,cid){w=normalizeWorkspace(w);const c=w.candidates.find(x=>x.id===cid);if(c)c.status='archived';if(w.activeCandidateId===cid)w.activeCandidateId=w.candidates.find(x=>x.status!=='archived')?.id||w.candidates[0]?.id||'';w.updatedAt=now();return w;}
  function recordTeamEvent(w,e={}){w=normalizeWorkspace(w);w.history.unshift({id:id('event'),organizationId:w.activeOrganizationId,recruiterId:w.activeRecruiterId,candidateId:e.candidateId||w.activeCandidateId,type:e.type||'activity',message:String(e.message||''),at:now()});w.history=w.history.slice(0,1000);w.updatedAt=now();return w;}
  globalThis.NowCurryTeam={VERSION:'2.8.0-beta.8',WORKSPACE_SCHEMA,createWorkspace,normalizeWorkspace,activeCandidate,upsertCandidate,switchCandidate,duplicateCandidate,archiveCandidate,recordTeamEvent};
})();
