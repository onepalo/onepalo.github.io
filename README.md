# Rafael Navarro CV Site

This folder is the application-ready CV site. Treat its contents as the publishable root for `onepalo/onepalo.github.io`.

## Entry Points

- `index.html` - Main formal CV timeline.
- `roles/` - Supporting role detail pages linked from the timeline.
- `talent-card/` - Self-contained Talent Card reference page.
- `downloads/` - Shareable generated files. Current export: `rafael-navarro-2026-cv.pdf`.

## Assets

- `assets/css/styles.css` - Main timeline styling.
- `assets/css/detail.css` - Shared detail-page styling, including the editorial detail layout.
- `assets/js/document-actions.js` - Document control script for print/export actions.
- `assets/img/` - Runtime images loaded by the formal pages only.
- `docs/reference-assets/` - Preserved images that are not currently used by the live formal pages.
- `tools/spider-plot/` - Editable source and generator for the reference spider plot asset.

## Publishing Notes

- Copy the contents of this folder to the root of `onepalo/onepalo.github.io`.
- Keep `.nojekyll` in the published root so GitHub Pages serves the site as plain static files.
- Keep public URLs lowercase and hyphenated.

## Maintenance Notes

- Keep runtime file names lowercase and descriptive.
- Put new shareable PDFs or print exports in `downloads/`.
- Preview `index.html` and all linked files in `roles/` after changing shared CSS or assets.
- Keep source material and archived experiments outside this folder unless they are intentionally promoted into the published site.
