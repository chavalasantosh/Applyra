export type ApplyraTheme = 'dark' | 'light';

export type ApplyraAppearance =
  | 'obsidian'
  | 'ivory'
  | 'spatial'
  | 'cyber'
  | 'graphite'
  | 'aurora';

export type ApplyraMotionMode = 'reduced' | 'standard' | 'enhanced' | 'cinematic';

export interface CandidateProfile {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string[] | string;
  yearsExperience?: number;
  fullTimeYears?: number;
  preferredLocation?: string[] | string;
  locations?: string[] | string;
  currentLocation?: string;
  employmentHistory?: unknown[];
  workHistory?: unknown[];
}

export interface ResumeEvidence {
  filename: string;
  text: string;
  pages?: number | null;
  format?: string;
  uploadedAt?: string;
}

export interface CandidateEvidence {
  resume?: ResumeEvidence;
  naukri?: { text: string };
  linkedin?: { text: string };
  confirmedYears?: number | null;
  preferredLocations?: string[];
  updatedAt?: string;
}

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  experience: string;
  url: string;
  postedAt: string;
  salaryText: string;
  source: string;
  sourceLabel: string;
  provider: string;
  status: string;
  appliedAt: string | null;
  candidateId: string;
  skills?: string[];
  fitScore?: number;
}

export interface ScheduledScan {
  id: string;
  name?: string;
  query?: string;
  enabled?: boolean;
  lastRunAt?: string;
}

export interface VisualStorageSnapshot {
  jobs: NormalizedJob[];
  candidateEvidence: CandidateEvidence | null;
  candidateProfile: CandidateProfile | null;
  scheduledScans: ScheduledScan[];
  companyIntel: unknown[];
}
