# AI Initiatives 2026

Interactive table visualising AI initiatives, their complexity dimensions, and business value — published as a static GitHub Pages site.

---

## Files

| File | Purpose |
|---|---|
| `content.md` | **Single source of truth** — all table data and legend text |
| `build.js` | Reads `content.md` and writes `index.html` |
| `index.html` | Generated output — do not edit by hand |
| `AI Initiatives 2026.xlsx` | Original source spreadsheet |

---

## How to edit content

### 1. Open `content.md`

The file has two parts:

```
# AI Initiatives 2026
... intro text ...

```json          ← structured data (initiatives + dimension levels)
{ ... }
```              ← end of JSON block

## Complexity Dimensions   ← legend text in plain markdown
...
```

---

### 2. Edit an initiative

Each initiative is an object inside the `"initiatives"` array in the JSON block.

```json
{
  "name": "My Initiative **(Short Label)**",
  "featured": false,
  "scopeStyle": "s3",
  "scope": "Plain text description of the initiative. Use **bold** for emphasis.",
  "category": "FinOps & Cost",
  "categoryClass": "cat-finops",
  "teams": "CCoE, RDNS",
  "dimensions": {
    "tech":        { "level": 3, "tip": "Reason this level was chosen." },
    "data":        { "level": 2, "tip": "Reason this level was chosen." },
    "integration": { "level": 3, "tip": "Reason this level was chosen." },
    "org":         { "level": 2, "tip": "Reason this level was chosen." },
    "time":        { "level": 2, "tip": "Reason this level was chosen." },
    "dep":         { "level": 2, "tip": "Reason this level was chosen." },
    "cost":        { "level": 3, "tip": "Reason this level was chosen." },
    "strategic":   { "level": 3, "tip": "Reason this level was chosen." }
  }
}
```

**Field reference:**

| Field | Values | Notes |
|---|---|---|
| `name` | string | Use `**text**` for bold (non-italic) parts |
| `featured` | `true` / `false` | `true` = green highlighted row |
| `scopeStyle` | `"s3"` / `"s4"` | `s3` = bold+italic, `s4` = bold only |
| `scope` | string | `**text**` = bold; `_text_` = italic (s4 rows only) |
| `category` | string | Display text for the category cell |
| `categoryClass` | see below | Controls the category colour |
| `teams` | string | Teams/groups affected |
| `dimensions.*.level` | `1` – `4` | 1 = lowest complexity / lowest value |
| `dimensions.*.tip` | string | Text shown on hover |

**Category classes:**

| Class | Colour | Category |
|---|---|---|
| `cat-finops` | Yellow | FinOps & Cost |
| `cat-governance` | Gray | Governance & Delivery |
| `cat-itops` | Blue | IT Ops & Service Mgmt |
| `cat-knowledge` | Purple | Knowledge & Assistants |
| `cat-observ` | Green | Observability & AIOps |
| `cat-security` | Orange | Security & Risk |

---

### 3. Change dimension level names

Edit the `"dimensionLevels"` object at the top of the JSON block. Each key maps to an array of 4 labels (level 1 → level 4):

```json
"dimensionLevels": {
  "tech":        ["Basic", "Moderate", "Advanced", "Cutting-Edge"],
  "data":        ["Ready", "Partial", "Scattered", "Scarce"],
  "integration": ["Minimal", "Moderate", "Heavy", "Extensive"],
  "org":         ["Low", "Medium", "High", "Transformational"],
  "time":        ["Short", "Medium", "Long", "Extended"],
  "dep":         ["Low", "Moderate", "High", "Critical"],
  "cost":        ["Marginal", "Moderate", "Significant", "Transformational"],
  "strategic":   ["Operational", "Tactical", "Strategic", "Game-Changing"]
}
```

---

### 4. Edit legend / explanation text

Everything below the closing ` ``` ` of the JSON block is plain markdown. Edit it freely — headings, bullet lists, bold, italic, and inline `code` are all supported.

---

### 5. Regenerate the site

After any edit to `content.md`, run:

```bash
node build.js
```

This overwrites `index.html`. No dependencies — plain Node.js only.

---

## Publish to GitHub Pages

```bash
git add content.md index.html
git commit -m "Update initiatives"
git push origin main
```

GitHub Pages serves `index.html` from the `main` branch root automatically.

---

## Table features

| Feature | How to use |
|---|---|
| **Filter by category** | Type in the Κατηγορία filter box |
| **Filter by dimension level** | Type a level name (e.g. `Advanced`) in any dimension filter box |
| **Sort by dimension** | Click a dimension column header label — cycles ▲ (1→4) / ▼ (4→1) / original order |
| **Hover tooltip** | Hover over any colour-coded dimension cell to read the rationale |

---

## Dimension colour coding

### Complexity (purple headers) — lower = easier

| Level | Label examples | Colour |
|---|---|---|
| 1 | Basic / Ready / Minimal / Low / Short | Green |
| 2 | Moderate / Partial / Medium | Yellow |
| 3 | Advanced / Scattered / Heavy / High / Long | Orange |
| 4 | Cutting-Edge / Scarce / Extensive / Critical / Extended | Red |

### Business Value (green headers) — higher = better

| Level | Label examples | Colour |
|---|---|---|
| 1 | Marginal / Operational | Gray |
| 2 | Moderate / Tactical | Light blue |
| 3 | Significant / Strategic | Medium blue |
| 4 | Transformational / Game-Changing | Green |
