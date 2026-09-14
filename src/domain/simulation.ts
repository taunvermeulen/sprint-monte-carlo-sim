import type { Forecast, ForecastInputs, SeriesForecast, SeriesStats } from './types';
import { deriveInputs } from './history';
import { fractionAtLeast, percentile } from './statistics';
import { standardNormal, type Rng } from './random';

/**
 * Roll `trials` project outcomes for one measure. Each trial sums `sprints`
 * sprints drawn from the history's normal distribution, which is the same as
 * one draw from N(sprints·mean, √sprints·sd). Delivery can't go below zero.
 * Returns the outcomes sorted ascending.
 */
export function simulateDelivery(stats: SeriesStats, sprints: number, trials: number, rng: Rng): Float64Array {
  const samples = new Float64Array(trials);
  if (sprints <= 0) return samples;
  const totalMean = sprints * stats.mean;
  const totalSd = Math.sqrt(sprints) * stats.stdDev;
  for (let i = 0; i < trials; i++) {
    samples[i] = Math.max(0, totalMean + totalSd * standardNormal(rng));
  }
  return samples.sort();
}

export function forecastSeries(
  stats: SeriesStats,
  sprints: number,
  target: number,
  trials: number,
  rng: Rng,
): SeriesForecast {
  const samples = simulateDelivery(stats, sprints, trials, rng);
  return {
    target,
    probability: sprints > 0 ? fractionAtLeast(samples, target) : 0,
    // "P85" is the amount you beat in 85% of trials — the 15th percentile.
    p50: percentile(samples, 0.5),
    p75: percentile(samples, 0.25),
    p85: percentile(samples, 0.15),
    p95: percentile(samples, 0.05),
    samples,
  };
}

export function runForecast(inputs: ForecastInputs, rng: Rng = Math.random): Forecast {
  const derived = deriveInputs(inputs);
  const n = derived.sprintsAvailable;
  return {
    derived,
    points: forecastSeries(derived.points, n, inputs.targetPoints, inputs.trials, rng),
    stories: forecastSeries(derived.stories, n, derived.targetStories, inputs.trials, rng),
  };
}
