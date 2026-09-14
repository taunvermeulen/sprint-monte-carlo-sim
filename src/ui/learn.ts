/** The one-time explanation. Collapsed by default; four short points, no jargon. */
export function mountLearn(root: HTMLElement): void {
  root.innerHTML = `
    <details class="learn">
      <summary>How does this work &mdash; and why not just multiply velocity by sprints?</summary>
      <ol>
        <li><b>It looks at your pattern.</b> How much the team finished in each past sprint, and how much that swung from sprint to sprint.</li>
        <li><b>It replays the future 1,000 times.</b> Each replay draws every remaining sprint from that same pattern &mdash; some good sprints, some bad &mdash; and adds them up.</li>
        <li><b>The percentage is how often the replays hit your target.</b> 97% means 970 of the 1,000 futures got there.</li>
        <li><b>Why this beats one number.</b> Average velocity &times; sprints gives a single answer that's wrong about half the time. A range with odds lets you commit at 85% instead of 50% &mdash; and shows how much room you actually have.</li>
      </ol>
      <p class="hint">For the curious: each replay is one draw from a normal distribution with mean <span class="mono">sprints &times; average</span> and spread <span class="mono">&radic;sprints &times; std&nbsp;dev</span>, floored at zero. Percentiles use the inclusive method, like a spreadsheet's PERCENTILE.</p>
      <p class="hint">Two measures are tracked because a project isn't done until both the effort (points) and the scope (stories) are delivered. When their odds disagree, it usually means stories are sized too big or too small.</p>
    </details>`;
}
