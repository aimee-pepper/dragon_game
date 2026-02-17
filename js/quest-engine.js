// Quest engine — generates quests, checks dragon eligibility, manages state
import {
  COLOR_NAMES,
  FINISH_NAMES,
  FINISH_SPECIAL_NAMES,
  ELEMENT_NAMES,
  SPECIALTY_COMBOS,
  ELEMENT_MODIFIERS,
} from './gene-config.js';

// ── Quest trait pools ───────────────────────────────────────
// Derived from the full 64-entry lookup tables + specialty combos

// All 64 color names from COLOR_NAMES
const ALL_COLORS = Object.values(COLOR_NAMES);

// All 64 finish names from FINISH_NAMES
const ALL_FINISHES = Object.values(FINISH_NAMES);

// All 64 element names from ELEMENT_NAMES
const ALL_ELEMENTS = Object.values(ELEMENT_NAMES);

// Specialty combo names (from SPECIALTY_COMBOS)
const ALL_SPECIALTY_NAMES = Object.values(SPECIALTY_COMBOS).map(c => c.name);

// Element modifier prefixes (from ELEMENT_MODIFIERS)
const ALL_MODIFIER_PREFIXES = [...new Set(Object.values(ELEMENT_MODIFIERS))];

// Build reverse lookup: color name → tier key string for hints
const COLOR_KEY_BY_NAME = {};
for (const [key, name] of Object.entries(COLOR_NAMES)) {
  COLOR_KEY_BY_NAME[name] = key;
}

// Build reverse lookup: finish name → tier key string for hints
const FINISH_KEY_BY_NAME = {};
for (const [key, name] of Object.entries(FINISH_NAMES)) {
  FINISH_KEY_BY_NAME[name] = key;
}

// Build reverse lookup: element name → tier key string for hints
const ELEMENT_KEY_BY_NAME = {};
for (const [key, name] of Object.entries(ELEMENT_NAMES)) {
  ELEMENT_KEY_BY_NAME[name] = key;
}

// Build reverse lookup: specialty name → { colorName, finishName, colorKey, finishKey }
const SPECIALTY_RECIPES = {};
for (const [key, combo] of Object.entries(SPECIALTY_COMBOS)) {
  const [colorKey, finishKey] = key.split('|');
  SPECIALTY_RECIPES[combo.name] = {
    colorName: COLOR_NAMES[colorKey] || '???',
    finishName: FINISH_NAMES[finishKey] || '???',
    colorKey,
    finishKey,
  };
}

// Tier labels for generating hints from keys
const TIER_LABELS = ['None', 'Low', 'Mid', 'High'];
const HL_LABELS = { 'H': 'High', 'L': 'Low' };

function tierKeyToHint(key, axes) {
  const tiers = key.split('-').map(Number);
  return tiers.map((t, i) => `${axes[i]}: ${TIER_LABELS[t]}`).join(' · ');
}

// Convert H/L key to hint (for element keys in ELEMENT_MODIFIERS)
function hlKeyToHint(key, axes) {
  const parts = key.split('-');
  return parts.map((p, i) => `${axes[i]}: ${HL_LABELS[p] || p}`).join(' · ');
}

// Convert H/L key to numeric key for ELEMENT_NAMES lookup (H→3, L→0)
function hlKeyToNumeric(hlKey) {
  return hlKey.split('-').map(p => p === 'H' ? '3' : '0').join('-');
}

// Build reverse lookup: modifier name → { finishName, elementName, finishKey, elementHLKey }
// A modifier can come from multiple combos — just pick the first one for the hint
const MODIFIER_RECIPES = {};
for (const [key, modifier] of Object.entries(ELEMENT_MODIFIERS)) {
  if (MODIFIER_RECIPES[modifier]) continue; // already have a recipe for this modifier
  const [finishKey, elementHLKey] = key.split('|');
  const elementNumericKey = hlKeyToNumeric(elementHLKey);
  MODIFIER_RECIPES[modifier] = {
    finishName: FINISH_NAMES[finishKey] || '???',
    elementName: ELEMENT_NAMES[elementNumericKey] || '???',
    finishKey,
    elementHLKey,
  };
}

const SIZE_TARGETS = [
  { value: 'Bird', label: 'Bird-sized' },
  { value: 'Dog', label: 'Dog-sized' },
  { value: 'Cow', label: 'Cow-sized' },
  { value: 'Standard', label: 'Standard-sized' },
  { value: 'Large', label: 'Large' },
  { value: 'Mega', label: 'Mega' },
];

const WING_TARGETS = [
  { value: 'None', label: 'wingless' },
  { value: 'Vestigial', label: 'vestigial-winged' },
  { value: 'Pair', label: 'winged' },
  { value: 'Quad', label: 'quad-winged' },
  { value: 'Six', label: 'six-winged' },
];

const SCALE_TARGETS = [
  { value: 'Smooth', label: 'smooth-scaled' },
  { value: 'Textured', label: 'textured' },
  { value: 'Armored', label: 'armored' },
];

const BODY_TYPE_TARGETS = [
  { value: 'Serpentine', label: 'Serpentine' },
  { value: 'Normal', label: 'Normal-bodied' },
  { value: 'Bulky', label: 'Bulky' },
];

const LIMB_TARGETS = [
  { value: 'Limbless (0)', label: 'limbless' },
  { value: 'Wyvern (2)', label: 'wyvern-limbed' },
  { value: 'Quadruped (4)', label: 'quadruped' },
  { value: 'Hexapod (6)', label: 'hexapod' },
];

const HORN_TARGETS = [
  { value: 'None', label: 'hornless' },
  { value: 'Sleek', label: 'sleek-horned' },
  { value: 'Gnarled', label: 'gnarled-horned' },
  { value: 'Knobbed', label: 'knobbed-horned' },
];

const SPINE_TARGETS = [
  { value: 'None', label: 'spineless' },
  { value: 'Ridge', label: 'ridged' },
  { value: 'Spikes', label: 'spiked' },
  { value: 'Sail', label: 'sail-backed' },
];

// ── Flavor text pools ───────────────────────────────────────

const PATRONS = [
  'A wealthy noble', 'The court alchemist', 'A traveling merchant',
  'The kingdom\'s general', 'A mysterious scholar', 'The royal family',
  'A dragon enthusiast', 'The guild master', 'A curious sage',
  'An eccentric collector', 'The temple priests', 'A foreign ambassador',
  'A renowned jeweler', 'The harbor master', 'A battle-scarred knight',
  'The queen\'s handmaiden', 'A wandering bard', 'The arch-mage',
];

// ── Quest generation ────────────────────────────────────────

let nextQuestId = 1;
const quests = [];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Requirement makers ──────────────────────────────────────

function makeColorReq() {
  const color = pick(ALL_COLORS);
  const key = COLOR_KEY_BY_NAME[color];
  const hint = key ? tierKeyToHint(key, ['C', 'M', 'Y']) : null;
  return {
    path: 'color.displayName',
    match: 'exact',
    value: color,
    label: `${color} coloring`,
    hint,
    hintType: 'color',
  };
}

function makeElementReq() {
  const elem = pick(ALL_ELEMENTS);
  const key = ELEMENT_KEY_BY_NAME[elem];
  const hint = key ? tierKeyToHint(key, ['F', 'I', 'L']) : null;
  return {
    path: 'breathElement.displayName',
    match: 'exact',
    value: elem,
    label: `${elem} breath`,
    hint,
    hintType: 'element',
  };
}

// Named finishes (iconic single-word names) are more interesting quest targets
const NAMED_FINISHES = ALL_FINISHES.filter(f => FINISH_SPECIAL_NAMES.has(f));

function makeFinishReq() {
  // 80% chance to pick a named finish, 20% any finish
  const finish = (Math.random() < 0.8 && NAMED_FINISHES.length > 0)
    ? pick(NAMED_FINISHES)
    : pick(ALL_FINISHES);
  const key = FINISH_KEY_BY_NAME[finish];
  const hint = key ? tierKeyToHint(key, ['O', 'Sh', 'Sc']) : null;
  return {
    path: 'finish.displayName',
    match: 'exact',
    value: finish,
    label: `${finish} finish`,
    hint,
    hintType: 'finish',
  };
}

function makeSpecialtyReq() {
  const name = pick(ALL_SPECIALTY_NAMES);
  const recipe = SPECIALTY_RECIPES[name];
  // Build compound hint: "ColorName + FinishName" with axis breakdowns
  let hint = null;
  let hintColor = null;
  let hintFinish = null;
  if (recipe) {
    hint = `${recipe.colorName} + ${recipe.finishName}`;
    hintColor = tierKeyToHint(recipe.colorKey, ['C', 'M', 'Y']);
    hintFinish = tierKeyToHint(recipe.finishKey, ['O', 'Sh', 'Sc']);
  }
  return {
    path: 'color.specialtyName',
    match: 'exact',
    value: name,
    label: `"${name}" specialty`,
    hint,
    hintColor,
    hintFinish,
    hintType: 'specialty',
  };
}

function makeModifierReq() {
  const modifier = pick(ALL_MODIFIER_PREFIXES);
  const recipe = MODIFIER_RECIPES[modifier];
  // Build compound hint: "FinishName + ElementName (O: X · Sh: X · Sc: X | F: X · I: X · L: X)"
  let hint = null;
  let hintFinish = null;
  let hintElement = null;
  if (recipe) {
    hint = `${recipe.finishName} + ${recipe.elementName}`;
    hintFinish = tierKeyToHint(recipe.finishKey, ['O', 'Sh', 'Sc']);
    hintElement = hlKeyToHint(recipe.elementHLKey, ['F', 'I', 'L']);
  }
  return {
    path: 'color.modifierPrefix',
    match: 'exact',
    value: modifier,
    label: `${modifier} modifier`,
    hint,
    hintFinish,
    hintElement,
    hintType: 'modifier',
  };
}

function makeSizeReq() {
  const size = pick(SIZE_TARGETS);
  return {
    path: 'traits.body_size.name',
    match: 'exact',
    value: size.value,
    label: `${size.label} body`,
  };
}

function makeWingReq() {
  const wing = pick(WING_TARGETS);
  return {
    path: 'traits.frame_wings.name',
    match: 'exact',
    value: wing.value,
    label: wing.label,
  };
}

function makeScaleReq() {
  const scale = pick(SCALE_TARGETS);
  return {
    path: 'traits.body_scales.name',
    match: 'exact',
    value: scale.value,
    label: scale.label,
  };
}

function makeBodyTypeReq() {
  const type = pick(BODY_TYPE_TARGETS);
  return {
    path: 'traits.body_type.name',
    match: 'exact',
    value: type.value,
    label: `${type.label} build`,
  };
}

function makeLimbReq() {
  const limb = pick(LIMB_TARGETS);
  return {
    path: 'traits.frame_limbs.name',
    match: 'exact',
    value: limb.value,
    label: limb.label,
  };
}

function makeHornReq() {
  const horn = pick(HORN_TARGETS);
  return {
    path: 'traits.horn_style.name',
    match: 'exact',
    value: horn.value,
    label: horn.label,
  };
}

function makeSpineReq() {
  const spine = pick(SPINE_TARGETS);
  return {
    path: 'traits.spine_style.name',
    match: 'exact',
    value: spine.value,
    label: spine.label,
  };
}

// All requirement generators
const REQ_MAKERS = [
  makeColorReq, makeElementReq, makeFinishReq,
  makeSizeReq, makeWingReq, makeScaleReq,
  makeBodyTypeReq, makeLimbReq, makeHornReq, makeSpineReq,
];

// Extra makers available for harder quests (specialty combos are rarer)
const ADVANCED_REQ_MAKERS = [
  ...REQ_MAKERS,
  makeSpecialtyReq, makeModifierReq,
];


// Conflict pairs: if one is picked, the other must be excluded.
// Each entry is [makerA, makerB] meaning they can't coexist.
const CONFLICT_PAIRS = [
  [makeSpecialtyReq, makeColorReq],    // specialty locks color
  [makeSpecialtyReq, makeFinishReq],   // specialty locks finish
  [makeSpecialtyReq, makeModifierReq], // both lock finish
  [makeModifierReq, makeFinishReq],    // modifier locks finish
  [makeModifierReq, makeElementReq],   // modifier locks element
];

// Pick N unique, non-conflicting requirement makers from a pool.
// Each time a maker is picked, any makers it conflicts with (in either direction)
// are removed from the remaining pool before the next pick.
function pickCompatibleMakers(pool, count) {
  let available = [...pool];
  const picked = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const maker = available.splice(idx, 1)[0];
    picked.push(maker);
    // Remove anything that conflicts with this pick (bidirectional)
    available = removeConflicts(available, maker);
  }
  return picked;
}

// Remove makers from a pool that would conflict with the given maker
function removeConflicts(pool, maker) {
  const blocked = new Set();
  for (const [a, b] of CONFLICT_PAIRS) {
    if (maker === a) blocked.add(b);
    if (maker === b) blocked.add(a);
  }
  return pool.filter(m => !blocked.has(m));
}

// Easy quest templates: 1 requirement
function generateEasyQuest() {
  const basicMakers = [makeColorReq, makeElementReq, makeFinishReq, makeSizeReq, makeWingReq, makeScaleReq];
  const req = pick(basicMakers)();
  const patron = pick(PATRONS);
  return {
    id: nextQuestId++,
    title: `Breed a dragon with ${req.label}`,
    description: `${patron} seeks a dragon with ${req.label}.`,
    requirements: [req],
    difficulty: 'easy',
    status: 'active',
    completedBy: null,
  };
}

// Medium quest templates: 2 requirements
function generateMediumQuest() {
  const makers = pickCompatibleMakers(REQ_MAKERS, 2);
  const reqs = makers.map(m => m());
  const labels = reqs.map(r => r.label);
  const patron = pick(PATRONS);

  return {
    id: nextQuestId++,
    title: `Breed a dragon with ${labels.join(' and ')}`,
    description: `${patron} requires a dragon with ${labels.join(' and ')}.`,
    requirements: reqs,
    difficulty: 'medium',
    status: 'active',
    completedBy: null,
  };
}

// Hard quest templates: 3 requirements
function generateHardQuest() {
  const makers = pickCompatibleMakers(ADVANCED_REQ_MAKERS, 3);
  const reqs = makers.map(m => m());
  const labels = reqs.map(r => r.label);
  const patron = pick(PATRONS);

  return {
    id: nextQuestId++,
    title: `Breed a dragon with ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`,
    description: `${patron} demands a remarkable dragon with ${labels.join(', ')}.`,
    requirements: reqs,
    difficulty: 'hard',
    status: 'active',
    completedBy: null,
  };
}

// Extra Hard quest templates: 4 requirements (always includes specialty or modifier)
function generateExtraHardQuest() {
  // Ensure at least one specialty or modifier requirement
  const guaranteedMaker = pick([makeSpecialtyReq, makeModifierReq]);
  const guaranteedReq = guaranteedMaker();

  // Filter the standard pool to remove makers that conflict with the guaranteed req
  const safePool = removeConflicts(REQ_MAKERS, guaranteedMaker);
  const otherMakers = pickCompatibleMakers(safePool, 3);
  const otherReqs = otherMakers.map(m => m());

  const reqs = [guaranteedReq, ...otherReqs];
  const labels = reqs.map(r => r.label);
  const patron = pick(PATRONS);

  return {
    id: nextQuestId++,
    title: `Breed a dragon with ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`,
    description: `${patron} demands a truly exceptional dragon with ${labels.join(', ')}.`,
    requirements: reqs,
    difficulty: 'extra-hard',
    status: 'active',
    completedBy: null,
  };
}

// ── Public API ──────────────────────────────────────────────

export function generateQuest(difficulty) {
  switch (difficulty) {
    case 'easy': return generateEasyQuest();
    case 'medium': return generateMediumQuest();
    case 'hard': return generateHardQuest();
    case 'extra-hard': return generateExtraHardQuest();
    default: return generateEasyQuest();
  }
}

// Resolve a dot-path like 'color.displayName' on a phenotype object
function resolvePath(obj, path) {
  const parts = path.split('.');
  let val = obj;
  for (const part of parts) {
    if (val == null) return undefined;
    val = val[part];
  }
  return val;
}

// Check if a single requirement is met
function checkRequirement(dragon, req) {
  const actual = resolvePath(dragon.phenotype, req.path);
  if (actual == null) return false;

  const actualStr = String(actual);
  if (req.match === 'includes') {
    return actualStr.toLowerCase().includes(req.value.toLowerCase());
  }
  return actualStr === req.value;
}

// Check if a dragon meets ALL quest requirements
export function checkDragonMeetsQuest(dragon, quest) {
  return quest.requirements.every(req => checkRequirement(dragon, req));
}

// Get per-requirement status for a dragon
export function getRequirementStatus(dragon, quest) {
  return quest.requirements.map(req => ({
    ...req,
    met: checkRequirement(dragon, req),
  }));
}

// Get all quests
export function getActiveQuests() {
  return quests.filter(q => q.status === 'active');
}

export function getCompletedQuests() {
  return quests.filter(q => q.status === 'completed');
}

// Submit a dragon to a quest — returns { success, message }
export function submitDragonToQuest(dragon, questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest) return { success: false, message: 'Quest not found.' };
  if (quest.status !== 'active') return { success: false, message: 'Quest already completed.' };

  if (checkDragonMeetsQuest(dragon, quest)) {
    quest.status = 'completed';
    quest.completedBy = dragon.name;
    quest.completedById = dragon.id;
    quest.completedByGeneration = dragon.generation;

    // Generate a replacement quest of the SAME difficulty
    const newQuest = generateQuest(quest.difficulty);
    quests.push(newQuest);

    const genMsg = dragon.generation > 0
      ? ` Bred in ${dragon.generation} generation${dragon.generation !== 1 ? 's' : ''}!`
      : '';
    return {
      success: true,
      message: `Quest complete! ${dragon.name} meets all requirements.${genMsg}`,
    };
  }

  // Find which requirements failed
  const status = getRequirementStatus(dragon, quest);
  const failed = status.filter(r => !r.met).map(r => r.label);
  return {
    success: false,
    message: `${dragon.name} doesn't match: ${failed.join(', ')}.`,
  };
}

// Initialize with starting quests
export function initQuestState() {
  if (quests.length > 0) return; // already initialized
  quests.push(generateQuest('easy'));
  quests.push(generateQuest('medium'));
  quests.push(generateQuest('hard'));
  quests.push(generateQuest('extra-hard'));
}
