import { haversineKm } from "@/lib/geo";
import { OVERPASS_FILTERS, type InterestId } from "./interests";
import type { LatLng, Poi } from "./types";

// Server only. Overpass needs no key, but it is a shared public service run on
// donated hardware: every query here is bounded by a bbox, a result limit and a
// timeout, and the planner caches what comes back.

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const TIMEOUT_MS = 20_000;
// Overpass blocks requests that don't identify themselves (HTTP 406).
const USER_AGENT = "Sathi/0.1 (offline trekking safety app for Nepal; github.com/bittu1400/Sathi)";

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface Bbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Degrees per kilometre, near enough at Nepal's latitudes. */
const KM_PER_DEG_LAT = 111;

export function bboxAround(centre: LatLng, radiusM: number): Bbox {
  const dLat = radiusM / 1000 / KM_PER_DEG_LAT;
  const dLng = dLat / Math.max(0.2, Math.cos((centre.lat * Math.PI) / 180));
  return {
    south: centre.lat - dLat,
    west: centre.lng - dLng,
    north: centre.lat + dLat,
    east: centre.lng + dLng,
  };
}

export function bboxOf(points: LatLng[], padM = 0): Bbox | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = padM / 1000 / KM_PER_DEG_LAT;
  return {
    south: Math.min(...lats) - pad,
    west: Math.min(...lngs) - pad,
    north: Math.max(...lats) + pad,
    east: Math.max(...lngs) + pad,
  };
}

/** At most `max` evenly spaced points: a 9,000-point line is no use to anyone here. */
export function decimate(coordinates: number[][], max = 60): LatLng[] {
  const points = coordinates.flatMap((c) => {
    const [lng, lat] = c;
    return typeof lng === "number" && typeof lat === "number" ? [{ lat, lng }] : [];
  });
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]).flatMap((p) => (p ? [p] : []));
}

/**
 * Overpass elements → our POIs, one pass, each element matched to the interest
 * its tags satisfy. Anything without a name or a point is dropped: an unnamed
 * dot helps nobody read a day plan.
 */
export function toPois(elements: OverpassElement[], interests: InterestId[]): Poi[] {
  const seen = new Set<string>();
  return elements.flatMap((element) => {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const name = element.tags?.name;
    if (lat === undefined || lng === undefined || !name) return [];
    const interest = interests.find((id) => matches(element.tags ?? {}, id));
    if (!interest) return [];
    // The same place often comes back as both a node and a way.
    const key = `${name}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const tags = element.tags ?? {};
    return [
      {
        id: `${element.type}/${element.id}`,
        name,
        lat,
        lng,
        interest,
        kind: tags.amenity ?? tags.tourism ?? tags.natural ?? tags.place ?? tags.historic ?? "",
        notable: Boolean(tags.wikidata || tags.wikipedia || tags.heritage || tags.historic),
      },
    ];
  });
}

function buildQuery(bbox: Bbox, interests: InterestId[], limit: number): string {
  // The bbox goes in the settings line, so every clause inherits it: far
  // cheaper than an `around` per clause, which times out over a city.
  const box = `${bbox.south.toFixed(5)},${bbox.west.toFixed(5)},${bbox.north.toFixed(5)},${bbox.east.toFixed(5)}`;
  const filters = [...new Set(interests.flatMap((interest) => OVERPASS_FILTERS[interest]))];
  const clauses = filters.map((filter) => `nwr${filter};`).join("");
  return `[out:json][timeout:25][bbox:${box}];(${clauses});out center ${limit};`;
}

async function runQuery(bbox: Bbox, interests: InterestId[], limit: number): Promise<Poi[]> {
  if (interests.length === 0) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: new URLSearchParams({ data: buildQuery(bbox, interests, limit) }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error("Overpass returned", response.status);
      return [];
    }
    const body = (await response.json()) as { elements?: OverpassElement[]; remark?: string };
    // Overpass reports its own timeouts in `remark` with a 200 and no elements.
    if (body.remark) console.error("Overpass remark:", body.remark);
    return toPois(body.elements ?? [], interests);
  } catch (error) {
    // Not fatal: the planner still has routes, it just can't say what is on them.
    console.error("Overpass query failed:", error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Named places around a point. */
export async function fetchPois(
  centre: LatLng,
  radiusM: number,
  interests: InterestId[],
  limit = 150,
): Promise<Poi[]> {
  return runQuery(bboxAround(centre, radiusM), interests, limit);
}

/**
 * Named places along a route. The query covers the line's bounding box, which
 * for a long trek is far wider than the trail, so the result is filtered back
 * down to what is actually within `radiusM` of the line.
 */
export async function fetchPoisAlong(
  coordinates: number[][],
  radiusM: number,
  interests: InterestId[],
  limit = 300,
): Promise<Poi[]> {
  const line = decimate(coordinates);
  const bbox = bboxOf(line, radiusM);
  if (!bbox || line.length < 2) return [];
  const pois = await runQuery(bbox, interests, limit);
  return poisNear(pois, coordinates, radiusM);
}

/**
 * Which of these places one particular line passes. Alternatives between the
 * same two points share a corridor, so they are fetched once and then split up
 * with this rather than with a query each. Exported for its test.
 */
export function poisNear(pois: Poi[], coordinates: number[][], radiusM: number): Poi[] {
  // Denser than the 60 points a bbox needs: at 60, a 300 km line is sampled
  // every 5 km and a place 2 km off the trail falls between two samples.
  const line = decimate(coordinates, 400);
  if (line.length < 2) return [];
  return pois.filter((poi) => line.some((point) => haversineKm(point, poi) * 1000 <= radiusM));
}

/**
 * Places sorted by how far along the line they are reached, so the map can
 * number the pins in walking order. Exported for its test.
 */
export function orderAlong(pois: Poi[], coordinates: number[][]): Poi[] {
  const line = decimate(coordinates, 400);
  if (line.length < 2) return pois;
  const position = (poi: Poi) => {
    let bestIndex = 0;
    let bestKm = Infinity;
    line.forEach((point, index) => {
      const km = haversineKm(point, poi);
      if (km < bestKm) {
        bestKm = km;
        bestIndex = index;
      }
    });
    return bestIndex;
  };
  return [...pois]
    .map((poi) => ({ poi, at: position(poi) }))
    .sort((a, b) => a.at - b.at)
    .map(({ poi }) => poi);
}

/** Which interest an element's tags satisfy. Exported for its test. */
export function matches(tags: Record<string, string>, interest: InterestId): boolean {
  switch (interest) {
    case "mountains":
      return tags.natural === "peak" || tags.mountain_pass === "yes";
    case "rivers":
      return tags.waterway === "river";
    case "sunrise":
      return tags.tourism === "viewpoint";
    case "lakes":
      return tags.natural === "water" && (tags.water === "lake" || tags.water === "reservoir");
    case "waterfalls":
      return tags.waterway === "waterfall";
    case "forests":
      return tags.leisure === "park" || tags.boundary === "national_park";
    case "culture":
      return (
        tags.amenity === "place_of_worship" ||
        tags.tourism === "museum" ||
        ["monument", "memorial", "stupa"].includes(tags.historic ?? "")
      );
    case "villages":
      return ["village", "town", "square"].includes(tags.place ?? "") || tags.tourism === "attraction";
    case "teahouses":
      return ["hotel", "guest_house", "alpine_hut"].includes(tags.tourism ?? "") || tags.amenity === "cafe";
    case "wildlife":
      return tags.boundary === "protected_area" || tags.tourism === "zoo";
  }
}
