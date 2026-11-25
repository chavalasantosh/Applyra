(()=>{
  'use strict';
  const Portal=globalThis.NowCurryPortalAdapters;
  if(!Portal) throw new Error('Portal adapter registry did not load.');
  function detect(url=''){return Portal.detect(url).id;}
  function portalJob(input={}){return Portal.createIntake(input);}
  function linkedinJob(input={}){
    const job=Portal.createIntake(input);
    if(job.provider!=='linkedin') throw new Error('Only HTTPS LinkedIn URLs are accepted.');
    return job;
  }
  globalThis.NowCurryMultiPortal={VERSION:'2.8.0-beta.8',detect,portalJob,linkedinJob,providers:Portal.ADAPTERS};
})();
