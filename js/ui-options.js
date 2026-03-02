// Options tab UI — settings toggles + dragon import/export + NFC claim + debug toggles
import { getSetting, setSetting } from './settings.js';
import { exportDragonPNG, importDragonPNG } from './dragon-io.js';
import { getStabledDragons, addToStables } from './ui-stables.js';
import { renderPickerItem, renderShowcaseCard } from './ui-card.js';
import { triggerSave, addToStat, getStats, listBackups, restoreFromBackup } from './save-manager.js';
import { decodeDragonParams } from './dragon-url.js';
import { Dragon } from './dragon.js';

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

  // --- Save Backups ---
  wrapper.appendChild(el('div', 'options-section-header', 'Save Backups'));

  const backupDesc = el('div', 'options-toggle-desc');
  backupDesc.textContent = 'The game keeps rolling backups of your save data. If something goes wrong, you can restore from a previous save.';
  backupDesc.style.marginBottom = '8px';
  wrapper.appendChild(backupDesc);

  const backupContainer = el('div', 'backup-list');
  wrapper.appendChild(backupContainer);

  const refreshBackupList = () => {
    backupContainer.innerHTML = '';
    const backups = listBackups();
    if (backups.length === 0) {
      const empty = el('div', 'options-toggle-desc');
      empty.textContent = 'No backups available yet. Backups are created automatically as you play.';
      empty.style.fontStyle = 'italic';
      backupContainer.appendChild(empty);
      return;
    }
    for (const backup of backups) {
      const row = el('div', 'backup-row');

      const info = el('div', 'backup-info');
      const age = formatTimeAgo(backup.savedAt);
      info.appendChild(el('div', 'backup-label', `Backup #${backup.slot}`));
      info.appendChild(el('div', 'backup-detail', `${age} — ${backup.dragonCount} dragon${backup.dragonCount !== 1 ? 's' : ''}, ${backup.questCount} quest${backup.questCount !== 1 ? 's' : ''}`));
      row.appendChild(info);

      const restoreBtn = el('button', 'btn btn-secondary btn-small', 'Restore');
      restoreBtn.addEventListener('click', () => {
        if (!confirm(`Restore from Backup #${backup.slot}? (${age}, ${backup.dragonCount} dragons)\n\nThis will replace your current save and reload the game.`)) return;
        if (!confirm('Are you sure? Your current save will be overwritten.')) return;
        try {
          restoreFromBackup(backup.slot);
        } catch (err) {
          showToast(`Restore failed: ${err.message}`, 'error');
        }
      });
      row.appendChild(restoreBtn);

      backupContainer.appendChild(row);
    }
  };

  refreshBackupList();

  // --- NFC Dragon Claim ---
  wrapper.appendChild(el('div', 'options-section-header', 'Claim Dragon'));

  const claimDesc = el('div', 'options-toggle-desc');
  claimDesc.textContent = 'Paste a dragon claim link or code from an NFC tag to add the dragon to your stables.';
  claimDesc.style.marginBottom = '8px';
  wrapper.appendChild(claimDesc);

  const claimRow = el('div', 'options-btn-row claim-row');

  const claimInput = el('input', 'claim-input');
  claimInput.type = 'text';
  claimInput.placeholder = 'Paste claim link or code...';
  claimInput.spellcheck = false;
  claimInput.autocomplete = 'off';
  claimRow.appendChild(claimInput);

  const claimBtn = el('button', 'btn btn-primary btn-small', 'Claim');
  claimBtn.addEventListener('click', () => {
    handleClaimInput(claimInput.value.trim(), registry);
    claimInput.value = '';
  });
  claimRow.appendChild(claimBtn);

  // Also allow Enter key to claim
  claimInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleClaimInput(claimInput.value.trim(), registry);
      claimInput.value = '';
    }
  });

  wrapper.appendChild(claimRow);

  // --- Debug/Testing Toggles ---
  wrapper.appendChild(el('div', 'options-section-header debug-section-header', 'Debug / Testing'));

  const debugNote = el('div', 'options-toggle-desc');
  debugNote.textContent = 'Developer tools for testing. These bypass normal game progression.';
  debugNote.style.marginBottom = '8px';
  debugNote.style.fontStyle = 'italic';
  wrapper.appendChild(debugNote);

  // Visibility toggles
  wrapper.appendChild(el('div', 'options-subsection-header', 'Visibility'));

  wrapper.appendChild(
    makeBoolToggle('Show Full Genotype', 'Bypass hidden genotype — show all alleles on all dragons', 'debug-show-genotype')
  );
  wrapper.appendChild(
    makeBoolToggle('Reveal Full Almanac', 'Show all almanac entries regardless of progression', 'debug-reveal-almanac')
  );
  wrapper.appendChild(
    makeBoolToggle('Quest Item Highlighting', 'Highlight quest-relevant traits (will become skill-based)', 'debug-quest-highlight')
  );

  // Map toggles
  wrapper.appendChild(el('div', 'options-subsection-header', 'Map / Exploration'));

  wrapper.appendChild(
    makeBoolToggle('Unlock All Zones', 'Bypass zone unlock requirements — access all regions', 'debug-unlock-all-zones')
  );
  wrapper.appendChild(
    makeBoolToggle('Debug Capture Tab', 'Show debug capture sub-tab with zone/territory/habitat selectors', 'debug-capture-tab')
  );

  // Limit bypasses
  wrapper.appendChild(el('div', 'options-subsection-header', 'Limit Bypasses'));

  wrapper.appendChild(
    makeBoolToggle('Unlimited Hatch Capacity', 'Bypass egg hatch limits — hatch all eggs instantly', 'debug-unlimited-hatch')
  );
  wrapper.appendChild(
    makeBoolToggle('Unlimited Stable Slots', 'Bypass nest and den slot limits', 'debug-unlimited-stables')
  );
  wrapper.appendChild(
    makeBoolToggle('Free Quest Reroll', 'Reroll quest trait requirements for free', 'debug-free-reroll')
  );
  wrapper.appendChild(
    makeBoolToggle('No Breeding Cooldown', 'Remove breeding cooldown (if applicable)', 'debug-no-cooldown')
  );

  // Currency/Reset tools
  wrapper.appendChild(el('div', 'options-subsection-header', 'Currency Tools'));

  const currencyBtns = el('div', 'options-btn-row debug-btn-row');

  const addGoldBtn = el('button', 'btn btn-secondary btn-small', '+100 Gold');
  addGoldBtn.addEventListener('click', () => {
    addToStat('gold', 100);
    showToast('+100 gold', 'success');
  });
  currencyBtns.appendChild(addGoldBtn);

  const addExpBtn = el('button', 'btn btn-secondary btn-small', '+100 XP');
  addExpBtn.addEventListener('click', () => {
    addToStat('exp', 100);
    showToast('+100 XP', 'success');
  });
  currencyBtns.appendChild(addExpBtn);

  const addRepBtn = el('button', 'btn btn-secondary btn-small', '+100 Rep');
  addRepBtn.addEventListener('click', () => {
    addToStat('rep', 100);
    showToast('+100 rep', 'success');
  });
  currencyBtns.appendChild(addRepBtn);

  wrapper.appendChild(currencyBtns);

  // Reset tools
  wrapper.appendChild(el('div', 'options-subsection-header', 'Resets'));

  const resetBtns = el('div', 'options-btn-row debug-btn-row');

  const resetRepBtn = el('button', 'btn btn-danger btn-small', 'Reset Rep');
  resetRepBtn.addEventListener('click', () => {
    if (!confirm('Reset reputation to 0?')) return;
    const s = getStats();
    addToStat('rep', -s.rep);
    showToast('Reputation reset', 'info');
  });
  resetBtns.appendChild(resetRepBtn);

  const resetExpBtn = el('button', 'btn btn-danger btn-small', 'Reset XP');
  resetExpBtn.addEventListener('click', () => {
    if (!confirm('Reset XP to 0?')) return;
    const s = getStats();
    addToStat('exp', -s.exp);
    showToast('XP reset', 'info');
  });
  resetBtns.appendChild(resetExpBtn);

  const resetGoldBtn = el('button', 'btn btn-danger btn-small', 'Reset Gold');
  resetGoldBtn.addEventListener('click', () => {
    if (!confirm('Reset gold to 0?')) return;
    const s = getStats();
    addToStat('gold', -s.gold);
    showToast('Gold reset', 'info');
  });
  resetBtns.appendChild(resetGoldBtn);

  wrapper.appendChild(resetBtns);

  const resetAllBtn = el('button', 'btn btn-danger', 'Reset All Progress');
  resetAllBtn.style.marginTop = '8px';
  resetAllBtn.addEventListener('click', () => {
    if (!confirm('This will reset ALL currencies, achievements, and shop unlocks. Are you sure?')) return;
    if (!confirm('This cannot be undone. Really reset everything?')) return;
    const s = getStats();
    addToStat('gold', -s.gold);
    addToStat('exp', -s.exp);
    addToStat('rep', -s.rep);
    showToast('All progress reset', 'info');
  });
  wrapper.appendChild(resetAllBtn);

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

  // ── Dragon Showcase (screenshot-friendly card) ──────────────
  wrapper.appendChild(el('div', 'options-section-header', 'Dragon Showcase'));
  wrapper.appendChild(el('div', 'options-toggle-desc', 'Select a stabled dragon to view a compact card for screenshotting.'));

  const showcaseSelect = el('select', 'showcase-picker');
  const defaultOpt = el('option', null, '— Pick a dragon —');
  defaultOpt.value = '';
  showcaseSelect.appendChild(defaultOpt);
  wrapper.appendChild(showcaseSelect);

  const showcaseContainer = el('div', 'showcase-container');
  wrapper.appendChild(showcaseContainer);

  // Populate picker from stables
  function refreshShowcasePicker() {
    // Clear all options except default
    while (showcaseSelect.options.length > 1) showcaseSelect.remove(1);
    const dragons = getStabledDragons();
    const sorted = [...dragons].sort((a, b) => a.name.localeCompare(b.name));
    for (const d of sorted) {
      const opt = el('option');
      opt.value = d.id;
      opt.textContent = `${d.name} (#${d.id})`;
      showcaseSelect.appendChild(opt);
    }
  }
  refreshShowcasePicker();

  showcaseSelect.addEventListener('change', () => {
    showcaseContainer.innerHTML = '';
    const dragonId = showcaseSelect.value;
    if (!dragonId) return;
    const dragon = registry.get(Number(dragonId));
    if (!dragon) return;
    showcaseContainer.appendChild(renderShowcaseCard(dragon));
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

    // Only the subject goes to stables (force=true: imports bypass slot limits)
    addToStables(subject, true);
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

// ─── NFC Dragon Claim ────────────────────────────────────

function handleClaimInput(raw, registry) {
  if (!raw) {
    showToast('Paste a claim link or code first', 'error');
    return;
  }

  try {
    // Accept either a full URL (?d=... ) or just the query string (d=...)
    let urlParams;
    if (raw.includes('?')) {
      // Full URL — extract query string
      const url = new URL(raw);
      urlParams = url.searchParams;
    } else if (raw.includes('d=')) {
      // Bare query string (e.g. "d=ABC&s=f")
      urlParams = new URLSearchParams(raw);
    } else {
      // Try as raw base64 genotype code (just the d= value)
      urlParams = new URLSearchParams(`d=${raw}`);
    }

    const { genotype, sex, name, isDarkEnergy } = decodeDragonParams(urlParams);

    const dragon = new Dragon({
      genotype,
      sex,
      name,
      generation: 0,
      isDarkEnergy,
    });

    registry.add(dragon);
    addToStables(dragon, true); // force=true: NFC claims bypass slot limits
    triggerSave();

    showToast(`You found ${dragon.name}! Added to your stables.`, 'success');
  } catch (e) {
    console.warn('Invalid dragon claim:', e);
    showToast('Invalid claim link or code', 'error');
  }
}

// ─── Time Formatting ─────────────────────────────────────────

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown time';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
