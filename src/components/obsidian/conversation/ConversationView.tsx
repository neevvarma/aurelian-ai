"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  RankedSearchResult,
  ResearchResponse,
  ResearchStage,
} from "@/types/research";

export type ConversationTurn = {
  id: string;
  question: string;
  response: ResearchResponse;
  createdAt: string;
};

export type SavedConversation = {
  id: string;
  title: string;
  originalPrompt: string;
  selectedTools: string[];
  createdAt: string;
  updatedAt: string;
  turns: ConversationTurn[];
};

type ConversationViewProps = {
  conversation: SavedConversation;
  onBack: () => void;
  onConversationChange: (conversation: SavedConversation) => void;
};

const progressSteps: Array<{
  id: Exclude<ResearchStage, "idle" | "complete" | "error">;
  label: string;
  description: string;
}> = [
  {
    id: "searching",
    label: "Searching trusted sources",
    description: "Finding relevant evidence across the live web.",
  },
  {
    id: "ranking",
    label: "Evaluating the evidence",
    description: "Scoring sources for relevance, authority, and freshness.",
  },
  {
    id: "synthesizing",
    label: "Building the analysis",
    description: "Combining the strongest findings into a decision-ready answer.",
  },
];

const stageIndex: Record<ResearchStage, number> = {
  idle: -1,
  searching: 0,
  ranking: 1,
  synthesizing: 2,
  complete: 3,
  error: -1,
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relevancePercent(score: number) {
  const normalized = score > 1 ? score : score * 100;
  return `${Math.max(0, Math.min(100, Math.round(normalized)))}%`;
}

function trustLabel(level: RankedSearchResult["trustLevel"]) {
  if (level === "high") return "High trust";
  if (level === "medium") return "Medium trust";
  return "General source";
}

function splitSummary(summary: string) {
  return summary
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
}

function createFollowUps(originalPrompt: string, currentQuestion: string) {
  const normalized = `${originalPrompt} ${currentQuestion}`.toLowerCase();

  if (
    normalized.includes("texas") &&
    (normalized.includes("business") || normalized.includes("llc"))
  ) {
    return [
      "What are the biggest risks when starting this Texas business?",
      "Create a step-by-step Texas launch checklist.",
      "Which Texas registrations, taxes, and permits should I verify?",
    ];
  }

  if (normalized.includes("uk") || normalized.includes("united kingdom")) {
    return [
      "Compare this UK expansion with Germany.",
      "What UK tax and VAT obligations would apply to this company?",
      "Create a low-risk 90-day UK market-entry plan for this company.",
    ];
  }

  if (normalized.includes("compare") || normalized.includes("competitor")) {
    return [
      "Which option has the strongest long-term advantage, and why?",
      "Compare their pricing, customers, and strategic risks.",
      "Turn the analysis into an executive comparison table.",
    ];
  }

  return [
    "What are the biggest risks specifically related to this decision?",
    "Create a practical action plan based on these findings.",
    "What should be researched next to make this decision confidently?",
  ];
}

const MAX_SEARCH_QUERY_LENGTH = 390;

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  const cleaned = compactText(value);

  if (cleaned.length <= maxLength) return cleaned;

  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildContextualPrompt(
  conversation: SavedConversation,
  followUpQuestion: string,
) {
  const topic = truncateText(conversation.originalPrompt, 180);
  const question = truncateText(followUpQuestion, 145);

  const prompt = [
    `Topic: ${topic}`,
    `Follow-up: ${question}`,
    "Answer only within this topic. Use current, relevant sources and focus on the requested follow-up.",
  ].join("\n");

  return truncateText(prompt, MAX_SEARCH_QUERY_LENGTH);
}

export function ConversationView({
  conversation,
  onBack,
  onConversationChange,
}: ConversationViewProps) {
  const latestSavedTurn = conversation.turns.at(-1) ?? null;
  const initializedConversationId = useRef<string | null>(null);

  const [activeQuestion, setActiveQuestion] = useState(
    latestSavedTurn?.question ?? conversation.originalPrompt,
  );
  const [response, setResponse] = useState<ResearchResponse | null>(
    latestSavedTurn?.response ?? null,
  );
  const [stage, setStage] = useState<ResearchStage>(
    latestSavedTurn ? "complete" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const followUps = useMemo(
    () => createFollowUps(conversation.originalPrompt, activeQuestion),
    [activeQuestion, conversation.originalPrompt],
  );

  async function runResearch(displayQuestion: string, isFollowUp: boolean) {
    const cleanedQuestion = displayQuestion.trim();
    if (!cleanedQuestion) return;

    const requestPrompt = isFollowUp
      ? buildContextualPrompt(conversation, cleanedQuestion)
      : cleanedQuestion;

    setActiveQuestion(cleanedQuestion);
    setResponse(null);
    setError(null);
    setExpandedSourceId(null);
    setStage("searching");

    const rankingTimer = window.setTimeout(() => {
      setStage((current) => (current === "searching" ? "ranking" : current));
    }, 850);

    const synthesisTimer = window.setTimeout(() => {
      setStage((current) =>
        current === "searching" || current === "ranking"
          ? "synthesizing"
          : current,
      );
    }, 1800);

    try {
      const apiResponse = await fetch("/api/aurelian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: requestPrompt,
          selectedTools: conversation.selectedTools,
        }),
      });

      const body = (await apiResponse.json()) as
        | ResearchResponse
        | { error?: string; details?: string };

      window.clearTimeout(rankingTimer);
      window.clearTimeout(synthesisTimer);

      if (!apiResponse.ok) {
        const message = "error" in body ? body.error : undefined;
        const details = "details" in body ? body.details : undefined;

        throw new Error(
          [message, details].filter(Boolean).join(" ") ||
            "Aurelian could not complete this analysis.",
        );
      }

      const completedResponse = body as ResearchResponse;
      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        question: cleanedQuestion,
        response: completedResponse,
        createdAt: new Date().toISOString(),
      };

      const updatedConversation: SavedConversation = {
        ...conversation,
        updatedAt: newTurn.createdAt,
        turns: [...conversation.turns, newTurn],
      };

      setResponse(completedResponse);
      setStage("complete");
      onConversationChange(updatedConversation);
    } catch (caughtError) {
      window.clearTimeout(rankingTimer);
      window.clearTimeout(synthesisTimer);
      setStage("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected research error occurred.",
      );
    }
  }

  useEffect(() => {
    if (initializedConversationId.current === conversation.id) return;

    initializedConversationId.current = conversation.id;
    const savedTurn = conversation.turns.at(-1);

    if (savedTurn) {
      setActiveQuestion(savedTurn.question);
      setResponse(savedTurn.response);
      setStage("complete");
      return;
    }

    void runResearch(conversation.originalPrompt, false);
    // The conversation ID controls initialization. runResearch intentionally
    // uses the conversation snapshot supplied for this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  const isResearching =
    stage === "searching" || stage === "ranking" || stage === "synthesizing";
  const isFollowUp = conversation.turns.length > 0;

  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-100/[0.035] blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="mb-10 gap-2 text-white/55 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All analyses
        </Button>

        <div className="space-y-10">
          <article className="ml-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.055] px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/35">
              You
            </p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white/85">
              {activeQuestion}
            </p>

            {isFollowUp && activeQuestion !== conversation.originalPrompt && (
              <p className="mt-4 border-t border-white/[0.07] pt-4 text-xs leading-5 text-white/35">
                Follow-up to: {conversation.originalPrompt}
              </p>
            )}

            {conversation.selectedTools.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {conversation.selectedTools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-white/45"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </article>

          <article className="max-w-4xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100/20 bg-amber-100/[0.055]">
                <Sparkles className="h-5 w-5 text-amber-100" />
              </div>
              <div>
                <p className="font-semibold text-white">Aurelian</p>
                <p className="text-sm text-white/40">Executive Intelligence</p>
              </div>
            </div>

            {isResearching && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/85 px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/55">
                      Research in progress
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-white">
                      {isFollowUp ? "Continuing the analysis" : "Investigating your question"}
                    </h2>
                  </div>
                  <LoaderCircle className="h-5 w-5 animate-spin text-amber-100/70" />
                </div>

                <div className="mt-7 space-y-3">
                  {progressSteps.map((step, index) => {
                    const currentIndex = stageIndex[stage];
                    const isComplete = index < currentIndex;
                    const isActive = index === currentIndex;

                    return (
                      <div
                        key={step.id}
                        className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-4"
                      >
                        <div
                          className={
                            isComplete
                              ? "flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200"
                              : isActive
                                ? "flex h-8 w-8 items-center justify-center rounded-full border border-amber-100/30 bg-amber-100/[0.08] text-amber-100"
                                : "flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/25"
                          }
                        >
                          {isComplete ? (
                            <Check className="h-4 w-4" />
                          ) : isActive ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className={isActive || isComplete ? "text-sm font-medium text-white/85" : "text-sm text-white/35"}>
                            {step.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/35">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stage === "error" && (
              <div className="rounded-2xl border border-red-300/15 bg-red-300/[0.035] px-6 py-6">
                <div className="flex items-start gap-4">
                  <CircleAlert className="mt-0.5 h-5 w-5 text-red-200/80" />
                  <div>
                    <p className="font-semibold text-white">Analysis interrupted</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">{error}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void runResearch(activeQuestion, isFollowUp)}
                      className="mt-5 gap-2 border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/85 px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-8">
                  <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/55">
                        Aurelian analysis
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">
                        Research findings
                      </h2>
                    </div>
                    <div className="text-xs leading-5 text-white/30 sm:text-right">
                      <p>{response.metadata.totalResults} ranked sources</p>
                      <p>{formatDate(response.metadata.researchedAt)}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {splitSummary(response.summary).map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap text-base leading-8 text-white/72">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <p className="mt-7 border-t border-white/[0.07] pt-5 text-xs leading-5 text-white/30">
                    Synthesized from ranked web research. Review source material before making critical legal, financial, or operational decisions.
                  </p>
                </section>

                <section className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/75 px-6 py-6 sm:px-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/55">
                        Evidence
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">Ranked sources</h2>
                    </div>
                    <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/35">
                      {response.sources.length}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2">
                    {response.sources.map((source) => {
                      const expanded = expandedSourceId === source.id;

                      return (
                        <article
                          key={source.id}
                          className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedSourceId(expanded ? null : source.id)}
                            className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.025]"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-amber-100/70">
                              {source.rank}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-white/78">
                                {source.title}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/30">
                                <span>{source.domain ?? "External source"}</span>
                                <span>•</span>
                                <span>{trustLabel(source.trustLevel)}</span>
                                <span>•</span>
                                <span>{relevancePercent(source.score)} relevance</span>
                              </span>
                            </span>
                            <ChevronDown
                              className={expanded ? "h-4 w-4 rotate-180 text-white/35 transition" : "h-4 w-4 text-white/35 transition"}
                            />
                          </button>

                          {expanded && (
                            <div className="border-t border-white/[0.06] px-4 py-4 sm:pl-15">
                              <p className="text-sm leading-6 text-white/50">
                                {source.content || "No source preview was returned."}
                              </p>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-amber-100/70 transition hover:text-amber-100"
                              >
                                Open original source
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/65 px-6 py-6 sm:px-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/55">
                    Continue the analysis
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {followUps.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        onClick={() => void runResearch(followUp, true)}
                        className="flex min-h-20 items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left text-sm leading-5 text-white/55 transition hover:border-amber-100/15 hover:bg-amber-100/[0.035] hover:text-white/80"
                      >
                        <span>{followUp}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-amber-100/45" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}