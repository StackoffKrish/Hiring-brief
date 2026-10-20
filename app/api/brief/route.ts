import { NextResponse } from "next/server";
import {
  GeminiError,
  getGeminiModel,
  isGeminiConfigured,
  summarizeWithGemini,
} from "@/lib/gemini";
import {
  PRIORITY_SITES,
  buildSearchPurpose,
  buildSearchQuery,
  buildSummaryPrompt,
  type BriefInput,
} from "@/lib/prompts";
import {
  TinyFishError,
  fetchTinyFishContents,
  isTinyFishConfigured,
  searchTinyFish,
} from "@/lib/tinyfish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CONTEXT_SOURCE_COUNT = 8;
const FETCH_SOURCE_COUNT = 5;

function getMissingConfig(): string[] {
  const missing: string[] = [];
  if (!isTinyFishConfigured()) missing.push("TINYFISH_API_KEY");
  if (!isGeminiConfigured()) missing.push("GEMINI_API_KEY");
  return missing;
}

/**
 * GET /api/brief
 * Non-secret configuration status, so the dashboard (and you) can see
 * whether the required API keys are present without exposing them.
 */
export async function GET() {
  const missing = getMissingConfig();

  return NextResponse.json(
    {
      configured: missing.length === 0,
      missing,
      services: {
        tinyfish: isTinyFishConfigured(),
        gemini: isGeminiConfigured(),
      },
      model: getGeminiModel(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns the cleaned string, "" when absent, or null when invalid. */
function cleanField(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  return value.trim().replace(/\s+/g, " ");
}

function errorResponse(
  message: string,
  status: number,
  code: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

function upstreamStatus(error: TinyFishError | GeminiError): number {
  if (error.status === 503) return 503;
  if (error.status === 408) return 504;
  return 502;
}

/**
 * POST /api/brief
 * Main orchestrator:
 * 1. Validate { company, role, location }.
 * 2. TinyFish Search for interview intel.
 * 3. TinyFish Fetch full text for the top results (best effort).
 * 4. gemini summarises the fetched content / snippets.
 * 5. Return { summary, sources, meta }.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "invalid_json");
  }

  if (!isRecord(body)) {
    return errorResponse(
      "Request body must be a JSON object.",
      400,
      "invalid_body"
    );
  }

  const company = cleanField(body.company);
  const role = cleanField(body.role);
  const location = cleanField(body.location);

  if (company === null || role === null || location === null) {
    return errorResponse(
      "company, role, and location must be strings.",
      400,
      "validation_error"
    );
  }

  if (company.length < 2 || company.length > 100) {
    return errorResponse(
      "Please enter a company name (2–100 characters).",
      400,
      "validation_error"
    );
  }

  if (role.length > 100 || location.length > 100) {
    return errorResponse(
      "role and location must be 100 characters or less.",
      400,
      "validation_error"
    );
  }

  const input: BriefInput = {
    company,
    role: role || undefined,
    location: location || undefined,
  };

  const missing = getMissingConfig();
  if (missing.length > 0) {
    return errorResponse(
      `The backend is not configured yet. Add ${missing.join(
        " and "
      )} to .env.local, then restart the dev server.`,
      503,
      "missing_config",
      { missing }
    );
  }

  const warnings: string[] = [];

  try {
    const query = buildSearchQuery(input);
    const search = await searchTinyFish({
      query,
      purpose: buildSearchPurpose(input),
      includeDomains: PRIORITY_SITES.length > 0 ? PRIORITY_SITES : undefined,
    });

    if (search.results.length === 0) {
      return errorResponse(
        `No web sources were found for "${query}". Try a different company, role, or location.`,
        404,
        "no_sources",
        { query }
      );
    }

    const contextResults = search.results.slice(0, CONTEXT_SOURCE_COUNT);
    const fetchUrls = contextResults
      .slice(0, FETCH_SOURCE_COUNT)
      .map((result) => result.url);

    // Fetch is best effort: if it fails, fall back to search snippets.
    const fetchedByUrl = new Map<string, string>();
    let fetchedCount = 0;
    try {
      const fetched = await fetchTinyFishContents(fetchUrls);
      for (const page of fetched.results) {
        if (page.text.trim()) {
          fetchedByUrl.set(page.url, page.text);
          if (page.finalUrl) fetchedByUrl.set(page.finalUrl, page.text);
          fetchedCount += 1;
        }
      }
      if (fetched.errors.length > 0 && fetchedCount === 0) {
        warnings.push(
          "Could not fetch full page content, so the summary is based on search snippets."
        );
      }
    } catch (error) {
      console.error(
        "TinyFish Fetch failed, falling back to snippets:",
        error instanceof Error ? error.message : error
      );
      warnings.push(
        "Could not fetch full page content, so the summary is based on search snippets."
      );
    }

    const promptSources = contextResults.map((result) => ({
      title: result.title,
      url: result.url,
      siteName: result.siteName,
      content: fetchedByUrl.get(result.url) ?? result.snippet,
    }));

    const summary = await summarizeWithGemini(
      buildSummaryPrompt(input, promptSources)
    );

    return NextResponse.json({
      summary,
      sources: contextResults.map((result) => ({
        title: result.title,
        url: result.url,
        siteName: result.siteName ?? null,
        snippet: result.snippet,
        date: result.date ?? null,
        fetched: fetchedByUrl.has(result.url),
      })),
      meta: {
        company: input.company,
        role: input.role ?? null,
        location: input.location ?? null,
        query: search.query,
        model: getGeminiModel(),
        searchResultCount: search.results.length,
        fetchedCount,
        warnings,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof TinyFishError || error instanceof GeminiError) {
      console.error("Brief generation failed:", error.message);
      return errorResponse(
        error.message,
        upstreamStatus(error),
        "upstream_error"
      );
    }

    console.error("Brief generation failed:", error);
    return errorResponse(
      "Something went wrong while generating the summary. Please try again.",
      500,
      "internal_error"
    );
  }
}
