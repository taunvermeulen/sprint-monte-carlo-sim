/** The one-time explanation. Collapsed by default; four short points, no jargon. */
export function mountLearn(root: HTMLElement): void {
  root.innerHTML = `
    <details class="learn">
      <summary>How does this work &mdash; and why not just multiply velocity by sprints?</summary>
      <ol>
        <li><b>Your past sprints go in a bowl.</b> One slip of paper per sprint, each with what that sprint actually delivered.</li>
        <li><b>It replays the future 1,000 times.</b> For each remaining sprint it pulls out a slip, writes down that result and <i>puts the slip back</i> &mdash; so a replay can hit two bad sprints in a row, just like real life. Add up the slips and that's one possible future.</li>
        <li><b>The percentage is how often the replays hit your target.</b> 97% means 970 of the 1,000 futures got there.</li>
        <li><b>Why this beats one number.</b> Average velocity &times; sprints gives a single answer that's wrong about half the time. A range with odds lets you commit at 85% instead of 50% &mdash; and shows how much room you actually have.</li>
      </ol>
      <p class="hint">Nothing is assumed about the shape of your data &mdash; the bowl only ever contains sprints you really had. This is called resampling, or bootstrapping. It's more honest than fitting a bell curve to velocity, which would imply sprints below zero are possible and that unusually bad sprints are rarer than they are.</p>
      <p class="hint">Whole sprints are drawn, so each replay keeps the points and stories that happened together. Two measures are tracked because a project isn't done until both the effort (points) and the scope (stories) are delivered. When their odds disagree, the measure that swings more from sprint to sprint is the shaky one &mdash; usually a sign of inconsistent story sizes.</p>
    </details>`;
}
