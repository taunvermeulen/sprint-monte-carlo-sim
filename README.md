# Monte Carlo Sprint Sim

Forecasts whether a team will hit a delivery target by a date, from its sprint
history. Two measures are simulated side by side — **velocity** (story points)
and **flow** (stories completed) — because a project isn't done until both
effort and scope land.

Ported from a Google Sheets Apps Script dashboard. Same model, same numbers.

## Who it's for

Scrum teams who want to estimate in odds rather than promises, without needing
to know what a Monte Carlo simulation is. The screen is three steps and one
answer; everything a statistician would want is one click away.

- **Step 1 — Your sprints.** Points and stories finished per sprint. Type them,
  paste from a spreadsheet, or import a file.
- **Step 2 — Your goal.** Points to deliver, by which date, sprint length.
- **Step 3 — Your odds.** One percentage, a verdict, and a "safe bet" number in
  plain English.
- **Show the full breakdown** reveals velocity and flow tiles, the P50–P95
  table, histograms and the cross-reference rules. The choice is remembered.
- Every `?` explains one idea in two sentences. *How does this work?* at the
  bottom tells the whole story in four points.

## What it does

1. Takes sprint history (name, points, stories) — typed, pasted from a
   spreadsheet, or imported.
2. Computes rolling average and sample standard deviation per measure over a
   chosen window (all sprints or the last N).
3. Works out sprints available between the start and target dates, and the story
   scope from target points ÷ average story size.
4. Rolls 1,000–10,000 trials: each is one draw from
   `N(sprints · mean, √sprints · sd)`, floored at zero.
5. Reports the probability of hitting each target, the P50/P75/P85/P95
   outcomes, a histogram of the trials, and a plain-language reading:
   which sizing problem (if any) the two odds reveal, and which P85 is the
   binding commitment.

Nothing else. No accounts, no server, no tracking.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # production build in dist/
```

## Architecture

```
index.html            page shell: static regions the views mount into
src/
  main.ts             entry: styles + startApp()
  app.ts              composition root: loads inputs, wires store → views → forecast
  domain/             pure logic, no DOM, fully unit-tested
    types.ts          Sprint, ForecastInputs, DerivedInputs, Forecast
    statistics.ts     mean, sample std dev, inclusive percentile, fraction ≥ threshold
    random.ts         Box–Muller normal, seeded RNG for tests
    history.ts        history window, series stats, derived figures (sprints, scope)
    simulation.ts     simulateDelivery / runForecast
    interpretation.ts confidence bands, sizing diagnosis, binding commitment
  state/
    store.ts          minimal observable store (get / set / update / subscribe)
    schema.ts         normalizeInputs: anything → valid ForecastInputs
    defaults.ts       example inputs shown on first open
    options.ts        allowed windows, sprint lengths, trial counts
  services/           browser-facing I/O, each behind a small function
    storage.ts        localStorage repository
    serialization.ts  compact wire format for links and files
    shareLink.ts      inputs ⇄ URL hash
    transfer.ts       JSON export / import, clipboard
    preferences.ts    per-browser UI preferences (breakdown open/closed)
    spreadsheetParser.ts  pasted spreadsheet text → sprint rows
  ui/                 one module per screen region; render from state, write to the store
    toolbar.ts        title, share / export / import
    sprintTable.ts    step 1: editable history, paste box, options
    targetsForm.ts    step 2: goal, dates, sprint length, options
    odds.ts           step 3: the answer — headline odds, safe bet, verdict
    results.ts        the full breakdown + the plain-language summaries
    histogram.ts      SVG column chart
    learn.ts          the collapsed "how does this work" explainer
    help.ts           glossary + the inline "?" popover
    format.ts         number/date/HTML formatting helpers
  styles/
    tokens.css        colours and fonts (light + dark)
    app.css           layout and components
tests/                Vitest unit tests for domain and services
```

**Data flow.** `app.ts` builds a `Store<ForecastInputs>` from a share link,
saved state, or the defaults. Views subscribe to the store and re-render when
another view changes it; each view's own edits skip its re-render so typing
keeps focus. Every store change is saved to `localStorage` and, after a short
debounce, re-runs `runForecast` and re-renders the results.

**Persistence and sharing.** Inputs are saved per browser. To hand them to
someone else: *Copy share link* (the whole document travels in the URL
fragment) or *Export JSON* → *Import JSON*.

## Deploy

Any static host works; the build is plain HTML/CSS/JS.

**Vercel:** import the GitHub repo → Framework Preset "Vite" (auto-detected) →
Deploy. Every push to `main` redeploys.

**Netlify / GitHub Pages / anything else:** build command `npm run build`,
publish directory `dist`.
