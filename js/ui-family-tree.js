// Family tree visualization — Absolutely-positioned Pedigree with SVG lines
//
// Every child has its Sire (left) and Dam (right) directly above it,
// connected by drawn SVG lines. Nodes are real DOM elements positioned
// absolutely inside a scrollable container, with an SVG layer behind
// them for the connecting lines.
//
// When a dragon appears multiple times (shared ancestor / inbreeding),
// the LAST (deepest) instance is "primary" (full opacity + full size)
// and earlier appearances are "echo" (smaller, translucent, dotted border).
//
// Sire/Dam labels appear on the direct parents of the subject dragon.

import { renderDragonSprite } from './ui-dragon-sprite.js';
import { renderDragon } from './sprite-renderer.js';
import { renderDragonCard } from './ui-card.js';
import { getSetting } from './settings.js';

const MAX_DEPTH = 5;   // 0 = subject, up to 5 generations of ancestors

// Layout constants (CSS pixels)
const NODE_W       = 80;   // node card width
const NODE_H       = 96;   // node card height (sprite + name + gen)
const NODE_W_SM    = 64;   // echo / distant node width
const NODE_H_SM    = 78;   // echo / distant node height
const ROW_GAP      = 40;   // vertical gap between generation rows
const COL_GAP      = 10;   // minimum horizontal gap between sibling subtrees
const LINE_COLOR   = '#5a5450';
const ECHO_OPACITY = 0.45;

// Generation border colors
const GEN_COLORS = [
  '#44aa99', // gen 0 — wild (teal)
  '#c4a265', // gen 1 — accent gold
  '#7a8fcc', // gen 2 — periwinkle
  '#cc7acc', // gen 3 — orchid
  '#cc8855', // gen 4 — amber
  '#cc5555', // gen 5+ — coral
];

let nodeCounter = 0;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ─── Tree Data Structure ────────────────────────────────────

function buildFullTree(dragon, registry, depth = 0, allNodes = null) {
  if (!allNodes) allNodes = new Map();

  const nodeId = `tn-${nodeCounter++}`;
  const node = {
    dragon,
    nodeId,
    depth,
    parentA: null,  // sire (left)
    parentB: null,  // dam (right)
    isPrimary: false,
    primaryNodeId: null,
    // Layout fields — filled in by layoutX / layoutY
    x: 0, y: 0, w: 0, h: 0,
  };

  if (!allNodes.has(dragon.id)) allNodes.set(dragon.id, []);
  allNodes.get(dragon.id).push(node);

  if (depth < MAX_DEPTH && dragon.parentIds) {
    const [aId, bId] = dragon.parentIds;
    const aDragon = registry.get(aId);
    const bDragon = registry.get(bId);
    if (aDragon) node.parentA = buildFullTree(aDragon, registry, depth + 1, allNodes);
    if (bDragon) node.parentB = buildFullTree(bDragon, registry, depth + 1, allNodes);
  }

  return node;
}

function markPrimaryInstances(allNodes) {
  for (const [, nodes] of allNodes) {
    if (nodes.length === 1) {
      nodes[0].isPrimary = true;
    } else {
      let deepest = nodes[0];
      for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].depth > deepest.depth) deepest = nodes[i];
      }
      for (const n of nodes) {
        n.isPrimary = (n === deepest);
        if (!n.isPrimary) n.primaryNodeId = deepest.nodeId;
      }
    }
  }
}

// ─── Layout Algorithm ───────────────────────────────────────
// Bottom-up: assign leaf x positions first, then center each
// parent above its two children.

function nodeDims(node) {
  if (node.depth === 0) return { w: NODE_W + 12, h: NODE_H + 8 }; // subject larger
  if (!node.isPrimary) return { w: NODE_W_SM, h: NODE_H_SM };
  return { w: NODE_W, h: NODE_H };
}

/**
 * Assign x positions bottom-up.
 * Returns the total width consumed by this subtree.
 */
function layoutX(node, startX) {
  const { w, h } = nodeDims(node);
  node.w = w;
  node.h = h;

  // Leaf: no parents → place at startX
  if (!node.parentA && !node.parentB) {
    node.x = startX;
    return w;
  }

  let cursor = startX;
  let leftW = 0;
  let rightW = 0;

  if (node.parentA) {
    leftW = layoutX(node.parentA, cursor);
    cursor += leftW;
  }
  if (node.parentA && node.parentB) {
    cursor += COL_GAP;
  }
  if (node.parentB) {
    rightW = layoutX(node.parentB, cursor);
  }

  const totalChildW = leftW + (node.parentA && node.parentB ? COL_GAP : 0) + rightW;

  // Center this node under its children subtree
  const childrenCenter = startX + totalChildW / 2;
  node.x = childrenCenter - w / 2;

  return Math.max(totalChildW, w);
}

/**
 * Assign y positions. Subject (depth 0) at bottom, ancestors above.
 */
function layoutY(node, maxDepth) {
  const row = maxDepth - node.depth; // row 0 = topmost ancestors
  node.y = row * (NODE_H + ROW_GAP);

  if (node.parentA) layoutY(node.parentA, maxDepth);
  if (node.parentB) layoutY(node.parentB, maxDepth);
}

function getMaxDepth(node) {
  let d = node.depth;
  if (node.parentA) d = Math.max(d, getMaxDepth(node.parentA));
  if (node.parentB) d = Math.max(d, getMaxDepth(node.parentB));
  return d;
}

function getExtent(node) {
  let maxX = node.x + node.w;
  let maxY = node.y + node.h;
  if (node.parentA) {
    const e = getExtent(node.parentA);
    maxX = Math.max(maxX, e.maxX);
    maxY = Math.max(maxY, e.maxY);
  }
  if (node.parentB) {
    const e = getExtent(node.parentB);
    maxX = Math.max(maxX, e.maxX);
    maxY = Math.max(maxY, e.maxY);
  }
  return { maxX, maxY };
}

// ─── SVG Line Drawing ───────────────────────────────────────

function createSVG(w, h) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
  return svg;
}

function svgLine(svg, x1, y1, x2, y2, dashed) {
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l.setAttribute('x1', x1);
  l.setAttribute('y1', y1);
  l.setAttribute('x2', x2);
  l.setAttribute('y2', y2);
  l.setAttribute('stroke', LINE_COLOR);
  l.setAttribute('stroke-width', '2');
  if (dashed) {
    l.setAttribute('stroke-dasharray', '5,3');
    l.setAttribute('opacity', '0.45');
  }
  svg.appendChild(l);
}

/**
 * Draw connecting lines: child → horizontal bar → each parent.
 *
 *    [Sire]          [Dam]
 *      |                |
 *      └───────┬────────┘
 *              |
 *           [Child]
 */
function drawConnectors(svg, node) {
  if (!node.parentA && !node.parentB) return;

  const childCx = node.x + node.w / 2;
  const childTop = node.y;
  const midY = childTop - ROW_GAP / 2;

  // Vertical from child top up to midpoint
  svgLine(svg, childCx, childTop, childCx, midY, false);

  // For each parent: horizontal bar + vertical up to parent bottom
  for (const parent of [node.parentA, node.parentB]) {
    if (!parent) continue;
    const pCx = parent.x + parent.w / 2;
    const pBottom = parent.y + parent.h;
    const dashed = !parent.isPrimary;

    svgLine(svg, childCx, midY, pCx, midY, dashed);
    svgLine(svg, pCx, midY, pCx, pBottom, dashed);
  }

  // Recurse
  if (node.parentA) drawConnectors(svg, node.parentA);
  if (node.parentB) drawConnectors(svg, node.parentB);
}

// ─── DOM Node Cards ─────────────────────────────────────────

function renderNodeCard(node, registry, treeOverlay) {
  const card = el('div', 'ped-node');
  card.setAttribute('data-node-id', node.nodeId);
  card.style.cssText = `
    position: absolute;
    left: ${node.x}px;
    top: ${node.y}px;
    width: ${node.w}px;
    height: ${node.h}px;
  `;

  // Generation color
  const genIdx = Math.min(node.dragon.generation, 5);
  card.style.borderColor = GEN_COLORS[genIdx];
  card.style.background = hexToRgba(GEN_COLORS[genIdx], 0.08);

  // Wild → dashed border
  if (node.dragon.generation === 0 && !node.dragon.parentIds) {
    card.style.borderStyle = 'dashed';
  }

  // Subject node
  if (node.depth === 0) {
    card.classList.add('ped-node-subject');
    card.style.borderWidth = '2.5px';
  }

  // Echo styling
  if (!node.isPrimary) {
    card.classList.add('ped-echo');
    card.style.opacity = ECHO_OPACITY;
    card.style.borderStyle = 'dotted';
  }

  // Sprite
  const spriteSize = node.depth === 0 ? 52 : (node.isPrimary ? 38 : 28);
  const spriteWrap = el('div', 'ped-sprite-wrap');
  spriteWrap.style.cssText = `width:${spriteSize}px;margin:0 auto;`;

  const usePixelArt = getSetting('art-style') === 'pixel';
  const pixelSprite = renderDragonSprite(node.dragon.phenotype, true);
  pixelSprite.style.cssText = `width:${spriteSize}px;height:auto;`;
  spriteWrap.appendChild(pixelSprite);

  if (!usePixelArt) {
    renderDragon(node.dragon.phenotype, { compact: true, fallbackToTest: false })
      .then(canvas => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let ok = false;
        for (let i = 3; i < id.data.length; i += 4) {
          if (id.data[i] > 0) { ok = true; break; }
        }
        if (ok) {
          canvas.style.cssText = `width:${spriteSize}px;height:auto;`;
          pixelSprite.replaceWith(canvas);
        }
      });
  }
  card.appendChild(spriteWrap);

  // Name
  card.appendChild(el('div', 'ped-node-name', node.dragon.name));

  // Gen
  card.appendChild(el('div', 'ped-node-gen', `Gen ${node.dragon.generation}`));

  // Echo hint
  if (!node.isPrimary) {
    card.appendChild(el('div', 'ped-echo-label', '↗ see above'));
  }

  // Click
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!node.isPrimary && node.primaryNodeId) {
      const target = document.querySelector(`[data-node-id="${node.primaryNodeId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('ped-highlight');
        setTimeout(() => target.classList.remove('ped-highlight'), 1500);
      }
    } else {
      openAncestorDetail(node.dragon, registry, treeOverlay);
    }
  });

  return card;
}

/** Flatten the tree into a list for rendering. */
function flattenTree(node, out = []) {
  out.push(node);
  if (node.parentA) flattenTree(node.parentA, out);
  if (node.parentB) flattenTree(node.parentB, out);
  return out;
}

// ─── Main Entry Point ───────────────────────────────────────

export function openFamilyTree(dragon, registry) {
  nodeCounter = 0;

  // 1. Build data tree
  const allNodes = new Map();
  const tree = buildFullTree(dragon, registry, 0, allNodes);
  markPrimaryInstances(allNodes);

  // 2. Calculate layout
  const maxDepth = getMaxDepth(tree);
  const treeW = layoutX(tree, 20);        // 20px left padding
  layoutY(tree, maxDepth);

  const ext = getExtent(tree);
  const stageW = Math.max(ext.maxX + 20, 300);
  const stageH = ext.maxY + 20;

  // 3. Build overlay + panel (same pattern as all other overlays)
  const overlay = el('div', 'picker-overlay family-tree-overlay');
  const panel = el('div', 'picker-panel family-tree-panel');

  panel.appendChild(el('div', 'picker-title', `${dragon.name}'s Lineage`));

  const genText = dragon.generation === 0
    ? 'Generation 0 (Wild)'
    : `Generation ${dragon.generation}`;
  panel.appendChild(el('div', 'family-tree-gen-info', genText));

  // 4. Scrollable container
  const scroll = el('div', 'family-tree-container');

  // 5. Positioned stage
  const stage = el('div', 'pedigree-stage');
  stage.style.cssText = `
    position: relative;
    width: ${stageW}px;
    height: ${stageH}px;
    margin: 0 auto;
  `;

  // SVG line layer (behind cards)
  const svg = createSVG(stageW, stageH);
  drawConnectors(svg, tree);
  stage.appendChild(svg);

  // Sire / Dam labels (only for subject's direct parents)
  if (tree.parentA) {
    const lbl = el('div', 'ped-parent-label', 'SIRE');
    lbl.style.cssText = `
      position:absolute;
      left:${tree.parentA.x + tree.parentA.w / 2}px;
      top:${tree.parentA.y - 18}px;
      transform:translateX(-50%);
    `;
    stage.appendChild(lbl);
  }
  if (tree.parentB) {
    const lbl = el('div', 'ped-parent-label', 'DAM');
    lbl.style.cssText = `
      position:absolute;
      left:${tree.parentB.x + tree.parentB.w / 2}px;
      top:${tree.parentB.y - 18}px;
      transform:translateX(-50%);
    `;
    stage.appendChild(lbl);
  }

  // DOM card nodes
  for (const n of flattenTree(tree)) {
    stage.appendChild(renderNodeCard(n, registry, overlay));
  }

  scroll.appendChild(stage);
  panel.appendChild(scroll);

  // Legend
  const legend = renderGenLegend(dragon.generation);
  if (legend) panel.appendChild(legend);

  // Close
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

  // Scroll to bottom so the subject is visible first
  requestAnimationFrame(() => {
    scroll.scrollTop = scroll.scrollHeight;
  });
}

// ─── Generation Legend ───────────────────────────────────────

function renderGenLegend(maxGen) {
  if (maxGen < 1) return null;

  const legend = el('div', 'tree-legend');
  legend.appendChild(el('span', 'tree-legend-title', 'Generations: '));

  const labels = ['Wild', 'Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5+'];
  const count = Math.min(maxGen + 1, labels.length);

  for (let i = 0; i < count; i++) {
    const item = el('span', 'tree-legend-item');
    const dot = el('span', 'tree-legend-dot');
    dot.style.borderColor = GEN_COLORS[i];
    if (i === 0) dot.style.borderStyle = 'dashed';
    item.appendChild(dot);
    item.appendChild(document.createTextNode(labels[i]));
    legend.appendChild(item);
  }
  return legend;
}

// ─── Ancestor Detail Popup ──────────────────────────────────

function openAncestorDetail(dragon, registry, parentOverlay) {
  const overlay = el('div', 'picker-overlay ancestor-detail-overlay');
  const panel = el('div', 'picker-panel ancestor-detail-panel');

  panel.appendChild(el('div', 'picker-title', `${dragon.name} — Details`));

  const card = renderDragonCard(dragon, { showGenotype: true });
  panel.appendChild(card);

  if (dragon.parentIds) {
    const btn = el('button', 'btn btn-lineage btn-small', '🌿 View Full Lineage');
    btn.style.marginBottom = '12px';
    btn.addEventListener('click', () => {
      overlay.remove();
      if (parentOverlay) parentOverlay.remove();
      openFamilyTree(dragon, registry);
    });
    panel.appendChild(btn);
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

// ─── Utility ────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
