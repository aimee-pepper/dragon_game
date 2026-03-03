import { computeSpinePositions as _computeSpinePos } from './spine-math.js';
import { loadAllPaths as _loadSpinePaths, whenReady as _spineStorageReady } from './spine-storage.js';
import { getAnchor, getGroupAnchor, whenReady as anchorStorageReady } from './anchor-storage.js';

// Sprite layer configuration for the dragon renderer
// ============================================================
// DATA-DRIVEN from artist's asset CSV
// Each entry in ASSET_TABLE maps directly to a PNG in assets/sprites/
// The renderer iterates this table in z_order, resolves which entries
// apply to a given phenotype, and composites them onto the canvas.
// ============================================================

// ============================================================
// ASSET TABLE — the complete list of every sprite part
// ============================================================
// Parsed from the artist's CSV. Each row is one PNG.
//
// Fields:
//   filename:    PNG filename (without .png extension)
//   layerGroup:  logical group (back wing, body, head, etc.)
//   gene:        which gene controls this part
//   variant:     which gene value selects this asset
//   modifier:    secondary variant (direction, height, length, etc.)
//   z:           z-order for rendering (lower = further back)
//   colorMode:   how color is applied (derived from layer type)
//   opacityMode: transparency behavior (derived from layer type)
//
// colorMode values:
//   'base'    → hue+sat from dragon color, luminance from art
//   'lighten' → same as base but luminance shifted lighter (belly, wing inner)
//   'darken'  → same as base but luminance shifted darker (outlines)
//   'fixed'   → no color tinting, drawn as-is (eyes, mouth details)
//
// opacityMode values:
//   'opaque'  → always 100% alpha
//   'wing'    → uses wing membrane transparency (per-layer, stacks on overlap)
//   'body'    → uses body transparency (for transparent/crystal finishes)

export const ASSET_TABLE = [
  // ──── BG WINGS ────
  // Vestigial (no inner outline — simpler structure)
  { filename: 'wing_bg_vest_inner_f',  layerGroup: 'back wing', gene: 'wing', variant: 'vestigial', modifier: null,      z: 1,  colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_bg_vest_outer_f',  layerGroup: 'back wing', gene: 'wing', variant: 'vestigial', modifier: null,      z: 2,  colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_bg_vest_outer_o',        layerGroup: 'back wing', gene: 'wing', variant: 'vestigial', modifier: null,      z: 3,  colorMode: 'darken',  opacityMode: 'opaque' },
  // Two wings
  { filename: 'wing_bg_inner_f',       layerGroup: 'back wing', gene: 'wing', variant: 'two',       modifier: null,      z: 4,  colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_bg_inner_o',       layerGroup: 'back wing', gene: 'wing', variant: 'two',       modifier: null,      z: 5,  colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'wing_bg_outer_f',       layerGroup: 'back wing', gene: 'wing', variant: 'two',       modifier: null,      z: 6,  colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_bg_outer_o',       layerGroup: 'back wing', gene: 'wing', variant: 'two',       modifier: null,      z: 7,  colorMode: 'darken',  opacityMode: 'opaque' },
  // Four wings
  { filename: 'wing_bg_inner_f',       layerGroup: 'back wing', gene: 'wing', variant: 'four',      modifier: null,      z: 8,  colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_bg_inner_o',       layerGroup: 'back wing', gene: 'wing', variant: 'four',      modifier: null,      z: 9,  colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'wing_bg_outer_f',       layerGroup: 'back wing', gene: 'wing', variant: 'four',      modifier: null,      z: 10, colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_bg_outer_o',       layerGroup: 'back wing', gene: 'wing', variant: 'four',      modifier: null,      z: 11, colorMode: 'darken',  opacityMode: 'opaque' },
  // Six wings
  { filename: 'wing_bg_inner_f',       layerGroup: 'back wing', gene: 'wing', variant: 'six',       modifier: null,      z: 12, colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_bg_inner_o',       layerGroup: 'back wing', gene: 'wing', variant: 'six',       modifier: null,      z: 13, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'wing_bg_outer_f',       layerGroup: 'back wing', gene: 'wing', variant: 'six',       modifier: null,      z: 14, colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_bg_outer_o',       layerGroup: 'back wing', gene: 'wing', variant: 'six',       modifier: null,      z: 15, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── BG LEGS ────
  { filename: 'leg_bg_f',              layerGroup: 'back leg',  gene: 'leg',  variant: 'two',       modifier: null,      z: 16, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'leg_bg_o',              layerGroup: 'back leg',  gene: 'leg',  variant: 'two',       modifier: null,      z: 17, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'leg_bg_f',              layerGroup: 'back leg',  gene: 'leg',  variant: 'four',      modifier: null,      z: 18, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'leg_bg_o',              layerGroup: 'back leg',  gene: 'leg',  variant: 'four',      modifier: null,      z: 19, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'leg_bg_f',              layerGroup: 'back leg',  gene: 'leg',  variant: 'six',       modifier: null,      z: 20, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'leg_bg_o',              layerGroup: 'back leg',  gene: 'leg',  variant: 'six',       modifier: null,      z: 21, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── BODY SPINES (behind body — peek out above spine ridge) ────
  // Spike (outline-only, single layer)
  { filename: 'spine_spike_S',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'low',     z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_spike_M',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'medium',  z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_spike_L',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'tall',    z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  // Ridge (fill + outline)
  { filename: 'spine_ridge_S_f',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_ridge_S_o',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_ridge_M_f',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_ridge_M_o',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_ridge_L_f',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_ridge_L_o',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  // Sail (fill + outline)
  { filename: 'spine_sail_S_f',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sail_S_o',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_sail_M_f',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sail_M_o',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 22, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_sail_L_f',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sail_L_o',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 22, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── BODY ────
  { filename: 'body_sin_bf',           layerGroup: 'body',      gene: 'body',   variant: 'sinuous',  modifier: null,     z: 23, colorMode: 'lighten', opacityMode: 'body' },
  { filename: 'body_sin_mf',           layerGroup: 'body',      gene: 'body',   variant: 'sinuous',  modifier: null,     z: 24, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'body_sin_o',            layerGroup: 'body',      gene: 'body',   variant: 'sinuous',  modifier: null,     z: 25, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'body_stan_bf',          layerGroup: 'body',      gene: 'body',   variant: 'standard', modifier: null,     z: 23, colorMode: 'lighten', opacityMode: 'body' },
  { filename: 'body_stan_mf',          layerGroup: 'body',      gene: 'body',   variant: 'standard', modifier: null,     z: 24, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'body_stan_o',           layerGroup: 'body',      gene: 'body',   variant: 'standard', modifier: null,     z: 25, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'body_bulk_bf',          layerGroup: 'body',      gene: 'body',   variant: 'bulky',    modifier: null,     z: 23, colorMode: 'lighten', opacityMode: 'body' },
  { filename: 'body_bulk_mf',          layerGroup: 'body',      gene: 'body',   variant: 'bulky',    modifier: null,     z: 24, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'body_bulk_o',           layerGroup: 'body',      gene: 'body',   variant: 'bulky',    modifier: null,     z: 25, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── FG WINGS ────
  // Vestigial
  { filename: 'wing_fg_vest_inner_f',  layerGroup: 'front wing', gene: 'wing', variant: 'vestigial', modifier: null,    z: 26, colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_fg_vest_outer_f',  layerGroup: 'front wing', gene: 'wing', variant: 'vestigial', modifier: null,    z: 27, colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_fg_vest_outer_o',        layerGroup: 'front wing', gene: 'wing', variant: 'vestigial', modifier: null,    z: 28, colorMode: 'darken',  opacityMode: 'opaque' },
  // Two wings
  { filename: 'wing_fg_inner_f',       layerGroup: 'front wing', gene: 'wing', variant: 'two',       modifier: null,    z: 29, colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_fg_inner_o',       layerGroup: 'front wing', gene: 'wing', variant: 'two',       modifier: null,    z: 30, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'wing_fg_outer_f',       layerGroup: 'front wing', gene: 'wing', variant: 'two',       modifier: null,    z: 31, colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_fg_outer_o',       layerGroup: 'front wing', gene: 'wing', variant: 'two',       modifier: null,    z: 32, colorMode: 'darken',  opacityMode: 'opaque' },
  // Four wings
  { filename: 'wing_fg_inner_f',       layerGroup: 'front wing', gene: 'wing', variant: 'four',      modifier: null,    z: 33, colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_fg_inner_o',       layerGroup: 'front wing', gene: 'wing', variant: 'four',      modifier: null,    z: 34, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'wing_fg_outer_f',       layerGroup: 'front wing', gene: 'wing', variant: 'four',      modifier: null,    z: 35, colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_fg_outer_o',       layerGroup: 'front wing', gene: 'wing', variant: 'four',      modifier: null,    z: 36, colorMode: 'darken',  opacityMode: 'opaque' },
  // Six wings
  { filename: 'wing_fg_inner_f',       layerGroup: 'front wing', gene: 'wing', variant: 'six',       modifier: null,    z: 37, colorMode: 'lighten', opacityMode: 'wing' },
  { filename: 'wing_fg_inner_o',       layerGroup: 'front wing', gene: 'wing', variant: 'six',       modifier: null,    z: 38, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'wing_fg_outer_f',       layerGroup: 'front wing', gene: 'wing', variant: 'six',       modifier: null,    z: 39, colorMode: 'base',    opacityMode: 'wing' },
  { filename: 'wing_fg_outer_o',       layerGroup: 'front wing', gene: 'wing', variant: 'six',       modifier: null,    z: 40, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── FG LEGS ────
  { filename: 'leg_fg_f',              layerGroup: 'front leg',  gene: 'leg',  variant: 'two',       modifier: null,    z: 41, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'leg_fg_o',              layerGroup: 'front leg',  gene: 'leg',  variant: 'two',       modifier: null,    z: 42, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'leg_fg_f',              layerGroup: 'front leg',  gene: 'leg',  variant: 'four',      modifier: null,    z: 43, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'leg_fg_o',              layerGroup: 'front leg',  gene: 'leg',  variant: 'four',      modifier: null,    z: 44, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'leg_fg_f',              layerGroup: 'front leg',  gene: 'leg',  variant: 'six',       modifier: null,    z: 45, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'leg_fg_o',              layerGroup: 'front leg',  gene: 'leg',  variant: 'six',       modifier: null,    z: 46, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── TAIL SPINES (in front of tail) ────
  // Spike (outline-only, single layer)
  { filename: 'spine_spike_S',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'low',     z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_spike_M',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'medium',  z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_spike_L',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'tall',    z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  // Ridge (fill + outline)
  { filename: 'spine_ridge_S_f',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_ridge_S_o',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_ridge_M_f',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_ridge_M_o',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_ridge_L_f',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_ridge_L_o',       layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  // Sail (fill + outline)
  { filename: 'spine_sail_S_f',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sail_S_o',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_sail_M_f',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sail_M_o',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 50, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spine_sail_L_f',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sail_L_o',        layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 50, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── TAIL ────
  { filename: 'tail_whip_s_f',         layerGroup: 'tail',      gene: 'tail',   variant: 'whip',    modifier: 'short',   z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_whip_s_o',         layerGroup: 'tail',      gene: 'tail',   variant: 'whip',    modifier: 'short',   z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_whip_m_f',         layerGroup: 'tail',      gene: 'tail',   variant: 'whip',    modifier: 'medium',  z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_whip_m_o',         layerGroup: 'tail',      gene: 'tail',   variant: 'whip',    modifier: 'medium',  z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_whip_l_f',         layerGroup: 'tail',      gene: 'tail',   variant: 'whip',    modifier: 'long',    z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_whip_l_o',         layerGroup: 'tail',      gene: 'tail',   variant: 'whip',    modifier: 'long',    z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_normal_s_f',       layerGroup: 'tail',      gene: 'tail',   variant: 'normal',  modifier: 'short',   z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_normal_s_o',       layerGroup: 'tail',      gene: 'tail',   variant: 'normal',  modifier: 'short',   z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_normal_m_f',       layerGroup: 'tail',      gene: 'tail',   variant: 'normal',  modifier: 'medium',  z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_normal_m_o',       layerGroup: 'tail',      gene: 'tail',   variant: 'normal',  modifier: 'medium',  z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_normal_l_f',       layerGroup: 'tail',      gene: 'tail',   variant: 'normal',  modifier: 'long',    z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_normal_l_o',       layerGroup: 'tail',      gene: 'tail',   variant: 'normal',  modifier: 'long',    z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_heavy_s_f',        layerGroup: 'tail',      gene: 'tail',   variant: 'heavy',   modifier: 'short',   z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_heavy_s_o',        layerGroup: 'tail',      gene: 'tail',   variant: 'heavy',   modifier: 'short',   z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_heavy_m_f',        layerGroup: 'tail',      gene: 'tail',   variant: 'heavy',   modifier: 'medium',  z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_heavy_m_o',        layerGroup: 'tail',      gene: 'tail',   variant: 'heavy',   modifier: 'medium',  z: 49, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'tail_heavy_l_f',        layerGroup: 'tail',      gene: 'tail',   variant: 'heavy',   modifier: 'long',    z: 48, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'tail_heavy_l_o',        layerGroup: 'tail',      gene: 'tail',   variant: 'heavy',   modifier: 'long',    z: 49, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── HEAD ────
  { filename: 'head_f',                layerGroup: 'head',      gene: 'head',   variant: null,      modifier: null,      z: 51, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'head_o',                layerGroup: 'head',      gene: 'head',   variant: null,      modifier: null,      z: 52, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'head_d',                layerGroup: 'head',      gene: 'head',   variant: null,      modifier: null,      z: 53, colorMode: 'fixed',   opacityMode: 'opaque' },

  // ──── BG HORNS (behind head — far-side horn) ────
  // Smooth
  { filename: 'horns_bg_sm_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'forward', z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_sm_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'forward', z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_sm_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'up',      z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_sm_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'up',      z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_sm_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'back',    z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_sm_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'back',    z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  // Gnarled
  { filename: 'horns_bg_gn_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'forward', z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_gn_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'forward', z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_gn_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'up',      z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_gn_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'up',      z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_gn_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'back',    z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_gn_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'back',    z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  // Knobbed
  { filename: 'horns_bg_kn_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'forward', z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_kn_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'forward', z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_kn_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'up',      z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_kn_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'up',      z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_kn_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'back',    z: 54, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_kn_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'back',    z: 55, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── HEAD SPINES (on top of head — anchored relative to head_o like horns) ────
  // Spike (single layer — outline only)
  { filename: 'spinehead_spike_S',     layerGroup: 'spines',    gene: 'headspines', variant: 'spike',   modifier: 'low',     z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spinehead_spike_M',     layerGroup: 'spines',    gene: 'headspines', variant: 'spike',   modifier: 'medium',  z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spinehead_spike_L',     layerGroup: 'spines',    gene: 'headspines', variant: 'spike',   modifier: 'tall',    z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  // Ridge (fill + outline)
  { filename: 'spinehead_ridge_S_f',   layerGroup: 'spines',    gene: 'headspines', variant: 'ridge',   modifier: 'low',     z: 54, colorMode: 'body',    opacityMode: 'body' },
  { filename: 'spinehead_ridge_S_o',   layerGroup: 'spines',    gene: 'headspines', variant: 'ridge',   modifier: 'low',     z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spinehead_ridge_M_f',   layerGroup: 'spines',    gene: 'headspines', variant: 'ridge',   modifier: 'medium',  z: 54, colorMode: 'body',    opacityMode: 'body' },
  { filename: 'spinehead_ridge_M_o',   layerGroup: 'spines',    gene: 'headspines', variant: 'ridge',   modifier: 'medium',  z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spinehead_ridge_L_f',   layerGroup: 'spines',    gene: 'headspines', variant: 'ridge',   modifier: 'tall',    z: 54, colorMode: 'body',    opacityMode: 'body' },
  { filename: 'spinehead_ridge_L_o',   layerGroup: 'spines',    gene: 'headspines', variant: 'ridge',   modifier: 'tall',    z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  // Sail (fill + outline)
  { filename: 'spinehead_sail_S_f',    layerGroup: 'spines',    gene: 'headspines', variant: 'sail',    modifier: 'low',     z: 54, colorMode: 'body',    opacityMode: 'body' },
  { filename: 'spinehead_sail_S_o',    layerGroup: 'spines',    gene: 'headspines', variant: 'sail',    modifier: 'low',     z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spinehead_sail_M_f',    layerGroup: 'spines',    gene: 'headspines', variant: 'sail',    modifier: 'medium',  z: 54, colorMode: 'body',    opacityMode: 'body' },
  { filename: 'spinehead_sail_M_o',    layerGroup: 'spines',    gene: 'headspines', variant: 'sail',    modifier: 'medium',  z: 55, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'spinehead_sail_L_f',    layerGroup: 'spines',    gene: 'headspines', variant: 'sail',    modifier: 'tall',    z: 54, colorMode: 'body',    opacityMode: 'body' },
  { filename: 'spinehead_sail_L_o',    layerGroup: 'spines',    gene: 'headspines', variant: 'sail',    modifier: 'tall',    z: 55, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── FG HORNS (in front of head — near-side horn) ────
  // Smooth
  { filename: 'horns_fg_sm_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'forward', z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_sm_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'forward', z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_fg_sm_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'up',      z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_sm_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'up',      z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_fg_sm_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'back',    z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_sm_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'back',    z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  // Gnarled
  { filename: 'horns_fg_gn_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'forward', z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_gn_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'forward', z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_fg_gn_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'up',      z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_gn_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'up',      z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_fg_gn_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'back',    z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_gn_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'back',    z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  // Knobbed
  { filename: 'horns_fg_kn_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'forward', z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_kn_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'forward', z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_fg_kn_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'up',      z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_kn_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'up',      z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_fg_kn_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'back',    z: 56, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_fg_kn_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'back',    z: 57, colorMode: 'darken',  opacityMode: 'opaque' },
];

// ============================================================
// GENE MAPPING — how phenotype traits map to asset table values
// ============================================================
// The renderer needs to know which assets match a given dragon.
// This maps gene-config trait names → asset table gene/variant values.

// Wing count gene → wing variant name
const WING_VARIANT_MAP = {
  0: 'none',        // frame_wings rounded = 0
  1: 'vestigial',   // 1
  2: 'two',         // 2 (pair)
  3: 'four',        // 3 (quad)
  4: 'six',         // 4 (six)
};

// Limb count gene → leg variant name
const LEG_VARIANT_MAP = {
  0: 'none',        // frame_limbs rounded = 0 (limbless)
  1: 'two',         // 1 (wyvern = 2 legs)
  2: 'four',        // 2 (quadruped)
  3: 'six',         // 3 (hexapod)
};

// Body type gene → body variant name
const BODY_VARIANT_MAP = {
  'serpentine': 'sinuous',
  'normal': 'standard',
  'bulky': 'bulky',
};

// Horn style gene → horn variant name (gene-config uses 'sleek', CSV uses 'smooth')
const HORN_VARIANT_MAP = {
  'none': 'none',
  'sleek': 'smooth',
  'gnarled': 'gnarled',
  'knobbed': 'knobbed',
};

// Horn direction gene → horn modifier name
const HORN_DIR_MAP = {
  'forward': 'forward',
  'swept-back': 'back',
  'upward': 'up',
};

// Spine style gene → spine variant name
const SPINE_VARIANT_MAP = {
  'none': 'none',
  'ridge': 'ridge',
  'spikes': 'spike',
  'sail': 'sail',
};

// Spine height gene → spine modifier name
const SPINE_HEIGHT_MAP = {
  'low': 'low',
  'medium': 'medium',
  'tall': 'tall',
};

// Tail shape gene → tail variant name
const TAIL_VARIANT_MAP = {
  'whip': 'whip',
  'normal': 'normal',
  'heavy': 'heavy',
};

// Tail length gene → tail modifier name
const TAIL_LENGTH_MAP = {
  'short': 'short',
  'medium': 'medium',
  'long': 'long',
};

/**
 * Resolve which assets from ASSET_TABLE apply to a given phenotype.
 * Returns an array of matching entries sorted by z-order.
 */
export function resolveAssetsForPhenotype(phenotype) {
  const t = phenotype.traits;

  // Extract trait values
  const wingCount = t.frame_wings?.rounded ?? 2;
  const wingVariant = WING_VARIANT_MAP[wingCount] || 'two';

  const limbCount = t.frame_limbs?.rounded ?? 2;

  const bodyTypeName = t.body_type?.name?.toLowerCase() || 'normal';
  const bodyVariant = BODY_VARIANT_MAP[bodyTypeName] || 'standard';

  const hornStyleName = t.horn_style?.name?.toLowerCase() || 'none';
  const hornVariant = HORN_VARIANT_MAP[hornStyleName] || 'none';
  const hornDirName = t.horn_direction?.name?.toLowerCase() || 'forward';
  const hornModifier = HORN_DIR_MAP[hornDirName] || 'forward';

  const spineStyleName = t.spine_style?.name?.toLowerCase() || 'none';
  const spineVariant = SPINE_VARIANT_MAP[spineStyleName] || 'none';
  const spineHeightName = t.spine_height?.name?.toLowerCase() || 'medium';
  const spineModifier = SPINE_HEIGHT_MAP[spineHeightName] || 'medium';

  const tailShapeName = t.tail_shape?.name?.toLowerCase() || 'normal';
  const tailVariant = TAIL_VARIANT_MAP[tailShapeName] || 'normal';
  const tailLengthName = t.tail_length?.name?.toLowerCase() || 'medium';
  const tailModifier = TAIL_LENGTH_MAP[tailLengthName] || 'medium';

  // For wings: determine which BG/FG variants to include.
  // Each variant name ('two','four','six') occupies a distinct z-range in
  // ASSET_TABLE but reuses the same PNG filenames. Adding multiple variants
  // to both bg and fg creates multiple pairs, each positioned by its own
  // anchor key (e.g. wing_bg_outer_f:p1:standard:4w, :p2:standard:4w).
  // - vestigial (1): BG vest + FG vest (single pair)
  // - two (2): 1 pair each side
  // - four (3): 2 pairs each side
  // - six (4): 3 pairs each side

  const bgWingVariants = [];
  const fgWingVariants = [];

  if (wingCount === 0) {
    // No wings
  } else if (wingCount === 1) {
    bgWingVariants.push('vestigial');
    fgWingVariants.push('vestigial');
  } else if (wingCount === 2) {
    // Single pair: bg + fg both use 'two'
    bgWingVariants.push('two');
    fgWingVariants.push('two');
  } else if (wingCount === 3) {
    // Quad: 2 pairs each side (variant order = pair number)
    bgWingVariants.push('two');
    bgWingVariants.push('four');
    fgWingVariants.push('two');
    fgWingVariants.push('four');
  } else if (wingCount >= 4) {
    // Six: 3 pairs each side (variant order = pair number)
    bgWingVariants.push('two');
    bgWingVariants.push('four');
    bgWingVariants.push('six');
    fgWingVariants.push('two');
    fgWingVariants.push('four');
    fgWingVariants.push('six');
  }

  // For legs: determine which variants to include (mirrors wing logic)
  // Each limb count adds progressively: wyvern=1 pair, quad=2 pairs, hex=3 pairs
  const bgLegVariants = [];
  const fgLegVariants = [];

  if (limbCount >= 1) { // wyvern (2 legs) = pair 1
    bgLegVariants.push('two');
    fgLegVariants.push('two');
  }
  if (limbCount >= 2) { // quadruped (4 legs) = + pair 2
    bgLegVariants.push('four');
    fgLegVariants.push('four');
  }
  if (limbCount >= 3) { // hexapod (6 legs) = + pair 3
    bgLegVariants.push('six');
    fgLegVariants.push('six');
  }

  // Filter the asset table
  const matched = [];

  for (const asset of ASSET_TABLE) {
    let match = false;

    switch (asset.gene) {
      case 'wing':
        if (asset.layerGroup === 'back wing') {
          match = bgWingVariants.includes(asset.variant);
        } else if (asset.layerGroup === 'front wing') {
          match = fgWingVariants.includes(asset.variant);
        }
        break;

      case 'leg':
        if (limbCount === 0) break; // limbless, no legs
        if (asset.layerGroup === 'back leg') {
          match = bgLegVariants.includes(asset.variant);
        } else if (asset.layerGroup === 'front leg') {
          match = fgLegVariants.includes(asset.variant);
        }
        break;

      case 'body':
        match = asset.variant === bodyVariant;
        break;

      case 'spines':
        if (spineVariant === 'none') break;
        match = asset.variant === spineVariant && asset.modifier === spineModifier;
        break;

      case 'headspines':
        if (spineVariant === 'none') break;
        match = asset.variant === spineVariant && asset.modifier === spineModifier;
        break;

      case 'head':
        match = true; // head always renders
        break;

      case 'horns':
        if (hornVariant === 'none') break;
        match = asset.variant === hornVariant && asset.modifier === hornModifier;
        break;

      case 'tail':
        match = asset.variant === tailVariant && asset.modifier === tailModifier;
        break;
    }

    if (match) {
      matched.push({ ...asset });
    }
  }

  // Sort by z-order
  matched.sort((a, b) => a.z - b.z);

  // Annotate pair numbers for wings and legs.
  // Within each (gene, layerGroup), count distinct variants in order —
  // the variant's position becomes its pair number.
  for (const group of ['back wing', 'front wing', 'back leg', 'front leg']) {
    const variants = [];
    for (const asset of matched) {
      if (asset.layerGroup === group && !variants.includes(asset.variant)) {
        variants.push(asset.variant);
      }
    }
    for (const asset of matched) {
      if (asset.layerGroup === group) {
        asset.pair = variants.indexOf(asset.variant) + 1;
      }
    }
  }

  // Attach spine placement data so the renderer can stamp multiple copies.
  // Look up pre-computed positions for this body+tail combo.
  const spinePlacementKey = `${bodyVariant}:${tailVariant}_${tailModifier}`;
  const placements = getSpinePlacements()[spinePlacementKey];
  if (placements && placements.length > 0) {
    for (const asset of matched) {
      if (asset.gene === 'spines') {
        asset._spinePlacements = placements;
      }
    }
  }

  return matched;
}

// ============================================================
// COLOR ADJUSTMENT AMOUNTS
// ============================================================
export const COLOR_ADJUSTMENTS = {
  base:    { luminanceShift: 0 },
  lighten: { luminanceShift: 0.15 },   // belly, wing inner membrane — 15% lighter
  darken:  { luminanceShift: -0.25 },  // outlines — 25% darker
  horn:    { luminanceShift: -0.10 },  // horn fills — subtle darken, between base and outline
  fixed:   null,                       // no color processing (eyes, mouth)
};

// Layer 2 outline corrections: extra sat/lum shifts applied ONLY to
// outlines in the transparent compositing path (Layer 2) so they
// visually match the Layer 4 surface outlines.
export const LAYER2_OUTLINE_CORRECTION = {
  saturationShift: 0.76,
  luminanceShift:  0.22,
};

// ============================================================
// TRANSPARENCY per finish opacity level
// ============================================================
export const BODY_TRANSPARENCY = {
  0: 0.10,  // None (Phantom etc.) — nearly invisible, ghostly
  1: 0.20,  // Low (Seaglass, Translucent etc.) — quite transparent
  2: 0.50,  // Med (Cloudy, Frosted etc.) — semi-transparent
  3: 1.00,  // High (Enamel, Velvet etc.) — fully opaque
};

export const WING_TRANSPARENCY = {
  0: 0.05,  // None — barely visible gossamer
  1: 0.10,  // Low — delicate translucent membrane
  2: 0.35,  // Med — semi-sheer
  3: 0.75,  // High — mostly opaque but still slightly translucent
};

// ============================================================
// FINISH EFFECTS — shimmer/animation configs per finish type
// ============================================================
export const FINISH_EFFECTS = {
  metallic:    { type: 'gradient_sweep', speed: 0.3,  intensity: 0.4, blendMode: 'hard-light' },
  lustrous:    { type: 'shine_pulse',    speed: 0.2,  intensity: 0.2, blendMode: 'overlay' },
  schiller:    { type: 'hue_shift',      speed: 0.15, hueRange: 60,   blendMode: 'color' },
  crystalline: { type: 'sparkle',        speed: 0.5,  count: 8, intensity: 0.6, blendMode: 'screen' },
  ghostly:     { type: 'opacity_pulse',  speed: 0.1,  range: [0.3, 0.7] },
};

export function getFinishEffect(finishDisplayName) {
  const name = finishDisplayName.toLowerCase();
  if (['metallic', 'polished', 'chrome', 'mirror', 'sterling'].some(k => name.includes(k)))   return FINISH_EFFECTS.metallic;
  if (['lustrous', 'satin', 'enamel', 'lacquer', 'glazed'].some(k => name.includes(k)))       return FINISH_EFFECTS.lustrous;
  if (['shifting', 'iridescent', 'prismatic', 'mother of pearl'].some(k => name.includes(k))) return FINISH_EFFECTS.schiller;
  if (['crystal', 'glass', 'diamond', 'gem'].some(k => name.includes(k)))                     return FINISH_EFFECTS.crystalline;
  if (['phantom', 'spectral', 'ghost', 'ethereal'].some(k => name.includes(k)))               return FINISH_EFFECTS.ghostly;
  return null;
}

// ============================================================
// QUEST SPARKLE EFFECT — applied to dragon sprites that fully match a pinned quest
// ============================================================
export const QUEST_SPARKLE_EFFECT = {
  type: 'sparkle',
  speed: 0.4,
  count: 12,
  intensity: 0.7,
  blendMode: 'screen',
};

// ============================================================
// SPRITE CANVAS DIMENSIONS
// ============================================================
// Full composition canvas — matches the artist's original canvas size.
// Rendered at full res then scaled down via CSS for display.
export const SPRITE_WIDTH = 2752;
export const SPRITE_HEIGHT = 2064;
export const SPRITE_WIDTH_COMPACT = 688;
export const SPRITE_HEIGHT_COMPACT = 516;

// ============================================================
// SPINE PLACEMENTS — computed from spine-placement tool's curve data
// ============================================================
// Reads the saved curve data from localStorage (dragon-spine-paths-v1)
// and computes positions on the fly using shared spine math.
// Key: "bodyType:tailVariant_tailLength" → array of { x, y, rot, scale, wid }

let _spinePlacementCache = null;

export function getSpinePlacements() {
  if (_spinePlacementCache) return _spinePlacementCache;

  const result = {};
  try {
    // spine-storage.js already merges JSON file + IndexedDB data
    const allPaths = _loadSpinePaths();
    for (const [pathKey, data] of Object.entries(allPaths)) {
      if (!data.controlPoints || data.controlPoints.length < 2) continue;
      // pathKey format: "body:tail_length_spine_height"
      // renderer key: "body:tail_length" (first two parts joined by _)
      const parts = pathKey.split('_');
      const rendererKey = `${parts[0]}_${parts[1]}`;
      // Only compute once per renderer key (first path wins)
      if (result[rendererKey]) continue;
      const positions = _computeSpinePos(data);
      if (positions.length > 0) {
        result[rendererKey] = positions;
      }
    }
  } catch (e) {
    console.warn('Failed to load spine placements:', e);
  }

  _spinePlacementCache = result;
  return result;
}

// Call this to clear the cache (e.g. if spine-placement tool updates data)
export function invalidateSpinePlacementCache() {
  _spinePlacementCache = null;
}

// Ensure storage is ready before first render
export { _spineStorageReady as spineStorageReady };

// Re-export anchor storage (reads from data/sprite-anchors.json)
export { getAnchor, getGroupAnchor, anchorStorageReady };

// ANCHORS removed — now loaded from data/sprite-anchors.json via anchor-storage.js
// (see getAnchor and anchorStorageReady re-exports above)
