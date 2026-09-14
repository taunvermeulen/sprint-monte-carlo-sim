import type { DerivedInputs, Forecast, SeriesForecast } from '../domain/types';
import { bindingCommitment, confidenceBand, diagnoseSizing } from '../domain/interpretation';
import { escapeHtml, formatDecimal, formatInt, formatPercent, formatSigned, requireElement } from './format';
import { histogramSvg, type SeriesKey } from './histogram';

interface ResultsRegions {
  metrics: HTMLElement;
  derived: HTMLElement;
  autoSize: HTMLElement;
  tiles: HTMLElement;
  distribution: HTMLElement;
  charts: HTMLElement;
  reading: HTMLElement;
}

const SERIES: { key: SeriesKey; title: string; unit: string }[] = [
  { key: 'points', title: 'Velocity probability', unit: 'points' },
  { key: 'stories', title: 'Flow probability', unit: 'stories' },
];

function metricsHtml(d: DerivedInputs): string {
  const note = d.sprintsUsed < 3 ? ' &mdash; add more history for a usable spread' : '';
  return `
    <div class="m"><span class="lab"><i class="key points"></i>Velocity &mdash; avg points</span><span class="val mono">${formatDecimal(d.points.mean)}<small>/ sprint</small></span></div>
    <div class="m"><span class="lab"><i class="key stories"></i>Flow &mdash; avg stories</span><span class="val mono">${formatDecimal(d.stories.mean)}<small>/ sprint</small></span></div>
    <div class="m"><span class="lab">Std deviation (points)</span><span class="val mono">${formatDecimal(d.points.stdDev)}</span></div>
    <div class="m"><span class="lab">Std deviation (stories)</span><span class="val mono">${formatDecimal(d.stories.stdDev)}</span></div>
    <div class="m full"><span class="lab">Based on <b class="mono">${d.sprintsUsed}</b>&nbsp;of ${d.sprintsComplete} complete sprints${note}</span></div>`;
}

function derivedHtml(d: DerivedInputs): string {
  return `
    <div class="d"><div class="lab">Days to target</div><div class="val mono">${formatInt(d.daysAvailable)}</div></div>
    <div class="d"><div class="lab">Sprints available</div><div class="val mono">${d.sprintsAvailable}</div></div>
    <div class="d"><div class="lab">Target scope</div><div class="val mono">${formatInt(d.targetStories)} <small>stories</small></div></div>`;
}

function tileHtml(key: SeriesKey, title: string, unit: string, series: SeriesForecast, d: DerivedInputs): string {
  const band = confidenceBand(series.probability);
  const cushion = series.p85 - series.target;
  return `<div class="tile ${key}">
    <div class="lab"><span>${title}</span><span class="pill ${band.level}">${band.label}</span></div>
    <div class="big mono">${d.sprintsAvailable > 0 ? (series.probability * 100).toFixed(1) : '&mdash;'}<small>%</small></div>
    <div class="line">odds of <b class="mono">${formatInt(series.target)}</b> ${unit} in <b class="mono">${d.sprintsAvailable}</b> sprints</div>
    <div class="line">P85 delivers <b class="mono">${formatInt(series.p85)}</b> &middot; <span class="mono">${formatSigned(cushion)}</span> ${cushion >= 0 ? 'cushion' : 'short'}</div>
  </div>`;
}

const PERCENTILE_ROWS: { label: string; note: string; field: 'p50' | 'p75' | 'p85' | 'p95' }[] = [
  { label: 'P50', note: 'A coin toss', field: 'p50' },
  { label: 'P75', note: 'Probable', field: 'p75' },
  { label: 'P85', note: 'Safe commitment', field: 'p85' },
  { label: 'P95', note: 'Near certain', field: 'p95' },
];

function distributionHtml(forecast: Forecast): string {
  const cell = (series: SeriesForecast, field: (typeof PERCENTILE_ROWS)[number]['field']) => {
    const value = series[field];
    const ratio = series.target > 0 ? value / series.target : 0;
    return `<td><span class="v mono">${formatInt(value)}</span><span class="r mono ${ratio >= 1 ? 'over' : 'under'}">${formatPercent(ratio, 0)} of target</span></td>`;
  };
  const rows = PERCENTILE_ROWS.map(
    (row) =>
      `<tr class="${row.field}"><td><span class="p">${row.label}</span><span class="why">${row.note}</span></td>${cell(forecast.points, row.field)}${cell(forecast.stories, row.field)}</tr>`,
  ).join('');
  return `<thead><tr><th>Confidence</th><th><i class="key points"></i> Points delivered</th><th><i class="key stories"></i> Stories delivered</th></tr></thead><tbody>${rows}</tbody>`;
}

function chartsHtml(forecast: Forecast): string {
  return SERIES.map(({ key, unit }) => {
    const series = forecast[key];
    const title = key === 'points' ? 'Points delivered' : 'Stories delivered';
    return `<div class="chart" data-unit="${unit}" data-trials="${series.samples.length}">
      <div class="ct"><h3><i class="key ${key}"></i>${title}</h3><span class="n mono">${formatInt(series.samples.length)} trials</span></div>
      ${histogramSvg(series, key, unit)}
    </div>`;
  }).join('');
}

function readingHtml(forecast: Forecast): string {
  const diagnosis = diagnoseSizing(forecast);
  const commit = bindingCommitment(forecast);
  const golden =
    forecast.derived.sprintsAvailable > 0
      ? `The tighter P85 is <b>${commit.series === 'points' ? 'velocity' : 'flow'}</b>: at 85% confidence the team delivers <b class="mono">${formatInt(commit.delivered)} ${commit.series}</b> against a target of <b class="mono">${formatInt(commit.target)}</b> (${formatPercent(commit.ratio, 0)}). A project isn't done until both effort and scope land, so that is the honest commitment${commit.ratio < 1 ? ' &mdash; and it falls short of the target' : ''}.`
      : 'Once sprints are available, the lower of the two P85 figures is your commitment.';
  return `
    <div class="r lead"><span class="num">now</span><div><h4>${escapeHtml(diagnosis.title)}</h4><p>${escapeHtml(diagnosis.detail)}</p></div></div>
    <div class="r"><span class="num">rule</span><div><h4>Commit on whichever P85 is lower</h4><p>${golden}</p></div></div>
    <div class="r muted"><span class="num">1</span><div><h4>High point odds, low flow odds</h4><p>Stories are too small. You have the point capacity, but the volume of stories will cause context-switching bottlenecks.</p></div></div>
    <div class="r muted"><span class="num">2</span><div><h4>Low point odds, high flow odds</h4><p>Stories are too big. You can finish the number of tickets, but the point effort required exceeds your capacity. Refine and split.</p></div></div>`;
}

export interface ResultsView {
  render(forecast: Forecast): void;
}

export function mountResults(root: ParentNode): ResultsView {
  const regions: ResultsRegions = {
    metrics: requireElement(root, '#metrics'),
    derived: requireElement(root, '#derived'),
    autoSize: requireElement(root, '#autoSize'),
    tiles: requireElement(root, '#tiles'),
    distribution: requireElement(root, '#distribution'),
    charts: requireElement(root, '#charts'),
    reading: requireElement(root, '#reading'),
  };

  // One delegated tooltip for both charts.
  regions.charts.addEventListener('mousemove', (event) => {
    const target = event.target as HTMLElement;
    const chart = target.closest<HTMLElement>('.chart');
    if (!chart) return;
    const tip = chart.querySelector<HTMLElement>('.tip');
    const bar = target.closest<SVGElement>('.bar');
    if (!tip) return;
    if (!bar) {
      tip.hidden = true;
      return;
    }
    const box = chart.getBoundingClientRect();
    const count = Number(bar.dataset.count);
    const trials = Number(chart.dataset.trials) || 1;
    tip.textContent = `${formatInt(Number(bar.dataset.lo))}–${formatInt(Number(bar.dataset.hi))} ${chart.dataset.unit} · ${count} trials (${formatPercent(count / trials)})`;
    tip.style.left = `${event.clientX - box.left}px`;
    tip.style.top = `${event.clientY - box.top - 8}px`;
    tip.hidden = false;
  });
  regions.charts.addEventListener('mouseleave', () => {
    regions.charts.querySelectorAll<HTMLElement>('.tip').forEach((tip) => (tip.hidden = true));
  });

  return {
    render(forecast) {
      const d = forecast.derived;
      regions.metrics.innerHTML = metricsHtml(d);
      regions.derived.innerHTML = derivedHtml(d);
      regions.autoSize.textContent = d.autoStorySize ? `(${formatDecimal(d.autoStorySize)})` : '(—)';
      regions.tiles.innerHTML = SERIES.map((s) => tileHtml(s.key, s.title, s.unit, forecast[s.key], d)).join('');
      regions.distribution.innerHTML = distributionHtml(forecast);
      regions.charts.innerHTML = chartsHtml(forecast);
      regions.reading.innerHTML = readingHtml(forecast);
    },
  };
}
