import { getRoute, getRoutes } from "@/lib/data";
import { haversineKm } from "@/lib/geo";
import type { RouteDetail } from "@/lib/types";
import { fetchDuration } from "./ors";
import { fetchPois } from "./overpass";
import type { LatLng } from "./types";

// Server only: reaches ORS and Overpass. Imported by the planner alone.

/** Where a trek really begins, and how we know. */
export interface Trailhead extends LatLng {
  name: string;
  source: "curated" | "roadhead";
}

/** How far from the destination we look for a place the road reaches. */
const ROADHEAD_RADIUS_M = 40_000;
/** Driving probes cost a request each, so only the nearest few are tried. */
const ROADHEAD_PROBES = 3;

/**
 * The trailhead of a curated trek whose own bounding box holds the
 * destination — Everest Base Camp is reached from Lukla, and the file says so.
 * Only treks we hold full data for have waypoints, so this answers for those
 * and nothing else. Exported for its test: it needs no network.
 */
export function curatedTrailhead(end: LatLng): Trailhead | null {
  for (const summary of getRoutes()) {
    const route = getRoute(summary.id);
    if (!route || !("waypoints" in route)) continue;
    const detail = route as RouteDetail;
    const [west, south, east, north] = detail.bbox;
    if (end.lat < south || end.lat > north || end.lng < west || end.lng > east) continue;
    const head = detail.waypoints.find((waypoint) => waypoint.kind === "trailhead");
    if (head) return { name: head.name, lat: head.lat, lng: head.lng, source: "curated" };
  }
  return null;
}

/**
 * The nearest settlement to the destination that a car can actually reach from
 * the trekker's start: where the road ends and the walking begins. Costs one
 * driving request per candidate, so it tries the nearest few and gives up —
 * a missing trailhead only means we fall back to the whole-way route.
 */
export async function roadhead(start: LatLng, end: LatLng): Promise<Trailhead | null> {
  const settlements = await fetchPois(end, ROADHEAD_RADIUS_M, ["villages", "teahouses"], 60);
  const nearest = settlements
    .map((poi) => ({ poi, km: haversineKm(end, poi) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, ROADHEAD_PROBES);
  for (const { poi } of nearest) {
    try {
      const seconds = await fetchDuration("driving-car", start, poi);
      if (seconds !== null) return { name: poi.name, lat: poi.lat, lng: poi.lng, source: "roadhead" };
    } catch {
      // A refused probe is not an answer about the next one.
    }
  }
  return null;
}

