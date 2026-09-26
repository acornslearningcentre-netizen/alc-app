import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchThreads, fetchThreadMessages, sendThreadMessage } from '../../lib/threads-api';
import type { RealThread, RealMessage } from '../../lib/threads-api';
import { fetchChildren } from '../../lib/children-api';
import type { RealChild } from '../../lib/children-api';
import { fetchChildObservations } from '../../lib/observations-api';
import type { RealObservation } from '../../lib/observations-api';
import { askAssistant } from '../../lib/assistant-api';
import { initialsFromName } from '../../lib/child-fields';

interface TeacherMessagesProps {
  initialGuardianName?: string | null;
}

export const TeacherMessages: React.FC<TeacherMessagesProps> = ({ initialGuardianName }) => {
  const token = useAppStore(s => s.token);
  const [threads, setThreads] = useState<RealThread[] | null>(null);
  const [children, setChildren] = useState<RealChild[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [observations, setObservations] = useState<RealObservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [draftingAI, setDraftingAI] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(initialGuardianName ? 'detail' : 'list');

  useEffect(() => {
    if (!token) { setError('You need to be signed in to see your messages.'); setLoading(false); return; }
    let cancelled = false;
    Promise.all([fetchThreads(token), fetchChildren(token)])
      .then(([t, c]) => {
        if (cancelled) return;
        setThreads(t); setChildren(c);
        const preferred = initialGuardianName ? t.find(x => x.parent_name === initialGuardianName) : null;
        setActiveId((preferred ?? t[0])?.id ?? null);
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, initialGuardianName]);

  const thread = useMemo(() => threads?.find(t => t.id === activeId) ?? null, [threads, activeId]);
  const linkedChild = useMemo(() => (thread ? children.find(c => c.id === thread.child_id) ?? null : null), [thread, children]);

  useEffect(() => {
    if (!token || !thread) { setMessages([]); setObservations([]); return; }
    let cancelled = false;
    setMsgLoading(true);
    Promise.all([fetchThreadMessages(token, thread.id), fetchChildObservations(token, thread.child_id)])
      .then(([msgs, obs]) => { if (!cancelled) { setMessages(msgs); setObservations(obs); } })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setMsgLoading(false); });
    return () => { cancelled = true; };
  }, [token, thread]);

  const selectThread = (id: number) => {
    setActiveId(id);
    setMobileView('detail');
    setShowAI(false);
  };

  const generateDraft = async () => {
    if (!token || !thread) return;
    setDraftingAI(true);
    try {
      const result = await askAssistant(token, thread.child_id, 'Draft a short, warm note to the parent about how things are going today.');
      const answer = result.messages.find(m => m.sender === 'assistant');
      if (answer) { setAiDraft(answer.text); setShowAI(true); }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDraftingAI(false);
    }
  };

  const useAIDraft = () => {
    setDraft(aiDraft);
    setShowAI(false);
  };

  const send = async () => {
    if (!token || !thread || !draft.trim()) return;
    setSending(true);
    try {
      const msg = await sendThreadMessage(token, thread.id, draft.trim());
      setMessages(m => [...m, msg]);
      setDraft('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading your messages…</div>;
  if (error && !threads) return <div className="page-fade muted" style={{ padding: 40 }}>{error}</div>;
  if (!threads || threads.length === 0) return <div className="page-fade muted" style={{ padding: 40 }}>No conversations yet — they'll appear here once you have children in your class.</div>;
  if (!thread) return null;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Messages</h1>
          <div className="sub">Parent conversations · AI-assisted drafting</div>
        </div>
      </div>

      <div className="grid cols-messages messages-grid" data-mobile-view={mobileView} style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: 720, overflowY: 'auto' }}>
          {threads.map(t => (
            <button key={t.id} onClick={() => selectThread(t.id)}
              style={{ width: '100%', padding: '14px 16px', background: activeId === t.id ? 'var(--cream-2)' : 'transparent',
                borderBottom: '1px solid var(--line)', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start',
                cursor: 'pointer', border: 'none', borderBottomColor: 'var(--line)', borderBottomWidth: 1, borderBottomStyle: 'solid' }}
              aria-selected={activeId === t.id}>
              <div className="avatar-lg" style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>{initialsFromName(t.parent_name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ marginBottom: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.parent_name}</div>
                  {t.unread_count > 0 && (
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', color: 'var(--cream)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {t.unread_count}
                    </span>
                  )}
                </div>
                <div className="tiny">{t.child_name}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="card messages-detail" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 540 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="row" style={{ gap: 12 }}>
              <button
                type="button"
                className="messages-back"
                onClick={() => setMobileView('list')}
                aria-label="Back to all messages"
                style={{ padding: 6, borderRadius: 8, display: 'none' }}
              >
                <Icon name="arrow-right" size={16} stroke="var(--ink-2)" style={{ transform: 'rotate(180deg)' }}/>
              </button>
              <div className="avatar-lg" style={{ width: 34, height: 34, fontSize: 12 }}>{initialsFromName(thread.parent_name)}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{thread.parent_name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{thread.child_name}</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', minHeight: 260 }}>
            {msgLoading && <div className="muted" style={{ margin: 'auto', fontSize: 13 }}>Loading conversation…</div>}
            {!msgLoading && messages.length === 0 && (
              <div className="muted" style={{ margin: 'auto', textAlign: 'center', fontSize: 13, maxWidth: 320, lineHeight: 1.55 }}>
                <Icon name="message" size={22} stroke="var(--ink-4)"/>
                <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--ink-2)' }}>No messages yet with {thread.parent_name.split(' ')[0]}.</div>
                <div style={{ marginTop: 4 }}>Write a warm first note below, or use AI draft to start.</div>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.sender_role === 'teacher' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <div style={{ padding: '11px 15px', borderRadius: 16, background: m.sender_role === 'teacher' ? 'var(--ink)' : 'var(--cream-2)', color: m.sender_role === 'teacher' ? 'var(--cream)' : 'var(--ink)', fontSize: 13.5, lineHeight: 1.55 }}>
                  {m.body}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4, textAlign: m.sender_role === 'teacher' ? 'right' : 'left' }}>
                  {new Date(m.sent_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {showAI && (
            <div style={{ margin: '0 16px', padding: 14, background: 'var(--ochre-soft)', borderRadius: 12, border: '1px solid var(--ochre)' }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <span className="tiny"><Icon name="sparkle" size={11}/> AI Draft</span>
                <button className="btn ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setShowAI(false)}>Dismiss</button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginBottom: 10 }}>{aiDraft}</div>
              <button className="btn primary" style={{ fontSize: 12 }} onClick={useAIDraft}>Use this draft</button>
            </div>
          )}

          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
              placeholder={`Reply to ${thread.parent_name.split(' ')[0]}…`}
              aria-label="Message composer" disabled={sending}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', resize: 'none', fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}/>
            <div className="row between">
              <button className="btn ghost" onClick={generateDraft} disabled={draftingAI}><Icon name="sparkle" size={13}/> {draftingAI ? 'Drafting…' : 'AI draft'}</button>
              <button className="btn primary" onClick={send} disabled={!draft.trim() || sending}><Icon name="send" size={13}/> Send</button>
            </div>
            {error && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          </div>
        </div>

        <div className="messages-context" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {linkedChild ? (
            <div className={`card tone-${linkedChild.tone ?? 'sage'}`} style={{ padding: 16 }}>
              <div className="tiny" style={{ marginBottom: 10 }}>Linked child</div>
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{linkedChild.initials || initialsFromName(linkedChild.name)}</div>
                <div style={{ fontWeight: 700 }}>{linkedChild.name}</div>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                <strong>Strengths:</strong> {linkedChild.strengths.length ? linkedChild.strengths.join(', ') : 'None recorded yet'}<br/>
                <strong>Growing:</strong> {linkedChild.gaps.length ? linkedChild.gaps.join(', ') : 'None recorded yet'}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 16 }}>
              <div className="tiny" style={{ marginBottom: 6 }}>Linked child</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Not found in your roster.</div>
            </div>
          )}

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Recent observations</div>
            {observations.slice(0, 3).map((o, i) => (
              <div key={o.id} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{new Date(o.captured_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{(o.comment || o.transcript || '(no text recorded)').slice(0, 80)}</div>
              </div>
            ))}
            {observations.length === 0 && (
              <div className="muted" style={{ fontSize: 12 }}>No recent observations for this child.</div>
            )}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>Communication guidelines</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Keep messages warm, factual, and forward-looking.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherMessages;
