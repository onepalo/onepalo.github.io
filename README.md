# Exploration Universe

An interactive React portfolio for Rafael Navarro, an AI Exploration Geoscientist. The experience connects the case for the role, team leadership approach, career evidence, and impact through a single-page visual narrative.

## Run locally

Prerequisite: Node.js 20 or later.

```bash
npm install
npm run dev
```

Vite prints the local URL in the terminal, normally `http://localhost:5173`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Type-check and create the production bundle in `dist/`. |
| `npm run lint` | Run ESLint across the project. |
| `npm run preview` | Serve the production bundle locally. |

## Project structure

```text
src/
	app/          Application state, hash navigation, and stage transitions
	assets/       Candidate imagery used by the experience
	components/   Navigation, landing visual, and experience sections
	content/      CV content, types, and source notes
	styles/       Design tokens and global responsive styles
	utils/        Hash navigation helpers
```

The main editable narrative lives in `src/content/content.ts`. Update professional facts, career entries, leadership practices, connection-map nodes, and impact stories there. Keep component and CSS changes for structural or visual work.

## Sections

- **Why Me?**: Cover-letter case for the role, supported by the professional connection map.
- **How I Will Lead the Team**: Team contract, operating system, leadership practices, and working rhythm.
- **Resume / CV**: Career narrative, profile, and expandable experience evidence.
- **Proof of Leadership**: Personal initiative, cross-functional influence, and evidence-led examples of delivery and decision impact.

## Content and assets

- Candidate images live in `src/assets/candidate/`.
- `CoverLetterLeadAIEmbedment.md`, `cover-letter-template.md`, `guide-me.html`, and the source documents in `src/content/` are local working material. They are excluded from Git to avoid publishing non-runtime source material.

## Publishing to GitHub Pages

This project is configured to deploy to the root of `https://onepalo.github.io/` through GitHub Actions. The workflow builds the site from `main` and publishes only `dist/`.

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
