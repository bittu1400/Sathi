import type { InterestId } from "./interests";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlanRequest {
  start: LatLng;
  end: LatLng;
  days: number;
  interests: InterestId[];
}

/** How the geometry was produced: a routing engine, or one of our trek files. */
export type RouteSource = "hiking" | "driving" | "curated";

export interface PlannedRoute {
  id: string;
  label: string;
  source: RouteSource;
  distanceM: number;
  /** Engine estimate in seconds of travel, not of the trek's days. */
  durationS: number;
  ascentM: number | null;
  geometry: GeoJSON.LineString;
}

export interface PlanResult {
  routes: PlannedRoute[];
}
