// Single-question screen (Watercolor Glass redesign).
//
// Renders one IntakeField at a time, with section-level progress at the top
// and a soft listening indicator in the bottom bar ("Saved on this device"
// or "X noted" for multi-selects). Questions flagged emphasis: 'high' render
// inside the hobbies-card with a Moss-dot pulse mark — earned weight via
// composition, not a different colour.

import { useState } from 'react';
import type { IntakeField, IntakeAnswerValue } from '../../data/intake-questions';
import { FieldRenderer, OTHER } from './IntakeFields';
import { ProgressBar } from './ProgressBar';

interface Props {
  field: IntakeField;
  value: IntakeAnswerValue | undefined;
  onChange: (next: IntakeAnswerValue | undefined) => void;
  onBack: () => void;
  onNext: () => void;
  /** Show "Review your answers" instead of "Next" on the last question. */
  isLast: boolean;
  /** Section progress at the top of the card. */
  sectionFraction: number;
  /** Section label — "About you · so we can stay in touch" etc. */
  sectionLabel?: string;
}

const isAnswered = (field: IntakeField, value: IntakeAnswerValue | undefined): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    if ('value' in value) {
      const baseOk = typeof value.value === 'string' && value.value.length > 0;
      if (!baseOk) return false;
      if (field.hasOther && value.value === OTHER) {
        return typeof value.other === 'string' && value.other.trim().length > 0;
      }
      return true;
    }
    if ('values' in value) {
      const baseOk = Array.isArray(value.values) && value.values.length > 0;
      if (!baseOk) return false;
      if (field.hasOther && value.values.includes(OTHER)) {
        return typeof value.other === 'string' && value.other.trim().length > 0;
      }
      return true;
    }
  }
  return false;
};

const multiCount = (value: IntakeAnswerValue | undefined): number => {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object' && 'values' in value && Array.isArray(value.values)) return value.values.length;
  return 0;
};

const isHighEmphasis = (field: IntakeField) => field.emphasis === 'high';

export const QuestionStep = ({
  field,
  value,
  onChange,
  onBack,
  onNext,
  isLast,
  sectionFraction,
  sectionLabel,
}: Props) => {
  const [touched, setTouched] = useState(false);
  const answered = isAnswered(field, value);
  const required = !!field.required;
  const blocked = required && !answered;
  const showError = touched && blocked;

  const advance = () => {
    setTouched(true);
    if (!blocked) onNext();
  };

  const cardClass = isHighEmphasis(field) ? 'hobbies-card' : 'intake-card';

  // Listening text: live count for multi-select, gentle "saved" for everything else.
  const listeningText =
    field.type === 'multi'
      ? (multiCount(value) > 0 ? `${multiCount(value)} noted` : 'Saved on this device')
      : 'Saved on this device';

  // Starter chips for longtext fields that ship a starters array (today: hobbies).
  const showStarters = field.type === 'longtext' && Array.isArray(field.starters) && field.starters.length > 0;
  const currentText = typeof value === 'string' ? value : '';
  const addStarter = (starter: string) => {
    const lower = currentText.toLowerCase();
    if (lower.includes(starter.toLowerCase())) return; // already mentioned
    const next = currentText.trim() ? `${currentText.trim()}, ${starter}` : starter;
    onChange(next);
  };

  return (
    <div className="intake-stage">
      <div className={cardClass}>
        <ProgressBar
          section={field.section}
          fraction={sectionFraction}
          label={sectionLabel}
        />

        {isHighEmphasis(field) && (
          <div className="hobbies-mark" style={{ marginTop: 18 }}>
            <span className="hobbies-dot" aria-hidden="true"/>
            Aishat will read this carefully
          </div>
        )}

        <h2 className={`intake-question ${isHighEmphasis(field) ? 'intake-question--hero' : ''}`}>
          {field.label}
          {required && <span className="intake-required-mark" aria-label="required"> ·</span>}
        </h2>
        {field.helper && <p className="intake-helper">{field.helper}</p>}

        <div className="intake-field-wrap">
          <FieldRenderer
            field={field}
            value={value}
            onChange={(next) => { onChange(next); if (touched) setTouched(false); }}
            onAdvance={advance}
            autoFocus
          />
        </div>

        {showStarters && (
          <div>
            <p className="intake-fineprint" style={{ marginBottom: 8 }}>Or tap a starter:</p>
            <div className="intake-chip-row">
              {field.starters!.map((starter) => {
                const inUse = currentText.toLowerCase().includes(starter.toLowerCase());
                return (
                  <button
                    key={starter}
                    type="button"
                    className={`intake-chip ${inUse ? 'is-added' : ''}`}
                    onClick={() => addStarter(starter)}
                    aria-pressed={inUse}
                  >
                    {starter}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showError && <p className="intake-error">This question needs an answer to continue.</p>}

        <div className="intake-actions intake-actions--row">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onBack}>Back</button>
          <span className="intake-listening" aria-live="polite">
            <span className="dot" aria-hidden="true"/> {listeningText}
          </span>
          <span className="intake-actions-spacer" aria-hidden="true"/>
          <button type="button" className="intake-btn intake-btn--primary" onClick={advance}>
            {isLast ? 'Review my answers' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
