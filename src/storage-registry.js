(function(root){
  'use strict';

  const VERSION='1.3.0';
  const SCHEMA_VERSION=14;
  const KEYS=Object.freeze({
    JOBS:'jobs', PROFILE:'profile', LAST_SCAN:'lastScan', LAST_IMPORT:'lastImport', RUNS:'runs', ACTIVE_RUN:'activeRun',
    PROFILE_REFRESH:'profileRefresh', PROFILE_BOOST:'profileBoost', PROFILE_BOOST_RECOVERY:'profileBoostRecovery',
    AUTO_APPLY:'naukriAutoApply', AUTO_APPLY_RUNS:'naukriAutoApplyRuns', AUTO_APPLY_ACTIVE_RUN:'naukriAutoApplyActiveRun',
    APPLIED_JOB_IDS:'naukriAppliedJobIds', AUTOMATION_ACTIVITY:'automationActivity', APPLY_SESSIONS:'applyEngineSessions',
    APPLY_SAFETY:'applyEngineSafety', ANSWER_VAULT:'applyEngineAnswerVault', FEEDBACK:'feedback', HISTORY:'history',
    HISTORY_SYNC:'historySync', NAUKRI_CONNECTION:'naukriConnection', PROFILE_REVISIONS:'profileRevisions', INTERVIEWS:'interviews',
    RADAR_CONFIG:'radarConfig', RADAR_CACHE:'radarCache', RADAR_PROVIDER_SECRETS:'radarProviderSecrets',
    UNIVERSAL_JOBS:'universalJobs', UNIVERSAL_RUNS:'universalRuns', BUSINESS_ACCOUNT:'businessAccount',
    BUSINESS_USAGE_LEDGER:'businessUsageLedger', BUSINESS_AUDIT:'businessAudit', TEAM_WORKSPACE:'teamWorkspace',
    ACTIVE_CANDIDATE_PROFILE:'activeCandidateProfile', QUESTION_LEARNING_INBOX:'questionLearningInbox', PORTAL_INBOX:'portalInbox',
    BACKEND_CONFIG:'backendConfig', LAST_NAUKRI_SEARCH:'lastNaukriSearch', LAST_AUTOMATIC_NAUKRI_CAPTURE:'lastAutomaticNaukriCapture',
    MIGRATION_HISTORY:'migrationHistory', CLOUD_MIGRATION:'cloudMigration', ONBOARDING:'onboardingState',
    CAREER_EVIDENCE:'careerEvidence', CAREER_MANUAL_JOBS:'careerManualJobs', OPPORTUNITY_SCANS:'opportunityScans',
    DATA_CONTROL_AUDIT:'dataControlAudit', CAREER_SUITE:'careerSuite', RESEARCH_ENGINE:'researchEngine',
    AUTH_SESSION:'authSession', AUTH_PROFILE:'authProfile', AUTH_CONFIG:'authConfig', REMEMBERED_ACCOUNTS:'rememberedAccounts',
    EXTERNAL_EXTRACTION_RECEIPT:'externalExtractionReceipt', UNIFIED_EXTRACTOR_SELECTION:'unifiedExtractorSelection',
    SCHEMA_VERSION:'schemaVersion'
  });

  const PRODUCT_KEYS=Object.freeze([...new Set(Object.values(KEYS))]);
  function cleanKey(value){return String(value||'').trim();}
  function isKnownKey(value){return PRODUCT_KEYS.includes(cleanKey(value));}
  function stamp(patch={}){return {...patch,[KEYS.SCHEMA_VERSION]:SCHEMA_VERSION};}
  function pick(storage={},keys=PRODUCT_KEYS){
    const out={};
    for(const key of keys){if(storage[key]!==undefined) out[key]=storage[key];}
    return out;
  }

  root.NowCurryStorage=Object.freeze({VERSION,SCHEMA_VERSION,KEYS,PRODUCT_KEYS,isKnownKey,stamp,pick});
  if(typeof module!=='undefined'&&module.exports) module.exports=root.NowCurryStorage;
})(typeof globalThis!=='undefined'?globalThis:this);
