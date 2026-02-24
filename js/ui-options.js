// Options tab UI — settings toggles + dragon import/export
import { getSetting, setSetting } from './settings.js';
import { exportDragonPNG, importDragonPNG } from './dragon-io.js';
import { getStabledDragons, addToStables } from './ui-stables.js';
import { renderPickerItem } from './ui-card.js';
import { triggerSave } from './save-manager.js';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

let _registry = null;

export function initOptionsTab(container, registry) {
  _registry = registry;

  const wrapper = el('div', 'options-wrapper');

  wrapper.appendChild(el('h2', 'options-title', 'Settings'));

  // --- Appearance ---
  wrapper.appendChild(el('div', 'options-section-header', 'Appearance'));

  wrapper.appendChild(
    makeToggle('Theme', 'Light / Dark mode', 'theme', {
      onLabel: 'Light',
      offLabel: 'Dark',
      isOn: () => getSetting('theme') === 'light',
      toggle: (isOn) => setSetting('theme', isOn ? 'light' : 'dark'),
    })
  );

  wrapper.appendChild(
    makeToggle('Art Style', 'Switch between hand-drawn and pixel art sprites', 'art-style', {
      onLabel: 'Pixel',
      offLabel: 'Drawn',
      isOn: () => getSetting('art-style') === 'pixel',
      toggle: (isOn) => setSetting('art-style', isOn ? 'pixel' : 'drawn'),
    })
  );

  // --- Quest Features ---
  wrapper.appendChild(el('div', 'options-section-header', 'Quest Features'));

  wrapper.appendChild(
    makeBoolToggle('Quest Halos', 'Show glow on dragons that match the highlighted quest', 'quest-halos')
  );

  wrapper.appendChild(
    makeBoolToggle('Genotype Highlighting', 'Highlight quest-relevant genes in the genotype panel', 'quest-genotype-highlight')
  );

  wrapper.appendChild(
    makeBoolToggle('Pinned Quest Widget', 'Show floating quest panel on all tabs', 'pinned-quest-widget')
  );

  // --- Dragons (Import / Export) ---
  wrapper.appendChild(el('div', 'options-section-header', 'Dragons'));

  const dragonBtns = el('div', 'options-btn-row');

  const exportBtn = el('button', 'btn btn-secondary', 'Export Dragon');
  exportBtn.addEventListener('click', () => openExportPicker());
  dragonBtns.appendChild(exportBtn);

  const importBtn = el('button', 'btn btn-secondary', 'Import Dragon');
  importBtn.addEventListener('click', () => triggerImport());
  dragonBtns.appendChild(importBtn);

  // Hidden file input for import
  const fileInput = el('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => handleImportFile(e.target.files[0]));
  dragonBtns.appendChild(fileInput);

  wrapper.appendChild(dragonBtns);

  const ioDesc = el('div', 'options-toggle-desc');
  ioDesc.textContent = 'Export a dragon as a shareable PNG image. Import a dragon from a previously exported PNG.';
  ioDesc.style.marginBottom = '12px';
  wrapper.appendChild(ioDesc);

  // --- Secret Console (type "Furburt" anywhere on the options tab) ---
  const consoleLine = el('div', 'dev-console');
  const consolePrefix = el('span', 'dev-console-prefix', '> ');
  const consoleInput = el('input', 'dev-console-input');
  consoleInput.type = 'text';
  consoleInput.placeholder = 'tools';
  consoleInput.spellcheck = false;
  consoleInput.autocomplete = 'off';
  consoleLine.appendChild(consolePrefix);
  consoleLine.appendChild(consoleInput);
  wrapper.appendChild(consoleLine);

  // Hidden keystroke listener — spell "furburt" to reveal the console
  let secretBuffer = '';
  const SECRET = 'furburt';
  document.addEventListener('keydown', (e) => {
    // Only listen when the options tab is visible
    if (!container.classList.contains('active')) { secretBuffer = ''; return; }
    // Ignore if already typing in the console input
    if (e.target === consoleInput) return;
    const ch = e.key.length === 1 ? e.key.toLowerCase() : '';
    if (!ch) return;
    secretBuffer += ch;
    // Keep only the last N characters
    if (secretBuffer.length > SECRET.length) {
      secretBuffer = secretBuffer.slice(-SECRET.length);
    }
    if (secretBuffer === SECRET) {
      e.preventDefault(); // Stop the final 't' from typing into the input
      consoleLine.classList.add('revealed');
      consoleInput.focus();
      secretBuffer = '';
    }
  });

  // Console command handler
  consoleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = consoleInput.value.trim().toLowerCase();
      if (cmd === 'tools' || cmd === 'open tools' || cmd === '') {
        const url = new URL('tools2.html', window.location.href).href;
        window.open(url, '_blank');
      }
      consoleInput.value = '';
      consoleLine.classList.remove('revealed');
      consoleInput.blur();
    } else if (e.key === 'Escape') {
      consoleInput.value = '';
      consoleLine.classList.remove('revealed');
      consoleInput.blur();
    }
  });

  container.appendChild(wrapper);

  // Store references for import flow
  container._fileInput = fileInput;
}

// ─── Export Flow ─────────────────────────────────────────────

function openExportPicker() {
  const stabled = getStabledDragons();

  if (stabled.length === 0) {
    showToast('No stabled dragons to export', 'error');
    return;
  }

  // Create picker overlay (same pattern as breeder)
  const overlay = el('div', 'picker-overlay');
  const panel = el('div', 'picker-panel');

  panel.appendChild(el('div', 'picker-title', 'Export Dragon'));
  panel.appendChild(el('div', 'picker-subtitle', 'Select a dragon to export as PNG'));

  for (const dragon of stabled) {
    const item = renderPickerItem(dragon, async (selected) => {
      overlay.remove();
      try {
        await exportDragonPNG(selected, _registry);
        showToast(`Exported ${selected.name}!`, 'success');
      } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
      }
    });
    panel.appendChild(item);
  }

  // Close button
  const closeRow = el('div', 'picker-close');
  const closeBtn = el('button', 'btn btn-secondary', 'Cancel');
  closeBtn.addEventListener('click', () => overlay.remove());
  closeRow.appendChild(closeBtn);
  panel.appendChild(closeRow);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

// ─── Import Flow ─────────────────────────────────────────────

function triggerImport() {
  // Find the hidden file input
  const fileInput = document.querySelector('#tab-options input[type="file"]');
  if (fileInput) {
    fileInput.value = ''; // reset so re-selecting same file works
    fileInput.click();
  }
}

async function handleImportFile(file) {
  if (!file) return;

  try {
    const { subject, ancestors } = await importDragonPNG(file);

    // Add all ancestors to registry first (parents before children)
    if (_registry) {
      for (const ancestor of ancestors) {
        _registry.add(ancestor);
      }
      _registry.add(subject);
    }

    // Only the subject goes to stables
    addToStables(subject);
    triggerSave();

    const count = ancestors.length;
    const lineageNote = count > 0 ? ` (with ${count} ancestor${count > 1 ? 's' : ''})` : '';
    showToast(`Imported ${subject.name}!${lineageNote}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Toast Notification ──────────────────────────────────────

function showToast(message, type = 'info') {
  const toast = el('div', `io-toast io-toast-${type}`);
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('io-toast-show');
  });

  // Remove after 2.5s
  setTimeout(() => {
    toast.classList.remove('io-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ─── Toggle Helpers ──────────────────────────────────────────

// Generic boolean toggle for true/false settings
function makeBoolToggle(label, description, settingKey) {
  return makeToggle(label, description, settingKey, {
    onLabel: 'On',
    offLabel: 'Off',
    isOn: () => getSetting(settingKey) === true,
    toggle: (isOn) => setSetting(settingKey, isOn),
  });
}

// Build a toggle row with a label, description, and switch
function makeToggle(label, description, settingKey, { onLabel, offLabel, isOn, toggle }) {
  const row = el('div', 'options-toggle-row');

  const info = el('div', 'options-toggle-info');
  info.appendChild(el('div', 'options-toggle-label', label));
  info.appendChild(el('div', 'options-toggle-desc', description));
  row.appendChild(info);

  const switchWrap = el('div', 'options-switch-wrap');

  const stateLabel = el('span', 'options-switch-state');
  const updateLabel = () => {
    stateLabel.textContent = isOn() ? onLabel : offLabel;
  };
  updateLabel();

  const btn = el('button', 'options-switch');
  const knob = el('span', 'options-switch-knob');
  btn.appendChild(knob);

  const updateSwitch = () => {
    btn.classList.toggle('on', isOn());
  };
  updateSwitch();

  btn.addEventListener('click', () => {
    toggle(!isOn());
    updateSwitch();
    updateLabel();
  });

  switchWrap.appendChild(stateLabel);
  switchWrap.appendChild(btn);
  row.appendChild(switchWrap);

  return row;
}
