// SCRUM-90 — Owner queue: prospect list. First-ever frontend screen for the
// prospects table; the backend (GET /api/prospects) has existed since the
// public intake form shipped but nothing has ever displayed it.
import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/ui';
import { listProspects, type Prospect, type ProspectStatus } from '../../../../lib/onboarding-api';

type Filter = 'all' | ProspectStatus;

const STATUS_LABEL: Record<ProspectStatus, string> = {
  prospect: 'New',
  booked: 'Booked',
  assessed: 'Assessed',
  enrolled: 'Enrolled',
  declined: 'Declined',
};
const STATUS_TONE: Record<ProspectStatus, string> = {
  prospect: 'ochre',
  booked: 'sky',
  assessed: 'plum',
  enrolled: 'sage',
  declined: 'ink-4',
};

function ageFromDob(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age}`;
}

export const AdmissionsQueue: React.FC<{ onOpen: (id: number) => void }> = ({ onOpen }) => {
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listProspects(filter === 'all' ? undefined : filter)
      .then((rows) => { if (!cancelled) setProspects(rows); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load families.'); });
    return () => { cancelled = true; };
  }, [filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'prospect', label: 'New' },
    { key: 'booked', label: 'Booked' },
    { key: 'assessed', label: 'Assessed' },
    { key: 'enrolled', label: 'Enrolled' },
    { key: 'declined', label: 'Declined' },
  ];

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Admissions</h1>
          <div className="sub">Every family who's applied, most recent first</div>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }} role="tablist" aria-label="Filter by status">
        {filters.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key}
            className={`btn ${filter === f.key ? 'primary' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--danger)' }}>
          Couldn't load the family list: {error}
        </div>
      )}

      {!error && prospects === null && (
        <div className="card muted" style={{ textAlign: 'center', padding: '32px 0' }}>Loading…</div>
      )}

      {prospects !== null && (
        <div className="card">
          {prospects.length === 0 && (
            <div className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No families match this filter.</div>
          )}
          {prospects.map((p, i) => {
            const age = ageFromDob(p.child_dob);
            return (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="row"
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 0',
                  borderBottom: i < prospects.length - 1 ? '1px dashed var(--line)' : 'none',
                  gap: 14, background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>
                  {(p.child_first_name ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {p.child_first_name || 'Unnamed child'}
                    {age && <span className="muted" style={{ fontWeight: 400 }}> · Age {age}</span>}
                    {p.year_group && <span className="muted" style={{ fontWeight: 400 }}> · {p.year_group}</span>}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{p.parent_name || p.parent_email}</div>
                </div>
                {p.flagged_needs && (
                  <span className="chip" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 11 }}>
                    <Icon name="flag" size={10}/> Needs noted
                  </span>
                )}
                <span className={`chip tone-${STATUS_TONE[p.status]}`} style={{ fontSize: 11 }}>
                  {STATUS_LABEL[p.status]}
                </span>
                <Icon name="arrow-right" size={14} stroke="var(--ink-3)"/>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdmissionsQueue;
