# Gameplay, Economy & Implementation Plan

> Consolidated from GAMEPLAY_AND_IMPLEMENTATION.md, SKILL_TREE_AND_ECONOMY_v3.md, and MASTER_PLAN.md.
> SKILL_TREE_AND_ECONOMY_v3 is source of truth for any conflicts.

---

## Core Loop

```
Select Parents → Configure Gene Priorities → Breed → Discover Offspring Traits
    → Analyze Hidden Genotypes → Iterate Toward Target Build
        → Validate in Combat / Fulfill Kingdom Requests → Earn Progression
            → Unlock Tools → Breed Better
```

**The fantasy:** You're not grinding RNG — you're *solving* genetics to create the exact overpowered monster you theorycrafted.

---

## Build-Crafting Hook

Traits interact. A dragon with fire breath + armored scales + bulky body type becomes an unstoppable tank. Glass finish + sinuous body + aurora breath creates a beautiful evasion specialist. But these require stacking specific gene values across generations — you're engineering lineages toward a target build.

Some combos documented in Codex. Others hidden for discovery. Rivals have signature builds you reverse-engineer by studying their dragons.

---

## Quest Loop

1. **Accept quest** — kingdom wants a dragon with specific traits (1–4 trait requirements depending on difficulty)
2. **Assess stable** — do current breeders cover this? Use reveals if needed
3. **Capture wild dragons** — often needed to introduce new alleles into the pool
4. **Breed** — pair dragons, apply manipulation skills/items
5. **Clutch management** — choose which eggs to instant-hatch, move timed egg to rack, sell/discard rest
6. **Evaluate offspring** — reveal traits, keep or release
7. **Repeat steps 3–6** as needed for difficult quests (multiple breeding cycles)
8. **Complete quest** — deliver matching dragon (must be 100% trait match — no partial credit), earn gold + XP + rep
9. **Spend rewards** — shops, skills, unlocks

---

## Currency System

Three distinct currency loops with no overlap:

| Currency | Earned From | Spent On |
|----------|-------------|----------|
| **XP** | Completing quests | Spent directly on skills (no leveling system — XP is the skill currency) |
| **Gold** | Completing quests, selling unused eggs | Shop items (potions, talismans, tomes) |
| **Reputation** | Completing quests | Unlocking shops, shop tiers, discounts, achievement-gated unlocks |

Gold never buys skills. XP never replaces items. Rep only gates shop access and unlocks.

### Quest Rewards

Base rewards use difficulty-scaled flat scaling (1/5/10/20).

**Generation bonus (hard/extra hard only):** Rewards solving quests in fewer breeding generations. The bonus applies to all currency rewards (gold, XP, rep) and scales inversely with generations used.

| Difficulty | Gen 0 Bonus | Scales To | Bonus Gone At |
|------------|-------------|-----------|---------------|
| **Hard** | 1.5x all rewards | Linear decrease | Gen 5 (no bonus) |
| **Extra Hard** | 2x all rewards | Linear decrease | Gen 10 (no bonus) |
| Easy / Normal | No generation bonus | — | — |

---

## Egg & Hatching System

Breeding produces a **clutch of 4 eggs**. Hatching is the primary resource management mechanic — the friction is a *decision*, not a timer.

### Hatch Tiers Per Clutch

| Tier | Count | Behavior |
|------|-------|----------|
| **Instant** | 2 eggs | Player chooses 2 eggs to hatch immediately |
| **Timed** | 1 egg | Moves to Egg Rack, hatches over time (~5 min base, reducible via skills) |
| **Locked** | 1 egg | Requires an item or spell to hatch. Otherwise discarded or sold |

### Egg Rack

A separate holding area where timed-hatch eggs incubate. Frees up the breeding nest immediately so the player can start the next breeding. Base rack size: 1 slot. Expandable via Talisman Shop.

### Egg Sale

Unlocked via rep milestone (not a skill). Handler skill tree upgrades increase sale price. Provides a gold loop for excess eggs.

### Progression Feel

- **Early game:** Tight choices. 4 eggs, only 2 instant, 1 timed, 1 locked. Every hatch matters.
- **Mid game:** Larger clutches + more instant hatch capacity + bigger egg rack.
- **Late game:** Full clutch instant hatching. Player has earned the right to brute-force.

---

## Stable System

### Breeding Nests
- Active breeders live here
- **Base slots: 2** → First upgrade: 2→4 (milestone) → Further via Talisman Shop (exponential, gradual)

### Keeper Den
- Dragons kept but not actively breeding
- **Base slots: 1** → Second upgrade: 1→3 (milestone) → Further via Talisman Shop (exponential, steeper)

### Stasis Crystals
- Highest Talisman Shop tier. Freezes a dragon — no slot limit. Expensive, 1 per restock.

---

## Almanac System

Entries hidden by default, revealed when player stables a dragon with the relevant trait. Some synergy entries require specific combinations. Persists permanently. Debug toggle to reveal all.

---

## Reputation System

Rep unlocks shops and gates tiers within shops. Tiers alternate between new items and discounts. Some unlocks also require achievements.

| Example Achievement | Unlocks |
|---------------------|---------|
| Breed all 8 main colors | Chroma Tome |
| Discover 10 specialty gem finishes | Talisman Shop access |
| Discover 20 specialty finishes | Luster Tome |
| Breed one of each 8 main breath elements | Breath Codex |
| Breed 100 mutated dragons | Catalyst Grimoire |

Shop refresh every 3rd breeding cycle (tunable). Inventory resets each refresh.

---

## Skill Tree

XP earned from quests is spent directly to unlock skills. Three branches. XP spent in one branch is XP NOT spent in another. Costs escalate by tier.

---

### GENETICIST BRANCH (Information & Reveals)

All reveal skills are per-dragon, permanent once used.

#### Reveal Line

| Tier | Skill | Effect |
|------|-------|--------|
| 1 | **Allele Peek I** | Reveal one allele on 1 trait |
| 2 | **Allele Peek II** | One allele on up to 3 traits |
| 3 | **Allele Peek III** | One allele on up to 6 traits |
| 4 | **Trait Read I** | BOTH alleles on 1 trait |
| 5 | **Trait Read II** | Both alleles on up to 3 traits |
| 6 | **Trait Read III** | Both alleles on up to 6 traits |
| 7 | **Genome Scan I** | Both alleles on up to 10 traits |
| 8 | **Genome Scan II** | Both alleles on up to 15 traits |
| 9 | **Genome Scan III** | Both alleles on up to 20 traits |
| 10 | **Full Genotype Read** | Entire genotype. Requires all prior. |

#### Egg Inspection Line

Mirrors the Reveal Line progression — starts with single allele peeks on eggs, advances to full allele pairs.

| Tier | Skill | Effect |
|------|-------|--------|
| 4 | **Egg Candling I** | Reveal one allele on 1 trait in unhatched egg |
| 5 | **Egg Candling II** | One allele on up to 3 traits |
| 6 | **Egg Candling III** | One allele on up to 6 traits |
| 7 | **Egg Scrying I** | BOTH alleles on 1 trait in unhatched egg |
| 8 | **Egg Scrying II** | Both alleles on up to 3 traits |
| 9 | **Egg Scrying III** | Both alleles on up to 6 traits |
| 10 | **True Sight** | Full genotype of unhatched egg |

#### Carrier Detection Line

| Tier | Skill | Effect |
|------|-------|--------|
| 2 | **Recessive Sense** | Yes/no flag: does dragon carry ANY hidden recessives? |
| 3 | **Carrier Sense** | Per-trait carrier/not-carrier indicator (not exact alleles). Requires Recessive Sense. |

#### Inherited Knowledge Line (Phenotype-Level)

Works with any known parent traits. Auto-reveals phenotype on eggs/offspring.

| Tier | Skill | Effect |
|------|-------|--------|
| 1 | **Inherited Knowledge I** | 25% of known parent traits |
| 3 | **Inherited Knowledge II** | 50% |
| 5 | **Inherited Knowledge III** | 75% |
| 7 | **Inherited Knowledge IV** | 100% |

#### Pedigree Mastery Line (Genotype-Level — requires Inherited Knowledge III)

When parents have fully-read traits, auto-reveals full allele data on offspring.

| Tier | Skill | Effect |
|------|-------|--------|
| 6 | **Pedigree Mastery I** | 25% of fully-read parent traits |
| 7 | **Pedigree Mastery II** | 50% |
| 8 | **Pedigree Mastery III** | 75% |
| 9 | **Pedigree Mastery IV** | 100% |

---

### BREEDER BRANCH (Manipulation)

Two parallel paths plus shared Clutch Management.

#### Clutch Management (Shared)

Clutch caps at 9 (base 4 + 5 skills). Hatch capacity scales alongside.

| Tier | Skill | Effect |
|------|-------|--------|
| 1 | **Clutch Size I** | +1 egg (4→5) |
| 1 | **Hatch Capacity I** | +1 instant hatch (2→3) |
| 2 | **Clutch Size II** | +1 (5→6) |
| 3 | **Hatch Capacity II** | +1 (3→4) |
| 4 | **Clutch Size III** | +1 (6→7) |
| 5 | **Hatch Capacity III** | +1 (4→5) |
| 6 | **Clutch Size IV** | +1 (7→8) |
| 7 | **Hatch Capacity IV** | +1 (5→6) |
| 8 | **Clutch Size V** | +1 (8→9) |
| 9 | **Hatch Capacity V** | +1 (6→7) |

#### Selective Pressure Path (Luck/Broad)

| Tier | Skill | Effect |
|------|-------|--------|
| 1 | **Selective Pressure I** | 5% chance, 1 random trait toward quest alleles |
| 2 | **Selective Pressure II** | 10%, 1 trait |
| 3 | **Selective Pressure III** | 10%, up to 2 traits |
| 4 | **Selective Pressure IV** | 15%, up to 2 |
| 5 | **Selective Pressure V** | 15%, up to 3 |
| 6 | **Selective Pressure VI** | 20%, up to 3 |
| 7 | **Selective Pressure VII** | 20%, up to 4 |
| 8 | **Selective Pressure VIII** | 25%, up to 5 |

*Mutation extension (requires Catalyst Grimoire):*

| Tier | Skill | Effect |
|------|-------|--------|
| 5 | **Selective Mutation I** | 10% chance quest allele appears as mutation, 1 trait |
| 6 | **Selective Mutation II** | 25%, up to 2 |
| 7 | **Selective Mutation III** | 50%, up to 3 |
| 8 | **Selective Mutation IV** | 75%, up to 4 |
| 9 | **Selective Mutation V** | 100%, up to 4 |

#### Trait Lock Path (Precision/Surgical)

| Tier | Skill | Effect |
|------|-------|--------|
| 1 | **Trait Lock I** | Lock 1 trait: choose which allele passes |
| 2 | **Trait Lock II** | 2 traits (across both parents) |
| 3 | **Trait Lock III** | 3 traits |
| 4 | **Trait Lock IV** | 4 traits |
| 5 | **Trait Lock V** | 5 traits |
| 6 | **Trait Lock VI** | 6 traits |
| 7 | **Trait Lock VII** | 8 traits |
| 8 | **Trait Lock VIII** | 10 traits |

*Mutation extension (requires Catalyst Grimoire):*

| Tier | Skill | Effect |
|------|-------|--------|
| 5 | **Targeted Mutation I** | Force specific allele as mutation on 1 trait |
| 6 | **Targeted Mutation II** | Up to 2 |
| 7 | **Targeted Mutation III** | Up to 3 |
| 8 | **Targeted Mutation IV** | Up to 4 |

---

### HANDLER BRANCH (Economy, Meta, & Tome Sub-Branches)

#### Economy Path

| Tier | Skills | Effect |
|------|--------|--------|
| 1–6 | **Gold Bonus I–VI** | +5% quest gold per tier (max +30%) |
| 1–6 | **XP Bonus I–VI** | +5% quest XP per tier (max +30%) |
| 1–6 | **Rep Bonus I–VI** | +5% quest rep per tier (max +30%) |

#### Egg Sales Path

| Tier | Skills | Effect |
|------|--------|--------|
| 1–8 | **Egg Pricing I–VIII** | +10/20/30/40/50/65/80/100% egg sale price |

#### Quest Path

| Tier | Skill | Effect |
|------|-------|--------|
| 1 | **Quest Reroll I** | Reroll 1 trait requirement |
| 2 | **Quest Reroll II** | Reroll up to 2 |
| 3 | **Quest Reroll III** | Up to 3 |
| 4 | **Quest Reroll IV** | Reroll all |
| 5 | **Quest Refresh** | Reroll ALL available quests |
| 2 | **Quest Flexibility I** | Swap 1 trait requirement for chosen one |
| 3 | **Quest Flexibility II** | Swap up to 2 |

#### Tome Sub-Branch Skills

Unlocked by purchasing tomes. Each follows the same pattern:

| Tier | Pattern | Effect |
|------|---------|--------|
| 1 | **[Tome] Pressure I** | Per-egg selective pressure for this gene category |
| 2 | **[Tome] Pressure II** | Per-clutch, 25% |
| 3 | **[Tome] Pressure III** | 50% |
| 4 | **[Tome] Pressure IV** | 75% |
| 5 | **[Tome] Pressure V** | 100% |
| 3 | **[Tome] Lock I** | Per-egg trait lock for this gene category |
| 4 | **[Tome] Lock II** | Per-clutch, 25% |
| 5 | **[Tome] Lock III** | 50% |
| 6 | **[Tome] Lock IV** | 75% |
| 7 | **[Tome] Lock V** | 100% |

Stacking: core Trait Lock + tome Lock = lock traits from both systems in one breeding.

---

## NPCs & Storyline Notes

### The Builder (Construction Worker NPC)

A construction worker NPC who is present from the very start of the game, before any shops are open. He's "building the shops" — and while he works on getting them ready, he's available to do smaller construction jobs for the player.

**Early game role:** The Builder offers milestone upgrades before any rep-gated shops unlock:
- **Nest Expansion** (2 → 4 nests) — available immediately
- **Den Expansion** (1 → 3 dens) — available immediately
- Prices use the same exponential expansion cost curve from economy-config

**Shop unlock narrative:** As the player earns reputation, the Builder "finishes construction" on each shop in order. The Potion Shop opens first (low rep), then Talisman Shop (mid rep + achievement), then Arcana Shop (high rep). The Builder's dialogue/presence reinforces this progression — he's always working on the next shop.

**Design intent:** This gives brand-new players an obvious early spend target (expand your stables!) before the economy system fully opens up, and frames the shop unlock progression as a natural part of the world rather than a UI gate.

---

## Shops

### Shop Unlock Order

| Order | Shop | Gate |
|-------|------|------|
| 1st | **Potion Shop** | Low rep |
| 2nd | **Talisman Shop** | Mid rep + achievement (10 specialty gem finishes) |
| 3rd | **Arcana Shop** | High rep |

### Potion Shop (Consumables)

Design principle: Every Breeder/Geneticist skill has a potion equivalent. Potions are expensive per-use but accessible before the skill.

| Rep Tier | Item | Mirrors Skill | Effect |
|----------|------|---------------|--------|
| 1 | **Broodmother's Draught** | Clutch Size | +1 egg |
| 1 | **Seer's Tincture** | Allele Peek | Reveal one allele, one trait, one dragon |
| 1 | **Quickening Salve** | — | Reduce timed hatch duration |
| 2 | **Dominant Tonic** | Selective Pressure | Bias one trait dominant |
| 2 | **Recessive Elixir** | Selective Pressure | Bias one trait recessive |
| 2 | **Hatching Powder** | Hatch Capacity | Unlock locked egg |
| 2 | **Revealing Draught** | Trait Read | Both alleles, one trait |
| 3 | — | — | Discount |
| 4 | **Oracle's Draught** | Egg Candling | Peek one allele on up to 3 traits in egg |
| 4 | **Bloodline Ink** | Full Read | Full genotype (expensive) |
| 4 | **Chromatic Tincture** | Chroma Tome | Color pressure, one egg |
| 4 | **Lustral Oil** | Luster Tome | Finish pressure, one egg |
| 4 | **Breath Essence** | Breath Codex | Breath element pressure, one egg |
| 4 | **Ossite Powder** | Morphology Tome | Body/frame pressure, one egg |
| 4 | **Keratin Salve** | Appendage Tome | Horn/spine/tail pressure, one egg |
| 4 | **Wyrm's Breath Oil** | Breath Arts Tome | Breath shape/range pressure, one egg |
| 4 | **Scale Lacquer** | Scale Appendix | Scale type pressure, one egg |
| 5 | — | — | Discount |
| 6 | **Flux Catalyst** | Mutation skills | Increase mutation chance |
| 6 | **Binding Resin** | — | Suppress mutation chance |
| 6 | **Precision Elixir** | Trait Lock | Choose exact allele (very expensive) |
| 6 | **Scrying Vapors** | Egg Scrying | Peek both alleles on up to 3 traits in egg |
| 6 | **Carrier's Tincture** | Carrier Sense | Full carrier status, one dragon |
| 7 | — | — | Discount |

### Talisman Shop (Permanent Items)

| Rep Tier | Item | Effect |
|----------|------|--------|
| 1 | **Nest/Den/Egg Rack Expansion** | +1 slot each (exponential pricing) |
| 2 | **Breeding Charm** | Permanent +1 clutch size (stacks with skill) |
| 2 | **Hatcher's Pendant** | Permanent +1 instant hatch (stacks) |
| 3 | — | Discount |
| 4 | **Chromatic/Lustral/Elemental/Morphic Amulets I–V** | Permanent bias toward rare traits per category |
| 4 | **Quick-Hatch Charm** | Permanent timed hatch reduction |
| 5 | — | Discount |
| 6 | **Stasis Crystal** | Freeze dragon, no slot limit (1 per restock) |
| 6 | **Appendage/Wyrm's Amulets I–V** | Permanent bias toward rare horn/spine/tail/breath |
| 7 | — | Discount |

### Arcana Shop (Tomes)

One-time purchases unlocking skill sub-branches. Some achievement-gated.

| Rep Tier | Tomes | Gate |
|----------|-------|------|
| 1 | **Morphology Tome: Foundations**, **Appendage Tome: Primary** | Rep only |
| 2 | **Morphology Tome: Structures**, **Appendage Tome: Secondary**, **Scale Appendix** | Rep only |
| 3 | — | Discount |
| 4 | **Morphology Tome: Details**, **Breath Arts Tome** | Rep only |
| 4 | **Chroma Tome** | Breed all 8 colors |
| 4 | **Luster Tome** | 20 specialty finishes |
| 4 | **Breath Codex** | All 8 breath elements |
| 5 | — | Discount |
| 6 | **Catalyst Grimoire** | 100 mutated dragons |
| 7 | — | Discount |

### Tome → Gene Mapping

| Tome | Genes Covered |
|------|---------------|
| Morphology: Foundations | Size, Wing Count |
| Morphology: Structures | Body Type *(Wing Size — not yet implemented, future addition)* |
| Morphology: Details | Limb Count, Bone Density *(Limb Length — not yet implemented, future addition)* |
| Appendage: Primary | Horn Style, Spine Style, Tail Shape |
| Appendage: Secondary | Horn Direction, Spine Height, Tail Length |
| Chroma Tome | Cyan, Magenta, Yellow |
| Luster Tome | Opacity, Shine, Schiller |
| Breath Codex | Fire, Ice, Lightning |
| Breath Arts Tome | Breath Shape, Breath Range |
| Scale Appendix | Scale Type |

Each gene covered by exactly one tome. No overlap. Wing Size and Limb Length will slot into their respective tomes when implemented.

### Utility Tomes

| Tome | Unlocks |
|------|---------|
| **Catalyst Grimoire** | Mutation sub-branches on both Breeder paths |
| **Seer's Codex** | Analytical tools (deferred — not current scope) |

Total: ~12 tomes.

---

## Item vs Skill Relationship

| Action | Potion (Gold, 1 use) | Skill (XP) | Tome Skill (Gold+XP) |
|--------|---------------------|-------------|----------------------|
| Reveal one allele | Seer's Tincture | Allele Peek | — |
| Reveal both alleles | Revealing Draught | Trait Read | — |
| Full genotype | Bloodline Ink | Full Genotype Read | — |
| Detect carriers | Carrier's Tincture | Carrier Sense | — |
| +1 egg | Broodmother's Draught | Clutch Size | — |
| Hatch locked egg | Hatching Powder | Hatch Capacity | — |
| Bias dominant/recessive | Tonic / Elixir | Selective Pressure | — |
| Target gene category | Specific Tinctures | — | [Tome] Pressure/Lock |
| Choose exact allele | Precision Elixir | Trait Lock | [Tome] Lock |
| Boost mutations | Flux Catalyst | Selective/Targeted Mutation | — |
| Suppress mutations | Binding Resin | — | — |
| Peek inside egg (1 allele) | Oracle's Draught | Egg Candling | — |
| Peek inside egg (allele pairs) | Scrying Vapors | Egg Scrying | — |
| +1 nest slot | Nest Expansion (Talisman) | — | — |

---

## Debug/Testing Toggles

**Visibility:** Show Full Genotype, Reveal Full Almanac ✅, Quest Highlighting ✅
**Bypasses:** Unlimited Hatch ✅, Unlimited Stables ✅, Free Quest Reroll ✅, Remove Breeding Cooldown
**Resets:** Rep, XP, Items, Achievements, Shop Unlocks, All Progress

---

## Implementation Staging

### Stage 1: Economy Foundation & Core Loop ✅ COMPLETE
- [x] Three-currency system, egg/clutch system, egg rack, egg selling
- [x] Stable rebalance (2 nests, 1 den, 1 egg rack)
- [x] Three shops with rep-gated tiers, slot expansion purchasing
- [x] Achievement tracking, almanac discovery hiding
- [x] Genetics engine (23 genes, inheritance, phenotype, mutations)
- [x] Breeding, stable management, codex/almanac, quest system, family tree
- [x] Dev tools, NFC dragon claim, PNG sprites/eggs, dark/light theme
- [ ] Early milestone upgrades (nests 2→4, den 1→3) — available via Builder NPC (see NPC note below)

### Stage 2: Skills, Items, Inventory & Hotbar ← NEXT
- [ ] Skill tree UI + XP spending with escalating costs
- [ ] Default genotype hidden, per-dragon reveal persistence
- [ ] Full Geneticist/Breeder/Handler branches
- [ ] All shop item effects (potions, talismans, tome unlocks)
- [ ] Catalyst Grimoire + mutation sub-branches
- [ ] Collapsible item hotbar, achievement gates for tomes
- [ ] Inventory system (persistent storage for items, stacking, use/equip)

### Stage 3: Combat & Stat Derivation
- [ ] Phenotype → combat stat derivation
- [ ] Auto-battler engine
- [ ] Battle types and rival breeders
- [ ] Combat as quest requirement type

### Stage 4: Expeditions & Wild Encounters
- [ ] Send dragon teams to wild regions
- [ ] Semi-auto combat, capture mechanics
- [ ] Random encounters (legendary wilds, NPC encounters)

### Stage 5: Polish
- [ ] Tutorial/onboarding (First Clutch intro, progressive mini-tutorials)
- [ ] Sound/music, accessibility
- [ ] Save format versioning and migration

### Stage 6: Difficulty Modes & Events
- [ ] Sanctuary/Handler/Dragoon with custom toggles
- [ ] Random event system (kingdom, breeding, rival dynamics)
- [ ] Difficulty-scaled economy modifiers

### Stage 7: Analytical Tools & New UI *(deferred — nothing here is set in stone)*
- [ ] Seer's Codex tome + analytical sub-branch
- [ ] Clutch Preview (probability distribution)
- [ ] Punnett Square overlay
- [ ] Bloodline Planner (multi-generation path planning)

### Stage 8: Kingdom System & Campaigns *(uncertain — may not ship with initial game)*
- [ ] See "Speculative / Not Yet In Scope" section below

### Stage 9: Legacy & Retirement *(uncertain — may not ship with initial game)*
- [ ] See "Speculative / Not Yet In Scope" section below

### Stage 10: Expansion Packs *(separate from initial game development)*
- [ ] Beast/Insect/Aquatic/Avian body type packs
- [ ] New genes per pack (including Wing Size, Limb Length)
- [ ] Cross-pack mythological combos

---

## Technical Architecture

### Genotype Structure
```
Dragon {
  genotype: {
    body_size: [a, b],       // 1-6
    body_type: [a, b],       // 1-3
    body_scales: [a, b],     // 1-3
    frame_wings: [a, b],     // 0-5
    frame_limbs: [a, b],     // 0-3
    frame_bones: [a, b],     // 1-3
    breath_shape: [a, b],    // 1-3
    breath_range: [a, b],    // 1-3
    color_cyan: [a, b],      // 0-3
    color_magenta: [a, b],   // 0-3
    color_yellow: [a, b],    // 0-3
    finish_opacity: [a, b],  // 0-3
    finish_shine: [a, b],    // 0-3
    finish_schiller: [a, b], // 0-3
    breath_fire: [a, b],     // 0-3
    breath_ice: [a, b],      // 0-3
    breath_lightning: [a, b],// 0-3
    horn_style: [a, b],      // categorical
    horn_direction: [a, b],  // categorical
    spine_style: [a, b],     // categorical
    spine_height: [a, b],    // 1-3
    tail_shape: [a, b],      // 1-3
    tail_length: [a, b],     // 1-3
  },
  phenotype: { ... },
  stats: { ... },
  metadata: { name, age, stage, lineage_id, ... }
}
```

### Architecture Principles
1. Data-only config files for balancing
2. Engine modules for logic (reward-engine.js, etc.)
3. UI modules for display (ui-rewards.js, etc.)
4. Surgical integration — minimal touching of existing files

### Cross-Cutting
- Save format versioning (SAVE_VERSION bump + migration per stage)
- Dark theme, mobile-first portrait layout
- No scope creep per stage
- Seeded RNG for reproducibility

---

## Speculative / Not Yet In Scope

> **The following systems have been designed but may not ship with the initial game.** Nothing in the core game should depend on or reference specifics from these sections. They are documented here for future reference only.

---

### Campaign / Kingdom Structure

Each campaign = service to one kingdom's ruling lineage. Ends when ruler dies (~10–20 years), you leave, or kingdom falls (rare).

**Kingdom Generation (Procedural):**
- Heraldry (primary color, sigil, motto/values), geography (climate, resources, neighbors), starting dragon stock (3–6 dragons with kingdom-historical bloodlines)

**Rulers Have Genetics Too:**

| Trait | Dominant | Recessive | Effect |
|-------|----------|-----------|--------|
| Temperament | A (aggressive) | a (patient) | Request urgency, war frequency |
| Taste | T (traditional) | t (innovative) | Classic vs exotic preference |
| Generosity | G (generous) | g (stingy) | Reward multipliers |
| Attention | F (focused) | f (fickle) | Goal stability |

Heir inherits via Mendelian genetics. Random life events can modify personality mid-reign.

**Request Tiers:** Passive Desires (ongoing favor), Active Goals (deadlines), Urgent Demands (high stakes).

**Favor System:** −100 (Exiled) to +100 (Legendary). Per-kingdom, distinct from Rep.

| Range | Status | Key Effect |
|-------|--------|------------|
| −100 to −50 | Distrusted | Take 0 dragons |
| −49 to −1 | Tolerated | Take 1 |
| 0–24 | Neutral | Take 2, buy 2 high price |
| 25–49 | Respected | +25% pay, take 2, buy 4 |
| 50–74 | Honored | +50% pay, take 3, buy 5 |
| 75–99 | Celebrated | +75% pay, take 3, buy 6 |
| 100 | Legendary | +100% pay, take 4, buy unlimited, parting gift |

**Progression:**
- Persists: Almanac/Codex, Gold, Legendary Dragons (favor-limited), Achievements, Items
- Resets on kingdom change: Stable (favor-limited carry), Favor (fresh), Facilities (rebuild)

---

### Legacy & Retirement (Prestige/Ascension)

**When to Retire:** Minimum Rank 5, 10+ in-game years. Strategic retirement faster than grinding.

**Heir Skill System:** Skills reset on retirement. Heir receives half+ of parent's spent skill points as unspent XP, enabling respec. Boons/traits may allow retaining specific skills. Items and Almanac carry forward.

**Legacy Points:** Earned from ranks (10/rank), kingdoms served (5), rulers outlasted (3), rivals defeated (8), legendary favor (15), dragons bred (5/100), Codex entries (2), legendary dragons (20), unique mutations (10).

**Legacy Shop:** Tier 1 (10–50 pts) head starts → Tier 4 (500+ pts) advanced bonuses. ~5000+ total = 8–15 generations.

**Spouse System:** Linear unlocks (Rival's Family, Nobility, Common Folk, Royalty at Gen 5+) + RNG encounters (Forest Witch, Shipwrecked Explorer, Dragon Cultist, Wandering Scholar, Retired Rival).

**Generation Arc:** Gen 1 ~150 LP → Gen 4+ prestige ranks, challenge runs.

---

### Battle System (Auto-Battler)

An auto-battler where dragon combat stats derive from phenotype. Nothing here is finalized but the general direction and design work are preserved below.

#### Stat Derivation from Genetics

Key mappings (exact values TBD during balancing):
- Size → HP, damage, food requirements
- Body Type → evasion vs raw damage trade-off
- Scales → defense vs speed trade-off
- Wing Count → flight capability, evasion
- Limb Count → ground speed, grapple, stability
- Bone Density → durability vs flight trade-off
- Breath Element → elemental damage type and effectiveness
- Breath Shape → targeting pattern (single/multi/AoE)
- Breath Range → engagement distance
- Horns → melee damage
- Spines → defense, intimidation
- Tail → tail attack damage and reach

#### Combat Flow
1. **Setup:** Arrange dragons (front/back line, targeting priorities)
2. **Battle:** Auto-resolves, watchable in real-time or skippable
3. **Results:** Winners, casualties (based on difficulty mode)

#### Battle Types
- **Skirmish:** Low stakes, test teams, no death
- **Formal Duel:** Rival's champion vs yours, reputation stakes
- **War Battle:** Kingdom conflict, death possible, big rewards
- **Tournament:** Multi-round bracket, prestige rewards

#### Named Rivals
- **Varek of the Iron Peaks** — Heavy armor tanks, slow but unstoppable
- **Sera of the Coastlands** — Iridescent display dragons, secretly combat-viable
- **Old Morden** — Traditional, predictable but solid fundamentals
- **The Twins of Ashfall** — Fire specialists, aggressive glass cannons

Beating a rival = prestige, favor, possibly steal their breeding techniques.

#### Wild Expeditions
Send dragon team to wild region. Semi-auto-battler: fight colony guardians, capture weakened wilds. Random encounters: legendary wild spawns, NPC encounters (spouse candidates), abandoned nests, ancient ruins with tool unlocks.

---

### Random Events

#### Kingdom Events
**Positive:** Eclipse/comet (mutations more likely), royal birth (quick-request, high favor), traveling tournament.

**Neutral:** Visiting noble offers to buy your dragon, ancient dragon tomb discovery.

**Negative (disabled in Sanctuary):** Plague (lose 1–3 dragons), rival's dragon escapes to your territory (diplomatic incident), ruler personality shift.

#### Breeding RNG

| Event | Chance |
|-------|--------|
| Spontaneous mutation | 0.5% |
| Twin clutch | 2% |
| Prodigy hatchling (stat boost) | 1% |
| Throwback (great-grandparent trait) | 1% |
| Stillborn (lethal combo) | 5% for lethal combos |

#### Rival Dynamics
Rivals can die/retire (new ones emerge), move kingdoms, have breakthroughs, offer alliances/trades, poach your techniques if they beat you, fall from grace.

---

### Difficulty Modes

#### Sanctuary (Casual)
No plagues/raids, no dragon death (injuries only), predictable rulers, reduced favor loss, generous/no deadlines. Only positive/neutral RNG events. **0.5x Legacy Point multiplier.**

#### Handler (Standard)
Occasional plagues/raids, possible dragon death in battle, semi-predictable rulers, standard rates, reasonable deadlines. Full event spectrum. **1x multiplier.**

#### Dragoon (Hard)
Frequent devastating events, common dragon death, unpredictable rulers, harsh favor loss, strict overlapping deadlines, negative-skewed events. Optional permadeath toggle. **2x multiplier (3x with permadeath).**

#### Custom Toggles (Any Mode)
Dragon Death, Negative Events, Time Pressure, Upkeep Costs, Ironman — all on/off. Can switch DOWN anytime (lose multiplier). Cannot switch UP mid-generation.
