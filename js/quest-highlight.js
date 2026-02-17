// Quest highlighting — ephemeral highlighted quest state + halo helper
import { getSetting } from './settings.js';
import { checkDragonMeetsQuest, getRequirementStatus } from './quest-engine.js';

let highlightedQuest = null;
const highlightListeners = [];

export function getHighlightedQuest() {
  return highlightedQuest;
}

export function setHighlightedQuest(quest) {
  highlightedQuest = quest;
  for (const cb of highlightListeners) cb(quest);
}

export function onHighlightChange(cb) {
  highlightListeners.push(cb);
}

/**
 * Apply quest halo CSS classes to a dragon card element.
 * - quest-halo-full  → dragon meets ALL requirements
 * - quest-halo-partial → dragon meets ≥1 requirement
 * Removes both classes first so it can be called repeatedly.
 */
export function applyQuestHalo(cardElement, dragon) {
  cardElement.classList.remove('quest-halo-full', 'quest-halo-partial');

  if (!highlightedQuest) return;
  if (!getSetting('quest-halos')) return;

  const quest = highlightedQuest;
  if (checkDragonMeetsQuest(dragon, quest)) {
    cardElement.classList.add('quest-halo-full');
  } else {
    // Check partial: at least one requirement met
    const status = getRequirementStatus(dragon, quest);
    const metCount = status.filter(r => r.met).length;
    if (metCount > 0) {
      cardElement.classList.add('quest-halo-partial');
    }
  }
}
