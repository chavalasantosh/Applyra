import type { ApplyraAppearance, ApplyraTheme } from '../types.ts';

export interface AppearancePreset {
  id: ApplyraAppearance;
  label: string;
  tagline: string;
  baseTheme: ApplyraTheme;
  swatches: [string, string, string];
}

export const APPEARANCE_PRESETS: AppearancePreset[] = [
  {
    id: 'obsidian',
    label: 'Obsidian',
    tagline: 'Deep slate · Cobalt precision',
    baseTheme: 'dark',
    swatches: ['#090d16', '#0f1624', '#3b82f6']
  },
  {
    id: 'ivory',
    label: 'Ivory',
    tagline: 'Architectural light · Crisp ink',
    baseTheme: 'light',
    swatches: ['#f7f8fb', '#ffffff', '#2563eb']
  },
  {
    id: 'spatial',
    label: 'Spatial',
    tagline: 'Layered glass · Depth & sky',
    baseTheme: 'dark',
    swatches: ['#0b1222', '#132038', '#38bdf8']
  },
  {
    id: 'cyber',
    label: 'Cyber',
    tagline: 'Carbon telemetry · Cyan pulse',
    baseTheme: 'dark',
    swatches: ['#060913', '#0d1528', '#06b6d4']
  },
  {
    id: 'graphite',
    label: 'Graphite',
    tagline: 'Neutral charcoal · Editorial',
    baseTheme: 'dark',
    swatches: ['#111317', '#191d24', '#94a3b8']
  },
  {
    id: 'aurora',
    label: 'Aurora',
    tagline: 'Midnight indigo · Emerald glow',
    baseTheme: 'dark',
    swatches: ['#080e1a', '#0f1b2e', '#10b981']
  }
];

export const APPEARANCE_STORAGE_KEY = 'applyra-appearance';
export const DARK_APPEARANCE_STORAGE_KEY = 'applyra-dark-appearance';

export function isValidAppearance(value: unknown): value is ApplyraAppearance {
  return APPEARANCE_PRESETS.some((p) => p.id === value);
}

export function getPreset(id: ApplyraAppearance): AppearancePreset {
  return APPEARANCE_PRESETS.find((p) => p.id === id) ?? APPEARANCE_PRESETS[0];
}

export function getSavedAppearance(): ApplyraAppearance {
  try {
    const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (isValidAppearance(saved)) return saved;
    const theme = localStorage.getItem('applyra-theme');
    if (theme === 'light') return 'ivory';
  } catch {
    // Ignore storage restriction
  }
  return 'obsidian';
}

export function applyAppearanceToDom(id: ApplyraAppearance, persist = true): AppearancePreset {
  const preset = getPreset(id);
  const root = document.documentElement;
  root.setAttribute('data-appearance', preset.id);
  root.setAttribute('data-theme', preset.baseTheme);
  root.style.colorScheme = preset.baseTheme;

  if (persist) {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, preset.id);
      localStorage.setItem('applyra-theme', preset.baseTheme);
      if (preset.baseTheme === 'dark') {
        localStorage.setItem(DARK_APPEARANCE_STORAGE_KEY, preset.id);
      }
    } catch {
      // Ignore storage restriction
    }
    try {
      const w = window as unknown as { chrome?: { storage?: { local?: { set: (v: Record<string, unknown>) => void } } } };
      w.chrome?.storage?.local?.set({
        applyraAppearance: preset.id,
        applyraTheme: preset.baseTheme
      });
    } catch {
      // Ignore extension storage restriction
    }
  }

  window.dispatchEvent(new CustomEvent('applyra:appearance-changed', { detail: preset }));
  return preset;
}
