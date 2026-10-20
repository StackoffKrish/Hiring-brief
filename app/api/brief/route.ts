import { NextResponse } from "next/server";
import {
  GeminiError,
  getGeminiFallbackModel,
  getGeminiModel,
  isGeminiConfigured,
  summarizeWithGemini,
  type GeminiSummaryResult,
} from "@/lib/gemini";
import {
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

const CONTEXT_SOURCE_COUNT = 6;
const FETCH_SOURCE_COUNT = 4;
const OVERALL_BUDGET_MS = 110_000;

function timeoutWithinBudget(
  startedAt: number,
  preferredMs: number,
  minimumMs = 15_000
): number {
  const remainingMs = OVERALL_BUDGET_MS - (Date.now() - startedAt);
  return Math.max(minimumMs, Math.min(preferredMs, remainingMs));
}

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
      fallbackModel: getGeminiFallbackModel(),
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
  const startedAt = Date.now();

  try {
    const query = buildSearchQuery(input);
    const search = await searchTinyFish({
      query,
      purpose: buildSearchPurpose(input),
    });
    console.info("[brief] TinyFish Search completed", {
      durationMs: Date.now() - startedAt,
      resultCount: search.results.length,
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
    console.info("[brief] TinyFish Fetch completed", {
      durationMs: Date.now() - startedAt,
      fetchedCount,
      requestedCount: fetchUrls.length,
    });

    const promptSources = contextResults.map((result) => ({
      title: result.title,
      url: result.url,
      siteName: result.siteName,
      content: fetchedByUrl.get(result.url) ?? result.snippet,
    }));

    const primaryPrompt = buildSummaryPrompt(input, promptSources);
    let geminiResult: GeminiSummaryResult;
    let geminiAttempt: "primary" | "fallback" = "primary";

    try {
      geminiResult = await summarizeWithGemini(primaryPrompt, {
        timeoutMs: timeoutWithinBudget(startedAt, 45_000),
        maxOutputTokens: 4_096,
      });
    } catch (error) {
      if (!(error instanceof GeminiError) || !error.retryable) {
        throw error;
      }

      const primaryModel = getGeminiModel();
      const fallbackModel = getGeminiFallbackModel();
      console.error("[brief] Primary gemini attempt failed; using fallback", {
        primaryModel,
        fallbackModel,
        message: error.message,
        promptChars: primaryPrompt.length,
        durationMs: Date.now() - startedAt,
      });
      warnings.push(
        `The primary AI model (${primaryModel}) was slow or unavailable, so a faster fallback model (${fallbackModel}) summarised a compact version of the sources.`
      );

      const compactPrompt = buildSummaryPrompt(input, promptSources, {
        maxCharsPerSource: 1_000,
        maxTotalChars: 4_000,
        maxSources: 4,
      });

      try {
        geminiResult = await summarizeWithGemini(compactPrompt, {
          model: fallbackModel,
          timeoutMs: timeoutWithinBudget(startedAt, 30_000),
          maxOutputTokens: 2_048,
        });
        geminiAttempt = "fallback";
      } catch (fallbackError) {
        if (fallbackError instanceof GeminiError) {
          throw new GeminiError(
            `Primary model failed: ${error.message} Fallback model also failed: ${fallbackError.message}`,
            {
              status: fallbackError.status ?? error.status,
              retryable: fallbackError.retryable,
            }
          );
        }
        throw fallbackError;
      }
    }

    console.info("[brief] gemini summary completed", {
      durationMs: Date.now() - startedAt,
      model: geminiResult.model,
      attempt: geminiAttempt,
      promptChars: primaryPrompt.length,
    });

    return NextResponse.json({
      summary: geminiResult.text,
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
        model: geminiResult.model,
        geminiAttempt,
        searchResultCount: search.results.length,
        fetchedCount,
        durationMs: Date.now() - startedAt,
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
