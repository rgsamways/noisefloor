import { env } from "../env.js";
import { renderEmail } from "./email-template.js";

export async function sendMagicLink({ email, url }: { email: string; url: string }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[magic-link] Sign-in link for ${email}: ${url}`);
    return;
  }

  const { html, text } = renderEmail({
    heading: "Sign in to noisefloor",
    paragraphs: ["Use the button below to sign in. No password needed."],
    button: { label: "Sign in", url },
    footer: "This link expires in 30 minutes. If you didn't request it, you can ignore this email.",
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
      subject: "Sign in to noisefloor",
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send magic link email: ${response.status} ${await response.text()}`);
  }
}
