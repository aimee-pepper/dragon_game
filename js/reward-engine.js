// ============================================================
// Reward engine — pure functions for calculating quest rewards
// ============================================================
// No global state. Import this wherever rewards need computing.

import { QUEST_REWARDS, GENERATION_BONUS_RATE, GENERATION_BONUS_CAP } from './reward-config.js';

/**
 * Calculate rewards for completing a quest.
 * @param {string} difficulty — 'easy' | 'medium' | 'hard' | 'extra-hard'
 * @param {number} dragonGeneration — generation of the submitted dragon (0 = wild-caught)
 * @returns {{ gold: number, exp: number, rep: number }}
 */
export function calculateQuestReward(difficulty, dragonGeneration = 0) {
  const base = QUEST_REWARDS[difficulty];
  if (!base) return { gold: 0, exp: 0, rep: 0 };

  const genBonus = Math.min(
    1.0 + dragonGeneration * GENERATION_BONUS_RATE,
    GENERATION_BONUS_CAP,
  );

  return {
    gold: Math.round(base.gold * genBonus),
    exp: Math.round(base.exp * genBonus),
    rep: base.rep,  // rep not affected by generation bonus
  };
}
