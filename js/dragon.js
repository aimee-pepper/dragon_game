// Dragon class: wraps genotype + phenotype + metadata
import { createRandomGenotype, breedDragons, determineSex } from './genetics-engine.js';
import { resolveFullPhenotype } from './phenotype-resolver.js';

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
  constructor({ genotype, sex, name, parentIds, mutations, alleleOrigins, generation, id, isDarkEnergy }) {
    // If an explicit id is provided (from save data), use it without incrementing
    this.id = id != null ? id : nextId++;
    this.genotype = genotype || createRandomGenotype();
    this.sex = sex || determineSex();
    this.name = name || generateName();
    this.parentIds = parentIds || null;
    this.mutations = mutations || [];
    this.alleleOrigins = alleleOrigins || null; // { geneName: ['A', 'B'] } — null for wild/random dragons
    this.generation = generation ?? 0; // 0 for wild/random, increments with breeding
    this.phenotype = resolveFullPhenotype(this.genotype);

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
    };
  }

  // Restore a dragon from save data — recomputes phenotype from genotype
  static fromSaveData(data) {
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
    });
  }

  // Create a random wild dragon
  static createRandom() {
    return new Dragon({
      genotype: createRandomGenotype(),
      sex: determineSex(),
    });
  }

  // Breed two dragons, returning an array of offspring Dragon instances
  static breed(parentA, parentB) {
    const offspringData = breedDragons(parentA.genotype, parentB.genotype);
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
