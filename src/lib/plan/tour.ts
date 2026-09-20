import { haversineKm } from "@/lib/geo";
import { isNature, type InterestId } from "./interests";
import type { LatLng, Poi } from "./types";

/** A city day out is walked, so a day of stops is small and close together. */
const STOPS_PER_DAY = 4;
const MAX_STOPS = 12;

export interface TourVariant {
  id: string;
  label: string;
  stops: Poi[];
}

/**
 * Places OSM marks notable — a wikidata entry, a heritage listing — come first,
 * then the nearest. Without this a day out in Kathmandu is the four closest
 * shrines rather than Boudhanath and the palace museum, and the whole point is
 * to show someone what they came for.
 * ponytail: OSM tags are the only ranking we have; swap in a real one if we
 * ever get visitor numbers.
 */
function rank(start: LatLng, a: Poi, b: Poi): number {
  if (a.notable !== b.notable) return a.notable ? -1 : 1;
  return haversineKm(start, a) - haversineKm(start, b);
}

/** Nearest-neighbour ordering from the start: good enough, and never crosses itself twice. */
export function orderStops(start: LatLng, stops: Poi[]): Poi[] {
  const remaining = [...stops];
  const ordered: Poi[] = [];
  let cursor: LatLng = start;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestKm = Infinity;
    remaining.forEach((poi, index) => {
      const km = haversineKm(cursor, poi);
      if (km < bestKm) {
        bestKm = km;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    if (!next) break;
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

/**
 * Round-robins the interests so a four-stop day isn't four temples, then keeps
 * the closest of each. `preferred` interests are served first.
 */
function pickStops(start: LatLng, pois: Poi[], limit: number, preferred: InterestId[]): Poi[] {
  const byInterest = new Map<InterestId, Poi[]>();
  for (const poi of pois) {
    const list = byInterest.get(poi.interest) ?? [];
    list.push(poi);
    byInterest.set(poi.interest, list);
  }
  for (const list of byInterest.values()) {
    list.sort((a, b) => rank(start, a, b));
  }

  const preferredFirst = (id: InterestId) => (preferred.includes(id) ? 0 : 1);
  const order = [...byInterest.keys()].sort((a, b) => preferredFirst(a) - preferredFirst(b));

  const picked: Poi[] = [];
  let exhausted = false;
  while (picked.length < limit && !exhausted) {
    exhausted = true;
    for (const interest of order) {
      if (picked.length >= limit) break;
      const next = byInterest.get(interest)?.shift();
      if (next) {
        picked.push(next);
        exhausted = false;
      }
    }
  }
  return picked;
}

/** Keeps the first of each name, which is the notable copy after ranking. */
export function dedupeByName(pois: Poi[]): Poi[] {
  const seen = new Set<string>();
  return pois.filter((poi) => {
    const key = poi.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const signature = (stops: Poi[]) =>
  stops
    .map((s) => s.id)
    .sort()
    .join("|");

/**
 * Up to three day-outs from the same pool of places: everything worth seeing,
 * the outdoor version, and a shorter one. Variants that come out identical —
 * which happens when the pool is small or one-sided — are dropped rather than
 * padded, so two real options beat three fake ones.
 */
export function buildTourVariants(
  start: LatLng,
  pool: Poi[],
  days: number,
  interests: InterestId[],
): TourVariant[] {
  // One place often carries tags for two interests (a park that is also a
  // landmark) and OSM holds it as both a node and a way. Visiting it twice in
  // one afternoon is not a feature.
  const pois = dedupeByName(pool);
  if (pois.length === 0) return [];
  const limit = Math.min(MAX_STOPS, Math.max(2, STOPS_PER_DAY * days));
  const nature = interests.filter(isNature);
  const cultural = interests.filter((id) => !isNature(id));

  const candidates: TourVariant[] = [
    { id: "highlights", label: "Highlights", stops: pickStops(start, pois, limit, interests) },
    { id: "outdoors", label: "Outdoors", stops: pickStops(start, pois, limit, nature) },
    { id: "city", label: "Temples & squares", stops: pickStops(start, pois, limit, cultural) },
    {
      id: "easy",
      label: "Easy pace",
      stops: pickStops(start, pois, Math.max(2, Math.ceil(limit / 2)), interests),
    },
  ];

  const seen = new Set<string>();
  const variants: TourVariant[] = [];
  for (const candidate of candidates) {
    if (candidate.stops.length === 0) continue;
    const key = signature(candidate.stops);
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push({ ...candidate, stops: orderStops(start, candidate.stops) });
    if (variants.length === 3) break;
  }
  return variants;
}
