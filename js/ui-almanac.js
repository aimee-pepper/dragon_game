// Almanac tab: reference guide showing all triangle-system phenotype names and recipes
import {
  COLOR_PHENOTYPES,
  FINISH_PHENOTYPES,
  BREATH_ELEMENT_PHENOTYPES,
  DARK_ENERGY_PHENOTYPE,
  cmyToRGB,
  rgbToHex,
} from './gene-config.js';

let containerEl = null;
let activePane = 'colors';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Display order: grouped by tier (number of High axes)
const TIER_ORDER = [
  { label: 'None', keys: ['L-L-L'] },
  { label: 'Primary', keys: ['H-L-L', 'L-H-L', 'L-L-H'] },
  { label: 'Secondary', keys: ['H-H-L', 'H-L-H', 'L-H-H'] },
  { label: 'Tertiary', keys: ['H-H-H'] },
];

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

// Representative values for H/L when computing swatches
const H_VAL = 2.25; // midpoint of 1.5–3.0
const L_VAL = 0.75; // midpoint of 0.0–1.5

export function initAlmanacTab(container) {
  containerEl = el('div', 'almanac-wrapper');
  container.appendChild(containerEl);
  render();
}

function render() {
  containerEl.innerHTML = '';

  // Sub-navigation buttons (visible on mobile, hidden on desktop via CSS)
  const nav = el('div', 'almanac-nav');
  const panes = ['colors', 'finishes', 'elements'];
  const paneLabels = ['Colors', 'Finishes', 'Elements'];
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

  containerEl.appendChild(panesContainer);
}

// ---- Shared Helpers ----

function renderFormula(key, axes) {
  const levels = key.split('-'); // ['H', 'L', 'H']
  const frag = el('div', 'almanac-entry-formula');
  levels.forEach((level, i) => {
    const word = level === 'H' ? 'High' : 'None';
    const span = el('span', axes[i].cls, `${axes[i].short}: ${word}`);
    frag.appendChild(span);
    if (i < levels.length - 1) {
      frag.appendChild(document.createTextNode(' \u00B7 '));
    }
  });
  return frag;
}

function renderPaneEntries(phenotypes, axes, makeVisual) {
  const wrapper = el('div', 'almanac-entries');

  TIER_ORDER.forEach(tier => {
    const tierLabel = el('div', 'almanac-tier-label', tier.label);
    wrapper.appendChild(tierLabel);

    tier.keys.forEach(key => {
      const pheno = phenotypes[key];
      if (!pheno) return;

      const entry = el('div', 'almanac-entry');

      // Visual (swatch, dot, or nothing)
      if (makeVisual) {
        const visual = makeVisual(key, pheno);
        if (visual) {
          entry.appendChild(visual);
        }
      }

      // Info
      const info = el('div', 'almanac-entry-info');
      info.appendChild(el('div', 'almanac-entry-name', pheno.name));
      info.appendChild(renderFormula(key, axes));
      if (pheno.desc) {
        info.appendChild(el('div', 'almanac-entry-desc', pheno.desc));
      }
      entry.appendChild(info);

      wrapper.appendChild(entry);
    });
  });

  return wrapper;
}

// ---- Color Pane ----

function renderColorPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Colors'));
  pane.appendChild(renderAxisLabels(COLOR_AXES));
  pane.appendChild(renderPaneEntries(COLOR_PHENOTYPES, COLOR_AXES, (key, _pheno) => {
    const levels = key.split('-');
    const c = levels[0] === 'H' ? H_VAL : L_VAL;
    const m = levels[1] === 'H' ? H_VAL : L_VAL;
    const y = levels[2] === 'H' ? H_VAL : L_VAL;
    const rgb = cmyToRGB(c, m, y);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    const visual = el('div', 'almanac-entry-visual');
    const swatch = el('div', 'almanac-swatch');
    swatch.style.background = hex;
    visual.appendChild(swatch);
    return visual;
  }));
  return pane;
}

// ---- Finish Pane ----

function renderFinishPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Finishes'));
  pane.appendChild(renderAxisLabels(FINISH_AXES));
  pane.appendChild(renderPaneEntries(FINISH_PHENOTYPES, FINISH_AXES, null));
  return pane;
}

// ---- Element Pane ----

function renderElementPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Breath Elements'));
  pane.appendChild(renderAxisLabels(ELEMENT_AXES));
  pane.appendChild(renderPaneEntries(BREATH_ELEMENT_PHENOTYPES, ELEMENT_AXES, (_key, pheno) => {
    if (!pheno.displayColor) return null;
    const visual = el('div', 'almanac-entry-visual');
    const dot = el('div', 'almanac-dot');
    dot.style.background = pheno.displayColor;
    visual.appendChild(dot);
    return visual;
  }));

  // Rare variants section
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
  formula.textContent = 'Null (L-L-L) — 5% chance';
  info.appendChild(formula);
  info.appendChild(el('div', 'almanac-entry-desc', DARK_ENERGY_PHENOTYPE.desc));
  rareEntry.appendChild(info);

  pane.appendChild(rareEntry);

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
