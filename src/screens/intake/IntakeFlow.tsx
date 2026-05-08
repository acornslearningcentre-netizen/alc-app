// Public intake form orchestrator (Stories A2–A5).
//
// Single self-contained surface for the parent-facing flow. Routing is
// flat: this whole component is the body of `/welcome`, and step changes
// are kept in component state (not the URL) so the parent can refresh
// and pick up exactly where they left off via localStorage (A5).
//
// State machine:
//   welcome → parent → question (× 23) → review → thanks
//
// Back-links from review jump to a specific question by index.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  intakeQuestions,
  extractIndexedFields,
  type IntakeAnswerValue,
} from '../../data/intake-questions';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  type IntakeDraft,
  type IntakeStep,
} from '../../lib/intake-storage';
import { WelcomeStep } from './WelcomeStep';
import { ParentStep } from './ParentStep';
import { QuestionStep } from './QuestionStep';
import { ReviewStep } from './ReviewStep';
import { ThankYouStep } from './ThankYouStep';
import { ProgressBar } from './ProgressBar';
import '../../styles/v2/intake.css';

const draftHasProgress = (d: IntakeDraft): boolean => {
  if (Object.keys(d.answers).length > 0) return true;
  if (d.parent.email || d.parent.name || d.parent.phone) return true;
  return d.step !== 'welcome';
};

export const IntakeFlow = () => {
  const [draft, setDraft] = useState<IntakeDraft>(() => loadDraft());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Persist on every change, except the very first render — no point
  // round-tripping the loaded value back to the same key.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    saveDraft(draft);
  }, [draft]);

  // ── helpers (all stable identities for clarity, not memoised) ──
  const setStep = (step: IntakeStep) => setDraft((d) => ({ ...d, step }));
  const setQuestionIdx = (idx: number) => setDraft((d) => ({ ...d, currentQuestionIdx: idx }));
  const setAnswer = (id: string, value: IntakeAnswerValue | undefined) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value } }));
  const updateParent = (next: { email?: string; name?: string; phone?: string }) =>
    setDraft((d) => ({ ...d, parent: { ...d.parent, ...next } }));

  const begin = () => setDraft((d) => ({ ...d, step: 'parent', currentQuestionIdx: 0 }));
  const resume = () => {
    // If they resumed but were already at thanks (impossible — clearDraft on
    // submit), or had no real progress, snap to a sensible step.
    if (!draftHasProgress(draft)) begin();
  };
  const startOver = () => {
    clearDraft();
    setDraft({ step: 'welcome', currentQuestionIdx: 0, answers: {}, parent: {} });
    setSubmitError(null);
  };

  const goToQuestion = (idx: number) => {
    setDraft((d) => ({ ...d, step: 'question', currentQuestionIdx: idx }));
  };

  const nextFromQuestion = () => {
    if (draft.currentQuestionIdx >= intakeQuestions.length - 1) {
      setStep('review');
    } else {
      setQuestionIdx(draft.currentQuestionIdx + 1);
    }
  };
  const backFromQuestion = () => {
    if (draft.currentQuestionIdx <= 0) {
      setStep('parent');
    } else {
      setQuestionIdx(draft.currentQuestionIdx - 1);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const indexed = extractIndexedFields(draft.answers);
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_email: draft.parent.email,
          parent_name: draft.parent.name,
          parent_phone: draft.parent.phone,
          prospect: indexed,
          answers: draft.answers,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Sorry, we couldn\'t save your form. Please try again in a moment.');
      }
      // Successfully persisted — clear the draft so a refresh shows the
      // welcome screen and doesn't tempt a second submission.
      clearDraft();
      setDraft((d) => ({ ...d, step: 'thanks' }));
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── derived view state ──────────────────────────────────────────────────
  const totalQ = intakeQuestions.length;
  const currentField = draft.step === 'question' ? intakeQuestions[draft.currentQuestionIdx] : null;
  const childFirstName = useMemo(() => {
    const cn = typeof draft.answers['child_name'] === 'string' ? draft.answers['child_name'] : '';
    return cn?.trim().split(/\s+/)[0] || undefined;
  }, [draft.answers]);

  const progressFraction =
    draft.step === 'welcome' ? 0
    : draft.step === 'parent' ? 0.02
    : draft.step === 'question' ? (draft.currentQuestionIdx + 1) / (totalQ + 1)
    : draft.step === 'review' ? 0.97
    : 1;

  return (
    <div className="intake-shell">
      {draft.step !== 'welcome' && draft.step !== 'thanks' && (
        <header className="intake-header">
          <span className="intake-brand">Acorns Learning Centre</span>
          <ProgressBar
            fraction={progressFraction}
            section={currentField?.section}
          />
        </header>
      )}

      <main className="intake-main">
        {draft.step === 'welcome' && (
          <WelcomeStep
            hasDraft={draftHasProgress(draft)}
            onBegin={begin}
            onResume={() => {
              // Land them at whichever step the draft is at, defaulting to parent.
              if (draft.step === 'welcome') resume();
            }}
            onStartOver={startOver}
          />
        )}

        {draft.step === 'parent' && (
          <ParentStep
            email={draft.parent.email ?? ''}
            name={draft.parent.name ?? ''}
            phone={draft.parent.phone ?? ''}
            onChange={updateParent}
            onBack={() => setStep('welcome')}
            onNext={() => setDraft((d) => ({ ...d, step: 'question', currentQuestionIdx: 0 }))}
          />
        )}

        {draft.step === 'question' && currentField && (
          <QuestionStep
            // Force a fresh component per question so internal state (touched, refs) resets.
            key={currentField.id}
            field={currentField}
            value={draft.answers[currentField.id]}
            onChange={(next) => setAnswer(currentField.id, next)}
            onBack={backFromQuestion}
            onNext={nextFromQuestion}
            isLast={draft.currentQuestionIdx === totalQ - 1}
          />
        )}

        {draft.step === 'review' && (
          <ReviewStep
            draft={draft}
            submitting={submitting}
            submitError={submitError}
            onEditQuestion={goToQuestion}
            onEditParent={() => setStep('parent')}
            onSubmit={submit}
            onBack={() => goToQuestion(totalQ - 1)}
          />
        )}

        {draft.step === 'thanks' && (
          <ThankYouStep
            parentName={draft.parent.name}
            childFirstName={childFirstName}
          />
        )}
      </main>
    </div>
  );
};
