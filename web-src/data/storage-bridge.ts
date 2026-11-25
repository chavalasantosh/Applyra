import { hasExtensionStorage, storageGet } from '../chrome-adapter.ts';
import type {
  CandidateEvidence,
  CandidateProfile,
  NormalizedJob,
  ScheduledScan,
  VisualStorageSnapshot
} from '../types.ts';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseSkillsFromProfile(profile: CandidateProfile | null): string[] {
  if (!profile || !profile.skills) return [];
  if (Array.isArray(profile.skills)) {
    return profile.skills.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(profile.skills)
    .split(/[,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const KNOWN_SKILL_TOKENS = [
  'Python',
  'TypeScript',
  'JavaScript',
  'React',
  'Node.js',
  'SQL',
  'PyTorch',
  'TensorFlow',
  'LangGraph',
  'LLM',
  'RAG',
  'AWS',
  'Docker',
  'Kubernetes',
  'FastAPI',
  'Machine Learning',
  'Deep Learning',
  'NLP',
  'Data Science',
  'Go',
  'Rust',
  'Java',
  'GraphQL',
  'PostgreSQL'
];

export function extractCandidateSkills(
  evidence: CandidateEvidence | null,
  profile: CandidateProfile | null
): string[] {
  const fromProfile = parseSkillsFromProfile(profile);
  const textCorpus = [
    evidence?.resume?.text || '',
    evidence?.naukri?.text || '',
    evidence?.linkedin?.text || '',
    profile?.headline || '',
    profile?.summary || ''
  ]
    .join(' ')
    .toLowerCase();

  const seen = new Set<string>();
  const result: string[] = [];

  for (const s of fromProfile) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(s);
    }
  }

  if (textCorpus.trim().length > 0) {
    for (const token of KNOWN_SKILL_TOKENS) {
      const lower = token.toLowerCase();
      if (!seen.has(lower) && textCorpus.includes(lower)) {
        seen.add(lower);
        result.push(token);
      }
    }
  }

  return result.slice(0, 14);
}

export function extractJobSkills(job: NormalizedJob): string[] {
  if (Array.isArray(job.skills) && job.skills.length > 0) {
    return job.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
  }
  const haystack = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  if (!haystack.trim()) return [];
  const matched: string[] = [];
  for (const token of KNOWN_SKILL_TOKENS) {
    if (haystack.includes(token.toLowerCase())) {
      matched.push(token);
      if (matched.length >= 6) break;
    }
  }
  return matched;
}

export async function loadVisualSnapshot(): Promise<VisualStorageSnapshot> {
  if (!hasExtensionStorage()) {
    return {
      jobs: [],
      candidateEvidence: null,
      candidateProfile: null,
      scheduledScans: [],
      companyIntel: []
    };
  }

  const raw = await storageGet<Record<string, unknown>>([
    'jobs',
    'candidateEvidence',
    'candidateProfile',
    'scheduledScans',
    'companyIntel'
  ]);

  return {
    jobs: asArray<NormalizedJob>(raw.jobs),
    candidateEvidence: (raw.candidateEvidence as CandidateEvidence) || null,
    candidateProfile: (raw.candidateProfile as CandidateProfile) || null,
    scheduledScans: asArray<ScheduledScan>(raw.scheduledScans),
    companyIntel: asArray<unknown>(raw.companyIntel)
  };
}
