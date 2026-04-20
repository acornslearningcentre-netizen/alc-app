import React from 'react';
import { Sparkline, Trend } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

export const TeacherProgress: React.FC = () => {
  const { children } = ALC_DATA;
  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Class progress</h1>
          <div className="sub">Mastery across 12 children · trend, not rank</div>
        </div>
      </div>
      <div className="card">
        {children.map(c => (
          <div key={c.id} className={`row tone-${c.tone}`} style={{ padding: '12px 0', borderBottom: '1px dashed var(--line)', gap: 14 }}>
            <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{c.initials}</div>
            <div style={{ width: 160, fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
            <div style={{ flex: 1 }}><div className="bar" style={{ height: 8 }}><span style={{ width: c.mastery + '%' }}/></div></div>
            <div className="mono" style={{ width: 50, textAlign: 'right', color: 'var(--ink-3)' }}>{c.mastery}%</div>
            <div style={{ width: 100 }}><Sparkline values={[c.mastery-16,c.mastery-12,c.mastery-8,c.mastery-5,c.mastery-3,c.mastery]} color="var(--tone)"/></div>
            <Trend dir={c.trend}/>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherProgress;
