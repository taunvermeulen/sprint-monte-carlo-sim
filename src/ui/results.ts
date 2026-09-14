import type { DerivedInputs, Forecast, ForecastInputs, SeriesForecast } from '../domain/types';
import { bindingCommitment } from '../domain/interpretation';
import { formatDate, formatDecimal, formatInt, formatPercent, requireElement } from './format';
import { help } from './help';
import { histogramSvg, type SeriesKey } from './histogram';

const SERIES: { key: SeriesKey; title: string; unit: string }[] = [
  { key: 'points', title: 'Points delivered', unit: 'points' },
  { key: 'stories', title: 'Stories delivered', unit: 'stories' },
];

/* ---------- plain-language summaries shown inside steps 1 and 2 ---------- */

function patternSentence(d: DerivedInputs): string {
  if (d.sprintsUsed === 0) return 'Add a few sprints and the team’s pattern will appear here.';
  const scope = d.sprintsUsed === d.sprintsComplete ? `all ${d.sprintsUsed}` : `the last ${d.sprintsUsed} of ${d.sprintsComplete}`;
  const few = d.sprintsUsed < 3 ? ' Three or more sprints give a much better read.' : '';
  return `Over ${scope} sprints the team finishes about <b class="mono">${formatDecimal(d.points.mean)} points</b> (&plusmn;${formatDecimal(d.points.stdDev)}) and <b class="mono">${formatDecimal(d.stories.mean)} stories</b> (&plusmn;${formatDecimal(d.stories.stdDev)}) per sprint. ${help('variability')}${few}`;
}

function planSentence(d: DerivedInputs, inputs: ForecastInputs): string {
  if (d.sprintsAvailable <= 0) return `No full sprint fits between ${formatDate(inputs.startDate)} and ${formatDate(inputs.targetDate)}.`;
  const size = d.storySize > 0 ? `, or about <b class="mono">${formatInt(d.targetStories)} stories</b> at ${formatDecimal(d.storySize)} points each` : '';
  return `That’s <b class="mono">${d.sprintsAvailable} sprint${d.sprintsAvailable === 1 ? '' : 's'}</b> between ${formatDate(inputs.startDate)} and ${formatDate(inputs.targetDate)}${size}.`;
}

/* ---------- the full breakdown ---------- */

const PERCENTILE_ROWS: { label: string; note: string; field: 'p50' | 'p75' | 'p85' | 'p95' }[] = [
  { label: 'P50', note: 'a coin toss', field: 'p50' },
  { label: 'P75', note: 'probable', field: 'p75' },
  { label: 'P85', note: 'safe commitment', field: 'p85' },
  { label: 'P95', note: 'near certain', field: 'p95' },
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
  const probability = `<tr class="prob"><td><span class="p">Odds</span><span class="why">of hitting the target</span></td><td><span class="v mono">${formatPercent(forecast.points.probability)}</span></td><td><span class="v mono">${formatPercent(forecast.stories.probability)}</span></td></tr>`;
  return `<thead><tr><th>Confidence</th><th><i class="key points"></i> Points</th><th><i class="key stories"></i> Stories</th></tr></thead><tbody>${probability}${rows}</tbody>`;
}

function chartsHtml(forecast: Forecast): string {
  return SERIES.map(({ key, title, unit }) => {
    const series = forecast[key];
    return `<div class="chart" data-unit="${unit}" data-trials="${series.samples.length}">
      <div class="ct"><h3><i class="key ${key}"></i>${title}</h3><span class="n mono">${formatInt(series.samples.length)} replays</span></div>
      ${histogramSvg(series, key, unit)}
    </div>`;
  }).join('');
}

function modelHtml(forecast: Forecast, inputs: ForecastInputs): string {
  const d = forecast.derived;
  const row = (label: string, value: string) => `<tr><td>${label}</td><td class="mono">${value}</td></tr>`;
  return `<tbody>
    ${row('Sprints in history', `${d.sprintsUsed} of ${d.sprintsComplete}`)}
    ${row('Velocity mean / std dev', `${formatDecimal(d.points.mean)} / ${formatDecimal(d.points.stdDev)} pts`)}
    ${row('Flow mean / std dev', `${formatDecimal(d.stories.mean)} / ${formatDecimal(d.stories.stdDev)} stories`)}
    ${row('Sprints available', `${d.sprintsAvailable} (${formatInt(d.daysAvailable)} days &divide; ${inputs.sprintDays})`)}
    ${row('Points per story', `${formatDecimal(d.storySize)} (${inputs.sizeMode === 'auto' ? 'from history' : 'set manually'})`)}
    ${row('Targets', `${formatInt(inputs.targetPoints)} pts &middot; ${formatInt(d.targetStories)} stories`)}
    ${row('Per-trial draw', `N(${d.sprintsAvailable} &times; mean, &radic;${d.sprintsAvailable} &times; sd), &times; ${formatInt(inputs.trials)}`)}
  </tbody>`;
}

function rulesHtml(forecast: Forecast): string {
  const commit = bindingCommitment(forecast);
  return `
    <div class="r"><span class="num">rule</span><div><h4>Commit on whichever P85 is lower</h4><p>A project isn't done until both effort and scope land. Right now the tighter one is <b>${commit.series}</b>: <b class="mono">${formatInt(commit.delivered)}</b> against a target of <b class="mono">${formatInt(commit.target)}</b> (${formatPercent(commit.ratio, 0)}).</p></div></div>
    <div class="r"><span class="num">1</span><div><h4>High point odds, low story odds</h4><p>Stories are too small. You have the point capacity, but the volume of tickets will cause context-switching bottlenecks. Merge trivial stories.</p></div></div>
    <div class="r"><span class="num">2</span><div><h4>Low point odds, high story odds</h4><p>Stories are too big. You can finish the number of tickets, but the effort required exceeds your capacity. Refine and split.</p></div></div>`;
}

export interface ResultsView {
  render(forecast: Forecast, inputs: ForecastInputs): void;
}

export function mountResults(root: ParentNode): ResultsView {
  const regions = {
    pattern: requireElement(root, '#pattern'),
    plan: requireElement(root, '#plan'),
    autoSize: requireElement(root, '#autoSize'),
    distribution: requireElement(root, '#distribution'),
    charts: requireElement(root, '#charts'),
    model: requireElement(root, '#model'),
    rules: requireElement(root, '#rules'),
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
    tip.textContent = `${formatInt(Number(bar.dataset.lo))}–${formatInt(Number(bar.dataset.hi))} ${chart.dataset.unit} · ${count} replays (${formatPercent(count / trials)})`;
    tip.style.left = `${event.clientX - box.left}px`;
    tip.style.top = `${event.clientY - box.top - 8}px`;
    tip.hidden = false;
  });
  regions.charts.addEventListener('mouseleave', () => {
    regions.charts.querySelectorAll<HTMLElement>('.tip').forEach((tip) => (tip.hidden = true));
  });

  return {
    render(forecast, inputs) {
      const d = forecast.derived;
      regions.pattern.innerHTML = patternSentence(d);
      regions.plan.innerHTML = planSentence(d, inputs);
      regions.autoSize.textContent = d.autoStorySize ? `(${formatDecimal(d.autoStorySize)})` : '(—)';
      regions.distribution.innerHTML = distributionHtml(forecast);
      regions.charts.innerHTML = chartsHtml(forecast);
      regions.model.innerHTML = modelHtml(forecast, inputs);
      regions.rules.innerHTML = rulesHtml(forecast);
    },
  };
}
