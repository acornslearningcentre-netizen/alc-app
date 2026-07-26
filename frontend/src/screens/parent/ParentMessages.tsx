import React, { useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

export const ParentMessages: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[0];
  const [draft, setDraft] = useState('');

  const messages = [
    { from: 'teacher' as const, text: `Hi ${child.guardian.split(' ')[0]} — just a quick note that ${child.name.split(' ')[0]} had a wonderful morning. ${child.strengths[0]} really shone through today.`, time: '11:05' },
    { from: 'parent' as const, text: `Thank you! ${child.pronoun === 'she' ? 'She' : 'He'} came home so happy. We noticed ${child.strengths[0].toLowerCase()} too — it's been a theme lately.`, time: '14:22' },
    { from: 'teacher' as const, text: `That's wonderful to hear. One thing I'd like to gently track over the next two weeks is ${child.gaps[0].toLowerCase()}. Nothing to worry about — just worth being curious about. I'll keep you posted.`, time: '14:48' },
  ];

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Messages</h1>
          <div className="sub">Your conversation with {child.teacher} about {child.name.split(' ')[0]}</div>
        </div>
      </div>

      <div className="grid cols-sidebar-sm" style={{ gap: 16 }}>
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 520 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="row" style={{ gap: 12 }}>
              <div className="avatar-lg" style={{ width: 34, height: 34, fontSize: 11 }}>MP</div>
              <div>
                <div style={{ fontWeight: 800 }}>{child.teacher}</div>
                <div className="muted" style={{ fontSize: 12 }}>Class teacher · Acorns Primary</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'parent' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <div style={{ padding: '11px 15px', borderRadius: 16, background: m.from === 'parent' ? 'var(--ink)' : 'var(--cream-2)', color: m.from === 'parent' ? 'var(--cream)' : 'var(--ink)', fontSize: 13.5, lineHeight: 1.55 }}>
                  {m.text}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4, textAlign: m.from === 'parent' ? 'right' : 'left' }}>{m.time}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
              placeholder={`Message ${child.teacher}…`}
              aria-label="Message composer"
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', resize: 'none', fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}/>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn"><Icon name="camera" size={13}/> Attach</button>
              <button className="btn primary" disabled={!draft.trim()}><Icon name="send" size={13}/> Send</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className={`card tone-${child.tone}`} style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 8 }}>About this conversation</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Messages are read by {child.teacher} only. They typically respond within one school day.
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Recent observations shared with you</div>
            {ALC_DATA.observations.filter(o => o.childId === child.id).slice(0, 2).map((o, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 3 }}>{o.time}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{o.text.slice(0, 90)}…</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>Privacy</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Conversations about your child are never shared with other parents or published.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentMessages;
