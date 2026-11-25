import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export const EChartsRadarDemo: React.FC = () => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [benchmark, setBenchmark] = useState<'ml' | 'fullstack'>('ml');

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el);

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 11 }
      },
      radar: {
        radius: '62%',
        indicator: [
          { name: 'Technical', max: 100 },
          { name: 'Domain', max: 100 },
          { name: 'Impact', max: 100 },
          { name: 'Location', max: 100 },
          { name: 'Seniority', max: 100 },
          { name: 'Comp Fit', max: 100 }
        ],
        axisName: { color: '#cbd5e1', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
        splitArea: { areaStyle: { color: ['rgba(59,130,246,0.03)', 'rgba(59,130,246,0.06)'] } }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: benchmark === 'ml' ? [92, 88, 84, 95, 80, 78] : [86, 76, 82, 95, 84, 82],
              name: 'Candidate Profile',
              areaStyle: { color: 'rgba(59, 130, 246, 0.25)' },
              lineStyle: { color: '#3b82f6', width: 2 },
              itemStyle: { color: '#3b82f6' }
            },
            {
              value: benchmark === 'ml' ? [85, 82, 78, 85, 82, 80] : [88, 80, 80, 85, 80, 80],
              name: benchmark === 'ml' ? 'AI/ML Benchmark' : 'Full-Stack Benchmark',
              areaStyle: { color: 'rgba(16, 185, 129, 0.16)' },
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
  }, [benchmark]);

  return (
    <div className="ap-lab-demo-inner">
      <div ref={chartRef} style={{ width: '100%', height: 220 }} />
      <div className="ap-lab-controls">
        <button
          type="button"
          className={`ap-lab-btn ${benchmark === 'ml' ? 'is-active' : ''}`}
          onClick={() => setBenchmark('ml')}
        >
          AI / ML Benchmark
        </button>
        <button
          type="button"
          className={`ap-lab-btn ${benchmark === 'fullstack' ? 'is-active' : ''}`}
          onClick={() => setBenchmark('fullstack')}
        >
          Full-Stack Benchmark
        </button>
      </div>
    </div>
  );
};

export const EChartsVelocityDemo: React.FC = () => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el);

    const labels = range === '7d'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['W1', 'W2', 'W3', 'W4'];
    const captured = range === '7d' ? [34, 48, 41, 63, 55, 29, 44] : [142, 196, 224, 268];
    const strongFit = range === '7d' ? [12, 19, 15, 27, 22, 11, 18] : [48, 69, 84, 102];

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { top: 24, right: 16, bottom: 26, left: 36 },
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
          name: 'Captured',
          type: 'bar',
          data: captured,
          barWidth: '42%',
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'Strong Fit',
          type: 'line',
          smooth: true,
          data: strongFit,
          lineStyle: { color: '#10b981', width: 2.5 },
          itemStyle: { color: '#10b981' }
        }
      ]
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [range]);

  return (
    <div className="ap-lab-demo-inner">
      <div ref={chartRef} style={{ width: '100%', height: 220 }} />
      <div className="ap-lab-controls">
        <button
          type="button"
          className={`ap-lab-btn ${range === '7d' ? 'is-active' : ''}`}
          onClick={() => setRange('7d')}
        >
          7-Day Window
        </button>
        <button
          type="button"
          className={`ap-lab-btn ${range === '30d' ? 'is-active' : ''}`}
          onClick={() => setRange('30d')}
        >
          30-Day Window
        </button>
      </div>
    </div>
  );
};

const INITIAL_NODES: Node[] = [
  { id: 'resume', position: { x: 20, y: 75 }, data: { label: 'Resume Evidence' } },
  { id: 'skills', position: { x: 210, y: 20 }, data: { label: 'Verified Skills' } },
  { id: 'vault', position: { x: 210, y: 130 }, data: { label: 'Answer Vault' } },
  { id: 'queue', position: { x: 400, y: 75 }, data: { label: 'Apply Queue' } }
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', source: 'resume', target: 'skills', animated: true },
  { id: 'e2', source: 'resume', target: 'vault', animated: true },
  { id: 'e3', source: 'skills', target: 'queue', animated: true },
  { id: 'e4', source: 'vault', target: 'queue', animated: true }
];

export const ReactFlowGraphDemo: React.FC = () => {
  return (
    <div className="ap-lab-demo-inner">
      <div className="ap-lab-flow-box">
        <ReactFlow
          nodes={INITIAL_NODES}
          edges={INITIAL_EDGES}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};
