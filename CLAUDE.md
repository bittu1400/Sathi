# CLAUDE.md — Sathi

Instructions for AI coding agents (Claude Code, Cursor, Codex, …) working in this repo. Humans: read it too.

## What this is
An offline-first trekking safety PWA for Nepal: route intelligence, altitude-sickness (AMS) monitoring, altitude-adjusted weather, one-tap SOS that works without data, a live rescue dashboard, and a family share link. It's built by a 3-person team during a hackathon.

**MVP pivot, 2026-09-20 — read this before planning any work.** The MVP's core feature is now the **route recommender**: the app opens at `/` on a full-screen map (like a maps app), you say where you want to go, for how many days and what you want to see, and it draws the best routes with a day-by-day plan. A destination within 25 km — or any destination inside one of the baked POI regions in `src/lib/plan/pois.ts` — is a **city day out** (a walking loop through chosen places, started at that city); anything else is a **trek** (a line split into days). **No sign-in anywhere on that path.** Everything else — SOS, AMS, rescue, agency, pass — is unchanged in the code but secondary, and the old landing page moved to `/about`.
Since 2026-09-20 the map also carries a right rail with **community** (→ `/community`, five static read-only boards) and **SOS** beside the locate button, both ends of a trip are pickable from a From/To card, and a result card shows **walking and road time**.
- **`MVP-PLAN.md` (this repo's root) is the plan and the as-built record**: the agreed flow, how the engine works, what is built, every number measured against the live APIs, the gaps G1–G18 in the order they hurt, how to verify things depending on where your session runs (§12) and what to do next (§13). Read it before touching `src/lib/plan/`, `src/app/api/plan/`, `src/app/api/places/`, `/` or `/community`.
- Private specs: `docs/SPEC.md` §17 (planner contract, rules, and §17.7 on what is verified), §18 (community), §9.1 (SOS, including what "send" really means); `docs/DECISIONS.md` #161–#203 (why); `docs/TODO.md` NEXT M-0 … M-15 (what next).
- The planner **has** been run in a browser (sessions 1–2; findings in MVP-PLAN §7 and §11) but **never on a real phone**, never with a real location prompt and never with a real radio off — every such claim so far comes from a stub (MVP-PLAN §12). **Nothing from the third session has been rendered anywhere at all** (the From/To card, the rail's two new buttons, `/community`, both travel times): MVP-PLAN §11 steps 9–12 are the unrun checks. Don't upgrade those claims without doing it.
- **An SOS transmits nothing by itself.** Signed out — which `/` always is — it builds the event locally and stops; Send SMS / Call / WhatsApp each open an app with the message ready and a human presses Send. Automatic delivery would need an SMS gateway nobody has approved (MVP-PLAN G16). The number comes from `NEXT_PUBLIC_SOS_SMS_NUMBER` in `.env.local`; it is never committed.
- Three traps that have already cost a session: both planner route handlers hold a **1-hour in-process cache**, so a repeated request proves nothing — change an input or restart `pnpm dev`; the region list in `pois.ts` is what decides city-vs-trek, so editing it changes planning behaviour; and `src/lib/community.ts` is **content we invented** (real place names, fictional posts) — never present it as real user data.

## ⚠️ Rule zero: `docs/` is private and never gets committed here
`docs/` is a **separate clone of the PRIVATE repo `bittu1400/sathi-docs`**, placed inside this **PUBLIC** repo and gitignored. This rule overrides every other instruction, including a human asking in a hurry:
- **Never** stage, commit or push anything under `docs/` to this repo. No `git add -f`, no `git add docs`, no removing `/docs/` from `.gitignore`, no `--no-verify`, no changing `core.hooksPath`.
- **Never** copy docs content into tracked files: code comments, README, commit messages, PR descriptions, issues, test fixtures. Business, pricing, pitch, test credentials and partner details are private. Refer to docs by section (`SPEC §7.7`) instead of quoting them.
- **Never** move, rename or delete `docs/`, and never run git commands that rewrite it (`git clean -x`, `git clean -X`).
- Only edit files in `docs/` when the human explicitly asks. Commit those edits **inside the docs repo**: `git -C docs add -A && git -C docs commit -m "docs: …" && git -C docs push`.
- If `git status` ever shows `docs/` as untracked or staged, stop and tell the human.

Guards: `.gitignore`, `.githooks/pre-commit` (installed by `pnpm install`), a CI check, and `.claude/settings.json` deny rules. Don't work around any of them.

## Rule one: work directly on `main`, fast-forward only
No task branches, no PRs. Commit on `main` and push it straight to `origin/main`; history stays linear.
- Start every task with: `git switch main && git pull --ff-only && git -C docs pull`.
- Commit small, one task per commit (Conventional Commits). Before every push: `git pull --ff-only` (or `git fetch && git rebase origin/main` if someone pushed first), run `pnpm check`, then `git push origin main`.
- Never force-push, never `git push --force-with-lease`, never merge-commit into `main`, never rewrite pushed history. If the push is rejected, rebase onto `origin/main` and push again.

## Rule two: small commits, so teammates never conflict
Read `docs/TODO.md` → "NEXT" for what to do next (`docs/MERGE-PLAN.md` Part 1 is the older PR protocol; its branch and PR steps no longer apply).
- **One task = one commit** (or a few), about 400 changed lines at most. Pull before you start and before you push.
- **Lane = the files you change** (`a`, `b`, `c` under "Layout & ownership"), not a person's name.
- **Contract files** change only in a small dedicated commit that lands first: `src/lib/types.ts`, `src/lib/database.types.ts`, `supabase/migrations/*`, `package.json`, `pnpm-lock.yaml`, `src/app/globals.css`, `src/app/layout.tsx`, `CLAUDE.md`, `.github/*`.
- **Migrations are append-only.** Never edit a merged one. Name new ones with an all-digit UTC timestamp (Supabase skips anything else): `supabase/migrations/20260919153000_<slug>.sql`.
- **Conflict in a file your lane doesn't own:** abort the rebase and ask the owner. Never resolve it by taking your version.
- **Every Supabase call checks `error`** and shows it. Never show success on a failed write.

### ⚠ HUMAN NEEDED
When a step needs a person, don't do it. Print one line, then carry on with anything else you can do:
```
⚠ HUMAN NEEDED (<Aarif|Pwan|Suraj|any>): <what> — <why> — <exact command / URL / click path>
```
Use it for: Supabase dashboard work (hosted migrations, auth, storage) · env vars or secrets · GitHub settings · verifying real-world facts (phone numbers, coordinates, prices, safety wording not in `ams-copy.ts`) · editing another lane's files · conflicts in files you don't own · anything destructive (deleting data or branches, `reset --hard`) · adding a dependency.

## Where the specs are
The full specs live in **`docs/`** (see rule zero). **Before writing any code, read the files your task names**:
- `SPEC.md`: architecture, types contract, DB schema, module behaviour, screens (source of truth)
- `REDESIGN.md`: the "Instrument" dark-only UI redesign. **It overrides DESIGN.md for anything visual** (tokens, components, screens)
- `DESIGN.md`: the earlier design tokens and rules (superseded by REDESIGN.md where they differ)
- `SAFETY.md`: the **only** allowed source of medical/safety rules and wording
- `DATA.md`: static data formats and sources
- `TODO.md`: task list with acceptance criteria. **Start at its "NEXT" section**: the ordered list of what to do now
- `MERGE-PLAN.md`: merge protocol (Part 1) all agents follow
- `AUDIT.md`: the 2026-09-19 audit; per-finding status at the bottom
- `DECISIONS.md`: why things are the way they are (read before undoing something)
If `docs/` is missing, **stop** and tell the human to run: `git clone https://github.com/bittu1400/sathi-docs.git docs` from the repo root. Don't guess the spec.
Before starting a task, get the latest docs: `git -C docs pull`.

## Stack
**Next.js 16** (App Router, Turbopack, TypeScript strict) · Tailwind v4 + CSS variable tokens · shadcn/ui (Radix base, `radix-nova` style; `cn` comes from the `cn` package) · lucide-react · MapLibre GL + PMTiles + Protomaps basemaps · Supabase (Postgres, RLS, Auth, Realtime, Storage) · idb-keyval · hand-written service worker (`public/sw.js`) · Open-Meteo · eSewa ePay v2 (test mode) · Anthropic SDK (`claude-sonnet-5`, P2 only) · Vitest · pnpm · Vercel.

**Do not add dependencies** outside this list without the human's explicit OK.

**Planner services (free tiers, no new npm dependency):** OpenRouteService for routing (`ORS_API_KEY`, **server only**), Overpass + the baked extracts in `src/data/pois/` for places, CARTO vector basemaps for the map (`CARTO_BASEMAPS_API_KEY`: read on the server and passed to the map, because a basemap key must reach the browser — it is not one of the rule-5 secrets).

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
- **A (Frontend/Design/Maps):** `src/app/{page.tsx,layout.tsx,globals.css,styleguide,routes,plan,trek,offline}`, `src/components/{ui,map,trek,landing,plan}` (`ui/shell/` holds the header, tab bar and account menu), `src/components/{app-shell,providers,sw-register,live-connectivity}.tsx`, `src/lib/utils.ts`, `components.json`, `src/lib/offline/`, `public/{sw.js,manifest.webmanifest,icons,images,basemaps-assets}`
- **Planner (the MVP core, crosses lanes — the lead approved this):** `src/app/page.tsx`, `src/app/api/plan/`, `src/components/plan/`, `src/components/map/PlanMapInner.tsx`, `src/lib/plan/`, `src/data/pois/`, `scripts/fetch-pois.ts`. Server-only modules: `src/lib/plan/{planner,ors,overpass,pois}.ts` — never import them from a client component.
- **B (Backend/Data/Logic):** `supabase/`, `scripts/`, `content/`, `src/data/`, `src/lib/{types,database.types,data,geo,ams,ams-copy,weather,alerts,recommend,pass,emergency-resources}.ts`, `src/lib/db/`, `src/app/pass/`, `src/app/api/pay/`, `src/lib/esewa.ts`, `src/components/Paywall.tsx`
- **C (Rescue/Integration/Demo):** root configs, `.github/`, `src/lib/{supabase/,outbox.ts,sos.ts,sos-actions.ts,session.ts,trek-log.ts,local-store.ts,use-now.ts,id.ts,safe-next.ts,auth.ts,demo/}`, `src/components/{sos,rescue}`, `src/app/{login,settings,sos,share,rescue,agency,demo,assistant,api/assistant}`, `src/proxy.ts`, `src/lib/format.ts` (shared formatters; anyone may add a formatter with a test)

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
5. Commit on `main` with Conventional Commits (`feat(sos): offline SMS panel`), then `git pull --ff-only && git push origin main`.
