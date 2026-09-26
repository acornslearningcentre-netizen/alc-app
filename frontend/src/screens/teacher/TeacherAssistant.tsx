import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchChildren } from '../../lib/children-api';
import type { RealChild } from '../../lib/children-api';
import { fetchChildNextSteps } from '../../lib/next-steps-api';
import type { RealNextStep } from '../../lib/next-steps-api';
import { fetchAssistantHistory, askAssistant } from '../../lib/assistant-api';
import type { AssistantMessage } from '../../lib/assistant-api';
import { initialsFromName } from '../../lib/child-fields';

const presets = [
  { label: 'Is there a pattern worth noticing?', icon: 'flag' as const },
  { label: 'What teaching approach might work best?', icon: 'sparkle' as const },
  { label: 'Draft a note to the parent.', icon: 'message' as const },
];

export const TeacherAssistant: React.FC = () => {
  const token = useAppStore(s => s.token);
  const [children, setChildren] = useState<RealChild[] | null>(null);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<AssistantMessage[]>([]);
  const [nextSteps, setNextSteps] = useState<RealNextStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!token) { setError('You need to be signed in to use the assistant.'); setLoading(false); return; }
    let cancelled = false;
    fetchChildren(token)
      .then(c => {
        if (cancelled) return;
        setChildren(c);
        if (c[0]) setActiveChildId(c[0].id);
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token || !activeChildId) return;
    let cancelled = false;
    setChatLoading(true);
    Promise.all([fetchAssistantHistory(token, activeChildId), fetchChildNextSteps(token, activeChildId, 'pending')])
      .then(([history, steps]) => {
        if (cancelled) return;
        setMsgs(history.messages);
        setNextSteps(steps);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setChatLoading(false); });
    return () => { cancelled = true; };
  }, [token, activeChildId]);

  const activeChild = children?.find(c => c.id === activeChildId) ?? null;

  const ask = async (text: string) => {
    if (!text.trim() || !token || !activeChildId || asking) return;
    setAsking(true);
    setError(null);
    setQ('');
    try {
      const result = await askAssistant(token, activeChildId, text.trim());
      setMsgs(m => [...m, ...result.messages]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading your classroom…</div>;
  if (error && !children) return <div className="page-fade muted" style={{ padding: 40 }}>{error}</div>;
  if (!children || children.length === 0) return <div className="page-fade muted" style={{ padding: 40 }}>No children in your class yet — the assistant needs at least one to ground its answers in.</div>;
  if (!activeChild) return null;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>AI Assistant</h1>
          <div className="sub">Grounded in {activeChild.name.split(' ')[0]}'s real observations and progress — not a general chatbot.</div>
        </div>
        <div className="topbar-actions">
          <span className="chip"><Icon name="shield" size={11}/> Private to you</span>
        </div>
      </div>

      <div className="grid cols-messages" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>Focus on a child</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 340, overflow: 'auto' }}>
            {children.map(c => (
              <button key={c.id} onClick={() => setActiveChildId(c.id)}
                className={`row tone-${c.tone ?? 'sage'}`}
                style={{ padding: '8px 10px', borderRadius: 10, background: activeChildId === c.id ? 'var(--cream-2)' : 'transparent', gap: 10, textAlign: 'left' }}>
                <div className="avatar-lg" style={{ width: 26, height: 26, fontSize: 10 }}>{c.initials || initialsFromName(c.name)}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="row" style={{ gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
                <Icon name="sparkle" size={14}/>
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>Assistant</div>
                <div className="muted" style={{ fontSize: 12 }}>Focused on <strong>{activeChild.name}</strong></div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            {chatLoading && <div className="muted" style={{ fontSize: 13 }}>Loading conversation…</div>}
            {!chatLoading && msgs.length === 0 && (
              <div className="muted" style={{ fontSize: 13 }}>Ask anything about {activeChild.name.split(' ')[0]} — grounded in their real recent observations and progress.</div>
            )}
            {msgs.map(m => (
              <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: m.sender === 'user' ? 'var(--ink)' : 'var(--ochre-soft)', color: m.sender === 'user' ? 'var(--cream)' : 'var(--ink)', fontSize: 14, lineHeight: 1.55 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {asking && <div className="muted" style={{ fontSize: 13 }}>Thinking…</div>}
            {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
            <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
              {presets.map(p => (
                <button key={p.label} className="chip" onClick={() => ask(p.label)} disabled={asking} style={{ cursor: 'pointer' }}>
                  <Icon name={p.icon} size={11}/> {p.label}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8, padding: 10, background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--line)' }}>
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(q)} disabled={asking}
                placeholder={`Ask anything about ${activeChild.name.split(' ')[0]}…`}
                aria-label="Ask the AI assistant"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
              <button className="btn primary" onClick={() => ask(q)} disabled={asking || !q.trim()} aria-label="Send"><Icon name="send" size={12}/></button>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8, fontStyle: 'italic' }}>
              The Assistant is a coach, not an oracle. It names patterns; you name what matters.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Pending suggestions for {activeChild.name.split(' ')[0]}</div>
            {nextSteps.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>None right now.</div>}
            {nextSteps.map((s, i) => (
              <div key={s.id} style={{ padding: '10px 0', borderBottom: i < nextSteps.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{s.title}</div>
                {s.rationale && <div className="muted" style={{ fontSize: 12 }}>{s.rationale}</div>}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>What the assistant never does</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Diagnose, rank, or share with anyone except you.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssistant;
