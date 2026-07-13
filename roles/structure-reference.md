# Role Pages Structure Reference
> `roles/digital.html` and `roles/geoscience.html` — Last reviewed: 2026-07-12

Role detail is consolidated into **two** pages instead of one file per role, each still built as a single fixed-size, print-ready `.editorial-detail` sheet:

- `roles/digital.html` — digital/product roles (Senior Analyst Specialist, Product Owner)
- `roles/geoscience.html` — geoscience/technical roles (Technical Lead, Exploration Geoscientist, Senior Seismic Interpreter, Early Career)

Each page has one shared hero (page-level headline + summary) and a list of compact `.role-card` entries — one per job — instead of a full hero + 3 moments per role. This keeps each page a single printable A4 sheet even with multiple roles on it.

`site/leadership/index.html` is a separate, unrelated page with its own `.leadership-detail` magazine-spread template — not part of this pattern.

## HTML Structure

```
<body .detail-page .editorial-detail>
└── <main .detail-shell>          flex column container
    │
    ├── <header .detail-hero>     natural height, flex-shrinks to content
    │   └── <div>
    │       ├── <p .detail-kicker>       Group label | Date range
    │       ├── <h1>                     Page-level editorial headline
    │       └── <p .detail-summary>      Overview paragraph spanning all roles on the page
    │
    └── <div .detail-grid>        flex: 1 — stretches to fill remaining height
        └── <div .detail-main>
            └── <ol .role-index>
                └── <li .role-card id="...">   one per role, anchor-linkable from index.html
                    ├── <p .role-card-meta>       Company | Location | Date range
                    ├── <h3>                      Job title
                    ├── <p .role-card-summary>     1 short sentence — why the role existed
                    └── <ul .role-card-highlights> 2 compact bullets — key achievements

    └── <footer .detail-footer>   position: absolute, bottom: 28px
        └── <a .detail-link>      Back to CV timeline
```

## Content Hierarchy

| Zone | Element | Purpose |
|---|---|---|
| Hero | `.detail-kicker` | Group label + date range (absolute, top-right) |
| Hero | `h1` | Page-level editorial headline |
| Hero | `.detail-summary` | Overview paragraph tying all roles on the page together |
| Grid | `.role-card` | One per job: meta line, title, 1-sentence summary, 2 highlight bullets |

## Dividers (active)

| Element | Rule | Position |
|---|---|---|
| `.detail-hero` | `border-bottom` | Below the hero, above the first role card |
| `.role-card:not(:first-child)` | `border-top` | Between consecutive role cards |
| `.detail-footer` | `border-top` | Above "Back to CV timeline" link |

## Layout Behaviour

- `.detail-shell` — `display: flex; flex-direction: column` — stacks hero + grid vertically
- `.detail-hero` — `flex-shrink: 0` — hero never compresses even if page content grows
- `.detail-grid` — `flex: 1` — stretches to fill all remaining vertical space
- `.role-card-summary` / `.role-card-highlights` — `max-width: 520px` for readable line length
- Content per role must stay compact (1 sentence + 2 bullets) — with up to 4 roles on `geoscience.html`, the fixed sheet height has no room for the older 3-moment format

## Using as Template

To add a new role to one of these pages:

1. **Copy** an existing `<li class="role-card">` block and give it a unique `id` (used for deep-linking from `index.html`)
2. Fill in `.role-card-meta` (Company | Location | Dates), `h3` (job title), `.role-card-summary` (1 sentence), and 2 `.role-card-highlights` bullets
3. **`index.html`** — add/update the matching timeline `.role-link` href to `roles/digital.html#your-id` or `roles/geoscience.html#your-id`
4. Keep bullets short — verify the page still fits within the fixed sheet height (no scrolling, `overflow: hidden` on `.detail-shell`)

## Styling Files

- `assets/css/styles.css` — base variables and shared components
- `assets/css/detail.css` — detail page layout; `.editorial-detail` overrides include `.role-index`/`.role-card` at the top of the file

## Styling Notes (2026-07-12)

- `.editorial-detail`'s `--editorial-*` custom properties (accent, ink, paper, etc.) map to `index.html`'s shared root tokens (`--gold`, `--ink-strong`, `--paper-bg`, ...) — keep it that way so these pages don't drift into a separate color scheme.
- `.role-card-meta` has no flag icons — text only (`Company | Location | Date range`).
- `.role-badge`/`.role-badge-geo` are solid-filled pills (white text on `--clickable` for Digital, `--gold` for Geo), identical to the badges on `index.html`.

