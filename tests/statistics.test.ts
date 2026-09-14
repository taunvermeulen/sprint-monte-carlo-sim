import { describe, expect, it } from 'vitest';
import { fractionAtLeast, mean, percentile, sampleStdDev } from '../src/domain/statistics';

describe('mean', () => {
  it('is 0 for no values', () => expect(mean([])).toBe(0));
  it('averages', () => expect(mean([42, 36, 45, 38, 41])).toBeCloseTo(40.4));
});

describe('sampleStdDev', () => {
  it('is 0 with fewer than two values', () => {
    expect(sampleStdDev([])).toBe(0);
    expect(sampleStdDev([7])).toBe(0);
  });
  it('matches spreadsheet STDEV (n − 1)', () => {
    expect(sampleStdDev([42, 36, 45, 38, 41])).toBeCloseTo(3.5071, 3);
  });
});

describe('percentile', () => {
  const sorted = [10, 20, 30, 40, 50];
  it('matches spreadsheet PERCENTILE (inclusive, interpolated)', () => {
    expect(percentile(sorted, 0)).toBe(10);
    expect(percentile(sorted, 1)).toBe(50);
    expect(percentile(sorted, 0.5)).toBe(30);
    expect(percentile(sorted, 0.1)).toBeCloseTo(14);
  });
  it('is 0 for no samples', () => expect(percentile([], 0.5)).toBe(0));
});

describe('fractionAtLeast', () => {
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  it('counts samples at or above the threshold', () => {
    expect(fractionAtLeast(sorted, 8)).toBe(0.3);
    expect(fractionAtLeast(sorted, 1)).toBe(1);
    expect(fractionAtLeast(sorted, 11)).toBe(0);
  });
  it('handles thresholds between samples', () => expect(fractionAtLeast(sorted, 7.5)).toBe(0.3));
});
