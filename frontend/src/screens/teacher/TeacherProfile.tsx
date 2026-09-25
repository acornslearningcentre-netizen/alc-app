import React, { useEffect, useState } from 'react';
import { Icon, Sparkline, Trend } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchChild } from '../../lib/children-api';
import type { RealChildDetail, RealParent } from '../../lib/children-api';
import { fetchChildProgress } from '../../lib/progress-api';
import type { ChildProgress } from '../../lib/progress-api';
import { fetchChildObservations } from '../../lib/observations-api';
import type { RealObservation } from '../../lib/observations-api';
import { fetchChildNextSteps, acceptNextStep, dismissNextStep } from '../../lib/next-steps-api';
import type { RealNextStep } from '../../lib/next-steps-api';
import { fetchLessonPlans, updateLessonPlanStudent } from '../../lib/lesson-plans-api';
import type { RealLessonPlan } from '../../lib/lesson-plans-api';
import { fetchThreads, fetchThreadMessages, sendThreadMessage } from '../../lib/threads-api';
import type { RealThread, RealMessage } from '../../lib/threads-api';
import { fetchAssistantHistory, askAssistant } from '../../lib/assistant-api';
import type { AssistantMessage } from '../../lib/assistant-api';
import { ageFromDob, initialsFromName } from '../../lib/child-fields';
import { mondayOf } from '../../lib/dates';

type ProfileTab = 'overview' | 'observations' | 'progress' | 'plan' | 'communication';

interface TeacherProfileProps {
  childId: string;
  onBack: () => void;
  onMessageParent?: (guardianName: string) => void;
}

const pct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${n}%`);
const firstName = (name: string) => name.split(' ')[0];

export const TeacherProfile: React.FC<TeacherProfileProps> = ({ childId, onBack, onMessageParent }) => {
  const token = useAppStore(s => s.token);
  const [child, setChild] = useState<RealChildDetail | null>(null);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [observations, setObservations] = useState<RealObservation[]>([]);
  const [nextSteps, setNextSteps] = useState<RealNextStep[]>([]);
  const [weekPlans, setWeekPlans] = useState<RealLessonPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [askOpen, setAskOpen] = useState(false);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);

  useEffect(() => {
    if (!token) { setError('You need to be signed in to see this profile.'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const numericId = Number(childId);
    Promise.all([
      fetchChild(token, numericId),
      fetchChildProgress(token, numericId),
      fetchChildObservations(token, numericId),
      fetchChildNextSteps(token, numericId),
      fetchLessonPlans(token, mondayOf()),
    ])
      .then(([c, p, obs, steps, plans]) => {
        if (cancelled) return;
        setChild(c); setProgress(p); setObservations(obs); setNextSteps(steps); setWeekPlans(plans);
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, childId]);

  const resolveNextStep = async (id: number, action: 'accept' | 'dismiss') => {
    if (!token) return;
    const updated = action === 'accept' ? await acceptNextStep(token, id) : await dismissNextStep(token, id);
    setNextSteps(steps => steps.map(s => (s.id === id ? updated : s)));
  };

  const updatePlanStudent = async (planId: number, status: 'accepted' | 'edited') => {
    if (!token || !child) return;
    const updated = await updateLessonPlanStudent(token, planId, child.id, { status });
    setWeekPlans(plans => plans.map(p => (p.id === planId
      ? { ...p, students: p.students.some(s => s.child_id === child.id) ? p.students.map(s => (s.child_id === child.id ? updated : s)) : [...p.students, updated] }
      : p)));
  };

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading profile…</div>;
  if (error || !child) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load this profile.'}</div>;

  const first = firstName(child.name);
  const age = ageFromDob(child.dob);
  const initials = child.initials || initialsFromName(child.name);
  const tone = child.tone ?? 'sage';
  const latestSnapshot = progress?.snapshots[0] ?? null;
  const observedLast30d = observations.filter(o => {
    const days = (Date.now() - new Date(o.captured_at).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }).length;
  const myPlans = weekPlans
    .map(p => ({ plan: p, student: p.students.find(s => s.child_id === child.id) }))
    .filter((x): x is { plan: RealLessonPlan; student: NonNullable<typeof x.student> } => !!x.student);

  const handleMessageParent = () => {
    if (!onMessageParent) return;
    if (child.parents.length <= 1) {
      if (child.parents[0]) onMessageParent(child.parents[0].name);
    } else {
      setParentPickerOpen(true);
    }
  };
  const pickParent = (name: string) => {
    setParentPickerOpen(false);
    onMessageParent?.(name);
  };

  return (
    <div className={`page-fade tone-${tone}`}>
      <div className="topbar">
        <div className="row" style={{ gap: 12 }}>
          <button className="btn ghost" onClick={onBack}>← Children</button>
          <div className="avatar-xl">{initials}</div>
          <div>
            <h1 style={{ marginBottom: 2 }}>{child.name}</h1>
            <div className="sub">{age !== null ? `Age ${age}` : 'Age unknown'} · {child.parents.length} family {child.parents.length === 1 ? 'contact' : 'contacts'} on file</div>
          </div>
        </div>
        <div className="topbar-actions">
          {onMessageParent && (
            <button className="btn" onClick={handleMessageParent} aria-label={`Message ${first}'s family`}>
              <Icon name="message" size={13}/> Message {child.parents.length > 1 ? 'family' : 'parent'}
            </button>
          )}
          <button className="btn primary" onClick={() => setAskOpen(true)}><Icon name="sparkle" size={13}/> Ask about {first}</button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="tiny">Mastery</div>
          <div className="row between" style={{ marginTop: 6 }}>
            <div className="stat-number">{pct(latestSnapshot?.mastery)}</div>
            <Trend dir={progress?.trend ?? 'steady'}/>
          </div>
        </div>
        <div className="card">
          <div className="tiny">Observations · last 30d</div>
          <div className="stat-number" style={{ marginTop: 6 }}>{observedLast30d}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{observations.length} total on record</div>
        </div>
        <div className="card">
          <div className="tiny">Attendance</div>
          <div className="stat-number" style={{ marginTop: 6 }}>{pct(latestSnapshot?.attendance)}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>Last 30 days</div>
        </div>
        <div className="card">
          <div className="tiny">Learning fingerprint</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>{child.style || 'Not recorded yet'}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{observations.length} observations on record</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 18 }} role="tablist">
        {(['overview','observations','progress','plan','communication'] as ProfileTab[]).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewTab child={child} childObs={observations} nextSteps={nextSteps} onResolveStep={resolveNextStep}/>
      )}
      {tab === 'observations' && <ObservationsTab childObs={observations}/>}
      {tab === 'progress' && <ProgressTab progress={progress}/>}
      {tab === 'plan' && <PlanTab myPlans={myPlans} onUpdateStatus={updatePlanStudent}/>}
      {tab === 'communication' && token && <CommTab token={token} childId={child.id} childName={child.name}/>}

      {askOpen && <AskModal childId={child.id} childName={child.name} tone={tone} initials={initials} onClose={() => setAskOpen(false)}/>}
      {parentPickerOpen && (
        <ParentPickerModal childName={child.name} tone={tone} parents={child.parents} onPick={pickParent} onClose={() => setParentPickerOpen(false)}/>
      )}
    </div>
  );
};

const ParentPickerModal: React.FC<{
  childName: string;
  tone: string;
  parents: RealParent[];
  onPick: (name: string) => void;
  onClose: () => void;
}> = ({ childName, tone, parents, onPick, onClose }) => {
  const first = firstName(childName);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-label={`Choose who to message for ${first}`}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,36,32,0.45)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 60 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`tone-${tone}`}
        style={{ background: 'var(--paper)', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="tiny" style={{ marginBottom: 6 }}>Message {first}'s family</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 6px' }}>
          Who would you like to message?
        </h2>
        <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          {first} has {parents.length} contacts on file. Your message will open a private thread with the person you choose.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {parents.map(p => {
            const initials = initialsFromName(p.name);
            return (
              <button
                key={p.name}
                onClick={() => onPick(p.name)}
                className="btn"
                style={{ padding: 14, justifyContent: 'flex-start', gap: 12, borderRadius: 14, textAlign: 'left', width: '100%' }}
                aria-label={`Message ${p.name}, ${p.relation}`}
              >
                <div className="avatar-lg" style={{ width: 38, height: 38, fontSize: 13 }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{p.relation}</div>
                </div>
                <Icon name="arrow-right" size={14} stroke="var(--ink-3)"/>
              </button>
            );
          })}
        </div>
        <div className="row between" style={{ marginTop: 18 }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="muted" style={{ fontSize: 12 }}>Messages are private & never shared.</div>
        </div>
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{
  child: RealChildDetail;
  childObs: RealObservation[];
  nextSteps: RealNextStep[];
  onResolveStep: (id: number, action: 'accept' | 'dismiss') => void;
}> = ({ child, childObs, nextSteps, onResolveStep }) => {
  const recentObs = childObs.slice(0, 5);
  const pendingSteps = nextSteps.filter(s => s.status === 'pending');
  return (
    <div className="grid cols-sidebar-lg" style={{ gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {child.flags.length > 0 && (
          <div className="card" style={{ borderColor: 'var(--ochre-soft)', background: 'linear-gradient(180deg, #FBF7EC, #F9EED0)' }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="chip" style={{ background: 'var(--ochre)', color: 'var(--ink)', border: 'none' }}><Icon name="flag" size={11}/> Flagged for follow-up</span>
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              {child.flags.map(f => <span key={f} className="chip" style={{ fontSize: 12.5 }}>{f}</span>)}
            </div>
          </div>
        )}

        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}><Icon name="leaf" size={14}/> Strengths</h3>
            {child.strengths.length === 0 && <div className="muted" style={{ fontSize: 13 }}>None recorded yet.</div>}
            {child.strengths.map(s => (
              <div key={s} className="row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0 }}/>
                <span style={{ fontSize: 13.5 }}>{s}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}><Icon name="arrow-up" size={14}/> Growing edges</h3>
            {child.gaps.length === 0 && <div className="muted" style={{ fontSize: 13 }}>None recorded yet.</div>}
            {child.gaps.map(g => (
              <div key={g} className="row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ochre)', flexShrink: 0 }}/>
                <span style={{ fontSize: 13.5 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3>Recent observations</h3>
          </div>
          {recentObs.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>No observations yet for this child.</div>
          ) : recentObs.map(o => (
            <div key={o.id} style={{ padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{o.kind}{o.mood ? <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}> · {o.mood}</span> : null}</div>
                <div className="mono" style={{ color: 'var(--ink-4)' }}>{new Date(o.captured_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ fontSize: 13.5 }}>{o.comment || o.transcript || '(no text recorded)'}</div>
              <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
                {o.tags.map(t => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3><Icon name="sparkle" size={14}/> Suggested next steps</h3>
          </div>
          {pendingSteps.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No suggestions awaiting review.</div>}
          {pendingSteps.map(s => (
            <div key={s.id} style={{ padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <span className="tiny" style={{ color: 'var(--plum-ink)' }}>{s.type}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
              {s.rationale && <div className="muted" style={{ fontSize: 12.5 }}>{s.rationale}</div>}
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onResolveStep(s.id, 'accept')}><Icon name="check" size={11}/> Accept</button>
                <button className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onResolveStep(s.id, 'dismiss')}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: 'var(--cream-2)' }}>
          <div className="tiny" style={{ marginBottom: 6 }}>Privacy · visible to</div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {child.parents.map(p => <span key={p.name} className="chip"><Icon name="users" size={11}/> {p.name} ({p.relation})</span>)}
            <span className="chip"><Icon name="shield" size={11}/> School leadership</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ObservationsTab: React.FC<{ childObs: RealObservation[] }> = ({ childObs }) => (
  <div className="card">
    <div className="row between" style={{ marginBottom: 14 }}>
      <h3>All observations</h3>
    </div>
    {childObs.length === 0 && <div className="muted">No observations yet.</div>}
    {childObs.map(o => (
      <div key={o.id} className="row" style={{ padding: '14px 0', borderBottom: '1px dashed var(--line)', gap: 14, alignItems: 'flex-start' }}>
        <div className="mono" style={{ color: 'var(--ink-4)', width: 130, flexShrink: 0 }}>{new Date(o.captured_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, marginBottom: 6 }}>{o.comment || o.transcript || '(no text recorded)'}</div>
          <div className="row wrap" style={{ gap: 4 }}>
            {o.tags.map(t => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
          </div>
        </div>
        <span className="chip" style={{ background: 'var(--sage-soft)', color: 'var(--sage-ink)', border: 'none', flexShrink: 0 }}>{o.kind}</span>
      </div>
    ))}
  </div>
);

const ProgressTab: React.FC<{ progress: ChildProgress | null }> = ({ progress }) => {
  const snapshots = [...(progress?.snapshots ?? [])].reverse(); // API returns newest-first; chart reads left-to-right chronological
  const masteryValues = snapshots.filter(s => s.mastery !== null).map(s => s.mastery as number);
  const attendanceValues = snapshots.filter(s => s.attendance !== null).map(s => s.attendance as number);
  return (
    <div className="grid grid-2" style={{ gap: 16 }}>
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Mastery over time</h3>
        {masteryValues.length >= 2 ? (
          <Sparkline values={masteryValues} color="var(--tone)" fill height={180}/>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>Not enough history yet to chart a trend.</div>
        )}
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Attendance over time</h3>
        {attendanceValues.length >= 2 ? (
          <Sparkline values={attendanceValues} color="var(--sky)" fill height={180}/>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>Not enough history yet to chart a trend.</div>
        )}
      </div>
      {snapshots.length === 0 && (
        <div className="card muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20 }}>
          No progress history recorded for this child yet.
        </div>
      )}
    </div>
  );
};

const PlanTab: React.FC<{
  myPlans: { plan: RealLessonPlan; student: { status: string; activity: string; note: string | null } }[];
  onUpdateStatus: (planId: number, status: 'accepted' | 'edited') => void;
}> = ({ myPlans, onUpdateStatus }) => (
  <div className="card">
    <h3 style={{ marginBottom: 14 }}>This week's lesson plan</h3>
    {myPlans.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No lesson slots scheduled for this child this week yet.</div>}
    {myPlans.map(({ plan, student }) => (
      <div key={plan.id} style={{ padding: 14, background: 'var(--cream)', borderRadius: 12, marginBottom: 12 }}>
        <div className="row between" style={{ marginBottom: 4 }}>
          <div className="tiny">{plan.day} · {plan.time} · {plan.subject}</div>
          <span className="chip" style={{ fontSize: 11 }}>{student.status}</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4, marginBottom: 6 }}>{plan.title}</div>
        {plan.summary && <div style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 8 }}>{plan.summary}</div>}
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{student.activity}</div>
        {student.note && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{student.note}</div>}
        {student.status === 'pending' && (
          <div className="row" style={{ marginTop: 10, gap: 8 }}>
            <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onUpdateStatus(plan.id, 'accepted')}><Icon name="check" size={11}/> Accept</button>
          </div>
        )}
      </div>
    ))}
  </div>
);

const CommTab: React.FC<{ token: string; childId: number; childName: string }> = ({ token, childId, childName }) => {
  const [thread, setThread] = useState<RealThread | null>(null);
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const guardianFirst = thread ? firstName(thread.parent_name) : 'the family';

  useEffect(() => {
    let cancelled = false;
    fetchThreads(token)
      .then(async threads => {
        const t = threads.find(x => x.child_id === childId) ?? null;
        if (cancelled) return;
        setThread(t);
        if (t) {
          const msgs = await fetchThreadMessages(token, t.id);
          if (!cancelled) setMessages(msgs);
        }
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, childId]);

  const send = async () => {
    if (!thread || !draft.trim()) return;
    setSending(true);
    try {
      const msg = await sendThreadMessage(token, thread.id, draft.trim());
      setMessages(m => [...m, msg]);
      setDraft('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="card muted" style={{ padding: 24 }}>Loading conversation…</div>;
  if (error) return <div className="card muted" style={{ padding: 24 }}>{error}</div>;
  if (!thread) return <div className="card muted" style={{ padding: 24 }}>No conversation yet for {childName}'s family.</div>;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 14 }}>Conversation with {thread.parent_name}</h3>
      {messages.length === 0 && <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>No messages yet — write a warm first note below.</div>}
      {messages.map(m => (
        <div key={m.id} className="row" style={{ justifyContent: m.sender_role === 'teacher' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
          <div style={{ maxWidth: '60%', padding: '10px 14px', borderRadius: 16, background: m.sender_role === 'teacher' ? 'var(--ink)' : 'var(--cream-2)', color: m.sender_role === 'teacher' ? 'var(--cream)' : 'var(--ink)', fontSize: 13.5 }}>
            {m.body}
            <div className="mono" style={{ fontSize: 10, marginTop: 4, opacity: 0.55 }}>{new Date(m.sent_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ))}
      <div className="row" style={{ marginTop: 16, gap: 8, padding: 10, background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--line)' }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Message ${guardianFirst}…`} aria-label={`Message ${guardianFirst}`} disabled={sending}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
        <button className="btn primary" onClick={send} disabled={sending || !draft.trim()} aria-label="Send message"><Icon name="send" size={12}/></button>
      </div>
    </div>
  );
};

const AskModal: React.FC<{ childId: number; childName: string; tone: string; initials: string; onClose: () => void }> = ({ childId, childName, tone, initials, onClose }) => {
  const token = useAppStore(s => s.token);
  const first = firstName(childName);
  const [msgs, setMsgs] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [q, setQ] = useState('');
  const suggestions = ['Is there a pattern worth noticing?', 'What teaching approach might work best?', 'Draft a note to the parent.'];

  useEffect(() => {
    if (!token) { setError('You need to be signed in.'); setLoading(false); return; }
    let cancelled = false;
    fetchAssistantHistory(token, childId)
      .then(h => { if (!cancelled) { setMsgs(h.messages); setError(null); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, childId]);

  const ask = async (text: string) => {
    if (!text.trim() || !token || asking) return;
    setAsking(true);
    setError(null);
    setQ('');
    try {
      const result = await askAssistant(token, childId, text.trim());
      setMsgs(m => [...m, ...result.messages]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={`Ask about ${first}`}
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,36,32,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 40 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: '100%', maxHeight: '80vh', background: 'var(--paper)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 10 }}>
            <div className={`avatar-lg tone-${tone}`}>{initials}</div>
            <div>
              <div style={{ fontWeight: 800 }}>Ask about {first}</div>
              <div className="muted" style={{ fontSize: 12 }}>Grounded in {first}'s real observations · coaching, not prescriptive</div>
            </div>
          </div>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <div className="muted" style={{ fontSize: 13 }}>Loading conversation…</div>}
          {!loading && msgs.length === 0 && !error && (
            <div className="muted" style={{ fontSize: 13 }}>Ask anything about {first} — grounded in their real recent observations and progress.</div>
          )}
          {msgs.map(m => (
            <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px', borderRadius: 16, background: m.sender === 'user' ? 'var(--ink)' : 'var(--ochre-soft)', color: m.sender === 'user' ? 'var(--cream)' : 'var(--ink)', fontSize: 14, lineHeight: 1.5 }}>
              {m.text}
            </div>
          ))}
          {asking && <div className="muted" style={{ fontSize: 13 }}>Thinking…</div>}
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        </div>
        <div className="row wrap" style={{ gap: 6, margin: '12px 0' }}>
          {suggestions.map(s => (
            <button key={s} className="chip" onClick={() => ask(s)} style={{ cursor: 'pointer' }} disabled={asking}>{s}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 8, padding: 10, background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--line)' }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(q)} disabled={asking}
            placeholder={`Ask anything about ${first}…`} aria-label={`Ask about ${first}`}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
          <button className="btn primary" onClick={() => ask(q)} disabled={asking || !q.trim()} aria-label="Send question"><Icon name="send" size={12}/></button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
