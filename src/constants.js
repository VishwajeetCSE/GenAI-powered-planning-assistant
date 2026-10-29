/**
 * @file constants.js
 * @module PlanFlowAI/Constants
 * @description Immutable configuration constants, archetype presets, and domain dictionaries.
 * @license MIT
 */

export const NUMERIC_BOUNDS = Object.freeze({
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

export const CURRENCIES = Object.freeze({
  USD: Object.freeze({ symbol: '$', code: 'USD', locale: 'en-US' }),
  INR: Object.freeze({ symbol: '₹', code: 'INR', locale: 'en-IN' }),
  EUR: Object.freeze({ symbol: '€', code: 'EUR', locale: 'de-DE' }),
  GBP: Object.freeze({ symbol: '£', code: 'GBP', locale: 'en-GB' })
});

export const DEFAULT_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'venue', name: 'Venue & Logistics', defaultPct: 40, color: '#6366f1', filter: 'Venue' }),
  Object.freeze({ id: 'catering', name: 'Catering & Drinks', defaultPct: 25, color: '#10b981', filter: 'Catering' }),
  Object.freeze({ id: 'decor', name: 'Decor & Entertainment', defaultPct: 15, color: '#f59e0b', filter: 'Decor & Entertainment' }),
  Object.freeze({ id: 'photo', name: 'Photography & Media', defaultPct: 10, color: '#ec4899', filter: 'Photography & Media' }),
  Object.freeze({ id: 'contingency', name: 'Contingency & Permits', defaultPct: 10, color: '#06b6d4', filter: 'Contingency & Permits' })
]);

export const ARCHETYPE_DEFAULTS = Object.freeze({
  wedding: Object.freeze({
    title: '💍 Wedding Celebration',
    budget: 25000,
    guests: 120,
    horizon: 6,
    location: 'outdoor',
    vibe: 'rustic',
    percentages: Object.freeze({ venue: 40, catering: 25, decor: 15, photo: 10, contingency: 10 })
  }),
  birthday: Object.freeze({
    title: '🎂 Milestone Birthday Party',
    budget: 8500,
    guests: 60,
    horizon: 3,
    location: 'indoor',
    vibe: 'modern',
    percentages: Object.freeze({ venue: 30, catering: 35, decor: 20, photo: 5, contingency: 10 })
  }),
  community: Object.freeze({
    title: '🤝 Community Festival / Gathering',
    budget: 15000,
    guests: 350,
    horizon: 4,
    location: 'outdoor',
    vibe: 'cultural',
    percentages: Object.freeze({ venue: 35, catering: 20, decor: 15, photo: 5, contingency: 25 })
  })
});

export const DEFAULT_RISKS = Object.freeze({
  wedding: Object.freeze([
    Object.freeze({ id: 'wr-1', category: 'Weather', title: 'Sudden rain during outdoor ceremony/reception', probability: 'Medium', impact: 'Critical', strategy: 'Reserve clear-top waterproof marquee tent 48 hrs prior with sidewall heaters.', status: 'Mitigated' }),
    Object.freeze({ id: 'wr-2', category: 'Vendor', title: 'Lead photographer or DJ illness/cancellation', probability: 'Low', impact: 'Critical', strategy: 'Contract second-shooter clause and maintain verified replacement roster.', status: 'Monitoring' }),
    Object.freeze({ id: 'wr-3', category: 'Logistics', title: 'Guest RSVPs exceed ballroom seated capacity', probability: 'Medium', impact: 'Moderate', strategy: 'Cap registration at 95% ballroom capacity; finalize seating chart 3 weeks prior.', status: 'Action Needed' })
  ]),
  birthday: Object.freeze([
    Object.freeze({ id: 'br-1', category: 'Budget', title: 'Venue bar/overtime surcharge exceeding limits', probability: 'High', impact: 'Moderate', strategy: 'Set hard cutoff time in DJ contract; pre-pay drink tickets rather than open bar.', status: 'Monitoring' }),
    Object.freeze({ id: 'br-2', category: 'Catering', title: 'Severe guest dietary & allergen cross-contamination', probability: 'Medium', impact: 'Critical', strategy: 'Collect allergen tags in RSVP intake; isolate gluten-free and vegan prep stations.', status: 'Mitigated' }),
    Object.freeze({ id: 'br-3', category: 'Audio/Visual', title: 'Sound equipment or projector failure for memory montage', probability: 'Low', impact: 'Moderate', strategy: 'Conduct sound-check 2 hours before guests arrive; carry backup HDMI cables and USB.', status: 'Action Needed' })
  ]),
  community: Object.freeze([
    Object.freeze({ id: 'cr-1', category: 'Permits', title: 'Municipal park & sound amplification permit delays', probability: 'High', impact: 'Critical', strategy: 'Submit city paperwork 90 days out; retain receipt for designated public coordinator.', status: 'Action Needed' }),
    Object.freeze({ id: 'cr-2', category: 'Weather', title: 'Heatwave or torrential downpour impacting public safety', probability: 'Medium', impact: 'Critical', strategy: 'Contract misting stations, water refill points, and designated emergency medical shade.', status: 'Monitoring' }),
    Object.freeze({ id: 'cr-3', category: 'Crowd Safety', title: 'Capacity overflow causing gate bottleneck & fire hazards', probability: 'Medium', impact: 'Critical', strategy: 'Implement one-way pedestrian flow barricades and volunteer marshals.', status: 'Mitigated' })
  ])
});

export const DEFAULT_INVENTORY = Object.freeze({
  wedding: Object.freeze([
    Object.freeze({ id: 'wi-1', name: 'Ceremony PA Audio & Wireless Lavalier Mics', category: 'Audio/Visual', quantity: 2, status: 'On-Site', owner: 'Sound Tech' }),
    Object.freeze({ id: 'wi-2', name: 'Warm White Ambient Uplighting Fixtures', category: 'Decor', quantity: 12, status: 'In-Transit', owner: 'Lighting Lead' }),
    Object.freeze({ id: 'wi-3', name: 'Outdoor Patio Propane Heaters', category: 'Logistics', quantity: 4, status: 'Sourced', owner: 'Venue Host' }),
    Object.freeze({ id: 'wi-4', name: 'Emergency Bridal Kit & Medical First Aid', category: 'Safety', quantity: 2, status: 'On-Site', owner: 'Coordinator' })
  ]),
  birthday: Object.freeze([
    Object.freeze({ id: 'bi-1', name: 'DJ Sound System & High-Bass Subwoofer', category: 'Audio/Visual', quantity: 2, status: 'On-Site', owner: 'Emcee' }),
    Object.freeze({ id: 'bi-2', name: 'Memory Slideshow Projector & 100" Screen', category: 'Audio/Visual', quantity: 1, status: 'Packed', owner: 'Tech Lead' }),
    Object.freeze({ id: 'bi-3', name: 'Customized Photo-Booth Props & Backdrop Frame', category: 'Decor', quantity: 1, status: 'In-Transit', owner: 'Party Lead' }),
    Object.freeze({ id: 'bi-4', name: 'Electric Balloon Arch Air Compressor', category: 'Decor', quantity: 2, status: 'On-Site', owner: 'Decor Team' })
  ]),
  community: Object.freeze([
    Object.freeze({ id: 'ci-1', name: '5000W Portable Silent Power Generator', category: 'Power', quantity: 2, status: 'In-Transit', owner: 'Facilities Lead' }),
    Object.freeze({ id: 'ci-2', name: 'Commercial Concert Sound Stage & PA System', category: 'Audio/Visual', quantity: 1, status: 'Sourced', owner: 'Stage Mgr' }),
    Object.freeze({ id: 'ci-3', name: 'Pedestrian Crowd Control Steel Barricades', category: 'Safety', quantity: 20, status: 'On-Site', owner: 'Safety Marshal' }),
    Object.freeze({ id: 'ci-4', name: 'First Aid & Hydration Station Pop-Up Tent', category: 'Safety', quantity: 2, status: 'On-Site', owner: 'Medical Team' })
  ])
});
