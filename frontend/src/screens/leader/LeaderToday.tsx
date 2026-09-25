import React, { useEffect, useState } from 'react';
import { Icon, Sparkline } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchLeaderOverview, fetchLeaderCohorts, fetchLeaderOutcomes, fetchLeaderPatterns } from '../../lib/leader-api';
import type { LeaderOverview, LeaderCohorts, LeaderOutcomes, LeaderPatterns } from '../../lib/leader-api';
import { patternTitle, patternDescription, patternTone, patternIcon } from '../../lib/leader-pattern-copy';

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);

export const LeaderToday: React.FC = () => {
  const token = useAppStore(s => s.token);
  const userName = useAppStore(s => s.userName);
  const [overview, setOverview] = useState<LeaderOverview | null>(null);
  const [cohorts, setCohorts] = useState<LeaderCohorts | null>(null);
  const [outcomes, setOutcomes] = useState<LeaderOutcomes | null>(null);
  const [patterns, setPatterns] = useState<LeaderPatterns | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('You need to be signed in as a school leader to see this.'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchLeaderOverview(token), fetchLeaderCohorts(token), fetchLeaderOutcomes(token), fetchLeaderPatterns(token)])
      .then(([o, c, out, p]) => {
        if (cancelled) return;
        setOverview(o); setCohorts(c); setOutcomes(out); setPatterns(p); setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading school overview…</div>;
  if (error || !overview || !cohorts || !outcomes || !patterns) {
    return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load the school overview.'}</div>;
  }

  const flaggedChildren = cohorts.cohorts.flatMap(c => c.children.filter(ch => ch.flags.length > 0).map(ch => ({ ...ch, teacherName: c.teacher_name })));
  const trendValues = outcomes.trend.filter(t => t.avg_mastery !== null).map(t => t.avg_mastery as number);
  const topPatterns = patterns.patterns.slice(0, 3);

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Good morning{userName ? `, ${userName}` : ''}.</h1>
          <div className="sub">School overview · {dateLabel} · Acorns Primary</div>
        </div>
        <div className="topbar-actions">
          <button className="btn"><Icon name="bell" size={13}/> Alerts <span style={{ marginLeft: 4, padding: '1px 7px', background: 'var(--danger)', color: 'white', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{overview.flagged_children}</span></button>
        </div>
      </div>

      <div className="grid grid-4" style={{ gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Children enrolled', value: overview.children_count, sub: 'Acorns Primary', tone: 'sage' },
          { label: 'Avg. mastery', value: pct(overview.avg_mastery), sub: `Trending ${overview.trend}`, tone: 'ochre' },
          { label: 'Avg. attendance', value: pct(overview.avg_attendance), sub: 'Last 30 days', tone: 'sky' },
          { label: 'Flagged children', value: overview.flagged_children, sub: `${overview.observations_today} observations today`, tone: 'plum' },
        ].map(card => (
          <div key={card.label} className={`card tone-${card.tone}`} style={{ padding: 20 }}>
            <div className="tiny">{card.label}</div>
            <div className="stat-number">{card.value}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid cols-leader" style={{ gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <h3>School-wide mastery trend</h3>
            </div>
            {trendValues.length >= 2 ? (
              <>
                <Sparkline values={trendValues} color="var(--sage)" height={72}/>
                <div className="row" style={{ gap: 4, marginTop: 8 }}>
                  {outcomes.trend.filter(t => t.avg_mastery !== null).map(t => (
                    <div key={t.date} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--ink-4)' }}>
                      {new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="muted" style={{ fontSize: 12.5 }}>Not enough history yet — check back after a few more days of activity.</div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <h3>Patterns needing your attention</h3>
              {patterns.patterns.length > 3 && <span className="chip">+{patterns.patterns.length - 3} more</span>}
            </div>
            {topPatterns.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>Nothing flagged right now.</div>}
            {topPatterns.map((p, i) => (
              <div key={i} className={`row tone-${patternTone(p)}`} style={{ gap: 14, padding: '14px 0', borderBottom: i < topPatterns.length - 1 ? '1px dashed var(--line)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--tone-soft)', color: 'var(--tone-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={patternIcon(p)} size={14}/>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>{patternTitle(p)}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{patternDescription(p)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Cohorts</div>
            {cohorts.cohorts.map((c, i) => (
              <div key={c.teacher_id} className="row" style={{ gap: 10, padding: '10px 0', borderBottom: i < cohorts.cohorts.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{c.teacher_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.teacher_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{c.child_count} {c.child_count === 1 ? 'child' : 'children'} · {pct(c.avg_mastery)} avg. mastery</div>
                </div>
              </div>
            ))}
            {cohorts.cohorts.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>No teachers on record yet.</div>}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Flagged children</div>
            {flaggedChildren.map((c, i) => (
              <div key={c.child_id} className="row" style={{ gap: 10, padding: '10px 0', borderBottom: i < flaggedChildren.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="avatar-lg" style={{ width: 28, height: 28, fontSize: 10 }}>{c.child_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.child_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{c.flags.join(', ')}</div>
                </div>
                <Icon name="flag" size={12}/>
              </div>
            ))}
            {flaggedChildren.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>No children currently flagged.</div>}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>Governance note</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Child-level data is visible to you in your governance role. All data access is logged. SENCO referrals require teacher sign-off before action.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderToday;
