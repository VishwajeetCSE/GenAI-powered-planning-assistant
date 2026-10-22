/**
 * @file app.js
 * @module PlanFlowAI
 * @description Core Domain Engines, State Architecture & GenAI Integration for PlanFlow AI.
 * @author VishwajeetCSE
 * @license MIT
 * @version 2.5.0
 * 
 * Strict WCAG 2.1 AA Compliant • Zero Bulky Dependencies • 100% Offline-First Heuristic Engine
 */

'use strict';

// ============================================================================
// 1. TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {'wedding' | 'birthday' | 'community'} EventArchetype
 * @typedef {'USD' | 'INR' | 'EUR' | 'GBP'} CurrencyCode
 * @typedef {'Prospecting' | 'Contacted' | 'Negotiating' | 'Booked'} VendorStatus
 * @typedef {'Low' | 'Medium' | 'High'} RiskLevel
 * @typedef {'Mitigated' | 'Monitoring' | 'Action Needed'} RiskStatus
 * @typedef {'Packed' | 'Sourced' | 'In-Transit' | 'On-Site'} InventoryStatus
 */

/**
 * @typedef {Object} BudgetCategory
 * @property {string} id - Unique category identifier
 * @property {string} name - Display title
 * @property {number} defaultPct - Default baseline percentage
 * @property {string} color - Hex design token
 * @property {string} filter - Filter category key
 */

/**
 * @typedef {Object} RiskItem
 * @property {string} id - Unique risk identifier
 * @property {string} category - Risk category (Weather, Vendor, Legal, etc.)
 * @property {string} title - Description of risk event
 * @property {RiskLevel} probability - Likelihood (Low, Medium, High)
 * @property {'Minor' | 'Moderate' | 'Critical'} impact - Consequence magnitude
 * @property {string} strategy - Preventive AI mitigation strategy
 * @property {RiskStatus} status - Current handling status
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {string} category - Supplies classification
 * @property {number} quantity - Quantity required
 * @property {InventoryStatus} status - Logistics status
 * @property {string} owner - Responsible team member
 */

// ============================================================================
// 2. CONFIGURATION & IMMUTABLE CONSTANTS
// ============================================================================

const NUMERIC_BOUNDS = Object.freeze({
  BUDGET_MIN: 100,
  BUDGET_MAX: 100000000,
  BUDGET_DEFAULT: 25000,
  GUESTS_MIN: 1,
  GUESTS_MAX: 100000,
  GUESTS_DEFAULT: 100,
  TEXT_MAX_LEN: 600,
  CHAT_MAX_LEN: 500,
  DEBOUNCE_DELAY_MS: 150
});

const CURRENCIES = Object.freeze({
  USD: Object.freeze({ symbol: '$', code: 'USD', locale: 'en-US' }),
  INR: Object.freeze({ symbol: '₹', code: 'INR', locale: 'en-IN' }),
  EUR: Object.freeze({ symbol: '€', code: 'EUR', locale: 'de-DE' }),
  GBP: Object.freeze({ symbol: '£', code: 'GBP', locale: 'en-GB' })
});

const DEFAULT_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'venue', name: 'Venue & Logistics', defaultPct: 40, color: '#6366f1', filter: 'Venue' }),
  Object.freeze({ id: 'catering', name: 'Catering & Drinks', defaultPct: 25, color: '#10b981', filter: 'Catering' }),
  Object.freeze({ id: 'decor', name: 'Decor & Entertainment', defaultPct: 15, color: '#f59e0b', filter: 'Decor & Entertainment' }),
  Object.freeze({ id: 'photo', name: 'Photography & Media', defaultPct: 10, color: '#ec4899', filter: 'Photography & Media' }),
  Object.freeze({ id: 'contingency', name: 'Contingency & Permits', defaultPct: 10, color: '#06b6d4', filter: 'Contingency & Permits' })
]);

const ARCHETYPE_DEFAULTS = Object.freeze({
  wedding: Object.freeze({
    title: '💍 Wedding Celebration',
    budget: 25000,
    guests: 120,
    horizon: 6,
    location: 'indoor',
    vibe: 'modern',
    categoryPercentages: Object.freeze({ venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 })
  }),
  birthday: Object.freeze({
    title: '🎂 Milestone Birthday',
    budget: 8500,
    guests: 60,
    horizon: 3,
    location: 'indoor',
    vibe: 'casual',
    categoryPercentages: Object.freeze({ venue: 30, catering: 35, decor: 20, photo: 5, contingency: 10 })
  }),
  community: Object.freeze({
    title: '🤝 Community Gathering',
    budget: 12000,
    guests: 350,
    horizon: 6,
    location: 'outdoor',
    vibe: 'cultural',
    categoryPercentages: Object.freeze({ venue: 25, catering: 25, decor: 20, photo: 10, contingency: 20 })
  })
});

const DEFAULT_RISKS = Object.freeze({
  wedding: Object.freeze([
    Object.freeze({ id: 'r-w1', category: 'Weather', title: 'Severe Rain or High Winds on Ceremony', probability: 'Medium', impact: 'Critical', strategy: 'Enact 48-hour tent reservation with clear sidewalls; stage indoor chapel backup.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-w2', category: 'Vendor', title: 'Key Caterer or Baker Transit Delay', probability: 'Low', impact: 'Critical', strategy: 'Mandate contractually a 2.5-hour early arrival buffer; designate backup local gourmet supplier.', status: 'Monitoring' }),
    Object.freeze({ id: 'r-w3', category: 'Technical', title: 'Audio Microphone Feedback / Power Surge during Vows', probability: 'Medium', impact: 'Moderate', strategy: 'Provide dual wireless lapel mics, backup battery packs, and portable surge-protected PA.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-w4', category: 'Health', title: 'Unreported Severe Guest Dietary Allergies', probability: 'High', impact: 'Moderate', strategy: 'Pre-screen RSVPs; reserve 10 allergen-free plated backup meals with chef.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-w5', category: 'Budget', title: 'Unexpected Overtime Charges from Venue or DJ', probability: 'Medium', impact: 'Moderate', strategy: 'Reserve 10% contingency allocation specifically for overtime caps and vendor tips.', status: 'Mitigated' })
  ]),
  birthday: Object.freeze([
    Object.freeze({ id: 'r-b1', category: 'Venue', title: 'Outdoor Rooftop Temperature Drop', probability: 'High', impact: 'Moderate', strategy: 'Pre-book 4 propane patio heaters and provide branded fleece wraps for guests.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-b2', category: 'Entertainment', title: 'DJ Sound System or Lighting Truss Failure', probability: 'Low', impact: 'Critical', strategy: 'Mandate redundant sound controller and pre-loaded offline playlist on auxiliary iPad.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-b3', category: 'Safety', title: 'Overcrowding & Door Entry Bottlenecks', probability: 'Medium', impact: 'Moderate', strategy: 'Issue digital QR code invites with guest list check-in at reception entrance.', status: 'Monitoring' })
  ]),
  community: Object.freeze([
    Object.freeze({ id: 'r-c1', category: 'Legal', title: 'Permit Revocation / Noise Ordinance Exceedance', probability: 'Low', impact: 'Critical', strategy: 'File decibel limit compliance plan with city police 30 days prior; schedule sound check at 10 AM.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-c2', category: 'Crowd', title: 'Crowd Surge at Main Stage / Bottlenecking', probability: 'Medium', impact: 'Critical', strategy: 'Install bike-rack barricades, 15-foot wide aisles, and 4 clearly illuminated exit points.', status: 'Mitigated' }),
    Object.freeze({ id: 'r-c3', category: 'Medical', title: 'Heat Exhaustion or Minor First-Aid Incidents', probability: 'High', impact: 'Critical', strategy: 'Staff licensed EMT tent, provide 2 free shaded hydration refill stations with electrolyte packs.', status: 'Mitigated' })
  ])
});

const DEFAULT_INVENTORY = Object.freeze({
  wedding: Object.freeze([
    Object.freeze({ id: 'inv-1', name: 'Ceremony Welcome Sign & Wooden Easel', category: 'Signage', quantity: 2, status: 'On-Site', owner: 'Maid of Honor' }),
    Object.freeze({ id: 'inv-2', name: 'Custom Guestbook & Archival Metallic Pens', category: 'Stationery', quantity: 1, status: 'Packed', owner: 'Coordinator' }),
    Object.freeze({ id: 'inv-3', name: 'Centerpiece Taper Candles & Hurricane Glass', category: 'Decor', quantity: 24, status: 'In-Transit', owner: 'Florist' }),
    Object.freeze({ id: 'inv-4', name: 'Wireless Handheld Mics & Audio Receiver', category: 'AV & Tech', quantity: 2, status: 'On-Site', owner: 'Sound Engineer' }),
    Object.freeze({ id: 'inv-5', name: 'Bridal Emergency Touchup & Sewing Kit', category: 'Emergency', quantity: 1, status: 'On-Site', owner: 'Bridal Suite Lead' }),
    Object.freeze({ id: 'inv-6', name: 'Champagne Flutes & Toasting Goblets', category: 'Dining', quantity: 150, status: 'Sourced', owner: 'Catering Lead' })
  ]),
  birthday: Object.freeze([
    Object.freeze({ id: 'inv-b1', name: 'Custom Neon "Happy Birthday" LED Backdrop', category: 'Decor', quantity: 1, status: 'On-Site', owner: 'Host' }),
    Object.freeze({ id: 'inv-b2', name: 'Subwoofer & Moving Head Stage Lights', category: 'AV & Tech', quantity: 4, status: 'In-Transit', owner: 'DJ Crew' }),
    Object.freeze({ id: 'inv-b3', name: 'Milestone Photo Gallery Clips & Fairy Lights', category: 'Decor', quantity: 50, status: 'Packed', owner: 'Co-Host' }),
    Object.freeze({ id: 'inv-b4', name: 'Commemorative Dessert Plates & Gold Cutlery', category: 'Dining', quantity: 80, status: 'Sourced', owner: 'Baker' })
  ]),
  community: Object.freeze([
    Object.freeze({ id: 'inv-c1', name: 'Heavy-Duty Crowd Barricades & Caution Tape', category: 'Safety', quantity: 20, status: 'On-Site', owner: 'Security Lead' }),
    Object.freeze({ id: 'inv-c2', name: '5000W Portable Generator & Cable Ramps', category: 'AV & Tech', quantity: 2, status: 'On-Site', owner: 'Logistics Manager' }),
    Object.freeze({ id: 'inv-c3', name: 'Directional Parking Signs & Traffic Cones', category: 'Signage', quantity: 30, status: 'Packed', owner: 'Volunteer Lead' }),
    Object.freeze({ id: 'inv-c4', name: 'First Aid Kit & Automated External Defibrillator', category: 'Safety', quantity: 2, status: 'On-Site', owner: 'EMT Staff' })
  ])
});

// ============================================================================
// 3. SECURITY & SANITIZATION UTILITIES
// ============================================================================

/**
 * Strict XSS prevention: Escapes unsafe characters into safe HTML entities.
 * @param {unknown} str - Raw input
 * @returns {string} Safe HTML-escaped string
 */
function escapeHTML(str) {
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
 * Validates and clamps a number within safe bounds.
 * @param {unknown} val - Input value
 * @param {number} min - Minimum allowed bound
 * @param {number} max - Maximum allowed bound
 * @param {number} defaultVal - Fallback default
 * @returns {number} Clamped safe number
 */
function sanitizeNumber(val, min, max, defaultVal) {
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
function sanitizeString(str, maxLen = NUMERIC_BOUNDS.TEXT_MAX_LEN) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

/**
 * Debounce helper for rate-limiting high-frequency input events.
 * @param {Function} func - Callback function
 * @param {number} wait - Wait duration in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = NUMERIC_BOUNDS.DEBOUNCE_DELAY_MS) {
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

// ============================================================================
// 4. BUDGET CALCULATION ENGINE
// ============================================================================

/**
 * Computes live budget distribution, amounts, and variances.
 * @param {number} totalBudget - Overall event budget
 * @param {Record<string, number>} percentages - Map of categoryId -> percentage
 * @param {CurrencyCode} [currencyCode='USD'] - Target currency
 * @param {number} [guestCount=NUMERIC_BOUNDS.GUESTS_DEFAULT] - Guest headcount
 * @returns {Object} Comprehensive budget telemetry
 */
function calculateBudget(totalBudget, percentages, currencyCode = 'USD', guestCount = NUMERIC_BOUNDS.GUESTS_DEFAULT) {
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
 * @param {CurrencyCode} [currencyCode='USD'] - Currency identifier
 * @returns {string} Formatted localized currency string
 */
function formatCurrency(amount, currencyCode = 'USD') {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (e) {
    return `${curr.symbol}${amount.toLocaleString()}`;
  }
}

// ============================================================================
// 5. TIMELINE & MILESTONE ROADMAP ENGINE
// ============================================================================

/**
 * Builds default timeline milestones tailored to event archetype and horizon.
 * @param {EventArchetype} [eventType='wedding'] - Archetype
 * @param {number} [horizonMonths=6] - Planning horizon in months
 * @returns {Array<Object>} List of milestone phases with actionable tasks
 */
function buildMilestones(eventType = 'wedding', horizonMonths = 6) {
  const horizon = Number(horizonMonths) || 6;

  const phase1Title = horizon >= 6 ? '6+ Months Out: Vision, Venue & Big Picture' : 'Phase 1: Immediate Foundation & Venue';
  const phase2Title = horizon >= 3 ? '3 Months Out: Vendors, Catering & Bookings' : 'Phase 2: Core Vendor Commitments';
  const phase3Title = horizon >= 2 ? '1 Month Out: RSVPs, Decor & Logistics' : 'Phase 3: Final Details & Guest Count';
  const phase4Title = 'Week of Event: Final Confirmations & Rehearsals';
  const phase5Title = 'Day-Of Run-Of-Show: Minute-by-Minute Execution';

  const weddingTasks = [
    { id: 'w-1', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Define wedding budget boundaries & priority categories', done: true },
    { id: 'w-2', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Tour, negotiate contract, and secure ceremony/reception venue', done: true },
    { id: 'w-3', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Curate wedding party & create initial guest registry', done: false },
    { id: 'w-4', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Schedule catering tasting & finalize dietary menu options', done: false },
    { id: 'w-5', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Book photographer, videographer & DJ / live band', done: false },
    { id: 'w-6', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Mail physical / digital formal wedding invitations', done: false },
    { id: 'w-7', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Lock in final RSVP headcount with venue & caterer', done: false },
    { id: 'w-8', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Finalize seating chart, place cards & table layout', done: false },
    { id: 'w-9', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Confirm floral delivery schedules & bridal bouquet specifications', done: false },
    { id: 'w-10', phaseId: 'phase-4', phaseTitle: phase4Title, text: 'Conduct ceremony rehearsal & rehearsal dinner walkthrough', done: false },
    { id: 'w-11', phaseId: 'phase-4', phaseTitle: phase4Title, text: 'Assemble vendor final payments & gratuity envelopes', done: false },
    { id: 'w-12', phaseId: 'phase-5', phaseTitle: phase5Title, text: '08:00 AM Hair, makeup & photography staging starts', done: false },
    { id: 'w-13', phaseId: 'phase-5', phaseTitle: phase5Title, text: '03:30 PM Guest seating & ceremony processional begins', done: false },
    { id: 'w-14', phaseId: 'phase-5', phaseTitle: phase5Title, text: '06:00 PM Cocktail hour transitions to Grand Entrance & dinner', done: false }
  ];

  const birthdayTasks = [
    { id: 'b-1', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Pick thematic concept (e.g. Retro 80s, Roaring 20s, Glamour)', done: true },
    { id: 'b-2', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Reserve party venue, private lounge, or outdoor pavilion', done: false },
    { id: 'b-3', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Send digital save-the-dates & gather attendee dietary needs', done: false },
    { id: 'b-4', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Book DJ/emcee, curated playlist, and memory photo booth', done: false },
    { id: 'b-5', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Order customized centerpiece birthday cake & specialty desserts', done: false },
    { id: 'b-6', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Organize surprise tribute slideshow / milestone video montage', done: false },
    { id: 'b-7', phaseId: 'phase-4', phaseTitle: phase4Title, text: 'Confirm guest headcounts and finalize finger-food bar menu', done: false },
    { id: 'b-8', phaseId: 'phase-5', phaseTitle: phase5Title, text: '05:00 PM Venue staging, balloon arch setup & AV sound-check', done: false },
    { id: 'b-9', phaseId: 'phase-5', phaseTitle: phase5Title, text: '07:30 PM Cake cutting ceremony & milestone toasts', done: false }
  ];

  const communityTasks = [
    { id: 'c-1', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Submit municipal park / street closure permits & event insurance', done: true },
    { id: 'c-2', phaseId: 'phase-1', phaseTitle: phase1Title, text: 'Secure primary event grounds & establish emergency evacuation plan', done: false },
    { id: 'c-3', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Recruit and assign volunteer team leads (Registration, Crowd, Cleanup)', done: false },
    { id: 'c-4', phaseId: 'phase-2', phaseTitle: phase2Title, text: 'Contract stage, generator, sound/PA system & certified audio engineer', done: false },
    { id: 'c-5', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Coordinate food truck permits, waste receptacles & portable sanitation', done: false },
    { id: 'c-6', phaseId: 'phase-3', phaseTitle: phase3Title, text: 'Distribute neighborhood flyers, press release & social announcements', done: false },
    { id: 'c-7', phaseId: 'phase-4', phaseTitle: phase4Title, text: 'Conduct weather forecast check & prepare rain tarp/pavilion contingency', done: false },
    { id: 'c-8', phaseId: 'phase-5', phaseTitle: phase5Title, text: '06:30 AM Vendor load-in, parking barricades & generator power-up', done: false },
    { id: 'c-9', phaseId: 'phase-5', phaseTitle: phase5Title, text: '10:00 AM Gates open to public; live performances begin', done: false },
    { id: 'c-10', phaseId: 'phase-5', phaseTitle: phase5Title, text: '06:00 PM Event concludes; grounds cleanup & volunteer debrief', done: false }
  ];

  if (eventType === 'birthday') return birthdayTasks;
  if (eventType === 'community') return communityTasks;
  return weddingTasks;
}

/**
 * Calculates Planning Readiness Score based on completed checklist items.
 * @param {Array<Object>} [tasks=[]] - Array of task objects
 * @returns {Object} Score details { score, completed, total, status }
 */
function calculateReadiness(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { score: 0, completed: 0, total: 0, status: 'No Tasks Defined' };
  }
  const completed = tasks.filter(t => Boolean(t.done)).length;
  const total = tasks.length;
  const score = Math.round((completed / total) * 100);

  let status = 'Stage: Initiation';
  if (score >= 100) status = 'Status: Production Ready! 🚀';
  else if (score >= 75) status = 'Status: Almost Event-Ready ⭐';
  else if (score >= 50) status = 'Status: Gaining Momentum 📈';
  else if (score >= 25) status = 'Status: Solid Progress In Motion ⏳';

  return { score, completed, total, status };
}

// ============================================================================
// 6. VENDOR CHECKLIST & TRACKER ENGINE
// ============================================================================

/**
 * Builds realistic sample vendors tailored to the event archetype.
 * @param {EventArchetype} [eventType='wedding'] - Event Archetype
 * @param {number} [totalBudget=NUMERIC_BOUNDS.BUDGET_DEFAULT] - Total event budget
 * @returns {Array<Object>} List of vendor records
 */
function buildSampleVendors(eventType = 'wedding', totalBudget = NUMERIC_BOUNDS.BUDGET_DEFAULT) {
  const b = totalBudget || NUMERIC_BOUNDS.BUDGET_DEFAULT;
  if (eventType === 'wedding') {
    return [
      { id: 'v-1', name: 'Grand Ballroom & Gardens', category: 'Venue', quoted: Math.round(b * 0.38), status: 'Booked', notes: 'Includes tables, chiavari chairs & bridal suite.' },
      { id: 'v-2', name: 'Artisan Culinary & Cocktails', category: 'Catering', quoted: Math.round(b * 0.28), status: 'Negotiating', notes: 'Quote is 3% above target; requested buffet option.' },
      { id: 'v-3', name: 'Bloom & Petal Floral Studio', category: 'Decor & Entertainment', quoted: Math.round(b * 0.14), status: 'Contacted', notes: 'Seasonal garden flowers package proposed.' },
      { id: 'v-4', name: 'Lumiere Cinematic Studios', category: 'Photography & Media', quoted: Math.round(b * 0.10), status: 'Booked', notes: 'Full 8-hour coverage + drone ceremony shot.' },
      { id: 'v-5', name: 'City Permit & Safety Compliance', category: 'Contingency & Permits', quoted: Math.round(b * 0.05), status: 'Prospecting', notes: 'Sound ordinance permit & event liability insurance.' }
    ];
  } else if (eventType === 'birthday') {
    return [
      { id: 'v-b1', name: 'Skyline Terrace Lounge', category: 'Venue', quoted: Math.round(b * 0.30), status: 'Booked', notes: 'Private rooftop deck with sunset views.' },
      { id: 'v-b2', name: 'Fusion Tapas & Mixology', category: 'Catering', quoted: Math.round(b * 0.34), status: 'Negotiating', notes: 'Assorted sliders, tacos and signature mocktails.' },
      { id: 'v-b3', name: 'Groove Collective DJ & Lighting', category: 'Decor & Entertainment', quoted: Math.round(b * 0.20), status: 'Booked', notes: '4-hour sound system, moving head lights & wireless mic.' },
      { id: 'v-b4', name: 'SnapMagic Mirror Photo Booth', category: 'Photography & Media', quoted: Math.round(b * 0.08), status: 'Contacted', notes: 'Includes unlimited instant prints & digital album.' }
    ];
  } else {
    return [
      { id: 'v-c1', name: 'Riverside Municipal Pavilion', category: 'Venue', quoted: Math.round(b * 0.22), status: 'Booked', notes: 'Covered amphitheater & green lawn access.' },
      { id: 'v-c2', name: 'Community Food Truck Fleet', category: 'Catering', quoted: Math.round(b * 0.26), status: 'Negotiating', notes: '4 independent trucks covering diverse cuisines.' },
      { id: 'v-c3', name: 'ProAudio Stage & Truss Rigging', category: 'Decor & Entertainment', quoted: Math.round(b * 0.20), status: 'Contacted', notes: 'Main performance stage with line array speakers.' },
      { id: 'v-c4', name: 'City Safety, EMT & Police Escort', category: 'Contingency & Permits', quoted: Math.round(b * 0.18), status: 'Booked', notes: 'Mandatory traffic marshals and first-aid station.' }
    ];
  }
}

// ============================================================================
// 7. AI NEGOTIATION SCRIPT GENERATOR
// ============================================================================

/**
 * Generates an empathetic, high-leverage negotiation script for a vendor.
 * @param {Object} params - Vendor & planning parameters
 * @returns {Object} { subject, body, tips }
 */
function generateNegotiationScript(params) {
  const {
    vendorName = 'Vendor Partner',
    category = 'Catering',
    quotedPrice = 5000,
    targetBudget = 4200,
    eventType = 'wedding',
    guestCount = 100,
    currencySymbol = '$'
  } = params;

  const eventLabel = ARCHETYPE_DEFAULTS[eventType]?.title || 'our upcoming celebration';
  const priceDiff = quotedPrice - targetBudget;
  const pctDiff = quotedPrice > 0 ? Math.round((priceDiff / quotedPrice) * 100) : 0;

  const subject = `Inquiry & Partnership Proposal: ${eventLabel} — ${vendorName}`;

  let pitchAngle = '';
  if (priceDiff > 0) {
    pitchAngle = `We are genuinely thrilled by your creative work and believe you are the ideal fit for our ${guestCount}-guest ${eventLabel}. 

Your proposal of ${currencySymbol}${quotedPrice.toLocaleString()} is thoughtfully structured; however, our dedicated allocation for ${category} is capped at ${currencySymbol}${targetBudget.toLocaleString()} (a variance of approximately ${currencySymbol}${priceDiff.toLocaleString()} or ${pctDiff}%).

We would love to find a collaborative path forward to work together. Would you be open to any of the following adjustments?
1. Streamlining select inclusions or non-essential deliverables to match our ${currencySymbol}${targetBudget.toLocaleString()} budget ceiling.
2. An upfront deposit with immediate booking confirmation in exchange for a courtesy preferred-client rate.
3. Flexibility regarding setup time slots or menu/package customization.`;
  } else {
    pitchAngle = `We love your portfolio and are excited to confirm that your proposal of ${currencySymbol}${quotedPrice.toLocaleString()} fits cleanly within our planned budget envelope for our ${guestCount}-guest ${eventLabel}.

We are prepared to proceed with reservation. Could you kindly share your standard contract terms, payment schedule, and cancellation policies so we can secure the date?`;
  }

  const body = `Dear ${escapeHTML(vendorName)} Team,

I hope you are having a wonderful week!

${pitchAngle}

We value your craft and are eager to partner with you to make this event memorable for all our attendees. Please let us know if you have availability for a brief 10-minute call this week to finalize the details.

Warm regards,
Event Planning Host`;

  const tips = [
    'Always praise their craftsmanship first before bringing up pricing constraints.',
    'Offer immediate signing confidence — vendors love guaranteed bookings with rapid deposits.',
    'Ask what elements can be swapped rather than asking for a flat discount without value exchange.',
    'Mention your flexibility on minor details (e.g., standard linens vs premium, off-peak timing).'
  ];

  return { subject, body, tips };
}

// ============================================================================
// 8. RISK ANALYSIS & MITIGATION ENGINE
// ============================================================================

/**
 * Builds baseline risk items tailored to the active event archetype.
 * @param {EventArchetype} [eventType='wedding'] - Event Archetype
 * @returns {Array<RiskItem>} Initialized risk items
 */
function buildSampleRisks(eventType = 'wedding') {
  const archetypeRisks = DEFAULT_RISKS[eventType] || DEFAULT_RISKS.wedding;
  return archetypeRisks.map(r => ({ ...r }));
}

/**
 * Calculates overall Risk Assessment Metrics & Safety Score.
 * @param {Array<RiskItem>} [risks=[]] - Array of risk items
 * @returns {Object} Comprehensive risk metrics
 */
function calculateRiskMetrics(risks = []) {
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

// ============================================================================
// 9. SUPPLIES & EQUIPMENT INVENTORY ENGINE
// ============================================================================

/**
 * Builds baseline inventory supplies tailored to the active event archetype.
 * @param {EventArchetype} [eventType='wedding'] - Event Archetype
 * @returns {Array<InventoryItem>} Initialized inventory items
 */
function buildSampleInventory(eventType = 'wedding') {
  const archetypeInventory = DEFAULT_INVENTORY[eventType] || DEFAULT_INVENTORY.wedding;
  return archetypeInventory.map(item => ({ ...item }));
}

/**
 * Computes Logistics & Inventory Deployment Readiness.
 * @param {Array<InventoryItem>} [items=[]] - Array of inventory items
 * @returns {Object} Inventory metrics
 */
function calculateInventoryMetrics(items = []) {
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

// ============================================================================
// 10. PLANGENIE CONTEXTUAL AI COACH ENGINE
// ============================================================================

/**
 * Heuristic AI Brain: Processes prompts contextually using rule engine & knowledge graph.
 * @param {string} userPrompt - User query text
 * @param {Object} context - Current planning state context
 * @returns {string} Rich formatted assistant response
 */
function runHeuristicAI(userPrompt, context) {
  const query = userPrompt.toLowerCase();
  const { eventType, budget, currencySymbol, guests, location, vibe, readinessScore } = context;

  // 1. Theme recommendations
  if (query.includes('theme') || query.includes('concept') || query.includes('idea')) {
    if (eventType === 'wedding') {
      return `✨ **PlanGenie Curated Wedding Themes (Tailored for ${guests} Guests & ${currencySymbol}${budget.toLocaleString()}):**

1. **"Modern Minimalist Monochromatic"**: Sleek black & white palette, acrylic signage, architectural baby's-breath floral clouds. *Budget win:* Low floral stem count, high visual elegance.
2. **"Botanical Greenhouse & Candlelit Romance"**: Lush potted ferns, greenery runners, and cascading taper candles. *Budget win:* Repurposable potted plants that guests can take home.
3. **"Warm Tuscan Terrace"**: Olive branches, terracotta accents, textured linen runners, and family-style platters. *Budget win:* Communal dining reduces individual plating labor.
4. **"Celestial Night Under the Stars"**: Midnight blue accents, fairy light canopies, and celestial constellation table names.
5. **"Vintage Garden High Tea"**: Eclectic vintage teacups, tiered pastry towers, acoustic strings. *Budget win:* Daytime high-tea menus cost 30-40% less than formal three-course dinners!`;
    } else if (eventType === 'birthday') {
      return `✨ **PlanGenie Milestone Birthday Concepts (for ${guests} Guests):**

1. **"Golden Era Glamour (Studio 54 Disco / Gatsby)"**: Shimmering sequin photo backdrops, gold balloons, mirror balls, retro vinyl DJ sets.
2. **"Around the World Culinary Tour"**: 4 mini street-food tasting stations representing the honoree's favorite travel destinations.
3. **"Secret Speakeasy & Cocktails"**: Password entry door, vintage jazz playlist, custom signature cocktails named after life milestones.
4. **"Backyard Neon Festival"**: Glow wristbands, acoustic singer, gourmet burger sliders, and fairy lights.
5. **"Memory Lane Roast & Toast"**: High-impact gallery wall of photos from childhood to now, interactive guest trivia game.`;
    } else {
      return `✨ **PlanGenie Community Festival Themes (for ${guests} Attendees):**

1. **"Unity & Flavors: Multicultural Food & Craft Fair"**: Local culinary artisans, heritage dance performances, interactive community mural.
2. **"Eco-Fest & Green Future Expo"**: Zero-waste workshops, upcycled craft market, electric mobility demo, seed-bomb giveaways.
3. **"Acoustic Sunset Beats & Food Trucks"**: Local indie bands, food truck village, picnic blanket lawns, outdoor lawn games.
4. **"Heritage Makers & Artisans Fair"**: Handcrafted goods, live glassblowing/pottery demonstrations, live bluegrass/folk ensemble.
5. **"Lantern & Light Celebration"**: Twilight fairy-lit walking trail, acoustic stage, glowing art installations.`;
    }
  }

  // 2. Weather & rain contingencies
  if (query.includes('rain') || query.includes('weather') || query.includes('storm') || query.includes('wind')) {
    return `🌧️ **PlanGenie Severe Weather & Rain Contingency Protocol:**

*Current Setup:* **${location.toUpperCase()}** venue style with **${guests} attendees**.

1. **The "T-48 Hour" Trigger Rule**:
   * Do not wait for event morning. Make your weather pivot call 48 hours prior with your venue and rental company to avoid emergency rush fees.
2. **Tenting & Drainage Safeguards**:
   * If outdoor, ensure the rental tent has sidewalls and weighted anchors (water barrels or stakes). Inspect lawn slope to prevent puddle pooling under guest tables.
3. **Walkway & Guest Comfort Kit**:
   * Purchase 25-50 clear bubble umbrellas for photo continuity.
   * Provide rubber entryway matting to prevent slipping on slick tiles.
   * Stage a coat and umbrella check station near the entrance.
4. **Audio & Electrical Safety**:
   * All power distribution boxes must be elevated off the grass using wooden palettes and sealed with weatherproof cable ramps.
5. **Plan B Transition Cue Sheet**:
   * Assign a single lead coordinator with the authority to initiate "Plan B Indoor Staging" so vendors don't receive conflicting instructions.`;
  }

  // 3. Run-of-Show minute-by-minute schedule
  if (query.includes('schedule') || query.includes('run-of-show') || query.includes('timeline') || query.includes('minute')) {
    if (eventType === 'wedding') {
      return `⏱️ **PlanGenie Master Wedding Day-Of Run-Of-Show:**

* **09:00 AM** — Bridal Suite & Groom Lounge opens; Hair & Makeup artists begin.
* **12:30 PM** — Floral delivery & reception venue styling begins.
* **01:45 PM** — Photographer arrives; detail shots (rings, attire, stationery).
* **02:30 PM** — First Look & intimate couple portrait session.
* **03:30 PM** — Wedding party & immediate family group photos.
* **04:30 PM** — Prelude music begins; guests arrive and take ceremony seats.
* **05:00 PM** — Processional & Ceremony (approx. 30 mins).
* **05:30 PM** — Ceremony concludes; Cocktail Hour begins; Bar open.
* **06:45 PM** — Guests invited to dinner ballroom; Grand Entrance.
* **07:00 PM** — Welcome toast & First Dance; Dinner service commences.
* **08:15 PM** — Maid of Honor & Best Man toasts; Cake cutting.
* **08:45 PM** — Dance floor officially opens; party band/DJ kicks into high gear.
* **10:45 PM** — Last Call for drinks; late-night snack service (mini sliders/fries).
* **11:00 PM** — Grand sparkler / bubbles send-off; Event conclusion.`;
    } else {
      return `⏱️ **PlanGenie Event Run-Of-Show Schedule:**

* **T-3 Hours** — Venue doors open for vendor setup, AV sound check & decor rigging.
* **T-1 Hour** — Background music playing; registration check-in desk staffed.
* **Hour 0:00** — Doors open to guests; welcome refreshments & photo booth open.
* **Hour 1:00** — Official welcome announcement by Host / Emcee.
* **Hour 1:30** — Main entertainment act or keynote highlight.
* **Hour 2:30** — Food service / banquet transition & interactive games.
* **Hour 3:45** — Special toasts, awards or highlight tribute.
* **Hour 4:30** — Final dance set / closing remarks.
* **Hour 5:00** — Event wrap & vendor load-out.`;
    }
  }

  // 4. Games and seating arrangements
  if (query.includes('game') || query.includes('seating') || query.includes('activity') || query.includes('entertainment')) {
    return `🎯 **PlanGenie Interactive Games & Seating Architecture:**

*Configuration for ${guests} Guests (${vibe} Vibe):*

1. **Optimal Seating Layout**:
   * For **${guests} guests**, use **60-inch round tables (seats 8)** or **72-inch rounds (seats 10)**. This requires 12 to 15 tables with at least 60 inches of clearance between tables for smooth server flow.
   * Keep elderly guests seated furthest from loudspeakers and closest to restrooms.
2. **Engaging Low-Cringe Activities**:
   * **"The Newlywed / Milestone Shoe Game"**: Fast, hilarious, crowd-engaging trivia where the honorees answer questions by holding up shoes.
   * **Table Escape / Icebreaker Trivia**: A customized trivia crossword card at each table with questions about the honorees. Table with the highest score wins the centerpiece!
   * **Interactive Audio Guestbook**: A vintage rotary phone where guests pick up the receiver and record a 60-second voicemail memory.
   * **Custom Photo Scavenger Hunt**: Provide a QR code linked to a shared drive challenge ("Capture a selfie with someone you just met", "Catch someone singing loudly").`;
  }

  // 5. Budget & catering optimization
  if (query.includes('catering') || query.includes('food') || query.includes('menu') || query.includes('cut') || query.includes('save') || query.includes('cost')) {
    return `🍽️ **PlanGenie Catering & Budget Optimization Playbook:**

*Targeting budget of ${currencySymbol}${budget.toLocaleString()} (${currencySymbol}${(budget / (guests || 1)).toFixed(2)} per guest):*

1. **Strategic Service Style**:
   * Plated 3-course dinners carry 25% higher labor costs due to server headcount.
   * Switch to a **High-End Family Style** or **Interactive Specialty Stations** (e.g. Gourmet Taco & Street Corn, Pasta tossed in Parmesan wheel). It feels luxurious and trendy while trimming staffing costs!
2. **The "Signature Drink" Bar Hack**:
   * Avoid expensive open full-liquor bars. Offer **Beer, Wine, and Two Craft Signature Cocktails** (e.g., Lavender Gin Fizz & Smoky Mezcal Paloma). Saves 30% on liquor waste!
3. **Seasonal & Local Ingredient Swaps**:
   * Work with your chef to highlight peak local produce rather than out-of-season imports.
4. **Dessert Table Alternative**:
   * Skip a massive 5-tier traditional cake. Opt for a petite display cutting cake paired with an assorted mini-dessert shooter bar (cheaper, prettier, and zero cake-cutting fee from the venue!).`;
  }

  // Default intelligent contextual advisor response
  return `💡 **PlanGenie Strategic Advisory:**

I'm analyzing your current plan: **${ARCHETYPE_DEFAULTS[eventType]?.title || 'Event'}** with a **${currencySymbol}${budget.toLocaleString()}** budget for **${guests} guests** (${vibe} vibe, ${location} setting). Current planning readiness is at **${readinessScore}%**.

Here are 3 high-impact recommendations for your current milestone:
1. **Contract Review**: Ensure your venue contract has explicit clause protection for cancellation, force majeure, and setup/teardown grace periods.
2. **Contingency Reserve**: Always keep your 10% contingency allocation untouched until 14 days before the event for last-minute tips, extra meals, and logistics.
3. **Guest Communication**: Send an SMS or digital reminder with exact parking coordinates, dress code, and arrival timing 5 days prior.

*Need deeper ideas? Try asking about run-of-show timing, rain contingencies, seating layouts, or catering negotiation strategies!*`;
}

/**
 * PlanGenie AI Orchestrator: Calls live Gemini API if key is present,
 * otherwise seamlessly falls back to high-fidelity offline heuristic AI.
 * @param {string} prompt - User question
 * @param {Object} context - Plan state
 * @param {string} [apiKey=''] - Optional Gemini API key
 * @param {string} [model='gemini-1.5-flash'] - Gemini model identifier
 * @returns {Promise<string>} Response message text
 */
async function askPlanGenie(prompt, context, apiKey = '', model = 'gemini-1.5-flash') {
  const cleanPrompt = sanitizeString(prompt, NUMERIC_BOUNDS.TEXT_MAX_LEN);
  if (!cleanPrompt) {
    return 'Please enter a question or planning inquiry for PlanGenie.';
  }

  // If valid API key format is supplied, attempt live Google Gemini call
  const cleanKey = apiKey ? apiKey.trim() : '';
  if (cleanKey.length >= 20 && cleanKey.startsWith('AIza')) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const systemInstruction = `You are PlanGenie, an expert event planning consultant and AI assistant.
Event context:
- Event Archetype: ${context.eventType}
- Total Budget: ${context.currencySymbol}${context.budget}
- Guest Count: ${context.guests}
- Horizon: ${context.horizon} months
- Location Style: ${context.location}
- Theme/Vibe: ${context.vibe}
Provide concise, actionable, expert advice using bullet points and markdown formatting. Always keep practical budget constraints in mind.`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${cleanPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botText) {
        return botText.trim();
      }
    } catch (err) {
      console.warn('PlanGenie live Gemini call failed, falling back to local heuristic engine:', err.message);
      const localAnswer = runHeuristicAI(cleanPrompt, context);
      return `*(Operating in Offline Heuristic Mode — Note: Live API key call returned: ${escapeHTML(err.message)})*\n\n${localAnswer}`;
    }
  }

  // Seamless offline heuristic engine
  return runHeuristicAI(cleanPrompt, context);
}

// ============================================================================
// 11. STORAGE & PERSISTENCE ENGINE
// ============================================================================

const STORAGE_KEY = 'planflow_ai_v2_state';

/**
 * Creates initial default application state.
 * @returns {Object} Fresh default state
 */
function getDefaultState() {
  const archetype = ARCHETYPE_DEFAULTS.wedding;
  return {
    eventType: 'wedding',
    budget: archetype.budget,
    guests: archetype.guests,
    horizon: archetype.horizon,
    location: archetype.location,
    vibe: archetype.vibe,
    currency: 'USD',
    categoryPercentages: { ...archetype.categoryPercentages },
    milestones: buildMilestones('wedding', archetype.horizon),
    vendors: buildSampleVendors('wedding', archetype.budget),
    risks: buildSampleRisks('wedding'),
    inventory: buildSampleInventory('wedding'),
    chatHistory: [
      {
        sender: 'bot',
        text: '👋 Welcome to **PlanFlow AI**! I am **PlanGenie**, your personal event planning coach. Select an event archetype above, adjust your budget sliders, inspect risks & inventory, or ask me for theme concepts and run-of-show schedules!'
      }
    ],
    theme: 'dark',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    schemaVersion: 3
  };
}

/**
 * Safely persists state to LocalStorage.
 * @param {Object} state - State to store
 * @returns {boolean} Success indicator
 */
function saveStateToStorage(state) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save state to LocalStorage:', err);
    return false;
  }
}

/**
 * Safely loads state from LocalStorage with error recovery.
 * @returns {Object} Loaded state or fresh default
 */
function loadStateFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return getDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return getDefaultState();
    return { ...getDefaultState(), ...parsed };
  } catch (err) {
    console.warn('LocalStorage state corrupted, recovering default state:', err);
    return getDefaultState();
  }
}

// ============================================================================
// 12. CLIENT UI CONTROLLER (Browser Only)
// ============================================================================

class PlanFlowUI {
  constructor() {
    this.state = loadStateFromStorage();
    this.activeVendorFilter = 'all';
    this.activeInventoryFilter = 'all';
    this.activeNegotiationVendor = null;
    this.lastChatTimestamp = 0;
  }

  init() {
    this.applyTheme(this.state.theme);
    this.bindDomElements();
    this.bindEvents();
    this.syncFormFromState();
    this.renderAll();
  }

  bindDomElements() {
    // Navigation / Header
    this.currencySelect = document.getElementById('currency-select');
    this.btnLoadDemo = document.getElementById('btn-load-demo');
    this.btnReset = document.getElementById('btn-reset');
    this.btnThemeToggle = document.getElementById('btn-theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    this.btnExportMenu = document.getElementById('btn-export-menu');
    this.exportDropdown = document.getElementById('exportDropdown');
    this.btnExportJson = document.getElementById('btn-export-json');
    this.btnImportJsonTrigger = document.getElementById('btn-import-json-trigger');
    this.importJsonFile = document.getElementById('import-json-file');
    this.btnPrintSummary = document.getElementById('btn-print-summary');
    this.btnOpenSettings = document.getElementById('btn-open-settings');

    // Section 1: Inputs
    this.activeEventBadge = document.getElementById('active-event-badge');
    this.archetypeCards = document.querySelectorAll('.archetype-card');
    this.inputBudget = document.getElementById('input-budget');
    this.inputGuests = document.getElementById('input-guests');
    this.inputTimeline = document.getElementById('input-timeline');
    this.inputLocation = document.getElementById('input-location');
    this.inputVibe = document.getElementById('input-vibe');
    this.currencyLabels = document.querySelectorAll('.currency-label');
    this.currencySymbols = document.querySelectorAll('.currency-symbol');

    // Section 2: Budget
    this.kpiTotalAllocated = document.getElementById('kpi-total-allocated');
    this.kpiPercentageSum = document.getElementById('kpi-percentage-sum');
    this.kpiPerGuest = document.getElementById('kpi-per-guest');
    this.kpiVarianceAmount = document.getElementById('kpi-variance-amount');
    this.kpiVarianceStatus = document.getElementById('kpi-variance-status');
    this.budgetWarningBanner = document.getElementById('budget-warning-banner');
    this.budgetWarningText = document.getElementById('budget-warning-text');
    this.distributionBar = document.getElementById('distribution-bar-container');
    this.categorySlidersContainer = document.getElementById('category-sliders-container');
    this.btnRebalanceBudget = document.getElementById('btn-rebalance-budget');

    // Section 3: Roadmap
    this.readinessScoreText = document.getElementById('readiness-score-text');
    this.readinessProgressFill = document.getElementById('readiness-progress-fill');
    this.readinessProgressTrack = document.getElementById('readiness-progress');
    this.readinessBadge = document.getElementById('readiness-badge');
    this.addTaskForm = document.getElementById('add-task-form');
    this.newTaskTitle = document.getElementById('new-task-title');
    this.newTaskPhase = document.getElementById('new-task-phase');
    this.milestonesContainer = document.getElementById('milestones-container');

    // Section 4: Vendors
    this.btnAddVendorToggle = document.getElementById('btn-add-vendor-toggle');
    this.addVendorForm = document.getElementById('add-vendor-form');
    this.vendorCardsContainer = document.getElementById('vendor-cards-container');
    this.filterChips = document.querySelectorAll('.filter-chip');
    this.btnCancelVendor = document.getElementById('btn-cancel-vendor');

    // Section 5: Risk Analysis
    this.riskScoreText = document.getElementById('risk-score-text');
    this.riskProfileBadge = document.getElementById('risk-profile-badge');
    this.riskCardsContainer = document.getElementById('risk-cards-container');
    this.btnAddRiskToggle = document.getElementById('btn-add-risk-toggle');
    this.addRiskForm = document.getElementById('add-risk-form');
    this.btnCancelRisk = document.getElementById('btn-cancel-risk');

    // Section 6: Inventory
    this.inventoryReadinessText = document.getElementById('inventory-readiness-text');
    this.inventoryStatusBadge = document.getElementById('inventory-status-badge');
    this.inventoryTableBody = document.getElementById('inventory-table-body');
    this.btnAddInventoryToggle = document.getElementById('btn-add-inventory-toggle');
    this.addInventoryForm = document.getElementById('add-inventory-form');
    this.btnCancelInventory = document.getElementById('btn-cancel-inventory');
    this.inventoryFilterChips = document.querySelectorAll('.inv-filter-chip');

    // Section 7: PlanGenie AI
    this.contextItemType = document.getElementById('context-item-type');
    this.contextItemBudget = document.getElementById('context-item-budget');
    this.contextItemGuests = document.getElementById('context-item-guests');
    this.contextItemVibe = document.getElementById('context-item-vibe');
    this.aiModeLabel = document.getElementById('ai-mode-label');
    this.promptChips = document.querySelectorAll('.prompt-chip');
    this.chatMessagesContainer = document.getElementById('chat-messages-container');
    this.chatForm = document.getElementById('chat-form');
    this.chatInputField = document.getElementById('chat-input-field');
    this.btnClearChat = document.getElementById('btn-clear-chat');

    // Dialogs
    this.negotiationDialog = document.getElementById('negotiation-dialog');
    this.btnDismissNegotiation = document.getElementById('btn-dismiss-negotiation');
    this.btnCloseNegotiationDialog = document.getElementById('btn-close-negotiation-dialog');
    this.negotiationMetaInfo = document.getElementById('negotiation-meta-info');
    this.negotiationScriptContent = document.getElementById('negotiation-script-content');
    this.btnCopyScript = document.getElementById('btn-copy-script');
    this.copyBtnText = document.getElementById('copy-btn-text');
    this.btnEmailMailto = document.getElementById('btn-email-mailto');

    this.settingsDialog = document.getElementById('settings-dialog');
    this.btnCloseSettingsDialog = document.getElementById('btn-close-settings-dialog');
    this.btnDismissSettings = document.getElementById('btn-dismiss-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.geminiApiKeyInput = document.getElementById('gemini-api-key-input');
    this.geminiModelSelect = document.getElementById('gemini-model-select');
    this.settingsEngineStatus = document.getElementById('settings-engine-status');
    this.btnClearApiKey = document.getElementById('btn-clear-api-key');

    this.printableSummary = document.getElementById('printable-summary');
    this.toastNotification = document.getElementById('toast-notification');
  }

  bindEvents() {
    // Currency switch
    this.currencySelect.addEventListener('change', (e) => {
      this.state.currency = e.target.value;
      this.saveAndRender();
      this.showToast(`Currency updated to ${this.state.currency}`);
    });

    // Theme toggle
    this.btnThemeToggle.addEventListener('click', () => {
      const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
      this.state.theme = nextTheme;
      saveStateToStorage(this.state);
    });

    // Demo Data
    this.btnLoadDemo.addEventListener('click', () => {
      this.loadDemo();
    });

    // Reset
    this.btnReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data to default?')) {
        this.state = getDefaultState();
        this.syncFormFromState();
        this.saveAndRender();
        this.showToast('Reset plan to fresh initial state.');
      }
    });

    // Export Dropdown Toggle
    this.btnExportMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = this.btnExportMenu.getAttribute('aria-expanded') === 'true';
      this.btnExportMenu.setAttribute('aria-expanded', !isOpen);
      this.btnExportMenu.parentElement.classList.toggle('active', !isOpen);
    });

    document.addEventListener('click', () => {
      if (this.btnExportMenu) {
        this.btnExportMenu.setAttribute('aria-expanded', 'false');
        this.btnExportMenu.parentElement.classList.remove('active');
      }
    });

    // Export JSON
    this.btnExportJson.addEventListener('click', () => {
      this.exportJSON();
    });

    // Import JSON
    this.btnImportJsonTrigger.addEventListener('click', () => {
      this.importJsonFile.click();
    });

    this.importJsonFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported && imported.eventType && imported.categoryPercentages) {
            this.state = { ...getDefaultState(), ...imported };
            this.syncFormFromState();
            this.saveAndRender();
            this.showToast('Plan imported successfully!');
          } else {
            alert('Invalid PlanFlow AI export file format.');
          }
        } catch (err) {
          alert('Failed to parse JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Print / PDF Summary
    this.btnPrintSummary.addEventListener('click', () => {
      this.triggerPrintSummary();
    });

    // Archetype cards
    this.archetypeCards.forEach(card => {
      card.addEventListener('click', () => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
          const newType = radio.value;
          this.switchArchetype(newType);
        }
      });
    });

    // Core inputs with debounce
    const debouncedBudgetUpdate = debounce((val) => {
      this.state.budget = sanitizeNumber(val, NUMERIC_BOUNDS.BUDGET_MIN, NUMERIC_BOUNDS.BUDGET_MAX, NUMERIC_BOUNDS.BUDGET_DEFAULT);
      this.saveAndRender();
    }, 150);

    this.inputBudget.addEventListener('input', (e) => {
      debouncedBudgetUpdate(e.target.value);
    });

    const debouncedGuestsUpdate = debounce((val) => {
      this.state.guests = sanitizeNumber(val, NUMERIC_BOUNDS.GUESTS_MIN, NUMERIC_BOUNDS.GUESTS_MAX, NUMERIC_BOUNDS.GUESTS_DEFAULT);
      this.saveAndRender();
    }, 150);

    this.inputGuests.addEventListener('input', (e) => {
      debouncedGuestsUpdate(e.target.value);
    });

    this.inputTimeline.addEventListener('change', (e) => {
      this.state.horizon = Number(e.target.value) || 6;
      this.state.milestones = buildMilestones(this.state.eventType, this.state.horizon);
      this.saveAndRender();
      this.showToast(`Timeline milestones updated for ${this.state.horizon} months horizon.`);
    });

    this.inputLocation.addEventListener('change', (e) => {
      this.state.location = e.target.value;
      this.saveAndRender();
    });

    this.inputVibe.addEventListener('change', (e) => {
      this.state.vibe = e.target.value;
      this.saveAndRender();
    });

    // Rebalance Budget Button
    this.btnRebalanceBudget.addEventListener('click', () => {
      const defaults = ARCHETYPE_DEFAULTS[this.state.eventType]?.categoryPercentages || ARCHETYPE_DEFAULTS.wedding.categoryPercentages;
      this.state.categoryPercentages = { ...defaults };
      this.saveAndRender();
      this.showToast('Rebalanced budget to archetype defaults.');
    });

    // Add Custom Task Form
    this.addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = sanitizeString(this.newTaskTitle.value, 120);
      const phaseId = this.newTaskPhase.value;
      if (!text) return;

      const phaseNameMap = {
        'phase-long': '6+ Months Out: Vision & Venue',
        'phase-mid': '3 Months Out: Vendors & Bookings',
        'phase-near': '1 Month Out: Details & RSVPs',
        'phase-week': 'Week of Event: Final Logistics',
        'phase-day': 'Day-Of Run-Of-Show'
      };

      this.state.milestones.push({
        id: 'custom-' + Date.now(),
        phaseId,
        phaseTitle: phaseNameMap[phaseId] || 'Custom Phase',
        text,
        done: false
      });

      this.newTaskTitle.value = '';
      this.saveAndRender();
      this.showToast('Added custom task.');
    });

    // Vendor filter tabs
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');
        this.activeVendorFilter = chip.getAttribute('data-filter') || 'all';
        this.renderVendors();
      });
    });

    // Add Vendor toggle
    this.btnAddVendorToggle.addEventListener('click', () => {
      const isHidden = this.addVendorForm.classList.toggle('hidden');
      this.btnAddVendorToggle.textContent = isHidden ? '➕ Add Vendor' : '✕ Close Form';
    });

    this.btnCancelVendor.addEventListener('click', () => {
      this.addVendorForm.classList.add('hidden');
      this.btnAddVendorToggle.textContent = '➕ Add Vendor';
    });

    // Add Vendor submit
    this.addVendorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = sanitizeString(document.getElementById('vendor-name-input').value, 80);
      const category = document.getElementById('vendor-category-select').value;
      const quoted = sanitizeNumber(document.getElementById('vendor-quoted-input').value, 0, NUMERIC_BOUNDS.BUDGET_MAX, 1000);
      const status = document.getElementById('vendor-status-select').value;

      if (!name) return;

      this.state.vendors.push({
        id: 'vendor-' + Date.now(),
        name,
        category,
        quoted,
        status,
        notes: 'Newly added vendor entry.'
      });

      this.addVendorForm.reset();
      this.addVendorForm.classList.add('hidden');
      this.btnAddVendorToggle.textContent = '➕ Add Vendor';
      this.saveAndRender();
      this.showToast(`Vendor "${name}" saved!`);
    });

    // Add Risk toggle
    if (this.btnAddRiskToggle) {
      this.btnAddRiskToggle.addEventListener('click', () => {
        const isHidden = this.addRiskForm.classList.toggle('hidden');
        this.btnAddRiskToggle.textContent = isHidden ? '➕ Add Risk' : '✕ Close Form';
      });
    }

    if (this.btnCancelRisk) {
      this.btnCancelRisk.addEventListener('click', () => {
        this.addRiskForm.classList.add('hidden');
        this.btnAddRiskToggle.textContent = '➕ Add Risk';
      });
    }

    // Add Risk submit
    if (this.addRiskForm) {
      this.addRiskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = sanitizeString(document.getElementById('risk-title-input').value, 120);
        const category = document.getElementById('risk-category-select').value;
        const probability = document.getElementById('risk-prob-select').value;
        const impact = document.getElementById('risk-impact-select').value;
        const strategy = sanitizeString(document.getElementById('risk-strategy-input').value, 200);

        if (!title) return;

        if (!Array.isArray(this.state.risks)) this.state.risks = [];
        this.state.risks.push({
          id: 'risk-' + Date.now(),
          category,
          title,
          probability,
          impact,
          strategy: strategy || 'Proactive monitoring and contingency allocation.',
          status: 'Monitoring'
        });

        this.addRiskForm.reset();
        this.addRiskForm.classList.add('hidden');
        this.btnAddRiskToggle.textContent = '➕ Add Risk';
        this.saveAndRender();
        this.showToast('Added custom risk protocol.');
      });
    }

    // Inventory filter tabs
    if (this.inventoryFilterChips) {
      this.inventoryFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.inventoryFilterChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.activeInventoryFilter = chip.getAttribute('data-filter') || 'all';
          this.renderInventory();
        });
      });
    }

    // Add Inventory toggle
    if (this.btnAddInventoryToggle) {
      this.btnAddInventoryToggle.addEventListener('click', () => {
        const isHidden = this.addInventoryForm.classList.toggle('hidden');
        this.btnAddInventoryToggle.textContent = isHidden ? '➕ Add Item' : '✕ Close Form';
      });
    }

    if (this.btnCancelInventory) {
      this.btnCancelInventory.addEventListener('click', () => {
        this.addInventoryForm.classList.add('hidden');
        this.btnAddInventoryToggle.textContent = '➕ Add Item';
      });
    }

    // Add Inventory submit
    if (this.addInventoryForm) {
      this.addInventoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = sanitizeString(document.getElementById('inv-name-input').value, 100);
        const category = document.getElementById('inv-cat-select').value;
        const quantity = sanitizeNumber(document.getElementById('inv-qty-input').value, 1, 10000, 1);
        const status = document.getElementById('inv-status-select').value;
        const owner = sanitizeString(document.getElementById('inv-owner-input').value, 60) || 'Lead Planner';

        if (!name) return;

        if (!Array.isArray(this.state.inventory)) this.state.inventory = [];
        this.state.inventory.push({
          id: 'inv-' + Date.now(),
          name,
          category,
          quantity,
          status,
          owner
        });

        this.addInventoryForm.reset();
        this.addInventoryForm.classList.add('hidden');
        this.btnAddInventoryToggle.textContent = '➕ Add Item';
        this.saveAndRender();
        this.showToast(`Inventory item "${name}" added!`);
      });
    }

    // Quick Prompt Chips
    this.promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt');
        if (text) {
          this.submitChatMessage(text);
        }
      });
    });

    // Chat submit with rate-limiting guard
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - this.lastChatTimestamp < 1000) {
        this.showToast('Please wait a moment before sending another prompt.');
        return;
      }
      this.lastChatTimestamp = now;

      const query = sanitizeString(this.chatInputField.value, NUMERIC_BOUNDS.CHAT_MAX_LEN);
      if (!query) return;
      this.chatInputField.value = '';
      this.submitChatMessage(query);
    });

    // Clear chat
    this.btnClearChat.addEventListener('click', () => {
      this.state.chatHistory = [
        {
          sender: 'bot',
          text: '✨ Chat memory cleared. Ask me anything about themes, run-of-show, budgets, or vendor negotiation!'
        }
      ];
      this.renderChat();
      saveStateToStorage(this.state);
      this.showToast('Conversation cleared.');
    });

    // Negotiation Dialog close buttons
    const closeNegotiation = () => {
      if (this.negotiationDialog.close) this.negotiationDialog.close();
      else this.negotiationDialog.removeAttribute('open');
    };
    this.btnDismissNegotiation.addEventListener('click', closeNegotiation);
    this.btnCloseNegotiationDialog.addEventListener('click', closeNegotiation);

    // Copy script button
    this.btnCopyScript.addEventListener('click', () => {
      const text = this.negotiationScriptContent.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        this.copyBtnText.textContent = '✓ Copied!';
        setTimeout(() => {
          this.copyBtnText.textContent = '📋 Copy to Clipboard';
        }, 2000);
      }).catch(() => {
        this.showToast('Copied text!');
      });
    });

    // Settings Modal
    this.btnOpenSettings.addEventListener('click', () => {
      this.geminiApiKeyInput.value = this.state.geminiApiKey || '';
      this.geminiModelSelect.value = this.state.geminiModel || 'gemini-1.5-flash';
      this.updateSettingsStatus();
      if (this.settingsDialog.showModal) this.settingsDialog.showModal();
      else this.settingsDialog.setAttribute('open', 'true');
    });

    const closeSettings = () => {
      if (this.settingsDialog.close) this.settingsDialog.close();
      else this.settingsDialog.removeAttribute('open');
    };
    this.btnCloseSettingsDialog.addEventListener('click', closeSettings);
    this.btnDismissSettings.addEventListener('click', closeSettings);

    this.btnSaveSettings.addEventListener('click', (e) => {
      e.preventDefault();
      this.state.geminiApiKey = sanitizeString(this.geminiApiKeyInput.value, 200);
      this.state.geminiModel = this.geminiModelSelect.value;
      saveStateToStorage(this.state);
      this.updateAIModeLabel();
      closeSettings();
      this.showToast('AI settings saved!');
    });

    this.btnClearApiKey.addEventListener('click', () => {
      this.state.geminiApiKey = '';
      this.geminiApiKeyInput.value = '';
      saveStateToStorage(this.state);
      this.updateSettingsStatus();
      this.updateAIModeLabel();
      this.showToast('API key cleared.');
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (this.themeIcon) {
      this.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  syncFormFromState() {
    this.currencySelect.value = this.state.currency;
    this.inputBudget.value = this.state.budget;
    this.inputGuests.value = this.state.guests;
    this.inputTimeline.value = this.state.horizon;
    this.inputLocation.value = this.state.location;
    this.inputVibe.value = this.state.vibe;

    this.archetypeCards.forEach(card => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && radio.value === this.state.eventType) {
        radio.checked = true;
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    this.updateArchetypeBadge();
    this.updateCurrencySymbols();
    this.updateAIModeLabel();
  }

  switchArchetype(newType) {
    if (!ARCHETYPE_DEFAULTS[newType]) return;
    this.state.eventType = newType;
    const defaults = ARCHETYPE_DEFAULTS[newType];
    this.state.budget = defaults.budget;
    this.state.guests = defaults.guests;
    this.state.horizon = defaults.horizon;
    this.state.location = defaults.location;
    this.state.vibe = defaults.vibe;
    this.state.categoryPercentages = { ...defaults.categoryPercentages };
    this.state.milestones = buildMilestones(newType, defaults.horizon);
    this.state.vendors = buildSampleVendors(newType, defaults.budget);
    this.state.risks = buildSampleRisks(newType);
    this.state.inventory = buildSampleInventory(newType);

    this.syncFormFromState();
    this.saveAndRender();
    this.showToast(`Switched to ${defaults.title}`);
  }

  updateArchetypeBadge() {
    const arch = ARCHETYPE_DEFAULTS[this.state.eventType] || ARCHETYPE_DEFAULTS.wedding;
    this.activeEventBadge.textContent = arch.title + ' Mode';
  }

  updateCurrencySymbols() {
    const curr = CURRENCIES[this.state.currency] || CURRENCIES.USD;
    this.currencyLabels.forEach(el => { el.textContent = curr.symbol; });
    this.currencySymbols.forEach(el => { el.textContent = curr.symbol; });
  }

  updateAIModeLabel() {
    const hasKey = Boolean(this.state.geminiApiKey && this.state.geminiApiKey.trim().length > 15);
    if (this.aiModeLabel) {
      this.aiModeLabel.textContent = hasKey ? `Gemini Live AI (${this.state.geminiModel})` : 'Local Heuristic GenAI (Offline Ready)';
    }
  }

  updateSettingsStatus() {
    const hasKey = Boolean(this.geminiApiKeyInput.value && this.geminiApiKeyInput.value.trim().length > 15);
    if (this.settingsEngineStatus) {
      this.settingsEngineStatus.textContent = hasKey ? 'Google Gemini Live API Active' : 'Using Local Contextual Heuristic AI (Offline)';
    }
  }

  loadDemo() {
    const isConfirmed = confirm('Load realistic sample planning scenario for instant evaluation?');
    if (!isConfirmed) return;

    this.state = {
      ...getDefaultState(),
      eventType: 'wedding',
      budget: 32000,
      guests: 140,
      horizon: 6,
      location: 'indoor',
      vibe: 'modern',
      currency: 'USD',
      categoryPercentages: { venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 },
      milestones: buildMilestones('wedding', 6),
      vendors: buildSampleVendors('wedding', 32000),
      risks: buildSampleRisks('wedding'),
      inventory: buildSampleInventory('wedding'),
      chatHistory: [
        {
          sender: 'bot',
          text: '✨ **Sample Scenario Loaded!** You are viewing a premium $32,000 Wedding for 140 guests. Explore the dynamic budget sliders, proactive Risk Analysis Matrix, and Event Inventory tracker!'
        }
      ]
    };

    if (this.state.milestones.length > 3) {
      this.state.milestones[0].done = true;
      this.state.milestones[1].done = true;
      this.state.milestones[2].done = true;
    }

    this.syncFormFromState();
    this.saveAndRender();
    this.showToast('Sample demo data loaded successfully!');
  }

  saveAndRender() {
    saveStateToStorage(this.state);
    this.renderAll();
  }

  renderAll() {
    this.renderBudget();
    this.renderMilestones();
    this.renderVendors();
    this.renderRisks();
    this.renderInventory();
    this.renderChatContext();
    this.renderChat();
  }

  // ==================== Step 2: Budget Render ====================
  renderBudget() {
    const budgetData = calculateBudget(
      this.state.budget,
      this.state.categoryPercentages,
      this.state.currency,
      this.state.guests
    );

    this.kpiTotalAllocated.textContent = formatCurrency(budgetData.allocatedTotal, this.state.currency);
    this.kpiPercentageSum.textContent = `${budgetData.sumPercentage}% of Total Budget`;
    this.kpiPercentageSum.className = budgetData.isBalanced ? 'kpi-subtext text-success' : 'kpi-subtext text-warning';

    this.kpiPerGuest.textContent = formatCurrency(budgetData.costPerGuest, this.state.currency);

    const varianceFormatted = formatCurrency(Math.abs(budgetData.varianceAmount), this.state.currency);
    if (budgetData.isBalanced) {
      this.kpiVarianceAmount.textContent = `${budgetData.currencySymbol}0 (Balanced)`;
      this.kpiVarianceAmount.className = 'kpi-value text-success';
      this.kpiVarianceStatus.textContent = '100% Balanced Allocation';
      this.kpiVarianceStatus.className = 'kpi-subtext text-success';
      this.budgetWarningBanner.classList.add('hidden');
    } else if (budgetData.isOverBudget) {
      this.kpiVarianceAmount.textContent = `+${varianceFormatted} (Over)`;
      this.kpiVarianceAmount.className = 'kpi-value text-danger';
      this.kpiVarianceStatus.textContent = `${budgetData.sumPercentage}% Allocated (Reduce Categories)`;
      this.kpiVarianceStatus.className = 'kpi-subtext text-danger';
      this.budgetWarningBanner.classList.remove('hidden');
      this.budgetWarningBanner.className = 'alert-banner alert-danger';
      this.budgetWarningText.textContent = `Warning: Over-budget! Total allocation is ${budgetData.sumPercentage}% (+${varianceFormatted}). Please reduce categories so the sum equals 100%.`;
    } else {
      this.kpiVarianceAmount.textContent = `-${varianceFormatted} (Under)`;
      this.kpiVarianceAmount.className = 'kpi-value text-warning';
      this.kpiVarianceStatus.textContent = `${budgetData.sumPercentage}% Allocated (Unassigned Reserve)`;
      this.kpiVarianceStatus.className = 'kpi-subtext text-warning';
      this.budgetWarningBanner.classList.remove('hidden');
      this.budgetWarningBanner.className = 'alert-banner alert-warning';
      this.budgetWarningText.textContent = `Notice: Under-allocated. Current total is ${budgetData.sumPercentage}%. You have ${varianceFormatted} in unassigned reserve.`;
    }

    // Distribution Bar
    this.distributionBar.innerHTML = '';
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

    // Sliders
    this.categorySlidersContainer.innerHTML = '';
    budgetData.categories.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'slider-card';
      card.style.setProperty('--category-color', cat.color);

      card.innerHTML = `
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
      `;

      const rangeInput = card.querySelector('.slider-input');
      const stepDown = card.querySelector('.btn-step-down');
      const stepUp = card.querySelector('.btn-step-up');

      rangeInput.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.categoryPercentages[cat.id] = val;
        this.saveAndRender();
      });

      stepDown.addEventListener('click', () => {
        const current = this.state.categoryPercentages[cat.id] || 0;
        this.state.categoryPercentages[cat.id] = Math.max(0, current - 5);
        this.saveAndRender();
      });

      stepUp.addEventListener('click', () => {
        const current = this.state.categoryPercentages[cat.id] || 0;
        this.state.categoryPercentages[cat.id] = Math.min(100, current + 5);
        this.saveAndRender();
      });

      this.categorySlidersContainer.appendChild(card);
    });
  }

  // ==================== Step 3: Roadmap Render ====================
  renderMilestones() {
    const readiness = calculateReadiness(this.state.milestones);
    this.readinessScoreText.textContent = `${readiness.score}%`;
    this.readinessProgressFill.style.width = `${readiness.score}%`;
    this.readinessProgressTrack.setAttribute('aria-valuenow', readiness.score);
    this.readinessBadge.textContent = readiness.status;

    const phases = {};
    this.state.milestones.forEach(t => {
      const pid = t.phaseId || 'general';
      if (!phases[pid]) {
        phases[pid] = {
          title: t.phaseTitle || 'Planning Milestones',
          tasks: []
        };
      }
      phases[pid].tasks.push(t);
    });

    this.milestonesContainer.innerHTML = '';

    Object.keys(phases).forEach(pid => {
      const phase = phases[pid];
      const completedCount = phase.tasks.filter(t => t.done).length;
      const totalCount = phase.tasks.length;

      const card = document.createElement('div');
      card.className = 'milestone-phase-card';

      card.innerHTML = `
        <div class="milestone-phase-header">
          <div class="phase-title-group">
            <span class="phase-title">${escapeHTML(phase.title)}</span>
          </div>
          <span class="phase-meta">${completedCount} of ${totalCount} completed</span>
        </div>
        <ul class="milestone-task-list"></ul>
      `;

      const listEl = card.querySelector('.milestone-task-list');

      phase.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.done ? 'completed' : ''}`;

        const chkId = `chk-${task.id}`;
        li.innerHTML = `
          <label class="task-checkbox-label" for="${chkId}">
            <input type="checkbox" id="${chkId}" class="task-checkbox" ${task.done ? 'checked' : ''}>
            <span class="task-label">${escapeHTML(task.text)}</span>
          </label>
          <div class="task-actions">
            <button class="btn-task-del" aria-label="Delete task: ${escapeHTML(task.text)}" title="Delete task">✕</button>
          </div>
        `;

        const chk = li.querySelector('.task-checkbox');
        chk.addEventListener('change', (e) => {
          task.done = e.target.checked;
          this.saveAndRender();
        });

        const delBtn = li.querySelector('.btn-task-del');
        delBtn.addEventListener('click', () => {
          this.state.milestones = this.state.milestones.filter(t => t.id !== task.id);
          this.saveAndRender();
          this.showToast('Task removed.');
        });

        listEl.appendChild(li);
      });

      this.milestonesContainer.appendChild(card);
    });
  }

  // ==================== Step 4: Vendor Render ====================
  renderVendors() {
    this.vendorCardsContainer.innerHTML = '';

    const filtered = this.state.vendors.filter(v => {
      if (this.activeVendorFilter === 'all') return true;
      return v.category === this.activeVendorFilter;
    });

    if (filtered.length === 0) {
      this.vendorCardsContainer.innerHTML = `
        <div class="kpi-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p style="color: var(--text-muted);">No vendors found in this category.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(vendor => {
      const card = document.createElement('div');
      card.className = 'vendor-card';

      card.innerHTML = `
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
        <div class="vendor-pricing-row">
          <span>Quoted Contract:</span>
          <span class="vendor-quoted-val">${formatCurrency(vendor.quoted, this.state.currency)}</span>
        </div>
        <input type="text" class="vendor-notes-input" placeholder="Notes (e.g., includes DJ equipment)..." 
               value="${escapeHTML(vendor.notes || '')}" aria-label="Notes for ${escapeHTML(vendor.name)}">
        <div class="vendor-card-actions">
          <button class="btn btn-primary btn-sm btn-negotiate">
            ✨ AI Negotiation Script
          </button>
          <button class="btn btn-ghost btn-sm btn-delete-vendor text-danger" title="Delete vendor">
            ✕ Delete
          </button>
        </div>
      `;

      const statusSelect = card.querySelector('.vendor-status-select');
      statusSelect.addEventListener('change', (e) => {
        vendor.status = e.target.value;
        saveStateToStorage(this.state);
        this.showToast(`Updated ${vendor.name} status to ${vendor.status}`);
      });

      const notesInput = card.querySelector('.vendor-notes-input');
      notesInput.addEventListener('change', (e) => {
        vendor.notes = sanitizeString(e.target.value, 200);
        saveStateToStorage(this.state);
      });

      const delBtn = card.querySelector('.btn-delete-vendor');
      delBtn.addEventListener('click', () => {
        this.state.vendors = this.state.vendors.filter(v => v.id !== vendor.id);
        this.saveAndRender();
        this.showToast(`Removed vendor ${vendor.name}`);
      });

      const negBtn = card.querySelector('.btn-negotiate');
      negBtn.addEventListener('click', () => {
        this.openNegotiationModal(vendor);
      });

      this.vendorCardsContainer.appendChild(card);
    });
  }

  // ==================== Step 5: Risk Analysis Render ====================
  renderRisks() {
    if (!this.riskCardsContainer) return;
    if (!Array.isArray(this.state.risks)) this.state.risks = buildSampleRisks(this.state.eventType);

    const metrics = calculateRiskMetrics(this.state.risks);
    if (this.riskScoreText) this.riskScoreText.textContent = `${metrics.safetyScore}%`;
    if (this.riskProfileBadge) {
      this.riskProfileBadge.textContent = metrics.profile;
      this.riskProfileBadge.className = metrics.safetyScore >= 80 ? 'badge badge-success' : 'badge badge-warning';
    }

    this.riskCardsContainer.innerHTML = '';

    this.state.risks.forEach(risk => {
      const card = document.createElement('div');
      card.className = 'risk-card';

      const probClass = risk.probability === 'High' ? 'text-danger' : risk.probability === 'Medium' ? 'text-warning' : 'text-success';
      const impactClass = risk.impact === 'Critical' ? 'badge badge-danger' : 'badge badge-warning';

      card.innerHTML = `
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
          <strong>AI Mitigation Protocol:</strong> ${escapeHTML(risk.strategy)}
        </div>
        <div class="risk-actions">
          <button class="btn btn-ghost btn-sm btn-del-risk text-danger" title="Remove risk item">✕ Delete</button>
        </div>
      `;

      const statusSelect = card.querySelector('.risk-status-select');
      statusSelect.addEventListener('change', (e) => {
        risk.status = e.target.value;
        this.saveAndRender();
        this.showToast(`Updated risk protocol to "${risk.status}"`);
      });

      const delBtn = card.querySelector('.btn-del-risk');
      delBtn.addEventListener('click', () => {
        this.state.risks = this.state.risks.filter(r => r.id !== risk.id);
        this.saveAndRender();
        this.showToast('Removed risk item.');
      });

      this.riskCardsContainer.appendChild(card);
    });
  }

  // ==================== Step 6: Inventory Render ====================
  renderInventory() {
    if (!this.inventoryTableBody) return;
    if (!Array.isArray(this.state.inventory)) this.state.inventory = buildSampleInventory(this.state.eventType);

    const metrics = calculateInventoryMetrics(this.state.inventory);
    if (this.inventoryReadinessText) this.inventoryReadinessText.textContent = `${metrics.readinessPct}%`;
    if (this.inventoryStatusBadge) this.inventoryStatusBadge.textContent = metrics.status;

    this.inventoryTableBody.innerHTML = '';

    const filtered = this.state.inventory.filter(item => {
      if (this.activeInventoryFilter === 'all') return true;
      return item.category === this.activeInventoryFilter;
    });

    if (filtered.length === 0) {
      this.inventoryTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
            No supplies matching this category.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'inv-row';

      const statusBadgeClass = item.status === 'On-Site' ? 'badge badge-success' : item.status === 'In-Transit' ? 'badge badge-warning' : 'badge badge-neutral';

      tr.innerHTML = `
        <td class="inv-td-name"><strong>${escapeHTML(item.name)}</strong></td>
        <td><span class="inv-cat-pill">${escapeHTML(item.category)}</span></td>
        <td class="inv-td-qty">${item.quantity}</td>
        <td>
          <select class="inv-status-select" aria-label="Status for ${escapeHTML(item.name)}">
            <option value="Packed" ${item.status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Sourced" ${item.status === 'Sourced' ? 'selected' : ''}>Sourced</option>
            <option value="In-Transit" ${item.status === 'In-Transit' ? 'selected' : ''}>In-Transit</option>
            <option value="On-Site" ${item.status === 'On-Site' ? 'selected' : ''}>On-Site</option>
          </select>
        </td>
        <td class="inv-td-owner">${escapeHTML(item.owner || 'Planner')}</td>
        <td class="inv-td-actions">
          <button class="btn btn-ghost btn-sm btn-del-inv text-danger" title="Delete item">✕</button>
        </td>
      `;

      const select = tr.querySelector('.inv-status-select');
      select.addEventListener('change', (e) => {
        item.status = e.target.value;
        this.saveAndRender();
      });

      const delBtn = tr.querySelector('.btn-del-inv');
      delBtn.addEventListener('click', () => {
        this.state.inventory = this.state.inventory.filter(i => i.id !== item.id);
        this.saveAndRender();
        this.showToast(`Removed "${item.name}" from inventory.`);
      });

      this.inventoryTableBody.appendChild(tr);
    });
  }

  // ==================== Step 7: PlanGenie Chat Render ====================
  renderChatContext() {
    const arch = ARCHETYPE_DEFAULTS[this.state.eventType] || ARCHETYPE_DEFAULTS.wedding;
    this.contextItemType.textContent = `Event: ${arch.title}`;
    this.contextItemBudget.textContent = `Budget: ${formatCurrency(this.state.budget, this.state.currency)}`;
    this.contextItemGuests.textContent = `Guests: ${this.state.guests}`;
    this.contextItemVibe.textContent = `Vibe: ${this.state.vibe.charAt(0).toUpperCase() + this.state.vibe.slice(1)}`;
  }

  renderChat() {
    this.chatMessagesContainer.innerHTML = '';
    this.state.chatHistory.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`;
      bubble.innerHTML = this.formatChatMessage(msg.text);
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

  async submitChatMessage(text) {
    const prompt = sanitizeString(text, NUMERIC_BOUNDS.TEXT_MAX_LEN);
    if (!prompt) return;

    this.state.chatHistory.push({ sender: 'user', text: prompt });
    this.renderChat();

    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'chat-bubble chat-bubble-bot';
    thinkingBubble.id = 'temp-thinking';
    thinkingBubble.innerHTML = '<em>PlanGenie is formulating your custom event strategy...</em>';
    this.chatMessagesContainer.appendChild(thinkingBubble);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;

    const readiness = calculateReadiness(this.state.milestones);
    const context = {
      eventType: this.state.eventType,
      budget: this.state.budget,
      currencySymbol: CURRENCIES[this.state.currency]?.symbol || '$',
      guests: this.state.guests,
      horizon: this.state.horizon,
      location: this.state.location,
      vibe: this.state.vibe,
      readinessScore: readiness.score,
      vendors: this.state.vendors,
      risks: this.state.risks,
      inventory: this.state.inventory
    };

    const reply = await askPlanGenie(
      prompt,
      context,
      this.state.geminiApiKey,
      this.state.geminiModel
    );

    const temp = document.getElementById('temp-thinking');
    if (temp) temp.remove();

    this.state.chatHistory.push({ sender: 'bot', text: reply });
    this.renderChat();
    saveStateToStorage(this.state);
  }

  // ==================== Modals & Export ====================
  openNegotiationModal(vendor) {
    this.activeNegotiationVendor = vendor;

    const categoryTargetPct = this.state.categoryPercentages[vendor.category] || 20;
    const targetBudget = Math.round((this.state.budget * categoryTargetPct) / 100);

    const scriptData = generateNegotiationScript({
      vendorName: vendor.name,
      category: vendor.category,
      quotedPrice: vendor.quoted,
      targetBudget,
      eventType: this.state.eventType,
      guestCount: this.state.guests,
      currencySymbol: CURRENCIES[this.state.currency]?.symbol || '$'
    });

    this.negotiationMetaInfo.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
        Targeting: <strong>${escapeHTML(vendor.name)}</strong> (${escapeHTML(vendor.category)}) • Quoted: <strong>${formatCurrency(vendor.quoted, this.state.currency)}</strong>
      </div>
    `;

    this.negotiationScriptContent.textContent = `Subject: ${scriptData.subject}\n\n${scriptData.body}`;

    const mailto = `mailto:?subject=${encodeURIComponent(scriptData.subject)}&body=${encodeURIComponent(scriptData.body)}`;
    this.btnEmailMailto.setAttribute('href', mailto);

    if (this.negotiationDialog.showModal) this.negotiationDialog.showModal();
    else this.negotiationDialog.setAttribute('open', 'true');
  }

  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `planflow_event_plan_${this.state.eventType}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Exported JSON plan backup!');
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

    this.printableSummary.innerHTML = `
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
            <div style="font-size: 18px; font-weight: bold;">${readiness.score}% Completed</div>
          </div>
          <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #666;">Safety Score</div>
            <div style="font-size: 18px; font-weight: bold;">${riskMetrics.safetyScore}% (${escapeHTML(riskMetrics.profile)})</div>
          </div>
          <div style="flex: 1; min-width: 140px; border: 1px solid #ccc; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #666;">Inventory On-Site</div>
            <div style="font-size: 18px; font-weight: bold;">${invMetrics.readinessPct}% Ready</div>
          </div>
        </div>

        <h3>Budget Category Allocations</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f4f4f4; text-align: left;">
              <th style="padding: 6px;">Category</th>
              <th style="padding: 6px;">Allocation %</th>
              <th style="padding: 6px;">Total Amount</th>
              <th style="padding: 6px;">Per Guest</th>
            </tr>
          </thead>
          <tbody>
            ${budgetData.categories.map(c => `
              <tr>
                <td style="padding: 6px; border-bottom: 1px solid #ddd;">${escapeHTML(c.name)}</td>
                <td style="padding: 6px; border-bottom: 1px solid #ddd;">${c.percentage}%</td>
                <td style="padding: 6px; border-bottom: 1px solid #ddd;">${formatCurrency(c.amount, this.state.currency)}</td>
                <td style="padding: 6px; border-bottom: 1px solid #ddd;">${formatCurrency(c.perGuest, this.state.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Contracted &amp; Prospective Vendors</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f4; text-align: left;">
              <th style="padding: 6px;">Vendor</th>
              <th style="padding: 6px;">Category</th>
              <th style="padding: 6px;">Quoted Price</th>
              <th style="padding: 6px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${vendorHtml}
          </tbody>
        </table>
      </div>
    `;

    window.print();
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

// Initialize UI when in browser DOM environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new PlanFlowUI();
    app.init();
    window.planFlowApp = app;
  });
}

// CommonJS Export for Automated Test Runner in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHTML,
    sanitizeNumber,
    sanitizeString,
    debounce,
    CURRENCIES,
    DEFAULT_CATEGORIES,
    ARCHETYPE_DEFAULTS,
    DEFAULT_RISKS,
    DEFAULT_INVENTORY,
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
    getDefaultState,
    saveStateToStorage,
    loadStateFromStorage
  };
}
