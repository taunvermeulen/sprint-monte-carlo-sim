export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation (n − 1), the same as a spreadsheet's STDEV. */
export function sampleStdDev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sumSq = values.reduce((sum, v) => sum + (v - m) * (v - m), 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

/**
 * Inclusive percentile with linear interpolation, the same as a spreadsheet's
 * PERCENTILE. `sorted` must be ascending; `p` is in [0, 1].
 */
export function percentile(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const rank = p * (n - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

/** Fraction of `sorted` (ascending) that is >= `threshold`. */
export function fractionAtLeast(sorted: ArrayLike<number>, threshold: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < threshold) lo = mid + 1;
    else hi = mid;
  }
  return (n - lo) / n;
}
