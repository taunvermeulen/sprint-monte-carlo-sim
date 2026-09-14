import { describe, expect, it } from 'vitest';
import { bindingCommitment, confidenceBand, diagnoseSizing } from '../src/domain/interpretation';
import type { Forecast, SeriesForecast } from '../src/domain/types';

const series = (probability: number, p85: number, target: number): SeriesForecast => ({
  target,
  probability,
  p50: p85,
  p75: p85,
  p85,
  p95: p85,
  samples: new Float64Array(0),
});

const forecast = (points: SeriesForecast, stories: SeriesForecast, sprintsAvailable = 10): Forecast => ({
  derived: {
    points: { mean: 0, stdDev: 0, count: 0, total: 0 },
    stories: { mean: 0, stdDev: 0, count: 0, total: 0 },
    autoStorySize: 0,
    storySize: 0,
    targetStories: stories.target,
    daysAvailable: 0,
    sprintsAvailable,
    sprintsUsed: 0,
    sprintsComplete: 0,
  },
  points,
  stories,
});

describe('confidenceBand', () => {
  it('splits at 85% and 50%', () => {
    expect(confidenceBand(0.9).level).toBe('safe');
    expect(confidenceBand(0.85).level).toBe('safe');
    expect(confidenceBand(0.6).level).toBe('probable');
    expect(confidenceBand(0.49).level).toBe('risk');
  });
});

describe('diagnoseSizing', () => {
  it('flags small stories when point odds lead', () => {
    expect(diagnoseSizing(forecast(series(0.9, 0, 1), series(0.4, 0, 1))).kind).toBe('points-ahead');
  });
  it('flags big stories when story odds lead', () => {
    expect(diagnoseSizing(forecast(series(0.4, 0, 1), series(0.9, 0, 1))).kind).toBe('stories-ahead');
  });
  it('calls close odds aligned', () => {
    expect(diagnoseSizing(forecast(series(0.8, 0, 1), series(0.7, 0, 1))).kind).toBe('aligned');
  });
  it('explains an empty schedule', () => {
    expect(diagnoseSizing(forecast(series(0, 0, 1), series(0, 0, 1), 0)).kind).toBe('no-sprints');
  });
});

describe('bindingCommitment', () => {
  it('picks the series whose P85 is lower relative to its target', () => {
    const c = bindingCommitment(forecast(series(0.9, 758, 684), series(0.9, 200, 212)));
    expect(c.series).toBe('stories');
    expect(c.delivered).toBe(200);
    expect(c.ratio).toBeCloseTo(200 / 212);
  });
  it('falls back to points on a tie', () => {
    expect(bindingCommitment(forecast(series(0.9, 100, 100), series(0.9, 50, 50))).series).toBe('points');
  });
});
