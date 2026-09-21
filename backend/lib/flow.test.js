import { describe, it, expect } from 'vitest';
import { canSeeFlowStep } from './flow.js';

describe('canSeeFlowStep', () => {
  it('lets a leader see any teacher\'s step', () => {
    expect(canSeeFlowStep('leader', null, 5)).toBe(true);
    expect(canSeeFlowStep('leader', 3, 5)).toBe(true);
  });
  it('lets a teacher see their own step', () => {
    expect(canSeeFlowStep('teacher', 3, 3)).toBe(true);
  });
  it('blocks a teacher from another teacher\'s step', () => {
    expect(canSeeFlowStep('teacher', 3, 7)).toBe(false);
  });
  it('blocks an unlinked teacher (null teacher_id)', () => {
    expect(canSeeFlowStep('teacher', null, null)).toBe(false);
  });
});
