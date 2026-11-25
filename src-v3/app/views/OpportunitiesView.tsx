import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, ExternalLink, Search, X } from 'lucide-react';
import type { NormalizedJob } from '../../../web-src/types.ts';
import type { ApplyraStoreState } from '../data/applyra-store.ts';
import { extractJobSkills } from '../../../web-src/data/storage-bridge.ts';

interface OpportunitiesViewProps {
  store: ApplyraStoreState;
  onStatusChange: (jobId: string, status: string) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  store,
  onStatusChange
}) => {
  const [query, setQuery] = useState('');
  const [minFit, setMinFit] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [compact, setCompact] = useState(false);
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.jobs
      .filter((job) => {
        const fit = Number(job.fitScore ?? 0);
        if (fit < minFit) return false;
        const status = String(job.status || 'new').toLowerCase();
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (!q) return true;
        return (
          (job.title || '').toLowerCase().includes(q) ||
          (job.company || '').toLowerCase().includes(q) ||
          (job.location || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 250);
  }, [store.jobs, query, minFit, statusFilter]);

  const exportCsv = () => {
    const headers = ['Title', 'Company', 'Location', 'FitScore', 'Status', 'Source', 'URL'];
    const lines = [
      headers.join(','),
      ...filtered.map((j) =>
        [j.title, j.company, j.location, j.fitScore ?? '', j.status || 'new', j.sourceLabel || j.source, j.url]
          .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
          .join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applyra-opportunities.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const candidateSkillSet = useMemo(
    () => new Set(store.candidateSkills.map((s) => s.toLowerCase())),
    [store.candidateSkills]
  );

  return (
    <div className="ap-v3-view" data-testid="v3-opportunities">
      <div className="ap-v3-panel">
        <div className="ap-v3-filter-bar">
          <div className="ap-v3-search-wrap">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search role, company, or location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
          </select>

          <label className="ap-v3-fit-slider">
            <span>Min Fit {minFit}%</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minFit}
              onChange={(e) => setMinFit(Number(e.target.value))}
            />
          </label>

          <button type="button" className="ap-v3-btn-ghost" onClick={() => setCompact((c) => !c)}>
            {compact ? 'Comfortable' : 'Compact'}
          </button>

          <button type="button" className="ap-v3-btn-ghost" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={13} /> Export CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="ap-v3-empty-state">
            <strong>No matching opportunities found</strong>
            <span>
              {store.jobs.length === 0
                ? 'Run an extraction or scheduled scan to populate your opportunities table.'
                : 'Adjust your search query or minimum fit filter.'}
            </span>
          </div>
        ) : (
          <div className="ap-v3-table-wrap">
            <table className={`ap-v3-table ${compact ? 'is-compact' : ''}`}>
              <thead>
                <tr>
                  <th>Fit</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={selectedJob?.id === job.id ? 'is-selected' : ''}
                  >
                    <td className="num">{job.fitScore != null ? `${Math.round(job.fitScore)}%` : '—'}</td>
                    <td className="role-cell">{job.title || 'Untitled Role'}</td>
                    <td>{job.company || '—'}</td>
                    <td>{job.location || '—'}</td>
                    <td>{job.sourceLabel || job.source || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={job.status || 'new'}
                        onChange={(e) => onStatusChange(job.id, e.target.value)}
                        aria-label={`Status for ${job.title}`}
                      >
                        <option value="new">New</option>
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Spatial Job Detail Drawer */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            className="ap-v3-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJob(null)}
          >
            <motion.aside
              className="ap-v3-drawer"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ap-v3-drawer-head">
                <div>
                  <span className="ap-v3-eyebrow">{selectedJob.company || 'Employer'}</span>
                  <h3>{selectedJob.title}</h3>
                </div>
                <button type="button" className="ap-v3-icon-btn" onClick={() => setSelectedJob(null)}>
                  <X size={15} />
                </button>
              </div>

              <div className="ap-v3-drawer-meta">
                <span>{selectedJob.location || 'Location unspecified'}</span>
                {selectedJob.experience && <span>{selectedJob.experience}</span>}
                {selectedJob.salaryText && <span>{selectedJob.salaryText}</span>}
              </div>

              <div className="ap-v3-drawer-section">
                <h4>Matched &amp; Detected Role Skills</h4>
                <div className="ap-v3-skill-chips">
                  {extractJobSkills(selectedJob).map((sk) => {
                    const hit = candidateSkillSet.has(sk.toLowerCase());
                    return (
                      <span key={sk} className={`ap-v3-chip ${hit ? 'is-hit' : ''}`}>
                        {sk}
                      </span>
                    );
                  })}
                  {extractJobSkills(selectedJob).length === 0 && (
                    <span className="ap-v3-muted">No structured skill tokens detected in description.</span>
                  )}
                </div>
              </div>

              <div className="ap-v3-drawer-section">
                <h4>Job Description</h4>
                <p className="ap-v3-desc">{selectedJob.description || 'No description captured.'}</p>
              </div>

              <div className="ap-v3-drawer-foot">
                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ap-v3-btn-primary"
                  >
                    Open Original Listing <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
