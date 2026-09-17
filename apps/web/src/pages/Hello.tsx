import { authClient } from "../lib/auth-client";

export function Hello() {
  const { data: session } = authClient.useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-foreground">noisefloor.ca</h1>
      <p className="text-muted">Signed in as {session?.user.email}</p>
      <button
        type="button"
        onClick={() => authClient.signOut()}
        className="rounded-md border border-border px-3 py-2 text-sm text-foreground"
      >
        Sign out
      </button>
    </main>
  );
}
