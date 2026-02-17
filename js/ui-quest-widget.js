// Floating pinned quest widget — shows highlighted quest on all tabs
import { getSetting, onSettingChange } from './settings.js';
import { getHighlightedQuest, onHighlightChange } from './quest-highlight.js';
import { getRequirementStatus } from './quest-engine.js';
import { getStabledDragons } from './ui-stables.js';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

let widgetEl = null;
let expanded = false;

function getDifficultyLabel(d) {
  const map = { easy: 'Easy', medium: 'Medium', hard: 'Hard', 'extra-hard': 'Extra Hard' };
  return map[d] || d;
}

export function initQuestWidget() {
  widgetEl = el('div', 'quest-widget');
  widgetEl.classList.add('hidden');

  // Collapsed pill
  const pill = el('button', 'quest-widget-pill', '▸ Quest');
  pill.addEventListener('click', () => {
    expanded = !expanded;
    widgetEl.classList.toggle('expanded', expanded);
    pill.textContent = expanded ? '▾ Quest' : '▸ Quest';
    if (expanded) renderWidgetContent();
  });
  widgetEl.appendChild(pill);

  // Expanded content area
  const content = el('div', 'quest-widget-content');
  widgetEl.appendChild(content);

  document.body.appendChild(widgetEl);

  // React to highlight changes
  onHighlightChange(() => updateVisibility());

  // React to setting changes
  onSettingChange('pinned-quest-widget', () => updateVisibility());

  updateVisibility();
}

function updateVisibility() {
  if (!widgetEl) return;
  const quest = getHighlightedQuest();
  const enabled = getSetting('pinned-quest-widget');

  if (quest && enabled) {
    widgetEl.classList.remove('hidden');
    if (expanded) renderWidgetContent();
  } else {
    widgetEl.classList.add('hidden');
    expanded = false;
    widgetEl.classList.remove('expanded');
    const pill = widgetEl.querySelector('.quest-widget-pill');
    if (pill) pill.textContent = '▸ Quest';
  }
}

function renderWidgetContent() {
  const content = widgetEl.querySelector('.quest-widget-content');
  if (!content) return;
  content.innerHTML = '';

  const quest = getHighlightedQuest();
  if (!quest) return;

  // Title + difficulty
  const header = el('div', 'quest-widget-header');
  header.appendChild(el('span', 'quest-widget-title', quest.title));
  header.appendChild(el('span', `quest-difficulty quest-difficulty-${quest.difficulty}`, getDifficultyLabel(quest.difficulty)));
  content.appendChild(header);

  // Requirements checklist — check against best stabled dragon
  const stabled = getStabledDragons();
  for (const req of quest.requirements) {
    const row = el('div', 'quest-widget-req');
    // Check if any stabled dragon meets this specific requirement
    let anyMet = false;
    for (const dragon of stabled) {
      const status = getRequirementStatus(dragon, quest);
      const reqStatus = status.find(r => r.label === req.label);
      if (reqStatus && reqStatus.met) { anyMet = true; break; }
    }
    const dot = el('span', anyMet ? 'quest-widget-dot met' : 'quest-widget-dot', '●');
    row.appendChild(dot);
    row.appendChild(el('span', '', req.label));
    content.appendChild(row);
  }
}
