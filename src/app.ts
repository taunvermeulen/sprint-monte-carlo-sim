import type { ForecastInputs } from './domain/types';
import { runForecast } from './domain/simulation';
import { DEFAULT_INPUTS } from './state/defaults';
import { createStore } from './state/store';
import { decodeShareHash } from './services/shareLink';
import { localStorageRepository, type InputsRepository } from './services/storage';
import { requireElement } from './ui/format';
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

  // Input panels first: the results view renders into regions they create.
  const toolbar = mountToolbar(requireElement(root, '#toolbar'), store, { onRecalculate: recalculate });
  mountSprintTable(requireElement(root, '#history'), store);
  mountTargetsForm(requireElement(root, '#targets'), store);
  const results = mountResults(root);

  function recalculate(): void {
    results.render(runForecast(store.get()));
    toolbar.stamp(new Date());
  }

  let pending: ReturnType<typeof setTimeout> | undefined;
  store.subscribe((state) => {
    repository.save(state);
    clearTimeout(pending);
    pending = setTimeout(recalculate, RECALC_DEBOUNCE_MS);
  });

  recalculate();
  if (fromLink) toolbar.notify('Loaded from a share link.');
}
