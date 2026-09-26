import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchChildren } from '../../lib/children-api';
import { fetchLessonPlans, createLessonPlan } from '../../lib/lesson-plans-api';
import type { RealLessonPlan, Day } from '../../lib/lesson-plans-api';
import { mondayOf } from '../../lib/dates';

const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABEL: Record<Day, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

interface NewLessonForm {
  day: Day;
  time: string;
  subject: string;
  title: string;
  summary: string;
}

const emptyForm: NewLessonForm = { day: 'Mon', time: '09:00', subject: '', title: '', summary: '' };

export const TeacherPlanning: React.FC = () => {
  const token = useAppStore(s => s.token);
  const [childCount, setChildCount] = useState<number | null>(null);
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
    Promise.all([fetchLessonPlans(token, weekOf), childCount === null ? fetchChildren(token) : Promise.resolve(null)])
      .then(([p, children]) => {
        if (cancelled) return;
        setPlans(p);
        if (children) setChildCount(children.length);
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, weekOf, childCount]);

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

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading your plan…</div>;
  if (error && !plans) return <div className="page-fade muted" style={{ padding: 40 }}>{error}</div>;

  const byDay = new Map<Day, RealLessonPlan[]>();
  for (const p of plans ?? []) {
    if (!byDay.has(p.day)) byDay.set(p.day, []);
    byDay.get(p.day)!.push(p);
  }

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Planning</h1>
          <div className="sub">{childCount !== null ? `Lessons + targets across your ${childCount} ${childCount === 1 ? 'child' : 'children'}` : 'Lessons + targets'} · week of {weekOf}</div>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={() => shiftWeek(-7)}>← Prev week</button>
          <button className="btn" onClick={() => shiftWeek(7)}>Next week →</button>
          <button className="btn primary" onClick={() => setShowForm(v => !v)}><Icon name="plus" size={13}/> Add lesson</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16, padding: 20 }}>
          <div className="grid grid-4" style={{ gap: 10, marginBottom: 12 }}>
            <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value as Day }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)' }}>
              {DAYS.map(d => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
            </select>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)' }}/>
            <input placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)' }}/>
            <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)' }}/>
          </div>
          <textarea placeholder="Summary (optional)" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--line)', marginBottom: 12, resize: 'vertical' }}/>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary" onClick={addLesson} disabled={saving || !form.subject.trim() || !form.title.trim()}>{saving ? 'Saving…' : 'Save lesson'}</button>
            <button className="btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>This week's plan</h3>
        {DAYS.map(d => {
          const dayPlans = byDay.get(d) ?? [];
          return (
            <div key={d} style={{ borderBottom: '1px dashed var(--line)', padding: '14px 0' }}>
              <div className="row" style={{ gap: 16, marginBottom: dayPlans.length ? 8 : 0 }}>
                <div className="mono" style={{ width: 40, color: 'var(--ink-4)' }}>{d}</div>
                {dayPlans.length === 0 && <div className="muted" style={{ fontSize: 13 }}>Nothing scheduled yet.</div>}
              </div>
              {dayPlans.map(p => {
                const accepted = p.students.filter(s => s.status === 'accepted').length;
                const edited = p.students.filter(s => s.status === 'edited').length;
                const pending = p.students.filter(s => s.status === 'pending').length;
                return (
                  <div key={p.id} className="row" style={{ paddingLeft: 56, gap: 16, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.time} · {p.subject} — {p.title}</div>
                      {p.summary && <div className="muted" style={{ fontSize: 12.5 }}>{p.summary}</div>}
                      {p.students.length > 0 && (
                        <div className="muted" style={{ fontSize: 12.5 }}>{accepted} accepted · {edited} edited · {pending} pending review</div>
                      )}
                    </div>
                    {p.students.length > 0 && <span className="chip">{p.students.length} {p.students.length === 1 ? 'child' : 'children'}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherPlanning;
