import { useState } from "react";
import { Link } from "react-router";
import { HudPageShell } from "../components/HudPageShell";
import { authClient } from "../lib/auth-client";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const { error } = await authClient.signIn.magicLink({
      email,
      // Must be absolute: Better Auth resolves a relative callbackURL
      // against its own origin (the API), not the web app's — a relative
      // path silently redirects back to the API instead of the web app.
      // /hub, not "/" — the post-sign-in destination is the rules-driven
      // hub, not the public Landing page (add-signin-hub).
      callbackURL: `${window.location.origin}/hub`,
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto flex min-h-[70vh] max-w-[400px] flex-col justify-center gap-4">
        <Link to="/" className="text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
          noisefloor
        </Link>

        <section className="border p-6" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          {status === "sent" ? (
            <>
              <h1 className="mb-3 text-[22px] font-semibold tracking-tight">Check your email</h1>
              <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>
                We sent a sign-in link to <span style={{ color: TEXT }}>{email}</span>. It expires in 30 minutes.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-4 text-[12px]"
                style={{ color: MUTED }}
              >
                Use a different email
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h1 className="text-[22px] font-semibold tracking-tight">Sign in</h1>
              <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>
                Enter your email and we'll send you a one-time link. No password needed.
              </p>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="border bg-transparent px-3 py-2 text-[13px] outline-none"
                style={{ borderColor: LINE, color: TEXT }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = LINE)}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="border px-3 py-2 text-[13px] disabled:opacity-40"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                {status === "sending" ? "Sending…" : "Send sign-in link"}
              </button>
              {status === "error" && <p className="text-[12px] text-red-400">Something went wrong — try again.</p>}
            </form>
          )}
        </section>
      </div>
    </HudPageShell>
  );
}
