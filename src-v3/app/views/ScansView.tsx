import React, { useState } from 'react';
import { Play, Plus, Radar } from 'lucide-react';
import type { ApplyraStoreState } from '../data/applyra-store.ts';
import { saveScheduledScans, triggerRuntimeAction } from '../data/applyra-store.ts';

interface ScansViewProps {
  store: ApplyraStoreState;
  onRefresh: () => void;
}

export const ScansView: React.FC<ScansViewProps> = ({ store, onRefresh }) => {
  const [queryInput, setQueryInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleAddScan = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const q = queryInput.trim();
    if (!q) return;
    const next = [
      ...store.scheduledScans,
      { id: `scan-${Date.now()}`, name: q, query: q, enabled: true }
    ];
    await saveScheduledScans(next);
    setQueryInput('');
    setStatusMsg(`Saved scheduled scan: "${q}".`);
    onRefresh();
  };

  const handleRunNow = async () => {
    setStatusMsg('Triggering background scan…');
    try {
      await triggerRuntimeAction('RUN_SCHEDULED_SCAN_NOW');
      setStatusMsg('Scan request dispatched to extension background worker.');
      onRefresh();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Background worker unavailable in preview mode.');
    }
  };

  return (
    <div className="ap-v3-view" data-testid="v3-scans">
      <div className="ap-v3-panel">
        <div className="ap-v3-panel-head">
          <div>
            <h3>Scheduled Opportunity Scans</h3>
            <span>Automated discovery schedules synced with `background-scheduled.js`</span>
          </div>
          <button type="button" className="ap-v3-btn-primary" onClick={handleRunNow}>
            <Play size={14} /> Run Scan Now
          </button>
        </div>

        <form className="ap-v3-scan-form" onSubmit={handleAddScan}>
          <input
            type="text"
            placeholder="Role or search query (e.g. Senior ML Engineer Bengaluru)…"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <button type="submit" className="ap-v3-btn-ghost">
            <Plus size={14} /> Add Schedule
          </button>
        </form>

        {statusMsg && <div className="ap-v3-banner">{statusMsg}</div>}

        {store.scheduledScans.length === 0 ? (
          <div className="ap-v3-empty-state">
            <strong>No scheduled scans configured</strong>
            <span>Add a role query above to automate background opportunity discovery.</span>
          </div>
        ) : (
          <div className="ap-v3-scan-list">
            {store.scheduledScans.map((scan) => (
              <div key={scan.id} className="ap-v3-scan-item">
                <div className="ap-v3-scan-left">
                  <Radar size={15} />
                  <div>
                    <strong>{scan.name || scan.query || 'Scheduled Scan'}</strong>
                    <span>
                      {scan.enabled !== false ? 'Active' : 'Paused'}
                      {scan.lastRunAt ? ` · Last run ${new Date(scan.lastRunAt).toLocaleString()}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
