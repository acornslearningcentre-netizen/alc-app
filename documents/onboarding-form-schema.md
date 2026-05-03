# Onboarding Intake Form — "Your Child at ALC: Learning and Goals"

**Source:** the live Google Form Aishat currently sends to new parents.
**Used by:** Epic A (Public intake form) — directly feeds Story A1 (Form schema in `src/data/intake-questions.ts`).

> *"Thanks for taking a few minutes to tell us about your child. Your answers help us understand their learning habits, interests, and any areas they need support with, so we can personalise sessions from day one. This form takes around 10 minutes."*

The form is split into 3 sections. Field types map cleanly to A2's "single-question screen" component:
`text`, `longtext`, `date`, `select` (single), `multi` (checkbox), `radio`.

`*` marks required fields.

---

## Section 1 — About your child (Page 1 of 3)

| # | Question | Type | Options / Notes | Req |
|---|----------|------|-----------------|-----|
| 1 | Child's name | `text` | — | * |
| 2 | Date of birth | `date` | dd/mm/yyyy | * |
| 3 | Year group / age group | `select` | Reception, Year 1, Year 2, Year 3, Year 4, Year 5, Year 6 | * |
| 4 | Name of school / education setting | `text` | — | |
| 5 | Has anything changed recently that we should be aware of? | `longtext` | helper: *e.g. changes at home or school* | |
| 6 | Would you like homework to be included with your child's tuition plan? | `radio` | Yes, No, Maybe | * |
| 7 | How much home practice is realistic for you? | `radio` | Up to 30 mins/wk, 30–60 mins/wk, 1–2 hrs/wk, 2+ hrs/wk, Other | |
| 8 | Are you comfortable with ALC using technology as part of learning? | `radio` | Yes – happy with tech-supported learning, Limited use of technology is fine, Non-digital learning only, Not sure, would like to discuss | * |
| 9 | How comfortable is your child with using technology? | `radio` | Not really used to it, Basic (taps/swipes), Comfortable (apps/games), Very confident (typing, searching, learning platforms) | * |
| 10 | Are there any screen boundaries that you would like us to follow? | `text` | — | |

## Section 2 — Goals & learning habits (Page 2 of 3)

| # | Question | Type | Options / Notes | Req |
|---|----------|------|-----------------|-----|
| 11 | What best describes what you want for your child? | `multi` (max 3) | Build confidence and love of learning · Strong foundations in phonics/reading · Foundation in Maths · Improve attention / listening / following instructions · Support with homework routines · Close gaps in understanding · Stretch and challenge · 11+ Preparation · Social Confidence / independence · Other | |
| 12 | If ALC is going really well after 12 weeks, what changes or improvements would you notice? | `longtext` | — | |
| 13 | How does your child usually approach learning tasks? | `multi` | Jumps in quickly · Needs time to warm up · Wants help straight away · Likes to do it alone · Avoids if it feels hard · Other | |
| 14 | What helps them focus best? | `multi` | Quiet space · Short bursts · Movement breaks · Visual prompts · Hands-on activities · Reward chart · Routine · Timer · 1:1 Attention · Other | |
| 15 | When they get something wrong, they usually… | `radio` | Try again · Ask for help · Get upset · Get angry · Give up · Laugh it off · Other | |
| 16 | Is there anything else you would like to share? | `longtext` | — | |
| 17 | **What does your child really enjoy or get excited about?** | `longtext` | helper: *e.g. games, hobbies, characters, topics, sports etc.* — **Aishat: "this one I find quite actually the most important question."** | |
| 18 | What do they avoid or dislike? | `longtext` | — | |

## Section 3 — Needs & consent (Page 3 of 3)

| # | Question | Type | Options / Notes | Req |
|---|----------|------|-----------------|-----|
| 19 | Does your child have any diagnosed or suspected needs? | `multi` | None · Dyslexia · ADHD · Autism/ASD · Speech & Language · Dyspraxia/DCD · Anxiety · Other | |
| 20 | Support currently in place | `multi` | None · School SEN support · IEP · External Tutor · Occupational Therapist · Other | |
| 21 | Medical needs / allergies | `text` | — | |
| 22 | Consent: ALC can keep learning notes & assessment tracking | `radio` | Yes, No | * |
| 23 | Consent: photos/videos for internal learning records (not marketing) | `radio` | Yes, No | * |

---

## Implementation notes for Story A1 (`src/data/intake-questions.ts`)

```ts
export type IntakeFieldType =
  | 'text' | 'longtext' | 'date'
  | 'select' | 'radio' | 'multi';

export interface IntakeOption {
  value: string;
  label: string;
}

export interface IntakeField {
  id: string;                         // stable key for storage
  section: 1 | 2 | 3;
  label: string;
  helper?: string;                    // small text below label
  type: IntakeFieldType;
  required?: boolean;
  options?: IntakeOption[];           // for select / radio / multi
  multiMax?: number;                  // 11 caps at 3
  hasOther?: boolean;                 // free-text "Other" alongside multi/radio
  emphasis?: 'high';                  // mark Q17 (hobbies) as the highest-signal question
}
```

Two principles to honour from the meeting:

1. **Hobbies (Q17) is the single most informative question.** The schema flags it with `emphasis: 'high'`, and the AI report draft prompt should weight it heavily.
2. **The form has a dual purpose** — collect data AND align the parent on what Acorns thinks matters. The single-question-per-screen UI should *use* this — every screen is a quiet moment of reflection, not a checkbox to plough through.

## Mapping to the prospect record

When the form submits, the backend (Epic B) creates one `prospects` row plus one `intake_responses` row. The high-signal answers also seed indexed columns on `prospects` for fast filtering in the owner queue:

| `prospects` column | Sourced from |
|--------------------|--------------|
| `parent_email` | (form-level — collected by the auth/email step) |
| `child_first_name` | Q1 — first token of "Child's name" |
| `child_age` | Q2 — derived from DOB |
| `year_group` | Q3 |
| `homework_in_plan` | Q6 |
| `tech_comfort_parent` | Q8 |
| `tech_comfort_child` | Q9 |
| `flagged_needs` | Q19 (boolean: any non-None checked) |
| `consent_notes` | Q22 |
| `consent_media` | Q23 |

Everything else lives in `intake_responses.answers` as JSON for downstream prompts.
