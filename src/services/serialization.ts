import type { ForecastInputs } from '../domain/types';
import { normalizeInputs } from '../state/schema';

/** Wire format shared by share links and JSON files. Sprints are tuples to stay short. */
export interface PackedInputs {
  v: 1;
  sprints: [string, number | null, number | null][];
  window: ForecastInputs['window'];
  startDate: string;
  targetDate: string;
  sprintDays: number;
  targetPoints: number;
  sizeMode: ForecastInputs['sizeMode'];
  sizeOverride: number;
  trials: number;
}

export function packInputs(inputs: ForecastInputs): PackedInputs {
  const { sprints, ...rest } = inputs;
  return { v: 1, sprints: sprints.map((s) => [s.name, s.points, s.stories]), ...rest };
}

/** Accepts packed or plain inputs; anything malformed falls back to defaults. */
export function unpackInputs(raw: unknown): ForecastInputs {
  return normalizeInputs(raw);
}

export function toJson(inputs: ForecastInputs): string {
  return JSON.stringify(packInputs(inputs), null, 2);
}

export function fromJson(text: string): ForecastInputs {
  return unpackInputs(JSON.parse(text));
}
