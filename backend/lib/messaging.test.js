import { describe, it, expect } from 'vitest';
import { canSeeThread } from './messaging.js';

const thread = { teacher_id: 3, child_id: 2 };

describe('canSeeThread', () => {
  it('lets a leader see any thread', () => {
    expect(canSeeThread('leader', null, null, thread)).toBe(true);
  });

  it('lets a teacher see a thread for their own class', () => {
    expect(canSeeThread('teacher', 3, null, thread)).toBe(true);
  });

  it('blocks a teacher from another teacher\'s thread', () => {
    expect(canSeeThread('teacher', 7, null, thread)).toBe(false);
  });

  it('blocks an unlinked teacher (null teacher_id)', () => {
    expect(canSeeThread('teacher', null, null, thread)).toBe(false);
  });

  it('lets a parent see their own child\'s thread', () => {
    expect(canSeeThread('parent', null, 2, thread)).toBe(true);
  });

  it('blocks a parent from another family\'s thread', () => {
    expect(canSeeThread('parent', null, 9, thread)).toBe(false);
  });

  it('blocks an unlinked parent (null child_id)', () => {
    expect(canSeeThread('parent', null, null, thread)).toBe(false);
  });

  it('blocks any other role', () => {
    expect(canSeeThread('student', null, null, thread)).toBe(false);
  });
});
