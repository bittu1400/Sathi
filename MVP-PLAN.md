# MVP-PLAN — map-first route recommender

Last updated 2026-09-20, end of the **fifth** session. Last code commit: `8c27c35`.
**`origin/main` is at that same commit — everything described here is pushed** (checked with
`git ls-remote origin main`, not from memory). The private `docs/` repo is pushed too.

This is the plan **and** the as-built record for the MVP pivot. Where they differ, §4 (the flow)
is what the app does today and §6 says how much of each phase exists. Nothing here describes an
intention as if it were code, and nothing claims a screen was seen that was not.

**Starting a session? Read §13 (what to do next), then §12 (how to verify things), then the gap
in §7 you are about to touch.** §8 holds every number measured against the live APIs — add to it
rather than re-measuring.

**What the last two sessions changed, in one place:**

- **Session 4 — the recommender itself.** A trip now has a **shape** the trekker picks (Suggest ·
  Day out · **Point to point**); a trek is planned **from its trailhead** instead of from the
  trekker's doorstep; the three options differ by a **toggle** (Different ways · Different paces ·
  Known treks); and a line route carries the **places it passes**, pinned on the map with their
  name and what kind of place they are. Walked in the browser at 375×812 (§11 steps 13–16).
- **Session 5 — the rest of the front end.** A **light theme** ("premium green") beside the dark
  one, chosen by the phone until the trekker taps the switch; the landing page, the tabs, the map
  menu, the PWA manifest and the command palette now describe the app that exists; features with
  no working backing are **disabled and marked Upcoming** rather than deleted; and six real
  defects found in the browser were fixed (§11 steps 17–20, §7 G9a).

Private specs live in `docs/` (CLAUDE.md rule zero) and are not quoted here. `docs/SPEC.md` §17
is the planner contract, §18 the community boards, §9.1 what an SOS really does;
`docs/DECISIONS.md` is why each choice was made (#161–#221); `docs/TODO.md` → NEXT is the board.

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

Decisions taken by the lead in the **third** session (2026-09-20, late):

| # | Question | Decision |
|---|---|---|
| D12 | Community and SOS on the map | **Two more icons in the map's right rail**, "just as how current location GPS is kept", and both must work |
| D13 | The SOS number | **9703080105**, "use the number … for the SOS for notification for now". Stored as `+9779703080105` in `.env.local` (`NEXT_PUBLIC_SOS_SMS_NUMBER`), **env only** — the lead picked that over a committed constant because this repo is public |
| D14 | What community is | **Five static boards** with posts you can read, "kinda like how reddit works" — but **not** named like Reddit: "not r, that is just copying reddit, just use the name". Board pages only; no per-post view, no comments, no voting |
| D15 | Travel time | **Show both**: "the time it would take for both on foot and bike/car", where today a card showed only whichever profile ORS happened to answer with |

Decisions taken by the lead in the **fourth** session (2026-09-20, later still):

| # | Question | Decision |
|---|---|---|
| D16 | Day out or exact A → B | **An explicit toggle**, app-preselected and flippable: "locals … know the place precisely, so they want to start at one place and end at the next destination, exactly". Built as three chips (Suggest · Day out · Point to point) because the client cannot run the region rule without shipping the baked POI files to the browser |
| D17 | What a long trek should be | **Three foot routes from the trailhead**: "if they want to trek, they will start from the base camp, not from all the way from kathmandu". Trailhead from curated data first, then a roadhead probe — **never** an invented coordinate (the lead picked "Curated + roadhead fallback") |
| D18 | How three options are made | **All three, as a toggle**: different ways, different paces, known treks — "make it toggle, which one they want". Plus: "mark what exactly is the attraction that they chose to see is in that path", which is the `stops` a line route now carries |

Decisions taken by the lead in the **fifth** session (2026-09-20, last):

| # | Question | Decision |
|---|---|---|
| D19 | Light mode | **Follow the system, with a toggle that sticks** ("Follow system + toggle"). This **reverses REDESIGN R4**, which had removed the theme toggle, the `sathi-theme` storage key and the light palette to make the app dark only. The lead asked for light back; the same storage key is used again |
| D20 | Which light palette | **"Use the premium green palette for the light mode… kinda like that premium green."** Deep emerald accent on paper with a green whisper; status keeps a separate leaf green |
| D21 | What to do with features that have no backing | **"By remove I meant just disable the button and make it upcoming."** Nothing is deleted: the pages and the code stay, the entry points go, and the panel says **Upcoming** |

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

## 4. The user flow (as built, walked in a browser at 375×812)

**Step 1 — Map (`/`).** Opens straight onto a full-screen map, chrome-free: no header, no tab
bar. Position is requested on mount and a refusal is a normal state — the map stays on Nepal and
the sheet says so. The current position is a dot; the first fix flies the map to it, later fixes
only move the dot (so it never yanks itself back while you pan). Controls:

- **top-left, the menu** — a dropdown to the rest of the app: Trekking routes · Trek mode ·
  Community · Settings · About Sathi. (Until session 5 this button was a plain link to `/about`
  and there was no other way off the map.)
- **top, the From / To card** — two 48 px rows, either end tappable.
- **right rail, four round controls, top to bottom** — **theme switch** (sun/moon), **community**
  (→ `/community`), **locate**, and the 72 px **SOS** button. The rail is anchored to the top
  edge of the bottom sheet, so it clears the sheet at every height including the results sheet,
  which grows with its cards (that was G9a).

**Step 2 — Either end of the trip.** **To** (or "Go somewhere" in the peek sheet) opens the
destination search; **From** opens the same search for the start, with "Your location" offered at
the top whatever the permission state. Curated treks match offline; two letters or more also
search the whole country through `/api/places` (ORS autocomplete, debounced 300 ms). Curated
matches stay on top. Either end may be picked first: choosing a start with no destination yet
moves straight on to the destination search.

**Step 3 — Trip.** To (tap to change) · From (tap to change) · **Shape of the trip** ·
Days (stepper, 1–21, default 3) · "What do you want to see?" (ten icon chips, multi-select, none
required) · **Find routes**.

**Shape of the trip** is three chips and it decides what the planner is allowed to do (D16):

| Chip | Sends | What it means |
|---|---|---|
| **Suggest** (default) | `mode: "auto"` | The planner's own rule: ≤ 25 km apart, or a destination inside a baked POI region, is a day out; anything else is a trek |
| **Day out** | `mode: "tour"` | A walking loop through places, back where it began, whatever the distance |
| **Point to point** | `mode: "direct"` | The exact line between the two points, no loop and no trailhead snapping. This is the one a local asks for, and the rule above used to take it away from them inside a city |

A hint under the chips says which is which ("Straight from where you start to where you end." /
"A loop through places, back where it began."). There is no hint under **Suggest**.

**Step 4 — Results.** The map fits all options; the selected route is drawn in the route colour,
the others recede. The sheet shows, in order:

1. a heading — "3 routes to Everest Base Camp", "1 route…", or "No routes…" when a toggle came
   back with none;
2. the **variants toggle** (D18), three chips that re-plan on tap and grey out while busy:
   **Different ways** (default) · **Different paces** · **Known treks**. It is **hidden for a day
   out**, which builds its own three sets of stops;
3. any error, in `text-danger`, with the toggle still usable — so "Known treks" answering "We
   don't hold a known trek that reaches there yet." is a dead end you can back out of;
4. the horizontally scrolling cards, one per option.

A card carries: its label, day count, distance, climb, **walking time** (always) and **road
time** (when a road joins the ends), the **places it passes** as `Name (Kind)`, the note **"The
walk starts at <trailhead> — no road reaches it."** when the trek was planned from a trailhead,
the "Road route — too far to walk end to end" note when ORS could only drive it, and **See the
days** which expands the day-by-day plan. A card is **tapped**, not swiped (G9).

On the map, the selected route's places are **numbered pins carrying the place's name and what
kind of place it is** on two lines — "Boudhanath / Stupa", "Tengboche Village / Village". The
number is the walking order. The name label gives way when two pins collide; the dot never does.

**Step 5 — Nothing else in the planner.** No booking, no login, no saving. Out of scope.

**Beside the planner** (third session, D12/D14):

- **Community** (→ `/community`) — five static boards named after places (Pokhara, Everest Base
  Camp, Kathmandu, Annapurna Circuit, Langtang). A board lists its posts, highest score first,
  each with title, author, age, score, comment count and body. Read-only: no posting, no voting,
  no per-post page, no sign-in. The content is **written by us as demo content** (G17).
- **SOS** — the app's existing 72 px SOS button, which opens the existing sheet: 5-second
  countdown → the offline panel, because signed out nothing can reach coordination. The panel
  offers **Send SMS**, **Call** and **WhatsApp** to the configured number, plus the message text
  and a Copy button. **Nothing transmits by itself** (G16); each of those opens an app with the
  message ready and the human presses Send. Since session 5 the sheet **says so before the fact**
  too: signed out it reads "Your SOS is prepared when the countdown ends, ready for you to send"
  and "Preparing SOS…", not "sent".

**Light and dark (D19, D20).** Every screen has both. The theme is an attribute on the html
element, set before the first paint by an inline `next/script` (`beforeInteractive`) from
`localStorage["sathi-theme"]`, falling back to the phone's own setting. Until the first tap the
phone decides — including a change made while the app is open — and after it the choice is stored
per device. The switch is in the planner rail, the app header, the landing header and the console
header. Light is **premium green**: deep emerald accent (`#0a6b4d`) on paper with a green whisper,
its own leaf green for "fine" so brand and status are not one colour, and in light the map route
is green while the stop pins stay orange.

**The rest of the app, beside the MVP path.** Tabs (every screen except the map, which has the
menu instead): **Map · Routes · Trek · Community**; Settings lives in the account menu. `/about`
is the landing page and now leads with the recommender. Features with no working backing are
visible but **Upcoming**, never clickable (D21): the paid tiers (there is no pass screen and no
payment route at all — `src/app/pass/` and `src/app/api/pay/*` are empty placeholders) and the
agency console (it needs agency accounts nobody has created). `/plan` is the pre-pivot preference
finder: still there, no longer linked from anywhere.

**States that must exist** (all built, all seen in a browser): permission refused (the sheet says
so and the From row offers a manual start) · offline (the error names the connection and keeps
the drawn route) · fewer options than three (show what exists, never pad — Kathmandu → Pokhara
really does return two) · engine failure (the server's message in `text-danger`, and **Find
routes** can simply be pressed again; there is no separate retry control) · busy state on the
button and on the variants toggle.

## 5. How the engine works (as built)

`POST /api/plan`, zod-validated, no auth, no PII.

```ts
{
  start: {lat,lng}, end: {lat,lng},
  days: 1..21,
  interests: InterestId[],
  mode:     "auto" | "direct" | "tour",   // zod default "auto"
  variants: "ways" | "paces" | "treks",   // zod default "ways"
}
  → { kind: "tour" | "trek" | "direct", routes: PlannedRoute[] }
```

`PlannedRoute` carries `id`, `label`, `source` (`hiking` | `driving` | `curated`), `kind`,
`distanceM`, `durationS`, `footHours`, `carDurationS | null`, **`trailhead: {name,lat,lng} |
null`**, `ascentM | null`, `geometry`, **`stops: Poi[]`** and `days: DayLeg[]`.

Guards, in order: zod → a 1-hour in-process cache keyed by start/end rounded to 3 decimals +
days + **mode** + **variants** + interests → Nepal bbox (a point outside gets 400 before any
request is spent). **A repeated identical request proves nothing**: change an input or restart
`pnpm dev`.

Error statuses the handler can return: **400** (zod, or a point outside Nepal), **404** (no route
between those points, or "We don't hold a known trek that reaches there yet." under
`variants: "treks"`), **502** (ORS refused, or our key was rejected), **503** (`ORS_API_KEY`
missing).

**Shape** — `mode` on the request (`auto` · `tour` · `direct`), chosen with three chips in the
trip form. `auto` is the rule below. `tour` and `direct` are obeyed as given: a local who asks
point to point gets the exact line between their two points, with no loop back and no detour,
which is what the ≤ 25 km rule used to take away from them.

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

### A line — a trek, or a point-to-point trip (`planLine`)
Both shapes run the same function; `kind` only changes whether the trailhead step may fire.

1. **Where the line starts** (`lineCandidates`). For a `trek` only: if a curated trek's own
   bounding box holds the destination and the trekker is **more than 25 km** from that trek's
   trailhead, the line is planned **from the trailhead** (see the next block). Otherwise
   `fetchCandidates(start, end)`: ORS `foot-hiking` with `alternative_routes {target_count: 3,
   share_factor: 0.6, weight_factor: 1.6}`; on refusal, the same profile **without** alternatives;
   then `driving-car` the same way. A 401/403 fails fast (that is our key, not the request).
   `source` records which profile answered, and the card says so when it is a road route.
   If that came back road-only — or threw — a **roadhead probe** runs (next block). If ORS can
   route to the destination at all and a curated trek reaches it, the curated trek is returned
   instead of an error.
2. **Places along it.** `fetchPoisAlong(…, 8 km, interests)` — **one** query over every
   candidate's coordinates at once, because alternatives share a corridor. The band is 8 km, not
   2 km, because a detour is by definition somewhere the direct line misses; `poisNear(…, 2 km)`
   narrows it back down for each line's day plan and its pinned stops.
3. **What the three options are** (`variants`):
   - **`paces`**, or any request the engine answered with a single geometry and
     `variants: "paces"`: the same line as asked / one day faster / one day easier.
   - **`ways`** with more than one ORS geometry: each becomes an option, **scored** by how many
     of the chosen places it passes (notable ones count double). The best match leads and each
     card is named after what that line has most of ("Most temples & culture"); a line with
     nothing distinctive falls back to "Fastest" / "Alternative n".
   - **`ways`** with one geometry: "Most direct", plus up to **two detours** — a walk through a
     place off the line that matches the chosen interests. `detourPicks` takes the 8 km band
     minus what the line already passes, orders it along the line, splits it in half and takes
     the best of each half in turn, preferring a place you can walk to (villages, teahouses,
     culture, viewpoints, parks) over a summit. **Four are tried, the first two that route are
     kept** — ORS refuses any point with no way within 350 m, which is most peaks.
   - **`treks`**: every curated trek whose own line passes within **10 km** of the destination,
     with its own length, climb and **stage-by-stage days** from the file. 404 when none does.
4. **Stops.** Each line keeps up to **eight** places it passes: notable first, then ordered by
   how far along the line they are reached (`stopsAlong` → `orderAlong`). These are the numbered
   pins and the card's list.

### Where a trek starts — `src/lib/plan/trailhead.ts` (fourth session)
Asked for the Khumbu from Kathmandu, ORS answers with a 294 km walking line out of the city.
The arithmetic is right and nobody walks it: people fly to Lukla and start there. So for
`kind === "trek"`:
1. **Curated trailhead.** If the destination falls inside a curated trek's own bounding box, that
   file's `kind: "trailhead"` waypoint is the start — Lukla for Everest — whenever the trekker is
   more than 25 km from it. Costs nothing: the data is in the repo. Only treks with
   `hasFullData` have waypoints, so today that is **EBC alone**.
2. **Roadhead.** Otherwise, and only when ORS can offer nothing but a road route (or refuses
   outright), the planner takes the settlements OSM holds within 40 km of the destination,
   nearest first, and asks for a **driving** route from the start to each — at most three. The
   first one a car can reach is where the walking begins.
3. The route is then planned from that point, and `trailhead` on the card names it. The road
   time becomes the time **to the trailhead**, or nothing at all when no road reaches it, which
   is the truth for Lukla.
A `direct` request never does any of this: the trekker's two points are the two points.

### What the three options differ by — `variants` (fourth session)
A toggle over the results, because the honest answer depends on the trip:
- **Different ways** (default): the engine's own alternatives where it has them; where it has
  one line, a walk **through a place off it** that matches the chosen interests. Up to four
  detours are tried and the first two that route are kept. Picks alternate the two halves of the
  walk, and a lodge or village is tried before a summit — ORS refuses any point with no way
  within 350 m, which is most peaks.
- **Different paces**: the same line over more or fewer days (what every long trek used to give).
- **Known treks**: the curated routes whose line passes within 10 km of the destination, with
  their **own** length, climb and night-by-night stages out of the file. No engine estimate, and
  no invented number. Nothing matches → a plain 404, "We don't hold a known trek that reaches
  there yet."
A destination ORS cannot route to **at all** — Base Camp itself has no way within 350 m, which
is why every request for it used to end in an error — falls back to a curated trek that reaches
it when we hold one.

### Travel times (both shapes) — added in the third session (D15)
A card used to show one time: whatever ORS answered with. A long trip falls back to
`driving-car`, so a long trip read as car-only, which is what the lead saw.

- **Walking time** (`footHours`, always present) is **Naismith over that route's own line** —
  the same `walkingHours()` the day plan uses — not ORS's foot duration. Two reasons: the card
  and the day list can then never disagree, and a walking figure exists even when the engine
  only managed to drive. For a road route the card says so: "the walking time is for that same
  road."
- **Road time** (`carDurationS`, nullable) is ORS `driving-car` from the start to **wherever the
  walking begins**: the destination normally, the **trailhead** when the trek was planned from
  one (session 4), because the rest of it cannot be driven. Free when a candidate already drove,
  otherwise **one** extra request per plan, shared by every alternative (they share endpoints).
  **Null when there is no road** — Kathmandu → Lukla has none — and the card then shows no road
  row rather than a guess.
- **Tours don't have one.** A day out is a walking loop whose two ends are the same point; a
  road time between them would mean nothing, so it is not requested. `carDurationS` is null on
  every tour route.
- A failed or refused driving request is swallowed: the routes we already have must never be
  lost to a missing second estimate.

### The places on the line (fourth session)
A line route now carries `stops`: the POIs matching the chosen interests that the line passes,
notable first, at most eight, ordered by how far along the line they are reached. A trek stops
being a bare line and says what the trekker is going to walk past. Day highlights are unchanged.

Each pin carries **the name and what kind of place it is** — a numbered dot alone said only the
order. `placeWord()` in `interests.ts` turns the OSM tag the place arrived on into one or two
words ("Stupa", "Viewpoint", "Guest house"), falling back to the interest it matched when the tag
has no word. It never decides that a `place_of_worship` is a temple — OSM does not say which, so
neither do we. On the map the name sits under the dot and gives way when two pins collide; the
dot always stays. The card's stop list reads the same, `Name (Kind)`, with a screen-reader line
saying the order is the walking order.

### Before the response leaves (both shapes) — `src/lib/plan/simplify.ts`
Every geometry goes through Douglas–Peucker at 10 m, **last**, after the day split has measured
climb on every original point. `distanceM`, `ascentM`, `durationS` and the day legs therefore
describe the line ORS sent, not the line the phone draws.

### Day plan (both shapes) — `src/lib/plan/daysplit.ts`
Naismith: 4.5 km/h plus one hour per 600 m of climb, descent ignored. The line is cut into legs
of roughly equal *effort*, not equal distance, so a climbing day is shorter on the ground. Each
day gets its distance, climb, hours, up to four highlights within 2 km of that day's stretch —
the places OSM marks notable first — and an overnight name from the nearest teahouse/village
within 5 km (null when there is none — never invented).

**One exception: a curated trek under "Known treks" uses its file's own stages**, night by night,
with the waypoint each day ends at. Two reasons: a curated line has too few points for the effort
split to cut it into the asked-for number of days (a 9-day request came back as 5), and the
stages are the schedule people actually walk. Such a card therefore shows the trek's day count,
not the trekker's.

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
| P7 | Every state reachable | **done**; §11 steps 1–8 verified in the browser pane (step 7 with a stubbed fetch) |
| P8 | Bug bash on real phones | **not started** — verified at 375×812 in the desktop browser only |
| P10 | Trip shape, trailhead-anchored treks, the variants toggle, labelled pins | **done and seen in a browser** (`d355f60`, `0627f32`, `1cf788b`, `b61fb7f`, `db6b1f5`, `316d3b3`) — §11 steps 13–16 walked at 375×812 against the live APIs |
| P11 | Light + dark, and a front end that matches the app | **done and seen in a browser** (`1b40806` … `3d0bf01`) — §11 steps 17–20; both themes walked across `/`, `/about`, `/routes`, `/routes/ebc`, `/trek`, `/sos`, `/settings`, `/community`, `/community/[slug]`, `/offline`, `/login`, `/share/*`, `/rescue`, `/demo`, `/styleguide` |
| P9 | Community boards, SOS on the map, both travel times | **built; seen in a browser in session 5 except the SOS panel** — `/community` and a board render, the From/To card and both times on a card were used throughout sessions 4–5; **the rail's SOS button has still never been tapped anywhere** (§11 step 12) (`81923db`, `a2ac1e8`) — `pnpm check` green and the planner numbers measured against the live API by `curl`; the UI itself is unverified (§12) |

Commits, oldest first.

*Session 1 (build, nothing seen in a browser):* `5b0cb18` map-first home · `8b3e0bc` trip form +
`/api/plan` · `fdd540c` docs: live API results · `1cf4ad0` map tokens · `621c69e` CARTO light
basemap + icon controls · `c47082b` city day-outs and day plans · `0112d36` chore · `26762c5`
stops and day plans on the results · `8b05bd5`, `60673a4` docs.

*Session 3 (community, SOS on the map, both travel times — no browser available):*
`81923db` community boards + an SOS button on the map · `a2ac1e8` pick both ends, show foot and
road times, reach the SOS number. `81923db` is pushed; **`a2ac1e8` is not** (§13 step 0).

*Session 4 (the recommender itself, **and the first browser run since session 2**):* `d355f60`
point-to-point routes and the places they pass · `0627f32` a trek starts at its trailhead ·
`1cf788b` three ways to walk it and the treks we already hold · `b61fb7f` the three
bugs the browser run found · `db6b1f5` a map-label token · `316d3b3` pins that say what the place
is.

*Session 5 (the rest of the front end, in the browser throughout):* `1b40806` a light palette ·
`34f71dc` the theme switch · `32b1a96` premium green for light · `5677d78` the front page says
what the app does now · `1c2f69c` honest SOS wording + the theme script on next/script ·
`6070d88` a menu on the map · `4f9745e` the PWA opens on the map · `22b080d` service-worker
precache · `f3cc15e` the rail rides the sheet · `3d0bf01` the consoles get the switch.

**Everything above is on `origin/main` (`8c27c35`).** The push that sessions 3 and 4 could not
make has happened; §13 no longer starts with it.

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
- ~~**G3 — Curated treks are not used as trek candidates.**~~ **Closed** (`1cf788b`): the
  "Known treks" toggle offers every curated trek whose line passes within 10 km of the
  destination, and a destination ORS cannot route to falls back to one automatically. Measured:
  Kathmandu → EBC, which used to be a hard error, now returns the Everest trek — 56.2 km, its own
  9 stages, trailhead Lukla. **Only EBC has the data**, so that toggle answers for the Khumbu and
  404s everywhere else (G19).
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
- **G6 — What has been seen in a browser, and what has not.** Sessions 1–2 ran §11 steps 1–8 at
  375×812 in the Claude desktop app's browser pane against the live APIs, and found and fixed
  three bugs (`3eb8277`, `e91dbe7`, `9930ea6`). Session 3 had **no** browser at all (Claude Code
  CLI) and said so. Sessions 4 and 5 had the pane again and used it throughout: steps 13–20 pass,
  and six more real defects were found and fixed there (§11).
  **Seen since:** the From/To card, both times on a card, `/community` and a board, the shape
  chips, the variants toggle, the trailhead note, the labelled pins, both themes on fifteen
  routes, the map menu.
  **Still never seen anywhere:** a **real phone**, a **real geolocation permission prompt**
  (every located run used the stub in §12), a **real radio switched off** (step 7 used a stubbed
  `fetch`), the **SOS countdown, sheet and offline panel** (never opened in any session — §11
  step 12), and every **signed-in** screen (`/trek`, `/settings`, `/rescue`, `/agency`, `/demo`
  past the gate, `/share/<valid token>`), because no session has had an account. The Chrome
  extension is still unusable ("the OAuth token belongs to a different claude.ai account").

- **G7 — The planner needs network.** Offline it shows "Route planning needs a connection", which
  is honest but means the MVP path is online-only. The trekker screens keep their offline
  behaviour.
- ~~**G8 — Payload size.**~~ **Closed** (`7c352a4`): Douglas–Peucker at 10 m, server-side, after
  the day split. Kathmandu → Namobuddha, three options: 1,703 + 1,464 + 2,324 points and 153 KB
  became 510 + 371 + 605 points and 44 KB, with the distances and day plans unchanged.
- ~~**G9a — The rail sat on the results.**~~ **Closed** (`f3cc15e`): the map rail was placed with
  two hardcoded offsets (70 dvh expanded, 9 rem otherwise) and the results sheet is neither — it
  grows with its cards, so the SOS button covered the first one. The rail is now anchored to the
  sheet's own top edge and clears it at every height.
- **G9 — The sheet has fixed heights** (peek / 70 dvh), no drag handle, and it is not swipeable
  by touch. The locate button used to sit *under* it; it now rides above whichever height the
  sheet has (`9930ea6`). The results carousel is a horizontal scroller — cards are selected by
  tapping, and §11 step 6's "swipe" means scrolling that row.
- **G10 — The pre-pivot screens are all still there**, unchanged in behaviour: `/routes`,
  `/routes/[id]`, `/trek`, `/sos`, `/settings`, `/login`, `/share/[token]`, `/rescue`, `/agency`,
  `/demo`, `/offline`, `/styleguide`, `/plan`. Since session 5 they are reachable in a way that
  matches what works: the tabs are **Map · Routes · Trek · Community**, Settings sits in the
  account menu, and **`/plan` (the pre-pivot preference finder) is linked from nowhere** — not
  the tabs, not the footer, not the command palette, not the service worker's precache. It was
  kept, not deleted (D21).
- **G22 — Two "features" in the pitch have no code at all.** `src/app/pass/`, `src/app/assistant/`
  and `src/app/api/assistant/` hold only `.gitkeep`; `src/app/api/pay/esewa/` and
  `src/app/api/pay/mock/` are empty directories. There is no `Paywall` component in the tree and
  nothing imports one. `.env.local` has no `ESEWA_SECRET_KEY`, no `ANTHROPIC_API_KEY` and no
  `SUPABASE_SERVICE_ROLE_KEY`. Session 5 therefore marked the paid tiers and the agency console
  **Upcoming** with no button rather than pretending (D21). Anyone re-reading the older specs
  should treat pass/eSewa and the assistant as **not built**.
- **G23 — The theme is per device, not per account.** `localStorage["sathi-theme"]`; a signed-in
  trekker who switches phones gets the phone's setting again. There is no theme row in
  `/settings`. Fine for the demo, worth knowing before anyone writes "your preferences".
- **G24 — Light was checked on every screen a signed-out session can reach, and only those.**
  The signed-in states of `/trek`, `/settings`, `/rescue`, `/agency` and a real `/share/<token>`
  have never been rendered in light (G6). The palette is token-only, so the risk is contrast in
  places tuned by eye for dark — the console severity rows and the trek Today panel most of all.
- **G19 — "Known treks" has one trek in it.** `curatedFor` walks every route in
  `src/data/routes`, but only `ebc.json` carries a line, waypoints and stages; the other five are
  summaries. The same shortage limits the curated trailhead (§5) to Everest. Adding a trek means
  real coordinates for its waypoints and stages — a `⚠ HUMAN NEEDED` to verify each one
  (CLAUDE.md rule 6), not something to invent.
- ~~**G20 — Overpass sometimes answers a plan with nothing.**~~ **Mostly closed** (`b61fb7f`):
  seen twice — a `paces` run with `stops: []`, and a browser run whose cards listed no places at
  all while the log held `Overpass returned 504`. A failed query, or one carrying Overpass's own
  timeout `remark`, is now retried once after a second; a genuinely empty answer is not retried.
  Two failures in a row still cache a nameless plan for an hour.
- **G21 — A detour costs a request and may buy nothing.** "Different ways" tries up to four
  via-routes and keeps the first two that route; on a trail with no parallel path and no walkable
  place off it, the card list can still come back as one line. Measured cost: Kathmandu → Gorak
  Shep, 10 days, three lines in ~4 s.
- **G11 — Long treks take ~25 s.** Kathmandu → EBC, 3 days: one `/api/plan` call, ~25 s to the
  first card, no progress beyond the button's busy state.
- **G12 — Day counts are taken at face value.** "3 days · as asked" for Kathmandu → EBC means
  35.7 h of walking on day one — less wild since the fourth session, because that trek now starts
  at Lukla (48.7 km, 18.4 h) instead of in Kathmandu (294 km, 105.9 h). A "Known treks" card
  ignores the asked-for day count entirely and shows the trek's own stages, which is the schedule
  people actually walk. The arithmetic is right and the pace is the trekker's to choose,
  so nothing clamps it; the hours are shown per day and for the whole route so the choice is
  visible.
- **G13 — OSM names leak into the highlights**: "Scarf of life", "Jorpati Main Road". Notable
  places now sort first (`229386a`), so those only show up once the good ones run out; nothing
  filters them.
- **G14 — A place search subtitle can be a layer name.** Pelias gives locality · county · region
  where it has them; where it has none, the card reads "locality" or "Nepal" (`toPlaces` in
  `ors.ts`). Honest, ugly. Mapping the layer names to words is a ten-line change nobody has
  approved yet.
- **G16 — An SOS sends nothing by itself, and cannot.** This is what "nothing is sent when SOS
  is clicked" was. Signed out there is no server path at all (`sendSos` builds the event, stores
  it locally and returns before the outbox); the only way out of the device is a link the human
  presses Send in. A desktop browser also ignores `sms:` entirely, which is why a laptop looked
  completely dead. The panel now offers **Send SMS**, **Call** (`tel:`) and **WhatsApp**
  (`wa.me`, the one that works on a laptop) plus the message text and a Copy button, so the
  message can leave any device — but a human still presses Send. **Automatic delivery needs an
  SMS gateway account** (Sparrow SMS or similar: a paid key, a server route, a new secret).
  Nobody has approved one, so it is not built. `NEXT_PUBLIC_SOS_SMS_NUMBER` must be set or the
  panel says "No SMS number set" and offers nothing (it is in `.env.local`, never committed,
  and **not in Vercel** — §13).
- **G17 — The community boards are demo content we wrote.** `src/lib/community.ts` holds five
  boards and 22 posts. The **place names are real; every post, author, score, comment count and
  member count is invented** and labelled as such in the file's header comment. It contains no
  phone number, no coordinate and no safety advice (CLAUDE.md rules 1 and 6). Nothing is
  editable, nothing is stored, nobody can post, and the numbers never change. If community ever
  becomes real it needs a table, RLS, auth and moderation — none of which exists. Say "static
  demo content" on stage rather than implying a live forum.
- **G18 — A tour has no road time**, by design (§5): a walking loop's two ends are the same
  point. If the lead wants "by taxi" for a city day out, it needs a driving route *through the
  stops*, which is one extra ORS request per variant (three per plan), and nobody has asked.
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

Measured in session 3 (2026-09-20, late) — all by `curl` against the running dev server and the
live APIs, because no browser was available (§12):

| Request | Result |
|---|---|
| `/api/plan`, Kathmandu (27.7172, 85.324) → Biratnagar (26.4525, 87.2718), 4 days, villages | `trek`, 3 paces, 381 km, **foot 101.1 h** (Naismith) and **road 16,959 s = 4.7 h** — both modes real on one card |
| `/api/plan`, Kathmandu → Lukla (27.6869, 86.7314), 5 days, mountains | `trek`, 3 paces, 247 km, foot 88.2 h, **road time null** — ORS finds no road to Lukla, and the card shows no road row rather than a guess. This is the check that the null path is real, not a bug |
| `/api/plan`, Kathmandu → Pokhara (28.2096, 83.9856), 3 days, mountains | `tour` (G4 working), 1 option shown in this run, 25 km, foot 7.9 h, **road time null by design** (§5: tours don't ask for one) |
| Cost of the second mode | **one** extra ORS `driving-car` request per plan, shared by all three alternatives; zero when a candidate already drove |
| `/community`, `/community/pokhara` | HTTP 200, all five boards and the sorted posts render server-side; prerendered as SSG at build (`● /community/<slug>`, five paths) |
| `/community/nope` | the 404 page renders, but **dev returns HTTP 200** — `/routes/nope` does the same, so it is Next's dev behaviour, not these pages |

Measured in session 4 (2026-09-20, later still) — `curl` against the running dev server and the
live APIs, no browser (§12). Restart `pnpm dev` or change an input before re-running: the route
handler still caches for an hour, now keyed by mode and variants too.

| Request | Result |
|---|---|
| `/api/plan`, Kathmandu → Bhaktapur (27.671, 85.4298), 1 day, culture, **mode `auto`** | `tour`, 2 loops — 31.9 km and 21.7 km, both ending back at the start. This is the "goes backwards" the lead reported |
| The same request, **mode `direct`** | `direct`, **3 real ORS alternatives** — 16.0 / 16.2 / 16.5 km, foot 3.9–4.3 h, road 1,090 s, every line ending exactly on Bhaktapur, each card listing the temples it passes |
| `/api/plan`, Kathmandu → Gorak Shep (27.9812, 86.8281), 9 days, **before** the trailhead change | `trek`, 294.1 km, foot **105.9 h**, starting in Kathmandu |
| The same request, **after** | `trek` from **Lukla**, 48.7 km, foot 18.4 h, road time **null** (no road reaches Lukla), 8 stops named on the line |
| `/api/plan`, Kathmandu → **Base Camp itself** (27.9881, 86.925), any profile | ORS: "Could not find routable point within a radius of 350.0 meters" — foot **and** road. Until this session every request for EBC ended there |
| The same request, now | the curated **Everest Base Camp** trek: 56.2 km, its own 9 stages, night 1 Phakding, trailhead Lukla |
| `/api/plan`, Kathmandu → Gorak Shep, 10 days, mountains + teahouses + villages, **`variants: ways`** | 3 genuinely different lines in ~4 s: 48.7 km direct · **64.2 km via Thame** · 56.3 km via Green Valley Lodge |
| Detours to peaks | refused by ORS ("no routable point within 350 m"), which is why picks prefer a lodge or a village and four are tried for two kept |
| `/api/plan`, Bhaktapur, **`variants: treks`** | **404** "We don't hold a known trek that reaches there yet." (G19) |
| One `paces` run, Kathmandu → Gorak Shep, 9 days | `stops: []` and no highlights — Overpass returned nothing that call and the hour-long cache kept it (G20). The same request with a different day count: 8 stops |

Walked in the browser at the end of session 4 (375×812, live APIs, the user's own `pnpm dev`):

| Step | What happened |
|---|---|
| Thamel Chowk → Bhaktapur, **Point to point**, 3 days, no interests | **2 lines** (ORS gave two here), 14 km / +194 m / 3.4 h on foot and 20 min by road, both ending on Bhaktapur; eight temples pinned and numbered along the line |
| The same trip, **Different paces** | 3 cards — 2 / 3 / 4 days over the same 14 km line — in ~15 s |
| The same trip, **Known treks** | "No routes to Bhaktapur" and the honest 404 text, with the toggle still usable |
| Thamel Chowk → **Everest Base Camp**, Suggest, 3 days | **3 different lines, all starting at Lukla**: 50.5 km / +4,987 m, 66 km via Thame, 58.1 km via Green Valley Lodge. Each card: "The walk starts at Lukla — no road reaches it." Stops: Phakding · Monjo · नाम्चे बजार · Khumjung · Tengboche · Pangboche · Kala Patthar |
| Bugs the run found | `onSubmit={findRoutes}` passed the click event where the variant kind goes, so **every** "Find routes" failed with "Couldn't reach the route service" and no request left the page; an empty result read "0 routes"; one plan's cards had no places because Overpass 504'd. All three fixed in `b61fb7f` |
| Still ugly | a stop can be called "नेपाल" (G13 — OSM names leak into the list) |
| Re-run after the pin labels landed (`316d3b3`) | pins read "Keshar Mahal / Monument", "सिद्धि बिनायक / Place of worship", "Lion statue / Attraction"; the card list reads the same with the kind in brackets |

### Light and dark (fifth session)
The app was dark only. Both palettes now live in `globals.css`, each written once, picked by
`data-theme` on the html element: an inline `next/script` with `beforeInteractive` sets it before
the first paint from the stored choice, falling back to the phone's own setting, and
`ThemeToggle` reads it back through `useSyncExternalStore` so two toggles can never disagree.
Until the first tap the phone decides, including a change while the app is open; after it, the
choice is stored. Light is a **premium green**: deep emerald accent on paper with a green
whisper, its own leaf green for "fine" so brand and status are not one colour, and in light the
map route joins the palette while the stop pins stay orange. The switch is in the planner rail,
the app header, the landing header and the console header.

### What the front end says it has (fifth session)
Everything that claimed a feature nobody can use was either corrected or marked:
- the landing leads with the recommender and sends you to the map; its capability table gained
  routes, day plans, pinned places and the community boards, each with an honest offline line;
- the tabs are Map · Routes · Trek · Community, the map's menu button opens the rest of the app
  (it used to reach only `/about`), and the command palette lost the pre-pivot `/plan`;
- nothing can be bought — no pass screen, no payment route — so the paid tiers are **Upcoming**
  with no button, and the agency console says it has no accounts to sign in with;
- the SOS sheet, the emergency page and the landing step no longer say "sent" to someone who is
  signed out: on the MVP path nothing leaves the phone until a human presses Send (G16);
- the PWA's `start_url` was `/trek`, so an installed Sathi opened on a sign-in gate; it opens the
  map now, with "Plan a route" beside the Trek and SOS shortcuts.

Measured in session 5 (2026-09-20, last) — the browser pane at 375×812, live APIs:

| Check | Result |
|---|---|
| Fresh tab, `/routes`, console | clean: no errors, no 404s. (Before this session every client navigation logged "Encountered a script tag while rendering React component" — the theme script was a plain `<script>` inside the React tree; `next/script` `beforeInteractive` fixed it) |
| Light theme across `/`, `/about`, `/routes`, `/routes/ebc`, `/trek`, `/sos`, `/settings`, `/community`, `/community/kathmandu`, `/offline`, `/login`, `/share/nope`, `/rescue`, `/demo`, `/styleguide` | renders on all of them; no unreadable pair found by eye. `/settings`, `/trek`, `/rescue` and `/agency` show their **sign-in gates** — the screens behind them were not reachable (G24) |
| Theme persistence | switch on `/about` → navigate to `/` → still light; reload → still light, no dark flash |
| Thamel Chowk → Everest Base Camp, Suggest, 3 days, in light | 3 lines from **Lukla** — 50.5 km / +4,987 m / 20 h, 66 km via Thame, 58.1 km via Green Valley Lodge — green route line, orange numbered pins labelled "Phakding / Village", "Tengboche / Village", "Kala Patthar / Peak" |
| Thamel Chowk → Bhaktapur, **Point to point**, 3 days, no interests | 2 lines (ORS gave two): 14 km / +194 m / 3.4 h on foot / 20 min by road, and 16 km / 4.0 h. Stops read "Keshar Mahal (Monument) · King Tribhuvan Statue (Monument) · Arun Thapa Chok (Memorial) · सिद्धि बिनायक (Place of worship)…" |
| The same trip, **Different paces** / **Known treks** | 3 paces of the 14 km line in ~15 s · "No routes to Bhaktapur" plus "We don't hold a known trek that reaches there yet.", toggle still usable |
| Defects found and fixed in the browser this session | `onSubmit={findRoutes}` handed React's click event to the new variant argument, so **every** "Find routes" died in the catch with "Couldn't reach the route service" and no request left the page · "0 routes to Bhaktapur" for an empty result · one plan's cards had no places at all (`Overpass returned 504`, cached for an hour) · the SOS button sat on the first results card · the theme script warning above · `start_url: "/trek"` in the manifest |
| Repo tests | **179** (`pnpm check`), of which **60** are the planner: `planner` 15 · `daysplit` 12 · `tour` 9 · `ors` 9 · `simplify` 5 · `interests` 4 · `curated` 4 · `trailhead` 2 |

## 9. Files

Everything the pivot added, as it stands at `1cf788b`:

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
| `src/components/plan/RouteCards.tsx` | the snap-scrolling results carousel (tap a card to select it), including the trailhead note |
| `src/lib/plan/trailhead.ts` | where a trek really begins: the curated trailhead, else the nearest settlement a car can reach |
| `src/lib/plan/curated.ts` | the treks we hold our own data for, as routes: line length, stage days, trailhead |
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

Added in the third session (`81923db`, `a2ac1e8`):

| File | What it is |
|---|---|
| `src/lib/community.ts` | the five boards and their posts, `getCommunity`, `formatAge` — **invented demo content** (G17), with a header comment saying so |
| `src/lib/community.test.ts` | slugs and post ids unique, lookup by slug, `formatAge` hours → days (3 tests) |
| `src/app/community/page.tsx` | the board list (server component, static) |
| `src/app/community/[slug]/page.tsx` | one board: posts sorted by score, `generateStaticParams` for all five, `notFound()` on anything else |

Changed in the third session:

| File | Change |
|---|---|
| `src/components/plan/PlanScreen.tsx` | the From/To card replaces the single "Where to?" pill; the rail gained a community link and the SOS button (`items-end`); `startLabel` hoisted; "Your location" is offered in the start sheet whatever the permission state; picking a start with no destination goes to the destination search instead of an empty trip sheet |
| `src/components/plan/RouteCards.tsx` | a card shows walking time (always) and road time (when there is one), not one engine figure |
| `src/lib/plan/types.ts` | `PlannedRoute` gained `footHours: number` and `carDurationS: number \| null` |
| `src/lib/plan/ors.ts` | `fetchDuration(profile, start, end)`; `toPlannedRoutes` fills the two new fields with placeholders the planner overwrites |
| `src/lib/plan/planner.ts` | `plan()` fills `footHours` (Naismith) and `carDurationS` (`drivingSeconds`, treks only) |
| `src/lib/sos.ts` + `src/lib/sos.test.ts` | `whatsappHref` (wa.me, digits only) and its test |
| `src/components/sos/OfflineSosPanel.tsx` | Call and WhatsApp beside Send SMS, plus the message text and a Copy button |
| `.env.local` (not committed) | `NEXT_PUBLIC_SOS_SMS_NUMBER=+9779703080105` (D13) |

Added in the **fourth** session (`d355f60`, `0627f32`, `1cf788b`, `b61fb7f`, `db6b1f5`, `316d3b3`):

| File | What it is |
|---|---|
| `src/lib/plan/trailhead.ts` | `curatedTrailhead` (free, from the route files) and `roadhead` (up to three `driving-car` probes at settlements near the destination) |
| `src/lib/plan/curated.ts` | the treks we hold data for as routes: `curatedDetails`, `curatedFor`, `lineLengthM`, `toCuratedRoute`, `stageDays` |
| `src/lib/plan/trailhead.test.ts`, `curated.test.ts`, `interests.test.ts` | 2 + 4 + 4 tests |

Changed in the fourth session: `planner.ts` (`planKind(start,end,mode)`, `planLine`,
`lineCandidates`, `wayVariants`, `detourPicks`, `curatedRoutes`, `stopsAlong`) · `types.ts`
(`PlanMode`, `VariantKind`, `PlanKind` gained `"direct"`, `PlannedRoute` gained `trailhead`,
`stops` documented) · `overpass.ts` (`orderAlong`, and a single retry after a failed or
`remark`-carrying query) · `ors.ts` (`toPlannedRoutes` fills `trailhead: null`) ·
`api/plan/route.ts` (`mode`, `variants`, both in the cache key) · `interests.ts` (`placeWord`) ·
`PlanScreen.tsx` (mode + variants state, the toggle row, `onSubmit={() => void findRoutes()}`) ·
`TripForm.tsx` (the shape chips) · `RouteCards.tsx` (the trailhead note, `Name (Kind)`) ·
`DayPlan.tsx` ("Night" only for a trek) · `PlanMapInner.tsx` (the `plan-stops-name` layer) ·
`globals.css` (`--map-label`).

Added in the **fifth** session (`1b40806` … `3d0bf01`):

| File | What it is |
|---|---|
| `src/components/ui/theme-toggle.tsx` | the sun/moon switch: reads `data-theme` through `useSyncExternalStore`, writes `localStorage["sathi-theme"]`, follows the phone until the first tap |
| `src/components/plan/MapMenu.tsx` | the map's dropdown to Routes · Trek · Community · Settings · About |

Changed in the fifth session: `globals.css` (the whole light palette under
`:root[data-theme="light"]`; dark moved to `:root, :root[data-theme="dark"]`) · `layout.tsx`
(the `next/script` theme script, `themeColor` per scheme, `suppressHydrationWarning`) ·
`app-header.tsx`, `marketing.tsx`, `console-header.tsx` (the switch; `marketing` CTA → `/`,
footer → Plan a route · Routes · Community · SOS · Offline) · `nav.ts` + `tab-bar.tsx` (Map ·
Routes · Trek · Community, exact match for `/`) · `command-palette.tsx` (Plan a route, Community;
`/plan` dropped) · `LandingHero/Capabilities/Pricing/Agencies/Sos.tsx` (the recommender-first
copy, three new capability rows, Upcoming badges, the honest SOS steps) · `sos/SosSheet.tsx` +
`app/sos/page.tsx` (signed-out wording) · `PlanScreen.tsx` (the rail moved inside the sheet,
"No routes", the menu) · `styleguide/Gallery.tsx` (no longer "dark only") ·
`public/manifest.webmanifest` (`start_url: "/"`, a Plan shortcut, new description) ·
`public/sw.js` (cache `sathi-v4`, `/plan` dropped from the precache) · `not-found.tsx`,
`error.tsx`.

Tests after the fifth session: **179 in the repo**, of which 60 are the planner —
`planner.test.ts` (15), `daysplit.test.ts` (12), `tour.test.ts` (9), `ors.test.ts` (9),
`simplify.test.ts` (5), `interests.test.ts` (4), `curated.test.ts` (4), `trailhead.test.ts` (2).

Server-only modules — never import these from a client component: `ors.ts`, `overpass.ts`,
`pois.ts`, `planner.ts`, `trailhead.ts`, `curated.ts`. (`simplify.ts`, `interests.ts` and
`types.ts` are pure; `interests.ts` is imported by client components for `placeWord` and the
chips, which is why the Overpass filters in it must stay data-only.)

## 10. Running and checking it

```bash
cp .env.example .env.local     # then fill ORS_API_KEY, CARTO_BASEMAPS_API_KEY
                               # and NEXT_PUBLIC_SOS_SMS_NUMBER (the SOS panel needs it, D13)
pnpm install
pnpm dev                       # http://localhost:3000
pnpm check                     # typecheck + lint + 179 tests + data validation + build
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

**Point to point** — the same two city points the rule would loop, and the shape that stops it:

```bash
curl -s -X POST http://localhost:3000/api/plan -H 'Content-Type: application/json' \
  -d '{"start":{"lat":27.7154,"lng":85.3123},"end":{"lat":27.671,"lng":85.4298},
       "days":3,"interests":[],"mode":"direct","variants":"ways"}'
```

`kind` must be `"direct"`, every `geometry.coordinates` must **end on the destination**, and
`stops` must be non-empty. Drop `"mode"` and the same request comes back `"tour"` with loops.

**A trek from its trailhead**, and the three kinds of option:

```bash
for v in ways paces treks; do
  curl -s -X POST http://localhost:3000/api/plan -H 'Content-Type: application/json' \
    -d "{\"start\":{\"lat\":27.7172,\"lng\":85.324},\"end\":{\"lat\":27.9812,\"lng\":86.8281},
         \"days\":9,\"interests\":[\"mountains\",\"teahouses\"],\"variants\":\"$v\"}"
done
```

Expect, in order: three different lines all with `"trailhead":{"name":"Lukla"…}` and
`carDurationS: null` · three paces of one line · one `"source":"curated"` route with 9 stage
days. Base Camp itself (`27.9881, 86.925`) is **not routable in ORS** — "Could not find routable
point within a radius of 350.0 meters" on both profiles — and comes back as the curated trek
whatever `variants` says. That is the fallback working, not a bug.

The community boards need no key and no network:

```bash
curl -s http://localhost:3000/community | grep -o 'Everest Base Camp'
curl -s http://localhost:3000/community/pokhara | head -c 400
```

Note both handlers hold a **1-hour in-process cache**, so a repeat of the same request answers
instantly and does not prove the code path still works. Change a coordinate, a day count or a
word to force a real call, or restart `pnpm dev`.

## 11. The demo, step by step (the acceptance test)

Status of every step is marked. "pane" = the Claude desktop app's browser pane at 375×812
against the live APIs; **no step has ever run on a real phone** (G6).

**Core flow — steps 1–8 (pane, pass, sessions 1–2):**
1. Open the app → the map fills the screen, light, with your blue dot, within ~3 s.
2. Tap "Go somewhere" → type two letters → curated treks and real places both appear → pick one.
3. From = Your location (or tap From and pick a start when location is off). Days = 2. Chips:
   Temples & culture, Villages & squares, Forests & parks.
4. **Find routes** → up to three cards, distinct lines, numbered pins on the selected one.
5. Expand a card → day 1 and day 2, each with distance, hours, highlights and where it ends.
6. Tap another card → the map redraws that option's line and pins. (Cards are **tapped**; the row
   scrolls horizontally, G9.)
7. Airplane mode → a new search says planning needs a connection; results already on screen stay.
   Verified with `navigator.onLine` forced false and `/api/*` fetches rejected, **not** with a
   real radio off: the copy appears in `text-danger` and the drawn route stays on the map.
8. No crash, no console error, no login prompt anywhere in 1–7. Re-verified in a fresh tab in
   session 5: the console is empty.

**Both ends, both times, community, SOS — steps 9–12 (session 3 built them; 9–11 seen in
sessions 4–5, 12 has never been run anywhere):**

9. *(seen)* Tap **From** with no destination picked → the start search opens, "Your location" is
   the first row *whatever* the permission state, and picking a place moves on to the destination
   search rather than an empty sheet.
10. *(seen)* On a results card, both times are there: a footprint figure always, a car figure
    whenever a road joins the two ends. Kathmandu → Lukla shows **only** the footprint one.
11. *(seen)* Tap the **community** icon in the rail → five boards → tap one → its posts, highest
    score first. Back returns to the map. No sign-in anywhere.
12. **⚠ NEVER RUN.** Tap the **SOS** button in the rail → 5-second countdown → the panel with
    **Send SMS**, **Call** and **WhatsApp**. On a phone each opens the right app with the message
    filled in. Nothing is sent until you press Send *there* (G16). Signed out the sheet must say
    "Your SOS is prepared when the countdown ends" and "Preparing SOS…", never "sent".

**The recommender — steps 13–16 (pane, pass, session 4):**

13. On the trip sheet, **Shape of the trip** shows three chips (Suggest · Day out · Point to
    point) and the hint under them changes. Pick two places inside the valley, choose **Point to
    point**, Find routes: the lines end at the destination instead of curling back to the start.
14. Kathmandu → a Khumbu destination, Suggest: the cards say **"The walk starts at Lukla — no
    road reaches it."**, and the drawn line starts at Lukla, not in Kathmandu.
15. Over the results, the toggle row (Different ways · Different paces · Known treks) re-plans on
    tap, greys out while busy, and is **absent for a day out**. "Known treks" outside the Khumbu
    shows the 404 text in the results sheet with the toggle still usable.
16. A trek card lists the places it passes as `Name (Kind)` and the map pins them, numbered, in
    walking order, each pin labelled with its name and kind.

**Themes and the rest of the app — steps 17–20 (pane, pass, session 5):**

17. Tap the sun/moon in the rail (or either header) → the whole screen changes theme, the map
    route colour with it. Navigate anywhere → it holds. Reload → it holds, with no dark flash.
    With no stored choice, the app matches the phone's own setting.
18. The map's menu button opens a menu: Trekking routes · Trek mode · Community · Settings ·
    About Sathi. Each goes somewhere real.
19. `/about` leads with "Say where you want to go. We draw the way.", its primary button goes to
    the map, and the capability table lists the recommender, day plans, places and community. The
    paid tiers say **Upcoming** and have **no** button; the agency panel says it has no accounts
    to sign in with.
20. The tab bar reads Map · Routes · Trek · Community and highlights the one you are on.

**A demo driver should also know:** the destination search needs two letters before it calls the
country-wide search; a long trek takes ~20–25 s with nothing but a busy button (G11); and the
first plan of a cold server is slower than the rest.

## 12. How to verify it yourself (what worked, so nobody re-invents it)

**Which tools you have depends on where the session runs, so check first:**

| Session | Browser available? | What to do |
|---|---|---|
| Claude **desktop app** | yes — the built-in **browser pane** (`preview_start`, `navigate`, `read_page`, `computer`, `read_console_messages`, `read_network_requests`) | the recipe below; it is how sessions 1–2 verified everything |
| **Claude Code CLI** (session 3) | **no** — there is no pane, and the Chrome extension tool returns "the OAuth token belongs to a different claude.ai account" | you cannot see the UI. Verify what you can by `curl` against `pnpm dev` and by `pnpm check`, and **say in the commit and the docs that the UI was never rendered** |

Session 3 took the second row: every claim it makes about the planner's numbers comes from
`curl` (§8), and every claim about layout was deliberately **not** made. Sessions 4 and 5 had the
pane and used it. Do not upgrade an unrendered claim without rendering the page.

The Chrome extension has never connected in any session. What works is the **built-in browser
pane** of the Claude desktop app (`navigate`, `read_page`, `get_page_text`, `computer`,
`find`, `javascript_tool`, `read_console_messages`, `read_network_requests`, `resize_window`).

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
6. **Long calls:** a trek to EBC takes ~20–25 s. Wait in chunks and screenshot, don't assume a
   hang. A `ways` plan that has to try detours can add a few seconds more.
7. **`read_network_requests` does not show POST `fetch`es** in this pane — `/api/plan` never
   appears in the list. To prove a request left the page, run the same `fetch` from
   `javascript_tool` and read the status, or watch the dev server log
   (`.next/dev/logs/next-development.log`). This is how session 5 caught "Find routes" sending
   nothing at all.
8. **Two toggles on one page must agree.** The theme lives on `document.documentElement.dataset
   .theme`; read it there rather than trusting a component's state.
9. **The 1-hour route cache hides changes.** A repeated identical request answers instantly from
   memory and proves nothing — change an input or restart `pnpm dev`. The cache key now includes
   `mode` and `variants`, so those are cheap ways to force a real call.
10. **Signed-in screens need an account nobody has in a session.** `/trek`, `/settings`,
    `/rescue`, `/agency` redirect to `/login`; a plain `/share/<token>` shows "This link is
    invalid or was turned off". Verify their gates and say the rest is unverified (G6, G24).

## 13. Next session, in order

**Start here.** `git switch main && git pull --ff-only && git -C docs pull`. Nothing is waiting
to be pushed: `main` and `origin/main` are both `8c27c35`. `pnpm dev` may already be running on
3000 — Next refuses a second server, so just use the one that is up (§12).

1. **⚠ A real phone, on mobile data.** The only thing between "it works" and "we watched it
   work". Everything below the §11 line has been seen in a browser pane; a phone is where the
   real permission prompt, the real radio and real tap targets live. Walk §11 steps 1–20 and
   write every defect down before fixing anything.
2. **⚠ §11 step 12 — the SOS panel, anywhere at all.** The countdown, the sheet and the offline
   panel have **never been opened in any session**, in any browser. On a laptop `sms:` does
   nothing, so use WhatsApp to prove the message is real. This is the one demo path with no
   evidence behind it (G6, G16).
3. **G16 — decide what "SOS notification" means for the demo** (lead's call, `docs/TODO.md`
   M-14). As built a human presses Send. Automatic delivery = an SMS gateway: a paid account, a
   server route, a new secret, and a `⚠ HUMAN NEEDED` for the account. Ask before building.
   Either way `NEXT_PUBLIC_SOS_SMS_NUMBER` must reach Vercel or the deployed panel says "No SMS
   number set".
4. **⚠ Vercel keys** (`docs/TODO.md` M-7): `ORS_API_KEY`, `CARTO_BASEMAPS_API_KEY`,
   `NEXT_PUBLIC_SOS_SMS_NUMBER`. Without the first, production answers "Route planning is not
   configured yet."; without the second, the keyless basemap.
5. **G11 — the ~20–25 s wait** on a long trek, the worst thing left in the demo. **Measure
   before optimising**: time `fetchCandidates`, `fetchPoisAlong` and each detour separately
   inside `planLine` and find out which service costs what. Smaller payloads (G8) did not move
   it. Candidates once it is known: skip Overpass beyond ~100 km, return the line first and the
   day plan after, or drop to one detour. Note that a `ways` plan with detours now costs **up to
   four extra ORS calls**, so if the wait got worse since session 4, that is where to look.
6. **G24 — light on the signed-in screens.** Everything a signed-out session can reach was
   checked in both themes; `/trek`, `/settings`, `/rescue`, `/agency` and a real `/share/<token>`
   were only seen as gates. Whoever has an account should open each one in light and look for
   contrast the dark palette was tuned for — the console severity rows and the trek Today panel
   first.
7. **G19 / G3 — "Known treks" has one trek in it.** Only `ebc.json` carries a line, waypoints
   and stages; the other five routes are summaries, so the toggle 404s everywhere but the Khumbu
   and the curated trailhead only exists for Lukla. Adding a trek means **real** coordinates for
   its waypoints and stages — `⚠ HUMAN NEEDED` to verify each one (CLAUDE.md rule 6), never
   invented. `docs/TODO.md` N-9 is the same task from the pre-pivot side.
8. **G15 / G14 — the search's rough edges.** A county centroid ORS cannot route from ("Nuwakot",
   27.8734, 85.1891) is still offered and 404s on Find routes; a subtitle can read "locality".
   Both are visible in a demo.
9. **G5 — more regions**, if the demo will visit anywhere outside Kathmandu, Pokhara, Chitwan,
   Lumbini or Bandipur. The list is also what `planKind` calls a city. And decide what to do
   about Chitwan's wildlife: OSM's park polygon centre is ~25 km from Sauraha, so a wildlife day
   out there finds hotels and temples.
10. **G17 — community content.** Five boards, 22 posts, all written by us. If it stays in the
    demo, keep saying so out loud; making it real is a table, RLS, auth and moderation — nobody
    has scoped it.
11. **G22 — the pitch still mentions things with no code**: the pass/eSewa flow and the AI
    assistant are empty directories. Session 5 marked them Upcoming on the landing page. If they
    are meant to exist for the demo, they are new work, not a fix.

**Deliberately not doing** (say so if asked; don't "fix" them silently):

- **G12** — day counts are taken at face value; the pace is the trekker's to choose (D10) and
  the hours are shown per day and per route.
- **G13** — OSM names are what OSM has ("नेपाल" can be a stop); notable ones already sort first.
- **G7** — the planner is online-only by design; the trekker screens keep their offline
  behaviour.
- **G18** — a tour has no road time, because its two ends are the same point.
- **G23** — the theme is per device, not per account.
- **G21** — a detour may buy nothing on a trail with no parallel path; two options are then the
  honest answer.

**Three traps that have each cost a session:**

1. Both route handlers hold a **1-hour in-process cache** — a repeated request proves nothing.
2. The region list in `src/lib/plan/pois.ts` **is** the definition of a city, so editing it
   changes how trips are planned (G4).
3. `src/lib/community.ts` is **content we invented** (real place names, fictional posts) — never
   present it as real user data (G17).

Where the rest of the documentation lives: `docs/SPEC.md` §17 is the planner contract and
behaviour, §18 the community boards, §9.1 what an SOS really does; `docs/DECISIONS.md` #161–#221
is why each choice was made; `docs/TODO.md` → NEXT is the task board; `docs/REDESIGN.md` §14 is
the light theme that reversed R4. This file is the only one with the measurements.
