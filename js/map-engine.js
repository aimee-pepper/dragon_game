// ============================================================
// Map engine — unlock tracking, encounter logic, state persistence
// ============================================================
// Supports encounters at three levels:
//   Region    — Tier 1 only (color + breath, everything else random)
//   Territory — Tier 1 + 2 (adds body/frame constraints)
//   Habitat   — Tier 1 + 2 + 3 (adds finish, features, scales, species)

import {
  REGIONS, TERRITORIES, HABITATS, STARTER_REGION,
  TERRITORY_UNLOCK_VISITS, HABITAT_UNLOCK_VISITS,
  buildConstraintsForRegion, buildConstraintsForTerritory, buildConstraintsForHabitat,
} from './map-config.js';
import { createConstrainedGenotype, createRandomGenotype } from './genetics-engine.js';
import { GENE_DEFS } from './gene-config.js';
import { Dragon } from './dragon.js';
import { getSetting } from './settings.js';
import { getStats, addToStat } from './save-manager.js';

// ── State ────────────────────────────────────────────────────

let unlockedRegions = new Set(Object.keys(REGIONS));
let unlockedTerritories = new Set();
let unlockedHabitats = new Set();
let traitDiscoveries = new Set(); // IDs unlocked via trait observation (for achievements)
let explorationLog = {};  // { zoneId: { visits: 0, speciesFound: [], observedTraits: {} } }

// ── Region unlock ────────────────────────────────────────────

export function isRegionUnlocked(regionId) {
  if (getSetting('debug-unlock-all-zones')) return true;
  return unlockedRegions.has(regionId);
}

export function getUnlockedRegions() {
  if (getSetting('debug-unlock-all-zones')) return Object.keys(REGIONS);
  return [...unlockedRegions];
}

/**
 * Attempt to unlock a region. Returns { success, reason? }
 */
export function unlockRegion(regionId) {
  const region = REGIONS[regionId];
  if (!region) return { success: false, reason: 'Region not found' };
  if (unlockedRegions.has(regionId)) return { success: false, reason: 'Already unlocked' };

  const cost = region.unlockCost || {};
  const stats = getStats();

  if (cost.rep && stats.rep < cost.rep) {
    return { success: false, reason: `Need ${cost.rep} reputation (have ${stats.rep})` };
  }
  if (cost.gold && stats.gold < cost.gold) {
    return { success: false, reason: `Need ${cost.gold} gold (have ${stats.gold})` };
  }

  if (cost.rep) addToStat('rep', -cost.rep);
  if (cost.gold) addToStat('gold', -cost.gold);

  unlockedRegions.add(regionId);
  return { success: true };
}

// ── Territory / Habitat unlock ──────────────────────────────

export function isTerritoryUnlocked(territoryId) {
  if (getSetting('debug-unlock-all-zones')) return true;
  return unlockedTerritories.has(territoryId);
}

export function isHabitatUnlocked(habitatId) {
  if (getSetting('debug-unlock-all-zones')) return true;
  return unlockedHabitats.has(habitatId);
}

export function getTraitDiscoveries() {
  return new Set(traitDiscoveries);
}

/**
 * Get discovery progress for a locked territory (called by UI for progress hints).
 */
export function getTerritoryDiscoveryProgress(regionId, territoryId) {
  const log = explorationLog[regionId];
  const territory = TERRITORIES[territoryId];
  if (!territory) return { covered: 0, total: 0, visits: 0, visitsNeeded: TERRITORY_UNLOCK_VISITS };

  const genes = Object.entries(territory.geneConstraints);
  let covered = 0;

  if (log && log.observedTraits) {
    for (const [gene, range] of genes) {
      const observed = log.observedTraits[gene] || [];
      if (observed.some(v => v >= range.min && v <= range.max)) covered++;
    }
  }

  return {
    covered,
    total: genes.length,
    visits: log?.visits || 0,
    visitsNeeded: TERRITORY_UNLOCK_VISITS,
  };
}

/**
 * Get discovery progress for a locked habitat.
 */
export function getHabitatDiscoveryProgress(territoryId, habitatId) {
  const log = explorationLog[territoryId];
  const habitat = HABITATS[habitatId];
  if (!habitat) return { covered: 0, total: 0, visits: 0, visitsNeeded: HABITAT_UNLOCK_VISITS };

  const genes = Object.entries(habitat.geneConstraints);
  let covered = 0;

  if (log && log.observedTraits) {
    for (const [gene, range] of genes) {
      const observed = log.observedTraits[gene] || [];
      if (observed.some(v => v >= range.min && v <= range.max)) covered++;
    }
  }

  return {
    covered,
    total: genes.length,
    visits: log?.visits || 0,
    visitsNeeded: HABITAT_UNLOCK_VISITS,
  };
}

// ── Encounter: Region level (Tier 1 only) ────────────────────

/**
 * Generate a dragon using only region-level constraints (color + breath).
 * Body, frame, finish, features are all random.
 */
export function encounterAtRegion(regionId) {
  const built = buildConstraintsForRegion(regionId);
  if (!built) return null;

  trackVisit(regionId);

  const roll = 'common'; // region encounters are always common
  const genotype = createConstrainedGenotype({
    geneConstraints: built.geneConstraints,
    triangleOverrides: built.triangleOverrides,
    subordination: built.subordination,
  });

  // Track observed traits and check for territory unlocks
  trackObservedTraits(regionId, genotype);
  const newlyUnlocked = checkTerritoryUnlocks(regionId);

  const dragon = Dragon.fromConstrained(genotype, {
    habitatId: null,
    encounterType: roll,
    encounterLevel: 'region',
    encounterZoneId: regionId,
    encounterZoneName: REGIONS[regionId].name,
  });

  if (newlyUnlocked.length > 0) {
    dragon._newlyUnlockedZones = newlyUnlocked;
  }

  return dragon;
}

// ── Encounter: Territory level (Tier 1 + 2) ──────────────────

/**
 * Generate a dragon using region + territory constraints.
 * Finish, features, scales are random.
 */
export function encounterAtTerritory(territoryId) {
  const built = buildConstraintsForTerritory(territoryId);
  if (!built) return null;

  trackVisit(territoryId);

  const roll = 'common'; // territory encounters are always common
  const genotype = createConstrainedGenotype({
    geneConstraints: built.geneConstraints,
    triangleOverrides: built.triangleOverrides,
    subordination: built.subordination,
  });

  // Track observed traits and check for habitat unlocks
  trackObservedTraits(territoryId, genotype);
  const newlyUnlocked = checkHabitatUnlocks(territoryId);

  const dragon = Dragon.fromConstrained(genotype, {
    habitatId: null,
    encounterType: roll,
    encounterLevel: 'territory',
    encounterZoneId: territoryId,
    encounterZoneName: TERRITORIES[territoryId].name,
  });

  if (newlyUnlocked.length > 0) {
    dragon._newlyUnlockedZones = newlyUnlocked;
  }

  return dragon;
}

// ── Encounter: Habitat level (Tier 1 + 2 + 3) ───────────────

/**
 * Full encounter at habitat level. Supports common/rare/species rolls.
 */
export function encounter(habitatId) {
  const habitat = HABITATS[habitatId];
  if (!habitat) return null;

  const built = buildConstraintsForHabitat(habitatId);
  if (!built) return null;

  trackVisit(habitatId);

  const roll = rollEncounterType(habitat);
  let genotype;

  if (roll === 'species' && habitat.species && habitat.species.length > 0) {
    const species = pickSpecies(habitat.species);
    genotype = createConstrainedGenotype({
      geneConstraints: built.geneConstraints,
      triangleOverrides: built.triangleOverrides,
      speciesGenes: species.genes,
      subordination: built.subordination,
    });

    // Track species discovery
    const log = explorationLog[habitatId];
    if (log && !log.speciesFound.includes(species.id)) {
      log.speciesFound.push(species.id);
    }

    return Dragon.fromConstrained(genotype, {
      speciesId: species.id,
      speciesName: species.name,
      habitatId,
      encounterLevel: 'habitat',
      encounterZoneId: habitatId,
      encounterZoneName: habitat.name,
    });
  }

  if (roll === 'rare') {
    const tightened = tightenConstraints(built.geneConstraints);
    genotype = createConstrainedGenotype({
      geneConstraints: tightened,
      triangleOverrides: built.triangleOverrides,
      subordination: built.subordination,
    });
  } else {
    genotype = createConstrainedGenotype({
      geneConstraints: built.geneConstraints,
      triangleOverrides: built.triangleOverrides,
      subordination: built.subordination,
    });
  }

  return Dragon.fromConstrained(genotype, {
    habitatId,
    encounterType: roll,
    encounterLevel: 'habitat',
    encounterZoneId: habitatId,
    encounterZoneName: habitat.name,
  });
}

/**
 * Debug encounter — supports any level or fully random.
 */
export function debugEncounter(habitatId, territoryId, regionId) {
  if (habitatId) return encounter(habitatId);
  if (territoryId) return encounterAtTerritory(territoryId);
  if (regionId) return encounterAtRegion(regionId);

  // Fully random
  const genotype = createRandomGenotype();
  return Dragon.fromConstrained(genotype, { encounterLevel: 'random' });
}

// ── Internal helpers ─────────────────────────────────────────

function trackVisit(zoneId) {
  if (!explorationLog[zoneId]) {
    explorationLog[zoneId] = { visits: 0, speciesFound: [], observedTraits: {} };
  }
  // Backfill observedTraits for legacy saves
  if (!explorationLog[zoneId].observedTraits) {
    explorationLog[zoneId].observedTraits = {};
  }
  explorationLog[zoneId].visits++;
}

/**
 * Get the expressed phenotype value for a gene given an allele pair.
 * Linear: Math.round(avg), Categorical: Math.max.
 */
function getExpressedValue(geneName, allelePair) {
  const def = GENE_DEFS[geneName];
  if (def && def.inheritanceType === 'categorical') {
    return Math.max(allelePair[0], allelePair[1]);
  }
  return Math.round((allelePair[0] + allelePair[1]) / 2);
}

/**
 * Record all expressed gene values from an encounter's genotype.
 */
function trackObservedTraits(zoneId, genotype) {
  const log = explorationLog[zoneId];
  if (!log) return;
  if (!log.observedTraits) log.observedTraits = {};

  for (const [gene, pair] of Object.entries(genotype)) {
    const expressed = getExpressedValue(gene, pair);
    if (!log.observedTraits[gene]) log.observedTraits[gene] = [];
    if (!log.observedTraits[gene].includes(expressed)) {
      log.observedTraits[gene].push(expressed);
    }
  }
}

/**
 * Check if any territory's gene signature is fully covered by observed traits.
 * Also checks brute-force visit threshold.
 * Returns array of { id, name, method } for newly unlocked territories.
 */
function checkTerritoryUnlocks(regionId) {
  const region = REGIONS[regionId];
  if (!region) return [];

  const log = explorationLog[regionId];
  if (!log) return [];

  const newlyUnlocked = [];
  const bruteForce = log.visits >= TERRITORY_UNLOCK_VISITS;

  for (const territoryId of region.territories) {
    if (unlockedTerritories.has(territoryId)) continue;

    // Check trait discovery
    let discoveredByTraits = false;
    if (log.observedTraits) {
      const territory = TERRITORIES[territoryId];
      discoveredByTraits = true;
      for (const [gene, range] of Object.entries(territory.geneConstraints)) {
        const observed = log.observedTraits[gene] || [];
        if (!observed.some(v => v >= range.min && v <= range.max)) {
          discoveredByTraits = false;
          break;
        }
      }
    }

    if (discoveredByTraits || bruteForce) {
      unlockedTerritories.add(territoryId);
      if (discoveredByTraits) traitDiscoveries.add(territoryId);
      newlyUnlocked.push({
        id: territoryId,
        name: TERRITORIES[territoryId].name,
        method: discoveredByTraits ? 'discovery' : 'visits',
        level: 'territory',
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Check if any habitat's gene signature is fully covered by observed traits.
 * Also checks brute-force visit threshold.
 * Returns array of { id, name, method } for newly unlocked habitats.
 */
function checkHabitatUnlocks(territoryId) {
  const territory = TERRITORIES[territoryId];
  if (!territory) return [];

  const log = explorationLog[territoryId];
  if (!log) return [];

  const newlyUnlocked = [];
  const bruteForce = log.visits >= HABITAT_UNLOCK_VISITS;

  for (const habitatId of territory.habitats) {
    if (unlockedHabitats.has(habitatId)) continue;

    // Check trait discovery
    let discoveredByTraits = false;
    if (log.observedTraits) {
      const habitat = HABITATS[habitatId];
      discoveredByTraits = true;
      for (const [gene, range] of Object.entries(habitat.geneConstraints)) {
        const observed = log.observedTraits[gene] || [];
        if (!observed.some(v => v >= range.min && v <= range.max)) {
          discoveredByTraits = false;
          break;
        }
      }
    }

    if (discoveredByTraits || bruteForce) {
      unlockedHabitats.add(habitatId);
      if (discoveredByTraits) traitDiscoveries.add(habitatId);
      newlyUnlocked.push({
        id: habitatId,
        name: HABITATS[habitatId].name,
        method: discoveredByTraits ? 'discovery' : 'visits',
        level: 'habitat',
      });
    }
  }

  return newlyUnlocked;
}

function rollEncounterType(habitat) {
  const rates = habitat.encounterRate || { common: 85, rare: 15, species: 0 };
  const total = rates.common + rates.rare + (rates.species || 0);
  const roll = Math.random() * total;

  if (roll < rates.common) return 'common';
  if (roll < rates.common + rates.rare) return 'rare';
  return 'species';
}

function pickSpecies(speciesList) {
  const totalWeight = speciesList.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const species of speciesList) {
    roll -= species.weight;
    if (roll <= 0) return species;
  }
  return speciesList[speciesList.length - 1];
}

/**
 * Tighten gene constraints for rare encounters.
 * Pushes min values upward to produce stronger trait expression.
 */
function tightenConstraints(constraints) {
  const tightened = {};
  for (const [gene, range] of Object.entries(constraints)) {
    const midpoint = Math.ceil((range.min + range.max) / 2);
    tightened[gene] = {
      min: Math.max(range.min, midpoint),
      max: range.max,
    };
  }
  return tightened;
}

// ── Exploration log access ───────────────────────────────────

export function getExplorationLog() {
  return { ...explorationLog };
}

export function getHabitatVisits(zoneId) {
  return explorationLog[zoneId]?.visits || 0;
}

// ── Save / Restore ───────────────────────────────────────────

export function getMapSaveData() {
  return {
    unlockedRegions: [...unlockedRegions],
    unlockedTerritories: [...unlockedTerritories],
    unlockedHabitats: [...unlockedHabitats],
    traitDiscoveries: [...traitDiscoveries],
    explorationLog: { ...explorationLog },
  };
}

export function restoreMapState(data) {
  if (!data) return;
  if (data.unlockedRegions) {
    unlockedRegions = new Set(data.unlockedRegions);
    // Ensure all regions are unlocked (gating is at territory level now)
    for (const id of Object.keys(REGIONS)) unlockedRegions.add(id);
  }
  if (data.unlockedTerritories) {
    unlockedTerritories = new Set(data.unlockedTerritories);
  }
  if (data.unlockedHabitats) {
    unlockedHabitats = new Set(data.unlockedHabitats);
  }
  if (data.traitDiscoveries) {
    traitDiscoveries = new Set(data.traitDiscoveries);
  }
  if (data.explorationLog) {
    explorationLog = data.explorationLog;
  }
}
