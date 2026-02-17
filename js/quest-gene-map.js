// Maps quest requirement paths to the genotype gene names they involve.
// Used to highlight relevant genes in the genotype section when a quest is active.

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
