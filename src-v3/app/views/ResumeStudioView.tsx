import React, { useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
import type { ApplyraStoreState } from '../data/applyra-store.ts';
import { saveCandidateEvidence } from '../data/applyra-store.ts';

interface ResumeStudioViewProps {
  store: ApplyraStoreState;
  onRefresh: () => void;
}

export const ResumeStudioView: React.FC<ResumeStudioViewProps> = ({ store, onRefresh }) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const parserUrl = new URL('./assets/career-intelligence/resume-parser.mjs', window.location.href).href;
      const mod = (await import(/* @vite-ignore */ parserUrl)) as {
        parseResumeFile: (f: File) => Promise<{ text: string; pages?: number | null; format?: string }>;
      };
      const parsed = await mod.parseResumeFile(file);
      const nextEvidence = {
        ...(store.candidateEvidence || {}),
        resume: {
          filename: file.name,
          text: parsed.text || '',
          pages: parsed.pages ?? null,
          format: parsed.format || file.name.split('.').pop() || 'txt',
          uploadedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };
      await saveCandidateEvidence(nextEvidence);
      setMessage(`Parsed and saved ${file.name} (${(parsed.text || '').length} chars).`);
      onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to parse resume file.');
    } finally {
      setBusy(false);
    }
  };

  const resume = store.candidateEvidence?.resume;

  return (
    <div className="ap-v3-view" data-testid="v3-resume">
      <div className="ap-v3-panel">
        <div className="ap-v3-panel-head">
          <div>
            <h3>Resume &amp; Career Evidence Studio</h3>
            <span>Real PDF, DOCX &amp; TXT extraction persisted to Chrome Storage</span>
          </div>
          <label className="ap-v3-btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> {busy ? 'Parsing…' : 'Upload Resume'}
            <input type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={handleFile} disabled={busy} />
          </label>
        </div>

        {message && <div className="ap-v3-banner">{message}</div>}

        {resume ? (
          <div className="ap-v3-resume-summary">
            <div className="ap-v3-resume-file">
              <FileCheck2 size={18} />
              <div>
                <strong>{resume.filename}</strong>
                <span>
                  {resume.format?.toUpperCase()} · {resume.text?.length || 0} characters
                  {resume.uploadedAt ? ` · Updated ${new Date(resume.uploadedAt).toLocaleString()}` : ''}
                </span>
              </div>
            </div>

            <div className="ap-v3-drawer-section">
              <h4>Extracted Verified Skills ({store.candidateSkills.length})</h4>
              <div className="ap-v3-skill-chips">
                {store.candidateSkills.map((s) => (
                  <span key={s} className="ap-v3-chip is-hit">{s}</span>
                ))}
                {store.candidateSkills.length === 0 && (
                  <span className="ap-v3-muted">No known skill tokens matched yet.</span>
                )}
              </div>
            </div>

            <div className="ap-v3-drawer-section">
              <h4>Parsed Evidence Preview</h4>
              <pre className="ap-v3-resume-pre">{resume.text?.slice(0, 2400)}</pre>
            </div>
          </div>
        ) : (
          <div className="ap-v3-empty-state">
            <strong>No resume evidence uploaded yet</strong>
            <span>Upload a PDF, DOCX, or TXT resume above to ground skill matching and fit scoring.</span>
          </div>
        )}
      </div>
    </div>
  );
};
