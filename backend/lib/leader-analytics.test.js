import { describe, it, expect } from 'vitest';
import { bucketMasteryDistribution, detectPatterns } from './leader-analytics.js';

describe('bucketMasteryDistribution', () => {
  it('buckets children into exceeding/meeting/needsSupport by real thresholds', () => {
    const children = [
      { mastery: 80 }, { mastery: 75 }, { mastery: 70 }, { mastery: 60 }, { mastery: 40 },
    ];
    expect(bucketMasteryDistribution(children)).toEqual({ exceeding: 2, meeting: 2, needsSupport: 1 });
  });

  it('excludes children with no mastery yet, rather than counting them as needing support', () => {
    const children = [{ mastery: null }, { mastery: undefined }, { mastery: 80 }];
    expect(bucketMasteryDistribution(children)).toEqual({ exceeding: 1, meeting: 0, needsSupport: 0 });
  });

  it('returns all-zero buckets for an empty school', () => {
    expect(bucketMasteryDistribution([])).toEqual({ exceeding: 0, meeting: 0, needsSupport: 0 });
  });
});

describe('detectPatterns', () => {
  const baseChild = { id: 1, name: 'Amara', teacherName: 'Ana', mastery: 50, previousMastery: 60, trend: 'steady', flags: [] };

  it('flags a child with a real declining trend', () => {
    const patterns = detectPatterns({ children: [{ ...baseChild, trend: 'down' }], cohorts: [], schoolAvgMastery: 50 });
    expect(patterns).toEqual([
      { type: 'declining_mastery', severity: 'watch', childId: 1, childName: 'Amara', teacherName: 'Ana', mastery: 50, previousMastery: 60 },
    ]);
  });

  it('surfaces a child with a real improving trend as positive', () => {
    const patterns = detectPatterns({ children: [{ ...baseChild, trend: 'up' }], cohorts: [], schoolAvgMastery: 50 });
    expect(patterns[0]).toMatchObject({ type: 'improving_mastery', severity: 'positive' });
  });

  it('does not flag a steady/flat trend', () => {
    expect(detectPatterns({ children: [{ ...baseChild, trend: 'steady' }], cohorts: [], schoolAvgMastery: 50 })).toEqual([]);
    expect(detectPatterns({ children: [{ ...baseChild, trend: 'flat' }], cohorts: [], schoolAvgMastery: 50 })).toEqual([]);
  });

  it('surfaces a child with real manually-set flags', () => {
    const patterns = detectPatterns({ children: [{ ...baseChild, flags: ['SENCO referral'] }], cohorts: [], schoolAvgMastery: 50 });
    expect(patterns[0]).toMatchObject({ type: 'flagged_child', flags: ['SENCO referral'] });
  });

  it('flags a cohort meaningfully below the school average', () => {
    const cohorts = [{ teacherId: 2, teacherName: 'Priya', avgMastery: 35 }];
    const patterns = detectPatterns({ children: [], cohorts, schoolAvgMastery: 50 });
    expect(patterns).toEqual([
      { type: 'cohort_below_average', severity: 'watch', teacherId: 2, teacherName: 'Priya', avgMastery: 35, schoolAvgMastery: 50 },
    ]);
  });

  it('does not flag a cohort only slightly below average', () => {
    const cohorts = [{ teacherId: 2, teacherName: 'Priya', avgMastery: 45 }];
    expect(detectPatterns({ children: [], cohorts, schoolAvgMastery: 50 })).toEqual([]);
  });

  it('skips cohorts with no mastery data yet', () => {
    const cohorts = [{ teacherId: 2, teacherName: 'Priya', avgMastery: null }];
    expect(detectPatterns({ children: [], cohorts, schoolAvgMastery: 50 })).toEqual([]);
  });

  it('flags no cohorts when there is no school average yet', () => {
    const cohorts = [{ teacherId: 2, teacherName: 'Priya', avgMastery: 10 }];
    expect(detectPatterns({ children: [], cohorts, schoolAvgMastery: null })).toEqual([]);
  });
});
