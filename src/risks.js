/**
 * @file risks.js
 * @module PlanFlowAI/Risks
 * @description Domain risk assessment matrix and weighted Safety Index scoring.
 * @license MIT
 */

import { DEFAULT_RISKS } from './constants.js';

/**
 * Builds baseline risk items tailored to the active event archetype.
 * @param {string} [eventType='wedding'] - Event Archetype
 * @returns {Array<Object>} Initialized risk items
 */
export function buildSampleRisks(eventType = 'wedding') {
  const archetypeRisks = DEFAULT_RISKS[eventType] || DEFAULT_RISKS.wedding;
  return archetypeRisks.map(r => ({ ...r }));
}

/**
 * Calculates overall Risk Assessment Metrics & Safety Score.
 * @param {Array<Object>} [risks=[]] - Array of risk items
 * @returns {Object} Comprehensive risk metrics
 */
export function calculateRiskMetrics(risks = []) {
  if (!Array.isArray(risks) || risks.length === 0) {
    return {
      total: 0,
      mitigated: 0,
      monitoring: 0,
      actionNeeded: 0,
      safetyScore: 100,
      profile: 'Zero Identified Risks'
    };
  }

  const total = risks.length;
  const mitigated = risks.filter(r => r.status === 'Mitigated').length;
  const monitoring = risks.filter(r => r.status === 'Monitoring').length;
  const actionNeeded = risks.filter(r => r.status === 'Action Needed').length;

  // Weighted safety score: Mitigated = 1.0, Monitoring = 0.5, Action Needed = 0
  const weightedScore = Math.round(((mitigated * 1.0 + monitoring * 0.5) / total) * 100);

  let profile = 'Low Risk (Protected)';
  if (weightedScore < 50) profile = 'High Risk (Action Required)';
  else if (weightedScore < 80) profile = 'Moderate Risk (In Review)';

  return {
    total,
    mitigated,
    monitoring,
    actionNeeded,
    safetyScore: weightedScore,
    profile
  };
}
