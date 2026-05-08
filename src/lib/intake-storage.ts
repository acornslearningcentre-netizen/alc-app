// localStorage persistence for the public intake form (Story A5).
//
// Saves the parent's progress under a single versioned key so a refresh,
// accidental tab close, or browser crash doesn't lose their answers. The
// key is bumped (`v1` → `v2`) when the stored shape changes incompatibly,
// at which point the loader returns null and the parent starts fresh —
// safer than silently mis-rendering a stale draft against a new schema.

import type { IntakeAnswers } from '../data/intake-questions';

const KEY = 'alc.intake.draft.v1';

export type IntakeStep = 'welcome' | 'parent' | 'question' | 'review' | 'thanks';

export interface IntakeDraft {
  step: IntakeStep;
  /** Index into intakeQuestions[] when step === 'question'. */
  currentQuestionIdx: number;
  answers: IntakeAnswers;
  parent: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

const emptyDraft = (): IntakeDraft => ({
  step: 'welcome',
  currentQuestionIdx: 0,
  answers: {},
  parent: {},
});

export function loadDraft(): IntakeDraft {
  if (typeof window === 'undefined') return emptyDraft();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<IntakeDraft>;
    return {
      step: parsed.step ?? 'welcome',
      currentQuestionIdx: typeof parsed.currentQuestionIdx === 'number' ? parsed.currentQuestionIdx : 0,
      answers: (parsed.answers && typeof parsed.answers === 'object') ? parsed.answers : {},
      parent: (parsed.parent && typeof parsed.parent === 'object') ? parsed.parent : {},
    };
  } catch {
    // Corrupt storage — start fresh rather than blow up the form.
    return emptyDraft();
  }
}

export function saveDraft(draft: IntakeDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Quota exhausted or storage disabled — fail silently. The form
    // still works in-memory; the parent just loses refresh-safety.
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
