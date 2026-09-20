export type { InterestId } from "./interests";
import type { InterestId } from "./interests";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * What shape of trip the trekker asked for. `auto` lets the planner decide,
 * which is right for a visitor; a local who knows the place picks `direct` and
 * gets exactly the line between their two points, no loop and no detour.
 */
export type PlanMode = "auto" | "direct" | "tour";

export interface PlanRequest {
  start: LatLng;
  end: LatLng;
  days: number;
  interests: InterestId[];
  mode: PlanMode;
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
 * between two points over several days; a direct trip is the line between two
 * points the trekker named, exactly. The three need different plans, so the
 * planner says which one it made.
 */
export type PlanKind = "tour" | "trek" | "direct";

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
  /**
   * The places the trekker asked to see on this route, in the order they are
   * reached: the stops a day out was built around, and for a line route the
   * matching places it turned out to pass. The map pins them.
   */
  stops: Poi[];
  days: DayLeg[];
}

export interface PlanResult {
  kind: PlanKind;
  routes: PlannedRoute[];
}
