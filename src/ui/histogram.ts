import type { SeriesForecast } from '../domain/types';
import { formatInt } from './format';

export type SeriesKey = 'points' | 'stories';

const WIDTH = 560;
const HEIGHT = 210;
const MARGIN = { top: 10, right: 10, bottom: 26, left: 10 };
const BIN_COUNT = 28;
const BAR_GAP = 1;
const CORNER = 4;

/** Round tick values so the axis reads 700 / 750 / 800 rather than 713 / 762. */
export function niceTicks(lo: number, hi: number, maxCount: number): number[] {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const rough = span / maxCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => span / s <= maxCount) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(v);
  return ticks;
}

export function binSamples(samples: Float64Array, lo: number, hi: number, bins: number): number[] {
  const counts = new Array<number>(bins).fill(0);
  const width = (hi - lo) / bins;
  for (const value of samples) {
    const bin = Math.min(bins - 1, Math.max(0, Math.floor((value - lo) / width)));
    counts[bin]++;
  }
  return counts;
}

/** A column chart of where the trials landed, with the target and P85 marked. */
export function histogramSvg(series: SeriesForecast, key: SeriesKey, unit: string): string {
  const samples = series.samples;
  if (samples.length === 0 || samples[samples.length - 1] === 0) {
    return '<div class="empty">No sprints available before the target date.</div>';
  }

  let lo = Math.min(samples[0], series.target);
  let hi = Math.max(samples[samples.length - 1], series.target);
  const pad = (hi - lo || 1) * 0.04;
  lo -= pad;
  hi += pad;

  const counts = binSamples(samples, lo, hi, BIN_COUNT);
  const maxCount = Math.max(...counts) || 1;
  const binWidth = (hi - lo) / BIN_COUNT;
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const baseline = HEIGHT - MARGIN.bottom;
  const plotHeight = baseline - MARGIN.top;
  const x = (value: number) => MARGIN.left + ((value - lo) / (hi - lo)) * plotWidth;

  const bars = counts
    .map((count, i) => {
      if (count === 0) return '';
      const x0 = x(lo + i * binWidth) + BAR_GAP;
      const w = Math.max(1, x(lo + (i + 1) * binWidth) - BAR_GAP - x0);
      const h = Math.max(1, (count / maxCount) * plotHeight);
      const y = baseline - h;
      const r = Math.min(CORNER, w / 2, h);
      const hits = lo + (i + 0.5) * binWidth >= series.target;
      const path = `M${x0},${baseline}V${y + r}a${r},${r} 0 0 1 ${r},-${r}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}V${baseline}Z`;
      return `<path class="bar ${hits ? 'hit' : 'miss'} ${key}" d="${path}" data-lo="${Math.round(lo + i * binWidth)}" data-hi="${Math.round(lo + (i + 1) * binWidth)}" data-count="${count}"></path>`;
    })
    .join('');

  const ticks = niceTicks(lo, hi, 6)
    .map(
      (v) =>
        `<line class="axis" x1="${x(v)}" x2="${x(v)}" y1="${baseline}" y2="${baseline + 4}"></line>` +
        `<text class="tick" x="${x(v)}" y="${baseline + 15}" text-anchor="middle">${formatInt(v)}</text>`,
    )
    .join('');

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Histogram of ${unit} delivered across ${samples.length} trials">
      <line class="axis" x1="${MARGIN.left}" x2="${WIDTH - MARGIN.right}" y1="${baseline}" y2="${baseline}"></line>
      ${ticks}${bars}
      <line class="ref-p85" x1="${x(series.p85)}" x2="${x(series.p85)}" y1="${MARGIN.top}" y2="${baseline}"></line>
      <line class="ref-target" x1="${x(series.target)}" x2="${x(series.target)}" y1="${MARGIN.top}" y2="${baseline}"></line>
    </svg>
    <div class="legend">
      <span><i class="target"></i>Target ${formatInt(series.target)}</span>
      <span><i class="p85"></i>P85 ${formatInt(series.p85)}</span>
      <span><i class="swatch hit ${key}"></i>Hits target</span>
      <span><i class="swatch miss ${key}"></i>Falls short</span>
    </div>
    <div class="tip" hidden></div>`;
}
