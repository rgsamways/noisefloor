import { env } from "../env.js";

export async function sendMagicLink({ email, url }: { email: string; url: string }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[magic-link] Sign-in link for ${email}: ${url}`);
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
      subject: "Sign in to noisefloor",
      html: `<p>Click the link below to sign in to noisefloor:</p><p><a href="${url}">${url}</a></p><p>This link expires in 30 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send magic link email: ${response.status} ${await response.text()}`);
  }
}
