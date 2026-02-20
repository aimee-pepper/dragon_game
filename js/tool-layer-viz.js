// Layer Visualizer Tool
// Renders each compositing layer individually for a dragon so you can
// toggle fills/outlines per layer, adjust HSL per layer, and see the
// final composite update live.

import { Dragon } from './dragon.js';
import {
  ASSET_TABLE,
  resolveAssetsForPhenotype,
  COLOR_ADJUSTMENTS,
  WING_TRANSPARENCY,
  BODY_TRANSPARENCY,
  ANCHORS,
} from './sprite-config.js';
import { classifyLevel } from './gene-config.js';

// ── Same helpers as sprite-renderer.js (duplicated to avoid export changes) ──

const FADE_PREFIX_MAP = { 'wing_': 'wingfade_', 'leg_': 'legfade_' };

function getFadeFilename(baseFilename) {
  for (const [prefix, fadePrefix] of Object.entries(FADE_PREFIX_MAP)) {
    if (baseFilename.startsWith(prefix)) {
      return fadePrefix + baseFilename.slice(prefix.length);
    }
  }
  return null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/**
 * Apply color blend with adjustable HSL overrides.
 * @param {ImageData} imageData - pixel data to modify in place
 * @param {object} dragonHsl - { h, s, l } of the dragon's base color
 * @param {number} luminanceShift - added to art pixel luminance
 * @param {object} hslOverrides - { hShift, sShift, lShift } additional tweaks
 */
function applyColorBlendHSL(imageData, dragonHsl, luminanceShift, hslOverrides = {}) {
  const hShift = hslOverrides.hShift || 0;
  const sShift = hslOverrides.sShift || 0;
  const lShift = hslOverrides.lShift || 0;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const artHsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const targetH = ((dragonHsl.h + hShift) % 1 + 1) % 1;
    const targetS = Math.max(0, Math.min(1, dragonHsl.s + sShift));
    const targetL = Math.max(0, Math.min(1, artHsl.l + luminanceShift + lShift));
    const result = hslToRgb(targetH, targetS, targetL);
    data[i] = result.r;
    data[i + 1] = result.g;
    data[i + 2] = result.b;
  }
}

// Simpler version for backward compat
function applyColorBlend(imageData, dragonRgb, luminanceShift = 0) {
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);
  applyColorBlendHSL(imageData, dragonHsl, luminanceShift);
}

// ── Anchor lookup (simplified from sprite-renderer) ──
function getAnchor(filename, ctx = {}) {
  const bodyType = ctx.bodyType || 'standard';
  const pair = ctx.pair;
  const wingCount = ctx.wingCount;
  const limbCount = ctx.limbCount;

  const candidates = [];
  if (pair && wingCount) {
    candidates.push(`${filename}:p${pair}:${bodyType}:${wingCount}w`);
  }
  if (pair && limbCount) {
    candidates.push(`${filename}:p${pair}:${bodyType}:${limbCount}l`);
  }
  candidates.push(`${filename}:${bodyType}`);
  candidates.push(filename);

  for (const key of candidates) {
    if (ANCHORS[key]) return ANCHORS[key];
  }
  return { x: 0, y: 0 };
}

// ── Asset preloader ──
async function preloadAssets(assets) {
  const map = new Map();
  const promises = assets.map(a => {
    const fname = a.filename + '.png';
    if (map.has(fname)) return Promise.resolve();
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { map.set(fname, img); resolve(); };
      img.onerror = () => resolve();
      img.src = `assets/sprites/${fname}`;
    });
  });
  await Promise.all(promises);
  return map;
}

// Full render size
const SPRITE_WIDTH = 2560;
const SPRITE_HEIGHT = 1920;

// ── Core: decompose a dragon into raw layer data ──
// Returns raw (uncolored) canvases + metadata so the UI can re-process
// with custom HSL settings and recomposite live.
async function decomposeIntoLayers(phenotype) {
  const matchedAssets = resolveAssetsForPhenotype(phenotype);
  const bodyTypeName = phenotype.traits.body_type?.name?.toLowerCase() || 'normal';
  const bodyVariant = { 'serpentine': 'sinuous', 'normal': 'standard', 'bulky': 'bulky' }[bodyTypeName] || 'standard';

  const wingGeneVal = phenotype.traits.frame_wings?.rounded ?? 2;
  const limbGeneVal = phenotype.traits.frame_limbs?.rounded ?? 2;
  const WING_COUNT_MAP = { 2: 2, 3: 4, 4: 6 };
  const LIMB_COUNT_MAP = { 1: 2, 2: 4, 3: 6 };
  const actualWingCount = WING_COUNT_MAP[wingGeneVal] || 2;
  const actualLimbCount = LIMB_COUNT_MAP[limbGeneVal] || 4;

  const dragonRgb = phenotype.color.rgb;
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);
  const opacityLevel = classifyLevel(phenotype.finish.levels[0]);
  const bodyAlpha = BODY_TRANSPARENCY[opacityLevel];

  // Collect fade filenames
  const fadeFilenames = new Set();
  for (const asset of matchedAssets) {
    const fadeName = getFadeFilename(asset.filename);
    if (fadeName) fadeFilenames.add(fadeName);
  }
  const hasFadeLayers = fadeFilenames.size > 0;
  const needsFadePass = hasFadeLayers && bodyAlpha < 1.0;

  // Preload
  const fadeEntries = [...fadeFilenames].map(f => ({ filename: f }));
  const assetMap = await preloadAssets([...matchedAssets, ...fadeEntries]);

  // Build group pivots
  const groupPivots = {};
  for (const asset of matchedAssets) {
    if (!asset.pair) continue;
    const pivotCtx = {};
    if (asset.gene === 'wing') {
      pivotCtx.pair = asset.pair; pivotCtx.bodyType = bodyVariant; pivotCtx.wingCount = actualWingCount;
    } else if (asset.gene === 'leg') {
      pivotCtx.pair = asset.pair; pivotCtx.bodyType = bodyVariant; pivotCtx.limbCount = actualLimbCount;
    }
    const groupKey = `${asset.layerGroup}:p${asset.pair}`;
    if (asset.filename.includes('outer') && asset.filename.endsWith('_o') && !groupPivots[groupKey]) {
      const anchor = getAnchor(asset.filename, pivotCtx);
      if (anchor.rot) groupPivots[groupKey] = { x: anchor.x, y: anchor.y, rot: anchor.rot };
    }
  }

  // Process all layers — store RAW (uncolored) canvases + colored versions
  const processedLayers = [];
  for (const asset of matchedAssets) {
    const fullname = asset.filename + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue;

    // Raw canvas (uncolored) — kept for re-processing with HSL sliders
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = img.width; rawCanvas.height = img.height;
    rawCanvas.getContext('2d').drawImage(img, 0, 0);

    // Colored canvas — default color processing
    const offscreen = document.createElement('canvas');
    offscreen.width = img.width; offscreen.height = img.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, 0, 0);

    if (asset.colorMode !== 'fixed') {
      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const adjustment = COLOR_ADJUSTMENTS[asset.colorMode];
      const shift = adjustment ? adjustment.luminanceShift : 0;
      applyColorBlend(imageData, dragonRgb, shift);
      offCtx.putImageData(imageData, 0, 0);
    }

    const anchorCtx = {};
    if (asset.gene === 'wing') {
      anchorCtx.pair = asset.pair; anchorCtx.bodyType = bodyVariant; anchorCtx.wingCount = actualWingCount;
    } else if (asset.gene === 'leg') {
      anchorCtx.pair = asset.pair; anchorCtx.bodyType = bodyVariant; anchorCtx.limbCount = actualLimbCount;
    } else if (['head', 'tail', 'spines'].includes(asset.gene)) {
      anchorCtx.bodyType = bodyVariant;
    }

    const anchor = getAnchor(asset.filename, anchorCtx);
    let anchorX = anchor.x, anchorY = anchor.y;
    const rotation = anchor.rot || 0;

    if (asset.gene === 'horns') {
      const headAnchor = getAnchor('head_o', { bodyType: bodyVariant });
      anchorX += headAnchor.x; anchorY += headAnchor.y;
    }

    const isOutline = asset.opacityMode === 'opaque' && asset.colorMode !== 'fixed';
    const isFixedDetail = asset.colorMode === 'fixed';

    // Mask canvas for Layer 4
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.width; maskCanvas.height = img.height;
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.drawImage(img, 0, 0);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    if (isOutline) {
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] === 0) continue;
        maskData.data[i] = 0; maskData.data[i + 1] = 0; maskData.data[i + 2] = 0;
      }
    } else {
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] === 0) continue;
        maskData.data[i] = 255; maskData.data[i + 1] = 255; maskData.data[i + 2] = 255;
      }
    }
    maskCtx.putImageData(maskData, 0, 0);

    const groupKey = asset.pair ? `${asset.layerGroup}:p${asset.pair}` : null;
    const groupPivot = groupKey ? groupPivots[groupKey] : null;

    processedLayers.push({
      asset, rawCanvas, offscreen, maskCanvas, anchorX, anchorY, rotation,
      isOutline, isFixedDetail, groupPivot,
    });
  }

  // Fade layers — also store raw canvases
  const fadeLayers = [];
  for (const asset of matchedAssets) {
    const fadeName = getFadeFilename(asset.filename);
    if (!fadeName) continue;
    const fullname = fadeName + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue;

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = img.width; rawCanvas.height = img.height;
    rawCanvas.getContext('2d').drawImage(img, 0, 0);

    const offscreen = document.createElement('canvas');
    offscreen.width = img.width; offscreen.height = img.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, 0, 0);
    if (asset.colorMode !== 'fixed') {
      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const adjustment = COLOR_ADJUSTMENTS[asset.colorMode];
      const shift = adjustment ? adjustment.luminanceShift : 0;
      applyColorBlend(imageData, dragonRgb, shift);
      offCtx.putImageData(imageData, 0, 0);
    }

    const baseLayer = processedLayers.find(pl => pl.asset === asset);
    fadeLayers.push({
      asset, rawCanvas, offscreen,
      anchorX: baseLayer.anchorX, anchorY: baseLayer.anchorY,
      rotation: baseLayer.rotation, isOutline: baseLayer.isOutline,
      isFixedDetail: baseLayer.isFixedDetail, groupPivot: baseLayer.groupPivot,
    });
  }

  // Build layerA2 (fade-substituted)
  const fadeLayerMap = new Map();
  for (const fl of fadeLayers) fadeLayerMap.set(fl.asset, fl);
  const layerA2Layers = processedLayers.map(layer => fadeLayerMap.get(layer.asset) || layer);

  return {
    processedLayers, fadeLayers, layerA2Layers, fadeLayerMap,
    bodyAlpha, needsFadePass, dragonRgb, dragonHsl, opacityLevel,
    phenotype, groupPivots,
  };
}

// ── Draw helper ──
function drawToCanvas(targetCtx, sourceCanvas, layer) {
  const { anchorX, anchorY, rotation, groupPivot } = layer;
  const hasRot = Math.abs(rotation) > 0.01;
  targetCtx.save();
  if (groupPivot) {
    targetCtx.translate(groupPivot.x, groupPivot.y);
    targetCtx.rotate(groupPivot.rot * Math.PI / 180);
    targetCtx.translate(-groupPivot.x, -groupPivot.y);
    targetCtx.drawImage(sourceCanvas, anchorX, anchorY);
  } else if (hasRot) {
    const cx = anchorX + sourceCanvas.width / 2;
    const cy = anchorY + sourceCanvas.height / 2;
    targetCtx.translate(cx, cy);
    targetCtx.rotate(rotation * Math.PI / 180);
    targetCtx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
  } else {
    targetCtx.drawImage(sourceCanvas, anchorX, anchorY);
  }
  targetCtx.restore();
}

// ── Re-color a layer's raw canvas with custom HSL ──
function recolorLayer(layer, dragonHsl, hslOverrides) {
  const { rawCanvas, asset } = layer;
  const c = document.createElement('canvas');
  c.width = rawCanvas.width; c.height = rawCanvas.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(rawCanvas, 0, 0);

  if (asset.colorMode !== 'fixed') {
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const adjustment = COLOR_ADJUSTMENTS[asset.colorMode];
    const shift = adjustment ? adjustment.luminanceShift : 0;
    applyColorBlendHSL(imageData, dragonHsl, shift, hslOverrides);
    ctx.putImageData(imageData, 0, 0);
  }
  return c;
}

// ── Render a composite layer canvas from layer list ──
function renderLayerGroup(layers, dragonHsl, filter, hslOverrides) {
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH; c.height = SPRITE_HEIGHT;
  const ctx = c.getContext('2d');
  for (const layer of layers) {
    if (!filter(layer)) continue;
    const colored = recolorLayer(layer, dragonHsl, hslOverrides);
    drawToCanvas(ctx, colored, layer);
  }
  return c;
}

// ── Render Layer 4 (mask trick + uniform grey + darken) ──
function renderLayer4(processedLayers, dragonHsl, hslOverrides) {
  const w = SPRITE_WIDTH, h = SPRITE_HEIGHT;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Render masks in z-order
  for (const layer of processedLayers) {
    drawToCanvas(ctx, layer.maskCanvas, layer);
  }

  // Pixel process
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const brightness = px[i] + px[i + 1] + px[i + 2];
    if (brightness > 384) {
      px[i + 3] = 0;
    } else {
      px[i] = 102; px[i + 1] = 102; px[i + 2] = 102;
    }
  }
  const darkenShift = COLOR_ADJUSTMENTS.darken.luminanceShift;
  applyColorBlendHSL(data, dragonHsl, darkenShift, hslOverrides);
  ctx.putImageData(data, 0, 0);
  return c;
}

// ── Auto-crop helper ──
function autoCrop(canvas, padding = 8) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  let top = canvas.height, left = canvas.width, bottom = 0, right = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (px[(y * canvas.width + x) * 4 + 3] > 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom <= top) return canvas;
  const cx = Math.max(0, left - padding);
  const cy = Math.max(0, top - padding);
  const cw = Math.min(canvas.width, right - left + 1 + padding * 2);
  const ch = Math.min(canvas.height, bottom - top + 1 + padding * 2);
  const cropped = document.createElement('canvas');
  cropped.width = cw; cropped.height = ch;
  cropped.getContext('2d').drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
  return cropped;
}

// ── UI helpers ──
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ── Main UI ──
export function initLayerVisualizer(container) {
  container.innerHTML = '';
  const viz = el('div', 'layer-viz');

  // Controls bar
  const controls = el('div', 'layer-controls');
  const genBtn = el('button', '', 'Generate Dragon');
  controls.appendChild(genBtn);

  const opacityLabel = el('label', '', 'Opacity override: ');
  const opacitySelect = el('select');
  ['Auto', 'None (10%)', 'Low (30%)', 'Med (60%)', 'High (100%)'].forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i === 0 ? 'auto' : [0.10, 0.30, 0.60, 1.0][i - 1];
    opt.textContent = name;
    opacitySelect.appendChild(opt);
  });
  opacityLabel.appendChild(opacitySelect);
  controls.appendChild(opacityLabel);
  viz.appendChild(controls);

  // Layer cards container
  const layerDisplay = el('div', 'layer-display');
  viz.appendChild(layerDisplay);

  // Composite preview
  const compositeSection = el('div', 'composite-preview');
  compositeSection.appendChild(el('h3', '', 'Final Composite'));

  const bgToggle = el('div', 'bg-toggle');
  ['Dark', 'White', 'Checker'].forEach(name => {
    const btn = el('button', name === 'Dark' ? 'active' : '', name);
    btn.addEventListener('click', () => {
      bgToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      compositeCanvas.className = '';
      if (name === 'Checker') compositeCanvas.classList.add('checker-bg');
      else if (name === 'White') compositeCanvas.classList.add('white-bg');
      else compositeCanvas.classList.add('dark-bg');
    });
    bgToggle.appendChild(btn);
  });
  compositeSection.appendChild(bgToggle);

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.className = 'dark-bg';
  compositeCanvas.style.maxWidth = '512px';
  compositeCanvas.style.width = '100%';
  compositeCanvas.style.height = 'auto';
  compositeSection.appendChild(compositeCanvas);
  viz.appendChild(compositeSection);

  container.appendChild(viz);

  // ── State ──
  let currentData = null;
  let currentAlphaOverride = null;

  // Per-layer settings: fills on/off, outlines on/off, HSL shifts
  const layerSettings = {
    layer1:  { fills: true, outlines: true, hShift: 0, sShift: 0, lShift: 0 },
    layer2:  { fills: true, outlines: true, hShift: 0, sShift: 0, lShift: 0 },
    layer3:  { fills: true, outlines: true, hShift: 0, sShift: 0, lShift: 0 },
    face:    { fills: true, outlines: true, hShift: 0, sShift: 0, lShift: 0 },
    layer4:  { fills: true, outlines: true, hShift: 0, sShift: 0, lShift: 0 },
  };

  // ── Recomposite: rebuilds from raw data with current settings ──
  function recomposite() {
    if (!currentData) return;
    const { processedLayers, layerA2Layers, dragonHsl, needsFadePass } = currentData;
    const alpha = currentAlphaOverride !== null ? currentAlphaOverride : currentData.bodyAlpha;
    const w = SPRITE_WIDTH, h = SPRITE_HEIGHT;

    // Render each layer group with its own HSL overrides
    const s1 = layerSettings.layer1;
    const s2 = layerSettings.layer2;
    const s3 = layerSettings.layer3;
    const sFace = layerSettings.face;
    const s4 = layerSettings.layer4;

    // Layer 1: Fills from base
    const l1 = renderLayerGroup(processedLayers, dragonHsl,
      layer => !layer.isOutline && !layer.isFixedDetail && s1.fills,
      { hShift: s1.hShift, sShift: s1.sShift, lShift: s1.lShift });

    // Layer 1: Outlines from base (only used for opaque path)
    const l1o = renderLayerGroup(processedLayers, dragonHsl,
      layer => layer.isOutline && s1.outlines,
      { hShift: s1.hShift, sShift: s1.sShift, lShift: s1.lShift });

    // Layer 2: Outlines from base (for transparent path)
    const l2 = renderLayerGroup(processedLayers, dragonHsl,
      layer => layer.isOutline && s2.outlines,
      { hShift: s2.hShift, sShift: s2.sShift, lShift: s2.lShift });

    // Layer 3: Fills from fade-substituted (no outlines)
    const l3 = renderLayerGroup(layerA2Layers, dragonHsl,
      layer => !layer.isOutline && !layer.isFixedDetail && s3.fills,
      { hShift: s3.hShift, sShift: s3.sShift, lShift: s3.lShift });

    // Face details
    const lFace = renderLayerGroup(processedLayers, dragonHsl,
      layer => layer.isFixedDetail && sFace.fills,
      { hShift: sFace.hShift, sShift: sFace.sShift, lShift: sFace.lShift });

    // Layer 4: Surface outlines
    const l4 = renderLayer4(processedLayers, dragonHsl,
      { hShift: s4.hShift, sShift: s4.sShift, lShift: s4.lShift });

    // ── Composite pipeline ──
    const offscreen = document.createElement('canvas');
    offscreen.width = w; offscreen.height = h;
    const offCtx = offscreen.getContext('2d');

    if (needsFadePass) {
      // Transparent path: fills → outlines → fade fills, merged then stamped
      offCtx.drawImage(l1, 0, 0);
      offCtx.drawImage(l2, 0, 0);
      offCtx.drawImage(l3, 0, 0);
    } else {
      // Opaque path: fills + outlines in one pass
      offCtx.drawImage(l1, 0, 0);
      offCtx.drawImage(l1o, 0, 0);
    }

    // Stamp at body alpha
    const main = document.createElement('canvas');
    main.width = w; main.height = h;
    const mainCtx = main.getContext('2d');
    mainCtx.save();
    mainCtx.globalAlpha = alpha;
    mainCtx.drawImage(offscreen, 0, 0);
    mainCtx.restore();

    // Face at full opacity
    mainCtx.drawImage(lFace, 0, 0);

    // Layer 4 at full opacity (if enabled)
    if (s4.outlines) mainCtx.drawImage(l4, 0, 0);

    // Crop and display
    const cropped = autoCrop(main, 8);
    compositeCanvas.width = cropped.width;
    compositeCanvas.height = cropped.height;
    compositeCanvas.getContext('2d').drawImage(cropped, 0, 0);

    // Update per-layer preview canvases
    updateLayerPreviews();
  }

  // ── Per-layer preview canvases (updated after recomposite) ──
  const previewCanvases = {};

  function updateLayerPreviews() {
    if (!currentData) return;
    const { processedLayers, layerA2Layers, dragonHsl } = currentData;

    const layerDefs = {
      layer1: {
        layers: processedLayers,
        filter: l => !l.isOutline && !l.isFixedDetail,
        settings: layerSettings.layer1, showFills: true, showOutlines: false,
      },
      layer2: {
        layers: processedLayers,
        filter: l => l.isOutline,
        settings: layerSettings.layer2, showFills: false, showOutlines: true,
      },
      layer3: {
        layers: layerA2Layers,
        filter: l => !l.isOutline && !l.isFixedDetail,
        settings: layerSettings.layer3, showFills: true, showOutlines: false,
      },
      face: {
        layers: processedLayers,
        filter: l => l.isFixedDetail,
        settings: layerSettings.face, showFills: true, showOutlines: false,
      },
    };

    for (const [key, def] of Object.entries(layerDefs)) {
      const target = previewCanvases[key];
      if (!target) continue;
      const s = def.settings;
      const rendered = renderLayerGroup(def.layers, dragonHsl, def.filter,
        { hShift: s.hShift, sShift: s.sShift, lShift: s.lShift });
      const cropped = autoCrop(rendered, 8);
      target.width = cropped.width;
      target.height = cropped.height;
      target.getContext('2d').drawImage(cropped, 0, 0);
    }

    // Layer 4 preview
    const l4Target = previewCanvases.layer4;
    if (l4Target) {
      const s4 = layerSettings.layer4;
      const rendered = renderLayer4(processedLayers, dragonHsl,
        { hShift: s4.hShift, sShift: s4.sShift, lShift: s4.lShift });
      const cropped = autoCrop(rendered, 8);
      l4Target.width = cropped.width;
      l4Target.height = cropped.height;
      l4Target.getContext('2d').drawImage(cropped, 0, 0);
    }
  }

  // ── Build a layer card with granular controls ──
  function addLayerCard(name, key, info, options = {}) {
    const card = el('div', 'layer-card');
    card.appendChild(el('h3', '', name));
    if (info) card.appendChild(el('div', 'layer-info', info));

    // Preview canvas
    const preview = document.createElement('canvas');
    preview.style.width = '100%';
    preview.style.maxWidth = '400px';
    preview.style.height = 'auto';
    card.appendChild(preview);
    previewCanvases[key] = preview;

    const s = layerSettings[key];

    // ── Toggle row: Fills + Outlines checkboxes ──
    const toggleRow = el('div', 'toggle-row');

    if (options.hasFills !== false) {
      const fillCb = document.createElement('input');
      fillCb.type = 'checkbox';
      fillCb.checked = s.fills;
      fillCb.id = `fills-${key}`;
      fillCb.addEventListener('change', () => { s.fills = fillCb.checked; recomposite(); });
      const fillLabel = document.createElement('label');
      fillLabel.htmlFor = fillCb.id;
      fillLabel.textContent = 'Fills';
      toggleRow.appendChild(fillCb);
      toggleRow.appendChild(fillLabel);
    }

    if (options.hasOutlines !== false) {
      const outCb = document.createElement('input');
      outCb.type = 'checkbox';
      outCb.checked = s.outlines;
      outCb.id = `outlines-${key}`;
      outCb.addEventListener('change', () => { s.outlines = outCb.checked; recomposite(); });
      const outLabel = document.createElement('label');
      outLabel.htmlFor = outCb.id;
      outLabel.textContent = 'Outlines';
      toggleRow.appendChild(outCb);
      toggleRow.appendChild(outLabel);
    }

    card.appendChild(toggleRow);

    // ── HSL sliders ──
    if (options.noColor !== true) {
      const sliderDefs = [
        { prop: 'hShift', label: 'Hue', min: -0.5, max: 0.5, step: 0.01, defaultVal: 0 },
        { prop: 'sShift', label: 'Saturation', min: -1.0, max: 1.0, step: 0.01, defaultVal: 0 },
        { prop: 'lShift', label: 'Luminance', min: -0.5, max: 0.5, step: 0.01, defaultVal: 0 },
      ];

      for (const def of sliderDefs) {
        const row = el('div', 'hsl-slider');
        const lbl = el('span', 'hsl-label', def.label);
        const input = document.createElement('input');
        input.type = 'range';
        input.min = def.min;
        input.max = def.max;
        input.step = def.step;
        input.value = s[def.prop];
        const valSpan = el('span', 'hsl-value', s[def.prop].toFixed(2));

        input.addEventListener('input', () => {
          s[def.prop] = parseFloat(input.value);
          valSpan.textContent = s[def.prop].toFixed(2);
          recomposite();
        });

        // Double-click to reset
        input.addEventListener('dblclick', () => {
          s[def.prop] = def.defaultVal;
          input.value = def.defaultVal;
          valSpan.textContent = def.defaultVal.toFixed(2);
          recomposite();
        });

        row.appendChild(lbl);
        row.appendChild(input);
        row.appendChild(valSpan);
        card.appendChild(row);
      }
    }

    layerDisplay.appendChild(card);
  }

  // ── Generate a dragon and build UI ──
  async function generate() {
    genBtn.disabled = true;
    genBtn.textContent = 'Generating...';
    layerDisplay.innerHTML = '';

    // Reset all layer settings
    for (const key of Object.keys(layerSettings)) {
      layerSettings[key] = { fills: true, outlines: true, hShift: 0, sShift: 0, lShift: 0 };
    }

    const dragon = Dragon.createRandom();
    const p = dragon.phenotype;

    currentData = await decomposeIntoLayers(p);
    const { bodyAlpha, needsFadePass, opacityLevel } = currentData;

    const opNames = { 0: 'None', 1: 'Low', 2: 'Med', 3: 'High' };
    const headerInfo = `${p.color.displayName} — O: ${opNames[opacityLevel]} (${Math.round(bodyAlpha * 100)}%) — Fade: ${needsFadePass ? 'Yes' : 'No'}`;
    controls.querySelector('.dragon-header')?.remove();
    const header = el('div', 'dragon-header', `${dragon.name}: ${headerInfo}`);
    header.style.cssText = 'font-size:14px;color:var(--text-bright);width:100%;margin-top:8px;';
    controls.appendChild(header);

    // Build layer cards
    addLayerCard('Layer 1: Fills (base)', 'layer1',
      'All fills from base PNGs. Color-blended (base/lighten/horn shifts).',
      { hasFills: true, hasOutlines: false });

    addLayerCard('Layer 2: Outlines (base)', 'layer2',
      'All outlines from base PNGs. Darken color blend. Only used for transparent dragons.',
      { hasFills: false, hasOutlines: true });

    addLayerCard('Layer 3: Fills (fade)', 'layer3',
      'Fade-swapped fills (wingfade/legfade). Non-fade layers for z-order.',
      { hasFills: true, hasOutlines: false });

    addLayerCard('Face Details', 'face',
      'Eyes, mouth — no color processing. Full opacity.',
      { hasFills: true, hasOutlines: false, noColor: true });

    addLayerCard('Layer 4: Surface Outlines', 'layer4',
      'Z-order mask trick. Surviving outlines → 102 grey → darken blend. Full opacity.',
      { hasFills: false, hasOutlines: true });

    recomposite();
    genBtn.disabled = false;
    genBtn.textContent = 'Generate Dragon';
  }

  genBtn.addEventListener('click', generate);

  opacitySelect.addEventListener('change', () => {
    const val = opacitySelect.value;
    currentAlphaOverride = val === 'auto' ? null : parseFloat(val);
    recomposite();
  });

  // Auto-generate on load
  generate();
}
