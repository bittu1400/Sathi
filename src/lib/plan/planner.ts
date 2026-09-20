import { haversineKm } from "@/lib/geo";
import { toDayLegs } from "./daysplit";
import type { InterestId } from "./interests";
import { fetchCandidates, fetchThrough } from "./ors";
import { fetchPoisAlong } from "./overpass";
import { poisAround, regionFor } from "./pois";
import { buildTourVariants } from "./tour";
import type { LatLng, PlanKind, PlannedRoute, PlanRequest, PlanResult, Poi } from "./types";

/**
 * Under this, the trip is a day out among places rather than a line between two
 * of them: everything worth seeing inside Kathmandu is within a few kilometres.
 */
const TOUR_RADIUS_KM = 25;

/** What a day out looks for when the trekker picked nothing in particular. */
const DEFAULT_TOUR_INTERESTS: InterestId[] = ["culture", "villages", "forests", "sunrise"];
const DEFAULT_TREK_INTERESTS: InterestId[] = ["mountains", "villages", "rivers", "teahouses"];

export function planKind(start: LatLng, end: LatLng): PlanKind {
  if (haversineKm(start, end) <= TOUR_RADIUS_KM) return "tour";
  // Asking for a city we hold the places of is a day out *in* that city: you
  // fly or take the bus to Pokhara, you don't walk 200 km to it.
  return regionFor(end) ? "tour" : "trek";
}

export async function plan(request: PlanRequest): Promise<PlanResult> {
  const kind = planKind(request.start, request.end);
  const routes = kind === "tour" ? await planTour(request) : await planTrek(request);
  return { kind, routes };
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
 * A trek: the engine gives the line. Where it offers real alternatives we keep
 * them; where it offers one — which is most of the high mountains — the three
 * options are three ways to walk the same line, which is the honest difference.
 */
async function planTrek({ start, end, days, interests }: PlanRequest): Promise<PlannedRoute[]> {
  const wanted = interests.length > 0 ? interests : DEFAULT_TREK_INTERESTS;
  const candidates = await fetchCandidates(start, end);
  const first = candidates[0];
  if (!first) return [];

  const pois = await fetchPoisAlong(first.geometry.coordinates, 2_000, wanted);
  const stays = pois.filter((poi) => poi.interest === "teahouses" || poi.interest === "villages");

  if (candidates.length > 1) {
    return candidates.map((route) => withDays(route, days, pois, stays));
  }
  return paceVariants(first, days, pois, stays);
}

function withDays(route: PlannedRoute, days: number, pois: Poi[], stays: Poi[]): PlannedRoute {
  return { ...route, days: toDayLegs(route.geometry.coordinates, days, pois, stays) };
}

/**
 * One line, three paces. Fewer days means longer days on the trail; more days
 * means shorter ones with an extra night. The asked-for number always leads.
 */
function paceVariants(route: PlannedRoute, days: number, pois: Poi[], stays: Poi[]): PlannedRoute[] {
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
      days: toDayLegs(route.geometry.coordinates, pace.days, pois, stays),
    }));
}
