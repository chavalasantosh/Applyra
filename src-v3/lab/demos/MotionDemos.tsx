import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useSpring } from 'motion/react';
import { ChevronDown, Sparkles, X } from 'lucide-react';
import { BorderBeam, Magnetic, Spotlight, TextMorph } from '../../upstream/MotionPrimitives.tsx';
import { AuroraWebGL } from '../../upstream/AuroraWebGL.tsx';

export const MagneticDockDemo: React.FC = () => {
  const [lastClicked, setLastClicked] = useState('Overview');
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-dock">
        {['Overview', 'Jobs', 'Auto Apply', 'Resume', 'Intel'].map((item) => (
          <Magnetic key={item} intensity={0.48} range={90}>
            <button
              type="button"
              className={`ap-lab-dock-item ${lastClicked === item ? 'is-active' : ''}`}
              onClick={() => setLastClicked(item)}
            >
              {item}
            </button>
          </Magnetic>
        ))}
      </div>
      <div className="ap-lab-controls">
        <span className="ap-lab-hint">Active dock target: <strong>{lastClicked}</strong></span>
      </div>
    </div>
  );
};

export const SharedLayoutNavDemo: React.FC = () => {
  const tabs = ['Overview', 'Opportunities', 'Operations', 'Resume', 'Company'];
  const [active, setActive] = useState('Overview');
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-seg-bar" role="tablist" aria-label="Workspace switcher">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            className={`ap-lab-seg-btn ${active === tab ? 'is-active' : ''}`}
            onClick={() => setActive(tab)}
          >
            {active === tab && (
              <motion.span
                layoutId="labSharedNavPill"
                className="ap-lab-seg-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="ap-lab-seg-label">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const TextMorphDemo: React.FC = () => {
  const states = ['Ready to Apply', 'Interview Stage', 'Offer Received', 'Vault Verified'];
  const [idx, setIdx] = useState(0);
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-morph-stage">
        <TextMorph className="ap-lab-morph-title">{states[idx]}</TextMorph>
      </div>
      <div className="ap-lab-controls">
        <button
          type="button"
          className="ap-lab-btn is-active"
          onClick={() => setIdx((i) => (i + 1) % states.length)}
        >
          Morph Next State
        </button>
      </div>
    </div>
  );
};

export const SpringOdometerDemo: React.FC = () => {
  const [value, setValue] = useState(86);
  const spring = useSpring(value, { stiffness: 180, damping: 22 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return spring.on('change', (latest) => setDisplay(Math.round(latest)));
  }, [spring]);

  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-kinetic-box">
        <span className="ap-lab-kinetic-label">Motion Spring Fit Score</span>
        <span className="ap-lab-kinetic-num">{display}%</span>
      </div>
      <div className="ap-lab-controls">
        {[54, 78, 86, 97].map((n) => (
          <button
            key={n}
            type="button"
            className={`ap-lab-btn ${value === n ? 'is-active' : ''}`}
            onClick={() => setValue(n)}
          >
            {n}%
          </button>
        ))}
      </div>
    </div>
  );
};

export const SpatialCardMorphDemo: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="ap-lab-demo-inner">
      {!expanded ? (
        <motion.button
          type="button"
          layoutId="spatialJobCard"
          className="ap-lab-spatial-card"
          onClick={() => setExpanded(true)}
        >
          <span className="ap-lab-pill-tag">94% Match</span>
          <strong>Staff ML Platform Engineer · Atlassian</strong>
          <span>Click to morph into spatial detail sheet</span>
        </motion.button>
      ) : (
        <div className="ap-lab-spatial-placeholder">Card expanded in spatial layer</div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="ap-lab-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              layoutId="spatialJobCard"
              className="ap-lab-spatial-expanded"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ap-lab-modal-head">
                <strong>Staff ML Platform Engineer · Atlassian</strong>
                <button
                  type="button"
                  className="ap-lab-icon-btn"
                  aria-label="Close"
                  onClick={() => setExpanded(false)}
                >
                  <X size={15} />
                </button>
              </div>
              <p>Shared-element layoutId morph between compact opportunity card and inspection panel.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SpotlightCardDemo: React.FC = () => (
  <div className="ap-lab-demo-inner">
    <div className="ap-lab-spotlight-card">
      <Spotlight size={200} />
      <Sparkles size={18} />
      <h4>Cursor-Tracked Spring Spotlight</h4>
      <p>Move cursor across this surface to drive Motion spring-interpolated radial lighting.</p>
    </div>
  </div>
);

export const BorderBeamDemo: React.FC = () => {
  const [active, setActive] = useState(true);
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-beam-card">
        {active && <BorderBeam size={72} duration={4} colorFrom="#38bdf8" colorTo="#10b981" />}
        <strong>Auto-Apply Engine Armed</strong>
        <p>Magic UI perimeter BorderBeam highlighting live execution state.</p>
      </div>
      <div className="ap-lab-controls">
        <button type="button" className="ap-lab-btn" onClick={() => setActive((a) => !a)}>
          {active ? 'Pause Beam' : 'Activate Beam'}
        </button>
      </div>
    </div>
  );
};

export const AccordionDisclosureDemo: React.FC = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-accordion">
        <button
          type="button"
          className="ap-lab-accordion-trigger"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span>Verified Resume Evidence (PDF)</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={15} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="ap-lab-accordion-body">
                Extracted 12 verified skills, 3.6 yrs experience, and Bengaluru location preference with zero inferred facts.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ReactBitsAuroraDemo: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const [amp, setAmp] = useState(1.0);
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-aurora-box">
        <AuroraWebGL amplitude={amp} speed={1.1} paused={paused} />
        <div className="ap-lab-aurora-overlay">
          <strong>React Bits WebGL2 Aurora</strong>
          <span>GLSL #version 300 es Simplex Noise</span>
        </div>
      </div>
      <div className="ap-lab-controls">
        <button type="button" className="ap-lab-btn" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume Shader' : 'Pause Shader'}
        </button>
        <label className="ap-lab-slider-label">
          <span>Amp {amp.toFixed(1)}</span>
          <input
            type="range"
            min="0.4"
            max="1.8"
            step="0.2"
            value={amp}
            onChange={(e) => setAmp(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};
