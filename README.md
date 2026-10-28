# Exploration Universe

An interactive React portfolio for Rafael Navarro, an AI Exploration Geoscientist. The experience connects the case for the role, team leadership approach, career evidence, and impact through a single-page visual narrative.

## Run locally

Prerequisite: Node.js 22.13+ (22.x LTS), 24.x LTS, or 26+.

```bash
npm ci
npm run dev
```

Vite prints the local URL in the terminal, normally `http://localhost:5173`.

## Commands

| Command                | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`        | Start the local development server.                      |
| `npm run build`      | Type-check and create the production bundle in`dist/`. |
| <br />`npm run lint` | Run ESLint across the project.                           |
| `npm test`          | Check hash navigation, recommendation state, and dialog focus. |
| `npm run optimize:images` | Regenerate optimized WebP images from the original PNG assets. |
| `npm run generate:spare-characters` | Regenerate and verify all 20 reserve character sprite sheets and preview. |
| `npm run preview`    | Serve the production bundle locally.                     |

## Project structure

```text
src/
	app/          Application state, hash navigation, and stage transitions
	assets/       Candidate imagery used by the experience
	components/   Navigation, landing visual, experience sections, and PixiJS AI Operations Center
	content/      CV content, types, and source notes
	styles/       Design tokens and global responsive styles
	utils/        Hash navigation helpers
```

The main editable narrative lives in `src/content/content.ts`. Update professional facts, career entries, leadership practices, connection-map nodes, and impact stories there. Keep component and CSS changes for structural or visual work.

## Responsive Layout

Editorial sections use a shared $900px$ breakpoint: when a side label and reading content no longer have comfortable width, the label moves above the content and the section becomes a single reading column. This applies to the CV statement and profile, cover-letter sections, and leadership sections.

Below $760px$, each interactive component uses its established compact layout for controls and details. When adding a new editorial section, extend the grouped responsive rules in `src/styles/globals.css` instead of adding a one-off breakpoint.

## Sections

- **Why Me?**: Professional introduction and working approach, followed by **What colleagues say**, with all 11 recommendations in the testimonial carousel and full-recommendation dialogs. Testimonials no longer have a separate navigation tab or home-world entry.
- **Resume / CV**: Career narrative, profile, and expandable experience evidence.
- **AI Operations Center**: A responsive PixiJS open-plan office where eight subsurface workflow agents work in the open space and director Rafael oversees operations from his open-door office. Monitors animate with each member's status, finished deliverables are handed desk-to-desk along a subsurface workflow (data ingestion → well logs → petrophysics → reservoir → economics, and geophysics → geology → GIS) before reaching Rafael for review, pixel-art speech bubbles show who is waiting, reviewing, or carrying results, and all task progress, status, and metrics are generated locally.
- **Beyond**: Personal initiative, cross-functional influence, and evidence-led examples of delivery and decision impact beyond the formal role.

The primary tabs follow **Home → Why Me? → Resume → AI Operations → Beyond**. The **Continue the story** controls follow the same section order, then loop from Beyond back to Why Me?.

The home page's four planets open **Why Me?**, **Resume**, **AI Operations**, and **Beyond**. AI Operations occupies the former Testimonial planet's lower-left position. On phones, the existing compact home layout keeps planets hidden and uses the primary navigation instead.

The AI Operations Center reuses the character sprites and walk/typing animation frames from [Pixel Agents](https://github.com/pablodelucca/pixel-agents), licensed under MIT. The required copyright and license notice is included in `public/assets/agent-office/LICENSE`; the floor texture, desks, computers, and office layout are original to this project.

Existing `#testimonial` and `#how-i-work` links open **Why Me?** (`#cover`). Direct `#testimonial/<slug>` links still open the matching recommendation with **Why Me?** active; closing the dialog returns to `#cover`.

### Inspectable workflow case and Python downloads

The bookshelf in Rafael's office reveals a visitor-controlled synthetic porosity case, separate from the ambient simulation and its metrics. Its transparent hotspot has only a subtle gold hover/focus highlight. The case opens in a focus-trapped dialog and retains its progress when closed. Joel registers five fictional samples; Palo flags a porosity value outside the declared fraction range. The visitor can return to the source or accept its exclusion without silently correcting units. Igor's deterministic proposal reports the arithmetic mean of the four accepted samples, the demo screening threshold, and the missing evidence. The visitor, acting as Rafael, must enter a rationale before approving a limited handoff to Luke or rejecting the proposal.

The downloadable JSON record includes the original rows, dataset and schema versions, quality rule, accepted and excluded rows, calculation, limitations, human decision, rationale, and timestamped provenance. It is a local illustration, not a live AI call, Python execution, authenticated sign-off, or development recommendation. Restart clears the case; the office Reset clears both the case and the ambient simulation.

The Well Logs printer itself is a hidden, keyboard-accessible download action with a subtle gold hover/focus highlight, no visible button or action bar. It offers four Spotfire data functions individually and together as a ZIP:

- [PP-Porosity-Trend.py](public/downloads/well-logs/PP-Porosity-Trend.py)
- [PP-RSPSequence.py](public/downloads/well-logs/PP-RSPSequence.py)
- [PP-GridInt.py](public/downloads/well-logs/PP-GridInt.py): Spatial grid generation, clipping, and IDW or minimum-curvature TPS interpolation.
- [PP-Countruns.py](public/downloads/well-logs/PP-Countruns.py): Contour lines and binned heatmaps from interpolated grid data.
- [Well-Logs-Python-Tools.zip](public/downloads/well-logs/Well-Logs-Python-Tools.zip)

The scripts require their configured Spotfire inputs, NumPy, and pandas; the porosity trend optionally uses SciPy. Grid interpolation and contours additionally require `spotfire_geospatial`. `PP-Countruns.py` is the original root-level `PP-Countruns` file with a Python extension added; its contents are unchanged. Their algorithms are not run or validated by the site. These files are public deployment assets. After editing any script, regenerate the ZIP from the repository root (PowerShell):

```powershell
Compress-Archive -Path public/downloads/well-logs/*.py -DestinationPath public/downloads/well-logs/Well-Logs-Python-Tools.zip -Force
```

### Spare characters

Ten additional palette variants are stored in [public/assets/agent-office/characters/spares/](public/assets/agent-office/characters/spares/), numbered `spare_01.png` through `spare_10.png`. See the [character preview](public/assets/agent-office/characters/spares/preview.png) for their different hair colors, skin tones, and outfits. These are locally stored derivatives of the same MIT-licensed sprites, not entirely new artwork; the existing license notice also applies to them.

Each sheet retains the original transparent 112 x 96 layout, with 16 x 32 animation frames for walking and typing. The active exploration team and its workflows are unchanged. Below the Exploration Floor, a separate **Backup Team / Next Mission** lounge gives the ten fictional reserves a coffee corner, CV repair shop, interview rehearsal area, opportunity board, and networking loop. Pairs change activities every 12 seconds of simulation time. Select any character directly in the lounge (hovering or focusing the networking loop pauses it so marchers are easy to catch). Mirroring the floor above, the lounge has its own sidebar: a **Selected reserve** card with the character's status and playful job-search pitch, and a **Next departures** card with the mission board entry point and an **Upstairs now** list of guests and their trip progress.

The mission text lives in a **Mission board** pop-out, opened from the departures card or **Choose a mission for…**, so it takes no page space until requested. It offers three repeatable demo missions: rescue a mystery dataset, investigate a seismic anomaly, or prepare a decision brief. Each brief preselects the chosen character, or proposes a different available guest, and can be changed with the guest menu. Each mission accepts one visitor, and each reserve can take only one mission at a time, allowing up to three simultaneous guests. Guests leave the lounge, enter the main office through the lower aisle, walk to the relevant workstation, spend 8-10 simulation seconds on their illustrative task, and return. The **Upstairs now** list and the board show each trip's progress, and the board shows a result when they arrive back. **Watch upstairs** closes the board and scrolls to the office. These visits are separate from the main agents, deliverables, task assignments, and operational metrics; no actual analysis or hiring takes place.

The pop-out traps focus, closes with Escape or a backdrop click, returns focus to its opener, and becomes a bottom sheet on small screens. On phones (620px and below) both detail sidebars are hidden so the office and lounge scenes get the space; a compact bar in the lounge keeps the selected character and a **Send … on a mission** button available. The lounge's pause/resume button shares the main simulation control and clock, including guest travel and mission progress. Sending is disabled, with the reason shown, while paused or if the scene or lounge sprites report a loading error. Reset clears all reserve missions, restarts lounge activities, closes the board, and restores the initial selection. Reduced-motion preferences stop lounge walk/typing cycles and show guests at their destination instead of interpolating their travel. Missing sprite assets produce a visible warning and a console error without replacing the original office. All sprites, missions, and profile text are local; there is no hiring service or external data feed. Lounge styles live in `src/components/AIOperationsCenter/backup-team.css`.

Run `npm run generate:spare-characters` to regenerate the PNGs from the original sheets. Run `npm run generate:spare-characters -- --check` to verify all 10 saved sheets, their palettes, dimensions, transparency, uniqueness, and preview without rewriting them. Keep the generated PNGs and generator in the repository for backup; no external repository is needed to regenerate them.

## Content and assets

- Candidate images live in `src/assets/candidate/`.
- Runtime WebP copies live in `src/assets/candidate/optimized/`. After replacing an original image, run `npm run optimize:images` and commit the regenerated copies. Keep the original PNG files for future edits.
- `CoverLetterLeadAIEmbedment.txt`, `cover-letter-template.md`, `guide-me.html`, and the source documents in `src/content/` are local working material. They are excluded from Git to avoid publishing non-runtime source material.

## Publishing to GitHub Pages

This project is configured to deploy to the root of `https://onepalo.github.io/` through GitHub Actions. The workflow builds the site from `main` and publishes only `dist/`.

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the complete replacement, verification, and rollback procedure.

To replace the existing contents of `onepalo/onepalo.github.io` with this project:

```bash
git clone https://github.com/onepalo/onepalo.github.io.git
cd onepalo.github.io
# Replace all files except .git with this project's files.
git add -A
git commit -m "Replace site with Exploration Universe"
git push origin main
```

Before the first deployment, in GitHub go to **Settings → Pages** and select **GitHub Actions** as the source. Review the staged files before pushing. Personal data, local source documents, dependencies, build output, and environment files are ignored; runtime candidate images remain versioned because the application needs them.

## Local deployment check

Run `npm run build` to create the production bundle locally. The application uses hash navigation, so it does not require server-side route rewrites.
