/**
 * @file ui-renderers.js
 * @module PlanFlowAI/UIRenderers
 * @description Modular view presentation renderers for PlanFlow AI sections:
 * Budget distribution, roadmap phases, vendor directory, risk matrix, inventory log, and chat stream.
 * @license MIT
 */

import { escapeHTML, setSanitizedHTML } from './security.js';
import { formatCurrency } from './budget.js';

/**
 * Renders the visual horizontal budget distribution bar.
 * @param {HTMLElement|null} container - Target container element
 * @param {Array<{ name: string, percentage: number, color: string, amount: number }>} categories - Category breakdown
 * @param {string} currency - Currency code
 */
export function renderDistributionBar(container, categories, currency) {
  if (!container) return;
  container.replaceChildren();

  categories.forEach((cat) => {
    if (cat.percentage > 0) {
      const seg = document.createElement('div');
      seg.className = 'distribution-segment';
      seg.style.width = `${cat.percentage}%`;
      seg.style.backgroundColor = cat.color;
      seg.setAttribute('aria-label', `${cat.name}: ${cat.percentage}%`);
      seg.title = `${cat.name}: ${cat.percentage}% (${formatCurrency(cat.amount, currency)})`;
      container.appendChild(seg);
    }
  });
}

/**
 * Renders individual interactive category slider cards.
 * @param {HTMLElement|null} container - Category sliders container
 * @param {Array<{ id: string, name: string, color: string, percentage: number, amount: number, perGuest: number }>} categories
 * @param {string} currency - Currency code
 * @param {(categoryId: string, nextValue: number) => void} onUpdatePercentage - Callback when percentage changes
 */
export function renderCategorySliders(container, categories, currency, onUpdatePercentage) {
  if (!container) return;
  container.replaceChildren();

  categories.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'slider-card';
    card.style.setProperty('--category-color', cat.color);

    setSanitizedHTML(card, `
      <div class="slider-card-header">
        <span class="slider-category-name">
          <span style="color: ${cat.color}; font-size: 1.1rem;" aria-hidden="true">●</span>
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
        <span>Est. ${formatCurrency(cat.perGuest, currency)} / guest</span>
        <span class="slider-amount">${formatCurrency(cat.amount, currency)}</span>
      </div>
    `);

    const rangeInput = card.querySelector('.slider-input');
    const stepDown = card.querySelector('.btn-step-down');
    const stepUp = card.querySelector('.btn-step-up');

    rangeInput?.addEventListener('input', (e) => {
      onUpdatePercentage(cat.id, Number(e.target.value));
    });

    stepDown?.addEventListener('click', () => {
      onUpdatePercentage(cat.id, Math.max(0, cat.percentage - 5));
    });

    stepUp?.addEventListener('click', () => {
      onUpdatePercentage(cat.id, Math.min(100, cat.percentage + 5));
    });

    container.appendChild(card);
  });
}

/**
 * Renders grouped milestone phase cards with interactive tasks.
 * @param {HTMLElement|null} container - Milestones container
 * @param {Array<{ id: string, phaseId: string, phaseTitle: string, text: string, done: boolean }>} milestones
 * @param {(task: object, checked: boolean) => void} onToggleTask
 * @param {(taskId: string) => void} onDeleteTask
 */
export function renderMilestonePhases(container, milestones, onToggleTask, onDeleteTask) {
  if (!container) return;
  container.replaceChildren();

  const phases = {};
  milestones.forEach((t) => {
    const pid = t.phaseId || 'general';
    if (!phases[pid]) {
      phases[pid] = { title: t.phaseTitle || 'Milestone Phase', tasks: [] };
    }
    phases[pid].tasks.push(t);
  });

  Object.keys(phases).forEach((pid) => {
    const phase = phases[pid];
    const completedCount = phase.tasks.filter((t) => t.done).length;
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

    phase.tasks.forEach((task) => {
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
        onToggleTask(task, chk.checked);
      });

      const delBtn = li.querySelector('.btn-task-del');
      delBtn?.addEventListener('click', () => {
        onDeleteTask(task.id);
      });

      listEl?.appendChild(li);
    });

    container.appendChild(card);
  });
}

/**
 * Renders vendor directory cards according to the active category filter.
 * @param {HTMLElement|null} container - Vendor cards container
 * @param {Array<{ id: string, name: string, category: string, quoted: number, status: string, notes?: string }>} vendors
 * @param {string} activeFilter - Active category filter or 'all'
 * @param {string} currency - Currency code
 * @param {(vendor: object, nextStatus: string) => void} onStatusChange
 * @param {(vendor: object) => void} onOpenNegotiate
 * @param {(vendorId: string, vendorName: string) => void} onDeleteVendor
 */
export function renderVendorCards(container, vendors, activeFilter, currency, onStatusChange, onOpenNegotiate, onDeleteVendor) {
  if (!container) return;
  container.replaceChildren();

  const filtered = vendors.filter((v) => {
    if (activeFilter === 'all') return true;
    return v.category === activeFilter;
  });

  if (filtered.length === 0) {
    setSanitizedHTML(container, `
      <div class="kpi-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <p style="color: var(--text-muted);">No vendors found matching this filter.</p>
      </div>
    `);
    return;
  }

  filtered.forEach((vendor) => {
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
        <span>Quoted: <strong>${formatCurrency(vendor.quoted, currency)}</strong></span>
      </div>
      ${vendor.notes ? `<div class="vendor-notes">${escapeHTML(vendor.notes)}</div>` : ''}
      <div class="vendor-card-actions">
        <button class="btn btn-secondary btn-sm btn-negotiate" style="flex: 1;">✨ AI Negotiation Script</button>
        <button class="btn btn-ghost btn-sm btn-del-vendor" aria-label="Delete vendor: ${escapeHTML(vendor.name)}" title="Delete vendor">✕</button>
      </div>
    `);

    const statusSelect = card.querySelector('.vendor-status-select');
    statusSelect?.addEventListener('change', (e) => {
      onStatusChange(vendor, e.target.value);
    });

    const btnNegotiate = card.querySelector('.btn-negotiate');
    btnNegotiate?.addEventListener('click', () => onOpenNegotiate(vendor));

    const btnDel = card.querySelector('.btn-del-vendor');
    btnDel?.addEventListener('click', () => onDeleteVendor(vendor.id, vendor.name));

    container.appendChild(card);
  });
}

/**
 * Renders risk mitigation cards.
 * @param {HTMLElement|null} container - Risk cards container
 * @param {Array<{ id: string, category: string, title: string, probability: string, impact: string, strategy: string, status: string }>} risks
 * @param {(risk: object, nextStatus: string) => void} onStatusChange
 * @param {(riskId: string) => void} onDeleteRisk
 */
export function renderRiskCards(container, risks, onStatusChange, onDeleteRisk) {
  if (!container) return;
  container.replaceChildren();

  risks.forEach((risk) => {
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
      onStatusChange(risk, e.target.value);
    });

    const delBtn = card.querySelector('.btn-del-risk');
    delBtn?.addEventListener('click', () => onDeleteRisk(risk.id));

    container.appendChild(card);
  });
}

/**
 * Renders supplies and inventory tracking table rows.
 * @param {HTMLElement|null} tbody - Table body element
 * @param {Array<{ id: string, name: string, category: string, quantity: number, status: string, owner: string }>} inventory
 * @param {string} activeFilter - Filter by category or 'all'
 * @param {(item: object, nextStatus: string) => void} onStatusChange
 * @param {(itemId: string, itemName: string) => void} onDeleteItem
 */
export function renderInventoryRows(tbody, inventory, activeFilter, onStatusChange, onDeleteItem) {
  if (!tbody) return;
  tbody.replaceChildren();

  const filtered = inventory.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  if (filtered.length === 0) {
    setSanitizedHTML(tbody, `
      <tr>
        <td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          No supplies matching this category.
        </td>
      </tr>
    `);
    return;
  }

  filtered.forEach((item) => {
    const tr = document.createElement('tr');
    tr.className = 'inv-row';

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
      onStatusChange(item, e.target.value);
    });

    const delBtn = tr.querySelector('.btn-del-inv');
    delBtn?.addEventListener('click', () => onDeleteItem(item.id, item.name));

    tbody.appendChild(tr);
  });
}

/**
 * Formats chat message text into safe structured HTML with bold, italics, and lists.
 * @param {string} rawText - Raw input text from bot or user
 * @returns {string} Sanitized HTML string
 */
export function formatChatMessage(rawText) {
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

/**
 * Renders the PlanGenie chat message transcript.
 * @param {HTMLElement|null} container - Chat messages container
 * @param {Array<{ sender: 'user'|'bot', text: string }>} chatHistory - Message list
 */
export function renderChatHistory(container, chatHistory) {
  if (!container) return;
  container.replaceChildren();

  chatHistory.forEach((msg) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`;
    setSanitizedHTML(bubble, formatChatMessage(msg.text));
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

/**
 * Builds sanitized HTML for the printable executive summary view.
 * @param {object} params - Print summary parameters
 * @param {object} params.budgetData - Budget metrics
 * @param {object} params.readiness - Readiness metrics
 * @param {object} params.riskMetrics - Risk safety metrics
 * @param {object} params.invMetrics - Inventory metrics
 * @param {object} params.arch - Archetype default info
 * @param {object} params.state - Current plan state
 * @returns {string} Sanitized summary HTML markup
 */
export function generatePrintableSummaryHTML({ budgetData, readiness, riskMetrics, invMetrics, arch, state }) {
  let vendorHtml = '';
  state.vendors.forEach((v) => {
    vendorHtml += `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(v.name)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(v.category)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${formatCurrency(v.quoted, state.currency)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(v.status)}</td>
      </tr>
    `;
  });

  return `
    <div style="padding: 24px; font-family: sans-serif; color: #111;">
      <h1 style="margin-bottom: 4px;">PlanFlow AI — Executive Event Brief</h1>
      <p style="color: #666; margin-bottom: 20px;">Generated on ${new Date().toLocaleDateString()} | Event: <strong>${escapeHTML(arch.title)}</strong></p>
      
      <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
          <div style="font-size: 12px; color: #666;">Total Budget</div>
          <div style="font-size: 18px; font-weight: bold;">${formatCurrency(budgetData.totalBudget, state.currency)}</div>
        </div>
        <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
          <div style="font-size: 12px; color: #666;">Guest Count</div>
          <div style="font-size: 18px; font-weight: bold;">${state.guests} Attendees</div>
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
  `;
}
