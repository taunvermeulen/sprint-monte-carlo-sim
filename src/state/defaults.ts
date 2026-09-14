import type { ForecastInputs } from '../domain/types';

/** A worked example so the app opens showing what it does. Replace via paste or import. */
export const DEFAULT_INPUTS: ForecastInputs = {
  sprints: [
    ['Sprint 1', 42, 9],
    ['Sprint 2', 36, 7],
    ['Sprint 3', 45, 10],
    ['Sprint 4', 38, 8],
    ['Sprint 5', 41, 8],
    ['Sprint 6', 39, 9],
    ['Sprint 7', 44, 8],
    ['Sprint 8', 35, 7],
  ].map(([name, points, stories]) => ({ name: String(name), points: Number(points), stories: Number(stories) })),
  window: 'all',
  startDate: '2026-03-04',
  targetDate: '2026-06-24',
  sprintDays: 14,
  targetPoints: 300,
  sizeMode: 'auto',
  sizeOverride: 5,
  trials: 1000,
};
