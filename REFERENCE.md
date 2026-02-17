# Dragon Game — Complete Reference

## Project Overview

**Genre**: Dragon breeding game with real Mendelian genetics (~23 genes)
**Platform**: Web prototype (vanilla HTML/CSS/JS, ES modules, no bundler)
**Theme**: Mobile-first, portrait mode, dark/light theme
**Game Loop**: Capture wild dragons → Breed → Store in Stables → Complete Quests → Refer to Almanac

---

## Architecture

```
index.html                    Main entry, 5 tab panels
├─ app.js                     Init, tab switching, theme toggle, DragonRegistry
│
├─ dragon.js                  Dragon class, name generator, breed/createRandom
├─ genetics-engine.js         Genotype creation, meiosis, mutation, breeding
├─ gene-config.js             All 23 gene defs, triangle systems, phenotype maps
├─ phenotype-resolver.js      Genotype → phenotype (linear/categorical/triangle)
│
├─ ui-card.js                 Dragon card rendering, genotype toggle
├─ ui-dragon-sprite.js        Canvas-based sprite rendering
│
├─ ui-generator.js            Capture tab UI
├─ ui-breeder.js              Breed tab: parent selection, clutch display
├─ ui-stables.js              Stables tab: persistent storage
├─ ui-family-tree.js          Family tree popup: ancestor visualization
├─ ui-almanac.js              Almanac tab: reference guide (colors, finishes, elements)
├─ ui-quests.js               Quests tab: quest cards, submission
├─ quest-engine.js            Quest definitions, validation, completion
│
└─ css/styles.css             Dark/light themes, responsive layout (~1900 lines)
```

---

## All 23 Genes

### Main System (Linear, Incomplete Dominance)

| Gene | Range | Phenotypes |
|------|-------|-----------|
| body_size | 1–6 | Bird, Dog, Cow, Standard, Large, Mega |
| body_type | 1–3 | Serpentine, Normal, Bulky |
| body_scales | 1–3 | Smooth, Textured, Armored |
| frame_wings | 0–4 | None, Vestigial, Pair, Quad, Six |
| frame_limbs | 0–3 | Limbless, Wyvern (2), Quadruped (4), Hexapod (6) |
| frame_bones | 1–3 | Lightweight, Standard, Dense |
| breath_shape | 1–3 | Single, Multi, AoE |
| breath_range | 1–3 | Close, Medium, Far |

### Sub System (Categorical — higher value dominant)

| Gene | Range | Phenotypes |
|------|-------|-----------|
| horn_style | 0–3 | None, Sleek, Gnarled, Knobbed |
| horn_direction | 0–2 | Forward, Swept-back, Upward |
| spine_style | 0–3 | None, Ridge, Spikes, Sail |
| spine_height | 1–3 | Low, Medium, Tall |
| tail_shape | 1–3 | Whip, Normal, Heavy |
| tail_length | 1–3 | Short, Medium, Long |

### Triangle System Axes (3 axes per system, values 0–3)

| System | Axis 1 | Axis 2 | Axis 3 |
|--------|--------|--------|--------|
| Color (CMY) | color_cyan | color_magenta | color_yellow |
| Finish | finish_opacity | finish_shine | finish_schiller |
| Breath Element | breath_fire | breath_ice | breath_lightning |

---

## Triangle Systems

Each triangle system has 3 axes (allele range 0–3). Each axis is classified as **High (H)** if the averaged level ≥ 1.5, or **Low (L)** if < 1.5. The 3-letter H/L key (e.g. `H-L-H`) looks up a named phenotype from an 8-entry map.

### Color System (CMY — Subtractive)

**RGB computation**: `R = 255 × (1 − C/3)`, `G = 255 × (1 − M/3)`, `B = 255 × (1 − Y/3)`

**8 base phenotypes** (H/L classification):

| Key | Name | Description |
|-----|------|-------------|
| L-L-L | White | All axes low |
| H-L-L | Cyan | High cyan only |
| L-H-L | Magenta | High magenta only |
| L-L-H | Yellow | High yellow only |
| H-H-L | Blue | High cyan + magenta |
| H-L-H | Green | High cyan + yellow |
| L-H-H | Red | High magenta + yellow |
| H-H-H | Black | All axes high |

**64-entry display names** use the same 4-tier classification as finish (None/Low/Med/High).

Key format: `C-M-Y` (each 0–3). Full 64-entry table:

#### Yellow: None (0)

| | C: None | C: Low | C: Med | C: High |
|--|---------|--------|--------|---------|
| **M: None** | White | Ice Blue | Aqua | Cyan |
| **M: Low** | Sakura | Violet | Cornflower Blue | Cerulean |
| **M: Med** | Fuchsia | Heliotrope | Periwinkle | Indigo |
| **M: High** | Magenta | Orchid | Purple | Blue |

#### Yellow: Low (1)

| | C: None | C: Low | C: Med | C: High |
|--|---------|--------|--------|---------|
| **M: None** | Butter Yellow | Celadon | Seafoam | Mint |
| **M: Low** | Salmon | Grey | Viridian | Teal |
| **M: Med** | Pink | Mauve | Iris | Cobalt |
| **M: High** | Hot Pink | Magnolia | Wisteria | Ultramarine |

#### Yellow: Med (2)

| | C: None | C: Low | C: Med | C: High |
|--|---------|--------|--------|---------|
| **M: None** | Lemon Yellow | Pear Green | Lime Green | Spring Green |
| **M: Low** | Carrot | Olive | Clover | Fern |
| **M: Med** | Coral | Sienna | Slate | Deep Sea Green |
| **M: High** | Rose | Berry | Plum | Midnight Blue |

#### Yellow: High (3)

| | C: None | C: Low | C: Med | C: High |
|--|---------|--------|--------|---------|
| **M: None** | Yellow | Chartreuse | Neon Green | Green |
| **M: Low** | Saffron | Citron | Kelly Green | Ivy Green |
| **M: Med** | Orange | Umber | Moss Green | Forest Green |
| **M: High** | Red | Crimson | Maroon | Black |

**Special (non-compound) color names** highlighted in Almanac:
White, Black, Cyan, Magenta, Yellow, Blue, Green, Red, Grey, Violet, Orchid, Purple, Indigo, Teal, Coral, Rose, Pink, Salmon, Orange, Saffron, Mint, Fern, Olive, Crimson, Maroon

### Breath Element System (Fire / Ice / Lightning)

**8 base phenotypes** (H/L classification):

| Key | Name | Color | Description |
|-----|------|-------|-------------|
| L-L-L | Null | #333333 | No breath weapon |
| H-L-L | Fire | #FF4422 | Roaring flames, ember trails |
| L-H-L | Ice | #4488FF | Crystalline shards, frost clouds |
| L-L-H | Lightning | #FFDD00 | Crackling arcs, branching bolts |
| H-H-L | Steam | #9944FF | Billowing scalding mist |
| H-L-H | Solar | #FF8800 | Golden beams, corona flares |
| L-H-H | Aurora | #44FF88 | Shimmering curtains, color waves |
| H-H-H | Plasma | #FFFFFF | White-hot, unstable energy |

**64-entry display names** use the same 4-tier classification as finish (None/Low/Med/High).

Key format: `F-I-L` (each 0–3). Full 64-entry table:

#### Lightning: None (0)

| | I: None | I: Low | I: Med | I: High |
|--|---------|--------|--------|---------|
| **F: None** | Void | Chill | Frost | Ice |
| **F: Low** | Ember | Warm Mist | Cool Steam | Fog |
| **F: Med** | Flame | Scald | Steam | Cold Geyser |
| **F: High** | Fire | Hot Scald | Geyser | Torrential Steam |

#### Lightning: Low (1)

| | I: None | I: Low | I: Med | I: High |
|--|---------|--------|--------|---------|
| **F: None** | Static | Cold Static | Frost Spark | Frigid Static |
| **F: Low** | Warm Static | Haze | Charged Mist | Cold Ionic |
| **F: Med** | Heat Spark | Charged Steam | Storm Brew | Charged Fog |
| **F: High** | Sunfire | Flash Steam | Thundercloud | Maelstrom |

#### Lightning: Med (2)

| | I: None | I: Low | I: Med | I: High |
|--|---------|--------|--------|---------|
| **F: None** | Spark | Ionic Chill | Ionic | Aurora Glow |
| **F: Low** | Flare | Heat Haze | Charged Frost | Shimmer |
| **F: Med** | Pulsar | Arc Steam | Surge | Radiant Fog |
| **F: High** | Solar | Solar Flare | Plasma Wisp | Corona |

#### Lightning: High (3)

| | I: None | I: Low | I: Med | I: High |
|--|---------|--------|--------|---------|
| **F: None** | Lightning | Crackling Chill | Tempest Ice | Aurora |
| **F: Low** | Crackling Flare | Ion Storm | Aurora Storm | Radiance |
| **F: Med** | Thunder Scorch | Plasma Arc | Fusion | Plasma Frost |
| **F: High** | Helios | Supernova | Cataclysm | Plasma |

**Special (non-compound) element names** highlighted in Almanac:
Void, Ice, Fire, Lightning, Plasma, Ember, Flame, Chill, Frost, Static, Spark, Steam, Fog, Haze, Solar, Aurora, Geyser, Maelstrom, Helios, Supernova, Cataclysm, Corona, Radiance, Fusion, Pulsar, Flare, Sunfire

**Dark Energy** — rare 5% variant of Null breath:
- Triggers only when base phenotype is Void (F:None · I:None · L:None)
- 5% chance (`DARK_ENERGY_CHANCE = 0.05`)
- Name: "Dark Energy", Color: #8800cc (purple)
- Description: "Rare antimatter breath — born from the void"

**Recessive Extremes** (breath element only):
- Heterozygous allele pairs get pulled toward center (1.5), making extreme phenotypes harder to achieve
- Homozygous extremes ([0,0] or [3,3]) express normally (spread = 0, no pull)
- Formula: `level = avg + (center − avg) × (spread / 3) × 0.5`
- `RECESSIVE_PULL_STRENGTH = 0.5`

### Finish System (Opacity / Shine / Schiller)

**8 base phenotypes** (H/L classification):

| Key | Name | Description |
|-----|------|-------------|
| L-L-L | Seaglass | Translucent, matte, no color-shift |
| H-L-L | Velvet | Opaque, soft matte texture |
| L-H-L | Glass | Translucent, glossy surface |
| L-L-H | Opalescent | Translucent, color-shifting |
| H-H-L | Mirror | Opaque, reflective sheen |
| H-L-H | Gemstone | Opaque, faceted color-shifting |
| L-H-H | Iridescent | Glossy, color-shifting |
| H-H-H | Mother of Pearl | Opaque, glossy, color-shifting |

**64-entry display names** use a finer 4-tier classification per axis:

| Tier | Level Range | Label |
|------|-------------|-------|
| 0 | < 0.5 | None |
| 1 | 0.5–1.5 | Low |
| 2 | 1.5–2.5 | Med |
| 3 | ≥ 2.5 | High |

Key format: `O-Sh-Sc` (each 0–3). Full 64-entry table:

#### Opacity: None (0)

| | Sc: None | Sc: Low | Sc: Med | Sc: High |
|--|----------|---------|---------|----------|
| **Sh: None** | Phantom | Clear Matte Shifting | Clear Matte Shimmering | Opalescent |
| **Sh: Low** | Clear Satin | Clear Satin Shifting | Spectral | Clear Satin Prismatic |
| **Sh: Med** | Clear Lustrous | Clear Lustrous Shifting | Clear Lustrous Shimmering | Clear Lustrous Prismatic |
| **Sh: High** | Glass | Clear Polished Shifting | Clear Polished Shimmering | Iridescent |

#### Opacity: Low (1)

| | Sc: None | Sc: Low | Sc: Med | Sc: High |
|--|----------|---------|---------|----------|
| **Sh: None** | Seaglass | Translucent Matte Shifting | Translucent Matte Shimmering | Translucent Matte Prismatic |
| **Sh: Low** | Translucent Satin | Translucent Satin Shifting | Translucent Satin Shimmering | Translucent Satin Prismatic |
| **Sh: Med** | Translucent Lustrous | Translucent Lustrous Shifting | Translucent Lustrous Shimmering | Translucent Lustrous Prismatic |
| **Sh: High** | Crystal | Translucent Polished Shifting | Translucent Polished Shimmering | Translucent Polished Prismatic |

#### Opacity: Med (2)

| | Sc: None | Sc: Low | Sc: Med | Sc: High |
|--|----------|---------|---------|----------|
| **Sh: None** | Frosted | Cloudy Matte Shifting | Cloudy Matte Shimmering | Cloudy Matte Prismatic |
| **Sh: Low** | Cloudy Satin | Cloudy Satin Shifting | Cloudy Satin Shimmering | Cloudy Satin Prismatic |
| **Sh: Med** | Cloudy Lustrous | Cloudy Lustrous Shifting | Cloudy Lustrous Shimmering | Cloudy Lustrous Prismatic |
| **Sh: High** | Cloudy Polished | Cloudy Polished Shifting | Cloudy Polished Shimmering | Cloudy Polished Prismatic |

#### Opacity: High (3)

| | Sc: None | Sc: Low | Sc: Med | Sc: High |
|--|----------|---------|---------|----------|
| **Sh: None** | Velvet | Opaque Matte Shifting | Opaque Matte Shimmering | Chromatic |
| **Sh: Low** | Opaque Satin | Opaque Satin Shifting | Opaque Satin Shimmering | Opaque Satin Prismatic |
| **Sh: Med** | Enamel | Opaque Lustrous Shifting | Opaque Lustrous Shimmering | Opaque Lustrous Prismatic |
| **Sh: High** | Mirror | Opaque Polished Shifting | Opaque Polished Shimmering | Mother of Pearl |

**Special (non-compound) finish names** highlighted in Almanac:
Phantom, Opalescent, Spectral, Glass, Iridescent, Seaglass, Crystal, Frosted, Velvet, Chromatic, Enamel, Mirror, Mother of Pearl

---

## Genetics & Breeding

### Inheritance Rules

- **Linear traits**: Average both alleles → round to nearest integer → phenotype map
- **Categorical traits**: Higher allele value dominates (placeholder — needs per-trait rules)
- **Triangle axes**: Average both alleles → classify H/L at 1.5 threshold → 8-way lookup
- **Recessive triangle axes** (breath element only): Heterozygous pairs pulled toward center

### Breeding Mechanics

- **Clutch size**: 2–4 offspring (random)
- **Meiosis**: Each parent randomly contributes one of their two alleles (50/50)
- **Mutation rate**: 0.5% per allele per breeding event
  - Direction: ±1 with equal probability
  - Clamped to gene's [min, max] range
  - Tracked in offspring's `mutations` array
- **Sex determination**: 50/50 male/female
  - Reversed from humans: males = XX, females = XY (cosmetic only in Phase 1)
- **Generation**: `max(parentA.generation, parentB.generation) + 1`
- **Allele origin tracking**: Records which allele came from Parent A vs Parent B

### Random Generation (Wild Dragons)

Weighted tier system controls rarity of triangle phenotypes:

**Color distribution**: White 4% · Primary (Cyan/Magenta/Yellow) 55% · Secondary (Blue/Green/Red) 35% · Black 6%

**Breath element distribution**: Null 4% · Primary (Fire/Ice/Lightning) 55% · Secondary (Steam/Solar/Aurora) 35% · Plasma 6%

**Finish distribution**: Seaglass 3% · Tier 1 (Velvet/Glass/Opalescent) 12% · Tier 2 (Mirror/Gemstone/Iridescent) 35% · Mother of Pearl 50%

Alleles are weighted to produce the target tier:
- LOW: weights [0.70, 0.22, 0.06, 0.02] → ~90% chance pair averages < 1.5
- HIGH: weights [0.02, 0.06, 0.22, 0.70] → ~98% chance pair averages ≥ 1.5

---

## Dragon Data Structure

```javascript
Dragon {
  id              // unique auto-incrementing ID
  genotype        // { geneName: [allele1, allele2], ... }
  sex             // 'male' or 'female'
  name            // random or custom
  parentIds       // [parentA_id, parentB_id] or null (wild)
  mutations       // array of gene names that mutated
  alleleOrigins   // { geneName: ['A'|'B', 'A'|'B'] } or null
  generation      // 0 = wild, increments with breeding
  phenotype       // resolved phenotype object (see below)
}
```

### Phenotype Object

```javascript
phenotype = {
  traits: {
    body_size:    { level, rounded, name },
    body_type:    { level, rounded, name },
    // ... all main/sub genes
  },
  color: {
    levels: [c, m, y],         // continuous 0–3
    key: "H-L-H",             // H/L classification
    name: "Green",            // 8-way phenotype name
    displayName: "Deep Green", // HSL-based rich name
    cmyBreakdown: { c, m, y }, // level labels
    rgb: { r, g, b },
    hex: "#00ff00"
  },
  finish: {
    levels: [opacity, shine, schiller],
    key: "H-H-H",
    name: "Mother of Pearl",
    displayName: "Mother of Pearl",  // 64-name lookup
    desc: "Opaque, glossy, color-shifting"
  },
  breathElement: {
    levels: [fire, ice, lightning],
    key: "H-L-L",
    name: "Fire",
    displayName: "Fierce Fire",      // with intensity qualifier
    isDarkEnergy: false,
    breathBreakdown: { f, i, l },
    desc: "Roaring flames, ember trails"
  }
}
```

---

## UI Features

### Tabs

1. **Capture** — Generate random wild dragons, view cards, save to stables or set as breeding parents
2. **Breed** — Pick two parents (from stables or random), breed clutches of 2–4, promote offspring
3. **Stables** — Persistent dragon storage with release option
4. **Quests** — Quest cards with genotype/phenotype requirements; difficulty badges (Easy/Medium/Hard)
5. **Almanac** — Reference guide showing all phenotype recipes
   - Colors: 8 phenotypes with swatches
   - Finishes: 4 opacity-tier grids (4×4 each) showing all 64 names
   - Elements: 8 base phenotypes + Dark Energy rare variant

### Dragon Cards

- Header: name, sex (M/F), ID, generation badge
- Sprite: canvas-rendered, color from CMY hex
- Color info: display name, CMY breakdown, hex swatch
- Finish: badge with display name, prose description
- Breath element: colored dot, name, shape/range, axis breakdown, description
- Traits: Body, Frame, Features sections
- Genotype toggle: allele pairs grouped by category, mutation badges (MUT), parent origin color-coding (A = blue, B = pink)

### Family Tree

- Recursive ancestor tree up to 6 generations deep
- Generation-colored borders (Gen 0–5, each a different color)
- Wild dragons: dashed green border
- Duplicate ancestors: compact reference nodes (75% scale, dotted border, "↗ see above")
- SVG overlay: dotted connector lines linking reference nodes to first occurrence
- Click any node to open detail card with "View Full Lineage" option
- Generation legend at bottom

### Theme

- **Dark mode** (default): Background #1e1a16, accent #c4a265 (gold)
- **Light mode**: Background #f5f0e8, accent #a07830 (brown)
- Toggle via ☀/☾ button, persisted in localStorage

---

## Dragon Naming

Random generation from 32 prefixes × 32 suffixes:

**Prefixes**: Ash, Blaze, Cinder, Drake, Ember, Fang, Grim, Hex, Iron, Jade, Ky, Luna, Nyx, Onyx, Pyra, Rune, Shadow, Thorn, Umber, Volt, Wrath, Zeph, Dra, Syl, Gor, Mal, Vor, Tar, Sol, Rav, Mor, Fel

**Suffixes**: ax, born, claw, don, ex, fyr, gon, hawk, is, jaw, kor, lyn, mir, nar, os, pyre, rix, storm, tus, us, vex, wing, xis, zar, ra, ka, th, rok, nia, sha, ven, dal

---

## Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| MUTATION_RATE | 0.005 | 0.5% per allele per breeding |
| CLUTCH_SIZE_MIN | 2 | Minimum offspring per clutch |
| CLUTCH_SIZE_MAX | 4 | Maximum offspring per clutch |
| RECESSIVE_PULL_STRENGTH | 0.5 | How much heterozygous breath axes pull toward center |
| DARK_ENERGY_CHANCE | 0.05 | 5% chance Null breath → Dark Energy |

---

## Known Limitations & Future Work

- **Categorical inheritance** is placeholder (higher-value dominant) — needs proper per-trait dominance rules
- **No sex-linked traits**, lethal alleles, or gene linkage in Phase 1
- **Random generation skews toward Black** (all CMY mid-high) — correct behavior per weighted tiers
- **No dragon visualization** beyond color swatches and canvas sprites — future art system
- **Future systems**: stat derivation, auto-battler, kingdom management, lifecycle stages
- **Production target**: Steam + iPhone release via game engine (Unity/Godot) — web prototype validates genetics logic
