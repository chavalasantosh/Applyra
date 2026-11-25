/**
 * Upstream Provenance:
 * - ibelick/motion-primitives (Priority_4_UI_Component_Libraries/ibelick__motion-primitives/components/core/)
 *   - magnetic.tsx
 *   - border-trail.tsx
 *   - text-morph.tsx
 *   - spotlight.tsx
 * - magicuidesign/magicui (Priority_4_UI_Component_Libraries/magicuidesign__magicui/apps/www/registry/magicui/)
 *   - border-beam.tsx
 */
import React, { useState, useEffect, useRef, useMemo, useId, useCallback } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  type Transition,
  type Variants
} from 'motion/react';
import { cn } from '../lib/cn.ts';

const MAGNETIC_SPRING: SpringOptions = { stiffness: 26.7, damping: 4.1, mass: 0.2 };

export function Magnetic({
  children,
  intensity = 0.55,
  range = 100,
  springOptions = MAGNETIC_SPRING,
  className
}: {
  children: React.ReactNode;
  intensity?: number;
  range?: number;
  springOptions?: SpringOptions;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springOptions);
  const springY = useSpring(y, springOptions);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (isHovered && dist <= range) {
        const scale = 1 - dist / range;
        x.set(dx * intensity * scale);
        y.set(dy * intensity * scale);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [isHovered, intensity, range, x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ x: springX, y: springY, display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}

export function BorderBeam({
  size = 64,
  duration = 5,
  colorFrom = '#38bdf8',
  colorTo = '#8b5cf6',
  className
}: {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}) {
  return (
    <div className="ap-lab-beam-mask" aria-hidden="true">
      <motion.div
        className={cn('ap-lab-beam-runner', className)}
        style={{
          width: size,
          height: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo}, transparent)`
        }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ repeat: Infinity, duration, ease: 'linear' }}
      />
    </div>
  );
}

export function TextMorph({
  children,
  className
}: {
  children: string;
  className?: string;
}) {
  const uniqueId = useId();
  const characters = useMemo(() => {
    const counts: Record<string, number> = {};
    return children.split('').map((char) => {
      const lower = char.toLowerCase();
      counts[lower] = (counts[lower] || 0) + 1;
      return {
        id: `${uniqueId}-${lower}${counts[lower]}`,
        label: char === ' ' ? '\u00A0' : char
      };
    });
  }, [children, uniqueId]);

  const variants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };
  const transition: Transition = { type: 'spring', stiffness: 280, damping: 18, mass: 0.3 };

  return (
    <span className={cn('ap-lab-text-morph', className)} aria-label={children}>
      <AnimatePresence mode="popLayout" initial={false}>
        {characters.map((c) => (
          <motion.span
            key={c.id}
            layoutId={c.id}
            className="ap-lab-morph-char"
            aria-hidden="true"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={transition}
          >
            {c.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}

export function Spotlight({
  size = 220,
  className
}: {
  size?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [parent, setParent] = useState<HTMLElement | null>(null);
  const mouseX = useSpring(0, { bounce: 0 });
  const mouseY = useSpring(0, { bounce: 0 });
  const left = useTransform(mouseX, (v) => `${v - size / 2}px`);
  const top = useTransform(mouseY, (v) => `${v - size / 2}px`);

  useEffect(() => {
    const p = containerRef.current?.parentElement;
    if (p) {
      p.style.position = 'relative';
      p.style.overflow = 'hidden';
      setParent(p);
    }
  }, []);

  const onMove = useCallback(
    (ev: MouseEvent) => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      mouseX.set(ev.clientX - rect.left);
      mouseY.set(ev.clientY - rect.top);
    },
    [mouseX, mouseY, parent]
  );

  useEffect(() => {
    if (!parent) return;
    const ac = new AbortController();
    parent.addEventListener('mousemove', onMove, { signal: ac.signal });
    parent.addEventListener('mouseenter', () => setHovered(true), { signal: ac.signal });
    parent.addEventListener('mouseleave', () => setHovered(false), { signal: ac.signal });
    return () => ac.abort();
  }, [parent, onMove]);

  return (
    <motion.div
      ref={containerRef}
      aria-hidden="true"
      className={cn('ap-lab-spotlight', hovered ? 'is-visible' : '', className)}
      style={{ width: size, height: size, left, top }}
    />
  );
}
