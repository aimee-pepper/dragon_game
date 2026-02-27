// ============================================================
// Shop engine — manages shop state, rep gates, inventory, purchases
// ============================================================
// Three shops: Potion (consumables), Talisman (permanents), Arcana (tomes)
// Each has rep-gated unlock + internal tiers alternating items/discounts.
// Shops refresh every Nth breeding cycle.

import {
  SHOP_UNLOCK_REP, SHOP_TIER_OFFSETS, SHOP_DISCOUNTS,
  SHOP_REFRESH_INTERVAL,
  CARPENTER_PRICES, POTION_PRICES, TALISMAN_PRICES, TOME_PRICES,
  NEST_EXPANSION_COSTS, DEN_EXPANSION_COSTS, EGG_RACK_EXPANSION_COSTS,
  MILESTONE_NEST_SLOTS, MILESTONE_DEN_SLOTS,
} from './economy-config.js';
import { getStats, addToStat } from './save-manager.js';
import { getNestSlotCount, setNestSlotCount, getDenSlotCount, setDenSlotCount, getEggRackSlotCount, setEggRackSlotCount } from './ui-stables.js';
import { isUnlocked as isAchievementUnlocked } from './achievements.js';

// ── Shop state ───────────────────────────────────────────────

let breedCycleCount = 0; // incremented each breeding
let purchasedTomes = new Set();    // set of tome IDs already bought (one-time purchases)
let purchasedItems = new Map();    // itemId → count of permanent items bought

// ── Rep tier helpers ─────────────────────────────────────────

/**
 * Get the highest tier a player has reached for a given shop.
 * Returns 0 if shop isn't unlocked.
 */
export function getShopTier(shopKey) {
  const rep = getStats().rep;
  const unlockRep = SHOP_UNLOCK_REP[shopKey];
  if (rep < unlockRep) return 0; // shop not unlocked

  let highestTier = 1; // at minimum tier 1 if unlocked
  for (const [tierStr, offset] of Object.entries(SHOP_TIER_OFFSETS)) {
    const tier = Number(tierStr);
    if (tier <= 1) continue; // tier 1 = unlock itself
    if (rep >= unlockRep + offset) {
      highestTier = tier;
    }
  }
  return highestTier;
}

/**
 * Check if a shop is unlocked (rep meets threshold + any achievement gates).
 * Achievement gates are checked separately — this only checks rep.
 */
export function isShopUnlocked(shopKey) {
  return getStats().rep >= SHOP_UNLOCK_REP[shopKey];
}

/**
 * Get active discount for a shop at current rep tier.
 */
export function getActiveDiscount(shopKey) {
  const tier = getShopTier(shopKey);
  let discount = 0;
  for (const [tierStr, pct] of Object.entries(SHOP_DISCOUNTS)) {
    if (tier >= Number(tierStr)) {
      discount = pct; // latest applicable discount
    }
  }
  return discount;
}

// ── Item availability ────────────────────────────────────────

/**
 * Get all items available in a shop at current rep tier.
 * Returns array of { id, name, gold, tier, available, purchased (for tomes) }
 */
export function getAvailableItems(shopKey) {
  const tier = getShopTier(shopKey);
  if (tier === 0) return [];

  const discount = getActiveDiscount(shopKey);

  let catalog;
  switch (shopKey) {
    case 'carpenter': catalog = CARPENTER_PRICES; break;
    case 'potion': catalog = POTION_PRICES; break;
    case 'talisman': catalog = TALISMAN_PRICES; break;
    case 'arcana': catalog = TOME_PRICES; break;
    default: return [];
  }

  const items = [];
  for (const [id, item] of Object.entries(catalog)) {
    if (item.tier > tier) continue; // not unlocked yet

    let goldCost = item.gold;

    // Milestone items (one-time carpenter upgrades) — skip if already at target
    if (item.milestone) {
      if (item.milestone === 'nest' && getNestSlotCount() >= MILESTONE_NEST_SLOTS) continue;
      if (item.milestone === 'den' && getDenSlotCount() >= MILESTONE_DEN_SLOTS) continue;
    }

    // Scaling items (nest/den/rack expansion)
    if (item.scaling) {
      goldCost = getExpansionCost(item.scaling);
      if (goldCost === null) continue; // at max capacity
    }

    // Apply discount
    if (goldCost && discount > 0) {
      goldCost = Math.round(goldCost * (1 - discount));
    }

    items.push({
      id,
      name: item.name,
      gold: goldCost,
      tier: item.tier,
      scaling: item.scaling || null,
      limited: item.limited || false,
      achievement: item.achievement || null,
      purchased: shopKey === 'arcana' ? purchasedTomes.has(id) : false,
    });
  }

  return items;
}

// ── Expansion cost lookup ────────────────────────────────────

function getExpansionCost(type) {
  switch (type) {
    case 'nest': {
      const nextSlot = getNestSlotCount() + 1;
      return NEST_EXPANSION_COSTS[nextSlot] || null;
    }
    case 'den': {
      const nextSlot = getDenSlotCount() + 1;
      return DEN_EXPANSION_COSTS[nextSlot] || null;
    }
    case 'rack': {
      const nextSlot = getEggRackSlotCount() + 1;
      return EGG_RACK_EXPANSION_COSTS[nextSlot] || null;
    }
    default: return null;
  }
}

// ── Purchasing ───────────────────────────────────────────────

/**
 * Attempt to purchase an item. Returns { success, message }.
 */
export function purchaseItem(shopKey, itemId) {
  const items = getAvailableItems(shopKey);
  const item = items.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not available' };

  // Check if tome already purchased
  if (shopKey === 'arcana' && purchasedTomes.has(itemId)) {
    return { success: false, message: 'Already purchased' };
  }

  // Check achievement gate
  if (item.achievement && !isAchievementUnlocked(item.achievement)) {
    return { success: false, message: 'Achievement required' };
  }

  // Check gold
  const { gold } = getStats();
  if (gold < item.gold) {
    return { success: false, message: 'Not enough gold' };
  }

  // Deduct gold
  addToStat('gold', -item.gold);

  // Apply item effect
  applyPurchase(shopKey, itemId, item);

  return { success: true, message: `Purchased ${item.name}!` };
}

function applyPurchase(shopKey, itemId, item) {
  if (shopKey === 'carpenter') {
    // Milestone upgrades — jump to milestone slot count
    const def = CARPENTER_PRICES[itemId];
    if (def?.milestone === 'nest') setNestSlotCount(MILESTONE_NEST_SLOTS);
    if (def?.milestone === 'den') setDenSlotCount(MILESTONE_DEN_SLOTS);
    return;
  }
  if (shopKey === 'arcana') {
    purchasedTomes.add(itemId);
    // Tome effects will be handled by skill system in Stage 2
  } else if (item.scaling) {
    // Expansion purchases
    switch (item.scaling) {
      case 'nest': setNestSlotCount(getNestSlotCount() + 1); break;
      case 'den': setDenSlotCount(getDenSlotCount() + 1); break;
      case 'rack': setEggRackSlotCount(getEggRackSlotCount() + 1); break;
    }
  } else {
    // Consumable or permanent item — add to inventory
    const count = purchasedItems.get(itemId) || 0;
    purchasedItems.set(itemId, count + 1);
  }
}

// ── Breeding cycle tracking ──────────────────────────────────

export function incrementBreedCycle() {
  breedCycleCount++;
}

export function getBreedCycleCount() {
  return breedCycleCount;
}

export function shouldRefreshShop() {
  return breedCycleCount > 0 && breedCycleCount % SHOP_REFRESH_INTERVAL === 0;
}

// ── Inventory ────────────────────────────────────────────────

export function getInventory() {
  return new Map(purchasedItems);
}

export function hasItem(itemId) {
  return (purchasedItems.get(itemId) || 0) > 0;
}

export function consumeItem(itemId) {
  const count = purchasedItems.get(itemId) || 0;
  if (count <= 0) return false;
  purchasedItems.set(itemId, count - 1);
  if (purchasedItems.get(itemId) === 0) purchasedItems.delete(itemId);
  return true;
}

export function hasTome(tomeId) {
  return purchasedTomes.has(tomeId);
}

// ── Save / Load ──────────────────────────────────────────────

export function getShopSaveData() {
  return {
    breedCycleCount,
    purchasedTomes: [...purchasedTomes],
    purchasedItems: Object.fromEntries(purchasedItems),
  };
}

export function restoreShopState(data) {
  if (!data) return;
  if (typeof data.breedCycleCount === 'number') breedCycleCount = data.breedCycleCount;
  if (Array.isArray(data.purchasedTomes)) {
    purchasedTomes = new Set(data.purchasedTomes);
  }
  if (data.purchasedItems && typeof data.purchasedItems === 'object') {
    purchasedItems = new Map(Object.entries(data.purchasedItems).map(([k, v]) => [k, Number(v)]));
  }
}
