/**
 * @file storage.js
 * @module PlanFlowAI/Storage
 * @description Local-first persistence, schema management, strict JSON normalization, and safe storage boundaries.
 * @license MIT
 */

import { ARCHETYPE_DEFAULTS, NUMERIC_BOUNDS, CURRENCIES } from './constants.js';
import { sanitizeNumber, sanitizeString } from './security.js';
import { buildMilestones } from './milestones.js';
import { buildSampleVendors } from './vendors.js';
import { buildSampleRisks } from './risks.js';
import { buildSampleInventory } from './inventory.js';

export const STORAGE_KEY = 'planflow_ai_v2_state';
export const SCHEMA_VERSION = 3;

/**
 * Generates an initial default state for a given event archetype.
 * NOTE: API keys are strictly excluded from state and never persisted to localStorage.
 * @param {string} [archetype='wedding'] - Target event archetype
 * @returns {Object} Fresh initialized state object
 */
export function getDefaultState(archetype = 'wedding') {
  const safeArchetype = ARCHETYPE_DEFAULTS[archetype] ? archetype : 'wedding';
  const defaults = ARCHETYPE_DEFAULTS[safeArchetype];

  return {
    schemaVersion: SCHEMA_VERSION,
    eventType: safeArchetype,
    budget: defaults.budget,
    guests: defaults.guests,
    horizon: defaults.horizon,
    location: defaults.location,
    vibe: defaults.vibe,
    currency: 'USD',
    theme: 'dark',
    categoryPercentages: { ...defaults.percentages },
    milestones: buildMilestones(safeArchetype, defaults.horizon),
    vendors: buildSampleVendors(safeArchetype),
    risks: buildSampleRisks(safeArchetype),
    inventory: buildSampleInventory(safeArchetype),
    chatHistory: [
      {
        sender: 'bot',
        text: `Hello! I am **PlanGenie**, your AI Event Strategist. I have initialized your plan for **${defaults.title}** with a baseline budget and checklist. Ask me anything or select a quick topic below!`
      }
    ]
  };
}

/**
 * Validates, sanitizes, and normalizes an imported JSON event plan object.
 * Strictly prevents DOM-XSS vectors by validating types, bounding numbers, and stripping arbitrary markup.
 * @param {unknown} raw - Untrusted imported JSON object
 * @returns {Object} Clean, schema-compliant state object
 */
export function validateAndNormalizePlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return getDefaultState();
  }

  const validArchetypes = ['wedding', 'birthday', 'community'];
  const eventType = validArchetypes.includes(raw.eventType) ? raw.eventType : 'wedding';
  const fallback = getDefaultState(eventType);

  const budget = sanitizeNumber(raw.budget, NUMERIC_BOUNDS.BUDGET_MIN, NUMERIC_BOUNDS.BUDGET_MAX, fallback.budget);
  const guests = sanitizeNumber(raw.guests, NUMERIC_BOUNDS.GUESTS_MIN, NUMERIC_BOUNDS.GUESTS_MAX, fallback.guests);
  const horizon = sanitizeNumber(raw.horizon, 1, 24, fallback.horizon);

  const validLocations = ['indoor', 'outdoor', 'destination', 'virtual'];
  const location = validLocations.includes(raw.location) ? raw.location : fallback.location;

  const validVibes = ['rustic', 'luxury', 'modern', 'eco-friendly', 'cultural'];
  const vibe = validVibes.includes(raw.vibe) ? raw.vibe : fallback.vibe;

  const currency = CURRENCIES[raw.currency] ? raw.currency : 'USD';
  const theme = raw.theme === 'light' ? 'light' : 'dark';

  // Normalize Category Percentages
  const categoryPercentages = { ...fallback.categoryPercentages };
  if (raw.categoryPercentages && typeof raw.categoryPercentages === 'object') {
    for (const key of Object.keys(categoryPercentages)) {
      if (raw.categoryPercentages[key] !== undefined) {
        categoryPercentages[key] = sanitizeNumber(raw.categoryPercentages[key], 0, 100, categoryPercentages[key]);
      }
    }
  }

  // Normalize Milestones
  let milestones = fallback.milestones;
  if (Array.isArray(raw.milestones)) {
    milestones = raw.milestones.slice(0, 50).map((m, idx) => ({
      id: sanitizeString(m?.id || `m-custom-${idx}`, 50),
      phaseId: sanitizeString(m?.phaseId || 'phase-custom', 30),
      phaseTitle: sanitizeString(m?.phaseTitle || 'Custom Phase', 80),
      text: sanitizeString(m?.text || 'Untitled Task', NUMERIC_BOUNDS.TEXT_MAX_LEN),
      done: Boolean(m?.done)
    }));
  }

  // Normalize Vendors
  let vendors = fallback.vendors;
  if (Array.isArray(raw.vendors)) {
    vendors = raw.vendors.slice(0, 50).map((v, idx) => {
      const validStatuses = ['Prospecting', 'Contacted', 'Negotiating', 'Booked'];
      return {
        id: sanitizeString(v?.id || `v-custom-${idx}`, 50),
        name: sanitizeString(v?.name || 'Unnamed Vendor', 100),
        category: sanitizeString(v?.category || 'General', 50),
        quoted: sanitizeNumber(v?.quoted, 0, 100000000, 0),
        status: validStatuses.includes(v?.status) ? v.status : 'Prospecting',
        notes: sanitizeString(v?.notes || '', NUMERIC_BOUNDS.TEXT_MAX_LEN)
      };
    });
  }

  // Normalize Risks
  let risks = fallback.risks;
  if (Array.isArray(raw.risks)) {
    risks = raw.risks.slice(0, 30).map((r, idx) => {
      const validProb = ['Low', 'Medium', 'High'];
      const validImpact = ['Minor', 'Moderate', 'Critical'];
      const validStatus = ['Mitigated', 'Monitoring', 'Action Needed'];
      return {
        id: sanitizeString(r?.id || `r-custom-${idx}`, 50),
        category: sanitizeString(r?.category || 'General', 40),
        title: sanitizeString(r?.title || 'Identified Risk', 120),
        probability: validProb.includes(r?.probability) ? r.probability : 'Medium',
        impact: validImpact.includes(r?.impact) ? r.impact : 'Moderate',
        strategy: sanitizeString(r?.strategy || 'Contingency protocol', NUMERIC_BOUNDS.TEXT_MAX_LEN),
        status: validStatus.includes(r?.status) ? r.status : 'Action Needed'
      };
    });
  }

  // Normalize Inventory (STRICT: quantity MUST be safe positive integer)
  let inventory = fallback.inventory;
  if (Array.isArray(raw.inventory)) {
    inventory = raw.inventory.slice(0, 60).map((item, idx) => {
      const validStatus = ['Packed', 'Sourced', 'In-Transit', 'On-Site'];
      return {
        id: sanitizeString(item?.id || `inv-custom-${idx}`, 50),
        name: sanitizeString(item?.name || 'Unnamed Equipment', 100),
        category: sanitizeString(item?.category || 'Logistics', 40),
        quantity: Math.max(1, Math.round(sanitizeNumber(item?.quantity, 1, 100000, 1))),
        status: validStatus.includes(item?.status) ? item.status : 'Packed',
        owner: sanitizeString(item?.owner || 'Coordinator', 60)
      };
    });
  }

  // Normalize Chat History
  let chatHistory = fallback.chatHistory;
  if (Array.isArray(raw.chatHistory)) {
    chatHistory = raw.chatHistory.slice(-20).map(msg => ({
      sender: msg?.sender === 'user' ? 'user' : 'bot',
      text: sanitizeString(msg?.text || '', NUMERIC_BOUNDS.CHAT_MAX_LEN)
    }));
    if (chatHistory.length === 0) chatHistory = fallback.chatHistory;
  }

  // Return clean, scrubbed state (no keys, no raw markup)
  return {
    schemaVersion: SCHEMA_VERSION,
    eventType,
    budget,
    guests,
    horizon,
    location,
    vibe,
    currency,
    theme,
    categoryPercentages,
    milestones,
    vendors,
    risks,
    inventory,
    chatHistory
  };
}

/**
 * Persists the sanitized state object to LocalStorage.
 * Explicitly excludes any sensitive credentials (API keys).
 * @param {Object} state - Application state
 * @returns {boolean} Success status
 */
export function saveStateToStorage(state) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    // Clone and scrub state to ensure zero credential leakage
    const cleanState = { ...state };
    delete cleanState.geminiApiKey;
    delete cleanState.apiKey;

    const payload = JSON.stringify(cleanState);
    window.localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
    return false;
  }
}

/**
 * Loads and deserializes state from LocalStorage with schema normalization.
 * @returns {Object} Safe state object
 */
export function loadStateFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return getDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    return validateAndNormalizePlan(parsed);
  } catch (err) {
    console.warn('LocalStorage read failed, recovering default state:', err);
    return getDefaultState();
  }
}
