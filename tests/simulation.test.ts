import { describe, expect, it } from 'vitest';
import { seededRng } from '../src/domain/random';
import { runForecast, simulateDelivery } from '../src/domain/simulation';
import { mean, sampleStdDev } from '../src/domain/statistics';
import { DEFAULT_INPUTS } from '../src/state/defaults';

describe('simulateDelivery', () => {
  it('returns zeros when no sprints are available', () => {
    const samples = simulateDelivery({ mean: 20, stdDev: 5, count: 10, total: 200 }, 0, 100, seededRng(1));
    expect(Array.from(samples)).toEqual(new Array(100).fill(0));
  });

  it('is sorted ascending', () => {
    const samples = simulateDelivery({ mean: 20, stdDev: 5, count: 10, total: 200 }, 10, 500, seededRng(2));
    for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
  });

  it('follows N(n·mean, √n·sd)', () => {
    const n = 16;
    const samples = simulateDelivery({ mean: 20, stdDev: 4, count: 10, total: 200 }, n, 20_000, seededRng(3));
    const values = Array.from(samples);
    expect(mean(values)).toBeCloseTo(n * 20, 0);
    expect(sampleStdDev(values)).toBeCloseTo(Math.sqrt(n) * 4, 0);
  });

  it('never delivers negative work', () => {
    const samples = simulateDelivery({ mean: 1, stdDev: 50, count: 5, total: 5 }, 1, 2_000, seededRng(4));
    expect(samples[0]).toBe(0);
  });

  it('is reproducible with a seeded generator', () => {
    const a = simulateDelivery({ mean: 20, stdDev: 5, count: 10, total: 200 }, 5, 50, seededRng(9));
    const b = simulateDelivery({ mean: 20, stdDev: 5, count: 10, total: 200 }, 5, 50, seededRng(9));
    expect(Array.from(a)).toEqual(Array.from(b));
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

  it('keeps probability in [0, 1] and reports 0 with no sprints', () => {
    const f = runForecast(DEFAULT_INPUTS, seededRng(6));
    expect(f.points.probability).toBeGreaterThanOrEqual(0);
    expect(f.points.probability).toBeLessThanOrEqual(1);
    const none = runForecast({ ...DEFAULT_INPUTS, targetDate: DEFAULT_INPUTS.startDate }, seededRng(6));
    expect(none.points.probability).toBe(0);
    expect(none.stories.probability).toBe(0);
  });
});
