// AI Assistant Chat (SCRUM-59/61) — a real LLM call, grounded in a
// specific child's real observations and progress. Unlike the earlier
// AI-flavored epics (assessment-report drafts, next-step suggestions), a
// template can't honestly answer arbitrary questions, so this one is a
// genuine Anthropic API call rather than a composer.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

const SYSTEM_PROMPT = `You are a helpful assistant for staff and parents at Acorns Learning Centre, a Montessori-style tuition centre. You answer questions about one specific child, grounded only in the real observations and progress data given to you below — never invent details that aren't in that data.

Always make clear your answer is a suggestion or an observation-based reflection, not a definitive judgement about the child. Keep answers warm, concise, and specific to what's actually in the data. If the data provided doesn't have enough to answer the question, say so honestly rather than guessing.`;

/**
 * Pure — builds the real-data context block fed to the model. No network.
 * @param {{ childName: string, observations: { kind: string, comment?: string|null, transcript?: string|null, tags?: string[], mood?: string|null, captured_at: string }[], progress: { mastery: number|null, attendance: number, streak: number, trend: string } | null }} input
 */
export function buildChildContext({ childName, observations, progress }) {
  const obsLines = (observations || []).length
    ? observations.map((o) => {
        const note = o.comment || o.transcript || `[${o.kind} observation, no written note]`;
        const tags = o.tags && o.tags.length ? ` (tags: ${o.tags.join(', ')})` : '';
        const mood = o.mood ? ` (mood: ${o.mood})` : '';
        return `- ${String(o.captured_at).slice(0, 10)}: ${note}${tags}${mood}`;
      }).join('\n')
    : 'No observations recorded yet.';

  const progressLine = progress
    ? `Mastery: ${progress.mastery === null ? 'not enough data yet' : `${progress.mastery}%`}, Attendance: ${progress.attendance}%, Streak: ${progress.streak} day(s), Trend: ${progress.trend}.`
    : 'No progress data recorded yet.';

  return `Child: ${childName}\n\nRecent observations (most recent first):\n${obsLines}\n\nLatest progress snapshot:\n${progressLine}`;
}

/**
 * @param {{ childName: string, observations: object[], progress: object|null, history: { sender: 'user'|'assistant', text: string }[], question: string }} input
 * @returns {Promise<string>} the assistant's reply text
 * @throws if ANTHROPIC_API_KEY isn't configured, or the call genuinely fails
 */
export async function askAssistant({ childName, observations, progress, history, question }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('The AI assistant is not configured (ANTHROPIC_API_KEY is missing).');
  }

  const client = new Anthropic({ apiKey });
  const context = buildChildContext({ childName, observations, progress });

  const messages = [
    ...(history || []).map((m) => ({ role: m.sender === 'assistant' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: question },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n${context}`,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error('The assistant did not return a response.');
  }
  return textBlock.text;
}
