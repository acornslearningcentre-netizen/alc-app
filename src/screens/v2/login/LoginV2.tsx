import React, { useEffect, useRef, useState } from 'react';
import { Icon, BrandLogo } from '../../../components/ui';
import { ALC_DATA } from '../../../data/seed';
import type { Role } from '../../../data/types';
import '../../../styles/v2/login.css';

type Track = 'school' | 'family';
type Step = 'track' | 'role' | 'auth';

interface Props {
  onLogin: (role: Role, opts?: { childId?: string }) => void;
}

const STEP_LABELS: Record<Step, string> = {
  track: 'Track',
  role: 'Role',
  auth: 'Verify',
};

export const LoginV2: React.FC<Props> = ({ onLogin }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('track');

  const back = () => {
    if (step === 'auth') { setStep('role'); setRole(null); }
    else if (step === 'role') { setStep('track'); setTrack(null); }
  };

  const steps: Step[] = ['track', 'role', 'auth'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="v2-login">
      <header className="v2-login-rule-top">
        <span className="v2-login-mark"><BrandLogo size="md" tone="dark"/></span>
        <a className="v2-login-onboard" href="/welcome">
          New here? Start onboarding
          <Icon name="arrow-right" size={12} stroke="currentColor"/>
        </a>
      </header>

      <div className="v2-login-stage">
        <nav className="v2-login-rail" aria-label="Sign-in steps">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`v2-login-rail-item ${i === stepIndex ? 'active' : i < stepIndex ? 'done' : ''}`}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span className="label">{STEP_LABELS[s]}</span>
            </div>
          ))}
        </nav>

        <div className="v2-login-col">
          <Headline />
          <p className="v2-login-sub">
            Observations, stories and small signals — woven into a living portrait
            of how every child learns.
          </p>
          <div className="v2-login-trust">
            <span className="v2-chip"><Icon name="shield" size={11}/> Encrypted end-to-end</span>
            <span className="v2-chip"><Icon name="heart" size={11}/> Montessori-first</span>
            <span className="v2-chip"><Icon name="sparkle" size={11}/> Human-led AI</span>
          </div>
        </div>

        <section className="v2-login-form">
          {step !== 'track' && (
            <button className="v2-login-back" onClick={back}>
              <Icon name="arrow-right" size={11} stroke="currentColor" style={{ transform: 'rotate(180deg)' }}/>
              Back to {STEP_LABELS[steps[stepIndex - 1]]}
            </button>
          )}

          <div className="v2-step-indicator" aria-hidden>
            {steps.map((s, i) => (
              <span key={s} className={`v2-step-tick ${i === stepIndex ? 'now' : i < stepIndex ? 'done' : ''}`}/>
            ))}
          </div>

          {step === 'track' && <TrackStep onPick={(t) => { setTrack(t); setStep('role'); }}/>}
          {step === 'role' && track && <RoleStep track={track} onPick={(r) => { setRole(r); setStep('auth'); }}/>}
          {step === 'auth' && track === 'school' && role && (
            <SchoolAuth role={role as 'teacher' | 'leader'} onLogin={() => onLogin(role as Role)}/>
          )}
          {step === 'auth' && track === 'family' && role === 'parent' && (
            <ParentAuth onLogin={(childId) => onLogin('parent', { childId })}/>
          )}
          {step === 'auth' && track === 'family' && role === 'student' && (
            <StudentAuth onLogin={(childId) => onLogin('student', { childId })}/>
          )}
        </section>
      </div>

      <footer className="v2-login-foot">
        <span>Need help · talk to your school</span>
        <span>English (UK)</span>
      </footer>
    </div>
  );
};

/** Rotating emphasis word in the headline. The em remounts on every word
 *  change (via a unique key) so a CSS keyframe runs on each transition.
 *  A sizing ghost (the widest word) reserves the slot width, so shorter
 *  words don't reflow the line. */
const Headline: React.FC = () => {
  const words = ['child', 'pupil', 'learner'];
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), '');
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <h1 className="v2-login-headline">
      A calmer way<br/>to know each{' '}
      <span className="v2-word-slot">
        <span className="v2-word-ghost" aria-hidden>{widest}.</span>
        <em key={idx} className="v2-word-rotator">{words[idx]}.</em>
      </span>
    </h1>
  );
};

const TrackStep: React.FC<{ onPick: (t: Track) => void }> = ({ onPick }) => (
  <div>
    <h2 className="v2-login-step-title">Let's get you in.</h2>
    <p className="v2-login-step-sub">Which describes you today?</p>

    <div className="v2-cascade v2-pick-list">
      <button className="v2-pick" onClick={() => onPick('school')}>
        <span className="v2-pick-content">
          <span className="v2-pick-title">I'm part of the school</span>
          <span className="v2-pick-sub">Teacher, TA, SENCO, or leader</span>
        </span>
        <span className="v2-pick-arrow"><Icon name="arrow-right" size={14} stroke="currentColor"/></span>
      </button>

      <button className="v2-pick" onClick={() => onPick('family')}>
        <span className="v2-pick-content">
          <span className="v2-pick-title">I'm family</span>
          <span className="v2-pick-sub">Parent, carer or child</span>
        </span>
        <span className="v2-pick-arrow"><Icon name="arrow-right" size={14} stroke="currentColor"/></span>
      </button>
    </div>

    <p className="v2-login-fineprint">
      New here? Your school will send you an invite link.
    </p>
  </div>
);

const RoleStep: React.FC<{ track: Track; onPick: (r: string) => void }> = ({ track, onPick }) => {
  const opts = track === 'school'
    ? [
        { k: 'teacher', title: 'Teacher', sub: 'Guide, TA, or specialist', icon: 'users' as const },
        { k: 'leader',  title: 'School leader', sub: 'Head, deputy, SENCO, or governor', icon: 'chart' as const },
      ]
    : [
        { k: 'parent',  title: "I'm a parent or carer", sub: 'Enter your 4-character family passcode', icon: 'heart' as const },
        { k: 'student', title: "I'm a child using my own profile", sub: 'Your teacher will help you in', icon: 'star' as const },
      ];

  return (
    <div>
      <h2 className="v2-login-step-title">And more specifically?</h2>
      <p className="v2-login-step-sub">We'll tailor the next step to you.</p>

      <div className="v2-cascade v2-pick-list">
        {opts.map(o => (
          <button key={o.k} className="v2-pick" onClick={() => onPick(o.k)}>
            <span className="v2-pick-content">
              <span className="v2-pick-title">{o.title}</span>
              <span className="v2-pick-sub">{o.sub}</span>
            </span>
            <span className="v2-pick-arrow"><Icon name="arrow-right" size={14} stroke="currentColor"/></span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SchoolAuth: React.FC<{ role: 'teacher' | 'leader'; onLogin: () => void }> = ({ role, onLogin }) => (
  <div>
    <h2 className="v2-login-step-title">{role === 'teacher' ? <>Welcome back, <em>teacher.</em></> : 'Welcome back.'}</h2>
    <p className="v2-login-step-sub">One tap and you're in. No password needed.</p>

    <div className="v2-cascade" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button className="v2-btn primary" onClick={onLogin} style={{ padding: '14px 18px', justifyContent: 'center' }}>
        <span style={{ width: 16, height: 16, borderRadius: 2, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, color: '#4285F4', border: '1px solid #dadce0' }}>G</span>
        Continue with Google Workspace
      </button>
      <button className="v2-btn" onClick={onLogin} style={{ padding: '14px 18px', justifyContent: 'center' }}>
        <span style={{ width: 16, height: 16, borderRadius: 2, background: '#0078D4', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>M</span>
        Continue with Microsoft
      </button>
    </div>
  </div>
);

const PasscodePad: React.FC<{
  value: string[];
  setValue: (v: string[]) => void;
  error: boolean;
  onComplete: (full: string) => void;
}> = ({ value, setValue, error, onComplete }) => {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const change = (i: number, v: string) => {
    const ch = v.replace(/[^0-9A-Za-z]/g, '').slice(-1).toUpperCase();
    const next = [...value]; next[i] = ch; setValue(next);
    if (ch && i < 3) refs[i + 1].current?.focus();
    if (next.every(c => c !== '')) onComplete(next.join(''));
  };
  const key = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs[i - 1].current?.focus();
  };
  return (
    <div className={`v2-passcode${error ? ' error' : ''}`}>
      {[0,1,2,3].map(i => (
        <input
          key={i} ref={refs[i]} value={value[i]}
          onChange={e => change(i, e.target.value)} onKeyDown={e => key(i, e)}
          maxLength={1} autoFocus={i === 0} inputMode="numeric"
          aria-label={`Passcode character ${i + 1}`}
        />
      ))}
    </div>
  );
};

const ParentAuth: React.FC<{ onLogin: (childId: string) => void }> = ({ onLogin }) => {
  const [code, setCode] = useState(['','','','']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ parentName: string; childName: string } | null>(null);

  const tryLogin = (full: string) => {
    const match = ALC_DATA.parentPasscodes[full];
    if (match) { setError(null); setSuccess(match); setTimeout(() => onLogin(match.childId), 650); }
    else { setError("That passcode doesn't match. Try again."); setTimeout(() => setCode(['','','','']), 50); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--v2-moss)', color: 'var(--v2-moss-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <Icon name="check" size={22}/>
      </div>
      <h2 className="v2-login-step-title">Welcome, <em>{success.parentName.split(' ')[0]}.</em></h2>
      <p className="v2-login-step-sub">Opening {success.childName}'s profile…</p>
    </div>
  );

  const codes = Object.keys(ALC_DATA.parentPasscodes);
  return (
    <div>
      <h2 className="v2-login-step-title">Welcome back.</h2>
      <p className="v2-login-step-sub">Enter your 4-digit family passcode.</p>

      <PasscodePad value={code} setValue={setCode} error={!!error} onComplete={tryLogin}/>
      {error && (
        <div style={{ padding: 10, background: 'var(--v2-tangerine-soft)', borderRadius: 'var(--v2-r-sm)', fontSize: 13, color: 'var(--v2-tangerine)', textAlign: 'center', fontWeight: 500 }}>
          {error}
        </div>
      )}
      <p className="v2-login-fineprint">
        Demo ·{' '}
        {codes.map((c, i) => (
          <React.Fragment key={c}><span className="v2-mono">{c}</span>{i < codes.length - 1 ? ' / ' : ''}</React.Fragment>
        ))}
      </p>
    </div>
  );
};

const StudentAuth: React.FC<{ onLogin: (childId: string) => void }> = ({ onLogin }) => {
  const [code, setCode] = useState(['','','','']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ childName: string } | null>(null);

  const tryLogin = (full: string) => {
    const match = ALC_DATA.studentPasscodes[full];
    if (match) { setError(null); setSuccess(match); setTimeout(() => onLogin(match.childId), 650); }
    else { setError("That's not quite right. Ask your teacher for your passcode."); setTimeout(() => setCode(['','','','']), 50); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ width: 60, height: 60, borderRadius: 999, background: 'var(--v2-moss)', color: 'var(--v2-moss-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <Icon name="star" size={26}/>
      </div>
      <h2 className="v2-login-step-title">Hi, <em>{success.childName}.</em></h2>
      <p className="v2-login-step-sub">Opening your learning space…</p>
    </div>
  );

  const codes = Object.keys(ALC_DATA.studentPasscodes);
  return (
    <div>
      <h2 className="v2-login-step-title">Hello.</h2>
      <p className="v2-login-step-sub">Type the 4 numbers your teacher gave you.</p>

      <PasscodePad value={code} setValue={setCode} error={!!error} onComplete={tryLogin}/>
      {error && (
        <div style={{ padding: 10, background: 'var(--v2-tangerine-soft)', borderRadius: 'var(--v2-r-sm)', fontSize: 13, color: 'var(--v2-tangerine)', textAlign: 'center', fontWeight: 500 }}>
          {error}
        </div>
      )}
      <p className="v2-login-fineprint">
        Demo ·{' '}
        {codes.map((c, i) => (
          <React.Fragment key={c}><span className="v2-mono">{c}</span>{i < codes.length - 1 ? ' / ' : ''}</React.Fragment>
        ))}
      </p>
    </div>
  );
};

export default LoginV2;
