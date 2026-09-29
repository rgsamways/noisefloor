import { env } from "../env.js";
import { renderEmail } from "./email-template.js";

// Mirrors send-magic-link.ts's exact pattern — console-log fallback when
// no Resend key is configured (local dev/test), a direct Resend POST
// otherwise. The layout comes from the shared email-template.ts.
export async function sendInviteEmail({ email, groupName }: { email: string; groupName: string }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[invite] ${email} invited to join ${groupName} on noisefloor`);
    return;
  }

  const { html, text } = renderEmail({
    heading: "You've been added to noisefloor",
    paragraphs: [
      `You've been added to the ${groupName} group.`,
      "Sign in with this email address to get access. No password needed.",
    ],
    button: { label: "Go to sign in", url: `${env.WEB_URL}/sign-in` },
    footer: "You'll get a one-time sign-in link by email each time you sign in.",
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: "You've been invited to noisefloor",
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send invite email: ${response.status} ${await response.text()}`);
  }
}
