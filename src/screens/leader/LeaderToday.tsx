import React from 'react';
import { Icon, Sparkline } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

export const LeaderToday: React.FC = () => {
  const { children } = ALC_DATA;
  const avgMastery = Math.round(children.reduce((s, c) => s + c.mastery, 0) / children.length);
  const avgAttendance = Math.round(children.reduce((s, c) => s + c.attendance, 0) / children.length);
  const flagged = children.filter(c => c.flags?.length).length;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Good morning, Dr. Okafor.</h1>
          <div className="sub">School overview · Monday, 14 April · Acorns Primary</div>
        </div>
        <div className="topbar-actions">
          <button className="btn"><Icon name="bell" size={13}/> Alerts <span style={{ marginLeft: 4, padding: '1px 7px', background: 'var(--danger)', color: 'white', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{flagged}</span></button>
          <button className="btn primary"><Icon name="sparkle" size={13}/> Morning brief</button>
        </div>
      </div>

      <div className="grid grid-4" style={{ gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Children enrolled', value: children.length, sub: 'Acorns Primary', tone: 'sage' },
          { label: 'Avg. mastery', value: `${avgMastery}%`, sub: '+3% vs last month', tone: 'ochre' },
          { label: 'Avg. attendance', value: `${avgAttendance}%`, sub: 'This term', tone: 'sky' },
          { label: 'Flagged patterns', value: flagged, sub: 'Need review', tone: 'plum' },
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
              <span className="chip"><Icon name="sparkle" size={11}/> AI insight</span>
            </div>
            <Sparkline values={[58, 61, 63, 65, 67, avgMastery]} color="var(--sage)" height={72}/>
            <div className="row" style={{ gap: 4, marginTop: 8 }}>
              {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(m => (
                <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--ink-4)' }}>{m}</div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <h3>Patterns needing your attention</h3>
            </div>
            {[
              { title: 'Monday morning transitions', meta: '12% lower engagement across Acorns cohort on Mondays vs. other days', tone: 'ochre', icon: 'flag' },
              { title: 'Post-snack attention dip', meta: '4 of 12 children show consistent attention drop 20–30 min after snack', tone: 'plum', icon: 'flag' },
              { title: 'Peer mentoring emerging', meta: 'Three children showing unprompted peer support — worth recognising', tone: 'sage', icon: 'heart' },
            ].map((p, i) => (
              <div key={i} className={`row tone-${p.tone}`} style={{ gap: 14, padding: '14px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--tone-soft)', color: 'var(--tone-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={p.icon as any} size={14}/>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>{p.title}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{p.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Today's teaching staff</div>
            {[
              { name: 'Ms. Pereira', role: 'Acorns Primary', present: true, initials: 'MP' },
              { name: 'Mr. Hassan', role: 'Acorns Reception', present: true, initials: 'MH' },
              { name: 'Ms. Doran', role: 'SENCO', present: true, initials: 'SD' },
            ].map((s, i) => (
              <div key={i} className="row" style={{ gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none' }}>
                <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{s.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{s.role}</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.present ? 'var(--sage)' : 'var(--danger)', display: 'inline-block' }}/>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Flagged children</div>
            {children.filter(c => c.flags?.length).map((c, i) => (
              <div key={c.id} className={`row tone-${c.tone}`} style={{ gap: 10, padding: '10px 0', borderBottom: i < flagged - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="avatar-lg" style={{ width: 28, height: 28, fontSize: 10 }}>{c.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{c.flags?.join(', ')}</div>
                </div>
                <Icon name="flag" size={12}/>
              </div>
            ))}
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
