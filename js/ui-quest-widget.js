// Floating pinned quest widget — shows highlighted quest on all tabs
import { getSetting, onSettingChange } from './settings.js';
import { getHighlightedQuest, onHighlightChange } from './quest-highlight.js';
import { getRequirementStatus } from './quest-engine.js';
import { getStabledDragons, onStablesChange } from './ui-stables.js';

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

  // React to stables changes (update checkmarks when dragons are stabled/released)
  onStablesChange(() => {
    if (expanded) renderWidgetContent();
  });

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

// Axis color classes for inline coloring
const AXIS_CLASSES = {
  C: 'cmy-c', M: 'cmy-m', Y: 'cmy-y',
  F: 'breath-f', I: 'breath-i', L: 'breath-l',
  O: 'finish-o', Sh: 'finish-s', Sc: 'finish-sc',
};

// Render colored axis text (e.g. "C: None · M: High · Y: Low") into a container
function renderColoredAxes(container, axisString) {
  const parts = axisString.split(' · ');
  parts.forEach((part, i) => {
    const prefix = part.split(':')[0].trim();
    const cls = AXIS_CLASSES[prefix] || '';
    container.appendChild(el('span', cls, part));
    if (i < parts.length - 1) container.appendChild(document.createTextNode(' · '));
  });
}

function renderWidgetContent() {
  const content = widgetEl.querySelector('.quest-widget-content');
  if (!content) return;
  content.innerHTML = '';

  const quest = getHighlightedQuest();
  if (!quest) return;

  // Difficulty badge only (no verbose title)
  const header = el('div', 'quest-widget-header');
  header.appendChild(el('span', `quest-difficulty quest-difficulty-${quest.difficulty}`, getDifficultyLabel(quest.difficulty)));
  content.appendChild(header);

  // Requirements as granular bullet list
  const stabled = getStabledDragons();

  for (const req of quest.requirements) {
    // Check if any stabled dragon meets this specific requirement
    let anyMet = false;
    for (const dragon of stabled) {
      const status = getRequirementStatus(dragon, quest);
      const reqStatus = status.find(r => r.label === req.label);
      if (reqStatus && reqStatus.met) { anyMet = true; break; }
    }

    // Main requirement row: dot + label
    const row = el('div', 'quest-widget-req');
    const dot = el('span', anyMet ? 'quest-widget-dot met' : 'quest-widget-dot', anyMet ? '✓' : '●');
    row.appendChild(dot);
    row.appendChild(el('span', 'quest-widget-req-label', req.label));
    content.appendChild(row);

    // Show axis hints below if available
    if (req.hintType === 'specialty' && req.hintColor && req.hintFinish) {
      // Specialty: color axes + finish axes
      const hintRow1 = el('div', 'quest-widget-hint');
      renderColoredAxes(hintRow1, req.hintColor);
      content.appendChild(hintRow1);
      const hintRow2 = el('div', 'quest-widget-hint');
      renderColoredAxes(hintRow2, req.hintFinish);
      content.appendChild(hintRow2);
    } else if (req.hintType === 'modifier' && req.hintFinish && req.hintElement) {
      // Modifier: finish axes + element axes
      const hintRow1 = el('div', 'quest-widget-hint');
      renderColoredAxes(hintRow1, req.hintFinish);
      content.appendChild(hintRow1);
      const hintRow2 = el('div', 'quest-widget-hint');
      renderColoredAxes(hintRow2, req.hintElement);
      content.appendChild(hintRow2);
    } else if (req.hint && (req.hintType === 'color' || req.hintType === 'element' || req.hintType === 'finish')) {
      // Single-system axis hint
      const hintRow = el('div', 'quest-widget-hint');
      renderColoredAxes(hintRow, req.hint);
      content.appendChild(hintRow);
    }
  }
}
