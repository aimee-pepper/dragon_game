// Quest engine — generates quests, checks dragon eligibility, manages state

// ── Quest trait pools ───────────────────────────────────────
// Values that quests can target, organized by phenotype path

const COLOR_TARGETS = [
  'Red', 'Blue', 'Green', 'Cyan', 'Magenta', 'Yellow', 'Orange',
  'Purple', 'Teal', 'Indigo', 'Gold', 'Rose',
];

// CMY recipe hints for each color target
// Uses the same dot separator as the card UI
const COLOR_RECIPES = {
  Red:     'C: None · M: High · Y: High',
  Blue:    'C: High · M: High · Y: None',
  Green:   'C: High · M: None · Y: High',
  Cyan:    'C: High · M: None · Y: None',
  Magenta: 'C: None · M: High · Y: None',
  Yellow:  'C: None · M: None · Y: High',
  Orange:  'C: None · M: Mid+ · Y: High',
  Purple:  'C: Mid+ · M: High · Y: None',
  Teal:    'C: High · M: None · Y: Mid+',
  Indigo:  'C: High · M: High · Y: Low',
  Gold:    'C: None · M: Low · Y: High',
  Rose:    'C: None · M: High · Y: Mid+',
};

const ELEMENT_TARGETS = [
  'Fire', 'Ice', 'Lightning', 'Steam', 'Solar', 'Aurora', 'Plasma',
];

// Breath element recipe hints (Fire / Ice / Lightning axes)
const ELEMENT_RECIPES = {
  Fire:      'F: High · I: None · L: None',
  Ice:       'F: None · I: High · L: None',
  Lightning: 'F: None · I: None · L: High',
  Steam:     'F: High · I: High · L: None',
  Solar:     'F: High · I: None · L: High',
  Aurora:    'F: None · I: High · L: High',
  Plasma:    'F: High · I: High · L: High',
};

const SIZE_TARGETS = [
  { value: 'Bird', label: 'Bird-sized' },
  { value: 'Dog', label: 'Dog-sized' },
  { value: 'Cow', label: 'Cow-sized' },
  { value: 'Large', label: 'Large' },
  { value: 'Mega', label: 'Mega' },
];

const FINISH_TARGETS = [
  'Mirror', 'Polished', 'Matte', 'Satin', 'Lustrous', 'Prismatic', 'Iridescent',
];

// Finish recipe hints (Opacity / Shine / Schiller axes)
const FINISH_RECIPES = {
  Mirror:     'Shine: High',
  Polished:   'Shine: Mid–High',
  Matte:      'Shine: None',
  Satin:      'Shine: Low',
  Lustrous:   'Shine: Mid',
  Prismatic:  'Schiller: High',
  Iridescent: 'Schiller: Mid',
};

const WING_TARGETS = [
  { value: 'None', label: 'wingless' },
  { value: 'Pair', label: 'winged' },
  { value: 'Quad', label: 'quad-winged' },
  { value: 'Six', label: 'six-winged' },
];

const SCALE_TARGETS = [
  { value: 'Smooth', label: 'smooth-scaled' },
  { value: 'Textured', label: 'textured' },
  { value: 'Armored', label: 'armored' },
];

// ── Flavor text pools ───────────────────────────────────────

const PATRONS = [
  'A wealthy noble', 'The court alchemist', 'A traveling merchant',
  'The kingdom\'s general', 'A mysterious scholar', 'The royal family',
  'A dragon enthusiast', 'The guild master', 'A curious sage',
  'An eccentric collector', 'The temple priests', 'A foreign ambassador',
];

// ── Quest generation ────────────────────────────────────────

let nextQuestId = 1;
const quests = [];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeColorReq() {
  const color = pick(COLOR_TARGETS);
  const recipe = COLOR_RECIPES[color];
  return {
    path: 'color.displayName',
    match: 'includes',
    value: color,
    label: `${color} coloring`,
    hint: recipe || null,
    hintType: 'color',
  };
}

function makeElementReq() {
  const elem = pick(ELEMENT_TARGETS);
  const recipe = ELEMENT_RECIPES[elem];
  return {
    path: 'breathElement.name',
    match: 'exact',
    value: elem,
    label: `${elem} breath`,
    hint: recipe || null,
    hintType: 'element',
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

function makeFinishReq() {
  const finish = pick(FINISH_TARGETS);
  const recipe = FINISH_RECIPES[finish];
  return {
    path: 'finish.displayName',
    match: 'includes',
    value: finish,
    label: `${finish} finish`,
    hint: recipe || null,
    hintType: 'finish',
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

// Requirement generators by category
const REQ_MAKERS = [makeColorReq, makeElementReq, makeSizeReq, makeFinishReq, makeWingReq, makeScaleReq];

// Easy quest templates: 1 requirement
function generateEasyQuest() {
  const req = pick([makeColorReq, makeElementReq, makeSizeReq])();
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
  // Pick 2 different requirement categories
  const makers = [...REQ_MAKERS];
  const idx1 = Math.floor(Math.random() * makers.length);
  const maker1 = makers.splice(idx1, 1)[0];
  const idx2 = Math.floor(Math.random() * makers.length);
  const maker2 = makers[idx2];

  const req1 = maker1();
  const req2 = maker2();
  const patron = pick(PATRONS);

  return {
    id: nextQuestId++,
    title: `Breed a dragon with ${req1.label} and ${req2.label}`,
    description: `${patron} requires a dragon with ${req1.label} and ${req2.label}.`,
    requirements: [req1, req2],
    difficulty: 'medium',
    status: 'active',
    completedBy: null,
  };
}

// Hard quest templates: 3 requirements
function generateHardQuest() {
  const makers = [...REQ_MAKERS];
  const picked = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * makers.length);
    picked.push(makers.splice(idx, 1)[0]);
  }

  const reqs = picked.map(m => m());
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

// ── Public API ──────────────────────────────────────────────

export function generateQuest(difficulty) {
  switch (difficulty) {
    case 'easy': return generateEasyQuest();
    case 'medium': return generateMediumQuest();
    case 'hard': return generateHardQuest();
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

    // Generate a replacement quest with random difficulty
    const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
    const newQuest = generateQuest(pick(difficulties));
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
}
