// Save manager: localStorage persistence for game state
// Saves genotype + metadata, recomputes phenotype on load (deterministic)
// Exception: isDarkEnergy persisted (random 5% chance, not reproducible)

import { Dragon, getNextDragonId, setNextDragonId } from './dragon.js';
import { getStabledDragons, restoreStabledDragons, getDenDragonIds, getDenSlotCount, restoreDen } from './ui-stables.js';
import {
  getAllQuests,
  restoreQuestState,
  getNextQuestId,
  setNextQuestId,
} from './quest-engine.js';

const SAVE_KEY = 'dragon-keeper-save';
const SAVE_VERSION = 1;

// ── Achievement hooks (set by app.js to avoid circular dependency) ──

let _getAchievementSaveData = () => ({});
let _restoreAchievements = () => {};

export function registerAchievementHooks(getSaveData, restore) {
  _getAchievementSaveData = getSaveData;
  _restoreAchievements = restore;
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
  totalQuestsCompleted: 0,
  totalStabled: 0,
  totalReleased: 0,
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
      breedParentAId: _getBreedParentAId(),
      breedParentBId: _getBreedParentBId(),
      capturedDragonIds: _getCapturedDragonIds(),
      dragons: {},
      quests: getAllQuests(),
      stats: { ...stats },
      achievements: _getAchievementSaveData(),
    };

    for (const dragon of dragonsToSave) {
      saveData.dragons[dragon.id] = dragon.toSaveData();
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
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

export function loadGame(registry) {
  _registry = registry;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const saveData = JSON.parse(raw);
    if (!saveData || saveData.version !== SAVE_VERSION) return false;

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

    // Restore achievements
    if (saveData.achievements) {
      _restoreAchievements(saveData.achievements);
    }

    // Deferred restore: breed parents (applied after initBreedTab)
    _pendingBreedParentAId = saveData.breedParentAId ?? null;
    _pendingBreedParentBId = saveData.breedParentBId ?? null;

    // Deferred restore: captured dragons (applied after initGenerateTab)
    _pendingCapturedDragonIds = saveData.capturedDragonIds ?? [];

    console.log(`Game loaded: ${Object.keys(saveData.dragons).length} dragons, ${saveData.quests.length} quests`);
    return true;
  } catch (e) {
    console.warn('Load failed:', e);
    return false;
  }
}

// ── Auto-save wiring ────────────────────────────────────────

// Called once from app.js after all modules are initialized
export function initAutoSave() {
  // The actual listeners are registered in app.js after init
  // This function exists as a hook point if needed
}
