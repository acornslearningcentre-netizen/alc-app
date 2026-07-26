# Onboarding flow — design prompt

Paste-ready prompt for Claude design (or any high-fidelity AI design tool —
Magic Patterns, v0, Vercel artifacts, etc.). Built only from project-level
context — brand, mission, audience, design system, working agreements —
not from the existing onboarding spec, so the tool can design the flow
from first principles.

---

## Brief

**Acorns Learning Centre (ALC)** is a small Montessori-style tuition centre run by Aishat, an experienced Montessori practitioner. ALC works with children in Reception through Year 6 (UK ages 4–11) on reading, maths, and confidence-building, in small group sessions that wrap existing learning tools (IXL, Century, Discovery Education) with personalised observation-led teaching.

The product **is not an AI that teaches.** It's an app that helps Aishat and her teachers do their existing work better — capturing what they observe in sessions, drafting reports, and tailoring plans for each child. Every artefact a parent ever sees is signed off by Aishat herself.

We're designing the **first impression a new family has of ALC** — the welcome flow that runs from the moment a parent lands on our site to the moment they've handed us enough information to design a tailored 2-hour assessment session for their child.

The flow is **parent-facing only.** It must do two things at once:

1. **Gather what Aishat needs** to personalise the child's first session — the child's interests, learning patterns, anything diagnosed, the parents' goals.
2. **Prove ALC takes the child seriously.** A parent enrolling their 7-year-old in tuition has often tried other things, is anxious, and is comparing us to "yet another tutoring service". The flow's job is partly to gather data and partly to *demonstrate* — through the calm, attentive way it asks each question — that we're not a generic tutor.

## Who's filling this in

A parent of a 4–11-year-old, often on a phone, often during a brief window between work and the school run. They are not technical. They want:

- To finish in **about 10 minutes** without feeling rushed.
- To **feel heard** rather than processed.
- To be able to **come back later** if they get interrupted.
- To know exactly **what happens next** before they hit submit.

They have **no account, no password.** The flow itself is the entire experience.

## Brand & design system — "Watercolor Glass"

Frosted vellum cards floating on a warm watercolor wash. Soft, rounded, atmospheric. Humane school energy with premium tactility. Distinct from any SaaS dashboard.

**Tone:** calm, confident, observation-led. Never "fun" in a cheerleading way; never "professional" in a corporate way. Imagine a Montessori classroom turned into a UI — things have their own pace, the language is warm but precise, nothing demands attention.

### Palette

- **Canvas** `#F2EBDD` — warm cream base
- **Vellum** `rgba(251, 247, 236, 0.62)` — frosted glass surface, with `backdrop-filter: blur(14px) saturate(140%)`
- **Vellum solid** `#FAF6EB` — opaque fallback
- **Ink** `#1A1F1B` — primary text (off-black with a green undertone; **never** pure `#000000`)
- **Mist** `#5C5A55` — secondary text
- **Pencil** `#8E8B85` — tertiary text, captions
- **Hairline** `rgba(26,31,27,0.08)` — borders
- **Moss** `#3F5C44` — the *single* accent. CTAs, focus rings, links.
- **Terra** `#B85D38` — reserved state colour. Errors and warnings only — not decorative.
- **Background watercolor wash** — Sage `#9FB39A`, Ochre `#D9A441`, Plum `#8E6E86`, Sky `#7FA8C1` at ~18 % opacity, slowly drifting in a 90 s loop. Disabled under `prefers-reduced-motion`.

### Typography

- **Display** — Nunito 800 / 900 (rounded humanist sans, warm and confident)
- **Body** — Geist 400 / 500 / 600, leading 1.55, max line 60 ch
- **Mono** — Geist Mono 500, for numbers, dates, metadata
- Hierarchy by **weight + size**, not weight + colour.

### Components

- **Buttons** — pill (999 px). Primary = Moss filled with a subtle vertical gradient (lighter at top). Secondary = vellum glass with a hairline border. Active state: `translateY(1px)`. **No outer glow.**
- **Cards** — frosted vellum with a 1 px top highlight (`inset 0 1px 0 rgba(255,255,255,0.7)`) and a soft tinted shadow. 24 px corners.
- **Chips** — 999 px pill, glass tint by default.
- **Inputs** — rounded 16 px, glass-tinted background, clear Moss focus ring.
- **Numerals** — Nunito 900, tabular nums, Moss for hero stats.

### Motion

- Watercolor drift in the background — perceptible but never demanding.
- Card hover — `translateY(-2px)` plus shadow soften, 240 ms.
- Spring curve — `cubic-bezier(0.32, 0.72, 0, 1)`.
- A gentle pulse on a small Moss dot for any AI / processing moment, 2.6 s loop.

### Anti-patterns (banned)

- Pure black `#000000`
- AI purple / blue neon
- Generic serifs (Times, Georgia, Garamond)
- Multi-accent decoration — Moss is the accent; Terra is for state
- Animating `top`, `left`, `width`, `height`, `box-shadow`
- `backdrop-filter` values above 18 px (perf)
- Decorative emojis
- Fabricated metrics

## Working principles (non-negotiable)

These are how ALC behaves with families and must be reflected in the flow:

1. **Aishat signs off everything.** No artefact reaches a parent without a human sign-off step. Nothing in the flow should imply automated judgement of the child.
2. **The first 4 weeks of enrolment are continuous reassessment.** The baseline isn't a single moment — it's a window. The flow should never feel like "answer once, locked in".
3. **GDPR matters.** Storing minor children's data needs plain-language consent — not legalese, not a buried checkbox.
4. **Observation-led.** ALC starts from what we *see* the child doing, not from what we test them on. The form should feel like the parent is helping us *see* their child, not filling in an audit.

## Current state — what's already shipped

A **v1 of this onboarding flow already exists in the live app, in the Watercolor Glass language above.** Treat it as the starting point — your job is to **evolve and refine** what's there, not invent something different. Re-use the same Watercolor Glass tokens, type system, and component vocabulary so the redesign drops cleanly into the same codebase.

What's currently shipped, in order:

1. **Welcome screen** — a single centred glass card with an intro paragraph and a "Begin" button. When a draft exists, the same card surfaces "Continue where you left off" + "Start over" instead.
2. **Parent contact step** — a card asking for the parent's email (required), name, and phone (optional) before any questions about the child.
3. **One-question-per-screen flow** — each screen shows one question with a big Nunito heading, a helper line, the input, and Back / Next pill buttons. A soft progress bar across the top shows section progress ("Page 2 of 3 · Goals & learning habits"). The single highest-signal question (about what the child loves) gets a moss-outlined card to mark it as the headline.
4. **Review screen** — every answer grouped by section, parent contact at the top, an Edit link per row that jumps the parent back to that exact question.
5. **Thank-you screen** — calm personalised confirmation with a four-step "what happens next" timeline (today / within a working day / assessment day / a few days later).

State persists to `localStorage` on every change and clears on successful submit, so refresh-safety is already handled. The `body.v2` class is forced on whenever this flow is reachable, so all v2 tokens apply.

**Where to push it:**

- The flow works but feels utilitarian for a brand whose superpower is calm attentiveness. The visual hierarchy, motion, and emotional pacing all need another pass.
- Some screens are simply asking — they should also be *receiving*. Show the parent that we're listening as they answer (subtle confirmations, the watercolor wash responding faintly to progress, etc.) without being twee.
- The hobbies emphasis is currently a moss outline; we want a more memorable treatment that earns its place as the headline question.
- The progress bar communicates progress but not *care* — explore alternatives (sectioned dots, a paced reveal, a live "X of Y questions left and you can pause anytime" reminder) that match the brand's slower-tempo feeling.
- The review screen is functional but lacks moments of warmth — could the section dividers, the empty-answer placeholder, or the confirmation copy carry more of Aishat's voice?
- The thank-you screen could lean further into the "you're being looked after now" message — possibly a hint of what Aishat is going to do next, in language that feels like a person wrote it, not a CRM.

**What not to change:** the underlying step structure (welcome → parent → questions → review → thanks) stays. The information being collected stays roughly the same — adjust groupings if it serves the parent better, but don't drop or invent question categories. The Watercolor Glass palette, type, motion principles, and anti-patterns above are non-negotiable.

## What I want you to design

The **evolved end-to-end onboarding flow**, building on the v1 above.

Refine, screen by screen:

- The **welcome screen** — what makes it feel less like a form and more like an invitation. The Begin button is fine; the rest of the card needs more presence.
- The **parent contact step** — currently asks three fields at once. Should it stay that way, split, or be reframed?
- The **per-question screens** — what does the perfect single-question moment look like in the Watercolor Glass language? How do Back / Next pills behave on long-answer textareas vs single-tap radios? How does the field's emotional weight reflect in the layout?
- The **progress indicator** — show progress without measuring it. Reassure without counting down. The current "Page X of 3" approach is a starting point, not the answer.
- The **highest-signal question (what the child loves)** — design a treatment that *earns* its position as the most important question without using a different colour palette or breaking the visual rhythm.
- The **review screen** — make it feel like *Aishat reviewing a child's first impressions with the parent*, not a CRM summary. Edit affordances must stay clear.
- The **thank-you screen** — what's the smallest, warmest version of "we're going to do something with this; here's how"?
- **GDPR consent** — should it stay as two final radio questions, or move earlier, or be folded into the welcome screen as a calm one-liner? Whatever you choose, plain language wins.
- **Draft-resume behaviour** — when a parent returns mid-flow, what does the welcome screen do? Is "Continue where you left off" the right phrasing? Is there a smarter cue that the form remembered them?
- **Mobile-first** responsive (most parents are on a phone). Desktop should be excellent but is not the primary surface.

## Deliverables

- Hi-fi screens for every step in the evolved flow.
- A short rationale per screen — what's there, **what specifically you changed from v1 above**, and the trade-off made.
- Mobile (≤ 420 px) and desktop (≥ 1024 px) variants.
- Accessibility notes — touch targets, focus states, contrast, screen-reader patterns.
- A small "ready-to-implement" note per screen calling out which of the existing component classes (`intake-card`, `intake-option`, `intake-progress`, `intake-btn--primary`, etc.) you're keeping, modifying, or replacing — so the engineering pass can land cleanly without renaming the world.

## Out of scope

- The booking calendar (a separate flow after submit).
- Any teacher- or admin-facing screens.
- Payment / pricing UI.
- Authentication (the flow is pre-account).
