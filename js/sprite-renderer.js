// Canvas-based dragon sprite renderer
// Composites PNG layers with color blending and transparency
//
// Color pipeline (group-level, no per-asset color processing):
//   1. Load PNG art (greyscale fills + pure-red outline markers)
//   2. Composite all layers in z-order as raw greyscale+red
//   3. Extract/remove red markers per compositing group
//   4. Desaturate to pure grey, then color-blend each group via HSL
//      Base/Fade: shift=0, Outlines: darken shift, Injected: darken+L2
//
// Red-extraction compositing model (3 opacity paths):
//
//   FULL OPACITY:
//     Base Layer    — Raw composite → removeRed → desaturate → colorBlend(0)
//     Detail Layer  — Eyes/mouth at full opacity, no correction
//     Final Outline — Raw composite → keepOnlyRed → grey → colorBlend(darken)
//
//   LOW & MID OPACITY:
//     Base Layer       — Raw composite → removeRed → desaturate → colorBlend(0) @ bodyAlpha
//     Injected Outlines— Assemble _o raw → grey → L2 blend (darken+corrections)
//     Fade Layer       — Raw fade composite → removeRed → desaturate → colorBlend(0)
//     Detail Layer     — Eyes/mouth at full opacity
//     Final Outline    — Raw composite → keepOnlyRed → grey → colorBlend(darken)
//
//   NONE OPACITY (opacityLevel 0 — no base layer):
//     Injected Outlines— Assemble _o raw → grey → L2 blend (darken+corrections)
//     Fade Layer       — Raw fade composite → removeRed → desaturate → colorBlend(0)
//     Detail Layer     — Eyes/mouth at full opacity
//     Final Outline    — Raw composite → keepOnlyRed → grey → colorBlend(darken)

import {
  ASSET_TABLE,
  resolveAssetsForPhenotype,
  COLOR_ADJUSTMENTS,
  LAYER2_OUTLINE_CORRECTION,
  WING_TRANSPARENCY,
  BODY_TRANSPARENCY,
  SPRITE_WIDTH,
  SPRITE_HEIGHT,
  SPRITE_WIDTH_COMPACT,
  SPRITE_HEIGHT_COMPACT,
  getFinishEffect,
  getAnchor,
} from './sprite-config.js';
import { classifyLevel } from './gene-config.js';

// ============================================================
// ASSET CACHE — loaded PNGs stored by filename
// ============================================================
const assetCache = new Map();
const loadingPromises = new Map();
const ASSET_BASE_PATH = 'assets/sprites/';

// ============================================================
// RENDER CACHE — flat final images keyed on phenotype fingerprint
// ============================================================
// Once a dragon is rendered through the full compositing pipeline,
// we cache the final cropped canvas. Subsequent render requests
// for the same phenotype+size just clone the cached image.
const renderCache = new Map();

/**
 * Generate a stable cache key from a phenotype + render options.
 * Two phenotypes with identical visual properties produce the same key.
 */
function getRenderCacheKey(phenotype, compact) {
  const rgb = phenotype.color.rgb;
  const fLevels = phenotype.finish.levels;
  const traits = phenotype.traits;

  // Build a compact string from all visually-relevant properties
  const parts = [
    compact ? 'c' : 'f',
    rgb.r, rgb.g, rgb.b,
    fLevels[0].toFixed(2), fLevels[1].toFixed(2), fLevels[2].toFixed(2),
  ];

  // Add all trait rounded values (these determine which assets are used)
  for (const key of Object.keys(traits).sort()) {
    const t = traits[key];
    if (t && t.rounded != null) parts.push(key, t.rounded);
  }

  return parts.join('|');
}

/**
 * Clear the render cache (e.g. when art style changes).
 */
export function clearRenderCache() {
  renderCache.clear();
}

// ============================================================
// RENDER QUEUE — serialize renders to limit peak memory
// ============================================================
// Only one dragon composites at a time, preventing multiple sets of
// temp canvases from coexisting in memory (critical for mobile).
let renderQueueTail = Promise.resolve();

/**
 * Load a sprite PNG and cache it.
 * Returns an HTMLImageElement (or null if not found).
 */
export function loadSpriteAsset(filename) {
  const fullname = filename.endsWith('.png') ? filename : filename + '.png';

  if (assetCache.has(fullname)) {
    return Promise.resolve(assetCache.get(fullname));
  }
  if (loadingPromises.has(fullname)) {
    return loadingPromises.get(fullname);
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      assetCache.set(fullname, img);
      loadingPromises.delete(fullname);
      resolve(img);
    };
    img.onerror = () => {
      // Asset not found — that's OK, just means this part doesn't have art yet
      assetCache.set(fullname, null);
      loadingPromises.delete(fullname);
      resolve(null);
    };
    img.src = ASSET_BASE_PATH + fullname;
  });

  loadingPromises.set(fullname, promise);
  return promise;
}

/**
 * Preload all assets for a given set of resolved asset entries.
 * Returns a Map<filename, HTMLImageElement|null>
 */
export async function preloadAssets(assetEntries) {
  const assetMap = new Map();
  const promises = [];

  for (const entry of assetEntries) {
    const fullname = entry.filename + '.png';
    if (assetMap.has(fullname)) continue; // skip duplicates (same PNG at different z-levels)

    promises.push(
      loadSpriteAsset(fullname).then(img => {
        assetMap.set(fullname, img);
      })
    );
  }

  await Promise.all(promises);
  return assetMap;
}

/**
 * Preload all assets for a phenotype (convenience wrapper).
 * Resolves which assets the phenotype needs, then preloads them.
 */
export async function preloadDragonAssets(phenotype) {
  const entries = resolveAssetsForPhenotype(phenotype);
  return preloadAssets(entries);
}

// ============================================================
// COLOR BLENDING UTILITIES
// ============================================================

/** Convert RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1) */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

/** Convert HSL to RGB (returns 0-255 values) */
function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
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
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Apply color blend to greyscale pixel data.
 * Uses the Photoshop "Color" blend approach:
 *   Result = HSL(dragonHue, dragonSat, artLuminance + luminanceShift)
 *
 * @param {ImageData} imageData - pixel data to modify in place
 * @param {object} dragonRgb - { r, g, b } dragon's base color (0-255)
 * @param {number} luminanceShift - how much to shift luminance (-1 to 1)
 */
function applyColorBlend(imageData, dragonRgb, luminanceShift = 0) {
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // skip fully transparent pixels

    // Get luminance from the greyscale art pixel
    // (for greyscale art, r=g=b, but handle any art gracefully)
    const artR = data[i];
    const artG = data[i + 1];
    const artB = data[i + 2];
    const artHsl = rgbToHsl(artR, artG, artB);

    let targetL = artHsl.l + luminanceShift;
    targetL = Math.max(0, Math.min(1, targetL)); // clamp

    const result = hslToRgb(dragonHsl.h, dragonHsl.s, targetL);
    data[i]     = result.r;
    data[i + 1] = result.g;
    data[i + 2] = result.b;
    // alpha stays the same
  }
}

/**
 * Measure how "red-outline-like" a pixel is, returning 0.0–1.0.
 * Uses the ratio of red to total RGB brightness. Pure red markers
 * (R=255, G=0, B=0) score 1.0. Grey pixels score ~0.33. Anti-aliased
 * edge pixels between red outlines and grey fills score in between.
 *
 * Pixels above ~50% red ratio are considered outline-dominant.
 * The soft zone (roughly 40-60% red ratio) is claimed by BOTH the
 * outline and fill passes to prevent haloing at edges.
 *
 * Returns 0.0 for non-red pixels, 1.0 for pure red, smooth ramp between.
 */
function redAmount(r, g, b) {
  const total = r + g + b;
  if (total === 0) return 0;
  const ratio = r / total; // 0.33 for grey, 1.0 for pure red
  // Ramp from 0 at ratio=0.60 to 1 at ratio=0.85
  // Tighter window: grey (0.33) is well below, pure red (1.0) is well above
  return Math.max(0, Math.min(1, (ratio - 0.60) / 0.25));
}

/**
 * Binary red outline check (kept for backward compat in simple paths).
 * Uses the soft redAmount with a 50% threshold.
 */
function isRedOutline(r, g, b) {
  return redAmount(r, g, b) >= 0.5;
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

/**
 * Render a dragon sprite to a canvas element.
 * Uses the data-driven ASSET_TABLE + resolveAssetsForPhenotype()
 * to determine which layers to render.
 *
 * @param {object} phenotype - from resolveFullPhenotype()
 * @param {object} options
 * @param {boolean} options.compact - render at half size
 * @param {boolean} options.animated - enable finish shimmer effects
 * @returns {Promise<HTMLCanvasElement>} the rendered sprite canvas
 */
// In-flight render promises for deduplication — if two callers request
// the same dragon before the first render completes, they share the promise.
const inflightRenders = new Map();

export async function renderDragonSprite(phenotype, options = {}) {
  const { compact = false, animated = false } = options;

  const cacheKey = getRenderCacheKey(phenotype, compact);

  // Fast path: return a clone of the cached flat image
  if (renderCache.has(cacheKey)) {
    return _cloneCachedCanvas(cacheKey, phenotype, animated);
  }

  // Deduplicate: if this exact render is already in-flight, wait for it
  if (inflightRenders.has(cacheKey)) {
    await inflightRenders.get(cacheKey);
    return _cloneCachedCanvas(cacheKey, phenotype, animated);
  }

  // Queue the render so only one composites at a time (limits peak memory)
  const renderPromise = new Promise((resolve, reject) => {
    renderQueueTail = renderQueueTail.then(async () => {
      try {
        const canvas = await _renderDragonSpriteImpl(phenotype, options);
        resolve(canvas);
      } catch (e) {
        reject(e);
      }
    });
  });

  inflightRenders.set(cacheKey, renderPromise);
  try {
    const result = await renderPromise;
    return result;
  } finally {
    inflightRenders.delete(cacheKey);
  }
}

function _cloneCachedCanvas(cacheKey, phenotype, animated) {
  const cached = renderCache.get(cacheKey);
  const clone = document.createElement('canvas');
  clone.width = cached.width;
  clone.height = cached.height;
  clone.className = 'dragon-sprite-canvas';
  clone.getContext('2d').drawImage(cached, 0, 0);

  if (animated) {
    const effect = getFinishEffect(phenotype.finish.displayName);
    if (effect) {
      startShimmerAnimation(clone, effect, phenotype.color.rgb);
    }
  }
  return clone;
}

async function _renderDragonSpriteImpl(phenotype, options = {}) {
  const { compact = false, animated = false } = options;

  const width = compact ? SPRITE_WIDTH_COMPACT : SPRITE_WIDTH;
  const height = compact ? SPRITE_HEIGHT_COMPACT : SPRITE_HEIGHT;

  // Create output canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.className = 'dragon-sprite-canvas';
  const ctx = canvas.getContext('2d');

  // Resolve which assets this dragon needs
  const matchedAssets = resolveAssetsForPhenotype(phenotype);

  // ── Fade layer setup ──
  // Fade variants of wings and legs have painted-in transparency gradients
  // where limbs meet the body, creating a natural soft blend.
  // Map: base filename → fade filename (same anchor positions)
  const FADE_PREFIX_MAP = {
    'wing_': 'wingfade_',
    'leg_': 'legfade_',
  };

  function getFadeFilename(baseFilename) {
    for (const [prefix, fadePrefix] of Object.entries(FADE_PREFIX_MAP)) {
      if (baseFilename.startsWith(prefix)) {
        return fadePrefix + baseFilename.slice(prefix.length);
      }
    }
    return null; // not a wing/leg layer — no fade variant
  }

  // Build list of fade filenames we need
  const fadeFilenames = new Set();
  for (const asset of matchedAssets) {
    const fadeName = getFadeFilename(asset.filename);
    if (fadeName) fadeFilenames.add(fadeName);
  }

  // Preload all needed PNGs (base + fade)
  const fadeEntries = [...fadeFilenames].map(f => ({ filename: f }));
  const assetMap = await preloadAssets([...matchedAssets, ...fadeEntries]);

  // Get dragon's base color
  const dragonRgb = phenotype.color.rgb;

  // Get opacity tier from finish for transparency calculations
  // finish.levels[0] is the opacity axis of the finish triangle
  const opacityLevel = classifyLevel(phenotype.finish.levels[0]);
  const bodyAlpha = BODY_TRANSPARENCY[opacityLevel];
  const wingAlpha = WING_TRANSPARENCY[opacityLevel];

  // For 4-pass compositing: halve opacity for non-max dragons.
  // Layer A (base) + Layer A2 (fade) each get half the opacity,
  // so they stack to approximately the original value.
  // Fully-opaque dragons (bodyAlpha=1.0): skip Layer A2 entirely —
  // the fade art has painted-in transparency that would incorrectly
  // show through on opaque dragons.
  const hasFadeLayers = fadeFilenames.size > 0;
  const needsFadePass = hasFadeLayers && bodyAlpha < 1.0;

  // Determine body variant for anchor lookups
  const bodyTypeName = phenotype.traits.body_type?.name?.toLowerCase() || 'normal';
  const bodyVariant = { 'serpentine': 'sinuous', 'normal': 'standard', 'bulky': 'bulky' }[bodyTypeName] || 'standard';

  // Determine wing/limb counts for config-aware anchor lookups
  // Gene values: frame_wings 2=two(2w), 3=four(4w), 4=six(6w)
  //              frame_limbs 1=two(2l), 2=four(4l), 3=six(6l)
  const wingGeneVal = phenotype.traits.frame_wings?.rounded ?? 2;
  const limbGeneVal = phenotype.traits.frame_limbs?.rounded ?? 2;
  const WING_COUNT_MAP = { 2: 2, 3: 4, 4: 6 };
  const LIMB_COUNT_MAP = { 1: 2, 2: 4, 3: 6 };
  const actualWingCount = WING_COUNT_MAP[wingGeneVal] || 2;
  const actualLimbCount = LIMB_COUNT_MAP[limbGeneVal] || 4;

  // ── Pre-scan: build rotation pivot map for wing/leg groups ──
  // For groups with rotation (wings, legs), all layers rotate around the
  // group anchor point. The group anchor is the _o (outline) layer position,
  // which has model offset (0,0) — i.e. the true attachment point.
  // We use outer_o as the canonical pivot for each (layerGroup, pair) combo.
  const groupPivots = {};
  for (const asset of matchedAssets) {
    if (!asset.pair) continue;
    // Build the same anchor context that the render loop will use
    const pivotCtx = {};
    if (asset.gene === 'wing') {
      pivotCtx.pair = asset.pair;
      pivotCtx.bodyType = bodyVariant;
      pivotCtx.wingCount = actualWingCount;
    } else if (asset.gene === 'leg') {
      pivotCtx.pair = asset.pair;
      pivotCtx.bodyType = bodyVariant;
      pivotCtx.limbCount = actualLimbCount;
    }
    const pivotAnchor = getAnchor(asset.filename, pivotCtx);
    const rot = pivotAnchor.rot || 0;
    if (Math.abs(rot) < 0.01) continue;

    const groupKey = `${asset.layerGroup}:p${asset.pair}`;
    // Use _o layers as pivot (they have 0,0 model offset = true group position)
    if (!groupPivots[groupKey] && asset.filename.endsWith('_o')) {
      let px = pivotAnchor.x;
      let py = pivotAnchor.y;
      // Horn chaining would apply here too, but horns don't have pairs/rotation
      groupPivots[groupKey] = { x: px, y: py, rot };
    }
  }

  // ── Pre-process all layers: draw raw PNGs, compute anchors ──
  // No per-asset color blending — assets are composited raw (greyscale + red
  // markers). Color blending happens once per compositing group (base, fade,
  // injected outlines, final outline) after extraction/separation.
  const processedLayers = [];
  for (const asset of matchedAssets) {
    const fullname = asset.filename + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue; // no asset loaded (file doesn't exist yet)

    // Store raw PNG on offscreen canvas (no color processing)
    const offscreen = document.createElement('canvas');
    offscreen.width = img.width;
    offscreen.height = img.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, 0, 0);

    // Build anchor context based on asset type
    const anchorCtx = {};
    if (asset.gene === 'wing') {
      anchorCtx.pair = asset.pair;
      anchorCtx.bodyType = bodyVariant;
      anchorCtx.wingCount = actualWingCount;
    } else if (asset.gene === 'leg') {
      anchorCtx.pair = asset.pair;
      anchorCtx.bodyType = bodyVariant;
      anchorCtx.limbCount = actualLimbCount;
    } else if (asset.gene === 'head' || asset.gene === 'tail' || asset.gene === 'spines') {
      anchorCtx.bodyType = bodyVariant;
    }

    const anchor = getAnchor(asset.filename, anchorCtx);
    let anchorX = anchor.x;
    let anchorY = anchor.y;
    const rotation = anchor.rot || 0;

    // Horn chaining: horns are stored as offsets from head position
    if (asset.gene === 'horns') {
      const headAnchor = getAnchor('head_o', { bodyType: bodyVariant });
      anchorX += headAnchor.x;
      anchorY += headAnchor.y;
    }

    const isFixedDetail = asset.colorMode === 'fixed';

    processedLayers.push({ asset, offscreen, anchorX, anchorY, rotation, isFixedDetail });
  }

  // ── Pre-process fade layers: wing/leg fade variants ──
  // These load the fade PNG (which has painted-in transparency gradients).
  // No per-asset color processing — same raw approach as base layers.
  const fadeLayers = [];
  for (const asset of matchedAssets) {
    const fadeName = getFadeFilename(asset.filename);
    if (!fadeName) continue; // not a wing/leg layer

    const fullname = fadeName + '.png';
    const img = assetMap.get(fullname);
    if (!img) continue; // fade PNG not available

    // Store raw fade PNG on offscreen canvas (no color processing)
    const offscreen = document.createElement('canvas');
    offscreen.width = img.width;
    offscreen.height = img.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, 0, 0);

    // Reuse anchor + rotation from the matching base processedLayer
    const baseLayer = processedLayers.find(pl => pl.asset === asset);
    fadeLayers.push({
      asset,
      offscreen,
      anchorX: baseLayer.anchorX,
      anchorY: baseLayer.anchorY,
      rotation: baseLayer.rotation,
      isFixedDetail: baseLayer.isFixedDetail,
    });
  }

  // ── Shared draw helper: draws a canvas onto a target context at position ──
  function drawToCtx(targetCtx, sourceCanvas, layer, alpha) {
    const { asset, anchorX, anchorY, rotation } = layer;
    const groupKey = asset.pair ? `${asset.layerGroup}:p${asset.pair}` : null;
    const groupPivot = groupKey ? groupPivots[groupKey] : null;
    const hasRot = Math.abs(rotation) > 0.01;

    targetCtx.save();
    targetCtx.globalAlpha = alpha;

    if (compact) {
      const scaleX = width / SPRITE_WIDTH;
      const scaleY = height / SPRITE_HEIGHT;
      if (groupPivot) {
        const px = groupPivot.x * scaleX;
        const py = groupPivot.y * scaleY;
        targetCtx.translate(px, py);
        targetCtx.rotate(groupPivot.rot * Math.PI / 180);
        targetCtx.translate(-px, -py);
        targetCtx.drawImage(sourceCanvas,
          anchorX * scaleX, anchorY * scaleY,
          sourceCanvas.width * scaleX, sourceCanvas.height * scaleY);
      } else if (hasRot) {
        const cx = anchorX * scaleX + sourceCanvas.width * scaleX / 2;
        const cy = anchorY * scaleY + sourceCanvas.height * scaleY / 2;
        targetCtx.translate(cx, cy);
        targetCtx.rotate(rotation * Math.PI / 180);
        targetCtx.drawImage(sourceCanvas,
          -sourceCanvas.width * scaleX / 2, -sourceCanvas.height * scaleY / 2,
          sourceCanvas.width * scaleX, sourceCanvas.height * scaleY);
      } else {
        targetCtx.drawImage(sourceCanvas,
          anchorX * scaleX, anchorY * scaleY,
          sourceCanvas.width * scaleX, sourceCanvas.height * scaleY);
      }
    } else {
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
    }

    targetCtx.restore();
  }

  // ── Build fade-substituted layer list ──
  // For the Fade Layer: a full re-render of the dragon but with wing/leg
  // layers swapped to their fade equivalents (which have painted-in
  // transparency gradients). Non-wing/non-leg layers stay identical.
  const fadeLayerMap = new Map();
  for (const fl of fadeLayers) {
    fadeLayerMap.set(fl.asset, fl);
  }

  const fadeSubLayers = [];
  for (const layer of processedLayers) {
    const fadeLayer = fadeLayerMap.get(layer.asset);
    fadeSubLayers.push(fadeLayer || layer);
  }

  // ============================================================
  // RED-EXTRACTION COMPOSITING PIPELINE
  // ============================================================
  //
  // Outline pixels in art PNGs are pure red (R=255, G=0, B=0).
  // During pre-processing, red pixels are left untouched while
  // greyscale fill pixels are color-blended per their colorMode.
  //
  // At composite time, all layers are drawn in z-order onto a
  // shared canvas, then red pixels are extracted to produce a
  // clean outline layer. Because fills paint over outlines beneath
  // in z-order, only surface-visible outlines survive as red —
  // same principle as the old black/white mask trick but simpler.
  //
  // Three opacity paths:
  //
  // FULL OPACITY (opacityLevel 3 = High):
  //   Base Layer:    All assets composited → extract red → fills remain
  //   Detail Layer:  Eyes/mouth at full opacity, no correction
  //   Final Outline: Extracted red → mid grey → darken color blend
  //   Stack: Base → Detail → Final Outline
  //
  // LOW & MID OPACITY (opacityLevel 1-2):
  //   Base Layer:    All assets composited → extract red → fills remain
  //                  → stamped at bodyAlpha
  //   Injected Outlines: All assets composited → keep only red →
  //                  red→grey → Layer 2 sat/lum corrections
  //   Fade Layer:    Fade-substituted assets composited → remove red →
  //                  fills only remain
  //   Detail Layer:  Eyes/mouth at full opacity, no correction
  //   Final Outline: Extracted red → mid grey → darken blend
  //   Stack: Base → Injected Outlines → Fade → Detail → Final Outline
  //
  // NONE OPACITY (opacityLevel 0):
  //   Injected Outlines: All assets composited → keep only red →
  //                  red→grey → Layer 2 sat/lum corrections
  //   Fade Layer:    Fade-substituted assets composited → remove red →
  //                  fills only remain
  //   Detail Layer:  Eyes/mouth at full opacity
  //   Final Outline: All assets composited → extract red → grey → darken
  //   Stack: Injected Outlines → Fade → Detail → Final Outline

  // ── Utility: composite a layer list onto a canvas, return ImageData ──
  function compositeLayersRaw(layerList, targetWidth, targetHeight) {
    const comp = document.createElement('canvas');
    comp.width = targetWidth;
    comp.height = targetHeight;
    const compCtx = comp.getContext('2d');
    for (const layer of layerList) {
      if (layer.isFixedDetail) continue; // face details handled separately
      drawToCtx(compCtx, layer.offscreen, layer, 1.0);
    }
    const imgData = compCtx.getImageData(0, 0, targetWidth, targetHeight);
    comp.width = 0; comp.height = 0; // release
    return imgData;
  }

  // ── Utility: convert red outline pixels to mid-grey for color blending ──
  function redToGrey(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      if (isRedOutline(d[i], d[i + 1], d[i + 2])) {
        d[i]     = 102; // mid grey (102/255 ≈ 40% luminance)
        d[i + 1] = 102;
        d[i + 2] = 102;
      }
    }
  }

  // ── Utility: soft-remove red from fills (desaturate + fade proportionally) ──
  function removeRed(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const rAmt = redAmount(d[i], d[i + 1], d[i + 2]);
      if (rAmt <= 0) continue;
      if (rAmt >= 1.0) {
        d[i + 3] = 0; // pure red → fully transparent
      } else {
        // Desaturate red tint and fade proportionally
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i]     = Math.round(d[i] + (lum - d[i]) * rAmt);
        d[i + 1] = Math.round(d[i + 1] + (lum - d[i + 1]) * rAmt);
        d[i + 2] = Math.round(d[i + 2] + (lum - d[i + 2]) * rAmt);
        d[i + 3] = Math.round(d[i + 3] * (1 - rAmt * 0.5));
      }
    }
  }

  // ── Utility: full desaturate — drop all saturation to zero ──
  // Converts every pixel to its luminance-equivalent grey. Used on the
  // Fade Layer after removeRed to kill any residual red tint from
  // anti-aliased edges. Existing grey pixels are unaffected (no-op).
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

  // ── Utility: soft-keep red pixels (proportional strength) ──
  function keepOnlyRed(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const rAmt = redAmount(d[i], d[i + 1], d[i + 2]);
      if (rAmt <= 0) {
        d[i + 3] = 0; // no red → transparent
      } else if (rAmt < 1.0) {
        d[i + 3] = Math.round(d[i + 3] * rAmt); // proportional
      }
      // rAmt === 1.0 → keep as-is
    }
  }

  // ── Utility: assemble outline assets (_o) into a single composited layer ──
  // Outline PNGs are already pure red lines — no extraction needed.
  // Just composite them together, convert red→grey, then return for coloring.
  function assembleOutlineAssets(layerList, targetWidth, targetHeight) {
    const comp = document.createElement('canvas');
    comp.width = targetWidth;
    comp.height = targetHeight;
    const compCtx = comp.getContext('2d');

    for (const layer of layerList) {
      if (layer.isFixedDetail) continue;
      if (!layer.asset.filename.endsWith('_o')) continue;
      drawToCtx(compCtx, layer.offscreen, layer, 1.0);
    }

    const result = compCtx.getImageData(0, 0, targetWidth, targetHeight);
    comp.width = 0; comp.height = 0;
    return result;
  }

  // ── Utility: apply Layer 2 color blend with sat/lum corrections ──
  // Self-contained: does its own HSL conversion with saturation shift.
  // Does NOT modify the shared applyColorBlend function.
  function applyLayer2Blend(imgData, rgb) {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const satCorr = LAYER2_OUTLINE_CORRECTION.saturationShift;
    const lumCorr = LAYER2_OUTLINE_CORRECTION.luminanceShift;
    const baseLum = COLOR_ADJUSTMENTS.darken.luminanceShift;
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const artHsl = rgbToHsl(d[i], d[i + 1], d[i + 2]);
      const targetS = Math.max(0, Math.min(1, hsl.s + satCorr));
      const targetL = Math.max(0, Math.min(1, artHsl.l + baseLum + lumCorr));
      const result = hslToRgb(hsl.h, targetS, targetL);
      d[i]     = result.r;
      d[i + 1] = result.g;
      d[i + 2] = result.b;
    }
  }

  // ── Shared offscreen compositor (reused for putImageData → drawImage) ──
  const offscreenComp = document.createElement('canvas');
  offscreenComp.width = width;
  offscreenComp.height = height;
  const offscreenCompCtx = offscreenComp.getContext('2d');

  const darkenShift = COLOR_ADJUSTMENTS.darken.luminanceShift;
  const isNoneOpacity = opacityLevel === 0;  // "None" tier: no base layer at all

  if (isNoneOpacity) {
    // ── NONE OPACITY: no base layer ──

    // Injected Outlines: assemble _o assets → red→grey → L2 color blend
    const injOutlines = assembleOutlineAssets(processedLayers, width, height);
    redToGrey(injOutlines);
    applyLayer2Blend(injOutlines, dragonRgb);
    offscreenCompCtx.putImageData(injOutlines, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

    // Fade Layer: composite fade-substituted layers → remove red → desaturate residual tint
    const fadeRaw = compositeLayersRaw(fadeSubLayers, width, height);
    removeRed(fadeRaw);
    desaturateToGrey(fadeRaw);
    applyColorBlend(fadeRaw, dragonRgb, 0);
    offscreenCompCtx.clearRect(0, 0, width, height);
    offscreenCompCtx.putImageData(fadeRaw, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

    // Detail Layer: face details at full opacity
    for (const layer of processedLayers) {
      if (layer.isFixedDetail) drawToCtx(ctx, layer.offscreen, layer, 1.0);
    }

    // Final Outline: composite all in z-order → surviving red → grey → darken
    // Fills occlude outlines beneath, so only surface-visible outlines remain.
    const finalRaw = compositeLayersRaw(processedLayers, width, height);
    keepOnlyRed(finalRaw);
    redToGrey(finalRaw);
    applyColorBlend(finalRaw, dragonRgb, darkenShift);
    offscreenCompCtx.clearRect(0, 0, width, height);
    offscreenCompCtx.putImageData(finalRaw, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

  } else if (needsFadePass) {
    // ── LOW & MID OPACITY ──

    // Base Layer: composite raw → remove red → desaturate → color blend → at bodyAlpha
    const baseRaw = compositeLayersRaw(processedLayers, width, height);
    removeRed(baseRaw);
    desaturateToGrey(baseRaw);
    applyColorBlend(baseRaw, dragonRgb, 0);
    offscreenCompCtx.putImageData(baseRaw, 0, 0);
    ctx.save();
    ctx.globalAlpha = bodyAlpha;
    ctx.drawImage(offscreenComp, 0, 0);
    ctx.restore();

    // Injected Outlines: assemble _o assets → red→grey → L2 color blend
    const injOutlines = assembleOutlineAssets(processedLayers, width, height);
    redToGrey(injOutlines);
    applyLayer2Blend(injOutlines, dragonRgb);
    offscreenCompCtx.clearRect(0, 0, width, height);
    offscreenCompCtx.putImageData(injOutlines, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

    // Fade Layer: composite fade-substituted layers → remove red → desaturate residual tint
    const fadeRaw = compositeLayersRaw(fadeSubLayers, width, height);
    removeRed(fadeRaw);
    desaturateToGrey(fadeRaw);
    applyColorBlend(fadeRaw, dragonRgb, 0);
    offscreenCompCtx.clearRect(0, 0, width, height);
    offscreenCompCtx.putImageData(fadeRaw, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

    // Detail Layer: face details at full opacity
    for (const layer of processedLayers) {
      if (layer.isFixedDetail) drawToCtx(ctx, layer.offscreen, layer, 1.0);
    }

    // Final Outline: composite all in z-order → surviving red → grey → darken
    const finalRaw = compositeLayersRaw(processedLayers, width, height);
    keepOnlyRed(finalRaw);
    redToGrey(finalRaw);
    applyColorBlend(finalRaw, dragonRgb, darkenShift);
    offscreenCompCtx.clearRect(0, 0, width, height);
    offscreenCompCtx.putImageData(finalRaw, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

  } else {
    // ── FULL OPACITY ──

    // Base Layer: composite raw → remove red → desaturate → color blend
    const baseRaw = compositeLayersRaw(processedLayers, width, height);
    removeRed(baseRaw);
    desaturateToGrey(baseRaw);
    applyColorBlend(baseRaw, dragonRgb, 0);
    offscreenCompCtx.putImageData(baseRaw, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);

    // Detail Layer: face details at full opacity
    for (const layer of processedLayers) {
      if (layer.isFixedDetail) drawToCtx(ctx, layer.offscreen, layer, 1.0);
    }

    // Final Outline: composite all in z-order → surviving red → grey → darken
    const finalRaw = compositeLayersRaw(processedLayers, width, height);
    keepOnlyRed(finalRaw);
    redToGrey(finalRaw);
    applyColorBlend(finalRaw, dragonRgb, darkenShift);
    offscreenCompCtx.clearRect(0, 0, width, height);
    offscreenCompCtx.putImageData(finalRaw, 0, 0);
    ctx.drawImage(offscreenComp, 0, 0);
  }

  // ── Cleanup: release all temp canvases to free memory ──
  // Critical for mobile where canvas memory is severely limited.
  for (const layer of processedLayers) {
    layer.offscreen.width = 0;
    layer.offscreen.height = 0;
    layer.offscreen = null;
  }
  for (const layer of fadeLayers) {
    layer.offscreen.width = 0;
    layer.offscreen.height = 0;
    layer.offscreen = null;
  }
  offscreenComp.width = 0;
  offscreenComp.height = 0;

  // Auto-crop transparent margins for efficient display
  const croppedCanvas = autoCrop(canvas, 8); // 8px padding

  // Release the uncropped output canvas
  canvas.width = 0;
  canvas.height = 0;

  // Cache the flat result for future requests
  const cacheKey = getRenderCacheKey(phenotype, compact);
  renderCache.set(cacheKey, croppedCanvas);

  // Return a clone so the cached copy stays pristine
  // (callers may modify the returned canvas, e.g. adding animation)
  const result = document.createElement('canvas');
  result.width = croppedCanvas.width;
  result.height = croppedCanvas.height;
  result.className = 'dragon-sprite-canvas';
  const resultCtx = result.getContext('2d');
  resultCtx.drawImage(croppedCanvas, 0, 0);

  // Add finish shimmer effect if animated
  if (animated) {
    const effect = getFinishEffect(phenotype.finish.displayName);
    if (effect) {
      startShimmerAnimation(result, effect, dragonRgb);
    }
  }

  return result;
}

/**
 * Auto-crop transparent margins from a canvas.
 * Scans for the bounding box of non-transparent pixels and returns
 * a new canvas trimmed to that region plus padding.
 */
function autoCrop(canvas, padding = 0) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasContent) return canvas; // nothing drawn, return as-is

  // Add padding
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropped = document.createElement('canvas');
  cropped.width = cropW;
  cropped.height = cropH;
  cropped.className = canvas.className;
  const cropCtx = cropped.getContext('2d');
  cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return cropped;
}

/**
 * Render a dragon sprite synchronously using already-cached assets.
 * Falls back to async render if assets aren't cached.
 * Returns a wrapper div immediately (canvas fills in when ready).
 */
export function renderDragonSpriteSync(phenotype, options = {}) {
  const { compact = false } = options;
  const width = compact ? SPRITE_WIDTH_COMPACT : SPRITE_WIDTH;
  const height = compact ? SPRITE_HEIGHT_COMPACT : SPRITE_HEIGHT;

  const wrapper = document.createElement('div');
  wrapper.className = 'dragon-sprite-wrapper';
  wrapper.style.width = width + 'px';
  wrapper.style.height = height + 'px';

  // Start async render, append canvas when done
  renderDragonSprite(phenotype, options).then(canvas => {
    wrapper.appendChild(canvas);
  });

  return wrapper;
}

// ============================================================
// SHIMMER / FINISH ANIMATION SYSTEM
// ============================================================

export function startShimmerAnimation(canvas, effect, dragonRgb) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Capture the static render as a base image
  const baseImageData = ctx.getImageData(0, 0, width, height);

  let animFrame;
  let startTime = performance.now();

  function animate(time) {
    const elapsed = (time - startTime) / 1000;

    // Restore base image
    ctx.putImageData(baseImageData, 0, 0);

    switch (effect.type) {
      case 'gradient_sweep':
        renderGradientSweep(ctx, width, height, elapsed, effect, dragonRgb);
        break;
      case 'shine_pulse':
        renderShinePulse(ctx, width, height, elapsed, effect);
        break;
      case 'hue_shift':
        renderHueShift(ctx, width, height, elapsed, effect, dragonRgb);
        break;
      case 'sparkle':
        renderSparkle(ctx, width, height, elapsed, effect);
        break;
      case 'opacity_pulse':
        renderOpacityPulse(ctx, width, height, elapsed, effect);
        break;
    }

    animFrame = requestAnimationFrame(animate);
  }

  animFrame = requestAnimationFrame(animate);

  // Store cleanup function on canvas for disposal
  canvas._stopAnimation = () => {
    if (animFrame) cancelAnimationFrame(animFrame);
  };
}

// --- Shimmer effect renderers ---

function renderGradientSweep(ctx, w, h, time, effect, dragonRgb) {
  const phase = (time * effect.speed) % 1;
  const x = phase * w * 1.5 - w * 0.25;

  ctx.save();
  ctx.globalCompositeOperation = effect.blendMode;
  ctx.globalAlpha = effect.intensity;

  const grad = ctx.createLinearGradient(x - 80, 0, x + 80, h);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

function renderShinePulse(ctx, w, h, time, effect) {
  const pulse = (Math.sin(time * effect.speed * Math.PI * 2) + 1) / 2;

  ctx.save();
  ctx.globalCompositeOperation = effect.blendMode;
  ctx.globalAlpha = pulse * effect.intensity;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function renderHueShift(ctx, w, h, time, effect, dragonRgb) {
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);
  const shift = Math.sin(time * effect.speed * Math.PI * 2) * effect.hueRange;
  const shiftedHue = (dragonHsl.h + shift + 360) % 360;
  const shiftedRgb = hslToRgb(shiftedHue, dragonHsl.s, 0.5);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, `rgba(${shiftedRgb.r}, ${shiftedRgb.g}, ${shiftedRgb.b}, 0.3)`);
  grad.addColorStop(1, 'transparent');

  ctx.save();
  ctx.globalCompositeOperation = effect.blendMode;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function renderSparkle(ctx, w, h, time, effect) {
  ctx.save();
  ctx.globalCompositeOperation = effect.blendMode;

  // Deterministic sparkle positions based on count
  for (let i = 0; i < effect.count; i++) {
    const phase = (time * effect.speed + i / effect.count) % 1;
    const sparkle = Math.max(0, Math.sin(phase * Math.PI));

    // Pseudo-random but deterministic positions
    const px = ((i * 137.5) % w);
    const py = ((i * 89.3 + 50) % h);

    ctx.globalAlpha = sparkle * effect.intensity;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(px, py, 2 + sparkle * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderOpacityPulse(ctx, w, h, time, effect) {
  const [minA, maxA] = effect.range;
  const pulse = (Math.sin(time * effect.speed * Math.PI * 2) + 1) / 2;
  const targetAlpha = minA + pulse * (maxA - minA);

  // Dim the entire canvas
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.globalAlpha = targetAlpha;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ============================================================
// DEBUG / TEST HARNESS
// ============================================================

/**
 * Render a test dragon with a solid color to validate the pipeline.
 * Uses procedural shapes (no PNGs needed) to test:
 *   - HSL color blend with lighten/darken luminance shifts
 *   - Wing membrane transparency (stacks when overlapping)
 *   - Body opacity from finish gene
 *   - Fixed-color layer (eyes)
 */
export function renderTestSprite(dragonRgb, opacityLevel = 3) {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_WIDTH;
  canvas.height = SPRITE_HEIGHT;
  const ctx = canvas.getContext('2d');

  const bodyAlpha = BODY_TRANSPARENCY[opacityLevel];
  const wingAlpha = WING_TRANSPARENCY[opacityLevel];

  // Simulate a dragon with colored rectangles
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);

  // Helper: get HSL color with luminance shift
  const getColor = (luminanceShift) => {
    const l = Math.max(0, Math.min(1, 0.5 + luminanceShift));
    const rgb = hslToRgb(dragonHsl.h, dragonHsl.s, l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  };

  const baseColor = getColor(0);
  const lightColor = getColor(COLOR_ADJUSTMENTS.lighten.luminanceShift);
  const darkColor = getColor(COLOR_ADJUSTMENTS.darken.luminanceShift);

  // BG wing (membrane - transparent)
  ctx.save();
  ctx.globalAlpha = wingAlpha;
  ctx.fillStyle = lightColor;
  ctx.fillRect(200, 30, 180, 120);
  ctx.restore();

  // BG wing outline
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(200, 30, 180, 120);

  // Body fill
  ctx.save();
  ctx.globalAlpha = bodyAlpha;
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(220, 220, 120, 90, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Belly fill
  ctx.save();
  ctx.globalAlpha = bodyAlpha;
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(220, 260, 80, 40, 0, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  // Body outline (always opaque)
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(220, 220, 120, 90, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Head
  ctx.save();
  ctx.globalAlpha = bodyAlpha;
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(130, 140, 50, 40, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(130, 140, 50, 40, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes (fixed - always opaque, no tint)
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(115, 132, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(115, 132, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // FG wing (membrane - transparent, overlaps body)
  ctx.save();
  ctx.globalAlpha = wingAlpha;
  ctx.fillStyle = lightColor;
  ctx.fillRect(170, 60, 200, 140);
  ctx.restore();

  // FG wing outline
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(170, 60, 200, 140);

  // Tail
  ctx.save();
  ctx.globalAlpha = bodyAlpha;
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(340, 230);
  ctx.quadraticCurveTo(430, 240, 460, 300);
  ctx.quadraticCurveTo(440, 310, 420, 300);
  ctx.quadraticCurveTo(400, 260, 330, 250);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(340, 230);
  ctx.quadraticCurveTo(430, 240, 460, 300);
  ctx.quadraticCurveTo(440, 310, 420, 300);
  ctx.quadraticCurveTo(400, 260, 330, 250);
  ctx.closePath();
  ctx.stroke();

  // Legs
  for (const lx of [170, 280]) {
    ctx.save();
    ctx.globalAlpha = bodyAlpha;
    ctx.fillStyle = baseColor;
    ctx.fillRect(lx - 12, 280, 24, 60);
    ctx.restore();

    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(lx - 12, 280, 24, 60);
  }

  // Label
  ctx.fillStyle = '#888';
  ctx.font = '11px monospace';
  ctx.fillText(`Test Sprite | Opacity: ${opacityLevel} | Body \u03B1: ${bodyAlpha} | Wing \u03B1: ${wingAlpha}`, 10, SPRITE_HEIGHT - 10);

  canvas.className = 'dragon-sprite-canvas';
  return canvas;
}

/**
 * Create an interactive test panel for previewing the color pipeline.
 * Shows the test dragon in multiple colors and opacity levels.
 */
export function createTestPanel() {
  const panel = document.createElement('div');
  panel.className = 'sprite-test-panel';
  panel.style.cssText = 'padding: 16px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;';

  const testColors = [
    { name: 'Red', rgb: { r: 220, g: 40, b: 40 } },
    { name: 'Blue', rgb: { r: 40, g: 80, b: 220 } },
    { name: 'Green', rgb: { r: 40, g: 180, b: 60 } },
    { name: 'Gold', rgb: { r: 220, g: 180, b: 40 } },
    { name: 'Purple', rgb: { r: 160, g: 40, b: 200 } },
    { name: 'Cyan', rgb: { r: 40, g: 200, b: 220 } },
    { name: 'White', rgb: { r: 240, g: 240, b: 240 } },
    { name: 'Black', rgb: { r: 30, g: 30, b: 30 } },
  ];

  // Render each color at different opacity levels
  for (const color of testColors) {
    for (const opacity of [0, 1, 2, 3]) {
      const box = document.createElement('div');
      box.style.cssText = 'text-align: center; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px;';

      const label = document.createElement('div');
      label.style.cssText = 'color: #aaa; font-size: 11px; margin-bottom: 4px;';
      label.textContent = `${color.name} / Opacity ${opacity}`;
      box.appendChild(label);

      const sprite = renderTestSprite(color.rgb, opacity);
      sprite.style.cssText = 'width: 200px; height: 150px;';
      box.appendChild(sprite);

      panel.appendChild(box);
    }
  }

  return panel;
}

/**
 * Render a dragon from a full phenotype using actual PNG assets.
 * This is the main entry point for the game to render dragons.
 * Returns a promise resolving to the canvas, or a placeholder
 * if no PNGs are available yet.
 *
 * @param {object} phenotype - from resolveFullPhenotype()
 * @param {object} options
 * @param {boolean} options.compact - render at half size (256x192)
 * @param {boolean} options.animated - enable finish shimmer effects
 * @param {boolean} options.fallbackToTest - if true, fall back to test sprite when no PNGs
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderDragon(phenotype, options = {}) {
  const { compact = false, animated = false, fallbackToTest = true } = options;

  // Try to render with real PNGs
  const canvas = await renderDragonSprite(phenotype, { compact, animated });

  // Check if anything was actually drawn (canvas might be blank if no PNGs exist)
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let hasPixels = false;
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] > 0) { hasPixels = true; break; }
  }

  if (!hasPixels && fallbackToTest) {
    // No PNGs available yet — fall back to procedural test sprite
    const testCanvas = renderTestSprite(phenotype.color.rgb, classifyLevel(phenotype.finish.levels[0]));
    if (compact) {
      // Resize to compact dimensions
      const compactCanvas = document.createElement('canvas');
      compactCanvas.width = SPRITE_WIDTH_COMPACT;
      compactCanvas.height = SPRITE_HEIGHT_COMPACT;
      const compCtx = compactCanvas.getContext('2d');
      compCtx.drawImage(testCanvas, 0, 0, SPRITE_WIDTH_COMPACT, SPRITE_HEIGHT_COMPACT);
      compactCanvas.className = 'dragon-sprite-canvas';
      return compactCanvas;
    }
    return testCanvas;
  }

  return canvas;
}

/**
 * Debug utility: list all assets that would be used for a phenotype.
 * Useful for verifying gene → asset resolution without PNGs.
 */
export function debugAssetList(phenotype) {
  const matched = resolveAssetsForPhenotype(phenotype);
  console.group(`Dragon Asset List (${matched.length} layers)`);
  for (const asset of matched) {
    const modStr = asset.modifier ? ` [${asset.modifier}]` : '';
    console.log(
      `z${String(asset.z).padStart(2, '0')} | ${asset.filename.padEnd(28)} | ${asset.colorMode.padEnd(7)} | ${asset.opacityMode.padEnd(6)} | ${asset.layerGroup}${modStr}`
    );
  }
  console.groupEnd();
  return matched;
}
