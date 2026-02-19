// App initialization, tab switching, settings, and shared dragon registry
import { initGenerateTab, getCapturedDragonIds, restoreCapturedDragons } from './ui-generator.js';
import { initBreedTab, getParentAId, getParentBId, restoreBreedParents } from './ui-breeder.js';
import { initStablesTab } from './ui-stables.js';
import { onStablesChange } from './ui-stables.js';
import { initQuestsTab } from './ui-quests.js';
import { initAlmanacTab, refreshAlmanac } from './ui-almanac.js';
import { initOptionsTab } from './ui-options.js';
import { initSettings, getSetting, setSetting, onSettingChange } from './settings.js';
import { initQuestWidget } from './ui-quest-widget.js';
import { restoreHighlightedQuest } from './quest-highlight.js';
import { getActiveQuests } from './quest-engine.js';
import { loadGame, saveGame, triggerSave, onStatChange, registerAchievementHooks, registerBreedHooks, applyPendingBreedRestore, registerCaptureHooks, applyPendingCapturedRestore } from './save-manager.js';
import { checkAchievements, onAchievementUnlock, getAchievementSaveData, restoreAchievements } from './achievements.js';

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
    { id: 'tab-shop', name: 'Shop', icon: '🏪', desc: 'Buy and sell items, eggs, and upgrades.' },
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
  initOptionsTab(document.getElementById('tab-options'));
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
