import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

type Phase = 'idle' | 'recording' | 'transcribing' | 'reviewing' | 'saved';

interface TeacherObserveProps {
  preselectId?: string | null;
  onSaved?: () => void;
}

export const TeacherObserve: React.FC<TeacherObserveProps> = ({ preselectId, onSaved }) => {
  const { children } = ALC_DATA;
  const [childId, setChildId] = useState(preselectId || children[0].id);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const child = children.find(c => c.id === childId)!;

  const demoTranscript = "Mei completed the thousand chain independently this morning. She set up her mat, got the beads, and worked for almost twenty minutes. When I asked her to walk me through her steps she paused and said she didn't want to — which is the third time this week she's avoided verbal explanation. Still, the work itself is precise.";
  const suggestedTags = ['Mathematics', 'Mastery', 'Independence', 'Verbal expression'];

  useEffect(() => () => clearInterval(timerRef.current), []);

  const toggleRecord = () => {
    if (phase === 'idle') {
      setPhase('recording'); setRecording(true); setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (phase === 'recording') {
      setRecording(false);
      clearInterval(timerRef.current);
      setPhase('transcribing');
      setTimeout(() => {
        setTranscript(demoTranscript);
        setTags(suggestedTags.slice(0, 3));
        setMood('focused');
        setPhase('reviewing');
      }, 900);
    }
  };

  const reset = () => {
    setPhase('idle'); setElapsed(0); setTranscript(''); setTags([]); setMood(null); setRecording(false);
  };

  const save = () => {
    setPhase('saved');
    setTimeout(() => { reset(); onSaved?.(); }, 1800);
  };

  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Capture an observation</h1>
          <div className="sub">Voice-first. We'll transcribe, tag, and link it to the child — you just talk.</div>
        </div>
        <div className="topbar-actions">
          <span className="chip"><Icon name="shield" size={11}/> On-device transcription</span>
        </div>
      </div>

      <div className="grid cols-observe" style={{ gap: 16 }}>
        <div className="composer">
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="tiny" style={{ marginBottom: 6 }}>For</div>
              <select value={childId} onChange={e => setChildId(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--cream)', fontWeight: 700, fontSize: 14, minWidth: 0, width: '100%', maxWidth: 280 }}>
                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={`tone-${child.tone}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar-lg">{child.initials}</div>
              <div style={{ fontSize: 12.5 }}>
                <div style={{ color: 'var(--ink-3)' }}>Learning style</div>
                <div style={{ fontWeight: 700 }}>{child.style}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '40px 20px', background: 'var(--cream)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <button
              className={`mic-button${recording ? ' recording' : ''}`}
              onClick={toggleRecord}
              disabled={phase === 'transcribing' || phase === 'saved'}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
            >
              <Icon name={recording ? 'pause' : 'mic'} size={28}/>
            </button>
            <div className={`waveform${recording ? ' active' : ''}`} style={{ opacity: recording ? 1 : 0.3 }}>
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className={recording ? 'active' : ''} style={{ animationDelay: `${i * 60}ms` }}/>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              {phase === 'idle' && <div style={{ fontWeight: 700 }}>Tap to start · or hold space</div>}
              {phase === 'recording' && <div style={{ fontWeight: 700 }} className="mono">{fmtTime(elapsed)} · listening</div>}
              {phase === 'transcribing' && <div style={{ fontWeight: 700, color: 'var(--ink-3)' }}>Transcribing…</div>}
              {phase === 'reviewing' && <div style={{ fontWeight: 700, color: 'var(--sage-ink)' }}><Icon name="check" size={14}/> Transcribed · review below</div>}
              {phase === 'saved' && <div style={{ fontWeight: 700, color: 'var(--sage-ink)' }}><Icon name="check" size={14}/> Saved to {child.name.split(' ')[0]}'s profile</div>}
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                Or type it, attach a photo, or upload a short video.
              </div>
            </div>
          </div>

          {(phase === 'reviewing' || phase === 'saved') && (
            <div style={{ marginTop: 20 }}>
              <div className="tiny" style={{ marginBottom: 8 }}>Transcript</div>
              <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={5}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', resize: 'vertical', fontSize: 14, lineHeight: 1.5 }}/>

              <div className="row between" style={{ marginTop: 14 }}>
                <div>
                  <div className="tiny" style={{ marginBottom: 6 }}>AI-suggested tags <span style={{ color: 'var(--ink-4)' }}>(tap to remove)</span></div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {tags.map(t => (
                      <button key={t} className="chip" onClick={() => setTags(tags.filter(x => x !== t))}
                        style={{ background: 'var(--plum-soft)', color: 'var(--plum-ink)', border: 'none', cursor: 'pointer' }}>
                        <Icon name="sparkle" size={10}/> {t} ×
                      </button>
                    ))}
                    <button className="chip" style={{ background: 'transparent', borderStyle: 'dashed', cursor: 'pointer' }}><Icon name="plus" size={11}/> add</button>
                  </div>
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 6 }}>Mood</div>
                  <div className="row" style={{ gap: 4 }}>
                    {['engaged','focused','restless','withdrawn'].map(m => (
                      <button key={m} className="chip" onClick={() => setMood(m)}
                        style={{ background: mood === m ? 'var(--ink)' : 'var(--cream)', color: mood === m ? 'var(--cream)' : 'var(--ink-2)', borderColor: mood === m ? 'var(--ink)' : 'var(--line)', cursor: 'pointer' }}
                        aria-pressed={mood === m}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divider"/>
              <div className="row between">
                <button className="btn ghost" onClick={reset}>Discard</button>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn"><Icon name="camera" size={13}/> Attach photo</button>
                  <button className="btn primary" onClick={save} disabled={phase === 'saved'}><Icon name="check" size={13}/> Save observation</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Preview panel */}
        <div className="ai-panel" style={{ alignSelf: 'start' }}>
          <span className="ai-badge"><Icon name="sparkle" size={11}/> LIVE AI PREVIEW</span>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '12px 0 6px' }}>What I'm hearing</div>
          {phase === 'idle' && (
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Start recording to see live pattern matches against {child.name}'s profile. I'll link moments to strengths, gaps, and prior observations.
            </div>
          )}
          {(phase === 'recording' || phase === 'transcribing') && (
            <div style={{ fontSize: 13 }}>
              <div className="row" style={{ gap: 6, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }}/> Listening…</div>
              <div style={{ color: 'var(--ink-3)' }}>Sensitive audio stays on this device. Only the transcript is stored.</div>
            </div>
          )}
          {(phase === 'reviewing' || phase === 'saved') && (
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="tiny">Matches a pattern</div>
                <div style={{ fontWeight: 700 }}>Verbal explanation avoidance — 3rd instance this week</div>
              </div>
              <div>
                <div className="tiny">Curriculum link</div>
                <div>Maths · Decimal System · Thousand chain → mastered</div>
              </div>
              <div>
                <div className="tiny">Next-step seed</div>
                <div style={{ color: 'var(--ink-2)' }}>Consider a low-pressure verbal extension — storytelling with materials, not "explain your method".</div>
              </div>
              <div style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 12 }}>
                These are provisional. The engine keeps learning from your edits.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherObserve;
