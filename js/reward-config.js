// ============================================================
// Reward configuration — data-only tables for quest rewards
// ============================================================
// Balancing rationale: Extra-hard quests should be ~4x more
// time-efficient than easy quests (gold per minute).
// Easy gives 1 of each to discourage spamming.
//
// Easy:       ~2 min  → 1 gold   (0.5 gold/min)
// Medium:     ~5 min  → 4 gold   (0.8 gold/min)
// Hard:       ~15 min → 20 gold  (1.3 gold/min)
// Extra-Hard: ~45 min → 90 gold  (2.0 gold/min)

export const QUEST_REWARDS = {
  'easy':       { gold: 1,  exp: 1,  rep: 1  },
  'medium':     { gold: 5,  exp: 5,  rep: 5  },
  'hard':       { gold: 10, exp: 10, rep: 10 },
  'extra-hard': { gold: 20, exp: 20, rep: 20 },
};

// Generation bonus: bred dragons earn more than wild-caught
// Applied to gold and EXP only (not rep)
export const GENERATION_BONUS_RATE = 0.05;  // +5% per generation
export const GENERATION_BONUS_CAP = 2.0;    // max 2x at gen 20
