import React from 'react';
import { Icon } from '../../components/ui';

export const TeacherPlanning: React.FC = () => (
  <div className="page-fade">
    <div className="topbar">
      <div>
        <h1>Planning</h1>
        <div className="sub">Lessons + targets across your 12 children · AI-assisted</div>
      </div>
      <div className="topbar-actions">
        <button className="btn primary"><Icon name="sparkle" size={13}/> Generate week plan</button>
      </div>
    </div>
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>This week's plan</h3>
      {['Mon','Tue','Wed','Thu','Fri'].map(d => (
        <div key={d} className="row" style={{ padding: '14px 0', borderBottom: '1px dashed var(--line)', gap: 16 }}>
          <div className="mono" style={{ width: 40, color: 'var(--ink-4)' }}>{d}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Language · Sensorial · Mathematics · Outdoor</div>
            <div className="muted" style={{ fontSize: 12.5 }}>4 AI-drafted lessons · 2 accepted · 1 edited · 1 pending review</div>
          </div>
          <span className="chip"><Icon name="sparkle" size={11}/> 4 AI drafts</span>
        </div>
      ))}
    </div>
  </div>
);

export default TeacherPlanning;
