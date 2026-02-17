// Family tree visualization popup — Vertical Cascade Layout
// Shows ancestor tree as an indented cascade (like a file tree).
// Subject at top, ancestors expand downward with CSS border-based connectors.
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragonCard } from './ui-card.js';

const MAX_DEPTH = 6; // up to great-great-great-great-grandparents
const DEFAULT_EXPANDED_DEPTH = 2; // depths 0-2 expanded, 3+ collapsed

let nodeCounter = 0; // unique node IDs for targeting

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Build the ancestor data structure by traversing parentIds.
 * Uses a Map to track duplicate ancestors — first occurrence renders
 * normally, subsequent ones become compact reference nodes.
 *
 * Returns: { tree, occurrences }
 *   tree: { dragon, nodeId, parentA, parentB, isReference, firstNodeId }
 *   occurrences: Map<dragonId, { count, firstNodeId }>
 */
function buildAncestorTree(dragon, registry, depth = 0, occurrences = null) {
  if (!occurrences) occurrences = new Map();

  const nodeId = `tree-node-${nodeCounter++}`;

  const node = {
    dragon,
    nodeId,
    parentA: null,
    parentB: null,
    isReference: false,
    firstNodeId: null,
  };

  // Check if we've seen this dragon before
  if (occurrences.has(dragon.id)) {
    // Duplicate — create a compact reference node
    const entry = occurrences.get(dragon.id);
    entry.count++;
    node.isReference = true;
    node.firstNodeId = entry.firstNodeId;
    return { tree: node, occurrences };
  }

  // First occurrence — record it
  occurrences.set(dragon.id, { count: 1, firstNodeId: nodeId });

  // Safety: limit depth
  if (depth >= MAX_DEPTH || !dragon.parentIds) {
    return { tree: node, occurrences };
  }

  const [parentAId, parentBId] = dragon.parentIds;
  const parentADragon = registry.get(parentAId);
  const parentBDragon = registry.get(parentBId);

  if (parentADragon) {
    const result = buildAncestorTree(parentADragon, registry, depth + 1, occurrences);
    node.parentA = result.tree;
  }
  if (parentBDragon) {
    const result = buildAncestorTree(parentBDragon, registry, depth + 1, occurrences);
    node.parentB = result.tree;
  }

  return { tree: node, occurrences };
}

/**
 * Open the family tree popup for a given dragon.
 */
export function openFamilyTree(dragon, registry) {
  // Reset node counter for fresh IDs
  nodeCounter = 0;

  const overlay = el('div', 'picker-overlay family-tree-overlay');
  const panel = el('div', 'picker-panel family-tree-panel');

  // Title
  panel.appendChild(el('div', 'picker-title', `${dragon.name}'s Lineage`));

  // Generation info
  const genText = dragon.generation === 0
    ? 'Generation 0 (Wild)'
    : `Generation ${dragon.generation}`;
  panel.appendChild(el('div', 'family-tree-gen-info', genText));

  // Build and render tree
  const { tree } = buildAncestorTree(dragon, registry);
  const treeContainer = el('div', 'family-tree-container cascade-tree');
  treeContainer.appendChild(renderCascadeNode(tree, registry, 0, true));
  panel.appendChild(treeContainer);

  // Generation legend
  const legend = renderGenerationLegend(dragon.generation);
  if (legend) panel.appendChild(legend);

  // Close button
  const closeRow = el('div', 'picker-close');
  const closeBtn = el('button', 'btn btn-secondary', 'Close');
  closeBtn.addEventListener('click', () => overlay.remove());
  closeRow.appendChild(closeBtn);
  panel.appendChild(closeRow);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

/**
 * Render a single cascade node recursively.
 * Each node is a .cascade-group containing:
 *   - .cascade-row (connector gutter + node content + optional toggle)
 *   - .cascade-children (indented container for parent nodes, if any)
 */
function renderCascadeNode(node, registry, depth = 0, isLast = true) {
  const group = el('div', 'cascade-group');
  if (isLast) group.classList.add('cascade-last');
  group.setAttribute('data-depth', depth);

  const row = el('div', 'cascade-row');

  // Reference node (duplicate ancestor)
  if (node.isReference) {
    row.appendChild(renderCascadeRefContent(node.dragon, node.nodeId, node.firstNodeId, registry));
    group.appendChild(row);
    return group;
  }

  // Regular dragon node content
  row.appendChild(renderCascadeDragonContent(node.dragon, node.nodeId, registry));

  // Does this node have parents to show?
  const hasParents = node.parentA || node.parentB;

  if (hasParents) {
    // Toggle button for expand/collapse
    const defaultExpanded = depth < DEFAULT_EXPANDED_DEPTH;
    const toggle = el('button', 'cascade-toggle');
    toggle.textContent = defaultExpanded ? '−' : '+';
    toggle.setAttribute('aria-label', defaultExpanded ? 'Collapse' : 'Expand');
    row.appendChild(toggle);

    group.appendChild(row);

    // Children container
    const children = el('div', 'cascade-children');
    if (!defaultExpanded) children.classList.add('cascade-collapsed');

    // Parent A
    if (node.parentA) {
      children.appendChild(renderCascadeNode(node.parentA, registry, depth + 1, false));
    } else {
      children.appendChild(renderCascadeUnknown(false));
    }

    // Parent B
    if (node.parentB) {
      children.appendChild(renderCascadeNode(node.parentB, registry, depth + 1, true));
    } else {
      children.appendChild(renderCascadeUnknown(true));
    }

    group.appendChild(children);

    // Toggle click handler
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = children.classList.toggle('cascade-collapsed');
      toggle.textContent = isCollapsed ? '+' : '−';
      toggle.setAttribute('aria-label', isCollapsed ? 'Expand' : 'Collapse');
    });
  } else {
    group.appendChild(row);
  }

  return group;
}

/**
 * Render dragon content for a cascade node.
 * Compact sprite + name + gen label, clickable for detail popup.
 */
function renderCascadeDragonContent(dragon, nodeId, registry) {
  const node = el('div', 'cascade-node');
  node.setAttribute('data-node-id', nodeId);

  // Generation-based border color
  const genClass = 'tree-gen-' + Math.min(dragon.generation, 5);
  node.classList.add(genClass);

  // Wild dragon styling
  if (dragon.generation === 0 && !dragon.parentIds) {
    node.classList.add('cascade-node-wild');
  }

  // Compact sprite
  const sprite = renderDragonSprite(dragon.phenotype, true);
  sprite.classList.add('cascade-sprite');
  node.appendChild(sprite);

  // Name + gen label
  const info = el('div', 'cascade-node-info');
  info.appendChild(el('div', 'cascade-node-name', dragon.name));
  info.appendChild(el('div', 'cascade-node-gen', `Gen ${dragon.generation}`));
  node.appendChild(info);

  // Click → detail popup
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    openAncestorDetail(dragon, registry);
  });

  return node;
}

/**
 * Render a compact reference node for a duplicate ancestor.
 * Shows name + "↗ see above" label. Clicking pulses the first occurrence.
 */
function renderCascadeRefContent(dragon, nodeId, firstNodeId, registry) {
  const node = el('div', 'cascade-node cascade-ref');
  node.setAttribute('data-node-id', nodeId);
  node.setAttribute('data-ref-target', dragon.id);

  // Generation color
  const genClass = 'tree-gen-' + Math.min(dragon.generation, 5);
  node.classList.add(genClass);

  // Wild styling
  if (dragon.generation === 0 && !dragon.parentIds) {
    node.classList.add('cascade-node-wild');
  }

  // Compact sprite
  const sprite = renderDragonSprite(dragon.phenotype, true);
  sprite.classList.add('cascade-sprite');
  node.appendChild(sprite);

  // Name + reference hint
  const info = el('div', 'cascade-node-info');
  info.appendChild(el('div', 'cascade-node-name', dragon.name));
  info.appendChild(el('div', 'cascade-ref-label', '↗ see above'));
  node.appendChild(info);

  // Click → scroll to first occurrence and pulse-highlight it
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    const firstNode = document.querySelector(`[data-node-id="${firstNodeId}"]`);
    if (firstNode) {
      firstNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstNode.classList.add('cascade-highlight');
      setTimeout(() => firstNode.classList.remove('cascade-highlight'), 1500);
    }
  });

  return node;
}

/**
 * Placeholder node for unknown/missing ancestors.
 */
function renderCascadeUnknown(isLast) {
  const group = el('div', 'cascade-group');
  if (isLast) group.classList.add('cascade-last');

  const row = el('div', 'cascade-row');
  const node = el('div', 'cascade-node cascade-unknown');
  node.appendChild(el('div', 'cascade-node-name', '???'));
  row.appendChild(node);
  group.appendChild(row);

  return group;
}

/**
 * Render a small generation legend showing border colors.
 */
function renderGenerationLegend(maxGen) {
  if (maxGen < 1) return null; // Wild dragons don't need a legend

  const legend = el('div', 'tree-legend');
  const title = el('span', 'tree-legend-title', 'Generations: ');
  legend.appendChild(title);

  const genColors = [
    { label: 'Wild', cls: 'tree-gen-0' },
    { label: 'Gen 1', cls: 'tree-gen-1' },
    { label: 'Gen 2', cls: 'tree-gen-2' },
    { label: 'Gen 3', cls: 'tree-gen-3' },
    { label: 'Gen 4', cls: 'tree-gen-4' },
    { label: 'Gen 5+', cls: 'tree-gen-5' },
  ];

  const showCount = Math.min(maxGen + 1, genColors.length);
  for (let i = 0; i < showCount; i++) {
    const item = el('span', 'tree-legend-item');
    const dot = el('span', `tree-legend-dot ${genColors[i].cls}`);
    item.appendChild(dot);
    item.appendChild(document.createTextNode(genColors[i].label));
    legend.appendChild(item);
  }

  return legend;
}

/**
 * Open a detail popup for an ancestor dragon.
 * Shows full dragon card with genotype.
 * Stacks above the family tree overlay (z-index: 250).
 */
function openAncestorDetail(dragon, registry) {
  const overlay = el('div', 'picker-overlay ancestor-detail-overlay');
  const panel = el('div', 'picker-panel ancestor-detail-panel');

  panel.appendChild(el('div', 'picker-title', `${dragon.name} — Details`));

  // Full dragon card with genotype toggle
  const card = renderDragonCard(dragon, { showGenotype: true });
  panel.appendChild(card);

  // "View Full Lineage" button if this dragon has parents
  if (dragon.parentIds) {
    const lineageBtn = el('button', 'btn btn-lineage btn-small', '🌿 View Full Lineage');
    lineageBtn.style.marginBottom = '12px';
    lineageBtn.addEventListener('click', () => {
      overlay.remove();
      // Close the current family tree overlay too
      const currentTree = document.querySelector('.family-tree-overlay');
      if (currentTree) currentTree.remove();
      // Open new tree centered on this ancestor
      openFamilyTree(dragon, registry);
    });
    panel.appendChild(lineageBtn);
  }

  // Close button
  const closeRow = el('div', 'picker-close');
  const closeBtn = el('button', 'btn btn-secondary', 'Close');
  closeBtn.addEventListener('click', () => overlay.remove());
  closeRow.appendChild(closeBtn);
  panel.appendChild(closeRow);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}
