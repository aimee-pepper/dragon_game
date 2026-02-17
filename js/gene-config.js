// Gene definitions for the Dragon Genetics System
// All 23 genes organized by system type

// ============================================================
// GENE DEFINITIONS
// ============================================================

export const GENE_DEFS = {
  // --- MAIN SYSTEMS (linear, incomplete dominance) ---

  // Body
  body_size: {
    min: 1, max: 6,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Bird', 2: 'Dog', 3: 'Cow', 4: 'Standard', 5: 'Large', 6: 'Mega' },
    label: 'Size',
  },
  body_type: {
    min: 1, max: 3,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Serpentine', 2: 'Normal', 3: 'Bulky' },
    label: 'Body Type',
  },
  body_scales: {
    min: 1, max: 3,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Smooth', 2: 'Textured', 3: 'Armored' },
    label: 'Scales',
  },

  // Frame
  frame_wings: {
    min: 0, max: 4,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 0: 'None', 1: 'Vestigial', 2: 'Pair', 3: 'Quad', 4: 'Six' },
    label: 'Wings',
  },
  frame_limbs: {
    min: 0, max: 3,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 0: 'Limbless', 1: 'Wyvern (2)', 2: 'Quadruped (4)', 3: 'Hexapod (6)' },
    label: 'Limbs',
  },
  frame_bones: {
    min: 1, max: 3,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Lightweight', 2: 'Standard', 3: 'Dense' },
    label: 'Bone Density',
  },

  // Breath (shape and range only — element is a triangle system)
  breath_shape: {
    min: 1, max: 3,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Single', 2: 'Multi', 3: 'AoE' },
    label: 'Breath Shape',
  },
  breath_range: {
    min: 1, max: 3,
    system: 'main',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Close', 2: 'Medium', 3: 'Far' },
    label: 'Breath Range',
  },

  // --- TRIANGLE SYSTEMS (3 axes each, values 0-3) ---

  // Color (CMY)
  color_cyan:    { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Cyan' },
  color_magenta: { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Magenta' },
  color_yellow:  { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Yellow' },

  // Finish (Opacity / Shine / Schiller)
  finish_opacity:  { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Opacity' },
  finish_shine:    { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Shine' },
  finish_schiller: { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Schiller' },

  // Breath Element (Fire / Ice / Lightning)
  breath_fire:      { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Fire' },
  breath_ice:       { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Ice' },
  breath_lightning: { min: 0, max: 3, system: 'triangle', inheritanceType: 'linear', label: 'Lightning' },

  // --- SUB SYSTEMS ---

  // Horns
  horn_style: {
    min: 0, max: 3,
    system: 'sub',
    inheritanceType: 'categorical',
    phenotypeMap: { 0: 'None', 1: 'Sleek', 2: 'Gnarled', 3: 'Knobbed' },
    label: 'Horn Style',
  },
  horn_direction: {
    min: 0, max: 2,
    system: 'sub',
    inheritanceType: 'categorical',
    phenotypeMap: { 0: 'Forward', 1: 'Swept-back', 2: 'Upward' },
    label: 'Horn Direction',
  },

  // Spines
  spine_style: {
    min: 0, max: 3,
    system: 'sub',
    inheritanceType: 'categorical',
    phenotypeMap: { 0: 'None', 1: 'Ridge', 2: 'Spikes', 3: 'Sail' },
    label: 'Spine Style',
  },
  spine_height: {
    min: 1, max: 3,
    system: 'sub',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Low', 2: 'Medium', 3: 'Tall' },
    label: 'Spine Height',
  },

  // Tail
  tail_shape: {
    min: 1, max: 3,
    system: 'sub',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Whip', 2: 'Normal', 3: 'Heavy' },
    label: 'Tail Shape',
  },
  tail_length: {
    min: 1, max: 3,
    system: 'sub',
    inheritanceType: 'linear',
    phenotypeMap: { 1: 'Short', 2: 'Medium', 3: 'Long' },
    label: 'Tail Length',
  },
};

// ============================================================
// TRIANGLE SYSTEM DEFINITIONS
// ============================================================

export const TRIANGLE_DEFS = {
  color: {
    axes: ['color_cyan', 'color_magenta', 'color_yellow'],
    label: 'Color',
  },
  finish: {
    axes: ['finish_opacity', 'finish_shine', 'finish_schiller'],
    label: 'Finish',
  },
  breathElement: {
    axes: ['breath_fire', 'breath_ice', 'breath_lightning'],
    label: 'Breath Element',
    recessiveExtremes: true, // H and L are recessive — heterozygous alleles pulled toward center
  },
};

// ============================================================
// TRIANGLE PHENOTYPE MAPS
// Key format: "H/L-H/L-H/L" where H = High (level >= 1.5), L = Low (< 1.5)
// ============================================================

export const COLOR_PHENOTYPES = {
  'L-L-L': { name: 'White',   hex: null }, // computed from CMY
  'H-L-L': { name: 'Cyan',    hex: null },
  'L-H-L': { name: 'Magenta', hex: null },
  'L-L-H': { name: 'Yellow',  hex: null },
  'H-H-L': { name: 'Blue',    hex: null },
  'H-L-H': { name: 'Green',   hex: null },
  'L-H-H': { name: 'Red',     hex: null },
  'H-H-H': { name: 'Black',   hex: null },
};

export const FINISH_PHENOTYPES = {
  'L-L-L': { name: 'Seaglass',        desc: 'Translucent, matte, no color-shift' },
  'H-L-L': { name: 'Velvet',          desc: 'Opaque, soft matte texture' },
  'L-H-L': { name: 'Glass',           desc: 'Translucent, glossy surface' },
  'L-L-H': { name: 'Opalescent',      desc: 'Translucent, color-shifting' },
  'H-H-L': { name: 'Mirror',          desc: 'Opaque, reflective sheen' },
  'H-L-H': { name: 'Gemstone',        desc: 'Opaque, faceted color-shifting' },
  'L-H-H': { name: 'Iridescent',      desc: 'Glossy, color-shifting' },
  'H-H-H': { name: 'Mother of Pearl', desc: 'Opaque, glossy, color-shifting' },
};

// Continuous finish naming — builds a rich descriptive name from the 3 axis levels
// Similar to getColorNameFromRGB but for finish properties
export function getFinishDisplayName(opacityLevel, shineLevel, schillerLevel) {
  // Each level is 0-3 continuous (averaged allele pairs)

  // Shine names (primary descriptor — the surface quality)
  let shineName;
  if (shineLevel < 0.5)      shineName = 'Matte';
  else if (shineLevel < 1.2) shineName = 'Satin';
  else if (shineLevel < 2.0) shineName = 'Lustrous';
  else if (shineLevel < 2.7) shineName = 'Polished';
  else                        shineName = 'Mirror';

  // Schiller names (suffix — the color-play quality)
  let schillerName = '';
  if (schillerLevel >= 2.5)      schillerName = 'Prismatic';
  else if (schillerLevel >= 1.5) schillerName = 'Iridescent';
  else if (schillerLevel >= 0.5) schillerName = 'Shifting';
  // < 0.5 = no schiller suffix

  // Opacity prefix (only when notable)
  let opacityPrefix = '';
  if (opacityLevel < 0.5)        opacityPrefix = 'Translucent';
  else if (opacityLevel < 1.2)   opacityPrefix = 'Frosted';
  else if (opacityLevel >= 2.5)  opacityPrefix = '';  // opaque is default, no prefix
  else if (opacityLevel >= 1.8)  opacityPrefix = '';  // solid enough, skip
  else                            opacityPrefix = 'Hazy';

  // Build name: [Opacity] [Shine] [Schiller]
  // e.g. "Frosted Satin Shifting", "Polished Iridescent", "Mirror Prismatic"
  const parts = [];
  if (opacityPrefix) parts.push(opacityPrefix);
  parts.push(shineName);
  if (schillerName) parts.push(schillerName);

  return parts.join(' ');
}

// Build finish description from levels
export function getFinishDescription(opacityLevel, shineLevel, schillerLevel) {
  const parts = [];

  if (opacityLevel < 1.0)       parts.push('Translucent');
  else if (opacityLevel < 2.0)  parts.push('Semi-opaque');
  else                            parts.push('Opaque');

  if (shineLevel < 1.0)       parts.push('flat finish');
  else if (shineLevel < 2.0)  parts.push('soft sheen');
  else                          parts.push('glossy sheen');

  if (schillerLevel >= 2.0)      parts.push('vivid color-shift');
  else if (schillerLevel >= 1.0) parts.push('subtle color-shift');
  else if (schillerLevel >= 0.5) parts.push('faint color-shift');
  else                            parts.push('no color-shift');

  return parts.join(', ');
}

export const BREATH_ELEMENT_PHENOTYPES = {
  'L-L-L': { name: 'Null',      displayColor: '#333333', desc: 'No breath weapon (rare dark beam)' },
  'H-L-L': { name: 'Fire',      displayColor: '#FF4422', desc: 'Roaring flames, ember trails' },
  'L-H-L': { name: 'Ice',       displayColor: '#4488FF', desc: 'Crystalline shards, frost clouds' },
  'L-L-H': { name: 'Lightning', displayColor: '#FFDD00', desc: 'Crackling arcs, branching bolts' },
  'H-H-L': { name: 'Steam',     displayColor: '#9944FF', desc: 'Billowing scalding mist' },
  'H-L-H': { name: 'Solar',     displayColor: '#FF8800', desc: 'Golden beams, corona flares' },
  'L-H-H': { name: 'Aurora',    displayColor: '#44FF88', desc: 'Shimmering curtains, color waves' },
  'H-H-H': { name: 'Plasma',    displayColor: '#FFFFFF', desc: 'White-hot, unstable energy' },
};

// ============================================================
// COLOR SHADE QUALIFIERS
// Applied based on the intensity of the dominant axes
// ============================================================

export function getColorShade(level) {
  // level is the average of the two alleles for a "High" axis (1.5 - 3.0)
  if (level >= 2.5) return 'Deep';
  if (level >= 2.0) return '';
  return 'Pale';
}

// Human-readable CMY axis level descriptor
// Used to show the color blend breakdown on dragon cards
export function getCMYLevelName(level) {
  // level is the average of two alleles (0 - 3)
  if (level < 0.5) return 'None';
  if (level < 1.5) return 'Low';
  if (level < 2.5) return 'Mid';
  return 'High';
}

// ============================================================
// BREATH ELEMENT AXIS DESCRIPTORS & RICH NAMING
// Mirrors the CMY color + finish naming systems
// ============================================================

// Human-readable breath axis level descriptor (same thresholds as CMY)
export function getBreathLevelName(level) {
  if (level < 0.5) return 'None';
  if (level < 1.5) return 'Low';
  if (level < 2.5) return 'Mid';
  return 'High';
}

// Rich display name combining element type + intensity qualifier
export function getBreathDisplayName(fireLevel, iceLevel, lightningLevel) {
  // Classify each axis H/L using the standard threshold
  const fH = fireLevel >= 1.5;
  const iH = iceLevel >= 1.5;
  const lH = lightningLevel >= 1.5;

  // Determine element name from the H/L key
  const key = `${fH ? 'H' : 'L'}-${iH ? 'H' : 'L'}-${lH ? 'H' : 'L'}`;
  const phenotype = BREATH_ELEMENT_PHENOTYPES[key];
  const baseName = phenotype ? phenotype.name : 'Unknown';

  // Count how many axes are High
  const highCount = [fH, iH, lH].filter(Boolean).length;

  // Compute average of dominant axes for intensity qualifier
  const highLevels = [];
  if (fH) highLevels.push(fireLevel);
  if (iH) highLevels.push(iceLevel);
  if (lH) highLevels.push(lightningLevel);
  const dominantAvg = highLevels.length > 0
    ? highLevels.reduce((a, b) => a + b, 0) / highLevels.length
    : (fireLevel + iceLevel + lightningLevel) / 3;

  let qualifier = '';

  if (highCount === 1) {
    // Single element: Flickering / (base) / Fierce / Raging
    if (dominantAvg < 1.8)      qualifier = 'Flickering';
    else if (dominantAvg < 2.3) qualifier = '';
    else if (dominantAvg < 2.7) qualifier = 'Fierce';
    else                         qualifier = 'Raging';
  } else if (highCount === 2) {
    // Dual hybrid: Faint / (base) / Surging / Volatile
    if (dominantAvg < 1.8)      qualifier = 'Faint';
    else if (dominantAvg < 2.3) qualifier = '';
    else if (dominantAvg < 2.7) qualifier = 'Surging';
    else                         qualifier = 'Volatile';
  } else if (highCount === 3) {
    // All three (Plasma): Unstable / (base) / Searing / Cataclysmic
    if (dominantAvg < 1.8)      qualifier = 'Unstable';
    else if (dominantAvg < 2.3) qualifier = '';
    else if (dominantAvg < 2.7) qualifier = 'Searing';
    else                         qualifier = 'Cataclysmic';
  } else {
    // None (Null): Abyssal / (base) / Fading
    if (dominantAvg < 0.3)      qualifier = 'Abyssal';
    else if (dominantAvg < 0.7) qualifier = '';
    else                         qualifier = 'Fading';
  }

  return qualifier ? `${qualifier} ${baseName}` : baseName;
}

// Prose description of breath element composition
export function getBreathDescription(fireLevel, iceLevel, lightningLevel) {
  const parts = [];

  if (fireLevel >= 2.0)       parts.push('intense heat');
  else if (fireLevel >= 1.0)  parts.push('warmth');
  else if (fireLevel >= 0.5)  parts.push('faint warmth');

  if (iceLevel >= 2.0)        parts.push('biting cold');
  else if (iceLevel >= 1.0)   parts.push('chill');
  else if (iceLevel >= 0.5)   parts.push('faint chill');

  if (lightningLevel >= 2.0)       parts.push('crackling energy');
  else if (lightningLevel >= 1.0)  parts.push('static charge');
  else if (lightningLevel >= 0.5)  parts.push('faint tingle');

  if (parts.length === 0) return 'No elemental presence';
  return parts.join(', ');
}

// ============================================================
// CMY → RGB CONVERSION
// Subtractive color model: C removes Red, M removes Green, Y removes Blue
// ============================================================

export function cmyToRGB(cLevel, mLevel, yLevel) {
  // Levels are 0-3 (averaged allele values, can be 0.5 increments)
  const c = cLevel / 3;
  const m = mLevel / 3;
  const y = yLevel / 3;
  return {
    r: Math.round(255 * (1 - c)),
    g: Math.round(255 * (1 - m)),
    b: Math.round(255 * (1 - y)),
  };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// RGB → HSL CONVERSION + COLOR NAMING
// Derives accurate color names from actual computed RGB values
// instead of relying on simplified H/L threshold buckets
// ============================================================

export function rgbToHsl(r, g, b) {
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
  }
  return { h: h * 360, s, l };
}

// Name a color from its RGB values using HSL hue analysis
// Returns a display name like "Deep Purple", "Pale Cyan", "Blue", etc.
export function getColorNameFromRGB(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Handle achromatic / near-achromatic
  if (l > 0.92) return 'White';
  if (l < 0.08) return 'Black';
  if (s < 0.08) {
    if (l > 0.6) return 'Silver';
    if (l < 0.3) return 'Charcoal';
    return 'Grey';
  }
  if (s < 0.20) {
    if (l > 0.7) return 'Silver';
    if (l < 0.3) return 'Charcoal';
    return 'Grey';
  }

  // Hue-based base name (h is 0–360)
  let name;
  if      (h < 10  || h >= 350) name = 'Red';
  else if (h < 30)  name = 'Vermilion';
  else if (h < 45)  name = 'Orange';
  else if (h < 55)  name = 'Gold';
  else if (h < 75)  name = 'Yellow';
  else if (h < 100) name = 'Lime';
  else if (h < 140) name = 'Green';
  else if (h < 165) name = 'Teal';
  else if (h < 190) name = 'Cyan';
  else if (h < 210) name = 'Sky';
  else if (h < 245) name = 'Blue';
  else if (h < 270) name = 'Indigo';
  else if (h < 295) name = 'Purple';
  else if (h < 320) name = 'Magenta';
  else if (h < 340) name = 'Rose';
  else               name = 'Red';

  // Shade qualifier from lightness
  let shade = '';
  if      (l < 0.25) shade = 'Dark';
  else if (l < 0.40) shade = 'Deep';
  else if (l > 0.78) shade = 'Pale';
  // no qualifier for mid-range (40–78%)

  return shade ? `${shade} ${name}` : name;
}

// ============================================================
// RANDOM GENERATION ALLELE WEIGHTS
// ============================================================
// Index = allele value (0-3), values = relative probability weights
// These ONLY affect createRandomGenotype(), NOT breeding/meiosis
// Genes not listed here use uniform random distribution

// Per-gene allele weights for non-triangle genes (if we want any)
export const RANDOM_ALLELE_WEIGHTS = {};

// ── TRIANGLE RARITY TIERS ──
// Instead of weighting individual alleles (which can't make BOTH all-low and all-high rare),
// we pick the phenotype tier FIRST, then generate alleles to match.
// Format: { tier: weight } where tier = number of High axes (0, 1, 2, or 3)
//
// For color/breath: CMY primaries (1 high) are most common, secondaries (2 high) rare,
//                   White/Black (0 or 3 high) are rarest
// For finish: Mother of Pearl (3 high) is most common "standard dragon"

export const TRIANGLE_TIER_WEIGHTS = {
  color: {
    0: 0.04,   // White — rarest (4%)
    1: 0.55,   // Cyan/Magenta/Yellow — most common (55% split 3 ways ≈ 18% each)
    2: 0.35,   // Blue/Green/Red — uncommon (35% split 3 ways ≈ 12% each)
    3: 0.06,   // Black — rarest (6%)
  },
  breathElement: {
    0: 0.04,   // Null — rarest
    1: 0.55,   // Fire/Ice/Lightning — most common
    2: 0.35,   // Steam/Solar/Aurora — uncommon
    3: 0.06,   // Plasma — rarest
  },
  finish: {
    0: 0.03,   // Seaglass — rarest (3%)
    1: 0.12,   // Velvet/Glass/Opalescent — uncommon (12% split 3 ways ≈ 4% each)
    2: 0.35,   // Mirror/Gemstone/Iridescent — common (35% split 3 ways ≈ 12% each)
    3: 0.50,   // Mother of Pearl — most common, "standard dragon" (50%)
  },
};

// Allele distributions for generating High vs Low axis values
// "low" alleles: average < 1.5 (pairs like [0,0], [0,1], [1,1], [0,2])
// "high" alleles: average >= 1.5 (pairs like [1,2], [2,2], [2,3], [3,3])
// Aggressive weights needed so axis H/L classification is reliable (~90%+ accuracy)
export const LOW_ALLELE_WEIGHTS = [0.70, 0.22, 0.06, 0.02];   // ~90% chance pair averages < 1.5
export const HIGH_ALLELE_WEIGHTS = [0.02, 0.06, 0.22, 0.70];   // ~98% chance pair averages >= 1.5

// ============================================================
// CONSTANTS
// ============================================================

export const MUTATION_RATE = 0.005; // 0.5% per allele per breeding event
export const CLUTCH_SIZE_MIN = 2;
export const CLUTCH_SIZE_MAX = 4;

// ============================================================
// RECESSIVE EXTREMES — makes all-high/all-low triangle outcomes
// harder to achieve unless alleles are homozygous
// ============================================================

export const RECESSIVE_PULL_STRENGTH = 0.5; // How much heterozygous extremes get pulled to center
export const DARK_ENERGY_CHANCE = 0.05;     // 5% chance Null breath becomes Dark Energy

export const DARK_ENERGY_PHENOTYPE = {
  name: 'Dark Energy',
  displayColor: '#8800cc',
  desc: 'Rare antimatter breath — born from the void',
};
