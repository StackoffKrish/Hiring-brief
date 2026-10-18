import { NextResponse } from "next/server";

// TODO: Main orchestrator for generating an interview brief.
// Intended flow (to be implemented when specified):
// 1. Validate the incoming request (company, role, location).
// 2. Scrape sources via the scraping service (lib/tinyfish.ts).
// 3. Format the raw results into a brief (lib/gemini.ts + lib/prompts.ts).
// 4. Return the brief to the dashboard.
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
