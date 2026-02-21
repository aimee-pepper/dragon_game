// Layer Visualizer Tool
// Renders each compositing layer individually for a dragon so you can
// toggle layers on/off, adjust HSL per layer, and see the final composite
// update live. Updated for the red-extraction compositing pipeline.

import { Dragon } from './dragon.js';
import {
  ASSET_TABLE,
  resolveAssetsForPhenotype,
  COLOR_ADJUSTMENTS,

  WING_TRANSPARENCY,
  BODY_TRANSPARENCY,
  ANCHORS,
  SPRITE_WIDTH,
  SPRITE_HEIGHT,
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
 * Measure how "red-outline-like" a pixel is, returning 0.0–1.0.
 * Pure red markers score 1.0. Grey pixels score ~0.0.
 * Anti-aliased edge pixels score in between.
 */
function redAmount(r, g, b) {
  const total = r + g + b;
  if (total === 0) return 0;
  const ratio = r / total;
  // Ramp from 0 at ratio=0.60 to 1 at ratio=0.85
  return Math.max(0, Math.min(1, (ratio - 0.60) / 0.25));
}

/** Binary red outline check using soft redAmount with 50% threshold. */
function isRedOutline(r, g, b) {
  return redAmount(r, g, b) >= 0.5;
}

/**
 * Apply color blend with adjustable HSL overrides, skipping red outline markers.
 * When skipRed=true, partially-red pixels are desaturated proportionally
 * before blending to prevent red haloing in fills.
 */
function applyColorBlendHSL(imageData, dragonHsl, luminanceShift, hslOverrides = {}, skipRed = false) {
  const hShift = hslOverrides.hShift || 0;
  const sShift = hslOverrides.sShift || 0;
  const lShift = hslOverrides.lShift || 0;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    let r = data[i], g = data[i + 1], b = data[i + 2];

    if (skipRed) {
      const rAmt = redAmount(r, g, b);
      if (rAmt >= 1.0) continue; // pure red → skip
      if (rAmt > 0) {
        // Desaturate red tint proportionally before blending
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.round(r + (lum - r) * rAmt);
        g = Math.round(g + (lum - g) * rAmt);
        b = Math.round(b + (lum - b) * rAmt);
      }
    }

    const artHsl = rgbToHsl(r, g, b);
    const targetH = ((dragonHsl.h + hShift) % 1 + 1) % 1;
    const targetS = Math.max(0, Math.min(1, dragonHsl.s + sShift));
    const targetL = Math.max(0, Math.min(1, artHsl.l + luminanceShift + lShift));
    const result = hslToRgb(targetH, targetS, targetL);
    data[i] = result.r;
    data[i + 1] = result.g;
    data[i + 2] = result.b;
  }
}

// ── Red-extraction utilities (same as sprite-renderer.js) ──

function redToGrey(imgData) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    if (isRedOutline(d[i], d[i + 1], d[i + 2])) {
      d[i] = 102; d[i + 1] = 102; d[i + 2] = 102;
    }
  }
}

function removeRed(imgData) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const rAmt = redAmount(d[i], d[i + 1], d[i + 2]);
    if (rAmt <= 0) continue;
    if (rAmt >= 1.0) {
      d[i + 3] = 0;
    } else {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i]     = Math.round(d[i] + (lum - d[i]) * rAmt);
      d[i + 1] = Math.round(d[i + 1] + (lum - d[i + 1]) * rAmt);
      d[i + 2] = Math.round(d[i + 2] + (lum - d[i + 2]) * rAmt);
      d[i + 3] = Math.round(d[i + 3] * (1 - rAmt * 0.5));
    }
  }
}

// Full desaturate — drop all saturation to zero (luminance grey).
// Used on Fade Layer after removeRed to kill any residual red tint.
// Existing grey pixels are unaffected (no-op).
function desaturateToGrey(imgData) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = lum;
    d[i + 1] = lum;
    d[i + 2] = lum;
  }
}

function keepOnlyRed(imgData) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const rAmt = redAmount(d[i], d[i + 1], d[i + 2]);
    if (rAmt <= 0) {
      d[i + 3] = 0;
    } else if (rAmt < 1.0) {
      d[i + 3] = Math.round(d[i + 3] * rAmt);
    }
  }
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

// ── Core: decompose a dragon into raw layer data ──
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
  const isNoneOpacity = opacityLevel === 0;

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
    if (asset.filename.endsWith('_o') && !groupPivots[groupKey]) {
      const anchor = getAnchor(asset.filename, pivotCtx);
      if (anchor.rot) groupPivots[groupKey] = { x: anchor.x, y: anchor.y, rot: anchor.rot };
    }
  }

  // Process all layers — store RAW (uncolored) canvases only
  // No per-asset color processing; color blend happens at group level
  const processedLayers = [];
  for (const asset of matchedAssets) {
    const fullname = asset.filename + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue;

    // Raw canvas (uncolored) — used for compositing and HSL slider re-processing
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = img.width; rawCanvas.height = img.height;
    rawCanvas.getContext('2d').drawImage(img, 0, 0);

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

    const isFixedDetail = asset.colorMode === 'fixed';
    const groupKey = asset.pair ? `${asset.layerGroup}:p${asset.pair}` : null;
    const groupPivot = groupKey ? groupPivots[groupKey] : null;

    processedLayers.push({
      asset, rawCanvas, anchorX, anchorY, rotation,
      isFixedDetail, groupPivot,
    });
  }

  // Fade layers — raw canvases only (no per-asset color processing)
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

    const baseLayer = processedLayers.find(pl => pl.asset === asset);
    fadeLayers.push({
      asset, rawCanvas,
      anchorX: baseLayer.anchorX, anchorY: baseLayer.anchorY,
      rotation: baseLayer.rotation,
      isFixedDetail: baseLayer.isFixedDetail, groupPivot: baseLayer.groupPivot,
    });
  }

  // Build fade-substituted list
  const fadeLayerMap = new Map();
  for (const fl of fadeLayers) fadeLayerMap.set(fl.asset, fl);
  const fadeSubLayers = processedLayers.map(layer => fadeLayerMap.get(layer.asset) || layer);

  return {
    processedLayers, fadeLayers, fadeSubLayers, fadeLayerMap,
    bodyAlpha, needsFadePass, isNoneOpacity, dragonRgb, dragonHsl, opacityLevel,
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

// ── Composite a layer list onto a full-size canvas as raw greyscale+red ──
// No per-asset color processing — just draws raw canvases in z-order.
function compositeLayersRaw(layers) {
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH; c.height = SPRITE_HEIGHT;
  const ctx = c.getContext('2d');
  for (const layer of layers) {
    if (layer.isFixedDetail) continue;
    drawToCanvas(ctx, layer.rawCanvas, layer);
  }
  const imgData = ctx.getImageData(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
  c.width = 0; c.height = 0;
  return imgData;
}

// ── Render Base Layer: raw composite → removeRed → desaturate → colorBlend(0) ──
function renderBaseLayer(processedLayers, dragonHsl, hslOverrides) {
  const raw = compositeLayersRaw(processedLayers);
  removeRed(raw);
  desaturateToGrey(raw);
  applyColorBlendHSL(raw, dragonHsl, 0, hslOverrides);
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH; c.height = SPRITE_HEIGHT;
  c.getContext('2d').putImageData(raw, 0, 0);
  return c;
}

// ── Render Injected Outlines: assemble _o raw → red→grey → darken color blend ──
// Outline PNGs are already pure red lines. Just composite them, convert, color.
function renderInjectedOutlines(processedLayers, dragonHsl, dragonRgb, hslOverrides) {
  const w = SPRITE_WIDTH, h = SPRITE_HEIGHT;
  const comp = document.createElement('canvas');
  comp.width = w; comp.height = h;
  const compCtx = comp.getContext('2d');

  // Only draw _o (outline) assets — they're already red lines, no extraction needed
  for (const layer of processedLayers) {
    if (layer.isFixedDetail) continue;
    if (!layer.asset.filename.endsWith('_o')) continue;
    drawToCanvas(compCtx, layer.rawCanvas, layer);
  }

  // Convert red → grey → darken color blend (same as final outline)
  const raw = compCtx.getImageData(0, 0, w, h);
  redToGrey(raw);
  const darkenShift = COLOR_ADJUSTMENTS.darken.luminanceShift;
  applyColorBlendHSL(raw, dragonHsl, darkenShift, hslOverrides);

  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').putImageData(raw, 0, 0);
  comp.width = 0; comp.height = 0;
  return c;
}

// ── Render Fade Layer: raw fade composite → removeRed → desaturate → colorBlend(0) ──
function renderFadeLayer(fadeSubLayers, dragonHsl, hslOverrides) {
  const raw = compositeLayersRaw(fadeSubLayers);
  removeRed(raw);
  desaturateToGrey(raw);
  applyColorBlendHSL(raw, dragonHsl, 0, hslOverrides);
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH; c.height = SPRITE_HEIGHT;
  c.getContext('2d').putImageData(raw, 0, 0);
  return c;
}

// ── Render Final Outline: raw composite → keepOnlyRed → grey → colorBlend(darken) ──
// Fills occlude outlines beneath, so only surface-visible outlines remain.
function renderFinalOutline(processedLayers, dragonHsl, hslOverrides) {
  const raw = compositeLayersRaw(processedLayers);
  keepOnlyRed(raw);
  redToGrey(raw);
  const darkenShift = COLOR_ADJUSTMENTS.darken.luminanceShift;
  applyColorBlendHSL(raw, dragonHsl, darkenShift, hslOverrides);
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH; c.height = SPRITE_HEIGHT;
  c.getContext('2d').putImageData(raw, 0, 0);
  return c;
}

// ── Render Face details (fixed assets — no color processing) ──
function renderFaceLayer(processedLayers) {
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH; c.height = SPRITE_HEIGHT;
  const ctx = c.getContext('2d');
  for (const layer of processedLayers) {
    if (!layer.isFixedDetail) continue;
    drawToCanvas(ctx, layer.rawCanvas, layer);
  }
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

  const reRenderBtn = el('button', 'secondary', 'Re-render');
  reRenderBtn.title = 'Re-composite with current settings';
  controls.appendChild(reRenderBtn);

  const opacityLabel = el('label', '', 'Opacity override: ');
  const opacitySelect = el('select');
  ['Auto', 'None (10%)', 'Low (30%)', 'Med (60%)', 'High (100%)'].forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i === 0 ? 'auto' : String(i - 1); // store opacityLevel for override
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

  // Active layers status line
  const toggleStatus = el('div', 'layer-info');
  toggleStatus.id = 'layer-toggle-status';
  toggleStatus.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:4px;';
  compositeSection.appendChild(toggleStatus);

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
  let opacityOverride = null; // null = auto, or opacityLevel number

  // Per-layer settings: on/off toggle, HSL shifts
  const layerSettings = {
    base:           { on: true, hShift: 0, sShift: 0, lShift: 0 },
    injectedOutline:{ on: true, hShift: 0, sShift: 0, lShift: 0 },
    fade:           { on: true, hShift: 0, sShift: 0, lShift: 0 },
    face:           { on: true, hShift: 0, sShift: 0, lShift: 0 },
    finalOutline:   { on: true, hShift: 0, sShift: 0, lShift: 0 },
  };

  // ── Recomposite: rebuilds from raw data with current settings ──
  function recomposite() {
    if (!currentData) return;
    const { processedLayers, fadeSubLayers, dragonHsl, dragonRgb } = currentData;

    // Determine effective opacity level
    const effectiveOpLevel = opacityOverride !== null ? opacityOverride : currentData.opacityLevel;
    const effectiveAlpha = BODY_TRANSPARENCY[effectiveOpLevel];
    const effectiveIsNone = effectiveOpLevel === 0;
    const effectiveNeedsFade = currentData.fadeLayers.length > 0 && effectiveAlpha < 1.0;

    const w = SPRITE_WIDTH, h = SPRITE_HEIGHT;

    const sBase = layerSettings.base;
    const sInj = layerSettings.injectedOutline;
    const sFade = layerSettings.fade;
    const sFace = layerSettings.face;
    const sFinal = layerSettings.finalOutline;

    // Render each layer
    const baseCanvas = renderBaseLayer(processedLayers, dragonHsl,
      { hShift: sBase.hShift, sShift: sBase.sShift, lShift: sBase.lShift });
    const injCanvas = renderInjectedOutlines(processedLayers, dragonHsl, dragonRgb,
      { hShift: sInj.hShift, sShift: sInj.sShift, lShift: sInj.lShift });
    const fadeCanvas = renderFadeLayer(fadeSubLayers, dragonHsl,
      { hShift: sFade.hShift, sShift: sFade.sShift, lShift: sFade.lShift });
    const faceCanvas = renderFaceLayer(processedLayers);
    const finalCanvas = renderFinalOutline(processedLayers, dragonHsl,
      { hShift: sFinal.hShift, sShift: sFinal.sShift, lShift: sFinal.lShift });

    // ── Composite per opacity path ──
    const main = document.createElement('canvas');
    main.width = w; main.height = h;
    const mainCtx = main.getContext('2d');

    if (effectiveIsNone) {
      // NONE: Injected Outlines → Fade → Detail → Final Outline
      // Merge injected + fade onto offscreen, stamp at bodyAlpha
      const offscreen = document.createElement('canvas');
      offscreen.width = w; offscreen.height = h;
      const offCtx = offscreen.getContext('2d');
      if (sInj.on) offCtx.drawImage(injCanvas, 0, 0);
      if (sFade.on) offCtx.drawImage(fadeCanvas, 0, 0);
      mainCtx.save();
      mainCtx.globalAlpha = effectiveAlpha;
      mainCtx.drawImage(offscreen, 0, 0);
      mainCtx.restore();
      if (sFace.on) mainCtx.drawImage(faceCanvas, 0, 0);
      if (sFinal.on) mainCtx.drawImage(finalCanvas, 0, 0);
    } else if (effectiveNeedsFade) {
      // LOW & MID: Base → Injected Outlines → Fade → Detail → Final Outline
      // Merge base + injected + fade onto offscreen, stamp at bodyAlpha
      const offscreen = document.createElement('canvas');
      offscreen.width = w; offscreen.height = h;
      const offCtx = offscreen.getContext('2d');
      if (sBase.on) offCtx.drawImage(baseCanvas, 0, 0);
      if (sInj.on) offCtx.drawImage(injCanvas, 0, 0);
      if (sFade.on) offCtx.drawImage(fadeCanvas, 0, 0);
      mainCtx.save();
      mainCtx.globalAlpha = effectiveAlpha;
      mainCtx.drawImage(offscreen, 0, 0);
      mainCtx.restore();
      if (sFace.on) mainCtx.drawImage(faceCanvas, 0, 0);
      if (sFinal.on) mainCtx.drawImage(finalCanvas, 0, 0);
    } else {
      // FULL: Base → Detail → Final Outline
      if (sBase.on) mainCtx.drawImage(baseCanvas, 0, 0);
      if (sFace.on) mainCtx.drawImage(faceCanvas, 0, 0);
      if (sFinal.on) mainCtx.drawImage(finalCanvas, 0, 0);
    }

    // Crop and display
    const cropped = autoCrop(main, 8);
    const cCtx = compositeCanvas.getContext('2d');
    compositeCanvas.width = cropped.width;
    compositeCanvas.height = cropped.height;
    cCtx.clearRect(0, 0, cropped.width, cropped.height);
    cCtx.drawImage(cropped, 0, 0);

    updateToggleStatus(effectiveIsNone, effectiveNeedsFade);
    updateLayerPreviews(effectiveIsNone, effectiveNeedsFade,
      baseCanvas, injCanvas, fadeCanvas, faceCanvas, finalCanvas);
  }

  // ── Show active layer status in UI ──
  function updateToggleStatus(isNone, needsFade) {
    const parts = [];
    if (!isNone && layerSettings.base.on) parts.push('Base');
    if ((isNone || needsFade) && layerSettings.injectedOutline.on) parts.push('Injected Outlines');
    if ((isNone || needsFade) && layerSettings.fade.on) parts.push('Fade');
    if (layerSettings.face.on) parts.push('Face');
    if (layerSettings.finalOutline.on) parts.push('Final Outline');
    const statusEl = document.getElementById('layer-toggle-status');
    if (statusEl) statusEl.textContent = `Active: ${parts.join(' + ') || 'none'}`;
  }

  // ── Per-layer preview canvases ──
  const previewCanvases = {};

  function updateLayerPreviews(isNone, needsFade, baseCanvas, injCanvas, fadeCanvas, faceCanvas, finalCanvas) {
    const layerMap = {
      base: { canvas: baseCanvas, on: layerSettings.base.on, active: !isNone },
      injectedOutline: { canvas: injCanvas, on: layerSettings.injectedOutline.on, active: isNone || needsFade },
      fade: { canvas: fadeCanvas, on: layerSettings.fade.on, active: isNone || needsFade },
      face: { canvas: faceCanvas, on: layerSettings.face.on, active: true },
      finalOutline: { canvas: finalCanvas, on: layerSettings.finalOutline.on, active: true },
    };

    for (const [key, info] of Object.entries(layerMap)) {
      const target = previewCanvases[key];
      if (!target) continue;
      target.style.opacity = info.on ? '1' : '0.25';
      // Grey out layers not used in current opacity path
      const card = target.closest('.layer-card');
      if (card) card.style.opacity = info.active ? '1' : '0.4';

      const cropped = autoCrop(info.canvas, 8);
      target.width = cropped.width;
      target.height = cropped.height;
      const tCtx = target.getContext('2d');
      tCtx.clearRect(0, 0, target.width, target.height);
      tCtx.drawImage(cropped, 0, 0);
    }
  }

  // ── Build a layer card with controls ──
  function addLayerCard(name, key, info, options = {}) {
    const card = el('div', 'layer-card');
    card.appendChild(el('h3', '', name));
    if (info) card.appendChild(el('div', 'layer-info', info));

    // Preview canvas
    const preview = document.createElement('canvas');
    preview.style.width = '100%';
    preview.style.maxWidth = '512px';
    preview.style.height = 'auto';
    card.appendChild(preview);
    previewCanvases[key] = preview;

    const s = layerSettings[key];

    // ── Toggle row ──
    const toggleRow = el('div', 'toggle-row');
    const toggleCb = document.createElement('input');
    toggleCb.type = 'checkbox';
    toggleCb.checked = s.on;
    toggleCb.id = `toggle-${key}`;
    toggleCb.addEventListener('change', () => { s.on = toggleCb.checked; recomposite(); });
    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = toggleCb.id;
    toggleLabel.textContent = 'Enabled';
    toggleRow.appendChild(toggleCb);
    toggleRow.appendChild(toggleLabel);
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
      layerSettings[key] = { on: true, hShift: 0, sShift: 0, lShift: 0 };
    }

    const dragon = Dragon.createRandom();
    const p = dragon.phenotype;

    currentData = await decomposeIntoLayers(p);
    const { bodyAlpha, needsFadePass, isNoneOpacity, opacityLevel } = currentData;

    const opNames = { 0: 'None', 1: 'Low', 2: 'Med', 3: 'High' };
    const headerInfo = `${p.color.displayName} — O: ${opNames[opacityLevel]} (${Math.round(bodyAlpha * 100)}%) — Fade: ${needsFadePass ? 'Yes' : 'No'}`;
    controls.querySelector('.dragon-header')?.remove();
    const header = el('div', 'dragon-header', `${dragon.name}: ${headerInfo}`);
    header.style.cssText = 'font-size:14px;color:var(--text-bright);width:100%;margin-top:8px;';
    controls.appendChild(header);

    // Build layer cards matching the new red-extraction architecture
    addLayerCard('Base Layer (fills)', 'base',
      'All assets composited → red extracted → fills remain. Color-blended per colorMode.',
      { });

    addLayerCard('Injected Outlines (Layer 2)', 'injectedOutline',
      'Assemble _o raw → red→grey → L2 blend (darken + sat/lum corrections). Transparent dragons only.',
      { });

    addLayerCard('Fade Layer', 'fade',
      'Fade-substituted assets composited → red removed → fills only. Transparent dragons only.',
      { });

    addLayerCard('Face Details', 'face',
      'Eyes, mouth — no color processing. Full opacity.',
      { noColor: true });

    addLayerCard('Final Outline', 'finalOutline',
      'Extracted red → mid grey (102) → darken color blend. Full opacity on top.',
      { });

    recomposite();
    genBtn.disabled = false;
    genBtn.textContent = 'Generate Dragon';
  }

  genBtn.addEventListener('click', generate);

  reRenderBtn.addEventListener('click', () => {
    if (currentData) recomposite();
  });

  opacitySelect.addEventListener('change', () => {
    const val = opacitySelect.value;
    opacityOverride = val === 'auto' ? null : parseInt(val);
    recomposite();
  });

  // Auto-generate on load
  generate();
}
