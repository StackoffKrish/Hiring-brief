// TinyFish Search + Fetch service (server-side only).
// Docs: https://docs.tinyfish.ai/search-api/reference
//       https://docs.tinyfish.ai/fetch-api

const DEFAULT_SEARCH_BASE_URL = "https://api.search.tinyfish.ai";
const DEFAULT_FETCH_BASE_URL = "https://api.fetch.tinyfish.ai";

export interface TinyFishSearchResult {
  siteName?: string;
  title: string;
  snippet: string;
  url: string;
  date?: string;
}

export interface TinyFishSearchResponse {
  query: string;
  results: TinyFishSearchResult[];
}

export interface TinyFishFetchedPage {
  url: string;
  finalUrl?: string;
  text: string;
}

export interface TinyFishFetchError {
  url: string;
  error: string;
}

export interface TinyFishFetchResponse {
  results: TinyFishFetchedPage[];
  errors: TinyFishFetchError[];
}

export class TinyFishError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TinyFishError";
    this.status = status;
  }
}

function getApiKey(): string | undefined {
  return process.env.TINYFISH_API_KEY?.trim() || undefined;
}

export function isTinyFishConfigured(): boolean {
  return Boolean(getApiKey());
}

function getBaseUrl(envValue: string | undefined, fallback: string): string {
  return envValue?.trim().replace(/\/+$/, "") || fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  label: string
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TinyFishError(`${label} timed out. Please try again.`, 408);
    }
    throw new TinyFishError(
      `Could not reach TinyFish for ${label.toLowerCase()}. Please try again.`
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function parseJsonResponse(
  response: Response,
  label: string
): Promise<unknown> {
  const text = await response.text();

  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    let detail = "";
    if (isRecord(parsed)) {
      detail =
        asString(parsed.error) ??
        asString(parsed.message) ??
        (isRecord(parsed.detail) ? "" : asString(parsed.detail) ?? "");
    }
    if (!detail && text) {
      detail = text.slice(0, 200);
    }

    throw new TinyFishError(
      `TinyFish ${label} failed (${response.status}).${
        detail ? ` ${detail}` : ""
      } Check that TINYFISH_API_KEY is valid.`,
      response.status
    );
  }

  if (parsed === null) {
    throw new TinyFishError(`TinyFish ${label} returned an invalid response.`);
  }

  return parsed;
}

export interface SearchTinyFishInput {
  query: string;
  purpose?: string;
}

export async function searchTinyFish(
  input: SearchTinyFishInput
): Promise<TinyFishSearchResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new TinyFishError("TINYFISH_API_KEY is not configured.", 503);
  }

  const baseUrl = getBaseUrl(
    process.env.TINYFISH_SEARCH_BASE_URL,
    DEFAULT_SEARCH_BASE_URL
  );
  const url = new URL(baseUrl);
  url.searchParams.set("query", input.query);
  url.searchParams.set("language", "en");
  url.searchParams.set("page", "0");
  if (input.purpose) {
    url.searchParams.set("purpose", input.purpose.slice(0, 2000));
  }

  const response = await fetchWithTimeout(
    url.toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
    },
    15_000,
    "TinyFish Search"
  );

  const data = await parseJsonResponse(response, "Search");
  if (!isRecord(data) || !Array.isArray(data.results)) {
    throw new TinyFishError("TinyFish Search returned an unexpected response.");
  }

  const results = data.results.flatMap((item): TinyFishSearchResult[] => {
    if (!isRecord(item)) return [];
    const resultUrl = asString(item.url);
    if (!resultUrl) return [];

    return [
      {
        siteName: asString(item.site_name),
        title: asString(item.title) ?? resultUrl,
        snippet: asString(item.snippet) ?? "",
        url: resultUrl,
        date: asString(item.date),
      },
    ];
  });

  return {
    query: asString(data.query) ?? input.query,
    results,
  };
}

export async function fetchTinyFishContents(
  urls: string[]
): Promise<TinyFishFetchResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new TinyFishError("TINYFISH_API_KEY is not configured.", 503);
  }

  const uniqueUrls = Array.from(new Set(urls)).filter((url) =>
    /^https?:\/\//i.test(url)
  );
  const targetUrls = uniqueUrls.slice(0, 10);
  if (targetUrls.length === 0) {
    return { results: [], errors: [] };
  }

  const baseUrl = getBaseUrl(
    process.env.TINYFISH_FETCH_BASE_URL,
    DEFAULT_FETCH_BASE_URL
  );

  const response = await fetchWithTimeout(
    baseUrl,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        urls: targetUrls,
        format: "markdown",
      }),
    },
    45_000,
    "TinyFish Fetch"
  );

  const data = await parseJsonResponse(response, "Fetch");
  if (!isRecord(data) || !Array.isArray(data.results)) {
    throw new TinyFishError("TinyFish Fetch returned an unexpected response.");
  }

  const results = data.results.flatMap((item): TinyFishFetchedPage[] => {
    if (!isRecord(item)) return [];
    const resultUrl = asString(item.url);
    if (!resultUrl) return [];

    const text =
      typeof item.text === "string"
        ? item.text
        : item.text != null
          ? JSON.stringify(item.text)
          : "";

    return [
      {
        url: resultUrl,
        finalUrl: asString(item.final_url),
        text,
      },
    ];
  });

  const errors = Array.isArray(data.errors)
    ? data.errors.flatMap((item): TinyFishFetchError[] => {
        if (!isRecord(item)) return [];
        const errorUrl = asString(item.url);
        if (!errorUrl) return [];
        return [
          {
            url: errorUrl,
            error: asString(item.error) ?? "Fetch failed for this URL.",
          },
        ];
      })
    : [];

  return { results, errors };
}
