import React, { useEffect, useState } from 'react';
import { Trend } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchClassProgress } from '../../lib/progress-api';
import type { ClassProgress } from '../../lib/progress-api';
import { initialsFromName } from '../../lib/child-fields';

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);

export const TeacherProgress: React.FC = () => {
  const token = useAppStore(s => s.token);
  const [progress, setProgress] = useState<ClassProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('You need to be signed in to see class progress.'); setLoading(false); return; }
    let cancelled = false;
    fetchClassProgress(token)
      .then(p => { if (!cancelled) { setProgress(p); setError(null); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading class progress…</div>;
  if (error || !progress) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'Could not load class progress.'}</div>;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Class progress</h1>
          <div className="sub">Mastery across {progress.child_count} {progress.child_count === 1 ? 'child' : 'children'} · trend, not rank</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 14, marginBottom: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny">Class avg. mastery</div>
          <div className="row between" style={{ marginTop: 6 }}>
            <div className="stat-number">{pct(progress.avg_mastery)}</div>
            <Trend dir={progress.trend}/>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny">Class avg. attendance</div>
          <div className="stat-number" style={{ marginTop: 6 }}>{pct(progress.avg_attendance)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny">Class avg. streak</div>
          <div className="stat-number" style={{ marginTop: 6 }}>{progress.avg_streak ?? '—'}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>days with an observation logged</div>
        </div>
      </div>

      <div className="card">
        {progress.children.map((c, i) => (
          <div key={c.child_id} className="row" style={{ padding: '12px 0', borderBottom: i < progress.children.length - 1 ? '1px dashed var(--line)' : 'none', gap: 14 }}>
            <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{initialsFromName(c.child_name)}</div>
            <div style={{ width: 160, fontWeight: 700, fontSize: 13.5 }}>{c.child_name}</div>
            <div style={{ flex: 1 }}><div className="bar" style={{ height: 8 }}><span style={{ width: (c.mastery ?? 0) + '%' }}/></div></div>
            <div className="mono" style={{ width: 50, textAlign: 'right', color: 'var(--ink-3)' }}>{pct(c.mastery)}</div>
            <div className="mono" style={{ width: 70, textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{pct(c.attendance)} att.</div>
            <Trend dir={c.trend}/>
          </div>
        ))}
        {progress.children.length === 0 && (
          <div className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No children in your class yet.</div>
        )}
      </div>
    </div>
  );
};

export default TeacherProgress;
