import { Resend } from 'resend';
import { buildPlainResultEmail, buildHtmlResultEmail } from '@/lib/email';

const DEFAULT_FROM = 'African Nations League <no-reply@anl2026.africa>';

function toScoreNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function sendMatchResultEmail({
  recipientEmail,
  team1Name,
  team2Name,
  score,
  summary,
  timeline,
  newsLink,
}) {
  if (!recipientEmail) {
    console.warn('sendMatchResultEmail skipped: no recipient provided.');
    return { delivered: false, reason: 'no-recipient' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('sendMatchResultEmail skipped: RESEND_API_KEY not configured.');
    return { delivered: false, reason: 'missing-api-key' };
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  const team1Score = toScoreNumber(score?.team1);
  const team2Score = toScoreNumber(score?.team2);

  const heading = `${team1Name} ${team1Score}-${team2Score} ${team2Name}`;
  const subject = `ANL Result: ${heading}`;
  const safeSummary = summary || `${heading} — full time.`;
  const timelineEntries = Array.isArray(timeline) ? timeline : [];

  const textBody = buildPlainResultEmail({ heading, summary: safeSummary, timeline: timelineEntries, newsLink });
  const htmlBody = buildHtmlResultEmail({ heading, summary: safeSummary, timeline: timelineEntries, newsLink });

  try {
    await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { delivered: true };
  } catch (error) {
    console.error('sendMatchResultEmail error:', error);
    return { delivered: false, reason: error.message };
  }
}
