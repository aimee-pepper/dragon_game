// App initialization, tab switching, settings, and shared dragon registry
import { initGenerateTab, getCapturedDragonIds, restoreCapturedDragons } from './ui-generator.js';
import { initBreedTab, getParentAId, getParentBId, restoreBreedParents } from './ui-breeder.js';
import { initStablesTab, addToStables } from './ui-stables.js';
import { onStablesChange } from './ui-stables.js';
import { initQuestsTab } from './ui-quests.js';
import { initAlmanacTab, refreshAlmanac } from './ui-almanac.js';
import { initOptionsTab } from './ui-options.js';
import { initSettings, getSetting, setSetting, onSettingChange } from './settings.js';
import { initQuestWidget } from './ui-quest-widget.js';
import { restoreHighlightedQuest } from './quest-highlight.js';
import { getActiveQuests } from './quest-engine.js';
import { loadGame, saveGame, triggerSave, onStatChange, getStats, registerAchievementHooks, registerBreedHooks, applyPendingBreedRestore, registerCaptureHooks, applyPendingCapturedRestore, registerShopHooks, registerSkillHooks } from './save-manager.js';
import { uiImg } from './ui-card.js';
import { checkAchievements, onAchievementUnlock, getAchievementSaveData, restoreAchievements } from './achievements.js';
import { decodeDragonParams } from './dragon-url.js';
import { Dragon } from './dragon.js';
import { initShopTab, refreshShop } from './ui-shop.js';
import { getShopSaveData, restoreShopState } from './shop-engine.js';
import { getSkillSaveData, restoreSkillState } from './skill-engine.js';

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
    ['c_coin.png', s.gold, 'footer-cur-gold'],
    ['c_exp.png',  s.exp,  'footer-cur-exp'],
    ['c_rep.png',  s.rep,  'footer-cur-rep'],
  ];

  for (const [icon, val, cls] of pairs) {
    const span = document.createElement('span');
    span.className = `footer-cur ${cls}`;
    span.appendChild(uiImg(icon, 'currency-icon'));
    span.appendChild(document.createTextNode(` ${val.toLocaleString()}`));
    el.appendChild(span);
  }
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

// Initialize placeholder tabs (Shop, Inventory, Skills) with "Coming Soon" UI
function initPlaceholderTabs() {
  const placeholders = [
    { id: 'tab-inventory', name: 'Inventory', icon: '🎒', desc: 'View your collected items and resources.' },
    { id: 'tab-skills', name: 'Skills', icon: '⚡', desc: 'Train and improve your dragon-keeping abilities.' },
  ];

  for (const { id, name, icon, desc } of placeholders) {
    const panel = document.getElementById(id);
    if (!panel) continue;
    panel.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'placeholder-tab';

    const iconEl = document.createElement('div');
    iconEl.className = 'placeholder-icon';
    iconEl.textContent = icon;
    wrapper.appendChild(iconEl);

    const titleEl = document.createElement('div');
    titleEl.className = 'placeholder-title';
    titleEl.textContent = name;
    wrapper.appendChild(titleEl);

    const badge = document.createElement('div');
    badge.className = 'placeholder-badge';
    badge.textContent = 'Coming Soon';
    wrapper.appendChild(badge);

    const descEl = document.createElement('div');
    descEl.className = 'placeholder-desc';
    descEl.textContent = desc;
    wrapper.appendChild(descEl);

    panel.appendChild(wrapper);
  }
}

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
  initPlaceholderTabs();
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

  // Footer currency strip — always visible
  refreshFooterCurrency();
  onStatChange(() => refreshFooterCurrency());

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
