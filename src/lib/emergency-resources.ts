import type { Resource } from "@/lib/types";
import { getResources } from "@/lib/data";
import { nearest } from "@/lib/geo";

const HIGH_ALT_KINDS = new Set(["helipad", "heli_operator", "hra_post"]);

/**
 * Nearest resources from the single emergency directory (src/data/resources.json).
 * For altitude illness at ≥ 4,000 m, evacuation-capable resources come first.
 */
export function getNearestResources(
  lat: number,
  lng: number,
  category?: string,
  altM?: number | null,
  limit = 5,
): (Resource & { distanceKm: number })[] {
  const byDistance = nearest(getResources(), { lat, lng });
  const highAltAms = category === "altitude_illness" && (altM ?? 0) >= 4000;
  const ranked = highAltAms
    ? [
        ...byDistance.filter((r) => HIGH_ALT_KINDS.has(r.kind)),
        ...byDistance.filter((r) => !HIGH_ALT_KINDS.has(r.kind)),
      ]
    : byDistance;
  return ranked.slice(0, limit);
}
