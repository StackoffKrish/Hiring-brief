"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

interface ConfigStatus {
  configured: boolean;
  missing: string[];
  model?: string;
}

interface BriefSource {
  title: string;
  url: string;
  siteName: string | null;
  snippet: string;
  date: string | null;
  fetched: boolean;
}

interface BriefResult {
  summary: string;
  sources: BriefSource[];
  meta: {
    company: string;
    role: string | null;
    location: string | null;
    query: string;
    model: string;
    searchResultCount: number;
    fetchedCount: number;
    warnings: string[];
    generatedAt: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isBriefResult(value: unknown): value is BriefResult {
  return (
    isRecord(value) &&
    typeof value.summary === "string" &&
    Array.isArray(value.sources) &&
    isRecord(value.meta)
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50";

export default function SearchBar() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriefResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/brief", { cache: "no-store" })
      .then((response) => response.json() as Promise<unknown>)
      .then((data) => {
        if (cancelled || !isRecord(data)) return;
        setConfigStatus({
          configured: data.configured === true,
          missing: asStringArray(data.missing),
          model: typeof data.model === "string" ? data.model : undefined,
        });
      })
      .catch(() => {
        // Status is a setup hint only; generation errors are shown on submit.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canGenerate = company.trim().length >= 2 && !isLoading;
  const missingConfig =
    configStatus && !configStatus.configured ? configStatus.missing : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Could not generate a summary. Please try again.";
        const missing = isRecord(data) ? asStringArray(data.missing) : [];
        if (missing.length > 0) {
          setConfigStatus({ configured: false, missing });
        }
        setError(message);
        return;
      }

      if (!isBriefResult(data)) {
        setError("The server returned an unexpected response.");
        return;
      }

      setConfigStatus((current) => ({
        configured: true,
        missing: [],
        model: current?.model ?? data.meta.model,
      }));
      setResult(data);
    } catch {
      setError(
        "Could not reach the server. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} aria-busy={isLoading}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="company"
                className="text-sm font-medium text-black"
              >
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                required
                maxLength={100}
                autoComplete="organization"
                placeholder="e.g. Google"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                disabled={isLoading}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-black">
                Role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                maxLength={100}
                autoComplete="off"
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isLoading}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="location"
                className="text-sm font-medium text-black"
              >
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                maxLength={100}
                autoComplete="off"
                placeholder="e.g. Bengaluru"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={isLoading}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canGenerate}
              className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 disabled:text-gray-600 disabled:shadow-none disabled:hover:brightness-100"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {isLoading ? (
                <LoaderCircle className="relative h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="relative h-4 w-4" />
              )}
              <span className="relative">
                {isLoading ? "Generating..." : "Generate Brief"}
              </span>
            </button>

            <p className="text-sm text-gray-500">
              {company.trim().length < 2
                ? "Enter a company name to generate."
                : "Searches TinyFish, fetches top pages, and summarises with gemini."}
            </p>
          </div>

          {missingConfig.length > 0 ? (
            <div className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
              <p className="font-medium">Backend setup needed</p>
              <p className="mt-1 leading-relaxed">
                Add{" "}
                {missingConfig.map((name, index) => (
                  <span key={name}>
                    {index > 0 ? " and " : null}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-blue-100">
                      {name}
                    </code>
                  </span>
                ))}{" "}
                to <code className="font-mono text-xs">.env.local</code>, then
                restart the dev server. See the README for where to get each
                key.
              </p>
            </div>
          ) : configStatus?.configured ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-gray-600">
              <CircleCheck className="h-4 w-4 text-blue-600" />
              Live APIs connected
              {configStatus.model ? ` · ${configStatus.model}` : ""}
            </p>
          ) : null}
        </form>
      </section>

      {isLoading ? (
        <section
          aria-live="polite"
          className="mt-8 rounded-lg border border-gray-200 bg-white p-6"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-black">
            <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
            Searching the web, fetching sources, and generating your AI
            summary...
          </div>
          <p className="mt-2 text-sm text-gray-500">
            This can take up to a minute while pages are fetched.
          </p>
          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
            <div className="h-4 w-2/3 rounded bg-gray-100" />
          </div>
        </section>
      ) : null}

      {error && !isLoading ? (
        <section
          role="alert"
          className="mt-8 flex gap-3 rounded-lg border border-gray-300 bg-gray-50 p-6 text-sm text-gray-800"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
          <div>
            <p className="font-medium text-black">Couldn&apos;t generate a brief</p>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </section>
      ) : null}

      {result && !isLoading ? (
        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-5">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-black">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Summary
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {[
                  result.meta.company,
                  result.meta.role,
                  result.meta.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 sm:text-right">
              {result.meta.model}
              <br />
              {result.sources.length} sources · {result.meta.fetchedCount}{" "}
              fetched
            </p>
          </div>

          {result.meta.warnings.length > 0 ? (
            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              {result.meta.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-gray-800">
            {result.summary}
          </div>

          {result.sources.length > 0 ? (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-black">Sources</h3>
              <ol className="mt-4 space-y-4">
                {result.sources.map((source, index) => (
                  <li key={`${source.url}-${index}`} className="flex gap-3">
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}.
                    </span>
                    <div className="min-w-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-black underline-offset-4 hover:underline"
                      >
                        <span className="truncate">{source.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                      </a>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {source.siteName ? <span>{source.siteName}</span> : null}
                        <span className="rounded-full border border-gray-200 px-2 py-0.5">
                          {source.fetched ? "Fetched" : "Snippet"}
                        </span>
                      </p>
                      {source.snippet ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {source.snippet}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
