// ============================================================
// Map Configuration — Region > Territory > Habitat hierarchy
// ============================================================
// 3 Regions (CMY) × 3 Territories × 3 Habitats = 27 zones
//
// TIERED CONSTRAINT SYSTEM:
//   Tier 1 (Region)    — Color triangle + Breath element + Subordination
//   Tier 2 (Territory) — Body/Frame silhouette + color refinement
//   Tier 3 (Habitat)   — Finish + Features + Scales
//
// Constraints merge top-down: habitat inherits territory + region.
// Subordination enforced post-generation: primary always > secondaries.
//
// Gene constraint shape: { geneName: { min, max } }
// Subordination shape:   { color: 'color_X', breath: 'breath_X' }

// ── Unlock thresholds ────────────────────────────────────────
// Brute-force visit counts to unlock child zones (safety net for RNG).
// Trait discovery typically unlocks zones in 3-8 encounters.
export const TERRITORY_UNLOCK_VISITS = 20;
export const HABITAT_UNLOCK_VISITS = 15;

// ── Regions (Tier 1: Color + Breath Element) ────────────────

export const REGIONS = {
  'verdant-mire': {
    name: 'The Verdant Mire',
    description: 'A vast swampland giving way to rainforest, marshes, and frozen peaks. Cyan-hued dragons dominate these wetlands.',
    territories: ['emerald-canopy', 'gloomwater-marsh', 'frostpeak-range'],
    unlockCost: { rep: 0 },
    polygon: [],
    mapPosition: { x: 0.2, y: 0.45 },
    geneConstraints: {
      color_cyan: { min: 1, max: 3 },
      breath_ice: { min: 1, max: 3 },
    },
    subordination: {
      color: 'color_cyan',
      breath: 'breath_ice',
    },
  },

  'blooming-reach': {
    name: 'The Blooming Reach',
    description: 'From amaranth flower fields to twilight forests and volcanic wastes. Magenta-toned dragons flourish in these vivid lands.',
    territories: ['twilight-thicket', 'petal-gardens', 'embercrag-wastes'],
    unlockCost: { rep: 0 },
    polygon: [],
    mapPosition: { x: 0.5, y: 0.3 },
    geneConstraints: {
      color_magenta: { min: 1, max: 3 },
      breath_fire: { min: 1, max: 3 },
    },
    subordination: {
      color: 'color_magenta',
      breath: 'breath_fire',
    },
  },

  'sunscorch-expanse': {
    name: 'The Sunscorch Expanse',
    description: 'A sun-blasted landscape of desert dunes, red canyons, and windswept plains. Yellow-scaled dragons rule the arid wastes.',
    territories: ['amber-mesa', 'golden-dunes', 'windswept-plains'],
    unlockCost: { rep: 0 },
    polygon: [],
    mapPosition: { x: 0.8, y: 0.45 },
    geneConstraints: {
      color_yellow: { min: 1, max: 3 },
      breath_lightning: { min: 1, max: 3 },
    },
    subordination: {
      color: 'color_yellow',
      breath: 'breath_lightning',
    },
  },
};

// ── Territories (Tier 2: Body/Frame + Color Refinement) ─────

export const TERRITORIES = {

  // ── VERDANT MIRE (Cyan) ─────────────────────────────────

  'emerald-canopy': {
    name: 'Emerald Canopy',
    regionId: 'verdant-mire',
    description: 'A dense tropical rainforest with a towering canopy. Green light filters through countless layers of leaves.',
    habitats: ['canopy-heights', 'mossy-ruins', 'tangled-roots'],
    geneConstraints: {
      // Color refinement: Green = Cyan + Yellow, no Magenta
      color_yellow: { min: 1, max: 2 },
      color_magenta: { min: 0, max: 0 },
      // Body/Frame: winged, agile, lightweight
      body_size: { min: 1, max: 4 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 2, max: 4 },
      frame_limbs: { min: 1, max: 2 },
      frame_bones: { min: 1, max: 2 },
      breath_shape: { min: 1, max: 2 },
      breath_range: { min: 2, max: 3 },
    },
  },

  'gloomwater-marsh': {
    name: 'Gloomwater Marsh',
    regionId: 'verdant-mire',
    description: 'A murky, mist-shrouded swamp where the water glows with a faint cyan luminescence.',
    habitats: ['glowing-bog', 'sunken-grove', 'reed-maze'],
    geneConstraints: {
      // Color refinement: Pure Cyan, no secondaries
      color_magenta: { min: 0, max: 0 },
      color_yellow: { min: 0, max: 0 },
      // Body/Frame: serpentine, amphibious, low wings
      body_size: { min: 2, max: 4 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 0, max: 1 },
      frame_limbs: { min: 1, max: 2 },
      frame_bones: { min: 1, max: 2 },
      breath_shape: { min: 1, max: 2 },
      breath_range: { min: 1, max: 2 },
    },
  },

  'frostpeak-range': {
    name: 'Frostpeak Range',
    regionId: 'verdant-mire',
    description: 'Frozen mountains where glacial ice meets volcanic heat. A land of extremes at the edge of the mire.',
    habitats: ['icy-peaks', 'frozen-lake', 'steam-geysers'],
    geneConstraints: {
      // Color refinement: Blue = Cyan + Magenta, no Yellow
      color_magenta: { min: 1, max: 2 },
      color_yellow: { min: 0, max: 0 },
      // Breath refinement: fire boosted as secondary (steam theme)
      breath_fire: { min: 0, max: 2 },
      // Body/Frame: large, powerful, heavy
      body_size: { min: 3, max: 6 },
      body_type: { min: 2, max: 3 },
      frame_wings: { min: 2, max: 4 },
      frame_limbs: { min: 2, max: 3 },
      frame_bones: { min: 2, max: 3 },
      breath_shape: { min: 2, max: 3 },
      breath_range: { min: 2, max: 3 },
    },
  },

  // ── BLOOMING REACH (Magenta) ────────────────────────────

  'twilight-thicket': {
    name: 'Twilight Thicket',
    regionId: 'blooming-reach',
    description: 'A mystical forest bathed in eternal twilight, where purple light and strange fungi create an otherworldly atmosphere.',
    habitats: ['twilight-grove', 'mushroom-grotto', 'moonstone-hollow'],
    geneConstraints: {
      // Color refinement: Purple = Magenta + Cyan, no Yellow
      color_cyan: { min: 1, max: 2 },
      color_yellow: { min: 0, max: 0 },
      // Breath refinement: ice boosted as secondary (cool mystic)
      breath_ice: { min: 0, max: 2 },
      // Body/Frame: mid-size, stealthy
      body_size: { min: 2, max: 4 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 0, max: 2 },
      frame_limbs: { min: 1, max: 2 },
      frame_bones: { min: 1, max: 2 },
      breath_shape: { min: 1, max: 2 },
      breath_range: { min: 1, max: 2 },
    },
  },

  'petal-gardens': {
    name: 'Petal Gardens',
    regionId: 'blooming-reach',
    description: 'Sprawling gardens of vibrant magenta flowers, thorny hedges, and peaceful glades.',
    habitats: ['petal-meadows', 'thorn-labyrinth', 'moonlit-glade'],
    geneConstraints: {
      // Color refinement: Pure Magenta, no secondaries
      color_cyan: { min: 0, max: 0 },
      color_yellow: { min: 0, max: 0 },
      // Body/Frame: small, lightweight, winged (butterfly-like)
      body_size: { min: 1, max: 3 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 2, max: 4 },
      frame_limbs: { min: 1, max: 2 },
      frame_bones: { min: 1, max: 2 },
      breath_shape: { min: 1, max: 2 },
      breath_range: { min: 1, max: 2 },
    },
  },

  'embercrag-wastes': {
    name: 'Embercrag Wastes',
    regionId: 'blooming-reach',
    description: 'Where the flowering lands give way to volcanic fury — obsidian spires and rivers of lava.',
    habitats: ['obsidian-peaks', 'lava-pools', 'lava-rock-fields'],
    geneConstraints: {
      // Color refinement: Red = Magenta + Yellow, no Cyan
      color_yellow: { min: 1, max: 2 },
      color_cyan: { min: 0, max: 0 },
      // Breath refinement: lightning boosted as secondary (volcanic lightning)
      breath_lightning: { min: 0, max: 2 },
      // Body/Frame: large, heavy, ground titans
      body_size: { min: 4, max: 6 },
      body_type: { min: 2, max: 3 },
      frame_wings: { min: 0, max: 2 },
      frame_limbs: { min: 2, max: 3 },
      frame_bones: { min: 2, max: 3 },
      breath_shape: { min: 2, max: 3 },
      breath_range: { min: 1, max: 2 },
    },
  },

  // ── SUNSCORCH EXPANSE (Yellow) ──────────────────────────

  'amber-mesa': {
    name: 'Amber Mesa',
    regionId: 'sunscorch-expanse',
    description: 'A high desert mesa of amber and orange sandstone, carved by wind into spectacular formations.',
    habitats: ['canyon', 'arches', 'painted-caves'],
    geneConstraints: {
      // Color refinement: Orange = Yellow + Magenta, no Cyan
      color_magenta: { min: 1, max: 2 },
      color_cyan: { min: 0, max: 0 },
      // Breath refinement: fire boosted as secondary (desert heat)
      breath_fire: { min: 0, max: 2 },
      // Body/Frame: mid-large, sturdy, canyon-dwellers
      body_size: { min: 3, max: 5 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 1, max: 3 },
      frame_limbs: { min: 2, max: 2 },
      frame_bones: { min: 2, max: 3 },
      breath_shape: { min: 2, max: 3 },
      breath_range: { min: 2, max: 3 },
    },
  },

  'golden-dunes': {
    name: 'Golden Dunes',
    regionId: 'sunscorch-expanse',
    description: 'An endless sea of golden sand dunes stretching to the horizon under a blazing sun.',
    habitats: ['oasis', 'cactus-fields', 'mirage-flats'],
    geneConstraints: {
      // Color refinement: Pure Yellow, no secondaries
      color_cyan: { min: 0, max: 0 },
      color_magenta: { min: 0, max: 0 },
      // Body/Frame: mid-size, versatile desert-adapted
      body_size: { min: 2, max: 4 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 0, max: 2 },
      frame_limbs: { min: 1, max: 2 },
      frame_bones: { min: 1, max: 2 },
      breath_shape: { min: 1, max: 3 },
      breath_range: { min: 1, max: 3 },
    },
  },

  'windswept-plains': {
    name: 'Windswept Plains',
    regionId: 'sunscorch-expanse',
    description: 'Where the desert gives way to rolling grasslands of gold and chartreuse, whipped by constant winds.',
    habitats: ['birch-forest', 'rolling-steppe', 'bamboo-thicket'],
    geneConstraints: {
      // Color refinement: Chartreuse = Yellow + Cyan, no Magenta
      color_cyan: { min: 1, max: 2 },
      color_magenta: { min: 0, max: 0 },
      // Breath refinement: ice boosted as secondary (cold winds)
      breath_ice: { min: 0, max: 2 },
      // Body/Frame: mid-large, fast, ground-runners
      body_size: { min: 3, max: 5 },
      body_type: { min: 1, max: 2 },
      frame_wings: { min: 0, max: 2 },
      frame_limbs: { min: 2, max: 3 },
      frame_bones: { min: 1, max: 2 },
      breath_shape: { min: 1, max: 2 },
      breath_range: { min: 2, max: 3 },
    },
  },
};

// ── Habitats (Tier 3: Finish + Features + Scales) ───────────

export const HABITATS = {

  // ================================================================
  // REGION 1: THE VERDANT MIRE (Cyan)
  // ================================================================

  // ── Emerald Canopy (Green territory) ──

  'canopy-heights': {
    name: 'Canopy Heights',
    territoryId: 'emerald-canopy',
    description: 'The towering treetops of the rainforest, where winged dragons nest among the highest branches and ride warm updrafts.',
    geneConstraints: {
      finish_opacity: { min: 0, max: 2 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 2, max: 3 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 1, max: 2 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'canopy-glider',
        name: 'Canopy Glider',
        weight: 6,
        genes: {
          frame_wings: [4, 3],
          frame_bones: [1, 1],
          color_cyan: [2, 3],
          color_yellow: [2, 2],
          body_size: [2, 3],
          tail_length: [3, 3],
          finish_schiller: [3, 3],
        },
      },
    ],
    encounterRate: { common: 78, rare: 15, species: 7 },
  },

  'mossy-ruins': {
    name: 'Mossy Ruins',
    territoryId: 'emerald-canopy',
    description: 'Ancient overgrown temple ruins hidden deep in the rainforest. Strange, old dragons dwell among the crumbling stone.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 1, max: 2 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'moss-guardian',
        name: 'Moss Guardian',
        weight: 4,
        genes: {
          body_scales: [3, 3],
          body_size: [5, 5],
          body_type: [3, 3],
          color_cyan: [2, 3],
          color_yellow: [1, 2],
          finish_opacity: [3, 3],
          horn_style: [3, 3],
        },
      },
    ],
    encounterRate: { common: 72, rare: 20, species: 8 },
  },

  'tangled-roots': {
    name: 'Tangled Roots',
    territoryId: 'emerald-canopy',
    description: 'A labyrinth of massive exposed root systems rising above the forest floor. Ground-dwelling serpentine dragons thrive here.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 1 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 1, max: 1 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'root-serpent',
        name: 'Root Serpent',
        weight: 6,
        genes: {
          body_type: [1, 1],
          frame_limbs: [0, 0],
          frame_wings: [0, 0],
          color_cyan: [2, 2],
          color_yellow: [3, 3],
          tail_length: [3, 3],
        },
      },
    ],
    encounterRate: { common: 76, rare: 17, species: 7 },
  },

  // ── Gloomwater Marsh (Pure Cyan territory) ──

  'glowing-bog': {
    name: 'Glowing Bog',
    territoryId: 'gloomwater-marsh',
    description: 'A bioluminescent swamp where the water itself glows an eerie cyan. Dragons here shimmer with strange iridescent finishes.',
    geneConstraints: {
      finish_opacity: { min: 0, max: 1 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 2, max: 3 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 1 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 3, max: 3 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {
      finish: { 0: 5, 1: 40, 2: 40, 3: 15 },
    },
    species: [
      {
        id: 'boglight',
        name: 'Boglight',
        weight: 5,
        genes: {
          color_cyan: [3, 3],
          finish_schiller: [3, 3],
          finish_opacity: [0, 1],
          body_size: [2, 3],
          spine_style: [3, 3],
        },
      },
    ],
    encounterRate: { common: 73, rare: 18, species: 9 },
  },

  'sunken-grove': {
    name: 'Sunken Grove',
    territoryId: 'gloomwater-marsh',
    description: 'A grove of half-submerged trees standing in still, dark water. Amphibious dragons lurk beneath the surface.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 1 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'swamp-lurker',
        name: 'Swamp Lurker',
        weight: 5,
        genes: {
          color_cyan: [3, 2],
          frame_wings: [0, 0],
          frame_limbs: [2, 2],
          body_type: [1, 1],
          finish_shine: [3, 3],
          spine_style: [1, 1],
        },
      },
    ],
    encounterRate: { common: 75, rare: 17, species: 8 },
  },

  'reed-maze': {
    name: 'Reed Maze',
    territoryId: 'gloomwater-marsh',
    description: 'Dense walls of towering reeds form a disorienting maze. Only small, quick dragons can navigate the narrow channels.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 0 },
      horn_direction: { min: 0, max: 0 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 1, max: 1 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [],
    encounterRate: { common: 85, rare: 15, species: 0 },
  },

  // ── Frostpeak Range (Blue territory: Cyan + Magenta) ──

  'icy-peaks': {
    name: 'Icy Peaks',
    territoryId: 'frostpeak-range',
    description: 'Jagged frozen summits piercing the clouds. Powerful winged dragons roost on the highest crags.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 2, max: 2 },
      spine_style: { min: 2, max: 3 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'peak-sovereign',
        name: 'Peak Sovereign',
        weight: 3,
        genes: {
          body_size: [6, 5],
          frame_wings: [4, 4],
          breath_ice: [3, 2],
          color_cyan: [3, 3],
          color_magenta: [2, 2],
          frame_bones: [3, 3],
          finish_shine: [3, 3],
        },
      },
    ],
    encounterRate: { common: 75, rare: 18, species: 7 },
  },

  'frozen-lake': {
    name: 'Frozen Lake',
    territoryId: 'frostpeak-range',
    description: 'A vast lake sealed beneath thick ice. Dragons slide across its surface and dive through cracks into the frigid depths below.',
    geneConstraints: {
      finish_opacity: { min: 0, max: 1 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 2 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 1, max: 1 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {
      finish: { 0: 5, 1: 45, 2: 35, 3: 15 },
    },
    species: [
      {
        id: 'glacial-diver',
        name: 'Glacial Diver',
        weight: 5,
        genes: {
          breath_ice: [3, 3],
          color_cyan: [3, 2],
          color_magenta: [1, 2],
          finish_shine: [3, 3],
          finish_opacity: [0, 1],
          body_type: [1, 2],
        },
      },
    ],
    encounterRate: { common: 74, rare: 18, species: 8 },
  },

  'steam-geysers': {
    name: 'Steam Geysers',
    territoryId: 'frostpeak-range',
    description: 'Where volcanic heat meets glacial ice, creating plumes of scalding steam. Dragons here wield both fire and frost.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 1, max: 2 },
      body_scales: { min: 1, max: 2 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 1, max: 2 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'geyser-wyrm',
        name: 'Geyser Wyrm',
        weight: 4,
        genes: {
          breath_fire: [2, 2],
          breath_ice: [2, 2],
          color_cyan: [2, 3],
          color_magenta: [2, 2],
          finish_opacity: [3, 3],
          body_type: [1, 1],
        },
      },
    ],
    encounterRate: { common: 68, rare: 22, species: 10 },
  },

  // ================================================================
  // REGION 2: THE BLOOMING REACH (Magenta)
  // ================================================================

  // ── Twilight Thicket (Purple territory: Magenta + Cyan) ──

  'twilight-grove': {
    name: 'Twilight Grove',
    territoryId: 'twilight-thicket',
    description: 'A forest bathed in perpetual dusk, where purple-leafed trees filter the light into deep violet shadows.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 2 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'dusk-stalker',
        name: 'Dusk Stalker',
        weight: 5,
        genes: {
          color_magenta: [3, 2],
          color_cyan: [2, 2],
          body_size: [3, 3],
          frame_limbs: [2, 2],
          frame_wings: [0, 1],
          finish_opacity: [3, 3],
        },
      },
    ],
    encounterRate: { common: 76, rare: 17, species: 7 },
  },

  'mushroom-grotto': {
    name: 'Mushroom Grotto',
    territoryId: 'twilight-thicket',
    description: 'A hidden cavern overflowing with giant glowing fungi. The air shimmers with spores and strange light.',
    geneConstraints: {
      finish_opacity: { min: 0, max: 1 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 2, max: 3 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 1 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 3, max: 3 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {
      finish: { 0: 5, 1: 40, 2: 40, 3: 15 },
    },
    species: [
      {
        id: 'spore-dragon',
        name: 'Spore Dragon',
        weight: 5,
        genes: {
          color_magenta: [3, 3],
          color_cyan: [1, 2],
          finish_schiller: [3, 3],
          finish_opacity: [1, 0],
          frame_wings: [0, 0],
          spine_style: [3, 3],
        },
      },
    ],
    encounterRate: { common: 70, rare: 20, species: 10 },
  },

  'moonstone-hollow': {
    name: 'Moonstone Hollow',
    territoryId: 'twilight-thicket',
    description: 'A crystalline clearing where pale stones glow under moonlight. Rare, luminous dragons gather here at night.',
    geneConstraints: {
      finish_opacity: { min: 0, max: 1 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 1, max: 2 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 1, max: 1 },
      horn_direction: { min: 2, max: 2 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {
      finish: { 0: 5, 1: 35, 2: 45, 3: 15 },
    },
    species: [
      {
        id: 'moonstone-drake',
        name: 'Moonstone Drake',
        weight: 3,
        genes: {
          color_magenta: [2, 2],
          color_cyan: [3, 3],
          finish_shine: [3, 3],
          finish_opacity: [0, 0],
          body_size: [3, 4],
          horn_style: [1, 1],
        },
      },
    ],
    encounterRate: { common: 70, rare: 20, species: 10 },
  },

  // ── Petal Gardens (Pure Magenta territory) ──

  'petal-meadows': {
    name: 'Petal Meadows',
    territoryId: 'petal-gardens',
    description: 'Endless fields of magenta blooms swaying in the breeze. Colorful dragons flutter among the flowers like oversized butterflies.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 2, max: 3 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 1 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'blossom-flutter',
        name: 'Blossom Flutter',
        weight: 7,
        genes: {
          color_magenta: [3, 3],
          frame_wings: [4, 3],
          body_size: [1, 2],
          frame_bones: [1, 1],
          finish_schiller: [2, 3],
        },
      },
    ],
    encounterRate: { common: 80, rare: 14, species: 6 },
  },

  'thorn-labyrinth': {
    name: 'Thorn Labyrinth',
    territoryId: 'petal-gardens',
    description: 'Dense walls of flowering thorny hedges forming a natural maze. Armored dragons patrol the winding paths.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 2, max: 3 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'thornback',
        name: 'Thornback',
        weight: 5,
        genes: {
          color_magenta: [3, 2],
          body_scales: [3, 3],
          spine_style: [2, 2],
          spine_height: [3, 3],
          horn_style: [2, 2],
          frame_limbs: [2, 2],
        },
      },
    ],
    encounterRate: { common: 76, rare: 17, species: 7 },
  },

  'moonlit-glade': {
    name: 'Moonlit Glade',
    territoryId: 'petal-gardens',
    description: 'A serene clearing with a still pond reflecting the sky. Gentle dragons come here to drink and rest among the lilies.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 2 },
      horn_style: { min: 1, max: 1 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'pond-dreamer',
        name: 'Pond Dreamer',
        weight: 4,
        genes: {
          color_magenta: [3, 3],
          finish_shine: [3, 2],
          finish_opacity: [1, 0],
          body_size: [3, 4],
          body_type: [2, 2],
          horn_style: [1, 1],
        },
      },
    ],
    encounterRate: { common: 74, rare: 18, species: 8 },
  },

  // ── Embercrag Wastes (Red territory: Magenta + Yellow) ──

  'obsidian-peaks': {
    name: 'Obsidian Peaks',
    territoryId: 'embercrag-wastes',
    description: 'Jagged spires of volcanic glass rising from the scorched earth. Heat-resistant dragons roost on the razor-sharp crags.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 2, max: 2 },
      spine_style: { min: 2, max: 3 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'obsidian-fang',
        name: 'Obsidian Fang',
        weight: 4,
        genes: {
          color_magenta: [3, 2],
          color_yellow: [2, 3],
          breath_fire: [3, 3],
          body_scales: [3, 3],
          body_size: [5, 5],
          finish_shine: [3, 3],
        },
      },
    ],
    encounterRate: { common: 74, rare: 18, species: 8 },
  },

  'lava-pools': {
    name: 'Lava Pools',
    territoryId: 'embercrag-wastes',
    description: 'Bubbling pools of molten rock where fire dragons bathe in the magma. The air ripples with extreme heat.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 1, max: 2 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 1, max: 2 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'magma-dweller',
        name: 'Magma Dweller',
        weight: 4,
        genes: {
          color_magenta: [3, 3],
          color_yellow: [3, 2],
          breath_fire: [3, 3],
          finish_opacity: [3, 3],
          body_type: [3, 3],
          finish_schiller: [2, 2],
        },
      },
    ],
    encounterRate: { common: 70, rare: 20, species: 10 },
  },

  'lava-rock-fields': {
    name: 'Lava Rock Fields',
    territoryId: 'embercrag-wastes',
    description: 'A vast plain of cooled lava rock, cracked and jagged. Hardy ground dragons patrol the rugged terrain.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 0 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 2, max: 2 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'crag-stomper',
        name: 'Crag Stomper',
        weight: 5,
        genes: {
          color_magenta: [2, 3],
          color_yellow: [2, 2],
          body_scales: [3, 3],
          frame_bones: [3, 3],
          frame_limbs: [3, 3],
          body_size: [5, 6],
        },
      },
    ],
    encounterRate: { common: 76, rare: 17, species: 7 },
  },

  // ================================================================
  // REGION 3: THE SUNSCORCH EXPANSE (Yellow)
  // ================================================================

  // ── Amber Mesa (Orange territory: Yellow + Magenta) ──

  'canyon': {
    name: 'Canyon',
    territoryId: 'amber-mesa',
    description: 'Deep slot canyons carved through red sandstone. Dragons echo their calls off the towering walls.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 2 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 0 },
      spine_style: { min: 1, max: 2 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'canyon-echo',
        name: 'Canyon Echo',
        weight: 5,
        genes: {
          color_yellow: [3, 2],
          color_magenta: [2, 2],
          breath_shape: [3, 3],
          breath_range: [3, 3],
          body_size: [4, 4],
          frame_wings: [2, 3],
        },
      },
    ],
    encounterRate: { common: 76, rare: 17, species: 7 },
  },

  'arches': {
    name: 'Arches',
    territoryId: 'amber-mesa',
    description: 'Natural stone arches span across the desert sky. Winged dragons perch on the keystones and survey the land below.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 0 },
      body_scales: { min: 1, max: 2 },
      horn_style: { min: 1, max: 1 },
      horn_direction: { min: 1, max: 1 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'arch-sentinel',
        name: 'Arch Sentinel',
        weight: 5,
        genes: {
          color_yellow: [3, 3],
          color_magenta: [2, 1],
          frame_wings: [3, 4],
          body_size: [4, 4],
          horn_direction: [2, 2],
          horn_style: [1, 1],
        },
      },
    ],
    encounterRate: { common: 78, rare: 15, species: 7 },
  },

  'painted-caves': {
    name: 'Painted Caves',
    territoryId: 'amber-mesa',
    description: 'Caves streaked with layers of mineral color — ochre, rust, and amber. Reclusive dragons hide among the painted stone.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 1, max: 2 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 0, max: 1 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {
      finish: { 0: 5, 1: 45, 2: 35, 3: 15 },
    },
    species: [
      {
        id: 'painted-lurker',
        name: 'Painted Lurker',
        weight: 5,
        genes: {
          color_yellow: [2, 3],
          color_magenta: [3, 2],
          finish_opacity: [3, 3],
          frame_wings: [0, 0],
          body_scales: [2, 2],
          finish_schiller: [2, 2],
        },
      },
    ],
    encounterRate: { common: 72, rare: 20, species: 8 },
  },

  // ── Golden Dunes (Pure Yellow territory) ──

  'oasis': {
    name: 'Oasis',
    territoryId: 'golden-dunes',
    description: 'A lush pocket of life amid the endless sands. Dragons gather at the water\'s edge, drawn by the rare shade and moisture.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 1 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'oasis-keeper',
        name: 'Oasis Keeper',
        weight: 4,
        genes: {
          color_yellow: [3, 3],
          body_size: [4, 4],
          body_type: [2, 2],
          finish_shine: [2, 2],
          horn_style: [1, 1],
        },
      },
    ],
    encounterRate: { common: 75, rare: 17, species: 8 },
  },

  'cactus-fields': {
    name: 'Cactus Fields',
    territoryId: 'golden-dunes',
    description: 'A desert expanse bristling with towering cacti. Armored, spiny dragons blend in perfectly among the thorns.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 0 },
      body_scales: { min: 2, max: 3 },
      horn_style: { min: 2, max: 3 },
      horn_direction: { min: 0, max: 1 },
      spine_style: { min: 2, max: 3 },
      spine_height: { min: 2, max: 3 },
      tail_shape: { min: 2, max: 3 },
      tail_length: { min: 1, max: 1 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'cactus-drake',
        name: 'Cactus Drake',
        weight: 6,
        genes: {
          color_yellow: [3, 2],
          spine_style: [2, 2],
          spine_height: [3, 3],
          body_scales: [3, 3],
          body_size: [3, 3],
          frame_limbs: [2, 2],
        },
      },
    ],
    encounterRate: { common: 78, rare: 15, species: 7 },
  },

  'mirage-flats': {
    name: 'Mirage Flats',
    territoryId: 'golden-dunes',
    description: 'A shimmering expanse where heat haze plays tricks on the eye. Translucent, phantom-like dragons appear and vanish in the glare.',
    geneConstraints: {
      finish_opacity: { min: 0, max: 1 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 2, max: 3 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 0 },
      horn_direction: { min: 0, max: 0 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {
      finish: { 0: 15, 1: 45, 2: 30, 3: 10 },
    },
    species: [
      {
        id: 'mirage-phantom',
        name: 'Mirage Phantom',
        weight: 3,
        genes: {
          color_yellow: [3, 3],
          finish_opacity: [0, 0],
          finish_schiller: [3, 3],
          finish_shine: [2, 2],
          body_size: [3, 4],
          frame_wings: [2, 2],
        },
      },
    ],
    encounterRate: { common: 72, rare: 20, species: 8 },
  },

  // ── Windswept Plains (Chartreuse territory: Yellow + Cyan) ──

  'birch-forest': {
    name: 'Birch Forest',
    territoryId: 'windswept-plains',
    description: 'Groves of pale birch trees with golden-green leaves. Dragons weave between the slender trunks.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 1, max: 2 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 2 },
      horn_style: { min: 1, max: 1 },
      horn_direction: { min: 1, max: 2 },
      spine_style: { min: 1, max: 1 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'birchwood-strider',
        name: 'Birchwood Strider',
        weight: 6,
        genes: {
          color_yellow: [3, 2],
          color_cyan: [2, 2],
          body_size: [3, 3],
          frame_limbs: [2, 2],
          frame_wings: [0, 1],
          tail_length: [3, 3],
        },
      },
    ],
    encounterRate: { common: 78, rare: 15, species: 7 },
  },

  'rolling-steppe': {
    name: 'Rolling Steppe',
    territoryId: 'windswept-plains',
    description: 'Windswept hills covered in tall, golden-green grass that ripples like the sea. Fleet-footed dragons race across the open land.',
    geneConstraints: {
      finish_opacity: { min: 2, max: 3 },
      finish_shine: { min: 0, max: 1 },
      finish_schiller: { min: 0, max: 0 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 1, max: 2 },
      horn_direction: { min: 1, max: 1 },
      spine_style: { min: 0, max: 0 },
      spine_height: { min: 1, max: 1 },
      tail_shape: { min: 1, max: 1 },
      tail_length: { min: 1, max: 2 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'steppe-runner',
        name: 'Steppe Runner',
        weight: 6,
        genes: {
          color_yellow: [3, 3],
          color_cyan: [1, 2],
          body_size: [4, 4],
          frame_bones: [1, 1],
          frame_limbs: [2, 2],
          frame_wings: [1, 0],
          tail_shape: [1, 1],
        },
      },
    ],
    encounterRate: { common: 80, rare: 14, species: 6 },
  },

  'bamboo-thicket': {
    name: 'Bamboo Thicket',
    territoryId: 'windswept-plains',
    description: 'Dense groves of towering bamboo that creak and sway in the wind. Serpentine dragons coil among the stalks.',
    geneConstraints: {
      finish_opacity: { min: 1, max: 2 },
      finish_shine: { min: 2, max: 3 },
      finish_schiller: { min: 0, max: 1 },
      body_scales: { min: 1, max: 1 },
      horn_style: { min: 0, max: 0 },
      horn_direction: { min: 0, max: 0 },
      spine_style: { min: 1, max: 1 },
      spine_height: { min: 1, max: 2 },
      tail_shape: { min: 2, max: 2 },
      tail_length: { min: 2, max: 3 },
    },
    triangleOverrides: {},
    species: [
      {
        id: 'bamboo-coiler',
        name: 'Bamboo Coiler',
        weight: 5,
        genes: {
          color_yellow: [2, 3],
          color_cyan: [3, 2],
          body_type: [1, 1],
          frame_wings: [0, 0],
          frame_limbs: [0, 1],
          tail_length: [3, 3],
          body_size: [3, 4],
        },
      },
    ],
    encounterRate: { common: 75, rare: 17, species: 8 },
  },
};

// ── Starter region ──────────────────────────────────────────
export const STARTER_REGION = 'verdant-mire';

// ── Helpers ─────────────────────────────────────────────────

export function getRegionIds() {
  return Object.keys(REGIONS);
}

export function getTerritoriesForRegion(regionId) {
  const region = REGIONS[regionId];
  if (!region) return [];
  return region.territories.map(id => ({ id, ...TERRITORIES[id] }));
}

export function getHabitatsForTerritory(territoryId) {
  const territory = TERRITORIES[territoryId];
  if (!territory) return [];
  return territory.habitats.map(id => ({ id, ...HABITATS[id] }));
}

export function getHabitatBreadcrumb(habitatId) {
  const habitat = HABITATS[habitatId];
  if (!habitat) return null;
  const territory = TERRITORIES[habitat.territoryId];
  if (!territory) return null;
  const region = REGIONS[territory.regionId];
  if (!region) return null;
  return {
    region: { id: territory.regionId, name: region.name },
    territory: { id: habitat.territoryId, name: territory.name },
    habitat: { id: habitatId, name: habitat.name },
  };
}

/**
 * Get the region that owns a territory.
 */
export function getRegionForTerritory(territoryId) {
  const territory = TERRITORIES[territoryId];
  if (!territory) return null;
  return { id: territory.regionId, ...REGIONS[territory.regionId] };
}

/**
 * Get the region that owns a habitat (traverses territory → region).
 */
export function getRegionForHabitat(habitatId) {
  const habitat = HABITATS[habitatId];
  if (!habitat) return null;
  return getRegionForTerritory(habitat.territoryId);
}

/**
 * Merge two gene constraint objects. Overlapping genes take the tighter range.
 * Returns a new merged object — does not mutate inputs.
 */
export function mergeConstraints(base, overlay) {
  const merged = {};
  // Copy base
  for (const [gene, range] of Object.entries(base)) {
    merged[gene] = { ...range };
  }
  // Merge overlay (intersect ranges)
  for (const [gene, range] of Object.entries(overlay)) {
    if (merged[gene]) {
      merged[gene] = {
        min: Math.max(merged[gene].min, range.min),
        max: Math.min(merged[gene].max, range.max),
      };
    } else {
      merged[gene] = { ...range };
    }
  }
  return merged;
}

/**
 * Build the full merged constraints for a given depth level.
 * - 'region': region constraints only
 * - 'territory': region + territory merged
 * - 'habitat': region + territory + habitat merged
 *
 * Also merges triangleOverrides from the deepest level that has them.
 * Returns { geneConstraints, triangleOverrides, subordination }
 */
export function buildConstraintsForRegion(regionId) {
  const region = REGIONS[regionId];
  if (!region) return null;
  return {
    geneConstraints: { ...region.geneConstraints },
    triangleOverrides: {},
    subordination: region.subordination,
  };
}

export function buildConstraintsForTerritory(territoryId) {
  const territory = TERRITORIES[territoryId];
  if (!territory) return null;
  const region = REGIONS[territory.regionId];
  if (!region) return null;

  return {
    geneConstraints: mergeConstraints(region.geneConstraints, territory.geneConstraints),
    triangleOverrides: {},
    subordination: region.subordination,
  };
}

export function buildConstraintsForHabitat(habitatId) {
  const habitat = HABITATS[habitatId];
  if (!habitat) return null;
  const territory = TERRITORIES[habitat.territoryId];
  if (!territory) return null;
  const region = REGIONS[territory.regionId];
  if (!region) return null;

  const merged = mergeConstraints(
    mergeConstraints(region.geneConstraints, territory.geneConstraints),
    habitat.geneConstraints,
  );

  return {
    geneConstraints: merged,
    triangleOverrides: habitat.triangleOverrides || {},
    subordination: region.subordination,
  };
}
