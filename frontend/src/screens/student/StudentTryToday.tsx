import React, { useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

export const StudentTryToday: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4];
  const firstName = child.name.split(' ')[0];
  const [picked, setPicked] = useState<number | null>(null);

  const activities = [
    {
      area: child.focus[0] ?? 'Language',
      title: `Explore ${child.focus[0] ?? 'Language'} materials`,
      desc: `Based on what you've been doing this week, ${child.teacher} thinks this would be great for you today.`,
      time: '15–20 min',
      tone: child.tone,
      icon: 'book' as const,
      type: 'Suggested',
    },
    {
      area: 'Your choice',
      title: 'Pick anything from the shelf that calls to you',
      desc: 'Sometimes the best learning happens when you follow your curiosity. What feels interesting right now?',
      time: 'Up to you',
      tone: 'ochre',
      icon: 'star' as const,
      type: 'Free choice',
    },
    ...(child.strengths.length > 0 ? [{
      area: child.strengths[0],
      title: `Something with ${child.strengths[0].toLowerCase()}`,
      desc: `This is one of your strengths — explore it further today.`,
      time: '10–15 min',
      tone: 'sage',
      icon: 'heart' as const,
      type: 'Strength-based',
    }] : []),
  ];

  return (
    <div className="page-fade student-view">
      <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Try today, {firstName}</h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>Pick something to explore</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {activities.map((act, i) => (
          <button key={i}
            onClick={() => setPicked(i)}
            className={`card tone-${act.tone}`}
            style={{ padding: 20, textAlign: 'left', cursor: 'pointer', border: picked === i ? '2px solid var(--tone)' : '2px solid transparent', background: picked === i ? 'var(--tone-soft)' : 'var(--paper)', transition: 'all 0.2s' }}
            aria-pressed={picked === i}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tone-soft)', color: 'var(--tone-ink)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={act.icon} size={16}/>
                </div>
                <div>
                  <span className="chip" style={{ fontSize: 11, marginBottom: 3 }}>{act.type}</span>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{act.title}</div>
                </div>
              </div>
              {picked === i && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sage-ink)', color: 'white', display: 'grid', placeItems: 'center' }}>
                  <Icon name="check" size={12}/>
                </div>
              )}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', marginBottom: 8 }}>{act.desc}</div>
            <div className="row" style={{ gap: 6 }}>
              <Icon name="clock" size={12}/>
              <span className="muted" style={{ fontSize: 12 }}>{act.time}</span>
              <span className="muted" style={{ fontSize: 12 }}>· {act.area}</span>
            </div>
          </button>
        ))}
      </div>

      {picked !== null && (
        <div className="card" style={{ padding: 20, background: 'var(--sage-soft)', marginBottom: 16 }}>
          <div className="row" style={{ gap: 12 }}>
            <Icon name="check" size={18}/>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Great choice, {firstName}!</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                You picked: <strong>{activities[picked].title}</strong>. Take your time, enjoy it, and remember — there's no rush.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div className="tiny" style={{ marginBottom: 10 }}>What to do when you finish</div>
        {["Put your work away carefully", "Tell a grown-up what you noticed", "Pick something else you're curious about"].map((step, i) => (
          <div key={i} className="row" style={{ gap: 10, padding: '9px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--cream-2)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 13.5 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentTryToday;
