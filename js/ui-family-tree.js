// Family tree visualization popup
// Shows ancestor tree with compact dragon sprites, clickable for detail view
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragonCard } from './ui-card.js';

const MAX_DEPTH = 4; // up to great-great-grandparents (5 rows total)

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Build the ancestor data structure by traversing parentIds.
 * Returns a tree node: { dragon, parentA: node|null, parentB: node|null }
 */
function buildAncestorTree(dragon, registry, depth = 0, visited = new Set()) {
  const node = {
    dragon,
    parentA: null,
    parentB: null,
  };

  // Safety: prevent circular refs and limit depth
  if (depth >= MAX_DEPTH || !dragon.parentIds || visited.has(dragon.id)) {
    return node;
  }
  visited.add(dragon.id);

  const [parentAId, parentBId] = dragon.parentIds;
  const parentADragon = registry.get(parentAId);
  const parentBDragon = registry.get(parentBId);

  if (parentADragon) {
    node.parentA = buildAncestorTree(parentADragon, registry, depth + 1, visited);
  }
  if (parentBDragon) {
    node.parentB = buildAncestorTree(parentBDragon, registry, depth + 1, visited);
  }

  return node;
}

/**
 * Open the family tree popup for a given dragon.
 */
export function openFamilyTree(dragon, registry) {
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
  const tree = buildAncestorTree(dragon, registry);
  const treeContainer = el('div', 'family-tree-container');
  treeContainer.appendChild(renderTreeLevel(tree, registry));
  panel.appendChild(treeContainer);

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
  wrapper.appendChild(renderDragonNode(node.dragon, registry));

  return wrapper;
}

/**
 * Render a single dragon node in the tree.
 * Shows: scaled compact sprite, name, generation.
 * Clickable to open ancestor detail popup.
 */
function renderDragonNode(dragon, registry) {
  const node = el('div', 'tree-node');

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
