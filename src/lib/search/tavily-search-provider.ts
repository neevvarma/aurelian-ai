import { tavily } from "@tavily/core";
import iconv from "iconv-lite";

import type {
  SearchOptions,
  SearchProvider,
} from "@/lib/search/SearchProvider";

import type {
  SearchResponse,
  SearchResult,
} from "@/types/research";

export class TavilySearchProvider
  implements SearchProvider
{
  readonly name = "tavily";

  private readonly client;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "A Tavily API key is required.",
      );
    }

    this.client = tavily({
      apiKey,
    });
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse> {
    const response = await this.client.search(
      query,
      {
        searchDepth: "advanced",
        maxResults: options.maxResults ?? 8,
        includeAnswer:
          options.includeAnswer ?? "advanced",
        includeRawContent: false,
        includeDomains: options.includeDomains,
        excludeDomains: options.excludeDomains,
      },
    );

    const results: SearchResult[] =
      response.results
        .filter(
          (result) =>
            typeof result.title === "string" &&
            typeof result.url === "string",
        )
        .map((result, index) => ({
          id: `tavily-${index + 1}`,
          title: this.cleanText(result.title),
          url: result.url,
          content: this.cleanText(
            result.content ?? "",
          ),
          domain: this.extractDomain(
            result.url,
          ),
          publishedAt:
            result.publishedDate,
          sourceType: "web",
          relevanceScore:
            typeof result.score === "number"
              ? result.score
              : undefined,
        }));

    return {
      answer:
        typeof response.answer === "string"
          ? this.cleanText(response.answer)
          : undefined,
      results,
    };
  }

  private extractDomain(
    url: string,
  ): string | undefined {
    try {
      return new URL(url).hostname
        .toLowerCase()
        .replace(/^www\./, "");
    } catch {
      return undefined;
    }
  }

  private cleanText(value: string): string {
    if (!value) {
      return "";
    }

    let cleaned = value;

    if (this.looksLikeMojibake(cleaned)) {
      cleaned =
        this.repairWindows1252Mojibake(
          cleaned,
        );
    }

    cleaned =
      this.replaceCompleteArtifacts(
        cleaned,
      );

    cleaned =
      this.replacePartialArtifacts(
        cleaned,
      );

    return cleaned
      .replace(/\u00a0/g, " ")
      .replace(/\u200b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private looksLikeMojibake(
    value: string,
  ): boolean {
    return /Ã|Â|â|ðŸ|ï¿½/.test(value);
  }

  private repairWindows1252Mojibake(
    value: string,
  ): string {
    try {
      const encoded = iconv.encode(
        value,
        "windows-1252",
      );

      const repaired = iconv.decode(
        encoded,
        "utf8",
      );

      const originalArtifactCount =
        this.countMojibakeArtifacts(value);

      const repairedArtifactCount =
        this.countMojibakeArtifacts(repaired);

      return repairedArtifactCount <
        originalArtifactCount
        ? repaired
        : value;
    } catch {
      return value;
    }
  }

  private countMojibakeArtifacts(
    value: string,
  ): number {
    return (
      value.match(
        /Ã|Â|â|ðŸ|ï¿½/g,
      )?.length ?? 0
    );
  }

  private replaceCompleteArtifacts(
    value: string,
  ): string {
    return value
      .replace(/â€™/g, "’")
      .replace(/â€˜/g, "‘")
      .replace(/â€œ/g, "“")
      .replace(/â€/g, "”")
      .replace(/â€“/g, "–")
      .replace(/â€”/g, "—")
      .replace(/â€¦/g, "…")
      .replace(/â€¢/g, "•")
      .replace(/Â©/g, "©")
      .replace(/Â®/g, "®")
      .replace(/Â£/g, "£")
      .replace(/Â¥/g, "¥")
      .replace(/Â€/g, "€")
      .replace(/Â/g, "");
  }

  private replacePartialArtifacts(
    value: string,
  ): string {
    let cleaned = value;

    cleaned = cleaned.replace(
      /([A-Za-z])â(ll|re|ve|d|m|t|s)\b/g,
      "$1’$2",
    );

    cleaned = cleaned.replace(
      /([A-Za-z])â(?=\s+[A-Z])/g,
      "$1’",
    );

    cleaned = cleaned.replace(
      /([a-z])â(?=[a-z])/g,
      "$1—",
    );

    cleaned = cleaned.replace(
      /(^|[\s([{])â(?=[A-Za-z0-9])/g,
      "$1“",
    );

    cleaned = cleaned.replace(
      /([A-Za-z0-9])â(?=[\s.,;:!?)}\]])/g,
      "$1”",
    );

    return cleaned.replace(/â/g, "");
  }
}