// Dragon class: wraps genotype + phenotype + metadata
import { createRandomGenotype, breedDragons, determineSex } from './genetics-engine.js';
import { resolveFullPhenotype } from './phenotype-resolver.js';
import { GENE_DEFS } from './gene-config.js';

let nextId = 1;

// ID counter accessors for save/load
export function getNextDragonId() { return nextId; }
export function setNextDragonId(val) { nextId = val; }

// Random dragon name generator
const NAME_PREFIXES = [
  'Ash', 'Blaze', 'Cinder', 'Drake', 'Ember', 'Fang', 'Grim', 'Hex',
  'Iron', 'Jade', 'Ky', 'Luna', 'Nyx', 'Onyx', 'Pyra', 'Rune',
  'Shadow', 'Thorn', 'Umber', 'Volt', 'Wrath', 'Zeph', 'Dra', 'Syl',
  'Gor', 'Mal', 'Vor', 'Tar', 'Sol', 'Rav', 'Mor', 'Fel',
];

const NAME_SUFFIXES = [
  'ax', 'born', 'claw', 'don', 'ex', 'fyr', 'gon', 'hawk',
  'is', 'jaw', 'kor', 'lyn', 'mir', 'nar', 'os', 'pyre',
  'rix', 'storm', 'tus', 'us', 'vex', 'wing', 'xis', 'zar',
  'ra', 'ka', 'th', 'rok', 'nia', 'sha', 'ven', 'dal',
];

function generateName() {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  return prefix + suffix;
}

export class Dragon {
  constructor({ genotype, sex, name, parentIds, mutations, alleleOrigins, generation, id, isDarkEnergy, revealedGenes }) {
    // If an explicit id is provided (from save data), use it without incrementing
    this.id = id != null ? id : nextId++;
    this.genotype = genotype || createRandomGenotype();
    this.sex = sex || determineSex();
    this.name = name || generateName();
    this.parentIds = parentIds || null;
    this.mutations = mutations || [];
    this.alleleOrigins = alleleOrigins || null; // { geneName: ['A', 'B'] } — null for wild/random dragons
    this.generation = generation ?? 0; // 0 for wild/random, increments with breeding
    this.revealedGenes = revealedGenes || {}; // { geneName: 'partial' | 'full' }
    this.phenotype = resolveFullPhenotype(this.genotype);

    // Auto-reveal genes at extreme phenotype values.
    // For linear genes: if the phenotype equals the gene's min or max, both alleles
    // MUST be at that extreme (no blend of two different alleles can produce the
    // min or max after averaging + rounding). So the genotype is unambiguous.
    this._autoRevealExtremes();

    // Override Dark Energy if explicitly set (from save data)
    // Dark Energy is a random 5% roll — not deterministic from genotype — so we must persist it
    if (isDarkEnergy && this.phenotype.breathElement) {
      this.phenotype.breathElement.isDarkEnergy = true;
      this.phenotype.breathElement.displayName = 'Dark Energy';
      this.phenotype.breathElement.desc = 'An unstable void energy that consumes light itself.';
    }
    this.isDarkEnergy = this.phenotype.breathElement?.isDarkEnergy || false;
  }

  // Serialize to a plain object for localStorage
  toSaveData() {
    return {
      id: this.id,
      genotype: this.genotype,
      sex: this.sex,
      name: this.name,
      parentIds: this.parentIds,
      mutations: this.mutations,
      alleleOrigins: this.alleleOrigins,
      generation: this.generation,
      isDarkEnergy: this.isDarkEnergy,
      revealedGenes: this.revealedGenes,
    };
  }

  // Restore a dragon from save data — recomputes phenotype from genotype
  static fromSaveData(data) {
    // Migrate old 'peek' reveal values → 'partial' (renamed to avoid conflict with spell names)
    const reveals = data.revealedGenes || {};
    for (const key of Object.keys(reveals)) {
      if (reveals[key] === 'peek') reveals[key] = 'partial';
    }
    return new Dragon({
      id: data.id,
      genotype: data.genotype,
      sex: data.sex,
      name: data.name,
      parentIds: data.parentIds,
      mutations: data.mutations || [],
      alleleOrigins: data.alleleOrigins || null,
      generation: data.generation ?? 0,
      isDarkEnergy: data.isDarkEnergy || false,
      revealedGenes: reveals,
    });
  }

  // Create a random wild dragon
  static createRandom() {
    return new Dragon({
      genotype: createRandomGenotype(),
      sex: determineSex(),
    });
  }

  // ── Gene reveal helpers ──────────────────────────────────

  /** Reveal a gene at a given level ('partial' = one allele, 'full' = both) */
  revealGene(geneName, level) {
    const current = this.revealedGenes[geneName];
    // Only upgrade: partial → full, never downgrade
    if (current === 'full') return;
    if (level === 'partial' && current === 'partial') return;
    this.revealedGenes[geneName] = level;
  }

  /** Check if a gene is revealed. Returns 'partial' | 'full' | null */
  isGeneRevealed(geneName) {
    return this.revealedGenes[geneName] || null;
  }

  /** Count of revealed genes */
  getRevealedCount() {
    return Object.keys(this.revealedGenes).length;
  }

  /**
   * Auto-reveal genes whose displayed phenotype can only result from one
   * specific allele combination — making the genotype unambiguously deducible.
   *
   * For linear genes (phenotype = Math.round((a+b)/2)):
   *
   * MIN extreme: phenotype = min requires (a+b)/2 < min+0.5, i.e. a+b < 2*min+1.
   *   Since a >= min and b >= min, the only solution is a = b = min.
   *   → Seeing "Bird" (body_size min=1) guarantees both alleles are 1.
   *   → Reveal level: 'full' (both alleles known to be min).
   *
   * MAX extreme: phenotype = max when (a+b)/2 >= max-0.5, i.e. a+b >= 2*max-1.
   *   Both [max,max] AND [max-1,max] satisfy this. We KNOW at least one allele
   *   is max (because [max-1,max-1] averages to max-1, not max), but the second
   *   allele is ambiguous.
   *   → Seeing "Mega" means at least one allele is 6, but could be [5,6] or [6,6].
   *   → Reveal level: 'partial' (one allele known to be max, other unknown).
   */
  _autoRevealExtremes() {
    for (const [geneName, def] of Object.entries(GENE_DEFS)) {
      if (def.inheritanceType !== 'linear') continue;
      if (this.revealedGenes[geneName] === 'full') continue;

      const pair = this.genotype[geneName];
      if (!pair) continue;

      // Triangle system genes (CMY, Finish, Element): edge alleles → partial only.
      // An allele at 0 or max (3) can't result from blending, so it's deducible.
      // Always partial (show one allele) — never full, even if both are the same edge.
      if (def.system === 'triangle') {
        if (this.revealedGenes[geneName] !== 'partial' &&
            (pair[0] === def.min || pair[1] === def.min ||
             pair[0] === def.max || pair[1] === def.max)) {
          this.revealedGenes[geneName] = 'partial';
        }
        continue;
      }

      // Non-triangle linear genes: existing logic
      // MIN extreme: both alleles must be min → fully revealed
      if (pair[0] === def.min && pair[1] === def.min) {
        this.revealedGenes[geneName] = 'full';
      }
      // MAX extreme: at least one allele must be max → partial revealed
      else if (this.revealedGenes[geneName] !== 'partial' &&
               (pair[0] === def.max || pair[1] === def.max) &&
               Math.round((pair[0] + pair[1]) / 2) === def.max) {
        this.revealedGenes[geneName] = 'partial';
      }
    }
  }

  // Breed two dragons, returning an array of offspring Dragon instances
  static breed(parentA, parentB, modifiers = {}) {
    const offspringData = breedDragons(parentA.genotype, parentB.genotype, modifiers);
    const childGeneration = Math.max(parentA.generation, parentB.generation) + 1;
    return offspringData.map(data => new Dragon({
      genotype: data.genotype,
      sex: data.sex,
      mutations: data.mutations,
      alleleOrigins: data.alleleOrigins,
      parentIds: [parentA.id, parentB.id],
      generation: childGeneration,
    }));
  }
}
