// Composes a first-draft assessment report from a family's real intake
// answers and real observations — SCRUM-84. This is a template-based
// composer, not a live model call: no LLM API key is provisioned for this
// deployment, so it deterministically writes real answers into prose
// instead. Q17 (hobbies) is the highest-signal intake answer and always
// gets its own paragraph, per the working agreement.

const INTAKE_OPTION_LABELS = {
  year_group: {
    reception: 'Reception', year_1: 'Year 1', year_2: 'Year 2', year_3: 'Year 3',
    year_4: 'Year 4', year_5: 'Year 5', year_6: 'Year 6',
  },
  goals: {
    confidence: 'building confidence and a love of learning',
    phonics_reading: 'strong foundations in phonics and reading',
    maths_foundation: 'a solid foundation in maths',
    attention_listening: 'improving attention, listening and following instructions',
    homework_routines: 'support with homework routines',
    close_gaps: 'closing gaps in understanding',
    stretch_challenge: 'stretch and challenge',
    eleven_plus: '11+ preparation',
    social_independence: 'social confidence and independence',
  },
  approach_to_tasks: {
    jumps_in: 'jumps into new tasks quickly',
    warms_up: 'needs a little time to warm up to a new task',
    wants_help: 'likes to check in for help straight away',
    works_alone: 'prefers to work things out alone',
    avoids_when_hard: 'can avoid tasks that feel hard at first',
  },
  focus_aids: {
    quiet_space: 'a quiet space', short_bursts: 'short bursts of focused work',
    movement_breaks: 'movement breaks', visual_prompts: 'visual prompts',
    hands_on: 'hands-on activities', reward_chart: 'a reward chart',
    routine: 'routine', timer: 'a timer', one_to_one: '1:1 attention',
  },
  mistake_response: {
    try_again: 'tries again', ask_help: 'asks for help', upset: 'can get upset',
    angry: 'can get frustrated', give_up: 'can be tempted to give up', laugh_off: 'laughs it off',
  },
  diagnosed_needs: {
    none: 'none noted', dyslexia: 'dyslexia', adhd: 'ADHD', autism: 'autism/ASD',
    speech_language: 'speech & language needs', dyspraxia: 'dyspraxia/DCD', anxiety: 'anxiety',
  },
};

const radioValue = (a) => {
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && 'value' in a) return a.value;
  return undefined;
};

const multiValues = (a) => {
  if (Array.isArray(a)) return a;
  if (a && typeof a === 'object' && 'values' in a) return a.values;
  return [];
};

const freeText = (a) => {
  if (typeof a === 'string') return a.trim() || undefined;
  if (a && typeof a === 'object' && typeof a.other === 'string') return a.other.trim() || undefined;
  return undefined;
};

const labelFor = (fieldId, value) => (INTAKE_OPTION_LABELS[fieldId]?.[value]) || value;

/**
 * @param {{ child_first_name?: string, year_group?: string }} prospect
 * @param {Record<string, unknown>} answers - raw intake_responses.answers
 * @param {{ comment?: string, transcript?: string }[]} observations
 * @returns {string}
 */
export function composeDraftReport(prospect, answers, observations) {
  const name = prospect.child_first_name || 'This child';
  const a = answers || {};
  const paragraphs = [];

  const obsNotes = (observations || [])
    .map((o) => (o.comment || o.transcript || '').trim())
    .filter(Boolean);
  paragraphs.push(
    obsNotes.length
      ? `${name} was observed during their assessment visit: ${obsNotes.join(' ')}`
      : `${name} attended an assessment visit at Acorns Learning Centre.`,
  );

  const hobbies = freeText(a.hobbies);
  if (hobbies) {
    paragraphs.push(`What lights ${name} up: ${hobbies}. We'd recommend building session hooks around this wherever we can.`);
  }

  const approach = multiValues(a.approach_to_tasks).map((v) => labelFor('approach_to_tasks', v));
  const focus = multiValues(a.focus_aids).map((v) => labelFor('focus_aids', v));
  const mistakeResponse = radioValue(a.mistake_response);
  const approachBits = [];
  if (approach.length) approachBits.push(`${name} typically ${approach.join(' and ')}`);
  if (focus.length) approachBits.push(`focuses best with ${focus.join(', ')}`);
  if (mistakeResponse) approachBits.push(`${labelFor('mistake_response', mistakeResponse)} when something goes wrong`);
  if (approachBits.length) paragraphs.push(`${approachBits.join('; ')}.`);

  const goals = multiValues(a.goals).map((v) => labelFor('goals', v));
  if (goals.length) {
    const yearGroup = prospect.year_group ? labelFor('year_group', prospect.year_group) : undefined;
    paragraphs.push(`The family's main goals for ${name}${yearGroup ? ` (${yearGroup})` : ''} are ${goals.join(', ')}.`);
  }

  const needs = multiValues(a.diagnosed_needs)
    .map((v) => labelFor('diagnosed_needs', v))
    .filter((v) => v !== 'none noted');
  if (needs.length) {
    paragraphs.push(`The family noted: ${needs.join(', ')}. We'll factor this into how we plan sessions.`);
  }

  paragraphs.push('Recommendation: pending teacher review following this draft.');

  return paragraphs.join('\n\n');
}
