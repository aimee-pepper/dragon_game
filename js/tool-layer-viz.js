// Layer Visualizer Tool
// Renders each compositing layer individually for a dragon so you can
// toggle them on/off, adjust opacity, and see the final composite.

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

function applyColorBlend(imageData, dragonRgb, luminanceShift = 0) {
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const artHsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    let targetL = Math.max(0, Math.min(1, artHsl.l + luminanceShift));
    const result = hslToRgb(dragonHsl.h, dragonHsl.s, targetL);
    data[i] = result.r;
    data[i + 1] = result.g;
    data[i + 2] = result.b;
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

// Full render size
const SPRITE_WIDTH = 2560;
const SPRITE_HEIGHT = 1920;

// ── Core: decompose a dragon into individual layer canvases ──
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
    const outerOutline = asset.filename.replace(/_f$/, '_o').replace('inner', 'outer');
    const groupKey = `${asset.layerGroup}:p${asset.pair}`;
    if (asset.filename.includes('outer') && asset.filename.endsWith('_o') && !groupPivots[groupKey]) {
      const anchor = getAnchor(asset.filename, pivotCtx);
      if (anchor.rot) groupPivots[groupKey] = { x: anchor.x, y: anchor.y, rot: anchor.rot };
    }
  }

  // Process all layers
  const processedLayers = [];
  for (const asset of matchedAssets) {
    const fullname = asset.filename + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue;

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

    // Mask canvas
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
      asset, offscreen, maskCanvas, anchorX, anchorY, rotation,
      isOutline, isFixedDetail, groupPivot,
    });
  }

  // Fade layers
  const fadeLayers = [];
  for (const asset of matchedAssets) {
    const fadeName = getFadeFilename(asset.filename);
    if (!fadeName) continue;
    const fullname = fadeName + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue;

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
      asset, offscreen,
      anchorX: baseLayer.anchorX, anchorY: baseLayer.anchorY,
      rotation: baseLayer.rotation, isOutline: baseLayer.isOutline,
      isFixedDetail: baseLayer.isFixedDetail, groupPivot: baseLayer.groupPivot,
    });
  }

  // Build layerA2
  const fadeLayerMap = new Map();
  for (const fl of fadeLayers) fadeLayerMap.set(fl.asset, fl);
  const layerA2Layers = processedLayers.map(layer => fadeLayerMap.get(layer.asset) || layer);

  // ── Render each layer to its own canvas ──
  const w = SPRITE_WIDTH, h = SPRITE_HEIGHT;

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

  function makeLayerCanvas(drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx);
    return c;
  }

  // Layer 1: Fills only
  const layer1 = makeLayerCanvas(ctx => {
    for (const layer of processedLayers) {
      if (!layer.isOutline) drawToCanvas(ctx, layer.offscreen, layer);
    }
  });

  // Layer 2: Outlines only
  const layer2 = makeLayerCanvas(ctx => {
    for (const layer of processedLayers) {
      if (layer.isOutline) drawToCanvas(ctx, layer.offscreen, layer);
    }
  });

  // Layer 3: Fade fills only (no outlines)
  const layer3 = makeLayerCanvas(ctx => {
    for (const layer of layerA2Layers) {
      if (!layer.isOutline) drawToCanvas(ctx, layer.offscreen, layer);
    }
  });

  // Face details
  const faceLayers = makeLayerCanvas(ctx => {
    for (const layer of processedLayers) {
      if (layer.isFixedDetail) drawToCanvas(ctx, layer.offscreen, layer);
    }
  });

  // Layer 4: Mask → pixel process → colored outlines
  const layer4 = makeLayerCanvas(ctx => {
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
    applyColorBlend(data, dragonRgb, darkenShift);
    ctx.putImageData(data, 0, 0);
  });

  return {
    layer1, layer2, layer3, faceLayers, layer4,
    bodyAlpha, needsFadePass, dragonRgb, opacityLevel,
    phenotype,
  };
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

// ── UI ──
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initLayerVisualizer(container) {
  container.innerHTML = '';
  const viz = el('div', 'layer-viz');

  // Controls
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
  let currentLayers = null;
  const layerEnabled = { layer1: true, layer2: true, layer3: true, face: true, layer4: true };
  let currentAlphaOverride = null;

  function recomposite() {
    if (!currentLayers) return;
    const alpha = currentAlphaOverride !== null ? currentAlphaOverride : currentLayers.bodyAlpha;
    const { layer1, layer2, layer3, faceLayers, layer4, needsFadePass } = currentLayers;
    const w = SPRITE_WIDTH, h = SPRITE_HEIGHT;

    // Merge layers 1+2+3 on offscreen
    const offscreen = document.createElement('canvas');
    offscreen.width = w; offscreen.height = h;
    const offCtx = offscreen.getContext('2d');

    if (layerEnabled.layer1) offCtx.drawImage(layer1, 0, 0);
    if (layerEnabled.layer2 && needsFadePass) offCtx.drawImage(layer2, 0, 0);
    if (layerEnabled.layer3 && needsFadePass) offCtx.drawImage(layer3, 0, 0);

    // Stamp at alpha
    const main = document.createElement('canvas');
    main.width = w; main.height = h;
    const mainCtx = main.getContext('2d');
    mainCtx.save();
    mainCtx.globalAlpha = alpha;
    mainCtx.drawImage(offscreen, 0, 0);
    mainCtx.restore();

    // Face details
    if (layerEnabled.face) mainCtx.drawImage(faceLayers, 0, 0);

    // Layer 4
    if (layerEnabled.layer4) mainCtx.drawImage(layer4, 0, 0);

    // Crop and display
    const cropped = autoCrop(main, 8);
    compositeCanvas.width = cropped.width;
    compositeCanvas.height = cropped.height;
    compositeCanvas.getContext('2d').drawImage(cropped, 0, 0);
  }

  function addLayerCard(name, key, canvas, info) {
    const card = el('div', 'layer-card');
    card.appendChild(el('h3', '', name));
    if (info) card.appendChild(el('div', 'layer-info', info));

    const preview = autoCrop(canvas, 8);
    preview.style.width = '100%';
    preview.style.maxWidth = '400px';
    preview.style.height = 'auto';
    card.appendChild(preview);

    const toggleRow = el('div', 'toggle-row');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = layerEnabled[key];
    checkbox.id = `toggle-${key}`;
    checkbox.addEventListener('change', () => {
      layerEnabled[key] = checkbox.checked;
      recomposite();
    });
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = 'Include in composite';
    toggleRow.appendChild(checkbox);
    toggleRow.appendChild(label);
    card.appendChild(toggleRow);

    layerDisplay.appendChild(card);
  }

  async function generate() {
    genBtn.disabled = true;
    genBtn.textContent = 'Generating...';
    layerDisplay.innerHTML = '';

    const dragon = Dragon.createRandom();
    const p = dragon.phenotype;

    currentLayers = await decomposeIntoLayers(p);
    const { bodyAlpha, needsFadePass, opacityLevel } = currentLayers;

    const opNames = { 0: 'None', 1: 'Low', 2: 'Med', 3: 'High' };
    const headerInfo = `${p.color.displayName} — O: ${opNames[opacityLevel]} (${Math.round(bodyAlpha * 100)}%) — Fade: ${needsFadePass ? 'Yes' : 'No'}`;
    controls.querySelector('.dragon-header')?.remove();
    const header = el('div', 'dragon-header', `${dragon.name}: ${headerInfo}`);
    header.style.cssText = 'font-size:14px;color:var(--text-bright);width:100%;margin-top:8px;';
    controls.appendChild(header);

    addLayerCard('Layer 1: Fills (base)', 'layer1', currentLayers.layer1,
      'All fills from base PNGs. Color-blended (base/lighten/horn shifts).');
    addLayerCard('Layer 2: Outlines (base)', 'layer2', currentLayers.layer2,
      'All outlines from base PNGs. Color-blended with darken shift (-0.25). Only used for transparent dragons.');
    addLayerCard('Layer 3: Fills (fade)', 'layer3', currentLayers.layer3,
      'Fade-swapped fills (wingfade/legfade PNGs). Non-fade layers included for z-order. No outlines.');
    addLayerCard('Face Details', 'face', currentLayers.faceLayers,
      'Eyes, mouth — no color processing. Drawn at full opacity.');
    addLayerCard('Layer 4: Surface Outlines', 'layer4', currentLayers.layer4,
      'Z-order mask trick: white fills erase black outlines. Surviving outlines → 102 grey → darken color blend. Always full opacity.');

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
