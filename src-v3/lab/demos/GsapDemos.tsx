import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const GsapStaggerDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const play = () => {
    if (!containerRef.current) return;
    const nodes = containerRef.current.querySelectorAll('.ap-lab-gsap-pill');
    gsap.killTweensOf(nodes);
    gsap.fromTo(
      nodes,
      { opacity: 0, y: 18, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out' }
    );
  };

  useEffect(() => {
    play();
  }, []);

  return (
    <div className="ap-lab-demo-inner">
      <div ref={containerRef} className="ap-lab-gsap-row">
        {['Parse Resume', 'Extract Skills', 'Rank Roles', 'Tailor Answers', 'Queue Apply'].map((step, i) => (
          <div key={step} className="ap-lab-gsap-pill">
            <span>0{i + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      <div className="ap-lab-controls">
        <button type="button" className="ap-lab-btn" onClick={play}>
          Replay GSAP Stagger
        </button>
      </div>
    </div>
  );
};

export const GsapScrubberDemo: React.FC = () => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [progress, setProgress] = useState(0.45);

  useEffect(() => {
    if (!trackRef.current) return;
    const bar = trackRef.current.querySelector('.ap-lab-scrub-bar');
    const dot = trackRef.current.querySelector('.ap-lab-scrub-dot');
    const tl = gsap.timeline({ paused: true });
    if (bar && dot) {
      tl.fromTo(bar, { scaleX: 0.05 }, { scaleX: 1, duration: 1, ease: 'none' }, 0);
      tl.fromTo(dot, { x: 0 }, { x: 240, duration: 1, ease: 'none' }, 0);
    }
    tl.progress(progress);
    tlRef.current = tl;
    return () => {
      tl.kill();
    };
  }, []);

  const handleScrub = (val: number) => {
    setProgress(val);
    tlRef.current?.progress(val);
  };

  return (
    <div className="ap-lab-demo-inner">
      <div ref={trackRef} className="ap-lab-scrub-stage">
        <div className="ap-lab-scrub-rail">
          <div className="ap-lab-scrub-bar" />
        </div>
        <div className="ap-lab-scrub-dot" />
        <div className="ap-lab-scrub-pct">{Math.round(progress * 100)}% Timeline</div>
      </div>
      <div className="ap-lab-controls">
        <label className="ap-lab-slider-label">
          <span>Scrub Timeline</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};

export const GsapKineticCounterDemo: React.FC = () => {
  const numRef = useRef<HTMLSpanElement | null>(null);
  const [target, setTarget] = useState(94);

  useEffect(() => {
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: target,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.textContent = `${Math.round(obj.val)}%`;
        }
      }
    });
    return () => {
      tween.kill();
    };
  }, [target]);

  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-kinetic-box">
        <span className="ap-lab-kinetic-label">GSAP Kinetic Fit Index</span>
        <span ref={numRef} className="ap-lab-kinetic-num">94%</span>
      </div>
      <div className="ap-lab-controls">
        {[68, 84, 94, 99].map((v) => (
          <button
            key={v}
            type="button"
            className={`ap-lab-btn ${target === v ? 'is-active' : ''}`}
            onClick={() => setTarget(v)}
          >
            Set {v}%
          </button>
        ))}
      </div>
    </div>
  );
};
