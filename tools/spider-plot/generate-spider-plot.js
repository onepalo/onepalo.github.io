const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const configPath = path.join(__dirname, "spider-plot.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const outputPath = path.join(rootDir, config.output);

const axes = config.axes;
const { width, height } = config.viewBox;
const { centerX, centerY, radius, labelRadius, levels } = config.plot;
const { max } = config.scale;
const style = config.style;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function polarPoint(index, distance) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / axes.length;
  return {
    x: centerX + Math.cos(angle) * distance,
    y: centerY + Math.sin(angle) * distance,
    angle
  };
}

function formatNumber(value) {
  return Number(value.toFixed(2));
}

function pointsToString(points) {
  return points.map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`).join(" ");
}

function labelAnchor(angle) {
  const xDirection = Math.cos(angle);
  if (xDirection > 0.35) {
    return "start";
  }
  if (xDirection < -0.35) {
    return "end";
  }
  return "middle";
}

function labelOffset(angle, lineCount) {
  const yDirection = Math.sin(angle);
  if (yDirection < -0.85) {
    return 0;
  }
  if (yDirection > 0.85) {
    return -((lineCount - 1) * style.labelFontSize * 1.2) / 2;
  }
  return -((lineCount - 1) * style.labelFontSize * 1.2) / 2;
}

function renderGrid() {
  const polygons = [];
  for (let level = 1; level <= levels; level += 1) {
    const levelRadius = (radius * level) / levels;
    const points = axes.map((_, index) => polarPoint(index, levelRadius));
    polygons.push(`<polygon class="grid-ring" points="${pointsToString(points)}" />`);
  }

  const spokes = axes.map((_, index) => {
    const point = polarPoint(index, radius);
    return `<line class="grid-spoke" x1="${centerX}" y1="${centerY}" x2="${formatNumber(point.x)}" y2="${formatNumber(point.y)}" />`;
  });

  return [...polygons, ...spokes].join("\n      ");
}

function renderValueShape() {
  const points = axes.map((axis, index) => {
    const axisValue = Math.max(0, Math.min(axis.value, max));
    return polarPoint(index, (axisValue / max) * radius);
  });

  const dots = points.map((point) => `<circle class="value-dot" cx="${formatNumber(point.x)}" cy="${formatNumber(point.y)}" r="2.05" />`);

  return [`<polygon class="value-shape" points="${pointsToString(points)}" />`, ...dots].join("\n      ");
}

function renderLabels() {
  return axes.map((axis, index) => {
    const point = polarPoint(index, labelRadius);
    const lines = axis.label;
    const anchor = labelAnchor(point.angle);
    const baseY = point.y + labelOffset(point.angle, lines.length);
    const tspans = lines.map((line, lineIndex) => {
      const dy = lineIndex === 0 ? 0 : style.labelFontSize * 1.2;
      return `<tspan x="${formatNumber(point.x)}" dy="${formatNumber(dy)}">${escapeXml(line)}</tspan>`;
    }).join("");

    return `<text class="axis-label" text-anchor="${anchor}" x="${formatNumber(point.x)}" y="${formatNumber(baseY)}">${tspans}</text>`;
  }).join("\n      ");
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="spider-title spider-desc">
  <title id="spider-title">Capability spider plot</title>
  <desc id="spider-desc">Radar chart summarizing subsurface expertise, analytics and AI, automation workflows, leadership, product delivery, and business impact.</desc>
  <defs>
    <style>
      .grid-ring,
      .grid-spoke {
        fill: none;
        stroke: ${style.gridStroke};
        stroke-width: .84px;
      }

      .value-shape {
        fill: ${style.valueFill};
        stroke: ${style.valueStroke};
        stroke-width: .84px;
        stroke-linejoin: round;
      }

      .value-dot {
        fill: ${style.dotFill};
      }

      .axis-label {
        fill: ${style.labelFill};
        font-family: ${style.labelFontFamily};
        font-size: ${style.labelFontSize}px;
        font-weight: ${style.labelFontWeight};
      }
    </style>
  </defs>
  <g id="spider-plot">
      ${renderGrid()}
      ${renderValueShape()}
      ${renderLabels()}
  </g>
</svg>
`;

fs.writeFileSync(outputPath, svg, "utf8");
console.log(`Generated ${path.relative(rootDir, outputPath)}`);