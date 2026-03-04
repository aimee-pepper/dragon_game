// Tutorial engine — state management, trigger evaluation, persistence
// Tracks which tutorials have been shown, evaluates trigger conditions

import { TUTORIALS } from './tutorial-config.js';
import { getSetting, setSetting } from './settings.js';

// ── State ────────────────────────────────────────────────────

const completedTutorials = new Set();
let _activeTutorial = null;  // { id, step } — currently showing
let _showCallback = null;    // set by ui-tutorial.js
const _completeListeners = []; // callbacks fired after a tutorial is marked complete

// ── Public API ───────────────────────────────────────────────

export function initTutorialSystem(showCallback) {
  _showCallback = showCallback;
}

/** Check if tutorials are globally enabled */
export function areTutorialsEnabled() {
  return getSetting('tutorials-enabled') !== false;
}

/** Disable all tutorials globally */
export function disableAllTutorials() {
  setSetting('tutorials-enabled', false);
}

/** Enable all tutorials globally */
export function enableAllTutorials() {
  setSetting('tutorials-enabled', true);
}

/** Reset all tutorial completion state (for "Replay Tutorials") */
export function resetAllTutorials() {
  completedTutorials.clear();
  enableAllTutorials();
}

/** Check if a specific tutorial has been completed */
export function isTutorialCompleted(id) {
  return completedTutorials.has(id);
}

/** Mark a tutorial as completed */
export function markCompleted(id) {
  completedTutorials.add(id);
  // Notify listeners
  for (const cb of _completeListeners) cb(id);
  // Re-check current tab for newly eligible tutorials (prerequisites now met)
  setTimeout(() => {
    const currentTab = getSetting('active-tab') || 'stables';
    checkTrigger('tab-switch', { tab: currentTab });
  }, 400);
}

/** Register a callback fired when any tutorial completes */
export function onTutorialComplete(cb) {
  _completeListeners.push(cb);
}

/** Get the currently active tutorial */
export function getActiveTutorial() {
  return _activeTutorial;
}

/** Set the active tutorial (called by ui-tutorial.js) */
export function setActiveTutorial(tutorial) {
  _activeTutorial = tutorial;
}

/** Clear the active tutorial */
export function clearActiveTutorial() {
  _activeTutorial = null;
}

// ── Trigger Evaluation ───────────────────────────────────────

/**
 * Check if any tutorial should fire for the given event.
 * Called from various integration points across the app.
 * @param {string} eventType - 'app-load', 'tab-switch', or event name
 * @param {object} data - context data (e.g., { tab: 'breed' })
 */
export function checkTrigger(eventType, data = {}) {
  if (!areTutorialsEnabled()) return;
  if (_activeTutorial) return; // don't interrupt an active tutorial

  // Find matching tutorials, sorted by priority
  const candidates = [];

  for (const [id, def] of Object.entries(TUTORIALS)) {
    if (completedTutorials.has(id)) continue;

    const trigger = def.trigger;
    if (!trigger) continue;

    let matches = false;

    if (trigger.type === 'app-load' && eventType === 'app-load') {
      if (trigger.condition === 'no-save' && !data.hadSave) {
        matches = true;
      } else if (!trigger.condition) {
        matches = true;
      }
    }

    if (trigger.type === 'tab-switch' && eventType === 'tab-switch') {
      if (trigger.tab === data.tab) {
        matches = true;
      }
    }

    if (trigger.type === 'event' && eventType === trigger.event) {
      matches = true;
    }

    // Check prerequisites
    if (matches && trigger.requireCompleted) {
      for (const reqId of trigger.requireCompleted) {
        if (!completedTutorials.has(reqId)) {
          matches = false;
          break;
        }
      }
    }

    if (matches) {
      candidates.push({ id, def, priority: def.priority || 0 });
    }
  }

  if (candidates.length === 0) return;

  // Show highest priority (lowest number) tutorial
  candidates.sort((a, b) => a.priority - b.priority);
  const winner = candidates[0];

  if (_showCallback) {
    // Small delay so the triggering UI has time to render
    setTimeout(() => {
      if (_activeTutorial) return; // double-check
      _showCallback(winner.id, winner.def);
    }, 300);
  }
}

// ── Save/Restore ─────────────────────────────────────────────

export function getTutorialSaveData() {
  return {
    completed: [...completedTutorials],
  };
}

export function restoreTutorialState(data) {
  if (!data) return;
  completedTutorials.clear();
  if (Array.isArray(data.completed)) {
    for (const id of data.completed) {
      completedTutorials.add(id);
    }
  }
}
