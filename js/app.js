// App initialization, tab switching, settings, and shared dragon registry
import { initGenerateTab, getCapturedDragonIds, restoreCapturedDragons } from './ui-generator.js';
import { initBreedTab, getParentAId, getParentBId, restoreBreedParents, refreshPendingEffectsBar } from './ui-breeder.js';
import { initStablesTab, addToStables } from './ui-stables.js';
import { onStablesChange } from './ui-stables.js';
import { initQuestsTab } from './ui-quests.js';
import { initAlmanacTab, refreshAlmanac } from './ui-almanac.js';
import { initOptionsTab } from './ui-options.js';
import { initSettings, getSetting, setSetting, onSettingChange } from './settings.js';
import { initQuestWidget } from './ui-quest-widget.js';
import { restoreHighlightedQuest } from './quest-highlight.js';
import { getActiveQuests } from './quest-engine.js';
import { loadGame, saveGame, triggerSave, onStatChange, getStats, getHotbar, setHotbarSlot, clearHotbarSlot, registerAchievementHooks, registerBreedHooks, applyPendingBreedRestore, registerCaptureHooks, applyPendingCapturedRestore, registerShopHooks, registerSkillHooks } from './save-manager.js';
import { uiImg } from './ui-card.js';
import { checkAchievements, onAchievementUnlock, getAchievementSaveData, restoreAchievements } from './achievements.js';
import { decodeDragonParams } from './dragon-url.js';
import { Dragon } from './dragon.js';
import { initShopTab, refreshShop } from './ui-shop.js';
import { getShopSaveData, restoreShopState, getInventory } from './shop-engine.js';
import { POTION_PRICES } from './economy-config.js';
import { useHotbarEntry, isTargeting, applyTargetToDragon, applyTargetToEgg, getTargetingState, cancelTargeting, POTION_EFFECTS } from './potion-engine.js';
import { SKILL_DEFS } from './skill-config.js';
import { hasSkill } from './skill-engine.js';
import { GENE_DEFS } from './gene-config.js';
import { getEggById, reduceEggHatchTime } from './egg-system.js';
import { initInventoryTab, refreshInventory } from './ui-inventory.js';
import { getSkillSaveData, restoreSkillState, getAvailableXP } from './skill-engine.js';
import { initSkillsTab, refreshSkills } from './ui-skills.js';

// Shared dragon registry — all dragons accessible across tabs
class DragonRegistry {
  constructor() {
    this.dragons = new Map();
  }

  add(dragon) {
    this.dragons.set(dragon.id, dragon);
  }

  get(id) {
    return this.dragons.get(id);
  }

  getAll() {
    return Array.from(this.dragons.values());
  }

  get count() {
    return this.dragons.size;
  }
}

// Footer currency display — always visible above tab bar
function refreshFooterCurrency() {
  const el = document.getElementById('footer-currency');
  if (!el) return;
  const s = getStats();
  el.innerHTML = '';

  const pairs = [
    ['c_coin.png', s.gold,         'footer-cur-gold'],
    ['c_exp.png',  getAvailableXP(), 'footer-cur-exp'],
    ['c_rep.png',  s.rep,           'footer-cur-rep'],
  ];

  for (const [icon, val, cls] of pairs) {
    const span = document.createElement('span');
    span.className = `footer-cur ${cls}`;
    span.appendChild(uiImg(icon, 'currency-icon'));
    span.appendChild(document.createTextNode(` ${val.toLocaleString()}`));
    el.appendChild(span);
  }
}

// ── Hotbar ──────────────────────────────────────────────────

// Skill effect types that can be actively used from hotbar
const HOTBAR_SKILL_TYPES = new Set([
  'reveal', 'egg-reveal', 'carrier',
  'quest-reroll', 'quest-refresh', 'quest-flexibility',
  'trait-lock',
]);

function getHotbarEntryName(entry) {
  if (!entry) return '';
  if (entry.type === 'item') return POTION_PRICES[entry.id]?.name || entry.id;
  if (entry.type === 'skill') return SKILL_DEFS[entry.id]?.name || entry.id;
  return '';
}

function getHotbarEntryIcon(entry) {
  if (!entry) return '';
  if (entry.type === 'item') return '🧪';
  if (entry.type === 'skill') {
    const def = SKILL_DEFS[entry.id];
    if (!def) return '⚡';
    if (def.branch === 'geneticist') return '🧬';
    if (def.branch === 'breeder') return '🥚';
    if (def.branch === 'handler') return '🛡️';
    return '⚡';
  }
  return '';
}

function refreshHotbar() {
  const slots = document.querySelectorAll('.hotbar-slot');
  const hotbar = getHotbar();
  const inventory = getInventory();

  slots.forEach((slot, i) => {
    const entry = hotbar[i];
    slot.innerHTML = '';
    slot.classList.remove('filled', 'filled-skill');

    if (!entry) {
      slot.title = 'Empty slot';
      return;
    }

    if (entry.type === 'item') {
      // Potion — check inventory
      if (inventory.has(entry.id) && inventory.get(entry.id) > 0) {
        slot.classList.add('filled');

        const icon = document.createElement('span');
        icon.className = 'hotbar-icon';
        icon.textContent = '🧪';
        slot.appendChild(icon);

        const count = document.createElement('span');
        count.className = 'hotbar-count';
        count.textContent = inventory.get(entry.id);
        slot.appendChild(count);

        slot.title = getHotbarEntryName(entry);
      } else {
        // Item depleted — clear slot
        clearHotbarSlot(i);
        slot.title = 'Empty slot';
      }
    } else if (entry.type === 'skill') {
      // Skill — always available once unlocked
      if (hasSkill(entry.id)) {
        slot.classList.add('filled', 'filled-skill');

        const icon = document.createElement('span');
        icon.className = 'hotbar-icon';
        icon.textContent = getHotbarEntryIcon(entry);
        slot.appendChild(icon);

        slot.title = getHotbarEntryName(entry);
      } else {
        // Skill no longer unlocked (shouldn't happen, but safety)
        clearHotbarSlot(i);
        slot.title = 'Empty slot';
      }
    }
  });
}

function openHotbarPicker(slotIndex) {
  const inventory = getInventory();
  const hotbar = getHotbar();

  const overlay = document.createElement('div');
  overlay.className = 'hotbar-picker-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const panel = document.createElement('div');
  panel.className = 'hotbar-picker-panel';

  panel.appendChild(_makeEl('div', 'hotbar-picker-title', 'Assign to Slot'));

  // ── Skills section ──
  const skillItems = [];
  for (const [skillId, def] of Object.entries(SKILL_DEFS)) {
    if (!hasSkill(skillId)) continue;
    if (!HOTBAR_SKILL_TYPES.has(def.effect?.type)) continue;
    skillItems.push({ id: skillId, def });
  }

  if (skillItems.length > 0) {
    panel.appendChild(_makeEl('div', 'hotbar-picker-subtitle', 'Skills'));
    for (const { id, def } of skillItems) {
      const row = _makePickerRow(
        getHotbarEntryIcon({ type: 'skill', id }),
        def.name,
        def.desc,
        null, // no count for skills
      );
      row.addEventListener('click', () => {
        setHotbarSlot(slotIndex, { type: 'skill', id });
        overlay.remove();
        refreshHotbar();
      });
      panel.appendChild(row);
    }
  }

  // ── Potions section ──
  let hasPotions = false;
  const potionHeader = _makeEl('div', 'hotbar-picker-subtitle', 'Potions');
  panel.appendChild(potionHeader);

  for (const [itemId, count] of inventory) {
    if (count <= 0) continue;
    if (!POTION_PRICES[itemId]) continue;
    hasPotions = true;

    const row = _makePickerRow(
      '🧪',
      POTION_PRICES[itemId].name,
      POTION_EFFECTS[itemId]?.desc || '',
      `x${count}`,
    );
    row.addEventListener('click', () => {
      setHotbarSlot(slotIndex, { type: 'item', id: itemId });
      overlay.remove();
      refreshHotbar();
    });
    panel.appendChild(row);
  }

  if (!hasPotions && skillItems.length === 0) {
    panel.appendChild(_makeEl('div', 'hotbar-picker-empty', 'No skills or items available yet.'));
  } else if (!hasPotions) {
    panel.appendChild(_makeEl('div', 'hotbar-picker-empty', 'No potions. Visit the Potion Shop!'));
  }

  // ── Clear slot ──
  if (hotbar[slotIndex]) {
    const clearRow = _makePickerRow('✕', 'Clear Slot', '', null);
    clearRow.style.borderTop = '1px solid var(--border)';
    clearRow.style.marginTop = '8px';
    clearRow.style.paddingTop = '12px';
    clearRow.style.opacity = '0.7';
    clearRow.addEventListener('click', () => {
      clearHotbarSlot(slotIndex);
      overlay.remove();
      refreshHotbar();
    });
    panel.appendChild(clearRow);
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function _makeEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function _makePickerRow(icon, name, desc, countText) {
  const row = _makeEl('div', 'hotbar-picker-item');
  const iconEl = _makeEl('span', null, icon);
  iconEl.style.fontSize = '18px';
  iconEl.style.flexShrink = '0';
  row.appendChild(iconEl);

  const info = _makeEl('div', 'picker-item-info');
  info.appendChild(_makeEl('span', 'picker-item-name', name));
  if (desc) info.appendChild(_makeEl('span', 'picker-item-desc', desc));
  row.appendChild(info);

  if (countText) {
    row.appendChild(_makeEl('span', 'picker-item-count', countText));
  }
  return row;
}

// ── Gene picker overlay (shown after selecting a dragon) ────

function _showGenePickerForDragon(dragon, targetState) {
  const overlay = document.createElement('div');
  overlay.className = 'hotbar-picker-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { overlay.remove(); cancelTargeting(); }
  });

  const panel = document.createElement('div');
  panel.className = 'hotbar-picker-panel';
  panel.appendChild(_makeEl('div', 'hotbar-picker-title',
    `Select trait on ${dragon.name || 'Dragon'}`));

  const reveals = dragon.revealedGenes || {};
  const mode = targetState.revealMode; // 'partial', 'full', or null
  const effect = targetState.effect;
  const needsAllelePick = (effect === 'trait-lock');

  // Filter genes based on the effect type
  let geneEntries;
  if (mode === 'partial') {
    geneEntries = Object.entries(GENE_DEFS).filter(([name]) => !reveals[name]);
  } else if (mode === 'full') {
    geneEntries = Object.entries(GENE_DEFS).filter(([name]) => reveals[name] !== 'full');
  } else {
    // For trait-lock and other non-reveal effects, show all genes
    geneEntries = Object.entries(GENE_DEFS);
  }

  if (geneEntries.length === 0) {
    const msg = mode === 'full' ? 'All genes already fully revealed!'
              : mode === 'partial' ? 'All genes already revealed!'
              : 'No applicable traits';
    panel.appendChild(_makeEl('div', 'hotbar-picker-empty', msg));
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    cancelTargeting();
    return;
  }

  for (const [geneName, geneDef] of geneEntries) {
    // Build a description showing current reveal state
    let desc = '';
    if (reveals[geneName] === 'full') desc = 'Fully revealed';
    else if (reveals[geneName] === 'partial') desc = 'Partially revealed';
    else desc = 'Hidden';

    // For revealed genes, show the phenotype map label if available
    const pair = dragon.genotype[geneName];
    if (reveals[geneName] && pair && geneDef.phenotypeMap) {
      const avg = Math.round((pair[0] + pair[1]) / 2);
      const label = geneDef.phenotypeMap[avg] || '';
      if (label) desc += ` — ${label}`;
    }

    const row = _makePickerRow('🔬', geneDef.label || geneName, desc, null);

    row.addEventListener('click', () => {
      if (needsAllelePick && pair) {
        // Show allele picker for this gene
        _showAllelePickerForGene(overlay, panel, dragon, geneName, geneDef, pair);
      } else {
        overlay.remove();
        const success = applyTargetToDragon(dragon, geneName, null);
        showPotionToast(success
          ? `Applied to ${geneDef.label || geneName}!`
          : 'No effect');
        refreshHotbar();
      }
    });
    panel.appendChild(row);
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

// ── Allele picker (shown after selecting a gene for allele-specific effects) ──

function _showAllelePickerForGene(overlay, existingPanel, dragon, geneName, geneDef, pair) {
  // Replace panel contents with allele choices
  existingPanel.innerHTML = '';
  existingPanel.appendChild(_makeEl('div', 'hotbar-picker-title',
    `Select allele for ${geneDef.label || geneName}`));

  const map = geneDef.phenotypeMap || {};

  // Show both alleles
  for (let idx = 0; idx < 2; idx++) {
    const val = pair[idx];
    const label = map[val] || `Value ${val}`;
    const row = _makePickerRow(
      idx === 0 ? 'A' : 'B',
      `Allele ${idx === 0 ? 'A' : 'B'}: ${label}`,
      `Raw value: ${val}`,
      null,
    );
    row.addEventListener('click', () => {
      overlay.remove();
      const success = applyTargetToDragon(dragon, geneName, idx);
      showPotionToast(success
        ? `Locked ${geneDef.label || geneName} allele ${idx === 0 ? 'A' : 'B'}!`
        : 'No effect');
      refreshHotbar();
    });
    existingPanel.appendChild(row);
  }

  // Back button
  const backRow = _makePickerRow('←', 'Back to traits', '', null);
  backRow.style.borderTop = '1px solid var(--border)';
  backRow.style.marginTop = '8px';
  backRow.style.opacity = '0.7';
  backRow.addEventListener('click', () => {
    overlay.remove();
    const state = getTargetingState();
    if (state) _showGenePickerForDragon(dragon, state);
  });
  existingPanel.appendChild(backRow);
}

// Hold a reference to the app registry for targeting lookups
let _appRegistry = null;

function initHotbar(registry) {
  _appRegistry = registry;

  const slots = document.querySelectorAll('.hotbar-slot');
  slots.forEach((slot, i) => {
    // Long-press to reassign/clear, short press to use
    let pressTimer = null;
    let didLongPress = false;

    slot.addEventListener('pointerdown', () => {
      didLongPress = false;
      pressTimer = setTimeout(() => {
        pressTimer = null;
        didLongPress = true;
        openHotbarPicker(i);
      }, 500);
    });

    slot.addEventListener('pointerup', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (didLongPress) return;

      // Short press = use or assign
      const hb = getHotbar();
      const entry = hb[i];

      if (entry) {
        const result = useHotbarEntry(i, entry);
        if (result.ok) {
          showPotionToast(result.message);
          refreshHotbar();
          refreshPendingEffectsBar(); // update breed modifier display
        } else {
          showPotionToast(result.message);
        }
      } else {
        openHotbarPicker(i);
      }
    });

    slot.addEventListener('pointerleave', () => {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    });

    slot.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // Global click handler for targeting mode
  // When targeting is active, clicking a dragon card or egg rack slot → apply effect
  document.addEventListener('click', (e) => {
    if (!isTargeting()) return;

    const state = getTargetingState();
    if (!state) return;

    // ── Egg targeting ──
    if (state.targetType === 'egg') {
      // Clutch locked eggs (unlock-egg effect only)
      if (state.effect === 'unlock-egg') {
        const lockedCard = e.target.closest('.egg-card-locked[data-egg-index]');
        if (lockedCard) {
          e.preventDefault();
          e.stopPropagation();
          const eggIndex = Number(lockedCard.dataset.eggIndex);
          // Use applyTargetToEgg to consume powder + cancel targeting
          const success = applyTargetToEgg({ id: 0, dragon: null }, null);
          if (success) {
            document.dispatchEvent(new CustomEvent('unlock-clutch-egg', { detail: { index: eggIndex } }));
          }
          showPotionToast(success ? 'Egg unlocked!' : 'No effect');
          refreshHotbar();
          return;
        }
      }

      // Egg rack eggs
      const eggSlot = e.target.closest('.egg-rack-slot');
      if (!eggSlot) return;

      const eggId = Number(eggSlot.dataset.eggId);
      if (!eggId) return;

      const egg = getEggById(eggId);
      if (!egg) return;

      e.preventDefault();
      e.stopPropagation();

      const success = applyTargetToEgg(egg, reduceEggHatchTime);
      showPotionToast(success ? 'Applied!' : 'No effect');
      refreshHotbar();
      return;
    }

    // ── Dragon targeting ──
    const cardEl = e.target.closest('.dragon-card');
    if (!cardEl) return;

    const dragonId = cardEl.dataset.dragonId;
    if (!dragonId) return;

    const dragon = _appRegistry?.get(Number(dragonId));
    if (!dragon) return;

    e.preventDefault();
    e.stopPropagation();

    // Check if this effect needs a specific gene selection
    if (state && state.needsGenePick) {
      _showGenePickerForDragon(dragon, state);
    } else {
      // Apply directly to the whole dragon
      const success = applyTargetToDragon(dragon, null);
      showPotionToast(success ? 'Applied!' : 'No effect');
      refreshHotbar();
    }
  }, true);

  refreshHotbar();
}

function showPotionToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'claim-toast'; // reuse the existing toast style
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Tab switching
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      // Persist active tab
      setSetting('active-tab', target);
    });
  });

  // Restore saved tab (if not the default)
  const savedTab = getSetting('active-tab');
  if (savedTab && savedTab !== 'generate') {
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
    if (targetBtn) targetBtn.click();
  }
}

// Apply theme from settings
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

// (Placeholder tabs removed — all tabs now have real implementations)

// ── NFC Dragon Claim ────────────────────────────────────────
// Handles ?d= URL parameter: decodes a compact dragon genotype, adds to stables

function claimDragonFromURL(urlParams, registry) {
  try {
    const { genotype, sex, name, isDarkEnergy } = decodeDragonParams(urlParams);
    const dragon = new Dragon({
      genotype,
      sex,
      name,         // null → auto-generated name
      generation: 0, // wild caught
      isDarkEnergy,
    });
    registry.add(dragon);
    addToStables(dragon, true); // force=true: NFC claims bypass slot limits
    triggerSave();

    // Show claim toast
    showClaimToast(dragon.name);
  } catch (e) {
    console.warn('Invalid dragon claim URL:', e);
    showClaimToast(null, e.message);
  }
}

function showClaimToast(dragonName, error) {
  const toast = document.createElement('div');
  toast.className = 'claim-toast';

  if (error) {
    toast.classList.add('claim-toast-error');
    toast.textContent = `Invalid dragon link`;
  } else {
    toast.textContent = `You found ${dragonName}! Added to your stables.`;
  }

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Boot
function init() {
  const registry = new DragonRegistry();

  // Settings first — everything else may depend on them
  initSettings();
  applyTheme(getSetting('theme'));
  onSettingChange('theme', applyTheme);

  // Art style change: reload page to re-render all sprites with the new style
  onSettingChange('art-style', () => {
    window.location.reload();
  });

  // Register hooks (breaks circular dependencies: save-manager <-> UI modules)
  registerAchievementHooks(getAchievementSaveData, restoreAchievements);
  registerBreedHooks(getParentAId, getParentBId, restoreBreedParents);
  registerCaptureHooks(getCapturedDragonIds, restoreCapturedDragons);
  registerShopHooks(getShopSaveData, restoreShopState);
  registerSkillHooks(getSkillSaveData, restoreSkillState);

  // Load saved game state (restores dragons, stables, quests, stats, ID counters, achievements)
  // Breed parents + captured dragons are deferred (stored as IDs, applied after UI init)
  const hadSave = loadGame(registry);
  if (hadSave) {
    console.log('Restored game from save');
  }

  initTabs();
  initGenerateTab(document.getElementById('tab-generate'), registry);
  initBreedTab(document.getElementById('tab-breed'), registry);
  initStablesTab(document.getElementById('tab-stables'), registry);
  initQuestsTab(document.getElementById('tab-quests'), registry);
  initAlmanacTab(document.getElementById('tab-almanac'), registry);
  initOptionsTab(document.getElementById('tab-options'), registry);
  initShopTab(document.getElementById('tab-shop'));
  initSkillsTab(document.getElementById('tab-skills'));
  initInventoryTab(document.getElementById('tab-inventory'));
  initQuestWidget();

  // Apply deferred restores (breed parents + captured dragons) after UI init
  applyPendingCapturedRestore(registry);
  applyPendingBreedRestore(registry);

  // Restore pinned quest from saved setting (after quests + widget are initialized)
  restoreHighlightedQuest(getActiveQuests());

  // Wire auto-save: save whenever stables change (covers add/remove/release-all)
  // Quest completion and refresh already call triggerSave() directly
  onStablesChange(() => triggerSave());

  // Refresh shop display whenever stats change (gold/rep updates)
  onStatChange(() => refreshShop());

  // Refresh skills display when stats change (XP available updates)
  // Note: onSkillChange is already registered internally by ui-skills.js
  onStatChange(() => refreshSkills());

  // Footer currency strip — always visible
  refreshFooterCurrency();
  onStatChange(() => refreshFooterCurrency());

  // Hotbar — 5-slot quick-use bar for consumable items
  initHotbar(registry);
  onStatChange(() => { refreshHotbar(); refreshInventory(); }); // refresh when purchases/currency change
  window.addEventListener('hotbar-changed', () => refreshHotbar());

  // ── Achievement system ──
  // Debounced achievement check — called from multiple triggers
  let achCheckTimer = null;
  function debouncedAchievementCheck() {
    if (achCheckTimer) clearTimeout(achCheckTimer);
    achCheckTimer = setTimeout(() => {
      const newlyUnlocked = checkAchievements(registry);
      if (newlyUnlocked.length > 0) {
        triggerSave();
        refreshAlmanac();
      }
    }, 500);
  }

  // Check achievements on stables change AND stat changes
  onStablesChange(() => debouncedAchievementCheck());
  onStatChange(() => debouncedAchievementCheck());

  // Toast notification for achievement unlocks
  onAchievementUnlock((achievement) => {
    showAchievementToast(achievement);
  });

  // Initial achievement check (in case save data triggers unlocks)
  checkAchievements(registry);

  // ── NFC Dragon Claim URL ──
  // Check for ?d= parameter and claim dragon if present
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('d')) {
    claimDragonFromURL(urlParams, registry);
    // Clean URL without reloading (removes ?d=... from address bar)
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Initial save to persist the registry reference
  saveGame(registry);

  // Dismiss loading screen after a frame so the DOM has painted
  requestAnimationFrame(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('fade-out');
      loader.addEventListener('transitionend', () => loader.remove());
    }
  });
}

// Achievement unlock toast notification — queued to show one at a time
const toastQueue = [];
let toastShowing = false;

function showAchievementToast(achievement) {
  toastQueue.push(achievement);
  if (!toastShowing) processToastQueue();
}

function processToastQueue() {
  if (toastQueue.length === 0) {
    toastShowing = false;
    return;
  }
  toastShowing = true;
  const achievement = toastQueue.shift();

  const existing = document.querySelector('.ach-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `ach-toast ach-toast-${achievement.rarity}`;

  const icon = document.createElement('div');
  icon.className = 'ach-toast-icon';
  icon.textContent = achievement.icon;
  toast.appendChild(icon);

  const info = document.createElement('div');
  info.className = 'ach-toast-info';

  const label = document.createElement('div');
  label.className = 'ach-toast-label';
  label.textContent = 'Achievement Unlocked!';
  info.appendChild(label);

  const name = document.createElement('div');
  name.className = 'ach-toast-name';
  name.textContent = achievement.name;
  info.appendChild(name);

  const desc = document.createElement('div');
  desc.className = 'ach-toast-desc';
  desc.textContent = achievement.desc;
  info.appendChild(desc);

  toast.appendChild(info);
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add('visible'));

  // Auto-dismiss after 3 seconds, then show next in queue
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.remove();
      processToastQueue();
    }, 400);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
