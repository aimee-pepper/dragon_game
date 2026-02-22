// ============================================================
// Spine path storage — IndexedDB with in-memory cache
// ============================================================
// Replaces localStorage for spine path data (which exceeds 5MB limit).
// Provides sync-like API via an in-memory cache that's populated on init.
// All writes go to both cache and IndexedDB (async, fire-and-forget).
// Both spine-placement.html and the renderer use this module.

const DB_NAME = 'dragon-spine-db';
const DB_VERSION = 1;
const STORE_NAME = 'paths';
const LS_KEY = 'dragon-spine-paths-v1';

let _db = null;
let _cache = {};  // pathKey → data  (in-memory mirror of IndexedDB)
let _ready = false;
let _readyPromise = null;
let _readyResolve = null;

// ── IndexedDB helpers ──

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function idbGetAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    const reqKeys = store.getAllKeys();
    let keys = null, vals = null;
    function tryResolve() {
      if (keys !== null && vals !== null) {
        const result = {};
        for (let i = 0; i < keys.length; i++) {
          result[keys[i]] = vals[i];
        }
        resolve(result);
      }
    }
    reqKeys.onsuccess = () => { keys = reqKeys.result; tryResolve(); };
    req.onsuccess = () => { vals = req.result; tryResolve(); };
    tx.onerror = (e) => reject(e.target.error);
  });
}

function idbPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function idbDelete(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function idbClear(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ── Init: load everything into cache ──

async function _init() {
  try {
    _db = await openDB();
    _cache = await idbGetAll(_db);

    // One-time migration from localStorage → IndexedDB
    if (Object.keys(_cache).length === 0) {
      try {
        const lsData = JSON.parse(localStorage.getItem(LS_KEY)) || {};
        if (Object.keys(lsData).length > 0) {
          console.log(`Migrating ${Object.keys(lsData).length} spine paths from localStorage to IndexedDB...`);
          const tx = _db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const [key, val] of Object.entries(lsData)) {
            store.put(val, key);
          }
          await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
          });
          _cache = { ...lsData };
          // Clear localStorage to free space (keep a tiny marker)
          localStorage.removeItem(LS_KEY);
          localStorage.setItem('dragon-spine-migrated-to-idb', 'true');
          console.log('Migration complete — localStorage freed.');
        }
      } catch (e) {
        console.warn('localStorage migration failed (non-fatal):', e);
      }
    } else {
      // Already in IndexedDB — clean up localStorage if still there
      if (localStorage.getItem(LS_KEY)) {
        localStorage.removeItem(LS_KEY);
        localStorage.setItem('dragon-spine-migrated-to-idb', 'true');
      }
    }
  } catch (e) {
    console.error('IndexedDB init failed, falling back to localStorage:', e);
    try {
      _cache = JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch { _cache = {}; }
  }
  _ready = true;
}

// Create the ready promise
_readyPromise = _init();

// ── Public API (sync via cache) ──

/** Returns all paths as { pathKey: data } object. Sync — reads from cache. */
export function loadAllPaths() {
  return { ..._cache };
}

/** Save a single path entry. Sync cache write + async IndexedDB write. */
export function savePath(pathKey, data) {
  _cache[pathKey] = data;
  if (_db) {
    idbPut(_db, pathKey, data).catch(e => console.error('IndexedDB save failed:', e));
  }
}

/** Delete a single path entry. */
export function deletePath(pathKey) {
  delete _cache[pathKey];
  if (_db) {
    idbDelete(_db, pathKey).catch(e => console.error('IndexedDB delete failed:', e));
  }
}

/** Save all paths at once (for bulk operations). */
export function saveAllPaths(allPaths) {
  _cache = { ...allPaths };
  if (_db) {
    // Clear and re-write all
    const tx = _db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const [key, val] of Object.entries(allPaths)) {
      store.put(val, key);
    }
    tx.onerror = (e) => console.error('IndexedDB bulk save failed:', e.target.error);
  }
}

/** Promise that resolves when storage is ready. */
export function whenReady() {
  return _readyPromise;
}

/** Check if storage is ready (cache populated). */
export function isReady() {
  return _ready;
}
