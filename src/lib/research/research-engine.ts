import { rankResults } from "@/lib/ranking/rank-results";

import type {
  SearchProvider,
} from "@/lib/search/SearchProvider";

import type {
  RankedSearchResult,
  ResearchRequest,
  ResearchResponse,
} from "@/types/research";

const DEFAULT_EXCLUDED_DOMAINS = [
  "pinterest.com",
  "quora.com",
  "answers.com",
  "coursehero.com",
  "chegg.com",
];

export class ResearchEngine {
  constructor(
    private readonly searchProvider: SearchProvider,
  ) {}

  async research(
    request: ResearchRequest,
  ): Promise<ResearchResponse> {
    const query = request.query.trim();

    if (!query) {
      throw new Error(
        "A research query is required.",
      );
    }

    const searchResponse =
      await this.searchProvider.search(
        query,
        {
          maxResults:
            request.maxResults ?? 8,
          excludeDomains:
            DEFAULT_EXCLUDED_DOMAINS,
          includeAnswer: "advanced",
        },
      );

    const rankedResults = rankResults(
      searchResponse.results,
    );

    const summary = this.buildSummary(
      query,
      searchResponse.answer,
      rankedResults,
    );

    return {
      query,
      summary,
      sources: rankedResults,
      metadata: {
        provider:
          this.searchProvider.name,
        totalResults:
          rankedResults.length,
        researchedAt:
          new Date().toISOString(),
      },
    };
  }

  private buildSummary(
    query: string,
    generatedAnswer:
      | string
      | undefined,
    sources: RankedSearchResult[],
  ): string {
    if (
      generatedAnswer &&
      generatedAnswer.trim()
    ) {
      return generatedAnswer.trim();
    }

    if (sources.length === 0) {
      return [
        "Aurelian could not find enough",
        `reliable information for "${query}".`,
        "Try making the question more specific.",
      ].join(" ");
    }

    return [
      `Aurelian found ${sources.length}`,
      `sources related to "${query}",`,
      "but the synthesis provider did not",
      "return a generated answer.",
    ].join(" ");
  }
}