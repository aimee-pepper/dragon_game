// ============================================================
// Economy configuration — data-only tables for the full economy
// ============================================================
// All values sourced from TUNING_VALUES.md + SKILL_TREE_AND_ECONOMY_v3.md
// No logic here — just numbers. Import where needed.

// ── XP costs per skill tier ──────────────────────────────────
// Higher tier skills cost more XP to unlock.
// Total to max a 10-tier line: 267 XP
// Total to max a 6-tier line: 80 XP
// Total to max an 8-tier line: 152 XP

export const XP_COST_PER_TIER = {
  1: 5,
  2: 7,
  3: 10,
  4: 14,
  5: 19,
  6: 25,
  7: 32,
  8: 40,
  9: 50,
  10: 65,
};

// ── Reputation thresholds ────────────────────────────────────

// Shop unlock thresholds (base rep needed to access each shop)
export const SHOP_UNLOCK_REP = {
  carpenter: 10,
  potion: 50,
  talisman: 150,  // also requires achievement: discover 10 gem finishes
  arcana: 400,
};

// Internal shop tiers — rep required BEYOND the shop's unlock threshold
// Tiers alternate: items → discount → items → discount → ...
export const SHOP_TIER_OFFSETS = {
  1: 0,     // shop access (see SHOP_UNLOCK_REP)
  2: 75,    // new items
  3: 125,   // discount (5-10%)
  4: 200,   // new items
  5: 300,   // discount (15-20%)
  6: 425,   // new items
  7: 575,   // discount (25%)
};

// Discount percentages per discount tier
export const SHOP_DISCOUNTS = {
  3: 0.07,  // 7% (midpoint of 5-10%)
  5: 0.17,  // 17% (midpoint of 15-20%)
  7: 0.25,  // 25%
};

// ── Shop refresh ─────────────────────────────────────────────

export const SHOP_REFRESH_INTERVAL = 3; // refresh every Nth breeding cycle

// ── Egg economy ──────────────────────────────────────────────

export const EGG_SALE_REP_COST = 50; // rep cost to purchase egg selling license from talisman shop

export const BASE_EGG_SALE_PRICE = 5; // gold per egg

// Egg pricing skill bonuses (cumulative percentages)
export const EGG_PRICING_BONUS = {
  1: 0.10,  // +10%  → 5.5g
  2: 0.20,  // +20%  → 6g
  3: 0.30,  // +30%  → 6.5g
  4: 0.40,  // +40%  → 7g
  5: 0.50,  // +50%  → 7.5g
  6: 0.65,  // +65%  → 8.25g
  7: 0.80,  // +80%  → 9g
  8: 1.00,  // +100% → 10g
};

// ── Egg hatching ─────────────────────────────────────────────

export const BASE_HATCH_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const HATCH_REDUCTION_PER_SALVE = 60 * 1000; // -1 min per Quickening Salve
export const HATCH_REDUCTION_PER_CHARM = 60 * 1000; // -1 min per Quick-Hatch Charm (permanent)
export const MIN_HATCH_TIME_MS = 60 * 1000;          // minimum 1 minute

// ── Clutch system ────────────────────────────────────────────

export const BASE_CLUTCH_SIZE = 4;
export const BASE_INSTANT_HATCH = 2;
export const BASE_TIMED_EGGS = 1;
export const BASE_LOCKED_EGGS = 1;

// ── Egg rack ─────────────────────────────────────────────────

export const BASE_EGG_RACK_SLOTS = 1;

// ── Stable slot scaling ──────────────────────────────────────

// Breeding Nests
// Base: 2 slots. First upgrade (2→4) is a milestone reward (free).
export const BASE_NEST_SLOTS = 2;
export const MILESTONE_NEST_SLOTS = 4; // after first milestone

export const NEST_EXPANSION_COSTS = {
  5: 50,
  6: 75,
  7: 110,
  8: 160,
  9: 230,
  10: 325,
};
// Formula: ~50 * 1.45^(slot-5)

// Keeper Den
// Base: 1 slot. First upgrade (1→3) is a milestone reward (free).
export const BASE_DEN_SLOTS = 1;
export const MILESTONE_DEN_SLOTS = 3; // after second milestone

export const DEN_EXPANSION_COSTS = {
  4: 75,
  5: 150,
  6: 300,
  7: 600,
  8: 1200,
  9: 2400,
  10: 4800,
};
// Formula: 75 * 2^(slot-4) — doubles each time. Deliberately punishing.

// Egg Rack expansion
export const EGG_RACK_EXPANSION_COSTS = {
  2: 50,
  3: 75,
  4: 110,
  5: 160,
  6: 230,
};
// Formula: ~50 * 1.45^(slot-2) — same gentle curve as breeding nests

// ── Gold costs — shop items ──────────────────────────────────

// Carpenter — single one-off upgrade (carpenter vanishes after purchase)
export const CARPENTER_PRICES = {
  'carpenter-upgrade': { gold: 15, tier: 1, name: "Carpenter's Overhaul", milestone: 'both' },
};

export const POTION_PRICES = {
  'broodmothers-draught':  { gold: 15,  tier: 1, name: "Broodmother's Draught" },
  'seers-tincture':        { gold: 10,  tier: 1, name: "Seer's Tincture" },
  'quickening-salve':      { gold: 12,  tier: 1, name: 'Quickening Salve' },
  'dominant-tonic':        { gold: 25,  tier: 2, name: 'Dominant Tonic' },
  'recessive-elixir':      { gold: 25,  tier: 2, name: 'Recessive Elixir' },
  'hatching-powder':       { gold: 20,  tier: 2, name: 'Hatching Powder' },
  'revealing-draught':     { gold: 30,  tier: 2, name: 'Revealing Draught' },
  'oracles-draught':       { gold: 50,  tier: 4, name: "Oracle's Draught" },
  'bloodline-ink':         { gold: 150, tier: 4, name: 'Bloodline Ink' },
  'chromatic-tincture':    { gold: 40,  tier: 4, name: 'Chromatic Tincture' },
  'lustral-oil':           { gold: 40,  tier: 4, name: 'Lustral Oil' },
  'breath-essence':        { gold: 40,  tier: 4, name: 'Breath Essence' },
  'ossite-powder':         { gold: 40,  tier: 4, name: 'Ossite Powder' },
  'keratin-salve':         { gold: 40,  tier: 4, name: 'Keratin Salve' },
  'wyrms-breath-oil':      { gold: 40,  tier: 4, name: "Wyrm's Breath Oil" },
  'scale-lacquer':         { gold: 35,  tier: 4, name: 'Scale Lacquer' },
  'flux-catalyst':         { gold: 75,  tier: 6, name: 'Flux Catalyst' },
  'binding-resin':         { gold: 60,  tier: 6, name: 'Binding Resin' },
  'precision-elixir':      { gold: 100, tier: 6, name: 'Precision Elixir' },
  'scrying-vapors':        { gold: 80,  tier: 6, name: 'Scrying Vapors' },
  'carriers-tincture':     { gold: 65,  tier: 6, name: "Carrier's Tincture" },
};

export const TALISMAN_PRICES = {
  'egg-sale-license':         { gold: 0, rep: 50, tier: 1, name: 'Egg Selling License' },
  'breeding-nest-expansion': { gold: null, tier: 1, name: 'Breeding Nest Expansion', scaling: 'nest' },
  'den-slot-expansion':      { gold: null, tier: 1, name: 'Den Slot Expansion', scaling: 'den' },
  'egg-rack-expansion':      { gold: null, tier: 1, name: 'Egg Rack Expansion', scaling: 'rack' },
  'breeding-charm':          { gold: 120, tier: 2, name: 'Breeding Charm' },
  'hatchers-pendant':        { gold: 120, tier: 2, name: "Hatcher's Pendant" },
  'chromatic-amulet-1':      { gold: 50,  tier: 4, name: 'Chromatic Amulet I' },
  'chromatic-amulet-2':      { gold: 100, tier: 4, name: 'Chromatic Amulet II' },
  'chromatic-amulet-3':      { gold: 175, tier: 4, name: 'Chromatic Amulet III' },
  'chromatic-amulet-4':      { gold: 275, tier: 4, name: 'Chromatic Amulet IV' },
  'chromatic-amulet-5':      { gold: 400, tier: 4, name: 'Chromatic Amulet V' },
  'lustral-pendant-1':       { gold: 50,  tier: 4, name: 'Lustral Pendant I' },
  'lustral-pendant-2':       { gold: 100, tier: 4, name: 'Lustral Pendant II' },
  'lustral-pendant-3':       { gold: 175, tier: 4, name: 'Lustral Pendant III' },
  'lustral-pendant-4':       { gold: 275, tier: 4, name: 'Lustral Pendant IV' },
  'lustral-pendant-5':       { gold: 400, tier: 4, name: 'Lustral Pendant V' },
  'elemental-brooch-1':      { gold: 50,  tier: 4, name: 'Elemental Brooch I' },
  'elemental-brooch-2':      { gold: 100, tier: 4, name: 'Elemental Brooch II' },
  'elemental-brooch-3':      { gold: 175, tier: 4, name: 'Elemental Brooch III' },
  'elemental-brooch-4':      { gold: 275, tier: 4, name: 'Elemental Brooch IV' },
  'elemental-brooch-5':      { gold: 400, tier: 4, name: 'Elemental Brooch V' },
  'morphic-charm-1':         { gold: 50,  tier: 4, name: 'Morphic Charm I' },
  'morphic-charm-2':         { gold: 100, tier: 4, name: 'Morphic Charm II' },
  'morphic-charm-3':         { gold: 175, tier: 4, name: 'Morphic Charm III' },
  'morphic-charm-4':         { gold: 275, tier: 4, name: 'Morphic Charm IV' },
  'morphic-charm-5':         { gold: 400, tier: 4, name: 'Morphic Charm V' },
  'quick-hatch-charm':       { gold: 100, tier: 4, name: 'Quick-Hatch Charm' },
  'stasis-crystal':          { gold: 500, tier: 6, name: 'Stasis Crystal', limited: true },
  'appendage-amulet-1':      { gold: 50,  tier: 6, name: 'Appendage Amulet I' },
  'appendage-amulet-2':      { gold: 100, tier: 6, name: 'Appendage Amulet II' },
  'appendage-amulet-3':      { gold: 175, tier: 6, name: 'Appendage Amulet III' },
  'appendage-amulet-4':      { gold: 275, tier: 6, name: 'Appendage Amulet IV' },
  'appendage-amulet-5':      { gold: 400, tier: 6, name: 'Appendage Amulet V' },
  'wyrms-brooch-1':          { gold: 50,  tier: 6, name: "Wyrm's Brooch I" },
  'wyrms-brooch-2':          { gold: 100, tier: 6, name: "Wyrm's Brooch II" },
  'wyrms-brooch-3':          { gold: 175, tier: 6, name: "Wyrm's Brooch III" },
  'wyrms-brooch-4':          { gold: 275, tier: 6, name: "Wyrm's Brooch IV" },
  'wyrms-brooch-5':          { gold: 400, tier: 6, name: "Wyrm's Brooch V" },
};

export const TOME_PRICES = {
  'morphology-foundations': { gold: 250, tier: 1, name: 'Morphology Tome: Foundations' },
  'appendage-primary':      { gold: 250, tier: 1, name: 'Appendage Tome: Primary' },
  'morphology-structures':  { gold: 300, tier: 2, name: 'Morphology Tome: Structures' },
  'appendage-secondary':    { gold: 300, tier: 2, name: 'Appendage Tome: Secondary' },
  'scale-appendix':         { gold: 275, tier: 2, name: 'Scale Appendix' },
  'morphology-details':     { gold: 350, tier: 4, name: 'Morphology Tome: Details' },
  'breath-arts':            { gold: 350, tier: 4, name: 'Breath Arts Tome' },
  'chroma-tome':            { gold: 400, tier: 4, name: 'Chroma Tome', achievement: 'breed-all-colors' },
  'luster-tome':            { gold: 400, tier: 4, name: 'Luster Tome', achievement: 'discover-20-finishes' },
  'breath-codex':           { gold: 400, tier: 4, name: 'Breath Codex', achievement: 'breed-all-elements' },
  'catalyst-grimoire':      { gold: 500, tier: 6, name: 'Catalyst Grimoire', achievement: 'breed-100-mutants' },
};

// ── Achievement gates ────────────────────────────────────────

export const ECONOMY_ACHIEVEMENTS = {
  'breed-all-colors':     { desc: 'Breed all 8 main colors',                 unlocks: 'chroma-tome' },
  'discover-10-gems':     { desc: 'Discover 10 specialty gem finishes',       unlocks: 'talisman-shop' },
  'discover-20-finishes': { desc: 'Discover 20 specialty finishes',           unlocks: 'luster-tome' },
  'breed-all-elements':   { desc: 'Breed all 8 main breath elements',        unlocks: 'breath-codex' },
  'breed-100-mutants':    { desc: 'Breed 100 mutated dragons',               unlocks: 'catalyst-grimoire' },
};

// ── Mutation items ───────────────────────────────────────────

export const FLUX_CATALYST_BONUS = 0.15; // +15% mutation chance
// Binding Resin: suppress all mutation to 0% (handled in breeding logic)

// ── Selective Pressure weights ───────────────────────────────

export const SELECTIVE_PRESSURE = {
  1: { chance: 0.05, traits: 1 },
  2: { chance: 0.10, traits: 1 },
  3: { chance: 0.10, traits: 2 },
  4: { chance: 0.15, traits: 2 },
  5: { chance: 0.15, traits: 3 },
  6: { chance: 0.20, traits: 3 },
  7: { chance: 0.20, traits: 4 },
  8: { chance: 0.25, traits: 5 },
};

// ── Mutation skills ──────────────────────────────────────────

export const SELECTIVE_MUTATION = {
  1: { chance: 0.10, traits: 1 },
  2: { chance: 0.25, traits: 2 },
  3: { chance: 0.50, traits: 3 },
  4: { chance: 0.75, traits: 4 },
  5: { chance: 1.00, traits: 4 },
};

export const TARGETED_MUTATION = {
  1: { traits: 1 },
  2: { traits: 2 },
  3: { traits: 3 },
  4: { traits: 4 },
};
