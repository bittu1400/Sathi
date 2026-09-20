import { getRoute, getRoutes } from "@/lib/data";
import { haversineKm } from "@/lib/geo";
import type { RouteDetail } from "@/lib/types";
import type { DayLeg, LatLng, PlannedRoute } from "./types";

/**
 * The treks we hold our own data for. Only routes with `hasFullData` carry a
 * line, waypoints and stages; the rest are summaries and cannot be walked.
 */
export function curatedDetails(): RouteDetail[] {
  return getRoutes().flatMap((summary) => {
    const route = getRoute(summary.id);
    return route && "waypoints" in route ? [route as RouteDetail] : [];
  });
}

/** Metres along a line of [lng, lat] pairs. */
export function lineLengthM(coordinates: number[][]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const [prevLng, prevLat] = coordinates[i - 1] ?? [];
    const [lng, lat] = coordinates[i] ?? [];
    if (
      typeof prevLng !== "number" ||
      typeof prevLat !== "number" ||
      typeof lng !== "number" ||
      typeof lat !== "number"
    ) {
      continue;
    }
    total += haversineKm({ lat: prevLat, lng: prevLng }, { lat, lng }) * 1000;
  }
  return Math.round(total);
}

/** How close a curated line must pass to the destination to be offered for it. */
const NEAR_DESTINATION_KM = 10;

/** The curated treks that actually reach where the trekker is going. */
export function curatedFor(end: LatLng, withinKm = NEAR_DESTINATION_KM): RouteDetail[] {
  return curatedDetails().filter((detail) =>
    detail.line.coordinates.some((coordinate) => {
      const [lng, lat] = coordinate;
      return typeof lng === "number" && typeof lat === "number" && haversineKm({ lat, lng }, end) <= withinKm;
    }),
  );
}

/**
 * A curated trek as a route the carousel can show. Every number comes from the
 * file — the line's own length, the climb and hours its stages record — so
 * nothing here is an engine estimate and nothing is invented.
 */
export function toCuratedRoute(detail: RouteDetail): PlannedRoute {
  const ascentM = detail.stages.reduce((total, stage) => total + stage.ascentM, 0);
  const hours = detail.stages.reduce((total, stage) => total + stage.hours, 0);
  const head = detail.waypoints.find((waypoint) => waypoint.kind === "trailhead");
  return {
    id: `curated-${detail.id}`,
    label: detail.name,
    source: "curated",
    kind: "trek",
    distanceM: lineLengthM(detail.line.coordinates),
    durationS: Math.round(hours * 3600),
    footHours: 0,
    carDurationS: null,
    trailhead: head ? { name: head.name, lat: head.lat, lng: head.lng } : null,
    ascentM,
    geometry: detail.line,
    stops: [],
    days: [],
  };
}

/**
 * A curated trek's own day plan: the stages the file records, night by night,
 * with the waypoint each one ends at. A curated line has too few points for
 * the effort split to cut it into days, and this is better anyway — it is the
 * schedule people actually walk.
 */
export function stageDays(detail: RouteDetail): DayLeg[] {
  const nameOf = (id: string) => detail.waypoints.find((waypoint) => waypoint.id === id)?.name ?? null;
  return detail.stages.map((stage) => ({
    day: stage.day,
    distanceM: Math.round(stage.distanceKm * 1000),
    ascentM: stage.ascentM,
    hours: stage.hours,
    endName: nameOf(stage.toId),
    highlights: [],
  }));
}
