// Dev Tools — main entry point
// Manages tool tabs and initializes individual tool modules

import { initLayerVisualizer } from './tool-layer-viz.js';

// ── Tab switching ──
// Only handles panels that live inside this page.
// Standalone tools (Sprite Placement, Spine Placement) open in new windows.
function initTabs() {
  const buttons = document.querySelectorAll('.tool-tab[data-tool]');
  const panels = document.querySelectorAll('.tool-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`tool-${btn.dataset.tool}`);
      if (panel) panel.classList.add('active');
    });
  });
}

// ── Theme toggle ──
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    btn.textContent = isLight ? '☾ Dark' : '☀ Light';
  });
}

// ── External tool openers ──
// These open standalone pages in new windows without disrupting the current page.
function initExternalLinks() {
  const openers = {
    'open-sprite-placement': 'sprite-placement.html',
    'open-spine-placement':  'spine-placement.html',
  };
  for (const [id, url] of Object.entries(openers)) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => window.open(url, '_blank'));
    }
  }
}

// ── Boot ──
function init() {
  initTabs();
  initThemeToggle();
  initExternalLinks();
  initLayerVisualizer(document.getElementById('tool-layers'));
}

document.addEventListener('DOMContentLoaded', init);
