// Centralized settings store — persisted in localStorage with pub/sub

const STORAGE_KEY = 'dragon-keeper-settings';

const DEFAULTS = {
  'theme': 'dark',
  'art-style': 'drawn',        // 'drawn' = hand-drawn PNGs, 'pixel' = legacy pixel art
  'quest-halos': true,
  'quest-genotype-highlight': true,
  'pinned-quest-widget': true,
  'active-tab': 'generate',
  'pinned-quest-id': null,
};

let settings = { ...DEFAULTS };
const listeners = {}; // key → [callback, ...]

// Migrate old theme key from previous build
function migrateOldKeys() {
  const oldTheme = localStorage.getItem('dragon-game-theme');
  if (oldTheme) {
    settings.theme = oldTheme === 'light' ? 'light' : 'dark';
    localStorage.removeItem('dragon-game-theme');
    save();
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge: only overwrite known keys
      for (const key of Object.keys(DEFAULTS)) {
        if (key in parsed) settings[key] = parsed[key];
      }
    }
  } catch { /* ignore corrupt data */ }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function initSettings() {
  load();
  migrateOldKeys();
}

export function getSetting(key) {
  return settings[key];
}

export function setSetting(key, value) {
  if (settings[key] === value) return;
  settings[key] = value;
  save();
  // Notify listeners
  if (listeners[key]) {
    for (const cb of listeners[key]) cb(value);
  }
}

export function onSettingChange(key, cb) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(cb);
}
