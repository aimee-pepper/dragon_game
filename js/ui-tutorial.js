// Tutorial UI — renders spotlight overlays, modals, tooltips, and toasts
// Stateless renderer: receives tutorial definitions and manages DOM elements

import { markCompleted, setActiveTutorial, clearActiveTutorial, disableAllTutorials } from './tutorial-engine.js';
import { triggerSave } from './save-manager.js';

let _overlay = null; // current overlay element

// ── Public entry point (called by tutorial-engine via callback) ──

export function showTutorial(id, def) {
  // Clean up any existing tutorial
  dismiss();

  setActiveTutorial({ id, step: 0 });

  switch (def.format) {
    case 'modal':
      showModal(id, def);
      break;
    case 'spotlight':
      showSpotlight(id, def, 0);
      break;
    case 'tooltip':
      showTooltip(id, def);
      break;
    case 'toast':
      showToast(id, def);
      break;
    case 'toast+modal':
      showToastThenModal(id, def);
      break;
    default:
      console.warn('Unknown tutorial format:', def.format);
      completeTutorial(id);
  }
}

// ── Dismiss / Complete ───────────────────────────────────────

function dismiss() {
  if (_overlay) {
    // Remove attached click-catcher if present
    if (_overlay._clickCatcher) {
      _overlay._clickCatcher.remove();
    }
    _overlay.remove();
    _overlay = null;
  }
  // Remove any floating tooltips (both types)
  document.querySelectorAll('.tutorial-tooltip, .tutorial-spotlight-tooltip, .tutorial-click-catcher').forEach(el => el.remove());
  clearActiveTutorial();
}

function completeTutorial(id) {
  dismiss();
  markCompleted(id);
  triggerSave();
}

function skipAllTutorials(id) {
  dismiss();
  markCompleted(id);
  disableAllTutorials();
  triggerSave();
}

// ── Modal ────────────────────────────────────────────────────

function showModal(id, def) {
  const panels = def.panels || [];
  let currentPanel = 0;

  const overlay = _createOverlay();

  function renderPanel() {
    // Clear previous content
    const existing = overlay.querySelector('.tutorial-modal');
    if (existing) existing.remove();

    const panel = panels[currentPanel];
    const modal = _el('div', 'tutorial-modal');

    // Close button
    const closeBtn = _el('button', 'tutorial-close-btn', '×');
    closeBtn.addEventListener('click', () => completeTutorial(id));
    modal.appendChild(closeBtn);

    // Title
    if (panel.title) {
      modal.appendChild(_el('h3', 'tutorial-modal-title', panel.title));
    }

    // Body (support newlines)
    if (panel.body) {
      const body = _el('div', 'tutorial-modal-body');
      for (const line of panel.body.split('\n')) {
        if (line.trim() === '') {
          body.appendChild(document.createElement('br'));
        } else {
          const p = _el('p', null, line);
          body.appendChild(p);
        }
      }
      modal.appendChild(body);
    }

    // Footer buttons
    const footer = _el('div', 'tutorial-modal-footer');

    // Skip All button (only on first panel if flagged)
    if (panel.showSkipAll && currentPanel === 0) {
      const skipAll = _el('button', 'tutorial-btn tutorial-btn-skip', 'Skip All Tutorials');
      skipAll.addEventListener('click', () => skipAllTutorials(id));
      footer.appendChild(skipAll);
    }

    // Navigation
    if (panels.length > 1) {
      // Step dots
      const dots = _el('div', 'tutorial-dots');
      for (let i = 0; i < panels.length; i++) {
        const dot = _el('span', i === currentPanel ? 'tutorial-dot active' : 'tutorial-dot');
        dots.appendChild(dot);
      }
      footer.appendChild(dots);
    }

    if (currentPanel < panels.length - 1) {
      const nextBtn = _el('button', 'tutorial-btn tutorial-btn-primary', 'Next');
      nextBtn.addEventListener('click', () => {
        currentPanel++;
        renderPanel();
      });
      footer.appendChild(nextBtn);
    } else {
      const doneBtn = _el('button', 'tutorial-btn tutorial-btn-primary', 'Got it');
      doneBtn.addEventListener('click', () => completeTutorial(id));
      footer.appendChild(doneBtn);
    }

    modal.appendChild(footer);
    overlay.appendChild(modal);
  }

  document.body.appendChild(overlay);
  _overlay = overlay;
  renderPanel();
}

// ── Spotlight Walkthrough ────────────────────────────────────

function showSpotlight(id, def, stepIndex) {
  const steps = def.steps || [];
  if (stepIndex >= steps.length) {
    completeTutorial(id);
    return;
  }

  const step = steps[stepIndex];

  // Try to find target element
  let targetEl = null;
  if (step.target) {
    // Support comma-separated selectors (fallback)
    const selectors = step.target.split(',').map(s => s.trim());
    for (const sel of selectors) {
      targetEl = document.querySelector(sel);
      if (targetEl) break;
    }
  }

  // If target not found and step is optional, skip to next
  if (!targetEl && step.optional) {
    showSpotlight(id, def, stepIndex + 1);
    return;
  }

  // Create overlay with spotlight cutout
  dismiss(); // clear previous step's overlay
  setActiveTutorial({ id, step: stepIndex });

  const overlay = _createOverlay('tutorial-spotlight-overlay');

  // If we have a target, create the spotlight effect
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const padding = 8;
    const cutout = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };

    // Use box-shadow to create the "cutout" effect
    overlay.style.background = 'none';
    overlay.style.boxShadow = `
      0 0 0 9999px rgba(0, 0, 0, 0.7),
      0 0 0 2px var(--accent) inset
    `;
    overlay.style.position = 'fixed';
    overlay.style.top = cutout.top + 'px';
    overlay.style.left = cutout.left + 'px';
    overlay.style.width = cutout.width + 'px';
    overlay.style.height = cutout.height + 'px';
    overlay.style.borderRadius = '8px';
    overlay.style.pointerEvents = 'none';

    // Need a separate click-catcher behind the cutout
    const clickCatcher = _el('div', 'tutorial-click-catcher');
    clickCatcher.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9998;';
    clickCatcher.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    document.body.appendChild(clickCatcher);

    // Tooltip bubble
    const tooltip = _el('div', 'tutorial-spotlight-tooltip');

    // Text (support newlines as bullet points)
    const textEl = _el('div', 'tutorial-tooltip-text');
    for (const line of step.text.split('\n')) {
      const p = _el('p', null, line);
      textEl.appendChild(p);
    }
    tooltip.appendChild(textEl);

    // Buttons row
    const btnRow = _el('div', 'tutorial-tooltip-buttons');

    // Skip button
    const skipBtn = _el('button', 'tutorial-btn tutorial-btn-skip', 'Skip');
    skipBtn.addEventListener('click', () => {
      clickCatcher.remove();
      completeTutorial(id);
    });
    btnRow.appendChild(skipBtn);

    // Step indicator
    if (steps.length > 1) {
      const indicator = _el('span', 'tutorial-step-indicator',
        `${stepIndex + 1} / ${steps.length}`);
      btnRow.appendChild(indicator);
    }

    // Next/Done button
    if (stepIndex < steps.length - 1) {
      const nextBtn = _el('button', 'tutorial-btn tutorial-btn-primary', 'Next');
      nextBtn.addEventListener('click', () => {
        clickCatcher.remove();
        showSpotlight(id, def, stepIndex + 1);
      });
      btnRow.appendChild(nextBtn);
    } else {
      const doneBtn = _el('button', 'tutorial-btn tutorial-btn-primary', 'Got it');
      doneBtn.addEventListener('click', () => {
        clickCatcher.remove();
        completeTutorial(id);
      });
      btnRow.appendChild(doneBtn);
    }

    tooltip.appendChild(btnRow);

    // Position tooltip relative to target, then clamp to viewport
    tooltip.style.maxWidth = 'calc(100vw - 24px)';
    tooltip.style.left = Math.max(12, cutout.left) + 'px';

    // Append first so we can measure
    document.body.appendChild(tooltip);

    const preferredPos = step.position || 'bottom';
    const vh = window.innerHeight;
    const gap = 12;
    const spaceBelow = vh - (cutout.top + cutout.height + gap);
    const spaceAbove = cutout.top - gap;
    const tooltipH = tooltip.offsetHeight;

    let pos = preferredPos;
    // Auto-flip if preferred side doesn't fit but the other does
    if (pos === 'bottom' && tooltipH > spaceBelow && spaceAbove > spaceBelow) {
      pos = 'top';
    } else if (pos === 'top' && tooltipH > spaceAbove && spaceBelow > spaceAbove) {
      pos = 'bottom';
    }

    tooltip.classList.add(`tooltip-${pos}`);

    // Fallback: if neither side has room, pin to bottom of viewport
    if (tooltipH > spaceBelow && tooltipH > spaceAbove) {
      tooltip.style.top = 'auto';
      tooltip.style.bottom = gap + 'px';
      tooltip.style.transform = 'none';
    } else if (pos === 'bottom') {
      tooltip.style.top = (cutout.top + cutout.height + gap) + 'px';
      // If still overflows, constrain height and scroll the text
      if (tooltipH > spaceBelow) {
        tooltip.style.maxHeight = Math.max(120, spaceBelow - 8) + 'px';
        textEl.style.overflowY = 'auto';
        textEl.style.maxHeight = Math.max(60, spaceBelow - 80) + 'px'; // leave room for buttons
      }
    } else {
      tooltip.style.top = (cutout.top - gap) + 'px';
      tooltip.style.transform = 'translateY(-100%)';
      // If still overflows, constrain height and scroll the text
      if (tooltipH > spaceAbove) {
        tooltip.style.maxHeight = Math.max(120, spaceAbove - 8) + 'px';
        tooltip.style.top = gap + 'px';
        tooltip.style.transform = 'none';
        textEl.style.overflowY = 'auto';
        textEl.style.maxHeight = Math.max(60, spaceAbove - 80) + 'px';
      }
    }
    // Store reference for cleanup
    overlay._clickCatcher = clickCatcher;
  } else {
    // No target — just show as a centered modal-style tooltip
    const tooltip = _el('div', 'tutorial-spotlight-tooltip tutorial-centered');
    const textEl = _el('div', 'tutorial-tooltip-text');
    for (const line of step.text.split('\n')) {
      textEl.appendChild(_el('p', null, line));
    }
    tooltip.appendChild(textEl);

    const btnRow = _el('div', 'tutorial-tooltip-buttons');
    const skipBtn = _el('button', 'tutorial-btn tutorial-btn-skip', 'Skip');
    skipBtn.addEventListener('click', () => completeTutorial(id));
    btnRow.appendChild(skipBtn);

    if (stepIndex < steps.length - 1) {
      const nextBtn = _el('button', 'tutorial-btn tutorial-btn-primary', 'Next');
      nextBtn.addEventListener('click', () => showSpotlight(id, def, stepIndex + 1));
      btnRow.appendChild(nextBtn);
    } else {
      const doneBtn = _el('button', 'tutorial-btn tutorial-btn-primary', 'Got it');
      doneBtn.addEventListener('click', () => completeTutorial(id));
      btnRow.appendChild(doneBtn);
    }

    tooltip.appendChild(btnRow);
    overlay.appendChild(tooltip);
  }

  document.body.appendChild(overlay);
  _overlay = overlay;
}

// ── Tooltip Hint ─────────────────────────────────────────────

function showTooltip(id, def) {
  let targetEl = null;
  if (def.target) {
    const selectors = def.target.split(',').map(s => s.trim());
    for (const sel of selectors) {
      targetEl = document.querySelector(sel);
      if (targetEl) break;
    }
  }

  const tooltip = _el('div', 'tutorial-tooltip');
  tooltip.appendChild(_el('p', 'tutorial-tooltip-text', def.text));

  const dismissBtn = _el('button', 'tutorial-btn tutorial-btn-small', '✓');
  dismissBtn.addEventListener('click', () => completeTutorial(id));
  tooltip.appendChild(dismissBtn);

  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.top = (rect.bottom + 8) + 'px';
    tooltip.style.left = Math.max(12, rect.left) + 'px';
    tooltip.style.maxWidth = 'calc(100vw - 24px)';
  } else {
    tooltip.classList.add('tutorial-centered');
  }

  document.body.appendChild(tooltip);

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (tooltip.parentElement) {
      completeTutorial(id);
    }
  }, 8000);
}

// ── Toast ────────────────────────────────────────────────────

function showToast(id, def) {
  const text = def.toast || def.text || '';

  const toast = document.createElement('div');
  toast.className = 'tutorial-toast';
  toast.textContent = text;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 3500);

  completeTutorial(id);
}

// ── Toast + Modal combo ──────────────────────────────────────

function showToastThenModal(id, def) {
  const text = def.toast || '';

  const toast = document.createElement('div');
  toast.className = 'tutorial-toast';
  toast.textContent = text;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.remove();
      // Now show the modal portion
      if (def.panels && def.panels.length > 0) {
        setActiveTutorial({ id, step: 0 });
        showModal(id, def);
      } else {
        completeTutorial(id);
      }
    }, 400);
  }, 2000);
}

// ── Helpers ──────────────────────────────────────────────────

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function _createOverlay(extraClass) {
  const overlay = _el('div', 'tutorial-overlay' + (extraClass ? ' ' + extraClass : ''));
  return overlay;
}
