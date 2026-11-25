import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ExternalLink, ShieldCheck, Sparkles, X } from 'lucide-react';
import {
  saveAnswerVault,
  type AnswerVaultData,
  type ApplyraStoreState
} from '../data/applyra-store.ts';

interface OperationsViewProps {
  store: ApplyraStoreState;
  onStatusChange: (jobId: string, status: string) => void;
  onRefresh: () => void;
}

interface VaultSuggestion {
  key: keyof AnswerVaultData;
  label: string;
  value: string;
  source: string;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  store,
  onStatusChange,
  onRefresh
}) => {
  const [tab, setTab] = useState<'queue' | 'vault'>('queue');
  const [vault, setVault] = useState<AnswerVaultData>(() => store.answerVault || {});
  const [suggestions, setSuggestions] = useState<VaultSuggestion[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const readyQueue = useMemo(() => {
    return store.jobs
      .filter((j) => {
        const s = String(j.status || 'new').toLowerCase();
        return s !== 'applied' && s !== 'archived';
      })
      .slice(0, 60);
  }, [store.jobs]);

  const appliedCount = useMemo(
    () =>
      store.jobs.filter(
        (j) => String(j.status || '').toLowerCase() === 'applied' || Boolean(j.appliedAt)
      ).length,
    [store.jobs]
  );

  // Strictly zero-inference suggestions from explicit stored profile/evidence only
  const handleGenerateSafeSuggestions = () => {
    const next: VaultSuggestion[] = [];
    const p = store.candidateProfile;
    const ev = store.candidateEvidence;

    if (!vault.currentLocation && p?.currentLocation) {
      next.push({
        key: 'currentLocation',
        label: 'Current Location',
        value: String(p.currentLocation),
        source: 'Candidate Profile (currentLocation)'
      });
    }
    if (!vault.preferredLocation && ev?.preferredLocations?.length) {
      next.push({
        key: 'preferredLocation',
        label: 'Preferred Location',
        value: ev.preferredLocations.join(', '),
        source: 'Candidate Evidence (preferredLocations)'
      });
    }
    if (!vault.yearsExperience && (ev?.confirmedYears != null || p?.yearsExperience != null)) {
      const yrs = ev?.confirmedYears ?? p?.yearsExperience;
      next.push({
        key: 'yearsExperience',
        label: 'Years of Experience',
        value: String(yrs),
        source: ev?.confirmedYears != null ? 'Confirmed Resume Years' : 'Candidate Profile'
      });
    }

    setSuggestions(next);
    if (next.length === 0) {
      setToast('No new unpopulated fields found in explicit Candidate Profile/Evidence.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const approveSuggestion = (item: VaultSuggestion) => {
    setVault((prev) => ({ ...prev, [item.key]: item.value }));
    setSuggestions((prev) => prev.filter((s) => s.key !== item.key));
  };

  const handleSaveVault = async (ev: React.FormEvent) => {
    ev.preventDefault();
    await saveAnswerVault(vault);
    setToast('Answer Vault saved to Chrome Storage.');
    setTimeout(() => setToast(null), 3000);
    onRefresh();
  };

  return (
    <div className="ap-v3-view" data-testid="v3-operations">
      <div className="ap-v3-panel">
        <div className="ap-v3-panel-head">
          <div>
            <h3>Operations Center &amp; Answer Vault</h3>
            <span>
              {readyQueue.length} ready in queue · {appliedCount} applied · Zero-inference screening memory
            </span>
          </div>
          <div className="ap-v3-hero-actions">
            <button
              type="button"
              className={tab === 'queue' ? 'ap-v3-btn-primary' : 'ap-v3-btn-ghost'}
              onClick={() => setTab('queue')}
            >
              Application Queue ({readyQueue.length})
            </button>
            <button
              type="button"
              className={tab === 'vault' ? 'ap-v3-btn-primary' : 'ap-v3-btn-ghost'}
              onClick={() => setTab('vault')}
            >
              Answer Vault
            </button>
          </div>
        </div>

        {toast && <div className="ap-v3-banner">{toast}</div>}

        {tab === 'queue' ? (
          readyQueue.length === 0 ? (
            <div className="ap-v3-empty-state">
              <strong>Application queue is empty</strong>
              <span>Capture jobs in Extractor or run a Scheduled Scan to stage applications here.</span>
            </div>
          ) : (
            <div className="ap-v3-table-wrap">
              <table className="ap-v3-table">
                <thead>
                  <tr>
                    <th>Fit</th>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {readyQueue.map((job) => (
                    <tr key={job.id}>
                      <td className="num">{job.fitScore != null ? `${Math.round(job.fitScore)}%` : '—'}</td>
                      <td>{job.title}</td>
                      <td>{job.company || '—'}</td>
                      <td>{job.location || '—'}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ap-v3-btn-ghost"
                          >
                            Apply <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          type="button"
                          className="ap-v3-btn-primary"
                          onClick={() => onStatusChange(job.id, 'applied')}
                        >
                          <Check size={12} /> Mark Applied
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <form onSubmit={handleSaveVault} className="ap-v3-vault-form">
            <div className="ap-v3-vault-toolbar">
              <span className="ap-v3-vault-note">
                <ShieldCheck size={14} /> Applyra never infers work authorization, relocation, or capability claims.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="ap-v3-btn-ghost"
                  onClick={handleGenerateSafeSuggestions}
                >
                  <Sparkles size={13} /> Review Safe Suggestions
                </button>
                <button type="submit" className="ap-v3-btn-primary">
                  Save Answer Vault
                </button>
              </div>
            </div>

            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  className="ap-v3-review-tray"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <div className="ap-v3-review-head">
                    <strong>Pending Safe Suggestions ({suggestions.length})</strong>
                    <button
                      type="button"
                      className="ap-v3-btn-ghost"
                      onClick={() => setSuggestions([])}
                    >
                      Dismiss All
                    </button>
                  </div>
                  {suggestions.map((s) => (
                    <div key={s.key} className="ap-v3-review-row">
                      <div>
                        <strong>{s.label}:</strong> {s.value}
                        <span className="ap-v3-review-src">Source: {s.source}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="ap-v3-btn-primary"
                          onClick={() => approveSuggestion(s)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="ap-v3-icon-btn"
                          aria-label="Dismiss"
                          onClick={() => setSuggestions((prev) => prev.filter((x) => x.key !== s.key))}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="ap-v3-vault-grid">
              {(
                [
                  ['currentLocation', 'Current Location', 'e.g. Bengaluru, India'],
                  ['preferredLocation', 'Preferred Location', 'e.g. Bengaluru, Remote'],
                  ['yearsExperience', 'Years of Experience', 'e.g. 3.6'],
                  ['noticePeriod', 'Notice Period', 'e.g. Immediate / 30 days'],
                  ['currentCtc', 'Current CTC', 'e.g. 12 LPA'],
                  ['expectedCtc', 'Expected CTC', 'e.g. 18 LPA'],
                  ['workAuthorization', 'Work Authorization', 'Explicitly confirm authorization'],
                  ['remotePreference', 'Remote / Hybrid Preference', 'Remote / Hybrid / Onsite'],
                  ['formerEmployers', 'Former Employers', 'e.g. ITC Infotech'],
                  ['linkedinUrl', 'LinkedIn URL', 'https://linkedin.com/in/...'],
                  ['githubUrl', 'GitHub URL', 'https://github.com/...'],
                  ['portfolioUrl', 'Portfolio URL', 'https://...']
                ] as Array<[keyof AnswerVaultData, string, string]>
              ).map(([key, label, placeholder]) => (
                <label key={key} className="ap-v3-field">
                  <span>{label}</span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={vault[key] || ''}
                    onChange={(e) => setVault((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
