import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  AccordionDisclosureDemo,
  BorderBeamDemo,
  MagneticDockDemo,
  ReactBitsAuroraDemo,
  SharedLayoutNavDemo,
  SpatialCardMorphDemo,
  SpotlightCardDemo,
  SpringOdometerDemo,
  TextMorphDemo
} from './demos/MotionDemos.tsx';
import { GlslShaderWaveDemo, ThreeConstellationDemo } from './demos/ThreeDemos.tsx';
import { GsapKineticCounterDemo, GsapScrubberDemo, GsapStaggerDemo } from './demos/GsapDemos.tsx';
import { EChartsRadarDemo, EChartsVelocityDemo, ReactFlowGraphDemo } from './demos/DataVizDemos.tsx';
import {
  AnimatedIconsDemo,
  InteractiveDataTableDemo,
  PerformativeGlassCardDemo,
  RadixDialogDemo,
  RadixMotionTabsDemo
} from './demos/UiAndTableDemos.tsx';

type Category = 'all' | 'motion' | 'webgl' | 'gsap' | 'dataviz' | 'ui';

interface DemoSpec {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  provenance: string;
  render: () => React.ReactNode;
}

const DEMOS: DemoSpec[] = [
  { id: '01-magnetic', title: '01. Magnetic Action Dock', category: 'motion', provenance: 'ibelick/motion-primitives · magnetic.tsx', render: () => <MagneticDockDemo /> },
  { id: '02-shared-nav', title: '02. Shared-Layout Navigation Pill', category: 'motion', provenance: 'motion/react · layoutId spring', render: () => <SharedLayoutNavDemo /> },
  { id: '03-text-morph', title: '03. TextMorph State Switcher', category: 'motion', provenance: 'ibelick/motion-primitives · text-morph.tsx', render: () => <TextMorphDemo /> },
  { id: '04-odometer', title: '04. Spring Odometer Telemetry', category: 'motion', provenance: 'motion/react · useSpring + tabular-nums', render: () => <SpringOdometerDemo /> },
  { id: '05-spatial-morph', title: '05. Spatial Card-to-Detail Morph', category: 'motion', provenance: 'motion/react · AnimatePresence + layoutId', render: () => <SpatialCardMorphDemo /> },
  { id: '06-spotlight', title: '06. Cursor Spotlight Surface', category: 'motion', provenance: 'ibelick/motion-primitives · spotlight.tsx', render: () => <SpotlightCardDemo /> },
  { id: '07-border-beam', title: '07. Animated Perimeter BorderBeam', category: 'motion', provenance: 'magicuidesign/magicui · border-beam.tsx', render: () => <BorderBeamDemo /> },
  { id: '08-accordion', title: '08. Spring Evidence Disclosure', category: 'motion', provenance: 'motion/react · height + opacity', render: () => <AccordionDisclosureDemo /> },
  { id: '09-aurora-webgl', title: '09. WebGL2 GLSL Aurora Shader', category: 'webgl', provenance: 'DavidHDev/react-bits · Aurora.tsx', render: () => <ReactBitsAuroraDemo /> },
  { id: '10-three-3d', title: '10. Three.js 3D Career Constellation', category: 'webgl', provenance: 'mrdoob/three.js · WebGLRenderer', render: () => <ThreeConstellationDemo /> },
  { id: '11-glsl-wave', title: '11. Custom GLSL Telemetry Grid Shader', category: 'webgl', provenance: 'three.js · ShaderMaterial', render: () => <GlslShaderWaveDemo /> },
  { id: '12-gsap-stagger', title: '12. GSAP Staggered Pipeline Reveal', category: 'gsap', provenance: 'greensock/GSAP · gsap.fromTo stagger', render: () => <GsapStaggerDemo /> },
  { id: '13-gsap-scrub', title: '13. GSAP Scrubbed Timeline', category: 'gsap', provenance: 'greensock/GSAP · timeline.progress()', render: () => <GsapScrubberDemo /> },
  { id: '14-gsap-counter', title: '14. GSAP Kinetic Fit Counter', category: 'gsap', provenance: 'greensock/GSAP · gsap.to tween', render: () => <GsapKineticCounterDemo /> },
  { id: '15-echarts-radar', title: '15. ECharts Career Fit Radar', category: 'dataviz', provenance: 'apache/echarts · Radar series', render: () => <EChartsRadarDemo /> },
  { id: '16-echarts-vel', title: '16. ECharts Application Velocity', category: 'dataviz', provenance: 'apache/echarts · Bar + Line', render: () => <EChartsVelocityDemo /> },
  { id: '17-react-flow', title: '17. React Flow Intelligence Graph', category: 'dataviz', provenance: '@xyflow/react · Interactive Node Graph', render: () => <ReactFlowGraphDemo /> },
  { id: '18-glass-card', title: '18. Performative GlassCard Compound', category: 'ui', provenance: 'vorpus/performativeUI · GlassCard.tsx', render: () => <PerformativeGlassCardDemo /> },
  { id: '19-radix-dialog', title: '19. Radix Accessible Modal + Motion', category: 'ui', provenance: '@radix-ui/react-dialog + motion', render: () => <RadixDialogDemo /> },
  { id: '20-radix-tabs', title: '20. Radix Tabs + Shared Indicator', category: 'ui', provenance: '@radix-ui/react-tabs + layoutId', render: () => <RadixMotionTabsDemo /> },
  { id: '21-icons', title: '21. Stateful Animated SVG Icons', category: 'ui', provenance: 'lucide-react + motion/react', render: () => <AnimatedIconsDemo /> },
  { id: '22-data-table', title: '22. Sortable & Filterable Data Table', category: 'ui', provenance: 'Applyra 3.0 · tabular-nums + density', render: () => <InteractiveDataTableDemo /> }
];

const APPEARANCES = ['obsidian', 'ivory', 'spatial', 'cyber', 'graphite', 'aurora'] as const;

export const LabApp: React.FC = () => {
  const [category, setCategory] = useState<Category>('all');
  const [appearance, setAppearance] = useState<(typeof APPEARANCES)[number]>('obsidian');

  useEffect(() => {
    document.documentElement.setAttribute('data-appearance', appearance);
    document.documentElement.setAttribute('data-theme', appearance === 'ivory' ? 'light' : 'dark');
  }, [appearance]);

  const visible = category === 'all' ? DEMOS : DEMOS.filter((d) => d.category === category);

  return (
    <MotionConfig reducedMotion="user">
      <div className="ap-lab-shell" data-testid="visual-lab-shell">
        <header className="ap-lab-header">
          <div>
            <h1>Applyra 3.0 — Visual Laboratory</h1>
            <p>
              22 live, interactive component &amp; graphics demonstrations built from original Universal Agent Arsenal sources and local MV3-safe libraries.
            </p>
          </div>
          <div className="ap-lab-filter-group" aria-label="Appearance switcher">
            {APPEARANCES.map((ap) => (
              <button
                key={ap}
                type="button"
                className={`ap-lab-btn ${appearance === ap ? 'is-active' : ''}`}
                onClick={() => setAppearance(ap)}
              >
                {ap[0].toUpperCase() + ap.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <div className="ap-lab-toolbar">
          <div className="ap-lab-filter-group" role="tablist" aria-label="Demo categories">
            {(
              [
                ['all', `All (${DEMOS.length})`],
                ['motion', 'Motion & Primitives (8)'],
                ['webgl', 'WebGL & 3D (3)'],
                ['gsap', 'GSAP (3)'],
                ['dataviz', 'ECharts & React Flow (3)'],
                ['ui', 'Radix, Glass & Table (5)']
              ] as Array<[Category, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`ap-lab-btn ${category === key ? 'is-active' : ''}`}
                onClick={() => setCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <main className="ap-lab-grid" data-testid="visual-lab-grid">
          {visible.map((demo) => (
            <section key={demo.id} className="ap-lab-card" data-demo-id={demo.id}>
              <div className="ap-lab-card-head">
                <div>
                  <h2>{demo.title}</h2>
                  <p className="ap-lab-provenance">{demo.provenance}</p>
                </div>
                <span className="ap-lab-cat-badge">{demo.category.toUpperCase()}</span>
              </div>
              {demo.render()}
            </section>
          ))}
        </main>
      </div>
    </MotionConfig>
  );
};
