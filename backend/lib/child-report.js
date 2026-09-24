// Child Reports & Sign-off (SCRUM-63/65) — generates a real progress-report
// draft for a staff member to review, edit, and sign off. Reuses
// buildChildContext from lib/assistant.js (same real-data grounding: recent
// observations + latest progress snapshot) so both AI surfaces stay in sync
// on what "real data about this child" means, rather than drifting apart.
import Anthropic from '@anthropic-ai/sdk';
import { buildChildContext } from './assistant.js';

const MODEL = 'claude-opus-5';

const SYSTEM_PROMPT = `You write progress-report drafts for staff at Acorns Learning Centre, a Montessori-style tuition centre, to review and sign off before anything goes to a family. Write a warm, specific report for the child described below, grounded only in the real observations and progress data provided — never invent details that aren't in that data. If there isn't enough recorded data to say something meaningful, say so plainly rather than padding the report with generic filler. This is a first draft for a staff member to review and edit — do not address the parent directly, and do not imply it has already been reviewed or sent.`;

/**
 * @param {{ childName: string, periodLabel: string, observations: object[], progress: object|null }} input
 * @returns {Promise<string>} the draft report text
 * @throws if ANTHROPIC_API_KEY isn't configured, or the call genuinely fails
 */
export async function generateReportDraft({ childName, periodLabel, observations, progress }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('The AI assistant is not configured (ANTHROPIC_API_KEY is missing).');
  }

  const client = new Anthropic({ apiKey });
  const context = buildChildContext({ childName, observations, progress });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Write a progress report for ${childName} covering ${periodLabel}.\n\n${context}` }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error('The assistant did not return a report.');
  }
  return textBlock.text;
}
