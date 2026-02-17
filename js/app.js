// App initialization, tab switching, settings, and shared dragon registry
import { initGenerateTab } from './ui-generator.js';
import { initBreedTab } from './ui-breeder.js';
import { initStablesTab } from './ui-stables.js';
import { initQuestsTab } from './ui-quests.js';
import { initAlmanacTab } from './ui-almanac.js';
import { initOptionsTab } from './ui-options.js';
import { initSettings, getSetting, onSettingChange } from './settings.js';
import { initQuestWidget } from './ui-quest-widget.js';

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

  initTabs();
  initGenerateTab(document.getElementById('tab-generate'), registry);
  initBreedTab(document.getElementById('tab-breed'), registry);
  initStablesTab(document.getElementById('tab-stables'), registry);
  initQuestsTab(document.getElementById('tab-quests'), registry);
  initAlmanacTab(document.getElementById('tab-almanac'));
  initOptionsTab(document.getElementById('tab-options'));
  initQuestWidget();
}

document.addEventListener('DOMContentLoaded', init);
