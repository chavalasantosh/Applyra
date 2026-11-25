import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Building2, Search } from 'lucide-react';
import type { ApplyraStoreState, CompanyIntelRecord } from '../data/applyra-store.ts';

interface CompanyIntelViewProps {
  store: ApplyraStoreState;
}

export const CompanyIntelView: React.FC<CompanyIntelViewProps> = ({ store }) => {
  const [query, setQuery] = useState('');
  const chartRef = useRef<HTMLDivElement | null>(null);

  const companies = useMemo<CompanyIntelRecord[]>(() => {
    const map = new Map<
      string,
      { rolesCount: number; locations: Set<string>; salaries: Set<string>; sources: Set<string> }
    >();

    for (const job of store.jobs) {
      const name = String(job.company || '').trim();
      if (!name) continue;
      if (!map.has(name)) {
        map.set(name, {
          rolesCount: 0,
          locations: new Set(),
          salaries: new Set(),
          sources: new Set()
        });
      }
      const entry = map.get(name)!;
      entry.rolesCount += 1;
      if (job.location) entry.locations.add(job.location);
      if (job.salaryText && job.salaryText.trim()) entry.salaries.add(job.salaryText.trim());
      if (job.sourceLabel || job.source) entry.sources.add(job.sourceLabel || job.source);
    }

    return Array.from(map.entries())
      .map(([company, data]) => ({
        company,
        rolesCount: data.rolesCount,
        locations: Array.from(data.locations).slice(0, 3),
        salarySamples: Array.from(data.salaries).slice(0, 3),
        sources: Array.from(data.sources).slice(0, 3)
      }))
      .sort((a, b) => b.rolesCount - a.rolesCount);
  }, [store.jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies.slice(0, 40);
    return companies.filter((c) => c.company.toLowerCase().includes(q)).slice(0, 40);
  }, [companies, query]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el);
    const top = companies.slice(0, 8);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { top: 18, right: 16, bottom: 28, left: 40 },
      xAxis: {
        type: 'category',
        data: top.length ? top.map((c) => c.company.slice(0, 14)) : ['No Employers'],
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
          name: 'Captured Roles',
          type: 'bar',
          data: top.length ? top.map((c) => c.rolesCount) : [0],
          barWidth: '40%',
          itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] }
        }
      ]
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [companies]);

  return (
    <div className="ap-v3-view" data-testid="v3-company-intel">
      <div className="ap-v3-panel" style={{ marginBottom: 14 }}>
        <div className="ap-v3-panel-head">
          <div>
            <h3>Employer &amp; Compensation Intelligence</h3>
            <span>
              {companies.length} unique employers · Grounded strictly in captured salary &amp; role evidence
            </span>
          </div>
          <a href="company-intel.html" className="ap-v3-btn-ghost">
            Open Standalone Comp Radar
          </a>
        </div>
        <div ref={chartRef} style={{ width: '100%', height: 210 }} />
      </div>

      <div className="ap-v3-panel">
        <div className="ap-v3-filter-bar">
          <div className="ap-v3-search-wrap">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search employer name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="ap-v3-empty-state">
            <strong>No employer intelligence captured yet</strong>
            <span>Capture job listings to aggregate employer role counts and disclosed salary bands.</span>
          </div>
        ) : (
          <div className="ap-v3-company-grid">
            {filtered.map((c) => (
              <div key={c.company} className="ap-v3-company-card">
                <div className="ap-v3-company-head">
                  <Building2 size={15} />
                  <strong>{c.company}</strong>
                  <span className="ap-v3-nav-count">{c.rolesCount}</span>
                </div>
                <div className="ap-v3-company-meta">
                  <span>Locations: {c.locations.join(', ') || 'Unspecified'}</span>
                  <span>
                    Salary evidence:{' '}
                    {c.salarySamples.length > 0 ? c.salarySamples.join(' · ') : 'Not disclosed in listings'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
