import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui';
import { useAppStore } from '../../../store/app-store';
import { fetchChildren } from '../../../lib/children-api';
import type { RealChild } from '../../../lib/children-api';
import { fetchFlowSteps, updateFlowStep } from '../../../lib/flow-api';
import type { RealFlowStep } from '../../../lib/flow-api';
import { fetchNextSteps } from '../../../lib/next-steps-api';
import type { RealNextStep } from '../../../lib/next-steps-api';
import { fetchRecentObservations } from '../../../lib/observations-api';
import type { RealObservation } from '../../../lib/observations-api';
import { initialsFromName } from '../../../lib/child-fields';
import { isoDate } from '../../../lib/dates';

interface Props {
  onChild: (id: string) => void;
  onObserve: () => void;
}

export const TeacherTodayV2: React.FC<Props> = ({ onChild, onObserve }) => {
  const token = useAppStore(s => s.token);
  const userName = useAppStore(s => s.userName);
  const [children, setChildren] = useState<RealChild[] | null>(null);
  const [flow, setFlow] = useState<RealFlowStep[]>([]);
  const [nextSteps, setNextSteps] = useState<RealNextStep[]>([]);
  const [observations, setObservations] = useState<RealObservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = isoDate();
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

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

  if (loading) return <div className="v2-content muted">Loading your day…</div>;
  if (error || !children) return <div className="v2-content muted">{error ?? 'Could not load your day.'}</div>;

  const childById = new Map(children.map(c => [c.id, c]));
  const classObservations = observations.filter(o => o.child_id !== null && childById.has(Number(o.child_id)));
  const observationsToday = classObservations.filter(o => o.captured_at.slice(0, 10) === today).length;
  const flaggedChildren = children.filter(c => c.flags.length > 0);

  return (
    <div className="v2-content">
      <header className="v2-masthead">
        <div>
          <div className="v2-masthead-sig">
            <span className="num">01</span>
            <span>— Today</span>
            <span>·</span>
            <span>{dateLabel}</span>
            <span>·</span>
            <span>{children.length} in / {flaggedChildren.length} to check on</span>
          </div>
          <h1 className="v2-greeting-h1">
            Good morning{userName ? ',' : '.'}<br/>{userName && <em>{userName}.</em>}
          </h1>
        </div>
        <div className="v2-actions">
          <button className="v2-btn primary" onClick={onObserve}><Icon name="mic" size={14}/> Capture observation</button>
        </div>
      </header>

      <section className="v2-stats v2-cascade">
        <div className="v2-stat-block hero">
          <div className="v2-sig">
            <span className="num">02</span>
            <span className="em">— Observations today</span>
            <span className="spacer"/>
            <span>Across your class</span>
          </div>
          <div className="v2-stat-num">{String(observationsToday).padStart(2, '0')}</div>
          <div className="v2-stat-meta">
            <span className="v2-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--v2-pencil)' }}>{classObservations.length} total on record</span>
          </div>
        </div>

        <div className="v2-stat-block pair">
          <div className="v2-sig">
            <span className="num">03</span>
            <span className="em">— AI awaiting review</span>
            <span className="spacer"/>
            <span>Pending</span>
          </div>
          <div className="v2-stat-num" style={{ color: 'var(--v2-ultramarine)' }}>{String(nextSteps.length).padStart(2, '0')}</div>
        </div>

        <div className="v2-stat-block pair">
          <div className="v2-sig">
            <span className="num">04</span>
            <span className="em">— Check in on</span>
            <span className="spacer"/>
            <span>Flagged</span>
          </div>
          <div className="v2-stat-num" style={{ color: 'var(--v2-tangerine)' }}>{String(flaggedChildren.length).padStart(2, '0')}</div>
          <div className="v2-stat-meta">
            {flaggedChildren.slice(0, 2).map(c => (
              <span key={c.id} className="v2-chip tangerine-soft">{c.name.split(' ')[0]} · {c.flags[0]}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-mid">
        <div className="v2-flow">
          <div className="v2-sig">
            <span className="num">05</span>
            <span className="em">— Today's flow</span>
            <span className="spacer"/>
            <span>{flow.length === 0 ? 'Nothing scheduled yet' : 'Tap to update'}</span>
          </div>
          <Flow steps={flow} onMark={markStepState}/>
        </div>

        <AIBrief nextSteps={nextSteps} childById={childById} onChild={onChild}/>
      </section>

      <section className="v2-obs-card">
        <div className="v2-sig">
          <span className="num">06</span>
          <span className="em">— Recent observations</span>
          <span className="spacer"/>
          <span>Across your class</span>
        </div>
        <div className="v2-obs-list">
          {classObservations.slice(0, 4).map(o => {
            const ch = childById.get(Number(o.child_id));
            if (!ch) return null;
            return (
              <article key={o.id} className="v2-obs">
                <span className="v2-obs-avatar">{ch.initials || initialsFromName(ch.name)}</span>
                <div>
                  <div className="v2-obs-head">
                    <span>
                      <span className="v2-obs-name">{ch.name}</span>
                      <span className="v2-obs-author">{o.kind}</span>
                    </span>
                    <span className="v2-obs-time">{new Date(o.captured_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="v2-obs-text">{o.comment || o.transcript || '(no text recorded)'}</p>
                  <div className="v2-tags">
                    {o.tags.map(t => <span key={t} className="v2-chip">{t}</span>)}
                  </div>
                </div>
                <button className="v2-obs-cta" onClick={() => onChild(String(ch.id))} aria-label={`Open ${ch.name}'s profile`}>
                  <Icon name="arrow-right" size={14}/>
                </button>
              </article>
            );
          })}
          {classObservations.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No observations logged for your class yet.</div>}
        </div>
      </section>
    </div>
  );
};

const Flow: React.FC<{ steps: RealFlowStep[]; onMark: (id: number, state: 'done' | 'now') => void }> = ({ steps, onMark }) => (
  <div style={{ marginTop: 8 }}>
    {steps.map(s => (
      <button key={s.id} className={`v2-flow-row ${s.state}`} onClick={() => onMark(s.id, s.state === 'done' ? 'now' : 'done')} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}>
        <span className="v2-flow-time">{s.time}</span>
        <span className="v2-flow-pip" aria-hidden/>
        <span className="v2-flow-label">{s.label}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {s.ai_suggested && <span className="v2-chip ultramarine"><Icon name="sparkle" size={10}/> AI-shaped</span>}
          {s.state === 'now' && <span className="v2-chip tangerine">Now</span>}
        </span>
      </button>
    ))}
    {steps.length === 0 && <div className="muted" style={{ fontSize: 13, padding: '10px 0' }}>No flow steps set for today yet.</div>}
  </div>
);

const AIBrief: React.FC<{ nextSteps: RealNextStep[]; childById: Map<number, RealChild>; onChild: (id: string) => void }> = ({ nextSteps, childById, onChild }) => (
  <aside className="v2-ai">
    <div className="v2-ai-sig">
      <span className="num">A</span>
      <span>— AI brief</span>
      <span className="v2-ai-spark"/>
    </div>
    <h3 className="v2-ai-headline">
      {nextSteps.length === 0 ? 'No suggestions awaiting review.' : <>Suggestions <em>awaiting your review.</em></>}
    </h3>
    {nextSteps.length > 0 && (
      <ol className="v2-ai-list">
        {nextSteps.slice(0, 3).map(s => {
          const child = childById.get(s.child_id);
          return (
            <li key={s.id}>
              {child ? <button onClick={() => onChild(String(child.id))}>{child.name}</button> : 'A child'} — {s.title}
            </li>
          );
        })}
      </ol>
    )}
    <div className="v2-ai-foot">— Suggestions, not prescriptions</div>
  </aside>
);

export default TeacherTodayV2;
