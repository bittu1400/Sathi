import { haversineKm } from "@/lib/geo";
import { toDayLegs, walkingHours } from "./daysplit";
import { interestLabel, type InterestId } from "./interests";
import { fetchCandidates, fetchDuration, fetchThrough } from "./ors";
import { fetchPoisAlong, orderAlong, poisNear } from "./overpass";
import { poisAround, regionFor } from "./pois";
import { simplifyLine } from "./simplify";
import { curatedTrailhead, roadhead, type Trailhead } from "./trailhead";
import { buildTourVariants } from "./tour";
import type {
  LatLng,
  PlanKind,
  PlanMode,
  PlannedRoute,
  PlanRequest,
  PlanResult,
  Poi,
} from "./types";

/**
 * Under this, the trip is a day out among places rather than a line between two
 * of them: everything worth seeing inside Kathmandu is within a few kilometres.
 */
const TOUR_RADIUS_KM = 25;

/** What a day out looks for when the trekker picked nothing in particular. */
const DEFAULT_TOUR_INTERESTS: InterestId[] = ["culture", "villages", "forests", "sunrise"];
const DEFAULT_TREK_INTERESTS: InterestId[] = ["mountains", "villages", "rivers", "teahouses"];

/** How many places a line route pins: enough to see what you came for, few enough to read. */
const MAX_LINE_STOPS = 8;

/**
 * Which shape of trip to plan. `direct` and `tour` are the trekker's own
 * choice and are obeyed as given — someone who lives here knows whether they
 * want a loop or the way to the next town — and `auto` falls back to the rule:
 * close by, or a city we hold the places of, is a day out.
 */
export function planKind(start: LatLng, end: LatLng, mode: PlanMode = "auto"): PlanKind {
  if (mode === "direct") return "direct";
  if (mode === "tour") return "tour";
  if (haversineKm(start, end) <= TOUR_RADIUS_KM) return "tour";
  // Asking for a city we hold the places of is a day out *in* that city: you
  // fly or take the bus to Pokhara, you don't walk 200 km to it.
  return regionFor(end) ? "tour" : "trek";
}

export async function plan(request: PlanRequest): Promise<PlanResult> {
  const kind = planKind(request.start, request.end, request.mode);
  const routes = kind === "tour" ? await planTour(request) : await planLine(request, kind);
  // Every route between these two points shares the road time, so it is asked
  // for once. A tour is a walking loop through its stops: a road time between
  // its two (nearly identical) ends would mean nothing, so it isn't asked for.
  // The drive is to wherever the walking starts: for a trek out of Kathmandu
  // that is the trailhead, because the rest of it cannot be driven.
  const target = routes[0]?.trailhead ?? request.end;
  const carS = kind === "tour" ? null : await drivingSeconds(request.start, target, routes);
  // Last step: the days are measured on every point ORS sent, the phone only
  // has to draw the line.
  return {
    kind,
    routes: routes.map((route) => ({
      ...route,
      footHours: Number(walkingHours(route.distanceM, route.ascentM ?? 0).toFixed(1)),
      carDurationS: route.source === "driving" ? route.durationS : carS,
      geometry: { ...route.geometry, coordinates: simplifyLine(route.geometry.coordinates) },
    })),
  };
}

/**
 * The road time between the trip's ends. A route the engine already drove
 * gives it for free; otherwise it costs one request, and a trip with no road
 * (or one ORS refuses) simply has no road time.
 */
async function drivingSeconds(start: LatLng, end: LatLng, routes: PlannedRoute[]): Promise<number | null> {
  const driven = routes.find((route) => route.source === "driving");
  if (driven) return driven.durationS;
  if (routes.length === 0) return null;
  try {
    return await fetchDuration("driving-car", start, end);
  } catch {
    // A missing second estimate must never lose the routes we already have.
    return null;
  }
}

/** A city day out looks for city things; a line across the country does not. */
function defaultInterests(start: LatLng, end: LatLng): InterestId[] {
  return haversineKm(start, end) <= TOUR_RADIUS_KM ? DEFAULT_TOUR_INTERESTS : DEFAULT_TREK_INTERESTS;
}

/**
 * A city day out: find the places first, then ask for a walk that links them.
 * Each variant visits a different set, so the three lines really differ — which
 * is what a routing engine's alternatives cannot give you inside a city.
 */
async function planTour({ start, end, days, interests }: PlanRequest): Promise<PlannedRoute[]> {
  const wanted = interests.length > 0 ? interests : DEFAULT_TOUR_INTERESTS;
  // A day out in a city far from home starts in that city, not at the doorstep
  // of someone who is still in Kathmandu.
  const base = haversineKm(start, end) <= TOUR_RADIUS_KM ? start : end;
  // Big enough to hold a city, wider for a longer stay.
  const radiusM = Math.min(15_000, 4_000 + days * 2_000);
  const pois = await poisAround(end, radiusM, wanted);
  const variants = buildTourVariants(base, pois, days, wanted);
  const stays = pois.filter((poi) => poi.interest === "teahouses");

  const routes: PlannedRoute[] = [];
  for (const variant of variants) {
    // Out and back: a day out ends where it started.
    const route = await fetchThrough([base, ...variant.stops, base]);
    if (!route) continue;
    routes.push({
      ...route,
      id: variant.id,
      label: variant.label,
      kind: "tour",
      stops: variant.stops,
      days: toDayLegs(route.geometry.coordinates, days, variant.stops, stays.length > 0 ? stays : pois),
    });
  }
  return routes;
}

/**
 * A line between the two points, which is both a trek and a trekker's own
 * point-to-point request: the engine gives the line. Where it offers real
 * alternatives we keep them; where it offers one — which is most of the high
 * mountains — the three options are three ways to walk the same line, which is
 * the honest difference.
 */
async function planLine(
  { start, end, days, interests }: PlanRequest,
  kind: PlanKind,
): Promise<PlannedRoute[]> {
  const wanted = interests.length > 0 ? interests : defaultInterests(start, end);
  const { candidates, trailhead } = await lineCandidates(start, end, kind);
  const first = candidates[0];
  if (!first) return [];

  // Alternatives run down the same corridor, so one query covers them all and
  // each line is then given the places it actually passes.
  const pois = await fetchPoisAlong(
    candidates.flatMap((route) => route.geometry.coordinates),
    2_000,
    wanted,
  );

  if (candidates.length > 1) {
    const taken = new Set<InterestId>();
    return candidates
      .map((route) => {
        const near = poisNear(pois, route.geometry.coordinates, 2_000);
        return { route, near, score: scorePois(near, wanted) };
      })
      // The line that passes most of what they asked for leads the carousel.
      .sort((a, b) => b.score - a.score)
      .map(({ route, near }, index) => {
        const top = topInterest(near, wanted, taken);
        if (top) taken.add(top);
        return {
          ...withDays(route, days, near, staysIn(near), kind, trailhead),
          label: top ? `Most ${interestLabel(top).toLowerCase()}` : index === 0 ? "Fastest" : `Alternative ${index}`,
        };
      });
  }
  return paceVariants(first, days, poisNear(pois, first.geometry.coordinates, 2_000), kind, trailhead);
}

/**
 * The lines to choose from, and where the walking starts. ORS answers a trek
 * it considers too long to walk with the road route instead — which is honest
 * about the road and useless as a trek, because nobody walks out of Kathmandu
 * to Everest. When that happens the trek is re-planned from its trailhead, and
 * the card says where the walking begins. A trekker who asked point to point
 * gets their two points, untouched.
 */
async function lineCandidates(
  start: LatLng,
  end: LatLng,
  kind: PlanKind,
): Promise<{ candidates: PlannedRoute[]; trailhead: Trailhead | null }> {
  // A curated trek names where it begins. Nobody walks out of Kathmandu to
  // Everest — they fly to Lukla and start there — so when the trekker is
  // nowhere near that trailhead the trek is planned from it, and getting there
  // is shown as the road (or no road) that it is. The engine will happily
  // answer Kathmandu → Khumbu with a 294 km line; that is not a trek anyone walks.
  const curated = kind === "trek" ? curatedTrailhead(end) : null;
  if (curated && haversineKm(start, curated) > TOUR_RADIUS_KM) {
    const onFoot = await fetchCandidates(curated, end).catch(() => [] as PlannedRoute[]);
    if (onFoot[0]?.source === "hiking") return { candidates: onFoot, trailhead: curated };
  }

  let candidates: PlannedRoute[] = [];
  let refusal: unknown = null;
  try {
    candidates = await fetchCandidates(start, end);
  } catch (error) {
    // Kept: if the trailhead doesn't help either, this is the honest reason.
    refusal = error;
  }

  const roadOnly = candidates[0]?.source === "driving";
  if (kind !== "trek" || (candidates.length > 0 && !roadOnly)) {
    if (refusal) throw refusal;
    return { candidates, trailhead: null };
  }

  // The engine walks nothing and drives nothing useful: find where the road
  // ends near the destination and walk from there. Costs a few requests, so it
  // is the last thing tried.
  const found = await roadhead(start, end);
  const onFoot = found ? await fetchCandidates(found, end).catch(() => [] as PlannedRoute[]) : [];
  if (found && onFoot[0]?.source === "hiking") return { candidates: onFoot, trailhead: found };
  // No better than what we had: the road line, or the refusal it came with.
  if (refusal) throw refusal;
  return { candidates, trailhead: null };
}

/** Somewhere to sleep: a teahouse if there is one, else any named settlement. */
function staysIn(pois: Poi[]): Poi[] {
  return pois.filter((poi) => poi.interest === "teahouses" || poi.interest === "villages");
}

/**
 * The places this line passes that the trekker asked for, in the order they
 * are reached, so the map pins what they came to see rather than leaving a
 * trek as a bare line. Notable places win the few slots there are.
 */
export function stopsAlong(pois: Poi[], coordinates: number[][], limit = MAX_LINE_STOPS): Poi[] {
  const best = [...pois].sort((a, b) => Number(b.notable) - Number(a.notable)).slice(0, limit);
  return orderAlong(best, coordinates);
}

/** The card only needs where it is and what it is called. */
function toStartPoint(trailhead: Trailhead | null): PlannedRoute["trailhead"] {
  return trailhead ? { name: trailhead.name, lat: trailhead.lat, lng: trailhead.lng } : null;
}

/**
 * How well a line matches what the trekker picked: one point per place it
 * passes, two when OSM marks the place notable. Exported for its test.
 */
export function scorePois(pois: Poi[], wanted: InterestId[]): number {
  const want = new Set<string>(wanted);
  return pois.reduce((total, poi) => (want.has(poi.interest) ? total + (poi.notable ? 2 : 1) : total), 0);
}

/**
 * The interest this line has most of, skipping any another line already took:
 * three cards all called "Most villages" would say nothing about the choice.
 * Exported for its test.
 */
export function topInterest(pois: Poi[], wanted: InterestId[], taken: Set<InterestId>): InterestId | null {
  const counts = new Map<InterestId, number>();
  for (const poi of pois) {
    if (!wanted.includes(poi.interest)) continue;
    counts.set(poi.interest, (counts.get(poi.interest) ?? 0) + (poi.notable ? 2 : 1));
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked.find(([id]) => !taken.has(id))?.[0] ?? null;
}

function withDays(
  route: PlannedRoute,
  days: number,
  pois: Poi[],
  stays: Poi[],
  kind: PlanKind,
  trailhead: Trailhead | null,
): PlannedRoute {
  return {
    ...route,
    kind,
    trailhead: toStartPoint(trailhead),
    stops: stopsAlong(pois, route.geometry.coordinates),
    days: toDayLegs(route.geometry.coordinates, days, pois, stays),
  };
}

/**
 * One line, three paces. Fewer days means longer days on the trail; more days
 * means shorter ones with an extra night. The asked-for number always leads.
 */
function paceVariants(
  route: PlannedRoute,
  days: number,
  pois: Poi[],
  kind: PlanKind,
  trailhead: Trailhead | null,
): PlannedRoute[] {
  const stays = staysIn(pois);
  const stops = stopsAlong(pois, route.geometry.coordinates);
  const paces: { id: string; label: string; days: number }[] = [
    { id: "balanced", label: `${days} days · as asked`, days },
    { id: "fast", label: `${days - 1} days · faster`, days: days - 1 },
    { id: "scenic", label: `${days + 1} days · easier`, days: days + 1 },
  ];
  return paces
    .filter((pace) => pace.days >= 1 && pace.days <= 21)
    .map((pace) => ({
      ...route,
      id: `${route.id}-${pace.id}`,
      label: pace.label,
      kind,
      trailhead: toStartPoint(trailhead),
      stops,
      days: toDayLegs(route.geometry.coordinates, pace.days, pois, stays),
    }));
}
