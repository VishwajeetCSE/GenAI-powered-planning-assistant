/**
 * @file ui-events.js
 * @module PlanFlowAI/UIEvents
 * @description Centralized DOM element registry and declarative event binder for PlanFlow AI.
 * Keeps the main application controller thin, maintainable, and decoupled from DOM lookup boilerplate.
 * @license MIT
 */

import {
  NUMERIC_BOUNDS,
  ARCHETYPE_DEFAULTS,
  sanitizeNumber,
  debounce,
  setDisclosureState,
  setupAccessibleTabs,
  isValidGeminiApiKey,
  isSupportedGeminiModel
} from './index.js';

/**
 * Caches and returns references to all interactive DOM elements in the application.
 * @returns {Record<string, any>} DOM elements dictionary
 */
export function getDOMElements() {
  if (typeof document === 'undefined') return {};

  return {
    // Global Header & Navigation
    currencySelect: document.getElementById('currency-select'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    btnLoadDemo: document.getElementById('btn-load-demo'),
    btnReset: document.getElementById('btn-reset'),
    btnExportMenu: document.getElementById('btn-export-menu'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJsonTrigger: document.getElementById('btn-import-json-trigger'),
    importJsonFile: document.getElementById('import-json-file'),
    btnPrintSummary: document.getElementById('btn-print-summary'),
    toastNotification: document.getElementById('toast-notification'),
    printableSummary: document.getElementById('printable-summary'),

    // Step 1: Archetypes & Parameters
    archetypeCards: document.querySelectorAll('.archetype-card'),
    activeArchetypeBadge: document.getElementById('active-event-badge'),
    totalBudgetInput: document.getElementById('input-budget'),
    guestCountInput: document.getElementById('input-guests'),
    horizonMonthsSelect: document.getElementById('input-timeline'),
    locationStyleSelect: document.getElementById('input-location'),
    eventVibeSelect: document.getElementById('input-vibe'),

    // Step 2: Budget Calculator
    currencyLabels: document.querySelectorAll('.currency-label'),
    kpiTotalAllocated: document.getElementById('kpi-total-allocated'),
    kpiPercentageSum: document.getElementById('kpi-percentage-sum'),
    kpiVarianceAmount: document.getElementById('kpi-variance-amount'),
    kpiVarianceStatus: document.getElementById('kpi-variance-status'),
    kpiCostPerGuest: document.getElementById('kpi-per-guest'),
    budgetWarningBanner: document.getElementById('budget-warning-banner'),
    budgetWarningText: document.getElementById('budget-warning-text'),
    distributionBar: document.getElementById('distribution-bar-container'),
    categorySlidersContainer: document.getElementById('category-sliders-container'),
    btnRebalanceDefaults: document.getElementById('btn-rebalance-budget'),

    // Step 3: Roadmap & Readiness
    readinessScoreText: document.getElementById('readiness-score-text'),
    readinessProgressTrack: document.getElementById('readiness-progress'),
    readinessProgressBar: document.getElementById('readiness-progress-fill'),
    readinessStatusBadge: document.getElementById('readiness-badge'),
    milestonesContainer: document.getElementById('milestones-container'),
    addTaskForm: document.getElementById('add-task-form'),
    quickTaskInput: document.getElementById('new-task-title'),
    quickTaskPhaseSelect: document.getElementById('new-task-phase'),

    // Step 4: Vendor Tracker & Negotiation
    vendorTablist: document.getElementById('vendor-tablist'),
    vendorFilterChips: document.querySelectorAll('.filter-chip:not(.inv-filter-chip)'),
    vendorCardsContainer: document.getElementById('vendor-cards-container'),
    btnAddVendorToggle: document.getElementById('btn-add-vendor-toggle'),
    addVendorForm: document.getElementById('add-vendor-form'),
    vendorNameInput: document.getElementById('vendor-name-input'),
    vendorCategorySelect: document.getElementById('vendor-category-select'),
    vendorQuotedInput: document.getElementById('vendor-quoted-input'),
    vendorStatusSelect: document.getElementById('vendor-status-select'),
    btnCancelVendor: document.getElementById('btn-cancel-vendor'),

    // Step 5: Risk Analysis Matrix
    riskScoreText: document.getElementById('risk-score-text'),
    riskProfileBadge: document.getElementById('risk-profile-badge'),
    riskCardsContainer: document.getElementById('risk-cards-container'),
    btnAddRiskToggle: document.getElementById('btn-add-risk-toggle'),
    addRiskForm: document.getElementById('add-risk-form'),
    riskCatSelect: document.getElementById('risk-category-select'),
    riskTitleInput: document.getElementById('risk-title-input'),
    riskProbSelect: document.getElementById('risk-prob-select'),
    riskImpactSelect: document.getElementById('risk-impact-select'),
    riskStrategyInput: document.getElementById('risk-strategy-input'),
    btnCancelRisk: document.getElementById('btn-cancel-risk'),

    // Step 6: Supplies & Equipment Inventory
    invTablist: document.getElementById('inv-tablist'),
    invFilterChips: document.querySelectorAll('.inv-filter-chip'),
    invTableWrapper: document.getElementById('inv-table-wrapper'),
    inventoryReadinessText: document.getElementById('inventory-readiness-text'),
    inventoryStatusBadge: document.getElementById('inventory-status-badge'),
    inventoryTableBody: document.getElementById('inventory-table-body'),
    btnAddInventoryToggle: document.getElementById('btn-add-inventory-toggle'),
    addInventoryForm: document.getElementById('add-inventory-form'),
    invNameInput: document.getElementById('inv-name-input'),
    invCatSelect: document.getElementById('inv-cat-select'),
    invQtyInput: document.getElementById('inv-qty-input'),
    invStatusSelect: document.getElementById('inv-status-select'),
    invOwnerInput: document.getElementById('inv-owner-input'),
    btnCancelInventory: document.getElementById('btn-cancel-inventory'),

    // Step 7: PlanGenie AI Chat
    chatMessagesContainer: document.getElementById('chat-messages-container'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input-field'),
    btnClearChat: document.getElementById('btn-clear-chat'),
    promptChips: document.querySelectorAll('.prompt-chip'),

    // Negotiation Script Dialog
    negotiationDialog: document.getElementById('negotiation-dialog'),
    btnCloseNegotiationDialog: document.getElementById('btn-close-negotiation-dialog'),
    negotiationMetaInfo: document.getElementById('negotiation-meta-info'),
    negotiationScriptContent: document.getElementById('negotiation-script-content'),
    negotiationTipsList: document.getElementById('negotiation-tips-list'),
    btnCopyScript: document.getElementById('btn-copy-script'),
    btnDismissNegotiation: document.getElementById('btn-dismiss-negotiation'),
    copyBtnText: document.getElementById('copy-btn-text'),
    btnEmailMailto: document.getElementById('btn-email-mailto'),

    // AI Settings Dialog
    settingsDialog: document.getElementById('settings-dialog'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnCloseSettingsDialog: document.getElementById('btn-close-settings-dialog'),
    btnDismissSettings: document.getElementById('btn-dismiss-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    settingsForm: document.getElementById('settings-form'),
    geminiApiKeyInput: document.getElementById('gemini-api-key-input'),
    geminiModelSelect: document.getElementById('gemini-model-select'),
    settingsEngineStatus: document.getElementById('settings-engine-status'),
    btnClearApiKey: document.getElementById('btn-clear-api-key')
  };
}

/**
 * Binds all application event handlers to the given UI controller instance.
 * @param {import('../app.js').PlanFlowUI} ui - PlanFlowUI controller instance
 * @param {Record<string, any>} dom - Cached DOM elements dictionary
 */
export function attachUIEventListeners(ui, dom) {
  if (!dom || typeof document === 'undefined') return;

  // Currency Selector
  dom.currencySelect?.addEventListener('change', (e) => {
    ui.state.currency = e.target.value;
    ui.saveAndRender();
    ui.showToast(`Currency updated to ${ui.state.currency}`);
  });

  // Theme Toggle
  dom.btnThemeToggle?.addEventListener('click', () => {
    const nextTheme = ui.state.theme === 'dark' ? 'light' : 'dark';
    ui.applyTheme(nextTheme);
    ui.state.theme = nextTheme;
    ui.saveAndRender();
  });

  // Demo & Reset
  dom.btnLoadDemo?.addEventListener('click', () => ui.loadDemo());
  dom.btnReset?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data to defaults?')) {
      ui.resetPlan();
    }
  });

  // Export Menu Dropdown Toggle
  dom.btnExportMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dom.btnExportMenu.getAttribute('aria-expanded') === 'true';
    dom.btnExportMenu.setAttribute('aria-expanded', String(!isOpen));
    dom.btnExportMenu.parentElement.classList.toggle('active', !isOpen);
  });

  document.addEventListener('click', () => {
    if (dom.btnExportMenu) {
      dom.btnExportMenu.setAttribute('aria-expanded', 'false');
      dom.btnExportMenu.parentElement.classList.remove('active');
    }
  });

  // JSON Export & Import
  dom.btnExportJson?.addEventListener('click', () => ui.exportJSON());
  dom.btnImportJsonTrigger?.addEventListener('click', () => dom.importJsonFile?.click());
  dom.importJsonFile?.addEventListener('change', (e) => ui.handleFileImport(e));

  // Print Summary
  dom.btnPrintSummary?.addEventListener('click', () => ui.triggerPrintSummary());

  // Archetype Switcher Cards
  dom.archetypeCards?.forEach((card) => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) ui.switchArchetype(radio.value);
    });
  });

  // Debounced Planning Parameters
  const debouncedSave = debounce(() => ui.saveAndRender(), NUMERIC_BOUNDS.DEBOUNCE_DELAY_MS);

  dom.totalBudgetInput?.addEventListener('input', (e) => {
    ui.state.budget = sanitizeNumber(e.target.value, NUMERIC_BOUNDS.BUDGET_MIN, NUMERIC_BOUNDS.BUDGET_MAX, 25000);
    debouncedSave();
  });

  dom.guestCountInput?.addEventListener('input', (e) => {
    ui.state.guests = sanitizeNumber(e.target.value, NUMERIC_BOUNDS.GUESTS_MIN, NUMERIC_BOUNDS.GUESTS_MAX, 100);
    debouncedSave();
  });

  dom.horizonMonthsSelect?.addEventListener('change', (e) => {
    ui.updateHorizon(Number(e.target.value) || 6);
  });

  dom.locationStyleSelect?.addEventListener('change', (e) => {
    ui.state.location = e.target.value;
    ui.saveAndRender();
  });

  dom.eventVibeSelect?.addEventListener('change', (e) => {
    ui.state.vibe = e.target.value;
    ui.saveAndRender();
  });

  // Rebalance Budget Defaults
  dom.btnRebalanceDefaults?.addEventListener('click', () => {
    const arch = ARCHETYPE_DEFAULTS[ui.state.eventType] || ARCHETYPE_DEFAULTS.wedding;
    ui.state.categoryPercentages = { ...arch.percentages };
    ui.saveAndRender();
    ui.showToast('Rebalanced category allocations to archetype defaults.');
  });

  // Milestone Task Quick-Add Form
  dom.addTaskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    ui.addQuickTask();
  });

  // Accessible Vendor Tabs
  if (dom.vendorTablist) {
    setupAccessibleTabs(dom.vendorTablist, (selectedFilter, tabId) => {
      ui.activeVendorFilter = selectedFilter;
      if (dom.vendorCardsContainer) {
        dom.vendorCardsContainer.setAttribute('aria-labelledby', tabId);
      }
      ui.renderVendors();
    });
  }

  // Accessible Inventory Tabs
  if (dom.invTablist) {
    setupAccessibleTabs(dom.invTablist, (selectedFilter, tabId) => {
      ui.activeInventoryFilter = selectedFilter;
      if (dom.invTableWrapper) {
        dom.invTableWrapper.setAttribute('aria-labelledby', tabId);
      }
      ui.renderInventory();
    });
  }

  // Disclosures: Add Vendor Form
  dom.btnAddVendorToggle?.addEventListener('click', () => {
    setDisclosureState(dom.btnAddVendorToggle, dom.addVendorForm, dom.addVendorForm?.hidden, true);
  });
  dom.btnCancelVendor?.addEventListener('click', () => {
    setDisclosureState(dom.btnAddVendorToggle, dom.addVendorForm, false);
  });
  dom.addVendorForm?.addEventListener('submit', (e) => ui.handleAddVendor(e));

  // Disclosures: Add Risk Form
  dom.btnAddRiskToggle?.addEventListener('click', () => {
    setDisclosureState(dom.btnAddRiskToggle, dom.addRiskForm, dom.addRiskForm?.hidden, true);
  });
  dom.btnCancelRisk?.addEventListener('click', () => {
    setDisclosureState(dom.btnAddRiskToggle, dom.addRiskForm, false);
  });
  dom.addRiskForm?.addEventListener('submit', (e) => ui.handleAddRisk(e));

  // Disclosures: Add Inventory Form
  dom.btnAddInventoryToggle?.addEventListener('click', () => {
    setDisclosureState(dom.btnAddInventoryToggle, dom.addInventoryForm, dom.addInventoryForm?.hidden, true);
  });
  dom.btnCancelInventory?.addEventListener('click', () => {
    setDisclosureState(dom.btnAddInventoryToggle, dom.addInventoryForm, false);
  });
  dom.addInventoryForm?.addEventListener('submit', (e) => ui.handleAddInventory(e));

  // PlanGenie AI Chat
  dom.chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    ui.handleChatSubmit();
  });
  dom.btnClearChat?.addEventListener('click', () => {
    ui.clearChat();
  });

  dom.promptChips?.forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        if (dom.chatInput) dom.chatInput.value = prompt;
        ui.handleChatSubmit();
      }
    });
  });

  // Negotiation Modal
  dom.btnCloseNegotiationDialog?.addEventListener('click', () => dom.negotiationDialog?.close());
  dom.btnDismissNegotiation?.addEventListener('click', () => dom.negotiationDialog?.close());
  dom.btnCopyScript?.addEventListener('click', () => ui.copyNegotiationScript());

  // Settings Modal Controls
  dom.btnOpenSettings?.addEventListener('click', () => {
    if (dom.geminiApiKeyInput) dom.geminiApiKeyInput.value = ui.sessionApiKey;
    if (dom.geminiModelSelect) dom.geminiModelSelect.value = ui.sessionGeminiModel;
    ui.updateSettingsStatus();
    dom.settingsDialog?.showModal();
  });

  const saveSettings = (e) => {
    e.preventDefault();
    const key = dom.geminiApiKeyInput?.value.trim() || '';
    const selectedModel = dom.geminiModelSelect?.value || 'gemini-1.5-flash';
    if (key && !isValidGeminiApiKey(key)) {
      dom.geminiApiKeyInput?.setAttribute('aria-invalid', 'true');
      ui.showToast('Enter a valid Google Gemini API key or leave the field blank for offline mode.');
      return;
    }
    ui.sessionApiKey = key;
    ui.sessionGeminiModel = isSupportedGeminiModel(selectedModel) ? selectedModel : 'gemini-1.5-flash';
    dom.geminiApiKeyInput?.setAttribute('aria-invalid', 'false');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('planflow_session_gemini_model', ui.sessionGeminiModel);
    }
    ui.updateSettingsStatus();
    dom.settingsDialog?.close();
    ui.showToast(key ? 'Gemini API key applied for this open page.' : 'Reverted to offline Heuristic AI.');
  };

  dom.settingsForm?.addEventListener('submit', saveSettings);
  dom.btnSaveSettings?.addEventListener('click', saveSettings);
  dom.btnCloseSettingsDialog?.addEventListener('click', () => dom.settingsDialog?.close());
  dom.btnDismissSettings?.addEventListener('click', () => dom.settingsDialog?.close());

  dom.btnClearApiKey?.addEventListener('click', () => {
    ui.sessionApiKey = '';
    if (dom.geminiApiKeyInput) dom.geminiApiKeyInput.value = '';
    dom.geminiApiKeyInput?.setAttribute('aria-invalid', 'false');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('planflow_session_gemini_key');
    }
    ui.updateSettingsStatus();
    ui.showToast('Removed API key from page memory.');
  });
}
