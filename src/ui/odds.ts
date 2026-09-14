import type { Forecast, ForecastInputs } from '../domain/types';
import { bindingCommitment, confidenceBand, diagnoseSizing } from '../domain/interpretation';
import { formatDate, formatInt, formatPercent, requireElement } from './format';
import { help } from './help';

export interface OddsHandlers {
  onRecalculate(): void;
  onToggleDetails(): void;
}

export interface OddsView {
  render(forecast: Forecast, inputs: ForecastInputs): void;
  setDetailsOpen(open: boolean): void;
}

/** Step 3: the answer, in one number and three plain sentences. */
export function mountOdds(root: HTMLElement, handlers: OddsHandlers): OddsView {
  root.innerHTML = `
    <div class="panel-h">
      <h2><span class="step-no">3</span> Your odds</h2>
      <span class="controls">
        <button id="reroll" class="btn small" type="button">Roll again</button>${help('reroll')}
      </span>
    </div>
    <div class="panel-b">
      <div class="hero" id="hero"></div>
      <ul class="facts" id="facts"></ul>
      <p class="stamp" id="stamp"></p>
      <button id="toggleDetails" class="btn link" type="button" aria-expanded="false"></button>
    </div>`;

  const hero = requireElement(root, '#hero');
  const facts = requireElement(root, '#facts');
  const stamp = requireElement(root, '#stamp');
  const toggle = requireElement<HTMLButtonElement>(root, '#toggleDetails');

  requireElement(root, '#reroll').addEventListener('click', handlers.onRecalculate);
  toggle.addEventListener('click', handlers.onToggleDetails);

  function renderEmpty(inputs: ForecastInputs): void {
    hero.innerHTML = `
      <div class="big mono">&mdash;</div>
      <div class="hero-text">
        <p class="lead">No sprints fit between ${formatDate(inputs.startDate)} and ${formatDate(inputs.targetDate)}.</p>
        <p class="sub">Move the target date later, or check the start date.</p>
      </div>`;
    facts.innerHTML = '';
  }

  return {
    render(forecast, inputs) {
      const d = forecast.derived;
      stamp.innerHTML = `Last rolled <b>${new Date().toLocaleTimeString()}</b> &middot; ${formatInt(inputs.trials)} replays`;
      if (d.sprintsAvailable <= 0 || d.sprintsUsed === 0) {
        renderEmpty(inputs);
        if (d.sprintsUsed === 0) {
          hero.querySelector('.lead')!.textContent = 'Add at least one sprint to get a forecast.';
          hero.querySelector('.sub')!.textContent = 'Type a few rows in step 1, or paste them from your spreadsheet.';
        }
        return;
      }

      const points = forecast.points;
      const stories = forecast.stories;
      const band = confidenceBand(points.probability);
      const commit = bindingCommitment(forecast);
      const diagnosis = diagnoseSizing(forecast);

      hero.innerHTML = `
        <div class="big mono ${band.level}">${(points.probability * 100).toFixed(0)}<small>%</small></div>
        <div class="hero-text">
          <p class="lead">chance of finishing <b class="mono">${formatInt(points.target)} points</b> by <b>${formatDate(inputs.targetDate)}</b> <span class="pill ${band.level}">${band.label}</span></p>
          <p class="sub">${d.sprintsAvailable} sprint${d.sprintsAvailable === 1 ? '' : 's'} left, replayed ${formatInt(inputs.trials)} times using your last ${d.sprintsUsed} sprint${d.sprintsUsed === 1 ? '' : 's'}. ${help('probability')}</p>
        </div>`;

      const shortfall = commit.ratio < 1;
      facts.innerHTML = `
        <li><b>Safe bet:</b> commit to <b class="mono">${formatInt(points.p85)} points</b> &mdash; reached in 85 of every 100 replays. ${help('p85')}</li>
        <li><b>By story count:</b> ${formatPercent(stories.probability, 0)} chance of <b class="mono">${formatInt(stories.target)} stories</b>; safe bet <b class="mono">${formatInt(stories.p85)}</b>. ${help('stories')}</li>
        <li class="${diagnosis.kind === 'aligned' ? 'quiet' : 'notice'}"><b>${diagnosis.kind === 'aligned' ? 'Both measures agree.' : diagnosis.title + '.'}</b> ${
          diagnosis.kind === 'aligned'
            ? `Commit on the ${commit.series === 'points' ? 'point' : 'story'} number${shortfall ? ' &mdash; note it falls short of the target' : ''}.`
            : diagnosis.detail
        }</li>`;
    },
    setDetailsOpen(open) {
      toggle.textContent = open ? 'Hide the full breakdown' : 'Show the full breakdown';
      toggle.setAttribute('aria-expanded', String(open));
    },
  };
}
