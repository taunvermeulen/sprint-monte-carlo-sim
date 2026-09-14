import type { Forecast } from './types';

export type ConfidenceLevel = 'safe' | 'probable' | 'risk';

export interface ConfidenceBand {
  level: ConfidenceLevel;
  label: string;
}

/** Where a probability sits on the commitment scale. */
export function confidenceBand(probability: number): ConfidenceBand {
  if (probability >= 0.85) return { level: 'safe', label: 'Safe commitment' };
  if (probability >= 0.5) return { level: 'probable', label: 'Probable' };
  return { level: 'risk', label: 'At risk' };
}

export type SizingKind = 'no-sprints' | 'points-ahead' | 'stories-ahead' | 'aligned';

export interface SizingDiagnosis {
  kind: SizingKind;
  title: string;
  detail: string;
}

/** Odds that differ by at least this much point to a story-sizing problem. */
const SIZING_GAP = 0.15;

/** Cross-reference the two probabilities the way the original sheet's notes describe. */
export function diagnoseSizing(forecast: Forecast): SizingDiagnosis {
  if (forecast.derived.sprintsAvailable <= 0) {
    return {
      kind: 'no-sprints',
      title: 'No sprints fit between the dates',
      detail: 'Move the target date out, or check the start date — the simulation has nothing to roll.',
    };
  }
  const gap = forecast.points.probability - forecast.stories.probability;
  if (gap >= SIZING_GAP) {
    return {
      kind: 'points-ahead',
      title: 'Point odds run ahead of story odds',
      detail:
        'Stories are probably too small. You have the point capacity, but the sheer volume of tickets will cause context-switching bottlenecks. Consider merging trivial stories.',
    };
  }
  if (gap <= -SIZING_GAP) {
    return {
      kind: 'stories-ahead',
      title: 'Story odds run ahead of point odds',
      detail:
        'Stories are probably too big. You can finish the number of tickets, but the effort required exceeds your capacity. Refine and split the large ones.',
    };
  }
  return {
    kind: 'aligned',
    title: 'Effort and scope agree',
    detail: 'Both measures tell the same story, so the forecast is not hiding a sizing problem — commit on the numbers below.',
  };
}

export interface Commitment {
  series: 'points' | 'stories';
  delivered: number;
  target: number;
  /** delivered ÷ target; below 1 means the safe commitment misses the target. */
  ratio: number;
}

/**
 * The golden rule: commit on whichever P85 is lower relative to its target,
 * because a project isn't done until both effort and scope are delivered.
 */
export function bindingCommitment(forecast: Forecast): Commitment {
  const ratio = (delivered: number, target: number) => (target > 0 ? delivered / target : 0);
  const pointsRatio = ratio(forecast.points.p85, forecast.points.target);
  const storiesRatio = ratio(forecast.stories.p85, forecast.stories.target);
  const pointsBind = pointsRatio <= storiesRatio;
  const series = pointsBind ? forecast.points : forecast.stories;
  return {
    series: pointsBind ? 'points' : 'stories',
    delivered: series.p85,
    target: series.target,
    ratio: pointsBind ? pointsRatio : storiesRatio,
  };
}
