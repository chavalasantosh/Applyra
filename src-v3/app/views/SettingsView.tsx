import React from 'react';
import { Download, RotateCcw } from 'lucide-react';
import type { ApplyraAppearance, ApplyraMotionMode } from '../../../web-src/types.ts';
import type { ApplyraStoreState } from '../data/applyra-store.ts';

interface SettingsViewProps {
  store: ApplyraStoreState;
  appearance: ApplyraAppearance;
  motionMode: ApplyraMotionMode;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  store,
  appearance,
  motionMode
}) => {
  const exportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      appearance,
      motionMode,
      jobsCount: store.jobs.length,
      jobs: store.jobs,
      candidateEvidence: store.candidateEvidence,
      candidateProfile: store.candidateProfile,
      scheduledScans: store.scheduledScans,
      answerVault: store.answerVault
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applyra-v3-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ap-v3-view" data-testid="v3-settings">
      <div className="ap-v3-panel">
        <div className="ap-v3-panel-head">
          <div>
            <h3>Workspace Diagnostics &amp; Backup</h3>
            <span>Applyra 3.0 MV3 Runtime &amp; Storage Telemetry</span>
          </div>
          <button type="button" className="ap-v3-btn-primary" onClick={exportBackup}>
            <Download size={14} /> Export JSON Backup
          </button>
        </div>

        <div className="ap-v3-diag-grid">
          <div className="ap-v3-diag-card">
            <span>Extension Storage</span>
            <strong>{store.extensionConnected ? 'Connected' : 'Preview Mode'}</strong>
          </div>
          <div className="ap-v3-diag-card">
            <span>Appearance / Motion</span>
            <strong>{appearance} / {motionMode}</strong>
          </div>
          <div className="ap-v3-diag-card">
            <span>Stored Jobs</span>
            <strong>{store.jobs.length}</strong>
          </div>
          <div className="ap-v3-diag-card">
            <span>Scheduled Scans</span>
            <strong>{store.scheduledScans.length}</strong>
          </div>
        </div>

        <div className="ap-v3-drawer-section" style={{ marginTop: 18 }}>
          <h4>Standalone &amp; Rollback Surfaces</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a href="visual-lab.html" className="ap-v3-btn-ghost">Open Visual Laboratory (22 Demos)</a>
            <a href="apply-engine.html" className="ap-v3-btn-ghost">Standalone Automation Center</a>
            <a href="company-intel.html" className="ap-v3-btn-ghost">Standalone Company Intel</a>
            <a href="test-lab.html" className="ap-v3-btn-ghost">
              <RotateCcw size={13} /> Diagnostics Test Lab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
