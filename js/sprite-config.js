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
  { filename: 'spine_r_low',           layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_r_medium',        layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_r_tall',          layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_low',          layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'low',     z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_medium',       layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'medium',  z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_tall',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'tall',    z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_low',          layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_medium',       layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 22, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_tall',         layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 22, colorMode: 'base',    opacityMode: 'body' },

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

  // ──── TAIL SPINES (between fg legs and tail — behind tail) ────
  { filename: 'spine_r_low',           layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_r_medium',        layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_r_tall',          layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_low',          layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'low',     z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_medium',       layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'medium',  z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_tall',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'tall',    z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_low',          layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_medium',       layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 47, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_tall',         layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 47, colorMode: 'base',    opacityMode: 'body' },

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
  { filename: 'head_f',                layerGroup: 'head',      gene: 'head',   variant: null,      modifier: null,      z: 50, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'head_o',                layerGroup: 'head',      gene: 'head',   variant: null,      modifier: null,      z: 51, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'head_d',                layerGroup: 'head',      gene: 'head',   variant: null,      modifier: null,      z: 52, colorMode: 'fixed',   opacityMode: 'opaque' },

  // ──── BG HORNS (behind head — far-side horn) ────
  // Smooth
  { filename: 'horns_bg_sm_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'forward', z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_sm_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'forward', z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_sm_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'up',      z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_sm_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'up',      z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_sm_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'back',    z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_sm_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'smooth',  modifier: 'back',    z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  // Gnarled
  { filename: 'horns_bg_gn_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'forward', z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_gn_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'forward', z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_gn_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'up',      z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_gn_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'up',      z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_gn_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'back',    z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_gn_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'gnarled', modifier: 'back',    z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  // Knobbed
  { filename: 'horns_bg_kn_for_f',      layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'forward', z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_kn_for_o',      layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'forward', z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_kn_up_f',       layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'up',      z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_kn_up_o',       layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'up',      z: 54, colorMode: 'darken',  opacityMode: 'opaque' },
  { filename: 'horns_bg_kn_back_f',     layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'back',    z: 53, colorMode: 'horn',    opacityMode: 'body' },
  { filename: 'horns_bg_kn_back_o',     layerGroup: 'horns',     gene: 'horns',  variant: 'knobbed', modifier: 'back',    z: 54, colorMode: 'darken',  opacityMode: 'opaque' },

  // ──── HEAD SPINES (on top of head) ────
  { filename: 'spine_r_low',           layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'low',     z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_r_medium',        layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'medium',  z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_r_tall',          layerGroup: 'spines',    gene: 'spines', variant: 'ridge',   modifier: 'tall',    z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_low',          layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'low',     z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_medium',       layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'medium',  z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sp_tall',         layerGroup: 'spines',    gene: 'spines', variant: 'spike',   modifier: 'tall',    z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_low',          layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'low',     z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_medium',       layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'medium',  z: 55, colorMode: 'base',    opacityMode: 'body' },
  { filename: 'spine_sa_tall',         layerGroup: 'spines',    gene: 'spines', variant: 'sail',    modifier: 'tall',    z: 55, colorMode: 'base',    opacityMode: 'body' },

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

// ============================================================
// TRANSPARENCY per finish opacity level
// ============================================================
export const BODY_TRANSPARENCY = {
  0: 0.10,  // None (Phantom etc.) — nearly invisible, ghostly
  1: 0.30,  // Low (Seaglass, Translucent etc.) — quite transparent
  2: 0.60,  // Med (Cloudy, Frosted etc.) — semi-transparent
  3: 1.00,  // High (Enamel, Velvet etc.) — fully opaque
};

export const WING_TRANSPARENCY = {
  0: 0.05,  // None — barely visible gossamer
  1: 0.20,  // Low — delicate translucent membrane
  2: 0.45,  // Med — semi-sheer
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
// ANCHOR POSITIONS — where each trimmed PNG sits on the canvas
// ============================================================
// Key: filename (without .png) → { x, y } pixel offset on composition canvas.
// Parts not listed here default to { x: 0, y: 0 }.
// We'll tune these in batches using the sprite test page.
//
// Strategy: body is the anchor reference. Everything else positions relative to body.
// Body is centered in the composition canvas. Head attaches to body's left,
// tail to the right, wings above, legs below.

export const ANCHORS = {
  'body_bulk_bf':                                    { x: 833, y: 1016 },
  'body_bulk_mf':                                    { x: 821, y: 887 },
  'body_bulk_o':                                     { x: 827, y: 863 },
  'body_sin_bf':                                     { x: 897, y: 1007 },
  'body_sin_mf':                                     { x: 964, y: 878 },
  'body_sin_o':                                      { x: 842, y: 860 },
  'body_stan_bf':                                    { x: 834, y: 1019 },
  'body_stan_mf':                                    { x: 923, y: 897 },
  'body_stan_o':                                     { x: 843, y: 863 },
  'head_d:bulky':                                    { x: 719, y: 873 },
  'head_d:sinuous':                                  { x: 762, y: 852 },
  'head_d:standard':                                 { x: 719, y: 859 },
  'head_f:bulky':                                    { x: 658, y: 747 },
  'head_f:sinuous':                                  { x: 701, y: 726 },
  'head_f:standard':                                 { x: 658, y: 733 },
  'head_o:bulky':                                    { x: 658, y: 738 },
  'head_o:sinuous':                                  { x: 701, y: 717 },
  'head_o:standard':                                 { x: 658, y: 724 },
  'horns_bg_gn_back_f':                              { x: 97, y: -158 },
  'horns_bg_gn_back_o':                              { x: 88, y: -169 },
  'horns_bg_gn_for_f':                               { x: -43, y: -106 },
  'horns_bg_gn_for_o':                               { x: -57, y: -115 },
  'horns_bg_gn_up_f':                                { x: 119, y: -158 },
  'horns_bg_gn_up_o':                                { x: 98, y: -170 },
  'horns_bg_kn_back_f':                              { x: 45, y: -145 },
  'horns_bg_kn_back_o':                              { x: 37, y: -150 },
  'horns_bg_kn_for_f':                               { x: 20, y: -112 },
  'horns_bg_kn_for_o':                               { x: -19, y: -115 },
  'horns_bg_kn_up_f':                                { x: 80, y: -190 },
  'horns_bg_kn_up_o':                                { x: 77, y: -209 },
  'horns_bg_sm_back_f':                              { x: 93, y: -179 },
  'horns_bg_sm_back_o':                              { x: 93, y: -218 },
  'horns_bg_sm_for_f':                               { x: 7, y: -122 },
  'horns_bg_sm_for_o':                               { x: -43, y: -127 },
  'horns_bg_sm_up_f':                                { x: 115, y: -99 },
  'horns_bg_sm_up_o':                                { x: 107, y: -124 },
  'horns_fg_gn_back_f':                              { x: 313, y: -111 },
  'horns_fg_gn_back_o':                              { x: 304, y: -114 },
  'horns_fg_gn_for_f':                               { x: 220, y: -84 },
  'horns_fg_gn_for_o':                               { x: 209, y: -90 },
  'horns_fg_gn_up_f':                                { x: 315, y: -94 },
  'horns_fg_gn_up_o':                                { x: 301, y: -116 },
  'horns_fg_kn_back_f':                              { x: 300, y: -79 },
  'horns_fg_kn_back_o':                              { x: 295, y: -84 },
  'horns_fg_kn_for_f':                               { x: 180, y: -90 },
  'horns_fg_kn_for_o':                               { x: 165, y: -84 },
  'horns_fg_kn_up_f':                                { x: 300, y: -146 },
  'horns_fg_kn_up_o':                                { x: 290, y: -174 },
  'horns_fg_sm_back_f':                              { x: 317, y: -139 },
  'horns_fg_sm_back_o':                              { x: 303, y: -178 },
  'horns_fg_sm_for_f':                               { x: 191, y: -87 },
  'horns_fg_sm_for_o':                               { x: 39, y: -84 },
  'horns_fg_sm_up_f':                                { x: 315, y: -73 },
  'horns_fg_sm_up_o':                                { x: 307, y: -99 },
  'leg_bg_f:p1:bulky:2l':                            { x: 1013, y: 1338 },
  'leg_bg_f:p1:bulky:4l':                            { x: 958, y: 1323 },
  'leg_bg_f:p1:bulky:6l':                            { x: 1197, y: 1314 },
  'leg_bg_f:p1:sinuous:2l':                          { x: 1117, y: 1341 },
  'leg_bg_f:p1:sinuous:4l':                          { x: 912, y: 1310 },
  'leg_bg_f:p1:sinuous:6l':                          { x: 1160, y: 1270 },
  'leg_bg_f:p1:standard:2l':                         { x: 1072, y: 1384 },
  'leg_bg_f:p1:standard:4l':                         { x: 1353, y: 1304 },
  'leg_bg_f:p1:standard:6l':                         { x: 854, y: 1295 },
  'leg_bg_f:p2:bulky:4l':                            { x: 1381, y: 1341 },
  'leg_bg_f:p2:bulky:6l':                            { x: 1457, y: 1323 },
  'leg_bg_f:p2:sinuous:4l':                          { x: 1350, y: 1332 },
  'leg_bg_f:p2:sinuous:6l':                          { x: 1488, y: 1301 },
  'leg_bg_f:p2:standard:4l':                         { x: 912, y: 1292 },
  'leg_bg_f:p2:standard:6l':                         { x: 1170, y: 1292 },
  'leg_bg_f:p3:bulky:6l':                            { x: 931, y: 1313 },
  'leg_bg_f:p3:sinuous:6l':                          { x: 805, y: 1271 },
  'leg_bg_f:p3:standard:6l':                         { x: 1473, y: 1292 },
  'leg_bg_o:p1:bulky:2l':                            { x: 1004, y: 1381 },
  'leg_bg_o:p1:bulky:4l':                            { x: 949, y: 1366 },
  'leg_bg_o:p1:bulky:6l':                            { x: 1188, y: 1357 },
  'leg_bg_o:p1:sinuous:2l':                          { x: 1108, y: 1384 },
  'leg_bg_o:p1:sinuous:4l':                          { x: 903, y: 1353 },
  'leg_bg_o:p1:sinuous:6l':                          { x: 1151, y: 1313 },
  'leg_bg_o:p1:standard:2l':                         { x: 1063, y: 1427 },
  'leg_bg_o:p1:standard:4l':                         { x: 1344, y: 1347 },
  'leg_bg_o:p1:standard:6l':                         { x: 845, y: 1338 },
  'leg_bg_o:p2:bulky:4l':                            { x: 1372, y: 1384 },
  'leg_bg_o:p2:bulky:6l':                            { x: 1448, y: 1366 },
  'leg_bg_o:p2:sinuous:4l':                          { x: 1341, y: 1375 },
  'leg_bg_o:p2:sinuous:6l':                          { x: 1479, y: 1344 },
  'leg_bg_o:p2:standard:4l':                         { x: 903, y: 1335 },
  'leg_bg_o:p2:standard:6l':                         { x: 1161, y: 1335 },
  'leg_bg_o:p3:bulky:6l':                            { x: 922, y: 1356 },
  'leg_bg_o:p3:sinuous:6l':                          { x: 796, y: 1314 },
  'leg_bg_o:p3:standard:6l':                         { x: 1464, y: 1335 },
  'leg_fg_f:p1:bulky:2l':                            { x: 1298, y: 1350 },
  'leg_fg_f:p1:bulky:4l':                            { x: 1050, y: 1332 },
  'leg_fg_f:p1:bulky:6l':                            { x: 1509, y: 1322 },
  'leg_fg_f:p1:sinuous:2l':                          { x: 1341, y: 1353 },
  'leg_fg_f:p1:sinuous:4l':                          { x: 1451, y: 1330 },
  'leg_fg_f:p1:sinuous:6l':                          { x: 869, y: 1271 },
  'leg_fg_f:p1:standard:2l':                         { x: 1285, y: 1387 },
  'leg_fg_f:p1:standard:4l':                         { x: 1010, y: 1292 },
  'leg_fg_f:p1:standard:6l':                         { x: 1261, y: 1295 },
  'leg_fg_f:p2:bulky:4l':                            { x: 1469, y: 1347 },
  'leg_fg_f:p2:bulky:6l':                            { x: 1001, y: 1316 },
  'leg_fg_f:p2:sinuous:4l':                          { x: 1001, y: 1322 },
  'leg_fg_f:p2:sinuous:6l':                          { x: 1231, y: 1286 },
  'leg_fg_f:p2:standard:4l':                         { x: 1451, y: 1313 },
  'leg_fg_f:p2:standard:6l':                         { x: 1555, y: 1292 },
  'leg_fg_f:p3:bulky:6l':                            { x: 1255, y: 1323 },
  'leg_fg_f:p3:sinuous:6l':                          { x: 1561, y: 1314 },
  'leg_fg_f:p3:standard:6l':                         { x: 927, y: 1292 },
  'leg_fg_o:p1:bulky:2l':                            { x: 1286, y: 1393 },
  'leg_fg_o:p1:bulky:4l':                            { x: 1038, y: 1375 },
  'leg_fg_o:p1:bulky:6l':                            { x: 1497, y: 1365 },
  'leg_fg_o:p1:sinuous:2l':                          { x: 1329, y: 1396 },
  'leg_fg_o:p1:sinuous:4l':                          { x: 1439, y: 1373 },
  'leg_fg_o:p1:sinuous:6l':                          { x: 857, y: 1314 },
  'leg_fg_o:p1:standard:2l':                         { x: 1273, y: 1430 },
  'leg_fg_o:p1:standard:4l':                         { x: 998, y: 1335 },
  'leg_fg_o:p1:standard:6l':                         { x: 1249, y: 1338 },
  'leg_fg_o:p2:bulky:4l':                            { x: 1457, y: 1390 },
  'leg_fg_o:p2:bulky:6l':                            { x: 989, y: 1359 },
  'leg_fg_o:p2:sinuous:4l':                          { x: 989, y: 1365 },
  'leg_fg_o:p2:sinuous:6l':                          { x: 1219, y: 1329 },
  'leg_fg_o:p2:standard:4l':                         { x: 1439, y: 1356 },
  'leg_fg_o:p2:standard:6l':                         { x: 1543, y: 1335 },
  'leg_fg_o:p3:bulky:6l':                            { x: 1243, y: 1366 },
  'leg_fg_o:p3:sinuous:6l':                          { x: 1549, y: 1357 },
  'leg_fg_o:p3:standard:6l':                         { x: 915, y: 1335 },
  'tail_heavy_l_f:bulky':                            { x: 1779, y: 1136 },
  'tail_heavy_l_f:sinuous':                          { x: 1797, y: 1188 },
  'tail_heavy_l_f:standard':                         { x: 1717, y: 1212 },
  'tail_heavy_l_o:bulky':                            { x: 1770, y: 1130 },
  'tail_heavy_l_o:sinuous':                          { x: 1788, y: 1182 },
  'tail_heavy_l_o:standard':                         { x: 1708, y: 1206 },
  'tail_heavy_m_f:bulky':                            { x: 1754, y: 1116 },
  'tail_heavy_m_f:sinuous':                          { x: 1785, y: 1154 },
  'tail_heavy_m_f:standard':                         { x: 1681, y: 1182 },
  'tail_heavy_m_o:bulky':                            { x: 1757, y: 1107 },
  'tail_heavy_m_o:sinuous':                          { x: 1788, y: 1145 },
  'tail_heavy_m_o:standard':                         { x: 1684, y: 1173 },
  'tail_heavy_s_f:bulky':                            { x: 1782, y: 998 },
  'tail_heavy_s_f:sinuous':                          { x: 1827, y: 1056 },
  'tail_heavy_s_f:standard':                         { x: 1761, y: 1071 },
  'tail_heavy_s_o:bulky':                            { x: 1813, y: 992 },
  'tail_heavy_s_o:sinuous':                          { x: 1858, y: 1050 },
  'tail_heavy_s_o:standard':                         { x: 1792, y: 1065 },
  'tail_normal_l_f:bulky':                           { x: 1158, y: 1111 },
  'tail_normal_l_f:sinuous':                         { x: 1225, y: 1194 },
  'tail_normal_l_f:standard':                        { x: 1143, y: 1213 },
  'tail_normal_l_o:bulky':                           { x: 968, y: 1102 },
  'tail_normal_l_o:sinuous':                         { x: 1035, y: 1185 },
  'tail_normal_l_o:standard':                        { x: 953, y: 1204 },
  'tail_normal_m_f:bulky':                           { x: 1760, y: 1135 },
  'tail_normal_m_f:sinuous':                         { x: 1825, y: 1197 },
  'tail_normal_m_f:standard':                        { x: 1743, y: 1212 },
  'tail_normal_m_o:bulky':                           { x: 1742, y: 1126 },
  'tail_normal_m_o:sinuous':                         { x: 1807, y: 1188 },
  'tail_normal_m_o:standard':                        { x: 1725, y: 1203 },
  'tail_normal_s_f:bulky':                           { x: 1770, y: 1142 },
  'tail_normal_s_f:sinuous':                         { x: 1813, y: 1197 },
  'tail_normal_s_f:standard':                        { x: 1743, y: 1215 },
  'tail_normal_s_o:bulky':                           { x: 1788, y: 1136 },
  'tail_normal_s_o:sinuous':                         { x: 1831, y: 1191 },
  'tail_normal_s_o:standard':                        { x: 1761, y: 1209 },
  'tail_whip_l_f:bulky':                             { x: 1125, y: 1106 },
  'tail_whip_l_f:sinuous':                           { x: 1195, y: 1206 },
  'tail_whip_l_f:standard':                          { x: 1110, y: 1213 },
  'tail_whip_l_o:bulky':                             { x: 1091, y: 1103 },
  'tail_whip_l_o:sinuous':                           { x: 1161, y: 1203 },
  'tail_whip_l_o:standard':                          { x: 1076, y: 1210 },
  'tail_whip_m_f:bulky':                             { x: 1795, y: 1176 },
  'tail_whip_m_f:sinuous':                           { x: 1850, y: 1218 },
  'tail_whip_m_f:standard':                          { x: 1762, y: 1228 },
  'tail_whip_m_o:bulky':                             { x: 1819, y: 1170 },
  'tail_whip_m_o:sinuous':                           { x: 1874, y: 1212 },
  'tail_whip_m_o:standard':                          { x: 1786, y: 1222 },
  'tail_whip_s_f:bulky':                             { x: 1785, y: 1118 },
  'tail_whip_s_f:sinuous':                           { x: 1865, y: 1203 },
  'tail_whip_s_f:standard':                          { x: 1776, y: 1212 },
  'tail_whip_s_o:bulky':                             { x: 1776, y: 1115 },
  'tail_whip_s_o:sinuous':                           { x: 1856, y: 1200 },
  'tail_whip_s_o:standard':                          { x: 1767, y: 1209 },
  'wing_bg_inner_f:p1:bulky:2w':                     { x: 1187, y: 414, rot: -13 },
  'wing_bg_inner_f:p1:bulky:4w':                     { x: 1020, y: 453, rot: -21 },
  'wing_bg_inner_f:p1:bulky:6w':                     { x: 732, y: 603, rot: -39 },
  'wing_bg_inner_f:p1:sinuous:2w':                   { x: 1197, y: 554, rot: -18 },
  'wing_bg_inner_f:p1:sinuous:4w':                   { x: 1688, y: 567, rot: -3 },
  'wing_bg_inner_f:p1:sinuous:6w':                   { x: 848, y: 675, rot: -31 },
  'wing_bg_inner_f:p1:standard:2w':                  { x: 1212, y: 478, rot: -8 },
  'wing_bg_inner_f:p1:standard:4w':                  { x: 1470, y: 521, rot: -6 },
  'wing_bg_inner_f:p1:standard:6w':                  { x: 761, y: 719, rot: -40 },
  'wing_bg_inner_f:p2:bulky:4w':                     { x: 1605, y: 457, rot: -1 },
  'wing_bg_inner_f:p2:bulky:6w':                     { x: 1283, y: 401, rot: -7 },
  'wing_bg_inner_f:p2:sinuous:4w':                   { x: 1186, y: 551, rot: -10 },
  'wing_bg_inner_f:p2:sinuous:6w':                   { x: 1359, y: 516, rot: -5 },
  'wing_bg_inner_f:p2:standard:4w':                  { x: 931, y: 551, rot: -25 },
  'wing_bg_inner_f:p2:standard:6w':                  { x: 1290, y: 489, rot: -7 },
  'wing_bg_inner_f:p3:bulky:6w':                     { x: 1850, y: 451, rot: 15 },
  'wing_bg_inner_f:p3:sinuous:6w':                   { x: 1876, y: 532, rot: 10 },
  'wing_bg_inner_f:p3:standard:6w':                  { x: 1669, y: 532, rot: 4 },
  'wing_bg_inner_o:p1:bulky:2w':                     { x: 1067, y: 375, rot: -13 },
  'wing_bg_inner_o:p1:bulky:4w':                     { x: 900, y: 414, rot: -21 },
  'wing_bg_inner_o:p1:bulky:6w':                     { x: 612, y: 564, rot: -39 },
  'wing_bg_inner_o:p1:sinuous:2w':                   { x: 1077, y: 515, rot: -18 },
  'wing_bg_inner_o:p1:sinuous:4w':                   { x: 1568, y: 528, rot: -3 },
  'wing_bg_inner_o:p1:sinuous:6w':                   { x: 728, y: 636, rot: -31 },
  'wing_bg_inner_o:p1:standard:2w':                  { x: 1092, y: 439, rot: -8 },
  'wing_bg_inner_o:p1:standard:4w':                  { x: 1350, y: 482, rot: -6 },
  'wing_bg_inner_o:p1:standard:6w':                  { x: 641, y: 680, rot: -40 },
  'wing_bg_inner_o:p2:bulky:4w':                     { x: 1485, y: 418, rot: -1 },
  'wing_bg_inner_o:p2:bulky:6w':                     { x: 1163, y: 362, rot: -7 },
  'wing_bg_inner_o:p2:sinuous:4w':                   { x: 1066, y: 512, rot: -10 },
  'wing_bg_inner_o:p2:sinuous:6w':                   { x: 1239, y: 477, rot: -5 },
  'wing_bg_inner_o:p2:standard:4w':                  { x: 811, y: 512, rot: -25 },
  'wing_bg_inner_o:p2:standard:6w':                  { x: 1170, y: 450, rot: -7 },
  'wing_bg_inner_o:p3:bulky:6w':                     { x: 1730, y: 412, rot: 15 },
  'wing_bg_inner_o:p3:sinuous:6w':                   { x: 1756, y: 493, rot: 10 },
  'wing_bg_inner_o:p3:standard:6w':                  { x: 1549, y: 493, rot: 4 },
  'wing_bg_outer_f:p1:bulky:2w':                     { x: 1073, y: 378, rot: -13 },
  'wing_bg_outer_f:p1:bulky:4w':                     { x: 906, y: 417, rot: -21 },
  'wing_bg_outer_f:p1:bulky:6w':                     { x: 618, y: 567, rot: -39 },
  'wing_bg_outer_f:p1:sinuous:2w':                   { x: 1083, y: 518, rot: -18 },
  'wing_bg_outer_f:p1:sinuous:4w':                   { x: 1574, y: 531, rot: -3 },
  'wing_bg_outer_f:p1:sinuous:6w':                   { x: 734, y: 639, rot: -31 },
  'wing_bg_outer_f:p1:standard:2w':                  { x: 1098, y: 442, rot: -8 },
  'wing_bg_outer_f:p1:standard:4w':                  { x: 1356, y: 485, rot: -6 },
  'wing_bg_outer_f:p1:standard:6w':                  { x: 647, y: 683, rot: -40 },
  'wing_bg_outer_f:p2:bulky:4w':                     { x: 1491, y: 421, rot: -1 },
  'wing_bg_outer_f:p2:bulky:6w':                     { x: 1169, y: 365, rot: -7 },
  'wing_bg_outer_f:p2:sinuous:4w':                   { x: 1072, y: 515, rot: -10 },
  'wing_bg_outer_f:p2:sinuous:6w':                   { x: 1245, y: 480, rot: -5 },
  'wing_bg_outer_f:p2:standard:4w':                  { x: 817, y: 515, rot: -25 },
  'wing_bg_outer_f:p2:standard:6w':                  { x: 1176, y: 453, rot: -7 },
  'wing_bg_outer_f:p3:bulky:6w':                     { x: 1736, y: 415, rot: 15 },
  'wing_bg_outer_f:p3:sinuous:6w':                   { x: 1762, y: 496, rot: 10 },
  'wing_bg_outer_f:p3:standard:6w':                  { x: 1555, y: 496, rot: 4 },
  'wing_bg_outer_o:p1:bulky:2w':                     { x: 1067, y: 375, rot: -13 },
  'wing_bg_outer_o:p1:bulky:4w':                     { x: 900, y: 414, rot: -21 },
  'wing_bg_outer_o:p1:bulky:6w':                     { x: 612, y: 564, rot: -39 },
  'wing_bg_outer_o:p1:sinuous:2w':                   { x: 1077, y: 515, rot: -18 },
  'wing_bg_outer_o:p1:sinuous:4w':                   { x: 1568, y: 528, rot: -3 },
  'wing_bg_outer_o:p1:sinuous:6w':                   { x: 728, y: 636, rot: -31 },
  'wing_bg_outer_o:p1:standard:2w':                  { x: 1092, y: 439, rot: -8 },
  'wing_bg_outer_o:p1:standard:4w':                  { x: 1350, y: 482, rot: -6 },
  'wing_bg_outer_o:p1:standard:6w':                  { x: 641, y: 680, rot: -40 },
  'wing_bg_outer_o:p2:bulky:4w':                     { x: 1485, y: 418, rot: -1 },
  'wing_bg_outer_o:p2:bulky:6w':                     { x: 1163, y: 362, rot: -7 },
  'wing_bg_outer_o:p2:sinuous:4w':                   { x: 1066, y: 512, rot: -10 },
  'wing_bg_outer_o:p2:sinuous:6w':                   { x: 1239, y: 477, rot: -5 },
  'wing_bg_outer_o:p2:standard:4w':                  { x: 811, y: 512, rot: -25 },
  'wing_bg_outer_o:p2:standard:6w':                  { x: 1170, y: 450, rot: -7 },
  'wing_bg_outer_o:p3:bulky:6w':                     { x: 1730, y: 412, rot: 15 },
  'wing_bg_outer_o:p3:sinuous:6w':                   { x: 1756, y: 493, rot: 10 },
  'wing_bg_outer_o:p3:standard:6w':                  { x: 1549, y: 493, rot: 4 },
  'wing_bg_vest_inner_f:bulky':                      { x: 1161, y: 834 },
  'wing_bg_vest_inner_f:sinuous':                    { x: 1267, y: 975 },
  'wing_bg_vest_inner_f:standard':                   { x: 1278, y: 946 },
  'wing_bg_vest_outer_f:bulky':                      { x: 1117, y: 824 },
  'wing_bg_vest_outer_f:sinuous':                    { x: 1223, y: 965 },
  'wing_bg_vest_outer_f:standard':                   { x: 1234, y: 936 },
  'wing_bg_vest_outer_o:bulky':                      { x: 1115, y: 796 },
  'wing_bg_vest_outer_o:sinuous':                    { x: 1221, y: 937 },
  'wing_bg_vest_outer_o:standard':                   { x: 1232, y: 908 },
  'wing_fg_inner_f:p1:bulky:2w':                     { x: 1581, y: 453, rot: 8 },
  'wing_fg_inner_f:p1:bulky:4w':                     { x: 1232, y: 439, rot: -12 },
  'wing_fg_inner_f:p1:bulky:6w':                     { x: 961, y: 508, rot: -23 },
  'wing_fg_inner_f:p1:sinuous:2w':                   { x: 1518, y: 569 },
  'wing_fg_inner_f:p1:sinuous:4w':                   { x: 1868, y: 578, rot: 4 },
  'wing_fg_inner_f:p1:sinuous:6w':                   { x: 980, y: 695, rot: -26 },
  'wing_fg_inner_f:p1:standard:2w':                  { x: 1391, y: 502 },
  'wing_fg_inner_f:p1:standard:4w':                  { x: 1804, y: 562, rot: 12 },
  'wing_fg_inner_f:p1:standard:6w':                  { x: 936, y: 669, rot: -29 },
  'wing_fg_inner_f:p2:bulky:4w':                     { x: 1832, y: 512, rot: 6 },
  'wing_fg_inner_f:p2:bulky:6w':                     { x: 1476, y: 456 },
  'wing_fg_inner_f:p2:sinuous:4w':                   { x: 1336, y: 546, rot: -6 },
  'wing_fg_inner_f:p2:sinuous:6w':                   { x: 1579, y: 565, rot: 5 },
  'wing_fg_inner_f:p2:standard:4w':                  { x: 1332, y: 500 },
  'wing_fg_inner_f:p2:standard:6w':                  { x: 1443, y: 527 },
  'wing_fg_inner_f:p3:bulky:6w':                     { x: 1887, y: 524, rot: 10 },
  'wing_fg_inner_f:p3:sinuous:6w':                   { x: 2056, y: 600, rot: 19 },
  'wing_fg_inner_f:p3:standard:6w':                  { x: 1975, y: 589, rot: 21 },
  'wing_fg_inner_o:p1:bulky:2w':                     { x: 1667, y: 453, rot: 8 },
  'wing_fg_inner_o:p1:bulky:4w':                     { x: 1318, y: 439, rot: -12 },
  'wing_fg_inner_o:p1:bulky:6w':                     { x: 1047, y: 508, rot: -23 },
  'wing_fg_inner_o:p1:sinuous:2w':                   { x: 1604, y: 569 },
  'wing_fg_inner_o:p1:sinuous:4w':                   { x: 1954, y: 578, rot: 4 },
  'wing_fg_inner_o:p1:sinuous:6w':                   { x: 1066, y: 695, rot: -26 },
  'wing_fg_inner_o:p1:standard:2w':                  { x: 1477, y: 502 },
  'wing_fg_inner_o:p1:standard:4w':                  { x: 1890, y: 562, rot: 12 },
  'wing_fg_inner_o:p1:standard:6w':                  { x: 1022, y: 669, rot: -29 },
  'wing_fg_inner_o:p2:bulky:4w':                     { x: 1918, y: 512, rot: 6 },
  'wing_fg_inner_o:p2:bulky:6w':                     { x: 1562, y: 456 },
  'wing_fg_inner_o:p2:sinuous:4w':                   { x: 1422, y: 546, rot: -6 },
  'wing_fg_inner_o:p2:sinuous:6w':                   { x: 1665, y: 565, rot: 5 },
  'wing_fg_inner_o:p2:standard:4w':                  { x: 1418, y: 500 },
  'wing_fg_inner_o:p2:standard:6w':                  { x: 1529, y: 527 },
  'wing_fg_inner_o:p3:bulky:6w':                     { x: 1973, y: 524, rot: 10 },
  'wing_fg_inner_o:p3:sinuous:6w':                   { x: 2142, y: 600, rot: 19 },
  'wing_fg_inner_o:p3:standard:6w':                  { x: 2061, y: 589, rot: 21 },
  'wing_fg_outer_f:p1:bulky:2w':                     { x: 1443, y: 419, rot: 8 },
  'wing_fg_outer_f:p1:bulky:4w':                     { x: 1094, y: 405, rot: -12 },
  'wing_fg_outer_f:p1:bulky:6w':                     { x: 823, y: 474, rot: -23 },
  'wing_fg_outer_f:p1:sinuous:2w':                   { x: 1380, y: 535 },
  'wing_fg_outer_f:p1:sinuous:4w':                   { x: 1730, y: 544, rot: 4 },
  'wing_fg_outer_f:p1:sinuous:6w':                   { x: 842, y: 661, rot: -26 },
  'wing_fg_outer_f:p1:standard:2w':                  { x: 1253, y: 468 },
  'wing_fg_outer_f:p1:standard:4w':                  { x: 1666, y: 528, rot: 12 },
  'wing_fg_outer_f:p1:standard:6w':                  { x: 798, y: 635, rot: -29 },
  'wing_fg_outer_f:p2:bulky:4w':                     { x: 1694, y: 478, rot: 6 },
  'wing_fg_outer_f:p2:bulky:6w':                     { x: 1338, y: 422 },
  'wing_fg_outer_f:p2:sinuous:4w':                   { x: 1198, y: 512, rot: -6 },
  'wing_fg_outer_f:p2:sinuous:6w':                   { x: 1441, y: 531, rot: 5 },
  'wing_fg_outer_f:p2:standard:4w':                  { x: 1194, y: 466 },
  'wing_fg_outer_f:p2:standard:6w':                  { x: 1305, y: 493 },
  'wing_fg_outer_f:p3:bulky:6w':                     { x: 1749, y: 490, rot: 10 },
  'wing_fg_outer_f:p3:sinuous:6w':                   { x: 1918, y: 566, rot: 19 },
  'wing_fg_outer_f:p3:standard:6w':                  { x: 1837, y: 555, rot: 21 },
  'wing_fg_outer_o:p1:bulky:2w':                     { x: 1443, y: 419, rot: 8 },
  'wing_fg_outer_o:p1:bulky:4w':                     { x: 1094, y: 405, rot: -12 },
  'wing_fg_outer_o:p1:bulky:6w':                     { x: 823, y: 474, rot: -23 },
  'wing_fg_outer_o:p1:sinuous:2w':                   { x: 1380, y: 535 },
  'wing_fg_outer_o:p1:sinuous:4w':                   { x: 1730, y: 544, rot: 4 },
  'wing_fg_outer_o:p1:sinuous:6w':                   { x: 842, y: 661, rot: -26 },
  'wing_fg_outer_o:p1:standard:2w':                  { x: 1253, y: 468 },
  'wing_fg_outer_o:p1:standard:4w':                  { x: 1666, y: 528, rot: 12 },
  'wing_fg_outer_o:p1:standard:6w':                  { x: 798, y: 635, rot: -29 },
  'wing_fg_outer_o:p2:bulky:4w':                     { x: 1694, y: 478, rot: 6 },
  'wing_fg_outer_o:p2:bulky:6w':                     { x: 1338, y: 422 },
  'wing_fg_outer_o:p2:sinuous:4w':                   { x: 1198, y: 512, rot: -6 },
  'wing_fg_outer_o:p2:sinuous:6w':                   { x: 1441, y: 531, rot: 5 },
  'wing_fg_outer_o:p2:standard:4w':                  { x: 1194, y: 466 },
  'wing_fg_outer_o:p2:standard:6w':                  { x: 1305, y: 493 },
  'wing_fg_outer_o:p3:bulky:6w':                     { x: 1749, y: 490, rot: 10 },
  'wing_fg_outer_o:p3:sinuous:6w':                   { x: 1918, y: 566, rot: 19 },
  'wing_fg_outer_o:p3:standard:6w':                  { x: 1837, y: 555, rot: 21 },
  'wing_fg_vest_inner_f:bulky':                      { x: 1299, y: 824 },
  'wing_fg_vest_inner_f:sinuous':                    { x: 1362, y: 968 },
  'wing_fg_vest_inner_f:standard':                   { x: 1372, y: 956 },
  'wing_fg_vest_outer_f:bulky':                      { x: 1247, y: 824 },
  'wing_fg_vest_outer_f:sinuous':                    { x: 1310, y: 968 },
  'wing_fg_vest_outer_f:standard':                   { x: 1320, y: 956 },
  'wing_fg_vest_outer_o:bulky':                      { x: 1237, y: 790 },
  'wing_fg_vest_outer_o:sinuous':                    { x: 1300, y: 934 },
  'wing_fg_vest_outer_o:standard':                   { x: 1310, y: 922 },
};

/**
 * Get the anchor position for a given asset.
 * Supports composite keys for config-aware placement:
 *   filename:p{N}:{bodyType}:{count}w  — wings (pair + body type + wing count)
 *   filename:p{N}:{bodyType}:{count}l  — legs (pair + body type + limb count)
 *   filename:p{N}:{bodyType}           — wings/legs fallback (v4 compat)
 *   filename:{bodyType}                — head/tail/vestigial (body type only)
 *   filename                           — body/horns (bare key)
 *
 * Falls back through less-specific keys for backward compatibility.
 *
 * @param {string} filename - PNG filename without extension
 * @param {object} context - optional context for composite key lookup
 * @param {string} context.bodyType - 'standard'|'sinuous'|'bulky'
 * @param {number} context.pair - pair number (1, 2, 3) for wings/legs
 * @param {number} context.wingCount - actual wing count (2, 4, 6) for wings
 * @param {number} context.limbCount - actual limb count (2, 4, 6) for legs
 * @returns {{ x: number, y: number, rot?: number }}
 */
export function getAnchor(filename, context = {}) {
  const { bodyType, pair, wingCount, limbCount } = context;

  // Most specific: pair + bodyType + config count
  if (pair && bodyType && wingCount) {
    const key = `${filename}:p${pair}:${bodyType}:${wingCount}w`;
    if (ANCHORS[key]) return ANCHORS[key];
  }
  if (pair && bodyType && limbCount) {
    const key = `${filename}:p${pair}:${bodyType}:${limbCount}l`;
    if (ANCHORS[key]) return ANCHORS[key];
  }

  // Fallback: pair + bodyType (v4 backward compat)
  if (pair && bodyType) {
    const key = `${filename}:p${pair}:${bodyType}`;
    if (ANCHORS[key]) return ANCHORS[key];
  }
  if (bodyType) {
    const key = `${filename}:${bodyType}`;
    if (ANCHORS[key]) return ANCHORS[key];
  }

  // Fall back to bare filename (backward compatible)
  return ANCHORS[filename] || { x: 0, y: 0 };
}
