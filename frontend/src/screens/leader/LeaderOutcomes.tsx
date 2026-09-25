import React, { useEffect, useState } from 'react';
import { Sparkline } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchLeaderOutcomes } from '../../lib/leader-api';
import type { LeaderOutcomes as LeaderOutcomesData } from '../../lib/leader-api';

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const LeaderOutcomes: React.FC = () => {
  const token = useAppStore(s => s.token);
  const [data, setData] = useState<LeaderOutcomesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('You need to be signed in as a school leader to see this.'); setLoading(false); return; }
    let cancelled = false;
    fetchLeaderOutcomes(token)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading outcomes…</div>;
  if (error || !data) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load outcomes.'}</div>;

  const withMastery = data.trend.filter(t => t.avg_mastery !== null);
  const masteryValues = withMastery.map(t => t.avg_mastery as number);
  const earliest = data.trend[0];
  const latest = data.trend[data.trend.length - 1];
  const { exceeding, meeting, needsSupport } = data.distribution;
  const distTotal = exceeding + meeting + needsSupport;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Outcomes</h1>
          <div className="sub">Whole-school results · real history, last 30 days</div>
        </div>
      </div>

      {earliest && latest && earliest !== latest ? (
        <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
          {[{ label: `Earliest on record · ${shortDate(earliest.date)}`, point: earliest }, { label: `Most recent · ${shortDate(latest.date)}`, point: latest }].map(({ label, point }) => (
            <div key={label} className="card" style={{ padding: 20 }}>
              <div className="tiny" style={{ marginBottom: 10 }}>{label}</div>
              <div className="grid grid-3" style={{ gap: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{pct(point.avg_mastery)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Avg. mastery</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{pct(point.avg_attendance)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Avg. attendance</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{point.child_count}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Children tracked</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : latest ? (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>{shortDate(latest.date)}</div>
          <div className="grid grid-3" style={{ gap: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{pct(latest.avg_mastery)}</div>
              <div className="muted" style={{ fontSize: 12 }}>Avg. mastery</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{pct(latest.avg_attendance)}</div>
              <div className="muted" style={{ fontSize: 12 }}>Avg. attendance</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{latest.child_count}</div>
              <div className="muted" style={{ fontSize: 12 }}>Children tracked</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card muted" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>No history yet — check back after a few days of activity.</div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Mastery over time</h3>
        {masteryValues.length >= 2 ? (
          <>
            <Sparkline values={masteryValues} color="var(--sage)" height={90}/>
            <div className="row" style={{ gap: 4, marginTop: 8 }}>
              {withMastery.map(t => (
                <div key={t.date} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--ink-4)' }}>{shortDate(t.date)}</div>
              ))}
            </div>
          </>
        ) : (
          <div className="muted" style={{ fontSize: 12.5 }}>Not enough history yet to chart a trend.</div>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 14 }}>Mastery distribution</h3>
        <div className="grid grid-3" style={{ gap: 12 }}>
          {[
            { label: 'Exceeding expectations', count: exceeding, tone: 'sage' },
            { label: 'Meeting expectations', count: meeting, tone: 'ochre' },
            { label: 'Needs support', count: needsSupport, tone: 'plum' },
          ].map(group => (
            <div key={group.label} className={`card tone-${group.tone}`} style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 28 }}>{group.count}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{group.label}</div>
            </div>
          ))}
        </div>
        {distTotal === 0 && <div className="muted" style={{ marginTop: 12, fontSize: 12.5, textAlign: 'center' }}>No children have a mastery score yet.</div>}
      </div>
    </div>
  );
};

export default LeaderOutcomes;
