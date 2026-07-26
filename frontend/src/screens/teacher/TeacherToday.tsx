import React from 'react';
import { Icon, Sparkline } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

interface TeacherTodayProps {
  onChild: (id: string) => void;
  onObserve: () => void;
}

export const TeacherToday: React.FC<TeacherTodayProps> = ({ onChild, onObserve }) => {
  const { children, observations } = ALC_DATA;
  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Good morning, Ana.</h1>
          <div className="sub">Monday · 20 April · 12 children in today · Weather: clear</div>
        </div>
        <div className="topbar-actions">
          <button className="btn"><Icon name="search" size={14}/> Search</button>
          <button className="btn" aria-label="Notifications"><Icon name="bell" size={14}/></button>
          <button className="btn primary" onClick={onObserve}><Icon name="mic" size={14}/> Capture observation</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 8 }}>Observations today</div>
          <div className="row between">
            <div className="stat-number">14</div>
            <Sparkline values={[3,5,4,7,6,9,14]} color="var(--sage-ink)" fill/>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>+6 vs. same time last week</div>
        </div>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 8 }}>AI suggestions awaiting review</div>
          <div className="row between">
            <div className="stat-number">7</div>
            <span className="chip" style={{ background: 'var(--ochre-soft)', color: 'var(--ochre-ink)', border: 'none' }}>
              <Icon name="sparkle" size={11}/> new
            </span>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>3 lesson pivots · 4 next steps</div>
        </div>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 8 }}>Children to check in on</div>
          <div className="stat-number" style={{ marginBottom: 4 }}>2</div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="chip dot" style={{ '--tone': 'var(--ochre)' } as React.CSSProperties}>Leo — attention</span>
            <span className="chip dot" style={{ '--tone': 'var(--plum)' } as React.CSSProperties}>Isla — mood</span>
          </div>
        </div>
      </div>

      <div className="grid cols-sidebar-lg" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 14 }}>
            <div>
              <h3>Today's flow</h3>
              <div className="muted">Suggested from yesterday's observations.</div>
            </div>
            <button className="btn ghost" aria-label="Edit flow"><Icon name="arrow-right" size={14}/></button>
          </div>
          <FlowStrip/>
        </div>
        <AIBriefCard onChild={onChild}/>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 14 }}>
          <div>
            <h3>Recent observations</h3>
            <div className="muted">Across your 12 children · last 24h</div>
          </div>
          <button className="btn ghost">View all <Icon name="arrow-right" size={13}/></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {observations.slice(0, 4).map(o => {
            const ch = children.find(c => c.id === o.childId);
            if (!ch) return null;
            return <ObservationRow key={o.id} obs={o} child={ch} onClick={() => onChild(ch.id)}/>;
          })}
        </div>
      </div>
    </div>
  );
};

const FlowStrip: React.FC = () => {
  const steps = [
    { time: '08:30', label: 'Arrival & free choice', state: 'done' },
    { time: '09:15', label: 'Language — Moveable alphabet', state: 'done' },
    { time: '10:00', label: 'Outdoor play', state: 'done' },
    { time: '10:30', label: 'Group time', state: 'now' },
    { time: '11:00', label: 'Mathematics — Golden beads', state: 'next', ai: true },
    { time: '12:00', label: 'Lunch & rest', state: 'next' },
    { time: '13:30', label: 'Practical life rotation', state: 'next', ai: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((s, i) => (
        <div key={i} className="row" style={{ padding: '10px 0', borderBottom: i < steps.length - 1 ? '1px dashed var(--line)' : 'none', gap: 14 }}>
          <div className="mono" style={{ color: 'var(--ink-4)', width: 46 }}>{s.time}</div>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: s.state === 'done' ? 'var(--sage)' : s.state === 'now' ? 'var(--ochre)' : 'var(--cream-2)',
            border: s.state === 'now' ? '2px solid var(--ochre)' : 'none',
            boxShadow: s.state === 'now' ? '0 0 0 4px var(--ochre-soft)' : 'none',
          }}/>
          <div style={{ flex: 1, fontWeight: s.state === 'now' ? 800 : 600, color: s.state === 'done' ? 'var(--ink-4)' : 'var(--ink)', textDecoration: s.state === 'done' ? 'line-through' : 'none' }}>
            {s.label}
          </div>
          {s.ai && <span className="chip" style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', fontSize: 11 }}><Icon name="sparkle" size={10}/> AI-shaped</span>}
          {s.state === 'now' && <span className="chip" style={{ background: 'var(--ochre)', color: 'var(--ochre-ink)', border: 'none' }}>Now</span>}
        </div>
      ))}
    </div>
  );
};

const AIBriefCard: React.FC<{ onChild: (id: string) => void }> = ({ onChild }) => (
  <div className="ai-panel">
    <div className="row between" style={{ marginBottom: 12 }}>
      <span className="ai-badge"><Icon name="sparkle" size={11}/> AI BRIEF</span>
      <span className="mono" style={{ color: 'var(--ink-4)' }}>08:12</span>
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.35 }}>
      Three things you might want to try today.
    </div>
    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
      <li>
        Pair <button onClick={() => onChild('c1')} style={{ color: 'var(--plum-ink)', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0, font: 'inherit', display: 'inline' }}>Amara</button> and <button onClick={() => onChild('c6')} style={{ color: 'var(--plum-ink)', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0, font: 'inherit', display: 'inline' }}>Theo</button> on Geometric Cabinet — Amara's mentoring showed up twice last week.
      </li>
      <li>
        Shorten <button onClick={() => onChild('c2')} style={{ color: 'var(--plum-ink)', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0, font: 'inherit', display: 'inline' }}>Leo's</button> language cycle to 6 minutes post-snack. A gentle experiment, not a conclusion.
      </li>
      <li>
        Quiet check-in with <button onClick={() => onChild('c7')} style={{ color: 'var(--plum-ink)', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0, font: 'inherit', display: 'inline' }}>Isla</button> this morning — third Monday withdrawal noted.
      </li>
    </ol>
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 14, fontStyle: 'italic' }}>
      Suggestions, not prescriptions. You know your children.
    </div>
  </div>
);

const ObservationRow: React.FC<{ obs: typeof ALC_DATA.observations[0]; child: typeof ALC_DATA.children[0]; onClick: () => void }> = ({ obs, child, onClick }) => (
  <div className={`row tone-${child.tone}`} style={{ padding: 12, borderRadius: 12, background: 'var(--cream)', gap: 14, alignItems: 'flex-start' }}>
    <div className="avatar-lg" style={{ width: 36, height: 36, fontSize: 12 }}>{child.initials}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{child.name} <span style={{ color: 'var(--ink-3)', fontWeight: 500, marginLeft: 6 }}>· {obs.author}</span></div>
        <div className="mono" style={{ color: 'var(--ink-4)' }}>{obs.time}</div>
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 8 }}>{obs.text}</div>
      <div className="row wrap" style={{ gap: 6 }}>
        {obs.tags.map(t => <span key={t} className="chip tone">{t}</span>)}
        {obs.role === 'parent' && <span className="chip" style={{ background: 'var(--sky-soft)', color: 'var(--sky-ink)', border: 'none' }}><Icon name="heart" size={11}/> from parent</span>}
      </div>
    </div>
    <button className="btn ghost" onClick={onClick} aria-label={`View ${child.name}'s profile`}><Icon name="arrow-right" size={14}/></button>
  </div>
);

export default TeacherToday;
