// gemini text generation service (server-side only).
// Uses the generateContent REST API:
// https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

// Summarising fetched pages is a latency-sensitive task, so the fast
// Flash-Lite model is the default. Slower "thinking" Flash models can
// take a long time on large prompts when no thinking level is set.
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 4_096;

export type GeminiThinkingLevel = "minimal" | "low" | "medium" | "high";

export interface SummarizeWithGeminiOptions {
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  thinkingLevel?: GeminiThinkingLevel;
}

export interface GeminiSummaryResult {
  text: string;
  model: string;
}

interface GeminiErrorOptions {
  status?: number;
  retryable?: boolean;
}

export class GeminiError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, options: GeminiErrorOptions = {}) {
    super(message);
    this.name = "GeminiError";
    this.status = options.status;
    this.retryable = options.retryable ?? false;
  }
}

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGeminiFallbackModel(): string {
  return (
    process.env.GEMINI_FALLBACK_MODEL?.trim() ||
    DEFAULT_GEMINI_FALLBACK_MODEL
  );
}

function getBaseUrl(): string {
  return (
    process.env.GEMINI_BASE_URL?.trim().replace(/\/+$/, "") ||
    DEFAULT_GEMINI_BASE_URL
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const THINKING_LEVELS: GeminiThinkingLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
];

function getConfiguredThinkingLevel(): GeminiThinkingLevel | undefined {
  const value = process.env.GEMINI_THINKING_LEVEL?.trim().toLowerCase();
  return THINKING_LEVELS.includes(value as GeminiThinkingLevel)
    ? (value as GeminiThinkingLevel)
    : undefined;
}

type ThinkingConfig =
  | { thinkingLevel: GeminiThinkingLevel; includeThoughts: false }
  | { thinkingBudget: 0; includeThoughts: false };

function resolveThinkingConfig(
  model: string,
  requestedLevel?: GeminiThinkingLevel
): ThinkingConfig | undefined {
  const normalizedModel = model.toLowerCase();
  const level = requestedLevel ?? getConfiguredThinkingLevel();

  // Gemini 2.5 uses thinkingBudget rather than thinkingLevel. Disable
  // thinking for 2.5 Flash summarisation; leave 2.5 Pro on its default
  // because thinking cannot be fully disabled for that model.
  if (normalizedModel.startsWith("gemini-2.5")) {
    return normalizedModel.includes("pro")
      ? undefined
      : { thinkingBudget: 0, includeThoughts: false };
  }

  if (!/^gemini-[34]/.test(normalizedModel)) {
    return undefined;
  }

  if (level) {
    // Minimal is not supported by every Gemini 3/4 model (for example
    // gemini-3.8-flash and gemini-4-argon). Low is the fastest setting
    // that is safe across those models.
    const minimalUnsupported =
      normalizedModel.includes("gemini-3.8") ||
      normalizedModel.includes("gemini-4") ||
      normalizedModel.includes("pro");

    return {
      thinkingLevel:
        level === "minimal" && minimalUnsupported ? "low" : level,
      includeThoughts: false,
    };
  }

  if (normalizedModel.includes("flash-lite")) {
    return { thinkingLevel: "minimal", includeThoughts: false };
  }

  return { thinkingLevel: "low", includeThoughts: false };
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function summarizeWithGemini(
  prompt: string,
  options: SummarizeWithGeminiOptions = {}
): Promise<GeminiSummaryResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY is not configured.", {
      status: 503,
    });
  }

  const model = options.model?.trim() || getGeminiModel();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const thinkingConfig = resolveThinkingConfig(
    model,
    options.thinkingLevel
  );
  const url = `${getBaseUrl()}/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  let responseText: string;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          // maxOutputTokens includes Gemini's thinking tokens, so this
          // needs enough headroom for thought + visible output. The
          // prompt itself asks for a concise 450-700 word summary, and
          // thinking is set to low/minimal to control latency.
          maxOutputTokens:
            options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    // Keep the same abort signal active while reading the body, not just
    // while waiting for response headers.
    responseText = await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiError(
        `gemini (${model}) timed out after ${Math.round(timeoutMs / 1000)}s.`,
        { status: 408, retryable: true }
      );
    }

    throw new GeminiError(
      `Could not reach gemini (${model}). Please try again.`,
      { retryable: true }
    );
  } finally {
    clearTimeout(timeout);
  }

  let data: unknown = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let detail = "";
    if (isRecord(data) && isRecord(data.error)) {
      detail =
        asString(data.error.message) ?? asString(data.error.status) ?? "";
    }
    if (!detail && responseText) {
      detail = responseText.slice(0, 200);
    }

    throw new GeminiError(
      `gemini (${model}) failed (${response.status}).${
        detail ? ` ${detail}` : ""
      } Check GEMINI_API_KEY and GEMINI_MODEL.`,
      {
        status: response.status,
        retryable: isRetryableStatus(response.status),
      }
    );
  }

  if (!isRecord(data) || !Array.isArray(data.candidates)) {
    if (isRecord(data) && isRecord(data.promptFeedback)) {
      const blockReason = asString(data.promptFeedback.blockReason);
      if (blockReason) {
        throw new GeminiError(
          `gemini (${model}) could not generate a summary (${blockReason}).`
        );
      }
    }

    throw new GeminiError(
      `gemini (${model}) returned an unexpected response.`,
      { retryable: true }
    );
  }

  const firstCandidate = data.candidates[0];
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content)) {
    throw new GeminiError(`gemini (${model}) returned an empty response.`, {
      retryable: true,
    });
  }

  const parts = Array.isArray(firstCandidate.content.parts)
    ? firstCandidate.content.parts
    : [];

  const text = parts
    .flatMap((part) =>
      isRecord(part) && part.thought !== true && typeof part.text === "string"
        ? [part.text]
        : []
    )
    .join("")
    .trim();

  if (!text) {
    const finishReason = asString(firstCandidate.finishReason);
    throw new GeminiError(
      `gemini (${model}) returned an empty summary.${
        finishReason ? ` Finish reason: ${finishReason}.` : ""
      }`,
      { retryable: true }
    );
  }

  return { text, model };
}
