// Help Guide content — data-only definitions for the Almanac Help tab
// Each section has: id, title, icon, subsections with title + body
// Body text supports simple markdown-like formatting rendered by ui-help.js:
//   **bold**, bullet lists (lines starting with •), tables via arrays

export const HELP_SECTIONS = [

  // ── Section 1: Getting Started ──────────────────────────────
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🏁',
    subsections: [
      {
        id: 'welcome',
        title: 'Welcome',
        body: `You are a Dragon Keeper — a handler who captures, breeds, and trains dragons for the kingdom.

The core gameplay loop:
• **Explore** the world map to find and capture wild dragons
• **Breed** pairs of dragons to produce offspring with inherited traits
• **Complete Quests** by delivering dragons that match specific trait requirements
• **Progress** by earning Gold, XP, and Reputation to unlock skills, items, and new regions

What makes this game unique is that every dragon carries **real Mendelian genetics** — 23 genes with allele pairs inherited from parents. Traits aren't random — they follow biological inheritance rules that you can learn to predict and manipulate.`,
      },
      {
        id: 'first-dragons',
        title: 'Your First Dragons',
        body: `Head to the **Explore** tab and tap a region on the world map. You'll encounter wild dragons that you can fight and capture.

Wild dragons are Generation 0 — they have zone-specific genetics. Each region favors certain traits:
• **The Verdant Mire** — Cyan-colored, Ice-breathing dragons
• **The Blooming Reach** — Magenta-colored, Fire-breathing dragons
• **The Sunscorch Expanse** — Yellow-colored, Lightning-breathing dragons

When you win a fight, you can stable the dragon. Captured dragons go to your **Breeding Nests** where they can be selected as parents.

**Tip:** Capture at least two dragons to start breeding!`,
      },
      {
        id: 'first-breeding',
        title: 'Your First Breeding',
        body: `Go to the **Breed** tab and tap the parent slots to select two dragons from your Nests. Then tap "Breed!" to produce a clutch of eggs.

Each clutch has up to **4 eggs** with different hatch tiers:
• **2 Instant Hatch** — choose which eggs to hatch immediately
• **1 Timed Hatch** — goes to the Egg Rack and hatches after a timer
• **1 Locked** — requires a Hatching Powder potion to unlock

Every offspring inherits one allele from each parent per gene, following Mendelian rules. Siblings can look very different from each other because inheritance is probabilistic.`,
      },
      {
        id: 'first-quest',
        title: 'Your First Quest',
        body: `Open the **Quests** tab to see available quests. Each quest lists 1-4 trait requirements that a dragon must match.

To complete a quest:
1. Tap "Submit" on a quest card
2. Select a stabled dragon from the picker
3. The dragon must match **every** listed trait

Completing quests earns **Gold** (buy items), **XP** (unlock skills), and **Reputation** (unlock shops).

**Tip:** Pin a quest by tapping the pin icon. The floating widget shows requirements on every tab so you always know what to breed toward.`,
      },
      {
        id: 'dragon-cards',
        title: 'Understanding Dragon Cards',
        body: `Each dragon card shows:
• **Name** — auto-generated or custom
• **Sprite** — visual representation of the dragon's appearance
• **Color Swatch** — the dragon's CMY-derived color
• **Trait List** — visible phenotype (what the dragon looks like)
• **Generation** — how many breeding steps from wild (Gen 0 = wild-caught)

The visible traits are the **phenotype** — what you can see. The underlying **genotype** (allele pairs) is hidden until you use reveal skills or potions.

**Phenotype vs Genotype:** A dragon might show "Red" color but carry hidden Cyan alleles that could appear in offspring. Understanding this difference is key to strategic breeding.`,
      },
    ],
  },

  // ── Section 2: The Map & Exploration ────────────────────────
  {
    id: 'exploration',
    title: 'The Map & Exploration',
    icon: '🗺️',
    subsections: [
      {
        id: 'world-map',
        title: 'World Map',
        body: `The world has **3 regions**, each divided into **territories** and **habitats**:

• **The Verdant Mire** — Lush wetlands. Dragons here favor Cyan color and Ice breath.
• **The Blooming Reach** — Flowering highlands. Magenta color and Fire breath.
• **The Sunscorch Expanse** — Arid deserts. Yellow color and Lightning breath.

Each region has 3 territories, and each territory has 3 habitats — 27 total zones to discover. Deeper zones contain rarer dragon variants.`,
      },
      {
        id: 'zone-discovery',
        title: 'Zone Discovery',
        body: `Most zones start locked. Zones unlock in two ways:

**Trait Discovery:** Stabling dragons with diverse traits reveals new paths. The more unique trait combinations you collect, the more zones open up.

**Exploration:** Repeatedly visiting adjacent unlocked zones may eventually reveal the path to locked neighbors.

Each zone shows a progress bar indicating how close you are to unlocking it based on stabled traits.`,
      },
      {
        id: 'encounters',
        title: 'Encounters & Combat',
        body: `Exploring a zone generates 3 wild dragon encounters. For each, you can:
• **Fight** — Enter combat to attempt capture
• **Release** — Skip this encounter

To fight, select one of your stabled dragons as your champion. Combat takes place on a **4×4 grid** where Distance (horizontal) and Height (vertical) matter.

If you win, you can stable the wild dragon. If you lose, the wild dragon escapes.`,
      },
      {
        id: 'wild-genetics',
        title: 'Wild Dragon Genetics',
        body: `Wild dragons (Generation 0) have genetics influenced by their home region:
• The primary color axis for that region is always dominant in wild dragons
• Other traits are randomized within zone-specific ranges

This means dragons from different regions carry different genetic "starting material." Cross-breeding dragons from multiple regions is key to producing offspring with diverse trait combinations.`,
      },
    ],
  },

  // ── Section 3: Genetics Deep Dive ───────────────────────────
  {
    id: 'genetics',
    title: 'Genetics Deep Dive',
    icon: '🧬',
    subsections: [
      {
        id: 'inheritance-basics',
        title: 'How Inheritance Works',
        body: `Every dragon has **23 genes**, each with **2 alleles** (one from each parent). During breeding:

1. Each parent randomly passes one of their two alleles per gene
2. The offspring gets one allele from Parent A and one from Parent B
3. The combination determines the offspring's traits

This is **Mendelian inheritance** — the same system used in real genetics. Because each allele is randomly selected, siblings from the same parents can look very different.

There are three inheritance types used across different genes:
• **Linear** — trait value = average of both alleles
• **Categorical** — higher allele value dominates (is expressed)
• **Triangle** — three axes classified as High/Low to determine one of 8 phenotypes`,
      },
      {
        id: 'linear-inheritance',
        title: 'Linear Inheritance',
        body: `Most traits use **linear inheritance**: the expressed phenotype is the average of both alleles.

Example: If a dragon has Body Size alleles [2, 4], its expressed size = 3 (Medium).

Linear traits naturally drift toward the middle of their range over many generations. To breed extreme values (very large or very small), you need both parents to carry alleles at the same extreme.

Genes using linear inheritance:
• Body: size, type, scales
• Frame: wings, limbs, bones
• Breath: shape, range
• Horns: height
• Spines: height
• Tail: shape, length
• All three Color axes (Cyan, Magenta, Yellow)
• All three Finish axes (Opacity, Shine, Schiller)
• All three Element axes (Fire, Ice, Lightning)`,
      },
      {
        id: 'categorical-inheritance',
        title: 'Categorical Inheritance',
        body: `Some traits use **categorical inheritance**: the higher allele value is dominant and expressed.

Example: Horn Style alleles [0, 2] → expressed style = 2 (Gnarled), because 2 > 0.

This means a dragon can carry **hidden recessive alleles**. A dragon showing "Gnarled" horns with alleles [0, 2] will sometimes pass the "0" (None) allele to offspring, potentially producing hornless babies.

Genes using categorical inheritance:
• Horn Style (None / Sleek / Gnarled / Knobbed)
• Horn Direction (Forward / Swept-back / Upward)
• Spine Style (None / Ridge / Spikes / Sail)`,
      },
      {
        id: 'triangle-systems',
        title: 'Triangle Systems (Color, Finish, Element)',
        body: `Three trait groups use a **triangle system**: Color, Finish, and Breath Element. Each has 3 axes with values 0-3.

How it works:
1. Each axis is classified as **High** (≥1.5) or **Low** (<1.5)
2. The H/L combination across 3 axes creates **8 possible phenotypes**
3. Each phenotype has a unique name

Example — Color uses Cyan/Magenta/Yellow axes:
• All Low (LLL) → White
• All High (HHH) → Black
• Only Cyan High (HLL) → Cyan
• Cyan + Magenta High (HHL) → Blue
• Only Yellow High (LLH) → Yellow

Each phenotype group then has **8 intensity names** based on exact values, giving **64 total names** per system (8 phenotypes × 8 intensities).`,
      },
      {
        id: 'color-system',
        title: 'Color System (CMY)',
        body: `Dragon color uses **subtractive CMY mixing**, just like real pigments:

• **Cyan** axis: controls blue-green pigment
• **Magenta** axis: controls red-pink pigment
• **Yellow** axis: controls yellow pigment

The RGB color shown on dragon cards is calculated from CMY values:
• Red = 255 × (1 - C/3)
• Green = 255 × (1 - M/3)
• Blue = 255 × (1 - Y/3)

Pure colors (like saturated Red) require high Magenta AND Yellow with low Cyan — they're hard to breed because you need specific allele combinations across multiple genes.

**Color → Resistance:** A dragon's color directly determines its elemental resistance:
• High Cyan → Ice resistance (0/8/16/25% per tier)
• High Magenta → Fire resistance
• High Yellow → Lightning resistance`,
      },
      {
        id: 'finish-system',
        title: 'Finish System',
        body: `Finish describes the dragon's surface quality — how its scales interact with light. Uses three axes:

• **Opacity** — Low = translucent/glassy, High = solid/opaque
• **Shine** — Low = matte, High = glossy/reflective
• **Schiller** — Low = uniform, High = iridescent color-shift

The 8 base finishes:
• Velvet (LLL) — soft matte surface
• Gloss (LHL) — smooth and shiny
• Crystal (HLL) — solid and clear
• Metallic (HHL) — shiny and solid
• Silk (LLH) — subtle color play
• Mother of Pearl (LHH) — shiny iridescence
• Frost (HLH) — opaque with color shift
• Polished (HHH) — full shine + iridescence

Finish affects combat stats:
• High Opacity → +Armor, Low → +Evasion
• High Shine → +Breath Reflect, Low → +Accuracy
• High Schiller → +Breath Damage, Low → +Melee`,
      },
      {
        id: 'breath-element',
        title: 'Breath Element System',
        body: `Breath Element determines what type of breath attack a dragon uses. Three axes:

• **Fire** — raw thermal energy
• **Ice** — cryogenic projection
• **Lightning** — electrical discharge

The 8 base elements:
• Null (LLL) — no elemental affinity
• Fire (HLL) — thermal breath
• Ice (LHL) — cryogenic breath
• Lightning (LLH) — electric breath
• Steam (HHL) — Fire + Ice hybrid
• Solar (HLH) — Fire + Lightning hybrid
• Aurora (LHH) — Ice + Lightning hybrid
• Plasma (HHH) — all three combined

**Dark Energy:** There is a rare 5% chance per dragon of the Void variant — Dark Energy. This bypasses all elemental resistances and deals flat damage.`,
      },
      {
        id: 'specialty-combos',
        title: 'Specialty Combos',
        body: `When a dragon's **color and finish** match specific rare patterns, the dragon earns a **specialty name**. There are 70+ combos across categories:

• **Gemstones** — Ruby, Sapphire, Emerald, Topaz, Amethyst, etc.
• **Metals** — Gold, Silver, Bronze, Copper, Steel, Iron, Tin, Lead
• **Pearls** — White Pearl, Black Pearl, Pink Pearl, Gold Pearl, etc.
• **Opals** — Fire Opal, Ice Opal, Lightning Opal, Black Opal, White Opal
• **Moonstones** — Rainbow Moonstone, Peach Moonstone, Gray Moonstone, etc.
• **Stones** — Jade, Onyx, Obsidian, Marble, Slate, etc.
• **Ghosts** — Phantom, Wraith, Specter, Shade, etc.

Additionally, 16 **element modifier prefixes** (like Molten, Frozen, Charged) can combine with specialty names for even rarer designations.

Discover combos in the **Almanac > Combos** tab.`,
      },
      {
        id: 'mutations',
        title: 'Mutations',
        body: `During breeding, each allele has a **0.5% base chance** of mutating. A mutation randomly changes the allele value to something neither parent carried.

Mutations are marked with a **⚡ lightning bolt** in the genotype view.

Ways to increase mutation rate:
• **Flux Catalyst** potion — +15% mutation chance
• **Breeder skills** — Selective Mutation and Targeted Mutation (requires Catalyst Grimoire tome)

Mutations are the only way to introduce completely new allele values into your breeding population. They're rare but essential for reaching extreme trait combinations.`,
      },
      {
        id: 'sex-determination',
        title: 'Sex Determination',
        body: `Dragon sex is determined by chromosomes, but **reversed from humans**:
• Males = XX
• Females = XY

Currently sex is cosmetic only — it doesn't affect stats, breeding, or gameplay mechanics.`,
      },
    ],
  },

  // ── Section 4: Combat System ────────────────────────────────
  {
    id: 'combat',
    title: 'Combat System',
    icon: '⚔️',
    subsections: [
      {
        id: 'battlefield-grid',
        title: 'Battlefield Grid',
        body: `Combat takes place on a **4×4 grid** with two axes:
• **Distance** (horizontal) — 4 positions from Melee (0) to Long (3)
• **Height** (vertical) — 4 tiers from Ground (0) to High (3)

You choose your dragon's distance position before combat. Height is determined by the dragon's wings and bone density — you cannot change it.

The grid uses a **heatmap** to show favorable positions:
• **Green cells** = advantageous positions for your dragon
• **Red cells** = disadvantageous positions
• Position the cursor over cells to see damage estimates`,
      },
      {
        id: 'stat-derivation',
        title: 'How Stats Are Derived',
        body: `Combat stats come directly from a dragon's phenotype traits:

• **HP** — Scaled by Body Size (40 at size 1, up to 220 at size 6)
• **Armor** — From Scales (+5 to +15), Bones, and Finish Opacity
• **Speed** — Base 100, modified by Body Type, Wings, and Scales
• **Evasion** — From Body Type, Finish Opacity (low = +10), and Limbs
• **Accuracy** — Base 80, from Limbs, Finish Shine (low = +10), and Horns
• **Melee** — Base 10, from Limbs, Horns, Spines, Tail, and Finish Schiller (low = +3)
• **Breath** — From total element points × 2, modified by Horns and Finish

Body Type is especially impactful:
• Serpentine → -10% HP, +15% Speed, +10 Evasion
• Bulky → +15% HP, +5 Armor, -10% Speed`,
      },
      {
        id: 'melee-combat',
        title: 'Melee Combat',
        body: `Melee attacks require close proximity:

**Distance penalties:**
• Gap 0 (same position) — full damage
• Gap 1 — ×0.5 damage
• Gap 2+ — cannot melee

**Height penalties:**
• Same height — full damage
• 1 tier difference — ×0.75 damage
• 2+ tier difference — cannot melee

Melee damage scales with the Melee stat, which is boosted by Limbs, Horns, Spines, and Tail traits.`,
      },
      {
        id: 'breath-combat',
        title: 'Breath Combat',
        body: `Breath attacks have optimal range bands based on the dragon's Breath Range trait:

• **Close Range** — optimal at distance 0-1
• **Medium Range** — optimal at distance 1-2
• **Far Range** — optimal at distance 2-3

**Distance penalties:**
• Too close (below optimal): -15% Accuracy per tier
• Too far (beyond optimal): -15% Damage per tier

**Height penalties:**
• 2-tier height difference: -10% Accuracy, -10% Damage
• 3-tier difference: -20% Accuracy, -20% Damage

**Breath Shapes** (affects multi-target; in 1v1 always ×1.0):
• Single Target — ×1.0 damage
• Multi Target — ×0.7 (primary), ×0.5 (secondary)
• Area of Effect — ×0.4 (all targets)`,
      },
      {
        id: 'element-debuffs',
        title: 'Element Debuffs',
        body: `Each breath element applies a debuff on hit:

• **Fire → Burn** — 1-3 damage per turn for 2-4 turns (damage over time)
• **Ice → Slow** — -5% to -15% Speed for 2-4 turns
• **Lightning → Stun** — 5-15% chance to skip turn for 2-4 turns
• **Steam → Fog** — -5% to -15% Accuracy for 3 turns
• **Solar → Pierce** — Ignores 3-10 Armor for 3 turns
• **Aurora → Vulnerability** — +8% to +25% damage taken for 3 turns
• **Plasma** — Applies all three base debuffs
• **Void (Dark Energy)** — Bypasses all elemental resistances`,
      },
      {
        id: 'elemental-resistance',
        title: 'Elemental Resistance',
        body: `A dragon's **color** determines its elemental resistance:

• High **Cyan** → Ice resistance
• High **Magenta** → Fire resistance
• High **Yellow** → Lightning resistance

Resistance tiers (per color axis):
• Tier 0 (Low) — 0% resistance
• Tier 1 — 8% resistance
• Tier 2 — 16% resistance
• Tier 3 (High) — 25% resistance

This creates a natural counter-system: Cyan dragons resist Ice breath, so you'd want to attack them with Fire or Lightning instead.

**Dark Energy** breath ignores all resistances.`,
      },
    ],
  },

  // ── Section 5: Breeding Tab ─────────────────────────────────
  {
    id: 'breeding',
    title: 'Breeding',
    icon: '🥚',
    subsections: [
      {
        id: 'selecting-parents',
        title: 'Selecting Parents',
        body: `In the **Breed** tab, tap the parent slots to choose dragons from your Breeding Nests.

Only dragons in Breeding Nests can be selected — Den dragons must be moved to Nests first.

You can also use the "Random" option to pick parents randomly, or set parents from other tabs (like the Explore encounter screen) using the "Use as Parent A/B" buttons on dragon cards.`,
      },
      {
        id: 'breeding-process',
        title: 'The Breeding Process',
        body: `Each breeding produces a clutch of **4 eggs** (base). Skills can increase this up to 9.

Hatch tiers determine how many eggs you can hatch:
• **Instant Hatch** — 2 base (skills increase up to 7)
• **Timed Hatch** — goes to Egg Rack, hatches after a timer (base 5 minutes)
• **Locked** — requires Hatching Powder potion to unlock

**Breeding Modifiers:** Use potions from the Hotbar before breeding to influence outcomes:
• Flux Catalyst — increase mutation chance by 15%
• Selective Pressure potions — bias traits toward quest targets
• Other potions can lock specific alleles or force mutations

Queued modifiers are shown in the Pending Effects bar and consumed when you breed.`,
      },
      {
        id: 'clutch-management',
        title: 'Clutch Management',
        body: `After breeding, choose wisely which eggs to hatch instantly:
• Check traits against your quest requirements
• Compare offspring alleles to plan future breedings
• Send excess eggs to the Egg Rack for timed hatching

**Egg Rack:** Timed eggs hatch automatically when the timer expires. The Quick-Hatch Charm talisman and Quickening Salve potion can reduce hatch time.

**Selling Eggs:** Once you unlock the Egg Selling License skill, you can sell locked eggs for Gold. Handler skills increase the sale price from 5g base up to 10g.`,
      },
      {
        id: 'breeding-strategy',
        title: 'Breeding Strategy Tips',
        body: `• **Check quests first** — know what traits you need before breeding
• **Use captures strategically** — dragons from different regions carry different alleles
• **Breed incrementally** — don't expect the perfect dragon in one generation
• **Use reveals** — Geneticist skills and potions let you see hidden alleles to plan better crosses
• **Track lineage** — the Family Tree view shows ancestry and helps avoid inbreeding
• **Pin your quest** — the floating widget shows checkmarks against stabled dragons
• **Cross regions** — breeding dragons from different regions creates more genetic diversity`,
      },
    ],
  },

  // ── Section 6: Stables Tab ──────────────────────────────────
  {
    id: 'stables',
    title: 'Stables',
    icon: '🏠',
    subsections: [
      {
        id: 'breeding-nests',
        title: 'Breeding Nests',
        body: `Breeding Nests hold your active breeders — dragons that can be selected as parents in the Breed tab.

• **Starting slots:** 2
• **First expansion:** 4 slots (Carpenter shop upgrade)
• **Further expansion:** purchasable from the Talisman shop (slots 5-10)

Nest expansions cost Gold and scale in price. Prioritize expanding Nests early to have more breeding options.`,
      },
      {
        id: 'keeper-den',
        title: 'Keeper Den',
        body: `The Keeper Den stores dragons you want to keep long-term but aren't actively breeding.

• **Starting slots:** 1
• **First expansion:** 3 slots (Carpenter shop upgrade)
• **Further expansion:** Talisman shop (slots 4-10, prices double each time)

Den dragons can't be used as breeding parents until moved back to Nests. Use the Den for dragons with valuable genetics that you're saving for later.`,
      },
      {
        id: 'egg-rack',
        title: 'Egg Rack',
        body: `The Egg Rack holds eggs undergoing timed incubation.

• **Starting slots:** 1
• **Expansion:** Talisman shop (slots 2-6)
• **Base hatch time:** 5 minutes per egg
• **Reduced by:** Quick-Hatch Charm (-1 min per charm), Quickening Salve potion (-1 min)
• **Minimum time:** 1 minute

Eggs hatch automatically when the timer expires — you don't need to be on the Breed tab. Hatched dragons go directly to your Breeding Nests.`,
      },
      {
        id: 'collection-management',
        title: 'Managing Your Collection',
        body: `Stable slots are limited, so manage your collection carefully:

• **Move dragons** between Nests and Den by tapping the move button on their card
• **Release dragons** you no longer need to free up slots
• **Stasis Crystals** (Talisman shop) let you freeze dragons with no slot limit — frozen dragons can't breed but are preserved indefinitely

**Tip:** Keep dragons with extreme or rare allele values — even if their phenotype isn't what you need now, their genetics may be valuable for future breeding projects.`,
      },
    ],
  },

  // ── Section 7: Shop Tab ─────────────────────────────────────
  {
    id: 'shop',
    title: 'Shops',
    icon: '🛒',
    subsections: [
      {
        id: 'shop-unlocks',
        title: 'Shop Unlock Order',
        body: `Four shops unlock as you earn Reputation:

• **🪚 Carpenter** — Unlocks at 10 Rep. One-time purchase to expand Nests and Den.
• **🧪 Potion Shop** — Unlocks at 50 Rep. Single-use consumables for reveals and breeding.
• **🔮 Talisman Shop** — Unlocks at 150 Rep + discover 10 gem finishes. Permanent items.
• **📖 Arcana Shop** — Unlocks at 400 Rep. Skill-unlocking Tomes (achievement-gated).

Each shop has internal tiers that unlock at higher Reputation levels, offering more powerful items.`,
      },
      {
        id: 'potion-shop',
        title: 'Potion Shop',
        body: `Potions are single-use consumables. Categories:

**Reveal Potions:** See hidden alleles on dragons
• Allele Peek — reveals 1 allele on 1 trait
• Trait Read — reveals both alleles on 1 trait
• Genome Scan — reveals both alleles on multiple traits

**Breeding Modifiers:** Affect the next clutch
• Flux Catalyst — +15% mutation chance
• Selective Pressure — bias offspring toward quest traits
• Selective Mutation — higher chance of quest-relevant mutations

**Egg Potions:**
• Hatching Powder — unlock a locked egg for instant hatching
• Quickening Salve — reduce egg rack hatch time by 1 minute

Assign potions to the **Hotbar** for quick access. Short-press to activate, then tap a target.`,
      },
      {
        id: 'talisman-shop',
        title: 'Talisman Shop',
        body: `Talismans are permanent items that provide ongoing benefits:

**Slot Expansions:**
• Nest Expansion — add breeding nest slots
• Den Expansion — add keeper den slots
• Egg Rack Expansion — add egg rack slots

**Amulets:** (permanent breeding biases)
• Chromatic Amulet — bias color toward specific hue
• Lustral Amulet — bias finish toward specific quality
• Elemental Amulet — bias element toward specific type
• Morphic Amulet — bias body traits

**Special Items:**
• Quick-Hatch Charm — permanently reduces egg rack timer by 1 minute
• Stasis Crystal — freeze a dragon for unlimited storage (no slot cost)`,
      },
      {
        id: 'arcana-shop',
        title: 'Arcana Shop',
        body: `The Arcana Shop sells **Tomes** — books that unlock special skill sub-branches. Each tome requires a specific achievement to purchase:

• **Catalyst Grimoire** — unlocks Selective Mutation and Targeted Mutation skills (Breeder branch). Requires breeding achievements.
• **Chroma Tome** — unlocks color-specific pressure/lock skills. Requires discovering all 8 base colors.
• **Other Tomes** — unlock gene-specific skill branches for precise allele manipulation.

Tomes are expensive (250-500g) but essential for advanced breeding strategies.`,
      },
    ],
  },

  // ── Section 8: Quests Tab ───────────────────────────────────
  {
    id: 'quests',
    title: 'Quests',
    icon: '📜',
    subsections: [
      {
        id: 'quest-structure',
        title: 'Quest Structure',
        body: `Each quest requires a dragon matching **all** listed traits. Requirements range from 1-4 traits depending on difficulty.

Traits can include any phenotype value: color, finish, element, body traits, horn style, spine type, etc. The dragon you submit must match every requirement exactly.

Quests refresh periodically and can be manually refreshed using Handler skills or quest management potions.`,
      },
      {
        id: 'difficulty-rewards',
        title: 'Difficulty & Rewards',
        body: `Quest difficulty scales with the number of required traits:

• **Easy** (1 trait) — 1 Gold, 1 XP, 1 Rep
• **Medium** (2 traits) — 5 Gold, 5 XP, 5 Rep
• **Hard** (3 traits) — 10 Gold, 10 XP, 10 Rep
• **Extra Hard** (4 traits) — 20 Gold, 20 XP, 20 Rep

**Generation Bonus** (Hard and Extra Hard only):
Submitting a lower-generation dragon earns bonus Gold and XP — +5% per generation, up to 2× at generation 20. This rewards efficient breeding (achieving the target traits in fewer generations).`,
      },
      {
        id: 'quest-management',
        title: 'Quest Management Skills',
        body: `Handler skills give you tools to manage quests:

• **Reroll** — re-randomize one or more trait requirements on a quest
• **Refresh** — replace the entire quest pool with new quests
• **Flexibility** — swap a quest trait for a different one

These skills make quests more achievable by letting you tailor requirements to match dragons you already have or can easily breed.

**Free Reroll** debug toggle bypasses skill requirements for testing.`,
      },
      {
        id: 'pinned-quest',
        title: 'Pinned Quest Widget',
        body: `Tap the **pin icon** on any quest card to pin it. The pinned quest appears as a floating widget on every tab, showing:

• All trait requirements with checkmarks
• Which of your stabled dragons match each requirement
• Quick visual reference while breeding or exploring

**Quest Halos:** When a quest is pinned, dragons matching some or all requirements get a glowing halo on their cards. Toggle this in Settings.`,
      },
    ],
  },

  // ── Section 9: Skills Tab ───────────────────────────────────
  {
    id: 'skills',
    title: 'Skills',
    icon: '⚡',
    subsections: [
      {
        id: 'geneticist-branch',
        title: 'Geneticist Branch (🧬)',
        body: `The Geneticist branch focuses on **revealing hidden information**:

**Reveal Line:** Progressive allele reveals
• Allele Peek (1-6 traits, 1 allele each)
• Trait Read (1-6 traits, both alleles)
• Genome Scan (10-20 traits, both alleles)
• Full Genotype Read (all traits)

**Egg Inspection:** Reveals alleles on unhatched eggs
• Egg Candling → Egg Scrying → True Sight

**Carrier Detection:** Shows whether a dragon carries hidden recessive alleles
• Recessive Sense → Carrier Sense

**Inherited Knowledge:** Auto-reveals 25-100% of offspring traits from known parents

**Pedigree Mastery:** Auto-reveals offspring alleles inherited from fully-read parents`,
      },
      {
        id: 'breeder-branch',
        title: 'Breeder Branch (🥚)',
        body: `The Breeder branch gives **control over breeding outcomes**:

**Clutch Management:**
• Clutch Size I-V — +1 egg per tier (4 → 9 max)
• Hatch Capacity I-V — +1 instant hatch per tier (2 → 7 max)

**Selective Pressure:** 5-25% chance to bias 1-5 offspring traits toward quest allele values

**Trait Lock:** Choose which specific allele a parent passes for 1-10 traits. Very powerful for targeted breeding.

**Selective Mutation** (requires Catalyst Grimoire): 10-100% chance a quest-relevant allele appears as a mutation

**Targeted Mutation** (requires Catalyst Grimoire + Trait Lock V): Force a specific allele value as a mutation on 1-4 traits`,
      },
      {
        id: 'handler-branch',
        title: 'Handler Branch (🛡️)',
        body: `The Handler branch improves **economy and quest management**:

**Economy Skills:**
• Quest reward bonuses (+5% per tier)
• Egg Pricing — increase egg sale value from 5g to 10g

**Quest Management:**
• Reroll — re-randomize quest trait requirements
• Refresh — replace quest pool with new quests
• Flexibility — swap traits on existing quests

**Tome Skills:** Unlocked via tomes from the Arcana Shop. Provide gene-specific pressure and lock abilities for precise breeding control.

The Handler branch is the fastest path to economic power, letting you earn more Gold/XP/Rep per action.`,
      },
      {
        id: 'skill-strategy',
        title: 'Strategy Tips',
        body: `You earn XP from quests. Each branch offers a different playstyle — here's how to think about where to invest first:

• **Geneticist focus** — information advantage. Know exactly what alleles your dragons carry, making breeding decisions much more informed. Best for players who enjoy the genetics puzzle.

• **Breeder focus** — control advantage. Directly manipulate which alleles get passed to offspring. Most powerful for targeted breeding but requires knowing the alleles (pair with some Geneticist skills).

• **Handler focus** — economic speed. Earn more rewards per quest and manage quest requirements. Fastest progression but least control over breeding outcomes.

**Recommended for new players:** Start with Geneticist Reveal Line to understand the genetics system, then branch into Breeder or Handler based on your play style.`,
      },
    ],
  },

  // ── Section 10: Inventory & Hotbar ──────────────────────────
  {
    id: 'inventory',
    title: 'Inventory & Hotbar',
    icon: '🎒',
    subsections: [
      {
        id: 'inventory-overview',
        title: 'Inventory',
        body: `The Inventory tab shows all items you've purchased from shops:
• Potions — consumed on use, shown with quantity count
• Talismans — permanent items, applied automatically
• Tomes — permanent, unlock skill branches

Items stay in your inventory until used or until they've been applied (talismans apply automatically on purchase).`,
      },
      {
        id: 'hotbar-overview',
        title: 'Hotbar',
        body: `The **Hotbar** is the row of 5 slots at the bottom of the screen, always visible.

**Usage:**
• **Short press** an occupied slot → activate the item/skill
• **Long press** any slot → open picker to assign/reassign
• Potions and active skills (reveals, trait locks) can be assigned

**Targeting Mode:**
When you activate a reveal potion or skill, the game enters targeting mode:
1. Tap a dragon card to select the target
2. Choose which gene to apply the effect to
3. For trait locks, also choose which allele to lock

**Breeding Modifiers:**
When you activate a breeding modifier potion (Flux Catalyst, Selective Pressure), it queues in the Pending Effects bar and applies to your next breeding.`,
      },
    ],
  },

  // ── Section 11: Almanac ─────────────────────────────────────
  {
    id: 'almanac',
    title: 'Almanac',
    icon: '📖',
    subsections: [
      {
        id: 'discovery-system',
        title: 'Discovery System',
        body: `The Almanac tracks everything you've discovered. Entries unlock when you stable a dragon with that trait:

• **Colors** — 64 entries (8 base × 8 intensities)
• **Finishes** — 64 entries
• **Elements** — 64 entries
• **Specialty Combos** — 70+ color+finish combinations
• **Traits** — per-gene phenotype discovery

Undiscovered entries show as "???" until found. Discovery is permanent — once found, an entry stays unlocked even if you release the dragon.`,
      },
      {
        id: 'bestiary',
        title: 'Bestiary',
        body: `The Bestiary catalogs dragon species discovered across all zones. Each habitat may have rare species with specific trait combinations.

Species are discovered by encountering them during exploration. The Bestiary shows species name, habitat, and identifying traits for discovered entries.`,
      },
      {
        id: 'achievements-overview',
        title: 'Achievements',
        body: `Achievements track milestones across all gameplay systems:
• Breeding milestones (first breed, 100th breed, etc.)
• Discovery milestones (all colors, all finishes, etc.)
• Quest milestones (completions by difficulty)
• Collection milestones (10/50/100 dragons stabled)

Some achievements gate access to **Tomes** in the Arcana Shop. For example, discovering all 8 base colors unlocks the ability to purchase the Chroma Tome.

Check the Almanac > Achievements tab for your progress bars and trophy wall.`,
      },
    ],
  },

  // ── Section 12: Reference Tables ────────────────────────────
  {
    id: 'reference',
    title: 'Reference Tables',
    icon: '📊',
    subsections: [
      {
        id: 'gene-table',
        title: 'All 23 Genes',
        body: `**Body System:**
• Body Size — range 1-6, linear (Tiny/Small/Medium/Large/Huge/Colossal)
• Body Type — range 1-3, linear (Serpentine/Normal/Bulky)
• Scales — range 1-3, linear (Smooth/Textured/Armored)

**Frame System:**
• Wings — range 0-4, linear (None/Pair/Dual-pair/Quad/Six-wing)
• Limbs — range 0-3, linear (Limbless/Bipedal/Quadruped/Hexapod)
• Bone Density — range 1-3, linear (Lightweight/Standard/Dense)

**Breath System:**
• Breath Shape — range 1-3, linear (Single/Multi/AoE)
• Breath Range — range 1-3, linear (Close/Medium/Far)

**Color Axes (CMY):**
• Cyan — range 0-3, linear
• Magenta — range 0-3, linear
• Yellow — range 0-3, linear

**Finish Axes:**
• Opacity — range 0-3, linear
• Shine — range 0-3, linear
• Schiller — range 0-3, linear

**Element Axes:**
• Fire — range 0-3, linear
• Ice — range 0-3, linear
• Lightning — range 0-3, linear

**Horn Sub-system:**
• Horn Style — range 0-3, categorical (None/Sleek/Gnarled/Knobbed)
• Horn Direction — range 0-2, categorical (Forward/Swept-back/Upward)

**Spine Sub-system:**
• Spine Style — range 0-3, categorical (None/Ridge/Spikes/Sail)
• Spine Height — range 1-3, linear (Low/Medium/Tall)

**Tail Sub-system:**
• Tail Shape — range 1-3, linear (Whip/Normal/Heavy)
• Tail Length — range 1-3, linear (Short/Medium/Long)`,
      },
      {
        id: 'stat-formulas',
        title: 'Stat Derivation Summary',
        body: `**HP:** Body Size scaled (40/60/80/100/150/220), modified by Body Type (Serpentine -10%, Bulky +15%)

**Armor:** Scales (Smooth 0, Textured +5, Armored +15) + Bones + Finish Opacity (High +5)

**Speed:** Base 100, Body Type (Serpentine +15%, Bulky -10%), Wings (+10/15/20% for 2/4/6), Scales (Smooth +10%, Armored -5%)

**Evasion:** Body Type (Serpentine +10), Finish Opacity (Low +10), Limbs

**Accuracy:** Base 80, Finish Shine (Low +10), Limbs, Horns

**Melee:** Base 10, Limbs, Horns, Spines, Tail, Finish Schiller (Low +3)

**Breath Damage:** Total element points × 2 (Plasma +20%), Horn Direction (Upward +15%), Finish Schiller (High +15%)

**Height:** Determined by Wings + Bone Density (0-3 tiers)

**Elemental Resistance:** Per CMY axis: 0/8/16/25% (tiers 0-3)`,
      },
      {
        id: 'economy-reference',
        title: 'Economy Reference',
        body: `**Skill XP Costs by Tier:**
Tier 1: 5 XP, Tier 2: 8 XP, Tier 3: 12 XP, Tier 4: 17 XP, Tier 5: 23 XP
Tier 6: 30 XP, Tier 7: 35 XP, Tier 8: 40 XP, Tier 9: 50 XP, Tier 10: 65 XP

**Shop Unlock Thresholds:**
• Carpenter: 10 Reputation
• Potion Shop: 50 Reputation
• Talisman Shop: 150 Reputation + discover 10 gem finishes
• Arcana Shop: 400 Reputation

**Quest Rewards:**
• Easy (1 trait): 1g / 1 XP / 1 Rep
• Medium (2 traits): 5g / 5 XP / 5 Rep
• Hard (3 traits): 10g / 10 XP / 10 Rep
• Extra Hard (4 traits): 20g / 20 XP / 20 Rep

**Generation Bonus (Hard/Extra Hard):**
+5% Gold and XP per generation, max +100% at gen 20

**Egg Sale Prices:**
Base: 5g, with Handler Egg Pricing skills: up to 10g per egg`,
      },
    ],
  },
];
