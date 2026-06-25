#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

// ── Read content.md ───────────────────────────────────────────────────────────
const src = fs.readFileSync(path.join(__dirname, 'content.md'), 'utf8');

const jsonMatch = src.match(/```json\n([\s\S]+?)\n```/);
if (!jsonMatch) { console.error('ERROR: No ```json block found in content.md'); process.exit(1); }

let data;
try { data = JSON.parse(jsonMatch[1]); }
catch (e) { console.error('ERROR: Invalid JSON in content.md\n' + e.message); process.exit(1); }

// Legend markdown = everything after the closing ```
const legendMd = src.split(/```json[\s\S]+?```/)[1].trim();

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Scope: **text** → <span class="b">text</span>  |  _text_ → <span class="bi">text</span>
function scopeHtml(raw, style) {
  let s = esc(raw);
  if (style === 's4') {
    s = s.replace(/_(.+?)_/g, '<span class="bi">$1</span>');
  }
  s = s.replace(/\*\*(.+?)\*\*/g, '<span class="b">$1</span>');
  return s;
}

// Simple markdown → HTML for the legend body
function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inUl = false;

  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('### ')) {
      closeUl();
      out.push(`<h4 class="leg-sh">${inlineHtml(line.slice(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      closeUl();
      out.push(`<h3 class="leg-h">${inlineHtml(line.slice(3))}</h3>`);
    } else if (line.startsWith('- ')) {
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inlineHtml(line.slice(2))}</li>`);
    } else if (line === '---') {
      closeUl();
      // section divider — skip (handled by h3 spacing)
    } else if (line === '') {
      closeUl();
    } else {
      closeUl();
      out.push(`<p>${inlineHtml(line)}</p>`);
    }
  }
  closeUl();
  return out.join('\n');
}

function inlineHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

// ── Dimension config ──────────────────────────────────────────────────────────
const DIMS = ['tech', 'data', 'integration', 'org', 'time', 'dep', 'cost', 'strategic'];
const DIM_LABEL = {
  tech: 'Tech. Complexity', data: 'Data Readiness', integration: 'Integration',
  org: 'Org. Change', time: 'Time to Value', dep: 'Dep. Risk',
  cost: 'Cost Impact', strategic: 'Strategic Impact'
};
const DIM_TYPE  = { tech:'cx', data:'cx', integration:'cx', org:'cx', time:'cx', dep:'cx', cost:'bv', strategic:'bv' };
const DIM_SEP   = { tech: true, cost: true }; // first of each group → thick left border
const DIM_COL   = { tech:4, data:5, integration:6, org:7, time:8, dep:9, cost:10, strategic:11 };

// ── Render helpers ────────────────────────────────────────────────────────────
function dimHeaderCell(dim) {
  const type  = DIM_TYPE[dim] === 'cx' ? 's-cx' : 's-bv';
  const sep   = DIM_SEP[dim] ? ' sep-left' : '';
  const col   = DIM_COL[dim];
  return `<th class="${type}${sep}"><span class="col-sort-label" onclick="sortColumn(${col})" title="Sort by level">${DIM_LABEL[dim]} <span class="sort-icon none" data-col="${col}"></span></span></th>`;
}

function dimFilterCell(dim) {
  const sep = DIM_SEP[dim] ? ' class="sep-left"' : '';
  const col = DIM_COL[dim];
  return `<td${sep}><input class="col-filter" type="text" placeholder="🔍" oninput="applyFilters(${col},this.value)" /></td>`;
}

function dimDataCell(dim, dimData) {
  const { level, tip } = dimData;
  const cls  = DIM_TYPE[dim] + '-' + level;
  const sep  = DIM_SEP[dim] ? ' sep-left' : '';
  const label = data.dimensionLevels[dim][level - 1];
  return `<td class="dim-cell ${cls}${sep}">${esc(label)}<span class="tip-text">${esc(tip)}</span></td>`;
}

function renderRow(init) {
  const nameHtml  = scopeHtml(init.name, 's1');
  const scopeCell = `<td class="${init.scopeStyle}">${scopeHtml(init.scope, init.scopeStyle)}</td>`;
  const nameCell  = init.featured
    ? `<td class="s7">${nameHtml}</td>`
    : `<td class="s1">${nameHtml}</td>`;
  const catCell   = `<td class="cat ${esc(init.categoryClass)}">${esc(init.category)}</td>`;
  const teamCell  = `<td class="s10">${esc(init.teams)}</td>`;
  const dimCells  = DIMS.map(d => dimDataCell(d, init.dimensions[d])).join('');
  return `\n        <tr>${nameCell}${scopeCell}${catCell}${teamCell}${dimCells}</tr>`;
}

// ── Assemble HTML ─────────────────────────────────────────────────────────────
const dimHeaders = DIMS.map(dimHeaderCell).join('');
const dimFilters = DIMS.map(dimFilterCell).join('');
const rowsHtml   = data.initiatives.map(renderRow).join('');
const legendHtml = mdToHtml(legendMd);

const html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(data.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
      background: #F2F4F7;
      padding: 32px 28px 48px;
      margin: 0;
      color: #1A1A2E;
    }

    .sheet-title {
      font-size: 16px;
      font-weight: 700;
      color: #0E2841;
      margin-bottom: 20px;
      letter-spacing: 0.02em;
    }

    /* ── Table wrapper ── */
    .table-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
      background: #fff;
    }

    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 1772px;
      background: #fff;
    }

    col.col-a   { width: 220px; }
    col.col-b   { width: 420px; }
    col.col-c   { width: 160px; }
    col.col-d   { width: 192px; }
    col.col-dim { width: 97px;  }

    /* ── Base cell ── */
    td, th {
      font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
      font-size: 11px;
      color: #1A1A2E;
      vertical-align: middle;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      padding: 6px 8px;
      border-bottom: 1px solid #E8EAED;
    }

    /* ── Main header row ── */
    thead th {
      background: #0E2841;
      color: #fff;
      font-weight: 600;
      font-size: 11px;
      text-align: center;
      padding: 8px 8px;
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 2px solid #1B3F6A;
    }
    thead th.s2 { text-align: left; }

    /* ── Filter row ── */
    thead tr.filter-row td {
      background: #F8F9FA;
      border-bottom: 2px solid #DDE1E7;
      padding: 4px 6px;
      position: sticky;
      top: 38px;
      z-index: 9;
    }
    .col-filter {
      width: 100%;
      font-size: 10px;
      font-family: inherit;
      padding: 3px 6px;
      border: 1px solid #CDD0D6;
      border-radius: 4px;
      color: #1A1A2E;
      background: #fff;
    }
    .col-filter:focus { outline: none; border-color: #0E2841; box-shadow: 0 0 0 2px rgba(14,40,65,0.15); }
    .col-filter::placeholder { color: #B0B4BB; }

    /* ── Data rows ── */
    tbody tr:hover td { background: #EBF3FB !important; }
    tbody tr:last-child td { border-bottom: none; }

    /* ── Initiative name cells ── */
    .s1 {
      background: #F5F7FA;
      font-weight: 700;
      text-align: center;
      font-size: 10.5px;
      color: #0E2841;
      border-right: 1px solid #E8EAED;
    }
    .s7 {
      background: #4EA72E;
      font-weight: 700;
      text-align: center;
      font-size: 10.5px;
      color: #fff;
      border-right: 1px solid #E8EAED;
    }

    /* ── Scope cell ── */
    .s3 {
      font-weight: 600;
      font-style: italic;
      text-align: left;
      font-size: 10.5px;
      color: #2C3E50;
      border-right: 1px solid #E8EAED;
    }
    .s4 {
      font-weight: 600;
      font-style: normal;
      text-align: left;
      font-size: 10.5px;
      color: #2C3E50;
      border-right: 1px solid #E8EAED;
    }

    /* ── Category cell ── */
    .cat {
      font-weight: 600;
      font-size: 10px;
      text-align: center;
      border-right: 1px solid #E8EAED;
    }
    .cat-finops     { background: #FEF9D4; color: #7A6200; }
    .cat-governance { background: #EAECEE; color: #444; }
    .cat-itops      { background: #D6F0FA; color: #0A5A7C; }
    .cat-knowledge  { background: #F5E0F5; color: #7A1F7A; }
    .cat-observ     { background: #D6F5DB; color: #1A6B2A; }
    .cat-security   { background: #FDEADF; color: #8B3A12; }

    /* ── Teams cell ── */
    .s10 {
      font-weight: 400;
      font-size: 10px;
      text-align: center;
      color: #444;
      border-right: 1px solid #E8EAED;
    }

    /* ── Rich-text helpers ── */
    .bi { font-weight: 700; font-style: italic; }
    .b  { font-weight: 700; font-style: normal; }
    .n  { font-weight: 400; font-style: normal; }

    /* ── Dimension column headers (thead) ── */
    .s-cx {
      background: #2D1B6E !important;
      color: #E8E0FF !important;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      border-right: 1px solid #3D2B8A;
    }
    .s-bv {
      background: #1A4731 !important;
      color: #C8F5DA !important;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      border-right: 1px solid #2A5741;
    }

    /* ── Dimension data cells ── */
    .dim-cell {
      font-weight: 700;
      font-size: 9.5px;
      text-align: center;
      border-right: 1px solid #E8EAED;
      cursor: help;
      padding: 4px 4px;
      line-height: 1.2;
    }
    .tip-text { display: none; }

    /* Complexity: low=green → high=red */
    .cx-1 { background: #D4EDDA; color: #155724; }
    .cx-2 { background: #FFF3CD; color: #856404; }
    .cx-3 { background: #FFE0B2; color: #7E3400; }
    .cx-4 { background: #FCCDD3; color: #7B1D2A; }

    /* Business value: low=gray → high=green */
    .bv-1 { background: #F0F0F0; color: #555; }
    .bv-2 { background: #CCE5FF; color: #004085; }
    .bv-3 { background: #79B8E0; color: #0A2744; }
    .bv-4 { background: #4EA72E; color: #fff; }

    /* Group separators */
    .sep-left { border-left: 3px solid #888 !important; }

    /* ── Sort ── */
    .col-sort-label { cursor: pointer; user-select: none; display: inline-block; }
    .col-sort-label:hover { text-decoration: underline; }
    .sort-icon { font-size: 8px; opacity: 0.55; margin-left: 2px; }
    .sort-icon.asc::after  { content: '▲'; }
    .sort-icon.desc::after { content: '▼'; }
    .sort-icon.none::after { content: '▲▼'; }

    /* ── Floating tooltip ── */
    #float-tip {
      display: none;
      position: fixed;
      background: #1E3A5F;
      color: #fff;
      padding: 9px 13px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 400;
      font-style: normal;
      font-family: 'Segoe UI', system-ui, sans-serif;
      max-width: 250px;
      line-height: 1.55;
      z-index: 99999;
      pointer-events: none;
      box-shadow: 0 6px 20px rgba(0,0,0,0.28);
      white-space: normal;
    }

    /* ── Legend ── */
    .legend {
      margin-top: 32px;
      max-width: 960px;
      display: flex;
      flex-direction: column;
      gap: 0;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      overflow: hidden;
    }
    .leg-section {
      padding: 16px 20px;
      border-bottom: 1px solid #E8EAED;
    }
    .leg-section:last-child { border-bottom: none; }
    .leg-h {
      font-size: 12px;
      font-weight: 700;
      color: #0E2841;
      margin: 0 0 10px;
    }
    .leg-sh {
      font-size: 11px;
      font-weight: 700;
      color: #1A1A2E;
      margin: 10px 0 3px;
    }
    .legend p {
      font-size: 10.5px;
      color: #555;
      margin: 0 0 4px;
      line-height: 1.5;
    }
    .legend ul {
      margin: 2px 0 6px 16px;
      padding: 0;
    }
    .legend li {
      font-size: 10.5px;
      color: #444;
      margin-bottom: 2px;
      line-height: 1.45;
    }
    .legend em { font-style: italic; color: #666; }
    .legend strong { font-weight: 700; color: #1A1A2E; }
    .leg-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
      margin-top: 6px;
    }
    .leg-chip {
      font-size: 9px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .leg-arrow { font-size: 9px; color: #999; align-self: center; }
    .leg-dims-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px 24px;
    }
    .leg-dim-name { font-size: 10px; font-weight: 700; color: #333; margin-bottom: 3px; }
    .leg-dim-desc { font-size: 9.5px; color: #666; line-height: 1.4; }
    .leg-color-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 10px;
      font-size: 10px;
    }
    .leg-color-label { font-weight: 700; color: #333; }
    .leg-sep { color: #CCC; margin: 0 4px; }
    .leg-note { font-size: 9.5px; color: #888; font-style: italic; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="sheet-title">${esc(data.title)}</div>
  <div class="table-wrapper">
    <table id="main-table">
      <colgroup>
        <col class="col-a" /><col class="col-b" /><col class="col-c" /><col class="col-d" />
        <col class="col-dim" /><col class="col-dim" /><col class="col-dim" /><col class="col-dim" />
        <col class="col-dim" /><col class="col-dim" /><col class="col-dim" /><col class="col-dim" />
      </colgroup>
      <thead>
        <tr>
          <th>Πρωτοβουλία AI</th>
          <th class="s2">Scope (Executive Description)</th>
          <th>Κατηγορία</th>
          <th>Ομάδες Επηρεάζει</th>
          ${dimHeaders}
        </tr>
        <tr class="filter-row">
          <td></td><td></td>
          <td><input class="col-filter" type="text" placeholder="🔍 Filter…" oninput="applyFilters(2,this.value)" /></td>
          <td></td>
          ${dimFilters}
        </tr>
      </thead>
      <tbody>${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div class="leg-section">
      <h3 class="leg-h">Complexity Dimensions <em style="font-weight:400;font-size:10px;color:#888"> — lower level = easier to deliver</em></h3>
      <div class="leg-dims-grid">
        ${DIMS.filter(d => DIM_TYPE[d] === 'cx').map(d => {
          const levels = data.dimensionLevels[d];
          const chips = levels.map((l, i) => `<span class="cx-${i+1} leg-chip">${esc(l)}</span>`).join('<span class="leg-arrow">→</span>');
          return `<div><div class="leg-dim-name">${DIM_LABEL[d]}</div><div class="leg-chips">${chips}</div></div>`;
        }).join('')}
      </div>
    </div>
    <div class="leg-section">
      <h3 class="leg-h">Business Value Dimensions <em style="font-weight:400;font-size:10px;color:#888"> — higher level = greater value</em></h3>
      <div class="leg-dims-grid">
        ${DIMS.filter(d => DIM_TYPE[d] === 'bv').map(d => {
          const levels = data.dimensionLevels[d];
          const chips = levels.map((l, i) => `<span class="bv-${i+1} leg-chip">${esc(l)}</span>`).join('<span class="leg-arrow">→</span>');
          return `<div><div class="leg-dim-name">${DIM_LABEL[d]}</div><div class="leg-chips">${chips}</div></div>`;
        }).join('')}
      </div>
    </div>
    <div class="leg-section">
      <h3 class="leg-h">Definitions</h3>
      ${legendHtml}
    </div>
    <div class="leg-section">
      <div class="leg-color-row">
        <span class="leg-color-label">Complexity</span>
        <span class="cx-1 leg-chip">1 — easiest</span>
        <span class="cx-2 leg-chip">2</span>
        <span class="cx-3 leg-chip">3</span>
        <span class="cx-4 leg-chip">4 — hardest</span>
        <span class="leg-sep">|</span>
        <span class="leg-color-label">Business Value</span>
        <span class="bv-1 leg-chip">1 — lowest</span>
        <span class="bv-2 leg-chip">2</span>
        <span class="bv-3 leg-chip">3</span>
        <span class="bv-4 leg-chip">4 — highest</span>
      </div>
      <p class="leg-note">Hover over any dimension cell to read the rationale behind the assigned level. Click a dimension column header to sort by level.</p>
    </div>
  </div>

  <div id="float-tip"></div>

  <script>
    const COL_COUNT = 12;
    const filterValues = Array(COL_COUNT).fill('');

    function applyFilters(colIdx, value) {
      filterValues[colIdx] = value.toLowerCase().trim();
      document.querySelectorAll('#main-table tbody tr').forEach(row => {
        let visible = true;
        for (let c = 0; c < COL_COUNT; c++) {
          const f = filterValues[c];
          if (!f) continue;
          const cell = row.cells[c];
          if (!cell) continue;
          if (!cell.textContent.toLowerCase().includes(f)) { visible = false; break; }
        }
        row.style.display = visible ? '' : 'none';
      });
    }

    let sortState = { col: -1, dir: 'none' };
    let originalOrder = null;

    function getCellLevel(cell) {
      if (!cell) return 0;
      const m = cell.className.match(/(?:cx|bv)-(\\d)/);
      return m ? parseInt(m[1]) : 0;
    }

    function sortColumn(colIdx) {
      const tbody = document.querySelector('#main-table tbody');
      const rows  = Array.from(tbody.querySelectorAll('tr'));
      if (!originalOrder) originalOrder = [...rows];

      if (sortState.col === colIdx) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : sortState.dir === 'desc' ? 'none' : 'asc';
      } else {
        sortState.col = colIdx;
        sortState.dir = 'asc';
      }

      if (sortState.dir === 'none') {
        originalOrder.forEach(r => tbody.appendChild(r));
      } else {
        [...rows].sort((a, b) => {
          const la = getCellLevel(a.cells[colIdx]);
          const lb = getCellLevel(b.cells[colIdx]);
          return sortState.dir === 'asc' ? la - lb : lb - la;
        }).forEach(r => tbody.appendChild(r));
      }

      document.querySelectorAll('.sort-icon').forEach(el => {
        const c = parseInt(el.dataset.col);
        el.className = 'sort-icon ' + (c === sortState.col && sortState.dir !== 'none' ? sortState.dir : 'none');
      });
    }

    const floatTip = document.getElementById('float-tip');
    document.querySelectorAll('.dim-cell').forEach(cell => {
      const tipSpan = cell.querySelector('.tip-text');
      if (!tipSpan) return;
      cell.addEventListener('mouseenter', () => { floatTip.textContent = tipSpan.textContent; floatTip.style.display = 'block'; });
      cell.addEventListener('mousemove', e => {
        let x = e.clientX + 14;
        if (x + 260 > window.innerWidth - 8) x = e.clientX - 264;
        floatTip.style.left = x + 'px';
        floatTip.style.top  = (e.clientY - 12) + 'px';
      });
      cell.addEventListener('mouseleave', () => { floatTip.style.display = 'none'; });
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('✓ index.html generated from content.md');
