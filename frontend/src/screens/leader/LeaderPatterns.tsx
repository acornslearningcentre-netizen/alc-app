import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchLeaderPatterns } from '../../lib/leader-api';
import type { LeaderPatterns as LeaderPatternsData } from '../../lib/leader-api';
import { patternTitle, patternDescription, patternTone, patternIcon } from '../../lib/leader-pattern-copy';

const severityLabel = (severity: string) => (severity === 'positive' ? 'Positive' : 'Watch');

const severityStyle = (severity: string) => ({
  watch: { bg: 'var(--ochre-soft)', color: 'var(--ochre-ink)' },
  positive: { bg: 'var(--sage-soft)', color: 'var(--sage-ink)' },
}[severity] ?? { bg: 'var(--cream-2)', color: 'var(--ink-3)' });

export const LeaderPatterns: React.FC = () => {
  const token = useAppStore(s => s.token);
  const [data, setData] = useState<LeaderPatternsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('You need to be signed in as a school leader to see this.'); setLoading(false); return; }
    let cancelled = false;
    fetchLeaderPatterns(token)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading patterns…</div>;
  if (error || !data) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load patterns.'}</div>;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Patterns</h1>
          <div className="sub">Real trends across mastery, flags, and cohort averages</div>
        </div>
        <div className="topbar-actions">
          <span className="chip"><Icon name="sparkle" size={11}/> Updated just now</span>
        </div>
      </div>

      {data.patterns.length === 0 && (
        <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>
          Nothing flagged right now — patterns only appear here when real data genuinely supports one.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.patterns.map((p, i) => {
          const sStyle = severityStyle(p.severity);
          return (
            <div key={i} className={`card tone-${patternTone(p)}`} style={{ padding: 24 }}>
              <div className="row between" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <span className="chip" style={{ background: sStyle.bg, color: sStyle.color, fontSize: 11, fontWeight: 700 }}>
                      {severityLabel(p.severity)}
                    </span>
                    {'teacherName' in p && p.teacherName && <span className="muted" style={{ fontSize: 12 }}>{p.teacherName}'s class</span>}
                  </div>
                  <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                    <Icon name={patternIcon(p)} size={14}/>
                    <h3 style={{ fontSize: 16 }}>{patternTitle(p)}</h3>
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 6 }}>{patternDescription(p)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 14, padding: 16, background: 'var(--cream-2)' }}>
        <div className="tiny" style={{ marginBottom: 6 }}>About pattern detection</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          Patterns are generated from real mastery trends, teacher-set flags, and cohort averages — never a fixed example. They surface correlations, not causes. Every pattern requires human judgment before action.
        </div>
      </div>
    </div>
  );
};

export default LeaderPatterns;
