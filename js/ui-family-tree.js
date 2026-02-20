// Family tree visualization popup — Classic Bottom-Up Pedigree
// Subject at bottom, ancestors fan out above in rows.
// All generations visible at once — no expand/collapse.
//
// Visual rules:
//   - Every child shows its parents above it (up to MAX_DEPTH)
//   - When a dragon appears multiple times (shared ancestor / inbreeding),
//     the LAST (deepest) instance is full opacity + full size ("primary")
//     and earlier appearances are slightly transparent + smaller ("echo")
//   - Solid lines = direct parent connections
//   - Dotted lines + reduced opacity = echo (earlier repeat) nodes
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
 * Build the full ancestor tree — always expands parents up to MAX_DEPTH,
 * even for dragons that appear multiple times.
 * Collects all node references per dragon ID for the second pass.
 */
function buildFullTree(dragon, registry, depth = 0, allNodes = null) {
  if (!allNodes) allNodes = new Map(); // dragonId → [nodeRef, nodeRef, ...]

  const nodeId = `tree-node-${nodeCounter++}`;
  const node = {
    dragon,
    nodeId,
    depth,
    parentA: null,
    parentB: null,
    isPrimary: false, // will be set in second pass
  };

  // Track this node
  if (!allNodes.has(dragon.id)) allNodes.set(dragon.id, []);
  allNodes.get(dragon.id).push(node);

  // Always expand parents up to depth limit
  if (depth < MAX_DEPTH && dragon.parentIds) {
    const [parentAId, parentBId] = dragon.parentIds;
    const parentADragon = registry.get(parentAId);
    const parentBDragon = registry.get(parentBId);

    if (parentADragon) {
      node.parentA = buildFullTree(parentADragon, registry, depth + 1, allNodes);
    }
    if (parentBDragon) {
      node.parentB = buildFullTree(parentBDragon, registry, depth + 1, allNodes);
    }
  }

  return node;
}

/**
 * Second pass: for each dragon that appears multiple times,
 * mark the LAST (deepest) instance as "primary" (full opacity).
 * Earlier instances become "echoes" (smaller, translucent).
 * Dragons that appear only once are always primary.
 */
function markPrimaryInstances(allNodes) {
  for (const [, nodes] of allNodes) {
    if (nodes.length === 1) {
      nodes[0].isPrimary = true;
    } else {
      // Find the deepest instance — that's the primary
      let deepest = nodes[0];
      for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].depth > deepest.depth) deepest = nodes[i];
      }
      for (const n of nodes) {
        n.isPrimary = (n === deepest);
      }
      // Store the primary's nodeId on echo nodes for click-to-scroll
      for (const n of nodes) {
        if (!n.isPrimary) n.primaryNodeId = deepest.nodeId;
      }
    }
  }
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

  // Build tree (two-pass)
  const allNodes = new Map();
  const tree = buildFullTree(dragon, registry, 0, allNodes);
  markPrimaryInstances(allNodes);

  // Render
  const treeContainer = el('div', 'family-tree-container pedigree-tree');
  treeContainer.appendChild(renderPedigreeNode(tree, registry, 0));
  panel.appendChild(treeContainer);

  // Line legend
  const lineLegend = el('div', 'tree-line-legend');
  const solidItem = el('span', 'tree-line-legend-item');
  solidItem.appendChild(el('span', 'tree-line-solid'));
  solidItem.appendChild(document.createTextNode(' Direct ancestor'));
  lineLegend.appendChild(solidItem);
  const dottedItem = el('span', 'tree-line-legend-item');
  dottedItem.appendChild(el('span', 'tree-line-dotted'));
  dottedItem.appendChild(document.createTextNode(' Shared ancestor (echo)'));
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
 * Parents appear ABOVE the child. Every child shows its parents.
 *
 *   [Parent A]  [Parent B]
 *        └────┬────┘
 *          [Dragon]
 */
function renderPedigreeNode(node, registry, depth) {
  const family = el('div', 'ped-family');

  const hasParents = node.parentA || node.parentB;
  const isEcho = !node.isPrimary;

  if (hasParents) {
    const parents = el('div', 'ped-parents');

    // Parent A branch (Sire — left side)
    const branchA = el('div', 'ped-branch');
    if (depth === 0) branchA.appendChild(el('div', 'ped-parent-label', 'Sire'));
    if (node.parentA) {
      branchA.appendChild(renderPedigreeNode(node.parentA, registry, depth + 1));
    } else {
      branchA.appendChild(renderPedUnknown());
    }
    // Bracket connector
    branchA.appendChild(el('div', 'ped-connector-down'));
    // Echo parent branches get dotted connectors
    if (node.parentA && !node.parentA.isPrimary) {
      branchA.classList.add('ped-branch-dotted');
    }
    parents.appendChild(branchA);

    // Parent B branch (Dam — right side)
    const branchB = el('div', 'ped-branch');
    if (depth === 0) branchB.appendChild(el('div', 'ped-parent-label', 'Dam'));
    if (node.parentB) {
      branchB.appendChild(renderPedigreeNode(node.parentB, registry, depth + 1));
    } else {
      branchB.appendChild(renderPedUnknown());
    }
    branchB.appendChild(el('div', 'ped-connector-down'));
    if (node.parentB && !node.parentB.isPrimary) {
      branchB.classList.add('ped-branch-dotted');
    }
    parents.appendChild(branchB);

    family.appendChild(parents);

    // Vertical connector from horizontal bar down to child
    family.appendChild(el('div', 'ped-vline'));
  }

  // The dragon node at the bottom of this subtree
  const childWrapper = el('div', 'ped-child');

  if (isEcho) {
    childWrapper.appendChild(renderPedEchoContent(node, registry, depth));
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
 * Render dragon content for a PRIMARY pedigree node (full opacity, full size).
 */
function renderPedDragonContent(node, registry, depth) {
  const nodeEl = el('div', 'ped-node');
  nodeEl.setAttribute('data-node-id', node.nodeId);
  nodeEl.setAttribute('data-dragon-id', node.dragon.id);

  const genClass = 'tree-gen-' + Math.min(node.dragon.generation, 5);
  nodeEl.classList.add(genClass);

  // Depth-based sizing: subject (depth 0) is larger
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
 * Render an ECHO node (earlier appearance of a shared ancestor).
 * Slightly smaller, reduced opacity, dotted border.
 * Clicking scrolls to the primary (deepest) instance.
 */
function renderPedEchoContent(node, registry, depth) {
  const nodeEl = el('div', 'ped-node ped-echo');
  nodeEl.setAttribute('data-node-id', node.nodeId);
  nodeEl.setAttribute('data-dragon-id', node.dragon.id);

  const genClass = 'tree-gen-' + Math.min(node.dragon.generation, 5);
  nodeEl.classList.add(genClass);

  if (node.dragon.generation === 0 && !node.dragon.parentIds) {
    nodeEl.classList.add('ped-node-wild');
  }

  nodeEl.appendChild(renderSprite(node.dragon.phenotype, 'ped-sprite'));

  nodeEl.appendChild(el('div', 'ped-node-name', node.dragon.name));
  nodeEl.appendChild(el('div', 'ped-echo-label', '↗ see above'));

  nodeEl.addEventListener('click', (e) => {
    e.stopPropagation();
    // Flash-highlight the primary (deepest) occurrence
    if (node.primaryNodeId) {
      const primaryNode = document.querySelector(`[data-node-id="${node.primaryNodeId}"]`);
      if (primaryNode) {
        primaryNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primaryNode.classList.add('ped-highlight');
        setTimeout(() => primaryNode.classList.remove('ped-highlight'), 1500);
      }
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
