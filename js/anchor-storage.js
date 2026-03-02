// ============================================================
// Anchor storage — file-based with fetch + in-memory cache
// ============================================================
// Reads anchor data from data/sprite-anchors.json (written by server.py).
// Provides sync getAnchor() lookups via an in-memory cache populated on init.
// The sprite-placement tool POSTs updates; this module just reads.

const ANCHOR_FILE = '/data/sprite-anchors.json';

let _anchors = {};      // flat anchors: key → { x, y, rot? }
let _toolFormat = null;  // 3-level format for the placement tool
let _ready = false;

async function _init() {
  try {
    const resp = await fetch(ANCHOR_FILE);
    if (resp.ok) {
      const data = await resp.json();
      _anchors = data.anchors || {};
      _toolFormat = data.toolFormat || null;
    } else {
      console.warn('anchor-storage: no data file found, using empty anchors');
    }
  } catch (e) {
    console.warn('anchor-storage: fetch failed, using empty anchors:', e);
  }
  _ready = true;
}

const _readyPromise = _init();

/** Promise that resolves when anchor data is loaded. */
export function whenReady() {
  return _readyPromise;
}

/** Check if storage is ready (cache populated). */
export function isReady() {
  return _ready;
}

/** Get the 3-level tool format data (for sprite-placement.html). */
export function getToolFormat() {
  return _toolFormat ? JSON.parse(JSON.stringify(_toolFormat)) : null;
}

/**
 * Get the anchor position for a given asset.
 * Supports composite keys for config-aware placement:
 *   filename:p{N}:{bodyType}:{count}w  — wings (pair + body type + wing count)
 *   filename:p{N}:{bodyType}:{count}l  — legs (pair + body type + limb count)
 *   filename:p{N}:{bodyType}           — wings/legs fallback (v4 compat)
 *   filename:{bodyType}                — head/tail/vestigial (body type only)
 *   filename                           — body/horns (bare key)
 *
 * Falls back through less-specific keys for backward compatibility.
 *
 * @param {string} filename - PNG filename without extension
 * @param {object} context - optional context for composite key lookup
 * @param {string} context.bodyType - 'standard'|'sinuous'|'bulky'
 * @param {number} context.pair - pair number (1, 2, 3) for wings/legs
 * @param {number} context.wingCount - actual wing count (2, 4, 6) for wings
 * @param {number} context.limbCount - actual limb count (2, 4, 6) for legs
 * @returns {{ x: number, y: number, rot?: number }}
 */
export function getAnchor(filename, context = {}) {
  const { bodyType, pair, wingCount, limbCount } = context;

  // Most specific: pair + bodyType + config count
  if (pair && bodyType && wingCount) {
    const key = `${filename}:p${pair}:${bodyType}:${wingCount}w`;
    if (_anchors[key]) return _anchors[key];
  }
  if (pair && bodyType && limbCount) {
    const key = `${filename}:p${pair}:${bodyType}:${limbCount}l`;
    if (_anchors[key]) return _anchors[key];
  }

  // Fallback: pair + bodyType (v4 backward compat)
  if (pair && bodyType) {
    const key = `${filename}:p${pair}:${bodyType}`;
    if (_anchors[key]) return _anchors[key];
  }
  if (bodyType) {
    const key = `${filename}:${bodyType}`;
    if (_anchors[key]) return _anchors[key];
  }

  // Fall back to bare filename (backward compatible)
  return _anchors[filename] || { x: 0, y: 0 };
}
