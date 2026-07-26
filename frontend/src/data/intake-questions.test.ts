import { describe, it, expect } from 'vitest';
import {
  sectionLabelFor, progressSectionFor, extractIndexedFields,
  type IntakeField, type IntakeAnswers,
} from './intake-questions';

const field = (overrides: Partial<IntakeField>): IntakeField => ({
  id: 'x', section: 1, label: 'Question?', type: 'text', ...overrides,
});

describe('sectionLabelFor', () => {
  it('gives the hobbies question its own emphasised label', () => {
    expect(sectionLabelFor(field({ id: 'hobbies', section: 2 })))
      .toBe('About your child · the most important question');
  });

  it('groups technology/routine questions under one label regardless of section', () => {
    expect(sectionLabelFor(field({ id: 'tech_comfort_parent', section: 1 })))
      .toBe('Routines & technology');
    expect(sectionLabelFor(field({ id: 'screen_boundaries', section: 1 })))
      .toBe('Routines & technology');
  });

  it('falls back to the section-based label for an ordinary question', () => {
    expect(sectionLabelFor(field({ id: 'child_name', section: 1 }))).toBe('About your child');
    expect(sectionLabelFor(field({ id: 'some_q', section: 3 }))).toBe('A few quieter things');
  });
});

describe('progressSectionFor', () => {
  it('maps schema sections 1 and 2 to progress section 2', () => {
    expect(progressSectionFor(field({ section: 1 }))).toBe(2);
    expect(progressSectionFor(field({ section: 2 }))).toBe(2);
  });

  it('maps schema section 3 to progress section 3', () => {
    expect(progressSectionFor(field({ section: 3 }))).toBe(3);
  });
});

describe('extractIndexedFields', () => {
  it('pulls the first name out of a full child name', () => {
    const answers: IntakeAnswers = { child_name: 'Amara Okonkwo' };
    expect(extractIndexedFields(answers).child_first_name).toBe('Amara');
  });

  it('reads scalar radio-style answers directly', () => {
    const answers: IntakeAnswers = { year_group: 'Year 3' };
    expect(extractIndexedFields(answers).year_group).toBe('Year 3');
  });

  it('reads the value out of a hasOther radio answer shape', () => {
    const answers: IntakeAnswers = { year_group: { value: 'Year 4', other: '' } };
    expect(extractIndexedFields(answers).year_group).toBe('Year 4');
  });

  it('flags flagged_needs true when diagnosed_needs has anything beyond "none"', () => {
    const withNeed: IntakeAnswers = { diagnosed_needs: ['dyslexia'] };
    expect(extractIndexedFields(withNeed).flagged_needs).toBe(true);

    const noneOnly: IntakeAnswers = { diagnosed_needs: ['none'] };
    expect(extractIndexedFields(noneOnly).flagged_needs).toBe(false);

    const empty: IntakeAnswers = {};
    expect(extractIndexedFields(empty).flagged_needs).toBe(false);
  });

  it('reads consent answers as booleans, true only for an explicit "yes"', () => {
    const answers: IntakeAnswers = { consent_notes: 'yes', consent_media: 'no' };
    const result = extractIndexedFields(answers);
    expect(result.consent_notes).toBe(true);
    expect(result.consent_media).toBe(false);
  });

  it('leaves fields undefined when nothing was answered', () => {
    const result = extractIndexedFields({});
    expect(result.child_first_name).toBeUndefined();
    expect(result.year_group).toBeUndefined();
    expect(result.consent_notes).toBe(false);
  });
});
