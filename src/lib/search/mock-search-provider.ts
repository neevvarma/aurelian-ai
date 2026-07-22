import type {
  SearchOptions,
  SearchProvider,
} from "@/lib/search/SearchProvider";

import type {
  SearchResponse,
} from "@/types/research";

export class MockSearchProvider
  implements SearchProvider
{
  readonly name = "mock";

  async search(
    query: string,
    _options: SearchOptions = {},
  ): Promise<SearchResponse> {
    return {
      answer:
        `This is a mock synthesized answer for "${query}".`,
      results: [
        {
          id: "mock-1",
          title:
            "Government Business Guidance",
          url: "https://www.gov.uk/example",
          content:
            "Official guidance related to the research question.",
          domain: "gov.uk",
          sourceType: "web",
          relevanceScore: 0.92,
        },
        {
          id: "mock-2",
          title:
            "Industry Research Report",
          url: "https://www.mckinsey.com/example",
          content:
            "Industry analysis related to the research question.",
          domain: "mckinsey.com",
          sourceType: "web",
          relevanceScore: 0.81,
        },
        {
          id: "mock-3",
          title:
            "Independent Business Article",
          url: "https://example.com/article",
          content:
            "General commentary related to the research question.",
          domain: "example.com",
          sourceType: "web",
          relevanceScore: 0.68,
        },
      ],
    };
  }
}