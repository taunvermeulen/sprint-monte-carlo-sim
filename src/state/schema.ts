import type { ForecastInputs, Sprint } from '../domain/types';
import { DEFAULT_INPUTS } from './defaults';
import { MAX_NAME_LENGTH, MAX_SPRINTS, SPRINT_LENGTHS_DAYS, TRIAL_COUNTS, WINDOW_SIZES } from './options';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSprint(raw: unknown, index: number): Sprint {
  // Accept both the object form and the compact [name, points, stories] tuple.
  const [name, points, stories] = Array.isArray(raw)
    ? raw
    : isRecord(raw)
      ? [raw.name, raw.points ?? raw.pts, raw.stories]
      : [];
  return {
    name: String(name ?? `Sprint ${index + 1}`).slice(0, MAX_NAME_LENGTH),
    points: toNumber(points),
    stories: toNumber(stories),
  };
}

function oneOf<T extends number>(allowed: readonly T[], value: unknown, fallback: T): T {
  const n = toNumber(value);
  return allowed.includes(n as T) ? (n as T) : fallback;
}

/**
 * Turn anything (stored JSON, a share link, an imported file) into valid inputs.
 * Unknown or malformed fields fall back to the defaults rather than failing.
 */
export function normalizeInputs(raw: unknown): ForecastInputs {
  const r: Record<string, unknown> = isRecord(raw) ? raw : {};
  const d = DEFAULT_INPUTS;

  const sprints = Array.isArray(r.sprints) ? r.sprints.slice(0, MAX_SPRINTS).map(toSprint) : d.sprints.map((s) => ({ ...s }));

  const windowNumber = toNumber(r.window);
  const window =
    r.window === 'all' ? 'all' : WINDOW_SIZES.includes(windowNumber as never) ? (windowNumber as number) : d.window;

  const targetPoints = toNumber(r.targetPoints);
  const sizeOverride = toNumber(r.sizeOverride);

  return {
    sprints,
    window,
    startDate: typeof r.startDate === 'string' && ISO_DATE.test(r.startDate) ? r.startDate : d.startDate,
    targetDate: typeof r.targetDate === 'string' && ISO_DATE.test(r.targetDate) ? r.targetDate : d.targetDate,
    sprintDays: oneOf(SPRINT_LENGTHS_DAYS, r.sprintDays, d.sprintDays),
    targetPoints: targetPoints !== null ? Math.max(0, targetPoints) : d.targetPoints,
    sizeMode: r.sizeMode === 'manual' ? 'manual' : 'auto',
    sizeOverride: sizeOverride !== null && sizeOverride > 0 ? sizeOverride : d.sizeOverride,
    trials: oneOf(TRIAL_COUNTS, r.trials, d.trials),
  };
}
