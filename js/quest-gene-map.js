// Maps quest requirement paths to the genotype gene names they involve.
// Used to highlight relevant genes in the genotype section when a quest is active.
import { GENE_DEFS, COLOR_NAMES, FINISH_NAMES, ELEMENT_NAMES } from './gene-config.js';

// Mapping: requirement.path → array of gene names in dragon.genotype
const PATH_TO_GENES = {
  // Color system (triangle: CMY)
  'color.displayName': ['color_cyan', 'color_magenta', 'color_yellow'],

  // Finish system (triangle: O/Sh/Sc)
  'finish.displayName': ['finish_opacity', 'finish_shine', 'finish_schiller'],

  // Breath element system (triangle: F/I/L)
  'breathElement.displayName': ['breath_fire', 'breath_ice', 'breath_lightning'],

  // Specialty combos require specific color + finish combos (all 6 triangle genes)
  'color.specialtyName': [
    'color_cyan', 'color_magenta', 'color_yellow',
    'finish_opacity', 'finish_shine', 'finish_schiller',
  ],

  // Modifier prefix requires specific finish + element combos (all 6 triangle genes)
  'color.modifierPrefix': [
    'finish_opacity', 'finish_shine', 'finish_schiller',
    'breath_fire', 'breath_ice', 'breath_lightning',
  ],

  // Simple traits — one gene each
  'traits.body_size.name': ['body_size'],
  'traits.body_type.name': ['body_type'],
  'traits.body_scales.name': ['body_scales'],
  'traits.frame_wings.name': ['frame_wings'],
  'traits.frame_limbs.name': ['frame_limbs'],
  'traits.frame_bones.name': ['frame_bones'],
  'traits.breath_shape.name': ['breath_shape'],
  'traits.breath_range.name': ['breath_range'],
  'traits.horn_style.name': ['horn_style'],
  'traits.horn_direction.name': ['horn_direction'],
  'traits.spine_style.name': ['spine_style'],
  'traits.spine_height.name': ['spine_height'],
  'traits.tail_shape.name': ['tail_shape'],
  'traits.tail_length.name': ['tail_length'],
};

// Simple trait paths: requirement.path → gene name
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

// Build reverse lookups for triangle name tables
function buildReverseLookup(namesTable) {
  const m = {};
  for (const [key, name] of Object.entries(namesTable)) m[name] = key;
  return m;
}
const COLOR_KEY = buildReverseLookup(COLOR_NAMES);
const FINISH_KEY = buildReverseLookup(FINISH_NAMES);
const ELEMENT_KEY = buildReverseLookup(ELEMENT_NAMES);

// Triangle axis level names (0-3)
const TIER_LABELS = ['None', 'Low', 'Mid', 'High'];

const TRIANGLE_PATHS = {
  'color.displayName': { axes: ['color_cyan', 'color_magenta', 'color_yellow'], lookup: COLOR_KEY },
  'finish.displayName': { axes: ['finish_opacity', 'finish_shine', 'finish_schiller'], lookup: FINISH_KEY },
  'breathElement.displayName': { axes: ['breath_fire', 'breath_ice', 'breath_lightning'], lookup: ELEMENT_KEY },
};

/**
 * Given a quest object, return a Set of all gene names that are relevant
 * to the quest's requirements.
 */
export function getGenesForQuest(quest) {
  const genes = new Set();
  if (!quest || !quest.requirements) return genes;

  for (const req of quest.requirements) {
    const mapped = PATH_TO_GENES[req.path];
    if (mapped) {
      for (const g of mapped) genes.add(g);
    }
  }
  return genes;
}

/**
 * Given a quest, return a Map<geneName, Set<alleleLabel>> of the specific
 * allele labels the quest desires. Used to bold individual alleles in the
 * genotype view.
 *
 * For simple traits: maps gene → set of phenotypeMap label strings that match
 *   e.g. frame_limbs → Set(['Wyvern (2)'])
 * For triangle axes: maps gene → set of tier label strings
 *   e.g. color_cyan → Set(['Mid']), color_magenta → Set(['High'])
 */
export function getDesiredAllelesForQuest(quest) {
  const result = new Map();
  if (!quest || !quest.requirements) return result;

  for (const req of quest.requirements) {
    // Simple traits
    const simpleGene = SIMPLE_PATHS[req.path];
    if (simpleGene) {
      const def = GENE_DEFS[simpleGene];
      if (def && def.phenotypeMap) {
        // Find which allele value(s) produce the quest target
        for (const [alleleStr, name] of Object.entries(def.phenotypeMap)) {
          if (name === req.value) {
            if (!result.has(simpleGene)) result.set(simpleGene, new Set());
            result.get(simpleGene).add(name);
          }
        }
      }
      continue;
    }

    // Triangle systems
    const triangleDef = TRIANGLE_PATHS[req.path];
    if (triangleDef) {
      const keyStr = triangleDef.lookup[req.value];
      if (!keyStr) continue;
      const targetTiers = keyStr.split('-').map(Number);
      for (let i = 0; i < triangleDef.axes.length; i++) {
        const geneName = triangleDef.axes[i];
        const tierLabel = TIER_LABELS[targetTiers[i]];
        if (tierLabel) {
          if (!result.has(geneName)) result.set(geneName, new Set());
          result.get(geneName).add(tierLabel);
        }
      }
      continue;
    }

    // Specialty: decompose into color + finish axis targets
    if (req.path === 'color.specialtyName' && req.hintColor && req.hintFinish) {
      // Parse hintColor "C: Mid · M: High · Y: None" → per-axis tier labels
      parseAxisHintIntoResult(req.hintColor, ['color_cyan', 'color_magenta', 'color_yellow'], result);
      parseAxisHintIntoResult(req.hintFinish, ['finish_opacity', 'finish_shine', 'finish_schiller'], result);
      continue;
    }

    // Modifier: decompose into finish + element axis targets
    if (req.path === 'color.modifierPrefix' && req.hintFinish && req.hintElement) {
      parseAxisHintIntoResult(req.hintFinish, ['finish_opacity', 'finish_shine', 'finish_schiller'], result);
      parseAxisHintIntoResult(req.hintElement, ['breath_fire', 'breath_ice', 'breath_lightning'], result);
      continue;
    }
  }
  return result;
}

// Parse "C: Mid · M: High · Y: None" into gene→alleleLabel entries in result map
function parseAxisHintIntoResult(hintStr, geneNames, result) {
  const parts = hintStr.split(' · ');
  for (let i = 0; i < parts.length && i < geneNames.length; i++) {
    const colonIdx = parts[i].indexOf(':');
    if (colonIdx < 0) continue;
    const tierLabel = parts[i].slice(colonIdx + 1).trim();
    if (tierLabel && TIER_LABELS.includes(tierLabel)) {
      if (!result.has(geneNames[i])) result.set(geneNames[i], new Set());
      result.get(geneNames[i]).add(tierLabel);
    }
  }
}
