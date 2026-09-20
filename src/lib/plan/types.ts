export type { InterestId } from "./interests";
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

/** A named place worth walking past, from OpenStreetMap. */
export interface Poi extends LatLng {
  id: string;
  name: string;
  interest: InterestId;
  kind: string;
  /** Carries a wikidata/wikipedia/heritage tag in OSM: a place people travel for. */
  notable: boolean;
}

/** How the geometry was produced: a routing engine, or one of our trek files. */
export type RouteSource = "hiking" | "driving" | "curated";

/**
 * A city day out visits several places and comes back; a trek covers ground
 * between two points over several days. The two need different plans, so the
 * planner says which one it made.
 */
export type PlanKind = "tour" | "trek";

export interface DayLeg {
  day: number;
  distanceM: number;
  ascentM: number | null;
  hours: number;
  /** Where the day ends: a settlement for a trek, the last stop for a tour. */
  endName: string | null;
  highlights: string[];
}

export interface PlannedRoute {
  id: string;
  label: string;
  source: RouteSource;
  kind: PlanKind;
  distanceM: number;
  /** Engine estimate in seconds of travel, not of the trek's days. */
  durationS: number;
  /**
   * Walking time by Naismith over this line, so the card and the day plan
   * never disagree. Always present: it needs no second request.
   */
  footHours: number;
  /** Driving time for the same trip, or null when no road joins the two ends. */
  carDurationS: number | null;
  ascentM: number | null;
  geometry: GeoJSON.LineString;
  /** The places this route was built to pass, in order. */
  stops: Poi[];
  days: DayLeg[];
}

export interface PlanResult {
  kind: PlanKind;
  routes: PlannedRoute[];
}
