import type { CompleteSprint, Forecast, ForecastInputs, SeriesForecast } from './types';
import { deriveInputs, windowedSprints } from './history';
import { fractionAtLeast, percentile } from './statistics';
import type { Rng } from './random';

/** One trial's totals for both measures, drawn from the same sprints. */
export interface TrialTotals {
  points: Float64Array;
  stories: Float64Array;
}

/**
 * Replay the remaining sprints `trials` times by resampling the history with
 * replacement — the bootstrap.
 *
 * Each trial draws `sprints` past sprints at random; a sprint can be drawn more
 * than once, which is what lets a replay contain two bad sprints in a row even
 * if the history only held one. Nothing is assumed about the shape of the data:
 * the history *is* the distribution, so skew, lumpiness and the fact that
 * velocity can't go below zero all come through on their own.
 *
 * Whole sprints are drawn, so a trial's points and stories stay paired exactly
 * as they occurred. That keeps their real correlation intact, which matters for
 * the odds of hitting *both* targets.
 *
 * Totals come back unsorted — pairing is only meaningful before sorting.
 */
export function resampleTotals(
  history: readonly CompleteSprint[],
  sprints: number,
  trials: number,
  rng: Rng,
): TrialTotals {
  const points = new Float64Array(trials);
  const stories = new Float64Array(trials);
  if (sprints <= 0 || history.length === 0) return { points, stories };

  const last = history.length - 1;
  for (let trial = 0; trial < trials; trial++) {
    let totalPoints = 0;
    let totalStories = 0;
    for (let drawn = 0; drawn < sprints; drawn++) {
      // Math.min guards the (vanishingly rare) rng() === 1 case.
      const sprint = history[Math.min(last, Math.floor(rng() * history.length))];
      totalPoints += sprint.points;
      totalStories += sprint.stories;
    }
    points[trial] = totalPoints;
    stories[trial] = totalStories;
  }
  return { points, stories };
}

/** Read the headline figures off one measure's sorted pile of trials. */
export function summarizeSeries(sorted: Float64Array, target: number, hasSprints: boolean): SeriesForecast {
  return {
    target,
    probability: hasSprints ? fractionAtLeast(sorted, target) : 0,
    // "P85" is the amount you reach in 85% of trials — the 15th percentile.
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.25),
    p85: percentile(sorted, 0.15),
    p95: percentile(sorted, 0.05),
    samples: sorted,
  };
}

/** Share of trials where both measures reached their target. Needs unsorted, paired totals. */
export function fractionBothHit(totals: TrialTotals, pointsTarget: number, storiesTarget: number): number {
  const trials = totals.points.length;
  if (trials === 0) return 0;
  let hits = 0;
  for (let i = 0; i < trials; i++) {
    if (totals.points[i] >= pointsTarget && totals.stories[i] >= storiesTarget) hits++;
  }
  return hits / trials;
}

export function runForecast(inputs: ForecastInputs, rng: Rng = Math.random): Forecast {
  const derived = deriveInputs(inputs);
  const sprints = derived.sprintsAvailable;
  const history = windowedSprints(inputs.sprints, inputs.window);
  const hasSprints = sprints > 0 && history.length > 0;

  const totals = resampleTotals(history, sprints, inputs.trials, rng);
  // Count paired outcomes first: sorting each measure independently breaks the pairing.
  const bothProbability = hasSprints ? fractionBothHit(totals, inputs.targetPoints, derived.targetStories) : 0;

  totals.points.sort();
  totals.stories.sort();

  return {
    derived,
    points: summarizeSeries(totals.points, inputs.targetPoints, hasSprints),
    stories: summarizeSeries(totals.stories, derived.targetStories, hasSprints),
    bothProbability,
  };
}
