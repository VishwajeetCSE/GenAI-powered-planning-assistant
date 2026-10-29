/**
 * @file ai.js
 * @module PlanFlowAI/AI
 * @description PlanGenie Contextual AI coach: Local Heuristic Knowledge Graph & Google Gemini API.
 * @license MIT
 */

import { ARCHETYPE_DEFAULTS, GEMINI_MODELS, NUMERIC_BOUNDS } from './constants.js';
import { sanitizeString } from './security.js';

const GEMINI_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{35}$/;

/**
 * Validates the expected Google AI API-key shape before a request is sent.
 * This is input validation, not a substitute for provider-side authorization.
 * @param {unknown} apiKey
 * @returns {boolean}
 */
export function isValidGeminiApiKey(apiKey) {
  return typeof apiKey === 'string' && GEMINI_API_KEY_PATTERN.test(apiKey.trim());
}

/** @param {unknown} model @returns {boolean} */
export function isSupportedGeminiModel(model) {
  return typeof model === 'string' && GEMINI_MODELS.includes(model);
}

/**
 * Heuristic AI Brain: Processes prompts contextually using rule engine & knowledge graph.
 * @param {string} prompt - User question or inquiry
 * @param {Object} context - Planning context
 * @returns {string} Formatted markdown advisory
 */
export function runHeuristicAI(prompt, context) {
  const q = String(prompt || '').toLowerCase();
  const eventLabel = ARCHETYPE_DEFAULTS[context.eventType]?.title || 'Event Celebration';
  const guests = context.guests || 100;
  const budget = context.budget || 20000;
  const currencySymbol = context.currencySymbol || '$';
  const location = context.location || 'indoor';
  const vibe = context.vibe || 'modern';
  const readiness = context.readinessScore || 0;

  // Preset 1: Themes
  if (q.includes('theme') || q.includes('concept') || q.includes('unique budget-friendly')) {
    if (context.eventType === 'wedding') {
      return `### 💡 PlanGenie Curated Wedding Themes (${vibe.toUpperCase()} Vibe)

1. **Modern Minimalist Botanical**:
   - Focus on monochromatic whites, warm ambient candlelight, and abundant greenery runners (eucalyptus/ruscus) instead of expensive imported blossoms.
   - *Budget win:* Reduces floral expenditure by up to 35%.

2. **Rustic Tuscan Vineyard**:
   - Long banquet farm tables, repurposed wine bottles as table number lanterns, and family-style platters.
   - *Budget win:* Avoids costly formal plate chargers and elaborate centerpieces.

3. **Golden Hour Sunset Cocktail**:
   - Shift from a seated formal banquet to high-top lounge tables with continuous gourmet passed canapés.
   - *Budget win:* Cuts catering staffing requirements by nearly 25%.

4. **Eco-Chic Herb & Wildflower**:
   - Potted fragrant herbs (rosemary, lavender) that double as guest favors and table centerpieces.
   - *Budget win:* Multi-purpose favors that leave zero waste.

5. **Candlelit Industrial Loft**:
   - Warm fairy string lights, exposed brick, and metallic accents with an acoustic trio.
   - *Budget win:* High atmospheric warmth with minimal structural draping.`;
    } else if (context.eventType === 'birthday') {
      return `### 💡 PlanGenie Milestone Birthday Themes (${guests} Guests)

1. **"Through The Decades" Retro Glam**:
   - Curated decade zones with retro photo walls, throwback signature cocktails, and vinyl record guestbooks.
2. **Neon Noir Lounge**:
   - Ambient blacklight, neon custom signage ("Cheers to Milestone Years"), and LED glow accessories.
3. **Cozy Backyard Festival**:
   - Acoustic bonfire set, food truck window, festoon hanging lanterns, and personalized trivia games.
4. **Sunset Tapas & Tasting**:
   - Charcuterie grazing stations with guided wine/mocktail pairings.
5. **Vintage Masquerade Ball**:
   - Elegant masquerade masks, velvet linens, and dramatic jazz quartet.`;
    } else {
      return `### 💡 PlanGenie Community Gathering Themes

1. **Local Flavors Harvest Bazaar**:
   - Showcase neighborhood artisans, farm-to-table popups, and acoustic buskers.
2. **Eco & Wellness Park Fest**:
   - Group outdoor yoga, sustainability workshops, solar-powered demonstration booths.
3. **Global Heritage Food & Arts Walk**:
   - Pavilions celebrating diverse ethnic cuisine, folk dance, and interactive crafts.
4. **Neighborhood Family Play Fair**:
   - Giant lawn games, face-painting stations, obstacle courses, and fire truck tours.
5. **Outdoor Twilight Cinema & Picnic**:
   - Inflatable projector screen, popcorn bar, and family blanket picnic zones.`;
    }
  }

  // Preset 2: Severe Weather
  if (q.includes('rain') || q.includes('weather') || q.includes('wind') || q.includes('storm')) {
    return `### 🌧️ Severe Weather & Rain Contingency Protocol

*Active Strategy for: ${location.toUpperCase()} setting with ${guests} attendees*

1. **T-48 Hour Decision Trigger Window**:
   - Lock in weather forecast radar with venue coordinator by 10:00 AM two days prior.
   - Never wait until morning-of to trigger tent delivery or marquee sidewalls.

2. **Tenting & Drainage Infrastructure**:
   - Verify pole anchors are secured into weighted concrete ballast (essential on paved surfaces).
   - Lay waterproof interlocking turf mats along all primary guest walkways to prevent mud traps.

3. **AV & Electrical Grounding**:
   - Ensure all outdoor extension cords use elevated waterproof junction boxes and GFCI breakers.
   - Relocate soundboard console and microphones under certified overhead canopy.

4. **Guest Comfort Kit**:
   - Procure 50 clear bubble umbrellas (they look gorgeous in photography).
   - Set up an entry shoe-wiping station with absorbent microfiber runners and coat racks.

5. **Vendor Coordination Protocol**:
   - Caterer staging tent must be directly abutted to main reception to prevent dish temperature loss.`;
  }

  // Preset 3: Run of Show
  if (q.includes('run-of-show') || q.includes('minute-by-minute') || q.includes('schedule') || q.includes('timeline')) {
    return `### ⏱️ Master ${eventLabel} Day-Of Run-Of-Show

*Precision schedule tailored for ${guests} guests:*

- **09:00 AM** — Production Crew & Vendor Load-In (AV, lighting, staging).
- **11:00 AM** — Florist & Decorator table setting & centerpiece assembly.
- **01:30 PM** — Core hosts arrive; bridal party / VIP hair, makeup & attire staging.
- **03:00 PM** — Photographer arrives for pre-event portraits & detail shots.
- **04:30 PM** — Background acoustic music begins; welcome beverage station opens.
- **05:00 PM** — **Main Event Program / Ceremony Begins** (30-40 min target window).
- **05:45 PM** — Cocktail hour & passed hors d'oeuvres; formal family photo session.
- **06:45 PM** — Doors open to main dining hall; welcome emcee remarks.
- **07:00 PM** — Plated dinner service / food truck line active.
- **08:15 PM** — Milestone toasts, commemorative tributes & cake cutting.
- **08:45 PM** — Dance floor officially opens / live performance kicks off.
- **10:45 PM** — Last call for bar service; late-night savory bite snacks.
- **11:00 PM** — Grand Exit / send-off tribute; load-out teardown commences.`;
  }

  // Preset 4: Games & Seating
  if (q.includes('game') || q.includes('seating') || q.includes('entertainment') || q.includes('arrangement')) {
    return `### 🎯 Seating Architecture & Interactive Entertainment Plan

1. **Seating Layout Strategy for ${guests} Guests**:
   - Recommended: 60-inch round tables (8-10 guests per table) or long communal rectangular banquet tables.
   - Ensure 60-inch minimum aisle clearances between chair backs for server traffic and ADA wheelchair accessibility.
   - Seat elderly guests and families with young children away from primary audio speakers.

2. **Interactive High-Engagement Icebreakers**:
   - **The Shoe Game / Milestone Trivia**: Emcee hosts a rapid-fire quiz testing how well guests know the honorees.
   - **Custom Table Crossword / Coaster Trivia**: Printed on cocktail napkins or table menus to spark organic dialogue.
   - **Audio Guestbook Telephone**: Vintage rotary phone recording personalized voice messages from attendees.
   - **Giant Wooden Jenga & Cornhole**: Stationed on terrace for non-dancing attendees.`;
  }

  // Preset 5: Catering Hacks
  if (q.includes('cater') || q.includes('food') || q.includes('drink') || q.includes('cost') || q.includes('saving')) {
    return `### 🍽️ Catering & Budget Optimization Playbook

*Maximizing culinary impact within ${currencySymbol}${budget.toLocaleString()}:*

1. **Signature Drink Strategy (The "2 + Beer & Wine" Rule)**:
   - Avoid a full open bar with 20 liquors. Serve 2 bespoke signature cocktails plus two quality wines and craft beers. Cuts alcohol costs by 30-40%.
2. **Family Style vs. Individual Plated**:
   - Family-style platters create lively table camaraderie while reducing waitstaff headcounts.
3. **Late-Night High-Impression Comfort Food**:
   - Save budget on the main entrée and delight guests at 10 PM with sliders, mini grilled cheeses, or a churro cart.
4. **Tiered Display Cake + Sheet Kitchen Cake**:
   - Order a showstopper 2-tier display cake for photos, with identical sheet cake sliced in the kitchen for guests. Saves up to $500.`;
  }

  // Fallback Contextual Advisor
  return `### 🤖 PlanGenie Strategic Advisory

Hello! I have analyzed your **${eventLabel}** plan for **${guests} guests** with a budget of **${currencySymbol}${budget.toLocaleString()}**:

- **Current Planning Readiness**: ${readiness}%
- **Venue Style**: ${location.toUpperCase()}
- **Theme/Aesthetic**: ${vibe.toUpperCase()}

**Recommended Immediate Next Step:**
1. Review your high-impact category allocations in the Budget Calculator.
2. Check your milestone checklist for tasks requiring immediate lead-time commitments.
3. Test our preset buttons below for instant run-of-show schedules, rain contingency protocols, or catering hacks!`;
}

/**
 * Dispatches an AI prompt either to the live Google Gemini API or to the local heuristic brain.
 * @param {string} prompt - User query
 * @param {Object} context - Planning context
 * @param {string} [apiKey=''] - Optional Gemini API key
 * @param {string} [model='gemini-1.5-flash'] - Selected Gemini model
 * @returns {Promise<string>} Generated markdown string
 */
export async function askPlanGenie(prompt, context, apiKey = '', model = 'gemini-1.5-flash') {
  const normalizedKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!isValidGeminiApiKey(normalizedKey) || !isSupportedGeminiModel(model)) {
    return runHeuristicAI(prompt, context);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(normalizedKey)}`;

  const systemInstruction = `You are PlanGenie, an expert AI event planning consultant.
Active Event Context:
- Archetype: ${context.eventType}
- Total Budget: ${context.currencySymbol}${context.budget}
- Guest Count: ${context.guests} attendees
- Location Style: ${context.location}
- Theme/Vibe: ${context.vibe}
- Planning Horizon: ${context.horizon} months
- Current Readiness Score: ${context.readinessScore}%

Deliver structured, actionable, and encouraging event advice in clean GitHub-flavored markdown. Keep responses concise and practical.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\nUser Question: ${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  };

  const requestController = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId = requestController
    ? setTimeout(() => requestController.abort(), NUMERIC_BOUNDS.GEMINI_REQUEST_TIMEOUT_MS)
    : null;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      ...(requestController ? { signal: requestController.signal } : {})
    });

    if (!res.ok) {
      console.warn(`Gemini API error status: ${res.status}. Falling back to local Heuristic Engine.`);
      return runHeuristicAI(prompt, context);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && candidateText.trim()) {
      return sanitizeString(candidateText, NUMERIC_BOUNDS.AI_RESPONSE_MAX_LEN);
    }
    return runHeuristicAI(prompt, context);
  } catch (err) {
    console.warn('Network error reaching Gemini API. Falling back to local Heuristic AI.', err);
    return runHeuristicAI(prompt, context);
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}
