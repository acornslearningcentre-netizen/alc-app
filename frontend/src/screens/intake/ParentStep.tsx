// Parent contact step (Watercolor Glass redesign).
//
// Three fields on one card. Required is marked by a Moss "·" plus the word
// "required" inline (Terra is reserved for state; using it for required was
// the v1 anti-pattern). Phone carries an explicit "no marketing" promise.

import { useState } from 'react';
import { ProgressBar } from './ProgressBar';

interface Props {
  email: string;
  name: string;
  phone: string;
  onChange: (next: { email?: string; name?: string; phone?: string }) => void;
  onBack: () => void;
  onNext: () => void;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export const ParentStep = ({ email, name, phone, onChange, onBack, onNext }: Props) => {
  const [touched, setTouched] = useState(false);
  const emailOk = isEmail(email);
  const showError = touched && !emailOk;

  const submit = () => {
    setTouched(true);
    if (emailOk) onNext();
  };

  return (
    <div className="intake-stage">
      <div className="intake-card">
        <ProgressBar section={1} fraction={0.06} label="About you · so we can stay in touch"/>

        <h2 className="intake-question">First, who are <em>we writing to</em>?</h2>
        <p className="intake-helper">
          We&rsquo;ll send the assessment plan and Aishat&rsquo;s notes here. Nothing else, ever.
        </p>

        <div className="intake-field-stack">
          <label className="intake-label">
            <span>Your email <span className="intake-required-mark">·</span> required</span>
            <input
              className="intake-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onChange({ email: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder="you@example.com"
              autoFocus
            />
          </label>

          <label className="intake-label">
            <span>Your name</span>
            <input
              className="intake-input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => onChange({ name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder="So we know what to call you"
            />
          </label>

          <label className="intake-label">
            <span>Phone <em className="intake-label-hint">&middot; optional</em></span>
            <input
              className="intake-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder="Only if a quick call would be easier"
            />
            <span className="intake-fineprint">We&rsquo;ll only call about a session &mdash; no marketing.</span>
          </label>
        </div>

        {showError && <p className="intake-error">Please check the email address.</p>}

        <div className="intake-actions intake-actions--row">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onBack}>Back</button>
          <span className="intake-listening"><span className="dot"/> Saved on this device</span>
          <span className="intake-actions-spacer" aria-hidden="true"/>
          <button type="button" className="intake-btn intake-btn--primary" onClick={submit}>Next</button>
        </div>
      </div>
    </div>
  );
};
