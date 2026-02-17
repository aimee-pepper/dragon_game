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

// ============================================================
// FULL 64-ENTRY FINISH NAME TABLE
// Key format: "O-Sh-Sc" where each axis is 0=None, 1=Low, 2=Med, 3=High
// 4 opacity tiers × 4 shine levels × 4 schiller levels = 64 unique names
// ============================================================

export const FINISH_NAMES = {
  // ── Opacity: None (0) ──
  '0-0-0': 'Phantom',                     '0-0-1': 'Clear Matte Shifting',
  '0-0-2': 'Clear Matte Shimmering',      '0-0-3': 'Opalescent',
  '0-1-0': 'Clear Satin',                 '0-1-1': 'Clear Satin Shifting',
  '0-1-2': 'Spectral',                    '0-1-3': 'Clear Satin Prismatic',
  '0-2-0': 'Clear Lustrous',              '0-2-1': 'Clear Lustrous Shifting',
  '0-2-2': 'Clear Lustrous Shimmering',   '0-2-3': 'Clear Lustrous Prismatic',
  '0-3-0': 'Glass',                       '0-3-1': 'Clear Polished Shifting',
  '0-3-2': 'Clear Polished Shimmering',   '0-3-3': 'Iridescent',

  // ── Opacity: Low (1) ──
  '1-0-0': 'Seaglass',                        '1-0-1': 'Translucent Matte Shifting',
  '1-0-2': 'Translucent Matte Shimmering',    '1-0-3': 'Translucent Matte Prismatic',
  '1-1-0': 'Translucent Satin',               '1-1-1': 'Translucent Satin Shifting',
  '1-1-2': 'Translucent Satin Shimmering',    '1-1-3': 'Translucent Satin Prismatic',
  '1-2-0': 'Translucent Lustrous',            '1-2-1': 'Translucent Lustrous Shifting',
  '1-2-2': 'Translucent Lustrous Shimmering', '1-2-3': 'Translucent Lustrous Prismatic',
  '1-3-0': 'Crystal',                         '1-3-1': 'Translucent Polished Shifting',
  '1-3-2': 'Translucent Polished Shimmering', '1-3-3': 'Translucent Polished Prismatic',

  // ── Opacity: Med (2) ──
  '2-0-0': 'Frosted',                   '2-0-1': 'Cloudy Matte Shifting',
  '2-0-2': 'Cloudy Matte Shimmering',   '2-0-3': 'Cloudy Matte Prismatic',
  '2-1-0': 'Cloudy Satin',              '2-1-1': 'Cloudy Satin Shifting',
  '2-1-2': 'Cloudy Satin Shimmering',   '2-1-3': 'Cloudy Satin Prismatic',
  '2-2-0': 'Cloudy Lustrous',           '2-2-1': 'Cloudy Lustrous Shifting',
  '2-2-2': 'Cloudy Lustrous Shimmering', '2-2-3': 'Cloudy Lustrous Prismatic',
  '2-3-0': 'Cloudy Polished',           '2-3-1': 'Cloudy Polished Shifting',
  '2-3-2': 'Cloudy Polished Shimmering','2-3-3': 'Cloudy Polished Prismatic',

  // ── Opacity: High (3) ──
  '3-0-0': 'Velvet',                    '3-0-1': 'Opaque Matte Shifting',
  '3-0-2': 'Opaque Matte Shimmering',   '3-0-3': 'Chromatic',
  '3-1-0': 'Opaque Satin',              '3-1-1': 'Opaque Satin Shifting',
  '3-1-2': 'Opaque Satin Shimmering',   '3-1-3': 'Opaque Satin Prismatic',
  '3-2-0': 'Enamel',                    '3-2-1': 'Opaque Lustrous Shifting',
  '3-2-2': 'Opaque Lustrous Shimmering',                     '3-2-3': 'Opaque Lustrous Prismatic',
  '3-3-0': 'Mirror',                    '3-3-1': 'Opaque Polished Shifting',
  '3-3-2': 'Opaque Polished Shimmering','3-3-3': 'Mother of Pearl',
};

// Set of special (non-compound) finish names for almanac highlighting
export const FINISH_SPECIAL_NAMES = new Set([
  'Phantom', 'Opalescent', 'Spectral', 'Glass', 'Iridescent',
  'Seaglass', 'Crystal',
  'Frosted',
  'Velvet', 'Chromatic', 'Enamel', 'Mirror', 'Mother of Pearl',
]);

// Classify a continuous axis level (0-3) into a discrete tier (0-3)
// Shared by all three 64-entry lookup systems (finish, element, color)
export function classifyLevel(level) {
  if (level < 0.5) return 0;  // None
  if (level < 1.5) return 1;  // Low
  if (level < 2.5) return 2;  // Med
  return 3;                    // High
}

// Legacy alias (used in some places)
export const classifyFinishLevel = classifyLevel;

// Finish display name from 64-entry lookup table
export function getFinishDisplayName(opacityLevel, shineLevel, schillerLevel) {
  const key = `${classifyLevel(opacityLevel)}-${classifyLevel(shineLevel)}-${classifyLevel(schillerLevel)}`;
  return FINISH_NAMES[key] || 'Unknown Finish';
}

// Element display name from 64-entry lookup table
export function getElementDisplayName(fireLevel, iceLevel, lightningLevel) {
  const key = `${classifyLevel(fireLevel)}-${classifyLevel(iceLevel)}-${classifyLevel(lightningLevel)}`;
  return ELEMENT_NAMES[key] || 'Unknown Element';
}

// Color display name from 64-entry lookup table
export function getColorDisplayName(cyanLevel, magentaLevel, yellowLevel) {
  const key = `${classifyLevel(cyanLevel)}-${classifyLevel(magentaLevel)}-${classifyLevel(yellowLevel)}`;
  return COLOR_NAMES[key] || 'Unknown Color';
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
// FULL 64-ENTRY ELEMENT NAME TABLE
// Key format: "F-I-L" where each axis is 0=None, 1=Low, 2=Med, 3=High
// 4 fire tiers × 4 ice tiers × 4 lightning tiers = 64 unique names
// ============================================================

export const ELEMENT_NAMES = {
  // ── Lightning: None (0) ──
  '0-0-0': 'Void',              '0-1-0': 'Chill',
  '0-2-0': 'Frost',             '0-3-0': 'Ice',
  '1-0-0': 'Ember',             '1-1-0': 'Warm Mist',
  '1-2-0': 'Cool Steam',        '1-3-0': 'Fog',
  '2-0-0': 'Flame',             '2-1-0': 'Scald',
  '2-2-0': 'Steam',             '2-3-0': 'Cold Geyser',
  '3-0-0': 'Fire',              '3-1-0': 'Hot Scald',
  '3-2-0': 'Geyser',            '3-3-0': 'Torrential Steam',

  // ── Lightning: Low (1) ──
  '0-0-1': 'Static',            '0-1-1': 'Cold Static',
  '0-2-1': 'Frost Spark',       '0-3-1': 'Frigid Static',
  '1-0-1': 'Warm Static',       '1-1-1': 'Haze',
  '1-2-1': 'Charged Mist',      '1-3-1': 'Cold Ionic',
  '2-0-1': 'Heat Spark',        '2-1-1': 'Charged Steam',
  '2-2-1': 'Storm Brew',        '2-3-1': 'Charged Fog',
  '3-0-1': 'Sunfire',           '3-1-1': 'Flash Steam',
  '3-2-1': 'Thundercloud',      '3-3-1': 'Maelstrom',

  // ── Lightning: Med (2) ──
  '0-0-2': 'Spark',             '0-1-2': 'Ionic Chill',
  '0-2-2': 'Ionic',             '0-3-2': 'Aurora Glow',
  '1-0-2': 'Flare',             '1-1-2': 'Heat Haze',
  '1-2-2': 'Charged Frost',     '1-3-2': 'Shimmer',
  '2-0-2': 'Pulsar',            '2-1-2': 'Arc Steam',
  '2-2-2': 'Surge',             '2-3-2': 'Radiant Fog',
  '3-0-2': 'Solar',             '3-1-2': 'Solar Flare',
  '3-2-2': 'Plasma Wisp',       '3-3-2': 'Corona',

  // ── Lightning: High (3) ──
  '0-0-3': 'Lightning',         '0-1-3': 'Crackling Chill',
  '0-2-3': 'Tempest Ice',       '0-3-3': 'Aurora',
  '1-0-3': 'Crackling Flare',   '1-1-3': 'Ion Storm',
  '1-2-3': 'Aurora Storm',      '1-3-3': 'Radiance',
  '2-0-3': 'Thunder Scorch',    '2-1-3': 'Plasma Arc',
  '2-2-3': 'Fusion',            '2-3-3': 'Plasma Frost',
  '3-0-3': 'Helios',            '3-1-3': 'Supernova',
  '3-2-3': 'Cataclysm',         '3-3-3': 'Plasma',
};

// Set of special (non-compound) element names for almanac highlighting
export const ELEMENT_SPECIAL_NAMES = new Set([
  'Void', 'Ice', 'Fire', 'Lightning', 'Plasma',
  'Ember', 'Flame', 'Chill', 'Frost', 'Static', 'Spark',
  'Steam', 'Fog', 'Haze', 'Solar', 'Aurora',
  'Geyser', 'Maelstrom', 'Helios', 'Supernova', 'Cataclysm',
  'Corona', 'Radiance', 'Fusion', 'Pulsar', 'Flare', 'Sunfire',
]);

// ============================================================
// FULL 64-ENTRY COLOR NAME TABLE
// Key format: "C-M-Y" where each axis is 0=None, 1=Low, 2=Med, 3=High
// 4 cyan tiers × 4 magenta tiers × 4 yellow tiers = 64 unique names
// ============================================================

export const COLOR_NAMES = {
  // ── Yellow: None (0) ──
  '0-0-0': 'White',             '1-0-0': 'Ice Blue',
  '2-0-0': 'Aqua',              '3-0-0': 'Cyan',
  '0-1-0': 'Sakura',            '1-1-0': 'Violet',
  '2-1-0': 'Cornflower Blue',   '3-1-0': 'Cerulean',
  '0-2-0': 'Fuchsia',           '1-2-0': 'Heliotrope',
  '2-2-0': 'Periwinkle',        '3-2-0': 'Indigo',
  '0-3-0': 'Magenta',           '1-3-0': 'Orchid',
  '2-3-0': 'Purple',            '3-3-0': 'Blue',

  // ── Yellow: Low (1) ──
  '0-0-1': 'Butter Yellow',     '1-0-1': 'Celadon',
  '2-0-1': 'Seafoam',           '3-0-1': 'Mint',
  '0-1-1': 'Salmon',            '1-1-1': 'Grey',
  '2-1-1': 'Viridian',          '3-1-1': 'Teal',
  '0-2-1': 'Pink',              '1-2-1': 'Mauve',
  '2-2-1': 'Iris',              '3-2-1': 'Cobalt',
  '0-3-1': 'Hot Pink',          '1-3-1': 'Magnolia',
  '2-3-1': 'Wisteria',          '3-3-1': 'Ultramarine',

  // ── Yellow: Med (2) ──
  '0-0-2': 'Lemon Yellow',      '1-0-2': 'Pear Green',
  '2-0-2': 'Lime Green',        '3-0-2': 'Spring Green',
  '0-1-2': 'Carrot',            '1-1-2': 'Olive',
  '2-1-2': 'Clover',            '3-1-2': 'Fern',
  '0-2-2': 'Coral',             '1-2-2': 'Sienna',
  '2-2-2': 'Slate',             '3-2-2': 'Deep Sea Green',
  '0-3-2': 'Rose',              '1-3-2': 'Berry',
  '2-3-2': 'Plum',              '3-3-2': 'Midnight Blue',

  // ── Yellow: High (3) ──
  '0-0-3': 'Yellow',            '1-0-3': 'Chartreuse',
  '2-0-3': 'Neon Green',        '3-0-3': 'Green',
  '0-1-3': 'Saffron',           '1-1-3': 'Citron',
  '2-1-3': 'Kelly Green',       '3-1-3': 'Ivy Green',
  '0-2-3': 'Orange',            '1-2-3': 'Umber',
  '2-2-3': 'Moss Green',        '3-2-3': 'Forest Green',
  '0-3-3': 'Red',               '1-3-3': 'Crimson',
  '2-3-3': 'Maroon',            '3-3-3': 'Black',
};

// Set of special (non-compound) color names for almanac highlighting
export const COLOR_SPECIAL_NAMES = new Set([
  'White', 'Black', 'Cyan', 'Magenta', 'Yellow', 'Blue', 'Green', 'Red',
  'Grey', 'Violet', 'Orchid', 'Purple', 'Indigo', 'Teal',
  'Coral', 'Rose', 'Pink', 'Salmon', 'Orange', 'Saffron',
  'Mint', 'Fern', 'Olive', 'Crimson', 'Maroon',
]);

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

// ============================================================
// SPECIALTY COMBOS — Color + Finish → replaces color display name
// Key format: "colorTierKey|finishTierKey" (both are C-M-Y | O-Sh-Sc tier keys)
// ============================================================

export const SPECIALTY_COMBOS = {
  // ── Gemstones (Color + Crystal = 1-3-0) ──
  '0-0-0|1-3-0': { name: 'Diamond',      category: 'Gemstone' },
  '0-2-1|1-3-0': { name: 'Rose Quartz',  category: 'Gemstone' },
  '0-0-2|1-3-0': { name: 'Citrine',      category: 'Gemstone' },
  '0-1-3|1-3-0': { name: 'Topaz',        category: 'Gemstone' },
  '0-2-3|1-3-0': { name: 'Amber',        category: 'Gemstone' },
  '1-3-3|1-3-0': { name: 'Garnet',       category: 'Gemstone' },
  '0-3-3|1-3-0': { name: 'Ruby',         category: 'Gemstone' },
  '0-2-2|1-3-0': { name: 'Carnelian',    category: 'Gemstone' },
  '0-3-1|1-3-0': { name: 'Tourmaline',   category: 'Gemstone' },
  '2-3-1|1-3-0': { name: 'Amethyst',     category: 'Gemstone' },
  '3-2-0|1-3-0': { name: 'Tanzanite',    category: 'Gemstone' },
  '3-2-1|1-3-0': { name: 'Sapphire',     category: 'Gemstone' },
  '2-2-0|1-3-0': { name: 'Lapis Lazuli', category: 'Gemstone' },
  '2-0-0|1-3-0': { name: 'Aquamarine',   category: 'Gemstone' },
  '3-1-1|1-3-0': { name: 'Alexandrite',  category: 'Gemstone' },
  '2-1-2|1-3-0': { name: 'Emerald',      category: 'Gemstone' },
  '1-0-2|1-3-0': { name: 'Peridot',      category: 'Gemstone' },
  '3-0-3|1-3-0': { name: 'Jade',         category: 'Gemstone' },
  '3-3-3|1-3-0': { name: 'Onyx',         category: 'Gemstone' },
  '2-2-1|1-3-0': { name: 'Iolite',       category: 'Gemstone' },

  // ── Opals (Color + Translucent Lustrous Prismatic = 1-2-3) ──
  '0-0-0|1-2-3': { name: 'White Opal',  category: 'Opal' },
  '0-3-3|1-2-3': { name: 'Fire Opal',   category: 'Opal' },
  '0-1-3|1-2-3': { name: 'Honey Opal',  category: 'Opal' },
  '0-2-3|1-2-3': { name: 'Sunstone',    category: 'Opal' },
  '2-0-0|1-2-3': { name: 'Water Opal',  category: 'Opal' },
  '3-3-3|1-2-3': { name: 'Black Opal',  category: 'Opal' },
  '0-2-1|1-2-3': { name: 'Pink Opal',   category: 'Opal' },

  // ── Moonstones (Color + Translucent Lustrous Shimmering = 1-2-2) ──
  '0-0-0|1-2-2': { name: 'Rainbow Moonstone', category: 'Moonstone' },
  '1-0-0|1-2-2': { name: 'Blue Moonstone',    category: 'Moonstone' },
  '1-1-1|1-2-2': { name: 'Grey Moonstone',    category: 'Moonstone' },
  '0-1-1|1-2-2': { name: 'Peach Moonstone',   category: 'Moonstone' },
  '0-0-2|1-2-2': { name: "Cat's Eye",         category: 'Moonstone' },
  '3-2-1|1-2-2': { name: 'Star Sapphire',     category: 'Moonstone' },
  '0-3-3|1-2-2': { name: 'Star Ruby',         category: 'Moonstone' },

  // ── Pearls (Color + Opaque Lustrous Shimmering = 3-2-2) ──
  '0-0-0|3-2-2': { name: 'Pearl',          category: 'Pearl' },
  '3-3-3|3-2-2': { name: 'Black Pearl',    category: 'Pearl' },
  '0-2-1|3-2-2': { name: 'Pink Pearl',     category: 'Pearl' },
  '0-0-3|3-2-2': { name: 'Golden Pearl',   category: 'Pearl' },
  '1-1-1|3-2-2': { name: 'Grey Pearl',     category: 'Pearl' },
  '1-2-1|3-2-2': { name: 'Lavender Pearl', category: 'Pearl' },

  // ── Labradorite (Color + Mother of Pearl = 3-3-3) ──
  '3-2-1|3-3-3': { name: 'Labradorite', category: 'Gemstone' },

  // ── Fire Agate (Color + Cloudy Lustrous Prismatic = 2-2-3) ──
  '0-3-3|2-2-3': { name: 'Fire Agate', category: 'Gemstone' },

  // ── Metals (Color + Mirror = 3-3-0) ──
  '0-0-0|3-3-0': { name: 'Platinum',  category: 'Metal' },
  '1-1-1|3-3-0': { name: 'Silver',    category: 'Metal' },
  '2-2-2|3-3-0': { name: 'Pewter',    category: 'Metal' },
  '3-3-0|3-3-0': { name: 'Steel',     category: 'Metal' },
  '3-2-1|3-3-0': { name: 'Titanium',  category: 'Metal' },
  '0-0-3|3-3-0': { name: 'Gold',      category: 'Metal' },
  '0-1-3|3-3-0': { name: 'Brass',     category: 'Metal' },
  '0-2-3|3-3-0': { name: 'Copper',    category: 'Metal' },
  '0-1-1|3-3-0': { name: 'Rose Gold', category: 'Metal' },
  '0-1-2|3-3-0': { name: 'Bronze',    category: 'Metal' },
  '2-3-3|3-3-0': { name: 'Iron',      category: 'Metal' },
  '3-3-2|3-3-0': { name: 'Gunmetal',  category: 'Metal' },
  '1-0-3|3-3-0': { name: 'Electrum',  category: 'Metal' },
  '1-0-0|3-3-0': { name: 'Tin',       category: 'Metal' },
  '1-1-0|3-3-0': { name: 'Rhodium',   category: 'Metal' },

  // ── Stones (Color + Velvet = 3-0-0) ──
  '0-0-0|3-0-0': { name: 'Marble',    category: 'Stone' },
  '1-0-0|3-0-0': { name: 'Limestone', category: 'Stone' },
  '1-1-1|3-0-0': { name: 'Granite',   category: 'Stone' },
  '2-2-2|3-0-0': { name: 'Slate',     category: 'Stone' },
  '3-3-2|3-0-0': { name: 'Basalt',    category: 'Stone' },
  '3-3-3|3-0-0': { name: 'Obsidian',  category: 'Stone' },

  // ── Ghosts (Color + Phantom = 0-0-0) ──
  '0-0-0|0-0-0': { name: 'Specter',  category: 'Ghost' },
  '1-1-1|0-0-0': { name: 'Shade',    category: 'Ghost' },
  '3-3-3|0-0-0': { name: 'Wraith',   category: 'Ghost' },
  '1-0-0|0-0-0': { name: 'Haunt',    category: 'Ghost' },
  '2-2-2|0-0-0': { name: 'Revenant', category: 'Ghost' },
  '2-0-1|0-0-0': { name: 'Spirit',   category: 'Ghost' },
  '3-0-1|0-0-0': { name: 'Ghast',    category: 'Ghost' },
};

// ============================================================
// ELEMENT MODIFIERS — Finish + Element → prefix applied to color name
// Key format: "finishTierKey|elementHLKey"
// Only applies when no Color+Finish specialty match exists
// ============================================================

export const ELEMENT_MODIFIERS = {
  '3-3-0|H-L-L': 'Molten',     // Mirror + Fire
  '0-3-0|L-H-L': 'Frozen',     // Glass + Ice
  '3-3-0|L-L-H': 'Charged',    // Mirror + Lightning
  '3-0-0|H-L-L': 'Volcanic',   // Velvet + Fire
  '2-0-0|L-H-L': 'Permafrost', // Frosted + Ice
  '0-3-0|L-L-H': 'Storm',      // Glass + Lightning
  '1-3-0|H-H-L': 'Boiling',    // Crystal + Steam
  '2-0-0|H-H-L': 'Nimbus',     // Frosted + Steam
  '0-3-3|L-H-H': 'Celestial',  // Iridescent + Aurora
  '3-3-0|H-L-H': 'Radiant',    // Mirror + Solar
  '0-0-0|L-L-L': 'Hollow',     // Phantom + Void
  '0-1-2|H-L-L': 'Mirage',     // Spectral + Fire
  '1-0-0|L-H-L': 'Rime',       // Seaglass + Ice
  '3-0-3|L-L-H': 'Galvanic',   // Chromatic + Lightning
  '2-2-2|L-H-H': 'Luminous',   // Cloudy Lustrous Shimmering + Aurora
  '3-2-2|H-H-L': 'Tidal',      // Opaque Lustrous Shimmering + Steam
};
