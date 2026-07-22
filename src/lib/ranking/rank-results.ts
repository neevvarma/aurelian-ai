import type {
  RankedSearchResult,
  SearchResult,
} from "@/types/research";

const HIGH_TRUST_DOMAINS = [
  "gov",
  "edu",
  "ac.uk",
  "gov.uk",
  "europa.eu",
  "sec.gov",
  "census.gov",
  "bls.gov",
  "sba.gov",
  "irs.gov",
  "federalreserve.gov",
  "bankofengland.co.uk",
  "ons.gov.uk",
  "companieshouse.gov.uk",
];

const MEDIUM_TRUST_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "ft.com",
  "wsj.com",
  "bloomberg.com",
  "economist.com",

  "jpmorgan.com",
  "goldmansachs.com",
  "morganstanley.com",
  "bankofamerica.com",
  "wellsfargo.com",

  "mckinsey.com",
  "deloitte.com",
  "pwc.com",
  "ey.com",
  "kpmg.com",
  "bain.com",
  "bcg.com",

  "pillsburylaw.com",
  "bakermckenzie.com",
  "dlapiper.com",
  "whitecase.com",
  "linklaters.com",

  "gartner.com",
  "forrester.com",
  "statista.com",
];

function normalizeDomain(domain?: string): string | undefined {
  if (!domain) {
    return undefined;
  }

  return domain
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function matchesDomain(
  domain: string,
  trustedDomain: string,
): boolean {
  /*
   * Generic suffixes such as "gov" and "edu" should match domains
   * ending in ".gov" or ".edu".
   */
  if (!trustedDomain.includes(".")) {
    return domain.endsWith(`.${trustedDomain}`);
  }

  return (
    domain === trustedDomain ||
    domain.endsWith(`.${trustedDomain}`)
  );
}

function getTrustLevel(
  domain?: string,
): RankedSearchResult["trustLevel"] {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return "low";
  }

  const isHighTrust = HIGH_TRUST_DOMAINS.some(
    (trustedDomain) =>
      matchesDomain(normalizedDomain, trustedDomain),
  );

  if (isHighTrust) {
    return "high";
  }

  const isMediumTrust = MEDIUM_TRUST_DOMAINS.some(
    (trustedDomain) =>
      matchesDomain(normalizedDomain, trustedDomain),
  );

  if (isMediumTrust) {
    return "medium";
  }

  return "low";
}

function getTrustScore(
  trustLevel: RankedSearchResult["trustLevel"],
): number {
  switch (trustLevel) {
    case "high":
      return 1;

    case "medium":
      return 0.78;

    case "low":
      return 0.45;
  }
}

function getFreshnessScore(publishedAt?: string): number {
  if (!publishedAt) {
    return 0.5;
  }

  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return 0.5;
  }

  const ageInDays =
    (Date.now() - publishedTime) /
    (1000 * 60 * 60 * 24);

  if (ageInDays <= 30) {
    return 1;
  }

  if (ageInDays <= 180) {
    return 0.85;
  }

  if (ageInDays <= 365) {
    return 0.7;
  }

  if (ageInDays <= 730) {
    return 0.55;
  }

  return 0.4;
}

function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    parsedUrl.hash = "";

    const trackingParameters = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
    ];

    for (const parameter of trackingParameters) {
      parsedUrl.searchParams.delete(parameter);
    }

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export function rankResults(
  results: SearchResult[],
): RankedSearchResult[] {
  const uniqueResults = Array.from(
    new Map(
      results.map((result) => [
        normalizeUrl(result.url),
        result,
      ]),
    ).values(),
  );

  return uniqueResults
    .map((result) => {
      const trustLevel = getTrustLevel(result.domain);
      const relevanceScore = result.relevanceScore ?? 0.5;
      const trustScore = getTrustScore(trustLevel);
      const freshnessScore = getFreshnessScore(
        result.publishedAt,
      );

      /*
       * Relevance remains the strongest factor.
       * Trust adjusts the quality of the source.
       * Freshness provides a smaller boost when publication dates exist.
       */
      const score =
        relevanceScore * 0.65 +
        trustScore * 0.25 +
        freshnessScore * 0.1;

      return {
        ...result,
        rank: 0,
        score: Number(score.toFixed(4)),
        trustLevel,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
}