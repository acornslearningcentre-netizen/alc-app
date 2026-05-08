// Intake form schema — "Your Child at ALC: Learning and Goals"
//
// Mirrors the live Google Form Aishat sends to new parents. Source of truth
// for the question set lives at documents/onboarding-form-schema.md.
//
// Used by:
//   - A2 (single-question screens) — renders one IntakeField at a time
//   - A3 (review screen) — iterates the schema to show every answer
//   - A4 (submit) — calls extractIndexedFields() to build the
//     POST /api/intake body
//
// Two principles from the parent meeting are baked in:
//   1. Q17 (hobbies) is the highest-signal question — flagged with
//      emphasis: 'high' so the UI can give it room to breathe and the
//      AI report prompt (F2) can weight it heavily.
//   2. The form's job is *both* to collect data AND to align the parent
//      on what Acorns thinks matters. Single-question-per-screen UI
//      lets each question be a quiet moment of reflection.

export type IntakeFieldType =
  | 'text'
  | 'longtext'
  | 'date'
  | 'select'
  | 'radio'
  | 'multi';

export interface IntakeOption {
  value: string;
  label: string;
}

export interface IntakeField {
  /** Stable key — used as the answers[] map key and for analytics. Never rename. */
  id: string;
  /** Which page of the form (1: about, 2: goals & habits, 3: needs & consent). */
  section: 1 | 2 | 3;
  /** The question itself, shown as the page heading. */
  label: string;
  /** Optional small text below the label. */
  helper?: string;
  type: IntakeFieldType;
  required?: boolean;
  /** Required for select / radio / multi. */
  options?: IntakeOption[];
  /** Cap on number of selected options (Q11 caps at 3). */
  multiMax?: number;
  /** Whether to show a free-text "Other" alongside the listed options. */
  hasOther?: boolean;
  /** Marks the highest-signal questions for UI + AI prompt weighting. */
  emphasis?: 'high';
}

/** Lead paragraph shown on the welcome screen before Q1. */
export const intakeWelcome =
  "Thanks for taking a few minutes to tell us about your child. Your answers help " +
  "us understand their learning habits, interests, and any areas they need support " +
  "with, so we can personalise sessions from day one. This form takes around 10 minutes.";

const yearGroups: IntakeOption[] = [
  { value: 'reception', label: 'Reception' },
  { value: 'year_1', label: 'Year 1' },
  { value: 'year_2', label: 'Year 2' },
  { value: 'year_3', label: 'Year 3' },
  { value: 'year_4', label: 'Year 4' },
  { value: 'year_5', label: 'Year 5' },
  { value: 'year_6', label: 'Year 6' },
];

const yesNoMaybe: IntakeOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
];

const yesNo: IntakeOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const intakeQuestions: IntakeField[] = [
  // ── Section 1: About your child ────────────────────────────────────────────
  {
    id: 'child_name',
    section: 1,
    label: "Child's name",
    type: 'text',
    required: true,
  },
  {
    id: 'child_dob',
    section: 1,
    label: 'Date of birth',
    helper: 'dd/mm/yyyy',
    type: 'date',
    required: true,
  },
  {
    id: 'year_group',
    section: 1,
    label: 'Year group / age group',
    type: 'select',
    required: true,
    options: yearGroups,
  },
  {
    id: 'school_name',
    section: 1,
    label: 'Name of school / education setting',
    type: 'text',
  },
  {
    id: 'recent_changes',
    section: 1,
    label: 'Has anything changed recently that we should be aware of?',
    helper: 'e.g. changes at home or school',
    type: 'longtext',
  },
  {
    id: 'homework_in_plan',
    section: 1,
    label: "Would you like homework to be included with your child's tuition plan?",
    type: 'radio',
    required: true,
    options: yesNoMaybe,
  },
  {
    id: 'home_practice_time',
    section: 1,
    label: 'How much home practice is realistic for you?',
    type: 'radio',
    hasOther: true,
    options: [
      { value: 'up_to_30',  label: 'Up to 30 mins / week' },
      { value: '30_to_60',  label: '30–60 mins / week' },
      { value: '1_to_2_hr', label: '1–2 hrs / week' },
      { value: '2_plus_hr', label: '2+ hrs / week' },
    ],
  },
  {
    id: 'tech_comfort_parent',
    section: 1,
    label: 'Are you comfortable with ALC using technology as part of learning?',
    type: 'radio',
    required: true,
    options: [
      { value: 'happy_with_tech', label: 'Yes – happy with tech-supported learning' },
      { value: 'limited',         label: 'Limited use of technology is fine' },
      { value: 'non_digital',     label: 'Non-digital learning only' },
      { value: 'unsure',          label: 'Not sure, would like to discuss' },
    ],
  },
  {
    id: 'tech_comfort_child',
    section: 1,
    label: 'How comfortable is your child with using technology?',
    type: 'radio',
    required: true,
    options: [
      { value: 'not_used',    label: 'Not really used to it' },
      { value: 'basic',       label: 'Basic (taps / swipes)' },
      { value: 'comfortable', label: 'Comfortable (apps / games)' },
      { value: 'confident',   label: 'Very confident (typing, searching, learning platforms)' },
    ],
  },
  {
    id: 'screen_boundaries',
    section: 1,
    label: 'Are there any screen boundaries that you would like us to follow?',
    type: 'text',
  },

  // ── Section 2: Goals & learning habits ─────────────────────────────────────
  {
    id: 'goals',
    section: 2,
    label: 'What best describes what you want for your child?',
    helper: 'Pick up to 3.',
    type: 'multi',
    multiMax: 3,
    hasOther: true,
    options: [
      { value: 'confidence',         label: 'Build confidence and love of learning' },
      { value: 'phonics_reading',    label: 'Strong foundations in phonics / reading' },
      { value: 'maths_foundation',   label: 'Foundation in Maths' },
      { value: 'attention_listening',label: 'Improve attention / listening / following instructions' },
      { value: 'homework_routines',  label: 'Support with homework routines' },
      { value: 'close_gaps',         label: 'Close gaps in understanding' },
      { value: 'stretch_challenge',  label: 'Stretch and challenge' },
      { value: 'eleven_plus',        label: '11+ Preparation' },
      { value: 'social_independence',label: 'Social confidence / independence' },
    ],
  },
  {
    id: 'twelve_week_vision',
    section: 2,
    label: 'If ALC is going really well after 12 weeks, what changes or improvements would you notice?',
    type: 'longtext',
  },
  {
    id: 'approach_to_tasks',
    section: 2,
    label: 'How does your child usually approach learning tasks?',
    type: 'multi',
    hasOther: true,
    options: [
      { value: 'jumps_in',          label: 'Jumps in quickly' },
      { value: 'warms_up',          label: 'Needs time to warm up' },
      { value: 'wants_help',        label: 'Wants help straight away' },
      { value: 'works_alone',       label: 'Likes to do it alone' },
      { value: 'avoids_when_hard',  label: 'Avoids if it feels hard' },
    ],
  },
  {
    id: 'focus_aids',
    section: 2,
    label: 'What helps them focus best?',
    type: 'multi',
    hasOther: true,
    options: [
      { value: 'quiet_space',    label: 'Quiet space' },
      { value: 'short_bursts',   label: 'Short bursts' },
      { value: 'movement_breaks',label: 'Movement breaks' },
      { value: 'visual_prompts', label: 'Visual prompts' },
      { value: 'hands_on',       label: 'Hands-on activities' },
      { value: 'reward_chart',   label: 'Reward chart' },
      { value: 'routine',        label: 'Routine' },
      { value: 'timer',          label: 'Timer' },
      { value: 'one_to_one',     label: '1:1 attention' },
    ],
  },
  {
    id: 'mistake_response',
    section: 2,
    label: 'When they get something wrong, they usually…',
    type: 'radio',
    hasOther: true,
    options: [
      { value: 'try_again', label: 'Try again' },
      { value: 'ask_help',  label: 'Ask for help' },
      { value: 'upset',     label: 'Get upset' },
      { value: 'angry',     label: 'Get angry' },
      { value: 'give_up',   label: 'Give up' },
      { value: 'laugh_off', label: 'Laugh it off' },
    ],
  },
  {
    id: 'anything_else',
    section: 2,
    label: 'Is there anything else you would like to share?',
    type: 'longtext',
  },
  {
    id: 'hobbies',
    section: 2,
    label: 'What does your child really enjoy or get excited about?',
    helper: 'e.g. games, hobbies, characters, topics, sports — anything goes.',
    type: 'longtext',
    emphasis: 'high',
  },
  {
    id: 'avoid_dislike',
    section: 2,
    label: 'What do they avoid or dislike?',
    type: 'longtext',
  },

  // ── Section 3: Needs & consent ─────────────────────────────────────────────
  {
    id: 'diagnosed_needs',
    section: 3,
    label: 'Does your child have any diagnosed or suspected needs?',
    type: 'multi',
    hasOther: true,
    options: [
      { value: 'none',              label: 'None' },
      { value: 'dyslexia',          label: 'Dyslexia' },
      { value: 'adhd',              label: 'ADHD' },
      { value: 'autism',            label: 'Autism / ASD' },
      { value: 'speech_language',   label: 'Speech & Language' },
      { value: 'dyspraxia',         label: 'Dyspraxia / DCD' },
      { value: 'anxiety',           label: 'Anxiety' },
    ],
  },
  {
    id: 'support_in_place',
    section: 3,
    label: 'Support currently in place',
    type: 'multi',
    hasOther: true,
    options: [
      { value: 'none',          label: 'None' },
      { value: 'school_sen',    label: 'School SEN support' },
      { value: 'iep',           label: 'IEP' },
      { value: 'external_tutor',label: 'External tutor' },
      { value: 'ot',            label: 'Occupational therapist' },
    ],
  },
  {
    id: 'medical_needs',
    section: 3,
    label: 'Medical needs / allergies',
    type: 'text',
  },
  {
    id: 'consent_notes',
    section: 3,
    label: 'Consent: ALC can keep learning notes and assessment tracking',
    type: 'radio',
    required: true,
    options: yesNo,
  },
  {
    id: 'consent_media',
    section: 3,
    label: 'Consent: photos / videos for internal learning records (not marketing)',
    type: 'radio',
    required: true,
    options: yesNo,
  },
];

/** Group questions by section for the page-1-of-3 / page-2-of-3 / page-3-of-3 progress UI. */
export const intakeSections = [1, 2, 3] as const;

export const intakeSectionTitles: Record<typeof intakeSections[number], string> = {
  1: 'About your child',
  2: 'Goals & learning habits',
  3: 'Needs & consent',
};

/** Convenience for A4 — all required field ids in document order. */
export const requiredQuestionIds: string[] = intakeQuestions
  .filter((q) => q.required)
  .map((q) => q.id);

/** Shape stored in the localStorage cache (A5) and POSTed to /api/intake (A4). */
export type IntakeAnswerValue =
  | string                 // text / longtext / date / select / radio
  | string[]               // multi
  | { value: string; other?: string }   // radio + hasOther where "other" was picked
  | { values: string[]; other?: string }; // multi + hasOther where "other" was picked

export type IntakeAnswers = Record<string, IntakeAnswerValue | undefined>;

/** Helper: pull the scalar selected value from a radio answer (handling hasOther shape). */
const radioValue = (a: IntakeAnswerValue | undefined): string | undefined => {
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && 'value' in a) return a.value;
  return undefined;
};

/** Helper: pull the array of selected values from a multi answer (handling hasOther shape). */
const multiValues = (a: IntakeAnswerValue | undefined): string[] => {
  if (Array.isArray(a)) return a;
  if (a && typeof a === 'object' && 'values' in a) return a.values;
  return [];
};

/** Returns the prospects-table indexed payload for POST /api/intake. */
export function extractIndexedFields(answers: IntakeAnswers) {
  const childName = typeof answers.child_name === 'string' ? answers.child_name.trim() : '';
  const childFirstName = childName.split(/\s+/)[0] || undefined;

  const dob = typeof answers.child_dob === 'string' ? answers.child_dob : undefined;

  const diagnosedNeeds = multiValues(answers.diagnosed_needs);
  // flagged_needs is true when the parent has selected anything other than just "None".
  const flaggedNeeds = diagnosedNeeds.some((v) => v && v !== 'none');

  return {
    child_first_name:    childFirstName,
    child_dob:           dob,
    year_group:          radioValue(answers.year_group),
    homework_in_plan:    radioValue(answers.homework_in_plan),
    tech_comfort_parent: radioValue(answers.tech_comfort_parent),
    tech_comfort_child:  radioValue(answers.tech_comfort_child),
    flagged_needs:       flaggedNeeds,
    consent_notes:       radioValue(answers.consent_notes) === 'yes',
    consent_media:       radioValue(answers.consent_media) === 'yes',
  };
}
