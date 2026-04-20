import React, { useState, useRef } from 'react';
import { Icon, BrandLogo } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import type { Role } from '../../data/types';
import './LoginScreen.css';

type Track = 'school' | 'family';
type LoginStep = 'track' | 'role' | 'auth';

interface LoginScreenProps {
  onLogin: (role: Role, opts?: { childId?: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [step, setStep] = useState<LoginStep>('track');

  const pickRole = (r: string) => { setRole(r); setStep('auth'); };
  const back = () => {
    if (step === 'auth') { setStep('role'); setRole(null); }
    else if (step === 'role') { setStep('track'); setTrack(null); }
  };

  const steps: LoginStep[] = ['track', 'role', 'auth'];

  return (
    <div className="login-screen">
      {/* Left — brand panel */}
      <div className="login-brand-panel">
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'var(--sage-soft)', top: -120, right: -120, opacity: 0.5, filter: 'blur(10px)' }}/>
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'var(--plum-soft)', bottom: 40, left: -80, opacity: 0.4, filter: 'blur(8px)' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <BrandLogo size="lg"/>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
            A calmer way to know each child.
          </div>
          <div style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 28 }}>
            Observations, stories, and small signals — woven into a living portrait of how your child learns.
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.6)' }}><Icon name="shield" size={11}/> End-to-end encrypted</span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.6)' }}><Icon name="heart" size={11}/> Montessori-first</span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.6)' }}><Icon name="sparkle" size={11}/> Human-led AI</span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 12, color: 'var(--ink-4)' }}>
          Used by 34 schools across 6 countries · v2.4
        </div>
      </div>

      {/* Right — dynamic panel */}
      <div className="login-form-panel">
        {/* Mobile-only brand logo at top of form panel */}
        <div className="login-mobile-brand">
          <BrandLogo size="md"/>
        </div>

        <div className="row between" style={{ marginBottom: 32 }}>
          {step !== 'track' ? (
            <button className="btn ghost" onClick={back}><Icon name="arrow-right" size={12} stroke="var(--ink-3)" style={{ transform: 'rotate(180deg)' }}/> Back</button>
          ) : <span/>}
          <div className="row" style={{ gap: 4 }}>
            {steps.map((s, i) => (
              <span key={s} style={{ width: 28, height: 4, borderRadius: 2, background: step === s ? 'var(--ink)' : (steps.indexOf(step) > i ? 'var(--ink-3)' : 'var(--line)') }}/>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 460, margin: '0 auto', width: '100%' }}>
          {step === 'track' && <TrackStep onPick={(t) => { setTrack(t); setStep('role'); }}/>}
          {step === 'role' && track && <RoleStep track={track} onPick={pickRole}/>}
          {step === 'auth' && track === 'school' && role && (
            <SchoolAuth role={role as 'teacher' | 'leader'} onLogin={() => onLogin(role as Role)}/>
          )}
          {step === 'auth' && track === 'family' && role === 'parent' && (
            <ParentAuth onLogin={(childId) => onLogin('parent', { childId })}/>
          )}
          {step === 'auth' && track === 'family' && role === 'student' && (
            <StudentAuth onLogin={(childId) => onLogin('student', { childId })}/>
          )}
        </div>

        <div className="row between" style={{ marginTop: 32, fontSize: 12, color: 'var(--ink-4)', flexWrap: 'wrap', gap: 8 }}>
          <span>Need help? <a href="#" style={{ color: 'var(--ink-2)', fontWeight: 700 }}>Talk to your school</a></span>
          <span>English (UK)</span>
        </div>
      </div>
    </div>
  );
};

const TrackStep: React.FC<{ onPick: (t: Track) => void }> = ({ onPick }) => (
  <div>
    <div className="tiny" style={{ marginBottom: 10 }}>Welcome back</div>
    <h1 style={{ fontSize: 38, letterSpacing: '-0.02em', marginBottom: 8, margin: '0 0 8px' }}>Let's get you in.</h1>
    <div style={{ color: 'var(--ink-3)', marginBottom: 32, fontSize: 15 }}>Which describes you today?</div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={() => onPick('school')}
        className="tone-ochre"
        style={{ padding: 22, textAlign: 'left', background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ochre-ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--ochre-soft)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper)'; }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--ochre)', display: 'grid', placeItems: 'center', color: 'var(--ink)', flexShrink: 0 }}>
          <Icon name="book" size={26}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em' }}>I'm part of the school</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 2 }}>Teacher, teaching assistant, SENCO, or school leader</div>
        </div>
        <Icon name="arrow-right" size={18} stroke="var(--ink-3)"/>
      </button>

      <button onClick={() => onPick('family')}
        className="tone-sage"
        style={{ padding: 22, textAlign: 'left', background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sage-ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--sage-soft)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper)'; }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--sage)', display: 'grid', placeItems: 'center', color: 'var(--sage-ink)', flexShrink: 0 }}>
          <Icon name="heart" size={26}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em' }}>I'm family</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 2 }}>Parent, carer, or a child using their own profile</div>
        </div>
        <Icon name="arrow-right" size={18} stroke="var(--ink-3)"/>
      </button>
    </div>

    <div style={{ marginTop: 28, padding: 14, background: 'var(--cream-2)', borderRadius: 12, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
      New to Acorns? Your school will send you an invite link. This page is for people who already have access.
    </div>
  </div>
);

const RoleStep: React.FC<{ track: Track; onPick: (r: string) => void }> = ({ track, onPick }) => {
  const opts = track === 'school'
    ? [
        { k: 'teacher', title: 'Teacher', sub: 'Guide, TA, or specialist', icon: 'users' as const, tone: 'sage' },
        { k: 'leader', title: 'School leader', sub: 'Head, deputy, SENCO, or governor', icon: 'chart' as const, tone: 'plum' },
      ]
    : [
        { k: 'parent', title: "I'm a parent or carer", sub: 'Enter your 4-character family passcode', icon: 'heart' as const, tone: 'plum' },
        { k: 'student', title: "I'm a child using my own profile", sub: 'Your teacher will help you in', icon: 'star' as const, tone: 'ochre' },
      ];
  return (
    <div>
      <div className="tiny" style={{ marginBottom: 10 }}>{track === 'school' ? 'School sign-in' : 'Family sign-in'}</div>
      <h1 style={{ fontSize: 34, letterSpacing: '-0.02em', marginBottom: 8, margin: '0 0 8px' }}>And more specifically?</h1>
      <div style={{ color: 'var(--ink-3)', marginBottom: 28, fontSize: 14.5 }}>We'll tailor the next step to you.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {opts.map(o => (
          <button key={o.k} onClick={() => onPick(o.k)}
            className={`tone-${o.tone}`}
            style={{ padding: 18, textAlign: 'left', background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--tone-ink)'; (e.currentTarget as HTMLElement).style.background = 'var(--tone-soft)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.background = 'var(--paper)'; }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--tone-soft)', display: 'grid', placeItems: 'center', color: 'var(--tone-ink)', flexShrink: 0 }}>
              <Icon name={o.icon} size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{o.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{o.sub}</div>
            </div>
            <Icon name="arrow-right" size={16} stroke="var(--ink-3)"/>
          </button>
        ))}
      </div>
    </div>
  );
};

const HelpBanner: React.FC<{ tone: 'sage' | 'ochre' | 'plum' | 'sky'; children: React.ReactNode }> = ({ tone, children }) => (
  <div className={`tone-${tone}`} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--tone-soft)', color: 'var(--tone-ink)', fontSize: 13, lineHeight: 1.55, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 22 }}>
    <Icon name="sparkle" size={14} stroke="currentColor"/>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const SchoolAuth: React.FC<{
  role: 'teacher' | 'leader';
  onLogin: () => void;
}> = ({ role, onLogin }) => (
  <div>
    <div className="tiny" style={{ marginBottom: 10 }}>{role === 'teacher' ? 'Teacher sign-in' : 'Leadership sign-in'}</div>
    <h1 style={{ fontSize: 32, letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>{role === 'teacher' ? 'Welcome back, teacher.' : 'Welcome back.'}</h1>
    <div style={{ color: 'var(--ink-3)', marginBottom: 22, fontSize: 14.5 }}>One tap and you're in.</div>

    <HelpBanner tone="ochre">
      <strong>How to sign in:</strong> tap <strong>Continue with Google Workspace</strong> (or Microsoft). That's it — no password needed.
    </HelpBanner>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button className="btn" onClick={onLogin} style={{ padding: '14px 16px', fontSize: 15, justifyContent: 'center', background: 'var(--paper)', border: '1.5px solid var(--line)' }}>
        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#4285F4', border: '1px solid #dadce0' }}>G</span>
        Continue with Google Workspace
      </button>
      <button className="btn" onClick={onLogin} style={{ padding: '14px 16px', fontSize: 15, justifyContent: 'center', background: 'var(--paper)', border: '1.5px solid var(--line)' }}>
        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#0078D4', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>M</span>
        Continue with Microsoft
      </button>
    </div>
  </div>
);

interface PasscodePadProps {
  value: string[];
  setValue: (v: string[]) => void;
  error: string | null;
  onComplete: (full: string) => void;
  autoFocus?: boolean;
}

const PasscodePad: React.FC<PasscodePadProps> = ({ value, setValue, error, onComplete, autoFocus = true }) => {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleChange = (i: number, v: string) => {
    const ch = v.replace(/[^0-9A-Za-z]/g, '').slice(-1).toUpperCase();
    const next = [...value];
    next[i] = ch;
    setValue(next);
    if (ch && i < 3) refs[i + 1].current?.focus();
    if (next.every(c => c !== '')) onComplete(next.join(''));
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <div className="passcode-row" style={{ marginBottom: 18 }}>
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={refs[i]}
          value={value[i]}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          pattern="[0-9A-Za-z]*"
          aria-label={`Passcode character ${i + 1}`}
          className="passcode-input"
          style={{
            border: error ? '2px solid var(--danger)' : '2px solid var(--line)',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        />
      ))}
    </div>
  );
};

const ParentAuth: React.FC<{ onLogin: (childId: string) => void }> = ({ onLogin }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ parentName: string; childName: string } | null>(null);

  const tryLogin = (full: string) => {
    const match = ALC_DATA.parentPasscodes[full];
    if (match) {
      setError(null);
      setSuccess(match);
      setTimeout(() => onLogin(match.childId), 650);
    } else {
      setError("That passcode doesn't match. Try again.");
      setTimeout(() => setCode(['', '', '', '']), 50);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sage-soft)', color: 'var(--sage-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
          <Icon name="check" size={26}/>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6 }}>Welcome, {success.parentName.split(' ')[0]}.</div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-3)' }}>Opening {success.childName}'s profile…</div>
      </div>
    );
  }

  const codes = Object.keys(ALC_DATA.parentPasscodes);

  return (
    <div>
      <div className="tiny" style={{ marginBottom: 10 }}>Family sign-in</div>
      <h1 style={{ fontSize: 34, letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>Welcome back.</h1>
      <div style={{ color: 'var(--ink-3)', marginBottom: 22, fontSize: 15 }}>Enter your 4-digit family passcode.</div>

      <HelpBanner tone="sage">
        <strong>How to sign in:</strong> enter the passcode below to open your child's profile.<br/>
        <span style={{ fontSize: 12.5 }}>Demo passcodes:</span>{' '}
        {codes.map((c, i) => (
          <span key={c} className="mono" style={{ fontWeight: 700, fontSize: 13, marginRight: 6 }}>
            {c}{i < codes.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </HelpBanner>

      <PasscodePad value={code} setValue={setCode} error={error} onComplete={tryLogin}/>

      {error && (
        <div style={{ padding: 12, background: 'var(--danger-soft)', borderRadius: 12, fontSize: 13.5, color: 'var(--danger)', marginBottom: 18, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
};

const StudentAuth: React.FC<{ onLogin: (childId: string) => void }> = ({ onLogin }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ childName: string } | null>(null);

  const tryLogin = (full: string) => {
    const match = ALC_DATA.studentPasscodes[full];
    if (match) {
      setError(null);
      setSuccess(match);
      setTimeout(() => onLogin(match.childId), 650);
    } else {
      setError("That's not quite right. Ask your teacher for your passcode.");
      setTimeout(() => setCode(['', '', '', '']), 50);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ochre-soft)', color: 'var(--ochre-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
          <Icon name="star" size={32}/>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6 }}>Hi, {success.childName}!</div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-3)' }}>Opening your learning space…</div>
      </div>
    );
  }

  const codes = Object.keys(ALC_DATA.studentPasscodes);

  return (
    <div>
      <div className="tiny" style={{ marginBottom: 10 }}>For children</div>
      <h1 style={{ fontSize: 34, letterSpacing: '-0.02em', marginBottom: 6, margin: '0 0 6px' }}>Hello!</h1>
      <div style={{ color: 'var(--ink-3)', marginBottom: 22, fontSize: 15 }}>Type the 4 numbers your teacher gave you.</div>

      <HelpBanner tone="ochre">
        <strong>How to sign in:</strong> type your 4-digit passcode below. You'll go straight to your own space.<br/>
        <span style={{ fontSize: 12.5 }}>Demo passcodes:</span>{' '}
        {codes.map((c, i) => (
          <span key={c} className="mono" style={{ fontWeight: 700, fontSize: 13, marginRight: 6 }}>
            {c}{i < codes.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </HelpBanner>

      <PasscodePad value={code} setValue={setCode} error={error} onComplete={tryLogin}/>

      {error && (
        <div style={{ padding: 12, background: 'var(--danger-soft)', borderRadius: 12, fontSize: 13.5, color: 'var(--danger)', marginBottom: 18, textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
