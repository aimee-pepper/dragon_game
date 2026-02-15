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
function mutateAllele(value, geneName) {
  if (Math.random() >= MUTATION_RATE) {
    return { value, mutated: false };
  }
  const def = GENE_DEFS[geneName];
  const direction = Math.random() < 0.5 ? -1 : 1;
  const newValue = Math.max(def.min, Math.min(def.max, value + direction));
  return { value: newValue, mutated: newValue !== value };
}

// Perform meiosis for a single gene: pick one allele from each parent
// Returns alleles, mutations, and which allele index was selected from each parent
function meiosisOneGene(parentA_alleles, parentB_alleles, geneName) {
  const idxA = Math.random() < 0.5 ? 0 : 1;
  const idxB = Math.random() < 0.5 ? 0 : 1;
  const fromA = parentA_alleles[idxA];
  const fromB = parentB_alleles[idxB];

  const mutA = mutateAllele(fromA, geneName);
  const mutB = mutateAllele(fromB, geneName);

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
function breedOneOffspring(parentA_genotype, parentB_genotype) {
  const genotype = {};
  const mutations = [];
  const alleleOrigins = {};

  for (const geneName of Object.keys(GENE_DEFS)) {
    const result = meiosisOneGene(
      parentA_genotype[geneName],
      parentB_genotype[geneName],
      geneName,
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
export function breedDragons(parentA_genotype, parentB_genotype) {
  const clutchSize = randomInt(CLUTCH_SIZE_MIN, CLUTCH_SIZE_MAX);
  const offspring = [];

  for (let i = 0; i < clutchSize; i++) {
    const { genotype, mutations, alleleOrigins } = breedOneOffspring(parentA_genotype, parentB_genotype);
    offspring.push({
      genotype,
      sex: determineSex(),
      mutations,
      alleleOrigins,
    });
  }

  return offspring;
}
