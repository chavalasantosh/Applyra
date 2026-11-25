import React from 'react';
import { createRoot } from 'react-dom/client';
import './visual-engine.css';
import { VisualEngineHost } from './components/VisualEngineHost.tsx';

function detectOverviewRoute(): boolean {
  const activeNav = document.querySelector('.sidebar .nav-item.active, .sidebar [aria-current="page"]');
  if (activeNav) {
    return /overview/i.test(activeNav.textContent || '');
  }
  const crumb = document.getElementById('apBreadcrumb');
  if (crumb) {
    return /overview/i.test(crumb.textContent || '');
  }
  return Boolean(document.getElementById('applyra-overview-health') || document.querySelector('.metric-strip'));
}

function ensureTopbarSlot(): HTMLElement | null {
  const actions = document.querySelector('.topbar-actions');
  if (!actions) return null;
  let slot = document.getElementById('apVisualTopbarSlot');
  if (!slot) {
    slot = document.createElement('div');
    slot.id = 'apVisualTopbarSlot';
    slot.className = 'ap-ve-topbar-slot';
    const themeToggle = actions.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      actions.insertBefore(slot, themeToggle);
    } else {
      actions.appendChild(slot);
    }
  }
  return slot;
}

function ensureOverviewSlot(isOverview: boolean): HTMLElement | null {
  if (!isOverview) return null;
  const existing = document.getElementById('apVisualOverviewSlot');
  if (existing && existing.isConnected) return existing;

  const metricStrip = document.querySelector('.metric-strip');
  const commandCenter = document.getElementById('apCommandCenter');
  const targetParent = metricStrip?.parentElement || commandCenter?.parentElement;
  if (!targetParent) return null;

  const slot = document.createElement('div');
  slot.id = 'apVisualOverviewSlot';
  slot.className = 'ap-ve-overview-slot';
  if (metricStrip) {
    targetParent.insertBefore(slot, metricStrip);
  } else {
    targetParent.appendChild(slot);
  }
  return slot;
}

function bootVisualEngine(): void {
  if (!document.body) return;

  let mountNode = document.getElementById('apVisualEngineHost');
  if (!mountNode) {
    mountNode = document.createElement('div');
    mountNode.id = 'apVisualEngineHost';
    mountNode.style.display = 'contents';
    document.body.appendChild(mountNode);
  }

  const root = createRoot(mountNode);

  const sync = () => {
    const isOverview = detectOverviewRoute();
    const topbarSlot = ensureTopbarSlot();
    const overviewSlot = ensureOverviewSlot(isOverview);
    root.render(
      <React.StrictMode>
        <VisualEngineHost
          topbarSlot={topbarSlot}
          overviewSlot={overviewSlot}
          isOverviewRoute={isOverview}
        />
      </React.StrictMode>
    );
  };

  sync();

  let rafId = 0;
  const observer = new MutationObserver(() => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(sync);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootVisualEngine, { once: true });
} else {
  bootVisualEngine();
}
