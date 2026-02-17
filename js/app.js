// App initialization, tab switching, settings, and shared dragon registry
import { initGenerateTab } from './ui-generator.js';
import { initBreedTab } from './ui-breeder.js';
import { initStablesTab } from './ui-stables.js';
import { onStablesChange } from './ui-stables.js';
import { initQuestsTab } from './ui-quests.js';
import { initAlmanacTab } from './ui-almanac.js';
import { initOptionsTab } from './ui-options.js';
import { initSettings, getSetting, onSettingChange } from './settings.js';
import { initQuestWidget } from './ui-quest-widget.js';
import { loadGame, saveGame, triggerSave } from './save-manager.js';

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
    });
  });
}

// Apply theme from settings
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

// Boot
function init() {
  const registry = new DragonRegistry();

  // Settings first — everything else may depend on them
  initSettings();
  applyTheme(getSetting('theme'));
  onSettingChange('theme', applyTheme);

  // Load saved game state (restores dragons, stables, quests, stats, ID counters)
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
  initQuestWidget();

  // Wire auto-save: save whenever stables change (covers add/remove/release-all)
  // Quest completion and refresh already call triggerSave() directly
  onStablesChange(() => triggerSave());

  // Initial save to persist the registry reference
  saveGame(registry);
}

document.addEventListener('DOMContentLoaded', init);
