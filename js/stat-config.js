// stat-config.js — Combat stat derivation from phenotype
// Implements the full stat system from combat_stats.md
//
// All base values and modifier tables are defined here.
// Combat engine consumes the output; UI displays it.

// ─── Helpers ────────────────────────────────────────────────

/** Round averaged allele level to nearest discrete tier: 0=None, 1=Low, 2=Mid, 3=High */
function tier(level) {
  return Math.round(Math.min(3, Math.max(0, level)));
}

/** Safe trait getter — returns rounded (linear) or level (categorical), defaulting to 0. */
function traitVal(traits, key) {
  const t = traits[key];
  if (!t) return 0;
  return t.rounded !== undefined ? t.rounded : t.level;
}

// ─── Lookup Tables ──────────────────────────────────────────

const SIZE_HP = { 1: 40, 2: 60, 3: 80, 4: 100, 5: 150, 6: 220 };

const PIGMENT_RESISTANCE = { 0: 0, 1: 8, 2: 16, 3: 25 }; // percentage

// ─── Main Derivation ────────────────────────────────────────

/**
 * Derive full combat stats from a resolved phenotype object.
 * @param {Object} phenotype — from resolveFullPhenotype(genotype)
 * @returns {Object} combat stats
 */
export function deriveCombatStats(phenotype) {
  const t = phenotype.traits || {};
  const get = (key) => traitVal(t, key);

  // Accumulators (percentage modifiers applied at end)
  let hpPct = 0;   // additive % modifier for HP
  let spdPct = 0;  // additive % modifier for Speed

  // ── BASE STATS ──
  let hp        = SIZE_HP[get('body_size')] || 100;
  let armor     = 0;
  let speed     = 100;
  let evasion   = 0;   // percentage points
  let accuracy  = 80;  // percentage
  let height    = 1;   // 0=Ground, 1=Low, 2=Mid, 3=High
  let melee     = 10;
  let breath    = 0;
  let thorns    = 0;
  let breathReflect = 0; // percentage
  let fireResist      = 0;
  let iceResist       = 0;
  let lightningResist = 0;

  // ════════════════════════════════════════════════════════════
  //  BODY SYSTEM
  // ════════════════════════════════════════════════════════════

  // Body Type: 1=Sinuous, 2=Normal, 3=Bulky
  const bodyType = get('body_type');
  if (bodyType === 1) { hpPct -= 10; spdPct += 15; evasion += 10; }
  else if (bodyType === 3) { hpPct += 15; armor += 5; spdPct -= 10; }

  // Limb Count: 0=Limbless, 1=Wyvern(2), 2=Quadruped(4), 3=Hexapod(6)
  const limbs = get('frame_limbs');
  if (limbs === 0)      { evasion += 10; }
  else if (limbs === 1) { accuracy += 5; }
  else if (limbs === 2) { accuracy += 10; melee += 2; }
  else if (limbs === 3) { accuracy += 15; melee += 4; }

  // ════════════════════════════════════════════════════════════
  //  FRAME SYSTEM
  // ════════════════════════════════════════════════════════════

  // Wings: 0=None, 1=Vestigial, 2=Pair, 3=Quad, 4=Six
  const wings = get('frame_wings');
  let wingHeightMod = 0;
  if (wings <= 1) {
    // None or Vestigial → forced to Ground
    wingHeightMod = -99; // sentinel: will force Ground below
  } else if (wings === 2) { spdPct += 10; wingHeightMod = 1; }
  else if (wings === 3)   { spdPct += 15; wingHeightMod = 2; }
  else if (wings >= 4)    { spdPct += 20; wingHeightMod = 2; }

  // Bone Density: 1=Lightweight, 2=Standard, 3=Dense
  const bones = get('frame_bones');
  let boneHeightMod = 0;
  if (bones === 1)      { armor -= 3; boneHeightMod = 1; }
  else if (bones === 3) { armor += 5;  boneHeightMod = -1; }

  // Height calc
  if (wings <= 1) {
    height = 0; // No wings → Ground, overrides bone density
  } else {
    height = 1 + wingHeightMod + boneHeightMod;
    height = Math.max(0, Math.min(3, height));
  }

  // ════════════════════════════════════════════════════════════
  //  SCALES SYSTEM
  // ════════════════════════════════════════════════════════════

  // Scale Type: 1=Smooth, 2=Textured, 3=Armored
  const scales = get('body_scales');
  if (scales === 1)      { spdPct += 10; }
  else if (scales === 2) { armor += 5; }
  else if (scales === 3) { armor += 15; spdPct -= 5; }

  // Color (CMY) → Elemental Resistance
  if (phenotype.color && phenotype.color.levels) {
    const [cLvl, mLvl, yLvl] = phenotype.color.levels;
    iceResist       = PIGMENT_RESISTANCE[tier(cLvl)]  || 0;
    fireResist      = PIGMENT_RESISTANCE[tier(mLvl)]  || 0;
    lightningResist = PIGMENT_RESISTANCE[tier(yLvl)]  || 0;
  }

  // Finish → double-ended combat effects
  let breathDmgPctFromFinish = 0;
  if (phenotype.finish && phenotype.finish.levels) {
    const [opacity, shine, schiller] = phenotype.finish.levels;
    const oT  = tier(opacity);
    const shT = tier(shine);
    const scT = tier(schiller);

    // Opacity: transparent → evasion, opaque → armor
    if (oT === 0) evasion += 15;
    else if (oT === 1) evasion += 10;
    else if (oT === 3) armor += 5;

    // Shine: matte → accuracy, reflective → breath reflect
    if (shT === 0) accuracy += 10;
    else if (shT === 1) accuracy += 5;
    else if (shT === 3) breathReflect += 15;

    // Schiller: static → melee, iridescent → breath %
    if (scT === 0) melee += 3;
    else if (scT === 1) melee += 1;
    else if (scT === 3) breathDmgPctFromFinish = 15;
  }

  // ════════════════════════════════════════════════════════════
  //  SUB SYSTEMS
  // ════════════════════════════════════════════════════════════

  // Horn Style: 0=None, 1=Sleek, 2=Gnarled, 3=Knobbed
  const hornStyle = get('horn_style');
  if (hornStyle === 1)      { spdPct += 5; accuracy += 5; }
  else if (hornStyle === 2) { melee += 3; thorns += 2; }
  else if (hornStyle === 3) { armor += 3; }

  // Horn Direction: 0=Forward, 1=Swept-back, 2=Upright (only if horns exist)
  const hornDir = get('horn_direction');
  let breathDmgPctFromHorns = 0;
  if (hornStyle > 0) {
    if (hornDir === 0)      { melee += 3; }
    else if (hornDir === 1) { spdPct += 5; }
    else if (hornDir === 2) { breathDmgPctFromHorns = 15; }
  }

  // Spine Style × Spine Height
  const spineStyle  = get('spine_style');  // 0=None, 1=Ridge, 2=Spikes, 3=Sail
  const spineHeight = get('spine_height'); // 1=Low, 2=Medium, 3=Tall

  if (spineStyle === 1) { // Ridge → Armor
    armor += ({ 1: 2, 2: 4, 3: 6 })[spineHeight] || 0;
  } else if (spineStyle === 2) { // Spikes → Thorns + Melee
    thorns += ({ 1: 1, 2: 3, 3: 5 })[spineHeight] || 0;
    melee  += ({ 1: 1, 2: 2, 3: 3 })[spineHeight] || 0;
  } else if (spineStyle === 3) { // Sail → Speed + Evasion
    spdPct  += ({ 1: 3, 2: 6, 3: 10 })[spineHeight] || 0;
    evasion += ({ 1: 3, 2: 5, 3: 8 })[spineHeight]  || 0;
    if (spineHeight === 3) armor -= 3; // Tall sail vulnerability
  }

  // Tail Shape × Tail Length
  const tailShape  = get('tail_shape');  // 1=Whip, 2=Normal, 3=Heavy
  const tailLength = get('tail_length'); // 1=Short, 2=Medium, 3=Long

  if (tailShape === 1) { // Whip → Speed + Evasion
    spdPct  += ({ 1: 3, 2: 5, 3: 8 })[tailLength] || 0;
    evasion += ({ 1: 3, 2: 5, 3: 8 })[tailLength] || 0;
  } else if (tailShape === 3) { // Heavy → Tank stats, Speed penalty
    spdPct += ({ 1: -3, 2: -5, 3: -8 })[tailLength] || 0;
    melee  += ({ 1: 2,  2: 3,  3: 5  })[tailLength] || 0;
    hp     += ({ 1: 5,  2: 10, 3: 15 })[tailLength] || 0; // flat HP (before %)
    armor  += ({ 1: 2,  2: 3,  3: 5  })[tailLength] || 0;
  }

  // ════════════════════════════════════════════════════════════
  //  BREATH SYSTEM
  // ════════════════════════════════════════════════════════════

  let fireLvl = 0, iceLvl = 0, lightningLvl = 0;
  if (phenotype.breathElement && phenotype.breathElement.levels) {
    [fireLvl, iceLvl, lightningLvl] = phenotype.breathElement.levels.map(l => tier(l));
  }

  const totalElementPoints = fireLvl + iceLvl + lightningLvl;
  const isVoid   = totalElementPoints === 0;
  const isPlasma = fireLvl > 0 && fireLvl === iceLvl && iceLvl === lightningLvl;

  // Raw breath damage
  if (isVoid) {
    breath = 18; // Void special: flat 18, bypasses resistance
  } else {
    breath = totalElementPoints * 2;
    if (isPlasma) breath = Math.round(breath * 1.2); // +20%
  }

  // Breath multipliers from traits (multiplicative with each other)
  let breathMult = 1.0;
  if (breathDmgPctFromHorns > 0)  breathMult *= (1 + breathDmgPctFromHorns / 100);
  if (breathDmgPctFromFinish > 0) breathMult *= (1 + breathDmgPctFromFinish / 100);
  breath = Math.round(breath * breathMult);

  // Element type name
  let breathType = 'Null';
  if (phenotype.breathElement) {
    breathType = phenotype.breathElement.name || 'Null';
    if (isVoid) breathType = 'Void';
  }

  // Element debuff config
  const elementDebuff = deriveElementDebuff(fireLvl, iceLvl, lightningLvl, isVoid, isPlasma);

  // Breath shape & range
  const breathShape = get('breath_shape'); // 1=Single, 2=Multi, 3=AoE
  const breathRange = get('breath_range'); // 1=Close, 2=Mid, 3=Far

  // ════════════════════════════════════════════════════════════
  //  APPLY PERCENTAGE MODIFIERS & CLAMP
  // ════════════════════════════════════════════════════════════

  hp    = Math.round(hp * (1 + hpPct / 100));
  speed = Math.round(speed * (1 + spdPct / 100));

  armor   = Math.max(0, armor);
  speed   = Math.max(1, speed);
  evasion = Math.max(0, Math.min(80, evasion));
  accuracy = Math.max(10, accuracy);

  return {
    hp, armor, speed, evasion, accuracy, height,
    meleeDamage: melee,
    breathDamage: breath,
    thorns, breathReflect,
    fireResist, iceResist, lightningResist,
    breathType, breathShape, breathRange,
    elementDebuff,
    isVoid, isPlasma,
    // Diagnostic info for UI
    fireLvl, iceLvl, lightningLvl,
    totalElementPoints,
    hpPct, spdPct,
  };
}

// ─── Stat Breakdown (traces which traits contribute what) ───

/**
 * Returns a breakdown of stat contributions per trait.
 * Each stat key maps to an array of { source: string, value: number|string }.
 */
export function deriveStatBreakdown(phenotype) {
  const t = phenotype.traits || {};
  const get = (key) => traitVal(t, key);
  const name = (key) => {
    const tr = t[key];
    return tr ? (tr.name || `Lv${tr.level}`) : '?';
  };

  const bd = {
    hp: [], armor: [], speed: [], evasion: [], accuracy: [],
    melee: [], thorns: [], breath: [], height: [],
  };

  // ── BASE ──
  const sizeHp = SIZE_HP[get('body_size')] || 100;
  bd.hp.push({ source: `${name('body_size')} (size)`, value: sizeHp, base: true });
  bd.speed.push({ source: 'Base', value: 100, base: true });
  bd.accuracy.push({ source: 'Base', value: 80, base: true });
  bd.melee.push({ source: 'Base', value: 10, base: true });

  // ── BODY TYPE ──
  const bodyType = get('body_type');
  if (bodyType === 1) {
    bd.hp.push({ source: 'Sinuous', value: '-10%' });
    bd.speed.push({ source: 'Sinuous', value: '+15%' });
    bd.evasion.push({ source: 'Sinuous', value: 10 });
  } else if (bodyType === 3) {
    bd.hp.push({ source: 'Bulky', value: '+15%' });
    bd.armor.push({ source: 'Bulky', value: 5 });
    bd.speed.push({ source: 'Bulky', value: '-10%' });
  }

  // ── LIMBS ──
  const limbs = get('frame_limbs');
  if (limbs === 0) bd.evasion.push({ source: 'Limbless', value: 10 });
  else if (limbs === 1) bd.accuracy.push({ source: 'Wyvern', value: 5 });
  else if (limbs === 2) { bd.accuracy.push({ source: 'Quadruped', value: 10 }); bd.melee.push({ source: 'Quadruped', value: 2 }); }
  else if (limbs === 3) { bd.accuracy.push({ source: 'Hexapod', value: 15 }); bd.melee.push({ source: 'Hexapod', value: 4 }); }

  // ── WINGS ──
  const wings = get('frame_wings');
  if (wings <= 1) {
    bd.height.push({ source: wings === 0 ? 'No wings' : 'Vestigial', value: 'Ground' });
  } else {
    if (wings === 2) bd.speed.push({ source: 'Pair wings', value: '+10%' });
    else if (wings === 3) bd.speed.push({ source: 'Quad wings', value: '+15%' });
    else if (wings >= 4) bd.speed.push({ source: 'Six wings', value: '+20%' });
    const wH = wings >= 3 ? 2 : 1;
    bd.height.push({ source: name('frame_wings'), value: `+${wH}` });
  }

  // ── BONES ──
  const bones = get('frame_bones');
  if (bones === 1) { bd.armor.push({ source: 'Lightweight', value: -3 }); bd.height.push({ source: 'Lightweight', value: '+1' }); }
  else if (bones === 3) { bd.armor.push({ source: 'Dense', value: 5 }); bd.height.push({ source: 'Dense', value: '-1' }); }

  // ── SCALES ──
  const scales = get('body_scales');
  if (scales === 1) bd.speed.push({ source: 'Smooth', value: '+10%' });
  else if (scales === 2) bd.armor.push({ source: 'Textured', value: 5 });
  else if (scales === 3) { bd.armor.push({ source: 'Armored', value: 15 }); bd.speed.push({ source: 'Armored', value: '-5%' }); }

  // ── FINISH ──
  if (phenotype.finish && phenotype.finish.levels) {
    const [opacity, shine, schiller] = phenotype.finish.levels;
    const oT = tier(opacity), shT = tier(shine), scT = tier(schiller);
    if (oT === 0) bd.evasion.push({ source: 'Transparent', value: 15 });
    else if (oT === 1) bd.evasion.push({ source: 'Translucent', value: 10 });
    else if (oT === 3) bd.armor.push({ source: 'Opaque', value: 5 });
    if (shT === 0) bd.accuracy.push({ source: 'Matte', value: 10 });
    else if (shT === 1) bd.accuracy.push({ source: 'Lustrous', value: 5 });
    if (scT === 0) bd.melee.push({ source: 'Static', value: 3 });
    else if (scT === 1) bd.melee.push({ source: 'Shifting', value: 1 });
    else if (scT === 3) bd.breath.push({ source: 'Iridescent', value: '×1.15' });
  }

  // ── HORNS ──
  const hornStyle = get('horn_style');
  const hornDir = get('horn_direction');
  if (hornStyle === 1) { bd.speed.push({ source: 'Sleek horns', value: '+5%' }); bd.accuracy.push({ source: 'Sleek horns', value: 5 }); }
  else if (hornStyle === 2) { bd.melee.push({ source: 'Gnarled', value: 3 }); bd.thorns.push({ source: 'Gnarled', value: 2 }); }
  else if (hornStyle === 3) bd.armor.push({ source: 'Knobbed', value: 3 });
  if (hornStyle > 0) {
    if (hornDir === 0) bd.melee.push({ source: 'Forward horns', value: 3 });
    else if (hornDir === 1) bd.speed.push({ source: 'Swept-back', value: '+5%' });
    else if (hornDir === 2) bd.breath.push({ source: 'Upright horns', value: '×1.15' });
  }

  // ── SPINES ──
  const spineStyle = get('spine_style');
  const spineHeight = get('spine_height');
  const hLabel = name('spine_height');
  if (spineStyle === 1) {
    const v = ({ 1: 2, 2: 4, 3: 6 })[spineHeight] || 0;
    if (v) bd.armor.push({ source: `Ridge (${hLabel})`, value: v });
  } else if (spineStyle === 2) {
    const th = ({ 1: 1, 2: 3, 3: 5 })[spineHeight] || 0;
    const ml = ({ 1: 1, 2: 2, 3: 3 })[spineHeight] || 0;
    if (th) bd.thorns.push({ source: `Spikes (${hLabel})`, value: th });
    if (ml) bd.melee.push({ source: `Spikes (${hLabel})`, value: ml });
  } else if (spineStyle === 3) {
    const sp = ({ 1: 3, 2: 6, 3: 10 })[spineHeight] || 0;
    const ev = ({ 1: 3, 2: 5, 3: 8 })[spineHeight] || 0;
    if (sp) bd.speed.push({ source: `Sail (${hLabel})`, value: `+${sp}%` });
    if (ev) bd.evasion.push({ source: `Sail (${hLabel})`, value: ev });
    if (spineHeight === 3) bd.armor.push({ source: 'Tall Sail', value: -3 });
  }

  // ── TAIL ──
  const tailShape = get('tail_shape');
  const tailLength = get('tail_length');
  const tLabel = name('tail_length');
  if (tailShape === 1) {
    const sp = ({ 1: 3, 2: 5, 3: 8 })[tailLength] || 0;
    const ev = ({ 1: 3, 2: 5, 3: 8 })[tailLength] || 0;
    if (sp) bd.speed.push({ source: `Whip (${tLabel})`, value: `+${sp}%` });
    if (ev) bd.evasion.push({ source: `Whip (${tLabel})`, value: ev });
  } else if (tailShape === 3) {
    const sp = ({ 1: -3, 2: -5, 3: -8 })[tailLength] || 0;
    const ml = ({ 1: 2, 2: 3, 3: 5 })[tailLength] || 0;
    const hpF = ({ 1: 5, 2: 10, 3: 15 })[tailLength] || 0;
    const arm = ({ 1: 2, 2: 3, 3: 5 })[tailLength] || 0;
    if (sp) bd.speed.push({ source: `Heavy tail (${tLabel})`, value: `${sp}%` });
    if (ml) bd.melee.push({ source: `Heavy tail (${tLabel})`, value: ml });
    if (hpF) bd.hp.push({ source: `Heavy tail (${tLabel})`, value: hpF });
    if (arm) bd.armor.push({ source: `Heavy tail (${tLabel})`, value: arm });
  }

  // ── BREATH RANGE PENALTY ──
  const breathRange = get('breath_range');
  if (breathRange === 3) bd.accuracy.push({ source: 'Far range', value: -15 });

  return bd;
}

// ─── Element Debuff Derivation ──────────────────────────────

function deriveElementDebuff(fireLvl, iceLvl, lightningLvl, isVoid, isPlasma) {
  if (isVoid || isPlasma) return null;

  const hasF = fireLvl > 0;
  const hasI = iceLvl > 0;
  const hasL = lightningLvl > 0;
  const activeCount = [hasF, hasI, hasL].filter(Boolean).length;

  if (activeCount === 1) {
    // Pure element debuffs
    if (hasF) {
      return {
        type: 'burn', emoji: '🔥', label: 'Burn',
        dotDamage: ({ 1: 1, 2: 2, 3: 3 })[fireLvl],
        duration:  ({ 1: 2, 2: 3, 3: 4 })[fireLvl],
        desc: `${({ 1: 1, 2: 2, 3: 3 })[fireLvl]} dmg/turn for ${({ 1: 2, 2: 3, 3: 4 })[fireLvl]} turns`,
      };
    }
    if (hasI) {
      return {
        type: 'slow', emoji: '❄️', label: 'Slow',
        speedReduction: ({ 1: 5, 2: 10, 3: 15 })[iceLvl],
        duration:       ({ 1: 2, 2: 3, 3: 4 })[iceLvl],
        desc: `-${({ 1: 5, 2: 10, 3: 15 })[iceLvl]}% Speed for ${({ 1: 2, 2: 3, 3: 4 })[iceLvl]} turns`,
      };
    }
    if (hasL) {
      return {
        type: 'stun', emoji: '⚡', label: 'Stun',
        skipChance: ({ 1: 5, 2: 10, 3: 15 })[lightningLvl],
        duration:   ({ 1: 2, 2: 3, 3: 4 })[lightningLvl],
        desc: `${({ 1: 5, 2: 10, 3: 15 })[lightningLvl]}% skip chance for ${({ 1: 2, 2: 3, 3: 4 })[lightningLvl]} turns`,
      };
    }
  }

  if (activeCount === 2) {
    if (hasF && hasI) { // Steam → Accuracy debuff
      const lower = Math.min(fireLvl, iceLvl);
      return {
        type: 'steam', emoji: '💨', label: 'Steam',
        accuracyReduction: ({ 1: 5, 2: 10, 3: 15 })[lower],
        duration: 3,
        desc: `-${({ 1: 5, 2: 10, 3: 15 })[lower]}% Accuracy for 3 turns`,
      };
    }
    if (hasF && hasL) { // Solar → Armor pierce
      const lower = Math.min(fireLvl, lightningLvl);
      return {
        type: 'solar', emoji: '☀️', label: 'Solar Pierce',
        armorPierce: ({ 1: 3, 2: 6, 3: 10 })[lower],
        duration: 3,
        desc: `Ignore ${({ 1: 3, 2: 6, 3: 10 })[lower]} Armor for 3 turns`,
      };
    }
    if (hasI && hasL) { // Aurora → Vulnerability
      const lower = Math.min(iceLvl, lightningLvl);
      return {
        type: 'aurora', emoji: '🌌', label: 'Aurora',
        damageAmplify: ({ 1: 8, 2: 15, 3: 25 })[lower],
        duration: 3,
        desc: `+${({ 1: 8, 2: 15, 3: 25 })[lower]}% damage taken for 3 turns`,
      };
    }
  }

  // 3 elements but unequal (not Plasma) → no debuff
  return null;
}

// ─── Element Resistance Lookup ──────────────────────────────

/**
 * Get the target's resistance % against a given breath element.
 * Multi-element breaths check each contributing resistance.
 */
export function getElementResistance(targetStats, breathType) {
  if (!breathType || breathType === 'Null' || breathType === 'Void') return 0;

  // Map breath type to which resistances apply
  const resistMap = {
    Fire:      [targetStats.fireResist],
    Ice:       [targetStats.iceResist],
    Lightning: [targetStats.lightningResist],
    Steam:     [targetStats.fireResist, targetStats.iceResist],
    Solar:     [targetStats.fireResist, targetStats.lightningResist],
    Aurora:    [targetStats.iceResist, targetStats.lightningResist],
    Plasma:    [targetStats.fireResist, targetStats.iceResist, targetStats.lightningResist],
  };

  const resists = resistMap[breathType];
  if (!resists || resists.length === 0) return 0;

  // For multi-element breaths, average the contributing resistances
  const avg = resists.reduce((sum, r) => sum + r, 0) / resists.length;
  return avg;
}

// ─── Height Targeting ───────────────────────────────────────

const HEIGHT_NAMES = ['Ground', 'Low', 'Mid', 'High'];

export function getHeightName(h) {
  return HEIGHT_NAMES[Math.max(0, Math.min(3, h))] || 'Low';
}

// ─── Trait Stat Impact Annotations ──────────────────────────
// Returns human-readable stat impacts for a given trait at a given resolved value.
// Used by the combat sim gene editor to show what each trait selection does.

/**
 * @param {string} geneName
 * @param {number} value — the resolved phenotype value (rounded average or categorical max)
 * @param {Object} context — related trait values for dependent traits
 *   context.horn_style — needed for horn_direction
 *   context.spine_style — needed for spine_height
 *   context.tail_shape — needed for tail_length
 * @returns {string} e.g. "+15 Armor, -5% Speed" or "" if no impact
 */
export function getTraitImpact(geneName, value, context = {}) {
  const parts = [];
  const add = (stat, val, pct = false) => {
    const sign = val > 0 ? '+' : '';
    parts.push(`${sign}${val}${pct ? '%' : ''} ${stat}`);
  };

  switch (geneName) {
    case 'body_size': {
      const hp = ({ 1: 40, 2: 60, 3: 80, 4: 100, 5: 150, 6: 220 })[value];
      if (hp !== undefined) parts.push(`${hp} HP`);
      break;
    }
    case 'body_type':
      if (value === 1) { add('HP', -10, true); add('Spd', 15, true); add('Eva', 10, true); }
      if (value === 3) { add('HP', 15, true); add('Armor', 5); add('Spd', -10, true); }
      break;
    case 'body_scales':
      if (value === 1) add('Spd', 10, true);
      if (value === 2) add('Armor', 5);
      if (value === 3) { add('Armor', 15); add('Spd', -5, true); }
      break;
    case 'frame_wings':
      if (value <= 1) parts.push('Ground');
      if (value === 2) { add('Spd', 10, true); parts.push('Height+1'); }
      if (value === 3) { add('Spd', 15, true); parts.push('Height+2'); }
      if (value >= 4) { add('Spd', 20, true); parts.push('Height+2'); }
      break;
    case 'frame_limbs':
      if (value === 0) add('Eva', 10, true);
      if (value === 1) add('Acc', 5, true);
      if (value === 2) { add('Acc', 10, true); add('Melee', 2); }
      if (value === 3) { add('Acc', 15, true); add('Melee', 4); }
      break;
    case 'frame_bones':
      if (value === 1) { add('Armor', -3); parts.push('Height+1'); }
      if (value === 3) { add('Armor', 5); parts.push('Height-1'); }
      break;
    case 'horn_style':
      if (value === 1) { add('Spd', 5, true); add('Acc', 5, true); }
      if (value === 2) { add('Melee', 3); add('Thorns', 2); }
      if (value === 3) add('Armor', 3);
      break;
    case 'horn_direction':
      if ((context.horn_style || 0) === 0) break;
      if (value === 0) add('Melee', 3);
      if (value === 1) add('Spd', 5, true);
      if (value === 2) add('Breath', 15, true);
      break;
    case 'spine_style':
      if (value === 1) parts.push('Armor +2..6');
      if (value === 2) parts.push('Thorns, Melee');
      if (value === 3) parts.push('Spd, Eva');
      break;
    case 'spine_height': {
      const ss = context.spine_style || 0;
      if (ss === 1) add('Armor', ({ 1: 2, 2: 4, 3: 6 })[value] || 0);
      else if (ss === 2) {
        add('Thorns', ({ 1: 1, 2: 3, 3: 5 })[value] || 0);
        add('Melee', ({ 1: 1, 2: 2, 3: 3 })[value] || 0);
      } else if (ss === 3) {
        add('Spd', ({ 1: 3, 2: 6, 3: 10 })[value] || 0, true);
        add('Eva', ({ 1: 3, 2: 5, 3: 8 })[value] || 0, true);
        if (value === 3) add('Armor', -3);
      }
      break;
    }
    case 'tail_shape':
      if (value === 1) parts.push('Spd, Eva');
      if (value === 3) parts.push('Tank stats');
      break;
    case 'tail_length': {
      const ts = context.tail_shape || 2;
      if (ts === 1) {
        add('Spd', ({ 1: 3, 2: 5, 3: 8 })[value] || 0, true);
        add('Eva', ({ 1: 3, 2: 5, 3: 8 })[value] || 0, true);
      } else if (ts === 3) {
        add('Spd', ({ 1: -3, 2: -5, 3: -8 })[value] || 0, true);
        add('Melee', ({ 1: 2, 2: 3, 3: 5 })[value] || 0);
        add('HP', ({ 1: 5, 2: 10, 3: 15 })[value] || 0);
        add('Armor', ({ 1: 2, 2: 3, 3: 5 })[value] || 0);
      }
      break;
    }
    // Finish axes
    case 'finish_opacity':
      if (value === 0) add('Eva', 15, true);
      else if (value === 1) add('Eva', 10, true);
      else if (value === 3) add('Armor', 5);
      break;
    case 'finish_shine':
      if (value === 0) add('Acc', 10, true);
      else if (value === 1) add('Acc', 5, true);
      else if (value === 3) parts.push('15% Breath Reflect');
      break;
    case 'finish_schiller':
      if (value === 0) add('Melee', 3);
      else if (value === 1) add('Melee', 1);
      else if (value === 3) add('Breath', 15, true);
      break;
    // Color axes → elemental resistance
    case 'color_cyan': {
      const r = ({ 0: 0, 1: 8, 2: 16, 3: 25 })[value];
      if (r > 0) parts.push(`${r}% Ice Resist`);
      break;
    }
    case 'color_magenta': {
      const r = ({ 0: 0, 1: 8, 2: 16, 3: 25 })[value];
      if (r > 0) parts.push(`${r}% Fire Resist`);
      break;
    }
    case 'color_yellow': {
      const r = ({ 0: 0, 1: 8, 2: 16, 3: 25 })[value];
      if (r > 0) parts.push(`${r}% Lightning Resist`);
      break;
    }
    // Breath element axes → breath damage (+2 per point)
    case 'breath_fire':
    case 'breath_ice':
    case 'breath_lightning':
      if (value > 0) parts.push(`+${value * 2} Breath`);
      break;
    // Breath shape/range
    case 'breath_shape':
      if (value === 1) parts.push('Single ×1.0');
      if (value === 2) parts.push('Multi ×0.7');
      if (value === 3) parts.push('AoE ×0.4');
      break;
    case 'breath_range':
      if (value === 1) parts.push('Close');
      if (value === 2) parts.push('Mid');
      if (value === 3) parts.push('Far, -15% Acc');
      break;
  }

  return parts.join(', ');
}
