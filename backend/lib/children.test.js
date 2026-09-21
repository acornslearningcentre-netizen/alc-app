import { describe, it, expect } from 'vitest';
import { parseJsonArray, parseChildRow, toJsonArrayColumn, canSeeChild } from './children.js';

describe('parseJsonArray', () => {
  it('parses a JSON array string', () => {
    expect(parseJsonArray('["reading","maths"]')).toEqual(['reading', 'maths']);
  });
  it('returns an empty array for null/undefined/empty string', () => {
    expect(parseJsonArray(null)).toEqual([]);
    expect(parseJsonArray(undefined)).toEqual([]);
    expect(parseJsonArray('')).toEqual([]);
  });
  it('returns an empty array for malformed or non-array JSON, never throws', () => {
    expect(parseJsonArray('not json')).toEqual([]);
    expect(parseJsonArray('{"a":1}')).toEqual([]);
  });
});

describe('parseChildRow', () => {
  it('turns the JSON-text columns into real arrays and leaves everything else untouched', () => {
    const row = {
      id: 1, name: 'Amara', dob: '2018-01-01', teacher_id: 3,
      focus: '["phonics"]', strengths: '["curiosity","maths"]', gaps: null, flags: '[]',
    };
    expect(parseChildRow(row)).toEqual({
      id: 1, name: 'Amara', dob: '2018-01-01', teacher_id: 3,
      focus: ['phonics'], strengths: ['curiosity', 'maths'], gaps: [], flags: [],
    });
  });
});

describe('toJsonArrayColumn', () => {
  it('JSON-encodes a real array', () => {
    expect(toJsonArrayColumn(['a', 'b'])).toBe('["a","b"]');
  });
  it('falls back to an empty array for anything that is not an array', () => {
    expect(toJsonArrayColumn(undefined)).toBe('[]');
    expect(toJsonArrayColumn(null)).toBe('[]');
    expect(toJsonArrayColumn('not an array')).toBe('[]');
  });
});

describe('canSeeChild', () => {
  it('lets a leader see any child', () => {
    expect(canSeeChild('leader', null, 5)).toBe(true);
    expect(canSeeChild('leader', 3, 5)).toBe(true);
  });
  it('lets a teacher see a child in their own class', () => {
    expect(canSeeChild('teacher', 3, 3)).toBe(true);
  });
  it('blocks a teacher from a child outside their class', () => {
    expect(canSeeChild('teacher', 3, 7)).toBe(false);
  });
  it('blocks an unlinked teacher (null teacher_id) even against an unassigned child', () => {
    expect(canSeeChild('teacher', null, null)).toBe(false);
  });
});
