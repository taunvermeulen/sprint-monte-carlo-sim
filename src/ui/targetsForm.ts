import type { ForecastInputs } from '../domain/types';
import type { Store } from '../state/store';
import { SPRINT_LENGTHS_DAYS } from '../state/options';
import { requireElement } from './format';

const SOURCE = 'targets-form';

const SPRINT_LENGTH_LABELS: Record<number, string> = { 7: '1 week', 14: '2 weeks', 21: '3 weeks' };

export function mountTargetsForm(root: HTMLElement, store: Store<ForecastInputs>): void {
  root.innerHTML = `
    <div class="panel-h"><h2>Project targets</h2></div>
    <div class="panel-b">
      <div class="form">
        <div class="f"><label for="startDate">Start date</label><input id="startDate" class="fld" type="date"></div>
        <div class="f"><label for="targetDate">Target date</label><input id="targetDate" class="fld" type="date"></div>
        <div class="f"><label for="sprintDays">Sprint length</label>
          <select id="sprintDays" class="sel">
            ${SPRINT_LENGTHS_DAYS.map((d) => `<option value="${d}">${SPRINT_LENGTH_LABELS[d]}</option>`).join('')}
          </select>
        </div>
        <div class="f"><label for="targetPoints">Target story points</label><input id="targetPoints" class="fld num" type="number" min="0" step="1"></div>
        <div class="f wide"><span class="lbl">Average story size (points per story)</span>
          <div class="radio">
            <label><input type="radio" name="sizeMode" id="sizeAuto" value="auto"> From history <span class="mono" id="autoSize"></span></label>
            <label><input type="radio" name="sizeMode" id="sizeManual" value="manual"> Set it
              <input id="sizeOverride" class="fld num short" type="number" min="0.1" step="0.1" aria-label="Points per story"></label>
          </div>
        </div>
      </div>
      <div class="derived" id="derived"></div>
    </div>`;

  const el = {
    startDate: requireElement<HTMLInputElement>(root, '#startDate'),
    targetDate: requireElement<HTMLInputElement>(root, '#targetDate'),
    sprintDays: requireElement<HTMLSelectElement>(root, '#sprintDays'),
    targetPoints: requireElement<HTMLInputElement>(root, '#targetPoints'),
    sizeAuto: requireElement<HTMLInputElement>(root, '#sizeAuto'),
    sizeManual: requireElement<HTMLInputElement>(root, '#sizeManual'),
    sizeOverride: requireElement<HTMLInputElement>(root, '#sizeOverride'),
  };

  function render(inputs: ForecastInputs): void {
    el.startDate.value = inputs.startDate;
    el.targetDate.value = inputs.targetDate;
    el.sprintDays.value = String(inputs.sprintDays);
    el.targetPoints.value = String(inputs.targetPoints);
    el.sizeAuto.checked = inputs.sizeMode === 'auto';
    el.sizeManual.checked = inputs.sizeMode === 'manual';
    el.sizeOverride.value = String(inputs.sizeOverride);
    el.sizeOverride.disabled = inputs.sizeMode !== 'manual';
  }

  const patch = (change: Partial<ForecastInputs>) => store.update((s) => ({ ...s, ...change }), { source: SOURCE });

  el.startDate.addEventListener('change', () => el.startDate.value && patch({ startDate: el.startDate.value }));
  el.targetDate.addEventListener('change', () => el.targetDate.value && patch({ targetDate: el.targetDate.value }));
  el.sprintDays.addEventListener('change', () => patch({ sprintDays: Number(el.sprintDays.value) }));
  el.targetPoints.addEventListener('input', () => patch({ targetPoints: Math.max(0, Number(el.targetPoints.value) || 0) }));
  el.sizeAuto.addEventListener('change', () => {
    patch({ sizeMode: 'auto' });
    el.sizeOverride.disabled = true;
  });
  el.sizeManual.addEventListener('change', () => {
    patch({ sizeMode: 'manual' });
    el.sizeOverride.disabled = false;
    el.sizeOverride.focus();
  });
  el.sizeOverride.addEventListener('input', () => {
    const value = Number(el.sizeOverride.value);
    if (value > 0) patch({ sizeOverride: value });
  });

  store.subscribe((inputs, meta) => {
    if (meta.source !== SOURCE) render(inputs);
  });
  render(store.get());
}
