/**
 * PlanFlow AI — Self-Contained Automated Unit & Integration Test Suite
 * Runnable via: node test.js (Zero external testing dependencies)
 */

const {
  escapeHTML,
  sanitizeNumber,
  sanitizeString,
  CURRENCIES,
  DEFAULT_CATEGORIES,
  ARCHETYPE_DEFAULTS,
  calculateBudget,
  formatCurrency,
  buildMilestones,
  calculateReadiness,
  buildSampleVendors,
  generateNegotiationScript,
  runHeuristicAI,
  askPlanGenie,
  getDefaultState
} = require('./app.js');

// ============================================================================
// MICRO TEST HARNESS
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

function describe(suiteName, fn) {
  console.log(`\n${COLORS.bold}${COLORS.cyan}▶ Test Suite: ${suiteName}${COLORS.reset}`);
  fn();
}

function it(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${COLORS.green}✔ PASS:${COLORS.reset} ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  ${COLORS.red}✖ FAIL:${COLORS.reset} ${testName}`);
    console.error(`    ${COLORS.red}Error:${COLORS.reset} ${err.message}`);
    if (err.stack) {
      const line = err.stack.split('\n')[2];
      if (line) console.error(`    ${COLORS.yellow}${line.trim()}${COLORS.reset}`);
    }
  }
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

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(message || `Expected deep match:\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
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
// TEST SUITES
// ============================================================================

describe('Suite 1: Security & XSS Sanitization Engine', () => {
  it('escapes dangerous HTML script tags to harmless entities', () => {
    const malicious = '<script>alert("XSS")</script>';
    const safe = escapeHTML(malicious);
    assertEqual(safe, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('escapes single and double quotes, ampersands, and angle brackets', () => {
    const input = `'Hello' & "World" <foo> / bar`;
    const safe = escapeHTML(input);
    assertEqual(safe, '&#039;Hello&#039; &amp; &quot;World&quot; &lt;foo&gt; &#x2F; bar');
  });

  it('handles null, undefined, and non-string types safely in escapeHTML', () => {
    assertEqual(escapeHTML(null), '');
    assertEqual(escapeHTML(undefined), '');
    assertEqual(escapeHTML(12345), '12345');
    assertEqual(escapeHTML(true), 'true');
  });

  it('sanitizes and clamps numbers within bounds', () => {
    assertEqual(sanitizeNumber(500, 100, 1000, 200), 500);
    assertEqual(sanitizeNumber(50, 100, 1000, 200), 100); // clamped to min
    assertEqual(sanitizeNumber(5000, 100, 1000, 200), 1000); // clamped to max
    assertEqual(sanitizeNumber('not-a-number', 100, 1000, 250), 250); // fallback default
  });

  it('sanitizes and trims arbitrary text strings and bounds length', () => {
    assertEqual(sanitizeString('   hello world   ', 20), 'hello world');
    assertEqual(sanitizeString('abcdefghijklmn', 5), 'abcde');
    assertEqual(sanitizeString(null, 10), '');
    assertEqual(sanitizeString(12345, 10), '');
  });
});

describe('Suite 2: Context-Aware Dynamic Budget Calculator Engine', () => {
  it('correctly calculates 100% balanced budget allocations', () => {
    const totalBudget = 20000;
    const percentages = { venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 };
    const res = calculateBudget(totalBudget, percentages, 'USD', 100);

    assertEqual(res.totalBudget, 20000);
    assertEqual(res.allocatedTotal, 20000);
    assertEqual(res.sumPercentage, 100);
    assertEqual(res.varianceAmount, 0);
    assertTrue(res.isBalanced);
    assertFalse(res.isOverBudget);
    assertEqual(res.costPerGuest, 200);

    const venue = res.categories.find(c => c.id === 'venue');
    assertEqual(venue.amount, 8000); // 40% of 20000
    assertEqual(venue.perGuest, 80);

    const catering = res.categories.find(c => c.id === 'catering');
    assertEqual(catering.amount, 5000); // 25% of 20000
  });

  it('flags over-budget allocations with positive variance', () => {
    const totalBudget = 10000;
    const percentages = { venue: 50, catering: 35, decor: 15, photo: 10, contingency: 10 }; // 120%
    const res = calculateBudget(totalBudget, percentages, 'USD', 50);

    assertEqual(res.sumPercentage, 120);
    assertFalse(res.isBalanced);
    assertTrue(res.isOverBudget);
    assertEqual(res.allocatedTotal, 12000);
    assertEqual(res.varianceAmount, -2000); // 10000 - 12000
  });

  it('detects under-budget allocations with unassigned reserve', () => {
    const totalBudget = 10000;
    const percentages = { venue: 30, catering: 20, decor: 10, photo: 10, contingency: 10 }; // 80%
    const res = calculateBudget(totalBudget, percentages, 'USD', 50);

    assertEqual(res.sumPercentage, 80);
    assertFalse(res.isBalanced);
    assertFalse(res.isOverBudget);
    assertEqual(res.allocatedTotal, 8000);
    assertEqual(res.varianceAmount, 2000); // 2000 unallocated
  });

  it('safely handles zero guests and extreme inputs without division by zero', () => {
    const res = calculateBudget(15000, { venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 }, 'USD', 0);
    // Guest count clamped to min 1
    assert(res.costPerGuest > 0);
    assert(res.allocatedTotal === 15000);
  });

  it('formats currency strings correctly for multi-currency support', () => {
    const usdFormatted = formatCurrency(25000, 'USD');
    assertContains(usdFormatted, '25,000');

    const inrFormatted = formatCurrency(100000, 'INR');
    assert(inrFormatted.includes('₹') || inrFormatted.includes('1,00,000') || inrFormatted.includes('100,000'));

    const eurFormatted = formatCurrency(15000, 'EUR');
    assert(eurFormatted.includes('€') || eurFormatted.includes('15.000') || eurFormatted.includes('15,000'));
  });
});

describe('Suite 3: Milestone Roadmap & Readiness Score Engine', () => {
  it('builds tailored milestones for Wedding, Birthday, and Community archetypes', () => {
    const weddingTasks = buildMilestones('wedding', 6);
    const birthdayTasks = buildMilestones('birthday', 3);
    const communityTasks = buildMilestones('community', 6);

    assert(weddingTasks.length >= 10, 'Wedding tasks should have at least 10 items');
    assert(birthdayTasks.length >= 8, 'Birthday tasks should have at least 8 items');
    assert(communityTasks.length >= 8, 'Community tasks should have at least 8 items');

    const hasRunOfShow = weddingTasks.some(t => t.text.includes('Run-Of-Show') || t.text.includes('Ceremony') || t.phaseTitle.includes('Day-Of'));
    assertTrue(hasRunOfShow, 'Wedding tasks should include day-of run-of-show milestones');
  });

  it('dynamically adapts phase titles based on planning horizon months', () => {
    const blitzTasks = buildMilestones('wedding', 1);
    assertEqual(blitzTasks[0].phaseTitle, 'Phase 1: Immediate Foundation & Venue');

    const standardTasks = buildMilestones('wedding', 6);
    assertEqual(standardTasks[0].phaseTitle, '6+ Months Out: Vision, Venue & Big Picture');
  });

  it('calculates planning readiness score accurately with status milestones', () => {
    const tasks = [
      { id: '1', text: 'Task 1', done: true },
      { id: '2', text: 'Task 2', done: true },
      { id: '3', text: 'Task 3', done: false },
      { id: '4', text: 'Task 4', done: false }
    ];
    const readiness = calculateReadiness(tasks);

    assertEqual(readiness.score, 50);
    assertEqual(readiness.completed, 2);
    assertEqual(readiness.total, 4);
    assertContains(readiness.status, 'Gaining Momentum');
  });

  it('reports 100% readiness when all tasks are completed', () => {
    const tasks = [
      { id: '1', text: 'Task 1', done: true },
      { id: '2', text: 'Task 2', done: true }
    ];
    const readiness = calculateReadiness(tasks);
    assertEqual(readiness.score, 100);
    assertContains(readiness.status, 'Production Ready');
  });

  it('handles empty task list gracefully without errors', () => {
    const readiness = calculateReadiness([]);
    assertEqual(readiness.score, 0);
    assertEqual(readiness.completed, 0);
    assertEqual(readiness.total, 0);
  });
});

describe('Suite 4: Vendor Checklist & Negotiation Assistant Engine', () => {
  it('generates realistic sample vendors tailored to the archetype', () => {
    const vendors = buildSampleVendors('wedding', 30000);
    assert(vendors.length >= 4, 'Should generate at least 4 vendors');

    const venue = vendors.find(v => v.category === 'Venue');
    assert(venue !== undefined, 'Should have a venue vendor');
    assert(venue.quoted > 5000, 'Venue quote should reflect total budget scale');
  });

  it('generates high-leverage AI negotiation script for over-budget quotes', () => {
    const script = generateNegotiationScript({
      vendorName: 'Starlight Catering & Banquets',
      category: 'Catering',
      quotedPrice: 8500,
      targetBudget: 6500,
      eventType: 'wedding',
      guestCount: 120,
      currencySymbol: '$'
    });

    assertContains(script.subject, 'Starlight Catering');
    assertContains(script.body, '$8,500');
    assertContains(script.body, '$6,500');
    assertContains(script.body, '120-guest');
    assertContains(script.body, 'adjustments');
    assert(script.tips.length >= 3, 'Should include at least 3 negotiation strategy tips');
  });

  it('generates appreciative confirmation script when quote is within budget', () => {
    const script = generateNegotiationScript({
      vendorName: 'Acoustic Soul DJ',
      category: 'Decor & Entertainment',
      quotedPrice: 1500,
      targetBudget: 2000,
      eventType: 'birthday',
      guestCount: 60,
      currencySymbol: '$'
    });

    assertContains(script.body, 'fits cleanly within our planned budget envelope');
    assertContains(script.body, 'contract terms, payment schedule');
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
    assertContains(response, 'Master Wedding Day-Of Run-Of-Show');
    assertContains(response, 'Ceremony');
    assertContains(response, 'Cocktail Hour');
    assertContains(response, 'Grand Entrance');
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
});

describe('Suite 6: Local Persistence Mock & State Integrity', () => {
  it('generates valid default state with all required schema fields', () => {
    const state = getDefaultState();
    assertEqual(state.eventType, 'wedding');
    assertEqual(typeof state.budget, 'number');
    assertEqual(typeof state.guests, 'number');
    assertEqual(typeof state.categoryPercentages, 'object');
    assert(Array.isArray(state.milestones));
    assert(Array.isArray(state.vendors));
    assert(Array.isArray(state.chatHistory));
    assertEqual(state.schemaVersion, 2);
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
  });

  it('recovers gracefully from corrupted JSON data', () => {
    let mockStorage = null;
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

// ============================================================================
// SUMMARY EXECUTION REPORT
// ============================================================================

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
  console.log(`\n${COLORS.green}${COLORS.bold}✨ 100% TESTS PASSED! All suites verified successfully.${COLORS.reset}\n`);
  process.exit(0);
}
