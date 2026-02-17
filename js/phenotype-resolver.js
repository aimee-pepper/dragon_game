// Phenotype resolver: converts raw genotype numbers into readable traits and visual values
import {
  GENE_DEFS,
  TRIANGLE_DEFS,
  COLOR_PHENOTYPES,
  FINISH_PHENOTYPES,
  BREATH_ELEMENT_PHENOTYPES,
  getColorShade,
  getCMYLevelName,
  cmyToRGB,
  rgbToHex,
  getColorNameFromRGB,
  getFinishDisplayName,
  getFinishDescription,
  getBreathLevelName,
  getBreathDisplayName,
  getBreathDescription,
  RECESSIVE_PULL_STRENGTH,
  DARK_ENERGY_CHANCE,
  DARK_ENERGY_PHENOTYPE,
} from './gene-config.js';

// Resolve a linear trait: average both alleles, round to nearest valid value
function resolveLinear(allelePair, geneName) {
  const avg = (allelePair[0] + allelePair[1]) / 2;
  const rounded = Math.round(avg);
  const def = GENE_DEFS[geneName];
  const name = def.phenotypeMap ? def.phenotypeMap[rounded] : String(rounded);
  return { level: avg, rounded, name };
}

// Resolve a categorical trait: higher value is dominant (placeholder)
function resolveCategorical(allelePair, geneName) {
  const expressed = Math.max(allelePair[0], allelePair[1]);
  const def = GENE_DEFS[geneName];
  const name = def.phenotypeMap[expressed];
  return { level: expressed, name };
}

// Classify a triangle axis level as High or Low
function classifyTriangleLevel(level) {
  return level >= 1.5 ? 'H' : 'L';
}

// Resolve a single triangle axis to its averaged level
function resolveTriangleAxis(allelePair) {
  return (allelePair[0] + allelePair[1]) / 2;
}

// Recessive axis resolver: pulls heterozygous extremes toward center
// Homozygous extremes ([0,0] or [3,3]) express normally (spread=0)
// Heterozygous pairs get pulled toward 1.5, making H/L harder to achieve
function resolveTriangleAxisRecessive(allelePair) {
  const avg = (allelePair[0] + allelePair[1]) / 2;
  const spread = Math.abs(allelePair[0] - allelePair[1]);
  const center = 1.5;
  // Pull toward center proportional to spread and pull strength
  return avg + (center - avg) * (spread / 3) * RECESSIVE_PULL_STRENGTH;
}

// Get the phenotype lookup map for a triangle system
function getTriangleLookup(systemName) {
  switch (systemName) {
    case 'color': return COLOR_PHENOTYPES;
    case 'finish': return FINISH_PHENOTYPES;
    case 'breathElement': return BREATH_ELEMENT_PHENOTYPES;
    default: return {};
  }
}

// Resolve a full triangle system (3 axes → named phenotype)
function resolveTriangle(genotype, systemName) {
  const def = TRIANGLE_DEFS[systemName];
  const resolveAxis = def.recessiveExtremes ? resolveTriangleAxisRecessive : resolveTriangleAxis;
  const levels = def.axes.map(axis => resolveAxis(genotype[axis]));
  const key = levels.map(l => classifyTriangleLevel(l)).join('-');
  const lookup = getTriangleLookup(systemName);
  const phenotype = lookup[key] || { name: 'Unknown' };
  return {
    levels,
    key,
    ...phenotype,
  };
}

// Resolve the CMY color system with RGB-based naming and computed RGB
function resolveColor(genotype) {
  const base = resolveTriangle(genotype, 'color');
  const [cLevel, mLevel, yLevel] = base.levels;

  // Compute continuous RGB for the visual swatch
  const rgb = cmyToRGB(cLevel, mLevel, yLevel);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  // Derive color name from actual RGB using HSL hue analysis
  // This ensures the name always matches the visual appearance
  const displayName = getColorNameFromRGB(rgb.r, rgb.g, rgb.b);

  // Build CMY breakdown for display: "C: High · M: None · Y: Mid"
  const cmyBreakdown = {
    c: getCMYLevelName(cLevel),
    m: getCMYLevelName(mLevel),
    y: getCMYLevelName(yLevel),
  };

  return {
    ...base,
    displayName,
    cmyBreakdown,
    rgb,
    hex,
  };
}

// Resolve the Finish triangle system with rich display name
function resolveFinish(genotype) {
  const base = resolveTriangle(genotype, 'finish');
  const [opacityLevel, shineLevel, schillerLevel] = base.levels;

  // Rich descriptive name from continuous levels (like color naming from RGB)
  const displayName = getFinishDisplayName(opacityLevel, shineLevel, schillerLevel);
  const desc = getFinishDescription(opacityLevel, shineLevel, schillerLevel);

  return {
    ...base,
    displayName,
    desc,
  };
}

// Resolve the Breath Element triangle system with rich display name
function resolveBreathElement(genotype) {
  const base = resolveTriangle(genotype, 'breathElement');
  const [fireLevel, iceLevel, lightningLevel] = base.levels;

  // Rich descriptive name from continuous levels (like color/finish naming)
  const displayName = getBreathDisplayName(fireLevel, iceLevel, lightningLevel);

  // Axis breakdown for display: "F: High · I: None · L: Low"
  const breathBreakdown = {
    f: getBreathLevelName(fireLevel),
    i: getBreathLevelName(iceLevel),
    l: getBreathLevelName(lightningLevel),
  };

  const desc = getBreathDescription(fireLevel, iceLevel, lightningLevel);

  // Dark Energy: rare variant of Null breath (5% chance)
  let isDarkEnergy = false;
  if (base.key === 'L-L-L' && Math.random() < DARK_ENERGY_CHANCE) {
    isDarkEnergy = true;
  }

  return {
    ...base,
    displayName: isDarkEnergy ? DARK_ENERGY_PHENOTYPE.name : displayName,
    isDarkEnergy,
    breathBreakdown,
    desc: isDarkEnergy ? DARK_ENERGY_PHENOTYPE.desc : desc,
  };
}

// Resolve the full phenotype for a genotype
export function resolveFullPhenotype(genotype) {
  const phenotype = {
    // Main system traits
    traits: {},
    // Triangle system results
    color: null,
    finish: null,
    breathElement: null,
  };

  // Resolve all individual traits
  for (const [geneName, def] of Object.entries(GENE_DEFS)) {
    // Skip triangle axes — they're resolved as systems
    if (def.system === 'triangle') continue;

    if (def.inheritanceType === 'linear') {
      phenotype.traits[geneName] = resolveLinear(genotype[geneName], geneName);
    } else if (def.inheritanceType === 'categorical') {
      phenotype.traits[geneName] = resolveCategorical(genotype[geneName], geneName);
    }
  }

  // Resolve triangle systems
  phenotype.color = resolveColor(genotype);
  phenotype.finish = resolveFinish(genotype);
  phenotype.breathElement = resolveBreathElement(genotype);

  return phenotype;
}
