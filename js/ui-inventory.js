// Inventory tab: display owned consumable potions, permanent talismans, and tomes
import { getInventory, hasTome } from './shop-engine.js';
import { POTION_PRICES, TALISMAN_PRICES, TOME_PRICES } from './economy-config.js';
import { getHotbar, setHotbarSlot } from './save-manager.js';
import { POTION_EFFECTS } from './potion-engine.js';

let inventoryPanel = null;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initInventoryTab(panel) {
  inventoryPanel = panel;
  renderInventory();
}

export function refreshInventory() {
  renderInventory();
}

function renderInventory() {
  if (!inventoryPanel) return;
  inventoryPanel.innerHTML = '';

  const container = el('div', 'inventory-container');

  // Title
  const header = el('div', 'inventory-header');
  header.appendChild(el('h2', 'section-title', 'Inventory'));
  container.appendChild(header);

  // ── Consumable potions ──
  const inventory = getInventory();
  const potionSection = el('div', 'inventory-section');
  potionSection.appendChild(el('h3', 'inventory-section-title', 'Potions'));

  let hasPotions = false;
  for (const [itemId, count] of inventory) {
    if (count <= 0) continue;
    const potionInfo = POTION_PRICES[itemId];
    if (!potionInfo) continue;
    hasPotions = true;

    const row = el('div', 'inventory-item');

    const icon = el('span', 'inventory-item-icon', '🧪');
    row.appendChild(icon);

    const info = el('div', 'inventory-item-info');
    info.appendChild(el('span', 'inventory-item-name', potionInfo.name));
    const desc = POTION_EFFECTS[itemId]?.desc || '';
    if (desc) info.appendChild(el('span', 'inventory-item-desc', desc));
    row.appendChild(info);

    const countEl = el('span', 'inventory-item-count', `x${count}`);
    row.appendChild(countEl);

    // Assign to hotbar button
    const assignBtn = el('button', 'btn btn-secondary btn-small', 'Hotbar');
    assignBtn.title = 'Assign to hotbar slot';
    assignBtn.addEventListener('click', () => {
      showHotbarAssignPicker(itemId, potionInfo.name);
    });
    row.appendChild(assignBtn);

    potionSection.appendChild(row);
  }

  if (!hasPotions) {
    potionSection.appendChild(el('div', 'inventory-empty', 'No potions. Purchase them from the Potion Shop.'));
  }
  container.appendChild(potionSection);

  // ── Permanent items (talismans bought > 0 times) ──
  const talismanSection = el('div', 'inventory-section');
  talismanSection.appendChild(el('h3', 'inventory-section-title', 'Talismans'));

  let hasTalismans = false;
  for (const [itemId, count] of inventory) {
    if (count <= 0) continue;
    const talismanInfo = TALISMAN_PRICES[itemId];
    if (!talismanInfo) continue;
    hasTalismans = true;

    const row = el('div', 'inventory-item');
    const icon = el('span', 'inventory-item-icon', '🔮');
    row.appendChild(icon);

    const info = el('div', 'inventory-item-info');
    info.appendChild(el('span', 'inventory-item-name', talismanInfo.name));
    row.appendChild(info);

    const countEl = el('span', 'inventory-item-count', `x${count}`);
    row.appendChild(countEl);

    talismanSection.appendChild(row);
  }

  if (!hasTalismans) {
    talismanSection.appendChild(el('div', 'inventory-empty', 'No talismans yet.'));
  }
  container.appendChild(talismanSection);

  // ── Tomes ──
  const tomeSection = el('div', 'inventory-section');
  tomeSection.appendChild(el('h3', 'inventory-section-title', 'Tomes'));

  let hasTomes = false;
  for (const [tomeId, tomeInfo] of Object.entries(TOME_PRICES)) {
    if (!hasTome(tomeId)) continue;
    hasTomes = true;

    const row = el('div', 'inventory-item');
    const icon = el('span', 'inventory-item-icon', '📖');
    row.appendChild(icon);

    const info = el('div', 'inventory-item-info');
    info.appendChild(el('span', 'inventory-item-name', tomeInfo.name));
    row.appendChild(info);

    tomeSection.appendChild(row);
  }

  if (!hasTomes) {
    tomeSection.appendChild(el('div', 'inventory-empty', 'No tomes yet. Purchase from the Arcana Shop.'));
  }
  container.appendChild(tomeSection);

  inventoryPanel.appendChild(container);
}

function showHotbarAssignPicker(itemId, itemName) {
  const overlay = el('div', 'hotbar-picker-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const panel = el('div', 'hotbar-picker-panel');
  panel.appendChild(el('div', 'hotbar-picker-title', `Assign ${itemName} to slot:`));

  const hotbar = getHotbar();
  for (let i = 0; i < hotbar.length; i++) {
    const row = el('div', 'hotbar-picker-item');

    const label = el('span', 'picker-item-name');
    const current = hotbar[i];
    if (current && current.id) {
      const currentName = current.type === 'item'
        ? (POTION_PRICES[current.id]?.name || current.id)
        : (current.id);
      label.textContent = `Slot ${i + 1} (${currentName})`;
    } else {
      label.textContent = `Slot ${i + 1} (empty)`;
    }
    row.appendChild(label);

    row.addEventListener('click', () => {
      setHotbarSlot(i, { type: 'item', id: itemId });
      overlay.remove();
      window.dispatchEvent(new CustomEvent('hotbar-changed'));
    });

    panel.appendChild(row);
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}
