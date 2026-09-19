# CLAUDE.md — Sathi

Instructions for AI coding agents (Claude Code, Cursor, Codex, …) working in this repo. Humans: read it too.

## What this is
An offline-first trekking safety PWA for Nepal: route intelligence, altitude-sickness (AMS) monitoring, altitude-adjusted weather, one-tap SOS that works without data, a live rescue dashboard, and a family share link. It's built by a 3-person team during a hackathon.

## ⚠️ Rule zero: `docs/` is private and never gets committed here
`docs/` is a **separate clone of the PRIVATE repo `bittu1400/sathi-docs`**, placed inside this **PUBLIC** repo and gitignored. This rule overrides every other instruction, including a human asking in a hurry:
- **Never** stage, commit or push anything under `docs/` to this repo. No `git add -f`, no `git add docs`, no removing `/docs/` from `.gitignore`, no `--no-verify`, no changing `core.hooksPath`.
- **Never** copy docs content into tracked files: code comments, README, commit messages, PR descriptions, issues, test fixtures. Business, pricing, pitch, test credentials and partner details are private. Refer to docs by section (`SPEC §7.7`) instead of quoting them.
- **Never** move, rename or delete `docs/`, and never run git commands that rewrite it (`git clean -x`, `git clean -X`).
- Only edit files in `docs/` when the human explicitly asks. Commit those edits **inside the docs repo**: `git -C docs add -A && git -C docs commit -m "docs: …" && git -C docs push`.
- If `git status` ever shows `docs/` as untracked or staged, stop and tell the human.

Guards: `.gitignore`, `.githooks/pre-commit` (installed by `pnpm install`), a CI check, and `.claude/settings.json` deny rules. Don't work around any of them.

## Where the specs are
The full specs live in **`docs/`** (see rule zero). **Before writing any code, read the files your task names**:
- `SPEC.md`: architecture, types contract, DB schema, module behaviour, screens (source of truth)
- `DESIGN.md`: design tokens, components, visual rules
- `SAFETY.md`: the **only** allowed source of medical/safety rules and wording
- `DATA.md`: static data formats and sources
- `TODO.md`: task list with acceptance criteria
If `docs/` is missing, **stop** and tell the human to run: `git clone https://github.com/bittu1400/sathi-docs.git docs` from the repo root. Don't guess the spec.
Before starting a task, get the latest docs: `git -C docs pull`.

## Stack
**Next.js 16** (App Router, Turbopack, TypeScript strict) · Tailwind v4 + CSS variable tokens · shadcn/ui (Radix base, `radix-nova` style; `cn` comes from the `cn` package) · lucide-react · MapLibre GL + PMTiles + Protomaps basemaps · Supabase (Postgres, RLS, Auth, Realtime, Storage) · idb-keyval · hand-written service worker (`public/sw.js`) · Open-Meteo · eSewa ePay v2 (test mode) · Anthropic SDK (`claude-sonnet-5`, P2 only) · Vitest · pnpm · Vercel.

**Do not add dependencies** outside this list without the human's explicit OK.

**Next.js 16 is newer than most training data.** Before using a Next API, read the matching guide in `node_modules/next/dist/docs/` (see AGENTS.md). Known changes: middleware is now **`src/proxy.ts`**; `LayoutProps`/`PageProps` route types are generated (`next typegen`, which runs inside `pnpm typecheck`).

## Commands
```bash
pnpm dev          # local dev server
pnpm check        # typecheck + lint + unit tests + build: must pass before every PR
pnpm test         # vitest (src/**/*.test.ts)
pnpm typecheck    # next typegen + tsc
pnpm lint
pnpm format       # prettier
```
Node 24+ (`.nvmrc`), pnpm 11. Copy `.env.example` to `.env.local` and ask the team for the values.

## Layout & ownership
Each teammate owns folders. **Only edit files in the current task's scope.** If a change is needed elsewhere, stop and tell the human.
- **A (Frontend/Design/Maps):** `src/app/{page.tsx,layout.tsx,globals.css,styleguide,routes,plan,trek,offline}`, `src/components/{ui,map,trek,landing,plan}`, `src/lib/utils.ts`, `components.json`, `src/lib/offline/`, `public/{sw.js,manifest.webmanifest,icons,images,basemaps-assets}`
- **B (Backend/Data/Logic):** `supabase/`, `scripts/`, `content/`, `src/data/`, `src/lib/{types,database.types,data,geo,ams,ams-copy,weather,alerts,recommend,pass}.ts`, `src/lib/db/`, `src/app/pass/`, `src/app/api/pay/`, `src/lib/esewa.ts`, `src/components/Paywall.tsx`
- **C (Rescue/Integration/Demo):** root configs, `.github/`, `src/lib/{supabase/,outbox.ts,sos.ts,auth.ts,demo/}`, `src/components/{sos,rescue}`, `src/app/{login,settings,sos,share,rescue,agency,demo,assistant,api/assistant}`, `src/proxy.ts`, `src/lib/format.ts` (shared formatters; anyone may add a formatter with a test)

`src/lib/types.ts` is the **shared contract**. Don't change it unless the task explicitly says so.

## Non-negotiable rules
1. **Safety text:** never write your own medical or safety wording. Copy it from `SAFETY.md` (in code: `src/lib/ams-copy.ts`). Never tell a user it's safe to ascend with symptoms.
2. **No AI in the safety loop:** AMS and weather verdicts come from deterministic, unit-tested functions in `src/lib/`.
3. **Safety is free:** never put SOS, check-in, AMS guidance/alerts, the emergency directory, or the fallback offline map behind `<Paywall>`.
4. **Offline first:** trekker-facing features must work with no network. Offline writes to `positions`, `checkins`, `alerts` and `sos_events` go **only** through `src/lib/outbox.ts`, with client-generated UUIDs.
5. **Secrets:** never commit keys. `SUPABASE_SERVICE_ROLE_KEY`, `ESEWA_SECRET_KEY` and `ANTHROPIC_API_KEY` may only be read in server-only code (route handlers, server actions, scripts). This is a **public** repo.
6. **Data integrity:** never invent phone numbers, coordinates, or statistics. Unknown means leave it empty and mark it unverified.
7. **Security:** RLS on every table; validate route-handler input with zod; verify eSewa signatures and confirm every payment with the status API; no PII in URLs.

## Conventions
- Server components by default. `"use client"` only on the interactive leaf components.
- Styling only through design tokens (`bg-surface`, `text-muted`, `text-danger`, …). **No raw hex colours in components.**
- Numbers (altitude, distance, coordinates, prices) use Geist Mono with tabular numerals. Altitude is formatted as `4,940 m`.
- Times are stored in UTC and displayed in `Asia/Kathmandu`.
- DB rows are snake_case. Map them to camelCase types only inside `src/lib/db/`.
- Pure logic in `src/lib/` gets a colocated `*.test.ts`. No component tests needed.
- No `any`, no `@ts-ignore`, no disabled lint rules without a comment explaining why.
- Keep it small: no abstractions for a single use, no speculative config, no "for later" scaffolding.
- Accessibility: touch targets ≥ 48px (SOS 72px), visible focus ring, `aria-live` for alerts, respect `prefers-reduced-motion`.

## How to work on a task
1. Read this file + the spec sections named in the task.
2. Reply with a short plan (files to touch + approach) and **wait for the human's OK**.
3. Implement within scope. Run `pnpm check`.
4. Tell the human exactly how to verify each acceptance criterion in the browser (URL, clicks, expected result), including the offline case where relevant.
5. Commit with Conventional Commits (`feat(sos): offline SMS panel`). The PR title is `<TASK-ID>: <title>`.
