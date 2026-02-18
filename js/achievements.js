// Achievement system: definitions, tracking, and unlock checks
// Achievements are evaluated on game events (capture, breed, stable, quest)
// and persisted via save-manager.js

import { getStats } from './save-manager.js';
import { getStabledDragons } from './ui-stables.js';
import { getCompletedQuests } from './quest-engine.js';
import { SPECIALTY_COMBOS, COLOR_NAMES, FINISH_NAMES, ELEMENT_NAMES } from './gene-config.js';

// ── Achievement Definitions ──────────────────────────────────

// Each achievement has:
//   id: unique string key
//   name: display name
//   desc: description
//   icon: emoji icon
//   category: grouping category
//   rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
//   check(ctx): function that returns true if unlocked
//   progress(ctx): optional, returns { current, target } for progress display

// Context object passed to check/progress:
//   { stats, stabledDragons, completedQuests, registry, discoveredColors,
//     discoveredFinishes, discoveredElements, discoveredSpecialties,
//     maxGeneration, totalMutations, uniqueTraitCombos }

// ── Color Theme Groups ──────────────────────────────────────

const COLOR_THEMES = {
  floral: {
    name: 'Floral',
    icon: '🌸',
    colors: ['Sakura', 'Pink', 'Hot Pink', 'Rose', 'Fuchsia', 'Coral', 'Salmon', 'Red', 'Magenta', 'Orchid'],
    desc: 'Collect dragons in warm pinks, reds, and roses',
  },
  ocean: {
    name: 'Ocean',
    icon: '🌊',
    colors: ['Aqua', 'Cyan', 'Cerulean', 'Teal', 'Seafoam', 'Cobalt', 'Ultramarine', 'Blue', 'Mint', 'Cornflower Blue'],
    desc: 'Collect dragons in cool blues and aquas',
  },
  twilight: {
    name: 'Twilight',
    icon: '🌙',
    colors: ['Violet', 'Purple', 'Indigo', 'Wisteria', 'Heliotrope', 'Periwinkle', 'Orchid', 'Magnolia', 'Iris', 'Mauve'],
    desc: 'Collect dragons in mystic purples and violets',
  },
  forest: {
    name: 'Forest',
    icon: '🌿',
    colors: ['Green', 'Neon Green', 'Spring Green', 'Chartreuse', 'Fern', 'Ivy Green', 'Kelly Green', 'Forest Green', 'Clover', 'Moss Green'],
    desc: 'Collect dragons in lush greens',
  },
  ember: {
    name: 'Ember',
    icon: '🔥',
    colors: ['Red', 'Orange', 'Saffron', 'Carrot', 'Crimson', 'Maroon', 'Umber', 'Sienna', 'Berry', 'Coral'],
    desc: 'Collect dragons in fiery reds and oranges',
  },
  starlight: {
    name: 'Starlight',
    icon: '✨',
    colors: ['White', 'Ice Blue', 'Butter Yellow', 'Celadon', 'Lemon Yellow', 'Grey', 'Silver'],
    desc: 'Collect dragons in pale, luminous hues',
  },
  abyss: {
    name: 'Abyss',
    icon: '🕳️',
    colors: ['Black', 'Midnight Blue', 'Maroon', 'Deep Sea Green', 'Plum', 'Slate'],
    desc: 'Collect dragons in the darkest shades',
  },
};

// ── Achievement Categories ──────────────────────────────────

export const ACHIEVEMENT_CATEGORIES = [
  { key: 'color_themes', label: 'Color Themes', icon: '🎨' },
  { key: 'collection', label: 'Collection', icon: '📚' },
  { key: 'breeding', label: 'Breeding', icon: '🥚' },
  { key: 'quests', label: 'Quests', icon: '⚔️' },
  { key: 'discovery', label: 'Discovery', icon: '🔍' },
  { key: 'milestones', label: 'Milestones', icon: '🏆' },
];

// ── Build Achievement List ──────────────────────────────────

const ACHIEVEMENTS = [];

// ── Color Theme Achievements ──
for (const [themeKey, theme] of Object.entries(COLOR_THEMES)) {
  // Bronze: 3 unique colors from theme
  ACHIEVEMENTS.push({
    id: `theme_${themeKey}_bronze`,
    name: `${theme.name} Novice`,
    desc: `Stable 3 different ${theme.name} colors`,
    icon: theme.icon,
    category: 'color_themes',
    rarity: 'common',
    themeKey,
    tier: 'bronze',
    check: (ctx) => countThemeColors(ctx, theme.colors) >= 3,
    progress: (ctx) => ({ current: countThemeColors(ctx, theme.colors), target: 3 }),
  });
  // Silver: 5 unique colors from theme
  ACHIEVEMENTS.push({
    id: `theme_${themeKey}_silver`,
    name: `${theme.name} Collector`,
    desc: `Stable 5 different ${theme.name} colors`,
    icon: theme.icon,
    category: 'color_themes',
    rarity: 'uncommon',
    themeKey,
    tier: 'silver',
    check: (ctx) => countThemeColors(ctx, theme.colors) >= 5,
    progress: (ctx) => ({ current: countThemeColors(ctx, theme.colors), target: 5 }),
  });
  // Gold: all colors from theme
  ACHIEVEMENTS.push({
    id: `theme_${themeKey}_gold`,
    name: `${theme.name} Master`,
    desc: `Stable all ${theme.colors.length} ${theme.name} colors`,
    icon: theme.icon,
    category: 'color_themes',
    rarity: 'rare',
    themeKey,
    tier: 'gold',
    check: (ctx) => countThemeColors(ctx, theme.colors) >= theme.colors.length,
    progress: (ctx) => ({ current: countThemeColors(ctx, theme.colors), target: theme.colors.length }),
  });
}

// ── Collection Achievements ──
ACHIEVEMENTS.push({
  id: 'stable_5',
  name: 'Fledgling Keeper',
  desc: 'Have 5 dragons in your stables at once',
  icon: '🏠',
  category: 'collection',
  rarity: 'common',
  check: (ctx) => ctx.stabledDragons.length >= 5,
  progress: (ctx) => ({ current: ctx.stabledDragons.length, target: 5 }),
});

ACHIEVEMENTS.push({
  id: 'stable_15',
  name: 'Dragon Warden',
  desc: 'Have 15 dragons in your stables at once',
  icon: '🏰',
  category: 'collection',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.length >= 15,
  progress: (ctx) => ({ current: ctx.stabledDragons.length, target: 15 }),
});

ACHIEVEMENTS.push({
  id: 'stable_30',
  name: 'Master of the Brood',
  desc: 'Have 30 dragons in your stables at once',
  icon: '👑',
  category: 'collection',
  rarity: 'rare',
  check: (ctx) => ctx.stabledDragons.length >= 30,
  progress: (ctx) => ({ current: ctx.stabledDragons.length, target: 30 }),
});

ACHIEVEMENTS.push({
  id: 'stable_50',
  name: 'Dragon Sovereign',
  desc: 'Have 50 dragons in your stables at once',
  icon: '🐲',
  category: 'collection',
  rarity: 'legendary',
  check: (ctx) => ctx.stabledDragons.length >= 50,
  progress: (ctx) => ({ current: ctx.stabledDragons.length, target: 50 }),
});

// ── Breeding Achievements ──
ACHIEVEMENTS.push({
  id: 'breed_first',
  name: 'First Clutch',
  desc: 'Breed your first dragon',
  icon: '🥚',
  category: 'breeding',
  rarity: 'common',
  check: (ctx) => ctx.stats.totalBred >= 1,
});

ACHIEVEMENTS.push({
  id: 'breed_25',
  name: 'Prolific Breeder',
  desc: 'Breed 25 dragons',
  icon: '🐣',
  category: 'breeding',
  rarity: 'common',
  check: (ctx) => ctx.stats.totalBred >= 25,
  progress: (ctx) => ({ current: ctx.stats.totalBred, target: 25 }),
});

ACHIEVEMENTS.push({
  id: 'breed_100',
  name: 'Hatchery Master',
  desc: 'Breed 100 dragons',
  icon: '🏭',
  category: 'breeding',
  rarity: 'uncommon',
  check: (ctx) => ctx.stats.totalBred >= 100,
  progress: (ctx) => ({ current: ctx.stats.totalBred, target: 100 }),
});

ACHIEVEMENTS.push({
  id: 'breed_500',
  name: 'Dynasty Founder',
  desc: 'Breed 500 dragons',
  icon: '🗿',
  category: 'breeding',
  rarity: 'rare',
  check: (ctx) => ctx.stats.totalBred >= 500,
  progress: (ctx) => ({ current: ctx.stats.totalBred, target: 500 }),
});

ACHIEVEMENTS.push({
  id: 'gen_3',
  name: 'Three Generations',
  desc: 'Stable a Gen 3 or higher dragon',
  icon: '📖',
  category: 'breeding',
  rarity: 'common',
  check: (ctx) => ctx.maxGeneration >= 3,
});

ACHIEVEMENTS.push({
  id: 'gen_5',
  name: 'Ancient Lineage',
  desc: 'Stable a Gen 5 or higher dragon',
  icon: '📜',
  category: 'breeding',
  rarity: 'uncommon',
  check: (ctx) => ctx.maxGeneration >= 5,
});

ACHIEVEMENTS.push({
  id: 'gen_10',
  name: 'Living Legend',
  desc: 'Stable a Gen 10 or higher dragon',
  icon: '🏛️',
  category: 'breeding',
  rarity: 'rare',
  check: (ctx) => ctx.maxGeneration >= 10,
});

ACHIEVEMENTS.push({
  id: 'mutation_1',
  name: 'Mutant!',
  desc: 'Stable a dragon with at least 1 mutation',
  icon: '⚡',
  category: 'breeding',
  rarity: 'common',
  check: (ctx) => ctx.stabledDragons.some(d => d.mutations && d.mutations.length > 0),
});

ACHIEVEMENTS.push({
  id: 'mutation_multi',
  name: 'Mutation Jackpot',
  desc: 'Stable a dragon with 3 or more mutations',
  icon: '💥',
  category: 'breeding',
  rarity: 'rare',
  check: (ctx) => ctx.stabledDragons.some(d => d.mutations && d.mutations.length >= 3),
});

// ── Quest Achievements ──
ACHIEVEMENTS.push({
  id: 'quest_first',
  name: 'Quest Beginner',
  desc: 'Complete your first quest',
  icon: '⚔️',
  category: 'quests',
  rarity: 'common',
  check: (ctx) => ctx.stats.totalQuestsCompleted >= 1,
});

ACHIEVEMENTS.push({
  id: 'quest_10',
  name: 'Quest Veteran',
  desc: 'Complete 10 quests',
  icon: '🗡️',
  category: 'quests',
  rarity: 'uncommon',
  check: (ctx) => ctx.stats.totalQuestsCompleted >= 10,
  progress: (ctx) => ({ current: ctx.stats.totalQuestsCompleted, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'quest_25',
  name: 'Quest Champion',
  desc: 'Complete 25 quests',
  icon: '🏅',
  category: 'quests',
  rarity: 'rare',
  check: (ctx) => ctx.stats.totalQuestsCompleted >= 25,
  progress: (ctx) => ({ current: ctx.stats.totalQuestsCompleted, target: 25 }),
});

ACHIEVEMENTS.push({
  id: 'quest_hard',
  name: 'Hardened Warrior',
  desc: 'Complete a Hard quest',
  icon: '🔶',
  category: 'quests',
  rarity: 'uncommon',
  check: (ctx) => ctx.completedQuests.some(q => q.difficulty === 'hard'),
});

ACHIEVEMENTS.push({
  id: 'quest_extra_hard',
  name: 'Legendary Hero',
  desc: 'Complete an Extra Hard quest',
  icon: '💎',
  category: 'quests',
  rarity: 'rare',
  check: (ctx) => ctx.completedQuests.some(q => q.difficulty === 'extra-hard'),
});

ACHIEVEMENTS.push({
  id: 'quest_bred_submit',
  name: 'Purpose-Bred',
  desc: 'Complete a quest with a bred dragon (Gen 1+)',
  icon: '🎯',
  category: 'quests',
  rarity: 'common',
  check: (ctx) => ctx.completedQuests.some(q => q.completedByGeneration > 0),
});

ACHIEVEMENTS.push({
  id: 'quest_deep_lineage',
  name: 'Deep Pedigree',
  desc: 'Complete a quest with a Gen 5+ dragon',
  icon: '🌲',
  category: 'quests',
  rarity: 'rare',
  check: (ctx) => ctx.completedQuests.some(q => q.completedByGeneration >= 5),
});

// ── Discovery Achievements ──
ACHIEVEMENTS.push({
  id: 'discover_colors_10',
  name: 'Color Explorer',
  desc: 'Discover 10 unique colors (in stables)',
  icon: '🎨',
  category: 'discovery',
  rarity: 'common',
  check: (ctx) => ctx.discoveredColors.size >= 10,
  progress: (ctx) => ({ current: ctx.discoveredColors.size, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'discover_colors_32',
  name: 'Color Connoisseur',
  desc: 'Discover 32 unique colors (in stables)',
  icon: '🌈',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.discoveredColors.size >= 32,
  progress: (ctx) => ({ current: ctx.discoveredColors.size, target: 32 }),
});

ACHIEVEMENTS.push({
  id: 'discover_colors_all',
  name: 'Chromatographer',
  desc: 'Discover all 64 color names (in stables)',
  icon: '🎪',
  category: 'discovery',
  rarity: 'legendary',
  check: (ctx) => ctx.discoveredColors.size >= 64,
  progress: (ctx) => ({ current: ctx.discoveredColors.size, target: 64 }),
});

ACHIEVEMENTS.push({
  id: 'discover_finishes_10',
  name: 'Finish Explorer',
  desc: 'Discover 10 unique finishes (in stables)',
  icon: '✨',
  category: 'discovery',
  rarity: 'common',
  check: (ctx) => ctx.discoveredFinishes.size >= 10,
  progress: (ctx) => ({ current: ctx.discoveredFinishes.size, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'discover_finishes_all',
  name: 'Finish Perfectionist',
  desc: 'Discover all 64 finish names (in stables)',
  icon: '💫',
  category: 'discovery',
  rarity: 'legendary',
  check: (ctx) => ctx.discoveredFinishes.size >= 64,
  progress: (ctx) => ({ current: ctx.discoveredFinishes.size, target: 64 }),
});

ACHIEVEMENTS.push({
  id: 'discover_elements_10',
  name: 'Element Explorer',
  desc: 'Discover 10 unique elements (in stables)',
  icon: '🌀',
  category: 'discovery',
  rarity: 'common',
  check: (ctx) => ctx.discoveredElements.size >= 10,
  progress: (ctx) => ({ current: ctx.discoveredElements.size, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'discover_elements_all',
  name: 'Elemental Sage',
  desc: 'Discover all 64 element names (in stables)',
  icon: '🔮',
  category: 'discovery',
  rarity: 'legendary',
  check: (ctx) => ctx.discoveredElements.size >= 64,
  progress: (ctx) => ({ current: ctx.discoveredElements.size, target: 64 }),
});

ACHIEVEMENTS.push({
  id: 'discover_specialty_1',
  name: 'Rare Find',
  desc: 'Stable a dragon with a specialty combo name',
  icon: '💎',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.discoveredSpecialties.size >= 1,
});

ACHIEVEMENTS.push({
  id: 'discover_specialty_10',
  name: 'Gem Collector',
  desc: 'Discover 10 unique specialty combos (in stables)',
  icon: '💍',
  category: 'discovery',
  rarity: 'rare',
  check: (ctx) => ctx.discoveredSpecialties.size >= 10,
  progress: (ctx) => ({ current: ctx.discoveredSpecialties.size, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'discover_specialty_all',
  name: 'Grand Curator',
  desc: `Discover all ${Object.keys(SPECIALTY_COMBOS).length} specialty combos`,
  icon: '🏛️',
  category: 'discovery',
  rarity: 'legendary',
  check: (ctx) => ctx.discoveredSpecialties.size >= Object.keys(SPECIALTY_COMBOS).length,
  progress: (ctx) => ({ current: ctx.discoveredSpecialties.size, target: Object.keys(SPECIALTY_COMBOS).length }),
});

ACHIEVEMENTS.push({
  id: 'discover_dark_energy',
  name: 'Void Touched',
  desc: 'Stable a Dark Energy dragon',
  icon: '🕳️',
  category: 'discovery',
  rarity: 'rare',
  check: (ctx) => ctx.stabledDragons.some(d => d.isDarkEnergy),
});

ACHIEVEMENTS.push({
  id: 'discover_modifier',
  name: 'Elemental Hybrid',
  desc: 'Stable a dragon with an element modifier prefix',
  icon: '🌡️',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.color?.modifierPrefix),
});

// ── Milestone Achievements ──
ACHIEVEMENTS.push({
  id: 'capture_10',
  name: 'Dragon Catcher',
  desc: 'Capture 10 wild dragons',
  icon: '🐉',
  category: 'milestones',
  rarity: 'common',
  check: (ctx) => ctx.stats.totalGenerated >= 10,
  progress: (ctx) => ({ current: ctx.stats.totalGenerated, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'capture_50',
  name: 'Seasoned Hunter',
  desc: 'Capture 50 wild dragons',
  icon: '🏹',
  category: 'milestones',
  rarity: 'uncommon',
  check: (ctx) => ctx.stats.totalGenerated >= 50,
  progress: (ctx) => ({ current: ctx.stats.totalGenerated, target: 50 }),
});

ACHIEVEMENTS.push({
  id: 'capture_200',
  name: 'Legendary Hunter',
  desc: 'Capture 200 wild dragons',
  icon: '⚜️',
  category: 'milestones',
  rarity: 'rare',
  check: (ctx) => ctx.stats.totalGenerated >= 200,
  progress: (ctx) => ({ current: ctx.stats.totalGenerated, target: 200 }),
});

ACHIEVEMENTS.push({
  id: 'release_10',
  name: 'Kind Heart',
  desc: 'Release 10 dragons back to the wild',
  icon: '🕊️',
  category: 'milestones',
  rarity: 'common',
  check: (ctx) => ctx.stats.totalReleased >= 10,
  progress: (ctx) => ({ current: ctx.stats.totalReleased, target: 10 }),
});

ACHIEVEMENTS.push({
  id: 'release_50',
  name: 'Freedom Fighter',
  desc: 'Release 50 dragons back to the wild',
  icon: '🦅',
  category: 'milestones',
  rarity: 'uncommon',
  check: (ctx) => ctx.stats.totalReleased >= 50,
  progress: (ctx) => ({ current: ctx.stats.totalReleased, target: 50 }),
});

ACHIEVEMENTS.push({
  id: 'total_stabled_50',
  name: 'Well-Traveled',
  desc: 'Have stabled 50 dragons over your career (including released)',
  icon: '🗺️',
  category: 'milestones',
  rarity: 'uncommon',
  check: (ctx) => ctx.stats.totalStabled >= 50,
  progress: (ctx) => ({ current: ctx.stats.totalStabled, target: 50 }),
});

ACHIEVEMENTS.push({
  id: 'total_stabled_200',
  name: 'Keeper of Many',
  desc: 'Have stabled 200 dragons over your career',
  icon: '📊',
  category: 'milestones',
  rarity: 'rare',
  check: (ctx) => ctx.stats.totalStabled >= 200,
  progress: (ctx) => ({ current: ctx.stats.totalStabled, target: 200 }),
});

// Special achievements
ACHIEVEMENTS.push({
  id: 'mega_dragon',
  name: 'Titan',
  desc: 'Stable a Mega-sized dragon',
  icon: '🗻',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.traits?.body_size?.name === 'Mega'),
});

ACHIEVEMENTS.push({
  id: 'bird_dragon',
  name: 'Tiny Terror',
  desc: 'Stable a Bird-sized dragon',
  icon: '🐦',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.traits?.body_size?.name === 'Bird'),
});

ACHIEVEMENTS.push({
  id: 'six_wings',
  name: 'Seraph',
  desc: 'Stable a dragon with Six wings',
  icon: '👼',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.traits?.frame_wings?.name === 'Six'),
});

ACHIEVEMENTS.push({
  id: 'wingless_limbless',
  name: 'True Serpent',
  desc: 'Stable a wingless, limbless dragon',
  icon: '🐍',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d =>
    d.phenotype?.traits?.frame_wings?.name === 'None' &&
    d.phenotype?.traits?.frame_limbs?.name === 'Limbless (0)'
  ),
});

ACHIEVEMENTS.push({
  id: 'plasma_breath',
  name: 'Plasma Core',
  desc: 'Stable a dragon with Plasma breath',
  icon: '☀️',
  category: 'discovery',
  rarity: 'rare',
  check: (ctx) => ctx.stabledDragons.some(d => {
    const eName = d.phenotype?.breathElement?.displayName;
    return eName && eName.includes('Plasma');
  }),
});

ACHIEVEMENTS.push({
  id: 'gemstone_any',
  name: 'Jeweler',
  desc: 'Stable a Gemstone-category dragon',
  icon: '💠',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.color?.specialtyCategory === 'Gemstone'),
});

ACHIEVEMENTS.push({
  id: 'metal_any',
  name: 'Metallurgist',
  desc: 'Stable a Metal-category dragon',
  icon: '⚙️',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.color?.specialtyCategory === 'Metal'),
});

ACHIEVEMENTS.push({
  id: 'ghost_any',
  name: 'Ghost Tamer',
  desc: 'Stable a Ghost-category dragon',
  icon: '👻',
  category: 'discovery',
  rarity: 'rare',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.color?.specialtyCategory === 'Ghost'),
});

ACHIEVEMENTS.push({
  id: 'pearl_any',
  name: 'Pearl Diver',
  desc: 'Stable a Pearl-category dragon',
  icon: '🐚',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.color?.specialtyCategory === 'Pearl'),
});

ACHIEVEMENTS.push({
  id: 'opal_any',
  name: 'Opal Seeker',
  desc: 'Stable an Opal-category dragon',
  icon: '🪨',
  category: 'discovery',
  rarity: 'uncommon',
  check: (ctx) => ctx.stabledDragons.some(d => d.phenotype?.color?.specialtyCategory === 'Opal'),
});

// ── State ──────────────────────────────────────────────────

// Tracks which achievements are unlocked and when
// Format: { achievementId: { unlockedAt: timestamp } }
let unlockedAchievements = {};

// Listeners for achievement unlock events
const unlockListeners = [];

export function onAchievementUnlock(cb) {
  unlockListeners.push(cb);
}

function notifyUnlock(achievement) {
  for (const cb of unlockListeners) cb(achievement);
}

// ── Public API ──────────────────────────────────────────────

export function getAchievements() {
  return ACHIEVEMENTS;
}

export function getUnlockedAchievements() {
  return { ...unlockedAchievements };
}

export function isUnlocked(achievementId) {
  return achievementId in unlockedAchievements;
}

export function getUnlockedCount() {
  return Object.keys(unlockedAchievements).length;
}

export function getTotalCount() {
  return ACHIEVEMENTS.length;
}

// Restore unlocked state from save data
export function restoreAchievements(savedUnlocked) {
  unlockedAchievements = { ...savedUnlocked };
}

// Get serializable state for saving
export function getAchievementSaveData() {
  return { ...unlockedAchievements };
}

// ── Context Builder ──────────────────────────────────────────

function buildContext(registry) {
  const stats = getStats();
  const stabledDragons = getStabledDragons();
  const completedQuests = getCompletedQuests();

  // Compute discovered sets from stabled dragons
  const discoveredColors = new Set();
  const discoveredFinishes = new Set();
  const discoveredElements = new Set();
  const discoveredSpecialties = new Set();
  let maxGeneration = 0;

  for (const dragon of stabledDragons) {
    const p = dragon.phenotype;
    if (!p) continue;

    // Color name from 64-entry table
    if (p.color?.displayName) discoveredColors.add(p.color.displayName);
    // Finish name from 64-entry table
    if (p.finish?.displayName) discoveredFinishes.add(p.finish.displayName);
    // Element name from 64-entry table
    if (p.breathElement?.displayName) discoveredElements.add(p.breathElement.displayName);
    // Specialty combo name
    if (p.color?.specialtyName) discoveredSpecialties.add(p.color.specialtyName);

    if (dragon.generation > maxGeneration) maxGeneration = dragon.generation;
  }

  // Also check all registry dragons for max generation (for breeding achievements)
  if (registry) {
    for (const dragon of registry.getAll()) {
      if (dragon.generation > maxGeneration) maxGeneration = dragon.generation;
    }
  }

  return {
    stats,
    stabledDragons,
    completedQuests,
    registry,
    discoveredColors,
    discoveredFinishes,
    discoveredElements,
    discoveredSpecialties,
    maxGeneration,
  };
}

// ── Check & Unlock ──────────────────────────────────────────

// Check all achievements and unlock any newly met ones.
// Returns array of newly unlocked achievements.
export function checkAchievements(registry) {
  const ctx = buildContext(registry);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (isUnlocked(achievement.id)) continue;

    try {
      if (achievement.check(ctx)) {
        unlockedAchievements[achievement.id] = {
          unlockedAt: Date.now(),
        };
        newlyUnlocked.push(achievement);
        notifyUnlock(achievement);
      }
    } catch (e) {
      // Silently skip achievements that error during check
      console.warn(`Achievement check failed for ${achievement.id}:`, e);
    }
  }

  return newlyUnlocked;
}

// Get progress for a specific achievement (for UI display)
export function getAchievementProgress(achievementId, registry) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement || !achievement.progress) return null;

  const ctx = buildContext(registry);
  try {
    return achievement.progress(ctx);
  } catch {
    return null;
  }
}

// ── Helper Functions ──────────────────────────────────────────

function countThemeColors(ctx, themeColors) {
  let count = 0;
  const themeSet = new Set(themeColors);
  for (const color of ctx.discoveredColors) {
    if (themeSet.has(color)) count++;
  }
  return count;
}

// ── Color Theme Exports (for UI) ──────────────────────────────

export function getColorThemes() {
  return COLOR_THEMES;
}
