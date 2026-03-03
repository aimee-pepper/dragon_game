// ============================================================
// Map tab UI — illustrated world map with polygon zone overlays
// ============================================================
// All 39 zones (3 regions, 9 territories, 27 habitats) are visible
// simultaneously on the map. Locked zones are dimmed; unlocked zones
// are clickable. Clicking a zone opens an info/action panel below the map.

import { REGIONS, TERRITORIES, HABITATS, getRegionIds, getTerritoriesForRegion, getHabitatsForTerritory } from './map-config.js';
import {
  isRegionUnlocked, unlockRegion,
  isTerritoryUnlocked, isHabitatUnlocked,
  encounter, encounterAtRegion, encounterAtTerritory, debugEncounter,
  getHabitatVisits,
  getStabledTraitProgress, checkStabledUnlocks,
} from './map-engine.js';
import { renderDragonCard } from './ui-card.js';
import { addToStables, getStabledDragons, getDenDragons, onStablesChange } from './ui-stables.js';
import { setParentExternal } from './ui-breeder.js';
import { applyQuestHalo, onHighlightChange, getHighlightedQuest } from './quest-highlight.js';
import { getGenesForQuest, getDesiredAllelesForQuest } from './quest-gene-map.js';
import { incrementStat } from './save-manager.js';
import { getSetting, onSettingChange } from './settings.js';
import { deriveCombatStats } from './stat-config.js';
import { simulateCombat, getDistanceMeleeMod, getDistanceBreathMod, getMeleeHeightMod, getBreathHeightMod } from './combat-engine.js';
import { renderDragonSprite as renderLegacySprite } from './ui-dragon-sprite.js';
import { renderDragon } from './sprite-renderer.js';
import { SPRITE_WIDTH, SPRITE_HEIGHT } from './sprite-config.js';

// ── Module state ────────────────────────────────────────────

let dragonRegistry = null;
let mapContainer = null;

let polygonData = null;   // from zone-polygons.json
let zoneList = [];        // flat array of all 39 zones
let hoveredZoneId = null;
let selectedZoneId = null;
let mapCanvas = null;
let mapImage = null;
let isDebugView = false;
let isTouchDevice = false; // set on first touch event
let infoPanelEl = null;    // the popup overlay on the map

// Zone screen state
let currentZoneScreenId = null;    // active zone screen (null = showing map)
let currentEncounterDragons = [];  // the 3 wild dragons on the explore screen

// ── DOM helper ──────────────────────────────────────────────

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ── Zone list builder ───────────────────────────────────────

function buildZoneList(polyData) {
  const list = [];

  // Regions
  for (const regionId of getRegionIds()) {
    const region = REGIONS[regionId];
    list.push({
      id: regionId,
      tier: 'region',
      name: region.name,
      description: region.description,
      polygon: polyData[regionId] || [],
      parentRegionId: null,
      parentTerritoryId: null,
      unlocked: isRegionUnlocked(regionId),
    });
  }

  // Territories
  for (const regionId of getRegionIds()) {
    for (const territory of getTerritoriesForRegion(regionId)) {
      list.push({
        id: territory.id,
        tier: 'territory',
        name: territory.name,
        description: territory.description || '',
        polygon: polyData[territory.id] || [],
        parentRegionId: regionId,
        parentTerritoryId: null,
        unlocked: isTerritoryUnlocked(territory.id),
      });
    }
  }

  // Habitats
  for (const regionId of getRegionIds()) {
    for (const territory of getTerritoriesForRegion(regionId)) {
      for (const habitat of getHabitatsForTerritory(territory.id)) {
        list.push({
          id: habitat.id,
          tier: 'habitat',
          name: habitat.name,
          description: habitat.description || '',
          polygon: polyData[habitat.id] || [],
          parentRegionId: regionId,
          parentTerritoryId: territory.id,
          unlocked: isHabitatUnlocked(habitat.id),
        });
      }
    }
  }

  return list;
}

function refreshZoneUnlockStates() {
  for (const zone of zoneList) {
    if (zone.tier === 'region') zone.unlocked = isRegionUnlocked(zone.id);
    else if (zone.tier === 'territory') zone.unlocked = isTerritoryUnlocked(zone.id);
    else zone.unlocked = isHabitatUnlocked(zone.id);
  }
}

// ── Init ─────────────────────────────────────────────────────

export async function initMapTab(container, registry) {
  dragonRegistry = registry;
  mapContainer = container;

  // Load polygon data
  try {
    const resp = await fetch('data/zone-polygons.json');
    polygonData = await resp.json();
  } catch (e) {
    console.warn('Failed to load zone-polygons.json, using empty polygons:', e);
    polygonData = {};
  }

  // Build zone list
  zoneList = buildZoneList(polygonData);

  // Render
  renderMapView();

  // React to quest highlight changes — re-render zone screen if showing
  onHighlightChange(() => {
    if (currentZoneScreenId) renderZoneScreen(currentZoneScreenId, false);
  });

  // React to debug settings
  onSettingChange('debug-unlock-all-zones', () => {
    refreshZoneUnlockStates();
    if (currentZoneScreenId) {
      renderZoneScreen(currentZoneScreenId, false);
    } else {
      drawPolygons();
    }
  });
  onSettingChange('debug-capture-tab', () => {
    if (!isDebugView && !currentZoneScreenId) renderMapView();
  });

  // Stabling-based unlock: check zones whenever stables change
  onStablesChange(() => {
    const allStabled = [...getStabledDragons(), ...getDenDragons()];
    const newlyUnlocked = checkStabledUnlocks(allStabled);
    if (newlyUnlocked.length > 0) {
      refreshZoneUnlockStates();
      for (const zone of newlyUnlocked) {
        showDiscoveryToast(zone);
      }
      // Refresh whichever view is active
      if (currentZoneScreenId) {
        renderZoneScreen(currentZoneScreenId, false);
      } else if (mapCanvas) {
        drawPolygons();
      }
    }
  });
}

// ── Render: Main map view ───────────────────────────────────

function renderMapView() {
  mapContainer.innerHTML = '';
  isDebugView = false;
  currentZoneScreenId = null;
  currentEncounterDragons = [];
  selectedZoneId = null;
  hoveredZoneId = null;

  // Header
  const header = el('div', 'map-header');
  header.appendChild(el('h2', 'section-title', 'Explore the World'));

  if (getSetting('debug-capture-tab')) {
    const debugBtn = el('button', 'btn btn-secondary map-debug-btn', 'Debug Capture');
    debugBtn.addEventListener('click', () => renderDebugCaptureView());
    header.appendChild(debugBtn);
  }

  mapContainer.appendChild(header);

  // Map wrapper (img + canvas overlay)
  const wrapper = el('div', 'map-canvas-wrapper');

  const img = document.createElement('img');
  img.className = 'map-bg-image';
  img.src = 'assets/ui/map.png';
  img.alt = 'World Map';
  img.draggable = false;
  mapImage = img;

  img.addEventListener('load', () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    drawPolygons();
  });

  img.addEventListener('error', () => {
    // Fallback: dark background, still draw polygons
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, 2048, 2048);
    drawPolygons();
  });

  wrapper.appendChild(img);

  const canvas = document.createElement('canvas');
  canvas.className = 'map-poly-canvas';
  mapCanvas = canvas;
  wrapper.appendChild(canvas);

  attachCanvasEvents(canvas);

  // Info panel (popup overlay on the map)
  infoPanelEl = el('div', 'map-info-panel');
  wrapper.appendChild(infoPanelEl);

  mapContainer.appendChild(wrapper);
}

// ── Canvas: draw all polygon overlays ───────────────────────

// Color constants
const COLORS = {
  region:    { fill: 'rgba(196,162,101,0.12)', stroke: '#c4a265', lineWidth: 2.5 },
  territory: { fill: 'rgba(170,170,170,0.10)', stroke: '#aaaaaa', lineWidth: 1.5 },
  habitat:   { fill: 'rgba(221,221,221,0.08)', stroke: '#dddddd', lineWidth: 1.0 },
  locked:    { fill: 'rgba(0,0,0,0.45)', stroke: 'rgba(80,70,60,0.4)', lineWidth: 1.0 },
  hovered:   { fill: 'rgba(255,255,255,0.18)', stroke: '#ffffff', lineWidthAdd: 1.0 },
  selected:  { fill: 'rgba(255,136,68,0.25)', stroke: '#ff8844', lineWidthAdd: 1.0 },
};

function drawPolygons() {
  if (!mapCanvas) return;
  const ctx = mapCanvas.getContext('2d');
  const w = mapCanvas.width;
  const h = mapCanvas.height;
  if (w === 0 || h === 0) return;

  ctx.clearRect(0, 0, w, h);

  // Draw in tier order: regions (back) → territories → habitats (front)
  const tiers = ['region', 'territory', 'habitat'];

  for (const tier of tiers) {
    for (const zone of zoneList) {
      if (zone.tier !== tier) continue;
      if (!zone.polygon || zone.polygon.length < 3) continue;

      const isHovered = zone.id === hoveredZoneId;
      const isSelected = zone.id === selectedZoneId;

      let fill, stroke, lineWidth;

      if (!zone.unlocked) {
        fill = COLORS.locked.fill;
        stroke = COLORS.locked.stroke;
        lineWidth = COLORS.locked.lineWidth;
      } else {
        const tierColors = COLORS[tier];
        fill = tierColors.fill;
        stroke = tierColors.stroke;
        lineWidth = tierColors.lineWidth;
      }

      if (isSelected && zone.unlocked) {
        fill = COLORS.selected.fill;
        stroke = COLORS.selected.stroke;
        lineWidth += COLORS.selected.lineWidthAdd;
      } else if (isHovered && zone.unlocked) {
        fill = COLORS.hovered.fill;
        stroke = COLORS.hovered.stroke;
        lineWidth += COLORS.hovered.lineWidthAdd;
      }

      drawZonePolygon(ctx, zone.polygon, w, h, fill, stroke, lineWidth);
    }
  }
}

function drawZonePolygon(ctx, points, imgW, imgH, fillStyle, strokeStyle, lineWidth) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = points[i][0] * imgW;
    const y = points[i][1] * imgH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

// ── Hit testing ─────────────────────────────────────────────

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function hitTestZone(normX, normY) {
  // Test most specific first: habitats → territories → regions
  const tiers = ['habitat', 'territory', 'region'];
  for (const tier of tiers) {
    for (const zone of zoneList) {
      if (zone.tier !== tier) continue;
      if (!zone.polygon || zone.polygon.length < 3) continue;
      if (pointInPolygon(normX, normY, zone.polygon)) return zone;
    }
  }
  return null;
}

function getNormalizedCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.changedTouches) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
}

// ── Canvas events ───────────────────────────────────────────

function attachCanvasEvents(canvas) {
  // Desktop: hover detection
  canvas.addEventListener('mousemove', (e) => {
    if (isTouchDevice) return;
    const { x, y } = getNormalizedCoords(e, canvas);
    const zone = hitTestZone(x, y);
    const newHoverId = zone ? zone.id : null;

    if (newHoverId !== hoveredZoneId) {
      hoveredZoneId = newHoverId;
      canvas.style.cursor = (zone && zone.unlocked) ? 'pointer' : 'default';
      drawPolygons();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hoveredZoneId) {
      hoveredZoneId = null;
      drawPolygons();
    }
  });

  // Click (desktop)
  canvas.addEventListener('click', (e) => {
    if (isTouchDevice) return;
    handleCanvasInteraction(e, canvas);
  });

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    isTouchDevice = true;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleCanvasInteraction(e, canvas);
  });
}

function handleCanvasInteraction(e, canvas) {
  const { x, y } = getNormalizedCoords(e, canvas);
  const zone = hitTestZone(x, y);

  if (!zone) {
    if (selectedZoneId || (infoPanelEl && infoPanelEl.classList.contains('visible'))) {
      selectedZoneId = null;
      if (infoPanelEl) infoPanelEl.classList.remove('visible');
      drawPolygons();
    }
    return;
  }

  selectedZoneId = zone.id;
  drawPolygons();
  renderInfoPanel(zone, e, canvas);
}

// ── Info Panel (popup overlay on map click) ──────────────────

function renderInfoPanel(zone, e, canvas) {
  if (!infoPanelEl) return;

  infoPanelEl.innerHTML = '';

  // Close button
  const closeBtn = el('button', 'map-info-close', '\u00d7');
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    infoPanelEl.classList.remove('visible');
    selectedZoneId = null;
    drawPolygons();
  });
  infoPanelEl.appendChild(closeBtn);

  // Header: name + tier badge
  const header = el('div', 'map-info-header');
  header.appendChild(el('h3', 'map-info-name', zone.name));
  header.appendChild(el('span', 'map-info-tier', zone.tier));
  infoPanelEl.appendChild(header);

  // Description
  if (zone.description) {
    infoPanelEl.appendChild(el('p', 'map-info-desc', zone.description));
  }

  const locked = !zone.unlocked;

  if (locked) {
    // ── Locked zone content ──
    if (zone.tier === 'territory' || zone.tier === 'habitat') {
      const geneConstraints = zone.tier === 'territory'
        ? TERRITORIES[zone.id]?.geneConstraints
        : HABITATS[zone.id]?.geneConstraints;

      if (geneConstraints) {
        const allStabled = [...getStabledDragons(), ...getDenDragons()];
        const { covered, total } = getStabledTraitProgress(geneConstraints, allStabled);

        infoPanelEl.appendChild(el('p', 'map-info-stats', `Stabled Traits: ${covered} / ${total}`));

        // Progress bar
        const progressWrapper = el('div', 'map-progress-wrapper');
        const progressBar = el('div', 'zone-progress-bar');
        const progressFill = el('div', 'zone-progress-fill');
        progressFill.style.width = total > 0 ? `${(covered / total) * 100}%` : '0%';
        progressBar.appendChild(progressFill);
        progressWrapper.appendChild(progressBar);
        infoPanelEl.appendChild(progressWrapper);

        infoPanelEl.appendChild(el('p', 'map-info-locked-hint',
          'Stable dragons with matching traits to discover this zone.'));
      }
    } else {
      // Locked region — show unlock cost
      const region = REGIONS[zone.id];
      if (region?.unlockCost) {
        const cost = region.unlockCost;
        const costParts = [];
        if (cost.rep) costParts.push(`${cost.rep} Rep`);
        if (cost.gold) costParts.push(`${cost.gold} Gold`);
        infoPanelEl.appendChild(el('p', 'map-info-stats', `Cost: ${costParts.join(', ')}`));
      }
    }
  } else {
    // ── Unlocked zone content ──
    // Show child unlock stats
    if (zone.tier === 'region') {
      const region = REGIONS[zone.id];
      if (region) {
        const total = region.territories.length;
        const unlocked = region.territories.filter(t => isTerritoryUnlocked(t)).length;
        infoPanelEl.appendChild(el('p', 'map-info-stats', `${unlocked} of ${total} territories unlocked`));
      }
    } else if (zone.tier === 'territory') {
      const territory = TERRITORIES[zone.id];
      if (territory) {
        const total = territory.habitats.length;
        const unlocked = territory.habitats.filter(h => isHabitatUnlocked(h)).length;
        infoPanelEl.appendChild(el('p', 'map-info-stats', `${unlocked} of ${total} habitats unlocked`));
      }
    }

    // Explore button
    const exploreBtn = el('button', 'btn btn-primary map-explore-btn', `Explore ${zone.name}`);
    exploreBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      infoPanelEl.classList.remove('visible');
      renderZoneScreen(zone.id, true);
    });
    infoPanelEl.appendChild(exploreBtn);
  }

  // Position the panel in the center of the map wrapper
  positionInfoPanel(e, canvas);
  infoPanelEl.classList.add('visible');
}

function positionInfoPanel(e, canvas) {
  if (!infoPanelEl) return;
  const wrapper = canvas.parentElement;
  if (!wrapper) return;

  const wrapperRect = wrapper.getBoundingClientRect();

  // Center the panel in the map wrapper
  const panelWidth = 280;
  const left = (wrapperRect.width - panelWidth) / 2;
  const top = wrapperRect.height * 0.3;

  infoPanelEl.style.left = `${Math.max(8, left)}px`;
  infoPanelEl.style.top = `${Math.max(8, top)}px`;
}

// ── Zone Screen (replaces map when a zone is clicked) ───────

/**
 * Render a full-screen zone detail view, replacing the map.
 * @param {string} zoneId
 * @param {boolean} generateDragons - true to roll new encounters, false to keep existing
 */
function getZoneStatsText(zone) {
  if (zone.tier === 'region') {
    const region = REGIONS[zone.id];
    if (region) {
      const territories = region.territories || [];
      const count = territories.filter(tId => isTerritoryUnlocked(tId)).length;
      return `${count} of ${territories.length} territories unlocked`;
    }
  } else if (zone.tier === 'territory') {
    const territory = TERRITORIES[zone.id];
    if (territory) {
      const habitats = territory.habitats || [];
      const count = habitats.filter(hId => isHabitatUnlocked(hId)).length;
      return `${count} of ${habitats.length} habitats unlocked`;
    }
  } else {
    const visits = getHabitatVisits(zone.id);
    if (visits > 0) return `${visits} visits`;
  }
  return null;
}

function renderZoneScreen(zoneId, generateDragons) {
  const zone = zoneList.find(z => z.id === zoneId);
  if (!zone) return;

  mapContainer.innerHTML = '';
  currentZoneScreenId = zoneId;
  isDebugView = false;

  const screen = el('div', 'zone-screen');

  // Top bar: back button + zone name + tier on one line
  const locked = !zone.unlocked;
  const icon = locked ? '\uD83D\uDD12' : tierIcon(zone.tier);
  const topBar = el('div', 'zone-screen-topbar');
  const backBtn = el('button', 'btn btn-secondary zone-back-btn', '\u2190 Back to Map');
  backBtn.addEventListener('click', () => renderMapView());
  topBar.appendChild(backBtn);
  topBar.appendChild(el('span', 'zone-screen-name', `${icon} ${zone.name}`));
  topBar.appendChild(el('span', 'zone-screen-tier', locked ? `${zone.tier} \u2022 Locked` : zone.tier));
  // Combine description + stats into one compact subtitle
  const subtitleParts = [];
  if (zone.description) subtitleParts.push(zone.description);
  const statsText = getZoneStatsText(zone);
  if (statsText) subtitleParts.push(statsText);
  if (subtitleParts.length) {
    topBar.appendChild(el('span', 'zone-screen-desc', `\u2022 ${subtitleParts.join(' \u2022 ')}`));
  }
  screen.appendChild(topBar);

  if (locked) {
    // ── Locked zone: show stabled trait progress ──
    renderLockedZoneContent(screen, zone);
  } else {
    // ── Unlocked zone: show 3 encounter dragons ──
    if (generateDragons) {
      currentEncounterDragons = generateEncounterDragons(zoneId, zone.tier, 3);
    }
    renderEncounterCards(screen, zone);
  }

  mapContainer.appendChild(screen);
}

function tierIcon(tier) {
  if (tier === 'region') return '\uD83C\uDF0D';
  if (tier === 'territory') return '\uD83C\uDFD4\uFE0F';
  return '\uD83C\uDF3F';
}

function renderLockedZoneContent(screen, zone) {
  const allStabled = [...getStabledDragons(), ...getDenDragons()];
  let geneConstraints;

  if (zone.tier === 'territory') {
    geneConstraints = TERRITORIES[zone.id]?.geneConstraints;
  } else if (zone.tier === 'habitat') {
    geneConstraints = HABITATS[zone.id]?.geneConstraints;
  } else {
    // Regions — show unlock cost
    const region = REGIONS[zone.id];
    if (region) {
      const cost = region.unlockCost || {};
      const costParts = [];
      if (cost.rep) costParts.push(`${cost.rep} Rep`);
      if (cost.gold) costParts.push(`${cost.gold} Gold`);

      const unlockBtn = el('button', 'btn btn-primary', `Unlock (${costParts.join(', ')})`);
      unlockBtn.addEventListener('click', () => {
        const result = unlockRegion(zone.id);
        if (result.success) {
          refreshZoneUnlockStates();
          renderZoneScreen(zone.id, true);
        } else {
          showMapToast(result.reason);
        }
      });
      screen.appendChild(unlockBtn);
    }
    return;
  }

  if (!geneConstraints) return;

  const progress = getStabledTraitProgress(geneConstraints, allStabled);
  screen.appendChild(renderProgressBar(progress.covered, progress.total, 'Stabled traits'));

  const hint = el('p', 'zone-locked-hint');
  if (zone.tier === 'territory') {
    const parentRegion = REGIONS[zone.parentRegionId];
    hint.textContent = `Stable dragons from ${parentRegion?.name || 'this region'} with matching traits to unlock this territory.`;
  } else {
    const parentTerritory = TERRITORIES[zone.parentTerritoryId];
    hint.textContent = `Stable dragons from ${parentTerritory?.name || 'this territory'} with matching traits to unlock this habitat.`;
  }
  screen.appendChild(hint);
}

// ── Encounter generation ─────────────────────────────────────

function generateEncounterDragons(zoneId, tier, count) {
  const dragons = [];
  for (let i = 0; i < count; i++) {
    let dragon;
    if (tier === 'region') {
      dragon = encounterAtRegion(zoneId);
    } else if (tier === 'territory') {
      dragon = encounterAtTerritory(zoneId);
    } else {
      dragon = encounter(zoneId);
    }
    if (dragon) {
      dragonRegistry.add(dragon);
      incrementStat('totalGenerated');
      dragons.push(dragon);
    }
  }
  return dragons;
}

function renderEncounterCards(screen, zone) {
  // Species info for habitats
  if (zone.tier === 'habitat') {
    const habitat = HABITATS[zone.id];
    if (habitat?.species?.length > 0) {
      const speciesEl = el('div', 'zone-screen-stats');
      speciesEl.innerHTML = `Rare species: <em>${habitat.species.map(s => s.name).join(', ')}</em>`;
      screen.appendChild(speciesEl);
    }
  }

  // Dragon cards
  const cardsContainer = el('div', 'zone-screen-cards');

  const quest = getHighlightedQuest();
  const highlightGenes = quest ? getGenesForQuest(quest) : null;
  const desiredAlleles = quest ? getDesiredAllelesForQuest(quest) : null;

  for (const dragon of currentEncounterDragons) {
    const cardWrapper = el('div', 'zone-encounter-card-wrapper');

    // Encounter badge
    const badge = el('div', `zone-encounter-badge ${dragon.encounterType || 'common'}`);
    if (dragon.originSpeciesName) {
      badge.textContent = `Species: ${dragon.originSpeciesName}`;
      badge.className = 'zone-encounter-badge species';
    } else if (dragon.encounterType === 'rare') {
      badge.textContent = 'Rare Encounter';
    } else {
      badge.textContent = `${(dragon.encounterLevel || 'habitat').charAt(0).toUpperCase() + (dragon.encounterLevel || 'habitat').slice(1)} Encounter`;
    }
    cardWrapper.appendChild(badge);

    // Dragon card — no stable/parent buttons (must win encounter first)
    const card = renderDragonCard(dragon, {
      highlightGenes,
      desiredAlleles,
    });
    card.dataset.dragonId = dragon.id;
    applyQuestHalo(card, dragon);
    cardWrapper.appendChild(card);

    // Fight button
    const fightBtn = el('button', 'btn btn-danger zone-fight-btn', '\u2694\uFE0F Fight');
    fightBtn.addEventListener('click', () => {
      renderStablesPicker(dragon, zone.id);
    });
    cardWrapper.appendChild(fightBtn);

    cardsContainer.appendChild(cardWrapper);
  }

  screen.appendChild(cardsContainer);

  // Explore Again button
  const actions = el('div', 'zone-screen-actions');
  const exploreAgainBtn = el('button', 'btn btn-primary zone-explore-again-btn', '\uD83D\uDD04 Explore Again');
  exploreAgainBtn.addEventListener('click', () => {
    renderZoneScreen(zone.id, true);
  });
  actions.appendChild(exploreAgainBtn);
  screen.appendChild(actions);
}

// ── Combat: stables picker ──────────────────────────────────

function renderStablesPicker(wildDragon, zoneId) {
  const allStabled = [...getStabledDragons(), ...getDenDragons()];

  if (allStabled.length === 0) {
    showMapToast('No dragons in your stables to fight with!');
    return;
  }

  // Overlay
  const overlay = el('div', 'zone-picker-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const picker = el('div', 'zone-picker-panel');
  picker.appendChild(el('h3', 'zone-picker-title', `Choose a dragon to fight ${wildDragon.name}`));

  const list = el('div', 'zone-picker-list');

  for (const dragon of allStabled) {
    const item = el('div', 'zone-picker-item');

    // Color swatch
    const swatch = el('div', 'zone-picker-swatch');
    if (dragon.phenotype?.color?.hex) {
      swatch.style.backgroundColor = dragon.phenotype.color.hex;
    }
    item.appendChild(swatch);

    // Name and info
    const info = el('div', 'zone-picker-info');
    info.appendChild(el('div', 'zone-picker-name', `${dragon.name} #${dragon.id}`));

    // Derive stats preview
    const stats = deriveCombatStats(dragon.phenotype);
    info.appendChild(el('div', 'zone-picker-stats', `HP:${stats.hp} Atk:${stats.meleeDamage} Brth:${stats.breathDamage} Spd:${stats.speed}`));
    item.appendChild(info);

    // Select button
    const selectBtn = el('button', 'btn btn-primary zone-picker-select-btn', 'Select');
    selectBtn.addEventListener('click', () => {
      overlay.remove();
      renderCombatView(wildDragon, dragon, zoneId);
    });
    item.appendChild(selectBtn);

    list.appendChild(item);
  }

  picker.appendChild(list);

  const cancelBtn = el('button', 'btn btn-secondary zone-picker-cancel', 'Cancel');
  cancelBtn.addEventListener('click', () => overlay.remove());
  picker.appendChild(cancelBtn);

  overlay.appendChild(picker);
  document.body.appendChild(overlay);
}

// ── Placement grid (4×4 height × distance) ─────────────────

const HEIGHT_LABELS = ['Ground', 'Low', 'Mid', 'High'];
const DIST_LABELS = ['Melee', 'Short', 'Medium', 'Long'];

/**
 * Compute wild dragon's auto-chosen distance.
 * Priority: no breath → Melee; melee > breath → Melee; else from breathRange.
 * Returns { distance, heightOverride? }
 */
function getWildPosition(stats) {
  if (stats.breathDamage === 0) {
    return { distance: 0, heightOverride: 0 };
  }
  if (stats.meleeDamage > stats.breathDamage) {
    return { distance: 0 };
  }
  const range = stats.breathRange || 1;
  // Close(1)→Short(1), Mid(2)→Medium(2), Far(3)→Long(3)
  return { distance: Math.min(3, range) };
}

/**
 * Compute heatmap scores for each distance column (0-3) for a dragon at
 * its height row vs the opponent. Returns array of 4 numbers in [-1, 1]
 * where positive = favorable, negative = unfavorable.
 */
function computeDistanceHeatmap(stats, opponentStats) {
  const scores = [];
  const myHeight = stats.height ?? 0;
  const oppHeight = opponentStats.height ?? 0;
  const oppDist = opponentStats.distance ?? 0;

  for (let d = 0; d <= 3; d++) {
    let score = 0;

    // --- My melee output at this distance ---
    const myMeleeDist = getDistanceMeleeMod(d, oppDist);
    const myMeleeHeight = getMeleeHeightMod(myHeight, oppHeight);
    if (myMeleeDist.canMelee && myMeleeHeight.canMelee) {
      score += 0.25 * myMeleeDist.meleeMult * myMeleeHeight.meleeMult;
    }

    // --- Opponent's melee risk to me from their position ---
    const oppMeleeDist = getDistanceMeleeMod(oppDist, d);
    const oppMeleeHeight = getMeleeHeightMod(oppHeight, myHeight);
    if (oppMeleeDist.canMelee && oppMeleeHeight.canMelee) {
      score -= 0.25 * oppMeleeDist.meleeMult * oppMeleeHeight.meleeMult;
    }

    // --- My breath output at this distance ---
    const myBreathDist = getDistanceBreathMod(d, oppDist, stats.breathRange || 1);
    const breathEff = 1 + (myBreathDist.accMod + myBreathDist.dmgMod) / 200; // normalized
    score += 0.25 * breathEff;

    // --- Opponent's breath risk ---
    const oppBreathDist = getDistanceBreathMod(oppDist, d, opponentStats.breathRange || 1);
    const oppBreathEff = 1 + (oppBreathDist.accMod + oppBreathDist.dmgMod) / 200;
    score -= 0.25 * oppBreathEff;

    scores.push(Math.max(-1, Math.min(1, score)));
  }
  return scores;
}

/**
 * Map a score [-1, 1] to an rgba color string for heatmap.
 */
function heatmapColor(score) {
  if (score > 0.1)  return `rgba(60, 180, 60, ${0.15 + score * 0.35})`;
  if (score < -0.1) return `rgba(180, 60, 60, ${0.15 + Math.abs(score) * 0.35})`;
  return 'rgba(180, 180, 60, 0.15)';
}

/**
 * Build a 4×4 placement grid DOM element.
 * @param {Object} stats - dragon's combat stats (including .height)
 * @param {Object} dragon - Dragon object (for sprite rendering)
 * @param {Object} opponentStats - opponent's stats (including .distance for heatmap)
 * @param {Object} opts - { interactive, onSelect, initialDistance }
 * @returns {HTMLElement}
 */
function renderPlacementGrid(stats, dragon, opponentStats, opts = {}) {
  const { interactive = false, onSelect = null, initialDistance = null, mirror = false } = opts;
  const myHeight = stats.height ?? 0;
  // Row index: top row = High (3), bottom row = Ground (0)
  // So row 0 in grid = height 3, row 3 in grid = height 0
  const heightRow = 3 - myHeight;

  const wrapper = el('div', 'placement-grid-wrapper');

  // Y-axis ticks (top=High, bottom=Ground)
  const yTicks = el('div', 'grid-y-ticks');
  for (let i = 3; i >= 0; i--) {
    const tick = el('span', 'grid-tick');
    tick.dataset.tooltip = HEIGHT_LABELS[i];
    yTicks.appendChild(tick);
  }
  wrapper.appendChild(yTicks);

  // 4×4 grid
  const grid = el('div', 'placement-grid');
  const cells = [];
  let selectedCell = null;
  let spriteEl = null;

  // Build mini sprite
  const p = dragon.phenotype;
  const miniSprite = renderLegacySprite(p, false);
  miniSprite.classList.add('grid-sprite');
  if (mirror) miniSprite.classList.add('sprite-flip');
  miniSprite.style.width = '24px';
  miniSprite.style.height = '24px';

  // Try fancy sprite too
  if (getSetting('art-style') !== 'pixel') {
    renderDragon(p, { compact: false, fallbackToTest: false }).then(canvas => {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasPixels = false;
      for (let i2 = 3; i2 < imageData.data.length; i2 += 4) {
        if (imageData.data[i2] > 0) { hasPixels = true; break; }
      }
      if (hasPixels) {
        canvas.classList.add('grid-sprite');
        if (mirror) canvas.classList.add('sprite-flip');
        canvas.style.width = '24px';
        canvas.style.height = '24px';
        canvas.style.imageRendering = 'pixelated';
        if (spriteEl && spriteEl.parentElement) {
          spriteEl.replaceWith(canvas);
        }
        spriteEl = canvas;
      }
    });
  }
  spriteEl = miniSprite;

  // Compute heatmap
  const heatmap = computeDistanceHeatmap(stats, opponentStats);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      // When mirrored, visual column 0 (leftmost) = distance 3 (Long)
      const distCol = mirror ? 3 - col : col;
      const cell = el('div', 'grid-cell');
      const isHeightRow = row === heightRow;

      if (isHeightRow) {
        cell.classList.add('height-row');
        cell.style.background = heatmapColor(heatmap[distCol]);

        if (interactive) {
          cell.classList.add('selectable');
          cell.addEventListener('click', () => {
            if (selectedCell) selectedCell.classList.remove('selected');
            cell.classList.add('selected');
            selectedCell = cell;
            // Move sprite
            if (spriteEl.parentElement) spriteEl.parentElement.removeChild(spriteEl);
            cell.appendChild(spriteEl);
            if (onSelect) onSelect(distCol);
          });
        }
      } else {
        cell.classList.add('dimmed');
      }

      cells.push(cell);
      grid.appendChild(cell);
    }
  }

  wrapper.appendChild(grid);

  // X-axis ticks (reversed when mirrored so labels read Long→Melee left-to-right)
  const xTicks = el('div', 'grid-x-ticks');
  for (let i = 0; i < 4; i++) {
    const distIdx = mirror ? 3 - i : i;
    const tick = el('span', 'grid-tick');
    tick.dataset.tooltip = DIST_LABELS[distIdx];
    xTicks.appendChild(tick);
  }

  // Wrap grid+xticks vertically
  const gridCol = el('div', '');
  gridCol.style.display = 'flex';
  gridCol.style.flexDirection = 'column';
  gridCol.appendChild(grid);
  gridCol.appendChild(xTicks);

  // grid was re-parented into gridCol by appendChild above, just add gridCol to wrapper
  wrapper.appendChild(gridCol);

  // Place sprite in initial position
  if (initialDistance !== null) {
    const visualCol = mirror ? 3 - initialDistance : initialDistance;
    const targetIdx = heightRow * 4 + visualCol;
    const targetCell = cells[targetIdx];
    if (targetCell) {
      targetCell.appendChild(spriteEl);
      targetCell.classList.add('selected');
      selectedCell = targetCell;
    }
  }

  return wrapper;
}

// ── Combat view ─────────────────────────────────────────────

function renderCombatView(wildDragon, playerDragon, zoneId) {
  mapContainer.innerHTML = '';
  const screen = el('div', 'zone-combat-screen');

  // Back to explore
  const backBtn = el('button', 'btn btn-secondary zone-back-btn', '\u2190 Back to Explore');
  backBtn.addEventListener('click', () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    renderZoneScreen(zoneId, false);
  });
  screen.appendChild(backBtn);

  screen.appendChild(el('h2', 'zone-combat-title', '\u2694\uFE0F Combat'));

  // Arena wrapper (5-column on desktop)
  const arena = el('div', 'zone-combat-arena');

  const wildStats = deriveCombatStats(wildDragon.phenotype);
  const playerStats = deriveCombatStats(playerDragon.phenotype);

  // Wild dragon auto-positioning
  const wildPos = getWildPosition(wildStats);
  wildStats.distance = wildPos.distance;
  if (wildPos.heightOverride !== undefined) wildStats.height = wildPos.heightOverride;

  // Player distance (set when they click a grid cell)
  let playerDistance = null;

  // Fighters wrapper (display:contents on desktop → children become grid items)
  const fighters = el('div', 'zone-combat-fighters');

  // ── Panel A (player side): dragon card + stats column ──
  const panelA = el('div', 'zone-combat-panel panel-a');

  const dragonCardA = renderDragonCard(playerDragon, { showGenotype: false, flipSprite: true });
  dragonCardA.classList.add('combat-dragon-card');
  panelA.appendChild(dragonCardA);

  const statsColA = el('div', 'zone-combat-stats stats-a');
  statsColA.appendChild(el('div', 'zone-fighter-label', 'Yours'));
  const statLinesA = [
    `HP: ${playerStats.hp}`,
    `Melee: ${playerStats.meleeDamage}`,
    `Breath: ${playerStats.breathDamage}`,
    `Armor: ${playerStats.armor}`,
    `Speed: ${playerStats.speed}`,
    `Evasion: ${playerStats.evasion}%`,
    `Accuracy: ${playerStats.accuracy}%`,
  ];
  for (const line of statLinesA) {
    statsColA.appendChild(el('div', 'zone-fighter-stat', line));
  }
  const badgesA = el('div', 'zone-combat-status-badges badges-a');
  statsColA.appendChild(badgesA);

  // Placement grid (player — interactive, mirrored so melee faces center)
  const playerGrid = renderPlacementGrid(playerStats, playerDragon, wildStats, {
    interactive: true,
    mirror: true,
    onSelect: (distIdx) => {
      playerDistance = distIdx;
      playerStats.distance = distIdx;
      fightBtn.disabled = false;
      fightBtn.textContent = '\u2694\uFE0F Fight!';
    },
  });
  statsColA.appendChild(playerGrid);
  panelA.appendChild(statsColA);

  fighters.appendChild(panelA);
  fighters.appendChild(el('div', 'zone-combat-vs', 'VS'));

  // ── Panel B (wild side): stats column + dragon card ──
  const panelB = el('div', 'zone-combat-panel panel-b');

  const statsColB = el('div', 'zone-combat-stats stats-b');
  statsColB.appendChild(el('div', 'zone-fighter-label', 'Wild'));
  const statLinesB = [
    `HP: ${wildStats.hp}`,
    `Melee: ${wildStats.meleeDamage}`,
    `Breath: ${wildStats.breathDamage}`,
    `Armor: ${wildStats.armor}`,
    `Speed: ${wildStats.speed}`,
    `Evasion: ${wildStats.evasion}%`,
    `Accuracy: ${wildStats.accuracy}%`,
  ];
  for (const line of statLinesB) {
    statsColB.appendChild(el('div', 'zone-fighter-stat', line));
  }
  const badgesB = el('div', 'zone-combat-status-badges badges-b');
  statsColB.appendChild(badgesB);

  // Placement grid (wild — auto-positioned)
  const wildGrid = renderPlacementGrid(wildStats, wildDragon, playerStats, {
    interactive: false,
    initialDistance: wildStats.distance,
  });
  statsColB.appendChild(wildGrid);
  panelB.appendChild(statsColB);

  const dragonCardB = renderDragonCard(wildDragon, { showGenotype: false });
  dragonCardB.classList.add('combat-dragon-card');
  panelB.appendChild(dragonCardB);

  fighters.appendChild(panelB);
  arena.appendChild(fighters);

  // ── HP bars spanning card + stats column ──
  const hpSpanA = el('div', 'zone-combat-hp-span hp-span-a');
  const playerHp = createHpBar(hpSpanA, playerStats.hp, playerStats.hp);
  arena.appendChild(hpSpanA);

  const hpSpanB = el('div', 'zone-combat-hp-span hp-span-b');
  const wildHp = createHpBar(hpSpanB, wildStats.hp, wildStats.hp);
  arena.appendChild(hpSpanB);

  // ── Center column: fight button, combat log, results ──
  const center = el('div', 'zone-combat-center');

  const fightBtn = el('button', 'btn btn-primary zone-combat-fight-btn', 'Choose Position');
  fightBtn.disabled = true;
  center.appendChild(fightBtn);

  const logContent = el('div', 'zone-combat-log-content');
  center.appendChild(logContent);

  const resultsArea = el('div', 'zone-combat-results');
  resultsArea.style.display = 'none';
  center.appendChild(resultsArea);

  arena.appendChild(center);
  screen.appendChild(arena);

  // Combat state
  let autoPlayTimer = null;
  const maxHpA = playerStats.hp;
  const maxHpB = wildStats.hp;

  // Status badge tracking (populated during combat playback)
  const activeStatusesA = []; // { type, label, emoji, remaining }
  const activeStatusesB = [];

  function renderBadges(container, statuses) {
    container.innerHTML = '';
    for (const s of statuses) {
      const badge = el('span', 'status-badge', `${s.emoji} ${s.label} (${s.remaining}t)`);
      container.appendChild(badge);
    }
  }

  fightBtn.addEventListener('click', () => {
    fightBtn.style.display = 'none';

    // Run simulation (instant, but we'll play back step-by-step)
    const result = simulateCombat(
      { ...playerStats, name: playerDragon.name, distance: playerDistance },
      { ...wildStats, name: wildDragon.name },
    );

    let stepIndex = 0;
    let runningHpA = maxHpA;
    let runningHpB = maxHpB;

    function advanceStep() {
      if (stepIndex >= result.rounds.length) {
        showResults();
        return false;
      }
      const entry = result.rounds[stepIndex];

      // Update running HP from damage
      if (entry.damage) {
        if (entry.attacker === 'A') runningHpB = Math.max(0, runningHpB - entry.damage);
        else if (entry.attacker === 'B') runningHpA = Math.max(0, runningHpA - entry.damage);
        else if (entry.attacker === 'status') {
          if (entry.side === 'A') runningHpA = Math.max(0, runningHpA - entry.damage);
          else if (entry.side === 'B') runningHpB = Math.max(0, runningHpB - entry.damage);
        }
      }
      // Thorns/reflect damage
      if (entry.thornsEntry?.damage) {
        if (entry.attacker === 'A') runningHpA = Math.max(0, runningHpA - entry.thornsEntry.damage);
        else if (entry.attacker === 'B') runningHpB = Math.max(0, runningHpB - entry.thornsEntry.damage);
      }
      if (entry.reflectEntry?.damage) {
        if (entry.attacker === 'A') runningHpA = Math.max(0, runningHpA - entry.reflectEntry.damage);
        else if (entry.attacker === 'B') runningHpB = Math.max(0, runningHpB - entry.reflectEntry.damage);
      }

      // ── Track status badges ──
      if (entry.statusApplied) {
        // Status was applied — figure out which side got it
        // attacker applied it to defender: attacker=A → defender B, attacker=B → defender A
        const targetStatuses = entry.attacker === 'A' ? activeStatusesB : activeStatusesA;
        targetStatuses.push({
          type: entry.statusApplied,
          label: entry.statusLabel || entry.statusApplied,
          emoji: entry.statusEmoji || '💥',
          remaining: entry.statusDuration || 3,
        });
      }
      if (entry.statusExpired) {
        // Status expired — side field tells us which fighter
        const targetStatuses = entry.side === 'A' ? activeStatusesA : activeStatusesB;
        const idx = targetStatuses.findIndex(s => s.type === entry.statusExpired);
        if (idx !== -1) targetStatuses.splice(idx, 1);
      }
      if (entry.statusTick && entry.statusTick === 'burn') {
        // DOT tick — decrement remaining turns for display
        const targetStatuses = entry.side === 'A' ? activeStatusesA : activeStatusesB;
        const s = targetStatuses.find(st => st.type === 'burn');
        if (s && s.remaining > 0) s.remaining--;
      }

      // Update HP bars
      updateHpBar(playerHp, runningHpA, maxHpA);
      updateHpBar(wildHp, runningHpB, maxHpB);

      // Render status badges
      renderBadges(badgesA, activeStatusesA);
      renderBadges(badgesB, activeStatusesB);

      // Append log entry
      appendCombatLogEntry(logContent, entry, runningHpA, maxHpA, runningHpB, maxHpB, playerDragon.name, wildDragon.name);

      stepIndex++;
      if (stepIndex >= result.rounds.length) {
        showResults();
        return false;
      }
      return true;
    }

    function showResults() {
      if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }

      const winnerName = result.winner === 'A' ? playerDragon.name : wildDragon.name;
      const isPlayerWin = result.winner === 'A';
      const banner = el('div', `zone-combat-banner ${isPlayerWin ? 'win' : 'lose'}`);
      banner.textContent = isPlayerWin
        ? `\uD83C\uDFC6 ${winnerName} wins!`
        : `\uD83D\uDCA5 ${winnerName} wins...`;
      resultsArea.appendChild(banner);

      if (isPlayerWin) {
        const stableBtn = el('button', 'btn btn-primary zone-combat-stable-btn',
          '\u2B50 Stable ' + wildDragon.name);
        stableBtn.addEventListener('click', () => {
          const added = addToStables(wildDragon);
          if (added) {
            showMapToast(`${wildDragon.name} added to your stables!`);
            stableBtn.disabled = true;
            stableBtn.textContent = '\u2713 Stabled!';
            stableBtn.classList.add('disabled');
          } else {
            showMapToast('Stables full! Make room first.');
          }
        });
        resultsArea.appendChild(stableBtn);
      }
      resultsArea.style.display = '';
    }

    // Auto-play at 400ms intervals
    autoPlayTimer = setInterval(() => {
      const more = advanceStep();
      if (!more) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }, 400);
  });

  mapContainer.appendChild(screen);
}

// ── HP bar helpers ──

function createHpBar(cardEl, currentHp, maxHp) {
  const hpBar = el('div', 'zone-fighter-hp');
  const hpFill = el('div', 'zone-fighter-hp-fill');
  hpBar.appendChild(hpFill);
  cardEl.appendChild(hpBar);
  const hpText = el('div', 'zone-fighter-hp-text');
  cardEl.appendChild(hpText);
  const refs = { fill: hpFill, text: hpText };
  updateHpBar(refs, currentHp, maxHp);
  return refs;
}

function updateHpBar(refs, currentHp, maxHp) {
  const pct = Math.max(0, (currentHp / maxHp) * 100);
  refs.fill.style.width = pct + '%';
  if (pct > 50) refs.fill.style.backgroundColor = '#4CAF50';
  else if (pct > 25) refs.fill.style.backgroundColor = '#FFC107';
  else refs.fill.style.backgroundColor = '#F44336';
  refs.text.textContent = `HP: ${Math.round(currentHp)} / ${Math.round(maxHp)}`;
}

function hpColor(current, max) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  if (pct > 50) return '#4CAF50';
  if (pct > 25) return '#FFC107';
  return '#F44336';
}

// ── Combat log entry (two-line per attack: attacker line + defender line) ──

function appendCombatLogEntry(container, entry, hpA, maxA, hpB, maxB, nameA, nameB) {
  const atkName = entry.attacker === 'A' ? nameA : entry.attacker === 'B' ? nameB : '';
  const defName = entry.attacker === 'A' ? nameB : entry.attacker === 'B' ? nameA : '';
  const atkSide = entry.attacker; // 'A' or 'B'
  const defSide = atkSide === 'A' ? 'B' : 'A';

  // ── Status applied: prominent banner-style entry with attacker's side bar ──
  if (entry.statusApplied) {
    const sideClass = entry.attacker === 'A' || entry.attacker === 'B'
      ? ` log-side-${entry.attacker.toLowerCase()}` : '';
    const line = el('div', `zone-combat-entry log-status-applied${sideClass}`);
    line.appendChild(el('span', 'zone-combat-log-text', entry.details || ''));
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return;
  }

  // ── Status DOT tick: red-ish styling with affected side's bar ──
  if (entry.statusTick && entry.attacker === 'status') {
    let cls = 'zone-combat-entry log-status-tick';
    if (entry.statusExpired) cls = 'zone-combat-entry log-status-expired';
    if (entry.side) cls += ` log-side-${entry.side.toLowerCase()}`;
    const line = el('div', cls);
    line.appendChild(el('span', 'zone-combat-log-text', entry.details || ''));
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return;
  }

  // ── Status expired: muted italic with affected side's bar ──
  if (entry.statusExpired && entry.attacker === 'status') {
    let cls = 'zone-combat-entry log-status-expired';
    if (entry.side) cls += ` log-side-${entry.side.toLowerCase()}`;
    const line = el('div', cls);
    line.appendChild(el('span', 'zone-combat-log-text', entry.details || ''));
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return;
  }

  // System messages and other status entries — single centered line
  if (entry.attacker === 'status' || entry.attacker === 'system') {
    const line = el('div', 'zone-combat-entry log-system');
    line.appendChild(el('span', 'zone-combat-log-text', entry.details || ''));
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return;
  }

  // Determine attacker/defender HP
  let defHpNow, defHpMax;
  if (atkSide === 'A') { defHpNow = hpB; defHpMax = maxB; }
  else { defHpNow = hpA; defHpMax = maxA; }

  // ── Line 1: Attacker action (aligned to attacker's side) ──
  const atkLine = el('div', `zone-combat-entry log-side-${atkSide.toLowerCase()}`);
  if (entry.turn > 0) {
    atkLine.appendChild(el('span', 'zone-combat-turn-badge', `T${entry.turn}`));
  }

  let atkText = '';
  if (entry.dodged) {
    atkText = `${atkName} uses ${entry.attackType} attack — miss!`;
    atkLine.classList.add('log-miss');
  } else if (entry.damage > 0) {
    const atkType = entry.attackType === 'breath'
      ? `${entry.details.match(/\w+ breath/)?.[0] || 'breath'} attack`
      : 'melee attack';
    // Extract mitigation info from details parenthetical
    const mitigationMatch = entry.details.match(/\(([^)]+)\)/);
    const mitigationNote = mitigationMatch ? mitigationMatch[1] : '';
    atkText = `${atkName} uses ${atkType} for ${entry.damage} dmg`;
    if (mitigationNote) atkText += ` (${mitigationNote})`;
    atkLine.classList.add('log-hit');
  } else {
    atkText = entry.details || `${atkName} attacks`;
  }
  atkLine.appendChild(el('span', 'zone-combat-log-text', atkText));
  container.appendChild(atkLine);

  // ── Line 2: Defender takes damage (aligned to defender's side) ──
  if (entry.damage > 0 && !entry.dodged) {
    const defLine = el('div', `zone-combat-entry log-side-${defSide.toLowerCase()} log-defender`);
    const defText = el('span', 'zone-combat-log-text');
    defText.appendChild(document.createTextNode(`${defName} takes ${entry.damage} damage | `));

    const hpVal = el('span', 'zone-combat-log-hp-val');
    hpVal.textContent = Math.round(defHpNow);
    hpVal.style.color = hpColor(defHpNow, defHpMax);
    defText.appendChild(hpVal);
    defText.appendChild(document.createTextNode(`/${Math.round(defHpMax)}`));
    defLine.appendChild(defText);
    container.appendChild(defLine);
  }

  // ── Thorns/reflect sub-entries (bar matches the side taking damage) ──
  if (entry.thornsEntry) {
    // Thorns damage goes back to attacker — use attacker's side bar
    const tLine = el('div', `zone-combat-entry log-reflect log-side-${atkSide.toLowerCase()}`);
    tLine.appendChild(el('span', 'zone-combat-log-text', entry.thornsEntry.details));
    container.appendChild(tLine);
  }
  if (entry.reflectEntry) {
    // Reflect damage goes back to attacker — use attacker's side bar
    const rLine = el('div', `zone-combat-entry log-reflect log-side-${atkSide.toLowerCase()}`);
    rLine.appendChild(el('span', 'zone-combat-log-text', entry.reflectEntry.details));
    container.appendChild(rLine);
  }

  container.scrollTop = container.scrollHeight;
}

function renderFighterCard(dragon, stats, label) {
  const card = el('div', 'zone-fighter-card');
  card.appendChild(el('div', 'zone-fighter-label', label));
  card.appendChild(el('div', 'zone-fighter-name', dragon.name));

  // Dragon sprite (same pattern as ui-card.js)
  const p = dragon.phenotype;
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

  // Key stats
  const statLines = [
    `HP: ${stats.hp}`,
    `Melee: ${stats.meleeDamage} | Breath: ${stats.breathDamage}`,
    `Armor: ${stats.armor} | Speed: ${stats.speed}`,
    `Evasion: ${stats.evasion}% | Accuracy: ${stats.accuracy}%`,
  ];
  for (const line of statLines) {
    card.appendChild(el('div', 'zone-fighter-stat', line));
  }
  return card;
}

// ── Discovery helpers ───────────────────────────────────────

function renderProgressBar(current, total, label) {
  const wrapper = el('div', 'map-progress-wrapper');
  const text = el('span', 'map-progress-text', `${label}: ${current}/${total}`);
  wrapper.appendChild(text);

  const bar = el('div', 'map-progress-bar');
  const fill = el('div', 'map-progress-fill');
  fill.style.width = total > 0 ? `${(current / total) * 100}%` : '0%';
  bar.appendChild(fill);
  wrapper.appendChild(bar);

  return wrapper;
}

function showDiscoveryToast(zone) {
  const existing = document.querySelector('.map-toast');
  if (existing) existing.remove();

  const toast = el('div', 'map-toast discovery');
  toast.innerHTML = `<strong>${zone.name}</strong> discovered! Your stabled dragons revealed a path.`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Toast ────────────────────────────────────────────────────

function showMapToast(message) {
  const existing = document.querySelector('.map-toast');
  if (existing) existing.remove();

  const toast = el('div', 'map-toast', message);
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ── Debug Capture View ───────────────────────────────────────

function renderDebugCaptureView() {
  mapContainer.innerHTML = '';
  isDebugView = true;

  // Back button
  const backBtn = el('button', 'btn btn-secondary', '\u2190 Back to Map');
  backBtn.addEventListener('click', () => renderMapView());
  mapContainer.appendChild(backBtn);

  mapContainer.appendChild(el('h2', 'section-title', 'Debug Capture'));
  mapContainer.appendChild(el('p', 'map-debug-desc', 'Select a region, territory, and habitat to capture dragons with specific constraints. Capture at any level \u2014 deeper levels add more constraints. Or choose "Fully Random" for no constraints.'));

  const controls = el('div', 'map-debug-controls');

  // Region dropdown
  const regionSelect = document.createElement('select');
  regionSelect.className = 'map-debug-select';
  regionSelect.innerHTML = '<option value="">-- Fully Random --</option>';
  for (const regionId of getRegionIds()) {
    const opt = document.createElement('option');
    opt.value = regionId;
    opt.textContent = REGIONS[regionId].name;
    regionSelect.appendChild(opt);
  }
  controls.appendChild(labeledField('Region', regionSelect));

  // Territory dropdown
  const territorySelect = document.createElement('select');
  territorySelect.className = 'map-debug-select';
  territorySelect.disabled = true;
  controls.appendChild(labeledField('Territory', territorySelect));

  // Habitat dropdown
  const habitatSelect = document.createElement('select');
  habitatSelect.className = 'map-debug-select';
  habitatSelect.disabled = true;
  controls.appendChild(labeledField('Habitat', habitatSelect));

  // Cascading dropdown logic
  regionSelect.addEventListener('change', () => {
    const regionId = regionSelect.value;
    territorySelect.innerHTML = '<option value="">-- Any Territory --</option>';
    habitatSelect.innerHTML = '<option value="">-- Any Habitat --</option>';
    habitatSelect.disabled = true;

    if (!regionId) {
      territorySelect.disabled = true;
      return;
    }

    territorySelect.disabled = false;
    const territories = getTerritoriesForRegion(regionId);
    for (const t of territories) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      territorySelect.appendChild(opt);
    }
  });

  territorySelect.addEventListener('change', () => {
    const territoryId = territorySelect.value;
    habitatSelect.innerHTML = '<option value="">-- Any Habitat --</option>';

    if (!territoryId) {
      habitatSelect.disabled = true;
      return;
    }

    habitatSelect.disabled = false;
    const habitats = getHabitatsForTerritory(territoryId);
    for (const h of habitats) {
      const opt = document.createElement('option');
      opt.value = h.id;
      opt.textContent = h.name;
      habitatSelect.appendChild(opt);
    }
  });

  mapContainer.appendChild(controls);

  // Capture buttons
  const btnRow = el('div', 'btn-group');

  const captureBtn = el('button', 'btn btn-primary', 'Capture Dragon');
  captureBtn.addEventListener('click', () => {
    const habitatId = habitatSelect.value || null;
    const territoryId = territorySelect.value || null;
    const regionId = regionSelect.value || null;

    const dragon = debugEncounter(habitatId, territoryId, regionId);
    if (!dragon) return;

    dragonRegistry.add(dragon);
    incrementStat('totalGenerated');

    const quest = getHighlightedQuest();
    const highlightGenes = quest ? getGenesForQuest(quest) : null;
    const desiredAlleles = quest ? getDesiredAllelesForQuest(quest) : null;

    const card = renderDragonCard(dragon, {
      onSaveToStables: (d) => addToStables(d),
      onUseAsParentA: (d) => { setParentExternal('A', d); showMapToast(`Parent A set: ${d.name}`); },
      onUseAsParentB: (d) => { setParentExternal('B', d); showMapToast(`Parent B set: ${d.name}`); },
      highlightGenes,
      desiredAlleles,
    });
    card.dataset.dragonId = dragon.id;
    applyQuestHalo(card, dragon);
    debugList.insertBefore(card, debugList.firstChild);
  });
  btnRow.appendChild(captureBtn);

  const capture5Btn = el('button', 'btn btn-secondary', 'Capture 5');
  capture5Btn.addEventListener('click', () => {
    for (let i = 0; i < 5; i++) captureBtn.click();
  });
  btnRow.appendChild(capture5Btn);

  const clearBtn = el('button', 'btn btn-secondary', 'Clear All');
  clearBtn.addEventListener('click', () => { debugList.innerHTML = ''; });
  btnRow.appendChild(clearBtn);

  mapContainer.appendChild(btnRow);

  // Dragon list
  const debugList = el('div', 'dragon-list');
  mapContainer.appendChild(debugList);
}

function labeledField(label, input) {
  const wrapper = el('div', 'map-debug-field');
  wrapper.appendChild(el('label', 'map-debug-label', label));
  wrapper.appendChild(input);
  return wrapper;
}
