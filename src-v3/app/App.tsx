import React, { useCallback, useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  Briefcase,
  Building2,
  Command,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Play,
  Radar,
  Sparkles,
  UserCheck,
  Zap
} from 'lucide-react';
import type { ApplyraAppearance, ApplyraMotionMode } from '../../web-src/types.ts';
import { applyAppearanceToDom, getSavedAppearance } from '../../web-src/appearance/presets.ts';
import { applyMotionModeToDom, getMotionConfig, getSavedMotionMode } from '../../web-src/appearance/motion.ts';
import { AppearanceStudio } from '../../web-src/components/AppearanceStudio.tsx';
import {
  fetchApplyraStore,
  triggerRuntimeAction,
  updateJobStatus,
  type ApplyraStoreState
} from './data/applyra-store.ts';
import { CommandPalette, type RouteId } from './components/CommandPalette.tsx';
import { OverviewView } from './views/OverviewView.tsx';
import { OpportunitiesView } from './views/OpportunitiesView.tsx';
import { ResumeStudioView } from './views/ResumeStudioView.tsx';
import { ScansView } from './views/ScansView.tsx';

const WORKSPACES: Array<{ id: RouteId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'resume', label: 'Resume Studio', icon: FileText },
  { id: 'scans', label: 'Scheduled Scans', icon: Radar }
];

const SUITE_LINKS = [
  { label: 'Operations & Vault', href: 'apply-engine.html', icon: Zap },
  { label: 'Company & Comp Intel', href: 'company-intel.html', icon: Building2 },
  { label: 'Career Suite', href: 'career-suite.html', icon: Sparkles },
  { label: 'Naukri Profile', href: 'naukri-profile.html', icon: UserCheck },
  { label: 'Visual Laboratory', href: 'visual-lab.html', icon: FlaskConical }
];

export const ApplyraV3App: React.FC = () => {
  const [route, setRoute] = useState<RouteId>('overview');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [appearance, setAppearance] = useState<ApplyraAppearance>(() => getSavedAppearance());
  const [motionMode, setMotionMode] = useState<ApplyraMotionMode>(() => getSavedMotionMode());
  const [toast, setToast] = useState<string | null>(null);
  const [store, setStore] = useState<ApplyraStoreState>({
    jobs: [],
    candidateEvidence: null,
    candidateProfile: null,
    scheduledScans: [],
    candidateSkills: [],
    userName: 'Candidate',
    userEmail: 'Loading…',
    extensionConnected: false
  });

  const refreshStore = useCallback(() => {
    fetchApplyraStore()
      .then(setStore)
      .catch((err) => console.warn('[Applyra 3.0] store fetch error:', err));
  }, []);

  useEffect(() => {
    applyAppearanceToDom(appearance, false);
    applyMotionModeToDom(motionMode, false);
  }, [appearance, motionMode]);

  useEffect(() => {
    refreshStore();
    const w = window as unknown as {
      chrome?: {
        storage?: {
          onChanged?: {
            addListener: (fn: () => void) => void;
            removeListener: (fn: () => void) => void;
          };
        };
      };
    };
    w.chrome?.storage?.onChanged?.addListener(refreshStore);
    window.addEventListener('applyra:evidence-updated', refreshStore);
    return () => {
      w.chrome?.storage?.onChanged?.removeListener(refreshStore);
      window.removeEventListener('applyra:evidence-updated', refreshStore);
    };
  }, [refreshStore]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleStatusChange = async (jobId: string, status: string) => {
    const nextJobs = await updateJobStatus(jobId, status);
    setStore((prev) => ({ ...prev, jobs: nextJobs }));
    showToast(`Updated status to ${status}`);
  };

  const handleTriggerScan = async () => {
    try {
      await triggerRuntimeAction('RUN_SCHEDULED_SCAN_NOW');
      showToast('Scheduled scan dispatched to background worker');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Extension background worker unavailable');
    }
  };

  const motionCfg = getMotionConfig(motionMode);
  const activeTitle = WORKSPACES.find((w) => w.id === route)?.label || 'Overview';

  return (
    <MotionConfig reducedMotion={motionCfg.id === 'reduced' ? 'always' : 'user'}>
      <div className="ap-v3-shell" data-testid="applyra-v3-shell">
        {/* Sidebar */}
        <aside className="ap-v3-sidebar">
          <div className="ap-v3-brand">
            <img src="assets/brand/icon32.png" alt="Applyra" width={26} height={26} />
            <div>
              <strong>Applyra</strong>
              <span className="ap-v3-ver-pill">3.0</span>
            </div>
          </div>

          <div className="ap-v3-nav-group">
            <span className="ap-v3-nav-heading">Workspaces</span>
            {WORKSPACES.map((ws) => {
              const Icon = ws.icon;
              const active = route === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  className={`ap-v3-nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => setRoute(ws.id)}
                  data-nav-route={ws.id}
                >
                  {active && (
                    <motion.span
                      layoutId="v3SidebarActivePill"
                      className="ap-v3-nav-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="ap-v3-nav-content">
                    <Icon size={15} />
                    <span>{ws.label}</span>
                  </span>
                  {ws.id === 'opportunities' && store.jobs.length > 0 && (
                    <span className="ap-v3-nav-count">{store.jobs.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ap-v3-nav-group">
            <span className="ap-v3-nav-heading">Extension Suite</span>
            {SUITE_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a key={link.href} href={link.href} className="ap-v3-nav-item">
                  <span className="ap-v3-nav-content">
                    <Icon size={15} />
                    <span>{link.label}</span>
                  </span>
                </a>
              );
            })}
          </div>

          <div className="ap-v3-sidebar-footer">
            <div className="ap-v3-avatar" aria-hidden="true">
              {store.userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="ap-v3-user-meta">
              <strong>{store.userName}</strong>
              <span>{store.userEmail}</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Column */}
        <div className="ap-v3-main">
          <header className="ap-v3-topbar">
            <div className="ap-v3-breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>{activeTitle}</strong>
            </div>

            <div className="ap-v3-topbar-actions">
              <button
                type="button"
                className="ap-v3-cmd-trigger"
                onClick={() => setCmdOpen(true)}
                data-testid="v3-command-trigger"
              >
                <Command size={13} />
                <span>Search</span>
                <kbd>Ctrl+K</kbd>
              </button>

              <AppearanceStudio
                appearance={appearance}
                motionMode={motionMode}
                onAppearanceChange={setAppearance}
                onMotionChange={setMotionMode}
              />

              <button type="button" className="ap-v3-btn-primary" onClick={handleTriggerScan}>
                <Play size={13} /> Run Scan
              </button>
            </div>
          </header>

          <main className="ap-v3-content">
            {route === 'overview' && (
              <OverviewView
                store={store}
                appearance={appearance}
                motionMode={motionMode}
                onNavigate={setRoute}
              />
            )}
            {route === 'opportunities' && (
              <OpportunitiesView store={store} onStatusChange={handleStatusChange} />
            )}
            {route === 'resume' && <ResumeStudioView store={store} onRefresh={refreshStore} />}
            {route === 'scans' && <ScansView store={store} onRefresh={refreshStore} />}
          </main>
        </div>

        <CommandPalette
          open={cmdOpen}
          onOpenChange={setCmdOpen}
          onNavigate={setRoute}
          onAppearanceChange={setAppearance}
          onTriggerScan={handleTriggerScan}
        />

        {toast && (
          <div className="ap-v3-toast" role="status">
            {toast}
          </div>
        )}
      </div>
    </MotionConfig>
  );
};
