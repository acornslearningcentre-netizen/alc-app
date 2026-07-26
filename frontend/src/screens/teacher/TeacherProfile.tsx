import React, { useState } from 'react';
import { Icon, Sparkline, Trend } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';

type ProfileTab = 'overview' | 'observations' | 'progress' | 'plan' | 'communication';

interface TeacherProfileProps {
  childId: string;
  onBack: () => void;
  onMessageParent?: (guardianName: string) => void;
}

export const TeacherProfile: React.FC<TeacherProfileProps> = ({ childId, onBack, onMessageParent }) => {
  const { children, observations, nextSteps } = ALC_DATA;
  const child = children.find(c => c.id === childId)!;
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [askOpen, setAskOpen] = useState(false);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const childObs = observations.filter(o => o.childId === childId);
  const steps = nextSteps[childId] || nextSteps.c1;
  const first = child.name.split(' ')[0];

  const handleMessageParent = () => {
    if (!onMessageParent) return;
    if (child.parents.length === 1) {
      onMessageParent(child.parents[0].name);
    } else {
      setParentPickerOpen(true);
    }
  };
  const pickParent = (name: string) => {
    setParentPickerOpen(false);
    onMessageParent?.(name);
  };

  return (
    <div className={`page-fade tone-${child.tone}`}>
      <div className="topbar">
        <div className="row" style={{ gap: 12 }}>
          <button className="btn ghost" onClick={onBack}>← Children</button>
          <div className="avatar-xl">{child.initials}</div>
          <div>
            <h1 style={{ marginBottom: 2 }}>{child.name}</h1>
            <div className="sub">Age {child.age} · Guardian: {child.guardian} · Teacher: {child.teacher}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={handleMessageParent} aria-label={`Message ${first}'s family`}>
            <Icon name="message" size={13}/> Message {child.parents.length > 1 ? 'family' : 'parent'}
          </button>
          <button className="btn"><Icon name="mic" size={13}/> New observation</button>
          <button className="btn primary" onClick={() => setAskOpen(true)}><Icon name="sparkle" size={13}/> Ask about {first}</button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="tiny">Mastery (Montessori strands)</div>
          <div className="row between" style={{ marginTop: 6 }}>
            <div className="stat-number">{child.mastery}%</div>
            <Trend dir={child.trend}/>
          </div>
          <Sparkline values={[52,55,58,61,65,68,child.mastery]} color="var(--tone)" fill/>
        </div>
        <div className="card">
          <div className="tiny">Observations · last 30d</div>
          <div className="stat-number" style={{ marginTop: 6 }}>{8 + child.streak}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{child.streak} this week · {Math.max(child.streak - 1, 0)} from parent</div>
        </div>
        <div className="card">
          <div className="tiny">Attendance</div>
          <div className="stat-number" style={{ marginTop: 6 }}>{child.attendance}%</div>
          <div className="muted" style={{ fontSize: 12.5 }}>This term</div>
        </div>
        <div className="card">
          <div className="tiny">Learning fingerprint</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>{child.style}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>Refined over 34 observations</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 18 }} role="tablist">
        {(['overview','observations','progress','plan','communication'] as ProfileTab[]).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab child={child} childObs={childObs} steps={steps}/>}
      {tab === 'observations' && <ObservationsTab childObs={childObs}/>}
      {tab === 'progress' && <ProgressTab child={child}/>}
      {tab === 'plan' && <PlanTab steps={steps} child={child}/>}
      {tab === 'communication' && <CommTab child={child}/>}

      {askOpen && <AskModal child={child} onClose={() => setAskOpen(false)}/>}
      {parentPickerOpen && (
        <ParentPickerModal
          child={child}
          onPick={pickParent}
          onClose={() => setParentPickerOpen(false)}
        />
      )}
    </div>
  );
};

const ParentPickerModal: React.FC<{
  child: typeof ALC_DATA.children[0];
  onPick: (name: string) => void;
  onClose: () => void;
}> = ({ child, onPick, onClose }) => {
  const first = child.name.split(' ')[0];
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-label={`Choose who to message for ${first}`}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,36,32,0.45)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 60 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`tone-${child.tone}`}
        style={{ background: 'var(--paper)', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="tiny" style={{ marginBottom: 6 }}>Message {first}'s family</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 6px' }}>
          Who would you like to message?
        </h2>
        <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          {first} has {child.parents.length} contacts on file. Your message will open a private thread with the person you choose.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {child.parents.map(p => {
            const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button
                key={p.name}
                onClick={() => onPick(p.name)}
                className="btn"
                style={{ padding: 14, justifyContent: 'flex-start', gap: 12, borderRadius: 14, textAlign: 'left', width: '100%' }}
                aria-label={`Message ${p.name}, ${p.relation}`}
              >
                <div className="avatar-lg" style={{ width: 38, height: 38, fontSize: 13 }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{p.relation}</div>
                </div>
                <Icon name="arrow-right" size={14} stroke="var(--ink-3)"/>
              </button>
            );
          })}
        </div>
        <div className="row between" style={{ marginTop: 18 }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="muted" style={{ fontSize: 12 }}>Messages are private & never shared.</div>
        </div>
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{
  child: typeof ALC_DATA.children[0];
  childObs: typeof ALC_DATA.observations;
  steps: typeof ALC_DATA.nextSteps.c1;
}> = ({ child, childObs, steps }) => {
  const first = child.name.split(' ')[0];
  return (
    <div className="grid cols-sidebar-lg" style={{ gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ai-panel">
          <div className="row between" style={{ marginBottom: 10 }}>
            <span className="ai-badge"><Icon name="sparkle" size={11}/> AI SUMMARY</span>
            <span className="mono" style={{ color: 'var(--ink-4)' }}>Updated 2m ago · from 34 observations</span>
          </div>
          <div style={{ fontSize: 15.5, lineHeight: 1.55, color: 'var(--ink)' }}>
            {first} is most alive when {child.pronoun === 'he' ? 'he' : 'she'} can <strong>build or order materials with {child.pronoun === 'he' ? 'his' : 'her'} hands</strong>. Peer-mentoring shows up repeatedly. Verbal explanation is an emerging edge; {child.pronoun === 'he' ? 'he' : 'she'} can do the maths, but asking {child.pronoun === 'he' ? 'him' : 'her'} to narrate steps flattens {child.pronoun === 'he' ? 'his' : 'her'} confidence.
          </div>
          <div className="row wrap" style={{ gap: 6, marginTop: 14 }}>
            {child.strengths.map(s => (
              <span key={s} className="chip" style={{ background: 'var(--sage-soft)', color: 'var(--sage-ink)', border: 'none' }}><Icon name="leaf" size={11}/> Strength · {s}</span>
            ))}
            {child.gaps.map(g => (
              <span key={g} className="chip" style={{ background: 'var(--ochre-soft)', color: 'var(--ochre-ink)', border: 'none' }}><Icon name="arrow-up" size={11}/> Growing · {g}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}><Icon name="leaf" size={14}/> Strengths</h3>
            {child.strengths.map(s => (
              <div key={s} className="row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0 }}/>
                <span style={{ fontSize: 13.5 }}>{s}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}><Icon name="arrow-up" size={14}/> Growing edges</h3>
            {child.gaps.map(g => (
              <div key={g} className="row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ochre)', flexShrink: 0 }}/>
                <span style={{ fontSize: 13.5 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>

        {child.flags?.includes('attention-pattern') && (
          <div className="card" style={{ borderColor: 'var(--ochre-soft)', background: 'linear-gradient(180deg, #FBF7EC, #F9EED0)' }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="chip" style={{ background: 'var(--ochre)', color: 'var(--ink)', border: 'none' }}><Icon name="flag" size={11}/> Pattern to discuss with SENCO</span>
              <span className="mono" style={{ color: 'var(--ink-4)' }}>Confidence: low-medium</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>
              Across 11 observations, {first}'s sustained attention varies with time-of-day and group size — not intrinsic difficulty. This <strong>isn't a diagnosis</strong>. It's a pattern worth sitting with your SENCO about. A 5-day attention log is already drafted below.
            </div>
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn primary" style={{ background: 'var(--ochre-ink)', borderColor: 'var(--ochre-ink)', color: 'var(--cream)' }}>Share with SENCO</button>
              <button className="btn">Keep observing</button>
              <button className="btn ghost">Dismiss pattern</button>
            </div>
          </div>
        )}

        {child.flags?.includes('mood-shift') && (
          <div className="card" style={{ borderColor: 'var(--plum-soft)', background: 'linear-gradient(180deg, #FBF7EC, #F5EFF3)' }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="chip" style={{ background: 'var(--plum)', color: '#fff', border: 'none' }}>SENCO</span>
              <span className="mono" style={{ color: 'var(--ink-4)' }}>Confidence: medium</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>
              This <strong>isn't a diagnosis</strong>. A pattern in observation data. Monday withdrawals noted three times. Shared only with SENCO and the Head. Families are partners here, not recipients of a label.
            </div>
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn primary" style={{ background: 'var(--plum-ink)', borderColor: 'var(--plum-ink)', color: 'var(--cream)' }}>Share with SENCO</button>
              <button className="btn">Keep observing</button>
              <button className="btn ghost">Dismiss</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3>Recent observations</h3>
            <button className="btn ghost">See all {childObs.length}</button>
          </div>
          {childObs.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>No observations yet for this child. Tap Capture to add one.</div>
          ) : childObs.map(o => (
            <div key={o.id} style={{ padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{o.author} <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>· {o.role}</span></div>
                <div className="mono" style={{ color: 'var(--ink-4)' }}>{o.time}</div>
              </div>
              <div style={{ fontSize: 13.5 }}>{o.text}</div>
              <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
                {o.tags.map(t => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3><Icon name="sparkle" size={14}/> Suggested next steps</h3>
            <span className="chip">for tomorrow</span>
          </div>
          {steps.map((s, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < steps.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <span className="tiny" style={{ color: 'var(--plum-ink)' }}>{s.type}</span>
                <span className="mono" style={{ color: 'var(--ink-4)' }}>{s.time}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{s.rationale}</div>
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }}><Icon name="check" size={11}/> Add to plan</button>
                <button className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Curriculum map</h3>
          {[
            { area: 'Practical Life', v: 82 },
            { area: 'Sensorial', v: 90 },
            { area: 'Language', v: 64 },
            { area: 'Mathematics', v: 72 },
            { area: 'Cultural', v: 55 },
          ].map(s => (
            <div key={s.area} style={{ marginBottom: 10 }}>
              <div className="row between" style={{ fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{s.area}</span>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{s.v}%</span>
              </div>
              <div className="bar"><span style={{ width: s.v + '%' }}/></div>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: 'var(--cream-2)' }}>
          <div className="tiny" style={{ marginBottom: 6 }}>Privacy · visible to</div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="chip"><Icon name="users" size={11}/> {child.teacher}</span>
            <span className="chip"><Icon name="users" size={11}/> {child.guardian} (parent)</span>
            <span className="chip"><Icon name="shield" size={11}/> Head of Primary</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ObservationsTab: React.FC<{ childObs: typeof ALC_DATA.observations }> = ({ childObs }) => (
  <div className="card">
    <div className="row between" style={{ marginBottom: 14 }}>
      <h3>All observations</h3>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn"><Icon name="tag" size={12}/> Filter by tag</button>
        <button className="btn primary"><Icon name="mic" size={12}/> New</button>
      </div>
    </div>
    {childObs.length === 0 && <div className="muted">No observations yet.</div>}
    {[...childObs, ...childObs].map((o, i) => (
      <div key={i} className="row" style={{ padding: '14px 0', borderBottom: '1px dashed var(--line)', gap: 14, alignItems: 'flex-start' }}>
        <div className="mono" style={{ color: 'var(--ink-4)', width: 100, flexShrink: 0 }}>{o.time}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, marginBottom: 6 }}>{o.text}</div>
          <div className="row wrap" style={{ gap: 4 }}>
            {o.tags.map(t => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
          </div>
        </div>
        <span className="chip" style={{ background: o.role === 'parent' ? 'var(--sky-soft)' : 'var(--sage-soft)', color: o.role === 'parent' ? 'var(--sky-ink)' : 'var(--sage-ink)', border: 'none', flexShrink: 0 }}>{o.author}</span>
      </div>
    ))}
  </div>
);

const BigChart: React.FC = () => {
  const pts = [50,54,52,58,61,63,67,70,68,73,75,78];
  const w = 520, h = 180;
  const d = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - 40) / 50) * h;
    return (i === 0 ? 'M' : 'L') + x + ' ' + y;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 180 }}>
      {[25, 50, 75, 100, 125, 150].map(y => <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="var(--line)" strokeDasharray="3 4"/>)}
      <path d={d + ` L ${w} ${h} L 0 ${h} Z`} fill="var(--tone)" opacity="0.12"/>
      <path d={d} fill="none" stroke="var(--tone-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((v, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - ((v - 40) / 50) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--tone-ink)"/>;
      })}
    </svg>
  );
};

const ProgressTab: React.FC<{ child: typeof ALC_DATA.children[0] }> = ({ child: _child }) => (
  <div className="grid grid-2" style={{ gap: 16 }}>
    <div className="card">
      <h3 style={{ marginBottom: 14 }}>Mastery over time</h3>
      <BigChart/>
    </div>
    <div className="card">
      <h3 style={{ marginBottom: 14 }}>By strand</h3>
      {['Practical Life','Sensorial','Language','Mathematics','Cultural'].map((s, i) => {
        const vals = [55, 60, 65, 62, 68, 72, 70 + i * 2 - 4];
        return (
          <div key={s} style={{ marginBottom: 14 }}>
            <div className="row between" style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{s}</span>
              <span className="mono" style={{ color: 'var(--ink-3)' }}>{vals[vals.length - 1]}%</span>
            </div>
            <Sparkline values={vals} color="var(--tone)" fill/>
          </div>
        );
      })}
    </div>
  </div>
);

const PlanTab: React.FC<{ steps: typeof ALC_DATA.nextSteps.c1; child: typeof ALC_DATA.children[0] }> = ({ steps: _steps, child }) => {
  const first = child.name.split(' ')[0];
  return (
    <div className="grid grid-2" style={{ gap: 16 }}>
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>AI-drafted lesson plan · tomorrow</h3>
        <div style={{ padding: 14, background: 'var(--cream)', borderRadius: 12, marginBottom: 12 }}>
          <div className="tiny">09:15 – 09:35 · 20 min</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4, marginBottom: 6 }}>Geometric Cabinet — triangles</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>Present the triangle drawer. Three-period lesson with three shapes. Invite {first} to work alongside Theo, who's ready for the same material.</div>
        </div>
        <div style={{ padding: 14, background: 'var(--cream)', borderRadius: 12 }}>
          <div className="tiny">11:00 – 11:10 · 10 min extension</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4, marginBottom: 6 }}>Shape hunt · partner work</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>Pair walk around classroom to find three triangles in the environment. Reinforces peer-mentoring strength.</div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Sent to parent</h3>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--ink-2)' }}>
          "Today {first} built the Pink Tower and taught a younger friend how to grade by size — {child.pronoun === 'he' ? 'he' : 'she'} has a beautiful steadiness with materials. One gentle thing at home: baking or pouring games build the same kind of kinaesthetic maths {child.pronoun === 'he' ? 'he' : 'she'} loves at school. No homework, just time."
        </div>
        <div className="row" style={{ marginTop: 14, gap: 8 }}>
          <button className="btn"><Icon name="message" size={13}/> Edit & send</button>
          <button className="btn ghost">Regenerate</button>
        </div>
      </div>
    </div>
  );
};

const CommTab: React.FC<{ child: typeof ALC_DATA.children[0] }> = ({ child }) => {
  const first = child.name.split(' ')[0];
  const guardianFirst = child.guardian.split(' ')[0];
  return (
    <div className="card">
      <h3 style={{ marginBottom: 14 }}>Conversation with {child.guardian}</h3>
      {[
        { from: 'parent', text: `${first} had a big meltdown over shoes this morning. Sending ${child.pronoun === 'he' ? 'him' : 'her'} in tired.`, t: '08:02' },
        { from: 'teacher', text: "Thanks for the heads-up — I'll keep things lower-key until mid-morning.", t: '08:06' },
        { from: 'teacher', text: `Quick update: ${child.pronoun === 'he' ? 'he' : 'she'} settled into Practical Life after snack and did beautifully.`, t: '10:45' },
        { from: 'parent', text: 'Such a relief, thank you.', t: '10:52' },
      ].map((m, i) => (
        <div key={i} className="row" style={{ justifyContent: m.from === 'teacher' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
          <div style={{ maxWidth: '60%', padding: '10px 14px', borderRadius: 16, background: m.from === 'teacher' ? 'var(--ink)' : 'var(--cream-2)', color: m.from === 'teacher' ? 'var(--cream)' : 'var(--ink)', fontSize: 13.5 }}>
            {m.text}
            <div className="mono" style={{ fontSize: 10, marginTop: 4, opacity: 0.55 }}>{m.t}</div>
          </div>
        </div>
      ))}
      <div className="row" style={{ marginTop: 16, gap: 8, padding: 10, background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--line)' }}>
        <input placeholder={`Message ${guardianFirst}…`} aria-label={`Message ${guardianFirst}`} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
        <button className="btn"><Icon name="sparkle" size={12}/> Draft</button>
        <button className="btn primary" aria-label="Send message"><Icon name="send" size={12}/></button>
      </div>
    </div>
  );
};

const AskModal: React.FC<{ child: typeof ALC_DATA.children[0]; onClose: () => void }> = ({ child, onClose }) => {
  const first = child.name.split(' ')[0];
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState([
    { from: 'ai', text: `Hi Ana. I've got ${first}'s full profile loaded — 34 observations across 6 weeks. What would you like to understand?` }
  ]);
  const suggestions = ['Why was she struggling today?', 'What teaching approach works best?', 'Is there a pattern with mornings?', 'Draft a note to her parent.'];

  const generateAnswer = (query: string): string => {
    if (/struggl|tough|hard/i.test(query)) return `Three signals from today: ${child.pronoun === 'he' ? 'he' : 'she'} avoided verbal explanation (3rd time this week), attention was shorter right after snack, and ${child.pronoun === 'he' ? 'he' : 'she'} re-approached the same material three times. That's effort, not avoidance. I'd try a shorter cycle and a softer prompt — "show me" rather than "tell me".`;
    if (/approach|method|teach/i.test(query)) return `${first}'s sweet spot is kinaesthetic + quiet 1:1. ${child.pronoun === 'he' ? 'He' : 'She'} flourishes when ${child.pronoun === 'he' ? 'he' : 'she'} can move the materials before naming them. Front-load the doing; name things afterwards, not during.`;
    if (/morning|pattern|time/i.test(query)) return `Mornings are ${child.pronoun === 'he' ? 'his' : 'her'} strongest window (9:00–10:30). Post-snack is consistently softer — possibly a blood-sugar dip. Worth experimenting with a protein-leaning snack next week.`;
    if (/parent|note|draft/i.test(query)) return `"${first} had a beautiful morning. At home this week, small kinaesthetic invitations — pouring, folding, baking — match how ${child.pronoun === 'he' ? 'he' : 'she'}'s learning best right now."`;
    return `I'd need another session of observations to answer that well. Want me to set up a light tracking prompt for the next 5 days?`;
  };

  const ask = (text: string) => {
    if (!text) return;
    setMsgs(m => [...m, { from: 'user', text }, { from: 'ai', text: generateAnswer(text) }]);
    setQ('');
  };

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={`Ask about ${first}`}
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,36,32,0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 40 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: '100%', maxHeight: '80vh', background: 'var(--paper)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 10 }}>
            <div className={`avatar-lg tone-${child.tone}`}>{child.initials}</div>
            <div>
              <div style={{ fontWeight: 800 }}>Ask about {first}</div>
              <div className="muted" style={{ fontSize: 12 }}>Your private AI assistant · coaching, not prescriptive</div>
            </div>
          </div>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px', borderRadius: 16, background: m.from === 'user' ? 'var(--ink)' : 'var(--ochre-soft)', color: m.from === 'user' ? 'var(--cream)' : 'var(--ink)', fontSize: 14, lineHeight: 1.5 }}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="row wrap" style={{ gap: 6, margin: '12px 0' }}>
          {suggestions.map(s => (
            <button key={s} className="chip" onClick={() => ask(s)} style={{ cursor: 'pointer' }}>{s}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 8, padding: 10, background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--line)' }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(q)}
            placeholder={`Ask anything about ${first}…`} aria-label={`Ask about ${first}`}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}/>
          <button className="btn primary" onClick={() => ask(q)} aria-label="Send question"><Icon name="send" size={12}/></button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
