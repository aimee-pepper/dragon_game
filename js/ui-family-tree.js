// Family tree visualization popup — Classic Bottom-Up Pedigree
// Subject at bottom, ancestors fan out above in rows.
// All generations visible at once — no expand/collapse.
//
// Visual rules:
//   - Solid lines = direct parent connections
//   - Dotted lines + reduced opacity = reference (repeat) nodes
//   - First appearance of a dragon = full opacity
//   - Subsequent appearances = smaller portrait, lower opacity, dotted border
//   - Parent portraits slightly smaller than child at depth 0
//   - Sire/Dam labels on direct parents of the subject
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragon } from './sprite-renderer.js';
import { renderDragonCard } from './ui-card.js';
import { getSetting } from './settings.js';

const MAX_DEPTH = 6;

let nodeCounter = 0;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Build the ancestor data structure by traversing parentIds.
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
    occurrenceIndex: 0, // 0 = first, 1+ = subsequent
  };

  if (occurrences.has(dragon.id)) {
    const entry = occurrences.get(dragon.id);
    entry.count++;
    node.isReference = true;
    node.firstNodeId = entry.firstNodeId;
    node.occurrenceIndex = entry.count;
    return { tree: node, occurrences };
  }

  occurrences.set(dragon.id, { count: 0, firstNodeId: nodeId });

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
  const treeContainer = el('div', 'family-tree-container pedigree-tree');
  treeContainer.appendChild(renderPedigreeNode(tree, registry, 0));
  panel.appendChild(treeContainer);

  // Line legend
  const lineLegend = el('div', 'tree-line-legend');
  const solidItem = el('span', 'tree-line-legend-item');
  solidItem.appendChild(el('span', 'tree-line-solid'));
  solidItem.appendChild(document.createTextNode(' Direct parent'));
  lineLegend.appendChild(solidItem);
  const dottedItem = el('span', 'tree-line-legend-item');
  dottedItem.appendChild(el('span', 'tree-line-dotted'));
  dottedItem.appendChild(document.createTextNode(' Repeat ancestor'));
  lineLegend.appendChild(dottedItem);
  panel.appendChild(lineLegend);

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

  // Scroll to bottom so the subject dragon is visible first
  requestAnimationFrame(() => {
    treeContainer.scrollTop = treeContainer.scrollHeight;
  });
}

/**
 * Render a pedigree node recursively (bottom-up).
 * Parents appear ABOVE the child.
 *
 *   [Parent A]  [Parent B]
 *        └────┬────┘
 *          [Dragon]
 */
function renderPedigreeNode(node, registry, depth) {
  const family = el('div', 'ped-family');

  // If has parents, render them ABOVE
  const hasParents = !node.isReference && (node.parentA || node.parentB);

  if (hasParents) {
    const parents = el('div', 'ped-parents');

    // Determine if either parent is a reference (repeat) — use dotted connectors
    const parentAIsRef = node.parentA?.isReference;
    const parentBIsRef = node.parentB?.isReference;

    // Parent A branch
    const branchA = el('div', 'ped-branch');
    if (depth === 0) branchA.appendChild(el('div', 'ped-parent-label', 'Sire'));
    if (node.parentA) {
      branchA.appendChild(renderPedigreeNode(node.parentA, registry, depth + 1));
    } else {
      branchA.appendChild(renderPedUnknown());
    }
    // Add connector style class
    if (parentAIsRef) branchA.classList.add('ped-branch-dotted');
    parents.appendChild(branchA);

    // Parent B branch
    const branchB = el('div', 'ped-branch');
    if (depth === 0) branchB.appendChild(el('div', 'ped-parent-label', 'Dam'));
    if (node.parentB) {
      branchB.appendChild(renderPedigreeNode(node.parentB, registry, depth + 1));
    } else {
      branchB.appendChild(renderPedUnknown());
    }
    if (parentBIsRef) branchB.classList.add('ped-branch-dotted');
    parents.appendChild(branchB);

    // Use dotted horizontal bar if BOTH parents are references
    if (parentAIsRef && parentBIsRef) {
      parents.classList.add('ped-parents-dotted');
    }

    family.appendChild(parents);

    // Vertical connector from horizontal bar down to child
    family.appendChild(el('div', 'ped-vline'));
  }

  // The dragon node at the bottom of this subtree
  const childWrapper = el('div', 'ped-child');

  if (node.isReference) {
    childWrapper.appendChild(renderPedRefContent(node, registry));
  } else {
    childWrapper.appendChild(renderPedDragonContent(node, registry, depth));
  }

  family.appendChild(childWrapper);

  return family;
}

/**
 * Render an unknown ancestor leaf.
 */
function renderPedUnknown() {
  const family = el('div', 'ped-family');
  const childWrapper = el('div', 'ped-child');
  const node = el('div', 'ped-node ped-unknown');
  node.appendChild(el('div', 'ped-node-name', '???'));
  childWrapper.appendChild(node);
  family.appendChild(childWrapper);
  return family;
}

/**
 * Render a compact dragon sprite with async PNG swap.
 * Returns the sprite element (will be swapped when PNG loads).
 */
function renderSprite(phenotype, cssClass) {
  const usePixelArt = getSetting('art-style') === 'pixel';

  const sprite = renderDragonSprite(phenotype, true);
  sprite.classList.add(cssClass);

  // Skip PNG swap if user prefers pixel art
  if (usePixelArt) return sprite;

  // Async PNG sprite swap
  renderDragon(phenotype, { compact: true, fallbackToTest: false }).then(canvas => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let hasPixels = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) { hasPixels = true; break; }
    }
    if (hasPixels) {
      canvas.className = `${cssClass}-canvas`;
      sprite.replaceWith(canvas);
    }
  });

  return sprite;
}

/**
 * Render dragon content for a pedigree node.
 */
function renderPedDragonContent(node, registry, depth) {
  const nodeEl = el('div', 'ped-node');
  nodeEl.setAttribute('data-node-id', node.nodeId);
  nodeEl.setAttribute('data-dragon-id', node.dragon.id);

  const genClass = 'tree-gen-' + Math.min(node.dragon.generation, 5);
  nodeEl.classList.add(genClass);

  // Depth-based sizing: subject (depth 0) is larger, parents are slightly smaller
  if (depth === 0) {
    nodeEl.classList.add('ped-node-subject');
  } else if (depth >= 3) {
    nodeEl.classList.add('ped-node-distant');
  }

  if (node.dragon.generation === 0 && !node.dragon.parentIds) {
    nodeEl.classList.add('ped-node-wild');
  }

  nodeEl.appendChild(renderSprite(node.dragon.phenotype, 'ped-sprite'));

  nodeEl.appendChild(el('div', 'ped-node-name', node.dragon.name));
  nodeEl.appendChild(el('div', 'ped-node-gen', `Gen ${node.dragon.generation}`));

  nodeEl.addEventListener('click', (e) => {
    e.stopPropagation();
    openAncestorDetail(node.dragon, registry);
  });

  return nodeEl;
}

/**
 * Render a reference node (duplicate ancestor).
 * Smaller portrait, reduced opacity, dotted border.
 */
function renderPedRefContent(node, registry) {
  const nodeEl = el('div', 'ped-node ped-ref');
  nodeEl.setAttribute('data-node-id', node.nodeId);
  nodeEl.setAttribute('data-ref-target', node.dragon.id);

  const genClass = 'tree-gen-' + Math.min(node.dragon.generation, 5);
  nodeEl.classList.add(genClass);

  if (node.dragon.generation === 0 && !node.dragon.parentIds) {
    nodeEl.classList.add('ped-node-wild');
  }

  nodeEl.appendChild(renderSprite(node.dragon.phenotype, 'ped-sprite'));

  nodeEl.appendChild(el('div', 'ped-node-name', node.dragon.name));
  nodeEl.appendChild(el('div', 'ped-ref-label', '↗ see above'));

  nodeEl.addEventListener('click', (e) => {
    e.stopPropagation();
    // Flash-highlight the first occurrence
    const firstNode = document.querySelector(`[data-node-id="${node.firstNodeId}"]`);
    if (firstNode) {
      firstNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstNode.classList.add('ped-highlight');
      setTimeout(() => firstNode.classList.remove('ped-highlight'), 1500);
    }
  });

  return nodeEl;
}

/**
 * Render generation legend.
 */
function renderGenerationLegend(maxGen) {
  if (maxGen < 1) return null;

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
 */
function openAncestorDetail(dragon, registry) {
  const overlay = el('div', 'picker-overlay ancestor-detail-overlay');
  const panel = el('div', 'picker-panel ancestor-detail-panel');

  panel.appendChild(el('div', 'picker-title', `${dragon.name} — Details`));

  const card = renderDragonCard(dragon, { showGenotype: true });
  panel.appendChild(card);

  if (dragon.parentIds) {
    const lineageBtn = el('button', 'btn btn-lineage btn-small', '🌿 View Full Lineage');
    lineageBtn.style.marginBottom = '12px';
    lineageBtn.addEventListener('click', () => {
      overlay.remove();
      const currentTree = document.querySelector('.family-tree-overlay');
      if (currentTree) currentTree.remove();
      openFamilyTree(dragon, registry);
    });
    panel.appendChild(lineageBtn);
  }

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
