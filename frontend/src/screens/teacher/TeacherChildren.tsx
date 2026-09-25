import React, { useEffect, useState } from 'react';
import { Icon, Trend } from '../../components/ui';
import type { MasteryTrend } from '../../lib/progress-api';
import { useAppStore } from '../../store/app-store';
import { fetchChildren } from '../../lib/children-api';
import type { RealChild } from '../../lib/children-api';
import { fetchClassProgress } from '../../lib/progress-api';
import { ageFromDob, initialsFromName } from '../../lib/child-fields';

interface TeacherChildrenProps {
  onChild: (id: string) => void;
}

interface RosterChild {
  id: number;
  name: string;
  age: number | null;
  initials: string;
  tone: string;
  style: string | null;
  flags: string[];
  mastery: number | null;
  trend: MasteryTrend;
}

export const TeacherChildren: React.FC<TeacherChildrenProps> = ({ onChild }) => {
  const token = useAppStore(s => s.token);
  const [roster, setRoster] = useState<RosterChild[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');

  useEffect(() => {
    if (!token) { setError('You need to be signed in to see your classroom.'); setLoading(false); return; }
    let cancelled = false;
    Promise.all([fetchChildren(token), fetchClassProgress(token)])
      .then(([children, progress]: [RealChild[], Awaited<ReturnType<typeof fetchClassProgress>>]) => {
        if (cancelled) return;
        const progressById = new Map(progress.children.map(c => [c.child_id, c]));
        setRoster(children.map((c): RosterChild => ({
          id: c.id,
          name: c.name,
          age: ageFromDob(c.dob),
          initials: c.initials || initialsFromName(c.name),
          tone: c.tone ?? 'sage',
          style: c.style,
          flags: c.flags,
          mastery: progressById.get(c.id)?.mastery ?? null,
          trend: progressById.get(c.id)?.trend ?? 'steady',
        })));
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading your classroom…</div>;
  if (error || !roster) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load your classroom.'}</div>;

  const filtered = filter === 'flagged' ? roster.filter(c => c.flags.length > 0) : roster;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Your classroom</h1>
          <div className="sub">{roster.length} {roster.length === 1 ? 'child' : 'children'} · All data linked to their Digital Child Profile.</div>
        </div>
        <div className="topbar-actions">
          <div className="row" style={{ gap: 4, padding: 4, background: 'var(--paper)', borderRadius: 999, border: '1px solid var(--line)' }}>
            <button className="btn ghost" onClick={() => setFilter('all')} aria-pressed={filter === 'all'}
              style={{ background: filter === 'all' ? 'var(--ink)' : 'transparent', color: filter === 'all' ? 'var(--cream)' : 'var(--ink-2)' }}>All</button>
            <button className="btn ghost" onClick={() => setFilter('flagged')} aria-pressed={filter === 'flagged'}
              style={{ background: filter === 'flagged' ? 'var(--ink)' : 'transparent', color: filter === 'flagged' ? 'var(--cream)' : 'var(--ink-2)' }}>To review</button>
          </div>
        </div>
      </div>
      <div className="grid grid-4">
        {filtered.map(c => <ChildCard key={c.id} child={c} onClick={() => onChild(String(c.id))}/>)}
      </div>
      {filtered.length === 0 && (
        <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>
          {roster.length === 0 ? 'No children in your class yet.' : 'No children match this filter.'}
        </div>
      )}
    </div>
  );
};

export const ChildCard: React.FC<{ child: RosterChild; onClick: () => void }> = ({ child, onClick }) => (
  <button className={`card child-card tone-${child.tone}`} onClick={onClick} style={{ textAlign: 'left', width: '100%' }}>
    <div className="row between" style={{ marginBottom: 12 }}>
      <div className="avatar-lg">{child.initials}</div>
      <Trend dir={child.trend}/>
    </div>
    <div style={{ fontWeight: 800, fontSize: 15 }}>{child.name}</div>
    <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>{child.age !== null ? `Age ${child.age}` : 'Age unknown'}{child.style ? ` · ${child.style}` : ''}</div>
    <div className="row between" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>
      <span className="tiny">Mastery</span>
      <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{child.mastery !== null ? `${child.mastery}%` : '—'}</span>
    </div>
    <div className="bar"><span style={{ width: (child.mastery ?? 0) + '%' }}/></div>
    {child.flags.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <span className="chip" style={{ background: 'var(--ochre-soft)', color: 'var(--ochre-ink)', border: 'none' }}>
          <Icon name="flag" size={11}/> Pattern to review
        </span>
      </div>
    )}
  </button>
);

export default TeacherChildren;
