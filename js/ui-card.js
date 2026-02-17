// Dragon card UI component
import { GENE_DEFS, TRIANGLE_DEFS, DARK_ENERGY_PHENOTYPE } from './gene-config.js';
import { renderDragonSprite } from './ui-dragon-sprite.js';
import { getSetting } from './settings.js';

// Create a DOM element helper
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Render a dragon as a card DOM element
// Options: { compact, showGenotype, onUseAsParentA, onUseAsParentB, parentNames, onSaveToStables, onViewLineage, highlightGenes }
// parentNames: { A: 'DragonName', B: 'DragonName' } — used for color-coding allele origins
// onViewLineage: (dragon) => {} — callback to open family tree popup
// highlightGenes: Set<string> — gene names to highlight for quest tracking
export function renderDragonCard(dragon, options = {}) {
  const { compact = false, showGenotype = true, onUseAsParentA, onUseAsParentB, parentNames, onSaveToStables, onViewLineage, highlightGenes } = options;
  const p = dragon.phenotype;

  const card = el('div', `dragon-card${compact ? ' compact' : ''}`);

  // --- Header: name, sex, ID ---
  const header = el('div', 'card-header');
  const nameEl = el('span', 'dragon-name', dragon.name);
  const sexEl = el('span', 'dragon-sex', dragon.sex === 'female' ? 'F' : 'M');
  const idEl = el('span', 'dragon-id', `#${dragon.id}`);
  header.appendChild(nameEl);
  const rightHeader = el('span');
  rightHeader.style.display = 'flex';
  rightHeader.style.alignItems = 'center';
  rightHeader.style.gap = '8px';
  rightHeader.appendChild(idEl);
  const genBadge = el('span', 'dragon-gen', `Gen ${dragon.generation}`);
  rightHeader.appendChild(genBadge);
  rightHeader.appendChild(sexEl);
  header.appendChild(rightHeader);
  card.appendChild(header);

  // --- Dragon sprite + color/finish info ---
  const visual = el('div', 'card-visual');

  const sprite = renderDragonSprite(p, compact);
  visual.appendChild(sprite);

  const info = el('div', 'visual-info');

  // Specialty combo overrides color display name
  const colorLabel = p.color.specialtyName ||
    (p.color.modifierPrefix ? `${p.color.modifierPrefix} ${p.color.displayName}` : p.color.displayName);
  const colorNameEl = el('div', 'color-name', colorLabel);
  if (p.color.specialtyName) {
    const catBadge = el('span', 'specialty-badge', p.color.specialtyCategory || '');
    colorNameEl.appendChild(catBadge);
  }
  info.appendChild(colorNameEl);

  // CMY blend breakdown: "C: High · M: None · Y: Mid"
  if (p.color.cmyBreakdown && !compact) {
    const cmyRow = el('div', 'cmy-breakdown');
    const { c, m, y } = p.color.cmyBreakdown;
    const cSpan = el('span', 'cmy-c', `C: ${c}`);
    const mSpan = el('span', 'cmy-m', `M: ${m}`);
    const ySpan = el('span', 'cmy-y', `Y: ${y}`);
    cmyRow.appendChild(cSpan);
    cmyRow.appendChild(document.createTextNode(' · '));
    cmyRow.appendChild(mSpan);
    cmyRow.appendChild(document.createTextNode(' · '));
    cmyRow.appendChild(ySpan);
    info.appendChild(cmyRow);
  }

  const finishBadge = el('span', 'finish-badge', p.finish.displayName || p.finish.name);
  info.appendChild(finishBadge);

  // Finish axis breakdown: "O: High · Sh: None · Sc: Mid"
  if (p.finish.finishBreakdown && !compact) {
    const finishRow = el('div', 'finish-breakdown');
    const { o, sh, sc } = p.finish.finishBreakdown;
    finishRow.appendChild(el('span', 'finish-o', `O: ${o}`));
    finishRow.appendChild(document.createTextNode(' · '));
    finishRow.appendChild(el('span', 'finish-s', `Sh: ${sh}`));
    finishRow.appendChild(document.createTextNode(' · '));
    finishRow.appendChild(el('span', 'finish-sc', `Sc: ${sc}`));
    info.appendChild(finishRow);
  }

  visual.appendChild(info);
  card.appendChild(visual);

  // --- Breath element row ---
  const breathRow = el('div', 'breath-row');
  const breathDot = el('div', 'breath-dot');
  breathDot.style.backgroundColor = p.breathElement.isDarkEnergy
    ? DARK_ENERGY_PHENOTYPE.displayColor
    : (p.breathElement.displayColor || '#666');
  breathRow.appendChild(breathDot);

  const breathInfo = el('div');
  const breathLabel = el('span', 'breath-label', p.breathElement.displayName || p.breathElement.name);
  breathInfo.appendChild(breathLabel);

  if (!compact) {
    const shapeVal = p.traits.breath_shape?.name || '';
    const rangeVal = p.traits.breath_range?.name || '';
    const detail = el('span', 'breath-detail', ` \u2014 ${shapeVal}, ${rangeVal} range`);
    breathInfo.appendChild(detail);

    // Breath axis breakdown: "F: High · I: None · L: Low"
    if (p.breathElement.breathBreakdown) {
      const breakdownRow = el('div', 'breath-breakdown');
      const { f, i, l } = p.breathElement.breathBreakdown;
      breakdownRow.appendChild(el('span', 'breath-f', `F: ${f}`));
      breakdownRow.appendChild(document.createTextNode(' · '));
      breakdownRow.appendChild(el('span', 'breath-i', `I: ${i}`));
      breakdownRow.appendChild(document.createTextNode(' · '));
      breakdownRow.appendChild(el('span', 'breath-l', `L: ${l}`));
      breathInfo.appendChild(breakdownRow);
    }

    // Prose description
    if (p.breathElement.desc) {
      const descEl = el('div', 'breath-desc', p.breathElement.desc);
      breathInfo.appendChild(descEl);
    }
  }

  breathRow.appendChild(breathInfo);
  card.appendChild(breathRow);

  if (!compact) {
    // --- Body traits ---
    const bodySection = renderTraitSection('Body', [
      { label: 'Size', value: p.traits.body_size?.name },
      { label: 'Type', value: p.traits.body_type?.name },
      { label: 'Scales', value: p.traits.body_scales?.name },
    ]);
    card.appendChild(bodySection);

    // --- Frame traits ---
    const frameSection = renderTraitSection('Frame', [
      { label: 'Wings', value: p.traits.frame_wings?.name },
      { label: 'Limbs', value: p.traits.frame_limbs?.name },
      { label: 'Bones', value: p.traits.frame_bones?.name },
    ]);
    card.appendChild(frameSection);

    // --- Sub traits ---
    const subSection = renderTraitSection('Features', [
      { label: 'Horns', value: formatHorns(p.traits) },
      { label: 'Spines', value: formatSpines(p.traits) },
      { label: 'Tail', value: formatTail(p.traits) },
    ]);
    card.appendChild(subSection);
  }

  // --- Action buttons (breed offspring + save to stables) ---
  if (onUseAsParentA || onUseAsParentB || onSaveToStables) {
    const actions = el('div', 'offspring-actions');
    if (onSaveToStables) {
      const saveBtn = el('button', 'btn btn-stable btn-small', '★ Stable');
      saveBtn.addEventListener('click', () => {
        onSaveToStables(dragon);
        saveBtn.textContent = '✓ Stabled';
        saveBtn.disabled = true;
        saveBtn.classList.add('btn-stabled');
      });
      actions.appendChild(saveBtn);
    }
    if (onUseAsParentA) {
      const btnA = el('button', 'btn btn-secondary btn-small', 'Set Parent A');
      btnA.addEventListener('click', () => {
        onUseAsParentA(dragon);
        btnA.textContent = '✓ Parent A';
        btnA.classList.add('btn-parent-set');
      });
      actions.appendChild(btnA);
    }
    if (onUseAsParentB) {
      const btnB = el('button', 'btn btn-secondary btn-small', 'Set Parent B');
      btnB.addEventListener('click', () => {
        onUseAsParentB(dragon);
        btnB.textContent = '✓ Parent B';
        btnB.classList.add('btn-parent-set');
      });
      actions.appendChild(btnB);
    }
    card.appendChild(actions);
  }

  // --- Genotype toggle ---
  if (showGenotype && !compact) {
    card.appendChild(renderGenotypeSection(dragon, parentNames, highlightGenes));
  }

  // --- View Lineage button ---
  if (onViewLineage) {
    const lineageBtn = el('button', 'btn btn-lineage btn-small', '🌿 View Lineage');
    lineageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onViewLineage(dragon);
    });
    card.appendChild(lineageBtn);
  }

  return card;
}

function renderTraitSection(label, traits) {
  const section = el('div', 'trait-section');
  section.appendChild(el('div', 'trait-section-label', label));
  const row = el('div', 'trait-row');
  for (const t of traits) {
    const tag = el('span', 'trait-tag');
    const lbl = el('span', 'trait-label', t.label + ': ');
    tag.appendChild(lbl);
    tag.appendChild(document.createTextNode(t.value));
    row.appendChild(tag);
  }
  section.appendChild(row);
  return section;
}

function formatHorns(traits) {
  const style = traits.horn_style?.name || 'None';
  if (style === 'None') return 'None';
  const dir = traits.horn_direction?.name || '';
  return `${style}, ${dir}`;
}

function formatSpines(traits) {
  const style = traits.spine_style?.name || 'None';
  if (style === 'None') return 'None';
  const height = traits.spine_height?.name || '';
  return `${style}, ${height}`;
}

function formatTail(traits) {
  const shape = traits.tail_shape?.name || 'Normal';
  const length = traits.tail_length?.name || 'Medium';
  return `${shape}, ${length}`;
}

function renderGenotypeSection(dragon, parentNames, highlightGenes) {
  const wrapper = el('div', 'genotype-toggle');

  const toggleBtn = el('button', 'genotype-toggle-btn', 'Show Genotype');
  const content = el('div', 'genotype-content');

  toggleBtn.addEventListener('click', () => {
    const isOpen = content.classList.toggle('open');
    toggleBtn.textContent = isOpen ? 'Hide Genotype' : 'Show Genotype';
  });

  // If this dragon has allele origins and parent names, show the legend
  const hasOrigins = dragon.alleleOrigins && parentNames;
  if (hasOrigins) {
    const legend = el('div', 'genotype-legend');
    const legendA = el('span', 'legend-parent-a', `● ${parentNames.A || 'Parent A'}`);
    const legendB = el('span', 'legend-parent-b', `● ${parentNames.B || 'Parent B'}`);
    legend.appendChild(legendA);
    legend.appendChild(legendB);
    content.appendChild(legend);
  }

  // Get list of triangle axis gene names for labeling
  const triangleAxes = new Set();
  for (const td of Object.values(TRIANGLE_DEFS)) {
    for (const axis of td.axes) triangleAxes.add(axis);
  }

  // Define canonical gene ordering with groups for visual separation
  const geneGroups = [
    { label: 'Body', genes: ['body_size', 'body_type', 'body_scales'] },
    { label: 'Frame', genes: ['frame_wings', 'frame_limbs', 'frame_bones'] },
    { label: 'Breath', genes: ['breath_shape', 'breath_range'] },
    { label: 'Color', genes: ['color_cyan', 'color_magenta', 'color_yellow'] },
    { label: 'Finish', genes: ['finish_opacity', 'finish_shine', 'finish_schiller'] },
    { label: 'Element', genes: ['breath_fire', 'breath_ice', 'breath_lightning'] },
    { label: 'Horns', genes: ['horn_style', 'horn_direction'] },
    { label: 'Spines', genes: ['spine_style', 'spine_height'] },
    { label: 'Tail', genes: ['tail_shape', 'tail_length'] },
  ];

  for (const group of geneGroups) {
    const groupEl = el('div', 'genotype-group');
    const groupLabel = el('div', 'genotype-group-label', group.label);
    groupEl.appendChild(groupLabel);

  for (const geneName of group.genes) {
    const alleles = dragon.genotype[geneName];
    if (!alleles) continue;
    const row = el('div', 'genotype-row');
    const isMutated = dragon.mutations.includes(geneName);
    if (isMutated) row.classList.add('mutated');
    // Tint CMY gene rows
    if (geneName === 'color_cyan') row.classList.add('genotype-cmy-c');
    else if (geneName === 'color_magenta') row.classList.add('genotype-cmy-m');
    else if (geneName === 'color_yellow') row.classList.add('genotype-cmy-y');

    // Quest genotype highlighting
    if (highlightGenes && highlightGenes.has(geneName) && getSetting('quest-genotype-highlight')) {
      row.classList.add('genotype-quest-highlight');
    }

    const def = GENE_DEFS[geneName];
    const label = def?.label || geneName;

    // Resolve the trait name for display
    let resolvedText = '';
    if (def?.phenotypeMap) {
      const resolved = def.inheritanceType === 'categorical'
        ? Math.max(alleles[0], alleles[1])
        : Math.round((alleles[0] + alleles[1]) / 2);
      resolvedText = def.phenotypeMap[resolved] || String(resolved);
    } else if (triangleAxes.has(geneName)) {
      const avg = ((alleles[0] + alleles[1]) / 2).toFixed(1);
      resolvedText = `avg ${avg}`;
    }

    // Gene label + resolved trait name: "Body Size: Large"
    const geneEl = el('span', 'genotype-gene');
    geneEl.appendChild(document.createTextNode(label + ': '));
    const traitEl = el('span', 'genotype-trait-name', resolvedText);
    geneEl.appendChild(traitEl);

    if (isMutated) {
      const badge = el('span', 'mutation-badge', 'MUT');
      geneEl.appendChild(badge);
    }

    // Resolve individual allele labels for display
    // For genes with phenotypeMaps: show the trait name each allele codes for
    // For triangle axes: show level names (None/Low/Mid/High)
    const TRIANGLE_ALLELE_NAMES = { 0: 'None', 1: 'Low', 2: 'Mid', 3: 'High' };
    function getAlleleLabel(val) {
      if (def?.phenotypeMap) {
        return def.phenotypeMap[val] || String(val);
      } else if (triangleAxes.has(geneName)) {
        return TRIANGLE_ALLELE_NAMES[val] || String(val);
      }
      return String(val);
    }

    // Alleles with labels: "(Knobbed, None)"
    const allelesEl = el('span', 'genotype-alleles');

    if (hasOrigins) {
      // Color-coded alleles: each allele colored by which parent it came from
      const origins = dragon.alleleOrigins[geneName];
      allelesEl.textContent = '(';

      const alleleA = el('span', origins[0] === 'A' ? 'allele-from-a' : 'allele-from-b');
      alleleA.textContent = getAlleleLabel(alleles[0]);
      allelesEl.appendChild(alleleA);

      allelesEl.appendChild(document.createTextNode(', '));

      const alleleB = el('span', origins[1] === 'A' ? 'allele-from-a' : 'allele-from-b');
      alleleB.textContent = getAlleleLabel(alleles[1]);
      allelesEl.appendChild(alleleB);

      allelesEl.appendChild(document.createTextNode(')'));
    } else {
      allelesEl.textContent = `(${getAlleleLabel(alleles[0])}, ${getAlleleLabel(alleles[1])})`;
    }

    row.appendChild(geneEl);
    row.appendChild(allelesEl);

    groupEl.appendChild(row);
  } // end gene loop

    content.appendChild(groupEl);
  } // end group loop

  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(content);
  return wrapper;
}

// Render a compact picker item for the dragon selection modal
export function renderPickerItem(dragon, onClick) {
  const item = el('div', 'picker-item');
  item.addEventListener('click', () => onClick(dragon));

  const swatch = el('div', 'picker-swatch');
  swatch.style.backgroundColor = dragon.phenotype.color.hex;
  item.appendChild(swatch);

  const info = el('div', 'picker-info');
  const nameRow = el('div', 'picker-name');
  nameRow.textContent = `${dragon.name} #${dragon.id}`;
  const genLabel = el('span', 'picker-gen', `Gen ${dragon.generation}`);
  nameRow.appendChild(genLabel);
  info.appendChild(nameRow);

  const p = dragon.phenotype;
  const pickerColor = p.color.specialtyName ||
    (p.color.modifierPrefix ? `${p.color.modifierPrefix} ${p.color.displayName}` : p.color.displayName);
  const summary = `${pickerColor} ${p.finish.displayName || p.finish.name} \u2014 ${p.breathElement.name} \u2014 ${p.traits.body_size?.name}`;
  const traits = el('div', 'picker-traits', summary);
  info.appendChild(traits);

  item.appendChild(info);

  const sexEl = el('span', 'dragon-sex', dragon.sex === 'female' ? 'F' : 'M');
  item.appendChild(sexEl);

  return item;
}
