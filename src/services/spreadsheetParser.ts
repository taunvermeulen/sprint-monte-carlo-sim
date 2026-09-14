import type { Sprint } from '../domain/types';
import { MAX_NAME_LENGTH } from '../state/options';

const CELL_SEPARATOR = /\t|,|;|\s{2,}/;
const NUMERIC_CELL = /^-?\d+(\.\d+)?$/;

interface SplitLine {
  numbers: number[];
  words: string[];
}

function splitCells(cells: string[]): SplitLine {
  const numbers: number[] = [];
  const words: string[] = [];
  cells.forEach((cell) => (NUMERIC_CELL.test(cell) ? numbers.push(Number(cell)) : words.push(cell)));
  return { numbers, words };
}

/**
 * Turn text copied from a spreadsheet into sprint rows.
 * Each line needs at least two numbers — the last two are points and stories;
 * whatever else is on the line becomes the name. Header lines are skipped.
 */
export function parseSprintRows(text: string): Sprint[] {
  const rows: Sprint[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;

    // Tab/comma/semicolon separated first; if that yields fewer than two numbers,
    // the row was probably "sprint 12 24 7" with single spaces — retry on whitespace.
    const cells = line.split(CELL_SEPARATOR).map((c) => c.trim()).filter(Boolean);
    let split = splitCells(cells);
    if (split.numbers.length < 2 && cells.length === 1) split = splitCells(line.trim().split(/\s+/));
    if (split.numbers.length < 2) return;

    const { numbers, words } = split;
    // A name like "Sprint 12" contributes its own number; keep it out of the measures.
    const measures = numbers.slice(-2);
    const nameNumbers = numbers.slice(0, -2);
    const name = [...words, ...nameNumbers].join(' ') || `Sprint ${index + 1}`;

    rows.push({ name: name.slice(0, MAX_NAME_LENGTH), points: measures[0], stories: measures[1] });
  });
  return rows;
}
