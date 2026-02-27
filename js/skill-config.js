// ============================================================
// Skill config — data-only tables for the entire skill tree
// ============================================================
// Three branches: Geneticist, Breeder, Handler
// Each skill has: branch, line, tier, name, desc, effect, requires
// No logic here — just data. Import where needed.
//
// Source of truth: GAMEPLAY_AND_IMPLEMENTATION.md §Skill Tree

// ── Branch metadata ────────────────────────────────────────

export const BRANCH_DEFS = {
  geneticist: { name: 'Geneticist', icon: '🧬', desc: 'Information & Reveals' },
  breeder:    { name: 'Breeder',    icon: '🥚', desc: 'Manipulation' },
  handler:    { name: 'Handler',    icon: '🛡️', desc: 'Economy, Meta & Tomes' },
};

// ── Skill line metadata ────────────────────────────────────

export const LINE_DEFS = {
  // Geneticist
  'reveal':              { branch: 'geneticist', name: 'Reveal',              desc: 'Reveal alleles on hatched dragons' },
  'egg-inspection':      { branch: 'geneticist', name: 'Egg Inspection',      desc: 'Reveal alleles on unhatched eggs' },
  'carrier':             { branch: 'geneticist', name: 'Carrier Detection',   desc: 'Detect hidden recessive alleles' },
  'inherited-knowledge': { branch: 'geneticist', name: 'Inherited Knowledge', desc: 'Auto-reveal from known parent traits' },
  'pedigree-mastery':    { branch: 'geneticist', name: 'Pedigree Mastery',    desc: 'Auto-reveal alleles from fully-read parents' },

  // Breeder
  'clutch-management':   { branch: 'breeder', name: 'Clutch Management',   desc: 'Clutch size and hatch capacity' },
  'selective-pressure':  { branch: 'breeder', name: 'Selective Pressure',  desc: 'Bias traits toward quest alleles' },
  'trait-lock':          { branch: 'breeder', name: 'Trait Lock',          desc: 'Choose which allele passes' },
  'selective-mutation':  { branch: 'breeder', name: 'Selective Mutation',  desc: 'Quest alleles via mutation' },
  'targeted-mutation':   { branch: 'breeder', name: 'Targeted Mutation',   desc: 'Force specific allele as mutation' },

  // Handler
  'economy':     { branch: 'handler', name: 'Economy',          desc: 'Quest reward bonuses' },
  'egg-sales':   { branch: 'handler', name: 'Egg Sales',        desc: 'Egg sale price bonuses', repGate: 50 },
  'quest':       { branch: 'handler', name: 'Quest Management', desc: 'Reroll and modify quests' },
  'tome-sub':    { branch: 'handler', name: 'Tome Skills',      desc: 'Per-gene pressure/lock from tomes' },
};

// ── All skill definitions ──────────────────────────────────
// Key = skill ID (kebab-case, globally unique)
// requires: { skill?: string, tome?: string }

export const SKILL_DEFS = {

  // ────────────────────────────────────────────────────────
  // GENETICIST BRANCH
  // ────────────────────────────────────────────────────────

  // — Reveal Line —
  'allele-peek-1': {
    branch: 'geneticist', line: 'reveal', tier: 1,
    name: 'Allele Peek I',
    desc: 'Reveal one allele on 1 trait',
    effect: { type: 'reveal', mode: 'partial', traitCount: 1 },
    requires: null,
  },
  'allele-peek-2': {
    branch: 'geneticist', line: 'reveal', tier: 2,
    name: 'Allele Peek II',
    desc: 'One allele on up to 3 traits',
    effect: { type: 'reveal', mode: 'partial', traitCount: 3 },
    requires: { skill: 'allele-peek-1' },
  },
  'allele-peek-3': {
    branch: 'geneticist', line: 'reveal', tier: 3,
    name: 'Allele Peek III',
    desc: 'One allele on up to 6 traits',
    effect: { type: 'reveal', mode: 'partial', traitCount: 6 },
    requires: { skill: 'allele-peek-2' },
  },
  'trait-read-1': {
    branch: 'geneticist', line: 'reveal', tier: 4,
    name: 'Trait Read I',
    desc: 'BOTH alleles on 1 trait',
    effect: { type: 'reveal', mode: 'full', traitCount: 1 },
    requires: { skill: 'allele-peek-3' },
  },
  'trait-read-2': {
    branch: 'geneticist', line: 'reveal', tier: 5,
    name: 'Trait Read II',
    desc: 'Both alleles on up to 3 traits',
    effect: { type: 'reveal', mode: 'full', traitCount: 3 },
    requires: { skill: 'trait-read-1' },
  },
  'trait-read-3': {
    branch: 'geneticist', line: 'reveal', tier: 6,
    name: 'Trait Read III',
    desc: 'Both alleles on up to 6 traits',
    effect: { type: 'reveal', mode: 'full', traitCount: 6 },
    requires: { skill: 'trait-read-2' },
  },
  'genome-scan-1': {
    branch: 'geneticist', line: 'reveal', tier: 7,
    name: 'Genome Scan I',
    desc: 'Both alleles on up to 10 traits',
    effect: { type: 'reveal', mode: 'full', traitCount: 10 },
    requires: { skill: 'trait-read-3' },
  },
  'genome-scan-2': {
    branch: 'geneticist', line: 'reveal', tier: 8,
    name: 'Genome Scan II',
    desc: 'Both alleles on up to 15 traits',
    effect: { type: 'reveal', mode: 'full', traitCount: 15 },
    requires: { skill: 'genome-scan-1' },
  },
  'genome-scan-3': {
    branch: 'geneticist', line: 'reveal', tier: 9,
    name: 'Genome Scan III',
    desc: 'Both alleles on up to 20 traits',
    effect: { type: 'reveal', mode: 'full', traitCount: 20 },
    requires: { skill: 'genome-scan-2' },
  },
  'full-genotype-read': {
    branch: 'geneticist', line: 'reveal', tier: 10,
    name: 'Full Genotype Read',
    desc: 'Entire genotype revealed',
    effect: { type: 'reveal', mode: 'full', traitCount: Infinity },
    requires: { skill: 'genome-scan-3' },
  },

  // — Egg Inspection Line —
  'egg-candling-1': {
    branch: 'geneticist', line: 'egg-inspection', tier: 4,
    name: 'Egg Candling I',
    desc: 'Reveal one allele on 1 trait in unhatched egg',
    effect: { type: 'egg-reveal', mode: 'partial', traitCount: 1 },
    requires: { skill: 'allele-peek-3' },
  },
  'egg-candling-2': {
    branch: 'geneticist', line: 'egg-inspection', tier: 5,
    name: 'Egg Candling II',
    desc: 'One allele on up to 3 traits in unhatched egg',
    effect: { type: 'egg-reveal', mode: 'partial', traitCount: 3 },
    requires: { skill: 'egg-candling-1' },
  },
  'egg-candling-3': {
    branch: 'geneticist', line: 'egg-inspection', tier: 6,
    name: 'Egg Candling III',
    desc: 'One allele on up to 6 traits in unhatched egg',
    effect: { type: 'egg-reveal', mode: 'partial', traitCount: 6 },
    requires: { skill: 'egg-candling-2' },
  },
  'egg-scrying-1': {
    branch: 'geneticist', line: 'egg-inspection', tier: 7,
    name: 'Egg Scrying I',
    desc: 'BOTH alleles on 1 trait in unhatched egg',
    effect: { type: 'egg-reveal', mode: 'full', traitCount: 1 },
    requires: { skill: 'egg-candling-3' },
  },
  'egg-scrying-2': {
    branch: 'geneticist', line: 'egg-inspection', tier: 8,
    name: 'Egg Scrying II',
    desc: 'Both alleles on up to 3 traits in unhatched egg',
    effect: { type: 'egg-reveal', mode: 'full', traitCount: 3 },
    requires: { skill: 'egg-scrying-1' },
  },
  'egg-scrying-3': {
    branch: 'geneticist', line: 'egg-inspection', tier: 9,
    name: 'Egg Scrying III',
    desc: 'Both alleles on up to 6 traits in unhatched egg',
    effect: { type: 'egg-reveal', mode: 'full', traitCount: 6 },
    requires: { skill: 'egg-scrying-2' },
  },
  'true-sight': {
    branch: 'geneticist', line: 'egg-inspection', tier: 10,
    name: 'True Sight',
    desc: 'Full genotype of unhatched egg',
    effect: { type: 'egg-reveal', mode: 'full', traitCount: Infinity },
    requires: { skill: 'egg-scrying-3' },
  },

  // — Carrier Detection Line —
  'recessive-sense': {
    branch: 'geneticist', line: 'carrier', tier: 2,
    name: 'Recessive Sense',
    desc: 'Yes/no flag: does dragon carry ANY hidden recessives?',
    effect: { type: 'carrier', mode: 'any' },
    requires: { skill: 'allele-peek-1' },
  },
  'carrier-sense': {
    branch: 'geneticist', line: 'carrier', tier: 3,
    name: 'Carrier Sense',
    desc: 'Per-trait carrier/not-carrier indicator',
    effect: { type: 'carrier', mode: 'per-trait' },
    requires: { skill: 'recessive-sense' },
  },

  // — Inherited Knowledge Line —
  'inherited-knowledge-1': {
    branch: 'geneticist', line: 'inherited-knowledge', tier: 1,
    name: 'Inherited Knowledge I',
    desc: '25% of known parent traits auto-revealed',
    effect: { type: 'auto-reveal', percent: 0.25 },
    requires: null,
  },
  'inherited-knowledge-2': {
    branch: 'geneticist', line: 'inherited-knowledge', tier: 3,
    name: 'Inherited Knowledge II',
    desc: '50% of known parent traits auto-revealed',
    effect: { type: 'auto-reveal', percent: 0.50 },
    requires: { skill: 'inherited-knowledge-1' },
  },
  'inherited-knowledge-3': {
    branch: 'geneticist', line: 'inherited-knowledge', tier: 5,
    name: 'Inherited Knowledge III',
    desc: '75% of known parent traits auto-revealed',
    effect: { type: 'auto-reveal', percent: 0.75 },
    requires: { skill: 'inherited-knowledge-2' },
  },
  'inherited-knowledge-4': {
    branch: 'geneticist', line: 'inherited-knowledge', tier: 7,
    name: 'Inherited Knowledge IV',
    desc: '100% of known parent traits auto-revealed',
    effect: { type: 'auto-reveal', percent: 1.0 },
    requires: { skill: 'inherited-knowledge-3' },
  },

  // — Pedigree Mastery Line — (requires Inherited Knowledge III)
  'pedigree-mastery-1': {
    branch: 'geneticist', line: 'pedigree-mastery', tier: 6,
    name: 'Pedigree Mastery I',
    desc: '25% of fully-read parent traits → full allele data on offspring',
    effect: { type: 'auto-reveal-alleles', percent: 0.25 },
    requires: { skill: 'inherited-knowledge-3' },
  },
  'pedigree-mastery-2': {
    branch: 'geneticist', line: 'pedigree-mastery', tier: 7,
    name: 'Pedigree Mastery II',
    desc: '50% of fully-read parent traits → full allele data on offspring',
    effect: { type: 'auto-reveal-alleles', percent: 0.50 },
    requires: { skill: 'pedigree-mastery-1' },
  },
  'pedigree-mastery-3': {
    branch: 'geneticist', line: 'pedigree-mastery', tier: 8,
    name: 'Pedigree Mastery III',
    desc: '75% of fully-read parent traits → full allele data on offspring',
    effect: { type: 'auto-reveal-alleles', percent: 0.75 },
    requires: { skill: 'pedigree-mastery-2' },
  },
  'pedigree-mastery-4': {
    branch: 'geneticist', line: 'pedigree-mastery', tier: 9,
    name: 'Pedigree Mastery IV',
    desc: '100% of fully-read parent traits → full allele data on offspring',
    effect: { type: 'auto-reveal-alleles', percent: 1.0 },
    requires: { skill: 'pedigree-mastery-3' },
  },

  // ────────────────────────────────────────────────────────
  // BREEDER BRANCH
  // ────────────────────────────────────────────────────────

  // — Clutch Management (Shared) —
  'clutch-size-1': {
    branch: 'breeder', line: 'clutch-management', tier: 1,
    name: 'Clutch Size I',
    desc: '+1 egg (4→5)',
    effect: { type: 'clutch-size', bonus: 1 },
    requires: null,
  },
  'hatch-capacity-1': {
    branch: 'breeder', line: 'clutch-management', tier: 1,
    name: 'Hatch Capacity I',
    desc: '+1 instant hatch (2→3)',
    effect: { type: 'hatch-capacity', bonus: 1 },
    requires: null,
  },
  'clutch-size-2': {
    branch: 'breeder', line: 'clutch-management', tier: 2,
    name: 'Clutch Size II',
    desc: '+1 egg (5→6)',
    effect: { type: 'clutch-size', bonus: 1 },
    requires: { skill: 'clutch-size-1' },
  },
  'hatch-capacity-2': {
    branch: 'breeder', line: 'clutch-management', tier: 3,
    name: 'Hatch Capacity II',
    desc: '+1 instant hatch (3→4)',
    effect: { type: 'hatch-capacity', bonus: 1 },
    requires: { skill: 'hatch-capacity-1' },
  },
  'clutch-size-3': {
    branch: 'breeder', line: 'clutch-management', tier: 4,
    name: 'Clutch Size III',
    desc: '+1 egg (6→7)',
    effect: { type: 'clutch-size', bonus: 1 },
    requires: { skill: 'clutch-size-2' },
  },
  'hatch-capacity-3': {
    branch: 'breeder', line: 'clutch-management', tier: 5,
    name: 'Hatch Capacity III',
    desc: '+1 instant hatch (4→5)',
    effect: { type: 'hatch-capacity', bonus: 1 },
    requires: { skill: 'hatch-capacity-2' },
  },
  'clutch-size-4': {
    branch: 'breeder', line: 'clutch-management', tier: 6,
    name: 'Clutch Size IV',
    desc: '+1 egg (7→8)',
    effect: { type: 'clutch-size', bonus: 1 },
    requires: { skill: 'clutch-size-3' },
  },
  'hatch-capacity-4': {
    branch: 'breeder', line: 'clutch-management', tier: 7,
    name: 'Hatch Capacity IV',
    desc: '+1 instant hatch (5→6)',
    effect: { type: 'hatch-capacity', bonus: 1 },
    requires: { skill: 'hatch-capacity-3' },
  },
  'clutch-size-5': {
    branch: 'breeder', line: 'clutch-management', tier: 8,
    name: 'Clutch Size V',
    desc: '+1 egg (8→9)',
    effect: { type: 'clutch-size', bonus: 1 },
    requires: { skill: 'clutch-size-4' },
  },
  'hatch-capacity-5': {
    branch: 'breeder', line: 'clutch-management', tier: 9,
    name: 'Hatch Capacity V',
    desc: '+1 instant hatch (6→7)',
    effect: { type: 'hatch-capacity', bonus: 1 },
    requires: { skill: 'hatch-capacity-4' },
  },

  // — Selective Pressure Path —
  'selective-pressure-1': {
    branch: 'breeder', line: 'selective-pressure', tier: 1,
    name: 'Selective Pressure I',
    desc: '5% chance, 1 random trait toward quest alleles',
    effect: { type: 'selective-pressure', chance: 0.05, traits: 1 },
    requires: null,
  },
  'selective-pressure-2': {
    branch: 'breeder', line: 'selective-pressure', tier: 2,
    name: 'Selective Pressure II',
    desc: '10% chance, 1 trait',
    effect: { type: 'selective-pressure', chance: 0.10, traits: 1 },
    requires: { skill: 'selective-pressure-1' },
  },
  'selective-pressure-3': {
    branch: 'breeder', line: 'selective-pressure', tier: 3,
    name: 'Selective Pressure III',
    desc: '10% chance, up to 2 traits',
    effect: { type: 'selective-pressure', chance: 0.10, traits: 2 },
    requires: { skill: 'selective-pressure-2' },
  },
  'selective-pressure-4': {
    branch: 'breeder', line: 'selective-pressure', tier: 4,
    name: 'Selective Pressure IV',
    desc: '15% chance, up to 2 traits',
    effect: { type: 'selective-pressure', chance: 0.15, traits: 2 },
    requires: { skill: 'selective-pressure-3' },
  },
  'selective-pressure-5': {
    branch: 'breeder', line: 'selective-pressure', tier: 5,
    name: 'Selective Pressure V',
    desc: '15% chance, up to 3 traits',
    effect: { type: 'selective-pressure', chance: 0.15, traits: 3 },
    requires: { skill: 'selective-pressure-4' },
  },
  'selective-pressure-6': {
    branch: 'breeder', line: 'selective-pressure', tier: 6,
    name: 'Selective Pressure VI',
    desc: '20% chance, up to 3 traits',
    effect: { type: 'selective-pressure', chance: 0.20, traits: 3 },
    requires: { skill: 'selective-pressure-5' },
  },
  'selective-pressure-7': {
    branch: 'breeder', line: 'selective-pressure', tier: 7,
    name: 'Selective Pressure VII',
    desc: '20% chance, up to 4 traits',
    effect: { type: 'selective-pressure', chance: 0.20, traits: 4 },
    requires: { skill: 'selective-pressure-6' },
  },
  'selective-pressure-8': {
    branch: 'breeder', line: 'selective-pressure', tier: 8,
    name: 'Selective Pressure VIII',
    desc: '25% chance, up to 5 traits',
    effect: { type: 'selective-pressure', chance: 0.25, traits: 5 },
    requires: { skill: 'selective-pressure-7' },
  },

  // — Selective Mutation Extension (requires Catalyst Grimoire) —
  'selective-mutation-1': {
    branch: 'breeder', line: 'selective-mutation', tier: 5,
    name: 'Selective Mutation I',
    desc: '10% chance quest allele appears as mutation, 1 trait',
    effect: { type: 'selective-mutation', chance: 0.10, traits: 1 },
    requires: { skill: 'selective-pressure-5', tome: 'catalyst-grimoire' },
  },
  'selective-mutation-2': {
    branch: 'breeder', line: 'selective-mutation', tier: 6,
    name: 'Selective Mutation II',
    desc: '25% chance, up to 2 traits',
    effect: { type: 'selective-mutation', chance: 0.25, traits: 2 },
    requires: { skill: 'selective-mutation-1' },
  },
  'selective-mutation-3': {
    branch: 'breeder', line: 'selective-mutation', tier: 7,
    name: 'Selective Mutation III',
    desc: '50% chance, up to 3 traits',
    effect: { type: 'selective-mutation', chance: 0.50, traits: 3 },
    requires: { skill: 'selective-mutation-2' },
  },
  'selective-mutation-4': {
    branch: 'breeder', line: 'selective-mutation', tier: 8,
    name: 'Selective Mutation IV',
    desc: '75% chance, up to 4 traits',
    effect: { type: 'selective-mutation', chance: 0.75, traits: 4 },
    requires: { skill: 'selective-mutation-3' },
  },
  'selective-mutation-5': {
    branch: 'breeder', line: 'selective-mutation', tier: 9,
    name: 'Selective Mutation V',
    desc: '100% chance, up to 4 traits',
    effect: { type: 'selective-mutation', chance: 1.00, traits: 4 },
    requires: { skill: 'selective-mutation-4' },
  },

  // — Trait Lock Path —
  'trait-lock-1': {
    branch: 'breeder', line: 'trait-lock', tier: 1,
    name: 'Trait Lock I',
    desc: 'Lock 1 trait: choose which allele passes',
    effect: { type: 'trait-lock', traits: 1 },
    requires: null,
  },
  'trait-lock-2': {
    branch: 'breeder', line: 'trait-lock', tier: 2,
    name: 'Trait Lock II',
    desc: 'Lock 2 traits (across both parents)',
    effect: { type: 'trait-lock', traits: 2 },
    requires: { skill: 'trait-lock-1' },
  },
  'trait-lock-3': {
    branch: 'breeder', line: 'trait-lock', tier: 3,
    name: 'Trait Lock III',
    desc: 'Lock 3 traits',
    effect: { type: 'trait-lock', traits: 3 },
    requires: { skill: 'trait-lock-2' },
  },
  'trait-lock-4': {
    branch: 'breeder', line: 'trait-lock', tier: 4,
    name: 'Trait Lock IV',
    desc: 'Lock 4 traits',
    effect: { type: 'trait-lock', traits: 4 },
    requires: { skill: 'trait-lock-3' },
  },
  'trait-lock-5': {
    branch: 'breeder', line: 'trait-lock', tier: 5,
    name: 'Trait Lock V',
    desc: 'Lock 5 traits',
    effect: { type: 'trait-lock', traits: 5 },
    requires: { skill: 'trait-lock-4' },
  },
  'trait-lock-6': {
    branch: 'breeder', line: 'trait-lock', tier: 6,
    name: 'Trait Lock VI',
    desc: 'Lock 6 traits',
    effect: { type: 'trait-lock', traits: 6 },
    requires: { skill: 'trait-lock-5' },
  },
  'trait-lock-7': {
    branch: 'breeder', line: 'trait-lock', tier: 7,
    name: 'Trait Lock VII',
    desc: 'Lock 8 traits',
    effect: { type: 'trait-lock', traits: 8 },
    requires: { skill: 'trait-lock-6' },
  },
  'trait-lock-8': {
    branch: 'breeder', line: 'trait-lock', tier: 8,
    name: 'Trait Lock VIII',
    desc: 'Lock 10 traits',
    effect: { type: 'trait-lock', traits: 10 },
    requires: { skill: 'trait-lock-7' },
  },

  // — Targeted Mutation Extension (requires Catalyst Grimoire) —
  'targeted-mutation-1': {
    branch: 'breeder', line: 'targeted-mutation', tier: 5,
    name: 'Targeted Mutation I',
    desc: 'Force specific allele as mutation on 1 trait',
    effect: { type: 'targeted-mutation', traits: 1 },
    requires: { skill: 'trait-lock-5', tome: 'catalyst-grimoire' },
  },
  'targeted-mutation-2': {
    branch: 'breeder', line: 'targeted-mutation', tier: 6,
    name: 'Targeted Mutation II',
    desc: 'Force mutation on up to 2 traits',
    effect: { type: 'targeted-mutation', traits: 2 },
    requires: { skill: 'targeted-mutation-1' },
  },
  'targeted-mutation-3': {
    branch: 'breeder', line: 'targeted-mutation', tier: 7,
    name: 'Targeted Mutation III',
    desc: 'Force mutation on up to 3 traits',
    effect: { type: 'targeted-mutation', traits: 3 },
    requires: { skill: 'targeted-mutation-2' },
  },
  'targeted-mutation-4': {
    branch: 'breeder', line: 'targeted-mutation', tier: 8,
    name: 'Targeted Mutation IV',
    desc: 'Force mutation on up to 4 traits',
    effect: { type: 'targeted-mutation', traits: 4 },
    requires: { skill: 'targeted-mutation-3' },
  },

  // ────────────────────────────────────────────────────────
  // HANDLER BRANCH
  // ────────────────────────────────────────────────────────

  // — Economy Path (Gold Bonus) —
  'gold-bonus-1': {
    branch: 'handler', line: 'economy', tier: 1,
    name: 'Gold Bonus I', desc: '+5% quest gold',
    effect: { type: 'reward-bonus', stat: 'gold', percent: 0.05 },
    requires: null,
  },
  'gold-bonus-2': {
    branch: 'handler', line: 'economy', tier: 2,
    name: 'Gold Bonus II', desc: '+10% quest gold',
    effect: { type: 'reward-bonus', stat: 'gold', percent: 0.10 },
    requires: { skill: 'gold-bonus-1' },
  },
  'gold-bonus-3': {
    branch: 'handler', line: 'economy', tier: 3,
    name: 'Gold Bonus III', desc: '+15% quest gold',
    effect: { type: 'reward-bonus', stat: 'gold', percent: 0.15 },
    requires: { skill: 'gold-bonus-2' },
  },
  'gold-bonus-4': {
    branch: 'handler', line: 'economy', tier: 4,
    name: 'Gold Bonus IV', desc: '+20% quest gold',
    effect: { type: 'reward-bonus', stat: 'gold', percent: 0.20 },
    requires: { skill: 'gold-bonus-3' },
  },
  'gold-bonus-5': {
    branch: 'handler', line: 'economy', tier: 5,
    name: 'Gold Bonus V', desc: '+25% quest gold',
    effect: { type: 'reward-bonus', stat: 'gold', percent: 0.25 },
    requires: { skill: 'gold-bonus-4' },
  },
  'gold-bonus-6': {
    branch: 'handler', line: 'economy', tier: 6,
    name: 'Gold Bonus VI', desc: '+30% quest gold',
    effect: { type: 'reward-bonus', stat: 'gold', percent: 0.30 },
    requires: { skill: 'gold-bonus-5' },
  },

  // — Economy Path (XP Bonus) —
  'xp-bonus-1': {
    branch: 'handler', line: 'economy', tier: 1,
    name: 'XP Bonus I', desc: '+5% quest XP',
    effect: { type: 'reward-bonus', stat: 'exp', percent: 0.05 },
    requires: null,
  },
  'xp-bonus-2': {
    branch: 'handler', line: 'economy', tier: 2,
    name: 'XP Bonus II', desc: '+10% quest XP',
    effect: { type: 'reward-bonus', stat: 'exp', percent: 0.10 },
    requires: { skill: 'xp-bonus-1' },
  },
  'xp-bonus-3': {
    branch: 'handler', line: 'economy', tier: 3,
    name: 'XP Bonus III', desc: '+15% quest XP',
    effect: { type: 'reward-bonus', stat: 'exp', percent: 0.15 },
    requires: { skill: 'xp-bonus-2' },
  },
  'xp-bonus-4': {
    branch: 'handler', line: 'economy', tier: 4,
    name: 'XP Bonus IV', desc: '+20% quest XP',
    effect: { type: 'reward-bonus', stat: 'exp', percent: 0.20 },
    requires: { skill: 'xp-bonus-3' },
  },
  'xp-bonus-5': {
    branch: 'handler', line: 'economy', tier: 5,
    name: 'XP Bonus V', desc: '+25% quest XP',
    effect: { type: 'reward-bonus', stat: 'exp', percent: 0.25 },
    requires: { skill: 'xp-bonus-4' },
  },
  'xp-bonus-6': {
    branch: 'handler', line: 'economy', tier: 6,
    name: 'XP Bonus VI', desc: '+30% quest XP',
    effect: { type: 'reward-bonus', stat: 'exp', percent: 0.30 },
    requires: { skill: 'xp-bonus-5' },
  },

  // — Economy Path (Rep Bonus) —
  'rep-bonus-1': {
    branch: 'handler', line: 'economy', tier: 1,
    name: 'Rep Bonus I', desc: '+5% quest rep',
    effect: { type: 'reward-bonus', stat: 'rep', percent: 0.05 },
    requires: null,
  },
  'rep-bonus-2': {
    branch: 'handler', line: 'economy', tier: 2,
    name: 'Rep Bonus II', desc: '+10% quest rep',
    effect: { type: 'reward-bonus', stat: 'rep', percent: 0.10 },
    requires: { skill: 'rep-bonus-1' },
  },
  'rep-bonus-3': {
    branch: 'handler', line: 'economy', tier: 3,
    name: 'Rep Bonus III', desc: '+15% quest rep',
    effect: { type: 'reward-bonus', stat: 'rep', percent: 0.15 },
    requires: { skill: 'rep-bonus-2' },
  },
  'rep-bonus-4': {
    branch: 'handler', line: 'economy', tier: 4,
    name: 'Rep Bonus IV', desc: '+20% quest rep',
    effect: { type: 'reward-bonus', stat: 'rep', percent: 0.20 },
    requires: { skill: 'rep-bonus-3' },
  },
  'rep-bonus-5': {
    branch: 'handler', line: 'economy', tier: 5,
    name: 'Rep Bonus V', desc: '+25% quest rep',
    effect: { type: 'reward-bonus', stat: 'rep', percent: 0.25 },
    requires: { skill: 'rep-bonus-4' },
  },
  'rep-bonus-6': {
    branch: 'handler', line: 'economy', tier: 6,
    name: 'Rep Bonus VI', desc: '+30% quest rep',
    effect: { type: 'reward-bonus', stat: 'rep', percent: 0.30 },
    requires: { skill: 'rep-bonus-5' },
  },

  // — Egg Sales Path —
  'egg-pricing-1': {
    branch: 'handler', line: 'egg-sales', tier: 1,
    name: 'Egg Pricing I', desc: '+10 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 10 },
    requires: null,
  },
  'egg-pricing-2': {
    branch: 'handler', line: 'egg-sales', tier: 2,
    name: 'Egg Pricing II', desc: '+20 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 20 },
    requires: { skill: 'egg-pricing-1' },
  },
  'egg-pricing-3': {
    branch: 'handler', line: 'egg-sales', tier: 3,
    name: 'Egg Pricing III', desc: '+30 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 30 },
    requires: { skill: 'egg-pricing-2' },
  },
  'egg-pricing-4': {
    branch: 'handler', line: 'egg-sales', tier: 4,
    name: 'Egg Pricing IV', desc: '+40 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 40 },
    requires: { skill: 'egg-pricing-3' },
  },
  'egg-pricing-5': {
    branch: 'handler', line: 'egg-sales', tier: 5,
    name: 'Egg Pricing V', desc: '+50 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 50 },
    requires: { skill: 'egg-pricing-4' },
  },
  'egg-pricing-6': {
    branch: 'handler', line: 'egg-sales', tier: 6,
    name: 'Egg Pricing VI', desc: '+65 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 65 },
    requires: { skill: 'egg-pricing-5' },
  },
  'egg-pricing-7': {
    branch: 'handler', line: 'egg-sales', tier: 7,
    name: 'Egg Pricing VII', desc: '+80 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 80 },
    requires: { skill: 'egg-pricing-6' },
  },
  'egg-pricing-8': {
    branch: 'handler', line: 'egg-sales', tier: 8,
    name: 'Egg Pricing VIII', desc: '+100 gold per egg sale',
    effect: { type: 'egg-pricing', gold: 100 },
    requires: { skill: 'egg-pricing-7' },
  },

  // — Quest Path —
  'quest-reroll-1': {
    branch: 'handler', line: 'quest', tier: 1,
    name: 'Quest Reroll I', desc: 'Reroll 1 trait requirement',
    effect: { type: 'quest-reroll', traits: 1 },
    requires: null,
  },
  'quest-reroll-2': {
    branch: 'handler', line: 'quest', tier: 2,
    name: 'Quest Reroll II', desc: 'Reroll up to 2 traits',
    effect: { type: 'quest-reroll', traits: 2 },
    requires: { skill: 'quest-reroll-1' },
  },
  'quest-reroll-3': {
    branch: 'handler', line: 'quest', tier: 3,
    name: 'Quest Reroll III', desc: 'Reroll up to 3 traits',
    effect: { type: 'quest-reroll', traits: 3 },
    requires: { skill: 'quest-reroll-2' },
  },
  'quest-reroll-4': {
    branch: 'handler', line: 'quest', tier: 4,
    name: 'Quest Reroll IV', desc: 'Reroll all traits',
    effect: { type: 'quest-reroll', traits: Infinity },
    requires: { skill: 'quest-reroll-3' },
  },
  'quest-refresh': {
    branch: 'handler', line: 'quest', tier: 5,
    name: 'Quest Refresh', desc: 'Reroll ALL available quests',
    effect: { type: 'quest-refresh' },
    requires: { skill: 'quest-reroll-4' },
  },
  'quest-flexibility-1': {
    branch: 'handler', line: 'quest', tier: 2,
    name: 'Quest Flexibility I', desc: 'Swap 1 trait requirement for chosen one',
    effect: { type: 'quest-flexibility', traits: 1 },
    requires: { skill: 'quest-reroll-1' },
  },
  'quest-flexibility-2': {
    branch: 'handler', line: 'quest', tier: 3,
    name: 'Quest Flexibility II', desc: 'Swap up to 2 trait requirements',
    effect: { type: 'quest-flexibility', traits: 2 },
    requires: { skill: 'quest-flexibility-1' },
  },

  // — Tome Sub-Branch Skills —
  // Generated per-tome. Each tome unlocks a Pressure line and a Lock line.
  // Pattern: [tome-key]-pressure-1..5, [tome-key]-lock-1..5

  // Morphology Foundations (Size, Wing Count)
  'morphology-foundations-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Morphology Pressure I', desc: 'Per-egg selective pressure for size/wings',
    effect: { type: 'tome-pressure', genes: ['body_size', 'frame_wings'], mode: 'per-egg' },
    requires: { tome: 'morphology-foundations' },
  },
  'morphology-foundations-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Morphology Pressure II', desc: 'Per-clutch 25% pressure for size/wings',
    effect: { type: 'tome-pressure', genes: ['body_size', 'frame_wings'], chance: 0.25 },
    requires: { skill: 'morphology-foundations-pressure-1' },
  },
  'morphology-foundations-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Morphology Pressure III', desc: 'Per-clutch 50% pressure for size/wings',
    effect: { type: 'tome-pressure', genes: ['body_size', 'frame_wings'], chance: 0.50 },
    requires: { skill: 'morphology-foundations-pressure-2' },
  },
  'morphology-foundations-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Morphology Pressure IV', desc: 'Per-clutch 75% pressure for size/wings',
    effect: { type: 'tome-pressure', genes: ['body_size', 'frame_wings'], chance: 0.75 },
    requires: { skill: 'morphology-foundations-pressure-3' },
  },
  'morphology-foundations-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Morphology Pressure V', desc: 'Per-clutch 100% pressure for size/wings',
    effect: { type: 'tome-pressure', genes: ['body_size', 'frame_wings'], chance: 1.00 },
    requires: { skill: 'morphology-foundations-pressure-4' },
  },
  'morphology-foundations-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Morphology Lock I', desc: 'Per-egg trait lock for size/wings',
    effect: { type: 'tome-lock', genes: ['body_size', 'frame_wings'], mode: 'per-egg' },
    requires: { tome: 'morphology-foundations' },
  },
  'morphology-foundations-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Morphology Lock II', desc: 'Per-clutch 25% lock for size/wings',
    effect: { type: 'tome-lock', genes: ['body_size', 'frame_wings'], chance: 0.25 },
    requires: { skill: 'morphology-foundations-lock-1' },
  },
  'morphology-foundations-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Morphology Lock III', desc: 'Per-clutch 50% lock for size/wings',
    effect: { type: 'tome-lock', genes: ['body_size', 'frame_wings'], chance: 0.50 },
    requires: { skill: 'morphology-foundations-lock-2' },
  },
  'morphology-foundations-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Morphology Lock IV', desc: 'Per-clutch 75% lock for size/wings',
    effect: { type: 'tome-lock', genes: ['body_size', 'frame_wings'], chance: 0.75 },
    requires: { skill: 'morphology-foundations-lock-3' },
  },
  'morphology-foundations-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Morphology Lock V', desc: 'Per-clutch 100% lock for size/wings',
    effect: { type: 'tome-lock', genes: ['body_size', 'frame_wings'], chance: 1.00 },
    requires: { skill: 'morphology-foundations-lock-4' },
  },

  // Appendage Primary (Horn Style, Spine Style, Tail Shape)
  'appendage-primary-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Appendage Pressure I', desc: 'Per-egg selective pressure for horns/spines/tail',
    effect: { type: 'tome-pressure', genes: ['horn_style', 'spine_style', 'tail_shape'], mode: 'per-egg' },
    requires: { tome: 'appendage-primary' },
  },
  'appendage-primary-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Appendage Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 0.25 },
    requires: { skill: 'appendage-primary-pressure-1' },
  },
  'appendage-primary-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Appendage Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 0.50 },
    requires: { skill: 'appendage-primary-pressure-2' },
  },
  'appendage-primary-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Appendage Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 0.75 },
    requires: { skill: 'appendage-primary-pressure-3' },
  },
  'appendage-primary-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Appendage Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 1.00 },
    requires: { skill: 'appendage-primary-pressure-4' },
  },
  'appendage-primary-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Appendage Lock I', desc: 'Per-egg lock for horns/spines/tail',
    effect: { type: 'tome-lock', genes: ['horn_style', 'spine_style', 'tail_shape'], mode: 'per-egg' },
    requires: { tome: 'appendage-primary' },
  },
  'appendage-primary-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Appendage Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 0.25 },
    requires: { skill: 'appendage-primary-lock-1' },
  },
  'appendage-primary-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Appendage Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 0.50 },
    requires: { skill: 'appendage-primary-lock-2' },
  },
  'appendage-primary-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Appendage Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 0.75 },
    requires: { skill: 'appendage-primary-lock-3' },
  },
  'appendage-primary-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Appendage Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['horn_style', 'spine_style', 'tail_shape'], chance: 1.00 },
    requires: { skill: 'appendage-primary-lock-4' },
  },

  // Morphology Structures (Body Type)
  'morphology-structures-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Body Struct. Pressure I', desc: 'Per-egg pressure for body type',
    effect: { type: 'tome-pressure', genes: ['body_type'], mode: 'per-egg' },
    requires: { tome: 'morphology-structures' },
  },
  'morphology-structures-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Body Struct. Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['body_type'], chance: 0.25 },
    requires: { skill: 'morphology-structures-pressure-1' },
  },
  'morphology-structures-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Body Struct. Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['body_type'], chance: 0.50 },
    requires: { skill: 'morphology-structures-pressure-2' },
  },
  'morphology-structures-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Body Struct. Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['body_type'], chance: 0.75 },
    requires: { skill: 'morphology-structures-pressure-3' },
  },
  'morphology-structures-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Body Struct. Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['body_type'], chance: 1.00 },
    requires: { skill: 'morphology-structures-pressure-4' },
  },
  'morphology-structures-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Body Struct. Lock I', desc: 'Per-egg lock for body type',
    effect: { type: 'tome-lock', genes: ['body_type'], mode: 'per-egg' },
    requires: { tome: 'morphology-structures' },
  },
  'morphology-structures-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Body Struct. Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['body_type'], chance: 0.25 },
    requires: { skill: 'morphology-structures-lock-1' },
  },
  'morphology-structures-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Body Struct. Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['body_type'], chance: 0.50 },
    requires: { skill: 'morphology-structures-lock-2' },
  },
  'morphology-structures-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Body Struct. Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['body_type'], chance: 0.75 },
    requires: { skill: 'morphology-structures-lock-3' },
  },
  'morphology-structures-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Body Struct. Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['body_type'], chance: 1.00 },
    requires: { skill: 'morphology-structures-lock-4' },
  },

  // Appendage Secondary (Horn Direction, Spine Height, Tail Length)
  'appendage-secondary-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Appendage Sec. Pressure I', desc: 'Per-egg pressure for horn dir/spine height/tail len',
    effect: { type: 'tome-pressure', genes: ['horn_direction', 'spine_height', 'tail_length'], mode: 'per-egg' },
    requires: { tome: 'appendage-secondary' },
  },
  'appendage-secondary-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Appendage Sec. Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 0.25 },
    requires: { skill: 'appendage-secondary-pressure-1' },
  },
  'appendage-secondary-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Appendage Sec. Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 0.50 },
    requires: { skill: 'appendage-secondary-pressure-2' },
  },
  'appendage-secondary-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Appendage Sec. Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 0.75 },
    requires: { skill: 'appendage-secondary-pressure-3' },
  },
  'appendage-secondary-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Appendage Sec. Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 1.00 },
    requires: { skill: 'appendage-secondary-pressure-4' },
  },
  'appendage-secondary-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Appendage Sec. Lock I', desc: 'Per-egg lock for horn dir/spine height/tail len',
    effect: { type: 'tome-lock', genes: ['horn_direction', 'spine_height', 'tail_length'], mode: 'per-egg' },
    requires: { tome: 'appendage-secondary' },
  },
  'appendage-secondary-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Appendage Sec. Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 0.25 },
    requires: { skill: 'appendage-secondary-lock-1' },
  },
  'appendage-secondary-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Appendage Sec. Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 0.50 },
    requires: { skill: 'appendage-secondary-lock-2' },
  },
  'appendage-secondary-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Appendage Sec. Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 0.75 },
    requires: { skill: 'appendage-secondary-lock-3' },
  },
  'appendage-secondary-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Appendage Sec. Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['horn_direction', 'spine_height', 'tail_length'], chance: 1.00 },
    requires: { skill: 'appendage-secondary-lock-4' },
  },

  // Scale Appendix (Scale Type)
  'scale-appendix-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Scale Pressure I', desc: 'Per-egg pressure for scale type',
    effect: { type: 'tome-pressure', genes: ['body_scales'], mode: 'per-egg' },
    requires: { tome: 'scale-appendix' },
  },
  'scale-appendix-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Scale Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['body_scales'], chance: 0.25 },
    requires: { skill: 'scale-appendix-pressure-1' },
  },
  'scale-appendix-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Scale Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['body_scales'], chance: 0.50 },
    requires: { skill: 'scale-appendix-pressure-2' },
  },
  'scale-appendix-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Scale Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['body_scales'], chance: 0.75 },
    requires: { skill: 'scale-appendix-pressure-3' },
  },
  'scale-appendix-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Scale Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['body_scales'], chance: 1.00 },
    requires: { skill: 'scale-appendix-pressure-4' },
  },
  'scale-appendix-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Scale Lock I', desc: 'Per-egg lock for scale type',
    effect: { type: 'tome-lock', genes: ['body_scales'], mode: 'per-egg' },
    requires: { tome: 'scale-appendix' },
  },
  'scale-appendix-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Scale Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['body_scales'], chance: 0.25 },
    requires: { skill: 'scale-appendix-lock-1' },
  },
  'scale-appendix-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Scale Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['body_scales'], chance: 0.50 },
    requires: { skill: 'scale-appendix-lock-2' },
  },
  'scale-appendix-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Scale Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['body_scales'], chance: 0.75 },
    requires: { skill: 'scale-appendix-lock-3' },
  },
  'scale-appendix-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Scale Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['body_scales'], chance: 1.00 },
    requires: { skill: 'scale-appendix-lock-4' },
  },

  // Morphology Details (Limb Count, Bone Density)
  'morphology-details-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Morph. Details Pressure I', desc: 'Per-egg pressure for limbs/bones',
    effect: { type: 'tome-pressure', genes: ['frame_limbs', 'frame_bones'], mode: 'per-egg' },
    requires: { tome: 'morphology-details' },
  },
  'morphology-details-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Morph. Details Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['frame_limbs', 'frame_bones'], chance: 0.25 },
    requires: { skill: 'morphology-details-pressure-1' },
  },
  'morphology-details-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Morph. Details Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['frame_limbs', 'frame_bones'], chance: 0.50 },
    requires: { skill: 'morphology-details-pressure-2' },
  },
  'morphology-details-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Morph. Details Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['frame_limbs', 'frame_bones'], chance: 0.75 },
    requires: { skill: 'morphology-details-pressure-3' },
  },
  'morphology-details-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Morph. Details Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['frame_limbs', 'frame_bones'], chance: 1.00 },
    requires: { skill: 'morphology-details-pressure-4' },
  },
  'morphology-details-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Morph. Details Lock I', desc: 'Per-egg lock for limbs/bones',
    effect: { type: 'tome-lock', genes: ['frame_limbs', 'frame_bones'], mode: 'per-egg' },
    requires: { tome: 'morphology-details' },
  },
  'morphology-details-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Morph. Details Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['frame_limbs', 'frame_bones'], chance: 0.25 },
    requires: { skill: 'morphology-details-lock-1' },
  },
  'morphology-details-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Morph. Details Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['frame_limbs', 'frame_bones'], chance: 0.50 },
    requires: { skill: 'morphology-details-lock-2' },
  },
  'morphology-details-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Morph. Details Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['frame_limbs', 'frame_bones'], chance: 0.75 },
    requires: { skill: 'morphology-details-lock-3' },
  },
  'morphology-details-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Morph. Details Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['frame_limbs', 'frame_bones'], chance: 1.00 },
    requires: { skill: 'morphology-details-lock-4' },
  },

  // Breath Arts Tome (Breath Shape, Breath Range)
  'breath-arts-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Breath Arts Pressure I', desc: 'Per-egg pressure for breath shape/range',
    effect: { type: 'tome-pressure', genes: ['breath_shape', 'breath_range'], mode: 'per-egg' },
    requires: { tome: 'breath-arts' },
  },
  'breath-arts-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Breath Arts Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['breath_shape', 'breath_range'], chance: 0.25 },
    requires: { skill: 'breath-arts-pressure-1' },
  },
  'breath-arts-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Breath Arts Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['breath_shape', 'breath_range'], chance: 0.50 },
    requires: { skill: 'breath-arts-pressure-2' },
  },
  'breath-arts-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Breath Arts Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['breath_shape', 'breath_range'], chance: 0.75 },
    requires: { skill: 'breath-arts-pressure-3' },
  },
  'breath-arts-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Breath Arts Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['breath_shape', 'breath_range'], chance: 1.00 },
    requires: { skill: 'breath-arts-pressure-4' },
  },
  'breath-arts-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Breath Arts Lock I', desc: 'Per-egg lock for breath shape/range',
    effect: { type: 'tome-lock', genes: ['breath_shape', 'breath_range'], mode: 'per-egg' },
    requires: { tome: 'breath-arts' },
  },
  'breath-arts-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Breath Arts Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['breath_shape', 'breath_range'], chance: 0.25 },
    requires: { skill: 'breath-arts-lock-1' },
  },
  'breath-arts-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Breath Arts Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['breath_shape', 'breath_range'], chance: 0.50 },
    requires: { skill: 'breath-arts-lock-2' },
  },
  'breath-arts-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Breath Arts Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['breath_shape', 'breath_range'], chance: 0.75 },
    requires: { skill: 'breath-arts-lock-3' },
  },
  'breath-arts-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Breath Arts Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['breath_shape', 'breath_range'], chance: 1.00 },
    requires: { skill: 'breath-arts-lock-4' },
  },

  // Chroma Tome (Cyan, Magenta, Yellow)
  'chroma-tome-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Chroma Pressure I', desc: 'Per-egg pressure for C/M/Y',
    effect: { type: 'tome-pressure', genes: ['color_cyan', 'color_magenta', 'color_yellow'], mode: 'per-egg' },
    requires: { tome: 'chroma-tome' },
  },
  'chroma-tome-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Chroma Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 0.25 },
    requires: { skill: 'chroma-tome-pressure-1' },
  },
  'chroma-tome-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Chroma Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 0.50 },
    requires: { skill: 'chroma-tome-pressure-2' },
  },
  'chroma-tome-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Chroma Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 0.75 },
    requires: { skill: 'chroma-tome-pressure-3' },
  },
  'chroma-tome-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Chroma Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 1.00 },
    requires: { skill: 'chroma-tome-pressure-4' },
  },
  'chroma-tome-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Chroma Lock I', desc: 'Per-egg lock for C/M/Y',
    effect: { type: 'tome-lock', genes: ['color_cyan', 'color_magenta', 'color_yellow'], mode: 'per-egg' },
    requires: { tome: 'chroma-tome' },
  },
  'chroma-tome-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Chroma Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 0.25 },
    requires: { skill: 'chroma-tome-lock-1' },
  },
  'chroma-tome-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Chroma Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 0.50 },
    requires: { skill: 'chroma-tome-lock-2' },
  },
  'chroma-tome-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Chroma Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 0.75 },
    requires: { skill: 'chroma-tome-lock-3' },
  },
  'chroma-tome-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Chroma Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['color_cyan', 'color_magenta', 'color_yellow'], chance: 1.00 },
    requires: { skill: 'chroma-tome-lock-4' },
  },

  // Luster Tome (Opacity, Shine, Schiller)
  'luster-tome-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Luster Pressure I', desc: 'Per-egg pressure for finish',
    effect: { type: 'tome-pressure', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], mode: 'per-egg' },
    requires: { tome: 'luster-tome' },
  },
  'luster-tome-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Luster Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 0.25 },
    requires: { skill: 'luster-tome-pressure-1' },
  },
  'luster-tome-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Luster Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 0.50 },
    requires: { skill: 'luster-tome-pressure-2' },
  },
  'luster-tome-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Luster Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 0.75 },
    requires: { skill: 'luster-tome-pressure-3' },
  },
  'luster-tome-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Luster Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 1.00 },
    requires: { skill: 'luster-tome-pressure-4' },
  },
  'luster-tome-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Luster Lock I', desc: 'Per-egg lock for finish',
    effect: { type: 'tome-lock', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], mode: 'per-egg' },
    requires: { tome: 'luster-tome' },
  },
  'luster-tome-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Luster Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 0.25 },
    requires: { skill: 'luster-tome-lock-1' },
  },
  'luster-tome-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Luster Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 0.50 },
    requires: { skill: 'luster-tome-lock-2' },
  },
  'luster-tome-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Luster Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 0.75 },
    requires: { skill: 'luster-tome-lock-3' },
  },
  'luster-tome-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Luster Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'], chance: 1.00 },
    requires: { skill: 'luster-tome-lock-4' },
  },

  // Breath Codex (Fire, Ice, Lightning)
  'breath-codex-pressure-1': {
    branch: 'handler', line: 'tome-sub', tier: 1,
    name: 'Breath Codex Pressure I', desc: 'Per-egg pressure for F/I/L',
    effect: { type: 'tome-pressure', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], mode: 'per-egg' },
    requires: { tome: 'breath-codex' },
  },
  'breath-codex-pressure-2': {
    branch: 'handler', line: 'tome-sub', tier: 2,
    name: 'Breath Codex Pressure II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-pressure', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 0.25 },
    requires: { skill: 'breath-codex-pressure-1' },
  },
  'breath-codex-pressure-3': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Breath Codex Pressure III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-pressure', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 0.50 },
    requires: { skill: 'breath-codex-pressure-2' },
  },
  'breath-codex-pressure-4': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Breath Codex Pressure IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-pressure', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 0.75 },
    requires: { skill: 'breath-codex-pressure-3' },
  },
  'breath-codex-pressure-5': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Breath Codex Pressure V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-pressure', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 1.00 },
    requires: { skill: 'breath-codex-pressure-4' },
  },
  'breath-codex-lock-1': {
    branch: 'handler', line: 'tome-sub', tier: 3,
    name: 'Breath Codex Lock I', desc: 'Per-egg lock for F/I/L',
    effect: { type: 'tome-lock', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], mode: 'per-egg' },
    requires: { tome: 'breath-codex' },
  },
  'breath-codex-lock-2': {
    branch: 'handler', line: 'tome-sub', tier: 4,
    name: 'Breath Codex Lock II', desc: 'Per-clutch 25%',
    effect: { type: 'tome-lock', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 0.25 },
    requires: { skill: 'breath-codex-lock-1' },
  },
  'breath-codex-lock-3': {
    branch: 'handler', line: 'tome-sub', tier: 5,
    name: 'Breath Codex Lock III', desc: 'Per-clutch 50%',
    effect: { type: 'tome-lock', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 0.50 },
    requires: { skill: 'breath-codex-lock-2' },
  },
  'breath-codex-lock-4': {
    branch: 'handler', line: 'tome-sub', tier: 6,
    name: 'Breath Codex Lock IV', desc: 'Per-clutch 75%',
    effect: { type: 'tome-lock', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 0.75 },
    requires: { skill: 'breath-codex-lock-3' },
  },
  'breath-codex-lock-5': {
    branch: 'handler', line: 'tome-sub', tier: 7,
    name: 'Breath Codex Lock V', desc: 'Per-clutch 100%',
    effect: { type: 'tome-lock', genes: ['breath_fire', 'breath_ice', 'breath_lightning'], chance: 1.00 },
    requires: { skill: 'breath-codex-lock-4' },
  },

  // Catalyst Grimoire — no pressure/lock skills of its own
  // It gates the Selective Mutation and Targeted Mutation lines on the Breeder branch
};

// ── Tome → Gene Mapping ──────────────────────────────────
// Used by UI to show which genes a tome covers

export const TOME_GENE_MAP = {
  'morphology-foundations': ['body_size', 'frame_wings'],
  'morphology-structures':  ['body_type'],
  'morphology-details':     ['frame_limbs', 'frame_bones'],
  'appendage-primary':      ['horn_style', 'spine_style', 'tail_shape'],
  'appendage-secondary':    ['horn_direction', 'spine_height', 'tail_length'],
  'scale-appendix':         ['body_scales'],
  'chroma-tome':            ['color_cyan', 'color_magenta', 'color_yellow'],
  'luster-tome':            ['finish_opacity', 'finish_shine', 'finish_schiller'],
  'breath-codex':           ['breath_fire', 'breath_ice', 'breath_lightning'],
  'breath-arts':            ['breath_shape', 'breath_range'],
  'catalyst-grimoire':      [], // gates mutation sub-branches, no direct gene coverage
};
