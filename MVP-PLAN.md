# MVP-PLAN — map-first route recommender

Last updated 2026-09-20, after the second browser session. `main` = `11be788`.

This is the plan **and** the as-built record for the MVP pivot. Where they differ, §4 (the
flow) is what we agreed to build and §6 says exactly how much of it exists. Nothing below
describes intentions as if they were code.

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

**States that must exist** (all built): permission refused · offline · fewer options than three
(show what exists, never pad) · engine failure with a retry · busy state on the button.

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

Commits, oldest first: `5b0cb18` · `8b3e0bc` · `fdd540c` · `1cf4ad0` · `621c69e` · `c47082b` ·
`0112d36` · `26762c5`.

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
  because identical stop sets are dropped rather than padded. The catch: the regions are the
  only thing that says "city", so this works for Kathmandu and Pokhara and nowhere else (G5).
- **G5 — Baked POIs now cover five places**: Kathmandu Valley (2,842), Pokhara (1,313), Chitwan
  /Sauraha (142), Lumbini (103), Bandipur (64). Add more by editing `REGIONS` in
  `scripts/fetch-pois.ts` and running `pnpm tsx scripts/fetch-pois.ts <id>`; attempts rotate
  through three Overpass mirrors because the main one answered with 504s and connect timeouts
  for a whole afternoon. **Chitwan has no wildlife POIs**: OSM holds the national park as one
  huge polygon whose centre is ~25 km from Sauraha, outside the day-out radius. Anywhere not on
  the list still falls back to live Overpass.
- **G6 — Partly closed.** §11 steps 1–6 were run at 375×812 in the app's own browser, against
  the live APIs, and pass. Three bugs were found there and fixed (`3eb8277`, `e91dbe7`): a
  hydration mismatch on every load, a dead end when location is refused, and copy that claimed
  to be waiting for a fix that was never coming. Still unverified: step 7 (airplane mode) and
  anything on a real phone. The browser pane has no GPS, so every position above came from a
  geolocation stub — the real permission prompt has still never been seen.
- **G7 — The planner needs network.** Offline it shows "Route planning needs a connection", which
  is honest but means the MVP path is online-only. The trekker screens keep their offline
  behaviour.
- ~~**G8 — Payload size.**~~ **Closed** (`7c352a4`): Douglas–Peucker at 10 m, server-side, after
  the day split. Kathmandu → Namobuddha, three options: 1,703 + 1,464 + 2,324 points and 153 KB
  became 510 + 371 + 605 points and 44 KB, with the distances and day plans unchanged.
- **G9 — The sheet has fixed heights** (peek / 70 dvh), no drag handle. The locate button used to
  sit *under* it; it now rides above whichever height the sheet has (`9930ea6`).
- **G11 — Long treks take ~25 s.** Kathmandu → EBC, 3 days: one `/api/plan` call, ~25 s to the
  first card, no progress beyond the button's busy state.
- **G12 — Day counts are taken at face value.** "3 days · as asked" for Kathmandu → EBC means
  35.7 h of walking on day one. The arithmetic is right and the pace is the trekker's to choose,
  so nothing clamps it; the hours are shown per day and for the whole route so the choice is
  visible.
- **G13 — OSM names leak into the highlights**: "Scarf of life", "Jorpati Main Road". Notable
  places now sort first (`229386a`), so those only show up once the good ones run out; nothing
  filters them.
- **G10 — `/plan`, `/routes`, `/trek` and the rest still exist** and are unchanged. Only `/` and
  the old landing page (now `/about`) moved.

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

## 9. Files

New in this pivot:
- `src/app/page.tsx` — the planner screen (server component; builds the destination list, passes
  the basemap key).
- `src/app/about/page.tsx` — the old landing page, unchanged content.
- `src/app/api/plan/route.ts` — the handler.
- `src/components/map/PlanMapInner.tsx` — full-bleed map, position dot, route lines, stop pins.
- `src/components/plan/{PlanScreen,DestinationSearch,TripForm,RouteCards,DayPlan}.tsx`.
- `src/lib/plan/{planner,ors,overpass,pois,tour,daysplit,interests,types,position}.ts`
  (+ `ors.test.ts`, `daysplit.test.ts`, `tour.test.ts` — 25 of the 141 tests).
- `src/data/pois/{kathmandu,pokhara}.json`, `scripts/fetch-pois.ts`.

Changed: `src/components/app-shell.tsx` (`/` is chrome-free, `/about` gets the marketing header),
`src/components/map/style.ts` (`getBasemapUrl`), `src/app/globals.css` (three map tokens),
`.env.example`.

Server-only modules — never import these from a client component: `ors.ts`, `overpass.ts`,
`pois.ts`, `planner.ts`.

## 10. Running and checking it

```bash
cp .env.example .env.local     # then fill ORS_API_KEY and CARTO_BASEMAPS_API_KEY
pnpm install
pnpm dev                       # http://localhost:3000
pnpm check                     # typecheck + lint + 141 tests + data validation + build
pnpm tsx scripts/fetch-pois.ts # refresh the baked POI extracts (needs network, ~1 min)
```

A city day out, without a browser:

```bash
curl -s -X POST http://localhost:3000/api/plan -H 'Content-Type: application/json' \
  -d '{"start":{"lat":27.7172,"lng":85.324},"end":{"lat":27.7172,"lng":85.324},
       "days":2,"interests":["culture","villages","forests"]}'
```

A trek: use `"end":{"lat":28.2096,"lng":83.9856}` (Pokhara) and expect `kind: "trek"`, one line,
three paces.

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
8. No crash, no console error, no login prompt anywhere in 1–7.

Steps 1–7 pass. A real phone, a real permission prompt and a real radio off are still unrun (G6).

## 12. Next session, in order

1. **A real phone** on mobile data, with the real location prompt and a real airplane-mode
   switch. Everything else in §11 has now been run in a browser; this has not (G6).
2. **G11 — the wait.** A long trek still takes ~25 s with no progress beyond a busy button.
   Measure where it goes (ORS vs Overpass) before optimising; a smaller payload (G8) did not
   touch it.
3. **G3** — curated treks as trek candidates. Thin while only EBC has waypoints, so it is worth
   doing only alongside more curated route data.
4. **G5** — bake any other region the demo will visit, and decide what to do about Chitwan's
   wildlife (the park polygon sits outside the day-out radius).
5. **G12/G13** are deliberate: the pace is the trekker's to choose, and OSM names are what OSM
   has. Revisit only if the demo audience trips over them.
