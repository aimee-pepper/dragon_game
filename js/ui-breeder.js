// Breed tab: parent selection + breeding + egg/clutch display
import { Dragon } from './dragon.js';
import { renderDragonCard, renderPickerItem, renderGenotypeSection } from './ui-card.js';
import { renderEgg } from './egg-renderer.js';
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragon } from './sprite-renderer.js';
import { getSetting } from './settings.js';
import { addToStables, getStabledDragons, isNestsFull } from './ui-stables.js';
import { openFamilyTree } from './ui-family-tree.js';
import { applyQuestHalo, onHighlightChange, getHighlightedQuest } from './quest-highlight.js';
import { getGenesForQuest, getDesiredAllelesForQuest } from './quest-gene-map.js';
import { incrementStat, triggerSave } from './save-manager.js';
import { getHatchBudget, addToEggRack, isEggRackFull, getEggRack, getEggProgress, removeFromEggRack, tickEggRack, registerEggCallbacks, getEggRackCapacity } from './egg-system.js';
import { incrementBreedCycle } from './shop-engine.js';

let dragonRegistry = null;
let parentA = null;
let parentB = null;
let parentAContainer = null;
let parentBContainer = null;
let breedBtn = null;
let clutchContainer = null;
let eggRackContainer = null;
let eggRackTimer = null;

// Track current clutch state for the egg selection UI
let currentClutch = null; // { eggs: [{dragon, status}], instantUsed, timedUsed, budget }

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initBreedTab(container, registry) {
  dragonRegistry = registry;

  // Parent slots — always side by side
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
    currentClutch = null;
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

  // ── Egg Rack Section ──
  const rackSection = el('div', 'egg-rack-section');
  const rackHeader = el('div', 'den-header');
  rackHeader.appendChild(el('span', 'den-title', '🥚 Egg Rack'));
  rackHeader.appendChild(el('span', 'den-subtitle', 'Eggs incubating'));
  rackSection.appendChild(rackHeader);

  eggRackContainer = el('div', 'egg-rack-slots');
  rackSection.appendChild(eggRackContainer);
  container.appendChild(rackSection);

  // Register egg callbacks: when eggs hatch or rack changes, refresh
  registerEggCallbacks(
    (dragon) => {
      showRackHatchedDragon(dragon);
      triggerSave();
    },
    () => refreshEggRack()
  );

  // Start egg rack tick timer (checks every second)
  if (eggRackTimer) clearInterval(eggRackTimer);
  eggRackTimer = setInterval(() => {
    const hatched = tickEggRack();
    for (const dragon of hatched) {
      showRackHatchedDragon(dragon);
    }
    if (hatched.length > 0) triggerSave();
    refreshEggRack();
  }, 1000);

  refreshEggRack();

  // When highlighted quest changes, refresh halos on hatched cards
  onHighlightChange(() => refreshClutchHalos());
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

function renderParentSummary(container, which, dragon) {
  container.innerHTML = '';
  const p = dragon.phenotype;
  const wrapper = el('div', 'parent-summary');

  // Compact sprite — show legacy immediately, swap in PNG asynchronously
  const sprite = renderDragonSprite(p, true);
  sprite.classList.add('parent-sprite');
  wrapper.appendChild(sprite);

  // Async PNG sprite swap (unless pixel art mode is preferred)
  if (getSetting('art-style') !== 'pixel') {
    renderDragon(p, { compact: true, fallbackToTest: false }).then(canvas => {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasPixels = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) { hasPixels = true; break; }
      }
      if (hasPixels) {
        canvas.className = 'parent-sprite-canvas';
        sprite.replaceWith(canvas);
      }
    });
  }

  // Name + color label
  const colorLabel = p.color.specialtyName ||
    (p.color.modifierPrefix ? `${p.color.modifierPrefix} ${p.color.displayName}` : p.color.displayName);

  const nameEl = el('div', 'parent-summary-name', dragon.name);
  wrapper.appendChild(nameEl);
  const colorEl = el('div', 'parent-summary-color', colorLabel);
  wrapper.appendChild(colorEl);

  // Genotype toggle caret button
  const caretBtn = el('button', 'parent-caret-btn', '▸ Genotype');
  let expanded = false;
  const detailContainer = el('div', 'parent-detail-container');

  caretBtn.addEventListener('click', () => {
    expanded = !expanded;
    if (expanded) {
      caretBtn.textContent = '▾ Genotype';
      detailContainer.classList.add('open');
      // Render genotype section (no card chrome or sprite)
      if (!detailContainer.hasChildNodes()) {
        const q = getHighlightedQuest();
        const hGenes = q ? getGenesForQuest(q) : null;
        const dAlleles = q ? getDesiredAllelesForQuest(q) : null;
        const genoSection = renderGenotypeSection(dragon, null, hGenes, dAlleles);
        // Auto-open the genotype content so user doesn't have to toggle twice
        const innerContent = genoSection.querySelector('.genotype-content');
        if (innerContent) innerContent.classList.add('open');
        const innerBtn = genoSection.querySelector('.genotype-toggle-btn');
        if (innerBtn) innerBtn.style.display = 'none';
        detailContainer.appendChild(genoSection);
      }
    } else {
      caretBtn.textContent = '▸ Genotype';
      detailContainer.classList.remove('open');
    }
  });
  wrapper.appendChild(caretBtn);

  // Action buttons: change + clear
  const actions = el('div', 'btn-group parent-summary-actions');
  const changeBtn = el('button', 'btn btn-secondary btn-small', 'Change');
  changeBtn.addEventListener('click', () => openPicker(which));
  actions.appendChild(changeBtn);
  const clearBtn = el('button', 'btn btn-secondary btn-small', 'Clear');
  clearBtn.addEventListener('click', () => {
    if (which === 'A') {
      parentA = null;
      renderEmptySlot(parentAContainer, 'A');
    } else {
      parentB = null;
      renderEmptySlot(parentBContainer, 'B');
    }
    updateBreedButton();
  });
  actions.appendChild(clearBtn);
  wrapper.appendChild(actions);

  container.appendChild(wrapper);

  // Detail container goes after the wrapper (full width within the slot)
  container.appendChild(detailContainer);
}

function setParent(which, dragon) {
  if (which === 'A') {
    parentA = dragon;
    renderParentSummary(parentAContainer, 'A', dragon);
  } else {
    parentB = dragon;
    renderParentSummary(parentBContainer, 'B', dragon);
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

// ══════════════════════════════════════════════════════
// BREED + EGG CLUTCH SYSTEM
// ══════════════════════════════════════════════════════

function doBreed() {
  if (!parentA || !parentB) return;

  const offspring = Dragon.breed(parentA, parentB);
  for (const child of offspring) {
    incrementStat('totalBred');
    if (child.mutations && child.mutations.length > 0) {
      incrementStat('totalMutants');
    }
  }

  // Track breed cycle for shop refresh
  incrementBreedCycle();

  // Register all offspring in the dragon registry
  for (const child of offspring) {
    dragonRegistry.add(child);
  }

  const unlimitedHatch = getSetting('debug-unlimited-hatch');

  // Build clutch state
  const budget = getHatchBudget(offspring.length);
  currentClutch = {
    eggs: offspring.map(dragon => ({
      dragon,
      status: 'unhatched', // 'unhatched' | 'hatched' | 'racked' | 'sold' | 'discarded'
    })),
    instantUsed: 0,
    timedUsed: 0,
    budget,
    unlimitedHatch,
  };

  renderClutch();
}

function renderClutch() {
  clutchContainer.innerHTML = '';
  if (!currentClutch) return;

  const { eggs, instantUsed, timedUsed, budget, unlimitedHatch } = currentClutch;
  const instantRemaining = unlimitedHatch ? Infinity : budget.instantCount - instantUsed;
  const timedRemaining = unlimitedHatch ? Infinity : budget.timedCount - timedUsed;

  // Header with budget info
  const header = el('div', 'clutch-header');
  header.textContent = `Clutch: ${eggs.length} eggs`;
  clutchContainer.appendChild(header);

  if (!unlimitedHatch) {
    const budgetInfo = el('div', 'clutch-budget');
    const instantLabel = el('span', 'budget-tag budget-instant');
    instantLabel.textContent = `Instant: ${instantRemaining} left`;
    budgetInfo.appendChild(instantLabel);

    const timedLabel = el('span', 'budget-tag budget-timed');
    timedLabel.textContent = `Timed: ${timedRemaining} left`;
    budgetInfo.appendChild(timedLabel);

    clutchContainer.appendChild(budgetInfo);
  }

  const quest = getHighlightedQuest();
  const highlightGenes = quest ? getGenesForQuest(quest) : null;
  const desiredAlleles = quest ? getDesiredAllelesForQuest(quest) : null;
  const parentNames = { A: parentA?.name, B: parentB?.name };

  // Pass 1: Hatched dragon cards (displayed as rows above eggs)
  for (let i = 0; i < eggs.length; i++) {
    if (eggs[i].status === 'hatched') {
      renderHatchedEgg(eggs[i], i, parentNames, highlightGenes, desiredAlleles);
    }
  }

  // Pass 2: Remaining unhatched eggs (racked/discarded disappear from clutch view)
  for (let i = 0; i < eggs.length; i++) {
    const egg = eggs[i];
    if (egg.status !== 'unhatched') continue;
    renderUnhatchedEgg(egg, i, instantRemaining, timedRemaining);
  }
}

/**
 * Create a placeholder container and async-render the egg canvas into it.
 * @param {object} egg - Egg object with egg.dragon
 * @param {boolean} compact - If true, render egg only (no nest)
 * @param {number} displaySize - CSS pixel size for the canvas
 * @returns {HTMLElement} - Container that will be filled with canvas when loaded
 */
function buildEggArt(egg, compact = false, displaySize = 72) {
  const container = el('div', compact ? 'egg-art-wrap egg-art-compact' : 'egg-art-wrap');
  const colorHex = egg.dragon.phenotype.color.hex || '#888888';
  const hasMutation = egg.dragon.mutations && egg.dragon.mutations.length > 0;

  renderEgg(colorHex, hasMutation, compact, displaySize).then(canvas => {
    container.appendChild(canvas);
  }).catch(() => {
    // Fallback — plain colored div if canvas fails
    const fb = el('div', 'egg-art-fallback');
    fb.style.backgroundColor = colorHex;
    container.appendChild(fb);
  });

  return container;
}

function buildEggTraitHints(egg) {
  const traits = el('div', 'egg-traits');

  const hints = [
    { label: 'Color', value: '???' },
    { label: 'Element', value: '???' },
    { label: 'Body', value: '???' },
  ];

  for (const hint of hints) {
    const row = el('div', 'egg-trait-row');
    row.appendChild(el('span', 'egg-trait-label', hint.label + ':'));
    row.appendChild(el('span', 'egg-trait-value', hint.value));
    traits.appendChild(row);
  }

  // Mutation indicator (always visible if present)
  if (egg.dragon.mutations.length > 0) {
    const mutRow = el('div', 'egg-trait-row egg-trait-mut');
    const mutHint = el('span', 'egg-mut-hint', '✦ Mutated');
    mutHint.title = 'This egg carries mutations';
    mutRow.appendChild(mutHint);
    traits.appendChild(mutRow);
  }

  return traits;
}

function renderUnhatchedEgg(egg, index, instantRemaining, timedRemaining) {
  const card = el('div', 'egg-card');

  // Canvas egg-in-nest visual
  const eggVisual = el('div', 'egg-visual');
  eggVisual.appendChild(buildEggArt(egg, false, 72));

  const eggInfo = el('div', 'egg-info');
  eggInfo.appendChild(el('div', 'egg-label', `Egg ${index + 1}`));
  eggInfo.appendChild(buildEggTraitHints(egg));
  eggVisual.appendChild(eggInfo);

  card.appendChild(eggVisual);

  // Action buttons
  const actions = el('div', 'egg-actions');

  // Instant hatch button
  if (instantRemaining > 0 || currentClutch.unlimitedHatch) {
    const hatchBtn = el('button', 'btn btn-breed btn-small', 'Hatch');
    hatchBtn.addEventListener('click', () => {
      egg.status = 'hatched';
      currentClutch.instantUsed++;
      renderClutch();
    });
    actions.appendChild(hatchBtn);
  }

  // Send to egg rack button
  if ((timedRemaining > 0 || currentClutch.unlimitedHatch) && !isEggRackFull()) {
    const rackBtn = el('button', 'btn btn-secondary btn-small', 'To Rack');
    rackBtn.title = 'Send to egg rack for timed hatching';
    rackBtn.addEventListener('click', () => {
      const added = addToEggRack(egg.dragon);
      if (added) {
        egg.status = 'racked';
        currentClutch.timedUsed++;
        renderClutch();
      }
    });
    actions.appendChild(rackBtn);
  }

  // Discard button
  const discardBtn = el('button', 'btn btn-secondary btn-small', 'Discard');
  discardBtn.style.opacity = '0.6';
  discardBtn.addEventListener('click', () => {
    egg.status = 'discarded';
    renderClutch();
  });
  actions.appendChild(discardBtn);

  card.appendChild(actions);
  clutchContainer.appendChild(card);
}

function renderHatchedEgg(egg, index, parentNames, highlightGenes, desiredAlleles) {
  const child = egg.dragon;

  // Show mutation count if any
  if (child.mutations.length > 0) {
    const mutNote = el('div', 'mutation-note');
    mutNote.style.cssText = 'font-size:12px;color:var(--mutation);text-align:center;margin-bottom:8px;';
    mutNote.textContent = `${child.mutations.length} mutation${child.mutations.length > 1 ? 's' : ''}!`;
    clutchContainer.appendChild(mutNote);
  }

  const card = renderDragonCard(child, {
    onUseAsParentA: (d) => setParent('A', d),
    onUseAsParentB: (d) => setParent('B', d),
    onSaveToStables: (d) => addToStables(d),
    onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
    parentNames,
    highlightGenes,
    desiredAlleles,
  });
  card.dataset.dragonId = child.id;
  applyQuestHalo(card, child);
  clutchContainer.appendChild(card);
}

function refreshClutchHalos() {
  if (!clutchContainer) return;
  const cards = clutchContainer.querySelectorAll('.dragon-card[data-dragon-id]');
  for (const card of cards) {
    const dragon = dragonRegistry.get(Number(card.dataset.dragonId));
    if (dragon) applyQuestHalo(card, dragon);
  }
}

// ── Rack-hatched dragon → shows on breed page (not stables) ──

function showRackHatchedDragon(dragon) {
  if (!clutchContainer) return;
  dragonRegistry.add(dragon);

  const quest = getHighlightedQuest();
  const highlightGenes = quest ? getGenesForQuest(quest) : null;
  const desiredAlleles = quest ? getDesiredAllelesForQuest(quest) : null;

  const card = renderDragonCard(dragon, {
    onUseAsParentA: (d) => setParent('A', d),
    onUseAsParentB: (d) => setParent('B', d),
    onSaveToStables: (d) => addToStables(d),
    onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
    highlightGenes,
    desiredAlleles,
  });
  card.dataset.dragonId = dragon.id;
  applyQuestHalo(card, dragon);
  clutchContainer.appendChild(card);
}

// ── Egg Rack display ──

function refreshEggRack() {
  if (!eggRackContainer) return;
  eggRackContainer.innerHTML = '';

  const eggs = getEggRack();
  const capacity = getEggRackCapacity();

  if (eggs.length === 0) {
    const empty = el('div', 'egg-rack-empty');
    empty.textContent = `Empty (${capacity} slot${capacity > 1 ? 's' : ''})`;
    eggRackContainer.appendChild(empty);
    return;
  }

  for (const egg of eggs) {
    const progress = getEggProgress(egg);
    const slot = el('div', 'egg-rack-slot');

    // Egg art (larger for card layout, canvas-rendered)
    const eggArt = el('div', 'egg-art-wrap');
    const dragonColor = egg.dragon.phenotype.color.hex || '#888';
    const hasMut = egg.dragon.mutations && egg.dragon.mutations.length > 0;
    eggArt.classList.add(progress.isReady ? 'egg-rack-glow-ready' : 'egg-rack-glow');
    eggArt.style.setProperty('--egg-glow-color', dragonColor);
    renderEgg(dragonColor, hasMut, true, 56).then(canvas => {
      eggArt.appendChild(canvas);
    });
    slot.appendChild(eggArt);

    // Name
    slot.appendChild(el('span', 'egg-rack-name', egg.dragon.name));

    if (progress.isReady) {
      // Ready — show "Ready!" and hatch button
      const readyLabel = el('div', 'egg-rack-timer egg-rack-timer-ready');
      readyLabel.textContent = 'Ready!';
      slot.appendChild(readyLabel);

      const hatchBtn = el('button', 'btn btn-breed btn-small', 'Hatch!');
      hatchBtn.addEventListener('click', () => {
        const removed = removeFromEggRack(egg.id);
        if (removed) {
          if (dragonRegistry) dragonRegistry.add(removed.dragon);
          addToStables(removed.dragon, true);
          triggerSave();
          refreshEggRack();
        }
      });
      slot.appendChild(hatchBtn);
    } else {
      // Countdown timer (prominent)
      const secs = Math.ceil(progress.remaining / 1000);
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      const padSecs = String(remSecs).padStart(2, '0');
      const timeStr = `${mins}:${padSecs}`;
      const timer = el('div', 'egg-rack-timer');
      timer.textContent = timeStr;
      slot.appendChild(timer);

      // Progress bar + label
      const barWrap = el('div', 'egg-rack-bar-wrap');
      const bar = el('div', 'egg-rack-bar');
      const fill = el('div', 'egg-rack-bar-fill');
      fill.style.width = `${progress.percent}%`;
      bar.appendChild(fill);
      barWrap.appendChild(bar);
      barWrap.appendChild(el('span', 'egg-rack-time-label', 'Incubating…'));
      slot.appendChild(barWrap);
    }

    eggRackContainer.appendChild(slot);
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

// ── Persistence helpers ──

export function getParentAId() {
  return parentA?.id ?? null;
}

export function getParentBId() {
  return parentB?.id ?? null;
}

/**
 * Restore breed parents from saved dragon objects.
 * Call after initBreedTab() so containers exist.
 */
export function restoreBreedParents(dragonA, dragonB) {
  if (dragonA) setParent('A', dragonA);
  if (dragonB) setParent('B', dragonB);
}
