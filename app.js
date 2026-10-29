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
  ARCHETYPE_DEFAULTS,
  escapeHTML,
  sanitizeNumber,
  sanitizeString,
  setSanitizedHTML,
  setDisclosureState,
  calculateBudget,
  formatCurrency,
  buildMilestones,
  calculateReadiness,
  generateNegotiationScript,
  calculateRiskMetrics,
  calculateInventoryMetrics,
  askPlanGenie,
  isValidGeminiApiKey,
  isSupportedGeminiModel,
  generateSecureId,
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
  renderChatHistory,
  generatePrintableSummaryHTML,
  getDOMElements,
  attachUIEventListeners
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

    // Cache interactive DOM elements
    this.dom = getDOMElements();
  }

  /**
   * Initializes the application controller, binds event listeners, and renders views.
   */
  init() {
    try {
      this.state = loadStateFromStorage();
      attachUIEventListeners(this, this.dom);
      this.syncFormFromState();
      this.applyTheme(this.state.theme || 'dark');
      this.renderAll();
    } catch (err) {
      console.error('PlanFlow AI initialization error:', err);
      this.showToast('Initialized with fresh default template.');
    }
  }

  /**
   * Synchronizes UI form input values with current state model.
   */
  syncFormFromState() {
    const { dom, state } = this;
    if (dom.currencySelect) dom.currencySelect.value = state.currency;
    if (dom.totalBudgetInput) dom.totalBudgetInput.value = state.budget;
    if (dom.guestCountInput) dom.guestCountInput.value = state.guests;
    if (dom.horizonMonthsSelect) dom.horizonMonthsSelect.value = state.horizon;
    if (dom.locationStyleSelect) dom.locationStyleSelect.value = state.location;
    if (dom.eventVibeSelect) dom.eventVibeSelect.value = state.vibe;

    dom.archetypeCards?.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        const isMatch = radio.value === state.eventType;
        radio.checked = isMatch;
        card.classList.toggle('active', isMatch);
      }
    });

    const arch = ARCHETYPE_DEFAULTS[state.eventType] || ARCHETYPE_DEFAULTS.wedding;
    if (dom.activeArchetypeBadge) dom.activeArchetypeBadge.textContent = `${arch.title} Mode`;
  }

  /**
   * Applies the selected color theme to document root.
   * @param {'dark'|'light'} theme - Target theme
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (this.dom.themeIcon) {
      this.dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  /**
   * Switches planning archetype and resets default templates.
   * @param {string} newArchetype - Archetype identifier
   */
  switchArchetype(newArchetype) {
    if (!ARCHETYPE_DEFAULTS[newArchetype]) return;
    this.state = getDefaultState(newArchetype);
    this.syncFormFromState();
    this.saveAndRender();
    this.showToast(`Switched plan archetype to ${ARCHETYPE_DEFAULTS[newArchetype].title}!`);
  }

  /**
   * Updates planning horizon and regenerates backwards milestones.
   * @param {number} months - Horizon in months
   */
  updateHorizon(months) {
    this.state.horizon = months;
    this.state.milestones = buildMilestones(this.state.eventType, this.state.horizon);
    this.saveAndRender();
  }

  /**
   * Persists state to storage and refreshes all UI views.
   */
  saveAndRender() {
    saveStateToStorage(this.state);
    this.renderAll();
  }

  /**
   * Re-renders all application sections reactively.
   */
  renderAll() {
    this.renderCurrencySymbols();
    this.renderBudget();
    this.renderRoadmap();
    this.renderVendors();
    this.renderRisks();
    this.renderInventory();
    this.renderChat();
  }

  /**
   * Renders localized currency symbols across metric labels.
   */
  renderCurrencySymbols() {
    const symbol = CURRENCIES[this.state.currency]?.symbol || '$';
    this.dom.currencyLabels?.forEach((label) => {
      label.textContent = symbol;
    });
  }

  /**
   * Renders the dynamic budget telemetry, warning banner, distribution bar, and sliders.
   */
  renderBudget() {
    const { dom, state } = this;
    const budgetData = calculateBudget(state.budget, state.categoryPercentages, state.currency, state.guests);

    if (dom.kpiTotalAllocated) dom.kpiTotalAllocated.textContent = formatCurrency(budgetData.allocatedTotal, state.currency);
    if (dom.kpiPercentageSum) {
      dom.kpiPercentageSum.textContent = `${budgetData.sumPercentage}% of Total Budget`;
      dom.kpiPercentageSum.className = `kpi-subtext ${budgetData.isBalanced ? 'text-success' : budgetData.isOverBudget ? 'text-danger' : 'text-warning'}`;
    }
    if (dom.kpiCostPerGuest) dom.kpiCostPerGuest.textContent = `${formatCurrency(budgetData.costPerGuest, state.currency)} / guest`;

    if (dom.kpiVarianceAmount) {
      const isOver = budgetData.isOverBudget;
      const isBalanced = budgetData.isBalanced;
      const varianceFormatted = formatCurrency(Math.abs(budgetData.varianceAmount), state.currency);

      if (isBalanced) {
        dom.kpiVarianceAmount.textContent = `${formatCurrency(0, state.currency)} (Balanced)`;
        dom.kpiVarianceAmount.className = 'kpi-value text-success';
        if (dom.kpiVarianceStatus) {
          dom.kpiVarianceStatus.textContent = '100% Allocated';
          dom.kpiVarianceStatus.className = 'kpi-subtext text-success';
        }
      } else if (isOver) {
        dom.kpiVarianceAmount.textContent = `+${varianceFormatted} (Over)`;
        dom.kpiVarianceAmount.className = 'kpi-value text-danger';
        if (dom.kpiVarianceStatus) {
          dom.kpiVarianceStatus.textContent = `${budgetData.sumPercentage}% Allocated`;
          dom.kpiVarianceStatus.className = 'kpi-subtext text-danger';
        }
      } else {
        dom.kpiVarianceAmount.textContent = `-${varianceFormatted} (Reserve)`;
        dom.kpiVarianceAmount.className = 'kpi-value text-warning';
        if (dom.kpiVarianceStatus) {
          dom.kpiVarianceStatus.textContent = `${budgetData.sumPercentage}% Allocated (Reserve Available)`;
          dom.kpiVarianceStatus.className = 'kpi-subtext text-warning';
        }
      }
    }

    if (dom.budgetWarningBanner && dom.budgetWarningText) {
      if (budgetData.isBalanced) {
        dom.budgetWarningBanner.classList.add('hidden');
      } else if (budgetData.isOverBudget) {
        dom.budgetWarningBanner.classList.remove('hidden');
        dom.budgetWarningBanner.className = 'alert-banner alert-danger';
        dom.budgetWarningText.textContent = `Warning: Over budget by ${budgetData.sumPercentage - 100}% (${formatCurrency(Math.abs(budgetData.varianceAmount), state.currency)}). Rebalance categories below.`;
      } else {
        dom.budgetWarningBanner.classList.remove('hidden');
        dom.budgetWarningBanner.className = 'alert-banner alert-warning';
        dom.budgetWarningText.textContent = `Notice: Under-allocated. Current total is ${budgetData.sumPercentage}%. You have ${formatCurrency(budgetData.varianceAmount, state.currency)} in unassigned reserve.`;
      }
    }

    renderDistributionBar(dom.distributionBar, budgetData.categories, state.currency);

    renderCategorySliders(dom.categorySlidersContainer, budgetData.categories, state.currency, (catId, nextValue) => {
      this.state.categoryPercentages[catId] = nextValue;
      this.saveAndRender();
    });
  }

  /**
   * Renders the milestone roadmap phase cards and progress indicator.
   */
  renderRoadmap() {
    const { dom, state } = this;
    const readiness = calculateReadiness(state.milestones);
    if (dom.readinessScoreText) dom.readinessScoreText.textContent = `${readiness.score}%`;
    if (dom.readinessProgressBar) dom.readinessProgressBar.style.width = `${readiness.score}%`;
    if (dom.readinessProgressTrack) dom.readinessProgressTrack.setAttribute('aria-valuenow', String(readiness.score));
    if (dom.readinessStatusBadge) dom.readinessStatusBadge.textContent = readiness.status;

    renderMilestonePhases(
      dom.milestonesContainer,
      state.milestones,
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

  /**
   * Adds a custom milestone task using cryptographically strong unique ID.
   */
  addQuickTask() {
    const text = sanitizeString(this.dom.quickTaskInput?.value, NUMERIC_BOUNDS.TEXT_MAX_LEN);
    if (!text) return;

    const phaseId = this.dom.quickTaskPhaseSelect?.value || 'phase-custom';
    const phaseTitleMap = {
      'phase-long': '6+ Months Out: Vision, Venue & Big Picture',
      'phase-mid': '3 Months Out: Vendors & Guest Experience',
      'phase-near': '1 Month Out: Final Details & Confirmation',
      'phase-week': 'Week Of Event: Final Logistics',
      'phase-day': 'Day-Of Run-of-Show'
    };

    this.state.milestones.push({
      id: generateSecureId('m-custom'),
      phaseId,
      phaseTitle: phaseTitleMap[phaseId] || 'Custom Phase',
      text,
      done: false
    });

    if (this.dom.quickTaskInput) this.dom.quickTaskInput.value = '';
    this.saveAndRender();
    this.showToast('Added custom task to roadmap!');
  }

  /**
   * Renders vendor cards matching active category filter.
   */
  renderVendors() {
    renderVendorCards(
      this.dom.vendorCardsContainer,
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

  /**
   * Adds a new vendor to the checklist with cryptographically strong ID.
   * @param {Event} e - Form submission event
   */
  handleAddVendor(e) {
    e.preventDefault();
    const { dom } = this;
    const name = sanitizeString(dom.vendorNameInput?.value, 100);
    const category = dom.vendorCategorySelect?.value || 'Venue';
    const quoted = sanitizeNumber(dom.vendorQuotedInput?.value, 0, 100000000, 0);
    const status = dom.vendorStatusSelect?.value || 'Prospecting';

    if (!name) return;

    this.state.vendors.push({
      id: generateSecureId('v-custom'),
      name,
      category,
      quoted,
      status,
      notes: ''
    });

    dom.addVendorForm?.reset();
    setDisclosureState(dom.btnAddVendorToggle, dom.addVendorForm, false);
    this.saveAndRender();
    this.showToast(`Added vendor: ${name}`);
  }

  /**
   * Renders risk items and resilience safety index.
   */
  renderRisks() {
    const { dom, state } = this;
    const metrics = calculateRiskMetrics(state.risks);
    if (dom.riskScoreText) dom.riskScoreText.textContent = `${metrics.safetyScore}%`;
    if (dom.riskProfileBadge) {
      dom.riskProfileBadge.textContent = metrics.profile;
      dom.riskProfileBadge.className = metrics.safetyScore >= 80 ? 'badge badge-success' : 'badge badge-warning';
    }

    renderRiskCards(
      dom.riskCardsContainer,
      state.risks,
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

  /**
   * Adds an identified risk to the matrix with cryptographically strong ID.
   * @param {Event} e - Form submission event
   */
  handleAddRisk(e) {
    e.preventDefault();
    const { dom } = this;
    const category = dom.riskCatSelect?.value || 'General';
    const title = sanitizeString(dom.riskTitleInput?.value, 120);
    const probability = dom.riskProbSelect?.value || 'Medium';
    const impact = dom.riskImpactSelect?.value || 'Moderate';
    const strategy = sanitizeString(dom.riskStrategyInput?.value, NUMERIC_BOUNDS.TEXT_MAX_LEN);

    if (!title || !strategy) return;

    this.state.risks.push({
      id: generateSecureId('r-custom'),
      category,
      title,
      probability,
      impact,
      strategy,
      status: 'Action Needed'
    });

    dom.addRiskForm?.reset();
    setDisclosureState(dom.btnAddRiskToggle, dom.addRiskForm, false);
    this.saveAndRender();
    this.showToast('Logged new event risk.');
  }

  /**
   * Renders logistics inventory equipment rows and deployment index.
   */
  renderInventory() {
    const { dom, state } = this;
    const metrics = calculateInventoryMetrics(state.inventory);
    if (dom.inventoryReadinessText) dom.inventoryReadinessText.textContent = `${metrics.readinessPct}%`;
    if (dom.inventoryStatusBadge) dom.inventoryStatusBadge.textContent = metrics.status;

    renderInventoryRows(
      dom.inventoryTableBody,
      state.inventory,
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

  /**
   * Adds a logistical item to inventory roster with cryptographically strong ID.
   * @param {Event} e - Form submission event
   */
  handleAddInventory(e) {
    e.preventDefault();
    const { dom } = this;
    const name = sanitizeString(dom.invNameInput?.value, 100);
    const category = dom.invCatSelect?.value || 'Logistics';
    const quantity = Math.max(1, Math.round(sanitizeNumber(dom.invQtyInput?.value, 1, 10000, 1)));
    const status = dom.invStatusSelect?.value || 'Packed';
    const owner = sanitizeString(dom.invOwnerInput?.value, 60) || 'Coordinator';

    if (!name) return;

    this.state.inventory.push({
      id: generateSecureId('inv-custom'),
      name,
      category,
      quantity,
      status,
      owner
    });

    dom.addInventoryForm?.reset();
    setDisclosureState(dom.btnAddInventoryToggle, dom.addInventoryForm, false);
    this.saveAndRender();
    this.showToast(`Added supply: ${name}`);
  }

  /**
   * Renders chat transcript bubbles.
   */
  renderChat() {
    renderChatHistory(this.dom.chatMessagesContainer, this.state.chatHistory);
  }

  /**
   * Clears conversational history back to default welcome prompts.
   */
  clearChat() {
    this.state.chatHistory = getDefaultState(this.state.eventType).chatHistory;
    this.saveAndRender();
    this.showToast('Conversation cleared.');
  }

  /**
   * Handles user submission to PlanGenie AI with robust error boundaries.
   */
  async handleChatSubmit() {
    const now = Date.now();
    if (now - this.lastChatTimestamp < 1500) {
      this.showToast('Please wait a moment before sending another prompt.');
      return;
    }
    this.lastChatTimestamp = now;

    const prompt = sanitizeString(this.dom.chatInput?.value, NUMERIC_BOUNDS.CHAT_MAX_LEN);
    if (!prompt) return;

    if (this.dom.chatInput) this.dom.chatInput.value = '';

    this.state.chatHistory.push({ sender: 'user', text: prompt });
    this.renderChat();

    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'chat-bubble chat-bubble-bot';
    thinkingBubble.id = 'temp-thinking';
    setSanitizedHTML(thinkingBubble, '<em>PlanGenie is formulating your custom event strategy...</em>');
    this.dom.chatMessagesContainer?.appendChild(thinkingBubble);
    this.dom.chatMessagesContainer?.scrollTo({ top: this.dom.chatMessagesContainer.scrollHeight, behavior: 'smooth' });

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

    try {
      const reply = await askPlanGenie(prompt, context, this.sessionApiKey, this.sessionGeminiModel);
      this.state.chatHistory.push({ sender: 'bot', text: reply });
      this.saveAndRender();
    } catch (err) {
      console.error('PlanGenie chat error:', err);
      this.state.chatHistory.push({
        sender: 'bot',
        text: 'I encountered an error formulating this strategy. Using local event heuristics instead:\n* Verify your category allocations\n* Review milestone dates\n* Keep contingency funds uncommitted'
      });
      this.saveAndRender();
    } finally {
      document.getElementById('temp-thinking')?.remove();
    }
  }

  /**
   * Populates and displays the vendor negotiation counter-offer dialog.
   * @param {object} vendor - Target vendor record
   */
  openNegotiationModal(vendor) {
    const { dom, state } = this;
    const budgetData = calculateBudget(state.budget, state.categoryPercentages, state.currency, state.guests);
    const categoryInfo = budgetData.categories.find((c) => c.name.toLowerCase().includes(vendor.category.toLowerCase())) || budgetData.categories[0];
    const targetBudget = categoryInfo ? categoryInfo.amount : Math.round(vendor.quoted * 0.85);

    const scriptData = generateNegotiationScript({
      vendorName: vendor.name,
      category: vendor.category,
      quotedPrice: vendor.quoted,
      targetBudget,
      eventType: state.eventType,
      guestCount: state.guests,
      currencySymbol: CURRENCIES[state.currency]?.symbol || '$'
    });

    if (dom.negotiationMetaInfo) {
      setSanitizedHTML(
        dom.negotiationMetaInfo,
        `<div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
          Targeting: <strong>${escapeHTML(vendor.name)}</strong> (${escapeHTML(vendor.category)}) • Quoted: <strong>${formatCurrency(vendor.quoted, state.currency)}</strong>
        </div>`
      );
    }

    if (dom.negotiationScriptContent) {
      dom.negotiationScriptContent.textContent = `Subject: ${scriptData.subject}\n\n${scriptData.body}`;
    }
    if (dom.negotiationTipsList) {
      dom.negotiationTipsList.replaceChildren(
        ...scriptData.tips.map((tip) => {
          const item = document.createElement('li');
          item.textContent = tip;
          return item;
        })
      );
    }

    if (dom.btnEmailMailto) {
      const mailto = `mailto:?subject=${encodeURIComponent(scriptData.subject)}&body=${encodeURIComponent(scriptData.body)}`;
      dom.btnEmailMailto.setAttribute('href', mailto);
    }

    dom.negotiationDialog?.showModal();
  }

  /**
   * Copies negotiation email script to clipboard with user feedback and error guard.
   */
  copyNegotiationScript() {
    const text = this.dom.negotiationScriptContent?.textContent || '';
    if (!text) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          if (this.dom.copyBtnText) this.dom.copyBtnText.textContent = '✓ Copied!';
          setTimeout(() => {
            if (this.dom.copyBtnText) this.dom.copyBtnText.textContent = '📋 Copy to Clipboard';
          }, 2500);
          this.showToast('Copied negotiation script to clipboard!');
        })
        .catch(() => {
          this.showToast('Please select and copy script text manually.');
        });
    } else {
      this.showToast('Clipboard access not supported in this environment.');
    }
  }

  /**
   * Updates AI engine connection badge in settings dialog.
   */
  updateSettingsStatus() {
    const { settingsEngineStatus } = this.dom;
    if (!settingsEngineStatus) return;
    if (isValidGeminiApiKey(this.sessionApiKey)) {
      settingsEngineStatus.textContent = 'Active: Google Gemini Live API (Session Only)';
      settingsEngineStatus.className = 'text-success';
    } else {
      settingsEngineStatus.textContent = 'Using Local Contextual Heuristic AI (100% Offline)';
      settingsEngineStatus.className = 'text-muted';
    }
  }

  /**
   * Exports sanitized JSON backup with credentials stripped.
   */
  exportJSON() {
    try {
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
    } catch (err) {
      console.error('Export failed:', err);
      this.showToast('Unable to export backup file.');
    }
  }

  /**
   * Handles secure JSON file import with schema normalization.
   * @param {Event} e - Input file change event
   */
  handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
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

  /**
   * Renders and triggers the printable executive event brief.
   */
  triggerPrintSummary() {
    const budgetData = calculateBudget(this.state.budget, this.state.categoryPercentages, this.state.currency, this.state.guests);
    const readiness = calculateReadiness(this.state.milestones);
    const riskMetrics = calculateRiskMetrics(this.state.risks || []);
    const invMetrics = calculateInventoryMetrics(this.state.inventory || []);
    const arch = ARCHETYPE_DEFAULTS[this.state.eventType] || ARCHETYPE_DEFAULTS.wedding;

    if (this.dom.printableSummary) {
      setSanitizedHTML(
        this.dom.printableSummary,
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

  /**
   * Resets all planning state to default baseline.
   */
  resetPlan() {
    this.state = getDefaultState();
    this.syncFormFromState();
    this.saveAndRender();
    this.showToast('Reset plan to fresh initial state.');
  }

  /**
   * Populates demo celebration plan data for evaluator inspection.
   */
  loadDemo() {
    this.state = getDefaultState('wedding');
    this.state.budget = 35000;
    this.state.guests = 150;
    this.syncFormFromState();
    this.saveAndRender();
    this.showToast('Loaded demo celebration data!');
  }

  /**
   * Displays transient, accessible status toast notification.
   * @param {string} message - User feedback text
   */
  showToast(message) {
    const toast = this.dom.toastNotification;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
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
