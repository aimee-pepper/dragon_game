// Generate tab: random dragon generation
import { Dragon } from './dragon.js';
import { renderDragonCard } from './ui-card.js';
import { addToStables } from './ui-stables.js';
import { openFamilyTree } from './ui-family-tree.js';
import { setParentExternal } from './ui-breeder.js';

let dragonRegistry = null; // set by init

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initGenerateTab(container, registry) {
  dragonRegistry = registry;

  // Controls
  const controls = el('div', 'btn-group');

  const generateBtn = el('button', 'btn btn-primary', 'Capture Random Dragon');
  generateBtn.addEventListener('click', () => generateOne(list));
  controls.appendChild(generateBtn);

  container.appendChild(controls);

  const controls2 = el('div', 'btn-group');

  const generate5Btn = el('button', 'btn btn-secondary', 'Capture 5');
  generate5Btn.addEventListener('click', () => {
    for (let i = 0; i < 5; i++) generateOne(list);
  });
  controls2.appendChild(generate5Btn);

  const clearBtn = el('button', 'btn btn-secondary', 'Clear All');
  clearBtn.addEventListener('click', () => {
    list.innerHTML = '';
  });
  controls2.appendChild(clearBtn);

  container.appendChild(controls2);

  // Dragon list
  const list = el('div', 'dragon-list');
  container.appendChild(list);
}

function showParentSetToast(slot, dragon) {
  const existing = document.querySelector('.parent-set-toast');
  if (existing) existing.remove();
  const toast = el('div', 'parent-set-toast', `Parent ${slot} set: ${dragon.name}`);
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 1800);
}

function generateOne(listContainer) {
  const dragon = Dragon.createRandom();
  dragonRegistry.add(dragon);

  const card = renderDragonCard(dragon, {
    onSaveToStables: (d) => addToStables(d),
    onViewLineage: (d) => openFamilyTree(d, dragonRegistry),
    onUseAsParentA: (d) => { setParentExternal('A', d); showParentSetToast('A', d); },
    onUseAsParentB: (d) => { setParentExternal('B', d); showParentSetToast('B', d); },
  });
  // Insert at top of list
  listContainer.insertBefore(card, listContainer.firstChild);
}
