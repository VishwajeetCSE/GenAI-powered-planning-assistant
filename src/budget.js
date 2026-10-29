/**
 * @file budget.js
 * @module PlanFlowAI/Budget
 * @description Context-aware dynamic budget allocation, variance detection, and multi-currency formatting.
 * @license MIT
 */

import { NUMERIC_BOUNDS, CURRENCIES, DEFAULT_CATEGORIES } from './constants.js';
import { sanitizeNumber } from './security.js';

/**
 * Computes live budget distribution, amounts, and variances.
 * @param {number} totalBudget - Overall event budget
 * @param {Record<string, number>} percentages - Map of categoryId -> percentage
 * @param {string} [currencyCode='USD'] - Target currency
 * @param {number} [guestCount=NUMERIC_BOUNDS.GUESTS_DEFAULT] - Guest headcount
 * @returns {Object} Comprehensive budget telemetry
 */
export function calculateBudget(totalBudget, percentages, currencyCode = 'USD', guestCount = NUMERIC_BOUNDS.GUESTS_DEFAULT) {
  const safeBudget = sanitizeNumber(totalBudget, NUMERIC_BOUNDS.BUDGET_MIN, NUMERIC_BOUNDS.BUDGET_MAX, NUMERIC_BOUNDS.BUDGET_DEFAULT);
  const safeGuests = sanitizeNumber(guestCount, NUMERIC_BOUNDS.GUESTS_MIN, NUMERIC_BOUNDS.GUESTS_MAX, NUMERIC_BOUNDS.GUESTS_DEFAULT);
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;

  let sumPct = 0;
  const categoriesBreakdown = [];

  for (const cat of DEFAULT_CATEGORIES) {
    const rawPct = percentages && percentages[cat.id] !== undefined ? percentages[cat.id] : cat.defaultPct;
    const pct = sanitizeNumber(rawPct, 0, 100, cat.defaultPct);
    sumPct += pct;
    const amount = Math.round((safeBudget * pct) / 100);
    const perGuest = safeGuests > 0 ? Number((amount / safeGuests).toFixed(2)) : 0;

    categoriesBreakdown.push({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      filter: cat.filter,
      percentage: pct,
      amount,
      perGuest
    });
  }

  const allocatedTotal = categoriesBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const varianceAmount = safeBudget - allocatedTotal;
  const isBalanced = sumPct === 100;
  const isOverBudget = sumPct > 100;
  const costPerGuest = safeGuests > 0 ? Number((safeBudget / safeGuests).toFixed(2)) : 0;

  return {
    totalBudget: safeBudget,
    allocatedTotal,
    sumPercentage: sumPct,
    varianceAmount,
    isBalanced,
    isOverBudget,
    costPerGuest,
    currencySymbol: currency.symbol,
    categories: categoriesBreakdown
  };
}

/**
 * Formats a numeric currency value.
 * @param {number} amount - Numeric amount
 * @param {string} [currencyCode='USD'] - Currency identifier
 * @returns {string} Formatted localized currency string
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const safeNum = Math.round(Number(amount) || 0);

  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits: 0
    }).format(safeNum);
  } catch (err) {
    return `${curr.symbol}${safeNum.toLocaleString()}`;
  }
}
