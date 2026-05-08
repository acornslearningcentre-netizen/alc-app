import { useState } from 'react';
import type { IntakeField, IntakeAnswerValue } from '../../data/intake-questions';
import { FieldRenderer, OTHER } from './IntakeFields';

interface Props {
  field: IntakeField;
  value: IntakeAnswerValue | undefined;
  onChange: (next: IntakeAnswerValue | undefined) => void;
  onBack: () => void;
  onNext: () => void;
  /** Show "Review your answers" instead of "Next" on the last question. */
  isLast: boolean;
}

const isAnswered = (field: IntakeField, value: IntakeAnswerValue | undefined): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    if ('value' in value) {
      const baseOk = typeof value.value === 'string' && value.value.length > 0;
      if (!baseOk) return false;
      // If they picked "Other", they need to type something.
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

export const QuestionStep = ({ field, value, onChange, onBack, onNext, isLast }: Props) => {
  const [touched, setTouched] = useState(false);
  const answered = isAnswered(field, value);
  const required = !!field.required;
  const blocked = required && !answered;
  const showError = touched && blocked;

  const advance = () => {
    setTouched(true);
    if (!blocked) onNext();
  };

  return (
    <div className="intake-stage">
      <div className={`intake-card ${field.emphasis === 'high' ? 'intake-card--emphasis' : ''}`}>
        <h2 className="intake-question">
          {field.label}
          {required && <span className="intake-required" aria-label="required"> *</span>}
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

        {showError && <p className="intake-error">This question needs an answer to continue.</p>}

        <div className="intake-actions intake-actions--row">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onBack}>Back</button>
          <button
            type="button"
            className="intake-btn intake-btn--primary"
            onClick={advance}
          >
            {isLast ? 'Review your answers' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
