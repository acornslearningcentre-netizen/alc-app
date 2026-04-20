import React, { useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

export const ParentAssistant: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[0];
  const firstName = child.name.split(' ')[0];

  const [q, setQ] = useState('');
  const [thread, setThread] = useState([
    { from: 'ai', text: `Hi ${child.guardian.split(' ')[0]}. I can see ${firstName}'s progress, observations, and learning profile. What would you like to understand better?`, evidence: [] as string[] }
  ]);

  const presets = [
    { label: `How is ${firstName} doing overall?`, icon: 'chart' as const },
    { label: 'What can I do at home?', icon: 'heart' as const },
    { label: "What's ${firstName}'s learning style?", icon: 'book' as const },
    { label: 'Any patterns I should know about?', icon: 'flag' as const },
  ].map(p => ({ ...p, label: p.label.replace('${firstName}', firstName) }));

  const generateAnswer = (text: string): { text: string; evidence: string[] } => {
    if (/how.*doing|overall|progress/i.test(text)) return {
      text: `${firstName} is doing really well this term. Mastery is at ${child.mastery}% and trending ${child.trend}. ${child.teacher} has noted strong ${child.strengths[0].toLowerCase()} — a real standout. The one area we're gently tracking is ${child.gaps[0].toLowerCase()}, but it's not a concern at this stage.`,
      evidence: [`${child.mastery}% mastery score this term`, `${child.attendance}% attendance`, `${ALC_DATA.observations.filter(o => o.childId === child.id).length} observations this week`]
    };
    if (/home|support|do/i.test(text)) return {
      text: `${firstName} has a ${child.style.toLowerCase()} learning style, which means ${child.style === 'Kinaesthetic' ? 'hands-on activities and movement help the most' : child.style === 'Auditory' ? 'talking things through and reading aloud work brilliantly' : 'visual explanations, drawing, and patterns click best'}. At home, try ${child.style === 'Kinaesthetic' ? 'baking with measuring, building with blocks, or sorting household objects' : child.style === 'Auditory' ? 'telling stories together, narrating daily routines, or listening to audiobooks' : 'making charts, drawing maps, or spotting patterns on a walk'}.`,
      evidence: [`Learning style: ${child.style}`, `Focus areas: ${child.focus.join(', ')}`]
    };
    if (/style|learn/i.test(text)) return {
      text: `${firstName} is a ${child.style.toLowerCase()} learner. That means ${child.style === 'Kinaesthetic' ? `${firstName} learns best by doing and touching — not just watching or listening` : child.style === 'Auditory' ? `${firstName} absorbs information through sound and spoken language` : `${firstName} builds understanding through seeing, patterns, and spatial arrangement`}. ${child.teacher} adapts presentations to match this.`,
      evidence: [`Learning style: ${child.style}`, `Strengths: ${child.strengths.join(', ')}`]
    };
    if (/pattern|concern|flag|worry/i.test(text)) return {
      text: child.flags?.length ? `There's one pattern ${child.teacher} has noted: ${child.flags.includes('attention-pattern') ? `${firstName}'s sustained attention window is shorter than expected — especially after snack time. It's being tracked, not labelled.` : `${firstName} has had some quieter days, particularly on Mondays. ${child.teacher} is watching it gently.`} Nothing urgent — just good to be aware of.` : `No concerns flagged at this stage. ${firstName} is settled and engaged.`,
      evidence: child.flags?.length ? [`${ALC_DATA.observations.filter(o => o.childId === child.id).length} observations reviewed`, 'Pattern identified by teacher'] : [`All observations show consistent engagement`]
    };
    return {
      text: `That's a great question. I'd need a bit more context to answer it well — want to ask ${child.teacher} directly? I can help you draft a message.`,
      evidence: []
    };
  };

  const ask = (text: string) => {
    if (!text.trim()) return;
    const answer = generateAnswer(text);
    setThread(t => [...t, { from: 'user', text, evidence: [] }, { from: 'ai', ...answer }]);
    setQ('');
  };

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Ask about {firstName}</h1>
          <div className="sub">Questions answered from {firstName}'s observations, progress, and learning profile.</div>
        </div>
        <div className="topbar-actions">
          <span className="chip"><Icon name="shield" size={11}/> Private to your family</span>
        </div>
      </div>

      <div className="grid cols-sidebar-sm" style={{ gap: 16 }}>
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="row" style={{ gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
                <Icon name="sparkle" size={14}/>
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>Parent Assistant</div>
                <div className="muted" style={{ fontSize: 12 }}>Focused on {child.name} · {ALC_DATA.observations.filter(o => o.childId === child.id).length} observations loaded</div>
              </div>
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
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(q)}
                placeholder={`Ask anything about ${firstName}…`}
                aria-label="Ask the parent assistant"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
              <button className="btn primary" onClick={() => ask(q)} aria-label="Send"><Icon name="send" size={12}/></button>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8, fontStyle: 'italic' }}>
              Answers draw on school observations — they complement, not replace, conversation with {child.teacher}.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className={`card tone-${child.tone}`} style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>{firstName}'s snapshot</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row between"><span className="muted" style={{ fontSize: 12.5 }}>Mastery</span><strong>{child.mastery}%</strong></div>
              <div className="row between"><span className="muted" style={{ fontSize: 12.5 }}>Attendance</span><strong>{child.attendance}%</strong></div>
              <div className="row between"><span className="muted" style={{ fontSize: 12.5 }}>Learning style</span><strong>{child.style}</strong></div>
              <div className="row between"><span className="muted" style={{ fontSize: 12.5 }}>Streak</span><strong>{child.streak} weeks</strong></div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Popular questions</div>
            {['What does mastery mean?', 'What is a Montessori streak?', 'Can I see all observations?'].map((t, i) => (
              <button key={i} onClick={() => ask(t)}
                className="row" style={{ padding: '8px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none', gap: 8, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Icon name="message" size={12}/>
                <div style={{ fontSize: 12.5, flex: 1 }}>{t}</div>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>What this assistant never does</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Compare your child to others, make diagnostic claims, or share your conversations with the school without your permission.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentAssistant;
