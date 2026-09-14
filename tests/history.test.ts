import { describe, expect, it } from 'vitest';
import { daysBetween, deriveInputs, windowedSprints } from '../src/domain/history';
import type { ForecastInputs } from '../src/domain/types';

const sprint = (points: number | null, stories: number | null, name = 'S') => ({ name, points, stories });

const inputs: ForecastInputs = {
  sprints: [sprint(29, 10), sprint(17, 5), sprint(21, 7), sprint(null, 4), sprint(28, 8)],
  window: 'all',
  startDate: '2026-02-26',
  targetDate: '2026-11-18',
  sprintDays: 7,
  targetPoints: 684,
  sizeMode: 'auto',
  sizeOverride: 5,
  trials: 1000,
};

describe('windowedSprints', () => {
  it('drops incomplete rows', () => expect(windowedSprints(inputs.sprints, 'all')).toHaveLength(4));
  it('keeps the most recent N complete rows', () => {
    expect(windowedSprints(inputs.sprints, 2).map((s) => s.points)).toEqual([21, 28]);
  });
});

describe('daysBetween', () => {
  it('counts calendar days', () => expect(daysBetween('2026-02-26', '2026-11-18')).toBe(265));
  it('is 0 for an unreadable date', () => expect(daysBetween('nope', '2026-11-18')).toBe(0));
});

describe('deriveInputs', () => {
  it('reproduces the spreadsheet: 37 weekly sprints, auto story size, floored scope', () => {
    const d = deriveInputs(inputs);
    expect(d.sprintsAvailable).toBe(37);
    expect(d.autoStorySize).toBeCloseTo(95 / 30);
    expect(d.targetStories).toBe(Math.floor(684 / (95 / 30)));
    expect(d.sprintsUsed).toBe(4);
    expect(d.sprintsComplete).toBe(4);
  });

  it('uses the manual story size when chosen', () => {
    const d = deriveInputs({ ...inputs, sizeMode: 'manual', sizeOverride: 4 });
    expect(d.storySize).toBe(4);
    expect(d.targetStories).toBe(171);
  });

  it('never returns negative sprints', () => {
    expect(deriveInputs({ ...inputs, targetDate: '2026-01-01' }).sprintsAvailable).toBe(0);
  });

  it('respects the sprint length', () => {
    expect(deriveInputs({ ...inputs, sprintDays: 14 }).sprintsAvailable).toBe(18);
  });
});
