// Stables tab: persistent dragon storage with Den (favorites) + Nests (breeding pool)
import { renderDragonCard } from './ui-card.js';
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragon } from './sprite-renderer.js';
import { openFamilyTree } from './ui-family-tree.js';
import { applyQuestHalo, onHighlightChange, getHighlightedQuest } from './quest-highlight.js';
import { getGenesForQuest, getDesiredAllelesForQuest } from './quest-gene-map.js';
import { incrementStat, triggerSave } from './save-manager.js';
import { getSetting } from './settings.js';

let dragonRegistry = null;
let stablesList = null;
let denContainer = null;
let countLabel = null;

// The stabled dragon IDs — kept separate from the generate arena
const stabledDragons = new Map();

// ── Den system ──
const denDragons = new Map(); // id → dragon
let denSlotCount = 3;         // starts at 3, expandable

// Listeners notified whenever stables contents change
const stablesChangeListeners = [];

export function onStablesChange(cb) {
  stablesChangeListeners.push(cb);
}

function notifyStablesChange() {
  for (const cb of stablesChangeListeners) cb();
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initStablesTab(container, registry) {
  dragonRegistry = registry;

  // ── Den Section ──
  const denSection = el('div', 'den-section');
  const denHeader = el('div', 'den-header');
  denHeader.appendChild(el('span', 'den-title', '♥ Den'));
  denHeader.appendChild(el('span', 'den-subtitle', 'Your favorite dragons'));
  denSection.appendChild(denHeader);

  denContainer = el('div', 'den-slots');
  denSection.appendChild(denContainer);

  container.appendChild(denSection);

  // ── Nests Section ──
  const nestsSection = el('div', 'nests-section');
  const header = el('div', 'stables-header');
  header.appendChild(el('span', 'nests-section-label', 'Nests'));
  countLabel = el('span', 'stables-count', '0 dragons');
  header.appendChild(countLabel);

  const clearBtn = el('button', 'btn btn-secondary btn-small', 'Release All');
  clearBtn.addEventListener('click', () => {
    stabledDragons.clear();
    refreshStablesList();
    notifyStablesChange();
  });
  header.appendChild(clearBtn);

  nestsSection.appendChild(header);

  // Empty state / dragon list
  stablesList = el('div', 'dragon-list stables-list');
  nestsSection.appendChild(stablesList);

  container.appendChild(nestsSection);

  refreshDen();
  refreshStablesList();

  // When highlighted quest changes, re-render stables list for halos
  onHighlightChange(() => {
    refreshStablesList();
    refreshDen();
  });
}

// ── Den functions ──

export function addToDen(dragon) {
  if (denDragons.size >= denSlotCount) return false;
  if (denDragons.has(dragon.id)) return false;
  denDragons.set(dragon.id, dragon);
  triggerSave();
  refreshDen();
  notifyStablesChange();
  return true;
}

export function removeFromDen(dragonId) {
  denDragons.delete(dragonId);
  triggerSave();
  refreshDen();
  notifyStablesChange();
}

export function isDenned(dragonId) {
  return denDragons.has(dragonId);
}

export function getDenDragons() {
  return Array.from(denDragons.values());
}

export function getDenDragonIds() {
  return Array.from(denDragons.keys());
}

export function getDenSlotCount() {
  return denSlotCount;
}

export function restoreDen(dragons, slotCount) {
  denDragons.clear();
  if (slotCount && slotCount >= 3) denSlotCount = slotCount;
  for (const dragon of dragons) {
    denDragons.set(dragon.id, dragon);
  }
  refreshDen();
}

function refreshDen() {
  if (!denContainer) return;
  denContainer.innerHTML = '';

  const dragons = Array.from(denDragons.values());

  for (let i = 0; i < denSlotCount; i++) {
    const slot = el('div', 'den-slot');
    const dragon = dragons[i];

    if (dragon) {
      slot.classList.add('den-slot-filled');

      // Compact sprite
      const sprite = renderDragonSprite(dragon.phenotype, true);
      sprite.classList.add('den-sprite');
      slot.appendChild(sprite);

      // Async PNG sprite swap (skip if user prefers pixel art)
      if (getSetting('art-style') !== 'pixel') {
        renderDragon(dragon.phenotype, { compact: true, fallbackToTest: false }).then(canvas => {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let hasPixels = false;
          for (let j = 3; j < imageData.data.length; j += 4) {
            if (imageData.data[j] > 0) { hasPixels = true; break; }
          }
          if (hasPixels) {
            canvas.className = 'den-sprite-canvas';
            sprite.replaceWith(canvas);
          }
        });
      }

      const name = el('div', 'den-slot-name', dragon.name);
      slot.appendChild(name);

      // Remove button
      const removeBtn = el('button', 'den-remove-btn', '×');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromDen(dragon.id);
      });
      slot.appendChild(removeBtn);

      // Click to open detail
      slot.addEventListener('click', () => {
        openFamilyTree(dragon, dragonRegistry);
      });

      // Apply quest halo
      const quest = getHighlightedQuest();
      if (quest) {
        // Simple check: apply border tint if this is a quest match
        const { checkDragonMeetsQuest } = getQuestCheckImport();
        // We'll skip deep quest matching here; halo is on nests cards
      }
    } else {
      // Empty slot
      slot.classList.add('den-slot-empty');
      const plus = el('div', 'den-slot-plus', '+');
      slot.appendChild(plus);
    }

    denContainer.appendChild(slot);
  }
}

// Lazy import to avoid circular dependency
function getQuestCheckImport() {
  return {};
}

// ── Nests (stables) functions ──

// Add a dragon to the stables
export function addToStables(dragon) {
  stabledDragons.set(dragon.id, dragon);
  incrementStat('totalStabled');
  triggerSave();
  refreshStablesList();
  notifyStablesChange();
}

// Remove a dragon from the stables
export function removeFromStables(dragonId) {
  stabledDragons.delete(dragonId);
  incrementStat('totalReleased');
  triggerSave();
  refreshStablesList();
  notifyStablesChange();
}

// Check if a dragon is stabled
export function isStabled(dragonId) {
  return stabledDragons.has(dragonId);
}

// Get all stabled dragons
export function getStabledDragons() {
  return Array.from(stabledDragons.values());
}

// Bulk-restore stabled dragons from save data (no per-dragon notifications)
export function restoreStabledDragons(dragons) {
  stabledDragons.clear();
  for (const dragon of dragons) {
    stabledDragons.set(dragon.id, dragon);
  }
  // Single refresh after bulk load
  refreshStablesList();
  notifyStablesChange();
}

function refreshStablesList() {
  if (!stablesList) return;
  stablesList.innerHTML = '';

  const dragons = Array.from(stabledDragons.values());

  if (countLabel) {
    countLabel.textContent = `${dragons.length} dragon${dragons.length !== 1 ? 's' : ''}`;
  }

  if (dragons.length === 0) {
    const empty = el('div', 'stables-empty');
    empty.textContent = 'No dragons in the nests yet. Save dragons from the Capture or Breed tabs!';
    stablesList.appendChild(empty);
    return;
  }

  const quest = getHighlightedQuest();
  const highlightGenes = quest ? getGenesForQuest(quest) : null;
  const desiredAlleles = quest ? getDesiredAllelesForQuest(quest) : null;

  for (const dragon of dragons) {
    const card = renderDragonCard(dragon, {
      showGenotype: true,
      onUseAsParentA: null,
      onUseAsParentB: null,
      onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
      highlightGenes,
      desiredAlleles,
    });
    card.dataset.dragonId = dragon.id;
    applyQuestHalo(card, dragon);

    // Action buttons: Release + Den
    const actions = el('div', 'btn-group');
    actions.style.marginTop = '6px';

    // Den button (if not already denned and slots available)
    if (!denDragons.has(dragon.id)) {
      const denBtn = el('button', 'btn btn-den btn-small', '♥ Den');
      if (denDragons.size >= denSlotCount) {
        denBtn.disabled = true;
        denBtn.title = 'Den is full';
        denBtn.classList.add('btn-disabled');
      }
      denBtn.addEventListener('click', () => {
        const added = addToDen(dragon);
        if (added) {
          denBtn.textContent = '✓ Denned';
          denBtn.disabled = true;
          denBtn.classList.add('btn-denned');
        }
      });
      actions.appendChild(denBtn);
    } else {
      const dennedBtn = el('button', 'btn btn-den btn-small btn-denned', '✓ Denned');
      dennedBtn.disabled = true;
      actions.appendChild(dennedBtn);
    }

    const releaseBtn = el('button', 'btn btn-secondary btn-small', 'Release');
    releaseBtn.addEventListener('click', () => {
      // Also remove from den if denned
      if (denDragons.has(dragon.id)) {
        removeFromDen(dragon.id);
      }
      removeFromStables(dragon.id);
    });
    actions.appendChild(releaseBtn);

    card.appendChild(actions);
    stablesList.appendChild(card);
  }
}
