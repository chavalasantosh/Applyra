import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { CandidateEvidence, CandidateProfile, NormalizedJob } from '../types.ts';
import type { MotionModeConfig } from '../appearance/motion.ts';
import { extractCandidateSkills, extractJobSkills } from '../data/storage-bridge.ts';

interface SkillNetworkGraphProps {
  jobs: NormalizedJob[];
  evidence: CandidateEvidence | null;
  profile: CandidateProfile | null;
  motionConfig: MotionModeConfig;
}

export const SkillNetworkGraph: React.FC<SkillNetworkGraphProps> = ({
  jobs,
  evidence,
  profile,
  motionConfig
}) => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const candidateSkills = useMemo(
    () => extractCandidateSkills(evidence, profile),
    [evidence, profile]
  );

  const topJobs = useMemo(() => {
    return jobs.slice(0, 6).map((job) => ({
      job,
      skills: extractJobSkills(job)
    }));
  }, [jobs]);

  const edges = useMemo(() => {
    const links: Array<{ skill: string; jobId: string; matched: boolean }> = [];
    const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
    for (const entry of topJobs) {
      for (const sk of entry.skills) {
        if (candidateSet.has(sk.toLowerCase())) {
          links.push({ skill: sk, jobId: entry.job.id, matched: true });
        }
      }
    }
    return links;
  }, [candidateSkills, topJobs]);

  const width = 560;
  const height = 240;
  const displayedSkills = candidateSkills.slice(0, 8);

  return (
    <div className="ap-ve-card" data-testid="skill-network-graph">
      <div className="ap-ve-card-head">
        <div>
          <h3>Skill-to-Opportunity Graph</h3>
          <p>
            Verified candidate skills mapped against captured role requirements
          </p>
        </div>
        <span className="ap-ve-badge">
          {displayedSkills.length} skills · {topJobs.length} roles
        </span>
      </div>

      {displayedSkills.length === 0 || topJobs.length === 0 ? (
        <div className="ap-ve-empty">
          <strong>No graph edges available yet</strong>
          <span>
            Upload a resume in Career Intelligence and capture jobs in Extractor to map real skill-to-role overlap.
          </span>
        </div>
      ) : (
        <div className="ap-ve-graph-wrap">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="ap-ve-graph-svg"
            role="img"
            aria-label="Candidate skills to captured jobs relationship graph"
          >
            {/* Edges */}
            {displayedSkills.map((skill, sIdx) => {
              const sy = 26 + sIdx * ((height - 44) / Math.max(1, displayedSkills.length - 1));
              return topJobs.map((entry, jIdx) => {
                const jy = 30 + jIdx * ((height - 56) / Math.max(1, topJobs.length - 1));
                const isConnected = edges.some(
                  (e) =>
                    e.jobId === entry.job.id &&
                    e.skill.toLowerCase() === skill.toLowerCase()
                );
                if (!isConnected) return null;
                const active =
                  !selectedSkill || selectedSkill.toLowerCase() === skill.toLowerCase();
                return (
                  <motion.path
                    key={`${skill}-${entry.job.id}`}
                    d={`M 148 ${sy} C 260 ${sy}, 300 ${jy}, 396 ${jy}`}
                    fill="none"
                    stroke="var(--ap-accent)"
                    strokeWidth={active ? 2 : 1}
                    strokeOpacity={active ? 0.68 : 0.14}
                    initial={motionConfig.enableStagger ? { pathLength: 0 } : false}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: motionConfig.durationBase }}
                  />
                );
              });
            })}

            {/* Left column: Verified skills */}
            {displayedSkills.map((skill, sIdx) => {
              const y = 26 + sIdx * ((height - 44) / Math.max(1, displayedSkills.length - 1));
              const isSelected = selectedSkill === skill;
              return (
                <g
                  key={skill}
                  className="ap-ve-graph-node"
                  onClick={() => setSelectedSkill(isSelected ? null : skill)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={8}
                    y={y - 11}
                    width={140}
                    height={22}
                    rx={6}
                    fill={isSelected ? 'var(--ap-accent-soft)' : 'var(--ap-surface-elevated)'}
                    stroke={isSelected ? 'var(--ap-accent)' : 'var(--ap-border)'}
                  />
                  <text
                    x={18}
                    y={y + 4}
                    fill="var(--ap-text)"
                    fontSize="11"
                    fontWeight={isSelected ? 600 : 500}
                  >
                    {skill.length > 18 ? `${skill.slice(0, 17)}…` : skill}
                  </text>
                </g>
              );
            })}

            {/* Right column: Top jobs */}
            {topJobs.map((entry, jIdx) => {
              const y = 30 + jIdx * ((height - 56) / Math.max(1, topJobs.length - 1));
              const label = `${entry.job.title || 'Role'}`;
              return (
                <g key={entry.job.id}>
                  <rect
                    x={396}
                    y={y - 12}
                    width={156}
                    height={24}
                    rx={6}
                    fill="var(--ap-surface-elevated)"
                    stroke="var(--ap-border)"
                  />
                  <text x={406} y={y + 4} fill="var(--ap-text)" fontSize="11" fontWeight={500}>
                    {label.length > 20 ? `${label.slice(0, 19)}…` : label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
