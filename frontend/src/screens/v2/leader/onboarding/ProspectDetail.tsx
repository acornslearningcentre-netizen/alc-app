// SCRUM-91 — Owner queue: prospect detail. Shows a family's full intake
// answers (laid out, not raw JSON), consent status, status control, and
// whatever assessments/observations already exist for them.
import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/ui';
import { intakeQuestions, type IntakeAnswerValue } from '../../../../data/intake-questions';
import {
  getProspect, updateProspectStatus, bookAssessment,
  type ProspectDetail as ProspectDetailData, type ProspectStatus,
} from '../../../../lib/onboarding-api';

const STATUS_OPTIONS: ProspectStatus[] = ['prospect', 'booked', 'assessed', 'enrolled', 'declined'];
const STATUS_LABEL: Record<ProspectStatus, string> = {
  prospect: 'New', booked: 'Booked', assessed: 'Assessed', enrolled: 'Enrolled', declined: 'Declined',
};

function answerToText(fieldId: string, value: IntakeAnswerValue | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  const field = intakeQuestions.find((f) => f.id === fieldId);
  const optionLabel = (v: string) => field?.options?.find((o) => o.value === v)?.label ?? v;

  if (typeof value === 'string') return optionLabel(value);
  if (Array.isArray(value)) return value.map(optionLabel).join(', ');
  if ('value' in value) return [optionLabel(value.value), value.other].filter(Boolean).join(' — ');
  if ('values' in value) return [value.values.map(optionLabel).join(', '), value.other].filter(Boolean).join(' — ');
  return null;
}

export const ProspectDetail: React.FC<{ id: number; onBack: () => void }> = ({ id, onBack }) => {
  const [data, setData] = useState<ProspectDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = () => {
    setError(null);
    getProspect(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this family.'));
  };

  useEffect(load, [id]);

  const changeStatus = async (status: ProspectStatus) => {
    if (!data || status === data.status) return;
    setStatusSaving(true);
    try {
      const updated = await updateProspectStatus(id, status);
      setData({ ...data, ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setStatusSaving(false);
    }
  };

  if (error) {
    return (
      <div className="page-fade">
        <div className="topbar">
          <button className="btn ghost" onClick={onBack}>
            <Icon name="arrow-right" size={12} stroke="var(--ink-3)" style={{ transform: 'rotate(180deg)' }}/> Back to Admissions
          </button>
        </div>
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-fade">
        <div className="card muted" style={{ textAlign: 'center', padding: '32px 0' }}>Loading…</div>
      </div>
    );
  }

  const hobbies = answerToText('hobbies', data.intake?.answers.hobbies as IntakeAnswerValue);
  const otherAnswers = intakeQuestions.filter((f) => f.id !== 'hobbies');

  return (
    <div className="page-fade">
      <div className="topbar">
        <button className="btn ghost" onClick={onBack}>
          <Icon name="arrow-right" size={12} stroke="var(--ink-3)" style={{ transform: 'rotate(180deg)' }}/> Back to Admissions
        </button>
      </div>

      <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>{data.child_first_name || 'Unnamed child'}</h1>
          <div className="sub">{data.parent_name || data.parent_email} · {data.parent_email}{data.parent_phone ? ` · ${data.parent_phone}` : ''}</div>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              disabled={statusSaving}
              className={`btn ${data.status === s ? 'primary' : ''}`}
              onClick={() => changeStatus(s)}
              style={{ fontSize: 12.5, padding: '6px 12px' }}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ borderColor: data.consent_notes ? undefined : 'var(--danger)' }}>
          <div className="tiny" style={{ marginBottom: 6 }}>Consent — learning notes & assessment tracking</div>
          <div className={`chip ${data.consent_notes ? 'tone-sage' : ''}`} style={!data.consent_notes ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : undefined}>
            <Icon name={data.consent_notes ? 'check' : 'flag'} size={11}/> {data.consent_notes ? 'Given' : 'Not given'}
          </div>
        </div>
        <div className="card" style={{ borderColor: data.consent_media ? undefined : 'var(--danger)' }}>
          <div className="tiny" style={{ marginBottom: 6 }}>Consent — photos/videos for internal records</div>
          <div className={`chip ${data.consent_media ? 'tone-sage' : ''}`} style={!data.consent_media ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : undefined}>
            <Icon name={data.consent_media ? 'check' : 'flag'} size={11}/> {data.consent_media ? 'Given' : 'Not given'}
          </div>
        </div>
      </div>

      {hobbies && (
        <div className="ai-panel" style={{ marginBottom: 16 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <span className="ai-badge"><Icon name="sparkle" size={11}/> MOST IMPORTANT ANSWER</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>What {data.child_first_name || 'this child'} really enjoys</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{hobbies}</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 14 }}>Intake answers</h3>
        {!data.intake && <div className="muted">No intake answers on file.</div>}
        {data.intake && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {otherAnswers.map((field) => {
              const text = answerToText(field.id, data.intake!.answers[field.id] as IntakeAnswerValue);
              if (!text) return null;
              return (
                <div key={field.id} style={{ paddingBottom: 10, borderBottom: '1px dashed var(--line)' }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 3 }}>{field.label}</div>
                  <div style={{ fontSize: 13.5 }}>{text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-2" style={{ gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Assessments</h3>
          {data.assessments.length === 0 && <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>None booked yet.</div>}
          {data.assessments.map((a) => (
            <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 13 }}>
              {a.scheduled_for ? new Date(a.scheduled_for).toLocaleString() : 'No time set'} · <span className="chip" style={{ fontSize: 11 }}>{a.status}</span>
            </div>
          ))}
          <BookAssessmentForm prospectId={id} onBooked={load}/>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Observations</h3>
          {data.observations.length === 0 && <div className="muted" style={{ fontSize: 13 }}>None captured yet.</div>}
          {data.observations.map((o) => (
            <div key={o.id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 13 }}>
              <span className="chip" style={{ fontSize: 11 }}>{o.kind}</span> {o.comment || o.transcript || ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// SCRUM-92 — book an assessment: pick a date/time (and, until the
// Classroom Roster epic ships a real teacher list, a free-text name)
// and it's booked. No database IDs, no technical detail.
const BookAssessmentForm: React.FC<{ prospectId: number; onBooked: () => void }> = ({ prospectId, onBooked }) => {
  const [when, setWhen] = useState('');
  const [teacher, setTeacher] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!when) return;
    setError(null);
    setSaving(true);
    try {
      await bookAssessment({
        prospect_id: prospectId,
        scheduled_for: new Date(when).toISOString(),
        teacher_id: teacher.trim() || undefined,
      });
      setWhen('');
      setTeacher('');
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book the assessment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="tiny">Book a visit</div>
      <input
        type="datetime-local"
        required
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        aria-label="Assessment date and time"
        className="v2-text-input"
        style={{ padding: '10px 12px', fontSize: 13 }}
      />
      <input
        type="text"
        value={teacher}
        onChange={(e) => setTeacher(e.target.value)}
        placeholder="Staff member running it (optional)"
        aria-label="Staff member"
        className="v2-text-input"
        style={{ padding: '10px 12px', fontSize: 13 }}
      />
      {error && <div className="v2-login-error">{error}</div>}
      <button type="submit" className="btn primary" disabled={saving} style={{ justifyContent: 'center' }}>
        {saving ? 'Booking…' : 'Book assessment'}
      </button>
    </form>
  );
};

export default ProspectDetail;
