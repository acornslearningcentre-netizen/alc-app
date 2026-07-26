import React from 'react';
import { Icon, Sparkline } from '../../components/ui';

const TEACHERS = [
  {
    name: 'Ms. Pereira', initials: 'MP', role: 'Class Teacher', cohort: 'Acorns Primary',
    children: 12, observations: 34, avgMastery: 69, trend: [58, 61, 63, 66, 68, 69],
    strengths: ['Detailed observations', 'Strong parent communication'],
    notes: 'Consistent with SENCO flagging protocol. AI suggestion uptake: 78%.',
  },
  {
    name: 'Mr. Hassan', initials: 'MH', role: 'Class Teacher', cohort: 'Acorns Reception',
    children: 11, observations: 28, avgMastery: 62, trend: [54, 56, 58, 60, 61, 62],
    strengths: ['Outdoor learning', 'Sensorial curriculum'],
    notes: 'Observations frequency slightly lower this month. Worth a check-in.',
  },
  {
    name: 'Ms. Doran', initials: 'SD', role: 'SENCO', cohort: 'Whole school',
    children: 4, observations: 12, avgMastery: null, trend: null,
    strengths: ['SENCO documentation', 'Family communication'],
    notes: 'Three active referrals this term. All within expected range for cohort size.',
  },
];

export const LeaderTeachers: React.FC = () => (
  <div className="page-fade">
    <div className="topbar">
      <div>
        <h1>Teaching staff</h1>
        <div className="sub">Performance patterns · not surveillance, but support</div>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {TEACHERS.map(t => (
        <div key={t.name} className="card" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
            <div className="row" style={{ gap: 14 }}>
              <div className="avatar-lg" style={{ width: 42, height: 42, fontSize: 14 }}>{t.initials}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>{t.role} · {t.cohort}</div>
              </div>
            </div>
            <button className="btn ghost">View full profile</button>
          </div>

          <div className="grid grid-3" style={{ gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: 14, background: 'var(--cream-2)' }}>
              <div className="tiny">Children</div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{t.children}</div>
            </div>
            <div className="card" style={{ padding: 14, background: 'var(--cream-2)' }}>
              <div className="tiny">Observations this month</div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{t.observations}</div>
            </div>
            {t.avgMastery !== null ? (
              <div className="card" style={{ padding: 14, background: 'var(--cream-2)' }}>
                <div className="tiny">Cohort avg. mastery</div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{t.avgMastery}%</div>
                {t.trend && <Sparkline values={t.trend} color="var(--sage)" height={28}/>}
              </div>
            ) : (
              <div className="card" style={{ padding: 14, background: 'var(--cream-2)' }}>
                <div className="tiny">Active referrals</div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>3</div>
              </div>
            )}
          </div>

          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <div className="tiny" style={{ marginBottom: 6 }}>Noted strengths</div>
              {t.strengths.map((s, i) => (
                <div key={i} className="row" style={{ gap: 8, padding: '6px 0', borderBottom: i < t.strengths.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                  <Icon name="check" size={12}/>
                  <span style={{ fontSize: 13 }}>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="tiny" style={{ marginBottom: 6 }}>Leader note</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>{t.notes}</div>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="card" style={{ marginTop: 14, padding: 16, background: 'var(--cream-2)' }}>
      <div className="tiny" style={{ marginBottom: 6 }}>On professional trust</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
        This view shows patterns for strategic support — not for performance management. Conversations about these patterns should happen in person, with care.
      </div>
    </div>
  </div>
);

export default LeaderTeachers;
