/**
 * @file app.js
 * @module PlanFlowAI/UI
 * @description Primary UI Controller & Reactive Presentation Layer for PlanFlow AI.
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
  loadStateFromStorage
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
      // Clear a key persisted by an earlier release at the next safe application load.
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
    this.archetypeCards?.forEach(card => {
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

    this.promptChips?.forEach(chip => {
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

    this.archetypeCards?.forEach(card => {
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
    this.currencyLabels?.forEach(label => {
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

    // Distribution Bar (Safe DOM Nodes)
    if (this.distributionBar) {
      this.distributionBar.replaceChildren();
      budgetData.categories.forEach(cat => {
        if (cat.percentage > 0) {
          const seg = document.createElement('div');
          seg.className = 'distribution-segment';
          seg.style.width = `${cat.percentage}%`;
          seg.style.backgroundColor = cat.color;
          seg.setAttribute('aria-label', `${cat.name}: ${cat.percentage}%`);
          seg.title = `${cat.name}: ${cat.percentage}% (${formatCurrency(cat.amount, this.state.currency)})`;
          this.distributionBar.appendChild(seg);
        }
      });
    }

    // Category Sliders
    if (this.categorySlidersContainer) {
      this.categorySlidersContainer.replaceChildren();
      budgetData.categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'slider-card';
        card.style.setProperty('--category-color', cat.color);

        setSanitizedHTML(card, `
          <div class="slider-card-header">
            <span class="slider-category-name">
              <span style="color: ${cat.color}; font-size: 1.1rem;">●</span>
              ${escapeHTML(cat.name)}
            </span>
            <span class="slider-percent-badge">${cat.percentage}%</span>
          </div>
          <div class="slider-control-row">
            <button class="slider-btn-step btn-step-down" data-cat="${cat.id}" aria-label="Decrease ${escapeHTML(cat.name)} by 5%">-</button>
            <input type="range" class="slider-input" min="0" max="100" step="1" value="${cat.percentage}"
                   data-cat="${cat.id}" aria-label="${escapeHTML(cat.name)} percentage slider">
            <button class="slider-btn-step btn-step-up" data-cat="${cat.id}" aria-label="Increase ${escapeHTML(cat.name)} by 5%">+</button>
          </div>
          <div class="slider-card-footer">
            <span>Est. ${formatCurrency(cat.perGuest, this.state.currency)} / guest</span>
            <span class="slider-amount">${formatCurrency(cat.amount, this.state.currency)}</span>
          </div>
        `);

        const rangeInput = card.querySelector('.slider-input');
        const stepDown = card.querySelector('.btn-step-down');
        const stepUp = card.querySelector('.btn-step-up');

        rangeInput?.addEventListener('input', (e) => {
          this.state.categoryPercentages[cat.id] = Number(e.target.value);
          this.saveAndRender();
        });

        stepDown?.addEventListener('click', () => {
          this.state.categoryPercentages[cat.id] = Math.max(0, cat.percentage - 5);
          this.saveAndRender();
        });

        stepUp?.addEventListener('click', () => {
          this.state.categoryPercentages[cat.id] = Math.min(100, cat.percentage + 5);
          this.saveAndRender();
        });

        this.categorySlidersContainer.appendChild(card);
      });
    }
  }

  renderRoadmap() {
    const readiness = calculateReadiness(this.state.milestones);
    if (this.readinessScoreText) this.readinessScoreText.textContent = `${readiness.score}%`;
    if (this.readinessProgressBar) this.readinessProgressBar.style.width = `${readiness.score}%`;
    if (this.readinessProgressTrack) this.readinessProgressTrack.setAttribute('aria-valuenow', String(readiness.score));
    if (this.readinessStatusBadge) this.readinessStatusBadge.textContent = readiness.status;

    if (!this.milestonesContainer) return;
    this.milestonesContainer.replaceChildren();

    // Group tasks by phase
    const phases = {};
    this.state.milestones.forEach(t => {
      const pid = t.phaseId || 'general';
      if (!phases[pid]) {
        phases[pid] = { title: t.phaseTitle || 'Milestone Phase', tasks: [] };
      }
      phases[pid].tasks.push(t);
    });

    Object.keys(phases).forEach(pid => {
      const phase = phases[pid];
      const completedCount = phase.tasks.filter(t => t.done).length;
      const totalCount = phase.tasks.length;

      const card = document.createElement('div');
      card.className = 'milestone-phase-card';

      setSanitizedHTML(card, `
        <div class="milestone-phase-header">
          <div class="phase-title-group">
            <span class="phase-title">${escapeHTML(phase.title)}</span>
          </div>
          <span class="phase-meta">${completedCount} of ${totalCount} completed</span>
        </div>
        <ul class="milestone-task-list"></ul>
      `);

      const listEl = card.querySelector('.milestone-task-list');

      phase.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.done ? 'completed' : ''}`;
        const chkId = `chk-${task.id}`;

        setSanitizedHTML(li, `
          <label class="task-checkbox-label" for="${chkId}">
            <input type="checkbox" id="${chkId}" class="task-checkbox" ${task.done ? 'checked' : ''}>
            <span class="task-label">${escapeHTML(task.text)}</span>
          </label>
          <div class="task-actions">
            <button class="btn-task-del" aria-label="Delete task: ${escapeHTML(task.text)}" title="Delete task">✕</button>
          </div>
        `);

        const chk = li.querySelector('.task-checkbox');
        chk?.addEventListener('change', () => {
          task.done = chk.checked;
          this.saveAndRender();
        });

        const delBtn = li.querySelector('.btn-task-del');
        delBtn?.addEventListener('click', () => {
          this.state.milestones = this.state.milestones.filter(m => m.id !== task.id);
          this.saveAndRender();
        });

        listEl?.appendChild(li);
      });

      this.milestonesContainer.appendChild(card);
    });
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
    if (!this.vendorCardsContainer) return;
    this.vendorCardsContainer.replaceChildren();

    const filtered = this.state.vendors.filter(v => {
      if (this.activeVendorFilter === 'all') return true;
      return v.category === this.activeVendorFilter;
    });

    if (filtered.length === 0) {
      setSanitizedHTML(this.vendorCardsContainer, `
        <div class="kpi-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p style="color: var(--text-muted);">No vendors found matching this filter.</p>
        </div>
      `);
      return;
    }

    filtered.forEach(vendor => {
      const card = document.createElement('div');
      card.className = 'vendor-card';

      setSanitizedHTML(card, `
        <div class="vendor-card-header">
          <div>
            <div class="vendor-name">${escapeHTML(vendor.name)}</div>
            <span class="vendor-category-badge">${escapeHTML(vendor.category)}</span>
          </div>
          <select class="vendor-status-select" aria-label="Status for ${escapeHTML(vendor.name)}">
            <option value="Prospecting" ${vendor.status === 'Prospecting' ? 'selected' : ''}>Prospecting</option>
            <option value="Contacted" ${vendor.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Negotiating" ${vendor.status === 'Negotiating' ? 'selected' : ''}>Negotiating</option>
            <option value="Booked" ${vendor.status === 'Booked' ? 'selected' : ''}>Booked</option>
          </select>
        </div>
        <div class="vendor-price-row">
          <span>Quoted: <strong>${formatCurrency(vendor.quoted, this.state.currency)}</strong></span>
        </div>
        ${vendor.notes ? `<div class="vendor-notes">${escapeHTML(vendor.notes)}</div>` : ''}
        <div class="vendor-card-actions">
          <button class="btn btn-secondary btn-sm btn-negotiate" style="flex: 1;">✨ AI Negotiation Script</button>
          <button class="btn btn-ghost btn-sm btn-del-vendor" aria-label="Delete vendor: ${escapeHTML(vendor.name)}" title="Delete vendor">✕</button>
        </div>
      `);

      const statusSelect = card.querySelector('.vendor-status-select');
      statusSelect?.addEventListener('change', (e) => {
        vendor.status = e.target.value;
        this.saveAndRender();
      });

      const btnNegotiate = card.querySelector('.btn-negotiate');
      btnNegotiate?.addEventListener('click', () => this.openNegotiationModal(vendor));

      const btnDel = card.querySelector('.btn-del-vendor');
      btnDel?.addEventListener('click', () => {
        this.state.vendors = this.state.vendors.filter(v => v.id !== vendor.id);
        this.saveAndRender();
        this.showToast(`Removed vendor: ${vendor.name}`);
      });

      this.vendorCardsContainer.appendChild(card);
    });
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

    if (!this.riskCardsContainer) return;
    this.riskCardsContainer.replaceChildren();

    this.state.risks.forEach(risk => {
      const card = document.createElement('div');
      card.className = 'risk-card';

      const probClass = risk.probability === 'High' ? 'text-danger' : risk.probability === 'Medium' ? 'text-warning' : 'text-success';
      const impactClass = risk.impact === 'Critical' ? 'badge badge-danger' : 'badge badge-warning';

      setSanitizedHTML(card, `
        <div class="risk-card-header">
          <div class="risk-title-wrap">
            <span class="risk-cat-tag">${escapeHTML(risk.category)}</span>
            <span class="risk-title">${escapeHTML(risk.title)}</span>
          </div>
          <select class="risk-status-select" aria-label="Status for ${escapeHTML(risk.title)}">
            <option value="Mitigated" ${risk.status === 'Mitigated' ? 'selected' : ''}>✓ Mitigated</option>
            <option value="Monitoring" ${risk.status === 'Monitoring' ? 'selected' : ''}>⏳ Monitoring</option>
            <option value="Action Needed" ${risk.status === 'Action Needed' ? 'selected' : ''}>⚠️ Action Needed</option>
          </select>
        </div>
        <div class="risk-meta-row">
          <span>Probability: <strong class="${probClass}">${escapeHTML(risk.probability)}</strong></span>
          <span>Impact: <span class="${impactClass}">${escapeHTML(risk.impact)}</span></span>
        </div>
        <div class="risk-strategy-box">
          <strong>Mitigation Protocol:</strong> ${escapeHTML(risk.strategy)}
        </div>
        <div style="text-align: right; margin-top: 0.5rem;">
          <button class="btn btn-ghost btn-sm text-danger btn-del-risk" aria-label="Delete risk: ${escapeHTML(risk.title)}">Delete Risk</button>
        </div>
      `);

      const statusSelect = card.querySelector('.risk-status-select');
      statusSelect?.addEventListener('change', (e) => {
        risk.status = e.target.value;
        this.saveAndRender();
      });

      const delBtn = card.querySelector('.btn-del-risk');
      delBtn?.addEventListener('click', () => {
        this.state.risks = this.state.risks.filter(r => r.id !== risk.id);
        this.saveAndRender();
        this.showToast('Removed risk item.');
      });

      this.riskCardsContainer.appendChild(card);
    });
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

    if (!this.inventoryTableBody) return;
    this.inventoryTableBody.replaceChildren();

    const filtered = this.state.inventory.filter(item => {
      if (this.activeInventoryFilter === 'all') return true;
      return item.category === this.activeInventoryFilter;
    });

    if (filtered.length === 0) {
      setSanitizedHTML(this.inventoryTableBody, `
        <tr>
          <td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
            No supplies matching this category.
          </td>
        </tr>
      `);
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'inv-row';

      // Strict text escaping for item.quantity prevents DOM-XSS
      setSanitizedHTML(tr, `
        <td class="inv-td-name"><strong>${escapeHTML(item.name)}</strong></td>
        <td><span class="inv-cat-pill">${escapeHTML(item.category)}</span></td>
        <td class="inv-td-qty">${escapeHTML(String(item.quantity))}</td>
        <td>
          <select class="inv-status-select" aria-label="Status for ${escapeHTML(item.name)}">
            <option value="Packed" ${item.status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Sourced" ${item.status === 'Sourced' ? 'selected' : ''}>Sourced</option>
            <option value="In-Transit" ${item.status === 'In-Transit' ? 'selected' : ''}>In-Transit</option>
            <option value="On-Site" ${item.status === 'On-Site' ? 'selected' : ''}>On-Site</option>
          </select>
        </td>
        <td style="color: var(--text-secondary);">${escapeHTML(item.owner)}</td>
        <td class="inv-td-actions">
          <button class="btn btn-ghost btn-sm text-danger btn-del-inv" aria-label="Delete supply: ${escapeHTML(item.name)}">✕</button>
        </td>
      `);

      const statusSelect = tr.querySelector('.inv-status-select');
      statusSelect?.addEventListener('change', (e) => {
        item.status = e.target.value;
        this.saveAndRender();
      });

      const delBtn = tr.querySelector('.btn-del-inv');
      delBtn?.addEventListener('click', () => {
        this.state.inventory = this.state.inventory.filter(i => i.id !== item.id);
        this.saveAndRender();
        this.showToast(`Removed item: ${item.name}`);
      });

      this.inventoryTableBody.appendChild(tr);
    });
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
    if (!this.chatMessagesContainer) return;
    this.chatMessagesContainer.replaceChildren();

    this.state.chatHistory.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`;
      setSanitizedHTML(bubble, this.formatChatMessage(msg.text));
      this.chatMessagesContainer.appendChild(bubble);
    });

    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }

  formatChatMessage(rawText) {
    let text = escapeHTML(rawText);
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/\n\* (.*?)(?=\n\*|\n\n|$)/g, '<li>$1</li>');
    if (text.includes('<li>')) {
      text = text.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }
    text = text.replace(/\n/g, '<br>');
    return text;
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
    const categoryInfo = budgetData.categories.find(c => c.name.toLowerCase().includes(vendor.category.toLowerCase())) || budgetData.categories[0];
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

    let vendorHtml = '';
    this.state.vendors.forEach(v => {
      vendorHtml += `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(v.name)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(v.category)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${formatCurrency(v.quoted, this.state.currency)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(v.status)}</td>
        </tr>
      `;
    });

    if (this.printableSummary) {
      setSanitizedHTML(this.printableSummary, `
        <div style="padding: 24px; font-family: sans-serif; color: #111;">
          <h1 style="margin-bottom: 4px;">PlanFlow AI — Executive Event Brief</h1>
          <p style="color: #666; margin-bottom: 20px;">Generated on ${new Date().toLocaleDateString()} | Event: <strong>${arch.title}</strong></p>
          
          <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
              <div style="font-size: 12px; color: #666;">Total Budget</div>
              <div style="font-size: 18px; font-weight: bold;">${formatCurrency(budgetData.totalBudget, this.state.currency)}</div>
            </div>
            <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
              <div style="font-size: 12px; color: #666;">Guest Count</div>
              <div style="font-size: 18px; font-weight: bold;">${this.state.guests} Attendees</div>
            </div>
            <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
              <div style="font-size: 12px; color: #666;">Planning Readiness</div>
              <div style="font-size: 18px; font-weight: bold; color: #10b981;">${readiness.score}% Complete</div>
            </div>
            <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
              <div style="font-size: 12px; color: #666;">Event Safety Index</div>
              <div style="font-size: 18px; font-weight: bold; color: #6366f1;">${riskMetrics.safetyScore}% (${escapeHTML(riskMetrics.profile)})</div>
            </div>
            <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
              <div style="font-size: 12px; color: #666;">Logistics Deployed</div>
              <div style="font-size: 18px; font-weight: bold; color: #06b6d4;">${invMetrics.readinessPct}% On-Site</div>
            </div>
          </div>

          <h3 style="margin-top: 20px; border-bottom: 2px solid #222; padding-bottom: 4px;">Contracted Vendors</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
            <thead>
              <tr style="text-align: left; background: #f4f4f4;">
                <th style="padding: 6px;">Vendor Name</th>
                <th style="padding: 6px;">Category</th>
                <th style="padding: 6px;">Quoted</th>
                <th style="padding: 6px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${vendorHtml}
            </tbody>
          </table>
        </div>
      `);
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
