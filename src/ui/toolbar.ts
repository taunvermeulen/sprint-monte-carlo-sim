import type { ForecastInputs } from '../domain/types';
import type { Store } from '../state/store';
import { buildShareUrl } from '../services/shareLink';
import { copyText, downloadInputs, readInputsFile } from '../services/transfer';
import { requireElement } from './format';

const MESSAGE_MS = 4000;

export interface Toolbar {
  notify(message: string): void;
}

/** Title plus the three ways to move data around. Nothing else lives up here. */
export function mountToolbar(root: HTMLElement, store: Store<ForecastInputs>): Toolbar {
  root.innerHTML = `
    <div>
      <h1>Monte Carlo Sprint Sim</h1>
      <p class="sub">Will the team make it? Odds, not guesses &mdash; from the sprints you've already done.</p>
    </div>
    <div class="controls">
      <button id="share" class="btn small" type="button">Copy share link</button>
      <button id="export" class="btn small" type="button">Export</button>
      <button id="importBtn" class="btn small" type="button">Import</button>
      <input id="importFile" type="file" accept="application/json,.json" hidden>
      <span class="stamp" id="message"></span>
    </div>`;

  const message = requireElement(root, '#message');
  const importFile = requireElement<HTMLInputElement>(root, '#importFile');

  let messageTimer: ReturnType<typeof setTimeout> | undefined;
  const toolbar: Toolbar = {
    notify(text) {
      message.textContent = text;
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => (message.textContent = ''), MESSAGE_MS);
    },
  };

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

  return toolbar;
}
