import {
  intakeQuestions,
  intakeSections,
  intakeSectionTitles,
  type IntakeAnswerValue,
  type IntakeField,
} from '../../data/intake-questions';
import { OTHER } from './IntakeFields';
import type { IntakeDraft } from '../../lib/intake-storage';

interface Props {
  draft: IntakeDraft;
  submitting: boolean;
  submitError: string | null;
  onEditQuestion: (idx: number) => void;
  onEditParent: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const labelForOption = (field: IntakeField, value: string): string => {
  if (value === OTHER) return 'Other';
  const opt = field.options?.find((o) => o.value === value);
  return opt?.label ?? value;
};

const formatAnswer = (field: IntakeField, value: IntakeAnswerValue | undefined): string => {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') return value.trim() || '—';

  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.map((v) => labelForOption(field, v)).join(', ');
  }

  if (typeof value === 'object') {
    if ('value' in value) {
      const main = labelForOption(field, value.value);
      if (value.value === OTHER && value.other) return `Other — ${value.other}`;
      return main;
    }
    if ('values' in value) {
      if (!value.values || value.values.length === 0) return '—';
      const labels = value.values.map((v) => labelForOption(field, v));
      const out = labels.join(', ');
      if (value.values.includes(OTHER) && value.other) return `${out} (${value.other})`;
      return out;
    }
  }
  return '—';
};

export const ReviewStep = ({
  draft, submitting, submitError, onEditQuestion, onEditParent, onSubmit, onBack,
}: Props) => {
  return (
    <div className="intake-stage">
      <div className="intake-card intake-card--wide">
        <p className="intake-eyebrow">Almost done</p>
        <h2 className="intake-question">Take a quick look</h2>
        <p className="intake-helper">
          Tap any answer to change it before you submit. Once you submit, we'll get back to you within a working day.
        </p>

        <section className="intake-review-section">
          <header className="intake-review-section-head">
            <h3>About you</h3>
            <button type="button" className="intake-btn intake-btn--text" onClick={onEditParent}>Edit</button>
          </header>
          <dl className="intake-review-list">
            <div className="intake-review-row">
              <dt>Email</dt>
              <dd>{draft.parent.email || '—'}</dd>
            </div>
            <div className="intake-review-row">
              <dt>Name</dt>
              <dd>{draft.parent.name || '—'}</dd>
            </div>
            <div className="intake-review-row">
              <dt>Phone</dt>
              <dd>{draft.parent.phone || '—'}</dd>
            </div>
          </dl>
        </section>

        {intakeSections.map((sectionNum) => {
          const sectionQuestions = intakeQuestions
            .map((q, idx) => ({ q, idx }))
            .filter(({ q }) => q.section === sectionNum);
          return (
            <section key={sectionNum} className="intake-review-section">
              <header className="intake-review-section-head">
                <h3>{intakeSectionTitles[sectionNum]}</h3>
              </header>
              <dl className="intake-review-list">
                {sectionQuestions.map(({ q, idx }) => (
                  <div key={q.id} className="intake-review-row">
                    <dt>{q.label}</dt>
                    <dd>
                      <span className="intake-review-answer">{formatAnswer(q, draft.answers[q.id])}</span>
                      <button
                        type="button"
                        className="intake-btn intake-btn--text intake-review-edit"
                        onClick={() => onEditQuestion(idx)}
                      >
                        Edit
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}

        {submitError && <p className="intake-error intake-error--block">{submitError}</p>}

        <div className="intake-actions intake-actions--row">
          <button
            type="button"
            className="intake-btn intake-btn--ghost"
            onClick={onBack}
            disabled={submitting}
          >
            Back
          </button>
          <button
            type="button"
            className="intake-btn intake-btn--primary"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};
