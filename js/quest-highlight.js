// Quest highlighting — ephemeral highlighted quest state + halo helper
import { getSetting } from './settings.js';
import { checkDragonMeetsQuest, getRequirementStatus } from './quest-engine.js';
import { GENE_DEFS, TRIANGLE_DEFS, COLOR_NAMES, FINISH_NAMES, ELEMENT_NAMES } from './gene-config.js';

let highlightedQuest = null;
const highlightListeners = [];

export function getHighlightedQuest() {
  return highlightedQuest;
}

export function setHighlightedQuest(quest) {
  highlightedQuest = quest;
  for (const cb of highlightListeners) cb(quest);
}

export function onHighlightChange(cb) {
  highlightListeners.push(cb);
}

// ── Reverse lookups for genotype-level matching ──

// For simple traits: value string → allele number(s) that produce it
// e.g. "Wyvern (2)" → [1] for frame_limbs
function getSimpleTraitAlleleLookup(geneName) {
  const def = GENE_DEFS[geneName];
  if (!def || !def.phenotypeMap) return null;
  const lookup = {};
  for (const [alleleStr, name] of Object.entries(def.phenotypeMap)) {
    if (!lookup[name]) lookup[name] = [];
    lookup[name].push(Number(alleleStr));
  }
  return lookup;
}

// Map quest requirement path → { type, geneNames, ... }
const SIMPLE_PATHS = {
  'traits.body_size.name': 'body_size',
  'traits.body_type.name': 'body_type',
  'traits.body_scales.name': 'body_scales',
  'traits.frame_wings.name': 'frame_wings',
  'traits.frame_limbs.name': 'frame_limbs',
  'traits.frame_bones.name': 'frame_bones',
  'traits.breath_shape.name': 'breath_shape',
  'traits.breath_range.name': 'breath_range',
  'traits.horn_style.name': 'horn_style',
  'traits.horn_direction.name': 'horn_direction',
  'traits.spine_style.name': 'spine_style',
  'traits.spine_height.name': 'spine_height',
  'traits.tail_shape.name': 'tail_shape',
  'traits.tail_length.name': 'tail_length',
};

// Build reverse lookup: name → tier key for triangle systems
function buildReverseLookup(namesTable) {
  const m = {};
  for (const [key, name] of Object.entries(namesTable)) m[name] = key;
  return m;
}
const COLOR_KEY = buildReverseLookup(COLOR_NAMES);
const FINISH_KEY = buildReverseLookup(FINISH_NAMES);
const ELEMENT_KEY = buildReverseLookup(ELEMENT_NAMES);

const TRIANGLE_PATHS = {
  'color.displayName': { axes: ['color_cyan', 'color_magenta', 'color_yellow'], lookup: COLOR_KEY },
  'finish.displayName': { axes: ['finish_opacity', 'finish_shine', 'finish_schiller'], lookup: FINISH_KEY },
  'breathElement.displayName': { axes: ['breath_fire', 'breath_ice', 'breath_lightning'], lookup: ELEMENT_KEY },
};

/**
 * Check if a dragon's genotype carries alleles relevant to a quest requirement.
 * Returns: 'full' if the expressed phenotype matches,
 *          'carries' if any allele matches the target but phenotype doesn't express it,
 *          'none' if no relevant alleles found.
 */
function checkGenotypeForReq(dragon, req) {
  // Simple traits: check if either allele equals the target allele value
  const simpleGene = SIMPLE_PATHS[req.path];
  if (simpleGene) {
    const alleles = dragon.genotype[simpleGene];
    if (!alleles) return 'none';
    const lookup = getSimpleTraitAlleleLookup(simpleGene);
    if (!lookup) return 'none';
    const targetAlleles = lookup[req.value];
    if (!targetAlleles) return 'none';
    // Check if expressed phenotype already matches
    const def = GENE_DEFS[simpleGene];
    let expressed;
    if (def.inheritanceType === 'categorical') {
      expressed = Math.max(alleles[0], alleles[1]);
    } else {
      expressed = Math.round((alleles[0] + alleles[1]) / 2);
    }
    const expressedName = def.phenotypeMap[expressed];
    if (expressedName === req.value) return 'full';
    // Check if either allele is a target allele
    for (const target of targetAlleles) {
      if (alleles[0] === target || alleles[1] === target) return 'carries';
    }
    return 'none';
  }

  // Triangle systems: check if individual alleles on each axis match target tiers
  const triangleDef = TRIANGLE_PATHS[req.path];
  if (triangleDef) {
    const keyStr = triangleDef.lookup[req.value];
    if (!keyStr) return 'none';
    const targetTiers = keyStr.split('-').map(Number);
    // Check expressed phenotype first
    let expressedMatches = true;
    let anyAlleleMatches = false;
    let axisCarryCount = 0;
    for (let i = 0; i < triangleDef.axes.length; i++) {
      const geneName = triangleDef.axes[i];
      const alleles = dragon.genotype[geneName];
      if (!alleles) { expressedMatches = false; continue; }
      const avg = (alleles[0] + alleles[1]) / 2;
      const expressedTier = Math.round(avg);
      if (expressedTier !== targetTiers[i]) expressedMatches = false;
      // Check if either allele equals the target tier
      if (alleles[0] === targetTiers[i] || alleles[1] === targetTiers[i]) {
        axisCarryCount++;
      }
    }
    if (expressedMatches) return 'full';
    if (axisCarryCount > 0) return 'carries';
    return 'none';
  }

  // Specialty/modifier paths — fall back to phenotype check only
  return 'none';
}

/**
 * Apply quest halo CSS classes to a dragon card element.
 * - quest-halo-full  → dragon meets ALL requirements (phenotype)
 * - quest-halo-partial → dragon meets ≥1 requirement OR carries relevant alleles
 * Removes both classes first so it can be called repeatedly.
 */
export function applyQuestHalo(cardElement, dragon) {
  cardElement.classList.remove('quest-halo-full', 'quest-halo-partial');

  if (!highlightedQuest) return;
  if (!getSetting('quest-halos')) return;

  const quest = highlightedQuest;
  if (checkDragonMeetsQuest(dragon, quest)) {
    cardElement.classList.add('quest-halo-full');
    return;
  }

  // Check partial: phenotype match on any req, OR genotype carry on any req
  const status = getRequirementStatus(dragon, quest);
  const phenotypeMet = status.filter(r => r.met).length;
  if (phenotypeMet > 0) {
    cardElement.classList.add('quest-halo-partial');
    return;
  }

  // Check genotype-level carrying
  for (const req of quest.requirements) {
    const result = checkGenotypeForReq(dragon, req);
    if (result === 'carries' || result === 'full') {
      cardElement.classList.add('quest-halo-partial');
      return;
    }
  }
}
