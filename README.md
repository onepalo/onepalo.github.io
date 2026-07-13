# Rafael Navarro CV Site

This folder is the application-ready CV site. Treat its contents as the publishable root for `onepalo/onepalo.github.io`.

## Entry Points

- `index.html` - Main formal CV timeline.
- `roles/digital.html` - Digital/product roles (Senior Analyst Specialist, Product Owner), consolidated into one page with a compact role-card per job.
- `roles/geoscience.html` - Geoscience/technical roles (Technical Lead, Exploration Geoscientist, Senior Seismic Interpreter, Early Career), consolidated the same way.
- `leadership/` - Standalone "Leadership & Beyond" editorial page (civic impact, sport, ventures) — uses its own layout, not the shared role template.
- `talent-card/` - Self-contained Talent Card reference page.
- `downloads/` - Shareable generated files. Current export: `rafael-navarro-2026-cv.pdf`.

## Assets

- `assets/css/styles.css` - Main timeline styling.
- `assets/css/detail.css` - Shared detail-page styling, including the editorial detail layout.
- `assets/js/document-actions.js` - Document control script for print/export actions.
- `assets/img/` - Runtime images loaded by the formal pages only.
- `docs/reference-assets/` - Preserved images that are not currently used by the live formal pages.
- `tools/spider-plot/` - Editable source and generator for the reference spider plot asset.

## `index.html` Layout

> Last reviewed: 2026-07-11

The main CV page is structured top to bottom as:

1. **Hero (`.masthead`)** - portrait, name, headline, LinkedIn and Talent Card links.
2. **About (`.about`)** - full-width intro section, sits between the hero and the two-column body.
3. **Two-column body (30/70 split)**:
   - **Left panel (`.left-panel`, ~30%)** - Digital Core, Subsurface Domain, Education, and certification, each list pipe-separated (`|`).
   - **Timeline (`.timeline`, ~70%)** - career roles, each with a two-line proof link (`role-proof-link` wraps text in a `<span>` with a manual `<br>`).
4. **Footer (`.capability-footer`)** - contact-only: email and phone, separated by a pipe (`.footer-separator`).

### Responsive behavior

- **Desktop/tablet (screen, >760px)** - fixed-size "sheet" canvas (simulated A4 page) using absolute positioning, as described above.
- **Mobile (`@media screen and (max-width: 760px)`)** - real reflowed layout: hero stacks and centers, About/left-panel/timeline become full-width stacked blocks, timeline entries render as bordered cards (no rail/dot). This query is scoped to `screen` so it never affects print output.
- **Print/PDF export (`@media print`)** - always renders the fixed desktop "sheet" layout at A4 size (`--sheet-print-scale`), regardless of the viewport the export was triggered from. The download button (top-right arrow) calls `window.print()`, so exports are always the themed A4 version, never the mobile layout.

## Publishing Notes

- Copy the contents of this folder to the root of `onepalo/onepalo.github.io`.
- Keep `.nojekyll` in the published root so GitHub Pages serves the site as plain static files.
- Keep public URLs lowercase and hyphenated.

## Maintenance Notes

- Keep runtime file names lowercase and descriptive.
- Put new shareable PDFs or print exports in `downloads/`.
- Preview `index.html`, `roles/digital.html`, `roles/geoscience.html`, and `leadership/` after changing shared CSS or assets.
- Keep source material and archived experiments outside this folder unless they are intentionally promoted into the published site.
- `.editorial-detail` (used by `roles/digital.html` and `roles/geoscience.html`) shares `index.html`'s gold/paper color tokens (`--gold`, `--ink-strong`, `--paper-bg`, etc.) via its own `--editorial-*` variables — don't give it a separate hardcoded palette, or the role pages will visually diverge from `index.html` again.
- `role-card-meta` on the role detail pages has no flag icons (removed 2026-07) — only `index.html`'s timeline `country-pill` still shows flags. `.role-badge`/`.role-badge-geo` are solid-filled pills (white text on `--clickable`/`--gold`), shared identically between `index.html` and the role detail pages.
