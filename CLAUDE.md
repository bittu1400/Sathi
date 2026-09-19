# CLAUDE.md — Sathi

Instructions for AI coding agents (Claude Code, Cursor, Codex, …) working in this repo. Humans: read it too.

## What this is
An offline-first trekking safety PWA for Nepal: route intelligence, altitude-sickness (AMS) monitoring, altitude-adjusted weather, one-tap SOS that works without data, a live rescue dashboard, and a family share link. It's built by a 3-person team during a hackathon.

## Where the specs are
The team keeps the full specs in a **private sibling repo** at `../sathi-docs/`. If that folder exists, **read the files your task names before you write any code**:
- `SPEC.md`: architecture, types contract, DB schema, module behaviour, screens (source of truth)
- `DESIGN.md`: design tokens, components, visual rules
- `SAFETY.md`: the **only** allowed source of medical/safety rules and wording
- `DATA.md`: static data formats and sources
- `TODO.md`: task list with acceptance criteria
If the folder is missing, ask the human for the relevant section. Don't guess.

## Stack
Next.js (App Router, TypeScript strict) · Tailwind v4 + CSS variable tokens · shadcn/ui · lucide-react · MapLibre GL + PMTiles + Protomaps basemaps · Supabase (Postgres, RLS, Auth, Realtime, Storage) · idb-keyval · hand-written service worker (`public/sw.js`) · Open-Meteo · eSewa ePay v2 (test mode) · Anthropic SDK (`claude-sonnet-5`, P2 only) · Vitest · pnpm · Vercel.

**Do not add dependencies** outside this list without the human's explicit OK.

## Commands
```bash
pnpm dev          # local dev server
pnpm check        # typecheck + lint + unit tests + build: must pass before every PR
pnpm test         # vitest (src/**/*.test.ts)
pnpm typecheck
```

## Layout & ownership
Each teammate owns folders. **Only edit files in the current task's scope.** If a change is needed elsewhere, stop and tell the human.
- **A (Frontend/Design/Maps):** `src/app/{page.tsx,layout.tsx,globals.css,styleguide,routes,plan,trek,offline}`, `src/components/{ui,map,trek,landing,plan}`, `src/lib/offline/`, `public/{sw.js,manifest.webmanifest,icons,images,basemaps-assets}`
- **B (Backend/Data/Logic):** `supabase/`, `scripts/`, `content/`, `src/data/`, `src/lib/{types,database.types,data,geo,ams,ams-copy,weather,alerts,recommend,pass}.ts`, `src/lib/db/`, `src/app/pass/`, `src/app/api/pay/`, `src/lib/esewa.ts`, `src/components/Paywall.tsx`
- **C (Rescue/Integration/Demo):** root configs, `.github/`, `src/lib/{supabase/,outbox.ts,sos.ts,auth.ts,demo/}`, `src/components/{sos,rescue}`, `src/app/{login,settings,sos,share,rescue,agency,demo,assistant,api/assistant}`, `src/middleware.ts` (or `src/proxy.ts` on Next 16+)

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
