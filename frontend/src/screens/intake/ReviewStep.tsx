// Review step (Watercolor Glass redesign).
//
// Aishat reviewing the parent's answers with them — not a CRM summary. The
// section headers carry her voice ("Here's what I've heard so far"), empty
// answers say "— not added, that's fine" rather than a silent dash, and the
// two GDPR consents are promoted out of the question loop into warm toggles
// at the bottom of this screen, each with a one-line plain-language
// explanation of what changes if you turn it off.

import {
  flowQuestions,
  type IntakeAnswerValue,
  type IntakeAnswers,
  type IntakeField,
} from '../../data/intake-questions';
import { OTHER } from './IntakeFields';
import type { IntakeDraft } from '../../lib/intake-storage';

interface Props {
  draft: IntakeDraft;
  submitting: boolean;
  submitError: string | null;
  childFirstName?: string;
  onEditQuestion: (idx: number) => void;
  onEditParent: () => void;
  onAnswerChange: (id: string, value: IntakeAnswerValue | undefined) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const labelForOption = (field: IntakeField, value: string): string => {
  if (value === OTHER) return 'Other';
  const opt = field.options?.find((o) => o.value === value);
  return opt?.label ?? value;
};

const formatAnswer = (field: IntakeField, value: IntakeAnswerValue | undefined): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();

  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    return value.map((v) => labelForOption(field, v)).join(', ');
  }

  if (typeof value === 'object') {
    if ('value' in value) {
      const main = labelForOption(field, value.value);
      if (value.value === OTHER && value.other) return `Other — ${value.other}`;
      return main;
    }
    if ('values' in value) {
      if (!value.values || value.values.length === 0) return '';
      const labels = value.values.map((v) => labelForOption(field, v));
      const out = labels.join(', ');
      if (value.values.includes(OTHER) && value.other) return `${out} (${value.other})`;
      return out;
    }
  }
  return '';
};

const isOn = (answers: IntakeAnswers, id: string): boolean => {
  const v = answers[id];
  if (typeof v === 'string') return v === 'yes';
  if (v && typeof v === 'object' && 'value' in v) return v.value === 'yes';
  return false;
};

interface SectionProps {
  title: string;
  rows: Array<{ field: IntakeField; idx: number }>;
  answers: IntakeAnswers;
  onEdit: (idx: number) => void;
}

const ReviewSection = ({ title, rows, answers, onEdit }: SectionProps) => {
  if (rows.length === 0) return null;
  return (
    <section className="intake-review-section">
      <header className="intake-review-section-head">
        <h3>{title}</h3>
        <span className="intake-review-section-count">{rows.length} {rows.length === 1 ? 'thing' : 'things'}</span>
      </header>
      <div className="intake-review-card">
        {rows.map(({ field, idx }) => {
          const formatted = formatAnswer(field, answers[field.id]);
          const empty = !formatted;
          return (
            <div className="review-row" key={field.id}>
              <div>
                <div className="review-q">{field.label}</div>
                <div className={`review-a ${empty ? 'empty' : ''}`}>
                  {empty ? <>&mdash; not added, that&rsquo;s fine</> : formatted}
                </div>
              </div>
              <button type="button" className="review-edit" onClick={() => onEdit(idx)}>Edit</button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const ReviewStep = ({
  draft,
  submitting,
  submitError,
  childFirstName,
  onEditQuestion,
  onEditParent,
  onAnswerChange,
  onSubmit,
  onBack,
}: Props) => {
  // Build the row groups from the same list IntakeFlow iterates (consent
  // questions are already excluded from flowQuestions — they render as
  // toggles below). idx is into flowQuestions, matching the orchestrator.
  const all = flowQuestions.map((field, idx) => ({ field, idx }));
  const childRows = all.filter(({ field }) => field.section === 1 || field.section === 2);
  const quietRows = all.filter(({ field }) => field.section === 3);

  const childTitle = childFirstName ? `About ${childFirstName}` : 'About your child';

  const notesOn = isOn(draft.answers, 'consent_notes');
  const mediaOn = isOn(draft.answers, 'consent_media');
  // We require the parent to consciously toggle each consent before submit
  // — even toggling-and-untoggling counts. This stops a parent submitting
  // by accident without acknowledging the data agreements.
  const consentsAcknowledged =
    draft.answers['consent_notes'] !== undefined && draft.answers['consent_media'] !== undefined;

  const toggleConsent = (id: 'consent_notes' | 'consent_media', next: boolean) => {
    onAnswerChange(id, next ? 'yes' : 'no');
  };

  return (
    <div className="intake-stage">
      <div className="intake-card intake-card--wide">
        <p className="intake-progress-label">A last look together</p>
        <h2 className="intake-headline">Here&rsquo;s what <em>I&rsquo;ve heard so far</em>.</h2>
        <p className="intake-lede">
          Take a moment. Edit anything that&rsquo;s not quite right &mdash; I&rsquo;d rather start with
          something honest than tidy.
        </p>

        {/* About you — parent contact, separate from the question loop. */}
        <section className="intake-review-section">
          <header className="intake-review-section-head">
            <h3>About you</h3>
            <button type="button" className="review-edit" onClick={onEditParent}>Edit</button>
          </header>
          <div className="intake-review-card">
            <div className="review-row">
              <div>
                <div className="review-q">Email</div>
                <div className={`review-a ${draft.parent.email ? '' : 'empty'}`}>{draft.parent.email || <>&mdash; not added, that&rsquo;s fine</>}</div>
              </div>
            </div>
            <div className="review-row">
              <div>
                <div className="review-q">Name</div>
                <div className={`review-a ${draft.parent.name ? '' : 'empty'}`}>{draft.parent.name || <>&mdash; not added, that&rsquo;s fine</>}</div>
              </div>
            </div>
            <div className="review-row">
              <div>
                <div className="review-q">Phone</div>
                <div className={`review-a ${draft.parent.phone ? '' : 'empty'}`}>{draft.parent.phone || <>&mdash; not added, that&rsquo;s fine</>}</div>
              </div>
            </div>
          </div>
        </section>

        <ReviewSection
          title={childTitle}
          rows={childRows}
          answers={draft.answers}
          onEdit={onEditQuestion}
        />
        <ReviewSection
          title="A few quieter things"
          rows={quietRows}
          answers={draft.answers}
          onEdit={onEditQuestion}
        />

        {/* GDPR consents — promoted to warm toggles. */}
        <section className="intake-review-section">
          <header className="intake-review-section-head">
            <h3>Two quiet permissions</h3>
          </header>
          <p className="intake-helper" style={{ marginBottom: 12 }}>
            You can change either of these any time after we begin.
          </p>
          <div className="intake-toggle-stack">
            <button
              type="button"
              role="switch"
              aria-checked={notesOn}
              className={`intake-toggle ${notesOn ? 'is-on' : ''}`}
              onClick={() => toggleConsent('consent_notes', !notesOn)}
            >
              <div>
                <div className="intake-toggle-title">Keep observation notes about {childFirstName || 'your child'}&rsquo;s sessions</div>
                <div className="intake-toggle-help">
                  So Aishat can see how they&rsquo;re growing across weeks. Without this, every
                  session starts from zero.
                </div>
              </div>
              <div className="intake-toggle-track" aria-hidden="true"/>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={mediaOn}
              className={`intake-toggle ${mediaOn ? 'is-on' : ''}`}
              onClick={() => toggleConsent('consent_media', !mediaOn)}
            >
              <div>
                <div className="intake-toggle-title">Photos / short videos for our internal records</div>
                <div className="intake-toggle-help">
                  Never marketing, never social media. Used only inside our team.
                </div>
              </div>
              <div className="intake-toggle-track" aria-hidden="true"/>
            </button>
          </div>
        </section>

        {submitError && <p className="intake-error intake-error--block">{submitError}</p>}

        <div className="intake-review-footer">
          <button
            type="button"
            className="intake-btn intake-btn--ghost"
            onClick={onBack}
            disabled={submitting}
          >
            Back
          </button>
          <span className="intake-actions-spacer" aria-hidden="true"/>
          <span className="intake-signature">I&rsquo;ll read this myself. &mdash; Aishat</span>
        </div>
        <button
          type="button"
          className="intake-btn intake-btn--primary"
          style={{ width: '100%', marginTop: 14 }}
          onClick={onSubmit}
          disabled={submitting || !consentsAcknowledged}
        >
          {submitting ? 'Sending…' : 'Send to Aishat'}
        </button>
      </div>
    </div>
  );
};
