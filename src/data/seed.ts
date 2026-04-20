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

  // Simple demo passcodes. Each unlocks exactly one child profile.
  parentPasscodes: {
    '0000': { childId: 'c5', parentName: 'Ravi Shah', childName: 'Priya' },
  },

  studentPasscodes: {
    '0000': { childId: 'c1', childName: 'Amara' },
    '1111': { childId: 'c3', childName: 'Mei' },
  },
};
