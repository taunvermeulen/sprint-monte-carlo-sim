import { describe, expect, it } from 'vitest';
import { binSamples, niceTicks } from '../src/ui/histogram';

describe('niceTicks', () => {
  it('lands on round numbers inside the range', () => {
    const ticks = niceTicks(713, 892, 6);
    expect(ticks[0]).toBeGreaterThanOrEqual(713);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(892);
    expect(ticks.length).toBeLessThanOrEqual(7);
    ticks.forEach((t) => expect(t % 25).toBe(0));
  });
  it('handles an empty span', () => expect(niceTicks(5, 5, 6)).toEqual([5]));
});

describe('binSamples', () => {
  it('counts every sample into a bin, clamping the edges', () => {
    const counts = binSamples(new Float64Array([0, 1, 2, 3, 9, 10]), 0, 10, 5);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(6);
    expect(counts[0]).toBe(2);
    expect(counts[4]).toBe(2);
  });
});
