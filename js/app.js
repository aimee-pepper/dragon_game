// App initialization, tab switching, theme toggle, and shared dragon registry
import { initGenerateTab } from './ui-generator.js';
import { initBreedTab } from './ui-breeder.js';
import { initStablesTab } from './ui-stables.js';
import { initQuestsTab } from './ui-quests.js';

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

// Theme toggle — persists in localStorage
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('dragon-game-theme');

  if (saved === 'light') {
    document.body.classList.add('light-mode');
    btn.textContent = '\u263E'; // ☾
  }

  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    btn.textContent = isLight ? '\u263E' : '\u2600'; // ☾ or ☀
    localStorage.setItem('dragon-game-theme', isLight ? 'light' : 'dark');
  });
}

// Boot
function init() {
  const registry = new DragonRegistry();

  initThemeToggle();
  initTabs();
  initGenerateTab(document.getElementById('tab-generate'), registry);
  initBreedTab(document.getElementById('tab-breed'), registry);
  initStablesTab(document.getElementById('tab-stables'), registry);
  initQuestsTab(document.getElementById('tab-quests'), registry);
}

document.addEventListener('DOMContentLoaded', init);
