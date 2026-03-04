// Stables tab: persistent dragon storage with Den (favorites) + Nests (breeding pool)
import { renderDragonCard } from './ui-card.js';
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragon } from './sprite-renderer.js';
import { openFamilyTree } from './ui-family-tree.js';
import { applyQuestHalo, onHighlightChange, getHighlightedQuest } from './quest-highlight.js';
import { getGenesForQuest, getDesiredAllelesForQuest } from './quest-gene-map.js';
import { incrementStat, triggerSave } from './save-manager.js';
import { getSetting } from './settings.js';
import { BASE_NEST_SLOTS, BASE_DEN_SLOTS, BASE_EGG_RACK_SLOTS } from './economy-config.js';

let dragonRegistry = null;
let stablesList = null;
let denContainer = null;
let countLabel = null;
let denExpanded = false;

// The stabled dragon IDs — kept separate from the generate arena
const stabledDragons = new Map();

// ── Nest system ──
let nestSlotCount = BASE_NEST_SLOTS; // starts at 2, expandable via milestones + purchases

// ── Den system ──
const denDragons = new Map(); // id → dragon
let denSlotCount = BASE_DEN_SLOTS;   // starts at 1, expandable via milestones + purchases

// ── Egg rack ──
let eggRackSlotCount = BASE_EGG_RACK_SLOTS; // starts at 1, expandable via Talisman Shop

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

  const denToggle = el('button', 'btn btn-secondary den-toggle', '▦');
  denToggle.title = 'Toggle expanded view';
  denToggle.addEventListener('click', () => {
    denExpanded = !denExpanded;
    denToggle.textContent = denExpanded ? '▣' : '▦';
    refreshDen();
  });
  denHeader.appendChild(denToggle);
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
  const unlimited = getSetting('debug-unlimited-stables');
  if (!unlimited && denDragons.size >= denSlotCount) return false;
  if (denDragons.has(dragon.id)) return false;
  denDragons.set(dragon.id, dragon);
  // Remove from nest slots — denned dragons don't occupy nests
  stabledDragons.delete(dragon.id);
  triggerSave();
  refreshDen();
  refreshStablesList();
  notifyStablesChange();
  return true;
}

export function removeFromDen(dragonId) {
  const dragon = denDragons.get(dragonId);
  denDragons.delete(dragonId);
  // Move back to nest slots
  if (dragon) {
    stabledDragons.set(dragon.id, dragon);
  }
  triggerSave();
  refreshDen();
  refreshStablesList();
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

export function setDenSlotCount(count) {
  denSlotCount = count;
  refreshDen();
}

export function restoreDen(dragons, slotCount) {
  denDragons.clear();
  if (slotCount && slotCount >= 1) denSlotCount = slotCount;
  for (const dragon of dragons) {
    denDragons.set(dragon.id, dragon);
    // Denned dragons don't occupy nest slots — remove from stables if present (handles old saves)
    stabledDragons.delete(dragon.id);
  }
  refreshDen();
  refreshStablesList();
}

function refreshDen() {
  if (!denContainer) return;
  denContainer.innerHTML = '';

  const dragons = Array.from(denDragons.values());
  const unlimited = getSetting('debug-unlimited-stables');
  const displaySlots = unlimited
    ? Math.max(denSlotCount, dragons.length + 1)
    : denSlotCount;

  // Toggle container class for layout mode
  denContainer.className = denExpanded ? 'den-slots den-expanded' : 'den-slots';

  if (denExpanded) {
    // ── Expanded: full dragon cards ──
    const quest = getHighlightedQuest();
    const highlightGenes = quest ? getGenesForQuest(quest) : null;
    const desiredAlleles = quest ? getDesiredAllelesForQuest(quest) : null;

    if (dragons.length === 0) {
      const empty = el('div', 'den-expanded-empty');
      empty.textContent = 'No dragons in the den yet.';
      denContainer.appendChild(empty);
      return;
    }

    for (const dragon of dragons) {
      const card = renderDragonCard(dragon, {
        showGenotype: true,
        onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
        highlightGenes,
        desiredAlleles,
        flipSprite: true,
      });
      card.dataset.dragonId = dragon.id;
      applyQuestHalo(card, dragon);

      // Un-den button
      const actions = el('div', 'btn-group');
      actions.style.marginTop = '6px';
      const undenBtn = el('button', 'btn btn-secondary btn-small', '♥ Un-Den');
      undenBtn.addEventListener('click', () => {
        removeFromDen(dragon.id);
      });
      actions.appendChild(undenBtn);
      card.appendChild(actions);

      denContainer.appendChild(card);
    }
  } else {
    // ── Compact: icon slots ──
    for (let i = 0; i < displaySlots; i++) {
      const slot = el('div', 'den-slot');
      const dragon = dragons[i];

      if (dragon) {
        slot.classList.add('den-slot-filled');

        // Compact sprite
        const sprite = renderDragonSprite(dragon.phenotype, true);
        sprite.classList.add('den-sprite', 'sprite-flip');
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
              canvas.className = 'den-sprite-canvas sprite-flip';
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
      } else {
        // Empty slot
        slot.classList.add('den-slot-empty');
        const plus = el('div', 'den-slot-plus', '+');
        slot.appendChild(plus);
      }

      denContainer.appendChild(slot);
    }
  }
}

// Lazy import to avoid circular dependency
function getQuestCheckImport() {
  return {};
}

// ── Nests (stables) functions ──

export function getNestSlotCount() {
  return nestSlotCount;
}

export function setNestSlotCount(count) {
  nestSlotCount = count;
  refreshStablesList();
}

// Check if nests are full (respects debug bypass)
export function isNestsFull() {
  if (getSetting('debug-unlimited-stables')) return false;
  return stabledDragons.size >= nestSlotCount;
}

// Add a dragon to the stables
// force = true bypasses slot limit (used for NFC claims, imports)
export function addToStables(dragon, force = false) {
  // Enforce nest slot limit (unless debug bypass or forced)
  if (!force && !getSetting('debug-unlimited-stables') && stabledDragons.size >= nestSlotCount) {
    return false;
  }
  stabledDragons.set(dragon.id, dragon);
  incrementStat('totalStabled');
  triggerSave();
  refreshStablesList();
  notifyStablesChange();
  return true;
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

// Restore nest slot count from save data
export function restoreNestSlotCount(count) {
  if (count && count >= BASE_NEST_SLOTS) nestSlotCount = count;
}

// ── Egg rack ──

export function getEggRackSlotCount() {
  return eggRackSlotCount;
}

export function setEggRackSlotCount(count) {
  eggRackSlotCount = count;
}

export function restoreEggRackSlotCount(count) {
  if (count && count >= 1) eggRackSlotCount = count;
}

function refreshStablesList() {
  if (!stablesList) return;
  stablesList.innerHTML = '';

  const dragons = Array.from(stabledDragons.values());
  const unlimited = getSetting('debug-unlimited-stables');

  if (countLabel) {
    if (unlimited) {
      countLabel.textContent = `${dragons.length} dragon${dragons.length !== 1 ? 's' : ''} (unlimited)`;
    } else {
      countLabel.textContent = `${dragons.length} / ${nestSlotCount} nest${nestSlotCount !== 1 ? 's' : ''}`;
    }
  }

  if (dragons.length === 0) {
    const empty = el('div', 'stables-empty');
    empty.textContent = 'No dragons in the nests yet. Save dragons from the Explore or Breed tabs!';
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
      flipSprite: true,
    });
    card.dataset.dragonId = dragon.id;
    applyQuestHalo(card, dragon);

    // Action buttons: Den + Release
    const actions = el('div', 'btn-group');
    actions.style.marginTop = '6px';

    // Den button — moves dragon from nest to den
    const denBtn = el('button', 'btn btn-den btn-small', '♥ Den');
    if (!unlimited && denDragons.size >= denSlotCount) {
      denBtn.disabled = true;
      denBtn.title = 'Den is full';
      denBtn.classList.add('btn-disabled');
    }
    denBtn.addEventListener('click', () => {
      addToDen(dragon);
    });
    actions.appendChild(denBtn);

    const releaseBtn = el('button', 'btn btn-secondary btn-small', 'Release');
    releaseBtn.addEventListener('click', () => {
      removeFromStables(dragon.id);
    });
    actions.appendChild(releaseBtn);

    card.appendChild(actions);
    stablesList.appendChild(card);
  }
}
