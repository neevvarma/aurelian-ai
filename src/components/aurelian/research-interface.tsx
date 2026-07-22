"use client";

import Image from "next/image";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ResearchProgress } from
  "@/components/aurelian/research-progress";
import { Sidebar } from
  "@/components/aurelian/sidebar";
import { SourceCard } from
  "@/components/aurelian/source-card";

import type {
  RecentResearchItem,
  ResearchResponse,
  ResearchStage,
} from "@/types/research";

const starterPrompts = [
  {
    category: "Market strategy",
    title: "Evaluate an international market",
    prompt:
      "What factors should a small US software company evaluate before expanding into the UK market?",
  },
  {
    category: "Competitive intelligence",
    title: "Compare major competitors",
    prompt:
      "Compare OpenAI and Anthropic from a business strategy perspective.",
  },
  {
    category: "Business planning",
    title: "Explore an AI opportunity",
    prompt:
      "What are the biggest opportunities for AI automation in small businesses?",
  },
  {
    category: "Risk analysis",
    title: "Evaluate international hiring",
    prompt:
      "What legal and operational risks should a US startup consider before hiring employees internationally?",
  },
];

const HISTORY_STORAGE_KEY = "aurelian.recent-research.v1";
const MAX_SEARCH_QUERY_LENGTH = 390;

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  const cleaned = compactText(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildContextualPrompt(rootQuery: string, followUp: string) {
  const prompt = [
    `Topic: ${truncateText(rootQuery, 180)}`,
    `Follow-up: ${truncateText(followUp, 145)}`,
    "Answer only within this topic. Use current, relevant sources.",
  ].join("\n");

  return truncateText(prompt, MAX_SEARCH_QUERY_LENGTH);
}

function createResearchTitle(query: string) {
  const cleaned = query
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length <= 42
    ? cleaned
    : `${cleaned.slice(0, 39)}...`;
}

function formatResearchDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function createFollowUps(query: string) {
  const normalized = (query ?? "").toLowerCase();

  if (
    normalized.includes("uk") ||
    normalized.includes("united kingdom")
  ) {
    return [
      "Should the company create a UK subsidiary?",
      "What UK tax and VAT rules would apply?",
      "Compare expansion into the UK and Germany.",
      "Create a low-risk UK market-entry plan.",
    ];
  }

  if (
    normalized.includes("compare") ||
    normalized.includes("competitor")
  ) {
    return [
      "Which company has the stronger long-term advantage?",
      "Compare their pricing and target customers.",
      "What risks could change the competitive landscape?",
      "Create an executive comparison table.",
    ];
  }

  return [
    "What are the most important risks?",
    "Create a practical action plan.",
    "Which sources are most authoritative?",
    "What else should be researched?",
  ];
}

function splitSummary(summary: string) {
  const explicitParagraphs = summary
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences =
    summary.match(
      /[^.!?]+[.!?]+|[^.!?]+$/g,
    ) ?? [summary];

  if (sentences.length <= 3) {
    return [summary];
  }

  const paragraphs: string[] = [];

  for (
    let index = 0;
    index < sentences.length;
    index += 2
  ) {
    paragraphs.push(
      sentences
        .slice(index, index + 2)
        .join(" ")
        .trim(),
    );
  }

  return paragraphs;
}

export function ResearchInterface() {
  const [query, setQuery] = useState("");
  const [
    submittedQuery,
    setSubmittedQuery,
  ] = useState("");

  const [response, setResponse] =
    useState<ResearchResponse | null>(null);

  const [stage, setStage] =
    useState<ResearchStage>("idle");

  const [error, setError] =
    useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [
    recentResearch,
    setRecentResearch,
  ] = useState<RecentResearchItem[]>([]);

  const [activeResearchId, setActiveResearchId] =
    useState<string | null>(null);

  const [rootQuery, setRootQuery] =
    useState("");

  const [historyLoaded, setHistoryLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as RecentResearchItem[];

        if (Array.isArray(parsed)) {
          setRecentResearch(parsed);
        }
      }
    } catch (historyError) {
      console.warn("Aurelian could not load recent research.", historyError);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(recentResearch),
      );
    } catch (historyError) {
      console.warn("Aurelian could not save recent research.", historyError);
    }
  }, [historyLoaded, recentResearch]);

  const isResearching =
    stage === "searching" ||
    stage === "ranking" ||
    stage === "synthesizing";

  const showLanding =
    stage === "idle" &&
    !submittedQuery &&
    !response;

  const sourceDomains = useMemo(() => {
    if (!response) {
      return [];
    }

    return Array.from(
      new Set(
        response.sources
          .map((source) => source.domain)
          .filter(
            (domain): domain is string =>
              Boolean(domain),
          ),
      ),
    );
  }, [response]);

  const followUps = useMemo(
    () =>
      createFollowUps(
        `${rootQuery} ${submittedQuery || query}`,
      ),
    [query, rootQuery, submittedQuery],
  );

  async function runResearch(
    requestedQuery: string,
    options?: {
      isFollowUp?: boolean;
      researchId?: string;
      preserveHistoryItem?: boolean;
    },
  ) {
    const normalizedQuery =
      requestedQuery.trim();

    if (
      !normalizedQuery ||
      isResearching
    ) {
      return;
    }

    const isFollowUp = options?.isFollowUp ?? false;
    const conversationRoot = isFollowUp
      ? rootQuery || submittedQuery || normalizedQuery
      : normalizedQuery;
    const researchId =
      options?.researchId ??
      (isFollowUp && activeResearchId
        ? activeResearchId
        : crypto.randomUUID());
    const requestPrompt = isFollowUp
      ? buildContextualPrompt(conversationRoot, normalizedQuery)
      : normalizedQuery;

    if (!isFollowUp) {
      setRootQuery(conversationRoot);
      setActiveResearchId(researchId);
    }

    setQuery(normalizedQuery);
    setSubmittedQuery(normalizedQuery);
    setResponse(null);
    setError(null);
    setStage("searching");

    const rankingTimer = window.setTimeout(
      () => {
        setStage((current) =>
          current === "searching"
            ? "ranking"
            : current,
        );
      },
      800,
    );

    const synthesisTimer =
      window.setTimeout(() => {
        setStage((current) =>
          current === "searching" ||
          current === "ranking"
            ? "synthesizing"
            : current,
        );
      }, 1700);

    try {
      const apiResponse = await fetch(
        "/api/aurelian",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt: requestPrompt,
            selectedTools: [
              "Web",
              "Deep Research",
            ],
          }),
        },
      );

      const body = (await apiResponse.json()) as
        | ResearchResponse
        | {
            error?: string;
            message?: string;
          };

      window.clearTimeout(rankingTimer);
      window.clearTimeout(synthesisTimer);

      if (!apiResponse.ok) {
        const message =
          "error" in body
            ? body.error
            : "message" in body
              ? body.message
              : undefined;

        throw new Error(
          message ||
            "Aurelian could not complete the research request.",
        );
      }

      const completedResponse =
        body as ResearchResponse;

      setResponse(completedResponse);
      setStage("complete");

      const updatedAt = new Date().toISOString();

      if (isFollowUp || options?.preserveHistoryItem) {
        setRecentResearch((current) =>
          current.map((item) =>
            item.id === researchId
              ? { ...item, createdAt: updatedAt }
              : item,
          ),
        );
      } else {
        const historyItem: RecentResearchItem = {
          id: researchId,
          title: createResearchTitle(conversationRoot),
          query: conversationRoot,
          createdAt: updatedAt,
        };

        setRecentResearch((current) =>
          [
            historyItem,
            ...current.filter((item) => item.id !== researchId),
          ].slice(0, 8),
        );
      }
    } catch (caughtError) {
      window.clearTimeout(rankingTimer);
      window.clearTimeout(synthesisTimer);

      setStage("error");

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred.",
      );
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void runResearch(query, {
      isFollowUp: Boolean(activeResearchId && response),
      researchId: activeResearchId ?? undefined,
    });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void runResearch(query, {
        isFollowUp: Boolean(activeResearchId && response),
        researchId: activeResearchId ?? undefined,
      });
    }
  }

  function handleNewResearch() {
    setQuery("");
    setSubmittedQuery("");
    setResponse(null);
    setError(null);
    setStage("idle");
    setActiveResearchId(null);
    setRootQuery("");
    setSidebarOpen(false);
  }

  function selectRecentResearch(
    item: RecentResearchItem,
  ) {
    setSidebarOpen(false);
    setActiveResearchId(item.id);
    setRootQuery(item.query);
    void runResearch(item.query, {
      researchId: item.id,
      preserveHistoryItem: true,
    });
  }

  return (
    <div className="app-shell">
      <Sidebar
        recentResearch={recentResearch}
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        onNewResearch={
          handleNewResearch
        }
        onSelectResearch={
          selectRecentResearch
        }
      />

      <main className="main-workspace">
        <header className="mobile-header">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open sidebar"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            ☰
          </button>

          <div className="mobile-brand">
            <Image
              src="/images/obsidian-logo.png"
              alt="Aurelian"
              width={28}
              height={28}
              className="mobile-brand-mark"
              priority
            />

            Aurelian
          </div>

          <button
            type="button"
            className="mobile-new-button"
            aria-label="Start new research"
            onClick={handleNewResearch}
          >
            ＋
          </button>
        </header>

        <div
          className={[
            "workspace-scroll",
            showLanding
              ? "workspace-scroll-landing"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {showLanding ? (
            <section className="landing-section">
              <div className="landing-orb">
                <Image
                  src="/images/obsidian-logo.png"
                  alt="Aurelian"
                  width={76}
                  height={76}
                  className="landing-logo"
                  priority
                />
              </div>

              <div className="eyebrow landing-eyebrow">
                Research with clarity
              </div>

              <h1 className="landing-title">
                What would you like
                <br />
                to understand?
              </h1>

              <p className="landing-description">
                Aurelian searches, evaluates,
                and synthesizes information
                into research you can act on.
              </p>

              <form
                className="prompt-form landing-prompt-form"
                onSubmit={handleSubmit}
              >
                <div className="prompt-box">
                  <textarea
                    className="prompt-textarea"
                    value={query}
                    rows={2}
                    placeholder="Ask a complex business or research question..."
                    onChange={(event) =>
                      setQuery(
                        event.target.value,
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                  />

                  <div className="prompt-toolbar">
                    <div className="research-mode">
                      <span
                        className="research-mode-dot"
                        aria-hidden="true"
                      />

                      Deep Research
                    </div>

                    <button
                      type="submit"
                      className="submit-button"
                      aria-label="Submit research question"
                      disabled={
                        !query.trim() ||
                        isResearching
                      }
                    >
                      ↑
                    </button>
                  </div>
                </div>
              </form>

              <div className="starter-grid">
                {starterPrompts.map(
                  (prompt) => (
                    <button
                      key={prompt.prompt}
                      type="button"
                      className="starter-card"
                      onClick={() => {
                        setQuery(
                          prompt.prompt,
                        );

                        void runResearch(
                          prompt.prompt,
                        );
                      }}
                    >
                      <div className="starter-category">
                        {prompt.category}
                      </div>

                      <div className="starter-title">
                        {prompt.title}
                      </div>

                      <div
                        className="starter-arrow"
                        aria-hidden="true"
                      >
                        ↗
                      </div>
                    </button>
                  ),
                )}
              </div>
            </section>
          ) : (
            <div className="research-layout">
              <section className="research-query-header">
                <div className="eyebrow">
                  Research question
                </div>

                <h1 className="research-query">
                  {submittedQuery}
                </h1>

                {rootQuery && submittedQuery !== rootQuery ? (
                  <p className="research-context-line">
                    Follow-up to: {rootQuery}
                  </p>
                ) : null}
              </section>

              {isResearching ? (
                <ResearchProgress
                  stage={stage}
                  sourceCount={
                    response?.sources
                      .length ?? 0
                  }
                  domains={sourceDomains}
                />
              ) : null}

              {error ? (
                <section className="error-panel">
                  <div
                    className="error-icon"
                    aria-hidden="true"
                  >
                    !
                  </div>

                  <div>
                    <h2>
                      Research could not be
                      completed
                    </h2>

                    <p>{error}</p>

                    <button
                      type="button"
                      className="retry-button"
                      onClick={() =>
                        void runResearch(
                          submittedQuery,
                        )
                      }
                    >
                      Try again
                    </button>
                  </div>
                </section>
              ) : null}

              {response ? (
                <>
                  <section className="answer-section">
                    <div className="answer-heading-row">
                      <div>
                        <div className="eyebrow">
                          Aurelian analysis
                        </div>

                        <h2 className="answer-title">
                          Research findings
                        </h2>
                      </div>

                      <div className="answer-meta">
                        <span>
                          {
                            response.metadata
                              .totalResults
                          }{" "}
                          sources
                        </span>

                        <span>
                          {formatResearchDate(
                            response.metadata
                              .researchedAt,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="answer-content">
                      {splitSummary(
                        response.summary,
                      ).map(
                        (
                          paragraph,
                          index,
                        ) => (
                          <p key={index}>
                            {paragraph}
                          </p>
                        ),
                      )}
                    </div>

                    <div className="answer-footnote">
                      <span
                        className="answer-footnote-icon"
                        aria-hidden="true"
                      >
                        ◇
                      </span>

                      This response was
                      synthesized from ranked
                      web research. Review the
                      underlying sources before
                      making important legal,
                      financial, or operational
                      decisions.
                    </div>
                  </section>

                  <section className="sources-section">
                    <div className="section-heading-row">
                      <div>
                        <div className="eyebrow">
                          Evidence
                        </div>

                        <h2 className="section-title">
                          Ranked sources
                        </h2>
                      </div>

                      <div className="section-count">
                        {
                          response.sources
                            .length
                        }
                      </div>
                    </div>

                    <div className="source-list">
                      {response.sources.map(
                        (source) => (
                          <SourceCard
                            key={source.id}
                            source={source}
                          />
                        ),
                      )}
                    </div>
                  </section>

                  <section className="follow-up-section">
                    <div>
                      <div className="eyebrow">
                        Continue exploring
                      </div>

                      <h2 className="section-title">
                        Suggested follow-ups
                      </h2>
                    </div>

                    <div className="follow-up-grid">
                      {followUps.map(
                        (followUp) => (
                          <button
                            key={followUp}
                            type="button"
                            className="follow-up-card"
                            onClick={() => {
                              setQuery(
                                followUp,
                              );

                              void runResearch(
                                followUp,
                                {
                                  isFollowUp: true,
                                  researchId:
                                    activeResearchId ?? undefined,
                                },
                              );
                            }}
                          >
                            <span>
                              {followUp}
                            </span>

                            <span
                              className="follow-up-arrow"
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          )}
        </div>

        {!showLanding ? (
          <div className="bottom-composer">
            <form
              className="prompt-form compact-prompt-form"
              onSubmit={handleSubmit}
            >
              <div className="prompt-box compact-prompt-box">
                <textarea
                  className="prompt-textarea compact-prompt-textarea"
                  value={query}
                  rows={1}
                  placeholder="Ask a follow-up question..."
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                />

                <button
                  type="submit"
                  className="submit-button"
                  aria-label="Submit research question"
                  disabled={
                    !query.trim() ||
                    isResearching
                  }
                >
                  {isResearching
                    ? "·"
                    : "↑"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </main>
    </div>
  );
}