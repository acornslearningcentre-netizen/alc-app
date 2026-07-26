import React, { useState } from 'react';
import { Icon, Sparkline, Trend } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

type Filter = 'all' | 'flagged' | 'low';

export const LeaderCohorts: React.FC = () => {
  const { children } = ALC_DATA;
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = children.filter(c => {
    if (filter === 'flagged') return c.flags?.length;
    if (filter === 'low') return c.mastery < 65;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${children.length})` },
    { key: 'flagged', label: `Flagged (${children.filter(c => c.flags?.length).length})` },
    { key: 'low', label: `Mastery <65% (${children.filter(c => c.mastery < 65).length})` },
  ];

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Cohort overview</h1>
          <div className="sub">All children · whole-school view · trend, not rank</div>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16 }} role="tablist" aria-label="Filter cohort">
        {filters.map(f => (
          <button key={f.key} role="tab" aria-selected={filter === f.key}
            className={`btn ${filter === f.key ? 'primary' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="card">
        {filtered.map((c, i) => (
          <div key={c.id} className={`row tone-${c.tone}`} style={{ padding: '14px 0', borderBottom: i < filtered.length - 1 ? '1px dashed var(--line)' : 'none', gap: 14 }}>
            <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{c.initials}</div>
            <div style={{ width: 180, fontWeight: 700, fontSize: 13.5 }}>
              {c.name}
              <div className="muted" style={{ fontSize: 11.5, fontWeight: 400 }}>{c.teacher} · Age {c.age}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="bar" style={{ height: 8 }}><span style={{ width: c.mastery + '%' }}/></div>
            </div>
            <div className="mono" style={{ width: 50, textAlign: 'right', color: 'var(--ink-3)' }}>{c.mastery}%</div>
            <div style={{ width: 100 }}>
              <Sparkline values={[c.mastery-16, c.mastery-12, c.mastery-8, c.mastery-5, c.mastery-3, c.mastery]} color="var(--tone)"/>
            </div>
            <Trend dir={c.trend}/>
            {c.flags?.length ? (
              <span className="chip" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 11 }}>
                <Icon name="flag" size={10}/> {c.flags[0]}
              </span>
            ) : <div style={{ width: 80 }}/>}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No children match this filter.</div>
        )}
      </div>
    </div>
  );
};

export default LeaderCohorts;
