import { describe, it, expect, beforeEach } from 'vitest';
import { loadDraft, saveDraft, clearDraft, type IntakeDraft } from './intake-storage';

describe('intake draft storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loadDraft returns a fresh empty draft when nothing is stored', () => {
    const draft = loadDraft();
    expect(draft).toEqual({
      step: 'welcome',
      currentQuestionIdx: 0,
      answers: {},
      parent: {},
    });
  });

  it('saveDraft then loadDraft round-trips the data', () => {
    const draft: IntakeDraft = {
      step: 'question',
      currentQuestionIdx: 3,
      answers: { hobbies: 'football, drawing' },
      parent: { email: 'parent@example.com', name: 'Ravi Shah' },
    };
    saveDraft(draft);
    const loaded = loadDraft();
    expect(loaded.step).toBe('question');
    expect(loaded.currentQuestionIdx).toBe(3);
    expect(loaded.answers).toEqual({ hobbies: 'football, drawing' });
    expect(loaded.parent).toEqual({ email: 'parent@example.com', name: 'Ravi Shah' });
  });

  it('saveDraft stamps a savedAt timestamp', () => {
    saveDraft({ step: 'welcome', currentQuestionIdx: 0, answers: {}, parent: {} });
    const loaded = loadDraft();
    expect(typeof loaded.savedAt).toBe('string');
    expect(() => new Date(loaded.savedAt as string)).not.toThrow();
  });

  it('clearDraft removes the saved draft', () => {
    saveDraft({ step: 'review', currentQuestionIdx: 5, answers: { a: '1' }, parent: {} });
    clearDraft();
    const loaded = loadDraft();
    expect(loaded.step).toBe('welcome');
    expect(loaded.answers).toEqual({});
  });

  it('loadDraft recovers gracefully from corrupt JSON instead of throwing', () => {
    window.localStorage.setItem('alc.intake.draft.v1', '{not valid json');
    const draft = loadDraft();
    expect(draft).toEqual({
      step: 'welcome',
      currentQuestionIdx: 0,
      answers: {},
      parent: {},
    });
  });

  it('loadDraft falls back to safe defaults for a partially-shaped stored value', () => {
    window.localStorage.setItem('alc.intake.draft.v1', JSON.stringify({ step: 'question' }));
    const draft = loadDraft();
    expect(draft.step).toBe('question');
    expect(draft.currentQuestionIdx).toBe(0);
    expect(draft.answers).toEqual({});
    expect(draft.parent).toEqual({});
  });
});
