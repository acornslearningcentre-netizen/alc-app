# Meeting Summary — 2026-05-03

**Attendees:** Babatunde Oduniyi (build), Aishat (Acorns Learning Centre — owner)
**Source:** Live Zoom transcript (`meeting_saved_closed_caption.txt`)
**Duration:** ~1h 45m
**Outcome of this meeting:** Strategic pivot — from "build the full app" to "build the onboarding journey first as the foundation."

---

## 1. The decision

The team has been building the full multi-role app (Teacher / Parent / Student / Leader) all at once. This is a million-dollar idea but cannot be built bottom-up without a strong foundation — and the foundation is **how a new child + family come onto the platform.**

Going forward we will:

1. Build the **onboarding journey end-to-end first** — public intake form → assessment booking → in-person assessment → AI-drafted report → owner sign-off → report delivery to parent → student record created with baseline.
2. Once that is solid, layer the rest of the existing v2 designs on top.
3. Defer all "nice to haves" — document them, ship later.

Pressure: Babatunde leaves for Hajj in 2 weeks (approx 2026-05-17). **A working onboarding demo must be reviewable by the client before then.** Two weeks of pause follow; iteration resumes after.

## 2. The product vision (re-confirmed)

> "Empower educators to access the benefits of AI-driven personalization in group educational settings."

- **Not** an AI that teaches. Acorns is an AI-driven workflow layer that wraps existing learning tools (IXL, Century, etc.) with observation-led personalisation in the Montessori tradition.
- **USP:** "I am the user of AI, not the AI." When the underlying LLMs improve, Acorns improves automatically.
- **Outcomes** — for children: increased engagement, autonomy, measurable progress. For parents: low-overwhelm visibility into the child's day. For teachers: less mental load, more focus on the child in front of them.
- **Scale** beyond Aishat's own tuition centre — other private tuition centres / independent providers are the secondary customer.

## 3. Persona walk-through (teacher-first, what we learned)

### Teacher (the most-used persona, highest priority)

- **Core action:** capture observations *in the moment* during a 2-hour session.
- **Capture order of preference:** image → video → voice-to-text → typed text. Photo doubles as a scan of children's work.
- Today's flow on the dashboard should be re-prioritised: **"Children to check in on" first**, then "AI suggestions awaiting review", then drop "Observations today" count entirely (it's not a KPI).
- The dashboard should also surface **tasks** — what's overdue, what needs sign-off — not just stats.
- AI brief at start of day = key. Picks up patterns across class / year / teacher and tells the teacher what to be mindful of *today* based on yesterday.
- **SENCO use case:** if yesterday's observation flagged a child struggled with change, the AI brief tells the teacher tomorrow not to push that change.
- Approve from a phone — sign-off must be one-tap.

### School leader (Aishat)

- "I sign off everything." Final review on reports, lesson plans, AI suggestions.
- Wants to see at a glance: today's flow, unresolved teacher tasks, pending sign-offs.
- The leader currently has no Messages tab — confirmed she still wants one (parents and teachers may need to message her directly).

### Parent / Student

- Not deep-walked in this meeting. Will come after onboarding + teacher are working.

## 4. Onboarding journey — concrete steps (today's process, manual)

The current onboarding process Aishat described, end-to-end:

1. **Parent finds Acorns** (referral, search, ad).
2. **Parent fills "Knowing Your Child" online form** in Google Forms — captures registration details, what describes the child, what success looks like, how the child approaches tasks, what helps them focus, what they do when they get something wrong, hobbies (the most informative question), and any special educational needs.
3. **Aishat reviews** the form response and **calls the parent** for a 15-min discovery follow-up — picks up things the form misses ("my friend's child went to Acorns", emotional context, etc.).
4. **Parent books a 2-hour in-person assessment** (currently manual; previously used Calendly).
5. **Assessment is run by an assigned teacher** — fully observational, in a real Montessori session with other children, mixing physical materials + tablet + handwritten + spoken probes. Designed not to feel like a test.
6. **Teacher captures observations** during the session (photos, voice notes, etc.) — currently done after going home, on Google Drive, with patchy commentary.
7. **AI drafts an assessment report** based on observations + form responses.
8. **Aishat signs off** the report (final approver).
9. **Report goes to the parent** with a baseline view of the child's strengths, gaps, learning style.
10. **If parent enrols**, the child becomes an ALC student. **First 4 weeks are continuous reassessment** — baseline keeps refining as the child uses IXL / works with materials / interacts with teachers.

## 5. What we have today vs. what we need

| Step | Today | Needs |
|------|-------|-------|
| 1. Intake form | Google Forms | Native intake form on Acorns, Typeform-style (one Q at a time, never feels long) |
| 2. Prospect record | Spreadsheet / nothing | DB record with status `new prospect` → `assessment booked` → `assessment done` → `enrolled` |
| 3. Owner notification | Manual | Auto-summary to owner (name, parent, child age, key concerns, link) |
| 4. Booking | Manual / used to be Calendly | Embedded scheduling — owner picks slot windows |
| 5. Discovery call | Phone, manual | Stays manual at current scale; could be AI-summarised after the call later |
| 6. Assessment session | Real session with teacher | Teacher needs **in-the-moment capture** (image / video / voice → text / text) tied to the prospect's record |
| 7. Observations | Google Drive, often patchy | Captured in-app, attached to prospect, time-stamped |
| 8. Report draft | Done in ChatGPT, copy-pasted | AI-drafted from observations + form, in the editor, owner can tweak |
| 9. Sign-off | Manual review in ClickUp | One-tap mobile sign-off |
| 10. Send to parent | Manual email | Email/PDF goes automatically once signed |
| 11. Convert to student | Manual setup | Auto-creates child profile with seeded baseline (mastery, strengths, gaps, learning style) |

## 6. Out of scope (documented for later)

- **Full lesson planning AI.** Aishat already has a strong workflow in ClickUp + ChatGPT for week-plans; she wants to import that pattern, not rebuild it. Next milestone after onboarding.
- **External tool integration** (IXL, Century, Discovery Education) — needs API conversations with each vendor; defer.
- **AI bot phone calls** to prospects — defer until scale demands.
- **Public API for Acorns itself** — for downstream integrations like Family Hub. Defer.
- **Multi-tenant scaling** — for selling to other tuition centres. Architect for it now (don't make data shapes single-tenant), but don't build the admin layer yet.

## 7. Open questions

- Which existing tooling stays in-loop (ClickUp for staff workflow, Google Drive for media) vs. gets replaced?
- GDPR + data-protection sign-off for storing minor children's data in our DB. Need legal review before we go live with real prospects.
- Does the discovery call become an in-app video call, or stays on phone? (Probably phone for v1.)
- Pricing model — not discussed. Likely per-school / per-seat once we go multi-tenant.

## 8. Action items

| # | Owner | Action | Due |
|---|-------|--------|-----|
| 1 | Aishat | Send Babatunde the link to the current Google "Knowing Your Child" intake form so we can mirror its questions | This week |
| 2 | Babatunde | Build the onboarding journey end-to-end on `redesign/v2-taste` (or new branch) — see [PLAN-onboarding-journey.md](./PLAN-onboarding-journey.md) | Demo by 2026-05-16 |
| 3 | Aishat | Begin interviewing other independent tuition centres about their onboarding pain points (3–5 conversations) | Over the 2-week Hajj pause |
| 4 | Babatunde | Set up commercial structure for ALC-the-app as a separate entity from ALC-the-tuition-centre | After Hajj |
