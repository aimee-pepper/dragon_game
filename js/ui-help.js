// Help Guide renderer — collapsible accordion sections with keyword search
// Rendered inside the Almanac tab as the "Help" top-level pane

import { HELP_SECTIONS } from './help-config.js';

// ── State ────────────────────────────────────────────────────

let expandedSections = new Set(); // track which sections are open
let expandedSubsections = new Set(); // track which subsections are open
let searchQuery = '';

// ── Public API ───────────────────────────────────────────────

/**
 * Render the Help Guide into the given container element.
 * Called by ui-almanac.js when the "Help" top tab is active.
 */
export function renderHelpGuide(container) {
  container.innerHTML = '';

  const wrapper = _el('div', 'help-wrapper');

  // Search bar
  const searchBar = _el('div', 'help-search-bar');
  const searchInput = _el('input', 'help-search-input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search help topics...';
  searchInput.value = searchQuery;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderSections(wrapper, searchInput);
  });
  searchBar.appendChild(searchInput);

  const clearBtn = _el('button', 'help-search-clear', '×');
  clearBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    renderSections(wrapper, searchInput);
  });
  searchBar.appendChild(clearBtn);

  wrapper.appendChild(searchBar);

  // Section list
  renderSections(wrapper, searchInput);

  container.appendChild(wrapper);
}

// ── Section rendering ────────────────────────────────────────

function renderSections(wrapper, searchInput) {
  // Remove everything after the search bar
  while (wrapper.children.length > 1) {
    wrapper.removeChild(wrapper.lastChild);
  }

  const filtered = getFilteredSections();

  if (filtered.length === 0 && searchQuery) {
    const empty = _el('div', 'help-empty', 'No matching topics found.');
    wrapper.appendChild(empty);
    return;
  }

  for (const section of filtered) {
    const sectionEl = renderSection(section);
    wrapper.appendChild(sectionEl);
  }
}

function getFilteredSections() {
  if (!searchQuery) return HELP_SECTIONS;

  const query = searchQuery.toLowerCase();
  const results = [];

  for (const section of HELP_SECTIONS) {
    // Check if section title matches
    const sectionMatch = section.title.toLowerCase().includes(query);

    // Check subsections
    const matchingSubs = section.subsections.filter(sub =>
      sub.title.toLowerCase().includes(query) ||
      sub.body.toLowerCase().includes(query)
    );

    if (sectionMatch || matchingSubs.length > 0) {
      results.push({
        ...section,
        subsections: sectionMatch ? section.subsections : matchingSubs,
        _forceExpand: true, // auto-expand when searching
      });
    }
  }

  return results;
}

function renderSection(section) {
  const isExpanded = section._forceExpand || expandedSections.has(section.id);

  const sectionEl = _el('div', 'help-section' + (isExpanded ? ' expanded' : ''));

  // Section header (clickable)
  const header = _el('button', 'help-section-header');
  const arrow = _el('span', 'help-arrow', isExpanded ? '▼' : '▶');
  header.appendChild(arrow);
  header.appendChild(_el('span', 'help-section-icon', section.icon));
  header.appendChild(_el('span', 'help-section-title', section.title));

  header.addEventListener('click', () => {
    if (expandedSections.has(section.id)) {
      expandedSections.delete(section.id);
    } else {
      expandedSections.add(section.id);
    }
    // Re-render just this section
    const newEl = renderSection({ ...section, _forceExpand: false });
    sectionEl.replaceWith(newEl);
  });

  sectionEl.appendChild(header);

  // Subsections (only when expanded)
  if (isExpanded) {
    const content = _el('div', 'help-section-content');

    for (const sub of section.subsections) {
      content.appendChild(renderSubsection(sub, section.id));
    }

    sectionEl.appendChild(content);
  }

  return sectionEl;
}

function renderSubsection(sub, sectionId) {
  const subKey = `${sectionId}/${sub.id}`;
  const isExpanded = expandedSubsections.has(subKey);

  const subEl = _el('div', 'help-subsection' + (isExpanded ? ' expanded' : ''));

  // Subsection header
  const header = _el('button', 'help-sub-header');
  const arrow = _el('span', 'help-arrow', isExpanded ? '▼' : '▶');
  header.appendChild(arrow);
  header.appendChild(_el('span', 'help-sub-title', sub.title));

  header.addEventListener('click', () => {
    if (expandedSubsections.has(subKey)) {
      expandedSubsections.delete(subKey);
    } else {
      expandedSubsections.add(subKey);
    }
    const newEl = renderSubsection(sub, sectionId);
    subEl.replaceWith(newEl);
  });

  subEl.appendChild(header);

  // Body content (only when expanded)
  if (isExpanded) {
    const body = _el('div', 'help-sub-body');
    body.innerHTML = formatBody(sub.body);
    subEl.appendChild(body);
  }

  return subEl;
}

// ── Text formatting ──────────────────────────────────────────

/**
 * Convert body text with simple markdown-like formatting to HTML.
 * Supports: **bold**, bullet lists (• prefix), blank-line paragraph breaks.
 */
function formatBody(text) {
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      // Blank line = paragraph break
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += '<br>';
      continue;
    }

    if (trimmed.startsWith('•')) {
      // Bullet item
      if (!inList) {
        html += '<ul class="help-list">';
        inList = true;
      }
      html += `<li>${formatInline(trimmed.slice(1).trim())}</li>`;
    } else {
      // Regular paragraph line
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<p>${formatInline(trimmed)}</p>`;
    }
  }

  if (inList) html += '</ul>';

  return html;
}

/**
 * Format inline text: **bold** and highlight search terms.
 */
function formatInline(text) {
  // Bold
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Highlight search matches
  if (searchQuery && searchQuery.length >= 2) {
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    result = result.replace(regex, '<mark class="help-highlight">$1</mark>');
  }

  return result;
}

// ── Helpers ──────────────────────────────────────────────────

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}
