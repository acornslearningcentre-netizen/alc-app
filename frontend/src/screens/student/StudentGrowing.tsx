import React, { useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

export const StudentGrowing: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4];
  const firstName = child.name.split(' ')[0];
  const nextSteps = ALC_DATA.nextSteps[child.id as keyof typeof ALC_DATA.nextSteps] ?? [];

  const [done, setDone] = useState<number[]>([]);

  const toggle = (i: number) => setDone(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const growthItems = [
    { area: child.gaps[0], status: 'working on it', tip: `${firstName} is making steady progress here. Every time you try, you get a little better.` },
    ...(child.gaps.slice(1).map(g => ({ area: g, status: 'just started', tip: 'This is brand new — and that\'s exciting. You don\'t need to be good at it yet.' }))),
    ...child.strengths.map(s => ({ area: s, status: 'strong', tip: `This is one of your superpowers. Keep using it!` })),
  ];

  return (
    <div className="page-fade student-view">
      <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Growing, {firstName}</h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>Things you're working on and getting better at</div>
      </div>

      {nextSteps.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="tiny" style={{ marginBottom: 14 }}>Your next steps from {child.teacher}</div>
          {nextSteps.map((ns, i) => (
            <div key={i}
              className="row"
              style={{ gap: 14, padding: '14px 0', borderBottom: i < nextSteps.length - 1 ? '1px dashed var(--line)' : 'none', alignItems: 'flex-start', opacity: done.includes(i) ? 0.55 : 1, cursor: 'pointer' }}
              onClick={() => toggle(i)}
              role="checkbox"
              aria-checked={done.includes(i)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && toggle(i)}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${done.includes(i) ? 'var(--sage-ink)' : 'var(--line-2)'}`, background: done.includes(i) ? 'var(--sage-soft)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                {done.includes(i) && <Icon name="check" size={11}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8, marginBottom: 3 }}>
                  <span className="chip" style={{ fontSize: 11 }}>{ns.type}</span>
                  {ns.time !== '—' && <span className="muted" style={{ fontSize: 12 }}>{ns.time}</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, textDecoration: done.includes(i) ? 'line-through' : 'none' }}>{ns.title}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{ns.rationale}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="tiny" style={{ marginBottom: 14 }}>My learning map</div>
        {growthItems.map((item, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < growthItems.length - 1 ? '1px dashed var(--line)' : 'none' }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.area}</div>
              <span className="chip" style={{
                background: item.status === 'strong' ? 'var(--sage-soft)' : item.status === 'working on it' ? 'var(--ochre-soft)' : 'var(--sky-soft)',
                color: item.status === 'strong' ? 'var(--sage-ink)' : item.status === 'working on it' ? 'var(--ochre-ink)' : 'var(--sky-ink)',
                fontSize: 11
              }}>{item.status}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>{item.tip}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, background: 'var(--ochre-soft)' }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <Icon name="sun" size={18}/>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Growing takes time</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Every time you try something hard, your brain builds new connections. You don't have to be perfect — just curious.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrowing;
