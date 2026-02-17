// Quest highlighting — graduated halo brightness based on allele match quality
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

// Map quest requirement path → gene name
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
 * Score a dragon's allele matches for a single quest requirement.
 *
 * Returns { score, maxScore } where:
 *   - For simple traits: each matching allele = 1 point, max 2 (both alleles match)
 *   - For triangle traits: each matching allele across all 3 axes = 1 point each,
 *     max 6 (2 alleles × 3 axes)
 *
 * This means:
 *   - One allele carries the target = 1 point
 *   - Both alleles (homozygous) = 2 points (brighter)
 *   - For triangles: more matching axes = more points
 */
function scoreReqAlleles(dragon, req) {
  // Simple traits
  const simpleGene = SIMPLE_PATHS[req.path];
  if (simpleGene) {
    const alleles = dragon.genotype[simpleGene];
    if (!alleles) return { score: 0, maxScore: 2 };
    const lookup = getSimpleTraitAlleleLookup(simpleGene);
    if (!lookup) return { score: 0, maxScore: 2 };
    const targetAlleles = lookup[req.value];
    if (!targetAlleles) return { score: 0, maxScore: 2 };

    let score = 0;
    for (const target of targetAlleles) {
      if (alleles[0] === target) score++;
      if (alleles[1] === target) score++;
    }

    // For linear traits, the expressed phenotype can match via averaging
    // even when neither individual allele equals the target.
    // e.g. wings (1,3) → avg 2 = "Pair" — phenotype matches but no allele does.
    // Give 1 point for expressed phenotype match if allele score is 0.
    if (score === 0) {
      const def = GENE_DEFS[simpleGene];
      let expressed;
      if (def.inheritanceType === 'categorical') {
        expressed = Math.max(alleles[0], alleles[1]);
      } else {
        expressed = Math.round((alleles[0] + alleles[1]) / 2);
      }
      const expressedName = def.phenotypeMap?.[expressed];
      if (expressedName === req.value) score = 1;
    }

    // Cap at 2 (both alleles match)
    return { score: Math.min(score, 2), maxScore: 2 };
  }

  // Triangle systems: check each of 3 axes, 2 alleles each
  const triangleDef = TRIANGLE_PATHS[req.path];
  if (triangleDef) {
    const keyStr = triangleDef.lookup[req.value];
    if (!keyStr) return { score: 0, maxScore: 6 };
    const targetTiers = keyStr.split('-').map(Number);

    let score = 0;
    let expressedMatchCount = 0;
    for (let i = 0; i < triangleDef.axes.length; i++) {
      const geneName = triangleDef.axes[i];
      const alleles = dragon.genotype[geneName];
      if (!alleles) continue;
      if (alleles[0] === targetTiers[i]) score++;
      if (alleles[1] === targetTiers[i]) score++;
      // Also check if expressed avg matches target (for alleles that average to it)
      const expressedTier = Math.round((alleles[0] + alleles[1]) / 2);
      if (expressedTier === targetTiers[i]) expressedMatchCount++;
    }
    // If no allele-level matches but expressed phenotype matches some axes,
    // give partial credit (1 point per matching expressed axis)
    if (score === 0 && expressedMatchCount > 0) {
      score = expressedMatchCount;
    }
    return { score, maxScore: 6 };
  }

  // Specialty / modifier paths — fall back to no score
  return { score: 0, maxScore: 0 };
}

/**
 * Compute total allele match score across ALL quest requirements.
 *
 * Returns { totalScore, maxPossible, reqCount, matchedReqs }
 *
 * matchedReqs = number of requirements where score > 0
 *
 * The scoring gives us graduated brightness:
 *   - Single allele on one req → dim glow
 *   - Homozygous on one req → brighter
 *   - Multiple reqs matched → even brighter
 *   - All reqs homozygous → brightest
 */
function computeQuestScore(dragon, quest) {
  let totalScore = 0;
  let maxPossible = 0;
  let matchedReqs = 0;

  for (const req of quest.requirements) {
    const { score, maxScore } = scoreReqAlleles(dragon, req);
    totalScore += score;
    maxPossible += maxScore;
    if (score > 0) matchedReqs++;
  }

  return { totalScore, maxPossible, reqCount: quest.requirements.length, matchedReqs };
}

/**
 * Map a quest score to a halo level (0-5).
 *
 *   0 = no halo (no matching alleles at all)
 *   1 = faintest glow (1 allele match on 1 requirement)
 *   2 = dim glow (homozygous match on 1 req, or single match on 2+ reqs)
 *   3 = medium glow (good partial match)
 *   4 = bright glow (strong match, most reqs covered)
 *   5 = full match (phenotype matches all requirements = quest complete)
 */
function scoreToHaloLevel(totalScore, maxPossible, matchedReqs, reqCount, isFullPhenotypeMatch) {
  if (isFullPhenotypeMatch) return 5;
  if (totalScore === 0) return 0;

  // Normalize: what fraction of max allele points does this dragon have?
  const fraction = maxPossible > 0 ? totalScore / maxPossible : 0;

  // Also factor in how many distinct requirements are partially met
  const reqCoverage = reqCount > 0 ? matchedReqs / reqCount : 0;

  // Combined score: weight allele fraction (60%) and requirement coverage (40%)
  const combined = fraction * 0.6 + reqCoverage * 0.4;

  // Map to levels 1-4 (5 is reserved for full phenotype match)
  if (combined >= 0.75) return 4;
  if (combined >= 0.5) return 3;
  if (combined >= 0.25) return 2;
  return 1;
}

// All halo CSS classes we manage
const HALO_CLASSES = [
  'quest-halo-1',
  'quest-halo-2',
  'quest-halo-3',
  'quest-halo-4',
  'quest-halo-5',
];

/**
 * Apply graduated quest halo CSS class to a dragon card element.
 *
 * Levels:
 *   quest-halo-1 → faintest (1 allele match)
 *   quest-halo-2 → dim
 *   quest-halo-3 → medium
 *   quest-halo-4 → bright
 *   quest-halo-5 → full phenotype match (quest completable)
 *
 * Removes all halo classes first so it can be called repeatedly.
 */
export function applyQuestHalo(cardElement, dragon) {
  for (const cls of HALO_CLASSES) {
    cardElement.classList.remove(cls);
  }

  if (!highlightedQuest) return;
  if (!getSetting('quest-halos')) return;

  const quest = highlightedQuest;

  // Check full phenotype match first
  const isFullMatch = checkDragonMeetsQuest(dragon, quest);

  // Compute allele-level score
  const { totalScore, maxPossible, matchedReqs, reqCount } = computeQuestScore(dragon, quest);

  const level = scoreToHaloLevel(totalScore, maxPossible, matchedReqs, reqCount, isFullMatch);

  if (level > 0) {
    cardElement.classList.add(`quest-halo-${level}`);
  }
}
