import React from 'react';
import { Icon, Sparkline } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

export const LeaderOutcomes: React.FC = () => {
  const { children } = ALC_DATA;

  const strandData = [
    { label: 'Language', avg: 68, trend: [58, 60, 62, 65, 67, 68], color: 'var(--sage)' },
    { label: 'Mathematics', avg: 72, trend: [62, 64, 67, 69, 71, 72], color: 'var(--ochre)' },
    { label: 'Sensorial', avg: 75, trend: [65, 68, 70, 72, 74, 75], color: 'var(--plum)' },
    { label: 'Practical Life', avg: 81, trend: [70, 73, 75, 78, 80, 81], color: 'var(--sky)' },
    { label: 'Cultural', avg: 64, trend: [56, 58, 60, 61, 63, 64], color: 'var(--sage)' },
  ];

  const termData = [
    { term: 'Autumn', mastery: 61, attendance: 91, observations: 98 },
    { term: 'Spring (to date)', mastery: 69, attendance: 93, observations: 127 },
  ];

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Outcomes</h1>
          <div className="sub">Whole-school results · curriculum strands · term comparison</div>
        </div>
        <div className="topbar-actions">
          <button className="btn"><Icon name="chart" size={13}/> Export report</button>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
        {termData.map(t => (
          <div key={t.term} className="card" style={{ padding: 20 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>{t.term}</div>
            <div className="grid grid-3" style={{ gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{t.mastery}%</div>
                <div className="muted" style={{ fontSize: 12 }}>Avg. mastery</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{t.attendance}%</div>
                <div className="muted" style={{ fontSize: 12 }}>Attendance</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{t.observations}</div>
                <div className="muted" style={{ fontSize: 12 }}>Observations</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Mastery by curriculum strand</h3>
        {strandData.map(s => (
          <div key={s.label} className="row" style={{ gap: 14, padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
            <div style={{ width: 110, fontWeight: 700, fontSize: 13.5 }}>{s.label}</div>
            <div style={{ flex: 1 }}>
              <div className="bar" style={{ height: 8 }}><span style={{ width: s.avg + '%' }}/></div>
            </div>
            <div className="mono" style={{ width: 44, textAlign: 'right', color: 'var(--ink-3)', fontSize: 13 }}>{s.avg}%</div>
            <div style={{ width: 120 }}>
              <Sparkline values={s.trend} color={s.color}/>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 14 }}>Cohort distribution</h3>
        <div className="grid grid-3" style={{ gap: 12 }}>
          {[
            { label: 'Exceeding expectations', count: children.filter(c => c.mastery >= 75).length, tone: 'sage' },
            { label: 'Meeting expectations', count: children.filter(c => c.mastery >= 60 && c.mastery < 75).length, tone: 'ochre' },
            { label: 'Needs support', count: children.filter(c => c.mastery < 60).length, tone: 'plum' },
          ].map(group => (
            <div key={group.label} className={`card tone-${group.tone}`} style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 28 }}>{group.count}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{group.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderOutcomes;
