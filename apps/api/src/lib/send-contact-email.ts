import { env } from "../env.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactEmail({ name, email, message }: { name: string; email: string; message: string }) {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    console.log(`[contact] Message from ${name} <${email}>: ${message}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      // Lets a reply in the mail client go straight back to the visitor.
      reply_to: email,
      subject: `noisefloor contact form: ${name}`,
      html: `<p><b>${escapeHtml(name)}</b> (${escapeHtml(email)}) wrote:</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send contact email: ${response.status} ${await response.text()}`);
  }
}
