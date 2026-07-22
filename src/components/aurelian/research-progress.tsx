"use client";

import type {
  ResearchStage,
} from "@/types/research";

type ResearchProgressProps = {
  stage: ResearchStage;
  sourceCount?: number;
  domains?: string[];
};

type ProgressStep = {
  id:
    | "searching"
    | "ranking"
    | "synthesizing";
  label: string;
  description: string;
};

const steps: ProgressStep[] = [
  {
    id: "searching",
    label: "Searching the web",
    description:
      "Finding relevant sources across trusted domains.",
  },
  {
    id: "ranking",
    label: "Evaluating evidence",
    description:
      "Ranking sources by relevance and trust.",
  },
  {
    id: "synthesizing",
    label: "Building the answer",
    description:
      "Combining the strongest findings into a clear response.",
  },
];

const stageOrder: Record<
  ResearchStage,
  number
> = {
  idle: -1,
  searching: 0,
  ranking: 1,
  synthesizing: 2,
  complete: 3,
  error: -1,
};

function getStepState(
  stepIndex: number,
  stage: ResearchStage,
) {
  const currentIndex = stageOrder[stage];

  if (
    stage === "complete" ||
    stepIndex < currentIndex
  ) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

export function ResearchProgress({
  stage,
  sourceCount = 0,
  domains = [],
}: ResearchProgressProps) {
  const visibleDomains = domains
    .filter(Boolean)
    .slice(0, 4);

  return (
    <section
      className="research-progress"
      aria-live="polite"
    >
      <div className="progress-heading-row">
        <div>
          <div className="eyebrow">
            Research process
          </div>

          <h2 className="progress-title">
            Aurelian is investigating
          </h2>
        </div>

        <div className="research-pulse">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="progress-steps">
        {steps.map((step, index) => {
          const stepState = getStepState(
            index,
            stage,
          );

          return (
            <div
              key={step.id}
              className={[
                "progress-step",
                `progress-step-${stepState}`,
              ].join(" ")}
            >
              <div className="progress-step-marker">
                {stepState === "complete"
                  ? "✓"
                  : index + 1}
              </div>

              <div className="progress-step-copy">
                <div className="progress-step-label">
                  {step.label}
                </div>

                <div className="progress-step-description">
                  {step.description}
                </div>
              </div>

              {stepState === "active" ? (
                <div
                  className="mini-spinner"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {visibleDomains.length > 0 ? (
        <div className="discovered-sources">
          <div className="discovered-label">
            {sourceCount > 0
              ? `${sourceCount} sources identified`
              : "Sources identified"}
          </div>

          <div className="domain-chip-row">
            {visibleDomains.map((domain) => (
              <span
                key={domain}
                className="domain-chip"
              >
                <span
                  className="domain-chip-check"
                  aria-hidden="true"
                >
                  ✓
                </span>

                {domain}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}