# MVP-PLAN — map-first route recommender

Written 2026-09-20. Supersedes the current app's information architecture for the MVP.
Nothing in `docs/` is changed by this file. No code changed yet.

## 1. The pivot in one paragraph

Sathi's core feature is: **tell us where you want to go, how many days you have, and what you
want to see — we draw the three best routes on the map.** The whole mobile UI is a map, like
Google Maps. One primary button ("Where to?") starts the flow. Login, SOS, AMS, rescue, pass,
agency are all secondary and are not part of the MVP path. No sign-in anywhere in the MVP.

## 2. Decisions taken (from the lead, 2026-09-20)

| # | Question | Decision |
|---|---|---|
| D1 | Destination scope | **Both**: any point in Nepal via OSM routing **and** the curated treks in `src/data/routes` as candidates |
| D2 | Routing engine | **OpenRouteService**, free tier, free API key (⚠ human step) |
| D3 | What makes 3 routes differ | **Both**: different geometries when the engine gives alternatives, day-plan variants otherwise |
| D4 | Interest data (rivers, peaks, sunrise, hotels) | **Overpass API, live** |
| D5 | Cost | **Zero.** Free tiers only. No paid key anywhere in the MVP |
| D6 | Priority | Feature, workflow, UX. Ship it working and bug-free before anything else |

## 3. Zero-cost service stack

| Need | Service | Free-tier limit | Key? |
|---|---|---|---|
| Geocoding (destination search) | ORS `/geocode/autocomplete` (Pelias) | 1,000 req/day | same ORS key |
| Routing + alternatives | ORS `/v2/directions/{profile}` | 2,000 req/day, 40/min | ORS key (server-only) |
| POIs along a route | Overpass API (`overpass-api.de`) | fair-use, no key | no |
| Basemap | see §9, open item | — | decided by human |
| Device position | browser `navigator.geolocation` | — | no |

The ORS key is server-only (`ORS_API_KEY`), read exclusively inside route handlers, per
CLAUDE.md rule 5. It never reaches the client. **No new npm dependency** — everything is
`fetch` + the MapLibre already in the repo. ORS returns GeoJSON directly (`format=geojson`),
so no polyline-decoding library is needed.

⚠ HUMAN NEEDED (any): create a free OpenRouteService account at
https://openrouteservice.org/dev/#/signup , copy the token into `.env.local` as
`ORS_API_KEY=…`, and later into Vercel (Production + Preview) — the engine cannot run without it.

## 4. The user flow (this is the spec; build exactly this)

```
┌─ / ───────────────────────────────────────┐
│  [≡]        Where to?              [◍]    │  ← search pill, floating on the map
│                                            │
│                 MAP                        │  ← full-bleed, current location dot
│               (full screen)                │
│                                     [⌖]    │  ← locate-me FAB
│                                     [⧉]    │  ← layers FAB
│                                            │
│  ╭────────────────────────────────────╮    │
│  │      ➜  Go somewhere               │    │  ← primary CTA, peeking sheet
│  ╰────────────────────────────────────╯    │
└────────────────────────────────────────────┘
```

**Step 1 — Map (`/`).** Opens straight to the map. Ask for geolocation on first interaction,
never blocking: with no permission, centre on Nepal. Current position = blue dot with accuracy
circle. Primary CTA "Go somewhere" in a bottom sheet at peek height.

**Step 2 — Destination.** Tap "Go somewhere" or the search pill → sheet expands to full height
with one text field, keyboard-focused. Results, debounced 300 ms, merge two sources:
curated treks (matched locally, no network, shown first with a small "Trek" tag) and ORS
autocomplete restricted to Nepal's bbox. Recent destinations stored in `localStorage`.

**Step 3 — Trip.** After the destination is picked the sheet becomes the trip form:
- **From** — "Your location" by default, tappable to change (same search field).
- **Days** — a stepper, 1…21, defaults to 3.
- **What do you want to see?** — chips, multi-select, no minimum:
  `Mountains · Rivers · Sunrise points · Lakes · Waterfalls · Forests · Temples & culture · Villages · Teahouses & hotels · Wildlife`
- **Find routes** — full-width button, disabled until a destination exists.

**Step 4 — Results.** Map fits all three routes. Route A is the highlighted colour, B and C
dimmed. Sheet becomes a horizontally swipeable carousel of three cards. Each card:

```
  Most scenic                       4 days
  128 km · ↑ 3,240 m · 6–7 h/day
  🏔 9 peaks   🌊 4 rivers   🌅 2 sunrise points
```

Swiping or tapping a card highlights its line and re-fits the map. A tap on the card's chevron
expands to the **day plan**: one row per day — stretch, distance, ascent, overnight stop, and
the named highlights of that day. POI pins appear on the map for the selected route only,
filtered to the interests the user picked.

**Step 5 — Nothing else.** No booking, no login, no save. "Start this trek" is a stub that
links to the existing `/trek` and is explicitly out of MVP scope.

Empty/error states, all of them needed:
- no geolocation permission → "Showing Nepal. Tap ⌖ to use your location."
- offline → "Route planning needs a connection. Your downloaded maps still work."
- engine returns < 3 candidates → show what exists (1 or 2 cards), never pad with fakes.
- engine fails → "Couldn't reach the route service. Retry." with a retry button, no silent failure.

## 5. The engine

One server route handler: `POST /api/plan`. Zod-validated input, no PII, no auth.

```ts
{ start: {lat, lng}, end: {lat, lng} | {curatedId: string}, days: number, interests: string[] }
```

**Step A — candidates.**
1. ORS directions, profile `foot-hiking`, `alternative_routes: { target_count: 3, share_factor: 0.6, weight_factor: 1.4 }`, `elevation: true`, GeoJSON out.
2. If `foot-hiking` fails (ORS refuses very long foot routes), retry `driving-car` and tag the candidate as a drive.
3. Any curated trek whose line comes within ~25 km of both start and end is added as a candidate with its real geometry — a hand-checked route beats a generated one and costs nothing.

**Step B — enrich.** Decimate each candidate line to ≤ 60 points (Douglas-Peucker), then one
Overpass query per candidate over those points for the tags the chosen interests map to:
`natural=peak|water|waterfall`, `waterway=river`, `tourism=viewpoint|alpine_hut|guest_house|hotel`,
`amenity=place_of_worship`, `place=village`, `landuse=forest`. Cache the response server-side,
keyed by a rounded geometry hash, for the session.

**Step C — score.** For each candidate:
`score = Σ(interest weight × normalised POI count within 2 km) − daysFitPenalty − effortPenalty`.
Deterministic, pure, unit-tested — no AI in this path.

**Step D — label.** Highest scenic score → "Most scenic". Lowest duration → "Fastest".
Third → the dominant interest it wins on ("Best for sunrise", "Most rivers"). Labels are never
duplicated.

**Step E — day plan.** Split each line into `days` legs by a daily effort budget
(Naismith: distance + ascent/600 m per hour, capped at 7 h/day), then snap each overnight point
to the nearest settlement or teahouse POI within 5 km. Reuse `src/lib/geo.ts` for distance
and bearing — it already exists and is tested.

**Step F — if alternatives are thin.** When ORS returns fewer than 3 distinct geometries, fill
the remaining cards with day-plan variants of the best geometry: *fast* (fewer, longer days),
*balanced*, *scenic* (extra night at the highest-scoring POI cluster). D3 says do both; this is
the fallback half.

Rate discipline so the free tier holds: per-IP debounce in the handler, a 24 h in-memory result
cache keyed by `(start, end, days, interests)` rounded, and a hard Nepal bbox check that rejects
out-of-country coordinates before spending a request.

## 6. Files

New:
- `src/app/page.tsx` — becomes the map screen (replaces the landing page).
- `src/components/map/MapScreen.tsx` — full-bleed map, position dot, FABs.
- `src/components/plan/TripSheet.tsx` — the one bottom sheet, four states: peek → search → form → results.
- `src/components/plan/RouteCards.tsx`, `DayPlan.tsx`.
- `src/lib/plan/types.ts`, `score.ts` + `score.test.ts`, `daysplit.ts` + `daysplit.test.ts`, `interests.ts` (interest → OSM tag map).
- `src/lib/plan/ors.ts`, `src/lib/plan/overpass.ts` — server-only fetch wrappers.
- `src/app/api/plan/route.ts` — the handler.

Reused as-is: `src/components/map/*` (MapLibre setup, layers, style), `src/lib/geo.ts`,
`src/lib/format.ts`, `src/data/routes/*`, the RD-* UI primitives in `src/components/ui`.

Moved, not deleted: the current landing page content goes to `/about`. `/trek`, `/sos`,
`/routes`, `/settings` stay reachable from the `≡` menu. Nothing is removed in the MVP — removal
is a later cleanup.

Crosses lane boundaries A and B, so `CLAUDE.md` §"Layout & ownership" needs the lead's explicit
go-ahead before the first commit. ⚠ HUMAN NEEDED (lead): confirm.

## 7. Build order

Each phase ends green on `pnpm check` and is demoable on its own.

| # | Phase | Done when |
|---|---|---|
| P0 | ORS key in `.env.local`, ORS + Overpass reachable from a scratch script | one real route printed in the terminal |
| P1 | Map screen at `/`: full-bleed map, current location, FABs, peeking sheet | phone opens to a map with a blue dot |
| P2 | Destination search (curated + ORS autocomplete), recents | typing "Pokhara" gives Pokhara |
| P3 | Trip form: from / days / interest chips | "Find routes" posts the right body |
| P4 | `/api/plan` steps A–D, no POIs yet | 3 lines drawn on the map |
| P5 | Overpass enrichment + scoring + labels | cards show real peak/river counts |
| P6 | Day plan + overnight stops + POI pins | expanding a card lists day 1…n |
| P7 | States: offline, denied permission, no results, failure, loading skeletons | every state reachable by hand |
| P8 | Bug bash on a real phone: Android Chrome + iOS Safari | full flow twice with no defect |

Sequential by dependency; P5 and P7 can run in parallel with P6 if two people are on it.

## 8. Acceptance — the demo, start to finish

On a phone, mobile data on:
1. Open the app → map fills the screen, blue dot on the real position, within 3 s.
2. Tap "Go somewhere" → type "Ghorepani" → pick the result.
3. From = Your location. Days = 4. Chips: Mountains, Sunrise points, Teahouses & hotels.
4. Tap "Find routes" → under 8 s, three distinct lines on the map, three cards, distinct labels.
5. Swipe to "Best for sunrise" → its line highlights, sunrise POI pins appear.
6. Expand → four days, each with a named overnight stop.
7. Airplane mode → the results already on screen stay; a new search says planning needs a connection.
8. No crash, no console error, no login prompt anywhere in steps 1–7.

## 9. Open items

- **Basemap — taken for now, reversible.** P1 uses CARTO `dark_all` raster tiles
  (`getRasterStyle()` in `src/components/map/style.ts`): zero cost, no key, country-wide, and dark
  so it matches the tokens. It needs network, which is fine — the planner needs network anyway.
  The trekker screens keep the PMTiles style, which is the offline one. If CARTO's free use ever
  bites, swap that one function for a Nepal PMTiles extract. The current `ebc.json` `tilesUrl`
  still points at a daily planet build on `build.protomaps.com`, a download endpoint rather than a
  tile-serving one — separate problem, part of the A-13 work.
- **`foot-hiking` over long distances.** ORS refuses very long foot routes. The `driving-car`
  fallback in §5 step A2 needs a real test on a Kathmandu → Lukla-scale request before P4 is
  called done.
- **Overpass latency.** 2–5 s per query is normal and can blow the 8 s budget in §8 step 4.
  If it does, bake a Nepal POI extract into `src/data/` with a script and drop the live call.
- **The uncommitted A-13 offline-basemap work** in the tree is untouched by this plan and still
  needs a decision: finish and commit it, or stash it until after the MVP.
