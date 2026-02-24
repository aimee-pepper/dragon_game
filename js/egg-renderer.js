// egg-renderer.js — Canvas-based egg/nest art compositor
// Layers egg_f, egg_o, eggcrack_o, nestbg_o, nestfg_f, nestfg_o
// at correct positions with dragon-color tinting.

const ASSET_PATH = 'assets/ui/ui-assets/';

// ── Asset definitions with native sizes and layout offsets ──
// Egg centered horizontally, nest overlapping bottom ~50% of egg.
// Offsets determined by centering each layer in a 309-wide canvas
// with the egg at top and nest pieces arranged around it.
const COMP_W = 309;
const COMP_H = 273;

const EGG_ASSETS = {
  nestbg_o:  { file: 'nestbg_o.png',  w: 157, h: 63,  ox: 76,  oy: 112, tint: false },
  egg_f:     { file: 'egg_f.png',     w: 138, h: 184, ox: 85,  oy: 0,   tint: 'fill' },
  eggcrack_o:{ file: 'eggcrack_o.png',w: 98,  h: 67,  ox: 105, oy: 59,  tint: 'outline' },
  egg_o:     { file: 'egg_o.png',     w: 151, h: 160, ox: 79,  oy: 12,  tint: 'outline' },
  nestfg_f:  { file: 'nestfg_f.png',  w: 281, h: 169, ox: 14,  oy: 92,  tint: false },
  nestfg_o:  { file: 'nestfg_o.png',  w: 309, h: 187, ox: 0,   oy: 87,  tint: false },
};

// Draw order (back to front)
const FULL_LAYERS = ['nestbg_o', 'egg_f', 'eggcrack_o', 'egg_o', 'nestfg_f', 'nestfg_o'];
const COMPACT_LAYERS = ['egg_f', 'eggcrack_o', 'egg_o'];  // no nest

// ── Image cache ──
const imageCache = new Map();

function loadImage(file) {
  if (imageCache.has(file)) return imageCache.get(file);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = ASSET_PATH + file;
  });
  imageCache.set(file, promise);
  return promise;
}

// ── Color utilities ──
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
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
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

// ── Tinting functions ──

/** Tint grayscale fill art → dragon color (preserve luminance from art) */
function tintFill(ctx, x, y, w, h, dragonRgb) {
  const imgData = ctx.getImageData(x, y, w, h);
  const d = imgData.data;
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const artL = lum / 255;
    const result = hslToRgb(dragonHsl.h, dragonHsl.s, artL);
    d[i]     = result.r;
    d[i + 1] = result.g;
    d[i + 2] = result.b;
  }
  ctx.putImageData(imgData, x, y);
}

/** Detect how "red" a pixel is (same approach as sprite-renderer) */
function redAmount(r, g, b) {
  const total = r + g + b;
  if (total < 30) return 0;
  return Math.max(0, (r / total - 0.34) / 0.66);
}

/** Tint red outline art → dark version of dragon color */
function tintOutline(ctx, x, y, w, h, dragonRgb) {
  const imgData = ctx.getImageData(x, y, w, h);
  const d = imgData.data;
  const dragonHsl = rgbToHsl(dragonRgb.r, dragonRgb.g, dragonRgb.b);
  // Outline uses darkened dragon color
  const darkenShift = -0.25;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const rAmt = redAmount(d[i], d[i + 1], d[i + 2]);
    if (rAmt <= 0) continue;

    // Extract luminance from the grey component
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let targetL = (lum / 255) + darkenShift;
    targetL = Math.max(0.05, Math.min(0.95, targetL));

    const result = hslToRgb(dragonHsl.h, dragonHsl.s * 0.6, targetL);
    d[i]     = result.r;
    d[i + 1] = result.g;
    d[i + 2] = result.b;
    // Preserve alpha from original art
  }
  ctx.putImageData(imgData, x, y);
}

// ── Main renderer ──

/**
 * Render an egg/nest composite to a canvas element.
 * @param {string} colorHex - Dragon body color hex (e.g. '#8B2252')
 * @param {boolean} hasMutation - Whether to show crack overlay
 * @param {boolean} compact - If true, render egg only (no nest)
 * @param {number} displaySize - CSS pixel size for the output canvas
 * @returns {HTMLCanvasElement}
 */
export async function renderEgg(colorHex, hasMutation, compact = false, displaySize = 72) {
  const dragonRgb = hexToRgb(colorHex || '#888888');
  const layers = compact ? COMPACT_LAYERS : FULL_LAYERS;

  // Filter out crack layer if no mutation
  const activeLayers = layers.filter(id =>
    id !== 'eggcrack_o' || hasMutation
  );

  // Load all needed images
  const images = {};
  await Promise.all(activeLayers.map(async id => {
    images[id] = await loadImage(EGG_ASSETS[id].file);
  }));

  // Determine canvas bounds
  let canvasW, canvasH;
  if (compact) {
    // For compact mode, just fit the egg
    canvasW = 151;  // egg_o width (widest egg asset)
    canvasH = 184;  // egg_f height (tallest egg asset)
  } else {
    canvasW = COMP_W;
    canvasH = COMP_H;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  // Draw each layer — tinted layers use a temp canvas to avoid bleeding into other layers
  for (const id of activeLayers) {
    const asset = EGG_ASSETS[id];
    const img = images[id];

    let dx, dy;
    if (compact) {
      dx = Math.round((canvasW - asset.w) / 2);
      dy = Math.round((canvasH - asset.h) / 2);
    } else {
      dx = asset.ox;
      dy = asset.oy;
    }

    if (asset.tint) {
      // Tint on a temp canvas so we don't modify already-composited pixels
      const tmp = document.createElement('canvas');
      tmp.width = asset.w;
      tmp.height = asset.h;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(img, 0, 0, asset.w, asset.h);

      if (asset.tint === 'fill') {
        tintFill(tctx, 0, 0, asset.w, asset.h, dragonRgb);
      } else {
        tintOutline(tctx, 0, 0, asset.w, asset.h, dragonRgb);
      }

      ctx.drawImage(tmp, dx, dy);
    } else {
      ctx.drawImage(img, dx, dy, asset.w, asset.h);
    }
  }

  // Set display size via CSS
  const aspect = canvasW / canvasH;
  if (aspect >= 1) {
    canvas.style.width = displaySize + 'px';
    canvas.style.height = Math.round(displaySize / aspect) + 'px';
  } else {
    canvas.style.height = displaySize + 'px';
    canvas.style.width = Math.round(displaySize * aspect) + 'px';
  }

  canvas.className = 'egg-canvas';
  return canvas;
}
