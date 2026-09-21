import { describe, it, expect } from 'vitest';
import { parseJsonArray, parseChildRow, toJsonArrayColumn } from './children.js';

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
