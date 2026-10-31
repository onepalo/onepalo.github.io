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
| `npm run preview`    | Serve the production bundle locally.                     |

## Project structure

```text
src/
	app/          Application state, hash navigation, and stage transitions
	assets/       Candidate imagery used by the experience
	components/   Navigation, landing visual, experience sections
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
- **Beyond**: Personal initiative, cross-functional influence, and evidence-led examples of delivery and decision impact beyond the formal role.

The primary tabs follow **Home → Why Me? → Resume → Beyond**. The **Continue the story** controls follow the same section order, then loop from Beyond back to Why Me?.

The home page's three planets open **Why Me?**, **Resume**, and **Beyond**. On phones, the existing compact home layout keeps planets hidden and uses the primary navigation instead.


Existing `#testimonial` and `#how-i-work` links open **Why Me?** (`#cover`). Direct `#testimonial/<slug>` links still open the matching recommendation with **Why Me?** active; closing the dialog returns to `#cover`.

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
