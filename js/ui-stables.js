// Stables tab: persistent dragon storage
import { renderDragonCard } from './ui-card.js';
import { openFamilyTree } from './ui-family-tree.js';
import { applyQuestHalo, onHighlightChange, getHighlightedQuest } from './quest-highlight.js';
import { getGenesForQuest, getDesiredAllelesForQuest } from './quest-gene-map.js';
import { incrementStat, triggerSave } from './save-manager.js';

let dragonRegistry = null;
let stablesList = null;
let countLabel = null;

// The stabled dragon IDs — kept separate from the generate arena
const stabledDragons = new Map();

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

  // Header row
  const header = el('div', 'stables-header');
  countLabel = el('span', 'stables-count', '0 dragons stabled');
  header.appendChild(countLabel);

  const clearBtn = el('button', 'btn btn-secondary btn-small', 'Release All');
  clearBtn.addEventListener('click', () => {
    stabledDragons.clear();
    refreshStablesList();
    notifyStablesChange();
  });
  header.appendChild(clearBtn);

  container.appendChild(header);

  // Empty state / dragon list
  stablesList = el('div', 'dragon-list stables-list');
  container.appendChild(stablesList);

  refreshStablesList();

  // When highlighted quest changes, re-render stables list for halos
  onHighlightChange(() => refreshStablesList());
}

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
    countLabel.textContent = `${dragons.length} dragon${dragons.length !== 1 ? 's' : ''} stabled`;
  }

  if (dragons.length === 0) {
    const empty = el('div', 'stables-empty');
    empty.textContent = 'No dragons stabled yet. Save dragons from the Capture or Breed tabs!';
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

    // Add release button
    const actions = el('div', 'btn-group');
    actions.style.marginTop = '6px';
    const releaseBtn = el('button', 'btn btn-secondary btn-small', 'Release');
    releaseBtn.addEventListener('click', () => {
      removeFromStables(dragon.id);
    });
    actions.appendChild(releaseBtn);
    card.appendChild(actions);

    stablesList.appendChild(card);
  }
}
