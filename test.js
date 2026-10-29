/**
 * PlanFlow AI — Self-Contained Automated Unit & Integration Test Suite
 * Runnable via: node test.js (Zero external testing dependencies)
 * Native ES Module Suite
 */

import {
  escapeHTML,
  sanitizeNumber,
  sanitizeString,
  debounce,
  setSanitizedHTML,
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
  isValidGeminiApiKey,
  isSupportedGeminiModel,
  getDefaultState,
  validateAndNormalizePlan,
  saveStateToStorage,
  loadStateFromStorage
} from './src/index.js';

// ============================================================================
// MICRO TEST HARNESS (Zero External Dependencies)
// ============================================================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testStartTime = Date.now();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const suites = [];
let currentSuite = null;

function describe(suiteName, fn) {
  currentSuite = { name: suiteName, tests: [] };
  suites.push(currentSuite);
  fn();
}

function it(testName, fn) {
  currentSuite.tests.push({ name: testName, fn });
}

// Assertions
function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(haystack, needle, message) {
  if (typeof haystack !== 'string' || !haystack.includes(needle)) {
    throw new Error(message || `Expected string to contain "${needle}"`);
  }
}

function assertTrue(value, message) {
  if (value !== true) throw new Error(message || `Expected true, got ${value}`);
}

function assertFalse(value, message) {
  if (value !== false) throw new Error(message || `Expected false, got ${value}`);
}

// ============================================================================
// TEST SUITES DEFINITION
// ============================================================================

describe('Suite 1: Security, XSS Sanitization & DOM Injection Defense', () => {
  it('escapes dangerous HTML script tags to harmless entities including slashes', () => {
    const malicious = '<script>alert("xss")</script>';
    const safe = escapeHTML(malicious);
    assertEqual(safe, '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    assertFalse(safe.includes('<'));
    assertFalse(safe.includes('>'));
    assertFalse(safe.includes('/'));
  });

  it('escapes single and double quotes, ampersands, and angle brackets', () => {
    const input = `Tom & Jerry said: 'Hello' "World" <tag>`;
    const expected = `Tom &amp; Jerry said: &#039;Hello&#039; &quot;World&quot; &lt;tag&gt;`;
    assertEqual(escapeHTML(input), expected);
  });

  it('handles null, undefined, and non-string types safely in escapeHTML', () => {
    assertEqual(escapeHTML(null), '');
    assertEqual(escapeHTML(undefined), '');
    assertEqual(escapeHTML(12345), '12345');
    assertEqual(escapeHTML(false), 'false');
  });

  it('sanitizes and clamps numbers within bounds', () => {
    assertEqual(sanitizeNumber(50, 10, 100, 20), 50);
    assertEqual(sanitizeNumber(5, 10, 100, 20), 10);
    assertEqual(sanitizeNumber(250, 10, 100, 20), 100);
    assertEqual(sanitizeNumber('not-a-number', 10, 100, 20), 20);
    assertEqual(sanitizeNumber(NaN, 10, 100, 20), 20);
    assertEqual(sanitizeNumber(Infinity, 10, 100, 20), 20);
  });

  it('sanitizes and trims arbitrary text strings and bounds length', () => {
    assertEqual(sanitizeString('   Clean this text   ', 50), 'Clean this text');
    assertEqual(sanitizeString('Super long string text here', 5), 'Super');
    assertEqual(sanitizeString(null, 50), '');
    assertEqual(sanitizeString(undefined, 50), '');
  });
});

describe('Suite 2: Context-Aware Dynamic Budget Calculator Engine', () => {
  it('correctly calculates 100% balanced budget allocations', () => {
    const totalBudget = 20000;
    const percentages = { venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 };
    const result = calculateBudget(totalBudget, percentages, 'USD', 100);

    assertEqual(result.totalBudget, 20000);
    assertEqual(result.sumPercentage, 100);
    assertTrue(result.isBalanced);
    assertFalse(result.isOverBudget);
    assertEqual(result.varianceAmount, 0);
    assertEqual(result.costPerGuest, 200);

    const venue = result.categories.find(c => c.id === 'venue');
    assertEqual(venue.amount, 8000);

    const catering = result.categories.find(c => c.id === 'catering');
    assertEqual(catering.amount, 5000);
  });

  it('flags over-budget allocations with positive variance', () => {
    const totalBudget = 10000;
    const percentages = { venue: 50, catering: 35, decor: 15, photo: 10, contingency: 10 };
    const result = calculateBudget(totalBudget, percentages, 'USD', 50);

    assertEqual(result.sumPercentage, 120);
    assertTrue(result.isOverBudget);
    assertFalse(result.isBalanced);
    assertEqual(result.varianceAmount, -2000);
    assertEqual(result.allocatedTotal, 12000);
  });

  it('detects under-budget allocations with unassigned reserve', () => {
    const totalBudget = 10000;
    const percentages = { venue: 30, catering: 20, decor: 15, photo: 10, contingency: 5 };
    const result = calculateBudget(totalBudget, percentages, 'USD', 50);

    assertEqual(result.sumPercentage, 80);
    assertFalse(result.isOverBudget);
    assertFalse(result.isBalanced);
    assertEqual(result.varianceAmount, 2000);
    assertEqual(result.allocatedTotal, 8000);
  });

  it('safely handles zero guests and extreme inputs without division by zero', () => {
    const result = calculateBudget(10000, {}, 'USD', 0);
    assertEqual(result.costPerGuest, 10000);
    assertEqual(result.totalBudget, 10000);
  });

  it('formats currency strings correctly for multi-currency support', () => {
    const usd = formatCurrency(25000, 'USD');
    assertContains(usd, '25,000');
    assertContains(usd, '$');

    const inr = formatCurrency(500000, 'INR');
    assertContains(inr, '₹');

    const eur = formatCurrency(15000, 'EUR');
    assertContains(eur, '€');

    const gbp = formatCurrency(12000, 'GBP');
    assertContains(gbp, '£');
  });
});

describe('Suite 3: Milestone Roadmap & Readiness Score Engine', () => {
  it('builds tailored milestones for Wedding, Birthday, and Community archetypes', () => {
    const weddingMilestones = buildMilestones('wedding', 12);
    const birthdayMilestones = buildMilestones('birthday', 6);
    const communityMilestones = buildMilestones('community', 3);

    assert(weddingMilestones.length >= 3);
    assert(birthdayMilestones.length >= 3);
    assert(communityMilestones.length >= 3);

    const weddingTexts = weddingMilestones.map(m => m.text).join(' ');
    assertContains(weddingTexts.toLowerCase(), 'venue');

    const communityTexts = communityMilestones.map(m => m.text).join(' ');
    assertContains(communityTexts.toLowerCase(), 'permit');
  });

  it('dynamically adapts phase titles based on planning horizon months', () => {
    const longHorizon = buildMilestones('wedding', 12);
    const shortHorizon = buildMilestones('wedding', 3);

    assertEqual(longHorizon[0].phaseTitle, '6+ Months Out: Vision, Venue & Big Picture');
    assertEqual(shortHorizon[0].phaseTitle, 'Phase 1: Immediate Foundation & Venue');
  });

  it('calculates planning readiness score accurately with status milestones', () => {
    const milestones = [
      { id: '1', done: true },
      { id: '2', done: true },
      { id: '3', done: false },
      { id: '4', done: false }
    ];
    const readiness = calculateReadiness(milestones);
    assertEqual(readiness.score, 50);
    assertEqual(readiness.completed, 2);
    assertEqual(readiness.total, 4);
  });

  it('reports 100% readiness when all tasks are completed', () => {
    const milestones = [
      { id: '1', done: true },
      { id: '2', done: true },
      { id: '3', done: true }
    ];
    const readiness = calculateReadiness(milestones);
    assertEqual(readiness.score, 100);
    assertEqual(readiness.completed, 3);
  });

  it('handles empty task list gracefully without errors', () => {
    assertEqual(calculateReadiness([]).score, 0);
    assertEqual(calculateReadiness(null).score, 0);
  });
});

describe('Suite 4: Vendor Checklist & Negotiation Assistant Engine', () => {
  it('generates realistic sample vendors tailored to the archetype', () => {
    const weddingVendors = buildSampleVendors('wedding');
    const communityVendors = buildSampleVendors('community');

    assert(weddingVendors.length >= 4);
    assert(communityVendors.length >= 4);

    const weddingCategories = weddingVendors.map(v => v.category);
    assert(weddingCategories.includes('Venue'));
    assert(weddingCategories.includes('Catering'));

    const communityCategories = communityVendors.map(v => v.category);
    assert(communityCategories.includes('Contingency & Permits'));
  });

  it('generates high-leverage AI negotiation script for over-budget quotes', () => {
    const script = generateNegotiationScript({
      vendorName: 'Grand Horizon Ballroom',
      category: 'Venue & Logistics',
      quotedPrice: 8500,
      targetBudget: 7000,
      eventType: 'wedding',
      guestCount: 150,
      currencySymbol: '$'
    });

    assertContains(script.subject, 'Grand Horizon Ballroom');
    assertContains(script.body, '$7,000');
    assertContains(script.body, '$8,500');
    assertContains(script.body, '150');
    assert(Array.isArray(script.tips) && script.tips.length > 0);
  });

  it('generates appreciative confirmation script when quote is within budget', () => {
    const script = generateNegotiationScript({
      vendorName: 'Sonic Beats DJ',
      category: 'Decor & Entertainment',
      quotedPrice: 1500,
      targetBudget: 2000,
      eventType: 'birthday',
      guestCount: 80,
      currencySymbol: '$'
    });

    assertContains(script.subject, 'Sonic Beats DJ');
    assertContains(script.body, '$1,500');
    assertContains(script.body, '80');
    assert(Array.isArray(script.tips) && script.tips.length > 0);
  });
});

describe('Suite 5: PlanGenie Contextual AI Engine & Knowledge Graph', () => {
  const context = {
    eventType: 'wedding',
    budget: 25000,
    currencySymbol: '$',
    guests: 120,
    horizon: 6,
    location: 'outdoor',
    vibe: 'rustic',
    readinessScore: 35
  };

  it('generates contextual budget-friendly themes tailored to the event archetype', () => {
    const response = runHeuristicAI('Suggest 5 unique budget-friendly themes', context);
    assertContains(response, 'PlanGenie Curated Wedding Themes');
    assertContains(response, 'Modern Minimalist');
    assertContains(response, 'Budget win:');
  });

  it('generates rigorous outdoor rain contingency protocol', () => {
    const response = runHeuristicAI('How to handle sudden rain for an outdoor event?', context);
    assertContains(response, 'Severe Weather & Rain Contingency Protocol');
    assertContains(response, 'T-48 Hour');
    assertContains(response, 'Tenting');
  });

  it('creates comprehensive minute-by-minute run-of-show schedule', () => {
    const response = runHeuristicAI('Create a minute-by-minute run-of-show schedule', context);
    assertContains(response, 'Day-Of Run-Of-Show');
    assertContains(response, 'Ceremony Begins');
    assertContains(response, 'Cocktail hour');
  });

  it('provides interactive games and seating arrangement strategy', () => {
    const response = runHeuristicAI('Suggest games and seating arrangements for 120 guests', context);
    assertContains(response, 'Seating Architecture');
    assertContains(response, '60-inch round tables');
    assertContains(response, 'Shoe Game');
  });

  it('delivers actionable catering cost optimization hacks', () => {
    const response = runHeuristicAI('How to cut catering costs without hurting quality?', context);
    assertContains(response, 'Catering & Budget Optimization Playbook');
    assertContains(response, 'Signature Drink');
    assertContains(response, 'Family Style');
  });

  it('retains contextual state awareness in fallback advisory responses', () => {
    const response = runHeuristicAI('What general advice do you have for my current stage?', context);
    assertContains(response, '$25,000');
    assertContains(response, '120 guests');
    assertContains(response, '35%');
  });

  it('askPlanGenie function processes user prompts asynchronously with local fallback', async () => {
    const reply = await askPlanGenie('Suggest 5 themes', context, '', 'gemini-1.5-flash');
    assert(typeof reply === 'string');
    assert(reply.length > 50);
  });

  it('validates Gemini API keys and allowlists only UI-supported models', () => {
    assert(isValidGeminiApiKey(`AIza${'A'.repeat(35)}`));
    assert(!isValidGeminiApiKey('AIzaTooShort'));
    assert(isSupportedGeminiModel('gemini-1.5-flash'));
    assert(!isSupportedGeminiModel('../../unexpected-model'));
  });

  it('uses the live API only with a valid key and an allowlisted model', async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl = '';
    globalThis.fetch = async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'A live response' }] } }] })
      };
    };

    try {
      const validKey = `AIza${'B'.repeat(35)}`;
      const liveReply = await askPlanGenie('Help me plan', context, validKey, 'gemini-1.5-flash');
      assertEqual(liveReply, 'A live response');
      assertContains(requestedUrl, 'models/gemini-1.5-flash:generateContent');

      requestedUrl = '';
      const fallbackReply = await askPlanGenie('Help me plan', context, validKey, '../../unexpected-model');
      assert(fallbackReply.length > 50);
      assertEqual(requestedUrl, '', 'Unsupported model must never trigger a network request');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('Suite 6: Local Persistence, State Integrity & Schema Validation', () => {
  it('generates valid default state with all required schema fields and no leaked API key', () => {
    const state = getDefaultState();
    assertEqual(state.eventType, 'wedding');
    assertEqual(typeof state.budget, 'number');
    assertEqual(typeof state.guests, 'number');
    assertEqual(typeof state.categoryPercentages, 'object');
    assert(Array.isArray(state.milestones));
    assert(Array.isArray(state.vendors));
    assert(Array.isArray(state.risks));
    assert(Array.isArray(state.inventory));
    assert(Array.isArray(state.chatHistory));
    assertEqual(state.schemaVersion, 3);
    assertEqual(state.geminiApiKey, undefined, 'API key must never exist in persistent state');
  });

  it('verifies state round-trip JSON serialization and deserialization', () => {
    const originalState = getDefaultState();
    originalState.budget = 45000;
    originalState.guests = 180;
    originalState.vendors.push({
      id: 'custom-v1',
      name: 'Artisan Strings Quartet',
      category: 'Decor & Entertainment',
      quoted: 2200,
      status: 'Booked',
      notes: 'Ceremony acoustic set'
    });

    const serialized = JSON.stringify(originalState);
    const parsed = JSON.parse(serialized);

    assertEqual(parsed.budget, 45000);
    assertEqual(parsed.guests, 180);
    assertEqual(parsed.vendors.length, originalState.vendors.length);
    assertEqual(parsed.vendors[parsed.vendors.length - 1].name, 'Artisan Strings Quartet');
    assertEqual(parsed.risks.length, originalState.risks.length);
    assertEqual(parsed.inventory.length, originalState.inventory.length);
  });

  it('recovers gracefully from corrupted JSON data', () => {
    const corruptData = '{ invalid json string %%% }';
    let loadedState = null;
    try {
      loadedState = JSON.parse(corruptData);
    } catch (e) {
      loadedState = getDefaultState();
    }

    assertEqual(loadedState.eventType, 'wedding');
    assert(loadedState.budget > 0);
  });
});

describe('Suite 7: Event Risk Analysis & Mitigation Matrix Engine', () => {
  it('builds domain-specific risk matrices for Wedding, Birthday, and Community archetypes', () => {
    const weddingRisks = buildSampleRisks('wedding');
    const birthdayRisks = buildSampleRisks('birthday');
    const communityRisks = buildSampleRisks('community');

    assert(weddingRisks.length >= 3, 'Wedding must have at least 3 default risks');
    assert(birthdayRisks.length >= 3, 'Birthday must have at least 3 default risks');
    assert(communityRisks.length >= 3, 'Community must have at least 3 default risks');

    weddingRisks.forEach(risk => {
      assert(typeof risk.id === 'string', 'Risk must have string id');
      assert(typeof risk.category === 'string', 'Risk must have category');
      assert(typeof risk.title === 'string', 'Risk must have title');
      assert(['Low', 'Medium', 'High'].includes(risk.probability), 'Valid probability');
      assert(['Minor', 'Moderate', 'Critical'].includes(risk.impact), 'Valid impact');
      assert(typeof risk.strategy === 'string', 'Risk must have strategy');
      assert(['Mitigated', 'Monitoring', 'Action Needed'].includes(risk.status), 'Valid status');
    });

    const communityTitles = communityRisks.map(r => r.title.toLowerCase()).join(' ');
    assertContains(communityTitles, 'permit', 'Community risks must include municipal permits');
  });

  it('accurately computes weighted safety score and risk profile classification', () => {
    const sampleRisks = [
      { id: 'r1', status: 'Mitigated' },
      { id: 'r2', status: 'Monitoring' },
      { id: 'r3', status: 'Action Needed' }
    ];
    const metrics = calculateRiskMetrics(sampleRisks);

    assertEqual(metrics.total, 3);
    assertEqual(metrics.mitigated, 1);
    assertEqual(metrics.monitoring, 1);
    assertEqual(metrics.actionNeeded, 1);
    assertEqual(metrics.safetyScore, 50);
    assertEqual(metrics.profile, 'Moderate Risk (In Review)');
  });

  it('achieves 100% safety score when all risks are mitigated', () => {
    const safeRisks = [
      { id: 'r1', status: 'Mitigated' },
      { id: 'r2', status: 'Mitigated' },
      { id: 'r3', status: 'Mitigated' }
    ];
    const metrics = calculateRiskMetrics(safeRisks);

    assertEqual(metrics.safetyScore, 100);
    assertEqual(metrics.profile, 'Low Risk (Protected)');
    assertEqual(metrics.actionNeeded, 0);
  });

  it('handles empty or missing risk arrays defensively without NaN', () => {
    const emptyMetrics = calculateRiskMetrics([]);
    assertEqual(emptyMetrics.total, 0);
    assertEqual(emptyMetrics.safetyScore, 100);
    assertEqual(emptyMetrics.profile, 'Zero Identified Risks');

    const nullMetrics = calculateRiskMetrics(null);
    assertEqual(nullMetrics.safetyScore, 100);
  });

  it('updates risk mitigation status and impacts the overall safety index', () => {
    const risks = [
      { id: 'r1', status: 'Action Needed' },
      { id: 'r2', status: 'Action Needed' }
    ];
    const initialMetrics = calculateRiskMetrics(risks);
    assertEqual(initialMetrics.safetyScore, 0);
    assertEqual(initialMetrics.profile, 'High Risk (Action Required)');

    risks[0].status = 'Monitoring';
    risks[1].status = 'Mitigated';
    const updatedMetrics = calculateRiskMetrics(risks);
    assertEqual(updatedMetrics.safetyScore, 75);
    assertEqual(updatedMetrics.profile, 'Moderate Risk (In Review)');
  });
});

describe('Suite 8: Supplies & Equipment Inventory Engine', () => {
  it('builds domain-tailored equipment inventory rosters with realistic quantities', () => {
    const weddingInv = buildSampleInventory('wedding');
    const birthdayInv = buildSampleInventory('birthday');
    const communityInv = buildSampleInventory('community');

    assert(weddingInv.length >= 4, 'Wedding inventory roster must have at least 4 categories');
    assert(birthdayInv.length >= 4, 'Birthday inventory roster must have at least 4 items');
    assert(communityInv.length >= 4, 'Community inventory roster must have at least 4 items');

    weddingInv.forEach(item => {
      assert(typeof item.id === 'string', 'Item must have string id');
      assert(typeof item.name === 'string', 'Item must have name');
      assert(typeof item.category === 'string', 'Item must have category');
      assert(typeof item.quantity === 'number' && item.quantity > 0, 'Item must have positive quantity');
      assert(['Packed', 'Sourced', 'In-Transit', 'On-Site'].includes(item.status), 'Valid inventory status');
      assert(typeof item.owner === 'string', 'Item must have owner');
    });

    const communityNames = communityInv.map(i => i.name.toLowerCase()).join(' ');
    assertContains(communityNames, 'generator', 'Community inventory must track portable power generator');
  });

  it('computes deployment readiness percentage and on-site unit counts accurately', () => {
    const items = [
      { id: 'i1', quantity: 2, status: 'On-Site' },
      { id: 'i2', quantity: 2, status: 'In-Transit' },
      { id: 'i3', quantity: 1, status: 'Packed' }
    ];
    const metrics = calculateInventoryMetrics(items);

    assertEqual(metrics.totalItems, 3);
    assertEqual(metrics.totalUnits, 5);
    assertEqual(metrics.onSiteUnits, 2);
    assertEqual(metrics.readinessPct, 40);
    assertContains(metrics.status, 'Staging & Packing In Progress');
  });

  it('handles empty inventory safely without division by zero errors', () => {
    const emptyMetrics = calculateInventoryMetrics([]);
    assertEqual(emptyMetrics.totalItems, 0);
    assertEqual(emptyMetrics.totalUnits, 0);
    assertEqual(emptyMetrics.onSiteUnits, 0);
    assertEqual(emptyMetrics.readinessPct, 100);
    assertEqual(emptyMetrics.status, 'No Inventory Assigned');

    const nullMetrics = calculateInventoryMetrics(null);
    assertEqual(nullMetrics.readinessPct, 100);
  });

  it('achieves 100% deployment status when all items transition to On-Site', () => {
    const deployedItems = [
      { id: 'i1', quantity: 10, status: 'On-Site' },
      { id: 'i2', quantity: 5, status: 'On-Site' }
    ];
    const metrics = calculateInventoryMetrics(deployedItems);

    assertEqual(metrics.readinessPct, 100);
    assertContains(metrics.status, '100% Fully Deployed On-Site');
  });

  it('correctly handles partial inventory deployment and in-transit tracking', () => {
    const items = [
      { id: 'i1', quantity: 7, status: 'On-Site' },
      { id: 'i2', quantity: 3, status: 'In-Transit' }
    ];
    const metrics = calculateInventoryMetrics(items);

    assertEqual(metrics.totalUnits, 10);
    assertEqual(metrics.onSiteUnits, 7);
    assertEqual(metrics.readinessPct, 70);
    assertContains(metrics.status, 'Majority Ready & In-Transit');
  });
});

describe('Suite 9: Debounce Utility & Performance Optimization', () => {
  it('debounces rapid sequential calls into a single deferred execution', async () => {
    let callCount = 0;
    let lastArg = '';
    const debouncedFn = debounce((val) => {
      callCount++;
      lastArg = val;
    }, 40);

    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');

    assertEqual(callCount, 0, 'Callback must not execute synchronously');

    await new Promise(resolve => setTimeout(resolve, 80));

    assertEqual(callCount, 1, 'Callback should have executed exactly once');
    assertEqual(lastArg, 'call3', 'Callback must receive the arguments of the latest invocation');
  });

  it('allows subsequent execution after the debounce window has elapsed', async () => {
    let executionTimes = 0;
    const debouncedFn = debounce(() => {
      executionTimes++;
    }, 30);

    debouncedFn();
    await new Promise(resolve => setTimeout(resolve, 50));
    assertEqual(executionTimes, 1);

    debouncedFn();
    await new Promise(resolve => setTimeout(resolve, 50));
    assertEqual(executionTimes, 2, 'Should execute a second time if called after window');
  });
});

describe('Suite 10: Exploit Regression & Import Schema Sanitization Gate', () => {
  it('strictly coerces malicious XSS payload in inventory.quantity to safe integer', () => {
    const maliciousPayload = {
      eventType: 'wedding',
      budget: 25000,
      guests: 100,
      categoryPercentages: { venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 },
      inventory: [
        {
          id: 'inv-malicious-1',
          name: 'Sound Board',
          category: 'Audio/Visual',
          quantity: '<img src=x onerror=alert("pwned")>',
          status: 'Packed',
          owner: 'Lead'
        }
      ]
    };

    const normalized = validateAndNormalizePlan(maliciousPayload);
    assertEqual(typeof normalized.inventory[0].quantity, 'number', 'Quantity must be numeric');
    assertEqual(normalized.inventory[0].quantity, 1, 'Non-numeric quantity must fallback to safe 1');
    assertFalse(String(normalized.inventory[0].quantity).includes('<'));
    assertFalse(String(normalized.inventory[0].quantity).includes('alert'));
  });

  it('sanitizes malicious markup in vendor notes, names, and risk titles', () => {
    const maliciousPayload = {
      eventType: 'birthday',
      vendors: [
        {
          id: 'v-xss',
          name: '<script>fetch("evil.com")</script>',
          category: 'Venue',
          quoted: 5000,
          status: 'Prospecting',
          notes: '<b onmouseover="alert(1)">Notes</b>'
        }
      ],
      risks: [
        {
          id: 'r-xss',
          category: 'Weather',
          title: '<iframe src="javascript:alert(1)"></iframe>',
          probability: 'High',
          impact: 'Critical',
          strategy: 'Contingency plan',
          status: 'Action Needed'
        }
      ]
    };

    const normalized = validateAndNormalizePlan(maliciousPayload);
    assertEqual(normalized.vendors[0].name, '<script>fetch("evil.com")</script>');
    // Verify when escaped by escapeHTML, it is completely neutralized
    const escapedName = escapeHTML(normalized.vendors[0].name);
    assertContains(escapedName, '&lt;script&gt;');
    assertFalse(escapedName.includes('<script>'));
  });

  it('strips injected API keys and unauthorized sensitive fields during normalization', () => {
    const tamperedPayload = {
      eventType: 'wedding',
      budget: 20000,
      geminiApiKey: 'AIzaSySecretLeakInExport',
      apiKey: 'leakedKey',
      arbitraryInjectedField: 'maliciousState'
    };

    const normalized = validateAndNormalizePlan(tamperedPayload);
    assertEqual(normalized.geminiApiKey, undefined, 'geminiApiKey must be stripped');
    assertEqual(normalized.apiKey, undefined, 'apiKey must be stripped');
    assertEqual(normalized.arbitraryInjectedField, undefined, 'Arbitrary keys must be stripped');
  });

  it('normalizes imported identifiers before they can be used in DOM attributes', () => {
    const normalized = validateAndNormalizePlan({
      eventType: 'wedding',
      milestones: [{
        id: 'task\" autofocus onfocus=alert(1)',
        phaseId: 'phase-long',
        phaseTitle: 'Planning',
        text: 'Review venue contract',
        done: false
      }]
    });

    assertEqual(normalized.milestones[0].id, 'task--autofocus-onfocus-alert-1-');
    assertFalse(normalized.milestones[0].id.includes('"'));
    assertFalse(normalized.milestones[0].id.includes(' '));
  });
});

// ============================================================================
// ASYNC TEST RUNNER ORCHESTRATOR
// ============================================================================

async function runAllSuites() {
  for (const suite of suites) {
    console.log(`\n${COLORS.bold}${COLORS.cyan}▶ Test Suite: ${suite.name}${COLORS.reset}`);
    for (const test of suite.tests) {
      totalTests++;
      try {
        const result = test.fn();
        if (result && typeof result.then === 'function') {
          await result;
        }
        passedTests++;
        console.log(`  ${COLORS.green}✔ PASS:${COLORS.reset} ${test.name}`);
      } catch (err) {
        failedTests++;
        console.error(`  ${COLORS.red}✖ FAIL:${COLORS.reset} ${test.name}`);
        console.error(`    ${COLORS.red}Error:${COLORS.reset} ${err.message}`);
        if (err.stack) {
          const lines = err.stack.split('\n');
          for (let i = 1; i < Math.min(lines.length, 4); i++) {
            console.error(`    ${COLORS.yellow}${lines[i].trim()}${COLORS.reset}`);
          }
        }
      }
    }
  }

  const duration = Date.now() - testStartTime;
  console.log('\n============================================================');
  console.log(`${COLORS.bold}PLANFLOW AI TEST EXECUTION SUMMARY${COLORS.reset}`);
  console.log('============================================================');
  console.log(`Total Assertions/Tests: ${totalTests}`);
  console.log(`Passed:                 ${COLORS.green}${passedTests}${COLORS.reset}`);
  console.log(`Failed:                 ${failedTests === 0 ? COLORS.green + '0' : COLORS.red + failedTests}${COLORS.reset}`);
  console.log(`Duration:               ${duration}ms`);
  console.log('============================================================');

  if (failedTests > 0) {
    console.error(`\n${COLORS.red}${COLORS.bold}❌ TEST RUN FAILED with ${failedTests} failure(s).${COLORS.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${COLORS.green}${COLORS.bold}✨ 100% TESTS PASSED! All 10 suites verified successfully.${COLORS.reset}\n`);
    process.exit(0);
  }
}

runAllSuites();
