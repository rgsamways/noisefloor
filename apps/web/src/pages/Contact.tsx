import { useState } from "react";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const MUTED = "#5a726e";
const LINE = "#1c2a2e";
const ACCENT = "#3dffc4";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const inputClass = "w-full border bg-transparent px-3 py-2.5 text-[14px] outline-none";

// Real infra behind this, not a mailto link: POSTs to apps/api's /contact
// route, which sends via Resend (see PROJECT-PLAN.md D5 — Resend was
// already the project's chosen provider, not a new pick). `website` is a
// honeypot: hidden from real visitors via CSS, present for bots that
// autofill every field.
export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
          Contact
        </div>
        <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Get in touch.</h1>
        <p className="mt-3.5 max-w-[560px] text-[14px] leading-relaxed" style={{ color: "#9fb3af" }}>
          Found a bug, have a real scenario worth simulating, or just want to say something? This goes straight to a
          real inbox.
        </p>

        {status === "sent" ? (
          <p className="mt-9 text-[15px]" style={{ color: ACCENT }}>
            Sent — thanks, you'll hear back by email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-9 flex max-w-[480px] flex-col gap-4">
            <input
              type="text"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            <label className="flex flex-col gap-1.5 text-[12px] tracking-[0.04em] uppercase" style={{ color: MUTED }}>
              Name
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
                style={{ borderColor: LINE, color: "#d7e6e2" }}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[12px] tracking-[0.04em] uppercase" style={{ color: MUTED }}>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                style={{ borderColor: LINE, color: "#d7e6e2" }}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[12px] tracking-[0.04em] uppercase" style={{ color: MUTED }}>
              Message
              <textarea
                required
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={inputClass}
                style={{ borderColor: LINE, color: "#d7e6e2", resize: "vertical" }}
              />
            </label>

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-2 inline-flex w-fit items-center gap-2.5 border px-[22px] py-[13px] text-[13px] font-semibold tracking-[0.06em] uppercase disabled:opacity-50"
              style={{ borderColor: ACCENT, color: ACCENT, background: "rgba(61,255,196,0.08)" }}
            >
              {status === "sending" ? "Sending..." : "Send"}
            </button>

            {status === "error" && (
              <p className="text-[13px]" style={{ color: "#ff5e6c" }}>
                Something went wrong — try again in a moment.
              </p>
            )}
          </form>
        )}

        <ContentFooterLinks />
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
