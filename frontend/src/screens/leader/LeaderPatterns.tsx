import React from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

export const LeaderPatterns: React.FC = () => {
  const { children } = ALC_DATA;

  const patterns = [
    {
      id: 'p1', title: 'Monday morning transition difficulty', severity: 'watch', tone: 'ochre',
      desc: 'Engagement is consistently 12% lower on Monday mornings across both cohorts. Pattern has held for 6 consecutive weeks.',
      affected: 'Whole school', count: children.length, source: '42 observations tagged "transitions"',
      suggestion: 'Consider a structured morning rhythm routine on Mondays — movement, story, then work — to ease the transition from weekend.',
      action: 'Share with Ms. Pereira and Mr. Hassan for Thursday planning meeting.',
    },
    {
      id: 'p2', title: 'Post-snack attention dip', severity: 'watch', tone: 'plum',
      desc: 'Four children in Acorns Primary show a consistent attention drop 20–30 minutes after morning snack. Not linked to child-level flags.',
      affected: 'Acorns Primary', count: 4, source: '18 observations tagged "attention"',
      suggestion: 'Review snack content and timing. Possible short sensorial reset after snack before work cycle continues.',
      action: 'Ask Ms. Pereira to log snack timing for 2 weeks.',
    },
    {
      id: 'p3', title: 'Peer mentoring emerging — unrecognised', severity: 'positive', tone: 'sage',
      desc: 'Three children (Amara, Sena, and one in Reception) are showing unprompted, sustained peer-support behaviour. This isn\'t in any lesson plan.',
      affected: 'Both cohorts', count: 3, source: '6 observations tagged "peer-mentoring"',
      suggestion: 'Formally recognise this in class — children who mentor learn as deeply as those they help. Consider building this into weekly routines.',
      action: 'Celebrate in next newsletter; share observation language with teachers.',
    },
    {
      id: 'p4', title: 'Isla Mitchell — third Monday withdrawal', severity: 'urgent', tone: 'plum',
      desc: 'Isla has withdrawn during Monday group sessions three weeks running. SENCO has been notified. Pattern aligns with a reported difficult weekend (parent note).',
      affected: 'One child', count: 1, source: '3 mood-tagged observations + 1 parent note',
      suggestion: 'SENCO and teacher to meet by Wednesday. Parent communication draft ready for review.',
      action: 'Review SENCO referral by Wednesday.',
    },
  ];

  const severityStyle = (s: string) => ({
    urgent: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    watch: { bg: 'var(--ochre-soft)', color: 'var(--ochre-ink)' },
    positive: { bg: 'var(--sage-soft)', color: 'var(--sage-ink)' },
  }[s] ?? { bg: 'var(--cream-2)', color: 'var(--ink-3)' });

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Patterns</h1>
          <div className="sub">AI-identified trends across observations, attendance, and curriculum data</div>
        </div>
        <div className="topbar-actions">
          <span className="chip"><Icon name="sparkle" size={11}/> Updated this morning</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {patterns.map(p => {
          const sStyle = severityStyle(p.severity);
          return (
            <div key={p.id} className={`card tone-${p.tone}`} style={{ padding: 24 }}>
              <div className="row between" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <span className="chip" style={{ background: sStyle.bg, color: sStyle.color, fontSize: 11, fontWeight: 700 }}>
                      {p.severity === 'urgent' ? 'Urgent' : p.severity === 'positive' ? 'Positive' : 'Watch'}
                    </span>
                    <span className="muted" style={{ fontSize: 12 }}>{p.affected} · {p.count} {p.count === 1 ? 'child' : 'children'}</span>
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>{p.title}</h3>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{p.desc}</div>
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 14 }}>
                <div style={{ padding: 14, background: 'var(--cream)', borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div className="tiny" style={{ marginBottom: 6 }}>Evidence</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>· {p.source}</div>
                </div>
                <div style={{ padding: 14, background: 'var(--cream)', borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div className="tiny" style={{ marginBottom: 6 }}>Suggestion</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{p.suggestion}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--tone-soft)', borderRadius: 10 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="arrow-right" size={12}/>
                  <div style={{ fontSize: 12.5, color: 'var(--tone-ink)', fontWeight: 600 }}>{p.action}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 14, padding: 16, background: 'var(--cream-2)' }}>
        <div className="tiny" style={{ marginBottom: 6 }}>About pattern detection</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          Patterns are generated from observation data. They surface correlations, not causes. Every pattern requires human judgment before action.
        </div>
      </div>
    </div>
  );
};

export default LeaderPatterns;
