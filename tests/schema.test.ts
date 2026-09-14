import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../src/state/defaults';
import { normalizeInputs } from '../src/state/schema';

describe('normalizeInputs', () => {
  it('returns defaults for garbage', () => {
    expect(normalizeInputs(undefined)).toEqual(DEFAULT_INPUTS);
    expect(normalizeInputs('nope')).toEqual(DEFAULT_INPUTS);
    expect(normalizeInputs([1, 2, 3])).toEqual(DEFAULT_INPUTS);
  });

  it('accepts object and tuple sprint rows', () => {
    const out = normalizeInputs({ sprints: [{ name: 'A', points: '12', stories: 3 }, ['B', 7, null], 'junk'] });
    expect(out.sprints).toEqual([
      { name: 'A', points: 12, stories: 3 },
      { name: 'B', points: 7, stories: null },
      { name: 'Sprint 3', points: null, stories: null },
    ]);
  });

  it('keeps only known option values', () => {
    const out = normalizeInputs({ window: 4, sprintDays: 10, trials: 999, sizeMode: 'weird' });
    expect(out.window).toBe(DEFAULT_INPUTS.window);
    expect(out.sprintDays).toBe(DEFAULT_INPUTS.sprintDays);
    expect(out.trials).toBe(DEFAULT_INPUTS.trials);
    expect(out.sizeMode).toBe('auto');
    expect(normalizeInputs({ window: 5, sprintDays: 14, trials: 5000, sizeMode: 'manual' })).toMatchObject({
      window: 5,
      sprintDays: 14,
      trials: 5000,
      sizeMode: 'manual',
    });
  });

  it('validates dates and clamps numbers', () => {
    const out = normalizeInputs({ startDate: '26/02/2026', targetDate: '2026-11-18', targetPoints: -5, sizeOverride: 0 });
    expect(out.startDate).toBe(DEFAULT_INPUTS.startDate);
    expect(out.targetDate).toBe('2026-11-18');
    expect(out.targetPoints).toBe(0);
    expect(out.sizeOverride).toBe(DEFAULT_INPUTS.sizeOverride);
  });

  it('truncates long names', () => {
    expect(normalizeInputs({ sprints: [{ name: 'x'.repeat(100), points: 1, stories: 1 }] }).sprints[0].name).toHaveLength(60);
  });
});
