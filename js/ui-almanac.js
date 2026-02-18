// Almanac tab: two-tier navigation — Encyclopedia + Achievements
// Encyclopedia: Colors, Finishes, Elements, Combos, Traits
// Achievements: Trophy Wall, Stats Dashboard
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
  GENE_DEFS,
  cmyToRGB,
  rgbToHex,
  classifyLevel,
} from './gene-config.js';
import { getCompletedQuests } from './quest-engine.js';
import { renderDragonCard } from './ui-card.js';
import { openFamilyTree } from './ui-family-tree.js';
import { getStats } from './save-manager.js';
import {
  getAchievements,
  isUnlocked,
  getUnlockedAchievements,
  getUnlockedCount,
  getTotalCount,
  getAchievementProgress,
  ACHIEVEMENT_CATEGORIES,
  getColorThemes,
} from './achievements.js';

let containerEl = null;
let dragonRegistry = null;
let activeTopTab = 'encyclopedia';
let activeEncPane = 'colors';

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

export function initAlmanacTab(container, registry) {
  dragonRegistry = registry || null;
  containerEl = el('div', 'almanac-wrapper');
  container.appendChild(containerEl);
  render();
}

// Re-render the almanac (used when achievements update)
export function refreshAlmanac() {
  if (containerEl) render();
}

function render() {
  containerEl.innerHTML = '';

  // ── Top-level navigation: Encyclopedia / Achievements ──
  const topNav = el('div', 'almanac-top-nav');
  const topTabs = [
    { key: 'encyclopedia', label: 'Encyclopedia' },
    { key: 'achievements', label: 'Achievements' },
  ];
  topTabs.forEach(tab => {
    const btn = el('button', 'almanac-top-btn' + (tab.key === activeTopTab ? ' active' : ''), tab.label);
    btn.addEventListener('click', () => {
      activeTopTab = tab.key;
      render();
    });
    topNav.appendChild(btn);
  });
  containerEl.appendChild(topNav);

  // ── Render active top-level section ──
  if (activeTopTab === 'encyclopedia') {
    renderEncyclopedia();
  } else {
    renderAchievements();
  }
}

// ══════════════════════════════════════════════════════
// ENCYCLOPEDIA SECTION
// ══════════════════════════════════════════════════════

function renderEncyclopedia() {
  // Sub-navigation
  const nav = el('div', 'almanac-nav');
  const panes = ['colors', 'finishes', 'elements', 'combos', 'traits'];
  const paneLabels = ['Colors', 'Finishes', 'Elements', 'Combos', 'Traits'];

  let panesContainer; // forward reference for click handler

  panes.forEach((pane, i) => {
    const btn = el('button', 'almanac-pane-btn' + (pane === activeEncPane ? ' active' : ''), paneLabels[i]);
    btn.dataset.pane = pane;
    btn.addEventListener('click', () => {
      activeEncPane = pane;
      nav.querySelectorAll('.almanac-pane-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      panesContainer.querySelectorAll('.almanac-pane').forEach(p => {
        p.classList.toggle('active', p.dataset.pane === pane);
      });
    });
    nav.appendChild(btn);
  });
  containerEl.appendChild(nav);

  panesContainer = el('div', 'almanac-panes');

  // Colors pane
  const colorPane = renderColorPane();
  colorPane.dataset.pane = 'colors';
  colorPane.classList.add('almanac-pane');
  if (activeEncPane === 'colors') colorPane.classList.add('active');
  panesContainer.appendChild(colorPane);

  // Finishes pane
  const finishPane = renderFinishPane();
  finishPane.dataset.pane = 'finishes';
  finishPane.classList.add('almanac-pane');
  if (activeEncPane === 'finishes') finishPane.classList.add('active');
  panesContainer.appendChild(finishPane);

  // Elements pane
  const elementPane = renderElementPane();
  elementPane.dataset.pane = 'elements';
  elementPane.classList.add('almanac-pane');
  if (activeEncPane === 'elements') elementPane.classList.add('active');
  panesContainer.appendChild(elementPane);

  // Combos pane
  const combosPane = renderCombosPane();
  combosPane.dataset.pane = 'combos';
  combosPane.classList.add('almanac-pane');
  if (activeEncPane === 'combos') combosPane.classList.add('active');
  panesContainer.appendChild(combosPane);

  // Traits pane
  const traitsPane = renderTraitsPane();
  traitsPane.dataset.pane = 'traits';
  traitsPane.classList.add('almanac-pane');
  if (activeEncPane === 'traits') traitsPane.classList.add('active');
  panesContainer.appendChild(traitsPane);

  containerEl.appendChild(panesContainer);
}

// ══════════════════════════════════════════════════════
// ACHIEVEMENTS SECTION
// ══════════════════════════════════════════════════════

let activeAchSubTab = 'badges';

function renderAchievements() {
  const wrapper = el('div', 'achievements-wrapper');

  // ── Sub-navigation: Badges / Trophies / Stats ──
  const subNav = el('div', 'ach-sub-nav');
  const subTabs = [
    { key: 'badges', label: `Badges (${getUnlockedCount()}/${getTotalCount()})` },
    { key: 'trophies', label: 'Trophies' },
    { key: 'stats', label: 'Stats' },
  ];
  subTabs.forEach(tab => {
    const btn = el('button', 'ach-sub-btn' + (tab.key === activeAchSubTab ? ' active' : ''), tab.label);
    btn.addEventListener('click', () => {
      activeAchSubTab = tab.key;
      render();
    });
    subNav.appendChild(btn);
  });
  wrapper.appendChild(subNav);

  if (activeAchSubTab === 'badges') {
    renderAchievementBadges(wrapper);
  } else if (activeAchSubTab === 'trophies') {
    renderTrophyWall(wrapper);
  } else {
    renderStatsPanel(wrapper);
  }

  containerEl.appendChild(wrapper);
}

// ── Achievement Badges Grid ──

function renderAchievementBadges(wrapper) {
  const achievements = getAchievements();

  // Overall progress bar
  const progressRow = el('div', 'ach-progress-row');
  const unlocked = getUnlockedCount();
  const total = getTotalCount();
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  progressRow.appendChild(el('span', 'ach-progress-label', `${unlocked} / ${total} unlocked (${pct}%)`));
  const bar = el('div', 'ach-progress-bar');
  const fill = el('div', 'ach-progress-fill');
  fill.style.width = `${pct}%`;
  bar.appendChild(fill);
  progressRow.appendChild(bar);
  wrapper.appendChild(progressRow);

  // Group by category
  for (const cat of ACHIEVEMENT_CATEGORIES) {
    const catAchievements = achievements.filter(a => a.category === cat.key);
    if (catAchievements.length === 0) continue;

    const catUnlocked = catAchievements.filter(a => isUnlocked(a.id)).length;
    const catHeader = el('div', 'ach-cat-header');
    catHeader.appendChild(el('span', 'ach-cat-icon', cat.icon));
    catHeader.appendChild(el('span', 'ach-cat-label', `${cat.label} (${catUnlocked}/${catAchievements.length})`));
    wrapper.appendChild(catHeader);

    const grid = el('div', 'ach-badge-grid');
    for (const achievement of catAchievements) {
      grid.appendChild(renderAchievementBadge(achievement));
    }
    wrapper.appendChild(grid);
  }
}

function renderAchievementBadge(achievement) {
  const unlocked = isUnlocked(achievement.id);
  const badge = el('div', `ach-badge ach-${achievement.rarity}${unlocked ? ' ach-unlocked' : ''}`);

  // Icon
  const iconEl = el('div', 'ach-badge-icon', achievement.icon);
  badge.appendChild(iconEl);

  // Name
  badge.appendChild(el('div', 'ach-badge-name', achievement.name));

  // Description
  badge.appendChild(el('div', 'ach-badge-desc', achievement.desc));

  // Rarity label
  const rarityLabel = el('div', `ach-badge-rarity ach-rarity-${achievement.rarity}`);
  rarityLabel.textContent = achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1);
  badge.appendChild(rarityLabel);

  // Progress bar (if not yet unlocked and has progress)
  if (!unlocked && achievement.progress) {
    const prog = getAchievementProgress(achievement.id, dragonRegistry);
    if (prog) {
      const progWrap = el('div', 'ach-badge-progress');
      const progBar = el('div', 'ach-badge-progress-bar');
      const progFill = el('div', 'ach-badge-progress-fill');
      const progPct = Math.min(100, Math.round((prog.current / prog.target) * 100));
      progFill.style.width = `${progPct}%`;
      progBar.appendChild(progFill);
      progWrap.appendChild(progBar);
      progWrap.appendChild(el('span', 'ach-badge-progress-text', `${prog.current}/${prog.target}`));
      badge.appendChild(progWrap);
    }
  }

  // Unlock timestamp
  if (unlocked) {
    const data = getUnlockedAchievements()[achievement.id];
    if (data && data.unlockedAt) {
      const date = new Date(data.unlockedAt);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      badge.appendChild(el('div', 'ach-badge-date', `Unlocked ${dateStr}`));
    }
  }

  return badge;
}

// ── Trophy Wall ──

function renderTrophyWall(wrapper) {
  wrapper.appendChild(el('div', 'almanac-pane-header', 'Quest Trophy Wall'));

  const completed = getCompletedQuests();
  if (completed.length === 0) {
    const empty = el('div', 'achievements-empty');
    empty.textContent = 'No completed quests yet. Complete quests to see your trophies here!';
    wrapper.appendChild(empty);
  } else {
    const trophyList = el('div', 'trophy-wall');
    for (const quest of completed) {
      trophyList.appendChild(renderTrophyCard(quest));
    }
    wrapper.appendChild(trophyList);
  }
}

// ── Stats Dashboard ──

function renderStatsPanel(wrapper) {
  wrapper.appendChild(el('div', 'almanac-pane-header', 'Stats'));

  const stats = getStats();
  const statsGrid = el('div', 'stats-dashboard');

  const statEntries = [
    { label: 'Dragons Captured', value: stats.totalGenerated, icon: '🐉' },
    { label: 'Dragons Bred', value: stats.totalBred, icon: '🥚' },
    { label: 'Quests Completed', value: stats.totalQuestsCompleted, icon: '✓' },
    { label: 'Dragons Stabled', value: stats.totalStabled, icon: '🏠' },
    { label: 'Dragons Released', value: stats.totalReleased, icon: '🌿' },
  ];

  for (const stat of statEntries) {
    const card = el('div', 'stat-card');
    card.appendChild(el('div', 'stat-icon', stat.icon));
    card.appendChild(el('div', 'stat-value', String(stat.value)));
    card.appendChild(el('div', 'stat-label', stat.label));
    statsGrid.appendChild(card);
  }

  wrapper.appendChild(statsGrid);
}

function renderTrophyCard(quest) {
  const card = el('div', 'trophy-card');

  // Quest info header
  const header = el('div', 'trophy-header');
  const badge = el('span', `quest-difficulty quest-difficulty-${quest.difficulty}`, getDifficultyLabel(quest.difficulty));
  header.appendChild(badge);
  header.appendChild(el('span', 'trophy-quest-title', quest.title));
  card.appendChild(header);

  // Completed by info
  if (quest.completedBy) {
    const completedInfo = el('div', 'trophy-completed-by');
    completedInfo.appendChild(el('span', 'trophy-check', '✓'));

    const genText = quest.completedByGeneration > 0
      ? ` (Gen ${quest.completedByGeneration})`
      : ' (Wild)';

    const nameSpan = el('span', 'trophy-dragon-name', quest.completedBy + genText);

    // Make clickable to view lineage if dragon is in registry
    if (quest.completedById && dragonRegistry) {
      const dragon = dragonRegistry.get(quest.completedById);
      if (dragon) {
        nameSpan.classList.add('trophy-name-link');
        nameSpan.addEventListener('click', () => {
          openFamilyTree(dragon, dragonRegistry);
        });
      }
    }

    completedInfo.appendChild(nameSpan);
    card.appendChild(completedInfo);
  }

  // Dragon card preview (if dragon is still in registry)
  if (quest.completedById && dragonRegistry) {
    const dragon = dragonRegistry.get(quest.completedById);
    if (dragon) {
      const dragonCard = renderDragonCard(dragon, {
        showGenotype: false,
        hideSprite: false,
        onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
      });
      dragonCard.classList.add('trophy-dragon-card');
      card.appendChild(dragonCard);
    }
  }

  return card;
}

function getDifficultyLabel(d) {
  const map = { easy: 'Easy', medium: 'Medium', hard: 'Hard', 'extra-hard': 'Extra Hard' };
  return map[d] || d;
}

// ══════════════════════════════════════════════════════
// TRAITS PANE
// ══════════════════════════════════════════════════════

// Grouped trait categories for display
const TRAIT_GROUPS = [
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

function renderTraitsPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Traits'));

  const intro = el('div', 'almanac-combo-intro');
  intro.textContent = 'All possible trait values for each body feature. Traits not covered by Colors, Finishes, Elements, or Combos.';
  pane.appendChild(intro);

  for (const group of TRAIT_GROUPS) {
    pane.appendChild(el('div', 'almanac-tier-label', group.label));

    const list = el('div', 'traits-group');
    for (const geneName of group.genes) {
      const def = GENE_DEFS[geneName];
      if (!def || !def.phenotypeMap) continue;

      const row = el('div', 'trait-row');
      row.appendChild(el('div', 'trait-gene-label', def.label));

      const valuesRow = el('div', 'trait-values');
      const sortedKeys = Object.keys(def.phenotypeMap).sort((a, b) => Number(a) - Number(b));
      for (const key of sortedKeys) {
        const name = def.phenotypeMap[key];
        const chip = el('span', 'trait-chip', name);
        valuesRow.appendChild(chip);
      }
      row.appendChild(valuesRow);

      // Show inheritance type
      const inherit = el('div', 'trait-inheritance');
      inherit.textContent = def.inheritanceType === 'categorical' ? 'Categorical (dominant)' : 'Linear (blending)';
      row.appendChild(inherit);

      list.appendChild(row);
    }
    pane.appendChild(list);
  }

  return pane;
}

// ══════════════════════════════════════════════════════
// ENCYCLOPEDIA PANES (existing, preserved)
// ══════════════════════════════════════════════════════

// ---- Shared Grid Renderer ----
function renderGrid(outerLevel, namesTable, specialNames, rowAxis, colAxis, keyBuilder, makeSwatchFn) {
  const grid = el('div', 'almanac-grid');

  grid.appendChild(el('div', 'almanac-grid-corner'));
  for (let c = 0; c < 4; c++) {
    const colLabel = el('div', 'almanac-grid-col-label');
    colLabel.appendChild(el('span', colAxis.cls, colAxis.short));
    colLabel.appendChild(document.createTextNode(`: ${LEVEL_LABELS[c]}`));
    grid.appendChild(colLabel);
  }

  for (let r = 0; r < 4; r++) {
    const rowLabel = el('div', 'almanac-grid-row-label');
    rowLabel.appendChild(el('span', rowAxis.cls, rowAxis.short));
    rowLabel.appendChild(document.createTextNode(`: ${LEVEL_LABELS[r]}`));
    grid.appendChild(rowLabel);

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

// ---- Color Pane ----

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

  for (let y = 0; y < 4; y++) {
    pane.appendChild(el('div', 'almanac-tier-label', YELLOW_TIER_LABELS[y]));
    pane.appendChild(renderGrid(
      y,
      COLOR_NAMES,
      COLOR_SPECIAL_NAMES,
      { short: 'M', cls: 'cmy-m' },
      { short: 'C', cls: 'cmy-c' },
      (yTier, mTier, cTier) => `${cTier}-${mTier}-${yTier}`,
      (key) => {
        const [cT, mT, yT] = key.split('-').map(Number);
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

// ---- Finish Pane ----

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

  for (let o = 0; o < 4; o++) {
    pane.appendChild(el('div', 'almanac-tier-label', OPACITY_TIER_LABELS[o]));
    pane.appendChild(renderGrid(
      o,
      FINISH_NAMES,
      FINISH_SPECIAL_NAMES,
      { short: 'Sh', cls: 'finish-s' },
      { short: 'Sc', cls: 'finish-sc' },
      (oTier, shTier, scTier) => `${oTier}-${shTier}-${scTier}`,
      null
    ));
  }

  return pane;
}

// ---- Element Pane ----

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

  for (let l = 0; l < 4; l++) {
    pane.appendChild(el('div', 'almanac-tier-label', LIGHTNING_TIER_LABELS[l]));
    pane.appendChild(renderGrid(
      l,
      ELEMENT_NAMES,
      ELEMENT_SPECIAL_NAMES,
      { short: 'F', cls: 'breath-f' },
      { short: 'I', cls: 'breath-i' },
      (lTier, fTier, iTier) => `${fTier}-${iTier}-${lTier}`,
      null
    ));
  }

  // Rare variants section (Dark Energy)
  pane.appendChild(el('div', 'almanac-tier-label almanac-rare-label', 'Rare Variants'));

  const rareEntry = el('div', 'almanac-entry');

  const visual = el('div', 'almanac-entry-visual');
  const dot = el('div', 'almanac-dot');
  dot.style.background = DARK_ENERGY_PHENOTYPE.displayColor;
  visual.appendChild(dot);
  rareEntry.appendChild(visual);

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

// ---- Combos Pane ----

const COMBO_CATEGORIES = [
  'Gemstone', 'Opal', 'Moonstone', 'Pearl', 'Metal', 'Stone', 'Ghost',
];

const TIER_LABELS = ['None', 'Low', 'Mid', 'High'];

function renderTierAxes(container, tierKey, axes) {
  const tiers = tierKey.split('-').map(Number);
  tiers.forEach((t, i) => {
    container.appendChild(el('span', axes[i].cls, `${axes[i].short}: ${TIER_LABELS[t]}`));
    if (i < tiers.length - 1) container.appendChild(document.createTextNode(' · '));
  });
}

const COLOR_COMBO_AXES = [
  { short: 'C', cls: 'cmy-c' },
  { short: 'M', cls: 'cmy-m' },
  { short: 'Y', cls: 'cmy-y' },
];

const FINISH_COMBO_AXES = [
  { short: 'O', cls: 'finish-o' },
  { short: 'Sh', cls: 'finish-s' },
  { short: 'Sc', cls: 'finish-sc' },
];

const ELEMENT_COMBO_AXES = [
  { short: 'F', cls: 'breath-f' },
  { short: 'I', cls: 'breath-i' },
  { short: 'L', cls: 'breath-l' },
];

const ELEMENT_HL_NAMES = {
  'L-L-L': 'Void', 'H-L-L': 'Fire', 'L-H-L': 'Ice', 'L-L-H': 'Lightning',
  'H-H-L': 'Steam', 'H-L-H': 'Solar', 'L-H-H': 'Aurora', 'H-H-H': 'Plasma',
};

function hlToTierKey(hlKey) {
  return hlKey.split('-').map(v => v === 'H' ? '3' : '0').join('-');
}

function renderCombosPane() {
  const pane = el('div', '');
  pane.appendChild(el('div', 'almanac-pane-header', 'Specialty Combos'));

  const intro = el('div', 'almanac-combo-intro');
  intro.textContent = 'Special names triggered when a dragon has a specific color + finish combination, or a finish + element combination.';
  pane.appendChild(intro);

  const grouped = {};
  for (const [key, combo] of Object.entries(SPECIALTY_COMBOS)) {
    const cat = combo.category;
    if (!grouped[cat]) grouped[cat] = [];
    const [colorKey, finishKey] = key.split('|');
    const colorName = COLOR_NAMES[colorKey] || '???';
    const finishName = FINISH_NAMES[finishKey] || '???';
    grouped[cat].push({ name: combo.name, colorName, finishName, colorKey, finishKey });
  }

  for (const cat of COMBO_CATEGORIES) {
    const entries = grouped[cat];
    if (!entries || entries.length === 0) continue;

    pane.appendChild(el('div', 'almanac-tier-label', cat + 's'));

    const list = el('div', 'almanac-combo-list');
    for (const entry of entries) {
      const row = el('div', 'almanac-combo-entry');
      row.appendChild(el('div', 'almanac-combo-name', entry.name));

      const recipe = el('div', 'almanac-combo-recipe');

      const colorPart = el('span', 'almanac-combo-part');
      colorPart.appendChild(el('span', 'almanac-combo-part-name', entry.colorName));
      const colorAxes = el('span', 'almanac-combo-axes');
      renderTierAxes(colorAxes, entry.colorKey, COLOR_COMBO_AXES);
      colorPart.appendChild(colorAxes);
      recipe.appendChild(colorPart);

      recipe.appendChild(el('span', 'almanac-combo-plus', '+'));

      const finishPart = el('span', 'almanac-combo-part');
      finishPart.appendChild(el('span', 'almanac-combo-part-name', entry.finishName));
      const finishAxes = el('span', 'almanac-combo-axes');
      renderTierAxes(finishAxes, entry.finishKey, FINISH_COMBO_AXES);
      finishPart.appendChild(finishAxes);
      recipe.appendChild(finishPart);

      row.appendChild(recipe);
      list.appendChild(row);
    }
    pane.appendChild(list);
  }

  // Element Modifiers section
  pane.appendChild(el('div', 'almanac-tier-label', 'Element Modifiers'));

  const modIntro = el('div', 'almanac-combo-intro');
  modIntro.textContent = 'Prefix applied to color name when finish + element match (e.g. "Molten Red").';
  pane.appendChild(modIntro);

  const modList = el('div', 'almanac-combo-list');
  for (const [key, modifier] of Object.entries(ELEMENT_MODIFIERS)) {
    const [finishKey, elementKey] = key.split('|');
    const finishName = FINISH_NAMES[finishKey] || '???';
    const elementName = ELEMENT_HL_NAMES[elementKey] || '???';

    const row = el('div', 'almanac-combo-entry');
    row.appendChild(el('div', 'almanac-combo-name', modifier));

    const recipe = el('div', 'almanac-combo-recipe');

    const finishPart = el('span', 'almanac-combo-part');
    finishPart.appendChild(el('span', 'almanac-combo-part-name', finishName));
    const finishAxes = el('span', 'almanac-combo-axes');
    renderTierAxes(finishAxes, finishKey, FINISH_COMBO_AXES);
    finishPart.appendChild(finishAxes);
    recipe.appendChild(finishPart);

    recipe.appendChild(el('span', 'almanac-combo-plus', '+'));

    const elemPart = el('span', 'almanac-combo-part');
    elemPart.appendChild(el('span', 'almanac-combo-part-name', elementName));
    const elemAxes = el('span', 'almanac-combo-axes');
    renderTierAxes(elemAxes, hlToTierKey(elementKey), ELEMENT_COMBO_AXES);
    elemPart.appendChild(elemAxes);
    recipe.appendChild(elemPart);

    row.appendChild(recipe);
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
