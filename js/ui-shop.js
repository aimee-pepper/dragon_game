// Shop tab: three tiered shops (Potion, Talisman, Arcana)
// Rep-gated unlock, internal tiers, discounts, purchasing
import {
  getShopTier, isShopUnlocked, getActiveDiscount,
  getAvailableItems, purchaseItem,
  getBreedCycleCount, shouldRefreshShop,
  getInventory, hasTome, isCarpenterComplete,
} from './shop-engine.js';
import { SHOP_UNLOCK_REP } from './economy-config.js';
import { getStats } from './save-manager.js';
import { isUnlocked as isAchievementUnlocked } from './achievements.js';
import { uiImg } from './ui-card.js';

let shopContainer = null;
let activeShop = 'carpenter'; // 'carpenter' | 'potion' | 'talisman' | 'arcana'

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ── Shop Definitions ──────────────────────────────────────────

const SHOP_DEFS = {
  carpenter: {
    name: 'Carpenter',
    icon: '🪚',
    desc: 'Stables & den expansions',
    color: 'shop-carpenter',
  },
  potion: {
    name: 'Potion Shop',
    icon: '🧪',
    desc: 'Consumable brews and elixirs',
    color: 'shop-potion',
  },
  talisman: {
    name: 'Talisman Shop',
    icon: '🔮',
    desc: 'Permanent upgrades and charms',
    color: 'shop-talisman',
  },
  arcana: {
    name: 'Arcana Library',
    icon: '📖',
    desc: 'One-time tomes of knowledge',
    color: 'shop-arcana',
  },
};

// Item descriptions (for tooltip/display)
const ITEM_DESCRIPTIONS = {
  // Carpenter
  'carpenter-upgrade': 'Expand breeding nests (2 → 4 slots) and keeper den (1 → 3 slots)',
  // Potions
  'broodmothers-draught': '+1 egg in next clutch',
  'seers-tincture': 'Peek at one unhatched egg\'s traits',
  'quickening-salve': 'Reduce egg rack hatch time by 1 min',
  'dominant-tonic': 'Force one gene to express dominant allele',
  'recessive-elixir': 'Force one gene to express recessive allele',
  'hatching-powder': 'Instantly hatch one rack egg',
  'revealing-draught': 'Reveal full genotype of one dragon',
  'oracles-draught': 'Preview offspring genotype range before breeding',
  'bloodline-ink': 'Permanently mark a dragon\'s lineage as prestigious',
  'chromatic-tincture': 'Shift one color gene axis by ±1',
  'lustral-oil': 'Shift one finish gene axis by ±1',
  'breath-essence': 'Shift one breath gene axis by ±1',
  'ossite-powder': 'Shift one body/frame gene by ±1',
  'keratin-salve': 'Shift one horn/spine gene by ±1',
  'wyrms-breath-oil': 'Shift breath shape or range by ±1',
  'scale-lacquer': 'Shift scale type by ±1',
  'flux-catalyst': '+15% mutation chance for next breed',
  'binding-resin': 'Suppress all mutation in next breed',
  'precision-elixir': 'Choose which gene mutates in next breed',
  'scrying-vapors': 'See probability breakdown for next breed',
  'carriers-tincture': 'Guarantee carrier status for one gene',
  // Talismans
  'egg-sale-license': 'Unlock the ability to sell locked eggs for gold',
  'breeding-nest-expansion': 'Add one breeding nest slot',
  'den-slot-expansion': 'Add one den slot',
  'egg-rack-expansion': 'Add one egg rack slot',
  'breeding-charm': 'Permanently +1 egg per clutch',
  'hatchers-pendant': 'Permanently +1 instant hatch per clutch',
  'quick-hatch-charm': 'Permanently reduce hatch time by 1 min',
  'stasis-crystal': 'Freeze one egg indefinitely (limited)',
  // Chromatic/lustral/elemental amulets
  'chromatic-amulet-1': '+5% selective pressure on color genes',
  'chromatic-amulet-2': '+10% selective pressure on color genes',
  'chromatic-amulet-3': '+10% selective pressure on color genes, +1 trait',
  'chromatic-amulet-4': '+15% selective pressure on color genes, +1 trait',
  'chromatic-amulet-5': '+15% selective pressure on color genes, +2 traits',
  'lustral-pendant-1': '+5% selective pressure on finish genes',
  'lustral-pendant-2': '+10% selective pressure on finish genes',
  'lustral-pendant-3': '+10% selective pressure on finish genes, +1 trait',
  'lustral-pendant-4': '+15% selective pressure on finish genes, +1 trait',
  'lustral-pendant-5': '+15% selective pressure on finish genes, +2 traits',
  'elemental-brooch-1': '+5% selective pressure on breath genes',
  'elemental-brooch-2': '+10% selective pressure on breath genes',
  'elemental-brooch-3': '+10% selective pressure on breath genes, +1 trait',
  'elemental-brooch-4': '+15% selective pressure on breath genes, +1 trait',
  'elemental-brooch-5': '+15% selective pressure on breath genes, +2 traits',
  'morphic-charm-1': '+5% selective pressure on body/frame genes',
  'morphic-charm-2': '+10% selective pressure on body/frame genes',
  'morphic-charm-3': '+10% selective pressure on body/frame genes, +1 trait',
  'morphic-charm-4': '+15% selective pressure on body/frame genes, +1 trait',
  'morphic-charm-5': '+15% selective pressure on body/frame genes, +2 traits',
  'appendage-amulet-1': '+5% selective pressure on horn/spine/tail genes',
  'appendage-amulet-2': '+10% selective pressure on horn/spine/tail genes',
  'appendage-amulet-3': '+10% selective pressure on horn/spine/tail genes, +1 trait',
  'appendage-amulet-4': '+15% selective pressure on horn/spine/tail genes, +1 trait',
  'appendage-amulet-5': '+15% selective pressure on horn/spine/tail genes, +2 traits',
  'wyrms-brooch-1': '+5% selective pressure on breath shape/range',
  'wyrms-brooch-2': '+10% selective pressure on breath shape/range',
  'wyrms-brooch-3': '+10% selective pressure on breath shape/range, +1 trait',
  'wyrms-brooch-4': '+15% selective pressure on breath shape/range, +1 trait',
  'wyrms-brooch-5': '+15% selective pressure on breath shape/range, +2 traits',
  // Tomes
  'morphology-foundations': 'Unlock body/frame selective breeding skills',
  'appendage-primary': 'Unlock horn/spine/tail selective breeding skills',
  'morphology-structures': 'Unlock advanced body/frame skills',
  'appendage-secondary': 'Unlock advanced horn/spine/tail skills',
  'scale-appendix': 'Unlock scale type selective breeding skills',
  'morphology-details': 'Unlock master body/frame skills',
  'breath-arts': 'Unlock breath shape/range selective breeding skills',
  'chroma-tome': 'Unlock chromatic mastery skills',
  'luster-tome': 'Unlock lustral mastery skills',
  'breath-codex': 'Unlock breath element mastery skills',
  'catalyst-grimoire': 'Unlock advanced mutation manipulation skills',
};

// ── Init ──────────────────────────────────────────────────────

export function initShopTab(container) {
  shopContainer = container;
  renderShop();
}

export function refreshShop() {
  renderShop();
}

// ── Main Render ──────────────────────────────────────────────

function renderShop() {
  if (!shopContainer) return;
  shopContainer.innerHTML = '';

  const { gold, rep } = getStats();

  // Currency bar
  const currencyBar = el('div', 'shop-currency-bar');
  const goldDisplay = el('span', 'shop-currency shop-gold');
  goldDisplay.appendChild(uiImg('c_coin.png', 'currency-icon'));
  goldDisplay.appendChild(document.createTextNode(` ${gold}`));
  currencyBar.appendChild(goldDisplay);

  const repDisplay = el('span', 'shop-currency shop-rep');
  repDisplay.appendChild(uiImg('c_rep.png', 'currency-icon'));
  repDisplay.appendChild(document.createTextNode(` ${rep}`));
  currencyBar.appendChild(repDisplay);
  shopContainer.appendChild(currencyBar);

  // Shop tabs — hide carpenter once complete
  const carpenterDone = isCarpenterComplete();
  const visibleShops = Object.entries(SHOP_DEFS).filter(([key]) =>
    !(key === 'carpenter' && carpenterDone)
  );

  // If active shop was carpenter but it's gone, default to first visible
  if (activeShop === 'carpenter' && carpenterDone) {
    activeShop = visibleShops[0]?.[0] || 'potion';
  }

  const tabBar = el('div', 'shop-tab-bar');
  for (const [key, def] of visibleShops) {
    const tab = el('button', 'shop-tab');
    const unlocked = isShopUnlocked(key);

    if (key === activeShop) tab.classList.add('shop-tab-active');
    if (!unlocked) tab.classList.add('shop-tab-locked');

    tab.innerHTML = `<span class="shop-tab-icon">${unlocked ? def.icon : '🔒'}</span><span class="shop-tab-name">${def.name}</span>`;

    tab.addEventListener('click', () => {
      activeShop = key;
      renderShop();
    });
    tabBar.appendChild(tab);
  }
  shopContainer.appendChild(tabBar);

  // Active shop content
  const content = el('div', 'shop-content');
  const def = SHOP_DEFS[activeShop];
  const unlocked = isShopUnlocked(activeShop);

  if (!unlocked) {
    renderLockedShop(content, activeShop, def, rep);
  } else if (activeShop === 'carpenter' && !carpenterDone) {
    renderCarpenterVisit(content, gold);
  } else {
    renderUnlockedShop(content, activeShop, def, gold, rep);
  }

  shopContainer.appendChild(content);
}

// ── Locked Shop ──────────────────────────────────────────────

function renderLockedShop(content, shopKey, def, currentRep) {
  const lockCard = el('div', 'shop-locked-card');

  const icon = el('div', 'shop-locked-icon', '🔒');
  lockCard.appendChild(icon);

  const title = el('div', 'shop-locked-title', def.name);
  lockCard.appendChild(title);

  const desc = el('div', 'shop-locked-desc', def.desc);
  lockCard.appendChild(desc);

  // Rep requirement
  const reqRep = SHOP_UNLOCK_REP[shopKey];
  const repBar = el('div', 'shop-rep-bar');
  const repFill = el('div', 'shop-rep-fill');
  const percent = Math.min(100, (currentRep / reqRep) * 100);
  repFill.style.width = `${percent}%`;
  repBar.appendChild(repFill);
  lockCard.appendChild(repBar);

  const repLabel = el('div', 'shop-rep-label');
  repLabel.textContent = `${currentRep} / ${reqRep} Rep`;
  lockCard.appendChild(repLabel);

  // Achievement gate for Talisman Shop
  if (shopKey === 'talisman') {
    const achGate = el('div', 'shop-ach-gate');
    const achMet = isAchievementUnlocked('discover_specialty_10');
    achGate.innerHTML = `${achMet ? '✅' : '⬜'} Discover 10 specialty gem finishes`;
    if (!achMet) achGate.classList.add('shop-ach-unmet');
    lockCard.appendChild(achGate);
  }

  content.appendChild(lockCard);
}

// ── Carpenter NPC Visit (one-off) ────────────────────────────

function renderCarpenterVisit(content, currentGold) {
  const card = el('div', 'shop-locked-card');
  card.style.textAlign = 'left';

  // NPC header
  const header = el('div', 'shop-header');
  const headerLeft = el('div', 'shop-header-left');
  headerLeft.innerHTML = '<span class="shop-header-icon">🪚</span><span class="shop-header-name">The Carpenter</span>';
  header.appendChild(headerLeft);
  card.appendChild(header);

  // Flavor intro
  const intro = el('p', 'shop-npc-flavor');
  intro.textContent = 'A weathered carpenter has arrived at your keep. He sizes up your modest stables and den with a practiced eye.';
  card.appendChild(intro);

  // What you get
  const offer = el('div', 'shop-item');
  const offerInfo = el('div', 'shop-item-info');
  offerInfo.appendChild(el('div', 'shop-item-name', "Carpenter's Overhaul"));
  offerInfo.appendChild(el('div', 'shop-item-desc', 'Expand breeding nests (2 → 4 slots) and keeper den (1 → 3 slots)'));
  offer.appendChild(offerInfo);

  // Price + buy
  const buyArea = el('div', 'shop-item-buy');
  const price = el('div', 'shop-item-price');
  price.appendChild(uiImg('c_coin.png', 'currency-icon'));
  price.appendChild(document.createTextNode(' 15'));
  buyArea.appendChild(price);

  const canAfford = currentGold >= 15;
  const buyBtn = el('button', 'btn btn-shop btn-small', 'Hire');
  if (!canAfford) {
    buyBtn.disabled = true;
    buyBtn.classList.add('btn-disabled');
    buyBtn.title = 'Not enough gold';
  }

  buyBtn.addEventListener('click', () => {
    const result = purchaseItem('carpenter', 'carpenter-upgrade');
    if (result.success) {
      // Show departure message
      card.innerHTML = '';
      const departing = el('div', 'shop-locked-card');
      departing.style.textAlign = 'center';
      departing.appendChild(el('div', 'shop-locked-icon', '🪚'));
      const msg = el('p', 'shop-npc-flavor');
      msg.textContent = 'The carpenter packs his tools and departs with a wave. Your stables and den have been expanded!';
      departing.appendChild(msg);
      content.innerHTML = '';
      content.appendChild(departing);
      // Re-render after delay (carpenter tab will be gone)
      setTimeout(() => renderShop(), 2500);
    } else {
      buyBtn.textContent = result.message;
      buyBtn.classList.add('btn-error');
      setTimeout(() => {
        buyBtn.textContent = 'Hire';
        buyBtn.classList.remove('btn-error');
      }, 1500);
    }
  });

  buyArea.appendChild(buyBtn);
  offer.appendChild(buyArea);
  card.appendChild(offer);

  // Flavor outro — teasing the other shops
  const outro = el('p', 'shop-npc-flavor');
  outro.textContent = "He gestures toward the empty market square. \"I'll send word to the merchants\u200A—\u200Aa potion brewer, a talisman crafter, and a scholar of arcana. They'll set up shop once you've got enough pull around here. Build your reputation and they'll come sooner.\"";
  card.appendChild(outro);

  content.appendChild(card);
}

// ── Unlocked Shop ────────────────────────────────────────────

function renderUnlockedShop(content, shopKey, def, gold, rep) {
  const tier = getShopTier(shopKey);
  const discount = getActiveDiscount(shopKey);

  // Shop header with tier + discount
  const header = el('div', 'shop-header');
  const headerLeft = el('div', 'shop-header-left');
  headerLeft.innerHTML = `<span class="shop-header-icon">${def.icon}</span><span class="shop-header-name">${def.name}</span>`;
  header.appendChild(headerLeft);

  const headerRight = el('div', 'shop-header-right');
  const tierBadge = el('span', 'shop-tier-badge', `Tier ${tier}`);
  headerRight.appendChild(tierBadge);

  if (discount > 0) {
    const discBadge = el('span', 'shop-discount-badge', `-${Math.round(discount * 100)}%`);
    headerRight.appendChild(discBadge);
  }
  header.appendChild(headerRight);
  content.appendChild(header);

  // Item list
  const items = getAvailableItems(shopKey);

  if (items.length === 0) {
    const emptyMsg = shopKey === 'carpenter'
      ? 'All expansions built! Check back when new construction is available.'
      : 'No items available at this tier.';
    const empty = el('div', 'shop-empty', emptyMsg);
    content.appendChild(empty);
    return;
  }

  // Group items by tier
  const tierGroups = new Map();
  for (const item of items) {
    if (!tierGroups.has(item.tier)) tierGroups.set(item.tier, []);
    tierGroups.get(item.tier).push(item);
  }

  for (const [itemTier, tierItems] of tierGroups) {
    const tierSection = el('div', 'shop-tier-section');
    const tierHeader = el('div', 'shop-tier-header', `Tier ${itemTier}`);
    tierSection.appendChild(tierHeader);

    for (const item of tierItems) {
      const row = renderShopItem(item, shopKey, gold, rep);
      tierSection.appendChild(row);
    }

    content.appendChild(tierSection);
  }

  // Inventory section (only for potions - show current stock)
  if (shopKey === 'potion') {
    const inv = getInventory();
    if (inv.size > 0) {
      const invSection = el('div', 'shop-inventory-section');
      invSection.appendChild(el('div', 'shop-inventory-header', 'Your Stock'));
      for (const [itemId, count] of inv) {
        const desc = ITEM_DESCRIPTIONS[itemId] || '';
        const row = el('div', 'shop-inventory-row');
        row.innerHTML = `<span class="shop-inv-name">${itemId.replace(/-/g, ' ')}</span><span class="shop-inv-count">×${count}</span>`;
        invSection.appendChild(row);
      }
      content.appendChild(invSection);
    }
  }
}

// ── Item Row ─────────────────────────────────────────────────

function renderShopItem(item, shopKey, currentGold, currentRep) {
  const row = el('div', 'shop-item');

  // Item info
  const info = el('div', 'shop-item-info');
  const nameRow = el('div', 'shop-item-name', item.name);
  info.appendChild(nameRow);

  const desc = ITEM_DESCRIPTIONS[item.id];
  if (desc) {
    const descEl = el('div', 'shop-item-desc', desc);
    info.appendChild(descEl);
  }

  // Achievement gate indicator
  if (item.achievement) {
    const achMet = isAchievementUnlocked(item.achievement);
    if (!achMet) {
      const achTag = el('div', 'shop-item-ach', '🔒 Requires achievement');
      info.appendChild(achTag);
    }
  }

  // Limited indicator
  if (item.limited) {
    const limitTag = el('span', 'shop-item-limit', 'Limited');
    nameRow.appendChild(limitTag);
  }

  // Purchased indicator for tomes
  if (item.purchased) {
    const ownedTag = el('span', 'shop-item-owned', '✓ Owned');
    nameRow.appendChild(ownedTag);
  }

  row.appendChild(info);

  // Buy button + price
  const buyArea = el('div', 'shop-item-buy');

  if (item.purchased) {
    // Already purchased tome
    const owned = el('div', 'shop-item-price shop-item-purchased', 'Purchased');
    buyArea.appendChild(owned);
  } else {
    const isRepCost = item.rep > 0;
    const price = el('div', 'shop-item-price');
    if (isRepCost) {
      price.appendChild(uiImg('c_rep.png', 'currency-icon'));
      price.appendChild(document.createTextNode(` ${item.rep}`));
    } else {
      price.appendChild(uiImg('c_coin.png', 'currency-icon'));
      price.appendChild(document.createTextNode(` ${item.gold}`));
    }
    buyArea.appendChild(price);

    const canAfford = isRepCost ? (currentRep || 0) >= item.rep : currentGold >= item.gold;
    const achBlocked = item.achievement && !isAchievementUnlocked(item.achievement);

    const buyBtn = el('button', 'btn btn-shop btn-small', 'Buy');
    if (!canAfford) {
      buyBtn.disabled = true;
      buyBtn.classList.add('btn-disabled');
      buyBtn.title = isRepCost ? 'Not enough rep' : 'Not enough gold';
    }
    if (achBlocked) {
      buyBtn.disabled = true;
      buyBtn.classList.add('btn-disabled');
      buyBtn.title = 'Achievement required';
    }

    buyBtn.addEventListener('click', () => {
      const result = purchaseItem(shopKey, item.id);
      if (result.success) {
        // Show success feedback
        buyBtn.textContent = '✓';
        buyBtn.disabled = true;
        buyBtn.classList.add('btn-purchased');
        // Re-render after a short delay to update gold and items
        setTimeout(() => renderShop(), 600);
      } else {
        buyBtn.textContent = result.message;
        buyBtn.classList.add('btn-error');
        setTimeout(() => {
          buyBtn.textContent = 'Buy';
          buyBtn.classList.remove('btn-error');
        }, 1500);
      }
    });
    buyArea.appendChild(buyBtn);
  }

  row.appendChild(buyArea);
  return row;
}
