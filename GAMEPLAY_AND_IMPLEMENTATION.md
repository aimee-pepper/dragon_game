# Gameplay Loop & Implementation Plan

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

## Campaign / Kingdom Structure

### Flow
Each campaign = service to one kingdom's ruling lineage. Campaigns end when the ruler dies (~10–20 in-game years), you choose to leave, or the kingdom falls (rare).

### Kingdom Generation (Procedural)

**Heraldry & Aesthetics:** Primary color (affects which dragon colors earn favor), sigil animal, motto/values (martial, scholarly, mercantile).

**Geography:** Climate (affects nearby wild populations), resources (rich kingdoms pay more), neighbors (determines rivals and conflict frequency).

**Starting Stock:** 3–6 starter dragons with established bloodlines reflecting kingdom history.

### Rulers (They Have Genetics Too)

| Trait | Dominant | Recessive | Effect |
|-------|----------|-----------|--------|
| Temperament | A (aggressive) | a (patient) | Request urgency, war frequency |
| Taste | T (traditional) | t (innovative) | Wants classic vs. exotic dragons |
| Generosity | G (generous) | g (stingy) | Reward multipliers |
| Attention | F (focused) | f (fickle) | How often goals change mid-project |

When rulers die, their heir inherits via Mendelian genetics. You can predict the next ruler from current ruler + spouse.

Random life events can modify personality mid-reign: "The king's illness has made him paranoid..." or "The queen has become fixated on albino dragons after a prophetic dream."

### Request Tiers

**Passive Desires** — Ongoing favor bonuses ("Dragons matching our heraldry please me")

**Active Goals** — Formal projects with deadlines ("Breed me a fire-breather within 2 years")

**Urgent Demands** — High stakes, short timelines ("Enemy ice-dragons devastated our forces. Counter them NOW.")

### Favor System

Scale: −100 (Exiled) to +100 (Legendary)

| Range | Status | Key Effect |
|-------|--------|------------|
| −100 to −50 | Distrusted | Take 0 dragons if leaving |
| −49 to −1 | Tolerated | Take 1 dragon |
| 0–24 | Neutral | Take 2, buy 2 at high price |
| 25–49 | Respected | +25% pay, take 2, buy 4 fair |
| 50–74 | Honored | +50% pay, take 3, buy 5 discount |
| 75–99 | Celebrated | +75% pay, take 3, buy 6 steep discount |
| 100 | Legendary | +100% pay, take 4, buy unlimited, parting gift |

**Favor gains:** Completed goals (+5–20), battle wins (+3–10), heraldry matches (+1/dragon passive), mini-events (+1–5), years of service (+1/yr).

**Mini-events (serendipitous matches):** "Your dragon's scales match the kingdom's sacred iris!" (+2), "The queen is charmed — your hatchling's eyes match hers!" (+3), "Fire-breathers warming the caves increased crop yields" (+2), "A bard composed a song about your specimen" (+2), heir bonding with hatchling (+5).

**Favor losses:** Failed urgent demand (−10–25), missed deadline (−5–15), lost battle badly (−3–10), dragon death (−2), leaving during crisis (−20).

---

## Progression Systems

### What Persists (Never Lost)
- **Breeder Rank** — Core advancement, unlocks tools/abilities
- **Codex** — Discovered genetics, documented synergies
- **Gold** — Currency
- **Legendary Dragons** — Named, can carry between kingdoms (limited by favor)
- **Achievements** — Permanent record

### What Resets (On Kingdom Change)
- **Stable** — Can't take all dragons (favor-limited)
- **Favor** — Starts fresh at new kingdom (with modifiers from Legacy)
- **Facilities** — Must rebuild at new location

---

## Legacy & Retirement System (Prestige/Ascension)

### When to Retire
- Minimum: Rank 5, 10+ in-game years
- No maximum — but progress past Rank 10 becomes exponentially slower first gen
- Strategic retirement is faster than grinding

### You Lose
Your character, current stable (unless carried via legacy perks), tool unlocks (re-earn faster), kingdom relationships.

### You Gain
Legacy Points, permanent bonuses from Legacy Shop, heir perk from spouse, compounding advantages.

### Legacy Points Earned From

| Achievement | Points |
|-------------|--------|
| Per Breeder Rank | 10 |
| Per kingdom served | 5 |
| Per ruler outlasted | 3 |
| Per rival defeated | 8 |
| Legendary favor (per kingdom) | 15 |
| Per 100 dragons bred | 5 |
| Per Codex entry | 2 |
| Per legendary dragon | 20 |
| Per unique mutation | 10 |

### Legacy Shop (Permanent)

**Tier 1 (10–50 pts):** Head starts (Rank 2), +10% XP, starting gold, Codex carryover, heirloom dragons

**Tier 2 (75–150 pts):** Tool unlocks early, genetic intuition (20% free allele reveal), renowned lineage (+10 starting favor)

**Tier 3 (200–400 pts):** Start at Rank 5, capture bonuses, bring 4 dragons forward

**Tier 4 (500+ pts):** Start at Rank 7, unique mutations, rivals offer techniques freely

~5000+ total to buy everything = 8–15 generations.

### Spouse System

**Linear unlocks (earned):** Rival's Family, Kingdom Nobility, Common Folk (2x Legacy Points). Royalty at Gen 5+.

**RNG encounters (discovered):** Forest Witch (rare mutation on heir), Shipwrecked Explorer (map bonus), Dragon Cultist (soulbound dragon), Wandering Scholar (Codex head start), Retired Rival (their stock).

### Generation Arc
- **Gen 1:** Rank 10 ceiling, ~150 LP
- **Gen 2:** Rank 12–13, ~250 LP
- **Gen 3:** Rank 15+, ~400 LP
- **Gen 4+:** Prestige ranks, 100% Codex, challenge runs

### Challenge Runs
"One and Done" (Rank 15 single gen, 500 LP), "Nomad" (10 kingdoms, 300 LP), "Purist" (Rank 10 no tools, 200 LP), "Dynasty" (10th gen, 1000 LP).

---

## Battle System (Auto-Battler)

### Stat Derivation from Genetics
Stats emerge from phenotype — every genetic choice has combat consequences.

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

### Combat Flow
1. **Setup:** Arrange dragons (front/back line, targeting priorities)
2. **Battle:** Auto-resolves, watchable in real-time or skippable
3. **Results:** Winners, casualties (based on difficulty mode)

### Battle Types
- **Skirmish:** Low stakes, test teams, no death
- **Formal Duel:** Rival's champion vs yours, reputation stakes
- **War Battle:** Kingdom conflict, death possible, big rewards
- **Tournament:** Multi-round bracket, prestige rewards

### Named Rivals
- **Varek of the Iron Peaks** — Heavy armor tanks, slow but unstoppable
- **Sera of the Coastlands** — Iridescent display dragons, secretly combat-viable
- **Old Morden** — Traditional, predictable but solid fundamentals
- **The Twins of Ashfall** — Fire specialists, aggressive glass cannons

Beating a rival = prestige, favor, possibly steal their breeding techniques.

### Wild Expeditions
Send dragon team to wild region. Semi-auto-battler: fight colony guardians, then capture weakened wilds. Random encounters: legendary wild spawns, NPC encounters (spouse candidates), abandoned nests, ancient ruins with tool unlocks.

---

## Difficulty Modes

### Sanctuary (Casual)
No plagues/raids, no dragon death (injuries only), predictable rulers, reduced favor loss, generous/no deadlines. Only positive/neutral RNG events. **0.5x Legacy Point multiplier.**

### Handler (Standard)
Occasional plagues/raids, possible dragon death in battle, semi-predictable rulers, standard rates, reasonable deadlines. Full event spectrum. **1x multiplier.**

### Dragoon (Hard)
Frequent devastating events, common dragon death, unpredictable rulers, harsh favor loss, strict overlapping deadlines, negative-skewed events. Optional permadeath toggle. **2x multiplier (3x with permadeath).**

### Custom Toggles (Any Mode)
Dragon Death on/off, Negative Events on/off, Time Pressure on/off, Upkeep Costs on/off, Ironman on/off. Can switch DOWN anytime (lose multiplier). Cannot switch UP mid-generation.

---

## Random Events System

### Kingdom Events
**Positive:** Eclipse/comet (mutations more likely), royal birth (quick-request, high favor), traveling tournament.

**Neutral:** Visiting noble offers to buy your dragon, ancient dragon tomb discovery.

**Negative (disabled in Sanctuary):** Plague (lose 1–3 dragons), rival's dragon escapes to your territory (diplomatic incident), ruler personality shift.

### Breeding RNG

| Event | Chance |
|-------|--------|
| Spontaneous mutation | 0.5% |
| Twin clutch | 2% |
| Prodigy hatchling (stat boost) | 1% |
| Throwback (great-grandparent trait) | 1% |
| Stillborn (lethal combo) | 5% for lethal combos |

### Rival Dynamics
Rivals can die/retire (new ones emerge), move kingdoms, have breakthroughs, offer alliances/trades, poach your techniques if they beat you, fall from grace.

---

## Implementation Roadmap

### Phase 1: Genetics Engine (Start Here)
Everything depends on this. Build and verify before anything else.

1. **Data model for genotype** — Represent ~23 genes as allele pairs
   - Main system genes: linear values (e.g., size from 1–6)
   - Triangle system genes: three independent axes, each 0–3 (None/Low/Med/High)
   - Sub system genes: categorical options
   - Orphan genes: boolean
2. **Inheritance engine** — For each gene locus, randomly select one allele from each parent
   - Linear traits: offspring allele is one of the two parental alleles (true Mendelian)
   - Triangle traits: same per-axis
   - Support for middle-dominant variant (if chosen): weight probabilities toward center values
3. **Phenotype resolver** — Reads genotype, outputs observable traits
   - CMY color resolver: map three pigment levels → named color
   - Finish resolver: map O/Sh/Sch levels → named finish
   - Breath resolver: map F/I/L levels → named breath type
4. **Breeding function** — Takes two parents, produces 2–4 offspring genotypes with proper meiosis simulation
5. **Mutation system** — Small probability per allele per breeding event
6. **Test harness** — CLI or simple UI to breed dragons, verify Mendelian ratios, test edge cases

### Phase 2: Core Gameplay Loop
7. **Stable management** — Add/remove dragons, view stats, select breeding pairs
8. **Breeding UI** — Parent selection, known vs unknown alleles ("?"), clutch results
9. **Dragon lifecycle** — Egg → Hatchling → Juvenile → Adult → Elder with time progression
10. **Basic kingdom** — Single kingdom with ruler, favor, simple requests
11. **Codex** — Track discoveries, breeding history

### Phase 3: Combat & Validation
12. **Stat derivation** — Convert phenotype to combat stats
13. **Auto-battler engine** — 3v3 or 5v5 with positioning
14. **Battle types** — Skirmish, Formal Duel, War Battle
15. **Rival breeders** — Named NPCs with signature builds
16. **Wild expeditions** — Capture missions

### Phase 4: Progression & Meta
17. **Breeder Rank system** — XP, rank unlocks, tool progression
18. **Legacy/Retirement** — Prestige loop, Legacy Points, heir generation
19. **Spouse system** — Linear + RNG encounters
20. **Multiple kingdoms** — Generation, travel, favor carryover
21. **Difficulty modes** — Sanctuary/Handler/Dragoon with toggles

### Phase 5: Polish & Content
22. **Random events system**
23. **Breeder tools** — Genetic Lens, Crossover Manipulation, Mutation Ray, Selective Meiosis
24. **Challenge runs** — Achievement tracking
25. **Tutorial/onboarding** — First Clutch intro, progressive mini-tutorials
26. **Punnett Square visualization**

### Phase 6: UI/UX & Art
27. **Portrait mode mobile UI** — All core screens
28. **Dragon visualization** — Phenotype instantly readable
29. **Art direction** — "Illuminated manuscript meets creature collector"
30. **Sound/music, accessibility**

---

## Technical Architecture Notes

### Genetics Engine
The core data structure:

```
Dragon {
  genotype: {
    // Main systems (linear, stored as allele pairs)
    body_size: [allele_a, allele_b],        // values 1-6
    body_type: [allele_a, allele_b],        // values 1-3 (sinuous/sleek/bulky)
    body_scales: [allele_a, allele_b],      // values 1-3 (smooth/textured/armored)
    frame_wings: [allele_a, allele_b],      // values 0-5 (none→six)
    frame_limbs: [allele_a, allele_b],      // values 0-3 (0/2/4/6)
    frame_bones: [allele_a, allele_b],      // values 1-3
    breath_shape: [allele_a, allele_b],     // values 1-3 (single/multi/AoE)
    breath_range: [allele_a, allele_b],     // values 1-3 (close/med/far)

    // Triangle systems (3 independent axes, each 0-3)
    color_cyan: [allele_a, allele_b],
    color_magenta: [allele_a, allele_b],
    color_yellow: [allele_a, allele_b],
    finish_opacity: [allele_a, allele_b],
    finish_shine: [allele_a, allele_b],
    finish_schiller: [allele_a, allele_b],
    breath_fire: [allele_a, allele_b],
    breath_ice: [allele_a, allele_b],
    breath_lightning: [allele_a, allele_b],

    // Sub systems (categorical)
    horn_style: [allele_a, allele_b],       // none/sleek/gnarled/knobbed
    horn_direction: [allele_a, allele_b],   // forward/swept/upward
    spine_style: [allele_a, allele_b],      // none/ridge/spikes/sail
    spine_height: [allele_a, allele_b],     // values 1-3
    tail_shape: [allele_a, allele_b],       // values 1-3 (whip/normal/heavy)
    tail_length: [allele_a, allele_b],      // values 1-3
  },
  phenotype: { ... },  // resolved from genotype
  stats: { ... },      // derived from phenotype
  metadata: { name, age, stage, lineage_id, ... }
}
```

### Phenotype Resolution

For linear traits: phenotype = dominant allele (or blend if incomplete dominance).

For triangle systems: resolve each axis independently, then map the 3-value combination to the nearest named phenotype. The color resolver needs a lookup table mapping CMY levels to color names with appropriate thresholds.

For categorical traits: apply dominance rules (TBD — hierarchy, probability, or codominance depending on trait).

### Save System
- Dragon genotypes serialize/deserialize cleanly (JSON)
- Codex discoveries persist across kingdoms and generations
- Legacy Point purchases are permanent
- Family tree data grows across generations — needs efficient storage
- Consider SQLite or similar for local mobile storage

### Randomness
- Seeded RNG for reproducibility in testing
- Each egg resolves independently
- Mutation, twin clutch, prodigy, throwback all have defined probability tables
- RNG events use weighted random selection based on difficulty mode
