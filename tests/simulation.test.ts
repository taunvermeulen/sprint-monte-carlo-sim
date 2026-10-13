import { describe, expect, it } from 'vitest';
import { seededRng } from '../src/domain/random';
import { fractionBothHit, resampleTotals, runForecast } from '../src/domain/simulation';
import { mean } from '../src/domain/statistics';
import { DEFAULT_INPUTS } from '../src/state/defaults';
import type { CompleteSprint } from '../src/domain/types';

const history: CompleteSprint[] = [
  { name: 'A', points: 10, stories: 2 },
  { name: 'B', points: 20, stories: 4 },
  { name: 'C', points: 30, stories: 6 },
];

describe('resampleTotals', () => {
  it('returns zeros when there are no sprints to forecast', () => {
    const { points, stories } = resampleTotals(history, 0, 100, seededRng(1));
    expect(Array.from(points)).toEqual(new Array(100).fill(0));
    expect(Array.from(stories)).toEqual(new Array(100).fill(0));
  });

  it('returns zeros when there is no history to draw from', () => {
    const { points } = resampleTotals([], 5, 100, seededRng(1));
    expect(Array.from(points)).toEqual(new Array(100).fill(0));
  });

  it('only ever produces sums of observed sprints', () => {
    // Every total must be reachable by adding 4 values from {10, 20, 30}:
    // the minimum is 40, the maximum 120, and every total is a multiple of 10.
    const { points } = resampleTotals(history, 4, 2_000, seededRng(2));
    for (const total of points) {
      expect(total).toBeGreaterThanOrEqual(40);
      expect(total).toBeLessThanOrEqual(120);
      expect(total % 10).toBe(0);
    }
  });

  it('never invents a value outside the observed range (the bootstrap guarantee)', () => {
    const lopsided: CompleteSprint[] = [{ name: 'only', points: 7, stories: 1 }];
    const { points, stories } = resampleTotals(lopsided, 3, 500, seededRng(3));
    expect(new Set(points)).toEqual(new Set([21]));
    expect(new Set(stories)).toEqual(new Set([3]));
  });

  it('keeps points and stories paired within a trial', () => {
    // In this history stories are always points / 5, so every paired total must
    // hold that ratio. Independent draws would break it.
    const paired: CompleteSprint[] = [
      { name: 'A', points: 10, stories: 2 },
      { name: 'B', points: 50, stories: 10 },
    ];
    const { points, stories } = resampleTotals(paired, 6, 1_000, seededRng(4));
    for (let i = 0; i < points.length; i++) {
      expect(stories[i]).toBe(points[i] / 5);
    }
  });

  it('converges on the history mean as trials grow', () => {
    const sprints = 10;
    const { points } = resampleTotals(history, sprints, 50_000, seededRng(5));
    expect(mean(Array.from(points))).toBeCloseTo(sprints * 20, 0);
  });

  it('is reproducible with a seeded generator', () => {
    const a = resampleTotals(history, 5, 50, seededRng(9));
    const b = resampleTotals(history, 5, 50, seededRng(9));
    expect(Array.from(a.points)).toEqual(Array.from(b.points));
    expect(Array.from(a.stories)).toEqual(Array.from(b.stories));
  });
});

describe('fractionBothHit', () => {
  it('counts only trials where both targets are met', () => {
    const totals = {
      points: Float64Array.from([100, 100, 50, 50]),
      stories: Float64Array.from([20, 5, 20, 5]),
    };
    expect(fractionBothHit(totals, 100, 20)).toBe(0.25);
    expect(fractionBothHit(totals, 0, 0)).toBe(1);
    expect(fractionBothHit(totals, 200, 20)).toBe(0);
  });

  it('is 0 with no trials', () => {
    expect(fractionBothHit({ points: new Float64Array(0), stories: new Float64Array(0) }, 1, 1)).toBe(0);
  });
});

describe('runForecast', () => {
  it('orders the percentiles P95 <= P85 <= P75 <= P50', () => {
    const f = runForecast(DEFAULT_INPUTS, seededRng(5));
    for (const s of [f.points, f.stories]) {
      expect(s.p95).toBeLessThanOrEqual(s.p85);
      expect(s.p85).toBeLessThanOrEqual(s.p75);
      expect(s.p75).toBeLessThanOrEqual(s.p50);
      expect(s.samples).toHaveLength(DEFAULT_INPUTS.trials);
    }
  });

  it('returns sorted samples for each measure', () => {
    const f = runForecast(DEFAULT_INPUTS, seededRng(7));
    for (const s of [f.points, f.stories]) {
      for (let i = 1; i < s.samples.length; i++) {
        expect(s.samples[i]).toBeGreaterThanOrEqual(s.samples[i - 1]);
      }
    }
  });

  it('keeps probability in [0, 1] and reports 0 with no sprints', () => {
    const f = runForecast(DEFAULT_INPUTS, seededRng(6));
    expect(f.points.probability).toBeGreaterThanOrEqual(0);
    expect(f.points.probability).toBeLessThanOrEqual(1);

    const none = runForecast({ ...DEFAULT_INPUTS, targetDate: DEFAULT_INPUTS.startDate }, seededRng(6));
    expect(none.points.probability).toBe(0);
    expect(none.stories.probability).toBe(0);
    expect(none.bothProbability).toBe(0);
  });

  it('reports 0 when there is no usable history', () => {
    const empty = runForecast({ ...DEFAULT_INPUTS, sprints: [] }, seededRng(8));
    expect(empty.points.probability).toBe(0);
    expect(empty.bothProbability).toBe(0);
  });

  it('never rates both targets above either one alone', () => {
    const f = runForecast(DEFAULT_INPUTS, seededRng(11));
    expect(f.bothProbability).toBeLessThanOrEqual(f.points.probability);
    expect(f.bothProbability).toBeLessThanOrEqual(f.stories.probability);
  });

  it('beats the independent estimate, because the measures are correlated', () => {
    // Points and stories come from the same sprints, so they rise and fall
    // together; multiplying the two probabilities would understate the odds.
    const f = runForecast(DEFAULT_INPUTS, seededRng(12));
    expect(f.bothProbability).toBeGreaterThan(f.points.probability * f.stories.probability);
  });

  it('forecasts only from sprints inside the history window', () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      sprints: [
        { name: 'ancient', points: 1, stories: 1 },
        { name: 'recent A', points: 40, stories: 8 },
        { name: 'recent B', points: 40, stories: 8 },
      ],
      window: 2 as const,
      sizeMode: 'manual' as const,
      sizeOverride: 5,
    };
    const f = runForecast(inputs, seededRng(13));
    // With only 40-point sprints in the window every trial totals 40 x sprints.
    expect(f.points.p50).toBe(40 * f.derived.sprintsAvailable);
  });
});
