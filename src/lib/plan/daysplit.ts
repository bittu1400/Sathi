import { haversineKm } from "@/lib/geo";
import type { DayLeg, LatLng, Poi } from "./types";

/** Walking hours for a leg: Naismith — 4.5 km/h on the flat, plus 1 h per 600 m up. */
export function walkingHours(distanceM: number, ascentM: number): number {
  return distanceM / 1000 / 4.5 + Math.max(0, ascentM) / 600;
}

export interface Leg {
  distanceM: number;
  ascentM: number;
  end: LatLng;
  /** Index into the geometry where this leg ends, so callers can slice it. */
  endIndex: number;
}

/**
 * Cuts a line into `days` legs of roughly equal effort (distance plus climb),
 * not equal distance: a day that climbs 1,200 m is not the same day as one that
 * crosses a flat valley.
 */
export function splitByEffort(coordinates: number[][], days: number): Leg[] {
  if (days < 1 || coordinates.length < 2) return [];
  const steps: { distanceM: number; ascentM: number; point: LatLng; index: number }[] = [];
  let total = 0;

  for (let i = 1; i < coordinates.length; i += 1) {
    const previous = coordinates[i - 1];
    const current = coordinates[i];
    if (!previous || !current) continue;
    const [prevLng, prevLat, prevEle] = previous;
    const [lng, lat, ele] = current;
    if (
      typeof prevLng !== "number" ||
      typeof prevLat !== "number" ||
      typeof lng !== "number" ||
      typeof lat !== "number"
    ) {
      continue;
    }
    const distanceM = haversineKm({ lat: prevLat, lng: prevLng }, { lat, lng }) * 1000;
    const climb =
      typeof ele === "number" && typeof prevEle === "number" ? Math.max(0, ele - prevEle) : 0;
    total += walkingHours(distanceM, climb);
    steps.push({ distanceM, ascentM: climb, point: { lat, lng }, index: i });
  }

  if (steps.length === 0) return [];
  const budget = total / days;
  const legs: Leg[] = [];
  let leg = { distanceM: 0, ascentM: 0, effort: 0 };

  for (const step of steps) {
    leg.distanceM += step.distanceM;
    leg.ascentM += step.ascentM;
    leg.effort += walkingHours(step.distanceM, step.ascentM);
    const isLastStep = step === steps[steps.length - 1];
    const dayIsFull = leg.effort >= budget && legs.length < days - 1;
    if (dayIsFull || isLastStep) {
      legs.push({ distanceM: leg.distanceM, ascentM: leg.ascentM, end: step.point, endIndex: step.index });
      leg = { distanceM: 0, ascentM: 0, effort: 0 };
    }
  }
  return legs;
}

/** The nearest named place to a point, within `withinKm`, or null. */
export function nearestPoi(point: LatLng, pois: Poi[], withinKm: number): Poi | null {
  let best: Poi | null = null;
  let bestKm = withinKm;
  for (const poi of pois) {
    const km = haversineKm(point, poi);
    if (km <= bestKm) {
      best = poi;
      bestKm = km;
    }
  }
  return best;
}

/**
 * Legs plus the names that make them readable: where the day ends, and what it
 * passes. Highlights are the POIs within 2 km of that day's stretch, the ones
 * OSM marks notable first — otherwise a day past Boudhanath is listed as
 * "Jorpati Main Road", whichever Overpass happened to send back first.
 */
export function toDayLegs(
  coordinates: number[][],
  days: number,
  pois: Poi[],
  stayPois: Poi[],
): DayLeg[] {
  const legs = splitByEffort(coordinates, days);
  let from = 0;
  return legs.map((leg, index) => {
    const stretch = coordinates.slice(from, leg.endIndex + 1);
    from = leg.endIndex;
    const highlights = pois
      .filter((poi) => stretch.some((c) => {
        const [lng, lat] = c;
        return typeof lng === "number" && typeof lat === "number" && haversineKm({ lat, lng }, poi) <= 2;
      }))
      .sort((a, b) => Number(b.notable) - Number(a.notable))
      .slice(0, 4)
      .map((poi) => poi.name);
    const stay = nearestPoi(leg.end, stayPois, 5);
    return {
      day: index + 1,
      distanceM: Math.round(leg.distanceM),
      ascentM: Math.round(leg.ascentM),
      hours: Number(walkingHours(leg.distanceM, leg.ascentM).toFixed(1)),
      endName: stay?.name ?? null,
      highlights,
    };
  });
}
