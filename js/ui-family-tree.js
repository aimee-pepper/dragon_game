// Family tree visualization popup
// Shows ancestor tree with compact dragon sprites, clickable for detail view
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragonCard } from './ui-card.js';

const MAX_DEPTH = 4; // up to great-great-grandparents (5 rows total)
const MOBILE_MAX_DEPTH = 2; // grandparents only on mobile (fits ~320px)
const MOBILE_BREAKPOINT = 600;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Build the ancestor data structure by traversing parentIds.
 * Returns a tree node: { dragon, parentA: node|null, parentB: node|null, truncated: boolean }
 */
function buildAncestorTree(dragon, registry, depth = 0, maxDepth = MAX_DEPTH, visited = new Set()) {
  const node = {
    dragon,
    parentA: null,
    parentB: null,
    truncated: false,
  };

  // Safety: prevent circular refs and limit depth
  if (depth >= maxDepth || !dragon.parentIds || visited.has(dragon.id)) {
    // Mark as truncated if this dragon has parents we're not showing
    if (dragon.parentIds && depth >= maxDepth) {
      node.truncated = true;
    }
    return node;
  }
  visited.add(dragon.id);

  const [parentAId, parentBId] = dragon.parentIds;
  const parentADragon = registry.get(parentAId);
  const parentBDragon = registry.get(parentBId);

  if (parentADragon) {
    node.parentA = buildAncestorTree(parentADragon, registry, depth + 1, maxDepth, visited);
  }
  if (parentBDragon) {
    node.parentB = buildAncestorTree(parentBDragon, registry, depth + 1, maxDepth, visited);
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

  // On mobile, clamp depth so the tree fits on screen
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const effectiveDepth = isMobile ? MOBILE_MAX_DEPTH : MAX_DEPTH;

  // Build and render tree
  const tree = buildAncestorTree(dragon, registry, 0, effectiveDepth);
  const treeContainer = el('div', 'family-tree-container');
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
  });

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
  wrapper.appendChild(renderDragonNode(node.dragon, registry, node.truncated));

  return wrapper;
}

/**
 * Render a single dragon node in the tree.
 * Shows: scaled compact sprite, name, generation.
 * Clickable to open ancestor detail popup.
 * If truncated=true, shows a "..." indicator for deeper ancestors.
 */
function renderDragonNode(dragon, registry, truncated = false) {
  const node = el('div', 'tree-node');
  if (truncated) node.classList.add('tree-node-truncated');

  // Compact sprite, scaled down via CSS
  const sprite = renderDragonSprite(dragon.phenotype, true);
  sprite.classList.add('tree-sprite');
  node.appendChild(sprite);

  // Name + gen label
  const label = el('div', 'tree-node-label');
  label.appendChild(el('div', 'tree-node-name', dragon.name));
  label.appendChild(el('div', 'tree-node-gen', `Gen ${dragon.generation}`));
  if (truncated) {
    label.appendChild(el('div', 'tree-node-more', '⋯ tap for more'));
  }
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
