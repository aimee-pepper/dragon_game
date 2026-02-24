// Dragon Creator Tool — build custom dragons with dropdown trait menus
// Generates compact NFC-friendly URLs for claim stickers

import { GENE_DEFS, TRIANGLE_DEFS } from './gene-config.js';
import { resolveFullPhenotype } from './phenotype-resolver.js';
import { encodeGenotype, encodeDragonURL, GENE_ORDER } from './dragon-url.js';
import { renderDragon } from './sprite-renderer.js';

// ─── Helpers ────────────────────────────────────────────────

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Group genes by system section for organized display
const GENE_GROUPS = [
  {
    label: 'Body',
    genes: ['body_size', 'body_type', 'body_scales'],
  },
  {
    label: 'Frame',
    genes: ['frame_wings', 'frame_limbs', 'frame_bones'],
  },
  {
    label: 'Breath',
    genes: ['breath_shape', 'breath_range'],
  },
  {
    label: 'Color (CMY)',
    genes: ['color_cyan', 'color_magenta', 'color_yellow'],
  },
  {
    label: 'Finish',
    genes: ['finish_opacity', 'finish_shine', 'finish_schiller'],
  },
  {
    label: 'Breath Element',
    genes: ['breath_fire', 'breath_ice', 'breath_lightning'],
  },
  {
    label: 'Horns',
    genes: ['horn_style', 'horn_direction'],
  },
  {
    label: 'Spines',
    genes: ['spine_style', 'spine_height'],
  },
  {
    label: 'Tail',
    genes: ['tail_shape', 'tail_length'],
  },
];

// ─── Init ───────────────────────────────────────────────────

export function initDragonCreator(container) {
  if (!container) return;

  const wrapper = el('div', 'dragon-creator');

  // Title
  wrapper.appendChild(el('h2', 'creator-title', 'Dragon Creator'));
  wrapper.appendChild(el('p', 'creator-subtitle', 'Build a custom dragon and generate an NFC claim URL'));

  // ── Controls row (top) ──
  const controlsRow = el('div', 'creator-controls-row');

  // Name input
  const nameGroup = el('div', 'creator-name-group');
  const nameLabel = el('label', 'creator-label', 'Name');
  nameLabel.htmlFor = 'creator-name';
  const nameInput = el('input', 'creator-input');
  nameInput.type = 'text';
  nameInput.id = 'creator-name';
  nameInput.placeholder = 'Auto-generated if empty';
  nameInput.maxLength = 20;
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  controlsRow.appendChild(nameGroup);

  // Sex selector
  const sexGroup = el('div', 'creator-sex-group');
  sexGroup.appendChild(el('label', 'creator-label', 'Sex'));
  const sexSelect = el('select', 'creator-select');
  sexSelect.id = 'creator-sex';
  const optF = el('option', '', 'Female');
  optF.value = 'female';
  const optM = el('option', '', 'Male');
  optM.value = 'male';
  sexSelect.appendChild(optF);
  sexSelect.appendChild(optM);
  sexGroup.appendChild(sexSelect);
  controlsRow.appendChild(sexGroup);

  // Dark Energy checkbox
  const deGroup = el('div', 'creator-de-group');
  const deLabel = el('label', 'creator-label creator-de-label');
  const deCheck = el('input');
  deCheck.type = 'checkbox';
  deCheck.id = 'creator-dark-energy';
  deLabel.appendChild(deCheck);
  deLabel.appendChild(document.createTextNode(' Dark Energy'));
  deGroup.appendChild(deLabel);
  controlsRow.appendChild(deGroup);

  wrapper.appendChild(controlsRow);

  // ── Button row ──
  const btnRow = el('div', 'creator-btn-row');

  const randomBtn = el('button', 'creator-btn creator-btn-secondary', 'Randomize');
  randomBtn.addEventListener('click', () => randomizeAll());
  btnRow.appendChild(randomBtn);

  const generateBtn = el('button', 'creator-btn creator-btn-primary', 'Generate URL');
  generateBtn.addEventListener('click', () => generateURL());
  btnRow.appendChild(generateBtn);

  wrapper.appendChild(btnRow);

  // ── URL output ──
  const urlBox = el('div', 'creator-url-box');
  urlBox.style.display = 'none';

  const urlLabel = el('div', 'creator-url-label', 'Claim URL');
  urlBox.appendChild(urlLabel);

  const urlRow = el('div', 'creator-url-row');
  const urlInput = el('input', 'creator-url-input');
  urlInput.type = 'text';
  urlInput.readOnly = true;
  urlRow.appendChild(urlInput);

  const copyBtn = el('button', 'creator-btn creator-btn-secondary', 'Copy');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(urlInput.value).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });
  urlRow.appendChild(copyBtn);
  urlBox.appendChild(urlRow);

  // Character count
  const charCount = el('div', 'creator-char-count');
  urlBox.appendChild(charCount);

  wrapper.appendChild(urlBox);

  // ── Live preview ──
  const preview = el('div', 'creator-preview');
  preview.appendChild(el('div', 'creator-preview-title', 'Phenotype Preview'));

  const previewLayout = el('div', 'creator-preview-layout');

  const previewBody = el('div', 'creator-preview-body');
  previewLayout.appendChild(previewBody);

  // Sprite canvas container (right side)
  const spriteWrap = el('div', 'creator-sprite-wrap');
  previewLayout.appendChild(spriteWrap);

  preview.appendChild(previewLayout);
  wrapper.appendChild(preview);

  // ── Gene dropdowns ──
  const genesContainer = el('div', 'creator-genes');
  const selects = {}; // gene → { a: select, b: select }

  for (const group of GENE_GROUPS) {
    const section = el('div', 'creator-section');
    section.appendChild(el('div', 'creator-section-header', group.label));

    for (const gene of group.genes) {
      const def = GENE_DEFS[gene];
      const row = el('div', 'creator-row');

      const label = el('div', 'creator-gene-label', def.label || gene);
      row.appendChild(label);

      const selectsWrap = el('div', 'creator-allele-pair');

      const selA = makeAlleleSelect(gene, def, 'A');
      const selB = makeAlleleSelect(gene, def, 'B');

      selectsWrap.appendChild(selA);
      selectsWrap.appendChild(selB);
      row.appendChild(selectsWrap);

      selects[gene] = { a: selA, b: selB };

      section.appendChild(row);
    }

    genesContainer.appendChild(section);
  }

  wrapper.appendChild(genesContainer);

  container.appendChild(wrapper);

  // ── Event listeners for live preview ──
  let spriteRenderVersion = 0; // prevents stale renders from overwriting newer ones

  function updatePreview() {
    const genotype = readGenotype();
    const phenotype = resolveFullPhenotype(genotype);
    renderPreview(previewBody, phenotype);

    // Enable/disable Dark Energy based on breath element
    const breathNull = phenotype.breathElement && phenotype.breathElement.name === 'Null';
    deCheck.disabled = !breathNull;
    if (!breathNull) deCheck.checked = false;

    // Render sprite (async — canvas appears when ready)
    const version = ++spriteRenderVersion;
    renderDragon(phenotype, { compact: false, fallbackToTest: true }).then(canvas => {
      if (version !== spriteRenderVersion) return; // stale render, skip
      spriteWrap.innerHTML = '';
      canvas.className = 'creator-sprite-canvas';
      spriteWrap.appendChild(canvas);
    }).catch(() => {
      // Sprite rendering failed — just leave the text preview
    });
  }

  // Listen to all selects
  for (const gene of Object.keys(selects)) {
    selects[gene].a.addEventListener('change', updatePreview);
    selects[gene].b.addEventListener('change', updatePreview);
  }

  // ── Internal functions ──

  function readGenotype() {
    const genotype = {};
    for (const gene of Object.keys(selects)) {
      genotype[gene] = [
        parseInt(selects[gene].a.value, 10),
        parseInt(selects[gene].b.value, 10),
      ];
    }
    return genotype;
  }

  function randomizeAll() {
    for (const gene of Object.keys(selects)) {
      const def = GENE_DEFS[gene];
      selects[gene].a.value = randomInt(def.min, def.max);
      selects[gene].b.value = randomInt(def.min, def.max);
    }
    // Random sex
    sexSelect.value = Math.random() < 0.5 ? 'male' : 'female';
    // Clear name to auto-generate
    nameInput.value = '';
    deCheck.checked = false;
    updatePreview();
  }

  function generateURL() {
    const genotype = readGenotype();
    const sex = sexSelect.value;
    const name = nameInput.value.trim() || null;
    const isDarkEnergy = deCheck.checked;

    // Build URL using the current page's origin + game path
    // The base URL is the game's index.html (one level up from tools)
    const baseURL = new URL('./', window.location.href).href;

    const url = encodeDragonURL(baseURL, genotype, sex, name, isDarkEnergy);

    urlInput.value = url;
    charCount.textContent = `${url.length} characters`;
    urlBox.style.display = '';
  }

  // Initialize with random values
  randomizeAll();
}

// ─── Allele Select Builder ──────────────────────────────────

function makeAlleleSelect(gene, def, label) {
  const sel = el('select', 'creator-allele-select');
  sel.title = `${def.label || gene} — Allele ${label}`;

  for (let v = def.min; v <= def.max; v++) {
    const opt = el('option');
    opt.value = v;
    // Show phenotype name if available
    if (def.phenotypeMap && def.phenotypeMap[v]) {
      opt.textContent = `${v} — ${def.phenotypeMap[v]}`;
    } else {
      opt.textContent = `${v}`;
    }
    sel.appendChild(opt);
  }

  // Default to middle-ish value
  const mid = Math.round((def.min + def.max) / 2);
  sel.value = mid;

  return sel;
}

// ─── Preview Renderer ───────────────────────────────────────

function renderPreview(container, phenotype) {
  container.innerHTML = '';

  // Color (with swatch)
  if (phenotype.color) {
    const c = phenotype.color;
    const colorLine = el('div', 'creator-preview-line');
    const colorLabel = el('span', 'creator-preview-label', 'Color: ');
    const colorValue = el('span', 'creator-preview-value', c.displayName || c.name || '');
    if (c.hex) {
      const swatch = el('span', 'creator-preview-swatch');
      swatch.style.backgroundColor = c.hex;
      colorValue.prepend(swatch);
    }
    colorLine.appendChild(colorLabel);
    colorLine.appendChild(colorValue);
    container.appendChild(colorLine);
  }

  // Finish
  if (phenotype.finish) {
    const f = phenotype.finish;
    addPreviewLine(container, 'Finish', f.displayName || f.name || '');
  }

  // Breath Element
  if (phenotype.breathElement) {
    const be = phenotype.breathElement;
    addPreviewLine(container, 'Breath Element', be.displayName || be.name || '');
  }

  // Main traits (body, frame, breath shape/range, horns, spines, tail)
  if (phenotype.traits) {
    for (const [geneKey, trait] of Object.entries(phenotype.traits)) {
      const def = GENE_DEFS[geneKey];
      const label = def ? def.label : geneKey;
      const value = trait.name || `Level ${trait.level}`;
      addPreviewLine(container, label, value);
    }
  }
}

function addPreviewLine(container, label, value) {
  const line = el('div', 'creator-preview-line');
  line.appendChild(el('span', 'creator-preview-label', `${label}: `));
  line.appendChild(el('span', 'creator-preview-value', value));
  container.appendChild(line);
}

// ─── Util ───────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
