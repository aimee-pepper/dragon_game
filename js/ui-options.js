// Options tab UI — settings toggles
import { getSetting, setSetting } from './settings.js';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initOptionsTab(container) {
  const wrapper = el('div', 'options-wrapper');

  wrapper.appendChild(el('h2', 'options-title', 'Settings'));

  // --- Appearance ---
  wrapper.appendChild(el('div', 'options-section-header', 'Appearance'));

  wrapper.appendChild(
    makeToggle('Theme', 'Light / Dark mode', 'theme', {
      onLabel: 'Light',
      offLabel: 'Dark',
      isOn: () => getSetting('theme') === 'light',
      toggle: (isOn) => setSetting('theme', isOn ? 'light' : 'dark'),
    })
  );

  wrapper.appendChild(
    makeToggle('Art Style', 'Switch between hand-drawn and pixel art sprites', 'art-style', {
      onLabel: 'Pixel',
      offLabel: 'Drawn',
      isOn: () => getSetting('art-style') === 'pixel',
      toggle: (isOn) => setSetting('art-style', isOn ? 'pixel' : 'drawn'),
    })
  );

  // --- Quest Features ---
  wrapper.appendChild(el('div', 'options-section-header', 'Quest Features'));

  wrapper.appendChild(
    makeBoolToggle('Quest Halos', 'Show glow on dragons that match the highlighted quest', 'quest-halos')
  );

  wrapper.appendChild(
    makeBoolToggle('Genotype Highlighting', 'Highlight quest-relevant genes in the genotype panel', 'quest-genotype-highlight')
  );

  wrapper.appendChild(
    makeBoolToggle('Pinned Quest Widget', 'Show floating quest panel on all tabs', 'pinned-quest-widget')
  );

  container.appendChild(wrapper);
}

// Generic boolean toggle for true/false settings
function makeBoolToggle(label, description, settingKey) {
  return makeToggle(label, description, settingKey, {
    onLabel: 'On',
    offLabel: 'Off',
    isOn: () => getSetting(settingKey) === true,
    toggle: (isOn) => setSetting(settingKey, isOn),
  });
}

// Build a toggle row with a label, description, and switch
function makeToggle(label, description, settingKey, { onLabel, offLabel, isOn, toggle }) {
  const row = el('div', 'options-toggle-row');

  const info = el('div', 'options-toggle-info');
  info.appendChild(el('div', 'options-toggle-label', label));
  info.appendChild(el('div', 'options-toggle-desc', description));
  row.appendChild(info);

  const switchWrap = el('div', 'options-switch-wrap');

  const stateLabel = el('span', 'options-switch-state');
  const updateLabel = () => {
    stateLabel.textContent = isOn() ? onLabel : offLabel;
  };
  updateLabel();

  const btn = el('button', 'options-switch');
  const knob = el('span', 'options-switch-knob');
  btn.appendChild(knob);

  const updateSwitch = () => {
    btn.classList.toggle('on', isOn());
  };
  updateSwitch();

  btn.addEventListener('click', () => {
    toggle(!isOn());
    updateSwitch();
    updateLabel();
  });

  switchWrap.appendChild(stateLabel);
  switchWrap.appendChild(btn);
  row.appendChild(switchWrap);

  return row;
}
