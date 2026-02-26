// Save manager: localStorage persistence for game state
// Saves genotype + metadata, recomputes phenotype on load (deterministic)
// Exception: isDarkEnergy persisted (random 5% chance, not reproducible)

import { Dragon, getNextDragonId, setNextDragonId } from './dragon.js';
import {
  getStabledDragons, restoreStabledDragons,
  getDenDragonIds, getDenSlotCount, restoreDen,
  getNestSlotCount, restoreNestSlotCount,
  getEggRackSlotCount, restoreEggRackSlotCount,
} from './ui-stables.js';
import { getEggRackSaveData, restoreEggRack } from './egg-system.js';
import {
  getAllQuests,
  restoreQuestState,
  getNextQuestId,
  setNextQuestId,
} from './quest-engine.js';

const SAVE_KEY = 'dragon-keeper-save';
const SAVE_VERSION = 2;

// ── Rolling backups ─────────────────────────────────────────
// Keep the last 3 good saves so players can recover from data loss.
// Backups rotate on a throttled interval (at most every 60 seconds).

const BACKUP_KEY_PREFIX = 'dragon-keeper-backup-';
const MAX_BACKUPS = 3;
let _lastBackupTime = 0;
const BACKUP_INTERVAL_MS = 60_000; // one backup per minute max

function rotateBackup(currentSaveJSON) {
  const now = Date.now();
  if (now - _lastBackupTime < BACKUP_INTERVAL_MS) return;
  _lastBackupTime = now;

  try {
    // Shift backups: 2→3, 1→2, current→1
    for (let i = MAX_BACKUPS; i > 1; i--) {
      const prev = localStorage.getItem(`${BACKUP_KEY_PREFIX}${i - 1}`);
      if (prev) {
        localStorage.setItem(`${BACKUP_KEY_PREFIX}${i}`, prev);
      }
    }
    // Slot 1 gets the current (pre-overwrite) save
    localStorage.setItem(`${BACKUP_KEY_PREFIX}1`, currentSaveJSON);
  } catch (e) {
    console.warn('Backup rotation failed:', e);
  }
}

/** List available backups (newest first). Returns [{ slot, savedAt, dragonCount }] */
export function listBackups() {
  const results = [];
  for (let i = 1; i <= MAX_BACKUPS; i++) {
    try {
      const raw = localStorage.getItem(`${BACKUP_KEY_PREFIX}${i}`);
      if (!raw) continue;
      const data = JSON.parse(raw);
      results.push({
        slot: i,
        savedAt: data.savedAt || 0,
        dragonCount: Object.keys(data.dragons || {}).length,
        questCount: (data.quests || []).length,
        stats: data.stats || {},
      });
    } catch {
      // corrupt backup, skip
    }
  }
  return results;
}

/** Restore from a backup slot. Copies backup → main save key, then reloads the page. */
export function restoreFromBackup(slot) {
  const raw = localStorage.getItem(`${BACKUP_KEY_PREFIX}${slot}`);
  if (!raw) throw new Error(`No backup in slot ${slot}`);
  // Validate it parses
  JSON.parse(raw);
  // Overwrite main save
  localStorage.setItem(SAVE_KEY, raw);
  // Force full reload to pick up restored data
  window.location.reload();
}

// ── Achievement hooks (set by app.js to avoid circular dependency) ──

let _getAchievementSaveData = () => ({});
let _restoreAchievements = () => {};

export function registerAchievementHooks(getSaveData, restore) {
  _getAchievementSaveData = getSaveData;
  _restoreAchievements = restore;
}

// ── Shop hooks (set by app.js to avoid circular dependency: save-manager <-> shop-engine) ──

let _getShopSaveData = () => ({});
let _restoreShopState = () => {};

export function registerShopHooks(getSaveData, restore) {
  _getShopSaveData = getSaveData;
  _restoreShopState = restore;
}

// ── Skill hooks (set by app.js to avoid circular dependency: save-manager <-> skill-engine) ──

let _getSkillSaveData = () => ({});
let _restoreSkillState = () => {};

export function registerSkillHooks(getSaveData, restore) {
  _getSkillSaveData = getSaveData;
  _restoreSkillState = restore;
}

// ── Breed parent hooks (set by app.js) ──

let _getBreedParentAId = () => null;
let _getBreedParentBId = () => null;
let _restoreBreedParents = () => {};

// Deferred restore: IDs stored during load, applied after initBreedTab
let _pendingBreedParentAId = null;
let _pendingBreedParentBId = null;

export function registerBreedHooks(getAId, getBId, restore) {
  _getBreedParentAId = getAId;
  _getBreedParentBId = getBId;
  _restoreBreedParents = restore;
}

/** Call from app.js after initBreedTab() to apply deferred breed parent restore */
export function applyPendingBreedRestore(registry) {
  const a = _pendingBreedParentAId != null ? registry.get(_pendingBreedParentAId) : null;
  const b = _pendingBreedParentBId != null ? registry.get(_pendingBreedParentBId) : null;
  if (a || b) _restoreBreedParents(a, b);
  _pendingBreedParentAId = null;
  _pendingBreedParentBId = null;
}

// ── Captured dragon hooks (set by app.js) ──

let _getCapturedDragonIds = () => [];
let _restoreCapturedDragons = () => {};

// Deferred restore
let _pendingCapturedDragonIds = [];

export function registerCaptureHooks(getIds, restore) {
  _getCapturedDragonIds = getIds;
  _restoreCapturedDragons = restore;
}

/** Call from app.js after initGenerateTab() to apply deferred captured dragon restore */
export function applyPendingCapturedRestore(registry) {
  if (_pendingCapturedDragonIds.length === 0) return;
  const dragons = _pendingCapturedDragonIds
    .map(id => registry.get(id))
    .filter(Boolean);
  if (dragons.length > 0) _restoreCapturedDragons(dragons);
  _pendingCapturedDragonIds = [];
}

// ── Stats tracking ──────────────────────────────────────────

const stats = {
  totalGenerated: 0,
  totalBred: 0,
  totalMutants: 0,
  totalQuestsCompleted: 0,
  totalStabled: 0,
  totalReleased: 0,
  // Currency (earned from quests, spent in shop)
  gold: 0,
  exp: 0,
  rep: 0,
  // Lifetime currency earned (never decremented)
  totalGoldEarned: 0,
  totalRepEarned: 0,
  // Note: stats.exp already IS the lifetime XP counter (XP spending is tracked
  // separately in skill-engine's xpSpent, so stats.exp only accumulates).
};

export function getStats() {
  return { ...stats };
}

// Listeners notified when any stat changes (for achievement checks)
const statChangeListeners = [];

export function onStatChange(cb) {
  statChangeListeners.push(cb);
}

function notifyStatChange() {
  for (const cb of statChangeListeners) cb();
}

export function incrementStat(key) {
  if (key in stats) {
    stats[key]++;
    debouncedSave();
    notifyStatChange();
  }
}

/** Add an arbitrary amount to a stat (for currency rewards). */
export function addToStat(key, amount) {
  if (key in stats && typeof amount === 'number') {
    stats[key] += amount;
    // Track lifetime currency earned (positive additions only)
    if (amount > 0) {
      if (key === 'gold') stats.totalGoldEarned += amount;
      if (key === 'rep')  stats.totalRepEarned += amount;
    }
    debouncedSave();
    notifyStatChange();
  }
}

// ── Hotbar state ────────────────────────────────────────────
// 5 slots, each null or { type: 'item'|'skill', id: string }
const hotbar = [null, null, null, null, null];

export function getHotbar() {
  return [...hotbar];
}

export function setHotbarSlot(slotIndex, entry) {
  if (slotIndex >= 0 && slotIndex < hotbar.length) {
    // entry should be { type: 'item'|'skill', id: '...' } or null
    hotbar[slotIndex] = entry;
    debouncedSave();
  }
}

export function clearHotbarSlot(slotIndex) {
  if (slotIndex >= 0 && slotIndex < hotbar.length) {
    hotbar[slotIndex] = null;
    debouncedSave();
  }
}

// ── Pending breed effects ───────────────────────────────────
// Array of potion IDs queued for next breed
const pendingBreedEffects = [];

export function getPendingBreedEffects() {
  return [...pendingBreedEffects];
}

export function addPendingBreedEffect(potionId) {
  pendingBreedEffects.push(potionId);
  debouncedSave();
}

export function clearPendingBreedEffects() {
  pendingBreedEffects.length = 0;
  debouncedSave();
}

// ── Save ────────────────────────────────────────────────────

let saveTimer = null;

function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveGame(), 300);
}

// Trigger a debounced save from external callers
export function triggerSave() {
  debouncedSave();
}

export function saveGame(registry) {
  // Registry is optional — if not passed, we save what we can
  // The registry param is only needed on the first call to wire it in
  if (registry) {
    _registry = registry;
  }
  if (!_registry) return;

  // Safety: don't overwrite existing save data with empty state.
  // If loadGame failed (e.g. due to module errors), the first saveGame()
  // call from init() would destroy the player's save. Guard against this.
  if (_loadFailed && _registry.count === 0) {
    console.warn('Save skipped: load failed and registry is empty (would destroy existing save)');
    return;
  }

  try {
    // Collect all dragons that need persisting:
    // stabled + quest-completed + all ancestors
    const dragonsToSave = collectReachableDragons();

    const saveData = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      nextDragonId: getNextDragonId(),
      nextQuestId: getNextQuestId(),
      stabledDragonIds: getStabledDragons().map(d => d.id),
      denDragonIds: getDenDragonIds(),
      denSlotCount: getDenSlotCount(),
      nestSlotCount: getNestSlotCount(),
      eggRackSlotCount: getEggRackSlotCount(),
      breedParentAId: _getBreedParentAId(),
      breedParentBId: _getBreedParentBId(),
      capturedDragonIds: _getCapturedDragonIds(),
      eggRack: getEggRackSaveData(),
      dragons: {},
      quests: getAllQuests(),
      stats: { ...stats },
      achievements: _getAchievementSaveData(),
      shop: _getShopSaveData(),
      skills: _getSkillSaveData(),
      hotbar: [...hotbar],
      pendingBreedEffects: [...pendingBreedEffects],
    };

    for (const dragon of dragonsToSave) {
      saveData.dragons[dragon.id] = dragon.toSaveData();
    }

    const json = JSON.stringify(saveData);

    // Rotate the previous save into backup before overwriting
    const existingSave = localStorage.getItem(SAVE_KEY);
    if (existingSave) {
      rotateBackup(existingSave);
    }

    localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

// Walk parentIds to find all ancestors of a set of root dragons
function collectReachableDragons() {
  const stabled = getStabledDragons();
  const completedQuests = getAllQuests().filter(q => q.status === 'completed');

  // Seed with stabled dragon IDs + quest-completed dragon IDs + breed parents + captured
  const seedIds = new Set(stabled.map(d => d.id));
  for (const q of completedQuests) {
    if (q.completedById) seedIds.add(q.completedById);
  }
  const breedAId = _getBreedParentAId();
  const breedBId = _getBreedParentBId();
  if (breedAId != null) seedIds.add(breedAId);
  if (breedBId != null) seedIds.add(breedBId);
  for (const cid of _getCapturedDragonIds()) {
    seedIds.add(cid);
  }
  for (const did of getDenDragonIds()) {
    seedIds.add(did);
  }
  // Egg rack dragons: add their parent IDs to seed set
  // (egg rack dragon data is saved inline, but their ancestors need persisting)
  for (const egg of getEggRackSaveData()) {
    if (egg.dragonSaveData && egg.dragonSaveData.parentIds) {
      for (const pid of egg.dragonSaveData.parentIds) {
        seedIds.add(pid);
      }
    }
  }

  // BFS walk parentIds to collect all ancestors
  const visited = new Set();
  const queue = [...seedIds];
  while (queue.length > 0) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);

    const dragon = _registry.get(id);
    if (dragon && dragon.parentIds) {
      for (const pid of dragon.parentIds) {
        if (!visited.has(pid)) queue.push(pid);
      }
    }
  }

  // Collect dragon objects
  const result = [];
  for (const id of visited) {
    const dragon = _registry.get(id);
    if (dragon) result.push(dragon);
  }
  return result;
}

// ── Load ────────────────────────────────────────────────────

let _registry = null;
let _loadFailed = false; // set true when loadGame catches an error

export function loadGame(registry) {
  _registry = registry;
  _loadFailed = false;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const saveData = JSON.parse(raw);
    if (!saveData) return false;

    // ── Save migration ──
    if (saveData.version === 1) {
      // v1 → v2: Add revealedGenes to all dragons, add skills object
      for (const data of Object.values(saveData.dragons || {})) {
        if (!data.revealedGenes) data.revealedGenes = {};
      }
      if (!saveData.skills) saveData.skills = {};
      saveData.version = 2;
      console.log('Migrated save from v1 → v2');
    }

    if (saveData.version !== SAVE_VERSION) return false;

    // Restore ID counters (must happen before creating dragons)
    if (saveData.nextDragonId) setNextDragonId(saveData.nextDragonId);
    if (saveData.nextQuestId) setNextQuestId(saveData.nextQuestId);

    // Deserialize all dragons into the registry
    const dragonMap = {};
    for (const [idStr, data] of Object.entries(saveData.dragons)) {
      const dragon = Dragon.fromSaveData(data);
      registry.add(dragon);
      dragonMap[dragon.id] = dragon;
    }

    // Restore stables (bulk load without per-dragon notifications)
    if (saveData.stabledDragonIds) {
      const stabledDragons = saveData.stabledDragonIds
        .map(id => dragonMap[id])
        .filter(Boolean);
      restoreStabledDragons(stabledDragons);
    }

    // Restore den
    if (saveData.denDragonIds) {
      const denDragons = saveData.denDragonIds
        .map(id => dragonMap[id])
        .filter(Boolean);
      restoreDen(denDragons, saveData.denSlotCount);
    }

    // Restore nest/egg rack slot counts
    if (saveData.nestSlotCount) restoreNestSlotCount(saveData.nestSlotCount);
    if (saveData.eggRackSlotCount) restoreEggRackSlotCount(saveData.eggRackSlotCount);

    // Restore quests
    if (saveData.quests && saveData.quests.length > 0) {
      restoreQuestState(saveData.quests);
    }

    // Restore stats
    if (saveData.stats) {
      for (const key of Object.keys(stats)) {
        if (typeof saveData.stats[key] === 'number') {
          stats[key] = saveData.stats[key];
        }
      }
    }

    // Restore egg rack
    if (saveData.eggRack) {
      restoreEggRack(saveData.eggRack, (data) => Dragon.fromSaveData(data));
    }

    // Restore achievements
    if (saveData.achievements) {
      _restoreAchievements(saveData.achievements);
    }

    // Restore shop state
    if (saveData.shop) {
      _restoreShopState(saveData.shop);
    }

    // Restore skill state
    if (saveData.skills) {
      _restoreSkillState(saveData.skills);
    }

    // Restore hotbar (migrate old string-only entries → { type: 'item', id })
    if (Array.isArray(saveData.hotbar)) {
      for (let i = 0; i < hotbar.length && i < saveData.hotbar.length; i++) {
        const entry = saveData.hotbar[i];
        if (entry === null) {
          hotbar[i] = null;
        } else if (typeof entry === 'string') {
          // Backward compat: old format was just an item ID string
          hotbar[i] = { type: 'item', id: entry };
        } else if (entry && entry.type && entry.id) {
          hotbar[i] = entry;
        } else {
          hotbar[i] = null;
        }
      }
    }

    // Restore pending breed effects
    if (Array.isArray(saveData.pendingBreedEffects)) {
      pendingBreedEffects.length = 0;
      pendingBreedEffects.push(...saveData.pendingBreedEffects);
    }

    // Deferred restore: breed parents (applied after initBreedTab)
    _pendingBreedParentAId = saveData.breedParentAId ?? null;
    _pendingBreedParentBId = saveData.breedParentBId ?? null;

    // Deferred restore: captured dragons (applied after initGenerateTab)
    _pendingCapturedDragonIds = saveData.capturedDragonIds ?? [];

    console.log(`Game loaded: ${Object.keys(saveData.dragons).length} dragons, ${saveData.quests.length} quests`);
    return true;
  } catch (e) {
    console.error('Load failed:', e);
    console.error('Stack:', e.stack);
    _loadFailed = true;
    return false;
  }
}

// ── Auto-save wiring ────────────────────────────────────────

// Called once from app.js after all modules are initialized
export function initAutoSave() {
  // The actual listeners are registered in app.js after init
  // This function exists as a hook point if needed
}
