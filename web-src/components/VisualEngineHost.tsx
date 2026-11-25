import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MotionConfig } from 'motion/react';
import type {
  ApplyraAppearance,
  ApplyraMotionMode,
  VisualStorageSnapshot
} from '../types.ts';
import {
  applyAppearanceToDom,
  getSavedAppearance,
  isValidAppearance
} from '../appearance/presets.ts';
import {
  applyMotionModeToDom,
  getMotionConfig,
  getSavedMotionMode,
  isValidMotionMode
} from '../appearance/motion.ts';
import { loadVisualSnapshot } from '../data/storage-bridge.ts';
import { AppearanceStudio } from './AppearanceStudio.tsx';
import { PipelineFlowGraph } from './PipelineFlowGraph.tsx';
import { SkillNetworkGraph } from './SkillNetworkGraph.tsx';
import { CorpusDistributionChart } from './CorpusDistributionChart.tsx';

interface VisualEngineHostProps {
  topbarSlot: HTMLElement | null;
  overviewSlot: HTMLElement | null;
  isOverviewRoute: boolean;
}

export const VisualEngineHost: React.FC<VisualEngineHostProps> = ({
  topbarSlot,
  overviewSlot,
  isOverviewRoute
}) => {
  const [appearance, setAppearance] = useState<ApplyraAppearance>(() => getSavedAppearance());
  const [motionMode, setMotionMode] = useState<ApplyraMotionMode>(() => getSavedMotionMode());
  const [paused, setPaused] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [snapshot, setSnapshot] = useState<VisualStorageSnapshot>({
    jobs: [],
    candidateEvidence: null,
    candidateProfile: null,
    scheduledScans: [],
    companyIntel: []
  });

  useEffect(() => {
    applyAppearanceToDom(appearance, false);
    applyMotionModeToDom(motionMode, false);
  }, [appearance, motionMode]);

  useEffect(() => {
    const onAppearance = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id?: unknown }>).detail;
      if (detail && isValidAppearance(detail.id)) {
        setAppearance(detail.id);
      }
    };
    const onMotion = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id?: unknown }>).detail;
      if (detail && isValidMotionMode(detail.id)) {
        setMotionMode(detail.id);
      }
    };
    const onVisibility = () => setPaused(document.hidden);

    window.addEventListener('applyra:appearance-changed', onAppearance);
    window.addEventListener('applyra:motion-changed', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('applyra:appearance-changed', onAppearance);
      window.removeEventListener('applyra:motion-changed', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadVisualSnapshot()
        .then((next) => {
          if (active) setSnapshot(next);
        })
        .catch(() => {
          // Keep current snapshot on transient read failure
        });
    };

    refresh();

    const w = window as unknown as {
      chrome?: {
        storage?: {
          onChanged?: {
            addListener: (fn: () => void) => void;
            removeListener: (fn: () => void) => void;
          };
        };
      };
    };
    const onStorageChange = () => refresh();
    w.chrome?.storage?.onChanged?.addListener(onStorageChange);
    window.addEventListener('applyra:evidence-updated', refresh);

    return () => {
      active = false;
      w.chrome?.storage?.onChanged?.removeListener(onStorageChange);
      window.removeEventListener('applyra:evidence-updated', refresh);
    };
  }, [isOverviewRoute]);

  const motionConfig = getMotionConfig(motionMode);

  return (
    <MotionConfig reducedMotion={motionConfig.id === 'reduced' ? 'always' : 'user'}>
      {topbarSlot &&
        createPortal(
          <AppearanceStudio
            appearance={appearance}
            motionMode={motionMode}
            onAppearanceChange={setAppearance}
            onMotionChange={setMotionMode}
          />,
          topbarSlot
        )}

      {isOverviewRoute &&
        overviewSlot &&
        createPortal(
          <section
            className="ap-ve-overview-grid"
            aria-label="Applyra Visual Intelligence"
            data-testid="visual-engine-overview"
          >
            <div className="ap-ve-span-2">
              <PipelineFlowGraph
                jobs={snapshot.jobs}
                motionConfig={motionConfig}
                paused={paused}
              />
            </div>
            <SkillNetworkGraph
              jobs={snapshot.jobs}
              evidence={snapshot.candidateEvidence}
              profile={snapshot.candidateProfile}
              motionConfig={motionConfig}
            />
            <CorpusDistributionChart
              jobs={snapshot.jobs}
              motionConfig={motionConfig}
            />
          </section>,
          overviewSlot
        )}
    </MotionConfig>
  );
};
