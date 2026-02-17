// Family tree visualization popup
// Shows full ancestor tree with generation-colored borders,
// wild dragon styling, and compact reference nodes for duplicate ancestors.
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragonCard } from './ui-card.js';

const MAX_DEPTH = 6; // up to great-great-great-great-grandparents

let nodeCounter = 0; // unique node IDs for SVG targeting

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
  const { tree, occurrences } = buildAncestorTree(dragon, registry);
  const treeContainer = el('div', 'family-tree-container');
  treeContainer.style.position = 'relative'; // for SVG overlay positioning
  treeContainer.appendChild(renderTreeLevel(tree, registry));
  panel.appendChild(treeContainer);

  // Scroll hint: show if tree overflows horizontally
  requestAnimationFrame(() => {
    if (treeContainer.scrollWidth > treeContainer.clientWidth + 10) {
      const hint = el('div', 'tree-scroll-hint', '← Swipe to see full tree →');
      treeContainer.insertBefore(hint, treeContainer.firstChild);
      treeContainer.addEventListener('scroll', () => {
        if (hint.parentElement) hint.remove();
      }, { once: true });
    }

    // Draw SVG connector lines for duplicate ancestors
    renderDuplicateLinks(treeContainer, occurrences);

    // Re-render SVG on scroll to keep lines aligned
    treeContainer.addEventListener('scroll', () => {
      renderDuplicateLinks(treeContainer, occurrences);
    });
  });

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
 * Render a single tree level recursively.
 * Layout: parents row on top, connector lines, child node below.
 */
function renderTreeLevel(node, registry) {
  const wrapper = el('div', 'tree-level');

  // If this is a reference (duplicate) node, render compact version
  if (node.isReference) {
    wrapper.appendChild(renderReferenceNode(node.dragon, node.nodeId, registry));
    return wrapper;
  }

  // Parents row (if any exist)
  if (node.parentA || node.parentB) {
    const parentsRow = el('div', 'tree-parents-row');

    if (node.parentA) {
      parentsRow.appendChild(renderTreeLevel(node.parentA, registry));
    } else {
      parentsRow.appendChild(renderUnknownNode());
    }

    if (node.parentB) {
      parentsRow.appendChild(renderTreeLevel(node.parentB, registry));
    } else {
      parentsRow.appendChild(renderUnknownNode());
    }

    wrapper.appendChild(parentsRow);

    // Connector lines
    const connector = el('div', 'tree-connector');
    connector.appendChild(el('div', 'tree-line tree-line-left'));
    connector.appendChild(el('div', 'tree-line tree-line-right'));
    connector.appendChild(el('div', 'tree-line tree-line-down'));
    wrapper.appendChild(connector);
  }

  // This dragon's node
  wrapper.appendChild(renderDragonNode(node.dragon, node.nodeId, registry));

  return wrapper;
}

/**
 * Render a single dragon node in the tree.
 * Shows: scaled compact sprite, name, generation.
 * Styled with generation-based border color.
 * Clickable to open ancestor detail popup.
 */
function renderDragonNode(dragon, nodeId, registry) {
  const node = el('div', 'tree-node');
  node.setAttribute('data-node-id', nodeId);

  // Generation-based border color
  const genClass = 'tree-gen-' + Math.min(dragon.generation, 5);
  node.classList.add(genClass);

  // Wild dragon styling (gen 0 with no parents)
  if (dragon.generation === 0 && !dragon.parentIds) {
    node.classList.add('tree-node-wild');
  }

  // Compact sprite, scaled down via CSS
  const sprite = renderDragonSprite(dragon.phenotype, true);
  sprite.classList.add('tree-sprite');
  node.appendChild(sprite);

  // Name + gen label
  const label = el('div', 'tree-node-label');
  label.appendChild(el('div', 'tree-node-name', dragon.name));
  label.appendChild(el('div', 'tree-node-gen', `Gen ${dragon.generation}`));
  node.appendChild(label);

  // Click to open detail popup
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    openAncestorDetail(dragon, registry);
  });

  return node;
}

/**
 * Render a compact reference node for a duplicate ancestor.
 * Smaller, slightly transparent, with "↗ see above" label.
 */
function renderReferenceNode(dragon, nodeId, registry) {
  const node = el('div', 'tree-node tree-node-ref');
  node.setAttribute('data-node-id', nodeId);
  node.setAttribute('data-ref-target', dragon.id);

  // Generation-based border color (same as full node)
  const genClass = 'tree-gen-' + Math.min(dragon.generation, 5);
  node.classList.add(genClass);

  // Wild dragon styling
  if (dragon.generation === 0 && !dragon.parentIds) {
    node.classList.add('tree-node-wild');
  }

  // Compact sprite
  const sprite = renderDragonSprite(dragon.phenotype, true);
  sprite.classList.add('tree-sprite');
  node.appendChild(sprite);

  // Name + reference hint
  const label = el('div', 'tree-node-label');
  label.appendChild(el('div', 'tree-node-name', dragon.name));
  label.appendChild(el('div', 'tree-ref-label', '↗ see above'));
  node.appendChild(label);

  // Click to open detail popup
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    openAncestorDetail(dragon, registry);
  });

  return node;
}

/**
 * Placeholder node for unknown/missing ancestors.
 */
function renderUnknownNode() {
  const wrapper = el('div', 'tree-level');
  const node = el('div', 'tree-node tree-node-unknown');
  const label = el('div', 'tree-node-label');
  label.appendChild(el('div', 'tree-node-name', '???'));
  label.appendChild(el('div', 'tree-node-gen', 'Unknown'));
  node.appendChild(label);
  wrapper.appendChild(node);
  return wrapper;
}

/**
 * Render SVG overlay with dotted lines connecting duplicate reference
 * nodes to their first (full) occurrence in the tree.
 */
function renderDuplicateLinks(container, occurrences) {
  // Remove existing SVG overlay
  const existingSvg = container.querySelector('.tree-svg-overlay');
  if (existingSvg) existingSvg.remove();

  // Find all reference nodes
  const refNodes = container.querySelectorAll('.tree-node-ref');
  if (refNodes.length === 0) return;

  // Create SVG overlay sized to the full scrollable area
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('tree-svg-overlay');
  svg.style.width = container.scrollWidth + 'px';
  svg.style.height = container.scrollHeight + 'px';

  const containerRect = container.getBoundingClientRect();

  refNodes.forEach(refNode => {
    const dragonId = refNode.getAttribute('data-ref-target');
    if (!dragonId) return;

    // Find the first occurrence node
    const entry = occurrences.get(parseInt(dragonId));
    if (!entry) return;

    const firstNode = container.querySelector(`[data-node-id="${entry.firstNodeId}"]`);
    if (!firstNode) return;

    // Get positions relative to the container's scroll area
    const refRect = refNode.getBoundingClientRect();
    const firstRect = firstNode.getBoundingClientRect();

    const x1 = refRect.left - containerRect.left + container.scrollLeft + refRect.width / 2;
    const y1 = refRect.top - containerRect.top + container.scrollTop + refRect.height / 2;
    const x2 = firstRect.left - containerRect.left + container.scrollLeft + firstRect.width / 2;
    const y2 = firstRect.top - containerRect.top + container.scrollTop + firstRect.height / 2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#c4a265'); // accent color
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '4,4');
    line.setAttribute('opacity', '0.5');
    svg.appendChild(line);
  });

  container.appendChild(svg);
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
