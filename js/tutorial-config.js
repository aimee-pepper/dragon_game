// Tutorial definitions — data only, no logic
// Each tutorial has: id, group, format, trigger, content (steps/panels)
// Format types: 'spotlight', 'tooltip', 'modal', 'toast'
// Trigger types: 'app-load', 'tab-switch', 'event'

export const TUTORIALS = {

  // ── GROUP 1: First Launch ──────────────────────────────────

  'first-launch': {
    group: 'first-launch',
    priority: 0,
    format: 'modal',
    trigger: { type: 'app-load', condition: 'no-save' },
    panels: [
      {
        title: 'Welcome, Dragon Keeper',
        body: 'You are a dragon handler. Explore the wild to capture dragons, breed them strategically using real Mendelian genetics, and fulfill quests from the kingdom.\n\nEvery dragon carries hidden alleles that determine its traits — color, finish, breath element, body shape, and more. Master genetics to create the perfect dragon.',
        showSkipAll: true,
      },
      {
        title: 'Your Tools',
        body: 'Explore — Find and capture wild dragons from three diverse regions.\n\nBreed — Pair two dragons to produce a clutch of eggs with inherited traits.\n\nStables — Store your growing collection of dragons.\n\nShop — Buy potions, talismans, and tomes to enhance your abilities.\n\nQuests — Deliver dragons with specific traits to earn Gold, XP, and Reputation.',
      },
      {
        title: 'Getting Started',
        body: 'Head to the Explore tab and tap a region on the map. Capture two wild dragons to start breeding!\n\nTip: Check the Almanac > Help tab anytime for detailed guides on every game system.',
      },
    ],
  },

  // ── GROUP 2: Page First-Visit ──────────────────────────────

  'explore-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'map', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.map-canvas-wrapper',
        text: 'This is the world map. Three regions, each home to different dragon populations. Tap a region to explore.',
        position: 'bottom',
      },
      {
        target: '.map-canvas-wrapper',
        text: 'Each region has unique dragon traits:\n• The Verdant Mire — Cyan-hued, Ice-breathing\n• The Blooming Reach — Magenta, Fire-breathing\n• The Sunscorch Expanse — Yellow, Lightning-breathing',
        position: 'bottom',
      },
      {
        target: '#quest-widget',
        text: 'Check your active quest to see what traits the kingdom needs. Then explore zones where those traits are common.',
        position: 'top',
        optional: true, // skip if quest widget not visible
      },
    ],
  },

  'breed-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'breed', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.parent-slot',
        text: 'Select two dragons from your Stables as breeding parents. Tap the parent slots to choose.',
        position: 'bottom',
      },
      {
        target: '.breed-btn',
        text: 'Once both parents are set, tap Breed to produce a clutch of eggs.',
        position: 'bottom',
        optional: true,
      },
      {
        target: '.breed-controls',
        text: 'Each clutch has up to 4 eggs: 2 can be hatched instantly, 1 needs timed incubation, and 1 is locked.',
        position: 'bottom',
      },
      {
        target: '.egg-rack-section',
        text: 'The Egg Rack holds eggs undergoing timed incubation. They hatch automatically when the timer runs out.',
        position: 'top',
        optional: true,
      },
      {
        target: '.pending-effects-bar',
        text: 'Use skills or potions from your hotbar before breeding to influence the outcome.',
        position: 'top',
        optional: true,
      },
    ],
  },

  'stables-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'stables', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.nests-section, .stables-nests',
        text: 'Welcome to your Stables! This is where your dragons live. The Breeding Nests hold your active breeders — dragons here can be selected as parents.',
        position: 'bottom',
      },
      {
        target: '.den-section, .stables-den',
        text: 'The Keeper Den stores dragons you want to keep but aren\'t actively breeding. You start with 1 den slot.',
        position: 'bottom',
      },
    ],
  },

  'shop-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'shop', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.shop-tabs, .shop-nav',
        text: 'Four shops unlock as you earn Reputation:\n• 🪚 Carpenter — stable upgrades\n• 🧪 Potions — single-use consumables\n• 🔮 Talismans — permanent items\n• 📖 Arcana — skill tomes',
        position: 'bottom',
      },
      {
        target: '.shop-content',
        text: 'Each shop has rep-gated tiers. Higher reputation unlocks more powerful items and discounts.',
        position: 'bottom',
      },
      {
        target: '#footer-currency',
        text: 'Gold is earned from quests and selling eggs. Spend it in the shops to power up your breeding operation.',
        position: 'top',
      },
    ],
  },

  'quests-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'quests', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.quest-list, .quest-cards',
        text: 'Quests ask you to deliver a dragon matching specific traits. Match ALL requirements to complete the quest.',
        position: 'bottom',
      },
      {
        target: '.quest-card',
        text: 'Difficulty determines rewards:\n• Easy (1 trait) — small rewards\n• Medium (2 traits) — moderate\n• Hard (3 traits) — large + generation bonus\n• Extra Hard (4 traits) — huge + generation bonus',
        position: 'bottom',
        optional: true,
      },
      {
        target: '.currency-bar, .quest-rewards',
        text: 'Completing quests earns Gold, XP, and Reputation. XP unlocks skills, Gold buys items, and Reputation unlocks new shops and tiers.',
        position: 'top',
        optional: true,
      },
    ],
  },

  'almanac-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'almanac', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.almanac-top-tabs',
        text: 'The Almanac tracks everything you\'ve discovered. Entries unlock as you stable dragons with new trait combinations.',
        position: 'bottom',
      },
      {
        target: '.almanac-sub-tabs, .almanac-content',
        text: 'Browse 64 possible colors, finishes, and breath elements. Undiscovered entries show as "???" until you find them.',
        position: 'bottom',
        optional: true,
      },
    ],
  },

  'inventory-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'modal',
    trigger: { type: 'tab-switch', tab: 'inventory', requireCompleted: ['first-launch'] },
    panels: [
      {
        title: 'Inventory',
        body: 'Your Inventory stores potions, talismans, and tomes you\'ve purchased from the shops. Items stay here until used.\n\nAssign frequently-used potions and skills to your Hotbar (the 5 slots at the bottom of the screen) for quick access during breeding.',
      },
    ],
  },

  'skills-first-visit': {
    group: 'page-first-visit',
    priority: 10,
    format: 'spotlight',
    trigger: { type: 'tab-switch', tab: 'skills', requireCompleted: ['first-launch'] },
    steps: [
      {
        target: '.skill-branch-tabs',
        text: 'Three skill branches:\n• 🧬 Geneticist — reveals hidden alleles\n• 🥚 Breeder — manipulates breeding outcomes\n• 🛡️ Handler — economy bonuses and quest tools',
        position: 'bottom',
      },
      {
        target: '.skill-xp-bar, .xp-display',
        text: 'Skills cost XP earned from quests. Choose where to invest first — each branch unlocks powerful abilities.',
        position: 'bottom',
        optional: true,
      },
      {
        target: '.skill-card, .skill-node',
        text: 'Each skill has prerequisites. Unlock them in order within a line. Some require Tomes purchased from the Arcana Shop.',
        position: 'bottom',
        optional: true,
      },
    ],
  },

  // ── GROUP 3: Interaction Tutorials ─────────────────────────

  'first-capture': {
    group: 'interaction',
    priority: 20,
    format: 'toast+modal',
    trigger: { type: 'event', event: 'dragon-captured' },
    toast: 'Dragon captured! Check your Stables.',
    panels: [
      {
        title: 'Your First Dragon!',
        body: 'Your new dragon is in the Breeding Nests. You can see its visible traits (phenotype), but the underlying genetics are hidden until you unlock reveal skills or use potions.\n\nCapture a second dragon so you can start breeding!',
      },
    ],
  },

  'first-breed': {
    group: 'interaction',
    priority: 20,
    format: 'spotlight',
    trigger: { type: 'event', event: 'breed-complete' },
    steps: [
      {
        target: '.clutch-eggs, .egg-card',
        text: 'Your first clutch! Each egg inherited alleles from both parents through Mendelian genetics. The offspring may look very different from their parents.',
        position: 'bottom',
      },
      {
        target: '.egg-card .btn-hatch, .clutch-eggs',
        text: 'Choose which eggs to hatch instantly. The rest can go to the Egg Rack for timed hatching or be sold for gold.',
        position: 'bottom',
        optional: true,
      },
      {
        target: '.clutch-eggs',
        text: 'Compare the offspring\'s traits to the parents. Some traits blend (linear inheritance), others follow dominant/recessive rules (categorical). Breed strategically toward your quest goals!',
        position: 'top',
      },
    ],
  },

  'first-quest-complete': {
    group: 'interaction',
    priority: 20,
    format: 'toast+modal',
    trigger: { type: 'event', event: 'quest-complete' },
    toast: 'Quest Complete!',
    panels: [
      {
        title: 'Quest Complete!',
        body: 'Excellent work! Your reputation is growing. At certain Reputation thresholds, new shops and shop tiers unlock with more powerful items.\n\nCheck the Shop tab to see what\'s available.',
      },
    ],
  },

  'first-shop-purchase': {
    group: 'interaction',
    priority: 20,
    format: 'tooltip',
    trigger: { type: 'event', event: 'shop-purchase' },
    text: 'Item purchased! Find it in your Inventory. Assign potions to the Hotbar for quick use.',
    target: '.hotbar-slots, .hotbar',
  },

  'first-hotbar-use': {
    group: 'interaction',
    priority: 20,
    format: 'tooltip',
    trigger: { type: 'event', event: 'hotbar-use' },
    text: 'Targeting mode active. Tap a dragon card to apply this effect. Long-press a Hotbar slot to reassign it.',
    target: '.hotbar-slots, .hotbar',
  },

  'first-skill-unlock': {
    group: 'interaction',
    priority: 20,
    format: 'toast',
    trigger: { type: 'event', event: 'skill-unlock' },
    toast: 'Skill unlocked! Active skills (reveals, trait locks) can be assigned to your Hotbar.',
  },

  'first-egg-sell': {
    group: 'interaction',
    priority: 20,
    format: 'tooltip',
    trigger: { type: 'event', event: 'egg-sell' },
    text: 'Sold! Egg selling is a reliable gold income. The Handler skill tree has Egg Pricing upgrades to increase sale prices.',
    target: '#footer-currency',
  },

  'first-potion-on-breed': {
    group: 'interaction',
    priority: 20,
    format: 'tooltip',
    trigger: { type: 'event', event: 'potion-on-breed' },
    text: 'Breeding modifier queued! This will apply to the next clutch you breed. You can stack multiple effects.',
    target: '.pending-effects-bar',
  },

  'genotype-intro': {
    group: 'interaction',
    priority: 20,
    format: 'modal',
    trigger: { type: 'event', event: 'genotype-toggle' },
    panels: [
      {
        title: 'Reading the Genotype',
        body: 'The genotype view shows the raw allele pairs behind each visible trait. Each gene has two alleles — one inherited from each parent.\n\n• Linear traits: the expressed value is the average of both alleles\n• Categorical traits: the higher allele value is dominant (expressed)\n• ⚡ Lightning bolt marks indicate mutations — allele values that appeared spontaneously',
      },
    ],
  },

  // ── GROUP 4: Progressive Discovery ─────────────────────────

  'first-mutation': {
    group: 'progressive',
    priority: 30,
    format: 'toast+modal',
    trigger: { type: 'event', event: 'mutation-detected' },
    toast: '⚡ Mutation detected!',
    panels: [
      {
        title: 'Mutation!',
        body: 'One of the offspring\'s alleles mutated! Mutations are random changes (0.5% base chance per gene) that can introduce allele values neither parent carried.\n\nMutations are highlighted with a ⚡ icon in the genotype view. The Flux Catalyst potion and Breeder skills can increase mutation rates.',
      },
    ],
  },

  'first-specialty-combo': {
    group: 'progressive',
    priority: 30,
    format: 'toast+modal',
    trigger: { type: 'event', event: 'specialty-discovered' },
    toast: 'Specialty combo discovered!',
    panels: [
      {
        title: 'Specialty Combo!',
        body: 'When a dragon\'s color and finish (or finish and element) match specific rare patterns, they earn a special name like Ruby, Gold, or Opalescent.\n\nThere are over 86 specialty combos to discover across categories like Gemstones, Metals, Pearls, Opals, and Ghosts. Check the Almanac > Combos tab to see all possible combinations.',
      },
    ],
  },

  'first-dark-energy': {
    group: 'progressive',
    priority: 30,
    format: 'toast',
    trigger: { type: 'event', event: 'dark-energy-discovered' },
    toast: '🌑 Dark Energy dragon discovered! Ultra-rare Void variant — bypasses all elemental resistances in combat.',
  },

  'first-zone-unlock': {
    group: 'progressive',
    priority: 30,
    format: 'toast',
    trigger: { type: 'event', event: 'zone-unlock' },
    toast: 'New zone unlocked! Deeper zones have rarer dragon variants.',
  },

  'first-achievement': {
    group: 'progressive',
    priority: 30,
    format: 'modal',
    trigger: { type: 'event', event: 'first-achievement' },
    panels: [
      {
        title: 'Achievements',
        body: 'Achievements track your breeding milestones and discoveries. Some achievements gate access to powerful Tomes in the Arcana Shop — like breeding all 8 base colors to unlock the Chroma Tome.\n\nCheck the Almanac > Achievements tab to see your progress.',
      },
    ],
  },

  'first-generation-bonus': {
    group: 'progressive',
    priority: 30,
    format: 'toast',
    trigger: { type: 'event', event: 'generation-bonus' },
    toast: 'Generation bonus! Fewer breeding generations = higher rewards on Hard and Extra Hard quests.',
  },

  'shop-tier-unlock': {
    group: 'progressive',
    priority: 30,
    format: 'toast',
    trigger: { type: 'event', event: 'shop-tier-unlock' },
    toast: 'New shop items available! Your growing reputation has unlocked a higher tier.',
  },

  'ten-dragons-stabled': {
    group: 'progressive',
    priority: 30,
    format: 'modal',
    trigger: { type: 'event', event: 'ten-dragons' },
    panels: [
      {
        title: 'Growing Collection',
        body: 'Your dragon collection is growing! Remember: stable slots are limited.\n\n• Use the Den for dragons you want to keep but aren\'t actively breeding\n• Release dragons you no longer need to free up space\n• Later, Stasis Crystals let you freeze dragons with no slot limit',
      },
    ],
  },

  'first-combat': {
    group: 'interaction',
    priority: 20,
    format: 'spotlight',
    trigger: { type: 'event', event: 'combat-start' },
    steps: [
      {
        target: '.placement-grid-wrapper',
        text: 'Choose your dragon\'s position on the 4×4 grid. Distance (left-right) and Height (up-down) affect combat.\n\nGreen cells = advantageous positions. Red cells = disadvantageous.',
        position: 'bottom',
      },
      {
        target: '.placement-grid-wrapper',
        text: 'Melee attacks need close distance and similar height. Breath attacks have optimal range bands — too close hurts accuracy, too far reduces damage.',
        position: 'top',
      },
    ],
  },
};

// Helper: get all tutorial IDs
export function getAllTutorialIds() {
  return Object.keys(TUTORIALS);
}
