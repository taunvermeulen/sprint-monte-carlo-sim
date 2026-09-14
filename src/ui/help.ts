import { escapeHtml } from './format';

/** Short, plain-language explanations. One or two sentences each — no more. */
export const GLOSSARY = {
  points:
    'Story points: the effort your team completed in that sprint, using your own estimates. Any scale works as long as it stays consistent.',
  stories:
    'How many stories (tickets) the team finished. Tracking both points and stories catches sizing problems — lots of points but few stories, or the reverse.',
  window:
    'Older sprints may not reflect the team today. Use fewer sprints if the team or the kind of work changed recently.',
  variability:
    'The ± is how much a typical sprint swings from the average. That swing is why the forecast is a range with odds, not a single number.',
  probability:
    'The remaining sprints were replayed 1,000 times using your team’s real pattern. This is how many of those replays reached the target.',
  p85:
    'The amount you reached in 85 of every 100 replays. Committing here means you’re wrong about one time in seven — the level most teams are comfortable with.',
  storySize:
    'Your usual points per story, taken from your history. It turns the point target into a story count so the forecast can be checked both ways.',
  trials: 'How many times the remaining sprints are replayed. More trials give a steadier percentage; 1,000 is plenty.',
  reroll: 'Every run rolls the dice again, so the numbers wobble by a point or two. That wobble is normal — the range matters more than the last digit.',
  sprintLength:
    'How long one sprint is — it sets how many sprints fit before the target date. It must match the sprints in step 1: a 2-week history counted as 1-week sprints would double the forecast.',
} as const;

export type HelpKey = keyof typeof GLOSSARY;

/** An inline "?" that reveals its explanation on hover, focus or tap. */
export function help(key: HelpKey): string {
  return `<span class="help"><button type="button" class="help-btn" aria-label="What does this mean?">?</button><span class="help-pop" role="tooltip">${escapeHtml(GLOSSARY[key])}</span></span>`;
}

const POP_WIDTH = 260;
const GAP = 8;
const EDGE = 12;

/**
 * Popovers are positioned against the viewport, not the button, so they are
 * never clipped by a scrolling table or pushed off a narrow screen.
 */
export function initHelpPopovers(root: ParentNode = document): void {
  const place = (button: HTMLElement) => {
    const pop = button.nextElementSibling as HTMLElement | null;
    if (!pop) return;
    const r = button.getBoundingClientRect();
    const width = Math.min(POP_WIDTH, window.innerWidth - EDGE * 2);
    const left = Math.min(Math.max(r.left + r.width / 2 - width / 2, EDGE), window.innerWidth - width - EDGE);
    pop.style.width = `${width}px`;
    pop.style.left = `${left}px`;
    // Prefer above; drop below when there's no room.
    pop.classList.toggle('below', r.top < 120);
    pop.style.top = r.top < 120 ? `${r.bottom + GAP}px` : `${r.top - GAP}px`;
    pop.style.setProperty('--arrow-x', `${r.left + r.width / 2 - left}px`);
  };
  const onShow = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('.help-btn');
    if (button) place(button);
  };
  root.addEventListener('mouseover', onShow);
  root.addEventListener('focusin', onShow);

  // Tap to pin open (touch screens don't hover, and iOS doesn't focus buttons); tap elsewhere to close.
  root.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('.help-btn');
    const wasOpen = button?.parentElement?.classList.contains('open');
    root.querySelectorAll('.help.open').forEach((el) => el.classList.remove('open'));
    if (button && !wasOpen) {
      place(button);
      button.parentElement?.classList.add('open');
    }
  });
}
