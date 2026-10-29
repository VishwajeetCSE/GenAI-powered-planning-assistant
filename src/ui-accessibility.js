/**
 * @file ui-accessibility.js
 * @module PlanFlowAI/UIAccessibility
 * @description Reusable WAI-ARIA interaction helpers for the UI controller.
 * @license MIT
 */

/**
 * Applies the WAI-ARIA disclosure pattern to a collapsible form or panel.
 * @param {HTMLElement|null} trigger - Control that opens or closes the panel
 * @param {HTMLElement|null} panel - Controlled panel
 * @param {boolean} expanded - Whether the panel should be visible
 * @param {boolean} [focusFirstField=false] - Focus the first control after opening
 */
export function setDisclosureState(trigger, panel, expanded, focusFirstField = false) {
  if (!trigger || !panel) return;
  trigger.setAttribute('aria-expanded', String(expanded));
  panel.classList.toggle('hidden', !expanded);
  panel.hidden = !expanded;
  panel.setAttribute('aria-hidden', String(!expanded));

  if (expanded && focusFirstField) {
    panel.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])')?.focus();
  }
}

/**
 * Adds WAI-ARIA roving-tabindex keyboard support to a tab list.
 * @param {HTMLElement|null} tablistEl - Parent element with role="tablist"
 * @param {(filter: string, tabId: string) => void} onSelect - Invoked when a tab becomes active
 */
export function setupAccessibleTabs(tablistEl, onSelect) {
  if (!tablistEl || typeof onSelect !== 'function') return;
  const tabs = Array.from(tablistEl.querySelectorAll('[role="tab"]'));
  if (tabs.length === 0) return;

  const activateTab = (tab, shouldFocus = false) => {
    tabs.forEach((candidate) => {
      const isActive = candidate === tab;
      candidate.classList.toggle('active', isActive);
      candidate.setAttribute('aria-selected', String(isActive));
      candidate.tabIndex = isActive ? 0 : -1;
    });
    if (shouldFocus) tab.focus();
    onSelect(tab.getAttribute('data-filter') || 'all', tab.id);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      const movement = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      let nextIndex = index;
      if (movement) {
        event.preventDefault();
        nextIndex = (index + movement + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }
      activateTab(tabs[nextIndex], true);
    });
  });
}
