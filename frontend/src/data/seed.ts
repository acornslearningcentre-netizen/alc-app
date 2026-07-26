import type { ALCData } from './types';

/** Verbatim port of design-reference/project/data.js */
export const ALC_DATA: ALCData = {
  children: [
    // Family dynamics intentionally vary across the class — single parents, two-parent families,
    // same-sex couples, guardians, and step-parents. Each child has 1 or 2 contacts.
    { id: 'c1',  name: 'Amara Osei',      age: 5, initials: 'AO', tone: 'sage',  teacher: 'Ms. Pereira', guardian: 'Nia Osei',       parents: [{ name: 'Nia Osei',       relation: 'Mum' }, { name: 'Kwame Osei', relation: 'Dad' }],       pronoun: 'she', focus: ['Sensorial', 'Practical Life'],   strengths: ['Spatial reasoning', 'Peer mentoring'], gaps: ['Pencil grip stamina'],         style: 'Kinaesthetic', streak: 4, attendance: 96, mastery: 72, trend: 'up' },
    { id: 'c2',  name: 'Leo Vance',       age: 4, initials: 'LV', tone: 'ochre', teacher: 'Ms. Pereira', guardian: 'Tom Vance',      parents: [{ name: 'Tom Vance',      relation: 'Dad' }],                                                    pronoun: 'he',  focus: ['Language', 'Sensorial'],         strengths: ['Phonemic awareness'],                 gaps: ['Sustained attention (>8 min)'], style: 'Auditory',    streak: 2, attendance: 88, mastery: 58, trend: 'up', flags: ['attention-pattern'] },
    { id: 'c3',  name: 'Mei Tanaka',      age: 5, initials: 'MT', tone: 'plum',  teacher: 'Ms. Pereira', guardian: 'Haruki Tanaka',  parents: [{ name: 'Haruki Tanaka',  relation: 'Dad' }, { name: 'Yuki Tanaka',  relation: 'Mum' }],       pronoun: 'she', focus: ['Mathematics'],                   strengths: ['Number sense', 'Pattern recognition'],gaps: ['Verbal explanation'],            style: 'Visual',      streak: 6, attendance: 98, mastery: 81, trend: 'up' },
    { id: 'c4',  name: 'Noah Bright',     age: 4, initials: 'NB', tone: 'sky',   teacher: 'Ms. Pereira', guardian: 'Elena Bright',   parents: [{ name: 'Elena Bright',   relation: 'Mum' }, { name: 'Marie Bright', relation: 'Grandma' }],       pronoun: 'he',  focus: ['Practical Life'],                strengths: ['Independence', 'Care of environment'],gaps: ['Group transitions'],             style: 'Kinaesthetic', streak: 3, attendance: 92, mastery: 65, trend: 'flat' },
    { id: 'c5',  name: 'Priya Shah',      age: 5, initials: 'PS', tone: 'sage',  teacher: 'Ms. Pereira', guardian: 'Ravi Shah',      parents: [{ name: 'Ravi Shah',      relation: 'Dad' }, { name: 'Anika Shah',  relation: 'Mum' }],        pronoun: 'she', focus: ['Language', 'Cultural'],          strengths: ['Storytelling', 'Empathy'],            gaps: ['Letter formation'],              style: 'Auditory',    streak: 5, attendance: 94, mastery: 74, trend: 'up' },
    { id: 'c6',  name: 'Theo Adebayo',    age: 4, initials: 'TA', tone: 'ochre', teacher: 'Ms. Pereira', guardian: 'Ifeoma Adebayo', parents: [{ name: 'Ifeoma Adebayo', relation: 'Grandma' }],                                               pronoun: 'he',  focus: ['Mathematics', 'Sensorial'],      strengths: ['Construction play'],                  gaps: ['Counting beyond 20'],            style: 'Visual',      streak: 2, attendance: 90, mastery: 60, trend: 'up' },
    { id: 'c7',  name: 'Isla Mitchell',   age: 5, initials: 'IM', tone: 'plum',  teacher: 'Ms. Pereira', guardian: 'Kate Mitchell',  parents: [{ name: 'Kate Mitchell',  relation: 'Mum' }, { name: 'James Mitchell', relation: 'Dad' }],      pronoun: 'she', focus: ['Cultural'],                      strengths: ['Curiosity', 'Map work'],              gaps: ['Turn-taking'],                   style: 'Kinaesthetic', streak: 1, attendance: 86, mastery: 67, trend: 'down', flags: ['mood-shift'] },
    { id: 'c8',  name: 'Rafael Costa',    age: 4, initials: 'RC', tone: 'sky',   teacher: 'Ms. Pereira', guardian: 'Joana Costa',    parents: [{ name: 'Joana Costa',    relation: 'Mum' }, { name: 'Marco Silva',   relation: 'Step-dad' }],  pronoun: 'he',  focus: ['Language'],                      strengths: ['Bilingual vocabulary'],               gaps: ['Expressive writing'],            style: 'Auditory',    streak: 4, attendance: 95, mastery: 70, trend: 'up' },
    { id: 'c9',  name: 'Zara Khan',       age: 5, initials: 'ZK', tone: 'sage',  teacher: 'Ms. Pereira', guardian: 'Asim Khan',      parents: [{ name: 'Asim Khan',      relation: 'Dad' }, { name: 'Sadia Khan',   relation: 'Mum' }],       pronoun: 'she', focus: ['Mathematics'],                   strengths: ['Logic puzzles'],                      gaps: ['Sharing materials'],             style: 'Visual',      streak: 3, attendance: 91, mastery: 76, trend: 'flat' },
    { id: 'c10', name: 'Oscar Lindqvist', age: 4, initials: 'OL', tone: 'ochre', teacher: 'Ms. Pereira', guardian: 'Freja Lindqvist', parents: [{ name: 'Freja Lindqvist', relation: 'Mama' }, { name: 'Ana Lindqvist', relation: 'Mum' }],    pronoun: 'he',  focus: ['Sensorial'],                     strengths: ['Texture discrimination'],             gaps: ['Waiting'],                       style: 'Kinaesthetic', streak: 2, attendance: 89, mastery: 55, trend: 'up' },
    { id: 'c11', name: 'Sena Aydin',      age: 5, initials: 'SA', tone: 'plum',  teacher: 'Ms. Pereira', guardian: 'Deniz Aydin',    parents: [{ name: 'Deniz Aydin',    relation: 'Dad' }, { name: 'Meryem Aydin', relation: 'Grandma' }],      pronoun: 'she', focus: ['Practical Life', 'Cultural'],    strengths: ['Leadership'],                         gaps: ['Fine motor precision'],          style: 'Auditory',    streak: 7, attendance: 99, mastery: 84, trend: 'up' },
    { id: 'c12', name: 'Jonah Weiss',     age: 4, initials: 'JW', tone: 'sky',   teacher: 'Ms. Pereira', guardian: 'Rachel Weiss',   parents: [{ name: 'Rachel Weiss',   relation: 'Mum' }, { name: 'David Weiss',  relation: 'Dad' }],       pronoun: 'he',  focus: ['Language'],                      strengths: ['Story recall'],                       gaps: ['Sound blending'],                style: 'Visual',      streak: 3, attendance: 93, mastery: 63, trend: 'flat' },
  ],

  observations: [
    { id: 'o1', childId: 'c1', author: 'Ms. Pereira', role: 'teacher', time: 'Today · 10:42', text: 'Amara set up the Pink Tower unprompted and showed Theo how to grade by size. Stayed with it for 18 minutes.', tags: ['Sensorial', 'Peer mentoring', 'Focus'], mood: 'engaged' },
    { id: 'o2', childId: 'c2', author: 'Ms. Pereira', role: 'teacher', time: 'Today · 09:18', text: 'Leo started moveable alphabet work but abandoned it after three words. Noticed fidgeting right after snack — possible sugar dip?', tags: ['Language', 'Attention'], mood: 'restless' },
    { id: 'o3', childId: 'c2', author: 'Tom Vance', role: 'parent', time: 'Yesterday · 19:30', text: 'Leo asked to read the same book three times at bedtime. Got frustrated when I tried to shorten it.', tags: ['Language', 'Home'], mood: 'curious' },
    { id: 'o4', childId: 'c3', author: 'Ms. Pereira', role: 'teacher', time: 'Today · 11:05', text: 'Mei completed the Golden Beads 1000-chain independently. Could not yet explain her steps out loud when asked.', tags: ['Mathematics', 'Mastery'], mood: 'focused' },
    { id: 'o5', childId: 'c7', author: 'Ms. Pereira', role: 'teacher', time: 'Today · 13:20', text: 'Isla withdrew during group time. Head down, not engaging. This is the third Monday in a row — worth noting.', tags: ['Social', 'Mood', 'Pattern'], mood: 'withdrawn' },
    { id: 'o6', childId: 'c11', author: 'Ms. Pereira', role: 'teacher', time: 'Today · 14:00', text: 'Sena organised the cleanup of the practical life shelf and delegated tasks to two younger children. Beautiful leadership.', tags: ['Practical Life', 'Leadership'], mood: 'confident' },
    { id: 'o7', childId: 'c5', author: 'Ms. Pereira', role: 'teacher', time: 'Today · 11:40', text: 'Priya told a 4-minute story using the story stones. Vocabulary included "whisper", "enormous", "glimmer".', tags: ['Language', 'Storytelling'], mood: 'expressive' },
  ],

  nextSteps: {
    c1: [
      { type: 'Lesson', title: 'Introduce Geometric Cabinet — triangles', rationale: 'Builds on spatial reasoning already shown with Pink Tower.', time: '15 min' },
      { type: 'Extension', title: 'Pair with Theo for shape hunt', rationale: 'Leverages mentoring instinct. Reinforces both children.', time: '10 min' },
      { type: 'Home', title: 'Baking by volume (parent note)', rationale: 'Kinaesthetic maths at home — sent to Nia.', time: '—' },
    ],
    c2: [
      { type: 'Lesson', title: 'Sandpaper Letters, 3-period lesson (3 letters max)', rationale: 'Shorter cycle matches current attention window.', time: '6 min' },
      { type: 'Environment', title: 'Move work to quieter alcove after snack', rationale: 'Test whether location + timing affects sustained attention.', time: '—' },
      { type: 'Observe', title: 'Track attention span for 5 days', rationale: 'Ms. Pereira + SENCO to review pattern Friday.', time: '—' },
    ],
  },

  // Upcoming session, by lesson. Each lesson carries its own per-student
  // breakdown — continuity with observations/nextSteps above is deliberate
  // (e.g. the Amara/Theo pairing, Leo's shortened cycle, Isla's withdrawal).
  lessonPlans: [
    { id: 'l-mon-lang', day: 'Mon', time: '09:15', subject: 'Language', title: 'Sandpaper Letters & Story Stones',
      summary: 'Shortened cycles for attention-sensitive learners; story-stone extension for fluent readers.',
      students: [
        { childId: 'c2', status: 'edited', activity: 'Sandpaper Letters, 3-period lesson (3 letters max)', note: 'Shortened cycle matches current attention window — moved from 5 to 3 letters after last week\'s observation.' },
        { childId: 'c5', status: 'accepted', activity: 'Story stones — narrative sequencing', note: 'Extends her storytelling streak; new stretch vocabulary added.' },
        { childId: 'c8', status: 'pending', activity: 'Bilingual vocabulary matching cards', note: 'Drafted to pair her home-language strength with the expressive-writing gap — awaiting your review.' },
        { childId: 'c12', status: 'accepted', activity: 'Sound blending — onset and rime cards', note: 'Targets sound-blending gap directly.' },
      ] },
    { id: 'l-mon-sens', day: 'Mon', time: '10:00', subject: 'Sensorial', title: 'Pink Tower & Geometric Cabinet',
      summary: 'Peer-mentoring pair; texture work with a turn-taking timer.',
      students: [
        { childId: 'c1', status: 'accepted', activity: 'Pink Tower — grading by size, paired mentor', note: 'Pairing with Theo again — mentoring instinct showed up twice last week.' },
        { childId: 'c6', status: 'accepted', activity: 'Geometric Cabinet — triangles, mentored by Amara' },
        { childId: 'c10', status: 'edited', activity: 'Texture boards — fine discrimination with turn-taking timer', note: 'Added a visible timer to practise waiting.' },
      ] },
    { id: 'l-mon-math', day: 'Mon', time: '11:00', subject: 'Mathematics', title: 'Golden Beads & Spindle Box',
      summary: 'Independent 1000-chain for confident counters; quantity-to-symbol bridge for emerging counters.',
      students: [
        { childId: 'c3', status: 'pending', activity: 'Golden Beads — 1000 chain, independent', note: 'Completes the sequence but can\'t yet explain steps aloud — AI suggests pairing with a narration prompt card.' },
        { childId: 'c9', status: 'accepted', activity: 'Logic puzzle extension — pattern sets' },
        { childId: 'c6', status: 'edited', activity: 'Spindle box — counting to 20', note: 'Capped at 20 rather than the original 30 to match his current range.' },
      ] },
    { id: 'l-mon-outdoor', day: 'Mon', time: '13:30', subject: 'Outdoor', title: 'Nature Walk — Leaf Sorting',
      summary: 'Whole-group sensory walk with a leadership role and a quiet-observation option.',
      students: [
        { childId: 'c11', status: 'accepted', activity: 'Leads the sorting hoops — leadership role', note: 'Following her practical-life shelf leadership from last week.' },
        { childId: 'c7', status: 'pending', activity: 'Quiet observation corner — leaf rubbing, no group pressure', note: 'Third Monday withdrawal noted — offering an opt-out activity rather than mandatory group participation.' },
        { childId: 'c4', status: 'accepted', activity: 'Care-of-environment role — collecting baskets' },
      ] },

    { id: 'l-tue-lang', day: 'Tue', time: '09:15', subject: 'Language', title: 'Moveable Alphabet — Word Building',
      summary: 'Word-building rotation for emerging writers; a smaller stretch for confident readers.',
      students: [
        { childId: 'c12', status: 'accepted', activity: 'Moveable alphabet — CVC word building' },
        { childId: 'c8', status: 'edited', activity: 'Expressive writing — picture + one sentence', note: 'Reduced from two sentences to one to build a quick win before stretching further.' },
        { childId: 'c5', status: 'accepted', activity: 'Letter formation tracing — sand tray' },
      ] },
    { id: 'l-tue-sens', day: 'Tue', time: '10:00', subject: 'Sensorial', title: 'Sound Cylinders & Knobbed Cylinders',
      summary: 'Pitch-matching pairs; thickest-to-thinnest sequencing.',
      students: [
        { childId: 'c10', status: 'accepted', activity: 'Sound cylinders — pitch matching pairs' },
        { childId: 'c1', status: 'accepted', activity: 'Knobbed cylinders — thickest to thinnest' },
        { childId: 'c6', status: 'pending', activity: 'Construction-play extension — block estimation', note: 'Drafted to bridge his construction-play strength into measurement language.' },
      ] },
    { id: 'l-tue-math', day: 'Tue', time: '11:00', subject: 'Mathematics', title: 'Number Rods & Addition Snake',
      summary: 'Sequencing rods; bead-bar conversion with a narration partner.',
      students: [
        { childId: 'c9', status: 'accepted', activity: 'Number rods — sequencing 1–10' },
        { childId: 'c3', status: 'edited', activity: 'Addition snake game — bead bar conversion', note: 'Added a partner so she can narrate steps out loud, per Monday\'s note.' },
        { childId: 'c6', status: 'accepted', activity: 'Spindle box — counting to 20, day 2' },
      ] },
    { id: 'l-tue-outdoor', day: 'Tue', time: '13:30', subject: 'Outdoor', title: 'Balance Beam Circuit',
      summary: 'Independent and partnered beam work; a second leadership role.',
      students: [
        { childId: 'c4', status: 'accepted', activity: 'Balance beam — independent run' },
        { childId: 'c7', status: 'accepted', activity: 'Balance beam — partnered with Ms. Pereira', note: 'Easing back into group activity after yesterday\'s solo option.' },
        { childId: 'c11', status: 'pending', activity: 'Circuit marshal role', note: 'Second leadership role this week — worth watching for over-reliance on her.' },
      ] },

    { id: 'l-wed-lang', day: 'Wed', time: '09:15', subject: 'Language', title: 'Story Stones — Sequencing',
      summary: 'Five-scene narrative extension; round two of letter and vocabulary work.',
      students: [
        { childId: 'c5', status: 'accepted', activity: 'Story stones — five-scene narrative' },
        { childId: 'c2', status: 'accepted', activity: 'Sandpaper letters, 3 letters, day 3' },
        { childId: 'c8', status: 'pending', activity: 'Bilingual vocabulary cards, round 2' },
      ] },
    { id: 'l-wed-sens', day: 'Wed', time: '10:00', subject: 'Sensorial', title: 'Geometric Cabinet — Circles',
      summary: 'New shape set; texture work without the timer; a new mentoring pair.',
      students: [
        { childId: 'c6', status: 'accepted', activity: 'Geometric Cabinet — circles' },
        { childId: 'c10', status: 'edited', activity: 'Texture boards, no timer today', note: 'Removed the timer — turn-taking improved without it on Monday.' },
        { childId: 'c1', status: 'accepted', activity: 'Peer-mentor rotation — new partner (Noah)' },
      ] },
    { id: 'l-wed-math', day: 'Wed', time: '11:00', subject: 'Mathematics', title: 'Golden Beads — Hierarchy Review',
      summary: 'Narration-card follow-up; a harder logic set; first spindle-box introduction.',
      students: [
        { childId: 'c3', status: 'accepted', activity: 'Golden Beads — narration prompt card', note: 'Following up on Monday\'s pairing suggestion.' },
        { childId: 'c9', status: 'accepted', activity: 'Logic puzzle, harder set' },
        { childId: 'c12', status: 'pending', activity: 'Quantity to symbol — spindle box intro' },
      ] },
    { id: 'l-wed-outdoor', day: 'Wed', time: '13:30', subject: 'Outdoor', title: 'Gardening Rotation',
      summary: 'Watering lead and support roles; an opt-in sensory tray for the group.',
      students: [
        { childId: 'c4', status: 'accepted', activity: 'Watering rotation — lead role' },
        { childId: 'c11', status: 'accepted', activity: 'Watering rotation — supports Noah' },
        { childId: 'c7', status: 'accepted', activity: 'Gardening — soil sensory tray, opt-in group' },
      ] },

    { id: 'l-thu-lang', day: 'Thu', time: '09:15', subject: 'Language', title: 'Phonemic Blending Cards',
      summary: 'Consistency check at 3 sounds before extending; free storytelling with no prompts.',
      students: [
        { childId: 'c2', status: 'edited', activity: 'Blending cards, 3 sounds only', note: 'Held at 3 sounds — same window as Monday, checking for consistency before extending.' },
        { childId: 'c12', status: 'accepted', activity: 'Blending cards, 4 sounds' },
        { childId: 'c5', status: 'accepted', activity: 'Free storytelling — story stones, no prompts' },
      ] },
    { id: 'l-thu-sens', day: 'Thu', time: '10:00', subject: 'Sensorial', title: 'Pink Tower — Independent Grading',
      summary: 'Fully independent grading; a higher-challenge texture variant.',
      students: [
        { childId: 'c1', status: 'accepted', activity: 'Pink Tower, fully independent' },
        { childId: 'c6', status: 'accepted', activity: 'Geometric Cabinet, mixed shapes' },
        { childId: 'c10', status: 'pending', activity: 'Texture boards — blindfold matching', note: 'Higher-challenge variant drafted off the back of two strong Mon/Wed sessions.' },
      ] },
    { id: 'l-thu-math', day: 'Thu', time: '11:00', subject: 'Mathematics', title: 'Addition Snake — Group Game',
      summary: 'Small-group snake game; second day of narrating aloud; an extended counting range.',
      students: [
        { childId: 'c9', status: 'accepted', activity: 'Addition snake, small group' },
        { childId: 'c3', status: 'accepted', activity: 'Addition snake, narrating aloud', note: 'Second day narrating — listen for a fluency change.' },
        { childId: 'c6', status: 'edited', activity: 'Spindle box, counting to 25', note: 'Extended range by 5 after two clean days at 20.' },
      ] },
    { id: 'l-thu-outdoor', day: 'Thu', time: '13:30', subject: 'Outdoor', title: 'Group Ball Games',
      summary: 'Turn-taking caller role; sideline option held open; a team-captain turn.',
      students: [
        { childId: 'c4', status: 'accepted', activity: 'Ball games — turn-taking caller' },
        { childId: 'c7', status: 'pending', activity: 'Ball games — sideline option kept open', note: 'Still offering an opt-out; reassess on Friday.' },
        { childId: 'c11', status: 'accepted', activity: 'Ball games — team captain' },
      ] },

    { id: 'l-fri-lang', day: 'Fri', time: '09:15', subject: 'Language', title: 'Review & Showcase — Language',
      summary: 'Week-in-review for letter work; a vocabulary share-out; a storytelling showcase.',
      students: [
        { childId: 'c2', status: 'pending', activity: 'Sandpaper letters — review of the week', note: 'AI suggests reviewing all 3 letters together for the first time.' },
        { childId: 'c8', status: 'accepted', activity: 'Bilingual vocabulary — share-out to class' },
        { childId: 'c5', status: 'accepted', activity: 'Storytelling showcase — story stones' },
      ] },
    { id: 'l-fri-sens', day: 'Fri', time: '10:00', subject: 'Sensorial', title: 'Review & Showcase — Sensorial',
      summary: 'A full role reversal; a repeat of the blindfold challenge; unprompted shape naming.',
      students: [
        { childId: 'c1', status: 'accepted', activity: 'Pink Tower — teaches Theo independently', note: 'Full role reversal — Amara leads the lesson.' },
        { childId: 'c10', status: 'accepted', activity: 'Texture boards — blindfold matching, repeat' },
        { childId: 'c6', status: 'accepted', activity: 'Geometric Cabinet — names all shapes unprompted' },
      ] },
    { id: 'l-fri-math', day: 'Fri', time: '11:00', subject: 'Mathematics', title: 'Review & Showcase — Mathematics',
      summary: 'The narration goal lands; a peer-designed puzzle; a second day at the extended range.',
      students: [
        { childId: 'c3', status: 'accepted', activity: 'Golden Beads — explains steps aloud unprompted', note: 'This is the goal from Monday — flag for the end-of-week note home.' },
        { childId: 'c9', status: 'accepted', activity: 'Logic puzzles — designs one for a peer' },
        { childId: 'c6', status: 'pending', activity: 'Spindle box, counting to 25, day 2' },
      ] },
    { id: 'l-fri-outdoor', day: 'Fri', time: '13:30', subject: 'Outdoor', title: 'Nature Walk — Week Wrap',
      summary: 'A first full-group return; a leadership recap; an independent pack-away.',
      students: [
        { childId: 'c7', status: 'accepted', activity: 'Nature walk — rejoins full group', note: 'First full-group outdoor session this week — small win.' },
        { childId: 'c11', status: 'accepted', activity: 'Leads leaf-sorting recap' },
        { childId: 'c4', status: 'accepted', activity: 'Care-of-environment — packs away independently' },
      ] },
  ],

  // Simple demo passcodes. Each unlocks exactly one child profile.
  parentPasscodes: {
    '0000': { childId: 'c5', parentName: 'Ravi Shah', childName: 'Priya' },
  },

  studentPasscodes: {
    '0000': { childId: 'c1', childName: 'Amara' },
    '1111': { childId: 'c3', childName: 'Mei' },
  },
};
