/** Tone colours used for child avatar / card theming */
export type Tone = 'sage' | 'ochre' | 'plum' | 'sky';

/** App role discriminated union */
export type Role = 'teacher' | 'parent' | 'student' | 'leader';

/** Visual variant */
export type Variant = 'calm' | 'playful';

/** Trend direction */
export type TrendDir = 'up' | 'down' | 'flat' | 'steady';

/** Relationship of a parent/carer to a child */
export type ParentRelation =
  | 'Mum' | 'Dad'
  | 'Mama' | 'Papa'
  | 'Step-dad' | 'Step-mum'
  | 'Guardian' | 'Carer' | 'Foster parent'
  | 'Grandma' | 'Grandpa' | 'Grandparent'
  | 'Aunt' | 'Uncle';

/** A single parent/carer entry. Each child has 1–2. */
export interface Parent {
  name: string;
  relation: ParentRelation;
}

/** A child in the classroom */
export interface Child {
  id: string;
  name: string;
  age: number;
  initials: string;
  tone: Tone;
  teacher: string;
  /** Primary contact name. Derived from parents[0] for backward-compat with older screens. */
  guardian: string;
  /** Full family contact list (1 or 2 entries) — drives the Message-parent picker. */
  parents: Parent[];
  pronoun: 'he' | 'she' | 'they';
  focus: string[];
  strengths: string[];
  gaps: string[];
  style: string;
  streak: number;
  attendance: number;
  mastery: number;
  trend: TrendDir;
  flags?: string[];
}

/** A single observation note */
export interface Observation {
  id: string;
  childId: string;
  author: string;
  role: 'teacher' | 'parent';
  time: string;
  text: string;
  tags: string[];
  mood: string;
}

/** A next-step action for a child */
export interface NextStep {
  type: string;
  title: string;
  rationale: string;
  time: string;
}

/** Parent passcode entry */
export interface PasscodeEntry {
  childId: string;
  parentName: string;
  childName: string;
}

/** Student passcode entry — directly maps a code to a child's own profile */
export interface StudentPasscodeEntry {
  childId: string;
  childName: string;
}

/** Status of an AI-drafted lesson plan for one student */
export type PlanStatus = 'accepted' | 'edited' | 'pending';

/** One student's slice of a lesson plan */
export interface StudentLessonPlan {
  childId: string;
  status: PlanStatus;
  activity: string;
  note?: string;
}

/** A single planned lesson, with a per-student breakdown */
export interface LessonPlan {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  time: string;
  subject: string;
  title: string;
  summary: string;
  students: StudentLessonPlan[];
}

/** Root data shape */
export interface ALCData {
  children: Child[];
  observations: Observation[];
  nextSteps: Record<string, NextStep[]>;
  lessonPlans: LessonPlan[];
  parentPasscodes: Record<string, PasscodeEntry>;
  studentPasscodes: Record<string, StudentPasscodeEntry>;
}
