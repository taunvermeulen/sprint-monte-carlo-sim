/** One row of sprint history. `null` means the cell is still empty. */
export interface Sprint {
  name: string;
  points: number | null;
  stories: number | null;
}

/** A sprint with both measures filled in — the only kind the model uses. */
export interface CompleteSprint {
  name: string;
  points: number;
  stories: number;
}

/** How much history feeds the model: every complete sprint, or the last N. */
export type HistoryWindow = 'all' | number;

export type StorySizeMode = 'auto' | 'manual';

/** Everything the user controls. This is the persisted, shareable document. */
export interface ForecastInputs {
  sprints: Sprint[];
  window: HistoryWindow;
  /** ISO calendar date, yyyy-mm-dd. */
  startDate: string;
  /** ISO calendar date, yyyy-mm-dd. */
  targetDate: string;
  sprintDays: number;
  targetPoints: number;
  sizeMode: StorySizeMode;
  /** Points per story when `sizeMode` is `manual`. */
  sizeOverride: number;
  trials: number;
}

export interface SeriesStats {
  mean: number;
  /** Sample standard deviation (n − 1). */
  stdDev: number;
  count: number;
  total: number;
}

/** Figures computed from the inputs before any dice are rolled. */
export interface DerivedInputs {
  points: SeriesStats;
  stories: SeriesStats;
  /** Total points ÷ total stories over the history window. */
  autoStorySize: number;
  /** The story size actually used (auto or manual). */
  storySize: number;
  targetStories: number;
  daysAvailable: number;
  sprintsAvailable: number;
  /** How many sprints fed the statistics vs. how many were complete. */
  sprintsUsed: number;
  sprintsComplete: number;
}

/** Simulation outcome for one measure (points or stories). */
export interface SeriesForecast {
  target: number;
  /** Share of trials that delivered at least `target`. */
  probability: number;
  p50: number;
  p75: number;
  p85: number;
  p95: number;
  /** Every trial's delivered amount, sorted ascending. */
  samples: Float64Array;
}

export interface Forecast {
  derived: DerivedInputs;
  points: SeriesForecast;
  stories: SeriesForecast;
}
