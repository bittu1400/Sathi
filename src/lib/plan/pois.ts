import { haversineKm } from "@/lib/geo";
import kathmandu from "@/data/pois/kathmandu.json";
import pokhara from "@/data/pois/pokhara.json";
import type { InterestId } from "./interests";
import { fetchPois, type Bbox } from "./overpass";
import type { LatLng, Poi } from "./types";

interface Region {
  id: string;
  name: string;
  bbox: Bbox;
  pois: Poi[];
}

/**
 * OpenStreetMap extracts for the cities the demo plans around, baked by
 * scripts/fetch-pois.mts. Overpass is a shared public service and was timing
 * out on us; a city day out shouldn't fail because of that.
 */
const REGIONS = [kathmandu, pokhara] as unknown as Region[];

export function regionFor(point: LatLng): Region | null {
  return (
    REGIONS.find(
      (region) =>
        point.lat >= region.bbox.south &&
        point.lat <= region.bbox.north &&
        point.lng >= region.bbox.west &&
        point.lng <= region.bbox.east,
    ) ?? null
  );
}

export function filterPois(pois: Poi[], centre: LatLng, radiusM: number, interests: InterestId[]): Poi[] {
  const wanted = new Set<string>(interests);
  return pois.filter((poi) => wanted.has(poi.interest) && haversineKm(centre, poi) * 1000 <= radiusM);
}

/**
 * Places around a point: the baked extract when the point is inside one, the
 * live service when it isn't. Either way an empty list is a valid answer.
 */
export async function poisAround(centre: LatLng, radiusM: number, interests: InterestId[]): Promise<Poi[]> {
  const region = regionFor(centre);
  if (region) {
    const local = filterPois(region.pois, centre, radiusM, interests);
    if (local.length > 0) return local;
  }
  return fetchPois(centre, radiusM, interests);
}
