/**
 * @file inventory.js
 * @module PlanFlowAI/Inventory
 * @description Supplies and equipment inventory tracker and logistics readiness metrics.
 * @license MIT
 */

import { DEFAULT_INVENTORY } from './constants.js';

/**
 * Builds baseline inventory supplies tailored to the active event archetype.
 * @param {string} [eventType='wedding'] - Event Archetype
 * @returns {Array<Object>} Initialized inventory items
 */
export function buildSampleInventory(eventType = 'wedding') {
  const archetypeInventory = DEFAULT_INVENTORY[eventType] || DEFAULT_INVENTORY.wedding;
  return archetypeInventory.map(item => ({ ...item }));
}

/**
 * Computes Logistics & Inventory Deployment Readiness.
 * @param {Array<Object>} [items=[]] - Array of inventory items
 * @returns {Object} Inventory metrics
 */
export function calculateInventoryMetrics(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalItems: 0,
      totalUnits: 0,
      onSiteUnits: 0,
      readinessPct: 100,
      status: 'No Inventory Assigned'
    };
  }

  const totalItems = items.length;
  const totalUnits = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
  const onSiteUnits = items
    .filter(i => i.status === 'On-Site')
    .reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

  const readinessPct = totalUnits > 0 ? Math.round((onSiteUnits / totalUnits) * 100) : 0;

  let status = 'Sourcing Underway';
  if (readinessPct >= 100) status = '100% Fully Deployed On-Site 📦';
  else if (readinessPct >= 65) status = 'Majority Ready & In-Transit 🚚';
  else if (readinessPct >= 35) status = 'Staging & Packing In Progress 📋';

  return {
    totalItems,
    totalUnits,
    onSiteUnits,
    readinessPct,
    status
  };
}
