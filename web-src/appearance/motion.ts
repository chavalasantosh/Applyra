import type { ApplyraMotionMode } from '../types.ts';

export interface MotionModeConfig {
  id: ApplyraMotionMode;
  label: string;
  description: string;
  durationFast: number;
  durationBase: number;
  springStiffness: number;
  springDamping: number;
  enableParticles: boolean;
  enableStagger: boolean;
}

export const MOTION_MODES: MotionModeConfig[] = [
  {
    id: 'reduced',
    label: 'Reduced',
    description: 'Zero decorative motion · Instant state changes',
    durationFast: 0,
    durationBase: 0,
    springStiffness: 1000,
    springDamping: 100,
    enableParticles: false,
    enableStagger: false
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Crisp precision · Fast micro-transitions',
    durationFast: 0.14,
    durationBase: 0.2,
    springStiffness: 460,
    springDamping: 36,
    enableParticles: false,
    enableStagger: false
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    description: 'Fluid springs · Shared-element layout morphing',
    durationFast: 0.18,
    durationBase: 0.28,
    springStiffness: 380,
    springDamping: 30,
    enableParticles: true,
    enableStagger: true
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Expressive springs · Staggered pipeline reveals',
    durationFast: 0.24,
    durationBase: 0.38,
    springStiffness: 280,
    springDamping: 24,
    enableParticles: true,
    enableStagger: true
  }
];

export const MOTION_STORAGE_KEY = 'applyra-motion-mode';

export function isValidMotionMode(value: unknown): value is ApplyraMotionMode {
  return MOTION_MODES.some((m) => m.id === value);
}

export function prefersOsReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

export function getSavedMotionMode(): ApplyraMotionMode {
  try {
    const saved = localStorage.getItem(MOTION_STORAGE_KEY);
    if (isValidMotionMode(saved)) return saved;
  } catch {
    // Ignore storage restrictions
  }
  return prefersOsReducedMotion() ? 'reduced' : 'enhanced';
}

export function getMotionConfig(mode: ApplyraMotionMode): MotionModeConfig {
  if (prefersOsReducedMotion() && mode !== 'reduced') {
    return MOTION_MODES[0];
  }
  return MOTION_MODES.find((m) => m.id === mode) ?? MOTION_MODES[2];
}

export function applyMotionModeToDom(mode: ApplyraMotionMode, persist = true): MotionModeConfig {
  const effective = getMotionConfig(mode);
  const root = document.documentElement;
  root.setAttribute('data-motion', effective.id);

  if (persist) {
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, mode);
    } catch {
      // Ignore storage restriction
    }
    try {
      const w = window as unknown as { chrome?: { storage?: { local?: { set: (v: Record<string, unknown>) => void } } } };
      w.chrome?.storage?.local?.set({ applyraMotionMode: mode });
    } catch {
      // Ignore extension storage restriction
    }
  }

  window.dispatchEvent(new CustomEvent('applyra:motion-changed', { detail: effective }));
  return effective;
}
