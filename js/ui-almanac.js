// Almanac tab: reference guide showing all triangle-system phenotype names and recipes
import {
  COLOR_PHENOTYPES,
  FINISH_PHENOTYPES,
  BREATH_ELEMENT_PHENOTYPES,
  DARK_ENERGY_PHENOTYPE,
  FINISH_NAMES,
  FINISH_SPECIAL_NAMES,
  ELEMENT_NAMES,
  ELEMENT_SPECIAL_NAMES,
  COLOR_NAMES,
  COLOR_SPECIAL_NAMES,
  SPECIALTY_COMBOS,
  ELEMENT_MODIFIERS,
  cmyToRGB,
  rgbToHex,
  classifyLevel,
} from './gene-config.js';

let containerEl = null;
let activePane = 'colors';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

const COLOR_AXES = [
  { label: 'Cyan', short: 'C', cls: 'cmy-c' },
  { label: 'Magenta', short: 'M', cls: 'cmy-m' },
  { label: 'Yellow', short: 'Y', cls: 'cmy-y' },
];

const FINISH_AXES = [
  { label: 'Opacity', short: 'O', cls: 'finish-o' },
  { label: 'Shine', short: 'Sh', cls: 'finish-s' },
  { label: 'Schiller', short: 'Sc', cls: 'finish-sc' },
];

const ELEMENT_AXES = [
  { label: 'Fire', short: 'F', cls: 'breath-f' },
  { label: 'Ice', short: 'I', cls: 'breath-i' },
  { label: 'Lightning', short: 'L', cls: 'breath-l' },
];

const LEVEL_LABELS = ['None', 'Low', 'Med', 'High'];

export function initAlmanacTab(container) {
  containerEl = el('div', 'almanac-wrapper');
  container.appendChild(containerEl);
  render();
}

function render() {
  containerEl.innerHTML = '';

  // Sub-navigation buttons (visible on mobile, hidden on desktop via CSS)
  const nav = el('div', 'almanac-nav');
  const panes = ['colors', 'finishes', 'elements', 'combos'];
  const paneLabels = ['Colors', 'Finishes', 'Elements', 'Combos'];
  panes.forEach((pane, i) => {
    const btn = el('button', 'almanac-pane-btn' + (pane === activePane ? ' active' : ''), paneLabels[i]);
    btn.dataset.pane = pane;
    btn.addEventListener('click', () => {
      activePane = pane;
      // Update button active states
      nav.querySelectorAll('.almanac-pane-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Update pane visibility
      panesContainer.querySelectorAll('.almanac-pane').forEach(p => {
        p.classList.toggle('active', p.dataset.pane === pane);
      });
    });
    nav.appendChild(btn);
  });
  containerEl.appendChild(nav);

  // Panes container
  const panesContainer = el('div', 'almanac-panes');

  const colorPane = renderColorPane();
  colorPane.dataset.pane = 'colors';
  colorPane.classList.add('almanac-pane');
  if (activePane === 'colors') colorPane.classList.add('active');
  panesContainer.appendChild(colorPane);

  const finishPane = renderFinishPane();
  finishPane.dataset.pane = 'finishes';
  finishPane.classList.add('almanac-pane');
  if (activePane === 'finishes') finishPane.classList.add('active');
  panesContainer.appendChild(finishPane);

  const elementPane = renderElementPane();
  elementPane.dataset.pane = 'elements';
  elementPane.classList.add('almanac-pane');
  if (activePane === 'elements') elementPane.classList.add('active');
  panesContainer.appendChild(elementPane);

  const combosPane = renderCombosPane();
  combosPane.dataset.pane = 'combos';
  combosPane.classList.add('almanac-pane');
  if (activePane === 'combos') combosPane.classList.add('active');
  panesContainer.appendChild(combosPane);

  containerEl.appendChild(panesContainer);
}

// ---- Shared Grid Renderer ----
// Renders a 4×4 grid for a single "outer" tier level
// outerLevel: the fixed outer axis tier (0-3)
// namesTable: the 64-entry lookup (FINISH_NAMES, ELEMENT_NAMES, COLOR_NAMES)
// specialNames: Set of names to highlight
// rowAxis: { short, cls } for the row axis
// colAxis: { short, cls } for the column axis
// keyBuilder: (outerLevel, rowLevel, colLevel) => key string
// makeSwatchFn: optional (key) => DOM element for visual swatches
function renderGrid(outerLevel, namesTable, specialNames, rowAxis, colAxis, keyBuilder, makeSwatchFn) {
  const grid = el('div', 'almanac-grid');

  // Column headers row: blank corner + 4 column labels
  grid.appendChild(el('div', 'almanac-grid-corner'));
  for (let c = 0; c < 4; c++) {
    const colLabel = el('div', 'almanac-grid-col-label');
    colLabel.appendChild(el('span', colAxis.cls, colAxis.short));
    colLabel.appendChild(document.createTextNode(`: ${LEVEL_LABELS[c]}`));
    grid.appendChild(colLabel);
  }

  // Data rows: row label + 4 name cells
  for (let r = 0; r < 4; r++) {
    // Row header
    const rowLabel = el('div', 'almanac-grid-row-label');
    rowLabel.appendChild(el('span', rowAxis.cls, rowAxis.short));
    rowLabel.appendChild(document.createTextNode(`: ${LEVEL_LABELS[r]}`));
    grid.appendChild(rowLabel);

    // 4 cells
    for (let c = 0; c < 4; c++) {
      const key = keyBuilder(outerLevel, r, c);
      const name = namesTable[key] || '???';
      const isSpecial = specialNames.has(name);
      const cell = el('div', 'almanac-grid-cell' + (isSpecial ? ' almanac-grid-special' : ''));

      if (makeSwatchFn) {
        const swatch = makeSwatchFn(key);
        if (swatch) cell.appendChild(swatch);
      }

      cell.appendChild(document.createTextNode(name));
      grid.appendChild(cell);
    }
  }

  return grid;
}

// ---- Color Pane (64-entry grid) ----

const YELLOW_TIER_LABELS = [
  'Yellow: None',
  'Yellow: Low',
  'Yellow: Medium',
  'Yellow: High',
];

function renderColorPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Colors'));
  pane.appendChild(renderAxisLabels(COLOR_AXES));

  // Render 4 grids, one per yellow tier
  // Grid axes: rows = Magenta, cols = Cyan
  for (let y = 0; y < 4; y++) {
    pane.appendChild(el('div', 'almanac-tier-label', YELLOW_TIER_LABELS[y]));
    pane.appendChild(renderGrid(
      y,
      COLOR_NAMES,
      COLOR_SPECIAL_NAMES,
      { short: 'M', cls: 'cmy-m' },  // row axis = Magenta
      { short: 'C', cls: 'cmy-c' },  // col axis = Cyan
      (yTier, mTier, cTier) => `${cTier}-${mTier}-${yTier}`, // key = C-M-Y
      (key) => {
        // Parse key to get CMY levels for swatch
        const [cT, mT, yT] = key.split('-').map(Number);
        // Use tier midpoints for representative color
        const tierToLevel = [0.25, 1.0, 2.0, 2.75];
        const rgb = cmyToRGB(tierToLevel[cT], tierToLevel[mT], tierToLevel[yT]);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const swatch = el('span', 'almanac-color-dot');
        swatch.style.backgroundColor = hex;
        return swatch;
      }
    ));
  }

  return pane;
}

// ---- Finish Pane (64-entry grid) ----

const OPACITY_TIER_LABELS = [
  'Opacity: None',
  'Opacity: Low',
  'Opacity: Medium',
  'Opacity: High',
];

function renderFinishPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Finishes'));
  pane.appendChild(renderAxisLabels(FINISH_AXES));

  // Render 4 grids, one per opacity tier
  // Grid axes: rows = Shine, cols = Schiller
  for (let o = 0; o < 4; o++) {
    pane.appendChild(el('div', 'almanac-tier-label', OPACITY_TIER_LABELS[o]));
    pane.appendChild(renderGrid(
      o,
      FINISH_NAMES,
      FINISH_SPECIAL_NAMES,
      { short: 'Sh', cls: 'finish-s' },   // row axis = Shine
      { short: 'Sc', cls: 'finish-sc' },  // col axis = Schiller
      (oTier, shTier, scTier) => `${oTier}-${shTier}-${scTier}`, // key = O-Sh-Sc
      null // no swatch for finishes
    ));
  }

  return pane;
}

// ---- Element Pane (64-entry grid) ----

const LIGHTNING_TIER_LABELS = [
  'Lightning: None',
  'Lightning: Low',
  'Lightning: Medium',
  'Lightning: High',
];

function renderElementPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Breath Elements'));
  pane.appendChild(renderAxisLabels(ELEMENT_AXES));

  // Render 4 grids, one per lightning tier
  // Grid axes: rows = Fire, cols = Ice
  for (let l = 0; l < 4; l++) {
    pane.appendChild(el('div', 'almanac-tier-label', LIGHTNING_TIER_LABELS[l]));
    pane.appendChild(renderGrid(
      l,
      ELEMENT_NAMES,
      ELEMENT_SPECIAL_NAMES,
      { short: 'F', cls: 'breath-f' },  // row axis = Fire
      { short: 'I', cls: 'breath-i' },  // col axis = Ice
      (lTier, fTier, iTier) => `${fTier}-${iTier}-${lTier}`, // key = F-I-L
      null // no swatch for elements
    ));
  }

  // Rare variants section (Dark Energy)
  pane.appendChild(el('div', 'almanac-tier-label almanac-rare-label', 'Rare Variants'));

  const rareEntry = el('div', 'almanac-entry');

  // Purple dot visual
  const visual = el('div', 'almanac-entry-visual');
  const dot = el('div', 'almanac-dot');
  dot.style.background = DARK_ENERGY_PHENOTYPE.displayColor;
  visual.appendChild(dot);
  rareEntry.appendChild(visual);

  // Info
  const info = el('div', 'almanac-entry-info');
  info.appendChild(el('div', 'almanac-entry-name', DARK_ENERGY_PHENOTYPE.name));
  const formula = el('div', 'almanac-entry-formula');
  formula.textContent = 'Void (F:None · I:None · L:None) — 5% chance';
  info.appendChild(formula);
  info.appendChild(el('div', 'almanac-entry-desc', DARK_ENERGY_PHENOTYPE.desc));
  rareEntry.appendChild(info);

  pane.appendChild(rareEntry);

  return pane;
}

// ---- Combos Pane (Specialty Names + Element Modifiers) ----

// Group specialty combos by category for display
const COMBO_CATEGORIES = [
  'Gemstone', 'Opal', 'Moonstone', 'Pearl', 'Metal', 'Stone', 'Ghost',
];

function renderCombosPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Specialty Combos'));

  const intro = el('div', 'almanac-combo-intro');
  intro.textContent = 'Special names triggered when a dragon has a specific color + finish combination, or a finish + element combination.';
  pane.appendChild(intro);

  // Group SPECIALTY_COMBOS by category
  const grouped = {};
  for (const [key, combo] of Object.entries(SPECIALTY_COMBOS)) {
    const cat = combo.category;
    if (!grouped[cat]) grouped[cat] = [];
    const [colorKey, finishKey] = key.split('|');
    const colorName = COLOR_NAMES[colorKey] || '???';
    const finishName = FINISH_NAMES[finishKey] || '???';
    grouped[cat].push({ name: combo.name, colorName, finishName });
  }

  // Render each category
  for (const cat of COMBO_CATEGORIES) {
    const entries = grouped[cat];
    if (!entries || entries.length === 0) continue;

    pane.appendChild(el('div', 'almanac-tier-label', cat + 's'));

    const list = el('div', 'almanac-combo-list');
    for (const entry of entries) {
      const row = el('div', 'almanac-combo-row');

      const nameEl = el('span', 'almanac-combo-name', entry.name);
      row.appendChild(nameEl);

      const recipeEl = el('span', 'almanac-combo-recipe');
      recipeEl.textContent = `${entry.colorName} + ${entry.finishName}`;
      row.appendChild(recipeEl);

      list.appendChild(row);
    }
    pane.appendChild(list);
  }

  // Element Modifiers section
  pane.appendChild(el('div', 'almanac-tier-label', 'Element Modifiers'));

  const modIntro = el('div', 'almanac-combo-intro');
  modIntro.textContent = 'Prefix applied to color name when finish + element match (e.g. "Molten Red").';
  pane.appendChild(modIntro);

  // Map H/L keys to element base names
  const ELEMENT_HL_NAMES = {
    'L-L-L': 'Void', 'H-L-L': 'Fire', 'L-H-L': 'Ice', 'L-L-H': 'Lightning',
    'H-H-L': 'Steam', 'H-L-H': 'Solar', 'L-H-H': 'Aurora', 'H-H-H': 'Plasma',
  };

  const modList = el('div', 'almanac-combo-list');
  for (const [key, modifier] of Object.entries(ELEMENT_MODIFIERS)) {
    const [finishKey, elementKey] = key.split('|');
    const finishName = FINISH_NAMES[finishKey] || '???';
    const elementName = ELEMENT_HL_NAMES[elementKey] || '???';

    const row = el('div', 'almanac-combo-row');

    const nameEl = el('span', 'almanac-combo-name', modifier);
    row.appendChild(nameEl);

    const recipeEl = el('span', 'almanac-combo-recipe');
    recipeEl.textContent = `${finishName} + ${elementName}`;
    row.appendChild(recipeEl);

    modList.appendChild(row);
  }
  pane.appendChild(modList);

  return pane;
}

// ---- Axis Label Row ----

function renderAxisLabels(axes) {
  const row = el('div', 'almanac-axis-row');
  row.appendChild(el('span', 'almanac-axis-label-prefix', 'Axes: '));
  axes.forEach((axis, i) => {
    row.appendChild(el('span', axis.cls, axis.label));
    if (i < axes.length - 1) {
      row.appendChild(document.createTextNode(' / '));
    }
  });
  return row;
}
