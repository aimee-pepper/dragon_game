# Economy & Progression Tuning Values

All values in this document are tunable and should be easy to modify during testing. Group by system for quick reference.

---

## XP & Skills

XP is earned from quests and spent directly on skills — no leveling system. This may be revisited later to add a traditional leveling layer, but for testing, direct XP spend feels better.

---

## XP Costs Per Skill Tier

Higher tier skills cost more XP to unlock.

| Skill Tier | XP Cost |
|------------|---------|
| 1 | 5 |
| 2 | 7 |
| 3 | 10 |
| 4 | 14 |
| 5 | 19 |
| 6 | 25 |
| 7 | 32 |
| 8 | 40 |
| 9 | 50 |
| 10 | 65 |

Total XP to max one full 10-tier line: 267 XP.
Total XP to max a 6-tier line: 80 XP.
Total XP to max an 8-tier line: 152 XP.

Players must specialize heavily. Maxing everything is not feasible without significant quest grinding.

---

## Reputation Thresholds

Base: 50 rep for first shop tier.

### Shop Unlock Thresholds

| Shop | Rep to Unlock |
|------|---------------|
| Potion Shop | 50 |
| Talisman Shop | 150 + Achievement (breed rare/gem finishes) |
| Arcana Shop | 400 + Rep |

### Internal Shop Tiers (Each Shop)

| Tier | Type | Rep Required |
|------|------|-------------|
| 1 | Shop access | (see above) |
| 2 | New items | +75 beyond unlock |
| 3 | Discount (5-10%) | +125 beyond unlock |
| 4 | New items | +200 beyond unlock |
| 5 | Discount (15-20%) | +300 beyond unlock |
| 6 | New items | +425 beyond unlock |
| 7 | Discount (25%) | +575 beyond unlock |

Example for Potion Shop: unlock at 50, tier 2 at 125, tier 3 at 175, tier 4 at 250, tier 5 at 350, tier 6 at 475, tier 7 at 625.

---

## Gold Costs — Items

Base reference: 5g per egg sold. Scale everything relative to this.

### Potion Shop

| Item | Gold Cost | Rep Tier |
|------|-----------|----------|
| Broodmother's Draught | 15g | 1 |
| Seer's Tincture | 10g | 1 |
| Quickening Salve | 12g | 1 |
| Dominant Tonic | 25g | 2 |
| Recessive Elixir | 25g | 2 |
| Hatching Powder | 20g | 2 |
| Revealing Draught | 30g | 2 |
| Oracle's Draught | 50g | 4 |
| Bloodline Ink | 150g | 4 |
| Chromatic Tincture | 40g | 4 |
| Lustral Oil | 40g | 4 |
| Breath Essence | 40g | 4 |
| Ossite Powder | 40g | 4 |
| Keratin Salve | 40g | 4 |
| Wyrm's Breath Oil | 40g | 4 |
| Scale Lacquer | 35g | 4 |
| Flux Catalyst | 75g | 6 |
| Binding Resin | 60g | 6 |
| Precision Elixir | 100g | 6 |
| Scrying Vapors | 80g | 6 |
| Carrier's Tincture | 65g | 6 |

### Talisman Shop

| Item | Gold Cost | Rep Tier | Notes |
|------|-----------|----------|-------|
| Breeding Nest Expansion | See scaling table | 1 | |
| Den Slot Expansion | See scaling table | 1 | |
| Egg Rack Expansion | See scaling table | 1 | |
| Breeding Charm | 120g | 2 | |
| Hatcher's Pendant | 120g | 2 | |
| Chromatic Amulet I | 50g | 4 | Bias mirrors [Tome] Pressure I |
| Chromatic Amulet II | 100g | 4 | Mirrors Pressure II |
| Chromatic Amulet III | 175g | 4 | Mirrors Pressure III |
| Chromatic Amulet IV | 275g | 4 | Mirrors Pressure IV |
| Chromatic Amulet V | 400g | 4 | Mirrors Pressure V |
| Lustral Pendant I-V | Same scaling as above | 4 | |
| Elemental Brooch I-V | Same scaling as above | 4 | |
| Morphic Charm I-V | Same scaling as above | 4 | |
| Quick-Hatch Charm | 100g | 4 | |
| Stasis Crystal | 500g | 6 | 1 per shop restock, inventory resets each cycle |
| Appendage Amulet I-V | Same scaling as Chromatic | 6 | |
| Wyrm's Brooch I-V | Same scaling as Chromatic | 6 | |

### Arcana Shop (Tomes)

| Tome | Gold Cost | Rep Tier |
|------|-----------|----------|
| Morphology: Foundations | 250g | 1 |
| Appendage: Primary | 250g | 1 |
| Morphology: Structures | 300g | 2 |
| Appendage: Secondary | 300g | 2 |
| Scale Appendix | 275g | 2 |
| Morphology: Details | 350g | 4 |
| Breath Arts Tome | 350g | 4 |
| Chroma Tome | 400g | 4 |
| Luster Tome | 400g | 4 |
| Breath Codex | 400g | 4 |
| Catalyst Grimoire | 500g | 6 |

---

## Stable Slot Scaling

### Breeding Nests

Base: 2 slots. First upgrade (2→4) is a milestone reward (free).

| Slot # | Gold Cost | Cumulative |
|--------|-----------|------------|
| 5 | 50g | 50g |
| 6 | 75g | 125g |
| 7 | 110g | 235g |
| 8 | 160g | 395g |
| 9 | 230g | 625g |
| 10 | 325g | 950g |

Formula: roughly `50 * 1.45^(slot-5)` rounded.

### Keeper Den

Base: 1 slot. First upgrade (1→3) is a milestone reward (free).

| Slot # | Gold Cost | Cumulative |
|--------|-----------|------------|
| 4 | 75g | 75g |
| 5 | 150g | 225g |
| 6 | 300g | 525g |
| 7 | 600g | 1125g |
| 8 | 1200g | 2325g |
| 9 | 2400g | 4725g |
| 10 | 4800g | 9525g |

Formula: `75 * 2^(slot-4)` — doubles each time. Deliberately punishing. Late den slots are gold sinks.

### Egg Rack

Base: 1 slot. Expandable via Talisman Shop.

| Slot # | Gold Cost | Cumulative |
|--------|-----------|------------|
| 2 | 50g | 50g |
| 3 | 75g | 125g |
| 4 | 110g | 235g |
| 5 | 160g | 395g |
| 6 | 230g | 625g |

Formula: roughly `50 * 1.45^(slot-2)` — same gentle curve as breeding nests.

---

## Egg Economy

| Value | Amount |
|-------|--------|
| Base egg sale price | 5g |
| Egg Pricing I (+10%) | 5.5g |
| Egg Pricing II (+20%) | 6g |
| Egg Pricing III (+30%) | 6.5g |
| Egg Pricing IV (+40%) | 7g |
| Egg Pricing V (+50%) | 7.5g |
| Egg Pricing VI (+65%) | 8.25g |
| Egg Pricing VII (+80%) | 9g |
| Egg Pricing VIII (+100%) | 10g |

---

## Egg Hatching

| Value | Duration |
|-------|----------|
| Base timed hatch | 5 minutes |
| With Quickening Salve (potion) | -1 min per use (min 1 min) |
| With Quick-Hatch Charm (talisman, permanent) | -1 min permanently (stacks, min 1 min) |

---

## Shop Refresh

Shops refresh every **3rd breeding cycle**. Inventory **resets** on each refresh — unsold stock does not accumulate between cycles. Tunable.

---

## Mutation Chances

### Selective Mutation (Luck/Broad — requires Catalyst Grimoire)

| Tier | Chance Per Breeding | Max Traits Affected |
|------|---------------------|---------------------|
| Selective Mutation I | 10% | 1 |
| Selective Mutation II | 25% | 2 |
| Selective Mutation III | 50% | 3 |
| Selective Mutation IV | 75% | 4 |
| Selective Mutation V | 100% | 4 |

At max tier, a quest-relevant mutation is guaranteed — but you still can't control which trait mutates. That's the tradeoff for the luck path.

### Targeted Mutation (Precision — requires Catalyst Grimoire)

Targeted Mutation is a guaranteed forced mutation on chosen traits, not chance-based. The tier determines how many traits you can target per clutch.

| Tier | Traits Targetable |
|------|-------------------|
| Targeted Mutation I | 1 |
| Targeted Mutation II | 2 |
| Targeted Mutation III | 3 |
| Targeted Mutation IV | 4 |

### Mutation Items

| Item | Effect |
|------|--------|
| Flux Catalyst | +15% mutation chance across all traits for one breeding |
| Binding Resin | Suppress all mutation to 0% for one breeding |

---

## Selective Pressure Weights

Already defined in skill tree. Reproduced here for tuning reference:

| Tier | Chance | Traits Affected |
|------|--------|----------------|
| SP I | 5% | 1 random |
| SP II | 10% | 1 random |
| SP III | 10% | up to 2 random |
| SP IV | 15% | up to 2 |
| SP V | 15% | up to 3 |
| SP VI | 20% | up to 3 |
| SP VII | 20% | up to 4 |
| SP VIII | 25% | up to 5 |

---

## Achievement Gates

| Achievement | Requirement | Unlocks |
|-------------|-------------|---------|
| Breed all 8 main colors | Stable one dragon of each base color | Chroma Tome purchasable |
| Discover 10 specialty gem finishes | Stable dragons with 10 different gem finishes (pearl, opal, etc. — not ghost or stone finishes) | Talisman Shop access |
| Discover 20 specialty finishes | Stable dragons with 20 different specialty finishes (any type) | Luster Tome purchasable |
| Breed all 8 main breath elements | Stable one dragon of each base element | Breath Codex purchasable |
| Breed 100 mutated dragons | Hatch 100 dragons that carry at least one mutation | Catalyst Grimoire purchasable |

---

## Notes

- **No max level or XP cap.** Players can accumulate XP indefinitely.
- XP → skill purchase is direct (no leveling system). May revisit later.
- All values in this document are initial estimates for testing. Expect tuning passes.