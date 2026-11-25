import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { Command, Search, Sparkles, X } from 'lucide-react';
import type { ApplyraAppearance } from '../../../web-src/types.ts';
import { APPEARANCE_PRESETS, applyAppearanceToDom } from '../../../web-src/appearance/presets.ts';

export type RouteId = 'overview' | 'opportunities' | 'resume' | 'scans';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (route: RouteId) => void;
  onAppearanceChange: (ap: ApplyraAppearance) => void;
  onTriggerScan: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onNavigate,
  onAppearanceChange,
  onTriggerScan
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const actions = [
    { id: 'nav-overview', group: 'Workspaces', label: 'Go to Overview Command Center', run: () => onNavigate('overview') },
    { id: 'nav-opps', group: 'Workspaces', label: 'Go to Opportunities & Fit Table', run: () => onNavigate('opportunities') },
    { id: 'nav-resume', group: 'Workspaces', label: 'Go to Resume & Career Intelligence', run: () => onNavigate('resume') },
    { id: 'nav-scans', group: 'Workspaces', label: 'Go to Scheduled Scans', run: () => onNavigate('scans') },
    { id: 'act-scan', group: 'Actions', label: 'Run Job Scan Now', run: onTriggerScan },
    { id: 'ext-apply', group: 'Extension Modules', label: 'Open Operations & Answer Vault (apply-engine.html)', run: () => { window.location.href = 'apply-engine.html'; } },
    { id: 'ext-comp', group: 'Extension Modules', label: 'Open Company & Comp Intel (company-intel.html)', run: () => { window.location.href = 'company-intel.html'; } },
    { id: 'ext-suite', group: 'Extension Modules', label: 'Open Career Suite (career-suite.html)', run: () => { window.location.href = 'career-suite.html'; } },
    ...APPEARANCE_PRESETS.map((p) => ({
      id: `ap-${p.id}`,
      group: 'Appearance',
      label: `Switch Appearance: ${p.label}`,
      run: () => {
        applyAppearanceToDom(p.id, true);
        onAppearanceChange(p.id);
      }
    }))
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()) || a.group.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="ap-v3-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="ap-v3-cmd-dialog"
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="ap-v3-cmd-input-row">
                  <Search size={15} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Jump to workspace, run scan, or switch appearance…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Dialog.Close asChild>
                    <button type="button" className="ap-v3-icon-btn" aria-label="Close command palette">
                      <X size={14} />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="ap-v3-cmd-list">
                  {actions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ap-v3-cmd-item"
                      onClick={() => {
                        item.run();
                        onOpenChange(false);
                      }}
                    >
                      <span className="ap-v3-cmd-label">
                        {item.group === 'Appearance' ? <Sparkles size={13} /> : <Command size={13} />}
                        {item.label}
                      </span>
                      <span className="ap-v3-cmd-group">{item.group}</span>
                    </button>
                  ))}
                  {actions.length === 0 && (
                    <div className="ap-v3-cmd-empty">No matching commands</div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
