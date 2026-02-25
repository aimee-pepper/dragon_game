// Dragon card UI component
import { GENE_DEFS, TRIANGLE_DEFS, DARK_ENERGY_PHENOTYPE } from './gene-config.js';
import { renderDragonSprite as renderLegacySprite } from './ui-dragon-sprite.js';
import { renderDragon, startShimmerAnimation } from './sprite-renderer.js';
import { QUEST_SPARKLE_EFFECT, SPRITE_WIDTH, SPRITE_HEIGHT } from './sprite-config.js';
import { getSetting } from './settings.js';

export const UI_ASSET_PATH = 'assets/ui/ui-assets/';

// Create a DOM element helper
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Create a tinted UI asset: uses CSS mask so the image shape is filled with the given color
export function tintedIcon(assetFile, color, className) {
  const d = el('span', className || 'ui-icon');
  d.style.display = 'inline-block';
  d.style.backgroundColor = color;
  d.style.webkitMaskImage = `url('${UI_ASSET_PATH}${assetFile}')`;
  d.style.maskImage = `url('${UI_ASSET_PATH}${assetFile}')`;
  d.style.webkitMaskSize = 'contain';
  d.style.maskSize = 'contain';
  d.style.webkitMaskRepeat = 'no-repeat';
  d.style.maskRepeat = 'no-repeat';
  d.style.webkitMaskPosition = 'center';
  d.style.maskPosition = 'center';
  return d;
}

// Create a UI asset image element (no tint — used for pre-colored assets)
export function uiImg(assetFile, className) {
  const img = document.createElement('img');
  img.src = `${UI_ASSET_PATH}${assetFile}`;
  img.className = className || 'ui-img';
  img.draggable = false;
  return img;
}

// Render a dragon as a card DOM element
// Options: { compact, showGenotype, onUseAsParentA, onUseAsParentB, parentNames, onSaveToStables, onViewLineage, highlightGenes, desiredAlleles, hideSprite }
// parentNames: { A: 'DragonName', B: 'DragonName' } — used for color-coding allele origins
// onViewLineage: (dragon) => {} — callback to open family tree popup
// highlightGenes: Set<string> — gene names to highlight for quest tracking
// desiredAlleles: Map<geneName, Set<alleleLabel>> — specific allele labels to bold
// hideSprite: boolean — skip sprite rendering (used when sprite already shown above)
export function renderDragonCard(dragon, options = {}) {
  const { compact = false, showGenotype = true, onUseAsParentA, onUseAsParentB, parentNames, onSaveToStables, onViewLineage, highlightGenes, desiredAlleles, hideSprite } = options;
  const p = dragon.phenotype;
  const debugRevealAll = getSetting('debug-show-genotype');
  const dragonReveals = dragon.revealedGenes || {};

  // Per-gene reveal check: returns true if the gene's value should be shown
  // Debug toggle overrides everything; otherwise check per-dragon reveals
  function isRevealed(geneName) {
    if (debugRevealAll) return true;
    return !!dragonReveals[geneName];
  }

  // Check if ALL genes in a list are revealed (for tri-point breakdowns)
  function allRevealed(geneNames) {
    if (debugRevealAll) return true;
    return geneNames.every(g => !!dragonReveals[g]);
  }

  // Backward compat alias — used where code previously checked the global toggle
  const genotypeRevealed = debugRevealAll;

  const card = el('div', `dragon-card${compact ? ' compact' : ''}`);

  // --- Header: banner name + info ---
  if (!compact) {
    const header = el('div', 'card-header');

    // Banner wraps only the name portion
    const banner = el('div', 'card-banner');
    // Background layers: fill (light beige) + outline (darker gold)
    const bgFill = tintedIcon('banner_f.png', '#d4c4a0', 'banner-bg-fill');
    const bgOutline = tintedIcon('banner_o.png', '#a08450', 'banner-bg-outline');
    const bgTailFill = tintedIcon('bannertail_f.png', '#d4c4a0', 'banner-bg-tail-fill');
    const bgTailOutline = tintedIcon('bannertail_o.png', '#a08450', 'banner-bg-tail-outline');
    // Override tintedIcon's inline maskSize:'contain' so CSS rules can control sizing
    for (const piece of [bgTailFill, bgTailOutline]) {
      piece.style.maskSize = '';
      piece.style.webkitMaskSize = '';
    }
    banner.appendChild(bgFill);
    banner.appendChild(bgOutline);
    banner.appendChild(bgTailFill);
    banner.appendChild(bgTailOutline);
    // Foreground: name label + text
    const nameLabel = tintedIcon('t_name.png', '#7a6840', 'banner-name-label');
    const nameText = el('span', 'dragon-name-text', dragon.name);
    banner.appendChild(nameLabel);
    banner.appendChild(nameText);

    header.appendChild(banner);

    // Right side: ID, gen, sex (outside banner)
    const rightInfo = el('span', 'header-right');
    rightInfo.appendChild(el('span', 'dragon-id', `#${dragon.id}`));
    rightInfo.appendChild(el('span', 'dragon-gen', `Gen ${dragon.generation}`));
    rightInfo.appendChild(el('span', 'dragon-sex', dragon.sex === 'female' ? 'F' : 'M'));
    header.appendChild(rightInfo);

    card.appendChild(header);
  } else {
    // Compact: simple header (no banner assets)
    const header = el('div', 'card-header');
    const nameEl = el('span', 'dragon-name');
    const nameText = el('span', 'dragon-name-text', dragon.name);
    nameEl.appendChild(nameText);
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
  }

  // For compact: preserve the old .card-visual flex row (sprite + info side-by-side)
  const compactVisual = compact ? el('div', 'card-visual') : null;
  const spriteTarget = compactVisual || card;

  if (!hideSprite) {
    // Fixed-size sprite container — all dragons render in a standardized box
    const spriteBox = el('div', compact ? 'sprite-box compact' : 'sprite-box');

    // Show legacy pixel-art sprite immediately (no async delay)
    const legacySprite = renderLegacySprite(p, compact);
    spriteBox.appendChild(legacySprite);

    // Attempt async PNG-based render — if PNGs exist, swap in the canvas sprite
    // Skip if user prefers pixel art
    if (getSetting('art-style') !== 'pixel') {
      renderDragon(p, { compact, fallbackToTest: false }).then(canvas => {
        // Check if the PNG render produced actual content
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let hasPixels = false;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) { hasPixels = true; break; }
        }
        if (hasPixels) {
          // PNGs are available — replace legacy sprite with canvas sprite
          canvas.className = 'dragon-sprite-canvas';

          // Proportional sizing: preserve relative dragon size by scaling
          // the canvas display dimensions based on its crop vs the full
          // sprite canvas. A wingless dragon's cropped canvas is smaller,
          // so it displays smaller — keeping head sizes consistent.
          // Height scaled by 15/13 to compensate for the tighter 20/13
          // aspect-ratio box (vs the native 4/3 canvas ratio), so dragons
          // stay the same absolute size while the empty sky above is clipped.
          const wPct = (canvas.width / SPRITE_WIDTH) * 100;
          const hPct = (canvas.height / SPRITE_HEIGHT) * 100 * (15 / 13);
          canvas.style.width = wPct + '%';
          canvas.style.height = hPct + '%';

          legacySprite.replaceWith(canvas);

          // Quest sparkle: if this card fully matches the pinned quest, add sparkle animation
          if (card.classList.contains('quest-halo-5') && p.color?.rgb) {
            startShimmerAnimation(canvas, QUEST_SPARKLE_EFFECT, p.color.rgb);
          }
        }
        // Otherwise keep legacy sprite — no visual change
      });
    }

    spriteTarget.appendChild(spriteBox);
  }

  // Routing: compact puts visual-info in .card-visual, everything else on card
  const infoTarget = compactVisual || card;

  // --- Hue + Finish (2-column row on non-compact) ---
  if (!compact) {
    // Separator line between sprite and hue/finish
    card.appendChild(tintedIcon('line.png', 'var(--accent)', 'section-line'));

    const hueFinishRow = el('div', 'hue-finish-row');

    // Hue column
    const hueCol = el('div', 'hue-col');
    const hueLabel = tintedIcon('t_hue.png', 'var(--accent)', 'section-label-img hue-label');
    hueCol.appendChild(hueLabel);

    const colorLabel = p.color.specialtyName ||
      (p.color.modifierPrefix ? `${p.color.modifierPrefix} ${p.color.displayName}` : p.color.displayName);
    const colorNameEl = el('div', 'color-name');
    const colorDot = tintedIcon('dot.png', p.color.hex || '#888', 'color-dot');
    colorNameEl.appendChild(colorDot);
    colorNameEl.appendChild(el('span', null, colorLabel));
    if (p.color.specialtyName) {
      colorNameEl.appendChild(el('span', 'specialty-badge', p.color.specialtyCategory || ''));
    }
    hueCol.appendChild(colorNameEl);

    {
      const bd = p.color.cmyBreakdown;
      const cmyRow = el('div', 'cmy-breakdown');
      cmyRow.appendChild(el('span', 'cmy-c', `C: ${isRevealed('color_cyan') && bd ? bd.c : '???'}`));
      cmyRow.appendChild(document.createTextNode(' · '));
      cmyRow.appendChild(el('span', 'cmy-m', `M: ${isRevealed('color_magenta') && bd ? bd.m : '???'}`));
      cmyRow.appendChild(document.createTextNode(' · '));
      cmyRow.appendChild(el('span', 'cmy-y', `Y: ${isRevealed('color_yellow') && bd ? bd.y : '???'}`));
      hueCol.appendChild(cmyRow);
    }

    hueFinishRow.appendChild(hueCol);

    // Finish column (mirrors Hue column structure)
    const finishCol = el('div', 'finish-col');
    const finishLabel = tintedIcon('t_finish.png', 'var(--accent)', 'section-label-img finish-label');
    finishCol.appendChild(finishLabel);

    const finishNameEl = el('div', 'finish-name');
    const finishStar = tintedIcon('star.png', 'var(--accent)', 'finish-star');
    finishNameEl.appendChild(finishStar);
    finishNameEl.appendChild(el('span', null, p.finish.displayName || p.finish.name));
    finishCol.appendChild(finishNameEl);

    {
      const fb = p.finish.finishBreakdown;
      const finishRow = el('div', 'finish-breakdown');
      finishRow.appendChild(el('span', 'finish-o', `O: ${isRevealed('finish_opacity') && fb ? fb.o : '???'}`));
      finishRow.appendChild(document.createTextNode(' · '));
      finishRow.appendChild(el('span', 'finish-s', `Sh: ${isRevealed('finish_shine') && fb ? fb.sh : '???'}`));
      finishRow.appendChild(document.createTextNode(' · '));
      finishRow.appendChild(el('span', 'finish-sc', `Sc: ${isRevealed('finish_schiller') && fb ? fb.sc : '???'}`));
      finishCol.appendChild(finishRow);
    }

    hueFinishRow.appendChild(finishCol);
    card.appendChild(hueFinishRow);

    // Separator line between hue/finish and breath
    card.appendChild(tintedIcon('line.png', 'var(--accent)', 'section-line'));
  } else {
    // Compact: simple inline info
    const info = el('div', 'visual-info');
    const colorLabel = p.color.specialtyName ||
      (p.color.modifierPrefix ? `${p.color.modifierPrefix} ${p.color.displayName}` : p.color.displayName);
    const colorNameEl = el('div', 'color-name');
    colorNameEl.appendChild(el('span', null, colorLabel));
    if (p.color.specialtyName) {
      colorNameEl.appendChild(el('span', 'specialty-badge', p.color.specialtyCategory || ''));
    }
    info.appendChild(colorNameEl);
    const finishBadge = el('span', 'finish-badge', p.finish.displayName || p.finish.name);
    info.appendChild(finishBadge);
    infoTarget.appendChild(info);
  }

  // Append compact visual wrapper to card (if used)
  if (compactVisual) {
    card.appendChild(compactVisual);
  }

  // --- Breath element section ---
  const breathRow = el('div', 'breath-row');
  const elementColor = p.breathElement.isDarkEnergy
    ? DARK_ENERGY_PHENOTYPE.displayColor
    : (p.breathElement.displayColor || '#666');

  if (!compact) {
    // Element icon: fill (darker) + outline (lighter) layered
    const iconWrap = el('div', 'element-icon-wrap');
    const iconFill = tintedIcon('elementicon_f.png', elementColor, 'element-icon-fill');
    const iconOutline = tintedIcon('elementicon_o.png', elementColor, 'element-icon-outline');
    iconWrap.appendChild(iconFill);
    iconWrap.appendChild(iconOutline);
    breathRow.appendChild(iconWrap);
  } else {
    const breathDot = el('div', 'breath-dot');
    breathDot.style.backgroundColor = elementColor;
    breathRow.appendChild(breathDot);
  }

  const breathInfo = el('div', 'breath-info');
  const breathLabel = el('span', 'breath-label', p.breathElement.displayName || p.breathElement.name);
  breathInfo.appendChild(breathLabel);

  if (!compact) {
    {
      const shapeVal = p.traits.breath_shape?.name || '';
      const rangeVal = p.traits.breath_range?.name || '';
      const detail = el('span', 'breath-detail', ` \u2014 ${shapeVal}, ${rangeVal} range`);
      breathInfo.appendChild(detail);
    }

    {
      const bb = p.breathElement.breathBreakdown;
      const breakdownRow = el('div', 'breath-breakdown');
      breakdownRow.appendChild(el('span', 'breath-f', `F: ${isRevealed('breath_fire') && bb ? bb.f : '???'}`));
      breakdownRow.appendChild(document.createTextNode(' · '));
      breakdownRow.appendChild(el('span', 'breath-i', `I: ${isRevealed('breath_ice') && bb ? bb.i : '???'}`));
      breakdownRow.appendChild(document.createTextNode(' · '));
      breakdownRow.appendChild(el('span', 'breath-l', `L: ${isRevealed('breath_lightning') && bb ? bb.l : '???'}`));
      breathInfo.appendChild(breakdownRow);
    }

    // Prose description — only if all breath axes are revealed
    if (allRevealed(['breath_fire', 'breath_ice', 'breath_lightning']) && p.breathElement.desc) {
      const descEl = el('div', 'breath-desc', p.breathElement.desc);
      breathInfo.appendChild(descEl);
    }
  }

  breathRow.appendChild(breathInfo);
  infoTarget.appendChild(breathRow);

  if (!compact) {
    // Separator line between breath and traits
    card.appendChild(tintedIcon('line.png', 'var(--accent)', 'section-line'));

    // Traits label asset
    const traitsLabel = tintedIcon('t_traits.png', 'var(--accent)', 'section-label-img');
    card.appendChild(traitsLabel);

    // --- Body traits ---
    const bodySection = renderTraitSection('Body', [
      { label: 'Size', value: p.traits.body_size?.name || '???' },
      { label: 'Type', value: p.traits.body_type?.name || '???' },
      { label: 'Scales', value: p.traits.body_scales?.name || '???' },
    ]);
    card.appendChild(bodySection);

    // --- Frame traits ---
    const frameSection = renderTraitSection('Frame', [
      { label: 'Wings', value: p.traits.frame_wings?.name || '???' },
      { label: 'Limbs', value: p.traits.frame_limbs?.name || '???' },
      { label: 'Bones', value: p.traits.frame_bones?.name || '???' },
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
        const result = onSaveToStables(dragon);
        if (result === false) {
          // Nests full — show temporary feedback
          saveBtn.textContent = 'Nests full!';
          saveBtn.classList.add('btn-nests-full');
          setTimeout(() => {
            saveBtn.textContent = '★ Stable';
            saveBtn.classList.remove('btn-nests-full');
          }, 1500);
          return;
        }
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
    card.appendChild(renderGenotypeSection(dragon, parentNames, highlightGenes, desiredAlleles));
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

function formatSpinesHidden(traits) {
  const style = traits.spine_style?.name || 'None';
  if (style === 'None') return 'None';
  return `${style}, ???`;
}

function formatTail(traits) {
  const shape = traits.tail_shape?.name || 'Normal';
  const length = traits.tail_length?.name || 'Medium';
  return `${shape}, ${length}`;
}

// ── Showcase card — condensed single-screen view for screenshots ────────
export function renderShowcaseCard(dragon) {
  const p = dragon.phenotype;

  const card = el('div', 'showcase-card');

  // --- Header: name + sex + gen + ID ---
  const header = el('div', 'showcase-header');
  const banner = el('div', 'card-banner');
  const bgFill = tintedIcon('banner_f.png', '#d4c4a0', 'banner-bg-fill');
  const bgOutline = tintedIcon('banner_o.png', '#a08450', 'banner-bg-outline');
  const bgTailFill = tintedIcon('bannertail_f.png', '#d4c4a0', 'banner-bg-tail-fill');
  const bgTailOutline = tintedIcon('bannertail_o.png', '#a08450', 'banner-bg-tail-outline');
  for (const piece of [bgTailFill, bgTailOutline]) {
    piece.style.maskSize = '';
    piece.style.webkitMaskSize = '';
  }
  banner.appendChild(bgFill);
  banner.appendChild(bgOutline);
  banner.appendChild(bgTailFill);
  banner.appendChild(bgTailOutline);
  const nameLabel = tintedIcon('t_name.png', '#7a6840', 'banner-name-label');
  const nameText = el('span', 'dragon-name-text', dragon.name);
  banner.appendChild(nameLabel);
  banner.appendChild(nameText);
  header.appendChild(banner);

  const rightInfo = el('span', 'header-right');
  rightInfo.appendChild(el('span', 'dragon-id', `#${dragon.id}`));
  rightInfo.appendChild(el('span', 'dragon-gen', `Gen ${dragon.generation}`));
  rightInfo.appendChild(el('span', 'dragon-sex', dragon.sex === 'female' ? 'F' : 'M'));
  header.appendChild(rightInfo);
  card.appendChild(header);

  // --- Sprite ---
  const spriteBox = el('div', 'sprite-box');
  const legacySprite = renderLegacySprite(p, false);
  spriteBox.appendChild(legacySprite);

  if (getSetting('art-style') !== 'pixel') {
    renderDragon(p, { compact: false, fallbackToTest: false }).then(canvas => {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasPixels = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) { hasPixels = true; break; }
      }
      if (hasPixels) {
        canvas.className = 'dragon-sprite-canvas';
        const wPct = (canvas.width / SPRITE_WIDTH) * 100;
        const hPct = (canvas.height / SPRITE_HEIGHT) * 100 * (15 / 13);
        canvas.style.width = wPct + '%';
        canvas.style.height = hPct + '%';
        legacySprite.replaceWith(canvas);
      }
    });
  }

  card.appendChild(spriteBox);

  // --- Color + Finish (single row) ---
  card.appendChild(tintedIcon('line.png', 'var(--accent)', 'section-line'));

  const colorFinishRow = el('div', 'showcase-color-row');
  const colorLabel = p.color.specialtyName ||
    (p.color.modifierPrefix ? `${p.color.modifierPrefix} ${p.color.displayName}` : p.color.displayName);
  const colorPart = el('span', 'showcase-color');
  colorPart.appendChild(tintedIcon('dot.png', p.color.hex || '#888', 'color-dot'));
  colorPart.appendChild(el('span', null, ` ${colorLabel}`));
  if (p.color.specialtyName) {
    colorPart.appendChild(el('span', 'specialty-badge', p.color.specialtyCategory || ''));
  }
  colorFinishRow.appendChild(colorPart);

  const divider = el('span', 'showcase-divider', '|');
  colorFinishRow.appendChild(divider);

  const finishPart = el('span', 'showcase-finish');
  finishPart.appendChild(tintedIcon('star.png', 'var(--accent)', 'finish-star'));
  finishPart.appendChild(el('span', null, ` ${p.finish.displayName || p.finish.name}`));
  colorFinishRow.appendChild(finishPart);

  card.appendChild(colorFinishRow);

  // --- Breath (inline) ---
  card.appendChild(tintedIcon('line.png', 'var(--accent)', 'section-line'));

  const breathRow = el('div', 'showcase-breath-row');
  const elementColor = p.breathElement.isDarkEnergy
    ? DARK_ENERGY_PHENOTYPE.displayColor
    : (p.breathElement.displayColor || '#666');

  const iconWrap = el('div', 'element-icon-wrap showcase-element-icon');
  iconWrap.appendChild(tintedIcon('elementicon_f.png', elementColor, 'element-icon-fill'));
  iconWrap.appendChild(tintedIcon('elementicon_o.png', elementColor, 'element-icon-outline'));
  breathRow.appendChild(iconWrap);

  const breathInfo = el('span', 'showcase-breath-info');
  breathInfo.appendChild(el('span', 'breath-label', p.breathElement.displayName || p.breathElement.name));
  const shapeVal = p.traits.breath_shape?.name || '';
  const rangeVal = p.traits.breath_range?.name || '';
  breathInfo.appendChild(el('span', 'breath-detail', ` \u2014 ${shapeVal}, ${rangeVal} range`));
  breathRow.appendChild(breathInfo);

  card.appendChild(breathRow);

  // --- Traits (compact chips) ---
  card.appendChild(tintedIcon('line.png', 'var(--accent)', 'section-line'));
  card.appendChild(tintedIcon('t_traits.png', 'var(--accent)', 'section-label-img'));

  const traitsWrap = el('div', 'showcase-traits');

  const bodyTraits = [
    { label: 'Size', value: p.traits.body_size?.name || '???' },
    { label: 'Type', value: p.traits.body_type?.name || '???' },
    { label: 'Scales', value: p.traits.body_scales?.name || '???' },
  ];
  const frameTraits = [
    { label: 'Wings', value: p.traits.frame_wings?.name || '???' },
    { label: 'Limbs', value: p.traits.frame_limbs?.name || '???' },
    { label: 'Bones', value: p.traits.frame_bones?.name || '???' },
  ];
  const featureTraits = [
    { label: 'Horns', value: formatHorns(p.traits) },
    { label: 'Spines', value: formatSpines(p.traits) },
    { label: 'Tail', value: formatTail(p.traits) },
  ];

  for (const t of [...bodyTraits, ...frameTraits, ...featureTraits]) {
    const chip = el('span', 'showcase-trait-chip');
    chip.appendChild(el('span', 'trait-label', t.label + ': '));
    chip.appendChild(document.createTextNode(t.value));
    traitsWrap.appendChild(chip);
  }

  card.appendChild(traitsWrap);

  return card;
}

export function renderGenotypeSection(dragon, parentNames, highlightGenes, desiredAlleles) {
  const wrapper = el('div', 'genotype-toggle');

  const toggleBtn = el('button', 'genotype-toggle-btn', 'Show Genotype');
  const content = buildGenotypeContent(dragon, parentNames, highlightGenes, desiredAlleles);

  toggleBtn.addEventListener('click', () => {
    const isOpen = content.classList.toggle('open');
    toggleBtn.textContent = isOpen ? 'Hide Genotype' : 'Show Genotype';
  });

  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(content);
  return wrapper;
}

// Build genotype content (shared by inline toggle and overlay modes)
function buildGenotypeContent(dragon, parentNames, highlightGenes, desiredAlleles) {
  const content = el('div', 'genotype-content');
  const debugRevealAll = getSetting('debug-show-genotype');
  const dragonReveals = dragon.revealedGenes || {};

  function isGeneRevealed(geneName) {
    if (debugRevealAll) return true;
    return !!dragonReveals[geneName]; // 'peek' or 'full'
  }

  /** Returns 'peek', 'full', or null */
  function getRevealLevel(geneName) {
    if (debugRevealAll) return 'full';
    return dragonReveals[geneName] || null;
  }

  // If this dragon has allele origins and parent names, show the legend
  const hasOrigins = dragon.alleleOrigins && parentNames;
  const hasAnyRevealed = debugRevealAll || Object.values(dragonReveals).some(v => v === 'full' || v === 'peek');
  if (hasOrigins && hasAnyRevealed) {
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

  // Wrap groups in a columns container for 2-column layout on desktop
  const columnsWrap = el('div', 'genotype-columns');

  for (const group of geneGroups) {
    const groupEl = el('div', 'genotype-group');
    const groupLabel = el('div', 'genotype-group-label', group.label);
    // Make group labels clickable to collapse/expand
    groupLabel.addEventListener('click', () => {
      groupEl.classList.toggle('collapsed');
    });
    groupEl.appendChild(groupLabel);

  for (const geneName of group.genes) {
    const alleles = dragon.genotype[geneName];
    if (!alleles) continue;
    const def = GENE_DEFS[geneName];
    const label = def?.label || geneName;

    // Categorical genes (horn_style, horn_direction, spine_style) are always visible
    const isCategorical = def?.inheritanceType === 'categorical';
    const geneVisible = isGeneRevealed(geneName) || isCategorical;

    const row = el('div', 'genotype-row');
    const isMutated = dragon.mutations.includes(geneName);
    if (isMutated) row.classList.add('mutated');
    // Tint CMY gene rows
    if (geneName === 'color_cyan') row.classList.add('genotype-cmy-c');
    else if (geneName === 'color_magenta') row.classList.add('genotype-cmy-m');
    else if (geneName === 'color_yellow') row.classList.add('genotype-cmy-y');

    // Quest genotype highlighting (only when genotype is revealed)
    if (geneVisible && highlightGenes && highlightGenes.has(geneName) && getSetting('quest-genotype-highlight')) {
      row.classList.add('genotype-quest-highlight');
    }

    // Resolve the trait name for display
    let resolvedText = '???';
    if (geneVisible) {
      if (def?.phenotypeMap) {
        const resolved = isCategorical
          ? Math.max(alleles[0], alleles[1])
          : Math.round((alleles[0] + alleles[1]) / 2);
        resolvedText = def.phenotypeMap[resolved] || String(resolved);
      } else if (triangleAxes.has(geneName)) {
        const avg = ((alleles[0] + alleles[1]) / 2).toFixed(1);
        resolvedText = `avg ${avg}`;
      }
    }

    // Gene label + resolved trait name: "Body Size: Large" or "Body Size: ???"
    const geneEl = el('span', 'genotype-gene');
    geneEl.appendChild(document.createTextNode(label + ': '));
    const traitEl = el('span', 'genotype-trait-name', resolvedText);
    geneEl.appendChild(traitEl);

    if (isMutated) {
      const badge = el('span', 'mutation-badge', 'MUT');
      geneEl.appendChild(badge);
    }

    // Alleles display
    const allelesEl = el('span', 'genotype-alleles');

    if (!geneVisible) {
      // Hidden — show ??? for alleles
      allelesEl.textContent = '(???, ???)';
    } else {
      // Resolve individual allele labels for display
      const TRIANGLE_ALLELE_NAMES = { 0: 'None', 1: 'Low', 2: 'Mid', 3: 'High' };
      function getAlleleLabel(val) {
        if (def?.phenotypeMap) {
          return def.phenotypeMap[val] || String(val);
        } else if (triangleAxes.has(geneName)) {
          return TRIANGLE_ALLELE_NAMES[val] || String(val);
        }
        return String(val);
      }

      // Check if this gene has desired allele targets from the quest
      const desiredSet = desiredAlleles && desiredAlleles.get(geneName);
      const highlightEnabled = desiredSet && getSetting('quest-genotype-highlight');

      // Peek reveal: show the higher allele (the extreme one) and ??? for the other
      const revealLevel = getRevealLevel(geneName);
      const isPeek = revealLevel === 'peek';

      if (isPeek) {
        // For peek, reveal the extreme allele (max of the two) and hide the other
        const maxVal = Math.max(alleles[0], alleles[1]);
        const maxLabel = getAlleleLabel(maxVal);
        allelesEl.textContent = `(${maxLabel}, ???)`;
      } else if (hasOrigins) {
        // Color-coded alleles: each allele colored by which parent it came from
        const origins = dragon.alleleOrigins[geneName];
        allelesEl.textContent = '(';

        const labelA = getAlleleLabel(alleles[0]);
        const alleleA = el('span', origins[0] === 'A' ? 'allele-from-a' : 'allele-from-b');
        alleleA.textContent = labelA;
        if (highlightEnabled && desiredSet.has(labelA)) alleleA.classList.add('allele-quest-match');
        allelesEl.appendChild(alleleA);

        allelesEl.appendChild(document.createTextNode(', '));

        const labelB = getAlleleLabel(alleles[1]);
        const alleleB = el('span', origins[1] === 'A' ? 'allele-from-a' : 'allele-from-b');
        alleleB.textContent = labelB;
        if (highlightEnabled && desiredSet.has(labelB)) alleleB.classList.add('allele-quest-match');
        allelesEl.appendChild(alleleB);

        allelesEl.appendChild(document.createTextNode(')'));
      } else {
        const labelA = getAlleleLabel(alleles[0]);
        const labelB = getAlleleLabel(alleles[1]);
        if (highlightEnabled && (desiredSet.has(labelA) || desiredSet.has(labelB))) {
          allelesEl.textContent = '(';
          const spanA = el('span', desiredSet.has(labelA) ? 'allele-quest-match' : '', labelA);
          allelesEl.appendChild(spanA);
          allelesEl.appendChild(document.createTextNode(', '));
          const spanB = el('span', desiredSet.has(labelB) ? 'allele-quest-match' : '', labelB);
          allelesEl.appendChild(spanB);
          allelesEl.appendChild(document.createTextNode(')'));
        } else {
          allelesEl.textContent = `(${labelA}, ${labelB})`;
        }
      }
    }

    row.appendChild(geneEl);
    row.appendChild(allelesEl);

    groupEl.appendChild(row);
  } // end gene loop

    columnsWrap.appendChild(groupEl);
  } // end group loop

  content.appendChild(columnsWrap);
  return content;
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
