import type { ForecastInputs } from '../domain/types';
import type { Store } from '../state/store';
import { TRIAL_COUNTS } from '../state/options';
import { buildShareUrl } from '../services/shareLink';
import { copyText, downloadInputs, readInputsFile } from '../services/transfer';
import { formatInt, requireElement } from './format';

const SOURCE = 'toolbar';
const MESSAGE_MS = 4000;

export interface ToolbarHandlers {
  onRecalculate(): void;
}

export interface Toolbar {
  /** Show when the results were last rolled. */
  stamp(date: Date): void;
  notify(message: string): void;
}

export function mountToolbar(root: HTMLElement, store: Store<ForecastInputs>, handlers: ToolbarHandlers): Toolbar {
  root.innerHTML = `
    <div>
      <h1>Monte Carlo Sprint Sim</h1>
      <p class="sub">Delivery odds from your sprint history &mdash; velocity (points) and flow (stories), side by side.</p>
    </div>
    <div class="controls">
      <label class="stamp" for="trials">Trials
        <select id="trials" class="sel">
          ${TRIAL_COUNTS.map((n) => `<option value="${n}">${formatInt(n)}</option>`).join('')}
        </select>
      </label>
      <button id="reroll" class="btn primary" type="button">Recalculate odds</button>
      <span class="stamp" id="stamp"></span>
    </div>
    <div class="controls share">
      <button id="share" class="btn small" type="button">Copy share link</button>
      <button id="export" class="btn small" type="button">Export JSON</button>
      <button id="importBtn" class="btn small" type="button">Import JSON</button>
      <input id="importFile" type="file" accept="application/json,.json" hidden>
      <span class="stamp" id="message"></span>
    </div>`;

  const trials = requireElement<HTMLSelectElement>(root, '#trials');
  const stamp = requireElement(root, '#stamp');
  const message = requireElement(root, '#message');
  const importFile = requireElement<HTMLInputElement>(root, '#importFile');

  let messageTimer: ReturnType<typeof setTimeout> | undefined;
  const toolbar: Toolbar = {
    stamp(date) {
      stamp.innerHTML = `Last calculated <b>${date.toLocaleTimeString()}</b>`;
    },
    notify(text) {
      message.textContent = text;
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => (message.textContent = ''), MESSAGE_MS);
    },
  };

  trials.addEventListener('change', () => store.update((s) => ({ ...s, trials: Number(trials.value) }), { source: SOURCE }));
  requireElement(root, '#reroll').addEventListener('click', handlers.onRecalculate);

  requireElement(root, '#share').addEventListener('click', async () => {
    const url = buildShareUrl(store.get(), window.location);
    if (await copyText(url)) toolbar.notify('Link copied — anyone who opens it sees this data.');
    else window.prompt('Copy this link:', url);
  });

  requireElement(root, '#export').addEventListener('click', () => {
    downloadInputs(store.get());
    toolbar.notify('Exported.');
  });

  requireElement(root, '#importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      store.set(await readInputsFile(file), { structural: true });
      toolbar.notify(`Imported ${file.name}`);
    } catch {
      toolbar.notify('That file is not a forecast export.');
    }
    importFile.value = '';
  });

  store.subscribe((inputs, meta) => {
    if (meta.source !== SOURCE) trials.value = String(inputs.trials);
  });
  trials.value = String(store.get().trials);
  return toolbar;
}
