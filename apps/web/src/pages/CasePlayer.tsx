import {
  ApStationList,
  DeviceDetails,
  DeviceManagePane,
  DeviceOverview,
  LinkCapacityChart,
  LinkHeader,
  RateBar,
  RealtimePingModal,
  SignalPanel,
} from "@noisefloor/dashboards";
import type { Annotation, Debrief, Evidence, Opening, Prompt, World } from "@noisefloor/shared";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PageShell } from "../components/PageShell";
import { apiFetch } from "../lib/api";

type CaseShell = {
  id: string;
  slug: string;
  title: string;
  world: World;
  opening: Opening;
  stageIds: string[];
};

type StageContent = {
  id: string;
  title: string;
  reveal: Evidence[];
  prompt: Prompt;
};

type CommitResponse =
  | { score: number; feedback: string; nextStageId: string }
  | { score: number; feedback: string; debriefUnlocked: true; totalScore: number; debrief: Debrief };

type StageHistoryEntry = { stage: StageContent; score: number; feedback: string };

function EvidenceView({
  evidence,
  world,
  caseId,
  annotations,
}: {
  evidence: Evidence;
  world: World;
  caseId: string;
  annotations?: Annotation[];
}) {
  if (evidence.kind === "dashboard" && evidence.family === "crm" && evidence.view === "LinkCapacityChart") {
    const initialPeriod = evidence.worldSlice === "1y" ? "1y" : "24h";
    return <LinkCapacityChart world={world} seed={caseId} initialPeriod={initialPeriod} annotations={annotations} />;
  }
  if (evidence.kind === "dashboard" && evidence.family === "radio") {
    if (evidence.view === "LinkHeader") return <LinkHeader world={world} />;
    if (evidence.view === "SignalPanel") return <SignalPanel world={world} />;
    if (evidence.view === "RateBar") return <RateBar world={world} />;
    if (evidence.view === "DeviceDetails") {
      const side = evidence.worldSlice === "ap" ? "remote" : "local";
      return <DeviceDetails world={world} side={side} />;
    }
  }
  if (evidence.kind === "dashboard" && evidence.family === "crm" && evidence.view === "RealtimePingModal") {
    return <RealtimePingModal world={world} targetLabel={evidence.worldSlice ?? ""} />;
  }
  if (evidence.kind === "dashboard" && evidence.family === "nms") {
    if (evidence.view === "DeviceOverview") return <DeviceOverview world={world} seed={caseId} />;
    if (evidence.view === "DeviceManagePane") return <DeviceManagePane world={world} />;
    if (evidence.view === "ApStationList") return <ApStationList world={world} />;
  }
  if (evidence.kind === "customerSays") return <p className="italic text-body">"{evidence.text}"</p>;
  if (evidence.kind === "ticketNote")
    return (
      <p className="text-body">
        <span className="font-mono text-xs text-muted">{evidence.author}</span> — {evidence.text}
      </p>
    );
  if (evidence.kind === "colleagueSays") return <p className="text-body">{evidence.text}</p>;
  return <p className="text-muted">Unsupported evidence view.</p>;
}

export function CasePlayer() {
  const { slug } = useParams<{ slug: string }>();
  const [shell, setShell] = useState<CaseShell>();
  const [error, setError] = useState<string>();
  const [attemptId, setAttemptId] = useState<string>();
  const [currentStage, setCurrentStage] = useState<StageContent>();
  const [history, setHistory] = useState<StageHistoryEntry[]>([]);
  const [debrief, setDebrief] = useState<Debrief>();
  const [totalScore, setTotalScore] = useState<number>();
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiFetch<CaseShell>(`/cases/${slug}`).then(setShell, (err: Error) => setError(err.message));
  }, [slug]);

  async function loadStage(stageId: string, forAttemptId: string) {
    const query = stageId === shell?.stageIds[0] ? "" : `?attemptId=${forAttemptId}`;
    const stage = await apiFetch<StageContent>(`/cases/${slug}/stage/${stageId}${query}`);
    setCurrentStage(stage);
    setFreeText("");
  }

  async function start() {
    if (!shell) return;
    setSubmitting(true);
    try {
      const attempt = await apiFetch<{ id: string }>("/attempts", {
        method: "POST",
        body: JSON.stringify({ caseSlug: shell.slug }),
      });
      setAttemptId(attempt.id);
      await loadStage(shell.stageIds[0]!, attempt.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function commit(answer: { optionId: string } | { text: string }) {
    if (!attemptId || !currentStage) return;
    setSubmitting(true);
    try {
      const response = await apiFetch<CommitResponse>(`/attempts/${attemptId}/commit`, {
        method: "POST",
        body: JSON.stringify({ stageId: currentStage.id, answer }),
      });
      setHistory((h) => [...h, { stage: currentStage, score: response.score, feedback: response.feedback }]);
      if ("debriefUnlocked" in response) {
        setDebrief(response.debrief);
        setTotalScore(response.totalScore);
        setCurrentStage(undefined);
      } else {
        await loadStage(response.nextStageId, attemptId);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <PageShell>
        <main className="mx-auto w-full max-w-2xl flex-1 p-6">
          <p className="text-red-700">{error}</p>
        </main>
      </PageShell>
    );
  }

  if (!shell) {
    return (
      <PageShell>
        <main className="mx-auto w-full max-w-2xl flex-1 p-6 text-muted">Loading…</main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-6">
        <h1 className="text-2xl font-semibold">{shell.title}</h1>

        {/* The ticket itself — kept visible for the whole investigation, not just the opening screen. */}
        <div className="flex flex-col gap-4 border border-foreground p-4">
          <p>{shell.opening.ticketText}</p>
          {!attemptId &&
            shell.opening.evidence.map((e, i) => (
              <EvidenceView key={i} evidence={e} world={shell.world} caseId={shell.id} />
            ))}
          {!attemptId && (
            <button
              type="button"
              onClick={start}
              disabled={submitting}
              className="self-start bg-foreground px-4 py-2 text-background"
            >
              Start
            </button>
          )}
        </div>

        {/* Accumulating story panel — per outline §8, everything committed so far stays
            visible. Score/feedback (the "what this told us" synthesis) stays visible
            unconditionally so the running story doesn't disappear behind a click as more
            stages pile up; only the bulkier raw evidence collapses. */}
        {history.map((entry, i) => (
          <div key={entry.stage.id} className="flex flex-col gap-2 border border-foreground p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{entry.stage.title}</span>
              <span className="font-mono text-xs text-muted">Score: {entry.score}</span>
            </div>
            <p className="text-sm text-body">{entry.feedback}</p>
            {entry.stage.reveal.length > 0 && (
              <details open={i === history.length - 1}>
                <summary className="cursor-pointer font-mono text-xs text-muted">Evidence</summary>
                <div className="mt-3 flex flex-col gap-3">
                  {entry.stage.reveal.map((e, j) => (
                    <EvidenceView key={j} evidence={e} world={shell.world} caseId={shell.id} />
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}

        {currentStage && (
          <div className="flex flex-col gap-4 border border-foreground p-4">
            <h2 className="font-semibold">{currentStage.title}</h2>
            {currentStage.reveal.map((e, i) => (
              <EvidenceView key={i} evidence={e} world={shell.world} caseId={shell.id} />
            ))}

            {"options" in currentStage.prompt && (
              <div className="flex flex-col gap-2">
                {currentStage.prompt.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => commit({ optionId: o.id })}
                    className="border border-foreground px-3 py-2 text-left hover:bg-foreground hover:text-background"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {"freeText" in currentStage.prompt && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  rows={4}
                  className="border border-foreground p-2"
                  placeholder={
                    "options" in currentStage.prompt ? "Or type your own theory…" : "Type your answer…"
                  }
                />
                <button
                  type="button"
                  disabled={submitting || !freeText.trim()}
                  onClick={() => commit({ text: freeText })}
                  className="self-start bg-foreground px-4 py-2 text-background disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        )}

        {debrief && (
          <div className="flex flex-col gap-4 border border-foreground p-4">
            <h2 className="font-semibold">Debrief</h2>
            <p className="text-body">{debrief.narrative}</p>
            <p className="font-mono text-xs">Total score: {totalScore}</p>
            {debrief.annotatedReplays.map((r, i) => (
              <EvidenceView key={i} evidence={r.evidence} world={shell.world} caseId={shell.id} annotations={r.annotations} />
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}
