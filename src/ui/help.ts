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
