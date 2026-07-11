# Detail Page Structure Reference
> `shell-us-analyst-specialist.html` — Last reviewed: 2026-07-11

## HTML Structure

```
<body .detail-page .editorial-detail>
└── <main .detail-shell>          flex column container
    │
    ├── <header .detail-hero>     natural height, flex-shrinks to content
    │   └── <div>
    │       ├── <p .detail-kicker>       Location | Date range (absolute top-right)
    │       ├── <h1>                     Editorial headline
    │       ├── <p .detail-role>         Job title (uppercase, muted)
    │       └── <p .detail-summary>      Lead paragraph — why/how in 2 sentences
    │
    └── <div .detail-grid>        flex: 1 — stretches to fill remaining height
        └── <div .detail-main>    flex column, gap: 22px
            │
            ├── <ol .moments-list>       Three numbered moments
            │   ├── <li .moment>  01 · h3 (title) + p (what + result, 2 sentences)
            │   ├── <li .moment>  02 · h3 + p
            │   └── <li .moment>  03 · h3 + p
            │
            └── <aside .detail-meta>     margin-top: auto — always anchored to bottom
                ├── <div .meta-block>    Core Stack
                └── <div .meta-block>    Domain Focus

    └── <footer .detail-footer>   position: absolute, bottom: 28px
        └── <a .detail-link>      Back to CV timeline
```

## Content Hierarchy

| Zone | Element | Purpose |
|---|---|---|
| Hero | `.detail-kicker` | Location + date range (absolute, top-right) |
| Hero | `h1` | Editorial headline — punchy, ~3–5 words |
| Hero | `.detail-role` | Exact job title (uppercase, muted) |
| Hero | `.detail-summary` | Lead paragraph — why this role existed + how it was approached |
| Grid | `.moments-list` items | Three numbered entries: `01` `02` `03` — h3 title + 2-sentence narrative |
| Grid | `.detail-meta` | Core Stack + Domain Focus — anchored to bottom via `margin-top: auto` |

## Dividers (active)

| Element | Rule | Position |
|---|---|---|
| `.detail-hero` | `border-bottom` | Below the hero, above moment 01 |
| `.moment:not(:first-child)` | `border-top` | Between moment 01→02, and 02→03 |
| `.detail-footer` | `border-top` | Above “Back to CV timeline” link |

> Meta has **no top divider** — visual separation comes from `margin-top: auto` whitespace alone.

## Layout Behaviour

- `.detail-shell` — `display: flex; flex-direction: column` — stacks hero + grid vertically
- `.detail-hero` — `flex-shrink: 0` — hero never compresses even if page content grows
- `.detail-grid` — `flex: 1` — stretches to fill all remaining vertical space
- `.detail-main` — flex column with `gap: 22px` — moments flow naturally, meta anchors to bottom
- `.detail-meta` — `margin-top: auto` — always pushed to bottom of available space above footer
- Background image (`usa-detail-background.png`) scoped to `.with-bg-map` only - **not on this page**

## Using as Template

To create a new `editorial-detail` page from this file:

1. **Copy** `shell-us-analyst-specialist.html` and rename it
2. **`<head>`** — update `<title>` to match the new role
3. **Hero** — update four elements:
   - `.detail-kicker` — Location | Date range
   - `h1` — new editorial headline
   - `.detail-role` — new job title
   - `.detail-summary` — lead paragraph (why + how)
4. **Moments** — replace `01` / `02` / `03` content with the new role’s three key moments
5. **Meta** — update Core Stack and Domain Focus values
6. **Body class** - keep `detail-page editorial-detail`; add `with-bg-map` only if background image is needed
7. **`index.html`** — update the `href` on the matching `.role-link` in the timeline

## Styling Files

- `assets/css/styles.css` — base variables and shared components
- `assets/css/detail.css` - detail page layout; `.editorial-detail` overrides at the bottom
