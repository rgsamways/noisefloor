import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { apiFetch } from "../lib/api";

type CaseSummary = {
  id: string;
  slug: string;
  title: string;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  tags: string[];
};

export function Cases() {
  const [cases, setCases] = useState<CaseSummary[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    apiFetch<CaseSummary[]>("/cases").then(setCases, (err: Error) => setError(err.message));
  }, []);

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Cases</h1>
        {error && <p className="text-red-700">{error}</p>}
        {!cases && !error && <p className="text-muted">Loading…</p>}
        {cases?.map((c) => (
          <Link
            key={c.id}
            to={`/cases/${c.slug}`}
            className="flex flex-col gap-1 border border-foreground p-4 hover:bg-foreground hover:text-background"
          >
            <span className="text-lg font-semibold">{c.title}</span>
            <span className="font-mono text-xs text-muted">
              Difficulty {c.difficulty} · ~{c.estimatedMinutes} min · {c.tags.join(", ")}
            </span>
          </Link>
        ))}
      </main>
    </PageShell>
  );
}
