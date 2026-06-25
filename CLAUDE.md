# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build

```bash
node build.js
```

Reads `content.md`, generates `index.html`. No dependencies — plain Node.js only. Run after every edit to `content.md`.

## Architecture

This is a single-page static site with a build step.

**Source of truth:** `content.md`
- A `\`\`\`json` block at the top holds all structured data: initiative records, dimension level labels, and tooltip text.
- Everything below the closing `\`\`\`` is plain markdown that becomes the legend section.

**Build script:** `build.js`
- Extracts the JSON block and the legend markdown from `content.md`.
- Renders each initiative as a `<tr>` with 12 cells: 4 core columns + 8 dimension columns (6 complexity, 2 business value).
- Converts the legend markdown to HTML with a minimal inline parser (no external library).
- Writes the complete `index.html` as a single template string — CSS, HTML, and JS are all inlined.

**Output:** `index.html`
- Never edit by hand; it is fully regenerated on each `node build.js` run.
- Published via GitHub Pages from the `main` branch root.

## Key data structures in `content.md`

```
dimensionLevels   — object mapping 8 dimension keys to arrays of 4 label strings
initiatives[]     — array of initiative objects, each with:
    name          — string; **text** renders as <span class="b"> (bold, non-italic)
    featured      — bool; true = green s7 row, false = gray s1 row
    scopeStyle    — "s3" (bold+italic cell) | "s4" (bold only cell)
    scope         — string; **text** = bold, _text_ = italic (s4 rows only)
    categoryClass — cat-finops | cat-governance | cat-itops | cat-knowledge | cat-observ | cat-security
    dimensions    — object with 8 keys (tech, data, integration, org, time, dep, cost, strategic),
                    each { level: 1–4, tip: string }
```

## Dimension columns

Columns 4–9 are complexity (`cx-1`…`cx-4`, purple headers); columns 10–11 are business value (`bv-1`…`bv-4`, green headers). Cell colour classes are derived from `DIM_TYPE` in `build.js`. A thick left border (`sep-left`) marks the first column of each group.

Clicking a dimension column header sorts rows by level (asc → desc → original). Hovering a dimension cell shows the `tip` text in a fixed floating div (`#float-tip`).
