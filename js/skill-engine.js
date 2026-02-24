// ============================================================
// Skill engine — manages skill state, unlocking, and queries
// ============================================================
// Thin state manager. Data lives in skill-config.js.
// XP is "spent" on skills but tracked separately from stats.exp.
// Available XP = stats.exp - xpSpent.

import { SKILL_DEFS } from './skill-config.js';
import { XP_COST_PER_TIER } from './economy-config.js';
import { getStats } from './save-manager.js';
import { hasTome } from './shop-engine.js';

// ── State ──────────────────────────────────────────────────

const unlockedSkills = new Set(); // set of skill IDs that have been unlocked
let xpSpent = 0; // total XP spent on skills (not deducted from stats.exp)

// Callbacks
const _onSkillChange = [];

export function onSkillChange(cb) {
  _onSkillChange.push(cb);
}

function notifySkillChange() {
  for (const cb of _onSkillChange) cb();
}

// ── Queries ────────────────────────────────────────────────

/** Check if a skill is unlocked */
export function hasSkill(skillId) {
  return unlockedSkills.has(skillId);
}

/** Get the highest tier unlocked in a specific line */
export function getSkillTier(line) {
  let maxTier = 0;
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.line === line && def.tier > maxTier) {
      maxTier = def.tier;
    }
  }
  return maxTier;
}

/** Get the highest-level skill effect for a line (the active one) */
export function getActiveSkillEffect(line) {
  let best = null;
  let bestTier = 0;
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.line === line && def.tier > bestTier) {
      bestTier = def.tier;
      best = def.effect;
    }
  }
  return best;
}

/** Get all unlocked skill effects for a given effect type */
export function getEffectsOfType(effectType) {
  const effects = [];
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.effect && def.effect.type === effectType) {
      effects.push({ skillId, ...def.effect });
    }
  }
  return effects;
}

/** Get available XP (earned - spent) */
export function getAvailableXP() {
  return getStats().exp - xpSpent;
}

/** Get total XP spent */
export function getTotalXPSpent() {
  return xpSpent;
}

/** Get number of unlocked skills */
export function getUnlockedCount() {
  return unlockedSkills.size;
}

/** Get all unlocked skill IDs */
export function getUnlockedSkills() {
  return new Set(unlockedSkills);
}

/** Get XP cost for a skill (based on its tier) */
export function getSkillCost(skillId) {
  const def = SKILL_DEFS[skillId];
  if (!def) return Infinity;
  return XP_COST_PER_TIER[def.tier] || Infinity;
}

// ── Prerequisite checking ──────────────────────────────────

/** Check if a skill can be unlocked right now */
export function canUnlockSkill(skillId) {
  if (unlockedSkills.has(skillId)) return { ok: false, reason: 'Already unlocked' };

  const def = SKILL_DEFS[skillId];
  if (!def) return { ok: false, reason: 'Unknown skill' };

  // Check prerequisites
  if (def.requires) {
    if (def.requires.skill && !unlockedSkills.has(def.requires.skill)) {
      const prereqDef = SKILL_DEFS[def.requires.skill];
      const prereqName = prereqDef ? prereqDef.name : def.requires.skill;
      return { ok: false, reason: `Requires ${prereqName}` };
    }
    if (def.requires.tome && !hasTome(def.requires.tome)) {
      return { ok: false, reason: `Requires tome` };
    }
  }

  // Check XP
  const cost = getSkillCost(skillId);
  if (getAvailableXP() < cost) {
    return { ok: false, reason: `Need ${cost} XP (have ${getAvailableXP()})` };
  }

  return { ok: true };
}

// ── Unlock ─────────────────────────────────────────────────

/** Attempt to unlock a skill. Returns { success, message } */
export function unlockSkill(skillId) {
  const check = canUnlockSkill(skillId);
  if (!check.ok) return { success: false, message: check.reason };

  const cost = getSkillCost(skillId);
  xpSpent += cost;
  unlockedSkills.add(skillId);
  notifySkillChange();

  const def = SKILL_DEFS[skillId];
  return { success: true, message: `Unlocked ${def.name}!` };
}

// ── Convenience: summed bonuses ────────────────────────────

/** Get total clutch size bonus from skills */
export function getClutchSizeBonus() {
  let bonus = 0;
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.effect && def.effect.type === 'clutch-size') {
      bonus += def.effect.bonus;
    }
  }
  return bonus;
}

/** Get total hatch capacity bonus from skills */
export function getHatchCapacityBonus() {
  let bonus = 0;
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.effect && def.effect.type === 'hatch-capacity') {
      bonus += def.effect.bonus;
    }
  }
  return bonus;
}

/** Get the best reveal skill effect (highest tier in reveal line) */
export function getRevealCapability() {
  return getActiveSkillEffect('reveal');
}

/** Get the best egg inspection skill effect */
export function getEggInspectionCapability() {
  return getActiveSkillEffect('egg-inspection');
}

/** Get reward bonus multiplier for a given stat */
export function getRewardBonus(stat) {
  let bonus = 0;
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.effect && def.effect.type === 'reward-bonus' && def.effect.stat === stat) {
      bonus = Math.max(bonus, def.effect.percent); // highest tier wins (not cumulative)
    }
  }
  return bonus;
}

/** Get egg pricing bonus (highest tier) */
export function getEggPricingBonus() {
  let bonus = 0;
  for (const skillId of unlockedSkills) {
    const def = SKILL_DEFS[skillId];
    if (def && def.effect && def.effect.type === 'egg-pricing') {
      bonus = Math.max(bonus, def.effect.percent);
    }
  }
  return bonus;
}

/** Get selective pressure effect (highest tier) */
export function getSelectivePressure() {
  return getActiveSkillEffect('selective-pressure');
}

/** Get trait lock capacity (highest tier) */
export function getTraitLockCapacity() {
  const effect = getActiveSkillEffect('trait-lock');
  return effect ? effect.traits : 0;
}

/** Get inherited knowledge percent */
export function getInheritedKnowledgePercent() {
  const effect = getActiveSkillEffect('inherited-knowledge');
  return effect ? effect.percent : 0;
}

/** Get pedigree mastery percent */
export function getPedigreePercent() {
  const effect = getActiveSkillEffect('pedigree-mastery');
  return effect ? effect.percent : 0;
}

// ── Save / Load ────────────────────────────────────────────

export function getSkillSaveData() {
  return {
    unlockedSkills: [...unlockedSkills],
    xpSpent,
  };
}

export function restoreSkillState(data) {
  unlockedSkills.clear();
  xpSpent = 0;

  if (!data) return;

  if (Array.isArray(data.unlockedSkills)) {
    for (const id of data.unlockedSkills) {
      if (SKILL_DEFS[id]) { // only restore valid skill IDs
        unlockedSkills.add(id);
      }
    }
  }

  if (typeof data.xpSpent === 'number') {
    xpSpent = data.xpSpent;
  }
}

// ── Debug: reset all skills ────────────────────────────────

export function resetAllSkills() {
  unlockedSkills.clear();
  xpSpent = 0;
  notifySkillChange();
}
