// gemini text generation service (server-side only).
// Uses the generateContent REST API:
// https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export class GeminiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
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

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
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
      throw new GeminiError("gemini timed out. Please try again.", 408);
    }
    throw new GeminiError("Could not reach gemini. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function summarizeWithGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY is not configured.", 503);
  }

  const model = getGeminiModel();
  const url = `${getBaseUrl()}/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const response = await fetchWithTimeout(
    url,
    {
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
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    },
    60_000
  );

  const responseText = await response.text();
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
      detail = asString(data.error.message) ?? asString(data.error.status) ?? "";
    }
    if (!detail && responseText) {
      detail = responseText.slice(0, 200);
    }

    throw new GeminiError(
      `gemini failed (${response.status}).${
        detail ? ` ${detail}` : ""
      } Check GEMINI_API_KEY and GEMINI_MODEL.`,
      response.status
    );
  }

  if (!isRecord(data) || !Array.isArray(data.candidates)) {
    // Surface a safety / prompt block reason if gemini returned one.
    if (isRecord(data) && isRecord(data.promptFeedback)) {
      const blockReason = asString(data.promptFeedback.blockReason);
      if (blockReason) {
        throw new GeminiError(
          `gemini could not generate a summary (${blockReason}).`
        );
      }
    }
    throw new GeminiError("gemini returned an unexpected response.");
  }

  const firstCandidate = data.candidates[0];
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content)) {
    throw new GeminiError("gemini returned an empty response.");
  }

  const parts = Array.isArray(firstCandidate.content.parts)
    ? firstCandidate.content.parts
    : [];

  const text = parts
    .flatMap((part) =>
      isRecord(part) && typeof part.text === "string" ? [part.text] : []
    )
    .join("")
    .trim();

  if (!text) {
    const finishReason = asString(firstCandidate.finishReason);
    throw new GeminiError(
      `gemini returned an empty summary.${
        finishReason ? ` Finish reason: ${finishReason}.` : ""
      }`
    );
  }

  return text;
}
