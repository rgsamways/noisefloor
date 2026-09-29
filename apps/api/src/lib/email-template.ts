const BG = "#05070a";
const PANEL = "#0b1214";
const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const FONT = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailContent = {
  heading: string;
  // Plain-text paragraphs; escaped here, so callers never pass HTML.
  paragraphs: string[];
  button: { label: string; url: string };
  footer: string;
};

// Email clients strip most CSS, so this is table layout + inline styles
// only — same palette and monospace look as the site's HUD pages, minus
// the glow/gradients/web fonts that mail clients won't render. Returns a
// plain-text alternative too (better deliverability, and what
// text-only clients show).
export function renderEmail({ heading, paragraphs, button, footer }: EmailContent): { html: string; text: string } {
  const url = escapeHtml(button.url);
  const paragraphHtml = paragraphs
    .map((p) => `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${TEXT};">${escapeHtml(p)}</p>`)
    .join("");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;font-family:${FONT};">
<tr><td style="padding:0 0 16px 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};font-family:${FONT};">noisefloor</td></tr>
<tr><td style="background:${PANEL};border:1px solid ${LINE};padding:28px;font-family:${FONT};">
<h1 style="margin:0 0 20px 0;font-size:20px;font-weight:600;color:${TEXT};font-family:${FONT};">${escapeHtml(heading)}</h1>
${paragraphHtml}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;"><tr>
<td style="background:${ACCENT};"><a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:${BG};text-decoration:none;font-family:${FONT};">${escapeHtml(button.label)}</a></td>
</tr></table>
<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(footer)}</p>
<p style="margin:12px 0 0 0;font-size:11px;line-height:1.5;color:${MUTED};word-break:break-all;">If the button doesn't work, paste this link into your browser:<br><a href="${url}" style="color:${MUTED};">${url}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [heading, "", ...paragraphs.flatMap((p) => [p, ""]), `${button.label}: ${button.url}`, "", footer].join("\n");

  return { html, text };
}
