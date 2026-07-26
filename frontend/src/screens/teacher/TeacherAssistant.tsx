import React, { useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

export const TeacherAssistant: React.FC = () => {
  const { children } = ALC_DATA;
  const [activeChildId, setActiveChildId] = useState('c1');
  const [q, setQ] = useState('');
  const [thread, setThread] = useState([
    { from: 'ai', text: "Good morning, Ana. I've reviewed last week's observations across your 12 children. Three things stood out — want me to walk you through them, or would you rather ask about a specific child?", evidence: [] as string[] }
  ]);

  const presets = [
    { label: 'Whole-class patterns this week', icon: 'chart' as const },
    { label: 'Who might need a check-in?', icon: 'heart' as const },
    { label: "Draft tomorrow's lessons", icon: 'book' as const },
    { label: 'Summarise parent-shared moments', icon: 'message' as const },
    { label: 'Explain a recent flagged pattern', icon: 'flag' as const },
  ];

  const activeChild = children.find(c => c.id === activeChildId)!;

  const generateAnswer = (q: string): { text: string; evidence: string[] } => {
    if (/pattern|whole|class/i.test(q)) return { text: `Three patterns this week. 1) Post-snack attention is shorter across your 4-year-olds — not just Leo. 2) Peer-mentoring is emerging in three girls (Amara, Sena, Priya) — worth naming out loud. 3) Monday mornings are consistently your hardest transition window.`, evidence: ['14 observations tagged "attention" last 7 days', '6 observations tagged "peer-mentoring"', 'Monday avg. engagement 12% lower than other days'] };
    if (/check[- ]in|worry|need|concern/i.test(q)) return { text: `Two gentle check-ins I'd flag: Isla (third Monday withdrawal — third instance) and Leo (attention shift after snack, possible environmental). Neither is urgent. Both benefit from presence, not intervention.`, evidence: ['Isla: 3 observations tagged "mood"', 'Leo: 5 observations tagged "attention"'] };
    if (/draft|lesson|plan/i.test(q)) return { text: `I drafted four lessons for tomorrow based on where the class is. Two extensions (Geometric Cabinet for Amara + Theo, Thousand chain review for Mei), one fresh material (Sandpaper Letters, small group), and one repair (practical life rotation for attention support). All editable.`, evidence: ['Aligned to Acorns curriculum map', '12 children matched to next-best material'] };
    if (/parent|home|share/i.test(q)) return { text: `Four parents shared moments this week. Most notable: Tom (Leo's dad) flagged a home focus dip at bedtime — worth reading with today's snack observation.`, evidence: ['4 parent observations this week', '2 cross-link with teacher observations'] };
    return { text: `I need another round of observations to answer that well. Want me to draft a 5-day light tracking prompt so we can come back to it with data?`, evidence: [] };
  };

  const ask = (text: string) => {
    if (!text) return;
    const answer = generateAnswer(text);
    setThread(t => [...t, { from: 'user', text, evidence: [] }, { from: 'ai', ...answer }]);
    setQ('');
  };

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>AI Assistant</h1>
          <div className="sub">Your private thinking partner. Grounded in every observation you've made this term.</div>
        </div>
        <div className="topbar-actions">
          <span className="chip"><Icon name="shield" size={11}/> Private to you</span>
          <button className="btn"><Icon name="clock" size={13}/> History</button>
        </div>
      </div>

      <div className="grid cols-messages" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>Context</div>
          <button className="nav-item active" style={{ marginBottom: 4 }}>
            <Icon name="users" size={14}/> Whole class
          </button>
          <div className="tiny" style={{ margin: '14px 0 6px' }}>Or focus on one child</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 340, overflow: 'auto' }}>
            {children.map(c => (
              <button key={c.id} onClick={() => setActiveChildId(c.id)}
                className={`row tone-${c.tone}`}
                style={{ padding: '8px 10px', borderRadius: 10, background: activeChildId === c.id ? 'var(--cream-2)' : 'transparent', gap: 10, textAlign: 'left' }}>
                <div className="avatar-lg" style={{ width: 26, height: 26, fontSize: 10 }}>{c.initials}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="row between">
              <div className="row" style={{ gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="sparkle" size={14}/>
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>Assistant</div>
                  <div className="muted" style={{ fontSize: 12 }}>Focused on <strong>{activeChild.name}</strong> · 34 observations loaded</div>
                </div>
              </div>
              <button className="btn ghost"><Icon name="arrow-right" size={13}/> Open {activeChild.name.split(' ')[0]}'s profile</button>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            {thread.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: m.from === 'user' ? 'var(--ink)' : 'var(--ochre-soft)', color: m.from === 'user' ? 'var(--cream)' : 'var(--ink)', fontSize: 14, lineHeight: 1.55 }}>
                  {m.text}
                </div>
                {m.evidence && m.evidence.length > 0 && (
                  <div style={{ marginTop: 8, padding: 10, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12, color: 'var(--ink-3)' }}>
                    <div className="tiny" style={{ marginBottom: 4 }}>Based on</div>
                    {m.evidence.map((e, j) => <div key={j}>· {e}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
            <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
              {presets.map(p => (
                <button key={p.label} className="chip" onClick={() => ask(p.label)} style={{ cursor: 'pointer' }}>
                  <Icon name={p.icon} size={11}/> {p.label}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8, padding: 10, background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--line)' }}>
              <button className="btn ghost" style={{ padding: 6 }} aria-label="Voice input"><Icon name="mic" size={14}/></button>
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(q)}
                placeholder={`Ask anything — about the class or about ${activeChild.name.split(' ')[0]}…`}
                aria-label="Ask the AI assistant"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
              <button className="btn primary" onClick={() => ask(q)} aria-label="Send"><Icon name="send" size={12}/></button>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8, fontStyle: 'italic' }}>
              The Assistant is a coach, not an oracle. It names patterns; you name what matters.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Saved for you this morning</div>
            {[
              { title: 'Post-snack attention dip', meta: '4 children affected', tone: 'ochre' },
              { title: 'Isla — 3rd Monday withdrawal', meta: 'SENCO draft ready', tone: 'plum' },
              { title: 'Peer-mentoring emerging pattern', meta: 'Amara, Sena, Priya', tone: 'sage' },
            ].map((t, i) => (
              <div key={i} className={`tone-${t.tone}`} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none' }}>
                <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{t.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>{t.meta}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Recent chats</div>
            {['Why is Leo avoiding language work?', 'Draft a lesson on Pink Tower', 'Compare Mei and Zara on maths', 'Parent note for Jonah'].map((t, i) => (
              <div key={i} className="row" style={{ padding: '8px 0', borderBottom: i < 3 ? '1px dashed var(--line)' : 'none', gap: 8 }}>
                <Icon name="message" size={12}/>
                <div style={{ fontSize: 12.5, flex: 1 }}>{t}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>What the assistant never does</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Diagnose, rank, or share with anyone except you. Patterns flagged for SENCO only move when you say so.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssistant;
