import type { LatLng, PlannedRoute, RouteSource } from "./types";

// Server only: ORS_API_KEY must never reach the client (CLAUDE.md rule 5).
// Imported by src/app/api/plan/route.ts and nothing else.

const ORS_BASE = "https://api.openrouteservice.org/v2/directions";

/** Nepal, generously. Anything outside is rejected before spending a request. */
export const NEPAL_BBOX = { west: 79.9, south: 26.2, east: 88.3, north: 30.6 };

export function inNepal(point: LatLng): boolean {
  return (
    point.lat >= NEPAL_BBOX.south &&
    point.lat <= NEPAL_BBOX.north &&
    point.lng >= NEPAL_BBOX.west &&
    point.lng <= NEPAL_BBOX.east
  );
}

export class PlanError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PlanError";
  }
}

interface OrsFeature {
  geometry?: { type?: string; coordinates?: number[][] };
  properties?: {
    summary?: { distance?: number; duration?: number };
    ascent?: number;
  };
}

/**
 * ORS features → our shape. Exported for its test: it is the part that breaks
 * silently when the API changes, and a route with no geometry must be dropped
 * rather than drawn as an empty line.
 */
export function toPlannedRoutes(features: OrsFeature[], source: RouteSource): PlannedRoute[] {
  return features.flatMap((feature, index) => {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
    const summary = feature.properties?.summary ?? {};
    return [
      {
        id: `${source}-${index}`,
        label: index === 0 ? "Fastest" : `Alternative ${index}`,
        source,
        kind: "trek",
        distanceM: Math.round(summary.distance ?? 0),
        durationS: Math.round(summary.duration ?? 0),
        ascentM: typeof feature.properties?.ascent === "number" ? Math.round(feature.properties.ascent) : null,
        // ORS sends [lng, lat, elevation]; the third value is kept, GeoJSON allows it.
        geometry: { type: "LineString", coordinates },
        // Filled in by the planner once it knows what the line passes.
        stops: [],
        days: [],
      },
    ];
  });
}

export type Profile = "foot-hiking" | "foot-walking" | "driving-car";

async function directions(profile: Profile, points: LatLng[], key: string, alternatives: boolean) {
  return fetch(`${ORS_BASE}/${profile}/geojson`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: points.map((p) => [p.lng, p.lat]),
      elevation: true,
      instructions: false,
      // Up to three genuinely different lines: share_factor caps how much of the
      // way they may have in common, weight_factor how much worse they may be.
      // ORS only allows this under 100 km, hence the retry without it.
      ...(alternatives
        ? { alternative_routes: { target_count: 3, share_factor: 0.6, weight_factor: 1.6 } }
        : {}),
    }),
  });
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } | string } | null;
  const error = body?.error;
  if (typeof error === "string") return error;
  return error?.message ?? `Route service returned ${response.status}`;
}

/**
 * Three route candidates between two points. `foot-hiking` is the real answer
 * for a trek, but ORS refuses it beyond its distance limit, so a long request
 * falls back to the road route and says so through `source`.
 */
export async function fetchCandidates(start: LatLng, end: LatLng): Promise<PlannedRoute[]> {
  const key = requireKey();
  if (!inNepal(start) || !inNepal(end)) {
    throw new PlanError(400, "Sathi plans routes inside Nepal only.");
  }

  const profiles: Profile[] = ["foot-hiking", "driving-car"];
  let lastMessage = "Route service unavailable.";

  for (const profile of profiles) {
    // Long trips lose the alternatives, not the route: one honest line beats none.
    for (const alternatives of [true, false]) {
      const response = await directions(profile, [start, end], key, alternatives);
      if (response.ok) {
        const body = (await response.json()) as { features?: OrsFeature[] };
        const routes = toPlannedRoutes(body.features ?? [], profile === "foot-hiking" ? "hiking" : "driving");
        if (routes.length > 0) return routes;
        lastMessage = "No route found between those points.";
        break;
      }
      // Our key, not the request: another profile cannot help.
      if (response.status === 401 || response.status === 403) {
        throw new PlanError(502, "Route service rejected our key.");
      }
      lastMessage = await readError(response);
      if (response.status >= 500) throw new PlanError(502, lastMessage);
      // Anything else (too far to walk, no path) falls through: drop the
      // alternatives first, then try the road profile.
    }
  }

  throw new PlanError(502, lastMessage);
}

function requireKey(): string {
  const key = process.env.ORS_API_KEY;
  if (!key) throw new PlanError(503, "Route planning is not configured yet.");
  return key;
}

/**
 * One walking route through every point in order: the shape of a day out, where
 * the stops are the point of the route. Returns null when ORS can't join them,
 * so the caller can drop that variant and keep the others.
 */
export async function fetchThrough(points: LatLng[], profile: Profile = "foot-walking"): Promise<PlannedRoute | null> {
  const key = requireKey();
  if (points.length < 2) return null;
  if (points.some((point) => !inNepal(point))) {
    throw new PlanError(400, "Sathi plans routes inside Nepal only.");
  }
  const response = await directions(profile, points, key, false);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new PlanError(502, "Route service rejected our key.");
    }
    console.error("Through-route failed:", await readError(response));
    return null;
  }
  const body = (await response.json()) as { features?: OrsFeature[] };
  const [route] = toPlannedRoutes(body.features ?? [], profile === "driving-car" ? "driving" : "hiking");
  return route ?? null;
}

const ORS_GEOCODE = "https://api.openrouteservice.org/geocode/autocomplete";

export interface Place {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
}

interface GeocodeFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    id?: string;
    gid?: string;
    name?: string;
    label?: string;
    locality?: string;
    county?: string;
    region?: string;
    layer?: string;
  };
}

/**
 * Pelias features → the same shape the curated treks use, so both can sit in
 * one list. Exported for its test; a feature without a name or a point is
 * dropped rather than shown as a tappable nothing.
 */
export function toPlaces(features: GeocodeFeature[]): Place[] {
  const seen = new Set<string>();
  return features.flatMap((feature, index) => {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties ?? {};
    const name = properties.name?.trim();
    if (!name || !Array.isArray(coordinates) || coordinates.length < 2) return [];
    const [lng, lat] = coordinates as [number, number];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const key = `${name}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    if (seen.has(key)) return [];
    seen.add(key);
    // Whatever tells two places of the same name apart, nearest first.
    const detail = [properties.locality, properties.county, properties.region]
      .filter((part): part is string => Boolean(part) && part !== name)
      .join(" · ");
    return [
      {
        id: properties.gid ?? properties.id ?? `place-${index}`,
        name,
        detail: detail || properties.layer || "Nepal",
        lat,
        lng,
      },
    ];
  });
}

/** Place search over Nepal. The key is ORS's, so this runs on the server only. */
export async function geocode(text: string): Promise<Place[]> {
  const key = requireKey();
  const url = new URL(ORS_GEOCODE);
  url.searchParams.set("api_key", key);
  url.searchParams.set("text", text);
  url.searchParams.set("boundary.country", "NPL");
  url.searchParams.set("size", "8");
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new PlanError(502, "Place search rejected our key.");
    }
    throw new PlanError(502, await readError(response));
  }
  const body = (await response.json()) as { features?: GeocodeFeature[] };
  // A point outside our bbox can't be routed, so it is never offered.
  return toPlaces(body.features ?? []).filter((place) => inNepal(place));
}
