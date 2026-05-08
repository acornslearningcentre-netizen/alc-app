// Field renderers for the intake form (Story A2).
//
// One component per IntakeFieldType. All share a small uniform contract so
// QuestionStep can render whichever field the schema demands without
// branching. Storage shape per field type:
//
//   text / longtext / date / select  → string
//   radio  (no hasOther)             → string
//   radio  (hasOther)                → { value: string, other?: string }
//   multi  (no hasOther)             → string[]
//   multi  (hasOther)                → { values: string[], other?: string }
//
// The "Other" value is the literal string '__other__' so it never collides
// with a real option key.

import { useEffect, useRef } from 'react';
import type { IntakeField, IntakeAnswerValue } from '../../data/intake-questions';

export const OTHER = '__other__';

export interface FieldProps {
  field: IntakeField;
  value: IntakeAnswerValue | undefined;
  onChange: (next: IntakeAnswerValue | undefined) => void;
  /** Called when the user presses Enter on a single-line input. */
  onAdvance: () => void;
  autoFocus?: boolean;
}

const useAutoFocus = (ref: React.RefObject<HTMLElement>, on: boolean) => {
  useEffect(() => {
    if (on) ref.current?.focus();
    // We deliberately depend only on `on` — refocus when the field changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
};

// ── text ────────────────────────────────────────────────────────────────────
export const TextField = ({ field, value, onChange, onAdvance, autoFocus }: FieldProps) => {
  const ref = useRef<HTMLInputElement>(null);
  useAutoFocus(ref, !!autoFocus);
  return (
    <input
      ref={ref}
      className="intake-input"
      type="text"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdvance(); } }}
      placeholder={field.helper ? '' : 'Type your answer'}
    />
  );
};

// ── longtext ────────────────────────────────────────────────────────────────
export const LongTextField = ({ field, value, onChange, onAdvance, autoFocus }: FieldProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoFocus(ref, !!autoFocus);
  return (
    <textarea
      ref={ref}
      className="intake-textarea"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onAdvance(); }
      }}
      rows={4}
      placeholder={field.helper ? '' : 'Type your answer (Cmd+Enter to continue)'}
    />
  );
};

// ── date ────────────────────────────────────────────────────────────────────
export const DateField = ({ value, onChange, onAdvance, autoFocus }: FieldProps) => {
  const ref = useRef<HTMLInputElement>(null);
  useAutoFocus(ref, !!autoFocus);
  return (
    <input
      ref={ref}
      className="intake-input intake-input-date"
      type="date"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdvance(); } }}
    />
  );
};

// ── select ──────────────────────────────────────────────────────────────────
export const SelectField = ({ field, value, onChange, onAdvance, autoFocus }: FieldProps) => {
  const ref = useRef<HTMLSelectElement>(null);
  useAutoFocus(ref, !!autoFocus);
  return (
    <select
      ref={ref}
      className="intake-select"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdvance(); } }}
    >
      <option value="" disabled>Choose an option…</option>
      {(field.options ?? []).map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
};

// ── radio ───────────────────────────────────────────────────────────────────
export const RadioField = ({ field, value, onChange }: FieldProps) => {
  // Storage: string when !hasOther, { value, other? } when hasOther.
  const selectedValue = typeof value === 'string'
    ? value
    : (value && typeof value === 'object' && 'value' in value ? value.value : '');
  const otherText = (value && typeof value === 'object' && 'other' in value) ? (value.other ?? '') : '';

  const pick = (optValue: string) => {
    if (field.hasOther) {
      onChange({ value: optValue, other: optValue === OTHER ? otherText : undefined });
    } else {
      onChange(optValue);
    }
  };

  const setOther = (next: string) => {
    onChange({ value: OTHER, other: next });
  };

  return (
    <div className="intake-options">
      {(field.options ?? []).map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`intake-option ${selectedValue === opt.value ? 'is-selected' : ''}`}
          onClick={() => pick(opt.value)}
        >
          <span className="intake-option-bullet" aria-hidden="true"/>
          <span className="intake-option-label">{opt.label}</span>
        </button>
      ))}
      {field.hasOther && (
        <button
          type="button"
          className={`intake-option ${selectedValue === OTHER ? 'is-selected' : ''}`}
          onClick={() => pick(OTHER)}
        >
          <span className="intake-option-bullet" aria-hidden="true"/>
          <span className="intake-option-label">Other</span>
        </button>
      )}
      {field.hasOther && selectedValue === OTHER && (
        <input
          className="intake-input intake-input-other"
          type="text"
          value={otherText}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Tell us a bit more…"
          autoFocus
        />
      )}
    </div>
  );
};

// ── multi ───────────────────────────────────────────────────────────────────
export const MultiField = ({ field, value, onChange }: FieldProps) => {
  // Storage: string[] when !hasOther, { values, other? } when hasOther.
  const selected: string[] = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' && 'values' in value ? value.values : []);
  const otherText = (value && typeof value === 'object' && 'other' in value) ? (value.other ?? '') : '';

  const setSelected = (nextValues: string[], nextOther = otherText) => {
    if (field.hasOther) {
      onChange({ values: nextValues, other: nextValues.includes(OTHER) ? nextOther : undefined });
    } else {
      onChange(nextValues);
    }
  };

  const toggle = (optValue: string) => {
    if (selected.includes(optValue)) {
      setSelected(selected.filter((v) => v !== optValue));
    } else {
      // Honour the cap (e.g. Q11 multiMax: 3). "None"-style options that share
      // a list with substantive ones don't count specially here — the schema
      // could explicitly model "exclusive" options later if needed.
      if (field.multiMax && selected.length >= field.multiMax) return;
      setSelected([...selected, optValue]);
    }
  };

  const setOther = (next: string) => {
    const values = selected.includes(OTHER) ? selected : [...selected, OTHER];
    setSelected(values, next);
  };

  const capped = field.multiMax ? selected.length >= field.multiMax : false;
  const hint = field.multiMax ? `Pick up to ${field.multiMax}.` : null;

  return (
    <div className="intake-options">
      {hint && <p className="intake-options-hint">{hint}</p>}
      {(field.options ?? []).map((opt) => {
        const isSelected = selected.includes(opt.value);
        const isDisabled = !isSelected && capped;
        return (
          <button
            key={opt.value}
            type="button"
            className={`intake-option ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
            onClick={() => !isDisabled && toggle(opt.value)}
            aria-pressed={isSelected}
            disabled={isDisabled}
          >
            <span className="intake-option-bullet intake-option-bullet--check" aria-hidden="true"/>
            <span className="intake-option-label">{opt.label}</span>
          </button>
        );
      })}
      {field.hasOther && (
        <button
          type="button"
          className={`intake-option ${selected.includes(OTHER) ? 'is-selected' : ''}`}
          onClick={() => toggle(OTHER)}
          aria-pressed={selected.includes(OTHER)}
        >
          <span className="intake-option-bullet intake-option-bullet--check" aria-hidden="true"/>
          <span className="intake-option-label">Other</span>
        </button>
      )}
      {field.hasOther && selected.includes(OTHER) && (
        <input
          className="intake-input intake-input-other"
          type="text"
          value={otherText}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Tell us a bit more…"
        />
      )}
    </div>
  );
};

export const FieldRenderer = (props: FieldProps) => {
  switch (props.field.type) {
    case 'text':     return <TextField {...props}/>;
    case 'longtext': return <LongTextField {...props}/>;
    case 'date':     return <DateField {...props}/>;
    case 'select':   return <SelectField {...props}/>;
    case 'radio':    return <RadioField {...props}/>;
    case 'multi':    return <MultiField {...props}/>;
  }
};
