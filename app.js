/**
 * @file app.js
 * @module PlanFlowAI/UI
 * @description Primary UI Controller & Reactive Presentation Orchestrator for PlanFlow AI.
 * Implements strict WCAG 2.1 AA accessibility, DOM sanitization, and memory-only credential boundaries.
 * @license MIT
 */

import {
  NUMERIC_BOUNDS,
  CURRENCIES,
  DEFAULT_CATEGORIES,
  ARCHETYPE_DEFAULTS,
  DEFAULT_RISKS,
  DEFAULT_INVENTORY,
  escapeHTML,
  sanitizeNumber,
  sanitizeString,
  debounce,
  setSanitizedHTML,
  setDisclosureState,
  setupAccessibleTabs,
  calculateBudget,
  formatCurrency,
  buildMilestones,
  calculateReadiness,
  buildSampleVendors,
  generateNegotiationScript,
  buildSampleRisks,
  calculateRiskMetrics,
  buildSampleInventory,
  calculateInventoryMetrics,
  runHeuristicAI,
  askPlanGenie,
  isValidGeminiApiKey,
  isSupportedGeminiModel,
  STORAGE_KEY,
  SCHEMA_VERSION,
  getDefaultState,
  validateAndNormalizePlan,
  saveStateToStorage,
  loadStateFromStorage,
  renderDistributionBar,
  renderCategorySliders,
  renderMilestonePhases,
  renderVendorCards,
  renderRiskCards,
  renderInventoryRows,
  formatChatMessage,
  renderChatHistory,
  generatePrintableSummaryHTML
} from './src/index.js';

// Re-export domain engines for external consumers & test runners
export * from './src/index.js';

/**
 * PlanFlowUI — Thin UI Controller orchestrating DOM interactions,
 * accessible tab navigation, and reactive state presentation.
 */
export class PlanFlowUI {
  constructor() {
    this.state = getDefaultState();

    // Page-memory-only API key (never written to browser storage or exported plans)
    this.sessionApiKey = '';
    this.sessionGeminiModel = 'gemini-1.5-flash';
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('planflow_session_gemini_key');
      const storedModel = window.sessionStorage.getItem('planflow_session_gemini_model');
      this.sessionGeminiModel = isSupportedGeminiModel(storedModel) ? storedModel : this.sessionGeminiModel;
    }

    this.activeVendorFilter = 'all';
    this.activeInventoryFilter = 'all';
    this.toastTimer = null;
    this.lastChatTimestamp = 0;

    // Cache DOM Elements
    this.cacheDOMElements();
  }

  cacheDOMElements() {
    if (typeof document === 'undefined') return;

    // Global Header & Banner
    this.currencySelect = document.getElementById('currency-select');
    this.btnThemeToggle = document.getElementById('btn-theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    this.btnLoadDemo = document.getElementById('btn-load-demo');
    this.btnReset = document.getElementById('btn-reset');
    this.btnExportMenu = document.getElementById('btn-export-menu');
    this.btnExportJson = document.getElementById('btn-export-json');
    this.btnImportJsonTrigger = document.getElementById('btn-import-json-trigger');
    this.importJsonFile = document.getElementById('import-json-file');
    this.btnPrintSummary = document.getElementById('btn-print-summary');
    this.toastNotification = document.getElementById('toast-notification');
    this.printableSummary = document.getElementById('printable-summary');

    // Step 1: Archetypes & Parameters
    this.archetypeCards = document.querySelectorAll('.archetype-card');
    this.activeArchetypeBadge = document.getElementById('active-event-badge');
    this.totalBudgetInput = document.getElementById('input-budget');
    this.guestCountInput = document.getElementById('input-guests');
    this.horizonMonthsSelect = document.getElementById('input-timeline');
    this.locationStyleSelect = document.getElementById('input-location');
    this.eventVibeSelect = document.getElementById('input-vibe');

    // Step 2: Budget Calculator
    this.currencyLabels = document.querySelectorAll('.currency-label');
    this.kpiTotalAllocated = document.getElementById('kpi-total-allocated');
    this.kpiPercentageSum = document.getElementById('kpi-percentage-sum');
    this.kpiVarianceAmount = document.getElementById('kpi-variance-amount');
    this.kpiVarianceStatus = document.getElementById('kpi-variance-status');
    this.kpiCostPerGuest = document.getElementById('kpi-per-guest');
    this.budgetWarningBanner = document.getElementById('budget-warning-banner');
    this.budgetWarningText = document.getElementById('budget-warning-text');
    this.distributionBar = document.getElementById('distribution-bar-container');
    this.categorySlidersContainer = document.getElementById('category-sliders-container');
    this.btnRebalanceDefaults = document.getElementById('btn-rebalance-budget');

    // Step 3: Roadmap & Readiness
    this.readinessScoreText = document.getElementById('readiness-score-text');
    this.readinessProgressTrack = document.getElementById('readiness-progress');
    this.readinessProgressBar = document.getElementById('readiness-progress-fill');
    this.readinessStatusBadge = document.getElementById('readiness-badge');
    this.milestonesContainer = document.getElementById('milestones-container');
    this.addTaskForm = document.getElementById('add-task-form');
    this.quickTaskInput = document.getElementById('new-task-title');
    this.quickTaskPhaseSelect = document.getElementById('new-task-phase');

    // Step 4: Vendor Tracker & Negotiation
    this.vendorTablist = document.getElementById('vendor-tablist');
    this.vendorFilterChips = document.querySelectorAll('.filter-chip:not(.inv-filter-chip)');
    this.vendorCardsContainer = document.getElementById('vendor-cards-container');
    this.btnAddVendorToggle = document.getElementById('btn-add-vendor-toggle');
    this.addVendorForm = document.getElementById('add-vendor-form');
    this.vendorNameInput = document.getElementById('vendor-name-input');
    this.vendorCategorySelect = document.getElementById('vendor-category-select');
    this.vendorQuotedInput = document.getElementById('vendor-quoted-input');
    this.vendorStatusSelect = document.getElementById('vendor-status-select');
    this.btnCancelVendor = document.getElementById('btn-cancel-vendor');

    // Step 5: Risk Analysis Matrix
    this.riskScoreText = document.getElementById('risk-score-text');
    this.riskProfileBadge = document.getElementById('risk-profile-badge');
    this.riskCardsContainer = document.getElementById('risk-cards-container');
    this.btnAddRiskToggle = document.getElementById('btn-add-risk-toggle');
    this.addRiskForm = document.getElementById('add-risk-form');
    this.riskCatSelect = document.getElementById('risk-category-select');
    this.riskTitleInput = document.getElementById('risk-title-input');
    this.riskProbSelect = document.getElementById('risk-prob-select');
    this.riskImpactSelect = document.getElementById('risk-impact-select');
    this.riskStrategyInput = document.getElementById('risk-strategy-input');
    this.btnCancelRisk = document.getElementById('btn-cancel-risk');

    // Step 6: Supplies & Equipment Inventory
    this.invTablist = document.getElementById('inv-tablist');
    this.invFilterChips = document.querySelectorAll('.inv-filter-chip');
    this.invTableWrapper = document.getElementById('inv-table-wrapper');
    this.inventoryReadinessText = document.getElementById('inventory-readiness-text');
    this.inventoryStatusBadge = document.getElementById('inventory-status-badge');
    this.inventoryTableBody = document.getElementById('inventory-table-body');
    this.btnAddInventoryToggle = document.getElementById('btn-add-inventory-toggle');
    this.addInventoryForm = document.getElementById('add-inventory-form');
    this.invNameInput = document.getElementById('inv-name-input');
    this.invCatSelect = document.getElementById('inv-cat-select');
    this.invQtyInput = document.getElementById('inv-qty-input');
    this.invStatusSelect = document.getElementById('inv-status-select');
    this.invOwnerInput = document.getElementById('inv-owner-input');
    this.btnCancelInventory = document.getElementById('btn-cancel-inventory');

    // Step 7: PlanGenie AI Chat
    this.chatMessagesContainer = document.getElementById('chat-messages-container');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input-field');
    this.btnClearChat = document.getElementById('btn-clear-chat');
    this.promptChips = document.querySelectorAll('.prompt-chip');

    // Negotiation Script Dialog
    this.negotiationDialog = document.getElementById('negotiation-dialog');
    this.btnCloseNegotiationDialog = document.getElementById('btn-close-negotiation-dialog');
    this.negotiationMetaInfo = document.getElementById('negotiation-meta-info');
    this.negotiationScriptContent = document.getElementById('negotiation-script-content');
    this.negotiationTipsList = document.getElementById('negotiation-tips-list');
    this.btnCopyScript = document.getElementById('btn-copy-script');
    this.btnDismissNegotiation = document.getElementById('btn-dismiss-negotiation');
    this.copyBtnText = document.getElementById('copy-btn-text');
    this.btnEmailMailto = document.getElementById('btn-email-mailto');

    // AI Settings Dialog
    this.settingsDialog = document.getElementById('settings-dialog');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnCloseSettingsDialog = document.getElementById('btn-close-settings-dialog');
    this.btnDismissSettings = document.getElementById('btn-dismiss-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.settingsForm = document.getElementById('settings-form');
    this.geminiApiKeyInput = document.getElementById('gemini-api-key-input');
    this.geminiModelSelect = document.getElementById('gemini-model-select');
    this.settingsEngineStatus = document.getElementById('settings-engine-status');
    this.btnClearApiKey = document.getElementById('btn-clear-api-key');
  }

  init() {
    this.state = loadStateFromStorage();
    this.bindEvents();
    this.syncFormFromState();
    this.applyTheme(this.state.theme || 'dark');
    this.renderAll();
  }

  bindEvents() {
    // Currency
    this.currencySelect?.addEventListener('change', (e) => {
      this.state.currency = e.target.value;
      this.saveAndRender();
      this.showToast(`Currency updated to ${this.state.currency}`);
    });

    // Theme Toggle
    this.btnThemeToggle?.addEventListener('click', () => {
      const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
      this.state.theme = nextTheme;
      saveStateToStorage(this.state);
    });

    // Reset & Demo
    this.btnLoadDemo?.addEventListener('click', () => this.loadDemo());
    this.btnReset?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data to defaults?')) {
        this.state = getDefaultState();
        this.syncFormFromState();
        this.saveAndRender();
        this.showToast('Reset plan to fresh initial state.');
      }
    });

    // Export Dropdown
    this.btnExportMenu?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = this.btnExportMenu.getAttribute('aria-expanded') === 'true';
      this.btnExportMenu.setAttribute('aria-expanded', String(!isOpen));
      this.btnExportMenu.parentElement.classList.toggle('active', !isOpen);
    });

    document.addEventListener('click', () => {
      if (this.btnExportMenu) {
        this.btnExportMenu.setAttribute('aria-expanded', 'false');
        this.btnExportMenu.parentElement.classList.remove('active');
      }
    });

    // JSON Export & Import
    this.btnExportJson?.addEventListener('click', () => this.exportJSON());
    this.btnImportJsonTrigger?.addEventListener('click', () => this.importJsonFile?.click());
    this.importJsonFile?.addEventListener('change', (e) => this.handleFileImport(e));

    // Print Summary
    this.btnPrintSummary?.addEventListener('click', () => this.triggerPrintSummary());

    // Archetype Switcher
    this.archetypeCards?.forEach((card) => {
      card.addEventListener('click', () => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio) this.switchArchetype(radio.value);
      });
    });

    // Debounced Parameter Inputs
    const debouncedSave = debounce(() => this.saveAndRender(), NUMERIC_BOUNDS.DEBOUNCE_DELAY_MS);

    this.totalBudgetInput?.addEventListener('input', (e) => {
      this.state.budget = sanitizeNumber(e.target.value, NUMERIC_BOUNDS.BUDGET_MIN, NUMERIC_BOUNDS.BUDGET_MAX, 25000);
      debouncedSave();
    });

    this.guestCountInput?.addEventListener('input', (e) => {
      this.state.guests = sanitizeNumber(e.target.value, NUMERIC_BOUNDS.GUESTS_MIN, NUMERIC_BOUNDS.GUESTS_MAX, 100);
      debouncedSave();
    });

    this.horizonMonthsSelect?.addEventListener('change', (e) => {
      this.state.horizon = Number(e.target.value) || 6;
      this.state.milestones = buildMilestones(this.state.eventType, this.state.horizon);
      this.saveAndRender();
    });

    this.locationStyleSelect?.addEventListener('change', (e) => {
      this.state.location = e.target.value;
      this.saveAndRender();
    });

    this.eventVibeSelect?.addEventListener('change', (e) => {
      this.state.vibe = e.target.value;
      this.saveAndRender();
    });

    // Rebalance Defaults
    this.btnRebalanceDefaults?.addEventListener('click', () => {
      const arch = ARCHETYPE_DEFAULTS[this.state.eventType] || ARCHETYPE_DEFAULTS.wedding;
      this.state.categoryPercentages = { ...arch.percentages };
      this.saveAndRender();
      this.showToast('Rebalanced category allocations to archetype defaults.');
    });

    // Milestone Quick-Add
    this.addTaskForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addQuickTask();
    });

    // Accessible Tabs: Vendors
    if (this.vendorTablist) {
      setupAccessibleTabs(this.vendorTablist, (selectedFilter, tabId) => {
        this.activeVendorFilter = selectedFilter;
        if (this.vendorCardsContainer) {
          this.vendorCardsContainer.setAttribute('aria-labelledby', tabId);
        }
        this.renderVendors();
      });
    }

    // Accessible Tabs: Inventory
    if (this.invTablist) {
      setupAccessibleTabs(this.invTablist, (selectedFilter, tabId) => {
        this.activeInventoryFilter = selectedFilter;
        if (this.invTableWrapper) {
          this.invTableWrapper.setAttribute('aria-labelledby', tabId);
        }
        this.renderInventory();
      });
    }

    // Vendor Form
    this.btnAddVendorToggle?.addEventListener('click', () => {
      setDisclosureState(this.btnAddVendorToggle, this.addVendorForm, this.addVendorForm?.hidden, true);
    });
    this.btnCancelVendor?.addEventListener('click', () => {
      setDisclosureState(this.btnAddVendorToggle, this.addVendorForm, false);
    });
    this.addVendorForm?.addEventListener('submit', (e) => this.handleAddVendor(e));

    // Risk Form
    this.btnAddRiskToggle?.addEventListener('click', () => {
      setDisclosureState(this.btnAddRiskToggle, this.addRiskForm, this.addRiskForm?.hidden, true);
    });
    this.btnCancelRisk?.addEventListener('click', () => {
      setDisclosureState(this.btnAddRiskToggle, this.addRiskForm, false);
    });
    this.addRiskForm?.addEventListener('submit', (e) => this.handleAddRisk(e));

    // Inventory Form
    this.btnAddInventoryToggle?.addEventListener('click', () => {
      setDisclosureState(this.btnAddInventoryToggle, this.addInventoryForm, this.addInventoryForm?.hidden, true);
    });
    this.btnCancelInventory?.addEventListener('click', () => {
      setDisclosureState(this.btnAddInventoryToggle, this.addInventoryForm, false);
    });
    this.addInventoryForm?.addEventListener('submit', (e) => this.handleAddInventory(e));

    // PlanGenie Chat
    this.chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleChatSubmit();
    });
    this.btnClearChat?.addEventListener('click', () => {
      this.state.chatHistory = getDefaultState(this.state.eventType).chatHistory;
      this.saveAndRender();
      this.showToast('Conversation cleared.');
    });

    this.promptChips?.forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          if (this.chatInput) this.chatInput.value = prompt;
          this.handleChatSubmit();
        }
      });
    });

    // Negotiation Dialog Controls
    this.btnCloseNegotiationDialog?.addEventListener('click', () => this.negotiationDialog?.close());
    this.btnDismissNegotiation?.addEventListener('click', () => this.negotiationDialog?.close());
    this.btnCopyScript?.addEventListener('click', () => this.copyNegotiationScript());

    // Settings Dialog Controls
    this.btnOpenSettings?.addEventListener('click', () => {
      if (this.geminiApiKeyInput) this.geminiApiKeyInput.value = this.sessionApiKey;
      if (this.geminiModelSelect) this.geminiModelSelect.value = this.sessionGeminiModel;
      this.updateSettingsStatus();
      this.settingsDialog?.showModal();
    });

    const saveSettings = (e) => {
      e.preventDefault();
      const key = this.geminiApiKeyInput?.value.trim() || '';
      const selectedModel = this.geminiModelSelect?.value || 'gemini-1.5-flash';
      if (key && !isValidGeminiApiKey(key)) {
        this.geminiApiKeyInput?.setAttribute('aria-invalid', 'true');
        this.showToast('Enter a valid Google Gemini API key or leave the field blank for offline mode.');
        return;
      }
      this.sessionApiKey = key;
      this.sessionGeminiModel = isSupportedGeminiModel(selectedModel) ? selectedModel : 'gemini-1.5-flash';
      this.geminiApiKeyInput?.setAttribute('aria-invalid', 'false');
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('planflow_session_gemini_model', this.sessionGeminiModel);
      }
      this.updateSettingsStatus();
      this.settingsDialog?.close();
      this.showToast(key ? 'Gemini API key applied for this open page.' : 'Reverted to offline Heuristic AI.');
    };

    this.settingsForm?.addEventListener('submit', saveSettings);
    this.btnSaveSettings?.addEventListener('click', saveSettings);
    this.btnCloseSettingsDialog?.addEventListener('click', () => this.settingsDialog?.close());
    this.btnDismissSettings?.addEventListener('click', () => this.settingsDialog?.close());

    this.btnClearApiKey?.addEventListener('click', () => {
      this.sessionApiKey = '';
      if (this.geminiApiKeyInput) this.geminiApiKeyInput.value = '';
      this.geminiApiKeyInput?.setAttribute('aria-invalid', 'false');
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('planflow_session_gemini_key');
      }
      this.updateSettingsStatus();
      this.showToast('Removed API key from page memory.');
    });
  }

  syncFormFromState() {
    if (this.currencySelect) this.currencySelect.value = this.state.currency;
    if (this.totalBudgetInput) this.totalBudgetInput.value = this.state.budget;
    if (this.guestCountInput) this.guestCountInput.value = this.state.guests;
    if (this.horizonMonthsSelect) this.horizonMonthsSelect.value = this.state.horizon;
    if (this.locationStyleSelect) this.locationStyleSelect.value = this.state.location;
    if (this.eventVibeSelect) this.eventVibeSelect.value = this.state.vibe;

    this.archetypeCards?.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        const isMatch = radio.value === this.state.eventType;
        radio.checked = isMatch;
        card.classList.toggle('active', isMatch);
      }
    });

    const arch = ARCHETYPE_DEFAULTS[this.state.eventType] || ARCHETYPE_DEFAULTS.wedding;
    if (this.activeArchetypeBadge) this.activeArchetypeBadge.textContent = `${arch.title} Mode`;
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (this.themeIcon) {
      this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  switchArchetype(newArchetype) {
    if (!ARCHETYPE_DEFAULTS[newArchetype]) return;
    this.state = getDefaultState(newArchetype);
    this.syncFormFromState();
    this.saveAndRender();
    this.showToast(`Switched plan archetype to ${ARCHETYPE_DEFAULTS[newArchetype].title}!`);
  }

  saveAndRender() {
    saveStateToStorage(this.state);
    this.renderAll();
  }

  renderAll() {
    this.renderCurrencySymbols();
    this.renderBudget();
    this.renderRoadmap();
    this.renderVendors();
    this.renderRisks();
    this.renderInventory();
    this.renderChat();
  }

  renderCurrencySymbols() {
    const symbol = CURRENCIES[this.state.currency]?.symbol || '$';
    this.currencyLabels?.forEach((label) => {
      label.textContent = symbol;
    });
  }

  renderBudget() {
    const budgetData = calculateBudget(
      this.state.budget,
      this.state.categoryPercentages,
      this.state.currency,
      this.state.guests
    );

    if (this.kpiTotalAllocated) this.kpiTotalAllocated.textContent = formatCurrency(budgetData.allocatedTotal, this.state.currency);
    if (this.kpiPercentageSum) {
      this.kpiPercentageSum.textContent = `${budgetData.sumPercentage}% of Total Budget`;
      this.kpiPercentageSum.className = `kpi-subtext ${budgetData.isBalanced ? 'text-success' : budgetData.isOverBudget ? 'text-danger' : 'text-warning'}`;
    }
    if (this.kpiCostPerGuest) this.kpiCostPerGuest.textContent = `${formatCurrency(budgetData.costPerGuest, this.state.currency)} / guest`;

    if (this.kpiVarianceAmount) {
      const isOver = budgetData.isOverBudget;
      const isBalanced = budgetData.isBalanced;
      const varianceFormatted = formatCurrency(Math.abs(budgetData.varianceAmount), this.state.currency);

      if (isBalanced) {
        this.kpiVarianceAmount.textContent = `${formatCurrency(0, this.state.currency)} (Balanced)`;
        this.kpiVarianceAmount.className = 'kpi-value text-success';
        if (this.kpiVarianceStatus) {
          this.kpiVarianceStatus.textContent = '100% Allocated';
          this.kpiVarianceStatus.className = 'kpi-subtext text-success';
        }
      } else if (isOver) {
        this.kpiVarianceAmount.textContent = `+${varianceFormatted} (Over)`;
        this.kpiVarianceAmount.className = 'kpi-value text-danger';
        if (this.kpiVarianceStatus) {
          this.kpiVarianceStatus.textContent = `${budgetData.sumPercentage}% Allocated`;
          this.kpiVarianceStatus.className = 'kpi-subtext text-danger';
        }
      } else {
        this.kpiVarianceAmount.textContent = `-${varianceFormatted} (Reserve)`;
        this.kpiVarianceAmount.className = 'kpi-value text-warning';
        if (this.kpiVarianceStatus) {
          this.kpiVarianceStatus.textContent = `${budgetData.sumPercentage}% Allocated (Reserve Available)`;
          this.kpiVarianceStatus.className = 'kpi-subtext text-warning';
        }
      }
    }

    if (this.budgetWarningBanner && this.budgetWarningText) {
      if (budgetData.isBalanced) {
        this.budgetWarningBanner.classList.add('hidden');
      } else if (budgetData.isOverBudget) {
        this.budgetWarningBanner.classList.remove('hidden');
        this.budgetWarningBanner.className = 'alert-banner alert-danger';
        this.budgetWarningText.textContent = `Warning: Over budget by ${budgetData.sumPercentage - 100}% (${formatCurrency(Math.abs(budgetData.varianceAmount), this.state.currency)}). Rebalance categories below.`;
      } else {
        this.budgetWarningBanner.classList.remove('hidden');
        this.budgetWarningBanner.className = 'alert-banner alert-warning';
        this.budgetWarningText.textContent = `Notice: Under-allocated. Current total is ${budgetData.sumPercentage}%. You have ${formatCurrency(budgetData.varianceAmount, this.state.currency)} in unassigned reserve.`;
      }
    }

    renderDistributionBar(this.distributionBar, budgetData.categories, this.state.currency);

    renderCategorySliders(
      this.categorySlidersContainer,
      budgetData.categories,
      this.state.currency,
      (catId, nextValue) => {
        this.state.categoryPercentages[catId] = nextValue;
        this.saveAndRender();
      }
    );
  }

  renderRoadmap() {
    const readiness = calculateReadiness(this.state.milestones);
    if (this.readinessScoreText) this.readinessScoreText.textContent = `${readiness.score}%`;
    if (this.readinessProgressBar) this.readinessProgressBar.style.width = `${readiness.score}%`;
    if (this.readinessProgressTrack) this.readinessProgressTrack.setAttribute('aria-valuenow', String(readiness.score));
    if (this.readinessStatusBadge) this.readinessStatusBadge.textContent = readiness.status;

    renderMilestonePhases(
      this.milestonesContainer,
      this.state.milestones,
      (task, done) => {
        task.done = done;
        this.saveAndRender();
      },
      (taskId) => {
        this.state.milestones = this.state.milestones.filter((m) => m.id !== taskId);
        this.saveAndRender();
      }
    );
  }

  addQuickTask() {
    const text = sanitizeString(this.quickTaskInput?.value, NUMERIC_BOUNDS.TEXT_MAX_LEN);
    if (!text) return;

    const phaseId = this.quickTaskPhaseSelect?.value || 'phase-custom';
    const phaseTitleMap = {
      'phase-long': '6+ Months Out: Vision, Venue & Big Picture',
      'phase-mid': '3 Months Out: Vendors & Guest Experience',
      'phase-near': '1 Month Out: Final Details & Confirmation',
      'phase-week': 'Week Of Event: Final Logistics',
      'phase-day': 'Day-Of Run-of-Show'
    };

    this.state.milestones.push({
      id: `m-custom-${Date.now()}`,
      phaseId,
      phaseTitle: phaseTitleMap[phaseId] || 'Custom Phase',
      text,
      done: false
    });

    if (this.quickTaskInput) this.quickTaskInput.value = '';
    this.saveAndRender();
    this.showToast('Added custom task to roadmap!');
  }

  renderVendors() {
    renderVendorCards(
      this.vendorCardsContainer,
      this.state.vendors,
      this.activeVendorFilter,
      this.state.currency,
      (vendor, nextStatus) => {
        vendor.status = nextStatus;
        this.saveAndRender();
      },
      (vendor) => this.openNegotiationModal(vendor),
      (vendorId, vendorName) => {
        this.state.vendors = this.state.vendors.filter((v) => v.id !== vendorId);
        this.saveAndRender();
        this.showToast(`Removed vendor: ${vendorName}`);
      }
    );
  }

  handleAddVendor(e) {
    e.preventDefault();
    const name = sanitizeString(this.vendorNameInput?.value, 100);
    const category = this.vendorCategorySelect?.value || 'Venue';
    const quoted = sanitizeNumber(this.vendorQuotedInput?.value, 0, 100000000, 0);
    const status = this.vendorStatusSelect?.value || 'Prospecting';
    const notes = '';

    if (!name) return;

    this.state.vendors.push({
      id: `v-custom-${Date.now()}`,
      name,
      category,
      quoted,
      status,
      notes
    });

    this.addVendorForm?.reset();
    setDisclosureState(this.btnAddVendorToggle, this.addVendorForm, false);
    this.saveAndRender();
    this.showToast(`Added vendor: ${name}`);
  }

  renderRisks() {
    const metrics = calculateRiskMetrics(this.state.risks);
    if (this.riskScoreText) this.riskScoreText.textContent = `${metrics.safetyScore}%`;
    if (this.riskProfileBadge) {
      this.riskProfileBadge.textContent = metrics.profile;
      this.riskProfileBadge.className = metrics.safetyScore >= 80 ? 'badge badge-success' : 'badge badge-warning';
    }

    renderRiskCards(
      this.riskCardsContainer,
      this.state.risks,
      (risk, nextStatus) => {
        risk.status = nextStatus;
        this.saveAndRender();
      },
      (riskId) => {
        this.state.risks = this.state.risks.filter((r) => r.id !== riskId);
        this.saveAndRender();
        this.showToast('Removed risk item.');
      }
    );
  }

  handleAddRisk(e) {
    e.preventDefault();
    const category = this.riskCatSelect?.value || 'General';
    const title = sanitizeString(this.riskTitleInput?.value, 120);
    const probability = this.riskProbSelect?.value || 'Medium';
    const impact = this.riskImpactSelect?.value || 'Moderate';
    const strategy = sanitizeString(this.riskStrategyInput?.value, NUMERIC_BOUNDS.TEXT_MAX_LEN);

    if (!title || !strategy) return;

    this.state.risks.push({
      id: `r-custom-${Date.now()}`,
      category,
      title,
      probability,
      impact,
      strategy,
      status: 'Action Needed'
    });

    this.addRiskForm?.reset();
    setDisclosureState(this.btnAddRiskToggle, this.addRiskForm, false);
    this.saveAndRender();
    this.showToast('Logged new event risk.');
  }

  renderInventory() {
    const metrics = calculateInventoryMetrics(this.state.inventory);
    if (this.inventoryReadinessText) this.inventoryReadinessText.textContent = `${metrics.readinessPct}%`;
    if (this.inventoryStatusBadge) this.inventoryStatusBadge.textContent = metrics.status;

    renderInventoryRows(
      this.inventoryTableBody,
      this.state.inventory,
      this.activeInventoryFilter,
      (item, nextStatus) => {
        item.status = nextStatus;
        this.saveAndRender();
      },
      (itemId, itemName) => {
        this.state.inventory = this.state.inventory.filter((i) => i.id !== itemId);
        this.saveAndRender();
        this.showToast(`Removed item: ${itemName}`);
      }
    );
  }

  handleAddInventory(e) {
    e.preventDefault();
    const name = sanitizeString(this.invNameInput?.value, 100);
    const category = this.invCatSelect?.value || 'Logistics';
    const quantity = Math.max(1, Math.round(sanitizeNumber(this.invQtyInput?.value, 1, 10000, 1)));
    const status = this.invStatusSelect?.value || 'Packed';
    const owner = sanitizeString(this.invOwnerInput?.value, 60) || 'Coordinator';

    if (!name) return;

    this.state.inventory.push({
      id: `inv-custom-${Date.now()}`,
      name,
      category,
      quantity,
      status,
      owner
    });

    this.addInventoryForm?.reset();
    setDisclosureState(this.btnAddInventoryToggle, this.addInventoryForm, false);
    this.saveAndRender();
    this.showToast(`Added supply: ${name}`);
  }

  renderChat() {
    renderChatHistory(this.chatMessagesContainer, this.state.chatHistory);
  }

  async handleChatSubmit() {
    const now = Date.now();
    if (now - this.lastChatTimestamp < 1500) {
      this.showToast('Please wait a moment before sending another prompt.');
      return;
    }
    this.lastChatTimestamp = now;

    const prompt = sanitizeString(this.chatInput?.value, NUMERIC_BOUNDS.CHAT_MAX_LEN);
    if (!prompt) return;

    if (this.chatInput) this.chatInput.value = '';

    this.state.chatHistory.push({ sender: 'user', text: prompt });
    this.renderChat();

    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'chat-bubble chat-bubble-bot';
    thinkingBubble.id = 'temp-thinking';
    setSanitizedHTML(thinkingBubble, '<em>PlanGenie is formulating your custom event strategy...</em>');
    this.chatMessagesContainer?.appendChild(thinkingBubble);
    this.chatMessagesContainer?.scrollTo({ top: this.chatMessagesContainer.scrollHeight, behavior: 'smooth' });

    const readiness = calculateReadiness(this.state.milestones);
    const context = {
      eventType: this.state.eventType,
      budget: this.state.budget,
      guests: this.state.guests,
      horizon: this.state.horizon,
      location: this.state.location,
      vibe: this.state.vibe,
      currencySymbol: CURRENCIES[this.state.currency]?.symbol || '$',
      readinessScore: readiness.score
    };

    const reply = await askPlanGenie(prompt, context, this.sessionApiKey, this.sessionGeminiModel);

    document.getElementById('temp-thinking')?.remove();
    this.state.chatHistory.push({ sender: 'bot', text: reply });
    this.saveAndRender();
  }

  openNegotiationModal(vendor) {
    const budgetData = calculateBudget(
      this.state.budget,
      this.state.categoryPercentages,
      this.state.currency,
      this.state.guests
    );
    const categoryInfo = budgetData.categories.find((c) => c.name.toLowerCase().includes(vendor.category.toLowerCase())) || budgetData.categories[0];
    const targetBudget = categoryInfo ? categoryInfo.amount : Math.round(vendor.quoted * 0.85);

    const scriptData = generateNegotiationScript({
      vendorName: vendor.name,
      category: vendor.category,
      quotedPrice: vendor.quoted,
      targetBudget,
      eventType: this.state.eventType,
      guestCount: this.state.guests,
      currencySymbol: CURRENCIES[this.state.currency]?.symbol || '$'
    });

    if (this.negotiationMetaInfo) {
      setSanitizedHTML(this.negotiationMetaInfo, `
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
          Targeting: <strong>${escapeHTML(vendor.name)}</strong> (${escapeHTML(vendor.category)}) • Quoted: <strong>${formatCurrency(vendor.quoted, this.state.currency)}</strong>
        </div>
      `);
    }

    if (this.negotiationScriptContent) {
      this.negotiationScriptContent.textContent = `Subject: ${scriptData.subject}\n\n${scriptData.body}`;
    }
    if (this.negotiationTipsList) {
      this.negotiationTipsList.replaceChildren(...scriptData.tips.map((tip) => {
        const item = document.createElement('li');
        item.textContent = tip;
        return item;
      }));
    }

    if (this.btnEmailMailto) {
      const mailto = `mailto:?subject=${encodeURIComponent(scriptData.subject)}&body=${encodeURIComponent(scriptData.body)}`;
      this.btnEmailMailto.setAttribute('href', mailto);
    }

    this.negotiationDialog?.showModal();
  }

  copyNegotiationScript() {
    if (!this.negotiationScriptContent) return;
    navigator.clipboard.writeText(this.negotiationScriptContent.textContent).then(() => {
      if (this.copyBtnText) this.copyBtnText.textContent = '✓ Copied!';
      setTimeout(() => {
        if (this.copyBtnText) this.copyBtnText.textContent = '📋 Copy to Clipboard';
      }, 2500);
      this.showToast('Copied negotiation script to clipboard!');
    });
  }

  updateSettingsStatus() {
    if (!this.settingsEngineStatus) return;
    if (isValidGeminiApiKey(this.sessionApiKey)) {
      this.settingsEngineStatus.textContent = 'Active: Google Gemini Live API (Session Only)';
      this.settingsEngineStatus.className = 'text-success';
    } else {
      this.settingsEngineStatus.textContent = 'Using Local Contextual Heuristic AI (100% Offline)';
      this.settingsEngineStatus.className = 'text-muted';
    }
  }

  exportJSON() {
    // Explicitly scrub state before export
    const exportState = { ...this.state };
    delete exportState.geminiApiKey;
    delete exportState.apiKey;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `planflow_event_plan_${this.state.eventType}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Exported clean JSON plan backup!');
  }

  handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
        // Schema normalization strips malicious injections & validates types
        this.state = validateAndNormalizePlan(raw);
        this.syncFormFromState();
        this.saveAndRender();
        this.showToast('Plan validated and imported securely!');
      } catch (err) {
        alert('Invalid or corrupted JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  triggerPrintSummary() {
    const budgetData = calculateBudget(
      this.state.budget,
      this.state.categoryPercentages,
      this.state.currency,
      this.state.guests
    );
    const readiness = calculateReadiness(this.state.milestones);
    const riskMetrics = calculateRiskMetrics(this.state.risks || []);
    const invMetrics = calculateInventoryMetrics(this.state.inventory || []);
    const arch = ARCHETYPE_DEFAULTS[this.state.eventType] || ARCHETYPE_DEFAULTS.wedding;

    if (this.printableSummary) {
      setSanitizedHTML(
        this.printableSummary,
        generatePrintableSummaryHTML({
          budgetData,
          readiness,
          riskMetrics,
          invMetrics,
          arch,
          state: this.state
        })
      );
    }

    window.print();
  }

  loadDemo() {
    this.state = getDefaultState('wedding');
    this.state.budget = 35000;
    this.state.guests = 150;
    this.syncFormFromState();
    this.saveAndRender();
    this.showToast('Loaded demo celebration data!');
  }

  showToast(message) {
    if (!this.toastNotification) return;
    this.toastNotification.textContent = message;
    this.toastNotification.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastNotification.classList.remove('show');
    }, 2800);
  }
}

// Auto-initialize when executing in the browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const app = new PlanFlowUI();
    app.init();
  });
}
