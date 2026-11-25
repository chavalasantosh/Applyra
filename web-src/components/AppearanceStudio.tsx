import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Palette, Sparkles, SlidersHorizontal } from 'lucide-react';
import type { ApplyraAppearance, ApplyraMotionMode } from '../types.ts';
import {
  APPEARANCE_PRESETS,
  applyAppearanceToDom,
  getPreset
} from '../appearance/presets.ts';
import {
  MOTION_MODES,
  applyMotionModeToDom,
  prefersOsReducedMotion
} from '../appearance/motion.ts';

interface AppearanceStudioProps {
  appearance: ApplyraAppearance;
  motionMode: ApplyraMotionMode;
  onAppearanceChange: (next: ApplyraAppearance) => void;
  onMotionChange: (next: ApplyraMotionMode) => void;
}

export const AppearanceStudio: React.FC<AppearanceStudioProps> = ({
  appearance,
  motionMode,
  onAppearanceChange,
  onMotionChange
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activePreset = getPreset(appearance);
  const osReduced = prefersOsReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelectAppearance = (id: ApplyraAppearance) => {
    applyAppearanceToDom(id, true);
    onAppearanceChange(id);
  };

  const handleSelectMotion = (mode: ApplyraMotionMode) => {
    applyMotionModeToDom(mode, true);
    onMotionChange(mode);
  };

  return (
    <div className="ap-ve-studio-wrap" ref={rootRef}>
      <button
        type="button"
        className="ap-ve-studio-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Appearance & Motion Engine"
        onClick={() => setOpen((v) => !v)}
        data-testid="appearance-studio-trigger"
      >
        <span
          className="ap-ve-swatch-dot"
          style={{ background: activePreset.swatches[2] }}
          aria-hidden="true"
        />
        <Palette size={14} aria-hidden="true" />
        <span className="ap-ve-trigger-label">{activePreset.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Appearance & Motion Preferences"
            className="ap-ve-studio-popover"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top right' }}
          >
            <div className="ap-ve-studio-head">
              <div>
                <div className="ap-ve-studio-title">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>Appearance Engine</span>
                </div>
                <p className="ap-ve-studio-sub">
                  Six calibrated visual personalities &amp; motion physics.
                </p>
              </div>
            </div>

            <div className="ap-ve-preset-grid" role="radiogroup" aria-label="Visual personality">
              {APPEARANCE_PRESETS.map((preset) => {
                const selected = preset.id === appearance;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`ap-ve-preset-card ${selected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectAppearance(preset.id)}
                    data-appearance-option={preset.id}
                  >
                    <div className="ap-ve-preset-swatches" aria-hidden="true">
                      <span style={{ background: preset.swatches[0] }} />
                      <span style={{ background: preset.swatches[1] }} />
                      <span style={{ background: preset.swatches[2] }} />
                    </div>
                    <div className="ap-ve-preset-meta">
                      <strong>{preset.label}</strong>
                      <span>{preset.tagline}</span>
                    </div>
                    {selected && (
                      <span className="ap-ve-preset-check" aria-hidden="true">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="ap-ve-motion-section">
              <div className="ap-ve-motion-head">
                <span className="ap-ve-motion-label">
                  <SlidersHorizontal size={13} aria-hidden="true" />
                  Motion Physics
                </span>
                {osReduced && (
                  <span className="ap-ve-os-badge">OS Reduced Motion Active</span>
                )}
              </div>
              <div className="ap-ve-motion-pills" role="radiogroup" aria-label="Motion preference">
                {MOTION_MODES.map((m) => {
                  const selected = m.id === motionMode;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      title={m.description}
                      className={`ap-ve-motion-pill ${selected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectMotion(m.id)}
                      data-motion-option={m.id}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
