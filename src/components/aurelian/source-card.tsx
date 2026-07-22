"use client";

import { useState } from "react";

import type {
  RankedSearchResult,
} from "@/types/research";

type SourceCardProps = {
  source: RankedSearchResult;
};

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function trustLabel(
  value: RankedSearchResult["trustLevel"],
) {
  if (value === "high") {
    return "High trust";
  }

  if (value === "medium") {
    return "Medium trust";
  }

  return "General source";
}

function getInitial(
  source: RankedSearchResult,
) {
  const sourceName =
    source.domain ||
    source.title ||
    "Source";

  return sourceName
    .charAt(0)
    .toUpperCase();
}

export function SourceCard({
  source,
}: SourceCardProps) {
  const [isExpanded, setIsExpanded] =
    useState(false);

  return (
    <article
      className={[
        "source-card",
        isExpanded
          ? "source-card-expanded"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="source-card-header"
        aria-expanded={isExpanded}
        onClick={() =>
          setIsExpanded(
            (current) => !current,
          )
        }
      >
        <div className="source-rank">
          {source.rank}
        </div>

        <div className="source-favicon">
          {getInitial(source)}
        </div>

        <div className="source-heading-copy">
          <div className="source-title">
            {source.title}
          </div>

          <div className="source-meta">
            <span>
              {source.domain ??
                "External source"}
            </span>

            <span
              className={[
                "trust-badge",
                `trust-${source.trustLevel}`,
              ].join(" ")}
            >
              {trustLabel(
                source.trustLevel,
              )}
            </span>

            <span className="source-score">
              {formatScore(source.score)}
              relevance
            </span>
          </div>
        </div>

        <span
          className={[
            "source-expand-icon",
            isExpanded
              ? "source-expand-icon-open"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {isExpanded ? (
        <div className="source-card-body">
          <p className="source-snippet">
            {source.content ||
              "No preview was available for this source."}
          </p>

          <div className="source-card-actions">
            <a
              className="source-link"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              Open original source
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      ) : null}
    </article>
  );
}