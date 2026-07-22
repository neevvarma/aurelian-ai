import type {
  SearchResponse,
} from "@/types/research";

export type SearchOptions = {
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeAnswer?: boolean | "basic" | "advanced";
};

export interface SearchProvider {
  readonly name: string;

  search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResponse>;
}