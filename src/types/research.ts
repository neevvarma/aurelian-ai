export type SourceType =
  | "web"
  | "document"
  | "internal";

export type TrustLevel =
  | "high"
  | "medium"
  | "low";

export type SearchResult = {
  id: string;
  title: string;
  url: string;
  content: string;
  domain?: string;
  publishedAt?: string;
  sourceType: SourceType;
  relevanceScore?: number;
};

export type RankedSearchResult =
  SearchResult & {
    rank: number;
    score: number;
    trustLevel: TrustLevel;
  };

export type SearchResponse = {
  answer?: string;
  results: SearchResult[];
};

export type ResearchRequest = {
  query: string;
  selectedTools?: string[];
  maxResults?: number;
};

export type ResearchMetadata = {
  provider: string;
  totalResults: number;
  researchedAt: string;
};

export type ResearchResponse = {
  query: string;
  summary: string;
  sources: RankedSearchResult[];
  metadata: ResearchMetadata;
};

export type ResearchStage =
  | "idle"
  | "searching"
  | "ranking"
  | "synthesizing"
  | "complete"
  | "error";

export type RecentResearchItem = {
  id: string;
  title: string;
  query: string;
  createdAt: string;
};