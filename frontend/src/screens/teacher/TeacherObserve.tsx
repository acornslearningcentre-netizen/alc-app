import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../../components/ui';
import { useAppStore } from '../../store/app-store';
import { fetchChildren } from '../../lib/children-api';
import type { RealChild } from '../../lib/children-api';
import { fetchChildObservations } from '../../lib/observations-api';
import type { RealObservation } from '../../lib/observations-api';
import { createObservation } from '../../lib/observations-api';
import { uploadMedia } from '../../lib/media-api';

type Phase = 'idle' | 'recording' | 'reviewing' | 'saving' | 'saved';
type CaptureKind = 'voice' | 'image' | 'video' | 'text';

interface TeacherObserveProps {
  preselectId?: string | null;
  onSaved?: () => void;
}

export const TeacherObserve: React.FC<TeacherObserveProps> = ({ preselectId, onSaved }) => {
  const token = useAppStore(s => s.token);
  const [children, setChildren] = useState<RealChild[] | null>(null);
  const [recentObs, setRecentObs] = useState<RealObservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string>('');

  const [phase, setPhase] = useState<Phase>('idle');
  const [captureKind, setCaptureKind] = useState<CaptureKind>('text');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { setError('You need to be signed in to capture an observation.'); setLoading(false); return; }
    let cancelled = false;
    fetchChildren(token)
      .then(c => {
        if (cancelled) return;
        setChildren(c);
        const initial = preselectId && c.some(x => String(x.id) === preselectId) ? preselectId : (c[0] ? String(c[0].id) : '');
        setChildId(initial);
        setError(null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, preselectId]);

  useEffect(() => {
    if (!token || !childId) { setRecentObs([]); return; }
    let cancelled = false;
    fetchChildObservations(token, childId).then(obs => { if (!cancelled) setRecentObs(obs); }).catch(() => { if (!cancelled) setRecentObs([]); });
    return () => { cancelled = true; };
  }, [token, childId]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
  }, [mediaPreviewUrl]);

  const child = children?.find(c => String(c.id) === childId) ?? null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setMediaBlob(blob);
        setMediaPreviewUrl(URL.createObjectURL(blob));
        setCaptureKind('voice');
        setPhase('reviewing');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setPhase('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch {
      setSaveError('Could not access the microphone — check your browser permissions.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const attachFile = (file: File) => {
    setMediaBlob(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setCaptureKind(file.type.startsWith('video/') ? 'video' : 'image');
    setPhase('reviewing');
  };

  const startTyping = () => {
    setCaptureKind('text');
    setPhase('reviewing');
  };

  const reset = () => {
    setPhase('idle'); setElapsed(0); setNote(''); setTags([]); setMood(null); setSaveError(null);
    setMediaBlob(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    setCaptureKind('text');
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const save = async () => {
    if (!token || !child) return;
    if (!mediaBlob && !note.trim()) { setSaveError('Add a note or attach a recording/photo before saving.'); return; }
    setPhase('saving');
    setSaveError(null);
    try {
      let mediaUrl: string | undefined;
      if (mediaBlob) {
        const ext = captureKind === 'voice' ? 'webm' : captureKind === 'video' ? 'mp4' : 'jpg';
        const uploaded = await uploadMedia(mediaBlob, `observation.${ext}`);
        mediaUrl = uploaded.url;
      }
      await createObservation(token, {
        child_id: child.id,
        kind: captureKind,
        media_url: mediaUrl,
        comment: note.trim() || undefined,
        tags,
        mood: mood ?? undefined,
      });
      setPhase('saved');
      setTimeout(() => { reset(); onSaved?.(); }, 1400);
    } catch (err) {
      setSaveError((err as Error).message);
      setPhase('reviewing');
    }
  };

  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <div className="page-fade muted" style={{ padding: 40 }}>Loading your classroom…</div>;
  if (error || !children || !child) return <div className="page-fade muted" style={{ padding: 40 }}>{error ?? 'No children to observe yet.'}</div>;

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Capture an observation</h1>
          <div className="sub">Record a voice note, attach a photo, or just type — linked to the child's real profile.</div>
        </div>
      </div>

      <div className="grid cols-observe" style={{ gap: 16 }}>
        <div className="composer">
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="tiny" style={{ marginBottom: 6 }}>For</div>
              <select value={childId} onChange={e => { setChildId(e.target.value); reset(); }}
                style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--cream)', fontWeight: 700, fontSize: 14, minWidth: 0, width: '100%', maxWidth: 280 }}>
                {children.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div className={`tone-${child.tone ?? 'sage'}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar-lg">{child.initials}</div>
              <div style={{ fontSize: 12.5 }}>
                <div style={{ color: 'var(--ink-3)' }}>Learning style</div>
                <div style={{ fontWeight: 700 }}>{child.style || 'Not recorded yet'}</div>
              </div>
            </div>
          </div>

          {phase === 'idle' && (
            <div style={{ padding: '40px 20px', background: 'var(--cream)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <button className="mic-button" onClick={startRecording} aria-label="Start recording">
                <Icon name="mic" size={28}/>
              </button>
              <div style={{ fontWeight: 700 }}>Tap to record a voice note</div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" onClick={() => fileInputRef.current?.click()}><Icon name="camera" size={13}/> Attach photo/video</button>
                <button className="btn" onClick={startTyping}><Icon name="message" size={13}/> Type a note instead</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ''; }}/>
            </div>
          )}

          {phase === 'recording' && (
            <div style={{ padding: '40px 20px', background: 'var(--cream)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <button className="mic-button recording" onClick={stopRecording} aria-label="Stop recording">
                <Icon name="pause" size={28}/>
              </button>
              <div style={{ fontWeight: 700 }} className="mono">{fmtTime(elapsed)} · recording</div>
            </div>
          )}

          {(phase === 'reviewing' || phase === 'saving' || phase === 'saved') && (
            <div>
              {mediaPreviewUrl && captureKind === 'voice' && <audio controls src={mediaPreviewUrl} style={{ width: '100%', marginBottom: 14 }}/>}
              {mediaPreviewUrl && captureKind === 'image' && <img src={mediaPreviewUrl} alt="Attached" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 14 }}/>}
              {mediaPreviewUrl && captureKind === 'video' && <video controls src={mediaPreviewUrl} style={{ width: '100%', borderRadius: 12, marginBottom: 14 }}/>}

              <div className="tiny" style={{ marginBottom: 8 }}>Note</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={5}
                placeholder="What did you observe?"
                disabled={phase !== 'reviewing'}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', resize: 'vertical', fontSize: 14, lineHeight: 1.5 }}/>

              <div className="row between" style={{ marginTop: 14, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div className="tiny" style={{ marginBottom: 6 }}>Tags</div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {tags.map(t => (
                      <button key={t} className="chip" onClick={() => setTags(tags.filter(x => x !== t))} disabled={phase !== 'reviewing'}
                        style={{ background: 'var(--plum-soft)', color: 'var(--plum-ink)', border: 'none', cursor: 'pointer' }}>
                        {t} ×
                      </button>
                    ))}
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                      disabled={phase !== 'reviewing'} placeholder="add a tag…"
                      style={{ padding: '4px 8px', borderRadius: 8, border: '1px dashed var(--line)', background: 'transparent', fontSize: 12.5, width: 100 }}/>
                  </div>
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 6 }}>Mood</div>
                  <div className="row" style={{ gap: 4 }}>
                    {['engaged','focused','restless','withdrawn'].map(m => (
                      <button key={m} className="chip" onClick={() => setMood(mood === m ? null : m)} disabled={phase !== 'reviewing'}
                        style={{ background: mood === m ? 'var(--ink)' : 'var(--cream)', color: mood === m ? 'var(--cream)' : 'var(--ink-2)', borderColor: mood === m ? 'var(--ink)' : 'var(--line)', cursor: 'pointer' }}
                        aria-pressed={mood === m}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {saveError && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{saveError}</div>}

              <div className="divider"/>
              <div className="row between">
                <button className="btn ghost" onClick={reset} disabled={phase !== 'reviewing'}>Discard</button>
                <button className="btn primary" onClick={save} disabled={phase !== 'reviewing'}>
                  <Icon name="check" size={13}/> {phase === 'saving' ? 'Saving…' : phase === 'saved' ? `Saved to ${child.name.split(' ')[0]}'s profile` : 'Save observation'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ai-panel" style={{ alignSelf: 'start' }}>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 6px' }}>Recent observations for {child.name.split(' ')[0]}</div>
          {recentObs.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>No observations yet — this will be the first.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {recentObs.slice(0, 4).map(o => (
              <div key={o.id} style={{ fontSize: 12.5, borderBottom: '1px dashed var(--line)', paddingBottom: 8 }}>
                <div className="mono" style={{ color: 'var(--ink-4)', marginBottom: 2 }}>{new Date(o.captured_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {o.kind}</div>
                <div style={{ color: 'var(--ink-2)' }}>{o.comment || o.transcript || '(no text recorded)'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherObserve;
