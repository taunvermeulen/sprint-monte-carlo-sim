import type { ForecastInputs } from '../domain/types';
import { normalizeInputs } from '../state/schema';

export interface InputsRepository {
  load(): ForecastInputs | null;
  save(inputs: ForecastInputs): void;
}

const STORAGE_KEY = 'monte-carlo-sprint-sim/inputs';

/** Persists inputs in this browser. Every call tolerates storage being blocked. */
export function localStorageRepository(storage: Storage | undefined = globalThis.localStorage): InputsRepository {
  return {
    load() {
      try {
        const raw = storage?.getItem(STORAGE_KEY);
        return raw ? normalizeInputs(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    },
    save(inputs) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(inputs));
      } catch {
        // Private mode or quota exceeded — the session still works, it just won't persist.
      }
    },
  };
}
