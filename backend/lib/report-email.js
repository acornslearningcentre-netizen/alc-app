// Real email delivery for signed-off assessment reports — SCRUM-88. Uses
// Resend (https://resend.com). buildReportEmail is pure (unit-tested without
// a network call); sendReportEmail wraps the actual API call.
import { Resend } from 'resend';

/**
 * @param {{ parentName?: string|null, childFirstName?: string|null, reportText: string }} input
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildReportEmail({ parentName, childFirstName, reportText }) {
  const child = childFirstName || 'your child';
  const greeting = parentName ? `Hi ${parentName},` : 'Hi,';
  const subject = `${child}'s assessment report from Acorns Learning Centre`;

  const bodyHtml = reportText
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  const html = `<p>${greeting}</p><p>Here's the report from ${child}'s assessment visit:</p>${bodyHtml}<p>Warm regards,<br/>Acorns Learning Centre</p>`;
  const text = `${greeting}\n\nHere's the report from ${child}'s assessment visit:\n\n${reportText}\n\nWarm regards,\nAcorns Learning Centre`;

  return { subject, html, text };
}

/**
 * @param {{ to: string, parentName?: string|null, childFirstName?: string|null, reportText: string }} input
 * @throws if RESEND_API_KEY isn't configured, or the send genuinely fails.
 */
export async function sendReportEmail({ to, parentName, childFirstName, reportText }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email sending is not configured (RESEND_API_KEY is missing).');
  }
  const from = process.env.EMAIL_FROM || 'Acorns Learning Centre <onboarding@resend.dev>';
  const { subject, html, text } = buildReportEmail({ parentName, childFirstName, reportText });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) {
    throw new Error(error.message || 'Email failed to send.');
  }
  return data;
}
