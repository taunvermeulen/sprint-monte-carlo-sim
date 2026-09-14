import { describe, expect, it } from 'vitest';
import { parseSprintRows } from '../src/services/spreadsheetParser';

describe('parseSprintRows', () => {
  it('reads tab-separated name / points / stories and skips the header', () => {
    const rows = parseSprintRows('Sprint\tPoints\tStories\nSprint 2\t29\t10\nsprint 24 (M1 Due)\t21\t6\n');
    expect(rows).toEqual([
      { name: 'Sprint 2', points: 29, stories: 10 },
      { name: 'sprint 24 (M1 Due)', points: 21, stories: 6 },
    ]);
  });

  it('accepts comma-separated and number-only rows', () => {
    expect(parseSprintRows('29,10\n17, 5')).toEqual([
      { name: 'Sprint 1', points: 29, stories: 10 },
      { name: 'Sprint 2', points: 17, stories: 5 },
    ]);
  });

  it('splits single-space rows into name and numbers', () => {
    expect(parseSprintRows('sprint 12 24 7')).toEqual([{ name: 'sprint 12', points: 24, stories: 7 }]);
  });

  it('ignores blank lines and lines without two numbers', () => {
    expect(parseSprintRows('\n\nnotes only\nSprint 3\t17\n')).toEqual([]);
  });
});
