import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'motion/react';
import { ArrowUpRight, Briefcase, CheckCircle2, FileText, Radar } from 'lucide-react';
import type { ApplyraAppearance, ApplyraMotionMode } from '../../../web-src/types.ts';
import type { ApplyraStoreState } from '../data/applyra-store.ts';
import { AuroraWebGL } from '../../upstream/AuroraWebGL.tsx';
import { BorderBeam, Spotlight } from '../../upstream/MotionPrimitives.tsx';
import type { RouteId } from '../components/CommandPalette.tsx';

interface OverviewViewProps {
  store: ApplyraStoreState;
  appearance: ApplyraAppearance;
  motionMode: ApplyraMotionMode;
  onNavigate: (route: RouteId) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  store,
  appearance,
  motionMode,
  onNavigate
}) => {
  const velocityRef = useRef<HTMLDivElement | null>(null);
  const radarRef = useRef<HTMLDivElement | null>(null);

  const metrics = useMemo(() => {
    const total = store.jobs.length;
    const strongFit = store.jobs.filter((j) => Number(j.fitScore ?? 0) >= 70).length;
    const applied = store.jobs.filter(
      (j) => String(j.status || '').toLowerCase() === 'applied' || Boolean(j.appliedAt)
    ).length;
    const interviews = store.jobs.filter((j) =>
      String(j.status || '').toLowerCase().includes('interview')
    ).length;
    const activeScans = store.scheduledScans.filter((s) => s.enabled !== false).length;
    return { total, strongFit, applied, interviews, activeScans };
  }, [store]);

  // ECharts: Source & Status Breakdown (real stored jobs only)
  useEffect(() => {
    const el = velocityRef.current;
    if (!el) return;
    const chart = echarts.init(el);
    const counts = new Map<string, number>();
    for (const job of store.jobs) {
      const src = String(job.sourceLabel || job.source || job.provider || 'Captured').trim() || 'Captured';
      counts.set(src, (counts.get(src) || 0) + 1);
    }
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const labels = entries.length > 0 ? entries.map(([k]) => k) : ['No Jobs'];
    const values = entries.length > 0 ? entries.map(([, v]) => v) : [0];

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { top: 20, right: 16, bottom: 28, left: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } }
      },
      series: [
        {
          name: 'Jobs',
          type: 'bar',
          data: values,
          barWidth: '42%',
          itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] }
        }
      ]
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [store.jobs]);

  // ECharts: Real Readiness Radar (derived strictly from stored evidence & jobs)
  useEffect(() => {
    const el = radarRef.current;
    if (!el) return;
    const chart = echarts.init(el);
    const hasResume = store.candidateEvidence?.resume?.text ? 100 : 0;
    const skillScore = Math.min(100, store.candidateSkills.length * 10);
    const corpusScore = Math.min(100, Math.round((store.jobs.length / 50) * 100));
    const fitCoverage =
      store.jobs.length > 0 ? Math.round((metrics.strongFit / store.jobs.length) * 100) : 0;
    const scanScore = metrics.activeScans > 0 ? 100 : 0;

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      radar: {
        radius: '64%',
        indicator: [
          { name: 'Resume', max: 100 },
          { name: 'Skills', max: 100 },
          { name: 'Corpus', max: 100 },
          { name: 'Strong Fit', max: 100 },
          { name: 'Auto Scans', max: 100 }
        ],
        axisName: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [hasResume, skillScore, corpusScore, fitCoverage, scanScore],
              name: 'Workspace Readiness',
              areaStyle: { color: 'rgba(16, 185, 129, 0.22)' },
              lineStyle: { color: '#10b981', width: 2 },
              itemStyle: { color: '#10b981' }
            }
          ]
        }
      ]
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [store, metrics]);

  const flowNodes: Node[] = useMemo(
    () => [
      { id: 'resume', position: { x: 16, y: 76 }, data: { label: `Resume (${store.candidateEvidence?.resume?.filename ? 'Loaded' : 'Empty'})` } },
      { id: 'skills', position: { x: 205, y: 20 }, data: { label: `Verified Skills (${store.candidateSkills.length})` } },
      { id: 'corpus', position: { x: 205, y: 132 }, data: { label: `Captured Jobs (${metrics.total})` } },
      { id: 'strong', position: { x: 405, y: 76 }, data: { label: `Strong Fit (${metrics.strongFit})` } },
      { id: 'applied', position: { x: 585, y: 76 }, data: { label: `Applied (${metrics.applied})` } }
    ],
    [store.candidateEvidence, store.candidateSkills.length, metrics]
  );

  const flowEdges: Edge[] = useMemo(
    () => [
      { id: 'e1', source: 'resume', target: 'skills', animated: motionMode !== 'reduced' },
      { id: 'e2', source: 'skills', target: 'strong', animated: motionMode !== 'reduced' },
      { id: 'e3', source: 'corpus', target: 'strong', animated: motionMode !== 'reduced' },
      { id: 'e4', source: 'strong', target: 'applied', animated: motionMode !== 'reduced' }
    ],
    [motionMode]
  );

  const showAurora = appearance !== 'ivory' && motionMode !== 'reduced';

  return (
    <div className="ap-v3-view" data-testid="v3-overview">
      {/* Hero Banner with React Bits WebGL2 Aurora */}
      <section className="ap-v3-hero">
        {showAurora && (
          <div className="ap-v3-hero-aurora" aria-hidden="true">
            <AuroraWebGL amplitude={0.85} speed={0.8} />
          </div>
        )}
        <div className="ap-v3-hero-content">
          <div>
            <span className="ap-v3-eyebrow">APPLYRA 3.0 · CAREER OPERATING SYSTEM</span>
            <h2>Welcome back, {store.userName}</h2>
            <p>
              {metrics.total > 0
                ? `${metrics.total} captured opportunities · ${metrics.strongFit} strong matches · ${store.candidateSkills.length} verified skills`
                : 'Upload your resume and run an extraction or scheduled scan to populate your live career pipeline.'}
            </p>
          </div>
          <div className="ap-v3-hero-actions">
            <button type="button" className="ap-v3-btn-primary" onClick={() => onNavigate('opportunities')}>
              Explore Opportunities <ArrowUpRight size={14} />
            </button>
            <button type="button" className="ap-v3-btn-ghost" onClick={() => onNavigate('resume')}>
              Resume Studio
            </button>
          </div>
        </div>
      </section>

      {/* 4 KPI Cards with Spotlight & BorderBeam */}
      <div className="ap-v3-kpi-grid">
        {[
          { label: 'Captured Jobs', value: metrics.total, icon: Briefcase, route: 'opportunities' as RouteId, beam: false },
          { label: 'Strong Fit (70+)', value: metrics.strongFit, icon: CheckCircle2, route: 'opportunities' as RouteId, beam: metrics.strongFit > 0 },
          { label: 'Verified Skills', value: store.candidateSkills.length, icon: FileText, route: 'resume' as RouteId, beam: false },
          { label: 'Active Scans', value: metrics.activeScans, icon: Radar, route: 'scans' as RouteId, beam: false }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.button
              key={kpi.label}
              type="button"
              className="ap-v3-kpi-card"
              onClick={() => onNavigate(kpi.route)}
              initial={motionMode === 'reduced' ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.04 }}
            >
              <Spotlight size={160} />
              {kpi.beam && <BorderBeam size={56} duration={5} colorFrom="#3b82f6" colorTo="#10b981" />}
              <div className="ap-v3-kpi-top">
                <span>{kpi.label}</span>
                <Icon size={15} />
              </div>
              <strong className="ap-v3-kpi-val">{kpi.value}</strong>
            </motion.button>
          );
        })}
      </div>

      {/* Charts & Intelligence Graph */}
      <div className="ap-v3-overview-grid">
        <div className="ap-v3-panel">
          <div className="ap-v3-panel-head">
            <h3>Corpus by Source</h3>
            <span>Live `chrome.storage.local`</span>
          </div>
          <div ref={velocityRef} style={{ width: '100%', height: 230 }} />
        </div>

        <div className="ap-v3-panel">
          <div className="ap-v3-panel-head">
            <h3>Workspace Readiness Radar</h3>
            <span>Evidence &amp; coverage</span>
          </div>
          <div ref={radarRef} style={{ width: '100%', height: 230 }} />
        </div>

        <div className="ap-v3-panel ap-v3-span-2">
          <div className="ap-v3-panel-head">
            <h3>Career Intelligence Pipeline Graph</h3>
            <span>Interactive React Flow topology</span>
          </div>
          <div className="ap-v3-flow-wrap">
            <ReactFlow nodes={flowNodes} edges={flowEdges} fitView proOptions={{ hideAttribution: true }}>
              <Background gap={16} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};
