// Skill tree tab UI — branch navigation, line sections, skill cards, unlock flow
import { BRANCH_DEFS, LINE_DEFS, SKILL_DEFS, TOME_GENE_MAP } from './skill-config.js';
import {
  hasSkill, canUnlockSkill, unlockSkill, getSkillCost,
  getAvailableXP, getUnlockedCount, onSkillChange,
} from './skill-engine.js';
import { hasTome } from './shop-engine.js';
import { uiImg } from './ui-card.js';
import { getStats, triggerSave } from './save-manager.js';
import { checkTrigger } from './tutorial-engine.js';

let container = null;
let activeBranch = 'geneticist';
let activeLines = {}; // tracks active line per branch

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ── Init & refresh ──────────────────────────────────────────

export function initSkillsTab(containerEl) {
  container = containerEl;
  renderSkills();
  onSkillChange(() => renderSkills());
}

export function refreshSkills() {
  if (container) renderSkills();
}

// ── Data helpers ────────────────────────────────────────────

function getSkillState(skillId) {
  if (hasSkill(skillId)) return 'unlocked';
  const def = SKILL_DEFS[skillId];
  // Check line-level rep gate
  if (def.line) {
    const lineDef = LINE_DEFS[def.line];
    if (lineDef?.repGate && getStats().rep < lineDef.repGate) return 'rep-locked';
  }
  const check = canUnlockSkill(skillId);
  if (check.ok) return 'available';
  if (def.requires?.tome && !hasTome(def.requires.tome)) return 'tome-locked';
  return 'locked';
}

/** Get all skills for a branch, grouped by line */
function getSkillsByLine(branchKey) {
  const lines = new Map();
  for (const [id, def] of Object.entries(SKILL_DEFS)) {
    if (def.branch !== branchKey) continue;
    if (!lines.has(def.line)) lines.set(def.line, []);
    lines.get(def.line).push({ id, ...def });
  }
  // Sort each line's skills by tier
  for (const skills of lines.values()) {
    skills.sort((a, b) => a.tier - b.tier);
  }
  return lines;
}

/** Get ordered line keys for a branch (preserves LINE_DEFS declaration order) */
function getLineOrder(branchKey) {
  return Object.entries(LINE_DEFS)
    .filter(([, def]) => def.branch === branchKey)
    .map(([key]) => key);
}

/** Count unlocked skills in a set of skills */
function countUnlocked(skills) {
  return skills.filter(s => hasSkill(s.id)).length;
}

/** Detect independent chains (multiple roots) within a skill line */
function splitChains(skills) {
  // Find root skills (no requires.skill that is in THIS line)
  const lineIds = new Set(skills.map(s => s.id));
  const roots = skills.filter(s => {
    if (!s.requires?.skill) return true;
    return !lineIds.has(s.requires.skill);
  });

  if (roots.length <= 1) return null; // single chain, no split needed

  // BFS from each root to collect its chain
  const chains = [];
  const childMap = new Map();
  for (const s of skills) {
    if (s.requires?.skill && lineIds.has(s.requires.skill)) {
      if (!childMap.has(s.requires.skill)) childMap.set(s.requires.skill, []);
      childMap.get(s.requires.skill).push(s);
    }
  }

  for (const root of roots) {
    const chain = [];
    const queue = [root];
    while (queue.length > 0) {
      const s = queue.shift();
      chain.push(s);
      const children = childMap.get(s.id) || [];
      queue.push(...children);
    }
    chain.sort((a, b) => a.tier - b.tier);
    chains.push(chain);
  }

  return chains;
}

/** Group tome-sub skills by tome key */
function groupTomeSkills(skills) {
  const groups = new Map();
  for (const [tomeKey] of Object.entries(TOME_GENE_MAP)) {
    const prefix = tomeKey;
    const tomeSkills = skills.filter(s => s.id.startsWith(prefix + '-'));
    if (tomeSkills.length > 0) {
      const pressure = tomeSkills.filter(s => s.id.includes('-pressure-'));
      const lock = tomeSkills.filter(s => s.id.includes('-lock-'));
      groups.set(tomeKey, { pressure, lock, all: tomeSkills });
    }
  }
  return groups;
}

/** Pretty-print a tome key */
function tomeDisplayName(tomeKey) {
  return tomeKey.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ── Render ──────────────────────────────────────────────────

function renderSkills() {
  container.innerHTML = '';
  const wrapper = el('div', 'skill-wrapper');

  // XP bar
  wrapper.appendChild(renderXPBar());

  // Branch navigation
  wrapper.appendChild(renderBranchNav());

  // Active branch content
  wrapper.appendChild(renderBranch(activeBranch));

  container.appendChild(wrapper);
}

function renderXPBar() {
  const bar = el('div', 'skill-xp-bar');

  const xpGroup = el('span', 'skill-xp-value');
  xpGroup.appendChild(uiImg('c_exp.png', 'currency-icon'));
  xpGroup.appendChild(document.createTextNode(` ${getAvailableXP()} XP available`));
  bar.appendChild(xpGroup);

  const totalSkills = Object.keys(SKILL_DEFS).length;
  const unlocked = getUnlockedCount();
  const countEl = el('span', 'skill-unlocked-count', `${unlocked}/${totalSkills} skills`);
  bar.appendChild(countEl);

  return bar;
}

function renderBranchNav() {
  const nav = el('div', 'skill-branch-bar');

  for (const [key, def] of Object.entries(BRANCH_DEFS)) {
    const tab = el('button', `skill-branch-tab${key === activeBranch ? ' skill-branch-active' : ''}`);
    tab.innerHTML = `<span class="skill-branch-icon">${def.icon}</span><span class="skill-branch-name">${def.name}</span>`;
    tab.addEventListener('click', () => {
      activeBranch = key;
      renderSkills();
    });
    nav.appendChild(tab);
  }

  return nav;
}

function renderBranch(branchKey) {
  const section = el('div', 'skill-branch-content');
  const lineOrder = getLineOrder(branchKey);
  const skillsByLine = getSkillsByLine(branchKey);

  // Determine active line — auto-select first line with available skill
  if (!activeLines[branchKey]) {
    for (const lineKey of lineOrder) {
      const skills = skillsByLine.get(lineKey) || [];
      if (skills.some(s => getSkillState(s.id) === 'available')) {
        activeLines[branchKey] = lineKey;
        break;
      }
    }
    if (!activeLines[branchKey] && lineOrder.length > 0) {
      activeLines[branchKey] = lineOrder[0];
    }
  }
  const activeLine = activeLines[branchKey];

  // Line tab bar
  const lineBar = el('div', 'skill-line-bar');
  for (const lineKey of lineOrder) {
    const skills = skillsByLine.get(lineKey) || [];
    if (skills.length === 0) continue;
    const lineDef = LINE_DEFS[lineKey];
    const unlocked = countUnlocked(skills);
    const isActive = lineKey === activeLine;

    const tab = el('button', `skill-line-tab${isActive ? ' skill-line-active' : ''}`);
    const nameSpan = el('span', 'skill-line-tab-name', lineDef.name);
    tab.appendChild(nameSpan);
    const countSpan = el('span', 'skill-line-tab-count', `${unlocked}/${skills.length}`);
    tab.appendChild(countSpan);

    tab.addEventListener('click', () => {
      activeLines[branchKey] = lineKey;
      renderSkills();
    });
    lineBar.appendChild(tab);
  }
  section.appendChild(lineBar);

  // Render active line content
  const skills = skillsByLine.get(activeLine) || [];
  if (skills.length > 0) {
    if (activeLine === 'tome-sub') {
      section.appendChild(renderTomeSubContent(skills));
    } else {
      const chains = splitChains(skills);
      if (chains && chains.length > 1) {
        section.appendChild(renderParallelContent(chains));
      } else {
        section.appendChild(renderLineContent(skills));
      }
    }
  }

  return section;
}

// ── Line content renderers (no accordion wrapper) ───────────

function renderLineContent(skills) {
  const body = el('div', 'skill-line-content');
  for (const skill of skills) {
    body.appendChild(renderSkillCard(skill.id, skill));
  }
  return body;
}

function renderParallelContent(chains) {
  const body = el('div', 'skill-line-content');
  const parallel = el('div', 'skill-parallel');
  parallel.style.gridTemplateColumns = `repeat(${chains.length}, 1fr)`;

  for (const chain of chains) {
    const col = el('div', 'skill-parallel-col');
    const colLabel = chain[0].name.replace(/ I+$/, '').replace(/ [IVX]+$/, '');
    col.appendChild(el('div', 'skill-parallel-header', colLabel));
    for (const skill of chain) {
      col.appendChild(renderSkillCard(skill.id, skill, true));
    }
    parallel.appendChild(col);
  }
  body.appendChild(parallel);
  return body;
}

function renderTomeSubContent(skills) {
  const body = el('div', 'skill-line-content');
  const tomeGroups = groupTomeSkills(skills);

  for (const [tomeKey, group] of tomeGroups) {
    const owned = hasTome(tomeKey);
    const tomeEl = el('div', `skill-tome-group${owned ? '' : ' skill-tome-locked-group'}`);

    // Tome header
    const tomeHeader = el('div', 'skill-tome-header');
    const tomeName = el('span', 'skill-tome-name', tomeDisplayName(tomeKey));
    tomeHeader.appendChild(tomeName);

    const genes = TOME_GENE_MAP[tomeKey] || [];
    if (genes.length > 0) {
      const geneText = el('span', 'skill-tome-genes', genes.join(', '));
      tomeHeader.appendChild(geneText);
    }

    const badge = el('span', owned ? 'skill-tome-badge skill-tome-owned' : 'skill-tome-badge skill-tome-not-owned');
    badge.textContent = owned ? 'Owned' : 'Not Owned';
    tomeHeader.appendChild(badge);

    tomeEl.appendChild(tomeHeader);

    if (owned) {
      if (group.pressure.length > 0 || group.lock.length > 0) {
        const parallel = el('div', 'skill-parallel');
        parallel.style.gridTemplateColumns = '1fr 1fr';

        if (group.pressure.length > 0) {
          const col = el('div', 'skill-parallel-col');
          col.appendChild(el('div', 'skill-parallel-header', 'Pressure'));
          for (const s of group.pressure) col.appendChild(renderSkillCard(s.id, s, true));
          parallel.appendChild(col);
        }
        if (group.lock.length > 0) {
          const col = el('div', 'skill-parallel-col');
          col.appendChild(el('div', 'skill-parallel-header', 'Lock'));
          for (const s of group.lock) col.appendChild(renderSkillCard(s.id, s, true));
          parallel.appendChild(col);
        }
        tomeEl.appendChild(parallel);
      }
    } else {
      const lockMsg = el('div', 'skill-tome-lock-msg', 'Purchase this tome from the Arcana Shop to unlock these skills.');
      tomeEl.appendChild(lockMsg);
    }

    body.appendChild(tomeEl);
  }

  return body;
}

// ── Skill card ──────────────────────────────────────────────

function renderSkillCard(skillId, def, compact = false) {
  const state = getSkillState(skillId);
  const cost = getSkillCost(skillId);
  const card = el('div', `skill-card skill-${state}`);

  // Grey out skills locked behind a prerequisite skill
  if (state === 'locked' && def.requires?.skill && !hasSkill(def.requires.skill)) {
    card.classList.add('skill-prereq-locked');
  }

  // Tier badge
  const badge = el('div', 'skill-tier-badge');
  if (state === 'unlocked') {
    badge.textContent = '✓';
    badge.classList.add('skill-tier-done');
  } else {
    badge.textContent = `T${def.tier}`;
  }
  card.appendChild(badge);

  // Info
  const info = el('div', 'skill-card-info');
  info.appendChild(el('div', `skill-card-name${compact ? ' skill-card-name-compact' : ''}`, def.name));
  info.appendChild(el('div', 'skill-card-desc', def.desc));

  // Prereq text for locked skills
  if (state === 'rep-locked') {
    const lineDef = LINE_DEFS[def.line];
    info.appendChild(el('div', 'skill-card-prereq skill-card-rep-req', `Requires ${lineDef.repGate} Rep`));
  } else if (state === 'locked') {
    const check = canUnlockSkill(skillId);
    if (!check.ok && check.reason !== 'Already unlocked') {
      info.appendChild(el('div', 'skill-card-prereq', check.reason));
    }
  } else if (state === 'tome-locked') {
    const tomeName = def.requires?.tome ? tomeDisplayName(def.requires.tome) : 'a tome';
    info.appendChild(el('div', 'skill-card-prereq skill-card-tome-req', `Requires: ${tomeName}`));
  }

  card.appendChild(info);

  // Cost / unlock button
  const right = el('div', 'skill-card-right');
  if (state === 'unlocked') {
    // nothing on right
  } else if (state === 'available') {
    const btn = el('button', 'btn btn-small btn-skill-unlock');
    btn.appendChild(uiImg('c_exp.png', 'currency-icon'));
    btn.appendChild(document.createTextNode(` ${cost}`));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const result = unlockSkill(skillId);
      if (result.success) {
        card.classList.add('skill-just-unlocked');
        triggerSave();
        setTimeout(() => renderSkills(), 400);
        checkTrigger('skill-unlock');
      }
    });
    right.appendChild(btn);
  } else {
    const costLabel = el('div', 'skill-card-cost');
    costLabel.appendChild(uiImg('c_exp.png', 'currency-icon'));
    costLabel.appendChild(document.createTextNode(` ${cost}`));
    right.appendChild(costLabel);
  }
  card.appendChild(right);

  return card;
}
