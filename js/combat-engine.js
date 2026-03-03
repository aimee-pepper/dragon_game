// Combat Engine — pure logic, no DOM
// Simulates turn-based head-to-head dragon combat
// Takes pre-computed stat objects from stat-config.js
//
// Stat shape expected:
//   { hp, armor, speed, evasion, accuracy, height, distance?,
//     meleeDamage, breathDamage, thorns, breathReflect,
//     fireResist, iceResist, lightningResist,
//     breathType, breathShape, breathRange,
//     elementDebuff, isVoid, isPlasma, name? }
// distance: 0=Melee, 1=Short, 2=Medium, 3=Long (defaults to 0 if omitted)

import { getElementResistance, getHeightName } from './stat-config.js';

// ── Helpers ──────────────────────────────────────────────────

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// ── Height Targeting Rules ───────────────────────────────────

/**
 * Get melee modifier based on height difference (attacker vs defender).
 * Returns { canMelee, meleeMult, details }
 */
function getMeleeHeightMod(atkHeight, defHeight) {
  const diff = defHeight - atkHeight; // positive = defender is higher
  if (diff <= 0) return { canMelee: true, meleeMult: 1.0, details: '' };
  if (diff === 1) return { canMelee: true, meleeMult: 0.75, details: ' (height -25%)' };
  return { canMelee: false, meleeMult: 0, details: ' (too high for melee)' };
}

/**
 * Get breath accuracy modifier based on height difference.
 * Returns { accMod (additive %), details }
 */
function getBreathHeightMod(atkHeight, defHeight) {
  const diff = defHeight - atkHeight;
  if (diff <= 1) return { accMod: 0, dmgMod: 0, details: '' };
  if (diff === 2) return { accMod: -10, dmgMod: -10, details: ' (2-tier height: -10% Acc, -10% dmg)' };
  return { accMod: -20, dmgMod: -20, details: ' (3-tier height: -20% Acc, -20% dmg)' };
}

// ── Distance Targeting Rules ─────────────────────────────────

/**
 * Get melee modifier based on distance gap (attacker vs defender).
 * Gap = |atkDistance - defDistance|
 * Returns { canMelee, meleeMult, details }
 */
function getDistanceMeleeMod(atkDistance, defDistance) {
  const gap = Math.abs((atkDistance ?? 0) - (defDistance ?? 0));
  if (gap <= 0) return { canMelee: true, meleeMult: 1.0, details: '' };
  if (gap === 1) return { canMelee: true, meleeMult: 0.75, details: ' (distance -25%)' };
  return { canMelee: false, meleeMult: 0, details: ' (too far for melee)' };
}

/**
 * Get breath modifier based on distance gap vs dragon's breath range.
 * breathRange: 1=Close, 2=Mid, 3=Far
 * Optimal gap ranges: Close→[0,1], Mid→[1,2], Far→[2,3]
 * Each tier outside optimal: -15% acc, -10% dmg
 * Returns { accMod, dmgMod, details }
 */
function getDistanceBreathMod(atkDistance, defDistance, breathRange) {
  const gap = Math.abs((atkDistance ?? 0) - (defDistance ?? 0));
  const range = breathRange || 1;
  // Optimal gap band: [range-1, range] clamped to [0,3]
  const optLo = Math.max(0, range - 1);
  const optHi = range;
  let tiersOut = 0;
  if (gap < optLo) tiersOut = optLo - gap;
  else if (gap > optHi) tiersOut = gap - optHi;
  if (tiersOut <= 0) return { accMod: 0, dmgMod: 0, details: '' };
  const accPen = tiersOut * -15;
  const dmgPen = tiersOut * -10;
  return {
    accMod: accPen,
    dmgMod: dmgPen,
    details: ` (dist ${tiersOut > 1 ? tiersOut + ' tiers' : '1 tier'} off-range: ${accPen}% Acc, ${dmgPen}% dmg)`,
  };
}

// ── Breath Shape Damage Multiplier (1v1) ─────────────────────

function getBreathShapeMult(breathShape) {
  // 1=Single, 2=Multi, 3=AoE
  // In 1v1: no shape penalty — shape only matters in multi-target combat (future)
  // Multi/AoE will split damage across targets when battlefield system is added
  return 1.0;
}

// ── Effective Stats (with active debuffs) ────────────────────

function getEffectiveArmor(fighter) {
  let armor = fighter.stats.armor || 0;
  // Solar debuff: armor pierce
  for (const s of fighter.statuses) {
    if (s.type === 'solar') armor = Math.max(0, armor - (s.armorPierce || 0));
  }
  return armor;
}

function getEffectiveSpeed(fighter) {
  let speed = fighter.stats.speed || 100;
  for (const s of fighter.statuses) {
    if (s.type === 'slow') speed = Math.round(speed * (1 - (s.speedReduction || 0) / 100));
  }
  return Math.max(1, speed);
}

function getEffectiveAccuracy(fighter) {
  let acc = fighter.stats.accuracy || 80;
  for (const s of fighter.statuses) {
    if (s.type === 'steam') acc -= (s.accuracyReduction || 0);
  }
  return Math.max(10, acc);
}

function getVulnerabilityMult(fighter) {
  // Aurora debuff: target takes more damage
  let mult = 1.0;
  for (const s of fighter.statuses) {
    if (s.type === 'aurora') mult += (s.damageAmplify || 0) / 100;
  }
  return mult;
}

function hasStun(fighter) {
  for (const s of fighter.statuses) {
    if (s.type === 'stun') return s.skipChance || 0;
  }
  return 0;
}

// ── Attack Choice AI ─────────────────────────────────────────

function chooseBestAttack(attacker, defender) {
  const meleeHM = getMeleeHeightMod(attacker.stats.height, defender.stats.height);
  const meleeDM = getDistanceMeleeMod(attacker.stats.distance, defender.stats.distance);
  const canMelee = meleeHM.canMelee && meleeDM.canMelee;
  const armor = getEffectiveArmor(defender);

  // Expected melee damage
  let expectedMelee = 0;
  if (canMelee) {
    expectedMelee = Math.max(1, attacker.stats.meleeDamage - armor) * meleeHM.meleeMult * meleeDM.meleeMult;
  }

  // Expected breath damage
  const breathBase = attacker.stats.breathDamage || 0;
  const shapeMult = getBreathShapeMult(attacker.stats.breathShape);
  const resist = attacker.stats.isVoid ? 0 : getElementResistance(defender.stats, attacker.stats.breathType);
  const distBM = getDistanceBreathMod(attacker.stats.distance, defender.stats.distance, attacker.stats.breathRange);
  const expectedBreath = breathBase * shapeMult * (1 - resist / 100) * (1 + distBM.dmgMod / 100);

  // Prefer breath if it does more damage, or if we can't melee
  if (!canMelee || expectedBreath > expectedMelee) {
    return 'breath';
  }
  return 'melee';
}

// ── Single Attack Resolution ─────────────────────────────────

function resolveMeleeAttack(attacker, defender, turnNum) {
  const heightMod = getMeleeHeightMod(attacker.stats.height, defender.stats.height);
  const distMod = getDistanceMeleeMod(attacker.stats.distance, defender.stats.distance);

  if (!heightMod.canMelee) {
    return {
      turn: turnNum, attacker: attacker.side, damage: 0,
      attackType: 'melee', dodged: false,
      details: `${attacker.name} can't reach ${defender.name} with melee${heightMod.details}`,
    };
  }
  if (!distMod.canMelee) {
    return {
      turn: turnNum, attacker: attacker.side, damage: 0,
      attackType: 'melee', dodged: false,
      details: `${attacker.name} can't reach ${defender.name} with melee${distMod.details}`,
    };
  }

  // Hit check: accuracy vs evasion
  const acc = getEffectiveAccuracy(attacker);
  const eva = defender.stats.evasion || 0;
  const hitChance = clamp((acc - eva) / 100, 0.05, 0.99);

  if (Math.random() > hitChance) {
    return {
      turn: turnNum, attacker: attacker.side, damage: 0,
      attackType: 'melee', dodged: true,
      details: `${attacker.name} melee → miss! (${Math.round(hitChance * 100)}% hit chance vs ${eva}% evasion)`,
    };
  }

  // Damage calc
  const armor = getEffectiveArmor(defender);
  const baseDmg = Math.max(1, attacker.stats.meleeDamage - armor);
  const heightMultDmg = heightMod.meleeMult;
  const distMultDmg = distMod.meleeMult;
  const vulnMult = getVulnerabilityMult(defender);
  const variance = 0.9 + Math.random() * 0.2;
  const finalDmg = Math.max(1, Math.round(baseDmg * heightMultDmg * distMultDmg * vulnMult * variance));

  defender.hp = Math.max(0, defender.hp - finalDmg);

  let details = `${attacker.name} melee → ${finalDmg} dmg`;
  details += ` (${attacker.stats.meleeDamage} - ${armor} armor = ${baseDmg}`;
  if (heightMultDmg !== 1.0) details += ` ×${heightMultDmg} height`;
  if (distMultDmg !== 1.0) details += ` ×${distMultDmg} dist`;
  if (vulnMult !== 1.0) details += ` ×${vulnMult.toFixed(2)} vuln`;
  details += ')';

  // Thorns reflect
  let thornsEntry = null;
  const thorns = defender.stats.thorns || 0;
  if (thorns > 0) {
    attacker.hp = Math.max(0, attacker.hp - thorns);
    thornsEntry = {
      turn: turnNum, attacker: 'status', side: attacker.side,
      damage: thorns,
      details: `🌵 ${defender.name}'s thorns deal ${thorns} to ${attacker.name}`,
      statusTick: 'thorns',
    };
  }

  return {
    turn: turnNum, attacker: attacker.side, damage: finalDmg,
    attackType: 'melee', dodged: false,
    details, thornsEntry,
  };
}

function resolveBreathAttack(attacker, defender, turnNum) {
  const breathDmg = attacker.stats.breathDamage || 0;
  if (breathDmg <= 0) {
    return {
      turn: turnNum, attacker: attacker.side, damage: 0,
      attackType: 'breath', dodged: false,
      details: `${attacker.name} has no breath attack!`,
    };
  }

  // Accuracy with height, range, and distance modifiers
  let acc = getEffectiveAccuracy(attacker);
  const heightMod = getBreathHeightMod(attacker.stats.height, defender.stats.height);
  acc += heightMod.accMod;

  // Distance-based breath penalty (replaces old flat Far-range penalty)
  const breathRange = attacker.stats.breathRange || 1;
  const distBM = getDistanceBreathMod(attacker.stats.distance, defender.stats.distance, breathRange);
  acc += distBM.accMod;

  const eva = defender.stats.evasion || 0;
  const hitChance = clamp((acc - eva) / 100, 0.05, 0.99);

  if (Math.random() > hitChance) {
    return {
      turn: turnNum, attacker: attacker.side, damage: 0,
      attackType: 'breath', dodged: true,
      details: `${attacker.name} breath → miss! (${Math.round(hitChance * 100)}% hit${distBM.details}${heightMod.details})`,
    };
  }

  // Damage calc
  const shapeMult = getBreathShapeMult(attacker.stats.breathShape);
  const resist = attacker.stats.isVoid ? 0 : getElementResistance(defender.stats, attacker.stats.breathType);
  const vulnMult = getVulnerabilityMult(defender);

  // Height distance breath penalty: -10% per tier beyond 1
  let heightDmgPenalty = 1.0;
  const heightDiff = Math.abs(attacker.stats.height - defender.stats.height);
  if (heightDiff >= 2) {
    heightDmgPenalty = 1 - (heightDiff * 0.10);
  }

  // Distance damage penalty
  const distDmgMult = 1 + distBM.dmgMod / 100;

  const variance = 0.9 + Math.random() * 0.2;
  const rawDmg = breathDmg * shapeMult * (1 - resist / 100) * vulnMult * heightDmgPenalty * distDmgMult * variance;
  const finalDmg = Math.max(1, Math.round(rawDmg));

  defender.hp = Math.max(0, defender.hp - finalDmg);

  const shapeName = ['', 'Single', 'Multi', 'AoE'][attacker.stats.breathShape] || 'Single';
  const elemName = attacker.stats.breathType || 'Null';
  let details = `${attacker.name} ${elemName} breath → ${finalDmg} dmg`;
  details += ` (${Math.round(breathDmg)} base`;
  if (shapeMult !== 1.0) details += ` ×${shapeMult} ${shapeName}`;
  if (resist > 0) details += ` -${Math.round(resist)}% resist`;
  if (vulnMult !== 1.0) details += ` ×${vulnMult.toFixed(2)} vuln`;
  if (heightDmgPenalty !== 1.0) details += ` ×${heightDmgPenalty.toFixed(1)} height`;
  if (distDmgMult !== 1.0) details += ` ×${distDmgMult.toFixed(2)} dist`;
  details += ')';

  // Breath reflect
  let reflectEntry = null;
  const reflectPct = defender.stats.breathReflect || 0;
  if (reflectPct > 0) {
    const reflectDmg = Math.max(1, Math.round(finalDmg * reflectPct / 100));
    attacker.hp = Math.max(0, attacker.hp - reflectDmg);
    reflectEntry = {
      turn: turnNum, attacker: 'status', side: attacker.side,
      damage: reflectDmg,
      details: `✨ ${defender.name} reflects ${reflectDmg} breath damage (${reflectPct}%)`,
      statusTick: 'breathReflect',
    };
  }

  // Apply element debuff on hit
  let statusApplied = null;
  let statusEntry = null;
  const debuffConfig = attacker.stats.elementDebuff;
  if (debuffConfig) {
    // Refresh or apply debuff
    const existing = defender.statuses.find(s => s.type === debuffConfig.type);
    if (existing) {
      existing.remaining = debuffConfig.duration; // refresh
    } else {
      defender.statuses.push({ ...debuffConfig, remaining: debuffConfig.duration });
      statusApplied = debuffConfig.type;
      statusEntry = {
        turn: turnNum, attacker: attacker.side, damage: 0,
        details: `💥 ${debuffConfig.emoji} ${debuffConfig.label} applied to ${defender.name}! (${debuffConfig.desc})`,
        statusApplied: debuffConfig.type,
        statusLabel: debuffConfig.label,
        statusEmoji: debuffConfig.emoji,
        statusDuration: debuffConfig.duration,
      };
    }
  }

  return {
    turn: turnNum, attacker: attacker.side, damage: finalDmg,
    attackType: 'breath', dodged: false,
    details, reflectEntry, statusEntry,
  };
}

// ── Process Status Effects (DOTs, tick down durations) ────────

function processStatuses(fighter, turnNum) {
  const entries = [];

  for (let i = fighter.statuses.length - 1; i >= 0; i--) {
    const status = fighter.statuses[i];

    // Burn DOT
    if (status.type === 'burn' && status.dotDamage) {
      const dotDmg = status.dotDamage;
      fighter.hp = Math.max(0, fighter.hp - dotDmg);
      entries.push({
        turn: turnNum, attacker: 'status', side: fighter.side,
        damage: dotDmg,
        details: `${status.emoji} Burn deals ${dotDmg} to ${fighter.name}`,
        statusTick: 'burn',
      });
    }

    // Tick down
    status.remaining -= 1;
    if (status.remaining <= 0) {
      fighter.statuses.splice(i, 1);
      entries.push({
        turn: turnNum, attacker: 'status', side: fighter.side,
        damage: 0,
        details: `${status.emoji} ${status.label} wears off ${fighter.name}`,
        statusExpired: status.type,
      });
    }
  }

  return entries;
}

// ── Main Combat Simulation ───────────────────────────────────

const MAX_ROUNDS = 50;

/**
 * Simulate combat between two dragons.
 * @param {Object} statsA — full stat object from deriveCombatStats + name
 * @param {Object} statsB — same shape
 * @param {Object} options — { maxRounds? }
 * @returns {{ winner, rounds, finalState }}
 */
export function simulateCombat(statsA, statsB, options = {}) {
  const maxRounds = options.maxRounds || MAX_ROUNDS;

  const fighterA = {
    side: 'A',
    name: statsA.name || 'Dragon A',
    stats: { ...statsA },
    hp: statsA.hp,
    maxHp: statsA.hp,
    statuses: [],
  };

  const fighterB = {
    side: 'B',
    name: statsB.name || 'Dragon B',
    stats: { ...statsB },
    hp: statsB.hp,
    maxHp: statsB.hp,
    statuses: [],
  };

  const rounds = [];

  // ── Initiative ──
  const spdA = statsA.speed || 100;
  const spdB = statsB.speed || 100;
  let first = spdA >= spdB ? fighterA : fighterB;
  let second = first === fighterA ? fighterB : fighterA;

  const speedRatio = Math.max(spdA, spdB) / Math.max(1, Math.min(spdA, spdB));
  const fasterGetsExtraTurn = speedRatio >= 1.5;

  const hA = getHeightName(statsA.height);
  const hB = getHeightName(statsB.height);
  const DIST_NAMES = ['Melee', 'Short', 'Medium', 'Long'];
  const dA = DIST_NAMES[statsA.distance ?? 0];
  const dB = DIST_NAMES[statsB.distance ?? 0];
  rounds.push({
    turn: 0, attacker: 'system', damage: 0,
    details: `⚔ ${fighterA.name} (${spdA} SPD, ${hA}/${dA}) vs ${fighterB.name} (${spdB} SPD, ${hB}/${dB}) — ${first.name} goes first${fasterGetsExtraTurn ? ' with extra turn!' : ''}`,
  });

  // ── Round Loop ──
  for (let round = 1; round <= maxRounds; round++) {
    // Helper to do one action for a fighter
    const doAction = (actor, target, label) => {
      // Stun check
      const stunChance = hasStun(actor);
      if (stunChance > 0 && Math.random() * 100 < stunChance) {
        rounds.push({
          turn: round, attacker: actor.side, damage: 0,
          details: `⚡ ${actor.name} is stunned and skips their turn! (${stunChance}% chance)`,
        });
        return;
      }

      // Choose attack type
      const attackType = chooseBestAttack(actor, target);
      let result;
      if (attackType === 'breath') {
        result = resolveBreathAttack(actor, target, round);
      } else {
        result = resolveMeleeAttack(actor, target, round);
      }

      if (label) result.details = label + result.details;
      rounds.push(result);

      // Push status entry if present (thorns/reflect are rendered as sub-entries of the main attack)
      if (result.statusEntry) rounds.push(result.statusEntry);
    };

    // First fighter attacks
    doAction(first, second, '');
    if (second.hp <= 0 || first.hp <= 0) break;

    // Speed bonus extra turn
    if (fasterGetsExtraTurn) {
      doAction(first, second, '⚡ Speed bonus! ');
      if (second.hp <= 0 || first.hp <= 0) break;
    }

    // Second fighter attacks
    doAction(second, first, '');
    if (first.hp <= 0 || second.hp <= 0) break;

    // Process status effects
    const statusA = processStatuses(fighterA, round);
    const statusB = processStatuses(fighterB, round);
    rounds.push(...statusA, ...statusB);

    if (fighterA.hp <= 0 || fighterB.hp <= 0) break;
  }

  // ── Determine Winner ──
  let winner;
  if (fighterA.hp <= 0 && fighterB.hp <= 0) winner = 'draw';
  else if (fighterA.hp <= 0) winner = 'B';
  else if (fighterB.hp <= 0) winner = 'A';
  else winner = 'draw';

  return {
    winner,
    rounds,
    finalState: {
      A: { hp: fighterA.hp, maxHp: fighterA.maxHp, statuses: [...fighterA.statuses], name: fighterA.name },
      B: { hp: fighterB.hp, maxHp: fighterB.maxHp, statuses: [...fighterB.statuses], name: fighterB.name },
    },
  };
}

// Exported for heatmap calculation in UI
export { getDistanceMeleeMod, getDistanceBreathMod, getMeleeHeightMod, getBreathHeightMod };
