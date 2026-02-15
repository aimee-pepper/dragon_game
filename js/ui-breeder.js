// Breed tab: parent selection + breeding + offspring display
import { Dragon } from './dragon.js';
import { renderDragonCard, renderPickerItem } from './ui-card.js';
import { addToStables, getStabledDragons } from './ui-stables.js';
import { openFamilyTree } from './ui-family-tree.js';

let dragonRegistry = null;
let parentA = null;
let parentB = null;
let parentAContainer = null;
let parentBContainer = null;
let breedBtn = null;
let clutchContainer = null;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initBreedTab(container, registry) {
  dragonRegistry = registry;

  // Parent slots
  const slotsRow = el('div', 'parent-slots');

  // Parent A slot
  const slotA = el('div', 'parent-slot');
  slotA.appendChild(el('div', 'parent-label parent-label-a', 'Parent A'));
  parentAContainer = el('div');
  renderEmptySlot(parentAContainer, 'A');
  slotA.appendChild(parentAContainer);
  slotsRow.appendChild(slotA);

  // Parent B slot
  const slotB = el('div', 'parent-slot');
  slotB.appendChild(el('div', 'parent-label parent-label-b', 'Parent B'));
  parentBContainer = el('div');
  renderEmptySlot(parentBContainer, 'B');
  slotB.appendChild(parentBContainer);
  slotsRow.appendChild(slotB);

  container.appendChild(slotsRow);

  // Breed + Clear buttons row
  const breedActions = el('div', 'btn-group');

  breedBtn = el('button', 'btn btn-breed hidden', 'Breed!');
  breedBtn.addEventListener('click', doBreed);
  breedActions.appendChild(breedBtn);

  const clearAllBtn = el('button', 'btn btn-secondary hidden', 'Clear All');
  clearAllBtn.id = 'breed-clear-all';
  clearAllBtn.addEventListener('click', () => {
    parentA = null;
    parentB = null;
    renderEmptySlot(parentAContainer, 'A');
    renderEmptySlot(parentBContainer, 'B');
    clutchContainer.innerHTML = '';
    updateBreedButton();
  });
  breedActions.appendChild(clearAllBtn);

  container.appendChild(breedActions);

  // Clutch results area
  clutchContainer = el('div', 'clutch-results');
  container.appendChild(clutchContainer);
}

function renderEmptySlot(container, which) {
  container.innerHTML = '';
  const empty = el('div', 'parent-slot-empty');
  empty.textContent = 'Tap to select';

  const btns = el('div', 'btn-group mb-sm');
  btns.style.marginTop = '8px';

  const pickBtn = el('button', 'btn btn-secondary btn-small', 'Pick');
  pickBtn.addEventListener('click', () => openPicker(which));
  btns.appendChild(pickBtn);

  const randBtn = el('button', 'btn btn-secondary btn-small', 'Random');
  randBtn.addEventListener('click', () => {
    const dragon = Dragon.createRandom();
    dragonRegistry.add(dragon);
    setParent(which, dragon);
  });
  btns.appendChild(randBtn);

  empty.appendChild(btns);
  container.appendChild(empty);
}

function setParent(which, dragon) {
  if (which === 'A') {
    parentA = dragon;
    parentAContainer.innerHTML = '';
    // Show genotype on parent cards so players can study genetics
    const card = renderDragonCard(dragon, { compact: false, showGenotype: true, onViewLineage: (d) => openFamilyTree(d, dragonRegistry) });

    // Add change/clear buttons
    const actions = el('div', 'btn-group');
    actions.style.marginTop = '6px';
    const changeBtn = el('button', 'btn btn-secondary btn-small', 'Change');
    changeBtn.addEventListener('click', () => openPicker('A'));
    actions.appendChild(changeBtn);
    const clearBtn = el('button', 'btn btn-secondary btn-small', 'Clear');
    clearBtn.addEventListener('click', () => {
      parentA = null;
      renderEmptySlot(parentAContainer, 'A');
      updateBreedButton();
    });
    actions.appendChild(clearBtn);
    card.appendChild(actions);

    parentAContainer.appendChild(card);
  } else {
    parentB = dragon;
    parentBContainer.innerHTML = '';
    const card = renderDragonCard(dragon, { compact: false, showGenotype: true, onViewLineage: (d) => openFamilyTree(d, dragonRegistry) });

    const actions = el('div', 'btn-group');
    actions.style.marginTop = '6px';
    const changeBtn = el('button', 'btn btn-secondary btn-small', 'Change');
    changeBtn.addEventListener('click', () => openPicker('B'));
    actions.appendChild(changeBtn);
    const clearBtn = el('button', 'btn btn-secondary btn-small', 'Clear');
    clearBtn.addEventListener('click', () => {
      parentB = null;
      renderEmptySlot(parentBContainer, 'B');
      updateBreedButton();
    });
    actions.appendChild(clearBtn);
    card.appendChild(actions);

    parentBContainer.appendChild(card);
  }
  updateBreedButton();
}

function updateBreedButton() {
  const clearAllBtn = document.getElementById('breed-clear-all');
  if (parentA && parentB) {
    breedBtn.classList.remove('hidden');
  } else {
    breedBtn.classList.add('hidden');
  }
  // Show clear all if either parent is set or there are offspring
  if (parentA || parentB || clutchContainer.children.length > 0) {
    clearAllBtn?.classList.remove('hidden');
  } else {
    clearAllBtn?.classList.add('hidden');
  }
}

function doBreed() {
  if (!parentA || !parentB) return;

  const offspring = Dragon.breed(parentA, parentB);

  // Build parent name map for offspring color-coding
  const parentNames = {
    A: parentA.name,
    B: parentB.name,
  };

  clutchContainer.innerHTML = '';

  const header = el('div', 'clutch-header', `Clutch: ${offspring.length} offspring`);
  clutchContainer.appendChild(header);

  for (const child of offspring) {
    dragonRegistry.add(child);

    const card = renderDragonCard(child, {
      onUseAsParentA: (d) => setParent('A', d),
      onUseAsParentB: (d) => setParent('B', d),
      onSaveToStables: (d) => addToStables(d),
      onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
      parentNames,
    });

    // Show mutation count if any
    if (child.mutations.length > 0) {
      const mutNote = el('div', '');
      mutNote.style.cssText = 'font-size:12px;color:var(--mutation);text-align:center;margin-bottom:8px;';
      mutNote.textContent = `${child.mutations.length} mutation${child.mutations.length > 1 ? 's' : ''}!`;
      clutchContainer.appendChild(mutNote);
    }

    clutchContainer.appendChild(card);
  }
}

function openPicker(which) {
  const dragons = dragonRegistry.getAll();

  if (dragons.length === 0) {
    // No dragons available, generate a random one instead
    const dragon = Dragon.createRandom();
    dragonRegistry.add(dragon);
    setParent(which, dragon);
    return;
  }

  // Create picker overlay
  const overlay = el('div', 'picker-overlay');
  const panel = el('div', 'picker-panel');

  panel.appendChild(el('div', 'picker-title', `Select Parent ${which}`));

  // Partition into stabled vs others
  const stabledSet = new Set(getStabledDragons().map(d => d.id));
  const stabled = dragons.filter(d => stabledSet.has(d.id));
  const others = dragons.filter(d => !stabledSet.has(d.id));

  // Stables section first
  if (stabled.length > 0) {
    panel.appendChild(el('div', 'picker-section-header', '★ Stables'));
    for (const dragon of stabled) {
      const item = renderPickerItem(dragon, (selected) => {
        setParent(which, selected);
        overlay.remove();
      });
      panel.appendChild(item);
    }
  }

  // All other dragons
  if (others.length > 0) {
    if (stabled.length > 0) {
      panel.appendChild(el('div', 'picker-section-header', 'All Dragons'));
    }
    for (const dragon of others) {
      const item = renderPickerItem(dragon, (selected) => {
        setParent(which, selected);
        overlay.remove();
      });
      panel.appendChild(item);
    }
  }

  // Close button
  const closeRow = el('div', 'picker-close');
  const closeBtn = el('button', 'btn btn-secondary', 'Cancel');
  closeBtn.addEventListener('click', () => overlay.remove());
  closeRow.appendChild(closeBtn);
  panel.appendChild(closeRow);

  overlay.appendChild(panel);

  // Close on backdrop tap
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

// Allow external code to set parents (used by generator tab's "use as parent" feature)
export function setParentExternal(which, dragon) {
  setParent(which, dragon);
}
