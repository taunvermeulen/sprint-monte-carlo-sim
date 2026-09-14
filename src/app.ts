import type { ForecastInputs } from './domain/types';
import { runForecast } from './domain/simulation';
import { DEFAULT_INPUTS } from './state/defaults';
import { createStore } from './state/store';
import { loadPreferences, savePreferences } from './services/preferences';
import { decodeShareHash } from './services/shareLink';
import { localStorageRepository, type InputsRepository } from './services/storage';
import { requireElement } from './ui/format';
import { mountLearn } from './ui/learn';
import { mountOdds } from './ui/odds';
import { mountResults } from './ui/results';
import { mountSprintTable } from './ui/sprintTable';
import { mountTargetsForm } from './ui/targetsForm';
import { mountToolbar } from './ui/toolbar';

/** Typing in a cell shouldn't roll 10,000 dice per keystroke. */
const RECALC_DEBOUNCE_MS = 120;

/** Share link beats saved state beats the built-in example. */
export function initialInputs(
  repository: InputsRepository,
  location: Location,
): { inputs: ForecastInputs; fromLink: boolean } {
  const shared = decodeShareHash(location.hash);
  if (shared) return { inputs: shared, fromLink: true };
  return { inputs: repository.load() ?? DEFAULT_INPUTS, fromLink: false };
}

export function startApp(root: ParentNode = document, repository: InputsRepository = localStorageRepository()): void {
  const { inputs, fromLink } = initialInputs(repository, window.location);
  if (fromLink) {
    repository.save(inputs);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  const store = createStore(inputs);
  const preferences = loadPreferences();
  const detailsRegion = requireElement(root, '#details');

  function setDetailsOpen(open: boolean): void {
    preferences.detailsOpen = open;
    detailsRegion.hidden = !open;
    odds.setDetailsOpen(open);
    savePreferences(preferences);
  }

  // Input panels first: the results view renders into regions they create.
  const toolbar = mountToolbar(requireElement(root, '#toolbar'), store);
  mountSprintTable(requireElement(root, '#history'), store);
  mountTargetsForm(requireElement(root, '#targets'), store);
  const odds = mountOdds(
    requireElement(root, '#odds'),
    { onRecalculate: recalculate, onToggleDetails: () => setDetailsOpen(!preferences.detailsOpen) },
    requireElement<HTMLButtonElement>(root, '#rollFloat'),
  );
  const results = mountResults(root);
  mountLearn(requireElement(root, '#learn'));

  function recalculate(): void {
    const forecast = runForecast(store.get());
    odds.render(forecast, store.get());
    results.render(forecast, store.get());
  }

  let pending: ReturnType<typeof setTimeout> | undefined;
  store.subscribe((state) => {
    repository.save(state);
    clearTimeout(pending);
    pending = setTimeout(recalculate, RECALC_DEBOUNCE_MS);
  });

  setDetailsOpen(preferences.detailsOpen);
  recalculate();
  if (fromLink) toolbar.notify('Loaded from a share link.');
}
