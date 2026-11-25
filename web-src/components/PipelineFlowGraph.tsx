import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { NormalizedJob } from '../types.ts';
import type { MotionModeConfig } from '../appearance/motion.ts';

interface PipelineFlowGraphProps {
  jobs: NormalizedJob[];
  motionConfig: MotionModeConfig;
  paused: boolean;
}

interface StageNode {
  id: string;
  label: string;
  count: number;
  tone: 'neutral' | 'info' | 'accent' | 'ok' | 'warn';
}

export const PipelineFlowGraph: React.FC<PipelineFlowGraphProps> = ({
  jobs,
  motionConfig,
  paused
}) => {
  const stages = useMemo<StageNode[]>(() => {
    const captured = jobs.length;
    const strongFit = jobs.filter((j) => Number(j.fitScore ?? 0) >= 70).length;
    const applied = jobs.filter((j) => {
      const s = String(j.status || '').toLowerCase();
      return s === 'applied' || Boolean(j.appliedAt);
    }).length;
    const interviewing = jobs.filter((j) => {
      const s = String(j.status || '').toLowerCase();
      return s.includes('interview');
    }).length;
    const offers = jobs.filter((j) => {
      const s = String(j.status || '').toLowerCase();
      return s.includes('offer');
    }).length;

    return [
      { id: 'captured', label: 'Captured', count: captured, tone: 'neutral' },
      { id: 'strong', label: 'Strong Fit', count: strongFit, tone: 'info' },
      { id: 'applied', label: 'Applied', count: applied, tone: 'accent' },
      { id: 'interview', label: 'Interviews', count: interviewing, tone: 'warn' },
      { id: 'offer', label: 'Offers', count: offers, tone: 'ok' }
    ];
  }, [jobs]);

  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const animateFlow = motionConfig.enableParticles && !paused && jobs.length > 0;

  return (
    <div className="ap-ve-card" data-testid="pipeline-flow-graph">
      <div className="ap-ve-card-head">
        <div>
          <h3>Live Application Pipeline Flow</h3>
          <p>Real-time stage progression derived from stored extension records</p>
        </div>
        <span className="ap-ve-badge">
          {jobs.length} {jobs.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      <div className="ap-ve-pipeline-rail" role="list" aria-label="Pipeline stages">
        {stages.map((stage, idx) => {
          const pct = jobs.length > 0 ? Math.round((stage.count / maxCount) * 100) : 0;
          return (
            <React.Fragment key={stage.id}>
              <motion.div
                role="listitem"
                className={`ap-ve-stage-node tone-${stage.tone}`}
                initial={motionConfig.enableStagger ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionConfig.durationBase,
                  delay: motionConfig.enableStagger ? idx * 0.04 : 0,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <span className="ap-ve-stage-label">{stage.label}</span>
                <strong className="ap-ve-stage-count">{stage.count}</strong>
                <div className="ap-ve-stage-meter" aria-hidden="true">
                  <div
                    className="ap-ve-stage-fill"
                    style={{ transform: `scaleX(${Math.max(pct, stage.count > 0 ? 6 : 0) / 100})` }}
                  />
                </div>
              </motion.div>

              {idx < stages.length - 1 && (
                <div className="ap-ve-stage-connector" aria-hidden="true">
                  <svg viewBox="0 0 36 16" width="36" height="16">
                    <line
                      x1="2"
                      y1="8"
                      x2="34"
                      y2="8"
                      stroke="currentColor"
                      strokeOpacity="0.24"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    {animateFlow && (
                      <motion.circle
                        r="2.5"
                        cy="8"
                        fill="var(--ap-accent)"
                        initial={{ cx: 4, opacity: 0 }}
                        animate={{ cx: [4, 32], opacity: [0, 1, 0] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          delay: idx * 0.25,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
