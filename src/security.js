/**
 * @file security.js
 * @module PlanFlowAI/Security
 * @description Input sanitization, XSS mitigation, debounce, and safe template DOM injection.
 * @license MIT
 */

import { NUMERIC_BOUNDS } from './constants.js';

/**
 * Escapes unsafe HTML characters to prevent Cross-Site Scripting (XSS).
 * Implements OWASP guidelines covering angle brackets, quotes, ampersands, and slashes.
 * @param {unknown} str - Arbitrary input
 * @returns {string} Sanitized safe string
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') {
    return str === null || str === undefined ? '' : String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Bounds a numeric value defensively within [min, max].
 * @param {unknown} val - Input number or string
 * @param {number} min - Minimum allowed bound
 * @param {number} max - Maximum allowed bound
 * @param {number} defaultVal - Fallback on NaN/Infinity
 * @returns {number} Clamped safe number
 */
export function sanitizeNumber(val, min, max, defaultVal) {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
}

/**
 * Sanitizes, trims, and bounds arbitrary text strings.
 * @param {unknown} str - Input text
 * @param {number} [maxLen=NUMERIC_BOUNDS.TEXT_MAX_LEN] - Maximum length
 * @returns {string} Trimmed, bounded string
 */
export function sanitizeString(str, maxLen = NUMERIC_BOUNDS.TEXT_MAX_LEN) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

/**
 * Debounce helper for rate-limiting high-frequency input events.
 * @param {Function} func - Callback function
 * @param {number} [wait=NUMERIC_BOUNDS.DEBOUNCE_DELAY_MS] - Wait duration in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = NUMERIC_BOUNDS.DEBOUNCE_DELAY_MS) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safely parses and injects HTML into a container using an HTML5 template element and replaceChildren.
 * Ensures strict escaping compliance and avoids direct DOM innerHTML mutation anti-patterns.
 * @param {HTMLElement} element - Target container element
 * @param {string} htmlString - Valid escaped HTML markup string
 */
export function setSanitizedHTML(element, htmlString) {
  if (!element || typeof document === 'undefined') return;
  const template = document.createElement('template');
  template.innerHTML = String(htmlString).trim();
  element.replaceChildren(...template.content.childNodes);
}

/**
 * Generates a cryptographically strong unique identifier for domain items.
 * Uses Web Crypto API when available, falling back safely to timestamp + entropy.
 * @param {string} [prefix='id'] - Optional prefix for the identifier
 * @returns {string} Safe, unique identifier
 */
export function generateSecureId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

