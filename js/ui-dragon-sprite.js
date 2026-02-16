// CSS pixel-art dragon sprite renderer (v3 — even larger, more detailed limbs/wings)
// Reads phenotype traits and builds a colored grid representing the dragon

const CELL_PX = 5;          // each pixel cell in CSS pixels (full card)
const CELL_PX_COMPACT = 3;  // compact mode (parent slots)
const GRID_ROWS = 72;       // taller canvas for legs + bulky sag
const MAX_COLS = 140;       // wider canvas for elongated bodies + head + tail

// ── Color utilities ──────────────────────────────────────────

function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
  return `rgb(${r},${g},${b})`;
}

function blendColors(hex, overlayRgb, alpha) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.round((num >> 16) * (1 - alpha) + overlayRgb[0] * alpha);
  const g = Math.round(((num >> 8) & 0xFF) * (1 - alpha) + overlayRgb[1] * alpha);
  const b = Math.round((num & 0xFF) * (1 - alpha) + overlayRgb[2] * alpha);
  return `rgb(${r},${g},${b})`;
}

// ── Finish post-processing utilities ────────────────────────

function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return { r: num >> 16, g: (num >> 8) & 0xFF, b: num & 0xFF };
}

function parseRgbOrHex(colorStr) {
  if (colorStr.startsWith('#')) return hexToRgb(colorStr);
  const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) return { r: +match[1], g: +match[2], b: +match[3] };
  return { r: 128, g: 128, b: 128 };
}

function clamp(v) { return Math.round(Math.min(255, Math.max(0, v))); }

function rgbToHslLocal(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
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
    h *= 360;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// ── Finish post-processing: Shine contrast ──────────────────

// ── Finish post-processing: Opacity paleness ────────────────

function applyOpacityPale(grid, opacityLevel) {
  // Low opacity → paler, more washed-out colors (blend toward white)
  // opacityLevel 3: no change, opacityLevel 0: blend 35% toward white
  if (opacityLevel >= 2.5) return;
  const paleFactor = Math.max(0, (2.5 - opacityLevel) / 2.5) * 0.35;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < MAX_COLS; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.type === 'eye' || cell.type === 'breath' || cell.type === 'nostril') continue;

      const rgb = parseRgbOrHex(cell.color);
      // Blend toward white (255,255,255) by paleFactor
      const newR = clamp(rgb.r + (255 - rgb.r) * paleFactor);
      const newG = clamp(rgb.g + (255 - rgb.g) * paleFactor);
      const newB = clamp(rgb.b + (255 - rgb.b) * paleFactor);
      cell.color = `rgb(${newR},${newG},${newB})`;
    }
  }
}

// ── Finish post-processing: Shine contrast ──────────────────

function applyShineContrast(grid, baseHex, shineLevel) {
  // shineLevel 0 (matte) → contrastFactor 0.5 (flat)
  // shineLevel 1.5 → contrastFactor 1.0 (normal)
  // shineLevel 3 (glossy) → contrastFactor 1.5 (vivid)
  const contrastFactor = 0.5 + (shineLevel / 3);
  const baseRgb = hexToRgb(baseHex);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < MAX_COLS; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.type === 'eye' || cell.type === 'breath' || cell.type === 'nostril') continue;

      const cellRgb = parseRgbOrHex(cell.color);
      const newR = clamp(baseRgb.r + (cellRgb.r - baseRgb.r) * contrastFactor);
      const newG = clamp(baseRgb.g + (cellRgb.g - baseRgb.g) * contrastFactor);
      const newB = clamp(baseRgb.b + (cellRgb.b - baseRgb.b) * contrastFactor);
      cell.color = `rgb(${newR},${newG},${newB})`;
    }
  }
}

// ── Finish post-processing: Metallic edge ───────────────────

function applyMetallicEdge(grid, baseHex, opacityLevel, shineLevel) {
  // Both opacity and shine must be moderate+ for metallic to appear
  const metallicStrength = Math.max(0, (Math.min(opacityLevel, shineLevel) - 0.75) / 2.25);
  if (metallicStrength <= 0) return false;

  const edgeBrighten = Math.round(35 * metallicStrength);
  const topDarken = Math.round(25 * metallicStrength);

  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // First pass: identify edges
  const edgeCells = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < MAX_COLS; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.type === 'eye' || cell.type === 'breath' || cell.type === 'nostril') continue;

      let isEdge = false;
      let hasEmptyAbove = false;
      for (const [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= MAX_COLS || !grid[nr][nc]) {
          isEdge = true;
          if (dr === -1) hasEmptyAbove = true;
        }
      }
      if (isEdge) {
        edgeCells.push({ r, c, hasEmptyAbove });
      }
    }
  }

  // Second pass: apply modifications and mark as edge
  for (const { r, c, hasEmptyAbove } of edgeCells) {
    const cell = grid[r][c];
    const rgb = parseRgbOrHex(cell.color);

    if (hasEmptyAbove) {
      // Top edge: dark inner shadow
      cell.color = `rgb(${clamp(rgb.r - topDarken)},${clamp(rgb.g - topDarken)},${clamp(rgb.b - topDarken)})`;
    } else {
      // Other edges: bright highlight
      cell.color = `rgb(${clamp(rgb.r + edgeBrighten)},${clamp(rgb.g + edgeBrighten)},${clamp(rgb.b + edgeBrighten)})`;
    }
    cell.isEdge = true;
  }

  return true; // metallic was applied
}

// ── Finish post-processing: Schiller hue variance ───────────

function applySchillerHue(grid, schillerLevel) {
  if (schillerLevel < 0.1) return;

  // maxHueShift in degrees: subtle at low, vivid at high
  const maxHueShift = (schillerLevel / 3) * 25;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < MAX_COLS; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.type === 'eye' || cell.type === 'breath' || cell.type === 'nostril') continue;

      const rgb = parseRgbOrHex(cell.color);
      const hsl = rgbToHslLocal(rgb.r, rgb.g, rgb.b);

      // Skip near-achromatic pixels
      if (hsl.s < 0.08) continue;

      // Deterministic spatial noise using sin of primes
      const noise = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
      const offset = (noise - Math.floor(noise)) * 2 - 1; // -1 to +1

      hsl.h = (hsl.h + offset * maxHueShift + 360) % 360;

      const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      cell.color = `rgb(${newRgb.r},${newRgb.g},${newRgb.b})`;
    }
  }
}

// ── Grid helpers ─────────────────────────────────────────────

function put(grid, row, col, color, type) {
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < MAX_COLS && color) {
    grid[row][col] = { color, type: type || 'body' };
  }
}

function rect(grid, r, c, h, w, color, type) {
  for (let dr = 0; dr < h; dr++)
    for (let dc = 0; dc < w; dc++)
      put(grid, r + dr, c + dc, color, type);
}

function ellipse(grid, centerR, centerC, radR, radC, color, type) {
  for (let dr = -radR; dr <= radR; dr++) {
    for (let dc = -radC; dc <= radC; dc++) {
      if ((dr * dr) / (radR * radR) + (dc * dc) / (radC * radC) <= 1.0) {
        put(grid, centerR + dr, centerC + dc, color, type);
      }
    }
  }
}

// ── Main builder ─────────────────────────────────────────────

function buildSpriteGrid(phenotype) {
  const t = phenotype.traits;
  const baseColor = phenotype.color.hex;
  const darkColor = shadeColor(baseColor, -25);
  const darkerColor = shadeColor(baseColor, -45);
  const darkestColor = shadeColor(baseColor, -60);
  const lightColor = shadeColor(baseColor, 25);
  const lighterColor = shadeColor(baseColor, 40);
  const hornColor = shadeColor(baseColor, -55);
  const clawColor = shadeColor(baseColor, -65);
  const wingMembraneColor = shadeColor(baseColor, 18);
  const wingBoneColor = shadeColor(baseColor, -20);
  const underbellyColor = shadeColor(baseColor, 30);
  const breathColor = phenotype.breathElement.displayColor || '#666';

  // Trait values (use ?? not || so that 0 is preserved as a valid value)
  const size = t.body_size?.rounded ?? 4;
  const bodyType = t.body_type?.rounded ?? 2;
  const scales = t.body_scales?.rounded ?? 2;
  const wings = t.frame_wings?.rounded ?? 2;
  const limbs = t.frame_limbs?.rounded ?? 2;
  const hornStyle = t.horn_style?.level ?? 0;
  const hornDir = t.horn_direction?.level ?? 0;
  const spineStyle = t.spine_style?.level ?? 0;
  const spineHt = t.spine_height?.rounded ?? 2;
  const tailLen = t.tail_length?.rounded ?? 2;
  const tailShape = t.tail_shape?.rounded ?? 2;

  const grid = [];
  for (let r = 0; r < GRID_ROWS; r++) grid.push(new Array(MAX_COLS).fill(null));

  // ── BODY DIMENSIONS ──
  // Base radius used for scaling neck, head, legs, etc.
  const baseBodyW = size + 9;   // 10-15 half-width in cells
  const bodyRadC = Math.round(baseBodyW / 2);

  // Horizontal body radius varies by body type
  // Normal: 1.5× base for longer horizontal body
  // Bulky: 1.5× base + 2 for extra girth
  // Serpentine: uses bodyRadC for S-curve length calc (not ellipse)
  const bodyDrawRadC = bodyType === 2 ? Math.round(bodyRadC * 1.5)
                     : bodyType === 3 ? Math.round(bodyRadC * 1.5) + 2
                     : bodyRadC; // serpentine (unused for ellipse)

  let bodyRadR;
  if (bodyType === 3) {         // bulky: taller to allow belly sag
    bodyRadR = Math.max(5, bodyRadC + 1);
  } else {                      // normal (2) and serpentine (1, uses S-curve instead)
    bodyRadR = bodyRadC;
  }
  bodyRadR = Math.min(bodyRadR, 12);

  // Center of the body in the grid
  const bodyCR = Math.floor(GRID_ROWS / 2) + 2;
  // Shift body center right enough to fit neck + head + snout + breath to the left
  const bodyCC = 38;

  // Serpentine S-curve data: maps column → { centerRow, halfThick }
  // Used for attaching legs, wings, spines to the S-curve
  const snakeCenterAtCol = {};
  let snakeStartCol = 0;
  let snakeEndCol = 0;

  // ── DRAW BODY ──
  if (bodyType === 1) {
    // ── SERPENTINE BODY: sinuous S-curve (snake/wyrm shape) ──
    const snakeLen = bodyRadC * 3 + 8;  // longer body for serpentine
    const snakeThick = Math.max(3, Math.round(size * 0.8) + 2);
    const amplitude = Math.max(3, Math.round(bodyRadR * 0.55));
    snakeStartCol = bodyCC - Math.floor(snakeLen / 2);
    snakeEndCol = snakeStartCol + snakeLen - 1;

    for (let i = 0; i < snakeLen; i++) {
      const col = snakeStartCol + i;
      const t = i / snakeLen;

      const wave = Math.round(Math.sin(t * Math.PI * 2) * amplitude);
      const centerRow = bodyCR + wave;

      const taper = 1 - Math.pow(2 * t - 1, 4);
      const localThick = Math.max(2, Math.round(snakeThick * taper));
      const halfThick = Math.floor(localThick / 2);

      // Store for attachment points
      snakeCenterAtCol[col] = { centerRow, halfThick };

      for (let dr = -halfThick; dr <= halfThick; dr++) {
        const row = centerRow + dr;
        let cellColor = baseColor;

        if (dr > halfThick * 0.3) cellColor = underbellyColor;
        if (dr === halfThick && i % 3 === 0) cellColor = shadeColor(underbellyColor, -10);
        if (dr === -halfThick) cellColor = darkColor;

        if (scales === 3 && (Math.abs(dr) === halfThick || (i % 4 === 0 && Math.abs(dr) < halfThick))) {
          cellColor = darkColor;
        }
        if (scales === 2 && (row + col) % 3 === 0 && Math.abs(dr) < halfThick) {
          cellColor = shadeColor(baseColor, -8);
        }
        if (dr < -halfThick * 0.3 && wave < -amplitude * 0.3) {
          cellColor = shadeColor(cellColor, 10);
        }

        put(grid, row, col, cellColor, 'body');
      }
    }
  } else if (bodyType === 3) {
    // ── BULKY BODY: wider, asymmetric with belly sag ──
    const topRadR = bodyRadR;             // normal top half
    const bottomRadR = bodyRadR + 2;      // extended belly sag

    for (let dr = -topRadR; dr <= bottomRadR; dr++) {
      // Use topRadR for upper half, bottomRadR for lower half
      const effectiveRadR = dr <= 0 ? topRadR : bottomRadR;
      for (let dc = -bodyDrawRadC; dc <= bodyDrawRadC; dc++) {
        const dist = (dr * dr) / (effectiveRadR * effectiveRadR) + (dc * dc) / (bodyDrawRadC * bodyDrawRadC);
        if (dist <= 1.0) {
          const row = bodyCR + dr;
          const col = bodyCC + dc;
          let cellColor = baseColor;

          // Shoulder musculature (upper-front, darker)
          if (dr < -topRadR * 0.2 && dc < -bodyDrawRadC * 0.1 && dist < 0.55) {
            cellColor = shadeColor(baseColor, -12);
          }

          // Chest plate highlight (upper-center, lighter)
          if (dr < -topRadR * 0.1 && dr > -topRadR * 0.6 && Math.abs(dc) < bodyDrawRadC * 0.4 && dist < 0.4) {
            cellColor = shadeColor(baseColor, 15);
          }

          // Belly ridge (horizontal line at widest point of lower half)
          if (dr === Math.floor(bottomRadR * 0.5) && Math.abs(dc) < bodyDrawRadC * 0.8) {
            cellColor = darkColor;
          }

          // Underbelly (lower half — lighter)
          if (dr > bottomRadR * 0.3) {
            cellColor = underbellyColor;
          }

          // Subtle midline shading
          if (Math.abs(dr) < effectiveRadR * 0.15) {
            cellColor = shadeColor(cellColor, 5);
          }

          // Armored: segmented plates along edges
          if (scales === 3) {
            if (dist > 0.6) cellColor = darkColor;
            if (dist > 0.35 && dist < 0.6 && (row + col) % 4 === 0) {
              cellColor = shadeColor(cellColor, -10);
            }
          }

          // Textured: subtle dither
          if (scales === 2 && dist < 0.7 && (row + col) % 3 === 0) {
            cellColor = shadeColor(baseColor, -8);
          }

          put(grid, row, col, cellColor, 'body');
        }
      }
    }
  } else {
    // ── NORMAL BODY (ellipse with detail) ──
    for (let dr = -bodyRadR; dr <= bodyRadR; dr++) {
      for (let dc = -bodyDrawRadC; dc <= bodyDrawRadC; dc++) {
        const dist = (dr * dr) / (bodyRadR * bodyRadR) + (dc * dc) / (bodyDrawRadC * bodyDrawRadC);
        if (dist <= 1.0) {
          const row = bodyCR + dr;
          const col = bodyCC + dc;
          let cellColor = baseColor;

          if (dr > bodyRadR * 0.45) cellColor = underbellyColor;
          if (Math.abs(dr) < bodyRadR * 0.15) cellColor = shadeColor(cellColor, 5);

          if (scales === 3) {
            if (dist > 0.65) cellColor = darkColor;
            if (dist > 0.4 && dist < 0.65 && (row + col) % 4 === 0) {
              cellColor = shadeColor(cellColor, -10);
            }
          }

          if (scales === 2 && dist < 0.7 && (row + col) % 3 === 0) {
            cellColor = shadeColor(baseColor, -8);
          }

          if (dr < -bodyRadR * 0.35 && dc < -bodyDrawRadC * 0.15 && dist < 0.45) {
            cellColor = shadeColor(cellColor, 12);
          }

          put(grid, row, col, cellColor, 'body');
        }
      }
    }
  }

  // ── NECK (curved, detailed) ──
  const neckLen = Math.max(3, Math.round(bodyRadC * 0.7));
  const neckThick = Math.max(3, Math.round(bodyRadR * 0.45));
  // Serpentine: neck starts at left end of S-curve; others: left edge of ellipse
  const neckStartCol = bodyType === 1 ? snakeStartCol - 1 : bodyCC - bodyDrawRadC - 1;
  // Serpentine: neck row connects to S-curve start row (wave=0 at i=0, so row=bodyCR)
  const neckBaseRow = bodyType === 1 ? bodyCR : bodyCR;
  for (let i = 0; i < neckLen; i++) {
    const col = neckStartCol - i;
    const curveUp = Math.round(i * 0.6);
    for (let t2 = 0; t2 < neckThick; t2++) {
      const row = neckBaseRow - Math.floor(neckThick / 2) + t2 - curveUp;
      let c;
      if (t2 === 0) c = darkColor;
      else if (t2 === neckThick - 1) c = underbellyColor;
      else if (t2 === 1) c = baseColor;
      else c = shadeColor(baseColor, 3);
      put(grid, row, col, c, 'neck');
    }
  }

  // ── HEAD (larger, more detailed) ──
  const headRadC = Math.max(3, Math.round(bodyRadC * 0.5));
  const headRadR = Math.max(3, Math.round(bodyRadR * 0.45));
  const headCC = neckStartCol - neckLen - headRadC + 1;
  const headCR = bodyCR - Math.round(neckLen * 0.6) - 1;

  // Main head ellipse
  for (let dr = -headRadR; dr <= headRadR; dr++) {
    for (let dc = -headRadC; dc <= headRadC; dc++) {
      const dist = (dr * dr) / (headRadR * headRadR) + (dc * dc) / (headRadC * headRadC);
      if (dist <= 1.0) {
        let c = baseColor;
        // Jaw/chin area lighter
        if (dr > headRadR * 0.4) c = underbellyColor;
        // Top of head slightly darker
        if (dr < -headRadR * 0.5 && dist < 0.6) c = shadeColor(baseColor, -5);
        put(grid, headCR + dr, headCC + dc, c, 'head');
      }
    }
  }

  // Snout (extends forward, more defined)
  const snoutLen = Math.max(3, headRadC + 1);
  const snoutH = Math.max(2, headRadR - 1);
  for (let i = 0; i < snoutLen; i++) {
    const col = headCC - headRadC - i;
    const thicc = Math.max(1, snoutH - Math.floor(i * 0.35));
    for (let t2 = 0; t2 < thicc; t2++) {
      const row = headCR + Math.floor(headRadR * 0.15) + t2;
      let c;
      if (t2 === 0) c = baseColor;
      else if (t2 === thicc - 1) c = underbellyColor;
      else c = darkColor;
      put(grid, row, col, c, 'snout');
    }
  }

  // Nostril (2 pixels for definition)
  const nostrilCol = headCC - headRadC - snoutLen + 1;
  const nostrilRow = headCR + Math.floor(headRadR * 0.15);
  put(grid, nostrilRow, nostrilCol, darkerColor, 'nostril');
  put(grid, nostrilRow, nostrilCol + 1, darkestColor, 'nostril');

  // Mouth line under snout (thicker jaw line)
  const mouthRow = headCR + Math.floor(headRadR * 0.15) + Math.max(2, snoutH);
  for (let i = 0; i < snoutLen; i++) {
    put(grid, mouthRow, headCC - headRadC - i, darkerColor, 'mouth');
    if (i < snoutLen - 2) {
      put(grid, mouthRow - 1, headCC - headRadC - i, darkColor, 'mouth');
    }
  }

  // Eye (bigger, more detail)
  const eyeRow = headCR - Math.max(1, Math.floor(headRadR * 0.25));
  const eyeCol = headCC - Math.floor(headRadC * 0.25);
  // Eye socket
  put(grid, eyeRow - 1, eyeCol - 1, darkColor, 'eye');
  put(grid, eyeRow - 1, eyeCol, darkColor, 'eye');
  put(grid, eyeRow - 1, eyeCol + 1, darkColor, 'eye');
  // Eye whites
  put(grid, eyeRow, eyeCol - 1, '#dddddd', 'eye');
  put(grid, eyeRow, eyeCol, '#eeeeee', 'eye');
  put(grid, eyeRow, eyeCol + 1, '#cccccc', 'eye');
  put(grid, eyeRow + 1, eyeCol - 1, '#bbbbbb', 'eye');
  put(grid, eyeRow + 1, eyeCol, '#cccccc', 'eye');
  // Pupil (2 pixels)
  put(grid, eyeRow, eyeCol, '#111111', 'eye');
  put(grid, eyeRow + 1, eyeCol, '#222222', 'eye');
  // Eye glint
  put(grid, eyeRow, eyeCol - 1, '#ffffff', 'eye');
  // Brow ridge (heavier)
  for (let bc = -2; bc <= 2; bc++) {
    put(grid, eyeRow - 2, eyeCol + bc, darkColor, 'head');
  }

  // ── BREATH ──
  if (phenotype.breathElement.key !== 'L-L-L') {
    const bStartCol = nostrilCol - 1;
    const bRow = nostrilRow;
    const breathHex = breathColor.startsWith('#') ? breathColor : '#ff4422';
    const breathFade = shadeColor(breathHex, 20);
    const breathFade2 = shadeColor(breathHex, 40);
    // Larger breath puff
    put(grid, bRow, bStartCol, breathColor, 'breath');
    put(grid, bRow - 1, bStartCol, breathColor, 'breath');
    put(grid, bRow + 1, bStartCol, breathColor, 'breath');
    put(grid, bRow, bStartCol - 1, breathColor, 'breath');
    put(grid, bRow - 1, bStartCol - 1, breathFade, 'breath');
    put(grid, bRow + 1, bStartCol - 1, breathFade, 'breath');
    put(grid, bRow - 2, bStartCol - 1, breathFade, 'breath');
    put(grid, bRow + 2, bStartCol - 1, breathFade, 'breath');
    put(grid, bRow, bStartCol - 2, breathFade, 'breath');
    put(grid, bRow - 1, bStartCol - 2, breathFade2, 'breath');
    put(grid, bRow + 1, bStartCol - 2, breathFade2, 'breath');
    put(grid, bRow, bStartCol - 3, breathFade2, 'breath');
  }

  // ── HORNS (bigger, more detailed) ──
  if (hornStyle > 0) {
    const hornBaseRow = headCR - headRadR;
    const hornBaseCol = headCC;
    const hornLen = hornStyle + 2; // 3-5 cells long

    for (const offset of [-2, 2]) {
      const hCol = hornBaseCol + offset;
      // Horn base (thicker at attachment)
      put(grid, hornBaseRow, hCol, hornColor, 'horn');
      put(grid, hornBaseRow, hCol + (offset > 0 ? 1 : -1), darkColor, 'horn');

      if (hornDir === 0) { // Forward
        for (let i = 0; i < hornLen; i++) {
          put(grid, hornBaseRow - 1, hCol - i - 1, hornColor, 'horn');
          if (i < hornLen - 1) put(grid, hornBaseRow, hCol - i - 1, hornColor, 'horn');
          if (hornStyle >= 2 && i < 2) put(grid, hornBaseRow - 2, hCol - i - 1, hornColor, 'horn');
        }
      } else if (hornDir === 1) { // Swept-back
        for (let i = 0; i < hornLen; i++) {
          put(grid, hornBaseRow - 1 - i, hCol + i + 1, hornColor, 'horn');
          put(grid, hornBaseRow - i, hCol + i + 1, hornColor, 'horn');
          if (hornStyle >= 2 && i < 2) put(grid, hornBaseRow - 1 - i, hCol + i + 2, hornColor, 'horn');
        }
      } else { // Upward
        for (let i = 0; i < hornLen; i++) {
          put(grid, hornBaseRow - 2 - i, hCol, hornColor, 'horn');
          if (i < hornLen - 1) put(grid, hornBaseRow - 2 - i, hCol + (offset > 0 ? 1 : -1), hornColor, 'horn');
        }
        if (hornStyle >= 2) put(grid, hornBaseRow - 2, hCol + offset, hornColor, 'horn');
      }
    }

    // Knobbed: larger bulbous tip
    if (hornStyle === 3) {
      for (const offset of [-2, 2]) {
        const hCol = hornBaseCol + offset;
        if (hornDir === 0) {
          const tipCol = hCol - hornLen;
          ellipse(grid, hornBaseRow - 1, tipCol, 1, 1, hornColor, 'horn');
        } else if (hornDir === 1) {
          const tipCol = hCol + hornLen + 1;
          const tipRow = hornBaseRow - hornLen;
          ellipse(grid, tipRow, tipCol, 1, 1, hornColor, 'horn');
        } else {
          const tipRow = hornBaseRow - 2 - hornLen;
          ellipse(grid, tipRow, hCol, 1, 1, hornColor, 'horn');
        }
      }
    }
  }

  // ── WINGS (much more detailed, bigger) ──
  if (wings > 0) {
    let wingBaseCol, wingBaseRow;

    if (bodyType === 1) {
      // Serpentine: wings attach at the highest hump of the S-curve
      // Find the column where the S-curve peaks upward (minimum centerRow)
      let bestCol = bodyCC, bestRow = bodyCR;
      for (const [colStr, data] of Object.entries(snakeCenterAtCol)) {
        if (data.centerRow < bestRow) {
          bestRow = data.centerRow;
          bestCol = parseInt(colStr);
        }
      }
      wingBaseCol = bestCol;
      wingBaseRow = bestRow - snakeCenterAtCol[bestCol].halfThick;
    } else {
      wingBaseCol = bodyCC - Math.floor(bodyDrawRadC * 0.3);
      wingBaseRow = bodyCR - bodyRadR;
    }

    // Wing dimensions scale more dramatically
    const wingH = 4 + wings * 3;     // 7-16 cells tall
    const wingSpan = 3 + wings * 3;  // 6-15 cells wide

    drawWing(grid, wingBaseRow, wingBaseCol, wingH, wingSpan, wingMembraneColor, wingBoneColor, darkColor, darkerColor, lighterColor);

    // Second pair (quad+)
    if (wings >= 3) {
      const w2Col = bodyType === 1 ? wingBaseCol + Math.floor(bodyRadC * 0.5) : bodyCC + Math.floor(bodyDrawRadC * 0.2);
      const w2Row = bodyType === 1 && snakeCenterAtCol[w2Col] ? snakeCenterAtCol[w2Col].centerRow - snakeCenterAtCol[w2Col].halfThick : wingBaseRow + 2;
      const w2H = Math.max(5, wingH - 4);
      const w2Span = Math.max(4, wingSpan - 3);
      drawWing(grid, w2Row, w2Col, w2H, w2Span, wingMembraneColor, wingBoneColor, darkColor, darkerColor, lighterColor);
    }

    // Third pair (six wings)
    if (wings >= 4) {
      const w3Col = bodyType === 1 ? wingBaseCol + Math.floor(bodyRadC * 0.9) : bodyCC + Math.floor(bodyDrawRadC * 0.6);
      const w3Row = bodyType === 1 && snakeCenterAtCol[w3Col] ? snakeCenterAtCol[w3Col].centerRow - snakeCenterAtCol[w3Col].halfThick : wingBaseRow + 3;
      const w3H = Math.max(4, wingH - 7);
      const w3Span = Math.max(3, wingSpan - 5);
      drawWing(grid, w3Row, w3Col, w3H, w3Span, wingMembraneColor, wingBoneColor, darkColor, darkerColor, lighterColor);
    }
  }

  // ── SPINES (along the back, from neck to tail) ──
  if (spineStyle > 0) {
    let spineStartC, spineEndC;
    if (bodyType === 1) {
      spineStartC = snakeStartCol + 1;
      spineEndC = snakeEndCol - 1;
    } else {
      spineStartC = bodyCC - bodyDrawRadC + 1;
      spineEndC = bodyCC + bodyDrawRadC - 1;
    }
    const spineCount = spineEndC - spineStartC;

    for (let i = 0; i <= spineCount; i++) {
      const col = spineStartC + i;
      let topRow;

      if (bodyType === 1 && snakeCenterAtCol[col]) {
        // Serpentine: use S-curve data for dorsal ridge
        topRow = snakeCenterAtCol[col].centerRow - snakeCenterAtCol[col].halfThick;
      } else {
        // Normal/Bulky: scan upward from body center
        topRow = bodyCR;
        const scanStart = bodyType === 3 ? bodyCR - (bodyRadR + 2) : bodyCR - bodyRadR;
        for (let r = scanStart; r < bodyCR; r++) {
          if (grid[r] && grid[r][col]) { topRow = r; break; }
        }
      }

      if (spineStyle === 1) { // Ridge: dots every 2
        if (i % 2 === 0) {
          put(grid, topRow - 1, col, darkColor, 'spine');
          put(grid, topRow - 2, col, darkerColor, 'spine');
        }
      } else if (spineStyle === 2) { // Spikes: triangular, taller
        const maxH = spineHt + 1;
        const isLong = (i % 2 === 0);
        const h = isLong ? maxH : Math.max(1, maxH - 1);
        for (let s = 0; s < h; s++) {
          const c = (s === h - 1) ? darkerColor : (s === h - 2 ? darkColor : shadeColor(baseColor, -15));
          put(grid, topRow - 1 - s, col, c, 'spine');
        }
        // Spike base wider
        if (isLong && i > 0 && i < spineCount) {
          put(grid, topRow - 1, col - 1, darkColor, 'spine');
          put(grid, topRow - 1, col + 1, darkColor, 'spine');
        }
      } else if (spineStyle === 3) { // Sail: filled membrane
        const h = spineHt + 2;
        for (let s = 0; s < h; s++) {
          let c;
          if (s === 0) c = darkColor;
          else if (s === h - 1) c = shadeColor(baseColor, 35);
          else if (s % 3 === 0) c = wingBoneColor; // vein lines in sail
          else c = wingMembraneColor;
          put(grid, topRow - 1 - s, col, c, 'spine');
        }
      }
    }

    // Extend spines along neck too
    if (spineStyle >= 2) {
      for (let i = 0; i < neckLen; i += 2) {
        const col = neckStartCol - i;
        const curveUp = Math.round(i * 0.6);
        const neckTopRow = neckBaseRow - Math.floor(neckThick / 2) - curveUp;
        const h = Math.max(1, spineHt - 1);
        for (let s = 0; s < h; s++) {
          put(grid, neckTopRow - 1 - s, col, (s === h - 1) ? darkerColor : darkColor, 'spine');
        }
      }
    }
  }

  // ── LIMBS / LEGS (much more detailed, works on ALL body types) ──
  const legLength = 3 + Math.floor(size * 0.5); // 3-6 cells, shorter stockier legs

  // Helper: find leg attach row & col for serpentine body at a given % along the curve
  // Embeds legs 1 row into the body for flush attachment
  function serpentineLegAttach(pct) {
    const targetCol = Math.round(snakeStartCol + (snakeEndCol - snakeStartCol) * pct);
    const data = snakeCenterAtCol[targetCol];
    if (data) {
      return { row: data.centerRow + data.halfThick - 1, col: targetCol };
    }
    return { row: bodyCR + bodyRadR - 2, col: targetCol };
  }

  // Helper: find actual body bottom at a given column by scanning downward
  // Returns a row slightly INSIDE the body so legs look embedded in the torso
  function findBodyBottom(col) {
    let bottomRow = bodyCR;
    for (let r = bodyCR; r < GRID_ROWS; r++) {
      if (grid[r] && grid[r][col] && grid[r][col].type === 'body') {
        bottomRow = r;
      } else if (bottomRow > bodyCR) {
        break; // found the bottom edge
      }
    }
    // Pull legs 2 rows up into the body for a flush/embedded look
    return Math.max(bodyCR, bottomRow - 2);
  }

  if (limbs >= 1) {
    if (bodyType === 1) {
      const fl = serpentineLegAttach(0.2);
      drawDetailedLeg(grid, fl.row, fl.col - 1, legLength, darkColor, baseColor, clawColor, underbellyColor, true);
      drawDetailedLeg(grid, fl.row, fl.col + 2, legLength, darkColor, baseColor, clawColor, underbellyColor, false);
    } else {
      // Normal/Bulky: front legs at front of body
      const frontLegCol1 = bodyCC - Math.floor(bodyDrawRadC * 0.6);
      const frontLegCol2 = frontLegCol1 + 3;
      const frontAttach = findBodyBottom(frontLegCol1 + 1);
      drawDetailedLeg(grid, frontAttach, frontLegCol1, legLength, darkColor, baseColor, clawColor, underbellyColor, true);
      drawDetailedLeg(grid, frontAttach, frontLegCol2, legLength, darkColor, baseColor, clawColor, underbellyColor, false);
    }
  }

  if (limbs >= 2) {
    if (bodyType === 1) {
      const rl = serpentineLegAttach(0.75);
      drawDetailedLeg(grid, rl.row, rl.col - 1, legLength + 1, darkColor, baseColor, clawColor, underbellyColor, true);
      drawDetailedLeg(grid, rl.row, rl.col + 2, legLength + 1, darkColor, baseColor, clawColor, underbellyColor, false);
    } else {
      // Normal/Bulky: rear legs at rear of body
      const rearLegCol1 = bodyCC + Math.floor(bodyDrawRadC * 0.6) - 3;
      const rearLegCol2 = rearLegCol1 + 3;
      const rearAttach = findBodyBottom(rearLegCol1 + 1);
      drawDetailedLeg(grid, rearAttach, rearLegCol1, legLength + 1, darkColor, baseColor, clawColor, underbellyColor, true);
      drawDetailedLeg(grid, rearAttach, rearLegCol2, legLength + 1, darkColor, baseColor, clawColor, underbellyColor, false);
    }
  }

  if (limbs >= 3) {
    if (bodyType === 1) {
      const ml = serpentineLegAttach(0.5);
      drawDetailedLeg(grid, ml.row, ml.col - 1, legLength - 1, darkColor, baseColor, clawColor, underbellyColor, true);
      drawDetailedLeg(grid, ml.row, ml.col + 2, legLength - 1, darkColor, baseColor, clawColor, underbellyColor, false);
    } else {
      // Normal/Bulky: middle legs at center of body
      const midLegCol1 = bodyCC - 2;
      const midLegCol2 = bodyCC + 2;
      const midAttach = findBodyBottom(bodyCC);
      drawDetailedLeg(grid, midAttach, midLegCol1, legLength - 1, darkColor, baseColor, clawColor, underbellyColor, true);
      drawDetailedLeg(grid, midAttach, midLegCol2, legLength - 1, darkColor, baseColor, clawColor, underbellyColor, false);
    }
  }

  // ── TAIL (longer, more defined) ──
  // Serpentine: tail continues from right end of S-curve
  // Normal/Bulky: tail starts from right edge of ellipse
  const tailStartCol = bodyType === 1 ? snakeEndCol + 1 : bodyCC + bodyDrawRadC;
  const tailStartRow = bodyType === 1 && snakeCenterAtCol[snakeEndCol]
    ? snakeCenterAtCol[snakeEndCol].centerRow
    : bodyCR;
  // Longer tails: serpentine uses shorter explicit tail since S-curve covers body length
  const tailCells = bodyType === 1 ? tailLen * 2 + 3 : tailLen * 4 + 6; // serpentine: 5-9, others: 10-18

  for (let i = 0; i < tailCells; i++) {
    const col = tailStartCol + i;
    const droop = Math.floor(i * 0.25);
    const taper = 1 - (i / tailCells); // 1.0 → 0.0

    if (tailShape === 1) { // Whip: thin, sinuous
      const wave = Math.round(Math.sin(i * 0.6) * 0.5);
      put(grid, tailStartRow + droop + wave, col, baseColor, 'tail');
      if (i < tailCells * 0.4) {
        put(grid, tailStartRow + droop + wave + 1, col, underbellyColor, 'tail');
      }
    } else if (tailShape === 2) { // Normal: medium taper
      put(grid, tailStartRow + droop, col, baseColor, 'tail');
      put(grid, tailStartRow + droop + 1, col, underbellyColor, 'tail');
      if (taper > 0.4) {
        put(grid, tailStartRow + droop - 1, col, baseColor, 'tail');
      }
      if (taper > 0.7) {
        put(grid, tailStartRow + droop + 2, col, underbellyColor, 'tail');
      }
    } else { // Heavy: thick with gradual taper
      put(grid, tailStartRow + droop - 1, col, baseColor, 'tail');
      put(grid, tailStartRow + droop, col, baseColor, 'tail');
      put(grid, tailStartRow + droop + 1, col, underbellyColor, 'tail');
      if (taper > 0.3) {
        put(grid, tailStartRow + droop + 2, col, underbellyColor, 'tail');
        put(grid, tailStartRow + droop - 2, col, darkColor, 'tail');
      }
      if (taper > 0.6) {
        put(grid, tailStartRow + droop + 3, col, lightColor, 'tail');
      }
    }
  }

  // Tail tip
  const tipCol = tailStartCol + tailCells;
  const tipDroop = Math.floor(tailCells * 0.25);
  if (tailShape === 3) {
    // Club tail: diamond/mace shape
    for (let dr = -3; dr <= 3; dr++) {
      const w = 3 - Math.abs(dr);
      for (let dc = 0; dc < w; dc++) {
        put(grid, tailStartRow + tipDroop + dr, tipCol + dc, darkerColor, 'tail');
      }
    }
  } else if (tailShape === 1) {
    // Whip: fine pointed tip
    put(grid, tailStartRow + tipDroop, tipCol, darkerColor, 'tail');
    put(grid, tailStartRow + tipDroop, tipCol + 1, darkestColor, 'tail');
  } else {
    // Normal: tapered end
    put(grid, tailStartRow + tipDroop, tipCol, darkColor, 'tail');
    put(grid, tailStartRow + tipDroop + 1, tipCol, darkColor, 'tail');
    put(grid, tailStartRow + tipDroop, tipCol + 1, darkerColor, 'tail');
  }

  // Spines on tail
  if (spineStyle >= 2) {
    for (let i = 0; i < tailCells; i += 3) {
      const col = tailStartCol + i;
      const droop = Math.floor(i * 0.25);
      const h = Math.max(1, spineHt - 1);
      for (let s = 0; s < h; s++) {
        put(grid, tailStartRow + droop - 2 - s, col, (s === h - 1) ? darkerColor : darkColor, 'spine');
      }
    }
  }

  return grid;
}

// ── Draw a single wing (much more detailed) ─────────────────

function drawWing(grid, baseRow, baseCol, height, span, membraneColor, boneColor, edgeColor, darkerEdge, highlightColor) {
  // Wing joint (ball joint at attachment)
  ellipse(grid, baseRow, baseCol, 1, 1, edgeColor, 'wing');

  // Upper arm bone (extends up and slightly back)
  const armLen = Math.ceil(height * 0.4);
  for (let i = 0; i < armLen; i++) {
    put(grid, baseRow - i, baseCol + 1, boneColor, 'wing');
    put(grid, baseRow - i, baseCol + 2, boneColor, 'wing');
  }

  // Elbow joint
  const elbowRow = baseRow - armLen;
  const elbowCol = baseCol + 2;
  ellipse(grid, elbowRow, elbowCol, 1, 1, edgeColor, 'wing');

  // Finger bones (radiate outward from elbow)
  const fingerCount = Math.min(4, Math.ceil(span / 3));
  const fingerLen = span;

  for (let f = 0; f < fingerCount; f++) {
    const angle = (f / (fingerCount - 1 || 1)); // 0 to 1
    const dRow = -Math.round((1 - angle) * (height - armLen)); // upward spread
    const dCol = Math.round(angle * fingerLen); // horizontal spread

    // Draw finger bone
    const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
    for (let s = 0; s <= steps; s++) {
      const frac = s / steps;
      const r = Math.round(elbowRow + dRow * frac);
      const c = Math.round(elbowCol + dCol * frac);
      put(grid, r, c, boneColor, 'wing');
    }
  }

  // Wing membrane (fill between finger bones)
  const topFingerEndRow = elbowRow - (height - armLen);
  const topFingerEndCol = elbowCol;
  const botFingerEndRow = elbowRow;
  const botFingerEndCol = elbowCol + fingerLen;

  for (let r = topFingerEndRow; r <= baseRow + 1; r++) {
    // Determine membrane bounds at this row
    let minC = MAX_COLS, maxC = 0;

    // Check each finger to find the column range at this row
    for (let f = 0; f < fingerCount; f++) {
      const angle = (f / (fingerCount - 1 || 1));
      const dRow = -Math.round((1 - angle) * (height - armLen));
      const dCol = Math.round(angle * fingerLen);
      const endR = elbowRow + dRow;
      const endC = elbowCol + dCol;

      // If this row intersects the finger
      if ((r >= Math.min(elbowRow, endR)) && (r <= Math.max(elbowRow, endR))) {
        const steps = Math.max(1, Math.abs(dRow));
        const frac = Math.abs(r - elbowRow) / steps;
        const c = Math.round(elbowCol + dCol * Math.min(1, frac));
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }

    // Fill membrane between min and max column
    if (minC < maxC) {
      for (let c = minC; c <= maxC; c++) {
        if (!grid[r]?.[c]) { // Don't overwrite bones
          const isVein = ((r + c) % 5 === 0);
          const isEdge = (c === minC || c === maxC);
          let color;
          if (isEdge) color = edgeColor;
          else if (isVein) color = boneColor;
          else color = membraneColor;
          put(grid, r, c, color, 'wing');
        }
      }
    }
  }

  // Trailing edge of wing (connects bottom finger back to body)
  const trailSteps = Math.max(1, Math.abs(botFingerEndRow - baseRow) + Math.abs(botFingerEndCol - baseCol));
  for (let s = 0; s <= trailSteps; s++) {
    const frac = s / trailSteps;
    const r = Math.round(botFingerEndRow + (baseRow + 1 - botFingerEndRow) * frac);
    const c = Math.round(botFingerEndCol + (baseCol - botFingerEndCol) * frac);
    put(grid, r, c, edgeColor, 'wing');
  }
}

// ── Draw a detailed leg with joints and claws ────────────────

function drawDetailedLeg(grid, attachRow, col, length, legColor, bodyColor, clawColor, bellyColor, isFront) {
  // Thigh / upper leg (wider) — starts AT attachRow (overlaps body bottom for flush look)
  const upperLen = Math.ceil(length * 0.45);
  const thighW = 3;
  for (let i = 0; i < upperLen; i++) {
    for (let w = 0; w < thighW; w++) {
      const shade = (w === 0) ? legColor : (w === thighW - 1) ? bellyColor : bodyColor;
      put(grid, attachRow + i, col + w, shade, 'limb');
    }
  }

  // Knee joint (small bulge)
  const kneeRow = attachRow + upperLen;
  put(grid, kneeRow, col, legColor, 'limb');
  put(grid, kneeRow, col + 1, bodyColor, 'limb');
  put(grid, kneeRow, col + 2, legColor, 'limb');
  put(grid, kneeRow, col + 3, legColor, 'limb');

  // Lower leg / shin (slightly offset forward, thinner)
  const lowerLen = Math.ceil(length * 0.35);
  const shinCol = col + 1;
  for (let i = 0; i < lowerLen; i++) {
    put(grid, kneeRow + 1 + i, shinCol, legColor, 'limb');
    put(grid, kneeRow + 1 + i, shinCol + 1, bodyColor, 'limb');
  }

  // Ankle
  const ankleRow = kneeRow + 1 + lowerLen;
  put(grid, ankleRow, shinCol, legColor, 'limb');
  put(grid, ankleRow, shinCol + 1, legColor, 'limb');

  // Foot/paw (wider platform)
  const footRow = ankleRow + 1;
  put(grid, footRow, shinCol - 1, legColor, 'limb');
  put(grid, footRow, shinCol, legColor, 'limb');
  put(grid, footRow, shinCol + 1, legColor, 'limb');
  put(grid, footRow, shinCol + 2, legColor, 'limb');

  // Claws (3-4 toes with individual claws)
  const clawRow = footRow + 1;
  put(grid, clawRow, shinCol - 1, clawColor, 'claw');
  put(grid, clawRow, shinCol, clawColor, 'claw');
  put(grid, clawRow, shinCol + 1, clawColor, 'claw');
  put(grid, clawRow, shinCol + 2, clawColor, 'claw');
  // Claw tips (extend down one more)
  put(grid, clawRow + 1, shinCol - 1, clawColor, 'claw');
  put(grid, clawRow + 1, shinCol + 2, clawColor, 'claw');
}

// ── Bounding box & rendering ─────────────────────────────────

function getBounds(grid) {
  let minR = GRID_ROWS, maxR = 0, minC = MAX_COLS, maxC = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < MAX_COLS; c++) {
      if (grid[r][c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  return { minR, maxR, minC, maxC };
}

// ── Shared animation loop for shimmer/metallic effects ──
// Manages all animated sprites via a single requestAnimationFrame loop
const animatedSprites = new Set();
let animFrameId = null;

function animationTick(timestamp) {
  for (const sprite of animatedSprites) {
    // Auto-cleanup: remove sprites no longer in the DOM
    if (!sprite.canvas.isConnected) {
      animatedSprites.delete(sprite);
      continue;
    }
    const filters = [];
    // Schiller shimmer: oscillating hue-rotate
    if (sprite.shimmerDeg > 0) {
      const period = sprite.shimmerDuration * 1000; // ms
      const phase = (timestamp % period) / period;  // 0..1
      const deg = Math.sin(phase * Math.PI * 2) * sprite.shimmerDeg;
      filters.push(`hue-rotate(${deg.toFixed(1)}deg)`);
    }
    // Metallic gleam: oscillating brightness
    if (sprite.hasMetallic) {
      const phase = (timestamp % 3000) / 3000;
      const brightness = 1.0 + 0.15 * Math.sin(phase * Math.PI * 2);
      filters.push(`brightness(${brightness.toFixed(3)})`);
    }
    sprite.canvas.style.filter = filters.length ? filters.join(' ') : '';
  }
  if (animatedSprites.size > 0) {
    animFrameId = requestAnimationFrame(animationTick);
  } else {
    animFrameId = null;
  }
}

function startAnimationLoop() {
  if (animFrameId !== null) return;
  animFrameId = requestAnimationFrame(animationTick);
}

export function renderDragonSprite(phenotype, compact = false) {
  const grid = buildSpriteGrid(phenotype);

  // ── Post-processing: per-cell finish effects ──
  const [opacityLevel, shineLevel, schillerLevel] = phenotype.finish.levels;

  // 1. Opacity paleness (low opacity → washed-out, paler colors)
  applyOpacityPale(grid, opacityLevel);

  // 2. Shine contrast (establishes tonal range)
  applyShineContrast(grid, phenotype.color.hex, shineLevel);

  // 3. Metallic edge (bright edges + dark top shadow)
  const hasMetallic = applyMetallicEdge(grid, phenotype.color.hex, opacityLevel, shineLevel);

  // 4. Schiller hue variance (hue-only shifts)
  applySchillerHue(grid, schillerLevel);

  // ── Render grid to canvas ──
  const { minR, maxR, minC, maxC } = getBounds(grid);
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cellSize = compact ? CELL_PX_COMPACT : CELL_PX;
  const canvasW = cols * cellSize;
  const canvasH = rows * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  canvas.className = 'dragon-sprite';

  const ctx = canvas.getContext('2d');
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = grid[r][c];
      if (cell) {
        ctx.fillStyle = cell.color;
        ctx.fillRect((c - minC) * cellSize, (r - minR) * cellSize, cellSize, cellSize);
      }
    }
  }

  // Opacity effect: low opacity = translucent
  const alpha = 0.7 + (opacityLevel / 3) * 0.3;
  if (alpha < 0.99) {
    canvas.style.opacity = alpha.toFixed(2);
  }

  // ── Responsive wrapper: canvas scales via CSS automatically ──
  const wrapper = document.createElement('div');
  wrapper.className = 'sprite-scale-wrapper';
  // Canvas scales responsively: width:100% makes it shrink to fit,
  // maxWidth prevents it from growing beyond natural size
  canvas.style.width = '100%';
  canvas.style.maxWidth = `${canvasW}px`;
  canvas.style.height = 'auto';
  wrapper.appendChild(canvas);

  // ── Register for animation if needed ──
  const doSchillerAnim = schillerLevel >= 0.5;
  const shimmerDeg = doSchillerAnim ? Math.round((schillerLevel / 3) * 20) : 0;
  const shimmerDuration = doSchillerAnim ? 1.5 + (schillerLevel / 3) * 1.5 : 0;

  if (doSchillerAnim || hasMetallic) {
    animatedSprites.add({
      canvas,
      shimmerDeg,
      shimmerDuration,
      hasMetallic,
    });
    startAnimationLoop();
  }

  return wrapper;
}
