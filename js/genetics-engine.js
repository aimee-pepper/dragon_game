// Core genetics engine: genotype creation, meiosis, and mutation
import {
  GENE_DEFS, TRIANGLE_DEFS, RANDOM_ALLELE_WEIGHTS,
  TRIANGLE_TIER_WEIGHTS, LOW_ALLELE_WEIGHTS, HIGH_ALLELE_WEIGHTS,
  MUTATION_RATE, CLUTCH_SIZE_MIN, CLUTCH_SIZE_MAX
} from './gene-config.js';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Weighted random selection: pick a value using probability weights
// weights[i] = relative probability of choosing (min + i)
function weightedRandomInt(min, max, weights) {
  if (!weights) return randomInt(min, max);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return min + i;
  }
  return max;
}

// Pick from a weighted tier map: { 0: weight, 1: weight, ... }
function pickWeightedTier(tierWeights) {
  const entries = Object.entries(tierWeights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [tier, weight] of entries) {
    r -= weight;
    if (r <= 0) return Number(tier);
  }
  return Number(entries[entries.length - 1][0]);
}

// Generate allele pair biased toward producing a High or Low average
function generateAlleleForTarget(geneDef, targetHigh) {
  const weights = targetHigh ? HIGH_ALLELE_WEIGHTS : LOW_ALLELE_WEIGHTS;
  return [
    weightedRandomInt(geneDef.min, geneDef.max, weights),
    weightedRandomInt(geneDef.min, geneDef.max, weights),
  ];
}

// Generate alleles for a triangle system with controlled rarity
// 1. Pick how many axes should be High (tier) using weighted distribution
// 2. Randomly choose WHICH axes are High
// 3. Generate alleles biased toward High or Low for each axis
function generateTriangleAlleles(systemName) {
  const tierWeights = TRIANGLE_TIER_WEIGHTS[systemName];
  if (!tierWeights) return null;

  const def = TRIANGLE_DEFS[systemName];
  const numHigh = pickWeightedTier(tierWeights);

  // Randomly choose which axes are High
  const axisIndices = [0, 1, 2];
  // Shuffle
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [axisIndices[i], axisIndices[j]] = [axisIndices[j], axisIndices[i]];
  }
  const highAxes = new Set(axisIndices.slice(0, numHigh));

  // Generate allele pairs for each axis
  const result = {};
  for (let i = 0; i < 3; i++) {
    const axisName = def.axes[i];
    const geneDef = GENE_DEFS[axisName];
    result[axisName] = generateAlleleForTarget(geneDef, highAxes.has(i));
  }
  return result;
}

// Generate triangle alleles with optional per-axis constraints and tier overrides
// constraints: { geneName: { min, max } } — restrict allele values for specific axes
// tierOverride: { 0: weight, 1: weight, ... } — override how many axes are High
// speciesGenes: { geneName: [a, b] } — hard-set alleles (skip generation entirely)
function generateConstrainedTriangleAlleles(systemName, constraints, tierOverride, speciesGenes) {
  const def = TRIANGLE_DEFS[systemName];
  if (!def) return null;

  // If all 3 axes are species-set, just return those
  const allSpeciesSet = def.axes.every(axis => speciesGenes && speciesGenes[axis]);
  if (allSpeciesSet) {
    const result = {};
    for (const axis of def.axes) result[axis] = [...speciesGenes[axis]];
    return result;
  }

  // Pick tier (number of High axes) using override weights or defaults
  const tierWeights = tierOverride || TRIANGLE_TIER_WEIGHTS[systemName];
  if (!tierWeights) return null;
  const numHigh = pickWeightedTier(tierWeights);

  // Randomly choose which axes are High
  const axisIndices = [0, 1, 2];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [axisIndices[i], axisIndices[j]] = [axisIndices[j], axisIndices[i]];
  }
  const highAxes = new Set(axisIndices.slice(0, numHigh));

  const result = {};
  for (let i = 0; i < 3; i++) {
    const axisName = def.axes[i];

    // Species genes override everything
    if (speciesGenes && speciesGenes[axisName]) {
      result[axisName] = [...speciesGenes[axisName]];
      continue;
    }

    const geneDef = GENE_DEFS[axisName];
    const constraint = constraints && constraints[axisName];
    const isHigh = highAxes.has(i);

    if (constraint) {
      // Constrained: generate within the specified range, biased by tier
      const weights = isHigh ? HIGH_ALLELE_WEIGHTS : LOW_ALLELE_WEIGHTS;
      // Map weights to the constrained range
      const rangeSize = constraint.max - constraint.min + 1;
      const slicedWeights = weights.slice(0, rangeSize);
      result[axisName] = [
        weightedRandomInt(constraint.min, constraint.max, slicedWeights.length >= rangeSize ? slicedWeights : null),
        weightedRandomInt(constraint.min, constraint.max, slicedWeights.length >= rangeSize ? slicedWeights : null),
      ];
    } else {
      // Unconstrained: use normal biased generation
      result[axisName] = generateAlleleForTarget(geneDef, isHigh);
    }
  }
  return result;
}

// ── Subordination helpers ────────────────────────────────────
// Computes the expressed phenotype level (None/Low/Mid/High) from two alleles
function getExpressedLevel(a, b) {
  const avg = (a + b) / 2;
  if (avg < 0.5) return 0;  // None
  if (avg < 1.5) return 1;  // Low
  if (avg < 2.5) return 2;  // Mid
  return 3;                  // High
}

/**
 * Enforce the subordination rule on a genotype:
 *   - The primary gene's expressed level is always ≥ 1 (never None)
 *   - Each secondary gene's expressed level must be strictly < primary's level
 *
 * subordination shape:
 *   { color: 'color_cyan', breath: 'breath_ice' }
 *   — names the primary axis for color and breath triangle systems
 *
 * The function mutates the genotype in place.
 */
function enforceSubordination(genotype, subordination) {
  if (!subordination) return;

  const COLOR_AXES = ['color_cyan', 'color_magenta', 'color_yellow'];
  const BREATH_AXES = ['breath_fire', 'breath_ice', 'breath_lightning'];

  const rules = [];
  if (subordination.color) {
    rules.push({ primary: subordination.color, axes: COLOR_AXES });
  }
  if (subordination.breath) {
    rules.push({ primary: subordination.breath, axes: BREATH_AXES });
  }

  for (const { primary, axes } of rules) {
    const secondaries = axes.filter(g => g !== primary);

    // Ensure primary is at least Low (both alleles ≥ 1)
    genotype[primary][0] = Math.max(1, genotype[primary][0]);
    genotype[primary][1] = Math.max(1, genotype[primary][1]);

    const primaryLevel = getExpressedLevel(genotype[primary][0], genotype[primary][1]);

    // Max allele value for secondaries: ensures their expressed level < primary's level
    // Level 1 (Low) → secondaries max 0 (None)
    // Level 2 (Mid) → secondaries max 1 (Low)
    // Level 3 (High) → secondaries max 2 (Mid)
    const maxSecAllele = Math.max(0, primaryLevel - 1);

    for (const secGene of secondaries) {
      genotype[secGene][0] = Math.min(genotype[secGene][0], maxSecAllele);
      genotype[secGene][1] = Math.min(genotype[secGene][1], maxSecAllele);
    }
  }
}

// Create a constrained genotype using habitat gene constraints and species templates
// constraints shape:
//   geneConstraints: { geneName: { min, max } } — restrict allele ranges
//   triangleOverrides: { systemName: { tierCount: weight } } — override tier distributions
//   speciesGenes: { geneName: [alleleA, alleleB] } — hard-set specific genes
//   subordination: { color: 'color_X', breath: 'breath_X' } — primary axis enforcement
export function createConstrainedGenotype(constraints = {}) {
  const { geneConstraints = {}, triangleOverrides = {}, speciesGenes = {}, subordination } = constraints;
  const genotype = {};

  // First, generate triangle system axes with controlled rarity
  const triangleGenes = new Set();
  for (const [systemName, def] of Object.entries(TRIANGLE_DEFS)) {
    const tierOverride = triangleOverrides[systemName] || null;
    const alleles = generateConstrainedTriangleAlleles(
      systemName, geneConstraints, tierOverride, speciesGenes
    );
    if (alleles) {
      for (const [geneName, allelePair] of Object.entries(alleles)) {
        genotype[geneName] = allelePair;
        triangleGenes.add(geneName);
      }
    }
  }

  // Then generate all remaining genes (non-triangle)
  for (const [name, def] of Object.entries(GENE_DEFS)) {
    if (triangleGenes.has(name)) continue;

    // Species genes: hard-set, no randomization
    if (speciesGenes[name]) {
      genotype[name] = [...speciesGenes[name]];
      continue;
    }

    // Constrained genes: use restricted range
    const constraint = geneConstraints[name];
    if (constraint) {
      genotype[name] = [
        randomInt(constraint.min, constraint.max),
        randomInt(constraint.min, constraint.max),
      ];
      continue;
    }

    // Unconstrained: normal random generation
    const weights = RANDOM_ALLELE_WEIGHTS[name] || null;
    genotype[name] = [
      weightedRandomInt(def.min, def.max, weights),
      weightedRandomInt(def.min, def.max, weights),
    ];
  }

  // Enforce subordination: primary color/breath always dominant
  if (subordination) {
    enforceSubordination(genotype, subordination);
  }

  return genotype;
}

// Create a fully random genotype (all 23 genes with random allele pairs)
// Triangle system genes use tier-based rarity control
// All other genes use uniform random (or per-gene weights if defined)
export function createRandomGenotype() {
  const genotype = {};

  // First, generate triangle system axes with controlled rarity
  const triangleGenes = new Set();
  for (const [systemName, def] of Object.entries(TRIANGLE_DEFS)) {
    const alleles = generateTriangleAlleles(systemName);
    if (alleles) {
      for (const [geneName, allelePair] of Object.entries(alleles)) {
        genotype[geneName] = allelePair;
        triangleGenes.add(geneName);
      }
    }
  }

  // Then generate all remaining genes (non-triangle)
  for (const [name, def] of Object.entries(GENE_DEFS)) {
    if (triangleGenes.has(name)) continue; // already generated
    const weights = RANDOM_ALLELE_WEIGHTS[name] || null;
    genotype[name] = [
      weightedRandomInt(def.min, def.max, weights),
      weightedRandomInt(def.min, def.max, weights),
    ];
  }

  return genotype;
}

// Determine sex: males = XX, females = XY (reversed from humans)
// For Phase 1, this is cosmetic — no sex-linked traits yet
export function determineSex() {
  return Math.random() < 0.5 ? 'male' : 'female';
}

// Apply mutation to a single allele value
// Returns { value, mutated }
// mutationRate override allows potions/skills to adjust mutation chance
function mutateAllele(value, geneName, mutationRate = MUTATION_RATE) {
  if (Math.random() >= mutationRate) {
    return { value, mutated: false };
  }
  const def = GENE_DEFS[geneName];
  const direction = Math.random() < 0.5 ? -1 : 1;
  const newValue = Math.max(def.min, Math.min(def.max, value + direction));
  return { value: newValue, mutated: newValue !== value };
}

// Perform meiosis for a single gene: pick one allele from each parent
// Returns alleles, mutations, and which allele index was selected from each parent
// Options:
//   mutationRate: override per-allele mutation chance
//   biasDominant: if true, prefer higher allele values from each parent
//   biasRecessive: if true, prefer lower allele values from each parent
function meiosisOneGene(parentA_alleles, parentB_alleles, geneName, options = {}) {
  const { mutationRate = MUTATION_RATE, biasDominant, biasRecessive } = options;

  let idxA, idxB;

  if (biasDominant) {
    // Pick the higher allele from each parent (70% chance)
    idxA = parentA_alleles[0] >= parentA_alleles[1] ? 0 : 1;
    idxB = parentB_alleles[0] >= parentB_alleles[1] ? 0 : 1;
    // 30% chance to pick the other allele instead
    if (Math.random() < 0.3) idxA = 1 - idxA;
    if (Math.random() < 0.3) idxB = 1 - idxB;
  } else if (biasRecessive) {
    // Pick the lower allele from each parent (70% chance)
    idxA = parentA_alleles[0] <= parentA_alleles[1] ? 0 : 1;
    idxB = parentB_alleles[0] <= parentB_alleles[1] ? 0 : 1;
    if (Math.random() < 0.3) idxA = 1 - idxA;
    if (Math.random() < 0.3) idxB = 1 - idxB;
  } else {
    idxA = Math.random() < 0.5 ? 0 : 1;
    idxB = Math.random() < 0.5 ? 0 : 1;
  }

  const fromA = parentA_alleles[idxA];
  const fromB = parentB_alleles[idxB];

  const mutA = mutateAllele(fromA, geneName, mutationRate);
  const mutB = mutateAllele(fromB, geneName, mutationRate);

  return {
    alleles: [mutA.value, mutB.value],
    mutations: [mutA.mutated, mutB.mutated],
    // Track which parent contributed which allele:
    // alleles[0] came from parent A, alleles[1] came from parent B
    origins: ['A', 'B'],
  };
}

// Breed two parents: produce a single offspring genotype
// Returns { genotype, mutations, alleleOrigins }
// alleleOrigins: { geneName: ['A', 'B'] } — alleleOrigins[gene][0] is the origin of alleles[0]
// modifiers: optional { mutationRate, biasDominant, biasRecessive, biasGenes (Set of gene names to apply bias to) }
function breedOneOffspring(parentA_genotype, parentB_genotype, modifiers = {}) {
  const genotype = {};
  const mutations = [];
  const alleleOrigins = {};

  const {
    mutationRate = MUTATION_RATE,
    biasDominant = false,
    biasRecessive = false,
    biasGenes = null, // Set of gene names — if null, bias applies to ALL genes
  } = modifiers;

  for (const geneName of Object.keys(GENE_DEFS)) {
    // Check if this gene should get bias applied
    const applyBias = biasGenes === null || biasGenes.has(geneName);

    const result = meiosisOneGene(
      parentA_genotype[geneName],
      parentB_genotype[geneName],
      geneName,
      {
        mutationRate,
        biasDominant: applyBias && biasDominant,
        biasRecessive: applyBias && biasRecessive,
      },
    );
    genotype[geneName] = result.alleles;
    alleleOrigins[geneName] = result.origins;
    if (result.mutations[0] || result.mutations[1]) {
      mutations.push(geneName);
    }
  }

  return { genotype, mutations, alleleOrigins };
}

// Breed two parents: produce a clutch of 2-4 offspring
// Returns array of { genotype, sex, mutations, alleleOrigins }
// modifiers: optional {
//   clutchBonus: extra eggs on top of base clutch size,
//   mutationRate: override mutation rate,
//   biasDominant, biasRecessive: allele selection bias,
//   biasGenes: Set of gene names to restrict bias to,
//   suppressMutations: if true, force mutation rate to 0,
// }
export function breedDragons(parentA_genotype, parentB_genotype, modifiers = {}) {
  const clutchBonus = modifiers.clutchBonus || 0;
  const clutchSize = randomInt(CLUTCH_SIZE_MIN, CLUTCH_SIZE_MAX) + clutchBonus;

  // Build meiosis modifiers
  let mutationRate = modifiers.mutationRate ?? MUTATION_RATE;
  if (modifiers.suppressMutations) mutationRate = 0;

  const meiosisModifiers = {
    mutationRate,
    biasDominant: modifiers.biasDominant || false,
    biasRecessive: modifiers.biasRecessive || false,
    biasGenes: modifiers.biasGenes || null,
  };

  const offspring = [];

  for (let i = 0; i < clutchSize; i++) {
    const { genotype, mutations, alleleOrigins } = breedOneOffspring(
      parentA_genotype, parentB_genotype, meiosisModifiers
    );
    offspring.push({
      genotype,
      sex: determineSex(),
      mutations,
      alleleOrigins,
    });
  }

  return offspring;
}
