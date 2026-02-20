// Dev Tools — main entry point
// Manages tool tabs and initializes individual tool modules

import { initLayerVisualizer } from './tool-layer-viz.js';

// ── Tab switching ──
function initTabs() {
  const buttons = document.querySelectorAll('.tool-tab');
  const panels = document.querySelectorAll('.tool-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tool-${btn.dataset.tool}`).classList.add('active');
    });
  });
}

// ── Boot ──
function init() {
  initTabs();
  initLayerVisualizer(document.getElementById('tool-layers'));
}

document.addEventListener('DOMContentLoaded', init);
