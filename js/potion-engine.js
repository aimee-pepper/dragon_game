// ============================================================
// Potion / hotbar use engine — handles consumable & skill effects
// ============================================================
// Supports two entry types from the hotbar:
// - { type: 'item', id } — consumable potions (consumed on use)
// - { type: 'skill', id } — permanent skills (free to use)
//
// Effects that target a specific gene show a gene picker after
// the player selects a dragon.

import { GENE_DEFS } from './gene-config.js';
import { consumeItem, getInventory } from './shop-engine.js';
import { addPendingBreedEffect, triggerSave } from './save-manager.js';
import { POTION_PRICES } from './economy-config.js';
import { SKILL_DEFS } from './skill-config.js';

// ── Potion effect definitions ──────────────────────────────

export const POTION_EFFECTS = {
  // --- Reveal potions (instant-target: dragon, pick a specific gene) ---
  'seers-tincture':       { mode: 'instant-target', target: 'dragon', effect: 'reveal-gene',
                            revealMode: 'partial', needsGenePick: true,
                            desc: 'Reveal one hidden allele on a chosen trait' },
  'revealing-draught':    { mode: 'instant-target', target: 'dragon', effect: 'reveal-gene',
                            revealMode: 'full', needsGenePick: true,
                            desc: 'Fully reveal a chosen trait on a dragon' },
  'oracles-draught':      { mode: 'instant-target', target: 'dragon', effect: 'reveal-all-partial',
                            needsGenePick: false,
                            desc: 'Reveal one allele of every gene on a dragon' },
  'bloodline-ink':        { mode: 'instant-target', target: 'dragon', effect: 'reveal-all-full',
                            needsGenePick: false,
                            desc: 'Fully reveal every gene on a dragon' },
  'carriers-tincture':    { mode: 'instant-target', target: 'dragon', effect: 'detect-carriers',
                            needsGenePick: false,
                            desc: 'Detect hidden recessive alleles on a dragon' },

  // --- Egg potions (instant-target: egg) ---
  'hatching-powder':      { mode: 'instant-target', target: 'egg', effect: 'unlock-egg',
                            needsGenePick: false,
                            desc: 'Instantly unlock a locked egg' },
  'scrying-vapors':       { mode: 'instant-target', target: 'egg', effect: 'reveal-egg',
                            needsGenePick: false,
                            desc: 'Reveal traits of an unhatched egg' },
  'quickening-salve':     { mode: 'instant-target', target: 'egg', effect: 'reduce-hatch-time',
                            needsGenePick: false,
                            desc: 'Reduce hatch time by 1 minute' },

  // --- Breed modifier potions ---
  'broodmothers-draught': { mode: 'breed-modifier', effect: 'clutch-plus-one',
                            desc: '+1 egg on next breeding' },
  'dominant-tonic':       { mode: 'breed-modifier', effect: 'bias-dominant',
                            desc: 'Bias next breed toward dominant alleles' },
  'recessive-elixir':     { mode: 'breed-modifier', effect: 'bias-recessive',
                            desc: 'Bias next breed toward recessive alleles' },
  'flux-catalyst':        { mode: 'breed-modifier', effect: 'mutation-boost',
                            desc: '+15% mutation chance on next breed' },
  'binding-resin':        { mode: 'breed-modifier', effect: 'mutation-suppress',
                            desc: 'Suppress all mutations on next breed' },
  'precision-elixir':     { mode: 'breed-modifier', effect: 'force-mutation',
                            desc: 'Force a specific mutation on next breed' },
  'chromatic-tincture':   { mode: 'breed-modifier', effect: 'bias-chroma',
                            desc: 'Bias color genes on next breed' },
  'lustral-oil':          { mode: 'breed-modifier', effect: 'bias-finish',
                            desc: 'Bias finish genes on next breed' },
  'breath-essence':       { mode: 'breed-modifier', effect: 'bias-element',
                            desc: 'Bias breath element on next breed' },
  'ossite-powder':        { mode: 'breed-modifier', effect: 'bias-morphology',
                            desc: 'Bias body structure on next breed' },
  'keratin-salve':        { mode: 'breed-modifier', effect: 'bias-appendage',
                            desc: 'Bias horns/spines/tail on next breed' },
  'wyrms-breath-oil':     { mode: 'breed-modifier', effect: 'bias-breath-arts',
                            desc: 'Bias breath shape/range on next breed' },
  'scale-lacquer':        { mode: 'breed-modifier', effect: 'bias-scale',
                            desc: 'Bias scale traits on next breed' },
};

// ── Targeting state ────────────────────────────────────────

// { entryType, entryId, targetType, needsGenePick, revealMode, desc }
let _targetingState = null;

export function isTargeting() {
  return _targetingState !== null;
}

export function getTargetingState() {
  return _targetingState;
}

export function cancelTargeting() {
  _targetingState = null;
  _removeTargetingOverlay();
}

// ── Use a hotbar entry (item or skill) ─────────────────────

/**
 * Attempt to use a hotbar entry. Returns { ok, message }.
 * @param {number} slotIndex
 * @param {{ type: 'item'|'skill', id: string }} entry
 */
export function useHotbarEntry(slotIndex, entry) {
  if (entry.type === 'item') {
    return _useItem(slotIndex, entry.id);
  }
  if (entry.type === 'skill') {
    return _useSkill(slotIndex, entry.id);
  }
  return { ok: false, message: 'Unknown entry type' };
}

function _useItem(slotIndex, potionId) {
  const def = POTION_EFFECTS[potionId];
  if (!def) return { ok: false, message: 'Unknown potion' };

  const inventory = getInventory();
  if (!inventory.has(potionId) || inventory.get(potionId) <= 0) {
    return { ok: false, message: 'No potions remaining' };
  }

  if (def.mode === 'instant-target') {
    _targetingState = {
      entryType: 'item',
      entryId: potionId,
      targetType: def.target,
      needsGenePick: !!def.needsGenePick,
      revealMode: def.revealMode || null,
      effect: def.effect,
      desc: def.desc,
    };
    _showTargetingOverlay(def.target, POTION_PRICES[potionId]?.name || potionId, def.desc);
    return { ok: true, message: `Select a ${def.target}` };
  }

  if (def.mode === 'breed-modifier') {
    consumeItem(potionId);
    addPendingBreedEffect(potionId);
    triggerSave();
    return { ok: true, message: `${POTION_PRICES[potionId]?.name} queued for next breed!` };
  }

  if (def.mode === 'instant') {
    consumeItem(potionId);
    triggerSave();
    return { ok: true, message: `Used ${POTION_PRICES[potionId]?.name}!` };
  }

  return { ok: false, message: 'Unknown potion mode' };
}

function _useSkill(slotIndex, skillId) {
  const skillDef = SKILL_DEFS[skillId];
  if (!skillDef) return { ok: false, message: 'Unknown skill' };

  const eff = skillDef.effect;

  // Reveal skills → target a dragon (with gene pick)
  if (eff.type === 'reveal') {
    _targetingState = {
      entryType: 'skill',
      entryId: skillId,
      targetType: 'dragon',
      needsGenePick: true,
      revealMode: eff.mode, // 'partial' or 'full'
      effect: 'reveal-gene',
      desc: skillDef.desc,
    };
    _showTargetingOverlay('dragon', skillDef.name, skillDef.desc);
    return { ok: true, message: `Select a dragon` };
  }

  // Egg reveal skills
  if (eff.type === 'egg-reveal') {
    _targetingState = {
      entryType: 'skill',
      entryId: skillId,
      targetType: 'egg',
      needsGenePick: false,
      revealMode: eff.mode,
      effect: 'reveal-egg',
      desc: skillDef.desc,
    };
    _showTargetingOverlay('egg', skillDef.name, skillDef.desc);
    return { ok: true, message: `Select an egg` };
  }

  // Carrier detection skills → target a dragon (no gene pick)
  if (eff.type === 'carrier') {
    _targetingState = {
      entryType: 'skill',
      entryId: skillId,
      targetType: 'dragon',
      needsGenePick: false,
      revealMode: null,
      effect: 'detect-carriers',
      desc: skillDef.desc,
    };
    _showTargetingOverlay('dragon', skillDef.name, skillDef.desc);
    return { ok: true, message: `Select a dragon` };
  }

  // Trait lock skills → target dragon, pick gene
  if (eff.type === 'trait-lock') {
    _targetingState = {
      entryType: 'skill',
      entryId: skillId,
      targetType: 'dragon',
      needsGenePick: true,
      revealMode: null,
      effect: 'trait-lock',
      desc: skillDef.desc,
    };
    _showTargetingOverlay('dragon', skillDef.name, skillDef.desc);
    return { ok: true, message: `Select a dragon` };
  }

  // Quest skills — instant use, no target
  if (eff.type === 'quest-reroll' || eff.type === 'quest-refresh' || eff.type === 'quest-flexibility') {
    // These are passive bonuses, but could be actively triggered
    // For now, show a message that they're always active
    return { ok: false, message: `${skillDef.name} is a passive skill — always active` };
  }

  return { ok: false, message: `${skillDef.name} cannot be used from hotbar` };
}

// ── Apply effect to dragon target ──────────────────────────

/**
 * Apply the current targeting effect to a dragon.
 * @param {Dragon} dragon
 * @param {string|null} geneName — specific gene, or null for whole-dragon effects
 * @param {number|null} alleleIndex — 0 or 1 for allele-specific effects (trait-lock)
 * @returns {boolean} success
 */
export function applyTargetToDragon(dragon, geneName, alleleIndex) {
  if (!_targetingState || _targetingState.targetType !== 'dragon') return false;

  const { entryType, entryId, effect, revealMode } = _targetingState;
  let success = false;

  switch (effect) {
    case 'reveal-gene': {
      if (geneName) {
        dragon.revealGene(geneName, revealMode);
        success = true;
      }
      break;
    }

    case 'reveal-all-partial': {
      for (const gn of Object.keys(GENE_DEFS)) {
        if (!dragon.revealedGenes[gn]) {
          dragon.revealGene(gn, 'partial');
        }
      }
      success = true;
      break;
    }

    case 'reveal-all-full': {
      for (const gn of Object.keys(GENE_DEFS)) {
        dragon.revealGene(gn, 'full');
      }
      success = true;
      break;
    }

    case 'detect-carriers': {
      for (const [gn, gDef] of Object.entries(GENE_DEFS)) {
        const pair = dragon.genotype[gn];
        if (!pair) continue;
        if (pair[0] === gDef.min || pair[1] === gDef.min) {
          if (!dragon.revealedGenes[gn]) {
            dragon.revealGene(gn, 'partial');
          }
        }
      }
      success = true;
      break;
    }

    case 'trait-lock': {
      // Trait lock: record which gene + allele to lock for next breed
      if (geneName && alleleIndex !== null && alleleIndex !== undefined) {
        addPendingBreedEffect(`trait-lock:${geneName}:${alleleIndex}`);
        success = true;
      }
      break;
    }
  }

  if (success && entryType === 'item') {
    consumeItem(entryId);
  }

  if (success) triggerSave();
  cancelTargeting();
  return success;
}

// ── Targeting overlay UI ───────────────────────────────────

function _showTargetingOverlay(targetType, name, desc) {
  _removeTargetingOverlay();

  const banner = document.createElement('div');
  banner.id = 'potion-targeting-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10001;
    background: linear-gradient(135deg, #2a1a3a, #1a2a3a);
    color: #fff;
    text-align: center;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  `;

  const text = document.createElement('span');
  text.textContent = `Select a ${targetType}: ${name}`;
  banner.appendChild(text);

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 12px;
  `;
  cancelBtn.addEventListener('click', () => cancelTargeting());
  banner.appendChild(cancelBtn);

  document.body.appendChild(banner);
}

function _removeTargetingOverlay() {
  const existing = document.getElementById('potion-targeting-banner');
  if (existing) existing.remove();
}
