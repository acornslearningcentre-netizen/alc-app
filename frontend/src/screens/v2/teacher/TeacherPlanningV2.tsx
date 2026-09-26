import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui';
import { useAppStore } from '../../../store/app-store';
import { fetchChildren } from '../../../lib/children-api';
import type { RealChild } from '../../../lib/children-api';
import { fetchLessonPlans, createLessonPlan } from '../../../lib/lesson-plans-api';
import type { RealLessonPlan, Day, PlanStatus } from '../../../lib/lesson-plans-api';
import { mondayOf } from '../../../lib/dates';
import '../../../styles/v2/teacher-planning.css';

interface Props {
  onChild: (id: string) => void;
}

const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABEL: Record<Day, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

const STATUS_LABEL: Record<PlanStatus, string> = {
  accepted: 'Accepted',
  edited: 'Edited',
  pending: 'Pending review',
};
const STATUS_CHIP: Record<PlanStatus, string> = {
  accepted: 'moss-soft',
  edited: 'solid',
  pending: 'tangerine-soft',
};
const STATUS_ICON: Record<PlanStatus, React.ComponentProps<typeof Icon>['name']> = {
  accepted: 'check',
  edited: 'sparkle',
  pending: 'clock',
};

function statusCounts(students: { status: PlanStatus }[]) {
  return students.reduce(
    (acc, s) => { acc[s.status]++; return acc; },
    { accepted: 0, edited: 0, pending: 0 } as Record<PlanStatus, number>,
  );
}

interface NewLessonForm {
  day: Day;
  time: string;
  subject: string;
  title: string;
  summary: string;
}
const emptyForm: NewLessonForm = { day: 'Mon', time: '09:00', subject: '', title: '', summary: '' };

export const TeacherPlanningV2: React.FC<Props> = ({ onChild }) => {
  const token = useAppStore(s => s.token);
  const [children, setChildren] = useState<RealChild[]>([]);
  const [weekOf, setWeekOf] = useState(mondayOf());
  const [plans, setPlans] = useState<RealLessonPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewLessonForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setError('You need to be signed in to see your plan.'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchLessonPlans(token, weekOf), fetchChildren(token)])
      .then(([p, c]) => { if (!cancelled) { setPlans(p); setChildren(c); setError(null); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, weekOf]);

  const shiftWeek = (deltaDays: number) => {
    const d = new Date(`${weekOf}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    setWeekOf(mondayOf(d));
  };

  const addLesson = async () => {
    if (!token || !form.subject.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      const created = await createLessonPlan(token, { day: form.day, week_of: weekOf, time: form.time, subject: form.subject.trim(), title: form.title.trim(), summary: form.summary.trim() || undefined });
      setPlans(p => [...(p ?? []), created]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="v2-content muted">Loading your plan…</div>;
  if (error && !plans) return <div className="v2-content muted">{error}</div>;

  const childById = new Map(children.map(c => [c.id, c]));
  const byDay = new Map<Day, RealLessonPlan[]>();
  for (const p of plans ?? []) {
    if (!byDay.has(p.day)) byDay.set(p.day, []);
    byDay.get(p.day)!.push(p);
  }

  return (
    <div className="v2-content">
      <header className="v2-masthead">
        <div>
          <div className="v2-masthead-sig">
            <span className="num">01</span>
            <span>— Planning</span>
            <span>·</span>
            <span>week of {weekOf} · {children.length} {children.length === 1 ? 'child' : 'children'}</span>
          </div>
          <h1 className="v2-greeting-h1">This week's <em>plan.</em></h1>
        </div>
        <div className="v2-actions">
          <button className="v2-btn ghost" onClick={() => shiftWeek(-7)}>← Prev</button>
          <button className="v2-btn ghost" onClick={() => shiftWeek(7)}>Next →</button>
          <button className="v2-btn primary" onClick={() => setShowForm(v => !v)}><Icon name="plus" size={14}/> Add lesson</button>
        </div>
      </header>

      {showForm && (
        <section className="v2-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value as Day }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--v2-line, #ddd)' }}>
              {DAYS.map(d => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
            </select>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--v2-line, #ddd)' }}/>
            <input placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--v2-line, #ddd)' }}/>
            <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--v2-line, #ddd)' }}/>
          </div>
          <textarea placeholder="Summary (optional)" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--v2-line, #ddd)', marginBottom: 12, resize: 'vertical' }}/>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="v2-btn primary" onClick={addLesson} disabled={saving || !form.subject.trim() || !form.title.trim()}>{saving ? 'Saving…' : 'Save lesson'}</button>
            <button className="v2-btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </section>
      )}

      <section className="v2-section-head">
        <div>
          <h3>Upcoming lessons</h3>
          <div className="sub">Student-level plan for each lesson</div>
        </div>
      </section>
      <section className="v2-card v2-plan-list">
        {DAYS.flatMap(d => byDay.get(d) ?? []).map(lesson => {
          const counts = statusCounts(lesson.students);
          return (
            <div key={lesson.id} className="v2-plan-lesson">
              <div className="v2-plan-lesson-head">
                <span className="v2-plan-row-day">{lesson.day}</span>
                <span className="v2-plan-row-time v2-mono">{lesson.time}</span>
                <span className="v2-plan-row-main">
                  <span className="v2-plan-row-title">{lesson.subject} · {lesson.title}</span>
                  {lesson.summary && <span className="v2-plan-row-sub">{lesson.summary}</span>}
                </span>
                <span className="v2-plan-row-chips">
                  {counts.accepted > 0 && <span className="v2-chip moss-soft">{counts.accepted} accepted</span>}
                  {counts.edited > 0 && <span className="v2-chip solid">{counts.edited} edited</span>}
                  {counts.pending > 0 && <span className="v2-chip tangerine-soft">{counts.pending} pending</span>}
                </span>
              </div>
              <div className="v2-plan-lesson-students">
                {lesson.students.map(s => {
                  const child = childById.get(s.child_id);
                  if (!child) return null;
                  return (
                    <div key={s.child_id} className="v2-plan-student-line">
                      <button className="v2-plan-student-name" onClick={() => onChild(String(child.id))}>{child.name}</button>
                      <span className="v2-plan-student-activity">{s.activity}</span>
                      <span className={`v2-chip ${STATUS_CHIP[s.status]}`}>
                        <Icon name={STATUS_ICON[s.status]} size={11}/> {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {(plans ?? []).length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Nothing scheduled this week yet.</div>}
      </section>
    </div>
  );
};

export default TeacherPlanningV2;
