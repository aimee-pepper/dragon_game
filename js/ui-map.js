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
  getTerritoryDiscoveryProgress, getHabitatDiscoveryProgress,
  encounter, encounterAtRegion, encounterAtTerritory, debugEncounter,
  getHabitatVisits,
} from './map-engine.js';
import { renderDragonCard } from './ui-card.js';
import { addToStables } from './ui-stables.js';
import { setParentExternal } from './ui-breeder.js';
import { applyQuestHalo, onHighlightChange, getHighlightedQuest } from './quest-highlight.js';
import { getGenesForQuest, getDesiredAllelesForQuest } from './quest-gene-map.js';
import { incrementStat } from './save-manager.js';
import { getSetting, onSettingChange } from './settings.js';

// ── Module state ────────────────────────────────────────────

let dragonRegistry = null;
let mapContainer = null;

let polygonData = null;   // from zone-polygons.json
let zoneList = [];        // flat array of all 39 zones
let hoveredZoneId = null;
let selectedZoneId = null;
let mapCanvas = null;
let mapImage = null;
let infoPanelEl = null;
let isDebugView = false;
let isTouchDevice = false; // set on first touch event

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

  // React to quest highlight changes
  onHighlightChange(() => {
    if (selectedZoneId && infoPanelEl) {
      const slot = infoPanelEl.querySelector('.map-encounter-slot');
      const dragonCard = slot?.querySelector('[data-dragon-id]');
      if (dragonCard) {
        // Re-render info panel to update quest halo
        renderInfoPanel(selectedZoneId);
      }
    }
  });

  // React to debug settings
  onSettingChange('debug-unlock-all-zones', () => {
    refreshZoneUnlockStates();
    drawPolygons();
    if (selectedZoneId) renderInfoPanel(selectedZoneId);
  });
  onSettingChange('debug-capture-tab', () => {
    if (!isDebugView) renderMapView();
  });
}

// ── Render: Main map view ───────────────────────────────────

function renderMapView() {
  mapContainer.innerHTML = '';
  isDebugView = false;
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

  // Info panel popup (inside wrapper, positioned absolutely near clicked zone)
  infoPanelEl = el('div', 'map-info-panel');
  wrapper.appendChild(infoPanelEl);

  // Close popup when clicking outside it but inside wrapper (handled by canvas click)
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
    // Clicked empty area — deselect
    if (selectedZoneId) {
      selectedZoneId = null;
      drawPolygons();
      if (infoPanelEl) {
        infoPanelEl.innerHTML = '';
        infoPanelEl.classList.remove('visible');
      }
    }
    return;
  }

  selectedZoneId = zone.id;
  drawPolygons();
  renderInfoPanel(zone.id, x, y);
}

// ── Info panel ──────────────────────────────────────────────

function renderInfoPanel(zoneId, clickX, clickY) {
  if (!infoPanelEl) return;
  infoPanelEl.innerHTML = '';

  const zone = zoneList.find(z => z.id === zoneId);
  if (!zone) return;

  // Position the popup near the click point
  if (clickX !== undefined && clickY !== undefined) {
    positionInfoPanel(clickX, clickY);
  }
  infoPanelEl.classList.add('visible');

  // Close button
  const closeBtn = el('button', 'map-info-close', '\u00d7');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedZoneId = null;
    drawPolygons();
    infoPanelEl.innerHTML = '';
    infoPanelEl.classList.remove('visible');
  });
  infoPanelEl.appendChild(closeBtn);

  // Header: name + tier badge
  const header = el('div', 'map-info-header');
  const nameEl = el('h3', 'map-info-name', zone.name);
  header.appendChild(nameEl);

  const tierBadge = el('span', 'map-info-tier', zone.tier);
  header.appendChild(tierBadge);
  infoPanelEl.appendChild(header);

  // Description
  if (zone.description) {
    infoPanelEl.appendChild(el('p', 'map-info-desc', zone.description));
  }

  // Tier-specific content
  if (zone.tier === 'region') {
    renderRegionInfoContent(zone);
  } else if (zone.tier === 'territory') {
    renderTerritoryInfoContent(zone);
  } else {
    renderHabitatInfoContent(zone);
  }
}

function positionInfoPanel(normX, normY) {
  // Convert normalized coords to percentage positioning within the wrapper
  const xPercent = normX * 100;
  const yPercent = normY * 100;

  // Horizontal: center on click, but clamp so panel stays within bounds
  infoPanelEl.style.left = `${Math.max(5, Math.min(95, xPercent))}%`;

  // Vertical: if click is in top 60%, show below; otherwise show above
  if (normY < 0.6) {
    infoPanelEl.style.top = `${yPercent + 3}%`;
    infoPanelEl.style.bottom = 'auto';
    infoPanelEl.style.transform = 'translateX(-50%)';
  } else {
    infoPanelEl.style.bottom = `${100 - yPercent + 3}%`;
    infoPanelEl.style.top = 'auto';
    infoPanelEl.style.transform = 'translateX(-50%)';
  }
}

function renderRegionInfoContent(zone) {
  const region = REGIONS[zone.id];
  if (!region) return;

  // Territory count
  const territories = region.territories || [];
  const unlockedCount = territories.filter(tId => isTerritoryUnlocked(tId)).length;
  const statsEl = el('div', 'map-info-stats', `${unlockedCount} of ${territories.length} territories unlocked`);
  infoPanelEl.appendChild(statsEl);

  if (zone.unlocked) {
    // Explore button
    const exploreBtn = el('button', 'btn btn-primary map-explore-btn', `Explore ${zone.name}`);
    const dragonSlot = el('div', 'map-encounter-slot');

    exploreBtn.addEventListener('click', () => {
      handleExplore(zone.id);
    });

    infoPanelEl.appendChild(exploreBtn);
    infoPanelEl.appendChild(dragonSlot);
  } else {
    // Unlock button for locked regions
    const cost = region.unlockCost || {};
    const costParts = [];
    if (cost.rep) costParts.push(`${cost.rep} Rep`);
    if (cost.gold) costParts.push(`${cost.gold} Gold`);

    const unlockBtn = el('button', 'btn btn-primary map-explore-btn', `Unlock (${costParts.join(', ')})`);
    unlockBtn.addEventListener('click', () => {
      const result = unlockRegion(zone.id);
      if (result.success) {
        refreshZoneUnlockStates();
        drawPolygons();
        renderInfoPanel(zone.id);
      } else {
        showMapToast(result.reason);
      }
    });
    infoPanelEl.appendChild(unlockBtn);
  }
}

function renderTerritoryInfoContent(zone) {
  const territory = TERRITORIES[zone.id];
  if (!territory) return;

  // Habitat count
  const habitats = territory.habitats || [];
  const unlockedCount = habitats.filter(hId => isHabitatUnlocked(hId)).length;
  const statsEl = el('div', 'map-info-stats', `${unlockedCount} of ${habitats.length} habitats unlocked`);
  infoPanelEl.appendChild(statsEl);

  if (zone.unlocked) {
    // Explore button
    const exploreBtn = el('button', 'btn btn-primary map-explore-btn', `Explore ${zone.name}`);
    const dragonSlot = el('div', 'map-encounter-slot');

    exploreBtn.addEventListener('click', () => {
      handleExplore(zone.id);
    });

    infoPanelEl.appendChild(exploreBtn);
    infoPanelEl.appendChild(dragonSlot);
  } else {
    // Discovery progress
    const progress = getTerritoryDiscoveryProgress(zone.parentRegionId, zone.id);
    infoPanelEl.appendChild(renderProgressBar(progress.covered, progress.total, 'Traits observed'));

    const remainingVisits = progress.visitsNeeded - progress.visits;
    if (remainingVisits > 0) {
      infoPanelEl.appendChild(el('p', 'map-locked-hint', `Or explore ${remainingVisits} more times to unlock.`));
    }

    const parentRegion = REGIONS[zone.parentRegionId];
    if (parentRegion) {
      infoPanelEl.appendChild(el('p', 'map-info-locked-hint', `Explore ${parentRegion.name} to discover a path here.`));
    }
  }
}

function renderHabitatInfoContent(zone) {
  const habitat = HABITATS[zone.id];
  if (!habitat) return;

  if (zone.unlocked) {
    // Visit count
    const visits = getHabitatVisits(zone.id);
    if (visits > 0) {
      infoPanelEl.appendChild(el('div', 'map-info-stats', `${visits} visits`));
    }

    // Species hints
    if (habitat.species && habitat.species.length > 0) {
      const speciesEl = el('div', 'map-habitat-species-hint');
      speciesEl.appendChild(el('span', 'map-species-label', 'Rare species: '));
      const names = habitat.species.map(s => s.name).join(', ');
      speciesEl.appendChild(el('span', 'map-species-names', names));
      infoPanelEl.appendChild(speciesEl);
    }

    // Explore button
    const exploreBtn = el('button', 'btn btn-primary map-explore-btn', `Explore ${zone.name}`);
    const dragonSlot = el('div', 'map-encounter-slot');

    exploreBtn.addEventListener('click', () => {
      handleExplore(zone.id);
    });

    infoPanelEl.appendChild(exploreBtn);
    infoPanelEl.appendChild(dragonSlot);
  } else {
    // Discovery progress
    const progress = getHabitatDiscoveryProgress(zone.parentTerritoryId, zone.id);
    infoPanelEl.appendChild(renderProgressBar(progress.covered, progress.total, 'Traits observed'));

    const remainingVisits = progress.visitsNeeded - progress.visits;
    if (remainingVisits > 0) {
      infoPanelEl.appendChild(el('p', 'map-locked-hint', `Or explore ${remainingVisits} more times to unlock.`));
    }

    const parentTerritory = TERRITORIES[zone.parentTerritoryId];
    if (parentTerritory) {
      infoPanelEl.appendChild(el('p', 'map-info-locked-hint', `Explore ${parentTerritory.name} to discover a path here.`));
    }
  }
}

// ── Encounter handling ──────────────────────────────────────

function handleExplore(zoneId) {
  const zone = zoneList.find(z => z.id === zoneId);
  if (!zone || !zone.unlocked) return;

  let dragon;
  if (zone.tier === 'region') {
    dragon = encounterAtRegion(zoneId);
  } else if (zone.tier === 'territory') {
    dragon = encounterAtTerritory(zoneId);
  } else {
    dragon = encounter(zoneId);
  }
  if (!dragon) return;

  dragonRegistry.add(dragon);
  incrementStat('totalGenerated');

  // Show dragon in the encounter slot
  const slot = infoPanelEl.querySelector('.map-encounter-slot');
  if (slot) {
    renderDragonInSlot(dragon, slot);
  }

  // Handle newly unlocked zones
  if (dragon._newlyUnlockedZones && dragon._newlyUnlockedZones.length > 0) {
    for (const unlocked of dragon._newlyUnlockedZones) {
      showDiscoveryToast(unlocked);
    }
    refreshZoneUnlockStates();
    drawPolygons();

    // Update stats in the info panel (e.g. "1 of 3 territories unlocked")
    const statsEl = infoPanelEl.querySelector('.map-info-stats');
    if (statsEl && zone.tier === 'region') {
      const region = REGIONS[zoneId];
      const territories = region.territories || [];
      const count = territories.filter(tId => isTerritoryUnlocked(tId)).length;
      statsEl.textContent = `${count} of ${territories.length} territories unlocked`;
    } else if (statsEl && zone.tier === 'territory') {
      const territory = TERRITORIES[zoneId];
      const habitats = territory.habitats || [];
      const count = habitats.filter(hId => isHabitatUnlocked(hId)).length;
      statsEl.textContent = `${count} of ${habitats.length} habitats unlocked`;
    }
  }
}

// ── Dragon card rendering ───────────────────────────────────

function renderDragonInSlot(dragon, slot) {
  slot.innerHTML = '';

  // Encounter type badge
  if (dragon.originSpeciesName) {
    const badge = el('div', 'map-encounter-badge species');
    badge.textContent = `Species: ${dragon.originSpeciesName}`;
    slot.appendChild(badge);
  } else if (dragon.encounterType === 'rare') {
    const badge = el('div', 'map-encounter-badge rare');
    badge.textContent = 'Rare Encounter';
    slot.appendChild(badge);
  } else {
    const level = dragon.encounterLevel || 'habitat';
    const zoneName = dragon.encounterZoneName || '';
    const badge = el('div', `map-encounter-badge ${level}`);
    badge.textContent = `${level.charAt(0).toUpperCase() + level.slice(1)} Encounter${zoneName ? ': ' + zoneName : ''}`;
    slot.appendChild(badge);
  }

  renderDragonCardInSlot(dragon, slot);
}

function renderDragonCardInSlot(dragon, slot) {
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
  slot.appendChild(card);
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
  if (zone.method === 'discovery') {
    toast.innerHTML = `<strong>${zone.name}</strong> discovered! You sensed a path from the dragons' traits.`;
  } else {
    toast.innerHTML = `<strong>${zone.name}</strong> unlocked! You've thoroughly mapped this area.`;
  }
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
