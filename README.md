# Monte Carlo Sprint Sim

A single-file web app (`index.html`) that forecasts sprint delivery odds from your
sprint history — velocity (story points) and flow (stories) — using a 1,000–10,000
trial Monte Carlo simulation. No build step, no server, no dependencies.

## Run it locally
Double-click `index.html`.

## Deploy (pick one)

### Netlify Drop — fastest, no git
1. Go to https://app.netlify.com/drop (free account).
2. Drag this whole folder onto the page.
3. You get a public URL like `https://something.netlify.app`. Rename it under
   Site settings → Change site name.
To update later: open the site → Deploys → drag the folder again.

### GitHub Pages
1. Create an empty repo on GitHub (e.g. `monte-carlo-sprint-sim`).
2. In this folder:
   ```
   git remote add origin https://github.com/<you>/monte-carlo-sprint-sim.git
   git push -u origin main
   ```
3. Repo → Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Your app is at `https://<you>.github.io/monte-carlo-sprint-sim/`.
To update later: commit and push.

## Sharing data with others
- **Copy share link** — the sprint history and targets are packed into the URL;
  anyone opening it sees the same data.
- **Export / Import JSON** — a file you can send around or keep as a backup.
- Each person's edits are saved in their own browser (localStorage) between visits.
