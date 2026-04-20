import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import type { Tone } from '../../data/types';

interface Thread {
  id: string;
  name: string;
  initials: string;
  role: 'parent' | 'colleague';
  tone: string;
  preview: string;
  time: string;
  unread: number;
  messages: { from: 'me' | 'them'; text: string; time: string }[];
}

const THREADS: Thread[] = [
  {
    id: 't1', name: 'Nia Osei', initials: 'NO', role: 'parent', tone: 'sage',
    preview: 'Thank you for the update on Amara — she came home…', time: '14:22', unread: 0,
    messages: [
      { from: 'me', text: "Hi Nia — just a quick note that Amara had a wonderful morning. She showed Theo the Pink Tower and stayed focused for 18 minutes.", time: '11:05' },
      { from: 'them', text: "Thank you for the update on Amara — she came home and immediately tried to build a tower with her books! It clearly meant something to her.", time: '14:22' },
    ]
  },
  {
    id: 't2', name: 'Tom Vance', initials: 'TV', role: 'parent', tone: 'ochre',
    preview: "He does seem tired on Mondays. We'll try an earlier\u2026", time: '13:45', unread: 1,
    messages: [
      { from: 'them', text: "Leo asked to read the same book three times at bedtime. Got frustrated when I tried to shorten it.", time: 'Yesterday \xb7 19:30' },
      { from: 'me', text: "Hi Tom \u2014 that's really helpful context. Leo's attention is shorter right after snack too. Worth tracking whether it's a tiredness pattern across the week. I'll note Monday mornings especially.", time: '09:30' },
      { from: 'them', text: "He does seem tired on Mondays. We'll try an earlier bedtime Sunday and let you know.", time: '13:45' },
    ]
  },
  {
    id: 't3', name: 'Kate Mitchell', initials: 'KM', role: 'parent', tone: 'plum',
    preview: 'We had a difficult weekend — lots of separation…', time: '09:12', unread: 2,
    messages: [
      { from: 'them', text: "We had a difficult weekend — lots of separation anxiety on Sunday evening. Is Isla okay at school?", time: '09:12' },
    ]
  },
  {
    id: 't4', name: 'SENCO · Ms. Doran', initials: 'SD', role: 'colleague', tone: 'sky',
    preview: "I've reviewed the Isla notes. Can we meet briefly\u2026", time: 'Yesterday', unread: 1,
    messages: [
      { from: 'me', text: "Hi \u2014 flagging Isla for your awareness. Three Monday withdrawals in a row. I've drafted an initial note. Happy to co-write the parent communication.", time: 'Yesterday \xb7 10:00' },
      { from: 'them', text: "I've reviewed the Isla notes. Can we meet briefly Thursday after school? I'd like to hear more before we reach out to Kate.", time: 'Yesterday \xb7 14:55' },
    ]
  },
];

/** Find the child linked to a parent contact (matches any of the child's parents by name). */
function findChildByParent(parentName: string) {
  return ALC_DATA.children.find(c => c.parents.some(p => p.name === parentName));
}

/** Find the relation (Mum/Dad/Grandma/…) of a parent for their linked child. */
function findRelation(parentName: string): string {
  const child = findChildByParent(parentName);
  return child?.parents.find(p => p.name === parentName)?.relation ?? 'Parent';
}

/** Build a synthetic empty thread for a parent who doesn't yet have a real one. */
function makeSyntheticThread(parentName: string): Thread {
  const child = findChildByParent(parentName);
  const first = child?.name.split(' ')[0] ?? 'this child';
  const initials = parentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return {
    id: `new:${parentName}`,
    name: parentName,
    initials,
    role: 'parent',
    tone: (child?.tone ?? 'sage') as Tone,
    preview: `Start a conversation about ${first}`,
    time: 'New',
    unread: 0,
    messages: [],
  };
}

interface TeacherMessagesProps {
  initialGuardianName?: string | null;
}

export const TeacherMessages: React.FC<TeacherMessagesProps> = ({ initialGuardianName }) => {
  // Build every thread under this teacher — one per parent across all 12 children, plus colleagues.
  const threads = useMemo<Thread[]>(() => {
    const seedNames = new Set(THREADS.filter(t => t.role === 'parent').map(t => t.name));
    const synthetic: Thread[] = [];
    for (const child of ALC_DATA.children) {
      for (const parent of child.parents) {
        if (!seedNames.has(parent.name)) synthetic.push(makeSyntheticThread(parent.name));
      }
    }
    // Colleagues first, then parents with recorded history, then the rest of the families.
    const colleagues = THREADS.filter(t => t.role === 'colleague');
    const activeParents = THREADS.filter(t => t.role === 'parent');
    return [...colleagues, ...activeParents, ...synthetic];
  }, []);

  const resolveInitialId = () => {
    if (initialGuardianName) {
      const match = threads.find(t => t.name === initialGuardianName);
      if (match) return match.id;
    }
    // Default landing: first parent thread with activity (skip colleague) so demo lands on a conversation.
    const firstActive = threads.find(t => t.role === 'parent' && t.messages.length > 0);
    return firstActive?.id ?? threads[0]?.id;
  };

  const [activeId, setActiveId] = useState<string>(resolveInitialId);
  const [draft, setDraft] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [showAI, setShowAI] = useState(false);

  // When the user clicks "Message parent" for a different child, re-select that thread.
  useEffect(() => {
    if (!initialGuardianName) return;
    const match = threads.find(t => t.name === initialGuardianName);
    if (match) setActiveId(match.id);
  }, [initialGuardianName, threads]);

  const thread = threads.find(t => t.id === activeId) ?? threads[0];

  const generateDraft = () => {
    const drafts: Record<string, string> = {
      t1: "Hi Nia — I wanted to share that Amara is showing strong spatial reasoning and a natural instinct for helping peers. We'll be introducing the Geometric Cabinet next week. I'll keep you posted.",
      t2: "Hi Tom — thank you for the bedtime note. I've been tracking Leo's attention window and will share a short summary by Friday. A consistent Sunday bedtime could really help — great instinct.",
      t3: "Hi Kate — thank you for letting me know. Isla has been a little quieter on Monday mornings, and I've been giving her extra space to settle. Nothing that worries me yet, but I'm watching carefully. Would a quick call this week help?",
      t4: "Hi — confirming Thursday works. I'll bring my observation notes and the draft SENCO referral form. Isla's pattern is consistent enough that I think it's worth a gentle conversation with Kate soon.",
    };
    setAiDraft(drafts[activeId] || "I'd be happy to draft a response for this thread.");
    setShowAI(true);
  };

  const useAIDraft = () => {
    setDraft(aiDraft);
    setShowAI(false);
  };

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Messages</h1>
          <div className="sub">Parent and colleague conversations · AI-assisted drafting</div>
        </div>
        <div className="topbar-actions">
          <button className="btn primary"><Icon name="plus" size={13}/> New message</button>
        </div>
      </div>

      <div className="grid cols-messages" style={{ alignItems: 'flex-start' }}>
        {/* Thread list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: 720, overflowY: 'auto' }}>
          {threads.map(t => {
            const linkedChild = t.role === 'parent' ? findChildByParent(t.name) : null;
            const relation = linkedChild ? findRelation(t.name) : null;
            const childFirst = linkedChild?.name.split(' ')[0];
            return (
              <button key={t.id} onClick={() => setActiveId(t.id)}
                style={{ width: '100%', padding: '14px 16px', background: activeId === t.id ? 'var(--cream-2)' : 'transparent',
                  borderBottom: '1px solid var(--line)', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: 'pointer', border: 'none', borderBottomColor: 'var(--line)', borderBottomWidth: 1, borderBottomStyle: 'solid' }}
                aria-selected={activeId === t.id}>
                <div className={`avatar-lg tone-${t.tone}`} style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>{t.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row between" style={{ marginBottom: 3 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div className="muted" style={{ fontSize: 11.5, flexShrink: 0 }}>{t.time}</div>
                  </div>
                  <div className="row between">
                    <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {t.preview}
                    </div>
                    {t.unread > 0 && (
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', color: 'var(--cream)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <div className="tiny" style={{ marginTop: 4 }}>
                    {t.role === 'parent'
                      ? (relation && childFirst ? `${relation} · ${childFirst}` : 'Parent')
                      : 'Colleague'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Conversation */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 540 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="row" style={{ gap: 12 }}>
              <div className={`avatar-lg tone-${thread.tone}`} style={{ width: 34, height: 34, fontSize: 12 }}>{thread.initials}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{thread.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {thread.role === 'parent'
                    ? `${findRelation(thread.name)} · ${findChildByParent(thread.name)?.name ?? 'Acorns'}`
                    : 'Colleague'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', minHeight: 260 }}>
            {thread.messages.length === 0 && (
              <div className="muted" style={{ margin: 'auto', textAlign: 'center', fontSize: 13, maxWidth: 320, lineHeight: 1.55 }}>
                <Icon name="message" size={22} stroke="var(--ink-4)"/>
                <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--ink-2)' }}>No messages yet with {thread.name.split(' ')[0]}.</div>
                <div style={{ marginTop: 4 }}>Write a warm first note below, or use AI draft to start.</div>
              </div>
            )}
            {thread.messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <div style={{ padding: '11px 15px', borderRadius: 16, background: m.from === 'me' ? 'var(--ink)' : 'var(--cream-2)', color: m.from === 'me' ? 'var(--cream)' : 'var(--ink)', fontSize: 13.5, lineHeight: 1.55 }}>
                  {m.text}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
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
              placeholder={`Reply to ${thread.name.split(' ')[0]}…`}
              aria-label="Message composer"
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', resize: 'none', fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}/>
            <div className="row between">
              <button className="btn ghost" onClick={generateDraft}><Icon name="sparkle" size={13}/> AI draft</button>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn"><Icon name="camera" size={13}/> Attach</button>
                <button className="btn primary" disabled={!draft.trim()}><Icon name="send" size={13}/> Send</button>
              </div>
            </div>
          </div>
        </div>

        {/* Context panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(() => {
            const child = findChildByParent(thread.name);
            return child ? (
              <div className={`card tone-${child.tone}`} style={{ padding: 16 }}>
                <div className="tiny" style={{ marginBottom: 10 }}>Linked child</div>
                <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                  <div className="avatar-lg" style={{ width: 32, height: 32, fontSize: 11 }}>{child.initials}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{child.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{child.mastery}% mastery · {child.attendance}% attendance</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                  <strong>Strengths:</strong> {child.strengths.join(', ')}<br/>
                  <strong>Growing:</strong> {child.gaps.join(', ')}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 16 }}>
                <div className="tiny" style={{ marginBottom: 6 }}>Colleague</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Internal school communication.</div>
              </div>
            );
          })()}

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Recent shared observations</div>
            {ALC_DATA.observations.filter(o => {
              const child = findChildByParent(thread.name);
              return child ? o.childId === child.id : false;
            }).slice(0, 3).map((o, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px dashed var(--line)' : 'none' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{o.time}</div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{o.text.slice(0, 80)}…</div>
              </div>
            ))}
            {ALC_DATA.observations.filter(o => {
              const child = findChildByParent(thread.name);
              return child ? o.childId === child.id : false;
            }).length === 0 && (
              <div className="muted" style={{ fontSize: 12 }}>No recent observations for this thread.</div>
            )}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>Communication guidelines</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Keep messages warm, factual, and forward-looking. SENCO referrals are always shared with families before submission.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherMessages;
