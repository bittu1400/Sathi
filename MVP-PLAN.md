# MVP-PLAN — map-first route recommender

Last updated 2026-09-20, end of the second browser session. Last code commit: `11be788`.

This is the plan **and** the as-built record for the MVP pivot. Where they differ, §4 (the
flow) is what we agreed to build and §6 says exactly how much of it exists. Nothing below
describes intentions as if they were code.

**Starting a session? Read §13 (what to do next), then §12 (how to drive the browser), then the
gap in §7 you are about to touch.** §8 holds every number we have measured — keep adding to it
rather than re-measuring.

Private specs live in `docs/` (see CLAUDE.md rule zero) and are not quoted here.

## 1. The pivot in one paragraph

Sathi's core feature is: **tell us where you want to go, how many days you have, and what you
want to see — we draw the best routes on the map.** The whole mobile UI is a map, like Google
Maps. One primary control ("Where to?") starts the flow. Login, SOS, AMS, rescue, pass and
agency are secondary and are not on the MVP path. **No sign-in anywhere in the MVP.**

A trip is one of two shapes, and the planner picks which:
- **a day out** (the destination is within 25 km, or it is a city we hold the places of) —
  Kathmandu has a dozen places worth walking between, so the answer is a loop through a *set of
  places*, not a line;
- **a trek** (anywhere else, over 25 km) — a line between two points, split into days.

## 2. Decisions taken by the lead (2026-09-20)

| # | Question | Decision |
|---|---|---|
| D1 | Destination scope | **Both**: any point in Nepal via OSM routing **and** the curated treks in `src/data/routes` |
| D2 | Routing engine | **OpenRouteService**, free tier, free key |
| D3 | What makes the options differ | **Both**: different geometries where the engine gives them, day-plan variants otherwise |
| D4 | Interest data (rivers, peaks, sunrise, hotels) | **Overpass API**, live |
| D5 | Cost | **Zero.** Free tiers only |
| D6 | Priority | Feature, workflow, UX. Working and bug-free before anything else |
| D7 | Basemap | **CARTO vector basemaps with the account key**, **light by default** |
| D8 | Controls | **Icons** rather than words wherever a word isn't carrying meaning |
| D9 | What counts as a day out (G4) | **Destination-based**: a destination inside a baked POI region is a day out **in that city**, walked from the destination, however far the trekker starts. "Switch to G4 then" |
| D10 | Unrealistic day counts (G12) | **Leave them.** "Let the user travel at their own pace. No need to make them hurry." The planner never clamps or warns; it must instead **show the time**: hours per day in the day plan and total walking time on the card. Both were already there and were checked |
| D11 | Order of the second session's work | C1 (hydration) → C2 (manual start) → C3 (place search) → G4, "in exactly that order"; the rest of §13 followed on the lead's "continue with the next work" |

## 3. Services and keys

| Need | Service | Free-tier limit | Key | Where the key lives |
|---|---|---|---|---|
| Routing + alternatives | ORS `/v2/directions/{profile}/geojson` | 2,000 req/day, 40/min | yes | `ORS_API_KEY`, **server only** |
| Basemap | CARTO `voyager-gl-style` / `dark-matter-gl-style` | account limits | optional | `CARTO_BASEMAPS_API_KEY`, read on the server, **passed to the browser** (a basemap key must reach the map; it is not one of CLAUDE.md rule 5's secrets) |
| Places (POIs) | Overpass API + a baked extract in `src/data/pois/` | fair use, no key | no | — |
| Geocoding (place search) | ORS `/geocode/autocomplete` | 1,000 req/day | same ORS key | `ORS_API_KEY`, **server only**, behind `/api/places` |
| Device position | `navigator.geolocation` | — | no | — |

**No new npm dependency was added.** Everything is `fetch` plus the MapLibre already in the repo.
ORS returns GeoJSON directly, so no polyline decoder is needed.

## 4. The user flow (the spec we agreed)

**Step 1 — Map (`/`).** Opens straight onto a full-screen map. Position is requested on mount and
a refusal is a normal state: the map stays on Nepal and the sheet says so. Current position is a
dot; the first fix flies the map to it, later fixes only move the dot (so it never yanks itself
back while you pan). Floating controls: menu (→ `/about`), a "Where to?" pill, a locate button.

**Step 2 — Destination.** Tap the pill or "Go somewhere" → the sheet expands to a search field.
The curated treks match offline; two letters or more also search the whole country through
`/api/places` (ORS autocomplete, debounced 300 ms). Curated matches stay on top.

**Step 3 — Trip.** To (tap to change) · From (tap to change: device fix by default, or any
place from the same search when location is off) · Days (stepper, 1–21, default 3) ·
"What do you want to see?" (ten icon chips, multi-select, none required) · **Find routes**.

**Step 4 — Results.** The map fits all options; the selected route is drawn in the route colour,
the others recede. The sheet becomes a swipeable carousel, one card per option with its label,
day count, distance, climb, walking time and its stops. A card expands into the day-by-day plan.
The selected route's stops appear on the map as numbered pins in visiting order.

**Step 5 — Nothing else.** No booking, no login, no saving. Out of scope for the MVP.

**States that must exist** (all built, all seen in a browser): permission refused (the sheet says
so and the From row offers a manual start) · offline (the error names the connection and keeps
the drawn route) · fewer options than three (show what exists, never pad — Kathmandu → Pokhara
really does return two) · engine failure (the message from the server is shown in `text-danger`
and **Find routes** can simply be pressed again; there is no separate retry control) · busy state
on the button.

## 5. How the engine works (as built)

`POST /api/plan`, zod-validated, no auth, no PII.

```ts
{ start: {lat,lng}, end: {lat,lng}, days: 1..21, interests: InterestId[] }
  → { kind: "tour" | "trek", routes: PlannedRoute[] }
```

Guards, in order: zod → a 1-hour in-process cache keyed by start/end rounded to 3 decimals +
days + interests → Nepal bbox (a point outside gets 400 before any request is spent).

**`planKind`** (`src/lib/plan/planner.ts`): haversine start↔end ≤ 25 km → `tour`; otherwise a
destination inside a baked POI region (Kathmandu, Pokhara, Chitwan, Lumbini, Bandipur) is still
a `tour`, walked from that city, because nobody walks 200 km to Pokhara; anything else → `trek`.
The region list in `pois.ts` therefore decides what counts as a city — adding one changes how
trips to it are planned.

### Tour (a city day out)
1. Places first: `poisAround(end, radius, interests)` — the baked extract when the destination is
   inside one, live Overpass otherwise. Radius = `min(15 km, 4 km + days × 2 km)`.
   With no interests picked, it uses culture · villages · forests · sunrise.
2. `buildTourVariants` builds up to three different **sets** of stops from that pool:
   *Highlights* (every chosen interest, round-robin so a day isn't four temples), *Outdoors*
   (nature interests first), *Temples & squares* (the rest first), *Easy pace* (half as many).
   Sets that come out identical are dropped, never padded. Up to 4 stops per day, 12 total.
   Ranking inside each interest: places OSM marks notable (wikidata / wikipedia / heritage /
   historic) first, then nearest. Duplicates by name are removed.
3. Stops are ordered nearest-neighbour from the base — the trekker's start when it is close, the
   destination itself when the city is far away — then ORS `foot-walking` is asked for one route
   through `[base, …stops, base]`: a day out ends where it began.
4. The line is split into days (below).

### Trek (a line between two points)
1. `fetchCandidates`: ORS `foot-hiking` with `alternative_routes {target_count: 3,
   share_factor: 0.6, weight_factor: 1.6}`; on refusal, the same profile **without** alternatives;
   then `driving-car` the same way. A 401/403 fails fast (that's our key, not the request).
   `source` records which profile answered, and the card says so when it's a road route.
2. `fetchPoisAlong(line, 2 km, interests)` for the day highlights and overnight names.
3. If ORS returned more than one geometry, each becomes an option, **scored** by how many of the
   chosen places it passes (notable ones count double). The best match leads the carousel and
   each card is named after what that line has most of ("Most temples & culture"); a line with
   nothing distinctive left falls back to "Fastest" / "Alternative n". The alternatives share a
   corridor, so one Overpass query covers them all and `poisNear()` splits the result per line.
4. If it returned one — which is most of the high mountains — the options are three **paces** of
   the same line: as asked, one day faster, one day easier.
5. Last of all, every geometry is run through Douglas–Peucker at 10 m (`simplify.ts`), after the
   day split has measured climb on the full line.

### Day plan (both shapes) — `src/lib/plan/daysplit.ts`
Naismith: 4.5 km/h plus one hour per 600 m of climb, descent ignored. The line is cut into legs
of roughly equal *effort*, not equal distance, so a climbing day is shorter on the ground. Each
day gets its distance, climb, hours, up to four highlights within 2 km of that day's stretch —
the places OSM marks notable first — and an overnight name from the nearest teahouse/village
within 5 km (null when there is none — never invented).

## 6. Status of every phase

| # | Phase | State |
|---|---|---|
| P0 | ORS key, services reachable | **done** — key set, verified against the live API |
| P1 | Map screen at `/`, position, controls, peeking sheet | **done** (`5b0cb18`) |
| P2 | Destination search | **done** (`98af32c`) — curated treks + ORS place search |
| P3 | Trip form: from / days / interests | **done** (`8b3e0bc`) |
| P4 | `/api/plan`, routes drawn | **done** (`8b3e0bc`) |
| P5 | POIs + scoring + labels | **done** (`bc7c4bd`) — trek options scored and named by interest |
| P6 | Day plans, overnight stops, stop pins | **done** (`c47082b`, `26762c5`) |
| — | City day-outs (added mid-session by the lead) | **done** (`c47082b`) |
| — | CARTO light basemap, icon controls | **done** (`621c69e`, tokens in `1cf4ad0`) |
| P7 | Every state reachable | **done**; §11 steps 1–7 verified in a browser (7 with a stubbed fetch) |
| P8 | Bug bash on real phones | **not started** — verified at 375×812 in the desktop browser only |

Commits, oldest first.

*Session 1 (build, nothing seen in a browser):* `5b0cb18` map-first home · `8b3e0bc` trip form +
`/api/plan` · `fdd540c` docs: live API results · `1cf4ad0` map tokens · `621c69e` CARTO light
basemap + icon controls · `c47082b` city day-outs and day plans · `0112d36` chore · `26762c5`
stops and day plans on the results · `8b05bd5`, `60673a4` docs.

*Session 2 (first browser run, then the fixes it found):* `3eb8277` hydration fix (C1) ·
`e91dbe7` pick a start when location is off (C2) · `98af32c` country-wide place search (C3, G1) ·
`e2ac4f0` a city destination is a day out in it (G4) · `b2abf17` docs · `9930ea6` locate button
above the sheet (G9) · `bc7c4bd` trek options scored and named by interest (G2) · `229386a`
notable highlights first (G13) · `7c352a4` geometry simplified server-side (G8) · `6ca9e51`
Chitwan + Lumbini baked and the bake hardened (G5) · `11be788` Bandipur baked (G5) · `9f5940b`
docs.

## 7. Known gaps, in the order they hurt

- ~~**G1 — No place search.**~~ **Closed** (`98af32c`): `/api/places` → ORS autocomplete, Nepal
  only, debounced 300 ms, cached an hour per query, results merged under the curated matches.
  Measured live: "Pokhara" and "Bhaktapur" both answer in ~1–3 s, first call after a cold server
  nearer 6 s. A place's subtitle is whatever Pelias gives (locality · county · region), which
  falls back to the layer name ("locality") when it gives nothing.
- ~~**G2 — Interests don't change the ranking of a trek.**~~ **Closed** (`bc7c4bd`). Measured:
  Kathmandu → Namobuddha, 3 days, mountains + culture + villages → "Most temples & culture"
  (45.6 km), "Most villages & squares" (41.8 km), "Alternative 2" (49.3 km). Paces are still
  labelled by pace, which is the only honest difference when the engine gives one line.
- **G3 — Curated treks are not used as trek candidates.** The plan said a curated line near both
  ends should join the candidate list; `planTrek` asks ORS only.
- ~~**G4 — "Tour" is decided by start↔end distance.**~~ **Closed** (`e2ac4f0`): a destination
  inside a baked POI region is a day out **in that city**, walked from the destination, however
  far away the trekker is. Verified live: Kathmandu → Pokhara, 3 days, returns 2 tour options
  (39.4 km / +1,909 m / 7.9 h and 31.7 km), numbered pins, days of ~4 h each. Only two options
  because identical stop sets are dropped rather than padded. The catch: the baked region list
  in `pois.ts` is the only thing that says "city", so a destination outside those five boxes is
  still planned as a trek however urban it is (G5).
- **G5 — Baked POIs now cover five places**: Kathmandu Valley (2,842), Pokhara (1,313), Chitwan
  /Sauraha (142), Lumbini (103), Bandipur (64). Add more by editing `REGIONS` in
  `scripts/fetch-pois.ts` and running `pnpm tsx scripts/fetch-pois.ts <id>`; attempts rotate
  through three Overpass mirrors because the main one answered with 504s and connect timeouts
  for a whole afternoon. **Chitwan has no wildlife POIs**: OSM holds the national park as one
  huge polygon whose centre is ~25 km from Sauraha, outside the day-out radius. Anywhere not on
  the list still falls back to live Overpass.
- **G6 — Partly closed.** §11 steps 1–8 were run at 375×812 in the Claude desktop app's own
  browser pane, against the live APIs, and pass. Three bugs were found there and fixed
  (`3eb8277`, `e91dbe7`, `9930ea6`): a hydration mismatch on every load, a dead end when location
  is refused, and a locate button buried under the sheet. **What a browser pane cannot do**, and
  what therefore has still never happened: a real phone, a real geolocation permission prompt
  (every fix below came from the stub in §13), and a real radio switched off (step 7 used a
  stubbed `fetch`). The Chrome extension is still unusable from these sessions ("the OAuth token
  belongs to a different claude.ai account"); use the built-in browser pane, §13.
- **G7 — The planner needs network.** Offline it shows "Route planning needs a connection", which
  is honest but means the MVP path is online-only. The trekker screens keep their offline
  behaviour.
- ~~**G8 — Payload size.**~~ **Closed** (`7c352a4`): Douglas–Peucker at 10 m, server-side, after
  the day split. Kathmandu → Namobuddha, three options: 1,703 + 1,464 + 2,324 points and 153 KB
  became 510 + 371 + 605 points and 44 KB, with the distances and day plans unchanged.
- **G9 — The sheet has fixed heights** (peek / 70 dvh), no drag handle, and it is not swipeable
  by touch. The locate button used to sit *under* it; it now rides above whichever height the
  sheet has (`9930ea6`). The results carousel is a horizontal scroller — cards are selected by
  tapping, and §11 step 6's "swipe" means scrolling that row.
- **G10 — `/plan`, `/routes`, `/trek` and the rest still exist** and are unchanged. Only `/` and
  the old landing page (now `/about`) moved.
- **G11 — Long treks take ~25 s.** Kathmandu → EBC, 3 days: one `/api/plan` call, ~25 s to the
  first card, no progress beyond the button's busy state.
- **G12 — Day counts are taken at face value.** "3 days · as asked" for Kathmandu → EBC means
  35.7 h of walking on day one. The arithmetic is right and the pace is the trekker's to choose,
  so nothing clamps it; the hours are shown per day and for the whole route so the choice is
  visible.
- **G13 — OSM names leak into the highlights**: "Scarf of life", "Jorpati Main Road". Notable
  places now sort first (`229386a`), so those only show up once the good ones run out; nothing
  filters them.
- **G14 — A place search subtitle can be a layer name.** Pelias gives locality · county · region
  where it has them; where it has none, the card reads "locality" or "Nepal" (`toPlaces` in
  `ors.ts`). Honest, ugly. Mapping the layer names to words is a ten-line change nobody has
  approved yet.
- **G15 — Some geocoded points cannot be routed from.** "Nuwakot" (27.8734, 85.1891, a county
  centroid) returns 404 "No route found between those points." ORS snaps to the nearest way
  within its own limit, and a centroid in the hills is too far from one. The message is honest
  but the search happily offers such a point.

## 8. What we measured against the live APIs

Keep these numbers: they are why the design looks the way it does.

| Request | Result |
|---|---|
| Kathmandu → Pokhara, `foot-hiking` + alternatives | **refused**: "approximated route distance must not be greater than 100000.0 meters for use with the alternative Routes algorithm" |
| Kathmandu → Pokhara, no alternatives | 1 route, 238.8 km, 47.8 h, 14,735 m ascent, 9,299 points |
| Lukla → Pheriche (37 km), alternatives at several `share_factor`/`weight_factor` | **1 route every time** — the mountain trail graph has no parallel path |
| Kathmandu → Nagarkot, both profiles | **3 alternatives** each |
| Overpass without a `User-Agent` | **HTTP 406** |
| Overpass `way[...](around:3000,…)` over Kathmandu | timed out at 41 s, returned HTTP 200 with `remark` and zero elements |
| Overpass bbox query, same tags | 150 elements in 2.5 s |
| One Overpass query for all ten interests | hits the element cap; ~700 hotels crowd out every temple |
| `/api/plan`, Kathmandu day out, 2 days | 3 options in ~2 s: Narayanhiti Palace Museum · Garden of Dreams · Ghantaghar · Ratna Park · Basantapur Durbar Square · Taleju Bell |

**The conclusion that shaped the build:** engine alternatives are rare in Nepal, so three
*genuinely different* options come from different stop sets (city) or different paces (trek).

Measured in session 2 (2026-09-20, second half):

| Request | Result |
|---|---|
| `/api/places?q=Pokhara`, `?q=Bhaktapur`, `?q=Kathmandu` | real lists in ~1–3 s; the first call against a cold dev server took ~6 s |
| `/api/plan`, Kathmandu → Pokhara, 3 days (G4 path) | `tour`, **2** options (the third variant was an identical stop set and was dropped), 39.4 km / +1,909 m / 7.9 h and 31.7 km, days of ~4 h |
| `/api/plan`, Kathmandu → EBC, 3 days | `trek`, 3 paces, **~25 s** end to end (G11); day 1 of "as asked" is 104.5 km / +7,462 m / 35.7 h (G12) |
| `/api/plan`, Kathmandu → Namobuddha, 3 days, mountains + culture + villages | `trek`, 3 real ORS alternatives, ~16 s, labelled "Most temples & culture" 45.6 km · "Most villages & squares" 41.8 km · "Alternative 2" 49.3 km |
| Same request, payload before/after Douglas–Peucker at 10 m | 1,703 + 1,464 + 2,324 points, 153 KB → 510 + 371 + 605 points, 44 KB; distances and day plans unchanged |
| `/api/plan`, Kathmandu → Sauraha (Chitwan), 2 days | `tour`, 2 options, ~2 s, from the baked extract |
| `/api/plan`, Kathmandu → Bandipur, 2 days | `tour`, 2 options, ~2 s: Ganesh Temple · Bindebasini Temple · Mountain view · Sunset view point |
| `/api/plan`, Kathmandu → "Nuwakot" (27.8734, 85.1891) | **404** "No route found between those points." — a county centroid ORS cannot snap to a way (G15) |
| `overpass-api.de` during the region bake | HTTP 504s and `UND_ERR_CONNECT_TIMEOUT` for a whole afternoon; the bake only finished once attempts rotated through three mirrors |
| Baking one region (10 interest queries, 1.5 s apart, with retries) | ~5 minutes each for Chitwan, Lumbini and Bandipur |

## 9. Files

Everything the pivot added, as it stands at `9f5940b`:

| File | What it is |
|---|---|
| `src/app/page.tsx` | the planner screen (server component: builds the curated destination list, passes the basemap key) |
| `src/app/about/page.tsx` | the old landing page, content unchanged |
| `src/app/api/plan/route.ts` | the plan handler: zod, the 1-hour cache, error mapping |
| `src/app/api/places/route.ts` | the place-search handler: zod (2–80 chars), its own 1-hour cache, keeps `ORS_API_KEY` server-side |
| `src/components/map/PlanMapInner.tsx` | full-bleed map, position dot, route lines, numbered stop pins |
| `src/components/plan/PlanScreen.tsx` | the one client component that holds the state: sheet, destination, manual start, days, interests, results |
| `src/components/plan/DestinationSearch.tsx` | curated matches offline + debounced `/api/places`; used for both the destination and the start |
| `src/components/plan/TripForm.tsx` | To / From / Days / interest chips / Find routes |
| `src/components/plan/RouteCards.tsx` | the snap-scrolling results carousel (tap a card to select it) |
| `src/components/plan/DayPlan.tsx` | the day-by-day list inside a card |
| `src/lib/plan/planner.ts` | `planKind`, `plan`, the tour and trek paths, `scorePois`, `topInterest` |
| `src/lib/plan/ors.ts` | ORS: `fetchCandidates`, `fetchThrough`, `geocode`, `toPlaces`, `toPlannedRoutes`, `inNepal`, `PlanError` |
| `src/lib/plan/overpass.ts` | live OSM: `fetchPois`, `fetchPoisAlong`, `poisNear`, `toPois`, `matches`, `decimate`, `bboxOf` |
| `src/lib/plan/pois.ts` | the baked regions (this list is also what `planKind` calls a city), `regionFor`, `poisAround` |
| `src/lib/plan/tour.ts` | `buildTourVariants`, `orderStops` |
| `src/lib/plan/daysplit.ts` | `walkingHours`, `splitByEffort`, `toDayLegs`, `nearestPoi` |
| `src/lib/plan/simplify.ts` | Douglas–Peucker, run last on every geometry |
| `src/lib/plan/interests.ts`, `types.ts`, `position.ts` | the interest list + Overpass filters, the shared types, the geolocation hook |
| `src/data/pois/*.json` | `kathmandu` (2,842), `pokhara` (1,313), `chitwan` (142), `lumbini` (103), `bandipur` (64) |
| `scripts/fetch-pois.ts` | the bake: one query per interest, three Overpass mirrors, region ids as arguments |

Tests: `ors.test.ts` (9), `daysplit.test.ts` (12), `tour.test.ts` (9), `planner.test.ts` (9),
`simplify.test.ts` (5) — **44 of the repo's 159**, in 5 of its 18 test files.

Changed outside the planner: `src/components/app-shell.tsx` (`/` is chrome-free, `/about` gets
the marketing header), `src/components/map/style.ts` (`getBasemapUrl`), `src/app/globals.css`
(three map tokens), `.env.example`.

Server-only modules — never import these from a client component: `ors.ts`, `overpass.ts`,
`pois.ts`, `planner.ts`, `simplify.ts` is pure but only used there.

## 10. Running and checking it

```bash
cp .env.example .env.local     # then fill ORS_API_KEY and CARTO_BASEMAPS_API_KEY
pnpm install
pnpm dev                       # http://localhost:3000
pnpm check                     # typecheck + lint + 159 tests + data validation + build
pnpm tsx scripts/fetch-pois.ts chitwan   # re-bake one region (~5 min, needs network)
pnpm tsx scripts/fetch-pois.ts           # or all five (~25 min, and Overpass may refuse)
```

Place search (this is the only thing that reaches ORS geocoding):

```bash
curl -s 'http://localhost:3000/api/places?q=Bhaktapur'
```

A city day out — Kathmandu, from and to the same point:

```bash
curl -s -X POST http://localhost:3000/api/plan -H 'Content-Type: application/json' \
  -d '{"start":{"lat":27.7172,"lng":85.324},"end":{"lat":27.7172,"lng":85.324},
       "days":2,"interests":["culture","villages","forests"]}'
```

A trek: `"end":{"lat":27.5724,"lng":85.5857}` (Namobuddha) gives `kind: "trek"` with three real
ORS alternatives in ~16 s. **Do not use Pokhara for this any more** — since `e2ac4f0` it is a
baked region, so Kathmandu → Pokhara is a `tour` (that is G4 working, not a bug).

Note both handlers hold a **1-hour in-process cache**, so a repeat of the same request answers
instantly and does not prove the code path still works. Change a coordinate, a day count or a
word to force a real call, or restart `pnpm dev`.

## 11. The demo, step by step (the acceptance test)

On a phone, mobile data on (steps 1–6 last run 2026-09-20 in the app's browser at 375×812,
with a stubbed position — see G6):
1. Open the app → the map fills the screen, light, with your blue dot, within ~3 s.
2. Tap "Go somewhere" → type two letters → curated treks and real places both appear → pick one.
3. From = Your location (or tap From and pick a start when location is off). Days = 2. Chips:
   Temples & culture, Villages & squares, Forests & parks.
4. **Find routes** → three cards, three distinct lines, numbered pins on the selected one.
5. Expand a card → day 1 and day 2, each with distance, hours, highlights and where it ends.
6. Swipe to another card → the map redraws that option's line and pins.
7. Airplane mode → a new search says planning needs a connection; results already on screen stay.
   Verified with `navigator.onLine` forced false and `/api/*` fetches rejected, not with a real
   radio off: the copy appears in `text-danger` and the drawn route stays on the map.
8. No crash, no console error, no login prompt anywhere in 1–7. Verified in a fresh tab: the
   console is empty apart from CARTO tile fetches when the network drops.
8. No crash, no console error, no login prompt anywhere in 1–7.

Steps 1–8 pass in the browser pane. A real phone, a real permission prompt and a real radio off
are still unrun (G6). Two caveats a demo driver should know: the destination search needs two
letters before it calls the country-wide search, and a card is *tapped*, not swiped (G9).

## 12. How to verify it yourself (what worked, so nobody re-invents it)

The Chrome extension could not connect in any session so far. What works is the **built-in
browser pane** of the Claude desktop app (`preview_start`, `navigate`, `read_page`, `computer`,
`read_console_messages`, `read_network_requests`).

1. **The dev server may already be running.** `.claude/launch.json` starts `pnpm dev` on 3000;
   if a server is up, Next refuses a second one and the preview dies with exit 1 — just
   `navigate` to `http://localhost:3000` instead of starting another.
2. **Phone size:** `resize_window` preset `mobile` (375×812). It resets when the turn ends.
3. **There is no GPS in the pane.** The permission is refused, which is a valid state to test
   (the sheet says so and the From row offers a manual start). To test the located path, stub it
   *before* pressing the locate button — the hook clears its watch on error, so a later
   `locate()` picks up the stub:

   ```js
   Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
     watchPosition(ok){ setTimeout(() => ok({coords:{latitude:27.7172,longitude:85.324,accuracy:20}}), 100); return 1; },
     clearWatch(){}, getCurrentPosition(ok){ ok({coords:{latitude:27.7172,longitude:85.324,accuracy:20}}); } } });
   ```

4. **Airplane mode** (§11 step 7): force `navigator.onLine` false *and* reject `/api/*` fetches;
   `onLine` alone proves nothing, because localhost still answers.

   ```js
   Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
   const real = window.fetch;
   window.fetch = (i, init) => (String(i.url ?? i).includes('/api/') ? Promise.reject(new TypeError('Failed to fetch')) : real(i, init));
   ```

5. **The console keeps old messages across navigations.** After fixing something, open a *new
   tab* before claiming the error is gone, or check the server HTML with `curl` — that is how
   the hydration fix was confirmed (`curl -s localhost:3000 | grep aria-label`).
6. **Long calls:** a trek to EBC takes ~25 s. Wait in chunks and screenshot, don't assume a hang.

## 13. Next session, in order

0. **Push `main`.** Sessions 1 and 2 could not push (the sandbox denied it), so up to 22 commits
   may still be local. `git status -sb`, then `git pull --ff-only && git push origin main`.
   Nothing else here is blocked by it, but a teammate pulling stale `main` will be confused.
1. **A real phone** on mobile data: the real permission prompt, the real radio off, real tap
   targets. Every other line of §11 has now been run in the browser pane; this has not (G6).
   This is the last thing standing between "it works" and "we watched it work".
2. **G11 — the ~25 s wait** on a long trek, the worst thing left in the demo. Measure before
   optimising: time `fetchCandidates` and `fetchPoisAlong` separately (a `console.time` in
   `planTrek` is enough) and find out whether it is ORS or Overpass. Smaller payloads (G8) did
   not move it. Candidate fixes once it is known: skip Overpass when the line is longer than
   ~100 km, or stream the route first and the day plan after.
3. **G15 / G14 — the search's rough edges.** A county centroid that ORS cannot route from still
   appears in the list and 404s on "Find routes"; subtitles can read "locality". Both are small
   and both are visible in a demo.
4. **G5 — more regions**, if the demo will visit anywhere outside Kathmandu, Pokhara, Chitwan,
   Lumbini or Bandipur. Remember the list is also G4's definition of a city. And decide what to
   do about Chitwan's wildlife: OSM's park polygon centre is ~25 km from Sauraha, so a wildlife
   day out there finds hotels and temples.
5. **G3 — curated treks as candidates.** Thin while only EBC has waypoints (TODO N-9), so do it
   with, not before, more curated route data.
6. **Deliberately not doing** (say so if asked, don't "fix" them silently): G12, the pace is the
   trekker's to choose and the hours are shown per day and per route; G13, OSM names are what
   OSM has and notable ones already sort first; G7, the planner is online-only by design while
   the trekker screens keep their offline behaviour.

Where the rest of the documentation lives: `docs/SPEC.md` §17 is the contract and behaviour,
`docs/DECISIONS.md` #161–#190 is why each choice was made, `docs/TODO.md` NEXT M-0 … M-12 is the
task board. This file is the only one with the measurements.
