# Dragon Genetics System — Technical Reference

The genetics system uses ~23 genes in base game, organized into three categories: Main Systems, Sub Systems, and Triangle Systems. Additional traits (Air Bladder, Teeth) are reserved for expansion packs.

---

## Inheritance Mechanics

### Linear / Incomplete Dominance
Most traits use this. Parent values blend toward a middle point. Bird × Mega could produce Dog, Cow, or Standard offspring.

**Open decision:** Should middle values be *dominant* (Standard is most likely, extremes are rare/recessive) or should it be *true linear* (any value between parents is equally likely)? Middle-dominant creates more breeding depth; true linear is simpler.

### Triangle Systems
Three parallel genes (each None→Low→Med→High) that combine to produce emergent results. Used for Color, Finish, and Breath Element. These are always linear — rare combinations emerge naturally from the math.

### Dominant/Recessive
Used for on/off traits (Air Bladder). Standard Mendelian — need two recessive copies to express.

### Non-Linear (TBD)
Horn Style, Horn Direction, Spine Style need specific rules. Options include dominant hierarchy, probability, or codominance. Still being decided.

### Sex Chromosomes
Dragon sex chromosomes are **reversed from humans**: males = XX, females = XY. Prevents players from just memorizing human genetics patterns. (Note: breath weapons were originally X-linked in early design; this may be revisited with the triangle breath system.)

### Lethal Alleles
Certain homozygous combinations are embryonic lethal — "The egg didn't hatch." Players discover these through failed breedings. Journal records discovered lethal combinations. Specific combinations TBD during balancing.

---

## MAIN SYSTEMS (3 tiers each, all linear)

### 1. BODY

| Tier | Trait | Options (linear range) |
|------|-------|----------------------|
| Top | Size | Bird → Dog → Cow → Standard → Large → Mega |
| Mid | Body Type | Sinuous → Sleek → Bulky |
| Bottom | Scales | Smooth → Textured → Armored |

**Size affects:** HP, damage, carry capacity, food requirements, breeding space, intimidation, stealth penalties. Creates genuine trade-offs — bigger isn't always better.

**Body Type affects:**
- Sinuous: +Flexibility, +Evasion, +Grapple, −Charge attacks
- Sleek: +Evasion, +Flight speed, −HP, −Ground damage
- Bulky: +Melee damage, +HP, −Flight speed, −Evasion

**Scales affect:**
- Smooth: +Speed (reduced drag), +Burrowing, −Grip
- Textured: Standard protection, good flexibility
- Armored: +Armor, +Crush resistance, −Flexibility, −Speed

---

### 2. FRAME

| Tier | Trait | Options (linear range) |
|------|-------|----------------------|
| Top | Wing Count | None → Vestigial → Pair → Quad → Six |
| Mid | Limb Count | 0 → 2 → 4 → 6 |
| Bottom | Bone Density | Lightweight → Standard → Dense |

**Wing Count affects:** Flight capability, aerial combat, evasion. None = grounded. Six = extreme flight but high food cost.

**Limb Count affects:**
- 0 (Serpentine): +Evasion, +Flexibility, +Constriction, −Ground speed
- 2 (Wyvern): +Aerial agility, −Ground combat
- 4 (Quadruped): Balanced ground/air
- 6 (Hexapod): +Stability, +Carry capacity, +Grapple

**Bone Density affects:**
- Lightweight: −Weight, +Flight capability, −Crush resistance, +Bone break risk
- Standard: Baseline
- Dense: +Durability, +Melee damage, +Weight, −Flight capability

---

### 3. BREATH

| Tier | Trait | Options (linear range) |
|------|-------|----------------------|
| Top | Element | Triangle system (see Triangle Systems below) |
| Mid | Shape | Single → Multi → AoE |
| Bottom | Range | Close → Medium → Far |

**Shape affects:**
- Single: Focused, high single-target damage
- Multi: Moderate spread, versatile
- AoE: Wide area denial, lower individual damage

**Range affects:** Engagement distance, tactical positioning in auto-battler.

---

## SUB SYSTEMS (2 tiers each)

### 4. HORNS

| Tier | Trait | Options | Inheritance |
|------|-------|---------|-------------|
| 1 | Style | None, Sleek, Gnarled, Knobbed | TBD (non-linear) |
| 2 | Direction | Forward, Swept-back, Upward | TBD (non-linear) |

Horns provide +Melee damage, +Intimidation. Specific styles may have mechanical differences. "None" means hornless — whether this is dominant or recessive is a key design decision (hornless as rare hidden trait vs. horns as rare achievement).

**Moved to expansion:** Spiral, Antler-like, Whip-like, Mane-like, Blade-like styles. Unicorn horn (Equine pack), Beetle horn (Arthropod), Antennae (Winged Insects), Narwhal (Coastal/Fish), Anglerfish lure (Deep Sea). Additional directions: Curved-forward, Switchback, Downward.

---

### 5. SPINES

| Tier | Trait | Options | Inheritance |
|------|-------|---------|-------------|
| 1 | Style | None, Ridge, Spikes, Sail | TBD (non-linear) |
| 2 | Height | Low → Medium → Tall | Linear |

Spines affect defense, intimidation, and thermoregulation (sail). Frills and dewlaps are folded into the spine system as soft styles.

**Moved to expansion:** Mane-like, Blade-like, Frill, Dewlap (may stay base), Fin (Coastal/Fish), Venomous spines (Deep Sea), Display plume (Exotic Bird).

---

### 6. TAIL

| Tier | Trait | Options | Inheritance |
|------|-------|---------|-------------|
| 1 | Shape | Whip-like → Normal → Heavy | Linear |
| 2 | Length | Short → Medium → Long | Linear |

**Shape affects:**
- Whip-like: +Tail attack speed, +Reach, −Damage
- Normal: Standard tail attacks
- Heavy: +Crushing damage, +Knockback, −Speed

**Moved to expansion:** Prehensile (may be future), End features (Club, Spike, Blade, Barbs, Rattle, Fins), Scorpion tail + stinger (Arthropod).

---

## TRIANGLE SYSTEMS (3 parallel genes each)

All three triangle systems use the same inheritance logic: each axis has 4 levels (None → Low → Med → High). The combination of all three axes determines the expressed phenotype.

### 7. COLOR (CMY Pigment System)

| Axis | Gene | Range |
|------|------|-------|
| 1 | Cyan | None → Low → Med → High |
| 2 | Magenta | None → Low → Med → High |
| 3 | Yellow | None → Low → Med → High |

**Key Phenotypes:**

| Position | C | M | Y | Color |
|----------|---|---|---|-------|
| Corner: C only | High | Low | Low | Cyan/Teal |
| Corner: M only | Low | High | Low | Magenta/Pink |
| Corner: Y only | Low | Low | High | Yellow/Gold |
| Edge: C+M | High | High | Low | Blue/Violet |
| Edge: C+Y | High | Low | High | Green |
| Edge: M+Y | Low | High | High | Red/Orange |
| Center: all high | High | High | High | Black |
| Absence: all low | Low | Low | Low | White |

**Why rare colors are rare:**
- **Red** = high M + high Y + zero C. Most offspring inherit some C from the lineage → you get Orange first. Pure Red requires generations of selecting out Cyan.
- **Black** = all three pigments high. Requires stacking across all color zones.
- **White** = all pigments at None. Requires breeding out all color expression.

4 levels × 3 axes = 64 color genotypes. With dominance, ~20-30 visually distinct phenotypes.

---

### 8. FINISH (Opacity / Shine / Schiller)

| Axis | Gene | Range |
|------|------|-------|
| 1 | Opacity | None (translucent) → Low → Med → High (opaque) |
| 2 | Shine | None (matte) → Low → Med → High (glossy) |
| 3 | Schiller | None → Low → Med → High (color-shift) |

**Named Finishes:**

| Position | Opacity | Shine | Schiller | Name |
|----------|---------|-------|----------|------|
| Corner: O only | High | Low | Low | **Matte** |
| Corner: Sh only | Low | High | Low | **Glass** |
| Corner: Sch only | Low | Low | High | **Prismatic** |
| Edge: O+Sh | High | High | Low | **Metallic** |
| Edge: O+Sch | High | Low | High | **Holographic** |
| Edge: Sh+Sch | Low | High | High | **Opalescent** |
| Center: all high | High | High | High | **Mother of Pearl** |
| Absence: all low | Low | Low | Low | **Seaglass** |

**Finish mechanical effects:**
- Matte: +Stealth (night/desert)
- Glass: +Stealth (sky/water)
- Metallic: +Stealth (desert/jungle), prestige marker
- Prismatic, Opalescent, Mother of Pearl: +Value, +Dazzle/distraction
- Holographic: +Value, +Display
- Seaglass: Subtle, +Stealth (aquatic)

**Note:** Metallic as a prestige lineage modifier is separate from the Metallic finish. A dragon can have any finish AND be "metallic-colored" (gold, silver, bronze, copper). Metallic coloring follows the same blending rules as base colors.

---

### 9. BREATH ELEMENT (Fire / Ice / Lightning)

| Axis | Gene | Range | Visual Color |
|------|------|-------|-------------|
| 1 | Fire | None → Low → Med → High | Red |
| 2 | Ice | None → Low → Med → High | Blue |
| 3 | Lightning | None → Low → Med → High | Yellow |

**Named Breath Types:**

| Position | F | I | L | Name | Visual Color | Visual Description |
|----------|---|---|---|------|-------------|-------------------|
| Corner: F only | High | Low | Low | **Fire** | Red | Roaring flames, ember trails, heat shimmer |
| Corner: I only | Low | High | Low | **Ice** | Blue | Crystalline shards, frost clouds, glittering |
| Corner: L only | Low | Low | High | **Lightning** | Yellow | Crackling arcs, branching bolts |
| Edge: F+I | High | High | Low | **Steam** | Purple | Billowing clouds, scalding mist |
| Edge: F+L | High | Low | High | **Solar** | Orange | Golden beams, sparkles, corona flares |
| Edge: I+L | Low | High | High | **Aurora** | Green | Shimmering curtains, color waves, ethereal |
| Center: all high | High | High | High | **Plasma** | White | White-hot, all colors bleeding, unstable |
| Absence: all low | Low | Low | Low | **Null** | Black | Usually nothing; rare dark beam |

Breath element colors mirror a color wheel: primary corners (R/B/Y), secondary edges (P/O/G). Intuitive for players.

---

## EXPANSION-ONLY TRAITS

The following were considered for base game but moved to expansion packs to keep base scope manageable:

| Trait | Type | Expansion | Notes |
|-------|------|-----------|-------|
| Air Bladder | Yes/No | TBD (possibly Industry/Utility pack) | +Passive lift, +Flight endurance, FIRE VULNERABILITY. Ties into blimp/dirigible body types. |
| Teeth | Categorical | TBD | Serrated, Conical, Crushing, Venomous, Hidden, Tusks, Replacement. |

---

## EXPANSION PACK ARCHITECTURE

Base game: Scaled dragons with core traits only.

| Pack | Systems Affected | Adds |
|------|-----------------|------|
| **Equine** | Limbs, Horns, Spines, Covering | Hooved limbs, Unicorn horn, Flowing mane, Horse patterns |
| **Big Cat** | Limbs, Eyes, Covering | Padded paws, Blind/Echolocation eyes, Fur covering |
| **Canine** | Limbs, Covering, Teeth | Padded paws, Fur variants, Saber fangs |
| **Winged Insects** | Wings, Horns, Eyes | Butterfly-scale/Gossamer membrane, Antennae, Compound eyes |
| **Arthropod** | Covering, Limbs, Tail, Teeth | Chitin covering, Pincer claws, Scorpion tail+stinger, Mandibles |
| **Coastal/Fish** | Limbs, Spines, Shape, Eyes | Webbed limbs, Fin spines, Swimmer shape, Nictitating membrane |
| **Deep Sea** | Eyes, Horns, Spines | Bioluminescent eyes, Anglerfish lure, Venomous spines |
| **Cephalopod** | Limbs, Teeth, Covering | Tentacle limbs, Beak teeth, Soft-body covering |
| **Raptor** | Covering, Limbs, Eyes, Wings | Contour feathers, Raptor talons, Telescopic eyes, Feathered membrane |
| **Exotic Bird** | Covering, Horns, Spines | Plume feathers, Crest horn, Display plume spine |
| **Aesthetic Overhaul** | Pattern, Covering | Full pattern system, mixed covering types (possibly free DLC) |

Mixing packs creates mythological creatures: Lion body + Eagle wings = Gryphon. Horse body + Single horn = Unicorn. Scorpion tail + Lion body + Wings = Manticore.

---

## REGIONAL ORIGIN (Starting Packages)

Wild populations have different trait frequencies by region. This is lore flavor — not ongoing environmental pressure. Once in your program, standard inheritance applies. You are the selection pressure.

| Region | Common Starting Traits |
|--------|----------------------|
| Arctic | White/silver (low CMY), ice breath, lightweight bones |
| Desert | Gold/tan (Y-dominant), matte finish, fire element |
| Forest | Green (C+Y), textured scales, acid/poison (expansion) |
| Volcanic | Red/black (M+Y or all high), fire breath, dense bones |
| Aquatic | Cyan/teal (C-dominant), glass finish, swimmer shape (expansion) |
| Cave | Dark colors, dense bones, blind eyes (expansion) |
| Mountain | Large wings, lightweight bones, climber shape (expansion) |

---

## BREEDING INTERFACE

### Parent Selection
- Choose two dragons from stable
- View known phenotype (what you can see)
- View discovered genotype (revealed through breeding or tools)
- Unknown alleles shown as "?" until revealed

### Breeding Execution
- Select parents → Confirm → Rapid breeding → Egg stage (accelerated by incubators/skills)
- Clutch size: 2–4 eggs based on fertility
- Each egg resolves genetics independently
- Must wait for Adult stage before breeding

### Dragon Life Stages
Egg → Hatchling → Juvenile → Adult → Elder (retire for bonuses)

### Unlockable Breeder Tools

| Tool | Unlock | Effect |
|------|--------|--------|
| Genetic Lens | Rank 3 | Reveals one unknown allele per use |
| Crossover Manipulation | Rank 5 | Force crossover between linked genes |
| Mutation Ray | Rank 7 | Small chance to induce random mutation |
| Selective Meiosis | Rank 10 | Choose gamete combination for one egg per clutch |

Some rare tools discovered via RNG (expedition finds, ruler gifts, stolen from rivals).

### Punnett Square Visualization (Optional)
Toggle-able overlay showing predicted offspring ratios. Only shows genes you've fully mapped for both parents.

---

## GENE COUNT SUMMARY

| Category | System | Genes | Inheritance |
|----------|--------|-------|-------------|
| Main | Body (3 tiers) | 3 | All linear |
| Main | Frame (3 tiers) | 3 | All linear |
| Main | Breath Shape + Range | 2 | Linear |
| Sub | Horns (2 tiers) | 2 | TBD (non-linear) |
| Sub | Spines (2 tiers) | 2 | Style TBD, Height linear |
| Sub | Tail (2 tiers) | 2 | Both linear |
| Triangle | Color (C/M/Y) | 3 | Linear |
| Triangle | Finish (O/Sh/Sch) | 3 | Linear |
| Triangle | Breath Element (F/I/L) | 3 | Linear |
| **Total** | | **~23** | 19 linear, ~4 TBD |

---

## NEXT STEPS FOR IMPLEMENTATION

1. Decide inheritance model per trait (true linear vs middle-dominant)
2. Define inheritance rules for non-linear traits (horn style, horn direction, spine style, teeth)
3. Assign specific stat values per trait option (balance pass)
4. Map lethal allele combinations
5. Define linked gene groups
6. Set mutation rates and triggers
7. Build the inheritance engine (core breeding logic)
8. Design Codex discovery system (documented vs hidden synergies)
