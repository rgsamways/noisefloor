import { env } from "../env.js";

// Mirrors send-magic-link.ts's exact pattern — console-log fallback when
// no Resend key is configured (local dev/test), a direct Resend POST
// otherwise. Not a shared abstraction over both email types yet; two
// simple templates don't justify one (design.md's Decision 6).
export async function sendInviteEmail({ email, groupName }: { email: string; groupName: string }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[invite] ${email} invited to join ${groupName} on noisefloor`);
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
      to: email,
      subject: "You've been invited to noisefloor",
      html: `<p>You've been added to the <strong>${groupName}</strong> group on noisefloor.</p><p>Sign in at <a href="${env.WEB_URL}/sign-in">noisefloor.ca</a> with this email address to get access.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send invite email: ${response.status} ${await response.text()}`);
  }
}
