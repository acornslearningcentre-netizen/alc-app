import React, { useEffect, useState } from 'react';
import { Icon, Trend } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchLeaderCohorts } from '../../lib/leader-api';
import type { LeaderCohorts as LeaderCohortsData, CohortChild } from '../../lib/leader-api';

type Filter = 'all' | 'flagged' | 'low';

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);

export const LeaderCohorts: React.FC = () => {
  const token = useAppStore(s => s.token);
  const [data, setData] = useState<LeaderCohortsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!token) { setError('You need to be signed in as a school leader to see this.'); setLoading(false); return; }
    let cancelled = false;
    fetchLeaderCohorts(token)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading cohorts…</div>;
  if (error || !data) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load cohorts.'}</div>;

  const allChildren = data.cohorts.flatMap(c => c.children);
  const matchesFilter = (c: CohortChild) => {
    if (filter === 'flagged') return c.flags.length > 0;
    if (filter === 'low') return c.mastery !== null && c.mastery < 65;
    return true;
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${allChildren.length})` },
    { key: 'flagged', label: `Flagged (${allChildren.filter(c => c.flags.length > 0).length})` },
    { key: 'low', label: `Mastery <65% (${allChildren.filter(c => c.mastery !== null && c.mastery < 65).length})` },
  ];

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Cohort overview</h1>
          <div className="sub">By teacher's class · real progress, not rank</div>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16 }} role="tablist" aria-label="Filter cohort">
        {filters.map(f => (
          <button key={f.key} role="tab" aria-selected={filter === f.key}
            className={`btn ${filter === f.key ? 'primary' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {data.cohorts.map(cohort => {
        const filtered = cohort.children.filter(matchesFilter);
        if (filter !== 'all' && filtered.length === 0) return null;
        return (
          <div key={cohort.teacher_id} className="card" style={{ marginBottom: 16 }}>
            <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{cohort.teacher_name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{cohort.child_count} {cohort.child_count === 1 ? 'child' : 'children'}</div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>{pct(cohort.avg_mastery)} avg.</div>
                <Trend dir={cohort.trend}/>
              </div>
            </div>
            <div style={{ padding: '0 16px' }}>
              {filtered.map((c, i) => (
                <div key={c.child_id} className="row" style={{ padding: '14px 0', borderBottom: i < filtered.length - 1 ? '1px dashed var(--line)' : 'none', gap: 14 }}>
                  <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{c.child_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div style={{ width: 160, fontWeight: 700, fontSize: 13.5 }}>{c.child_name}</div>
                  <div style={{ flex: 1 }}>
                    <div className="bar" style={{ height: 8 }}><span style={{ width: (c.mastery ?? 0) + '%' }}/></div>
                  </div>
                  <div className="mono" style={{ width: 50, textAlign: 'right', color: 'var(--ink-3)' }}>{pct(c.mastery)}</div>
                  <Trend dir={c.trend}/>
                  {c.flags.length > 0 ? (
                    <span className="chip" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 11 }}>
                      <Icon name="flag" size={10}/> {c.flags[0]}
                    </span>
                  ) : <div style={{ width: 80 }}/>}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>No children match this filter.</div>
              )}
            </div>
          </div>
        );
      })}
      {data.cohorts.length === 0 && (
        <div className="card muted" style={{ padding: '20px', textAlign: 'center' }}>No teachers on record yet.</div>
      )}
    </div>
  );
};

export default LeaderCohorts;
