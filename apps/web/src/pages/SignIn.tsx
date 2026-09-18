import { useState } from "react";
import { authClient } from "../lib/auth-client";

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
      // "/" silently redirects back to the API instead of the web app.
      callbackURL: `${window.location.origin}/`,
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-foreground">Check your email for a sign-in link.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Sign in to noisefloor</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full border border-foreground bg-transparent px-3 py-2 text-foreground"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send sign-in link"}
        </button>
        {status === "error" && <p className="text-sm text-body">Something went wrong — try again.</p>}
      </form>
    </main>
  );
}
