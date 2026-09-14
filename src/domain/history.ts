import type {
  CompleteSprint,
  DerivedInputs,
  ForecastInputs,
  HistoryWindow,
  SeriesStats,
  Sprint,
} from './types';
import { mean, sampleStdDev } from './statistics';

const MS_PER_DAY = 86_400_000;

export function isComplete(sprint: Sprint): sprint is CompleteSprint {
  return Number.isFinite(sprint.points) && Number.isFinite(sprint.stories);
}

export function completeSprints(sprints: readonly Sprint[]): CompleteSprint[] {
  return sprints.filter(isComplete);
}

/** The complete sprints that fall inside the history window (most recent last). */
export function windowedSprints(sprints: readonly Sprint[], window: HistoryWindow): CompleteSprint[] {
  const complete = completeSprints(sprints);
  return window === 'all' ? complete : complete.slice(-window);
}

export function seriesStats(values: readonly number[]): SeriesStats {
  return {
    mean: mean(values),
    stdDev: sampleStdDev(values),
    count: values.length,
    total: values.reduce((sum, v) => sum + v, 0),
  };
}

/** Whole days between two ISO dates; 0 when either date is unreadable. */
export function daysBetween(startDate: string, endDate: string): number {
  const days = (Date.parse(endDate) - Date.parse(startDate)) / MS_PER_DAY;
  return Number.isFinite(days) ? days : 0;
}

export function deriveInputs(inputs: ForecastInputs): DerivedInputs {
  const used = windowedSprints(inputs.sprints, inputs.window);
  const points = seriesStats(used.map((s) => s.points));
  const stories = seriesStats(used.map((s) => s.stories));

  const autoStorySize = stories.total > 0 ? points.total / stories.total : 0;
  const storySize = inputs.sizeMode === 'auto' ? autoStorySize : inputs.sizeOverride;
  const targetStories = storySize > 0 ? Math.floor(inputs.targetPoints / storySize) : 0;

  const daysAvailable = daysBetween(inputs.startDate, inputs.targetDate);
  const sprintsAvailable = Math.max(0, Math.floor(daysAvailable / inputs.sprintDays));

  return {
    points,
    stories,
    autoStorySize,
    storySize,
    targetStories,
    daysAvailable,
    sprintsAvailable,
    sprintsUsed: used.length,
    sprintsComplete: completeSprints(inputs.sprints).length,
  };
}
