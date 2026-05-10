// Public intake form orchestrator (Watercolor Glass redesign).
//
// Single self-contained surface for the parent-facing flow at `/welcome`.
// Step changes live in component state (not the URL) so the parent can
// refresh and resume via localStorage.
//
// State machine:
//   welcome → parent → question (× N) → review → thanks
//
// `flowQuestions` excludes the consent questions — those are presented as
// warm toggles on the review screen instead. The header shows three
// sectioned-mark progress pills, labelled in Aishat's voice.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  flowQuestions,
  extractIndexedFields,
  progressSectionFor,
  sectionLabelFor,
  type IntakeAnswerValue,
  type IntakeField,
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
import '../../styles/v2/intake.css';

const draftHasProgress = (d: IntakeDraft): boolean => {
  if (Object.keys(d.answers).length > 0) return true;
  if (d.parent.email || d.parent.name || d.parent.phone) return true;
  return d.step !== 'welcome';
};

/** Compute the section progress fraction within whichever progress section
 *  the field belongs to. Smooth fill across the questions in that section. */
function sectionProgressFraction(field: IntakeField): number {
  const section = progressSectionFor(field);
  const inSection = flowQuestions.filter((q) => progressSectionFor(q) === section);
  const positionInSection = inSection.findIndex((q) => q.id === field.id);
  if (positionInSection < 0 || inSection.length === 0) return 0;
  return (positionInSection + 1) / inSection.length;
}

/** Build a small "you were on" recap label from the field they last edited. */
function recapLabel(field: IntakeField | null): string | undefined {
  if (!field) return undefined;
  // Strip trailing punctuation and lowercase the first letter so it reads
  // as a sub-clause: "you were on 'how Iman approaches new things'".
  const lower = field.label.replace(/[?.…]+$/, '').trim();
  return lower.length > 60 ? lower.slice(0, 60).trim() + '…' : lower;
}

/** Frozen snapshot rendered on the thank-you screen. We capture this at submit
 *  time and clear the live draft so the next visit starts fresh — the screen
 *  the parent is on right now still reads from the snapshot. */
interface ThanksSnapshot {
  parentName?: string;
  childFirstName?: string;
  hobbiesSnippet?: string;
}

export const IntakeFlow = () => {
  const [draft, setDraft] = useState<IntakeDraft>(() => loadDraft());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [thanksSnapshot, setThanksSnapshot] = useState<ThanksSnapshot | null>(null);
  const isFirstRender = useRef(true);

  // Persist on every change, except the very first render — no point
  // round-tripping the loaded value back to the same key.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    saveDraft(draft);
  }, [draft]);

  // ── helpers ──
  const setStep = (step: IntakeStep) => setDraft((d) => ({ ...d, step }));
  const setQuestionIdx = (idx: number) => setDraft((d) => ({ ...d, currentQuestionIdx: idx }));
  const setAnswer = (id: string, value: IntakeAnswerValue | undefined) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value } }));
  const updateParent = (next: { email?: string; name?: string; phone?: string }) =>
    setDraft((d) => ({ ...d, parent: { ...d.parent, ...next } }));

  const begin = () => setDraft((d) => ({ ...d, step: 'parent', currentQuestionIdx: 0 }));
  const startOver = () => {
    clearDraft();
    setDraft({ step: 'welcome', currentQuestionIdx: 0, answers: {}, parent: {} });
    setSubmitError(null);
  };

  /** Pick the best step to land on when a parent says "pick up where I left off". */
  const resumeStep = (): IntakeStep => {
    if (draft.step === 'thanks') return 'welcome';
    if (draft.step !== 'welcome') return draft.step;
    // Prior session ended at welcome but answers/parent were collected — find
    // the next unanswered question, fall back to parent step if nothing.
    if (Object.keys(draft.answers).length > 0) return 'question';
    if (draft.parent.email) return 'question';
    return 'parent';
  };

  const onResume = () => {
    const next = resumeStep();
    if (next === 'question' && (!draft.parent.email)) {
      // No parent contact yet but answers exist — start at parent step.
      setStep('parent');
    } else {
      setStep(next);
    }
  };

  const goToQuestion = (idx: number) => {
    setDraft((d) => ({ ...d, step: 'question', currentQuestionIdx: idx }));
  };

  const nextFromQuestion = () => {
    if (draft.currentQuestionIdx >= flowQuestions.length - 1) {
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
    // Snapshot the bits the thank-you card needs BEFORE we clear the draft.
    const cn = typeof draft.answers['child_name'] === 'string' ? draft.answers['child_name'].trim().split(/\s+/)[0] : undefined;
    const hs = typeof draft.answers['hobbies'] === 'string' ? draft.answers['hobbies'].trim() : undefined;
    const snapshot: ThanksSnapshot = {
      parentName: draft.parent.name,
      childFirstName: cn || undefined,
      hobbiesSnippet: hs || undefined,
    };
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
      // Clear localStorage AND in-memory state. The thank-you screen reads
      // from the snapshot above, not the draft, so a refresh while sitting on
      // thanks doesn't carry the previous family's answers into a new visit.
      clearDraft();
      setThanksSnapshot(snapshot);
      setDraft({ step: 'thanks', currentQuestionIdx: 0, answers: {}, parent: {} });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── derived view state ──
  const currentField = draft.step === 'question' ? flowQuestions[draft.currentQuestionIdx] : null;
  const totalFlow = flowQuestions.length;

  const childFirstName = useMemo(() => {
    const cn = typeof draft.answers['child_name'] === 'string' ? draft.answers['child_name'] : '';
    return cn?.trim().split(/\s+/)[0] || undefined;
  }, [draft.answers]);

  const lastEditedField = useMemo<IntakeField | null>(() => {
    if (draft.step === 'question' && currentField) return currentField;
    if (draft.currentQuestionIdx >= 0 && draft.currentQuestionIdx < flowQuestions.length) {
      return flowQuestions[draft.currentQuestionIdx];
    }
    return null;
  }, [draft.step, draft.currentQuestionIdx, currentField]);

  return (
    <div className="intake-shell">
      <header className="intake-header">
        <a href="/" className="intake-brand-link" aria-label="Back to Acorns home">
          <span aria-hidden="true" className="intake-brand-arrow">←</span>
          <span className="intake-brand">Acorns Learning Centre</span>
        </a>
      </header>

      <main className="intake-main">
        {draft.step === 'welcome' && (
          <WelcomeStep
            hasDraft={draftHasProgress(draft)}
            draftAt={recapLabel(lastEditedField)}
            draftSnippet={
              childFirstName
                ? `${childFirstName}${
                    typeof draft.answers['year_group'] === 'string' && draft.answers['year_group']
                      ? `, ${draft.answers['year_group']}`
                      : ''
                  }${draft.parent.email ? `, ${draft.parent.email}` : ''}`
                : undefined
            }
            lastSavedAt={draft.savedAt}
            onBegin={begin}
            onResume={onResume}
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
            // Force a fresh component per question so internal state resets.
            key={currentField.id}
            field={currentField}
            value={draft.answers[currentField.id]}
            onChange={(next) => setAnswer(currentField.id, next)}
            onBack={backFromQuestion}
            onNext={nextFromQuestion}
            isLast={draft.currentQuestionIdx === totalFlow - 1}
            sectionFraction={sectionProgressFraction(currentField)}
            sectionLabel={sectionLabelFor(currentField)}
          />
        )}

        {draft.step === 'review' && (
          <ReviewStep
            draft={draft}
            submitting={submitting}
            submitError={submitError}
            childFirstName={childFirstName}
            onEditQuestion={goToQuestion}
            onEditParent={() => setStep('parent')}
            onAnswerChange={setAnswer}
            onSubmit={submit}
            onBack={() => goToQuestion(totalFlow - 1)}
          />
        )}

        {draft.step === 'thanks' && (
          <ThankYouStep
            parentName={thanksSnapshot?.parentName}
            childFirstName={thanksSnapshot?.childFirstName}
            hobbiesSnippet={thanksSnapshot?.hobbiesSnippet}
            onHome={() => { window.location.href = '/'; }}
          />
        )}
      </main>

    </div>
  );
};
