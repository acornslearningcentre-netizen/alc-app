import React from 'react';
import { Icon, Sparkline } from '../../../components/ui';
import { ALC_DATA } from '../../../data/seed';

interface Props {
  onChild: (id: string) => void;
  onObserve: () => void;
}

export const TeacherTodayV2: React.FC<Props> = ({ onChild, onObserve }) => {
  const { children, observations } = ALC_DATA;

  return (
    <div className="v2-content">
      <header className="v2-masthead">
        <div>
          <div className="v2-masthead-sig">
            <span className="num">01</span>
            <span>— Today</span>
            <span>·</span>
            <span>Mon 20 Apr · clear</span>
            <span>·</span>
            <span>12 in / 2 to check on</span>
          </div>
          <h1 className="v2-greeting-h1">
            Good morning,<br/><em>Ana.</em>
          </h1>
        </div>
        <div className="v2-actions">
          <button className="v2-btn ghost" aria-label="Search"><Icon name="search" size={14}/></button>
          <button className="v2-btn ghost" aria-label="Notifications"><Icon name="bell" size={14}/></button>
          <button className="v2-btn primary" onClick={onObserve}><Icon name="mic" size={14}/> Capture observation</button>
        </div>
      </header>

      <section className="v2-stats v2-cascade">
        <div className="v2-stat-block hero">
          <div className="v2-sig">
            <span className="num">02</span>
            <span className="em">— Observations today</span>
            <span className="spacer"/>
            <span>Last 7 days</span>
          </div>
          <div className="v2-stat-num">14</div>
          <div className="v2-stat-meta">
            <Sparkline values={[3,5,4,7,6,9,14]} color="var(--v2-tangerine)" fill/>
            <span className="v2-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--v2-pencil)' }}>+6 vs. last Mon</span>
          </div>
        </div>

        <div className="v2-stat-block pair">
          <div className="v2-sig">
            <span className="num">03</span>
            <span className="em">— AI awaiting review</span>
            <span className="spacer"/>
            <span>Pending</span>
          </div>
          <div className="v2-stat-num" style={{ color: 'var(--v2-ultramarine)' }}>07</div>
          <div className="v2-stat-meta">
            <span className="v2-chip ultramarine-soft">3 lesson pivots</span>
            <span className="v2-chip ultramarine-soft">4 next steps</span>
          </div>
        </div>

        <div className="v2-stat-block pair">
          <div className="v2-sig">
            <span className="num">04</span>
            <span className="em">— Check in on</span>
            <span className="spacer"/>
            <span>Flagged</span>
          </div>
          <div className="v2-stat-num" style={{ color: 'var(--v2-tangerine)' }}>02</div>
          <div className="v2-stat-meta">
            <span className="v2-chip tangerine-soft">Leo · attention</span>
            <span className="v2-chip tangerine-soft">Isla · mood</span>
          </div>
        </div>
      </section>

      <section className="v2-mid">
        <div className="v2-flow">
          <div className="v2-sig">
            <span className="num">05</span>
            <span className="em">— Today's flow</span>
            <span className="spacer"/>
            <span>Suggested from yesterday</span>
          </div>
          <Flow/>
        </div>

        <AIBrief onChild={onChild}/>
      </section>

      <section className="v2-obs-card">
        <div className="v2-sig">
          <span className="num">06</span>
          <span className="em">— Recent observations</span>
          <span className="spacer"/>
          <span>Across 12 children · 24h</span>
        </div>
        <div className="v2-obs-list">
          {observations.slice(0, 4).map(o => {
            const ch = children.find(c => c.id === o.childId);
            if (!ch) return null;
            return (
              <article key={o.id} className="v2-obs">
                <span className="v2-obs-avatar">{ch.initials}</span>
                <div>
                  <div className="v2-obs-head">
                    <span>
                      <span className="v2-obs-name">{ch.name}</span>
                      <span className="v2-obs-author">{o.author}</span>
                    </span>
                    <span className="v2-obs-time">{o.time}</span>
                  </div>
                  <p className="v2-obs-text">{o.text}</p>
                  <div className="v2-tags">
                    {o.tags.map(t => <span key={t} className="v2-chip">{t}</span>)}
                    {o.role === 'parent' && <span className="v2-chip ultramarine-soft"><Icon name="heart" size={11}/> from parent</span>}
                  </div>
                </div>
                <button className="v2-obs-cta" onClick={() => onChild(ch.id)} aria-label={`Open ${ch.name}'s profile`}>
                  <Icon name="arrow-right" size={14}/>
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const Flow: React.FC = () => {
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
    <div style={{ marginTop: 8 }}>
      {steps.map((s, i) => (
        <div key={i} className={`v2-flow-row ${s.state}`}>
          <span className="v2-flow-time">{s.time}</span>
          <span className="v2-flow-pip" aria-hidden/>
          <span className="v2-flow-label">{s.label}</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {s.ai && <span className="v2-chip ultramarine"><Icon name="sparkle" size={10}/> AI-shaped</span>}
            {s.state === 'now' && <span className="v2-chip tangerine">Now</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

const AIBrief: React.FC<{ onChild: (id: string) => void }> = ({ onChild }) => (
  <aside className="v2-ai">
    <div className="v2-ai-sig">
      <span className="num">A</span>
      <span>— AI brief · 08:12</span>
      <span className="v2-ai-spark"/>
    </div>
    <h3 className="v2-ai-headline">
      Three things you might want to <em>try today.</em>
    </h3>
    <ol className="v2-ai-list">
      <li>
        Pair <button onClick={() => onChild('c1')}>Amara</button> and <button onClick={() => onChild('c6')}>Theo</button> on Geometric Cabinet — Amara's mentoring showed up twice last week.
      </li>
      <li>
        Shorten <button onClick={() => onChild('c2')}>Leo's</button> language cycle to 6 minutes post-snack. A gentle experiment, not a conclusion.
      </li>
      <li>
        Quiet check-in with <button onClick={() => onChild('c7')}>Isla</button> this morning — third Monday withdrawal noted.
      </li>
    </ol>
    <div className="v2-ai-foot">— Suggestions, not prescriptions</div>
  </aside>
);

export default TeacherTodayV2;
