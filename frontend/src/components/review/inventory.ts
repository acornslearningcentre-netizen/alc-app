// Inventory of clickable areas and feature screens. Used by the Review Guide
// to point reviewers at the most demoable parts of each role's flow.
export interface ClickableArea {
  role: string;
  screen: string;
  element: string;
  observable: string;
}

export interface FeatureEntry {
  role: string;
  screen: string;
  purpose: string;
}

export const CLICKABLE_AREAS: ClickableArea[] = [
  { role: 'login', screen: 'Track', element: "I'm part of the school", observable: 'Advances to role selection for teachers and leaders.' },
  { role: 'login', screen: 'Track', element: "I'm family", observable: 'Advances to role selection for parents and students.' },
  { role: 'login', screen: 'Role', element: 'Teacher option', observable: 'Proceeds to Google Workspace / Microsoft sign-in.' },
  { role: 'login', screen: 'Auth', element: 'Continue with Google Workspace', observable: 'Logs in and lands on the teacher dashboard.' },
  { role: 'login', screen: 'Passcode (Parent)', element: 'Passcode input', observable: 'Auto-validates a 4-digit code and opens that child\u2019s view.' },
  { role: 'teacher', screen: 'Today', element: 'Capture observation', observable: 'Opens the voice-first observation recorder with child selector.' },
  { role: 'teacher', screen: 'Today', element: 'Child name in AI Brief', observable: 'Navigates straight to that child\u2019s full profile.' },
  { role: 'teacher', screen: 'Today', element: 'Recent observation row', observable: 'Opens the child profile in observation context.' },
  { role: 'teacher', screen: 'Children', element: 'Child card', observable: 'Opens the full profile for that child.' },
  { role: 'teacher', screen: 'Children', element: 'To-review filter toggle', observable: 'Filters the roster to children with flagged patterns.' },
  { role: 'teacher', screen: 'Observe', element: 'Record (mic) button', observable: 'Starts audio capture with a live waveform.' },
  { role: 'teacher', screen: 'Observe', element: 'Stop button', observable: 'Stops recording, transcribes, and suggests AI tags.' },
  { role: 'teacher', screen: 'Observe', element: 'Save observation', observable: 'Saves transcript, tags, and mood to the child\u2019s profile.' },
  { role: 'teacher', screen: 'Observe', element: 'Mood chip', observable: 'Toggles the mood tag attached to the observation.' },
  { role: 'teacher', screen: 'Observe', element: 'Remove tag (\u00d7)', observable: 'Removes an AI-suggested tag from the observation.' },
  { role: 'teacher', screen: 'Planning', element: 'Generate week plan', observable: 'Drafts AI lesson plans across the five-day week.' },
  { role: 'teacher', screen: 'Messages', element: 'Thread in list', observable: 'Opens the conversation with that parent or colleague.' },
  { role: 'teacher', screen: 'Messages', element: 'AI draft', observable: 'Generates an AI-suggested reply to the open thread.' },
  { role: 'teacher', screen: 'Messages', element: 'Use this draft', observable: 'Drops the AI draft straight into the composer.' },
  { role: 'teacher', screen: 'Messages', element: 'Send', observable: 'Sends the message to the parent or colleague.' },
  { role: 'teacher', screen: 'Assistant', element: 'Child button (sidebar)', observable: 'Switches AI context to focus on that child.' },
  { role: 'teacher', screen: 'Assistant', element: 'Preset question chips', observable: 'Asks a pre-written prompt and shows the answer with evidence.' },
  { role: 'teacher', screen: 'Assistant', element: 'Send custom question', observable: 'Submits a free-text question and returns a sourced response.' },
  { role: 'teacher', screen: 'Profile', element: 'Message parent / family', observable: 'Jumps to Messages with that guardian pre-selected.' },
  { role: 'teacher', screen: 'Profile', element: 'New observation', observable: 'Opens Observe pre-selected for this child.' },
  { role: 'teacher', screen: 'Profile', element: 'Ask about [child]', observable: 'Opens the AI assistant scoped to this child.' },
  { role: 'teacher', screen: 'Profile', element: 'Tab navigation', observable: 'Switches between Overview, Observations, Progress, and more.' },
  { role: 'teacher', screen: 'Profile', element: 'Share with SENCO', observable: 'Triggers the SENCO flag workflow for a flagged pattern.' },
  { role: 'teacher', screen: 'Profile', element: 'Add to plan', observable: 'Adds the suggested next step to tomorrow\u2019s lesson plan.' },
  { role: 'parent', screen: 'Home', element: 'Add home observation', observable: 'Opens a form to capture a moment from home.' },
  { role: 'parent', screen: 'Messages', element: 'Send', observable: 'Sends a message to the child\u2019s teacher.' },
  { role: 'parent', screen: 'Assistant', element: 'Preset question chips', observable: 'Asks a pre-written question about the child\u2019s learning.' },
  { role: 'parent', screen: 'Assistant', element: 'Send custom question', observable: 'Returns an AI answer grounded in school observations.' },
  { role: 'student', screen: 'Try Today', element: 'Activity card', observable: 'Selects an activity and shows a "Great choice" confirmation.' },
  { role: 'student', screen: 'Me', element: 'Progress sparkline', observable: 'Shows the six-week mastery trend.' },
  { role: 'student', screen: 'How I Learn', element: 'Learning tips list', observable: 'Surfaces four tips tailored to the learner\u2019s style.' },
  { role: 'student', screen: 'Growing', element: 'Next-step checkbox', observable: 'Marks a step done and strikes it through.' },
  { role: 'student', screen: 'Garden', element: 'Water it', observable: 'Waters the plant, increments growth %, and updates the emoji.' },
  { role: 'leader', screen: 'Today', element: 'Alerts badge', observable: 'Shows the count of flagged children and opens the alert list.' },
  { role: 'leader', screen: 'Today', element: 'Morning brief', observable: 'Generates an AI summary of the day\u2019s key school patterns.' },
  { role: 'leader', screen: 'Cohorts', element: 'Filter tabs', observable: 'Switches the cohort table between All, Flagged, and Low.' },
  { role: 'leader', screen: 'Teachers', element: 'View full profile', observable: 'Opens detailed staff performance and notes.' },
  { role: 'leader', screen: 'Outcomes', element: 'Export report', observable: 'Generates and downloads the term outcome report.' },
  { role: 'leader', screen: 'Patterns', element: 'Pattern card action', observable: 'Surfaces suggested actions for the detected pattern.' },
];

export const FEATURES: FeatureEntry[] = [
  { role: 'login', screen: 'Track', purpose: 'Choose between school staff or family access paths.' },
  { role: 'login', screen: 'Role', purpose: 'Select a specific role: teacher, leader, parent, or student.' },
  { role: 'login', screen: 'Auth', purpose: 'Sign in via Google Workspace, Microsoft, or a 4-digit passcode.' },
  { role: 'teacher', screen: 'Today', purpose: 'Daily dashboard: observation count, AI suggestions, focus children, recent activity.' },
  { role: 'teacher', screen: 'Children', purpose: 'Roster of all 12 children with mastery %, learning style, and flags.' },
  { role: 'teacher', screen: 'Observe', purpose: 'Voice-first capture with on-device transcription, AI tagging, and mood.' },
  { role: 'teacher', screen: 'Planning', purpose: 'Weekly lesson-plan generator with AI-drafted activities across five days.' },
  { role: 'teacher', screen: 'Progress', purpose: 'Mastery view across all children with sparklines and trend indicators.' },
  { role: 'teacher', screen: 'Messages', purpose: 'Two-way messaging with parents and colleagues, with AI-assisted drafting.' },
  { role: 'teacher', screen: 'Assistant', purpose: 'Private AI coach answering questions about class patterns or single children.' },
  { role: 'teacher', screen: 'Profile', purpose: 'Deep child profile: AI summary, observations, progress, next steps, comms.' },
  { role: 'parent', screen: 'Home', purpose: 'Dashboard: child mastery, attendance, recent observations, home support ideas.' },
  { role: 'parent', screen: 'Messages', purpose: 'Messaging thread with the child\u2019s teacher.' },
  { role: 'parent', screen: 'Assistant', purpose: 'AI answers about the child\u2019s learning, grounded in school observations.' },
  { role: 'student', screen: 'Try Today', purpose: 'Activity recommendations tuned to learning style and teacher suggestions.' },
  { role: 'student', screen: 'Me', purpose: 'Personal dashboard: mastery, streak, attendance, strengths, badges.' },
  { role: 'student', screen: 'How I Learn', purpose: 'Learning-style profile with personalised tips.' },
  { role: 'student', screen: 'Growing', purpose: 'Next-steps checklist and a learning map of strengths and growth areas.' },
  { role: 'student', screen: 'Garden', purpose: 'Metaphor for learning growth with an interactive plant-watering mechanic.' },
  { role: 'leader', screen: 'Today', purpose: 'School overview: enrolment, mastery, attendance, school-wide patterns, flags.' },
  { role: 'leader', screen: 'Cohorts', purpose: 'Whole-school cohort table with filters for mastery, attendance, and flags.' },
  { role: 'leader', screen: 'Teachers', purpose: 'Staff patterns: observation counts, cohort mastery, and notes.' },
  { role: 'leader', screen: 'Outcomes', purpose: 'Term-over-term results by curriculum strand with cohort distribution.' },
  { role: 'leader', screen: 'Patterns', purpose: 'AI-detected school-wide trends with severity and suggested actions.' },
];
