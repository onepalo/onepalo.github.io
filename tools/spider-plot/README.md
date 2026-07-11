# Spider Plot Source

This folder owns the editable source for the CV spider plot.

- Edit `spider-plot.config.json` to change labels, values, scale, colors, or the number of legs.
- Run `node tools/spider-plot/generate-spider-plot.js` from `site/` to regenerate `docs/reference-assets/spider-plot.svg`.
- The generated SVG is preserved as a reference asset unless it is intentionally promoted into the live CV.

Values use the `scale.max` value from the config. For example, with `max: 5`, a value of `4` fills 80% of that axis.