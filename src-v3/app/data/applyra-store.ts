import {
  hasExtensionStorage,
  sendRuntimeMessage,
  storageGet,
  storageSet
} from '../../../web-src/chrome-adapter.ts';
import type {
  CandidateEvidence,
  CandidateProfile,
  NormalizedJob,
  ScheduledScan
} from '../../../web-src/types.ts';
import { extractCandidateSkills } from '../../../web-src/data/storage-bridge.ts';

export interface ApplyraStoreState {
  jobs: NormalizedJob[];
  candidateEvidence: CandidateEvidence | null;
  candidateProfile: CandidateProfile | null;
  scheduledScans: ScheduledScan[];
  candidateSkills: string[];
  userName: string;
  userEmail: string;
  extensionConnected: boolean;
}

export async function fetchApplyraStore(): Promise<ApplyraStoreState> {
  if (!hasExtensionStorage()) {
    return {
      jobs: [],
      candidateEvidence: null,
      candidateProfile: null,
      scheduledScans: [],
      candidateSkills: [],
      userName: 'Candidate',
      userEmail: 'Extension storage preview',
      extensionConnected: false
    };
  }

  const raw = await storageGet<Record<string, unknown>>([
    'jobs',
    'candidateEvidence',
    'candidateProfile',
    'scheduledScans',
    'applyraUser',
    'user'
  ]);

  const jobs = Array.isArray(raw.jobs) ? (raw.jobs as NormalizedJob[]) : [];
  const candidateEvidence = (raw.candidateEvidence as CandidateEvidence) || null;
  const candidateProfile = (raw.candidateProfile as CandidateProfile) || null;
  const scheduledScans = Array.isArray(raw.scheduledScans) ? (raw.scheduledScans as ScheduledScan[]) : [];
  const userObj = (raw.applyraUser || raw.user || {}) as Record<string, unknown>;

  return {
    jobs,
    candidateEvidence,
    candidateProfile,
    scheduledScans,
    candidateSkills: extractCandidateSkills(candidateEvidence, candidateProfile),
    userName: String(candidateProfile?.name || userObj.name || userObj.fullName || 'Candidate'),
    userEmail: String(userObj.email || 'Connected to Chrome Storage'),
    extensionConnected: true
  };
}

export async function updateJobStatus(jobId: string, status: string): Promise<NormalizedJob[]> {
  const current = await fetchApplyraStore();
  const nextJobs = current.jobs.map((j) =>
    j.id === jobId
      ? {
          ...j,
          status,
          appliedAt: status === 'applied' && !j.appliedAt ? new Date().toISOString() : j.appliedAt
        }
      : j
  );
  if (hasExtensionStorage()) {
    await storageSet({ jobs: nextJobs });
  }
  return nextJobs;
}

export async function saveCandidateEvidence(evidence: CandidateEvidence): Promise<void> {
  if (!hasExtensionStorage()) return;
  await storageSet({ candidateEvidence: evidence });
  window.dispatchEvent(new CustomEvent('applyra:evidence-updated'));
}

export async function saveScheduledScans(scans: ScheduledScan[]): Promise<void> {
  if (!hasExtensionStorage()) return;
  await storageSet({ scheduledScans: scans });
}

export async function triggerRuntimeAction(type: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  return sendRuntimeMessage(type, payload);
}
