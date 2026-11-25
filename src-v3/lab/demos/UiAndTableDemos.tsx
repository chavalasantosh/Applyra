import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Bookmark, CheckCircle2, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';

export const PerformativeGlassCardDemo: React.FC = () => {
  const [breathing, setBreathing] = useState(true);
  return (
    <div className="ap-lab-demo-inner">
      <article className={`ap-lab-pui-glass ${breathing ? 'is-breathing' : ''}`}>
        <div className="ap-lab-pui-icon">✦</div>
        <h4>Performative GlassCard</h4>
        <p>Compound glassmorphism surface with optional breathing halo and GPU border highlight.</p>
      </article>
      <div className="ap-lab-controls">
        <button type="button" className="ap-lab-btn" onClick={() => setBreathing((b) => !b)}>
          {breathing ? 'Disable Breathing Halo' : 'Enable Breathing Halo'}
        </button>
      </div>
    </div>
  );
};

export const RadixDialogDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ap-lab-demo-inner">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button type="button" className="ap-lab-btn is-active">
            Open Accessible Radix Modal
          </button>
        </Dialog.Trigger>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="ap-lab-modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  className="ap-lab-modal-card"
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="ap-lab-modal-head">
                    <Dialog.Title>Radix Dialog + Motion</Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" className="ap-lab-icon-btn" aria-label="Close">
                        <X size={15} />
                      </button>
                    </Dialog.Close>
                  </div>
                  <Dialog.Description>
                    Focus-trapped, Escape-dismissible WAI-ARIA modal backed by Radix UI primitives and Motion scale entrance.
                  </Dialog.Description>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
};

export const RadixMotionTabsDemo: React.FC = () => {
  const [tab, setTab] = useState('queue');
  const items = [
    { id: 'queue', label: 'Queue', body: 'Verified opportunities ready for explicit candidate review.' },
    { id: 'vault', label: 'Answer Vault', body: 'Zero-inference provenance-backed screening answers.' },
    { id: 'safety', label: 'Safeguards', body: 'Candidate isolation & strict CAPTCHA/OTP boundaries.' }
  ];
  return (
    <div className="ap-lab-demo-inner">
      <Tabs.Root value={tab} onValueChange={setTab} className="ap-lab-radix-tabs">
        <Tabs.List className="ap-lab-radix-tablist" aria-label="Applyra subsystems">
          {items.map((item) => (
            <Tabs.Trigger key={item.id} value={item.id} className="ap-lab-radix-tab">
              {item.label}
              {tab === item.id && (
                <motion.span layoutId="radixTabUnderline" className="ap-lab-radix-underline" />
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {items.map((item) => (
          <Tabs.Content key={item.id} value={item.id} className="ap-lab-radix-panel">
            {item.body}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
};

export const AnimatedIconsDemo: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [verified, setVerified] = useState(true);
  const [spinning, setSpinning] = useState(false);

  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-icon-grid">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          className={`ap-lab-icon-tile ${saved ? 'is-on' : ''}`}
          onClick={() => setSaved((s) => !s)}
        >
          <Bookmark size={18} />
          <span>{saved ? 'Bookmarked' : 'Bookmark'}</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          className={`ap-lab-icon-tile ${verified ? 'is-on' : ''}`}
          onClick={() => setVerified((v) => !v)}
        >
          {verified ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
          <span>{verified ? 'Verified' : 'Verify'}</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          className="ap-lab-icon-tile"
          onClick={() => {
            setSpinning(true);
            setTimeout(() => setSpinning(false), 650);
          }}
        >
          <motion.span animate={{ rotate: spinning ? 360 : 0 }} transition={{ duration: 0.55 }}>
            <RefreshCw size={18} />
          </motion.span>
          <span>Sync</span>
        </motion.button>

        <motion.button type="button" whileHover={{ scale: 1.04 }} className="ap-lab-icon-tile">
          <Sparkles size={18} />
          <span>Analyze</span>
        </motion.button>
      </div>
    </div>
  );
};

const SAMPLE_ROWS = [
  { id: '1', role: 'Senior ML Engineer', company: 'Atlassian', fit: 94, status: 'Ready' },
  { id: '2', role: 'AI Platform Engineer', company: 'Stripe', fit: 91, status: 'Applied' },
  { id: '3', role: 'Staff Frontend Architect', company: 'Linear', fit: 88, status: 'Interview' },
  { id: '4', role: 'Applied AI Scientist', company: 'Vercel', fit: 83, status: 'Ready' }
];

export const InteractiveDataTableDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [compact, setCompact] = useState(false);

  const rows = useMemo(() => {
    return SAMPLE_ROWS.filter(
      (r) =>
        r.role.toLowerCase().includes(query.toLowerCase()) ||
        r.company.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => (sortAsc ? a.fit - b.fit : b.fit - a.fit));
  }, [query, sortAsc]);

  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-controls" style={{ marginBottom: 8, marginTop: 0 }}>
        <input
          type="search"
          className="ap-lab-input"
          placeholder="Filter sample roles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="ap-lab-btn" onClick={() => setSortAsc((s) => !s)}>
          Sort Fit {sortAsc ? '↑' : '↓'}
        </button>
        <button type="button" className="ap-lab-btn" onClick={() => setCompact((c) => !c)}>
          {compact ? 'Comfortable' : 'Compact'}
        </button>
      </div>
      <table className={`ap-lab-table ${compact ? 'is-compact' : ''}`}>
        <thead>
          <tr>
            <th>Fit</th>
            <th>Role</th>
            <th>Company</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="num">{r.fit}%</td>
              <td>{r.role}</td>
              <td>{r.company}</td>
              <td><span className="ap-lab-pill-tag">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
