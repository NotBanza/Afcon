export function buildPlainResultEmail({ heading, summary, timeline, newsLink }) {
  const sections = [heading, '', summary];

  if (Array.isArray(timeline) && timeline.length > 0) {
    sections.push('', 'Key moments:', ...timeline.map((entry) => `- ${entry}`));
  }

  if (newsLink) {
    sections.push('', `Read full match centre: ${newsLink}`);
  }

  return sections.join('\n');
}

export function buildHtmlResultEmail({ heading, summary, timeline, newsLink }) {
  const timelineItems = Array.isArray(timeline)
    ? timeline.map((entry) => `<li>${entry}</li>`).join('')
    : '';

  const timelineSection = timelineItems
    ? `<h3 style="margin:20px 0 8px;font-size:16px;color:#0E8F48;">Key moments</h3><ul style="margin:0;padding-left:20px;color:#05121A;line-height:1.6;">${timelineItems}</ul>`
    : '';

  const linkSection = newsLink
    ? `<p style="margin:20px 0;"><a href="${newsLink}" style="color:#0E8F48;">Open full match centre</a></p>`
    : '';

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${heading}</title>
    </head>
    <body style="margin:0;padding:24px;font-family:Inter,Arial,sans-serif;background:#F9F6EE;color:#05121A;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:20px;padding:24px;border:1px solid rgba(5,18,26,0.08);">
        <h2 style="margin:0 0 12px;font-size:22px;color:#0E8F48;">${heading}</h2>
        <p style="margin:0 0 16px;line-height:1.6;">${summary}</p>
        ${timelineSection}
        ${linkSection}
        <p style="margin:28px 0 0;font-size:13px;color:rgba(5,18,26,0.55);">You are receiving this update because your federation is registered for the African Nations League 2026 Championship.</p>
      </div>
    </body>
  </html>`;
}
