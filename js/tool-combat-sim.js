// Combat Simulator Tool — two gene editors side-by-side with combat simulation
// Pattern: same imperative DOM builder as tool-dragon-creator.js

import { GENE_DEFS } from './gene-config.js';
import { resolveFullPhenotype } from './phenotype-resolver.js';
import { renderDragon } from './sprite-renderer.js';
import { simulateCombat } from './combat-engine.js';
import { deriveCombatStats, deriveStatBreakdown, getHeightName, getTraitImpact } from './stat-config.js';

// ─── Helpers ────────────────────────────────────────────────

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hpColor(current, max) {
  const pct = max > 0 ? current / max : 0;
  if (pct > 0.5) return '#50bb70';
  if (pct > 0.25) return '#e0a030';
  return '#e05555';
}

// Gene groups — same as dragon creator
const GENE_GROUPS = [
  { label: 'Body',           genes: ['body_size', 'body_type', 'body_scales'] },
  { label: 'Frame',          genes: ['frame_wings', 'frame_limbs', 'frame_bones'] },
  { label: 'Breath',         genes: ['breath_shape', 'breath_range'] },
  { label: 'Color (CMY)',    genes: ['color_cyan', 'color_magenta', 'color_yellow'] },
  { label: 'Finish',         genes: ['finish_opacity', 'finish_shine', 'finish_schiller'] },
  { label: 'Breath Element', genes: ['breath_fire', 'breath_ice', 'breath_lightning'] },
  { label: 'Horns',          genes: ['horn_style', 'horn_direction'] },
  { label: 'Spines',         genes: ['spine_style', 'spine_height'] },
  { label: 'Tail',           genes: ['tail_shape', 'tail_length'] },
];

// Categorical genes use max(alleleA, alleleB) instead of average
const CATEGORICAL_GENES = new Set(['horn_style', 'horn_direction', 'spine_style']);

// Stat display config — bars shown on each dragon panel
const STAT_DEFS = [
  { key: 'hp',           label: 'HP',     color: '#e05555', max: 300 },
  { key: 'armor',        label: 'Armor',  color: '#5588cc', max: 45  },
  { key: 'speed',        label: 'Speed',  color: '#50bb70', max: 175 },
  { key: 'evasion',      label: 'EVA',    color: '#aa70dd', max: 100, suffix: '%' },
  { key: 'accuracy',     label: 'ACC',    color: '#ddaa44', max: 100, suffix: '%' },
  { key: 'meleeDamage',  label: 'Melee',  color: '#e0a030', max: 32  },
  { key: 'breathDamage', label: 'Breath', color: '#dd8844', max: 30  },
  { key: 'thorns',       label: 'Thorns', color: '#77aa55', max: 8   },
];

// Debuff display info for the buff/debuff row
const DEBUFF_DISPLAY = {
  burn:   { emoji: '🔥', label: 'Burn'         },
  slow:   { emoji: '❄️',  label: 'Slow'         },
  stun:   { emoji: '⚡', label: 'Stun'         },
  steam:  { emoji: '💨', label: 'Steam'        },
  solar:  { emoji: '☀️',  label: 'Solar Pierce' },
  aurora: { emoji: '🌌', label: 'Aurora'       },
};

// ─── Main Init ──────────────────────────────────────────────

export function initCombatSim(container) {
  if (!container) return;

  const wrapper = el('div', 'combat-sim');

  // ── Dragon Panels (side by side, mirrored) ──
  const panelsRow = el('div', 'combat-panels');

  const panelA = buildDragonPanel('A');
  const panelB = buildDragonPanel('B');

  panelsRow.appendChild(panelA.container);
  panelsRow.appendChild(panelB.container);
  wrapper.appendChild(panelsRow);

  // ── Controls + HP (single row: HP A | buttons | HP B) ──
  const controlRow = el('div', 'combat-control-row');

  const hpA = buildHpBar('A', panelA);
  controlRow.appendChild(hpA.container);

  const controls = el('div', 'combat-controls');
  const fightBtn = el('button', 'combat-fight-btn', '⚔ Fight!');
  controls.appendChild(fightBtn);
  const stepBtn = el('button', 'combat-step-btn', '▶ Step');
  stepBtn.title = 'Advance one turn at a time';
  controls.appendChild(stepBtn);
  const autoLabel = el('label', 'combat-auto-label');
  const autoCheck = el('input');
  autoCheck.type = 'checkbox';
  autoCheck.checked = true;
  autoLabel.appendChild(autoCheck);
  autoLabel.appendChild(document.createTextNode(' Auto'));
  controls.appendChild(autoLabel);
  controlRow.appendChild(controls);

  const hpB = buildHpBar('B', panelB);
  controlRow.appendChild(hpB.container);

  wrapper.appendChild(controlRow);

  // ── Buff/Debuff Rows ──
  const buffArea = el('div', 'combat-buff-area');
  const buffsA = el('div', 'combat-buff-row');
  buffsA.dataset.side = 'A';
  const buffsB = el('div', 'combat-buff-row');
  buffsB.dataset.side = 'B';
  buffArea.appendChild(buffsA);
  buffArea.appendChild(buffsB);
  wrapper.appendChild(buffArea);

  // ── Winner Banner ──
  const winnerBanner = el('div', 'combat-winner-banner');
  winnerBanner.style.display = 'none';
  wrapper.appendChild(winnerBanner);

  // ── Combat Log ──
  const logSection = el('div', 'combat-log-section');
  logSection.appendChild(el('div', 'combat-log-title', 'Combat Log'));
  const logContainer = el('div', 'combat-log');
  logSection.appendChild(logContainer);
  wrapper.appendChild(logSection);

  container.appendChild(wrapper);

  // ── Combat State ──
  let combatResult = null;
  let stepIndex = 0;
  let autoPlayTimer = null;
  let runningHpA = 0;
  let runningHpB = 0;
  let maxHpA = 0;
  let maxHpB = 0;

  // ── Fight Button ──
  fightBtn.addEventListener('click', () => runFullCombat());

  // ── Step Button ──
  stepBtn.addEventListener('click', () => {
    if (!combatResult) startCombat();
    advanceOneStep();
  });

  function runFullCombat() {
    startCombat();
    if (autoCheck.checked) autoPlayAll();
    else advanceOneStep();
  }

  function startCombat() {
    clearAutoPlay();
    logContainer.innerHTML = '';
    winnerBanner.style.display = 'none';
    buffsA.innerHTML = '';
    buffsB.innerHTML = '';

    const statsA = panelA.getStats();
    const statsB = panelB.getStats();
    statsA.name = panelA.getName() || 'Dragon A';
    statsB.name = panelB.getName() || 'Dragon B';

    maxHpA = statsA.hp;
    maxHpB = statsB.hp;
    runningHpA = maxHpA;
    runningHpB = maxHpB;
    setHpBar(hpA, maxHpA, maxHpA);
    setHpBar(hpB, maxHpB, maxHpB);

    combatResult = simulateCombat(statsA, statsB);
    stepIndex = 0;
  }

  function advanceOneStep() {
    if (!combatResult || stepIndex >= combatResult.rounds.length) {
      if (combatResult) showWinner();
      return;
    }
    const entry = combatResult.rounds[stepIndex];
    // Update running HP from this entry's damage
    if (entry.damage) {
      if (entry.attacker === 'A') runningHpB = Math.max(0, runningHpB - entry.damage);
      else if (entry.attacker === 'B') runningHpA = Math.max(0, runningHpA - entry.damage);
      else if (entry.attacker === 'status') {
        if (entry.side === 'A') runningHpA = Math.max(0, runningHpA - entry.damage);
        else if (entry.side === 'B') runningHpB = Math.max(0, runningHpB - entry.damage);
      }
    }
    appendLogEntry(entry, runningHpA, maxHpA, runningHpB, maxHpB);
    updateHpFromEntries(stepIndex);
    updateBuffsFromEntries(stepIndex);
    stepIndex++;
    if (stepIndex >= combatResult.rounds.length) showWinner();
  }

  function autoPlayAll() {
    clearAutoPlay();
    autoPlayTimer = setInterval(() => {
      if (!combatResult || stepIndex >= combatResult.rounds.length) {
        clearAutoPlay();
        if (combatResult) showWinner();
        return;
      }
      advanceOneStep();
    }, 400);
  }

  function clearAutoPlay() {
    if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
  }

  function showWinner() {
    if (!combatResult) return;
    const fs = combatResult.finalState;
    setHpBar(hpA, fs.A.hp, fs.A.maxHp);
    setHpBar(hpB, fs.B.hp, fs.B.maxHp);

    if (combatResult.winner === 'draw') {
      winnerBanner.textContent = '⚖ Draw!';
      winnerBanner.className = 'combat-winner-banner draw';
    } else {
      const winnerName = combatResult.winner === 'A'
        ? (panelA.getName() || 'Dragon A')
        : (panelB.getName() || 'Dragon B');
      winnerBanner.textContent = `🏆 ${winnerName} wins!`;
      winnerBanner.className = `combat-winner-banner winner-${combatResult.winner.toLowerCase()}`;
    }
    winnerBanner.style.display = '';
  }

  function updateHpFromEntries(upToIndex) {
    if (!combatResult) return;
    const statsA = panelA.getStats();
    const statsB = panelB.getStats();
    let hpAVal = statsA.hp;
    let hpBVal = statsB.hp;

    for (let i = 0; i <= upToIndex; i++) {
      const entry = combatResult.rounds[i];
      if (!entry.damage) continue;
      if (entry.attacker === 'A') hpBVal = Math.max(0, hpBVal - entry.damage);
      else if (entry.attacker === 'B') hpAVal = Math.max(0, hpAVal - entry.damage);
      else if (entry.attacker === 'status') {
        if (entry.side === 'A') hpAVal = Math.max(0, hpAVal - entry.damage);
        else if (entry.side === 'B') hpBVal = Math.max(0, hpBVal - entry.damage);
      }
    }
    setHpBar(hpA, hpAVal, statsA.hp);
    setHpBar(hpB, hpBVal, statsB.hp);
  }

  function updateBuffsFromEntries(upToIndex) {
    if (!combatResult) return;
    const activeA = {};
    const activeB = {};
    for (let i = 0; i <= upToIndex; i++) {
      const entry = combatResult.rounds[i];
      if (entry.statusApplied) {
        const target = entry.attacker === 'A' ? activeB : activeA;
        target[entry.statusApplied] = true;
      }
      if (entry.statusExpired) {
        const target = entry.side === 'A' ? activeA : activeB;
        delete target[entry.statusExpired];
      }
    }
    renderBuffRow(buffsA, activeA);
    renderBuffRow(buffsB, activeB);
  }

  function renderBuffRow(rowEl, activeStatuses) {
    rowEl.innerHTML = '';
    for (const key of Object.keys(activeStatuses)) {
      const display = DEBUFF_DISPLAY[key];
      if (!display) continue;
      const pill = el('span', 'combat-buff-icon debuff');
      pill.textContent = `${display.emoji} ${display.label}`;
      pill.title = display.label;
      rowEl.appendChild(pill);
    }
  }

  function appendLogEntry(entry, hpANow, hpAMax, hpBNow, hpBMax) {
    const line = el('div', 'combat-log-entry');

    // Side alignment
    if (entry.attacker === 'A') line.classList.add('log-side-a');
    else if (entry.attacker === 'B') line.classList.add('log-side-b');
    else if (entry.attacker === 'system') line.classList.add('log-system');
    else if (entry.attacker === 'status') {
      line.classList.add(entry.side === 'A' ? 'log-side-a' : 'log-side-b');
      line.classList.add('log-status');
    }

    // Color-code by result type
    if (entry.dodged) line.classList.add('log-miss');
    else if (entry.statusTick === 'thorns' || entry.statusTick === 'breathReflect') line.classList.add('log-reflect');
    else if (entry.statusTick) line.classList.add('log-dot');
    else if (entry.damage > 0) line.classList.add('log-hit');

    // Turn badge
    if (entry.turn > 0) {
      line.appendChild(el('span', 'combat-turn-badge', `T${entry.turn}`));
    }

    // Main text + inline HP for damage entries
    const textSpan = el('span', 'combat-log-text', entry.details);

    if (entry.damage && hpAMax) {
      // Figure out which dragon took damage
      let defHpNow, defHpMax;
      if (entry.attacker === 'A') { defHpNow = hpBNow; defHpMax = hpBMax; }
      else if (entry.attacker === 'B') { defHpNow = hpANow; defHpMax = hpAMax; }
      else if (entry.attacker === 'status') {
        if (entry.side === 'A') { defHpNow = hpANow; defHpMax = hpAMax; }
        else { defHpNow = hpBNow; defHpMax = hpBMax; }
      }
      if (defHpMax) {
        const hpInline = el('span', 'combat-log-hp-inline');
        const hpVal = el('span', 'combat-log-hp-val');
        hpVal.textContent = `${Math.round(defHpNow)}`;
        hpVal.style.color = hpColor(defHpNow, defHpMax);
        hpInline.appendChild(document.createTextNode(' ['));
        hpInline.appendChild(hpVal);
        hpInline.appendChild(document.createTextNode(`/${defHpMax}]`));
        textSpan.appendChild(hpInline);
      }
    }

    line.appendChild(textSpan);

    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

// ─── Dragon Panel Builder ────────────────────────────────────

function buildDragonPanel(side) {
  const container = el('div', 'combat-dragon-panel');
  container.dataset.side = side;

  // Header
  const header = el('div', 'combat-panel-header');
  header.appendChild(el('span', 'combat-panel-side', side === 'A' ? '🟠' : '🔵'));
  const nameInput = el('input', 'combat-name-input');
  nameInput.type = 'text';
  nameInput.placeholder = `Dragon ${side}`;
  nameInput.maxLength = 20;
  header.appendChild(nameInput);
  const randomBtn = el('button', 'combat-random-btn', '🎲');
  header.appendChild(randomBtn);
  container.appendChild(header);

  // ── Panel Body: info + sprite side by side (mirrored by CSS) ──
  const panelBody = el('div', 'combat-panel-body');

  // Info column (phenotype card beside stat bars)
  const panelInfo = el('div', 'combat-panel-info');

  const phenotypeCard = el('div', 'combat-phenotype-card');
  panelInfo.appendChild(phenotypeCard);

  const statsColumn = el('div', 'combat-stats-column');
  const statBars = el('div', 'combat-stat-bars');
  statsColumn.appendChild(statBars);
  const elementBadge = el('div', 'combat-element-badge');
  statsColumn.appendChild(elementBadge);
  const breakdownArea = el('div', 'combat-breakdown');
  statsColumn.appendChild(breakdownArea);
  panelInfo.appendChild(statsColumn);

  panelBody.appendChild(panelInfo);

  // Sprite column
  const spriteWrap = el('div', 'combat-sprite-wrap');
  panelBody.appendChild(spriteWrap);

  container.appendChild(panelBody);

  // Gene editor (collapsible)
  const geneToggle = el('button', 'combat-gene-toggle', '▸ Genes');
  container.appendChild(geneToggle);

  const geneEditor = el('div', 'combat-gene-editor');
  geneEditor.style.display = 'none';

  // Mode toggle: Phenotype vs Allele
  const modeBar = el('div', 'combat-gene-mode-bar');
  const modeBtn = el('button', 'combat-gene-mode-btn', 'Phenotype');
  modeBtn.title = 'Switch between phenotype (single) and allele (pair) editing';
  modeBar.appendChild(modeBtn);
  geneEditor.appendChild(modeBar);

  let alleleMode = false; // false = phenotype mode (default)
  const selects = {};
  const phenoSelects = {}; // gene → single phenotype select
  const impactSpans = {};

  for (const group of GENE_GROUPS) {
    const section = el('div', 'creator-section');
    section.appendChild(el('div', 'creator-section-header', group.label));

    for (const gene of group.genes) {
      const def = GENE_DEFS[gene];
      const row = el('div', 'creator-row');
      row.appendChild(el('div', 'creator-gene-label', def.label || gene));

      // Phenotype select (single dropdown, shown by default)
      const phenoSel = makePhenotypeSelect(gene, def);
      phenoSel.className = 'creator-allele-select combat-pheno-select';
      row.appendChild(phenoSel);

      // Allele pair (two dropdowns, hidden by default)
      const pair = el('div', 'creator-allele-pair');
      pair.style.display = 'none';
      const selA = makeAlleleSelect(gene, def, 'A');
      const selB = makeAlleleSelect(gene, def, 'B');
      pair.appendChild(selA);
      pair.appendChild(selB);
      row.appendChild(pair);

      // Stat impact annotation
      const impact = el('span', 'combat-trait-impact');
      row.appendChild(impact);
      impactSpans[gene] = impact;

      selects[gene] = { a: selA, b: selB, pair };
      phenoSelects[gene] = phenoSel;

      // Sync: phenotype → alleles
      phenoSel.addEventListener('change', () => {
        const v = parseInt(phenoSel.value, 10);
        selA.value = v;
        selB.value = v;
        updatePreview();
      });

      section.appendChild(row);
    }

    geneEditor.appendChild(section);
  }

  container.appendChild(geneEditor);

  // Toggle mode
  modeBtn.addEventListener('click', () => {
    alleleMode = !alleleMode;
    modeBtn.textContent = alleleMode ? 'Alleles' : 'Phenotype';
    for (const gene of Object.keys(selects)) {
      phenoSelects[gene].style.display = alleleMode ? 'none' : '';
      selects[gene].pair.style.display = alleleMode ? '' : 'none';
    }
    if (!alleleMode) {
      // Sync phenotype selects from current alleles
      for (const gene of Object.keys(selects)) {
        phenoSelects[gene].value = getResolvedValue(gene);
      }
    }
  });

  let genesVisible = false;
  geneToggle.addEventListener('click', () => {
    genesVisible = !genesVisible;
    geneEditor.style.display = genesVisible ? '' : 'none';
    geneToggle.textContent = genesVisible ? '▾ Genes' : '▸ Genes';
  });

  // ── Panel API ──
  let spriteRenderVersion = 0;
  let cachedStats = null;

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

  function getResolvedValue(gene) {
    const a = parseInt(selects[gene].a.value, 10);
    const b = parseInt(selects[gene].b.value, 10);
    if (CATEGORICAL_GENES.has(gene)) return Math.max(a, b);
    return Math.round((a + b) / 2);
  }

  function updateTraitImpacts() {
    for (const gene of Object.keys(impactSpans)) {
      const resolved = getResolvedValue(gene);
      // Build context for dependent traits
      const context = {};
      if (gene === 'horn_direction') context.horn_style = getResolvedValue('horn_style');
      if (gene === 'spine_height') context.spine_style = getResolvedValue('spine_style');
      if (gene === 'tail_length') context.tail_shape = getResolvedValue('tail_shape');

      const text = getTraitImpact(gene, resolved, context);
      impactSpans[gene].textContent = text;
    }
  }

  function updatePreview() {
    const genotype = readGenotype();
    const phenotype = resolveFullPhenotype(genotype);
    cachedStats = deriveCombatStats(phenotype);

    renderPhenotypeCard(phenotypeCard, phenotype);
    renderStatBars(statBars, cachedStats);
    renderElementBadge(elementBadge, phenotype, cachedStats);
    renderBreakdown(breakdownArea, phenotype, cachedStats);
    updateTraitImpacts();

    const version = ++spriteRenderVersion;
    renderDragon(phenotype, { compact: false, fallbackToTest: true }).then(canvas => {
      if (version !== spriteRenderVersion) return;
      spriteWrap.innerHTML = '';
      canvas.className = 'combat-sprite-canvas';
      spriteWrap.appendChild(canvas);
    }).catch(() => {});
  }

  function randomizeAll() {
    for (const gene of Object.keys(selects)) {
      const def = GENE_DEFS[gene];
      selects[gene].a.value = randomInt(def.min, def.max);
      selects[gene].b.value = randomInt(def.min, def.max);
      // Sync phenotype select
      phenoSelects[gene].value = getResolvedValue(gene);
    }
    nameInput.value = '';
    updatePreview();
  }

  for (const gene of Object.keys(selects)) {
    selects[gene].a.addEventListener('change', updatePreview);
    selects[gene].b.addEventListener('change', updatePreview);
  }
  randomBtn.addEventListener('click', randomizeAll);
  randomizeAll();

  return {
    container,
    readGenotype,
    randomize: randomizeAll,
    updatePreview,
    getName: () => nameInput.value.trim() || `Dragon ${side}`,
    getStats: () => { if (!cachedStats) updatePreview(); return { ...cachedStats }; },
  };
}

// ─── Allele Select Builder ──────────────────────────────────

function makeAlleleSelect(gene, def, label) {
  const sel = el('select', 'creator-allele-select');
  sel.title = `${def.label || gene} — Allele ${label}`;

  for (let v = def.min; v <= def.max; v++) {
    const opt = el('option');
    opt.value = v;
    opt.textContent = (def.phenotypeMap && def.phenotypeMap[v])
      ? `${v} — ${def.phenotypeMap[v]}` : `${v}`;
    sel.appendChild(opt);
  }
  sel.value = Math.round((def.min + def.max) / 2);
  return sel;
}

// ─── Phenotype Select Builder (single dropdown, resolved values) ──

function makePhenotypeSelect(gene, def) {
  const sel = el('select');
  sel.title = `${def.label || gene} — Phenotype`;

  for (let v = def.min; v <= def.max; v++) {
    const opt = el('option');
    opt.value = v;
    opt.textContent = (def.phenotypeMap && def.phenotypeMap[v])
      ? def.phenotypeMap[v] : `Level ${v}`;
    sel.appendChild(opt);
  }
  sel.value = Math.round((def.min + def.max) / 2);
  return sel;
}

// ─── Phenotype Card Renderer ────────────────────────────────

function renderPhenotypeCard(container, phenotype) {
  container.innerHTML = '';

  // Color with swatch
  if (phenotype.color) {
    const c = phenotype.color;
    const line = el('div', 'combat-pheno-line');
    line.appendChild(el('span', 'combat-pheno-label', 'Color: '));
    const value = el('span', 'combat-pheno-value');
    if (c.hex) {
      const swatch = el('span', 'combat-pheno-swatch');
      swatch.style.backgroundColor = c.hex;
      value.appendChild(swatch);
    }
    value.appendChild(document.createTextNode(c.specialtyName || c.displayName || c.name || ''));
    line.appendChild(value);
    container.appendChild(line);
  }

  // Finish
  if (phenotype.finish) {
    addPhenoLine(container, 'Finish', phenotype.finish.displayName || phenotype.finish.name);
  }

  // Breath Element
  if (phenotype.breathElement) {
    addPhenoLine(container, 'Element', phenotype.breathElement.displayName || phenotype.breathElement.name);
  }

  // Traits
  if (phenotype.traits) {
    for (const [geneKey, trait] of Object.entries(phenotype.traits)) {
      const def = GENE_DEFS[geneKey];
      addPhenoLine(container, def.label || geneKey, trait.name || `Lv ${trait.level}`);
    }
  }
}

function addPhenoLine(container, label, value) {
  const line = el('div', 'combat-pheno-line');
  line.appendChild(el('span', 'combat-pheno-label', label + ': '));
  line.appendChild(el('span', 'combat-pheno-value', value));
  container.appendChild(line);
}

// ─── Stat Bar Renderer ──────────────────────────────────────

function renderStatBars(container, stats) {
  container.innerHTML = '';

  for (const sd of STAT_DEFS) {
    const val = stats[sd.key] || 0;
    const pct = Math.min(100, (val / sd.max) * 100);
    const row = el('div', 'combat-stat-row');
    row.appendChild(el('span', 'combat-stat-label', sd.label));

    const barOuter = el('div', 'combat-stat-bar-outer');
    const barFill = el('div', 'combat-stat-bar-fill');
    barFill.style.width = `${pct}%`;
    barFill.style.backgroundColor = sd.color;
    barOuter.appendChild(barFill);
    row.appendChild(barOuter);

    row.appendChild(el('span', 'combat-stat-value', String(val) + (sd.suffix || '')));
    container.appendChild(row);
  }

  // Height
  if (stats.height !== undefined) {
    const r = el('div', 'combat-stat-row');
    r.appendChild(el('span', 'combat-stat-label', 'Height'));
    r.appendChild(el('span', 'combat-stat-value combat-height-badge', `${getHeightName(stats.height)} (${stats.height})`));
    container.appendChild(r);
  }

  // Resistances
  const resists = [
    { label: '🔥', val: stats.fireResist },
    { label: '❄️', val: stats.iceResist },
    { label: '⚡', val: stats.lightningResist },
  ].filter(r => r.val > 0);
  if (resists.length > 0) {
    const r = el('div', 'combat-stat-row');
    r.appendChild(el('span', 'combat-stat-label', 'Resist'));
    r.appendChild(el('span', 'combat-stat-value', resists.map(r => `${r.label}${r.val}%`).join(' ')));
    container.appendChild(r);
  }

  // Breath reflect
  if (stats.breathReflect > 0) {
    const r = el('div', 'combat-stat-row');
    r.appendChild(el('span', 'combat-stat-label', 'Reflect'));
    r.appendChild(el('span', 'combat-stat-value', `${stats.breathReflect}%`));
    container.appendChild(r);
  }

  // Element debuff
  if (stats.elementDebuff) {
    const r = el('div', 'combat-stat-row');
    r.appendChild(el('span', 'combat-stat-label', 'Debuff'));
    r.appendChild(el('span', 'combat-stat-value combat-debuff-info', `${stats.elementDebuff.emoji} ${stats.elementDebuff.desc}`));
    container.appendChild(r);
  }
}

// ─── Element Badge Renderer ─────────────────────────────────

const ELEMENT_COLORS = {
  Fire: '#e05555', Ice: '#55aaee', Lightning: '#eedd44',
  Steam: '#aabbcc', Solar: '#ffbb33', Aurora: '#88ddaa',
  Plasma: '#dd66ff', Void: '#444444', Null: '#666666',
  'Dark Energy': '#2a1a3a',
};

function renderElementBadge(container, phenotype, stats) {
  container.innerHTML = '';
  const be = phenotype.breathElement;
  if (!be) return;

  const breathType = stats.breathType || be.name || 'Null';
  const displayName = stats.isVoid ? 'Void' : (be.displayName || be.name || 'Null');
  const color = ELEMENT_COLORS[breathType] || ELEMENT_COLORS.Null;

  const badge = el('span', 'combat-element-pill');
  badge.style.backgroundColor = color;
  badge.style.color = (breathType === 'Lightning' || breathType === 'Solar') ? '#1e1a16' : '#fff';
  badge.textContent = displayName;
  container.appendChild(badge);

  const shapeNames = ['', 'Single', 'Multi', 'AoE'];
  const rangeNames = ['', 'Close', 'Mid', 'Far'];
  container.appendChild(el('span', 'combat-breath-info',
    `${shapeNames[stats.breathShape] || 'Single'} / ${rangeNames[stats.breathRange] || 'Close'}`));
}

// ─── Stat Breakdown Renderer ─────────────────────────────────

const BREAKDOWN_STATS = [
  { key: 'armor',   label: 'Armor' },
  { key: 'speed',   label: 'Speed' },
  { key: 'evasion', label: 'EVA' },
  { key: 'accuracy',label: 'ACC' },
  { key: 'melee',   label: 'Melee' },
  { key: 'thorns',  label: 'Thorns' },
  { key: 'hp',      label: 'HP' },
];

function renderBreakdown(container, phenotype, stats) {
  container.innerHTML = '';
  const bd = deriveStatBreakdown(phenotype);

  for (const { key, label } of BREAKDOWN_STATS) {
    const entries = bd[key];
    // Only show stats with non-base contributions
    const mods = entries.filter(e => !e.base);
    if (mods.length === 0) continue;

    const finalVal = key === 'hp' ? stats.hp
      : key === 'melee' ? stats.meleeDamage
      : stats[key] || 0;

    const row = el('div', 'combat-bd-row');
    const head = el('span', 'combat-bd-stat');
    head.textContent = `${label}: ${finalVal}`;
    row.appendChild(head);

    const sources = el('span', 'combat-bd-sources');
    sources.textContent = mods.map(m => {
      const v = typeof m.value === 'number'
        ? (m.value > 0 ? `+${m.value}` : `${m.value}`)
        : m.value;
      return `${m.source} ${v}`;
    }).join(', ');
    row.appendChild(sources);
    container.appendChild(row);
  }
}

// ─── HP Bar Builder ─────────────────────────────────────────

function buildHpBar(side, panel) {
  const container = el('div', 'combat-hp-container');
  container.dataset.side = side;
  const label = el('div', 'combat-hp-label', panel.getName());
  const barOuter = el('div', 'combat-hp-bar-outer');
  const barFill = el('div', 'combat-hp-bar-fill');
  barFill.dataset.side = side;
  barOuter.appendChild(barFill);
  const hpText = el('div', 'combat-hp-text', '0 / 0');
  container.appendChild(label);
  container.appendChild(barOuter);
  container.appendChild(hpText);
  return { container, barFill, hpText, label };
}

function setHpBar(hpObj, current, max) {
  const pct = max > 0 ? Math.max(0, (current / max) * 100) : 0;
  hpObj.barFill.style.width = `${pct}%`;
  hpObj.hpText.textContent = `${current} / ${max}`;
  hpObj.barFill.style.backgroundColor = pct > 50 ? '#50bb70' : pct > 25 ? '#e0a030' : '#e05555';
}
