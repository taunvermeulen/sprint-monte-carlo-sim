/** Per-browser UI preferences, separate from the forecast inputs. */
export interface Preferences {
  /** Whether the full breakdown under the odds is expanded. */
  detailsOpen: boolean;
}

const KEY = 'monte-carlo-sprint-sim/preferences';
const DEFAULTS: Preferences = { detailsOpen: false };

export function loadPreferences(storage: Storage | undefined = globalThis.localStorage): Preferences {
  try {
    const raw = storage?.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Preferences>) : {};
    return { ...DEFAULTS, detailsOpen: parsed.detailsOpen === true };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs: Preferences, storage: Storage | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked — the preference just won't stick.
  }
}
