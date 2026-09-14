import type { ForecastInputs, Sprint } from '../domain/types';
import { isComplete } from '../domain/history';
import { parseSprintRows } from '../services/spreadsheetParser';
import type { Store } from '../state/store';
import { WINDOW_SIZES } from '../state/options';
import { escapeHtml, requireElement } from './format';
import { help } from './help';

const SOURCE = 'sprint-table';

/** Next name in the sequence: "Sprint 34" → "Sprint 35". */
function nextSprintName(sprints: readonly Sprint[]): string {
  const last = sprints[sprints.length - 1];
  const match = last && /(\d+)\s*$/.exec(last.name);
  return match ? last.name.replace(/(\d+)\s*$/, String(Number(match[1]) + 1)) : `Sprint ${sprints.length + 1}`;
}

function rowHtml(sprint: Sprint, index: number, outsideWindow: boolean): string {
  return `<tr data-index="${index}" class="${outsideWindow ? 'out' : ''}">
    <td class="idx mono">${index + 1}</td>
    <td><input class="cell" data-field="name" value="${escapeHtml(sprint.name)}" aria-label="Sprint name"></td>
    <td><input class="cell num" data-field="points" type="number" min="0" step="1" value="${sprint.points ?? ''}" aria-label="Story points"></td>
    <td><input class="cell num" data-field="stories" type="number" min="0" step="1" value="${sprint.stories ?? ''}" aria-label="Stories completed"></td>
    <td class="act"><button class="del" type="button" aria-label="Remove sprint">&times;</button></td>
  </tr>`;
}

/** Step 1: what the team finished in recent sprints. */
export function mountSprintTable(root: HTMLElement, store: Store<ForecastInputs>): void {
  root.innerHTML = `
    <div class="panel-h">
      <h2><span class="step-no">1</span> Your sprints</h2>
      <span class="hint">What did the team finish in recent sprints?</span>
    </div>
    <div class="panel-b">
      <div class="sheet-wrap">
        <table class="sheet">
          <thead><tr>
            <th></th><th>Sprint</th>
            <th class="num">Points ${help('points')}</th>
            <th class="num">Stories ${help('stories')}</th>
            <th></th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <div class="tools">
        <button id="add" class="btn small" type="button">+ Add sprint</button>
        <span class="spacer"></span>
        <button id="clear" class="btn small quiet" type="button">Clear all</button>
      </div>
      <details class="fold" id="paste">
        <summary>Paste from a spreadsheet</summary>
        <p class="hint">Copy the name, points and stories columns (or just the two number columns) and paste below. Header rows are skipped.</p>
        <textarea id="pasteBox" placeholder="Sprint 35&#9;24&#9;7&#10;Sprint 36&#9;19&#9;6"></textarea>
        <div class="tools">
          <button id="pasteAppend" class="btn small" type="button">Add these rows</button>
          <button id="pasteReplace" class="btn small" type="button">Replace everything</button>
          <span class="hint" id="pasteMsg"></span>
        </div>
      </details>
      <details class="fold">
        <summary>Options</summary>
        <label class="opt" for="window">Use
          <select id="window" class="sel">
            <option value="all">all sprints</option>
            ${WINDOW_SIZES.map((n) => `<option value="${n}">the last ${n}</option>`).join('')}
          </select>
          for the forecast ${help('window')}
        </label>
      </details>
      <p class="summary" id="pattern"></p>
    </div>`;

  const tbody = requireElement(root, '#rows');
  const windowSelect = requireElement<HTMLSelectElement>(root, '#window');
  const pasteBox = requireElement<HTMLTextAreaElement>(root, '#pasteBox');
  const pasteMsg = requireElement(root, '#pasteMsg');

  function render(inputs: ForecastInputs): void {
    windowSelect.value = String(inputs.window);
    const completeCount = inputs.sprints.filter(isComplete).length;
    const firstInWindow = inputs.window === 'all' ? 0 : Math.max(0, completeCount - inputs.window);
    let completeSeen = 0;
    const rows = inputs.sprints.map((sprint, i) => {
      const outside = isComplete(sprint) ? completeSeen++ < firstInWindow : true;
      return rowHtml(sprint, i, outside);
    });
    tbody.innerHTML =
      rows.join('') ||
      '<tr><td colspan="5"><div class="empty">No sprints yet &mdash; add one or paste from your sheet.</div></td></tr>';
  }

  // Cell edits update the store without re-rendering the table (keeps focus in the cell).
  tbody.addEventListener('input', (event) => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>('input.cell');
    if (!input) return;
    const index = Number(input.closest('tr')!.dataset.index);
    const field = input.dataset.field as keyof Sprint;
    const value = field === 'name' ? input.value : input.value.trim() === '' ? null : Number(input.value);
    store.update(
      (s) => ({ ...s, sprints: s.sprints.map((row, i) => (i === index ? { ...row, [field]: value } : row)) }),
      { source: SOURCE },
    );
  });

  tbody.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('.del');
    if (!button) return;
    const index = Number(button.closest('tr')!.dataset.index);
    store.update((s) => ({ ...s, sprints: s.sprints.filter((_, i) => i !== index) }), { source: SOURCE, structural: true });
  });

  requireElement(root, '#add').addEventListener('click', () => {
    store.update(
      (s) => ({ ...s, sprints: [...s.sprints, { name: nextSprintName(s.sprints), points: null, stories: null }] }),
      { source: SOURCE, structural: true },
    );
    const newRow = tbody.querySelector<HTMLInputElement>('tr:last-child input[data-field="points"]');
    newRow?.scrollIntoView({ block: 'nearest' });
    newRow?.focus();
  });

  requireElement(root, '#clear').addEventListener('click', () => {
    if (store.get().sprints.length === 0 || !confirm('Remove all sprint rows?')) return;
    store.update((s) => ({ ...s, sprints: [] }), { source: SOURCE, structural: true });
  });

  windowSelect.addEventListener('change', () => {
    const value = windowSelect.value === 'all' ? 'all' : Number(windowSelect.value);
    store.update((s) => ({ ...s, window: value }), { source: SOURCE, structural: true });
  });

  function applyPaste(replace: boolean): void {
    const rows = parseSprintRows(pasteBox.value);
    if (rows.length === 0) {
      pasteMsg.textContent = 'No rows with two numbers found.';
      return;
    }
    store.update((s) => ({ ...s, sprints: replace ? rows : [...s.sprints, ...rows] }), { source: SOURCE, structural: true });
    pasteMsg.textContent = `${replace ? 'Replaced with' : 'Added'} ${rows.length} sprint${rows.length === 1 ? '' : 's'}.`;
    pasteBox.value = '';
  }
  requireElement(root, '#pasteAppend').addEventListener('click', () => applyPaste(false));
  requireElement(root, '#pasteReplace').addEventListener('click', () => applyPaste(true));

  store.subscribe((inputs, meta) => {
    if (meta.source !== SOURCE || meta.structural) render(inputs);
  });
  render(store.get());
}
