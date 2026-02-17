// Quests tab: display active quests, submit stabled dragons, track completions
import { getStabledDragons } from './ui-stables.js';
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { openFamilyTree } from './ui-family-tree.js';
import {
  initQuestState,
  getActiveQuests,
  getCompletedQuests,
  submitDragonToQuest,
  getRequirementStatus,
  checkDragonMeetsQuest,
} from './quest-engine.js';

let questContainer = null;
let dragonRegistry = null;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initQuestsTab(container, registry) {
  dragonRegistry = registry;
  initQuestState();

  questContainer = el('div', 'quests-wrapper');
  container.appendChild(questContainer);

  renderQuests();
}

function renderQuests() {
  questContainer.innerHTML = '';

  // Section header
  const header = el('div', 'quests-section-header');
  header.appendChild(el('h2', 'quests-title', 'Active Quests'));
  const stabledCount = getStabledDragons().length;
  header.appendChild(el('span', 'quests-hint', `${stabledCount} dragon${stabledCount !== 1 ? 's' : ''} in stables`));
  questContainer.appendChild(header);

  // Active quests
  const active = getActiveQuests();
  if (active.length === 0) {
    const empty = el('div', 'quests-empty', 'No active quests. Complete quests to generate new ones!');
    questContainer.appendChild(empty);
  } else {
    for (const quest of active) {
      questContainer.appendChild(renderQuestCard(quest));
    }
  }

  // Completed quests
  const completed = getCompletedQuests();
  if (completed.length > 0) {
    const completedSection = el('div', 'quests-completed-section');

    const completedToggle = el('button', 'quests-completed-toggle', `Completed (${completed.length})`);
    const completedList = el('div', 'quests-completed-list');

    completedToggle.addEventListener('click', () => {
      const isOpen = completedList.classList.toggle('open');
      completedToggle.classList.toggle('open', isOpen);
    });

    for (const quest of completed) {
      completedList.appendChild(renderCompletedCard(quest));
    }

    completedSection.appendChild(completedToggle);
    completedSection.appendChild(completedList);
    questContainer.appendChild(completedSection);
  }
}

function getDifficultyLabel(difficulty) {
  switch (difficulty) {
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'hard': return 'Hard';
    case 'extra-hard': return 'Extra Hard';
    default: return difficulty;
  }
}

function renderQuestCard(quest) {
  const card = el('div', `quest-card quest-${quest.difficulty}`);

  // Header row: title + difficulty badge
  const header = el('div', 'quest-card-header');
  header.appendChild(el('h3', 'quest-card-title', quest.title));
  const badge = el('span', `quest-difficulty quest-difficulty-${quest.difficulty}`, getDifficultyLabel(quest.difficulty));
  header.appendChild(badge);
  card.appendChild(header);

  // Description
  card.appendChild(el('p', 'quest-description', quest.description));

  // Requirements checklist
  const reqList = el('div', 'quest-requirements');
  reqList.appendChild(el('div', 'quest-req-label', 'Requirements'));
  for (const req of quest.requirements) {
    const reqItem = el('div', 'quest-req-item');
    reqItem.appendChild(el('span', 'quest-req-dot', '●'));
    const reqText = el('span', 'quest-req-text', req.label);
    reqItem.appendChild(reqText);
    // Show recipe hint for triangle-system requirements (color, finish, element, specialty)
    if (req.hint) {
      const hint = el('span', 'quest-req-hint');
      hint.appendChild(document.createTextNode(' ('));

      if (req.hintType === 'specialty') {
        // Specialty hints are "ColorName + FinishName" — no axis coloring
        hint.appendChild(document.createTextNode(req.hint));
      } else {
        // Axis-based hints: "C: None · M: High · Y: Low" etc.
        const parts = req.hint.split(' · ');
        parts.forEach((part, i) => {
          // Extract the axis prefix (e.g. "C", "M", "F", "O", "Sh", "Sc")
          const axisPrefix = part.split(':')[0].trim();
          let axisClass = '';
          if (req.hintType === 'color') {
            axisClass = axisPrefix === 'C' ? 'cmy-c' : axisPrefix === 'M' ? 'cmy-m' : 'cmy-y';
          } else if (req.hintType === 'element') {
            axisClass = axisPrefix === 'F' ? 'breath-f' : axisPrefix === 'I' ? 'breath-i' : 'breath-l';
          } else if (req.hintType === 'finish') {
            axisClass = axisPrefix === 'O' ? 'finish-o' : axisPrefix === 'Sh' ? 'finish-s' : 'finish-sc';
          }
          hint.appendChild(el('span', axisClass, part));
          if (i < parts.length - 1) hint.appendChild(document.createTextNode(' · '));
        });
      }

      hint.appendChild(document.createTextNode(')'));
      reqItem.appendChild(hint);
    }
    reqList.appendChild(reqItem);
  }
  card.appendChild(reqList);

  // Submit button
  const submitBtn = el('button', 'btn quest-submit-btn', 'Submit Dragon');
  submitBtn.addEventListener('click', () => openQuestPicker(quest));
  card.appendChild(submitBtn);

  return card;
}

function renderCompletedCard(quest) {
  const card = el('div', 'quest-card quest-completed');

  const header = el('div', 'quest-card-header');
  const titleRow = el('span', 'quest-completed-title');
  titleRow.appendChild(el('span', 'quest-check', '✓'));
  titleRow.appendChild(document.createTextNode(quest.title));
  header.appendChild(titleRow);
  card.appendChild(header);

  if (quest.completedBy) {
    const genText = quest.completedByGeneration > 0
      ? ` (Gen ${quest.completedByGeneration} — ${quest.completedByGeneration} generation${quest.completedByGeneration !== 1 ? 's' : ''} of breeding)`
      : ' (Wild)';

    const completedEl = el('p', 'quest-completed-by');
    completedEl.textContent = 'Completed by ';

    const nameLink = el('span', 'quest-completed-name-link', quest.completedBy + genText);
    // Make clickable to open family tree if dragon still in registry
    if (quest.completedById && dragonRegistry) {
      const dragon = dragonRegistry.get(quest.completedById);
      if (dragon) {
        nameLink.addEventListener('click', () => {
          openFamilyTree(dragon, dragonRegistry);
        });
      }
    }
    completedEl.appendChild(nameLink);
    card.appendChild(completedEl);
  }

  return card;
}

// Open a picker showing stabled dragons with quest requirement indicators
function openQuestPicker(quest) {
  const dragons = getStabledDragons();

  if (dragons.length === 0) {
    showQuestMessage('No stabled dragons! Stable dragons from the Capture or Breed tabs first.', 'error');
    return;
  }

  const overlay = el('div', 'picker-overlay');
  const panel = el('div', 'picker-panel');

  panel.appendChild(el('div', 'picker-title', 'Choose a Dragon'));
  panel.appendChild(el('div', 'quest-picker-subtitle', quest.title));

  // Sort: matching dragons first
  const sorted = [...dragons].sort((a, b) => {
    const aMatch = checkDragonMeetsQuest(a, quest) ? 0 : 1;
    const bMatch = checkDragonMeetsQuest(b, quest) ? 0 : 1;
    return aMatch - bMatch;
  });

  for (const dragon of sorted) {
    const item = renderQuestPickerItem(dragon, quest, (selected) => {
      overlay.remove();
      const result = submitDragonToQuest(selected, quest.id);
      if (result.success) {
        showQuestMessage(result.message, 'success');
      } else {
        showQuestMessage(result.message, 'error');
      }
      renderQuests();
    });
    panel.appendChild(item);
  }

  // Close button
  const closeRow = el('div', 'picker-close');
  const closeBtn = el('button', 'btn btn-secondary', 'Cancel');
  closeBtn.addEventListener('click', () => overlay.remove());
  closeRow.appendChild(closeBtn);
  panel.appendChild(closeRow);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function renderQuestPickerItem(dragon, quest, onClick) {
  const item = el('div', 'picker-item quest-picker-item');

  const meetsAll = checkDragonMeetsQuest(dragon, quest);
  if (meetsAll) item.classList.add('quest-match');

  item.addEventListener('click', () => onClick(dragon));

  // Dragon color swatch
  const swatch = el('div', 'picker-swatch');
  swatch.style.backgroundColor = dragon.phenotype.color.hex;
  item.appendChild(swatch);

  // Dragon info
  const info = el('div', 'picker-info');
  const name = el('div', 'picker-name', `${dragon.name} #${dragon.id}`);
  info.appendChild(name);

  // Per-requirement status indicators
  const reqStatus = getRequirementStatus(dragon, quest);
  const indicators = el('div', 'quest-req-indicators');
  for (const req of reqStatus) {
    const indicator = el('span', req.met ? 'quest-indicator-met' : 'quest-indicator-unmet');
    indicator.textContent = req.met ? '✓' : '✗';
    indicator.title = `${req.label}: ${req.met ? 'Met' : 'Not met'}`;
    indicators.appendChild(indicator);
    indicators.appendChild(el('span', 'quest-indicator-label', req.label));
  }
  info.appendChild(indicators);
  item.appendChild(info);

  // Match badge
  if (meetsAll) {
    item.appendChild(el('span', 'quest-match-badge', 'Match!'));
  }

  return item;
}

function showQuestMessage(message, type) {
  // Remove any existing message
  const existing = document.querySelector('.quest-toast');
  if (existing) existing.remove();

  const toast = el('div', `quest-toast quest-toast-${type}`, message);
  document.body.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
