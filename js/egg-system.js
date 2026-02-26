// ============================================================
// Egg system — manages clutch hatching tiers, egg rack, timers
// ============================================================
// Breeding produces a clutch of 4+ eggs. Player chooses:
//   - 2 (base) to instant-hatch
//   - 1 to send to egg rack (timed hatch)
//   - 1 locked (requires item or sell/discard)
// Skills expand these numbers via Clutch Size and Hatch Capacity.

import {
  BASE_CLUTCH_SIZE, BASE_INSTANT_HATCH, BASE_TIMED_EGGS, BASE_LOCKED_EGGS,
  BASE_HATCH_TIME_MS, MIN_HATCH_TIME_MS, BASE_EGG_SALE_PRICE,
  BASE_EGG_RACK_SLOTS, HATCH_REDUCTION_PER_CHARM,
} from './economy-config.js';
import { getSetting } from './settings.js';
import { getEggPricingBonus, getClutchSizeBonus, getHatchCapacityBonus } from './skill-engine.js';
import { getInventory } from './shop-engine.js';

// ── Egg Rack State ───────────────────────────────────────────
// Eggs in the rack: { id, dragon, placedAt, hatchTime }
// dragon is the full Dragon object (created at breed time but not yet "hatched")

let nextEggId = 1;
const eggRack = []; // array of egg objects currently incubating

// Callbacks
let _onEggHatched = null;  // called when a timed egg hatches: (dragon) => {}
let _onRackChange = null;  // called when rack contents change

export function registerEggCallbacks(onHatched, onRackChange) {
  _onEggHatched = onHatched;
  _onRackChange = onRackChange;
}

// ── Hatching Budget ──────────────────────────────────────────
// Returns how many of each type based on current skills

export function getHatchBudget(clutchSize) {
  // Skill bonuses
  const skillClutchBonus = getClutchSizeBonus();
  const skillHatchBonus = getHatchCapacityBonus();

  // Talisman bonuses
  const inv = getInventory();
  const breedingCharmCount = inv.get('breeding-charm') || 0;
  const hatchersPendantCount = inv.get('hatchers-pendant') || 0;

  const instantCount = BASE_INSTANT_HATCH + skillHatchBonus + hatchersPendantCount;
  const timedCount = BASE_TIMED_EGGS;
  // Locked = everything remaining after instant and timed slots
  const lockedCount = Math.max(0, clutchSize - instantCount - timedCount);
  return { instantCount, timedCount, lockedCount, clutchBonus: skillClutchBonus + breedingCharmCount };
}

// ── Current Hatch Time ───────────────────────────────────────

export function getHatchDuration() {
  const inv = getInventory();
  const quickHatchCount = inv.get('quick-hatch-charm') || 0;
  const reduction = quickHatchCount * HATCH_REDUCTION_PER_CHARM;
  return Math.max(MIN_HATCH_TIME_MS, BASE_HATCH_TIME_MS - reduction);
}

// ── Egg Rack Operations ──────────────────────────────────────

export function addToEggRack(dragon) {
  const slotCount = getEggRackCapacity();
  if (!getSetting('debug-unlimited-hatch') && eggRack.length >= slotCount) {
    return false;
  }

  const egg = {
    id: nextEggId++,
    dragon,
    placedAt: Date.now(),
    hatchTime: getHatchDuration(),
  };
  eggRack.push(egg);
  if (_onRackChange) _onRackChange();
  return true;
}

export function getEggRack() {
  return [...eggRack];
}

export function getEggRackCapacity() {
  // TODO: Factor in Egg Rack Expansion purchases
  return BASE_EGG_RACK_SLOTS;
}

export function isEggRackFull() {
  if (getSetting('debug-unlimited-hatch')) return false;
  return eggRack.length >= getEggRackCapacity();
}

// Check and hatch any eggs whose timer has elapsed
export function tickEggRack() {
  const now = Date.now();
  const hatched = [];

  for (let i = eggRack.length - 1; i >= 0; i--) {
    const egg = eggRack[i];
    const elapsed = now - egg.placedAt;
    if (elapsed >= egg.hatchTime) {
      eggRack.splice(i, 1);
      hatched.push(egg.dragon);
    }
  }

  if (hatched.length > 0 && _onRackChange) _onRackChange();

  return hatched; // caller handles stabling / notification
}

// Get time remaining for display
export function getEggProgress(egg) {
  const elapsed = Date.now() - egg.placedAt;
  const remaining = Math.max(0, egg.hatchTime - elapsed);
  const percent = Math.min(100, (elapsed / egg.hatchTime) * 100);
  return { remaining, percent, isReady: remaining <= 0 };
}

// Reduce an egg's hatch time by a given amount (clamped to MIN_HATCH_TIME_MS minimum remaining)
export function reduceEggHatchTime(eggId, reductionMs) {
  const egg = eggRack.find(e => e.id === eggId);
  if (!egg) return;
  egg.hatchTime = Math.max(MIN_HATCH_TIME_MS, egg.hatchTime - reductionMs);
  if (_onRackChange) _onRackChange();
}

// Get an egg from the rack by ID (for targeting)
export function getEggById(eggId) {
  return eggRack.find(e => e.id === eggId) || null;
}

// Remove an egg from the rack (e.g. hatched via button or discarded)
export function removeFromEggRack(eggId) {
  const idx = eggRack.findIndex(e => e.id === eggId);
  if (idx === -1) return null;
  const [removed] = eggRack.splice(idx, 1);
  if (_onRackChange) _onRackChange();
  return removed;
}

// ── Egg Sale ─────────────────────────────────────────────────

export function getEggSalePrice() {
  return BASE_EGG_SALE_PRICE + getEggPricingBonus();
}

// ── Save / Load ──────────────────────────────────────────────

export function getEggRackSaveData() {
  return eggRack.map(egg => ({
    id: egg.id,
    dragonSaveData: egg.dragon.toSaveData(),
    placedAt: egg.placedAt,
    hatchTime: egg.hatchTime,
  }));
}

export function restoreEggRack(savedEggs, dragonFromSaveData) {
  eggRack.length = 0;
  if (!savedEggs || !Array.isArray(savedEggs)) return;

  for (const saved of savedEggs) {
    try {
      const dragon = dragonFromSaveData(saved.dragonSaveData);
      eggRack.push({
        id: saved.id,
        dragon,
        placedAt: saved.placedAt,
        hatchTime: saved.hatchTime,
      });
      if (saved.id >= nextEggId) nextEggId = saved.id + 1;
    } catch (e) {
      console.warn('Failed to restore egg:', e);
    }
  }
}

export function getNextEggId() {
  return nextEggId;
}

export function setNextEggId(id) {
  nextEggId = id;
}
