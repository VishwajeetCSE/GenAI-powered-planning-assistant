/**
 * @file vendors.js
 * @module PlanFlowAI/Vendors
 * @description Vendor checklist generation and AI negotiation script builder.
 * @license MIT
 */

import { ARCHETYPE_DEFAULTS } from './constants.js';
import { escapeHTML } from './security.js';

/**
 * Builds initial sample vendors customized for the active event archetype.
 * @param {string} [eventType='wedding'] - Event Archetype
 * @returns {Array<Object>} List of sample vendor entries
 */
export function buildSampleVendors(eventType = 'wedding') {
  if (eventType === 'birthday') {
    return [
      { id: 'v-b1', name: 'Skyline Rooftop Lounge', category: 'Venue', quoted: 3200, status: 'Negotiating', notes: 'Includes bar staff and ambient city views' },
      { id: 'v-b2', name: 'Gourmet Tapas & Mixology', category: 'Catering', quoted: 2800, status: 'Prospecting', notes: 'Custom cocktail menu for 60 guests' },
      { id: 'v-b3', name: 'DJ Beatmaster & Lighting', category: 'Decor & Entertainment', quoted: 1400, status: 'Booked', notes: '4-hour live dance set' },
      { id: 'v-b4', name: 'Moments Flash Photography', category: 'Photography & Media', quoted: 900, status: 'Contacted', notes: 'Digital gallery delivery within 5 days' },
      { id: 'v-b5', name: 'Party City Equipment Rentals', category: 'Contingency & Permits', quoted: 600, status: 'Booked', notes: 'High-top cocktail tables and stools' }
    ];
  }

  if (eventType === 'community') {
    return [
      { id: 'v-c1', name: 'Central Community Park Pavilion', category: 'Venue', quoted: 4500, status: 'Booked', notes: 'Includes municipal lawn and restrooms' },
      { id: 'v-c2', name: 'Street Food Trucks Coalition', category: 'Catering', quoted: 3500, status: 'Negotiating', notes: '3 trucks: Taco, BBQ, Vegan Bowls' },
      { id: 'v-c3', name: 'City Sound & Stage Crew', category: 'Decor & Entertainment', quoted: 2800, status: 'Contacted', notes: 'Includes generator and certified sound tech' },
      { id: 'v-c4', name: 'Local Media Drone & Photo Team', category: 'Photography & Media', quoted: 1200, status: 'Prospecting', notes: 'Aerial crowd shots and recap reel' },
      { id: 'v-c5', name: 'Municipal Event Insurance & Permits', category: 'Contingency & Permits', quoted: 2200, status: 'Booked', notes: 'Fire marshal and health inspection clearance' }
    ];
  }

  return [
    { id: 'v-w1', name: 'Grand Horizon Ballroom & Gardens', category: 'Venue', quoted: 9500, status: 'Negotiating', notes: 'Includes bridal suite and setup crew' },
    { id: 'v-w2', name: 'Artisan Culinary & Cocktails', category: 'Catering', quoted: 6200, status: 'Contacted', notes: '3-course plated dinner + open bar' },
    { id: 'v-w3', name: 'Blossom & Vine Floral Design', category: 'Decor & Entertainment', quoted: 3200, status: 'Prospecting', notes: 'Ceremony arch and table centerpieces' },
    { id: 'v-w4', name: 'Everlasting Moments Cinema', category: 'Photography & Media', quoted: 2800, status: 'Booked', notes: 'Full-day coverage + 4K highlight film' },
    { id: 'v-w5', name: 'Elite Security & Sound Ordinance Permit', category: 'Contingency & Permits', quoted: 1400, status: 'Booked', notes: 'Required for outdoor amplified music after 9 PM' }
  ];
}

/**
 * Generates an empathetic, high-leverage negotiation script for a vendor.
 * @param {Object} params - Vendor & planning parameters
 * @returns {Object} { subject, body, tips }
 */
export function generateNegotiationScript(params) {
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
