import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { NormalizedJob } from '../types.ts';
import type { MotionModeConfig } from '../appearance/motion.ts';

interface CorpusDistributionChartProps {
  jobs: NormalizedJob[];
  motionConfig: MotionModeConfig;
}

export const CorpusDistributionChart: React.FC<CorpusDistributionChartProps> = ({
  jobs,
  motionConfig
}) => {
  const buckets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      const key = String(job.sourceLabel || job.source || job.provider || 'Captured').trim() || 'Captured';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [jobs]);

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="ap-ve-card" data-testid="corpus-distribution-chart">
      <div className="ap-ve-card-head">
        <div>
          <h3>Source &amp; Corpus Distribution</h3>
          <p>Breakdown of captured opportunities by origin</p>
        </div>
        <span className="ap-ve-badge">
          {buckets.length} {buckets.length === 1 ? 'source' : 'sources'}
        </span>
      </div>

      {buckets.length === 0 ? (
        <div className="ap-ve-empty">
          <strong>No captured job sources yet</strong>
          <span>Run an extraction or import a CSV to inspect source distribution.</span>
        </div>
      ) : (
        <div className="ap-ve-bars">
          {buckets.map((bucket, idx) => {
            const ratio = bucket.count / maxCount;
            return (
              <div key={bucket.label} className="ap-ve-bar-row">
                <div className="ap-ve-bar-meta">
                  <span>{bucket.label}</span>
                  <strong>{bucket.count}</strong>
                </div>
                <div className="ap-ve-bar-track" aria-hidden="true">
                  <motion.div
                    className="ap-ve-bar-fill"
                    initial={motionConfig.enableStagger ? { scaleX: 0 } : false}
                    animate={{ scaleX: ratio }}
                    transition={{
                      duration: motionConfig.durationBase,
                      delay: motionConfig.enableStagger ? idx * 0.04 : 0,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    style={{ transformOrigin: 'left center' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
