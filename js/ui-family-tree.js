// Family tree visualization — Absolutely-positioned Pedigree with SVG lines
//
// Every child has its Sire (left) and Dam (right) directly above it,
// connected by drawn SVG lines. Nodes are real DOM elements positioned
// absolutely inside a scrollable container, with an SVG layer behind
// them for the connecting lines.
//
// When a dragon appears multiple times (shared ancestor / inbreeding),
// the SHALLOWEST instance (closest to the subject) is "primary"
// (full opacity + full size) and deeper appearances are "echo"
// (smaller, translucent, dotted border). Wavy colored lines connect
// all instances of the same dragon for visual tracing.
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
let cardBgBase = '#2a2420'; // resolved from --bg-card at render time

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
    siblings: [],   // other children of same parents grouped here
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

/**
 * Post-process: merge siblings that share the same parents.
 * When two nodes at the same depth have identical parentIds, keep one as
 * the "anchor" with the shared parent subtree, and move the others into
 * anchor.siblings[]. Their parentA/parentB are nulled out so the layout
 * doesn't duplicate the parent subtrees.
 */
function mergeSiblings(tree) {
  const allByDepth = new Map(); // depth → [node]
  collectByDepth(tree, allByDepth);

  for (const [, nodes] of allByDepth) {
    // Group by parentIds key (sorted pair)
    const groups = new Map();
    for (const n of nodes) {
      if (!n.dragon.parentIds) continue;
      const key = n.dragon.parentIds[0] + ':' + n.dragon.parentIds[1];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    }

    for (const [, group] of groups) {
      if (group.length < 2) continue;
      // Use the first node as anchor — it keeps its parentA/parentB
      const anchor = group[0];
      for (let i = 1; i < group.length; i++) {
        const sib = group[i];
        anchor.siblings.push(sib);
        // Remove the sibling's parent subtrees (anchor owns them now)
        sib.parentA = null;
        sib.parentB = null;
      }
    }
  }
}

function collectByDepth(node, map) {
  if (!map.has(node.depth)) map.set(node.depth, []);
  map.get(node.depth).push(node);
  if (node.parentA) collectByDepth(node.parentA, map);
  if (node.parentB) collectByDepth(node.parentB, map);
  for (const sib of (node.siblings || [])) {
    collectByDepth(sib, map);
  }
}

function markPrimaryInstances(allNodes) {
  for (const [, nodes] of allNodes) {
    if (nodes.length === 1) {
      nodes[0].isPrimary = true;
    } else {
      // Shallowest instance (closest to subject) is primary
      let shallowest = nodes[0];
      for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].depth < shallowest.depth) shallowest = nodes[i];
      }
      for (const n of nodes) {
        n.isPrimary = (n === shallowest);
        if (!n.isPrimary) n.primaryNodeId = shallowest.nodeId;
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

  // Also size any siblings
  for (const sib of node.siblings) {
    const sd = nodeDims(sib);
    sib.w = sd.w;
    sib.h = sd.h;
  }

  // Leaf: no parents and no siblings with parents → place at startX
  if (!node.parentA && !node.parentB) {
    node.x = startX;
    // Place siblings side-by-side (they also have no parents since they were merged)
    let cursor = startX + w;
    for (const sib of node.siblings) {
      cursor += COL_GAP;
      sib.x = cursor;
      cursor += sib.w;
    }
    const totalSibW = node.siblings.length > 0 ? (cursor - startX) : w;
    return totalSibW;
  }

  // Layout parent subtrees first
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

  const totalParentW = leftW + (node.parentA && node.parentB ? COL_GAP : 0) + rightW;

  // Calculate total width of this node + all siblings
  const allChildren = [node, ...node.siblings];
  const totalChildrenW = allChildren.reduce((sum, c) => sum + c.w, 0)
    + (allChildren.length - 1) * COL_GAP;

  const totalW = Math.max(totalParentW, totalChildrenW);

  // Center all children (node + siblings) under the parent subtree
  const groupCenter = startX + totalW / 2;
  const groupStart = groupCenter - totalChildrenW / 2;

  let childCursor = groupStart;
  for (const child of allChildren) {
    child.x = childCursor;
    childCursor += child.w + COL_GAP;
  }

  return Math.max(totalW, w);
}

/**
 * Assign y positions. Subject (depth 0) at bottom, ancestors above.
 */
function layoutY(node, maxDepth) {
  const row = maxDepth - node.depth; // row 0 = topmost ancestors
  node.y = row * (NODE_H + ROW_GAP);

  // Siblings share the same y
  for (const sib of node.siblings) {
    sib.y = node.y;
  }

  if (node.parentA) layoutY(node.parentA, maxDepth);
  if (node.parentB) layoutY(node.parentB, maxDepth);
}

function getMaxDepth(node) {
  let d = node.depth;
  if (node.parentA) d = Math.max(d, getMaxDepth(node.parentA));
  if (node.parentB) d = Math.max(d, getMaxDepth(node.parentB));
  for (const sib of node.siblings) d = Math.max(d, sib.depth);
  return d;
}

function getExtent(node) {
  let maxX = node.x + node.w;
  let maxY = node.y + node.h;
  for (const sib of node.siblings) {
    maxX = Math.max(maxX, sib.x + sib.w);
    maxY = Math.max(maxY, sib.y + sib.h);
  }
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
 * Normal (single child):
 *    [Sire]          [Dam]
 *      |                |
 *      └───────┬────────┘
 *              |
 *           [Child]
 *
 * Sibling group:
 *    [Sire]         [Dam]
 *      |              |
 *      └──────┬───────┘
 *             |
 *    ┌────────┼────────┐
 * [Sib A]  [Sib B]  [Sib C]
 */
function drawConnectors(svg, node) {
  if (!node.parentA && !node.parentB) return;

  const allChildren = [node, ...node.siblings];

  if (allChildren.length > 1) {
    // Sibling group: draw bracket from parents down to all children
    const midY = node.y - ROW_GAP / 2;
    const branchY = node.y - ROW_GAP * 0.25; // horizontal bar across siblings

    // Find the center of the sibling group for the vertical trunk
    const leftmost = allChildren[0];
    const rightmost = allChildren[allChildren.length - 1];
    const groupCx = (leftmost.x + leftmost.w / 2 + rightmost.x + rightmost.w / 2) / 2;

    // Vertical trunk from parents' midpoint down to branch bar
    svgLine(svg, groupCx, midY, groupCx, branchY, false);

    // Horizontal bar spanning all siblings
    const barLeft = leftmost.x + leftmost.w / 2;
    const barRight = rightmost.x + rightmost.w / 2;
    svgLine(svg, barLeft, branchY, barRight, branchY, false);

    // Vertical drops from bar down to each child
    for (const child of allChildren) {
      const cx = child.x + child.w / 2;
      svgLine(svg, cx, branchY, cx, child.y, false);
    }

    // Connect up to parents from the midpoint
    for (const parent of [node.parentA, node.parentB]) {
      if (!parent) continue;
      const pCx = parent.x + parent.w / 2;
      const pBottom = parent.y + parent.h;
      const dashed = !parent.isPrimary;

      svgLine(svg, groupCx, midY, pCx, midY, dashed);
      svgLine(svg, pCx, midY, pCx, pBottom, dashed);
    }
  } else {
    // Single child: original connector pattern
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
  }

  // Recurse into parents (siblings don't have parents — they were merged)
  if (node.parentA) drawConnectors(svg, node.parentA);
  if (node.parentB) drawConnectors(svg, node.parentB);
}

// ─── Wavy Duplicate Connector Lines ─────────────────────────
// When a dragon appears multiple times, draw a wavy (sinusoidal)
// path between each pair of instances, colored in their gen color.

function drawDuplicateLinks(svg, allNodes) {
  for (const [, nodes] of allNodes) {
    if (nodes.length < 2) continue;

    // Sort by depth so we connect shallowest → deepest in order
    const sorted = [...nodes].sort((a, b) => a.depth - b.depth);
    // Use the dragon's actual body color for the wavy link
    const color = sorted[0].dragon.phenotype.color.hex || GEN_COLORS[Math.min(sorted[0].dragon.generation, 5)];

    // Connect each consecutive pair
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];

      const x1 = from.x + from.w / 2;
      const y1 = from.y + from.h / 2;
      const x2 = to.x + to.w / 2;
      const y2 = to.y + to.h / 2;

      // Build a wavy SVG path (sinusoidal)
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const waves = Math.max(3, Math.round(dist / 40)); // ~1 wave per 40px
      const amplitude = 8; // wave amplitude in px

      // Unit perpendicular vector
      const px = -dy / dist;
      const py = dx / dist;

      let d = `M ${x1} ${y1}`;
      const steps = waves * 8; // smooth curve
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const lx = x1 + dx * t;
        const ly = y1 + dy * t;
        const wave = Math.sin(t * waves * Math.PI * 2) * amplitude;
        const fx = lx + px * wave;
        const fy = ly + py * wave;
        d += ` L ${fx.toFixed(1)} ${fy.toFixed(1)}`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '4,2');
      path.setAttribute('opacity', '0.5');
      svg.appendChild(path);
    }
  }
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

  // Generation color — opaque background so SVG lines don't bleed through
  const genIdx = Math.min(node.dragon.generation, 5);
  const genColor = GEN_COLORS[genIdx];
  card.style.borderColor = genColor;
  card.style.background = blendOver(cardBgBase, genColor, 0.08);

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
    card.appendChild(el('div', 'ped-echo-label', '↙ see below'));
  }

  // Click
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!node.isPrimary && node.primaryNodeId) {
      const target = document.querySelector(`[data-node-id="${node.primaryNodeId}"]`);
      if (target) {
        // Use zoom-aware panning instead of scrollIntoView
        const scrollEl = target.closest('.family-tree-container');
        if (scrollEl && scrollEl._zoomPanTo) {
          scrollEl._zoomPanTo(
            parseInt(target.style.left),
            parseInt(target.style.top),
            parseInt(target.style.width),
            parseInt(target.style.height)
          );
        }
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
  // Include grouped siblings
  for (const sib of node.siblings) {
    out.push(sib);
  }
  if (node.parentA) flattenTree(node.parentA, out);
  if (node.parentB) flattenTree(node.parentB, out);
  return out;
}

// ─── Main Entry Point ───────────────────────────────────────

export function openFamilyTree(dragon, registry) {
  nodeCounter = 0;

  // Resolve card background color once (handles light/dark theme)
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-card').trim();
  if (resolved) cardBgBase = resolved;

  // 1. Build data tree
  const allNodes = new Map();
  const tree = buildFullTree(dragon, registry, 0, allNodes);
  mergeSiblings(tree);       // group siblings from same parents
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
  `;

  // SVG line layer (behind cards)
  const svg = createSVG(stageW, stageH);
  drawConnectors(svg, tree);
  drawDuplicateLinks(svg, allNodes);
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
  closeBtn.addEventListener('click', () => {
    // Clean up window-level listeners by removing overlay
    overlay.remove();
  });
  closeRow.appendChild(closeBtn);
  panel.appendChild(closeRow);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);

  // Attach zoom & pan (replaces simple scroll-to-bottom)
  attachZoomPan(scroll, stage);
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

// ─── Zoom & Pan ─────────────────────────────────────────────
// Adds pinch-to-zoom, two-finger pan, and scroll-wheel zoom
// to the family tree container. Works on mobile and desktop.

function attachZoomPan(scrollEl, stage) {
  let scale = 1;
  let panX = 0;
  let panY = 0;
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 2.5;

  // AbortController for window-level listeners — cleaned up when overlay closes
  const ac = new AbortController();
  const sig = ac.signal;

  // Apply current transform
  function applyTransform() {
    stage.style.transformOrigin = '0 0';
    stage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  // Clamp pan so stage doesn't fly off-screen entirely
  function clampPan() {
    const cw = scrollEl.clientWidth;
    const ch = scrollEl.clientHeight;
    const sw = stage.offsetWidth * scale;
    const sh = stage.offsetHeight * scale;

    // Allow panning so at least 60px of the stage remains visible
    const margin = 60;
    panX = Math.max(-(sw - margin), Math.min(cw - margin, panX));
    panY = Math.max(-(sh - margin), Math.min(ch - margin, panY));
  }

  // ── Touch gesture state ──
  let touches = [];       // active touch points
  let lastDist = 0;       // pinch distance
  let lastMidX = 0;
  let lastMidY = 0;
  let isDragging = false;

  function getTouchDist(t) {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  scrollEl.addEventListener('touchstart', (e) => {
    touches = [...e.touches];
    if (touches.length === 2) {
      lastDist = getTouchDist(touches);
      lastMidX = (touches[0].clientX + touches[1].clientX) / 2;
      lastMidY = (touches[0].clientY + touches[1].clientY) / 2;
    } else if (touches.length === 1) {
      lastMidX = touches[0].clientX;
      lastMidY = touches[0].clientY;
    }
    isDragging = true;
  }, { passive: false });

  scrollEl.addEventListener('touchmove', (e) => {
    e.preventDefault();   // prevent browser scroll/zoom
    touches = [...e.touches];

    if (touches.length === 2) {
      // Pinch zoom
      const dist = getTouchDist(touches);
      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;

      if (lastDist > 0) {
        const ratio = dist / lastDist;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * ratio));

        // Zoom toward the pinch center
        const rect = scrollEl.getBoundingClientRect();
        const ox = midX - rect.left;
        const oy = midY - rect.top;

        panX = ox - (ox - panX) * (newScale / scale);
        panY = oy - (oy - panY) * (newScale / scale);
        scale = newScale;
      }

      // Also pan with two-finger drag
      panX += midX - lastMidX;
      panY += midY - lastMidY;

      lastDist = dist;
      lastMidX = midX;
      lastMidY = midY;
    } else if (touches.length === 1 && isDragging) {
      // Single-finger pan
      panX += touches[0].clientX - lastMidX;
      panY += touches[0].clientY - lastMidY;
      lastMidX = touches[0].clientX;
      lastMidY = touches[0].clientY;
    }

    clampPan();
    applyTransform();
  }, { passive: false });

  scrollEl.addEventListener('touchend', (e) => {
    touches = [...e.touches];
    if (touches.length === 0) {
      isDragging = false;
      lastDist = 0;
    } else if (touches.length === 1) {
      lastMidX = touches[0].clientX;
      lastMidY = touches[0].clientY;
      lastDist = 0;
    }
  });

  // ── Mouse wheel zoom (desktop) ──
  scrollEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = scrollEl.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));

    panX = ox - (ox - panX) * (newScale / scale);
    panY = oy - (oy - panY) * (newScale / scale);
    scale = newScale;

    clampPan();
    applyTransform();
  }, { passive: false });

  // ── Mouse drag pan (desktop) ──
  let mouseDown = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  scrollEl.addEventListener('mousedown', (e) => {
    // Don't interfere with card clicks
    if (e.target.closest('.ped-node')) return;
    mouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    scrollEl.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    panX += e.clientX - mouseStartX;
    panY += e.clientY - mouseStartY;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    clampPan();
    applyTransform();
  }, { signal: sig });

  window.addEventListener('mouseup', () => {
    if (mouseDown) {
      mouseDown = false;
      scrollEl.style.cursor = '';
    }
  }, { signal: sig });

  // Clean up window listeners when the overlay is removed from DOM
  const overlay = scrollEl.closest('.family-tree-overlay');
  if (overlay) {
    const observer = new MutationObserver(() => {
      if (!document.contains(overlay)) {
        ac.abort();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
  }

  // ── Zoom buttons ──
  const controls = el('div', 'tree-zoom-controls');

  const btnIn = el('button', 'tree-zoom-btn', '+');
  btnIn.addEventListener('click', () => {
    zoomBy(1.25);
  });

  const btnOut = el('button', 'tree-zoom-btn', '−');
  btnOut.addEventListener('click', () => {
    zoomBy(0.8);
  });

  const btnReset = el('button', 'tree-zoom-btn', '⌂');
  btnReset.addEventListener('click', () => {
    fitToView();
  });

  controls.appendChild(btnOut);
  controls.appendChild(btnReset);
  controls.appendChild(btnIn);
  scrollEl.appendChild(controls);

  function zoomBy(factor) {
    const rect = scrollEl.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    panX = cx - (cx - panX) * (newScale / scale);
    panY = cy - (cy - panY) * (newScale / scale);
    scale = newScale;
    clampPan();
    applyTransform();
  }

  // Fit entire tree into view and center it
  function fitToView() {
    const cw = scrollEl.clientWidth;
    const ch = scrollEl.clientHeight;
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;

    scale = Math.min(cw / sw, ch / sh, 1);
    scale = Math.max(MIN_SCALE, scale);

    panX = (cw - sw * scale) / 2;
    panY = (ch - sh * scale) / 2;
    applyTransform();
  }

  // Expose panTo so echo clicks can navigate within the zoom view
  scrollEl._zoomPanTo = function(nodeX, nodeY, nodeW, nodeH) {
    const cw = scrollEl.clientWidth;
    const ch = scrollEl.clientHeight;
    // Center the target node in the viewport
    panX = cw / 2 - (nodeX + nodeW / 2) * scale;
    panY = ch / 2 - (nodeY + nodeH / 2) * scale;
    clampPan();
    applyTransform();
  };

  // Initially fit-to-view after a frame so dimensions are computed
  requestAnimationFrame(() => {
    fitToView();
    // Then scroll to bottom (subject) — adjust panY so subject is visible
    const subjectY = stage.offsetHeight * scale + panY;
    const ch = scrollEl.clientHeight;
    if (subjectY > ch) {
      panY -= (subjectY - ch) + 20;
      clampPan();
      applyTransform();
    }
  });
}

// ─── Utility ────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Blend a hex color at a given alpha over a base hex color, return opaque hex.
 * Used to create solid card backgrounds so SVG lines don't bleed through.
 */
function blendOver(baseHex, fgHex, alpha) {
  const b = hexToRgbArr(baseHex);
  const f = hexToRgbArr(fgHex);
  const r = Math.round(b[0] * (1 - alpha) + f[0] * alpha);
  const g = Math.round(b[1] * (1 - alpha) + f[1] * alpha);
  const bl = Math.round(b[2] * (1 - alpha) + f[2] * alpha);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgbArr(color) {
  // Handle rgb(r, g, b) from getComputedStyle
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) return [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]];
  // Handle hex
  const h = color.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}
