import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchChildren } from '../../lib/children-api';
import type { RealChild } from '../../lib/children-api';
import { fetchFlowSteps, updateFlowStep } from '../../lib/flow-api';
import type { RealFlowStep } from '../../lib/flow-api';
import { fetchNextSteps } from '../../lib/next-steps-api';
import type { RealNextStep } from '../../lib/next-steps-api';
import { fetchRecentObservations } from '../../lib/observations-api';
import type { RealObservation } from '../../lib/observations-api';
import { initialsFromName } from '../../lib/child-fields';
import { isoDate } from '../../lib/dates';

interface TeacherTodayProps {
  onChild: (id: string) => void;
  onObserve: () => void;
}

export const TeacherToday: React.FC<TeacherTodayProps> = ({ onChild, onObserve }) => {
  const token = useAppStore(s => s.token);
  const userName = useAppStore(s => s.userName);
  const [children, setChildren] = useState<RealChild[] | null>(null);
  const [flow, setFlow] = useState<RealFlowStep[]>([]);
  const [nextSteps, setNextSteps] = useState<RealNextStep[]>([]);
  const [observations, setObservations] = useState<RealObservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = isoDate();
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    if (!token) { setError('You need to be signed in to see your day.'); setLoading(false); return; }
    let cancelled = false;
    Promise.all([fetchChildren(token), fetchFlowSteps(token, today), fetchNextSteps(token, 'pending'), fetchRecentObservations(token)])
      .then(([c, f, steps, obs]) => {
        if (cancelled) return;
        setChildren(c); setFlow(f); setNextSteps(steps); setObservations(obs); setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, today]);

  const markStepState = async (id: number, state: 'done' | 'now') => {
    if (!token) return;
    const updated = await updateFlowStep(token, id, { state });
    setFlow(steps => steps.map(s => (s.id === id ? updated : s)));
  };

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading your day…</div>;
  if (error || !children) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load your day.'}</div>;

  const childById = new Map(children.map(c => [c.id, c]));
  const classObservations = observations.filter(o => o.child_id !== null && childById.has(Number(o.child_id)));
  const observationsToday = classObservations.filter(o => o.captured_at.slice(0, 10) === today).length;
  const flaggedChildren = children.filter(c => c.flags.length > 0);

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Good morning{userName ? `, ${userName}` : ''}.</h1>
          <div className="sub">{dateLabel} · {children.length} {children.length === 1 ? 'child' : 'children'} in your class</div>
        </div>
        <div className="topbar-actions">
          <button className="btn primary" onClick={onObserve}><Icon name="mic" size={14}/> Capture observation</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 8 }}>Observations today</div>
          <div className="stat-number">{observationsToday}</div>
          <div className="muted" style={{ fontSize: 12 }}>{classObservations.length} across your class total</div>
        </div>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 8 }}>AI suggestions awaiting review</div>
          <div className="row between">
            <div className="stat-number">{nextSteps.length}</div>
            {nextSteps.length > 0 && (
              <span className="chip" style={{ background: 'var(--ochre-soft)', color: 'var(--ochre-ink)', border: 'none' }}>
                <Icon name="sparkle" size={11}/> new
              </span>
            )}
          </div>
        </div>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 8 }}>Children to check in on</div>
          <div className="stat-number" style={{ marginBottom: 4 }}>{flaggedChildren.length}</div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {flaggedChildren.slice(0, 3).map(c => (
              <span key={c.id} className="chip dot" style={{ '--tone': 'var(--ochre)' } as React.CSSProperties}>{c.name} — {c.flags[0]}</span>
            ))}
            {flaggedChildren.length === 0 && <span className="muted" style={{ fontSize: 12 }}>None right now.</span>}
          </div>
        </div>
      </div>

      <div className="grid cols-sidebar-lg" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 14 }}>
            <div>
              <h3>Today's flow</h3>
              <div className="muted">{flow.length === 0 ? 'Nothing scheduled yet.' : 'Tap a step to update it.'}</div>
            </div>
          </div>
          <FlowStrip steps={flow} onMark={markStepState}/>
        </div>
        <AIBriefCard nextSteps={nextSteps} childById={childById} onChild={onChild}/>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 14 }}>
          <div>
            <h3>Recent observations</h3>
            <div className="muted">Across your class · most recent first</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classObservations.slice(0, 4).map(o => {
            const ch = childById.get(Number(o.child_id));
            if (!ch) return null;
            return <ObservationRow key={o.id} obs={o} child={ch} onClick={() => onChild(String(ch.id))}/>;
          })}
          {classObservations.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No observations logged for your class yet.</div>}
        </div>
      </div>
    </div>
  );
};

const FlowStrip: React.FC<{ steps: RealFlowStep[]; onMark: (id: number, state: 'done' | 'now') => void }> = ({ steps, onMark }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {steps.map((s, i) => (
      <div key={s.id} className="row" style={{ padding: '10px 0', borderBottom: i < steps.length - 1 ? '1px dashed var(--line)' : 'none', gap: 14 }}>
        <div className="mono" style={{ color: 'var(--ink-4)', width: 46 }}>{s.time}</div>
        <button
          onClick={() => onMark(s.id, s.state === 'done' ? 'now' : 'done')}
          aria-label={`Mark "${s.label}" as ${s.state === 'done' ? 'now' : 'done'}`}
          style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0, border: s.state === 'now' ? '2px solid var(--ochre)' : 'none', padding: 0, cursor: 'pointer',
            background: s.state === 'done' ? 'var(--sage)' : s.state === 'now' ? 'var(--ochre)' : 'var(--cream-2)',
            boxShadow: s.state === 'now' ? '0 0 0 4px var(--ochre-soft)' : 'none',
          }}
        />
        <div style={{ flex: 1, fontWeight: s.state === 'now' ? 800 : 600, color: s.state === 'done' ? 'var(--ink-4)' : 'var(--ink)', textDecoration: s.state === 'done' ? 'line-through' : 'none' }}>
          {s.label}
        </div>
        {s.ai_suggested && <span className="chip" style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', fontSize: 11 }}><Icon name="sparkle" size={10}/> AI-shaped</span>}
        {s.state === 'now' && <span className="chip" style={{ background: 'var(--ochre)', color: 'var(--ochre-ink)', border: 'none' }}>Now</span>}
      </div>
    ))}
    {steps.length === 0 && <div className="muted" style={{ fontSize: 13, padding: '10px 0' }}>No flow steps set for today yet.</div>}
  </div>
);

const AIBriefCard: React.FC<{ nextSteps: RealNextStep[]; childById: Map<number, RealChild>; onChild: (id: string) => void }> = ({ nextSteps, childById, onChild }) => (
  <div className="ai-panel">
    <div className="row between" style={{ marginBottom: 12 }}>
      <span className="ai-badge"><Icon name="sparkle" size={11}/> AI BRIEF</span>
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.35 }}>
      {nextSteps.length === 0 ? 'No suggestions awaiting review right now.' : 'Suggestions awaiting your review.'}
    </div>
    {nextSteps.length > 0 && (
      <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
        {nextSteps.slice(0, 3).map(s => {
          const child = childById.get(s.child_id);
          return (
            <li key={s.id}>
              {child ? (
                <button onClick={() => onChild(String(child.id))} style={{ color: 'var(--plum-ink)', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0, font: 'inherit', display: 'inline' }}>
                  {child.name}
                </button>
              ) : 'A child'} — {s.title}
              {s.rationale && <span style={{ color: 'var(--ink-3)' }}> · {s.rationale}</span>}
            </li>
          );
        })}
      </ol>
    )}
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 14, fontStyle: 'italic' }}>
      Suggestions, not prescriptions. You know your children.
    </div>
  </div>
);

const ObservationRow: React.FC<{ obs: RealObservation; child: RealChild; onClick: () => void }> = ({ obs, child, onClick }) => (
  <div className={`row tone-${child.tone ?? 'sage'}`} style={{ padding: 12, borderRadius: 12, background: 'var(--cream)', gap: 14, alignItems: 'flex-start' }}>
    <div className="avatar-lg" style={{ width: 36, height: 36, fontSize: 12 }}>{child.initials || initialsFromName(child.name)}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{child.name} <span style={{ color: 'var(--ink-3)', fontWeight: 500, marginLeft: 6 }}>· {obs.kind}</span></div>
        <div className="mono" style={{ color: 'var(--ink-4)' }}>{new Date(obs.captured_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 8 }}>{obs.comment || obs.transcript || '(no text recorded)'}</div>
      <div className="row wrap" style={{ gap: 6 }}>
        {obs.tags.map(t => <span key={t} className="chip tone">{t}</span>)}
      </div>
    </div>
    <button className="btn ghost" onClick={onClick} aria-label={`View ${child.name}'s profile`}><Icon name="arrow-right" size={14}/></button>
  </div>
);

export default TeacherToday;
