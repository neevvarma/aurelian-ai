import { NextResponse } from "next/server";

import { ResearchEngine } from "@/lib/research/research-engine";
import { TavilySearchProvider } from "@/lib/search/tavily-search-provider";

type AurelianRequestBody = {
  prompt?: unknown;
  selectedTools?: unknown;
};

function createResearchEngine(): ResearchEngine | null {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return null;
  }

  const searchProvider = new TavilySearchProvider(apiKey);

  return new ResearchEngine(searchProvider);
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as AurelianRequestBody;

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    const selectedTools = Array.isArray(
      body.selectedTools,
    )
      ? body.selectedTools.filter(
          (tool): tool is string =>
            typeof tool === "string",
        )
      : [];

    if (!prompt) {
      return NextResponse.json(
        {
          error: "A research prompt is required.",
        },
        {
          status: 400,
        },
      );
    }

    const researchEngine = createResearchEngine();

    if (!researchEngine) {
      return NextResponse.json(
        {
          error:
            "Tavily is not configured. Add TAVILY_API_KEY to .env.local and restart the development server.",
        },
        {
          status: 500,
        },
      );
    }

    const result = await researchEngine.research({
      query: prompt,
      selectedTools,
      maxResults: 8,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Aurelian research error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown research error.";

    return NextResponse.json(
      {
        error:
          "Aurelian could not complete the research request.",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}