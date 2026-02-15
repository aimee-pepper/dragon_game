# Dragon Breeding Game — Project Overview

> **Working Title:** TBD (candidates: Kindleborn, Broodline, Wyrmwright)
> **Platform:** Mobile-first, portrait mode
> **Genre:** Genetics roguelite / breeding sim / auto-battler
> **Monetization:** Premium ($6.99–$9.99) with optional expansions

---

## Vision

A dragon breeding game where real Mendelian genetics drive gameplay. The only dragon game where genetics actually matter. Players serve kingdoms as traveling dragon handlers, fulfilling ruler demands through strategic breeding and building legendary bloodlines validated through auto-battler combat.

**Design ratio:** 80% entertainment, 20% education. Learning happens through play, not tutorials. The game never *requires* players to use terms like "heterozygous" — but players who understand these concepts have strategic advantages.

**Inspirations:**
- **GenScope / BioLogica** — real genetics as gameplay (the spiritual ancestor)
- **Balatro / Slay the Spire** — build-crafting, synergy discovery, "solving the puzzle"
- **Cookie Clicker / Adventure Capitalist** — prestige/ascension loop
- **Rogue Legacy / Hades** — roguelite progression with generational advancement
- **DragonVale / Dragon City** — competitors to differentiate FROM (they use fake genetics)

---

## Target Player

**Primary:** Casual mobile gamers who want depth without action mechanics.
- Portrait mode mandatory (one-handed play)
- Turn-based / auto-battler only — no twitch reflexes
- Meaningful permanent progression — hates wasted time
- Loves synergy/build crafting — discovering broken combos is the dopamine hit
- Prefers premium or fair F2P — no predatory gacha

**Secondary:** GenScope nostalgics, dragon/fantasy fans wanting more depth than DragonVale, parents seeking "educational but actually fun" games (10+), strategy/optimization gamers.

**Not targeting:** Action gamers, instant-gratification players, hardcore PvP.

---

## Core Fantasy

You are a master dragon breeder — part scientist, part political advisor, part wartime asset. Rulers depend on your expertise. Rival breeders fear your bloodlines. Wild dragon colonies hold genetic secrets you need. Your knowledge of inheritance patterns is your superpower.

---

## Key Design Decisions Made

### Genetics Architecture (~23 genes in base game)
The genetics system is organized into four categories:

**3 Main Systems** (3 tiers each, all linear/incomplete dominance):
- Body: Size / Body Type / Scales
- Frame: Wing Count / Limb Count / Bone Density
- Breath: Element (triangle) / Shape / Range

**3 Sub Systems** (2 tiers each):
- Horns: Style / Direction
- Spines: Style / Height
- Tail: Shape / Length

**3 Triangle Systems** (3 parallel genes each, None→Low→Med→High):
- Color: Cyan / Magenta / Yellow
- Finish: Opacity / Shine / Schiller
- Breath Element: Fire / Ice / Lightning

No orphan traits in base game — both Air Bladder and Teeth moved to expansion packs.

See GENETICS.md for full details.

### Color & Finish
- **CMY color model** — subtractive mixing creates natural breeding depth. Pure Red (M+Y, zero C) requires generations of selective breeding. Black (all high) requires stacking three pigments.
- **Finish triangle** — Opacity/Shine/Schiller produce named finishes: Matte, Glass, Prismatic, Metallic, Holographic, Opalescent, Mother of Pearl, Seaglass.
- **Metallic** remains a prestige modifier — separate from finish, applies to any color with its own blending rules.

### Breath Elements
- **Fire / Ice / Lightning** as triangle corners (colored Red / Blue / Yellow)
- Edges: Steam (F+I, Purple), Solar (F+L, Orange), Aurora (I+L, Green)
- Center: Plasma (all high, White)
- Absence: Null (all low, Black — usually nothing, rare dark beam)

### Expansion Packs (11 planned)
Base game is scaled dragons only. Expansions add traits to existing systems:
- **Beast packs:** Equine, Big Cat, Canine
- **Creepy Crawly packs:** Winged Insects, Arthropod
- **Aquatic packs:** Coastal/Fish, Deep Sea, Cephalopod
- **Avian packs:** Raptor, Exotic Bird
- **Aesthetic Overhaul:** Patterns, covering materials beyond scales (possibly free DLC)

Each pack touches 3–4 systems, keeping scope manageable. Mixing packs enables mythological creatures (gryphons, manticores, etc.).

### Gameplay Structure
- **Kingdom-based campaigns** — serve rulers, fulfill breeding requests, build favor
- **Rulers have genetics too** — temperament, taste, generosity, attention all inherited by heirs
- **Prestige/retirement system** (Cookie Clicker ascension model) — hit soft ceiling ~Rank 10, retire for Legacy Points, heir starts with permanent bonuses
- **Spouse selection** affects heir perks — mix of linear unlocks and RNG encounters
- **Three difficulty modes:** Sanctuary (cozy) / Handler (standard) / Dragoon (brutal) with custom toggles

### Combat
- **Auto-battler** — you don't control dragons in battle, you watch your genetic choices play out
- **Stats derived from phenotype** — size → HP, breath type → elemental damage, etc.
- **Named rival breeders** with signature builds you reverse-engineer

### Monetization (Hard Rules)
- Premium base game, no ads, no energy systems, no gacha/lootboxes
- No pay-to-speed-up, no pay-for-genetics
- Optional expansion packs ($2.99–$4.99): new trait packs
- Optional cosmetic IAP ($0.99–$2.99): accessories, stable decorations, UI themes
- Fallback: generous F2P with one-time "Breeder's License" ($9.99)

### UI/UX
- Portrait mode, mobile-first
- Art direction: "illuminated manuscript meets creature collector"
- Phenotype must be instantly readable from dragon appearance
- Progressive mini-tutorials triggered by new mechanics, everything skippable

---

## Inheritance System (In Progress)

Two approaches under consideration for linear traits:
- **True linear:** Bird × Mega = any middle value equally possible
- **Middle-dominant:** Bird × Mega = probably Standard, extremes harder to get (more breeding depth)

Triangle systems confirmed as linear (rare combos built in via the math).

Non-linear traits (horn style, spine style, etc.) still need specific inheritance rules — dominant hierarchy, probability, or some mix.

---

## Open Questions

1. **Inheritance model:** True linear vs middle-dominant for each trait (reference codes 1A–7B defined, awaiting decisions)
2. **Game name:** Still being finalized. Top candidates: Kindleborn, Broodline, Wyrmwright
3. **Stat values per trait:** Needs implementation-phase balancing
4. **Lethal allele combinations:** Need specific mappings
5. **Codex discovery system:** Which synergies documented vs. hidden
6. **Multiplayer:** None at launch. Possible future async if game succeeds.

---

## Project Status

- ✅ Core concept and target audience defined
- ✅ Genetics framework restructured (~23 genes, 3 system categories + sub systems)
- ✅ CMY color system + Finish triangle + Breath triangle designed
- ✅ Expansion pack architecture (11 packs)
- ✅ Campaign/kingdom structure designed
- ✅ Progression and prestige/retirement loop designed
- ✅ Combat system (auto-battler) designed
- ✅ Difficulty modes designed (Sanctuary/Handler/Dragoon)
- ✅ Random events system designed
- ✅ Monetization philosophy locked
- ✅ UI/UX requirements documented
- ✅ Tutorial/onboarding approach decided
- 🔄 Inheritance rules per trait (in progress)
- ⬜ Game name finalized
- ⬜ Implementation / coding begun
- ⬜ Art assets
- ⬜ Stat balancing
- ⬜ Playtesting
