import type { ForecastInputs } from '../domain/types';
import { fromJson, toJson } from './serialization';

export function exportFileName(date = new Date()): string {
  return `sprint-forecast-${date.toISOString().slice(0, 10)}.json`;
}

/** Hand the browser a JSON file of the inputs. */
export function downloadInputs(inputs: ForecastInputs, fileName = exportFileName()): void {
  const blob = new Blob([toJson(inputs)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read a previously exported file. Rejects when the file isn't JSON. */
export async function readInputsFile(file: File): Promise<ForecastInputs> {
  return fromJson(await file.text());
}

/** Copy text; resolves false when the clipboard is unavailable (e.g. file:// pages). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
