// Dragon class: wraps genotype + phenotype + metadata
import { createRandomGenotype, breedDragons, determineSex } from './genetics-engine.js';
import { resolveFullPhenotype } from './phenotype-resolver.js';

let nextId = 1;

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
  constructor({ genotype, sex, name, parentIds, mutations, alleleOrigins, generation }) {
    this.id = nextId++;
    this.genotype = genotype || createRandomGenotype();
    this.sex = sex || determineSex();
    this.name = name || generateName();
    this.parentIds = parentIds || null;
    this.mutations = mutations || [];
    this.alleleOrigins = alleleOrigins || null; // { geneName: ['A', 'B'] } — null for wild/random dragons
    this.generation = generation ?? 0; // 0 for wild/random, increments with breeding
    this.phenotype = resolveFullPhenotype(this.genotype);
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
