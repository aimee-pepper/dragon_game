// Save manager: localStorage persistence for game state
// Saves genotype + metadata, recomputes phenotype on load (deterministic)
// Exception: isDarkEnergy persisted (random 5% chance, not reproducible)

import { Dragon, getNextDragonId, setNextDragonId } from './dragon.js';
import { getStabledDragons, restoreStabledDragons } from './ui-stables.js';
import {
  getAllQuests,
  restoreQuestState,
  getNextQuestId,
  setNextQuestId,
} from './quest-engine.js';

const SAVE_KEY = 'dragon-keeper-save';
const SAVE_VERSION = 1;

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

export function incrementStat(key) {
  if (key in stats) {
    stats[key]++;
    debouncedSave();
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
      dragons: {},
      quests: getAllQuests(),
      stats: { ...stats },
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

  // Seed with stabled dragon IDs + quest-completed dragon IDs
  const seedIds = new Set(stabled.map(d => d.id));
  for (const q of completedQuests) {
    if (q.completedById) seedIds.add(q.completedById);
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
