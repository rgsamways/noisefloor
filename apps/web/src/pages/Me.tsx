import { PageShell } from "../components/PageShell";
import { authClient } from "../lib/auth-client";

export function Me() {
  const { data: session } = authClient.useSession();

  return (
    <PageShell>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">noisefloor.ca</h1>
        <p className="text-muted">Signed in as {session?.user.email}</p>
        <button
          type="button"
          onClick={() => authClient.signOut()}
          className="border border-foreground px-3 py-2 text-sm"
        >
          Sign out
        </button>
      </main>
    </PageShell>
  );
}
