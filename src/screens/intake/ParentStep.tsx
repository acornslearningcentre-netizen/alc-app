import { useState } from 'react';

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
        <p className="intake-eyebrow">First, a little about you</p>
        <h2 className="intake-question">Where can we reach you?</h2>
        <p className="intake-helper">
          We'll use your email to send your child's assessment report and confirm session times.
          Phone is optional — handy for short reminders.
        </p>

        <label className="intake-label">
          <span>Your email</span>
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
            placeholder="First and last name"
          />
        </label>

        <label className="intake-label">
          <span>Phone <em className="intake-label-hint">(optional)</em></span>
          <input
            className="intake-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
            placeholder="07000 000 000"
          />
        </label>

        {showError && <p className="intake-error">Please check the email address.</p>}

        <div className="intake-actions intake-actions--row">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onBack}>Back</button>
          <button type="button" className="intake-btn intake-btn--primary" onClick={submit}>Next</button>
        </div>
      </div>
    </div>
  );
};
