/**
 * @file milestones.js
 * @module PlanFlowAI/Milestones
 * @description Backwards-scheduled milestone generator and Planning Readiness Score calculator.
 * @license MIT
 */

/**
 * Generates backwards-scheduled milestone checklist items based on planning horizon and archetype.
 * @param {string} [eventType='wedding'] - Event Archetype
 * @param {number} [horizonMonths=6] - Planning horizon in months
 * @returns {Array<Object>} List of milestone phases with actionable tasks
 */
export function buildMilestones(eventType = 'wedding', horizonMonths = 6) {
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
export function calculateReadiness(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { score: 0, completed: 0, total: 0, status: 'No Tasks Defined' };
  }
  const completed = tasks.filter(t => Boolean(t.done)).length;
  const total = tasks.length;
  const score = Math.round((completed / total) * 100);

  let status = 'Stage: Initiation';
  if (score === 100) status = '100% Ready for Event Day! 🎉';
  else if (score >= 75) status = 'Stage: Final Countdown & Polish';
  else if (score >= 45) status = 'Stage: Solid Progress In Motion';
  else if (score >= 20) status = 'Stage: Core Foundations Active';

  return { score, completed, total, status };
}
