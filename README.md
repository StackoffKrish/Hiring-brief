# Inside Intel

Ace your next interview with inside intel.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + ESLint
- shadcn/ui (zinc, CSS variables) — `components/ui/button.tsx`, `components/ui/card.tsx`, `lib/utils.ts`, `components.json`
- Inter font (`next/font/google`)
- Backend: **TinyFish Search + Fetch -> gemini summary** (server-side only)

Minimal design: white background, black text, gray borders. The dashboard's
**Generate Brief** button is the one colorful exception (blue/magical gradient).

## Setup (required for AI generation)

The app reads API keys from `.env.local`. No keys are stored in source code.

### 1. Create your local env file

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in the two keys.

### 2. Get a TinyFish API key

1. Go to https://agent.tinyfish.ai/api-keys
2. Sign in / create an account
3. Create an API key and copy it (keys are shown once)
4. Paste it into `.env.local`:

```bash
TINYFISH_API_KEY=your_tinyfish_key_here
```

TinyFish is used through two REST endpoints:

- Search: `GET https://api.search.tinyfish.ai`
- Fetch: `POST https://api.fetch.tinyfish.ai`

Both use the `X-API-Key: $TINYFISH_API_KEY` header.

### 3. Get a gemini API key

1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account
3. Click **Create API key** (create or select a project if asked)
4. Paste it into `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
```

Use the fast Flash-Lite model for this summarisation step. A slower
high-thinking model can time out when it is given several fetched web
pages. If your key/project doesn't have access to Flash-Lite, change
both model values to another low-latency Flash model available to your
account. The app automatically uses minimal thinking for Flash-Lite
and low thinking for other Gemini 3/4 models unless
`GEMINI_THINKING_LEVEL` is set.

### 4. Restart the dev server

Environment variables are read at startup, so restart after editing
`.env.local`:

```bash
npm install
npm run dev
```

### 5. Verify the backend is configured

Open http://localhost:3000/api/brief — it returns non-secret status only,
for example:

```json
{
  "configured": true,
  "missing": [],
  "services": { "tinyfish": true, "gemini": true },
  "model": "gemini-3.5-flash-lite",
  "fallbackModel": "gemini-3.5-flash-lite"
}
```

If `configured` is `false`, `missing` lists the env vars you still need.
The dashboard also shows a **“Backend setup needed”** / **“Live APIs
connected”** notice under the Generate button.

## How generation works

On `/dashboard`, enter a company (required), role, and location, then click
**Generate Brief**:

1. Browser `POST /api/brief` with `{ company, role, location }`
2. `lib/prompts.ts` builds the TinyFish search query + purpose
3. `lib/tinyfish.ts` runs TinyFish **Search**, then TinyFish **Fetch** on the
   top results (best effort — falls back to search snippets if fetch fails)
4. `lib/prompts.ts` builds a compact free-form summary prompt from the
   fetched text (top sources only, capped per source and in total)
5. `lib/gemini.ts` asks a fast gemini model with minimal/low thinking to
   summarise only those sources, with `[1]`, `[2]` style citations. If
   that attempt times out or returns a retryable provider error, the API
   automatically retries with `GEMINI_FALLBACK_MODEL` and an even more
   compact prompt
6. The dashboard shows the AI summary plus the source list

Current output is intentionally a **free-form summary only**; no strict
output structure is enforced yet.

### API

- `GET /api/brief` — configuration status (no secrets)
- `POST /api/brief` — generate a summary

Example:

```bash
curl -X POST http://localhost:3000/api/brief \
  -H "Content-Type: application/json" \
  -d '{"company":"Google","role":"Software Engineer","location":"Bengaluru"}'
```

Successful response shape:

```json
{
  "summary": "Free-form AI summary with [1] citations...",
  "sources": [
    { "title": "...", "url": "...", "siteName": "...", "snippet": "...", "fetched": true }
  ],
  "meta": { "company": "Google", "query": "...", "model": "gemini-3.5-flash-lite", "geminiAttempt": "primary", "fetchedCount": 4 }
}
```

### Troubleshooting: “gemini timed out”

This usually means the configured model spent too long thinking over a
large prompt. Check:

1. `GET /api/brief` shows a fast model such as
   `gemini-3.5-flash-lite` for both `model` and `fallbackModel`
2. `.env.local` does not still contain an old slower value such as
   `GEMINI_MODEL=gemini-3.8-flash`
3. You restarted the dev server after changing `.env.local`
4. The terminal logs. Search for `[brief]`: they show how long TinyFish
   Search, TinyFish Fetch, and gemini each took, whether the fallback
   was used, and how large the prompt was, without logging secrets or
   source content

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000

- `/` — landing page (Hero, Features, Pricing, About)
- `/dashboard` — interview brief generator

## Structure

```
/app
  layout.tsx
  page.tsx                  -> landing page with all sections
  dashboard/
    page.tsx                -> tool page
  api/brief/route.ts        -> main orchestrator (TinyFish -> gemini)

/components
  /landing
    Navbar.tsx              -> scroll links + dashboard button
    Hero.tsx
    Features.tsx
    Pricing.tsx
    About.tsx
  /dashboard
    SearchBar.tsx           -> company/role/location + Generate + AI output
  /ui                       -> shadcn/ui components

/lib
  supabase/client.ts        -> stub (TODO — skipped for this step)
  supabase/server.ts        -> stub (TODO — skipped for this step)
  tinyfish.ts               -> TinyFish Search + Fetch service
  gemini.ts                 -> gemini AI summary service
  prompts.ts                -> search/summary prompts
  utils.ts                  -> shadcn/ui `cn()` helper
```

## Notes / not done yet

- **Supabase was intentionally skipped for this step.** The files in
  `lib/supabase/` are still empty stubs, and no Supabase packages or env vars
  were added. Nothing is saved to a database yet.
- There is no auth, rate limiting, caching, or streaming yet. Anyone who can
  reach a deployed `/api/brief` could spend your TinyFish/gemini quota —
  add protection before a public production launch.
- AI output is free-form text with citations, not the final strict format.
