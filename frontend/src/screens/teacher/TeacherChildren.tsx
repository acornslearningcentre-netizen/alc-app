import React, { useState } from 'react';
import { Icon, Trend } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import type { Child } from '../../data/types';

interface TeacherChildrenProps {
  onChild: (id: string) => void;
}

export const TeacherChildren: React.FC<TeacherChildrenProps> = ({ onChild }) => {
  const { children } = ALC_DATA;
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const filtered = filter === 'flagged' ? children.filter(c => c.flags && c.flags.length) : children;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Your classroom</h1>
          <div className="sub">12 children · Sunrise group · All data linked to their Digital Child Profile.</div>
        </div>
        <div className="topbar-actions">
          <div className="row" style={{ gap: 4, padding: 4, background: 'var(--paper)', borderRadius: 999, border: '1px solid var(--line)' }}>
            <button className="btn ghost" onClick={() => setFilter('all')} aria-pressed={filter === 'all'}
              style={{ background: filter === 'all' ? 'var(--ink)' : 'transparent', color: filter === 'all' ? 'var(--cream)' : 'var(--ink-2)' }}>All</button>
            <button className="btn ghost" onClick={() => setFilter('flagged')} aria-pressed={filter === 'flagged'}
              style={{ background: filter === 'flagged' ? 'var(--ink)' : 'transparent', color: filter === 'flagged' ? 'var(--cream)' : 'var(--ink-2)' }}>To review</button>
          </div>
          <button className="btn primary"><Icon name="plus" size={13}/> Add child</button>
        </div>
      </div>
      <div className="grid grid-4">
        {filtered.map(c => <ChildCard key={c.id} child={c} onClick={() => onChild(c.id)}/>)}
      </div>
    </div>
  );
};

export const ChildCard: React.FC<{ child: Child; onClick: () => void }> = ({ child, onClick }) => (
  <button className={`card child-card tone-${child.tone}`} onClick={onClick} style={{ textAlign: 'left', width: '100%' }}>
    <div className="row between" style={{ marginBottom: 12 }}>
      <div className="avatar-lg">{child.initials}</div>
      <Trend dir={child.trend}/>
    </div>
    <div style={{ fontWeight: 800, fontSize: 15 }}>{child.name}</div>
    <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>Age {child.age} · {child.style}</div>
    <div className="row between" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>
      <span className="tiny">Mastery</span>
      <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{child.mastery}%</span>
    </div>
    <div className="bar"><span style={{ width: child.mastery + '%' }}/></div>
    {child.flags && child.flags.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <span className="chip" style={{ background: 'var(--ochre-soft)', color: 'var(--ochre-ink)', border: 'none' }}>
          <Icon name="flag" size={11}/> Pattern to review
        </span>
      </div>
    )}
  </button>
);

export default TeacherChildren;
