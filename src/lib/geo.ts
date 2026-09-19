import type {
  ResourceKind,
  RouteDetail,
  Waypoint,
} from "@/lib/types";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface NearestOptions {
  kinds?: ResourceKind[];
  limit?: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const latDelta = ((b.lat - a.lat) * Math.PI) / 180;
  const lngDelta = ((b.lng - a.lng) * Math.PI) / 180;
  const latA = (a.lat * Math.PI) / 180;
  const latB = (b.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function nearest<T extends GeoPoint>(
  items: T[],
  point: GeoPoint,
  options: NearestOptions = {},
): Array<T & { distanceKm: number }> {
  const filtered = options.kinds
    ? items.filter((item) => {
        const itemKind = "kind" in item ? item.kind : undefined;
        return options.kinds?.includes(itemKind as ResourceKind);
      })
    : items;

  const result = filtered
    .map((item) => ({
      ...item,
      distanceKm: haversineKm(item, point),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return options.limit === undefined
    ? result
    : result.slice(0, Math.max(0, options.limit));
}

export function nearestWaypoint(
  route: Pick<RouteDetail, "waypoints">,
  point: GeoPoint,
): { waypoint: Waypoint; distanceKm: number; index: number } {
  const [first, ...rest] = route.waypoints;
  if (!first) {
    throw new Error("Route must contain at least one waypoint");
  }

  return rest.reduce(
    (closest, waypoint, offset) => {
      const distanceKm = haversineKm(waypoint, point);
      return distanceKm < closest.distanceKm
        ? { waypoint, distanceKm, index: offset + 1 }
        : closest;
    },
    {
      waypoint: first,
      distanceKm: haversineKm(first, point),
      index: 0,
    },
  );
}

export function estimateAltitude(
  route: Pick<RouteDetail, "waypoints">,
  point: GeoPoint,
  gpsAltM: number | null,
  gpsAccuracyM: number | null = null,
): number {
  if (gpsAltM !== null && gpsAccuracyM !== null && gpsAccuracyM < 50) {
    return gpsAltM;
  }

  const nearestPoints = nearest(route.waypoints, point, { limit: 2 });
  const [first, second] = nearestPoints;
  if (!first) {
    throw new Error("Route must contain at least one waypoint");
  }
  if (!second) {
    return first.altM;
  }

  const totalDistance = first.distanceKm + second.distanceKm;
  if (totalDistance === 0) {
    return first.altM;
  }

  return (
    (first.altM * second.distanceKm + second.altM * first.distanceKm) /
    totalDistance
  );
}

export function nextWaypoint(
  route: Pick<RouteDetail, "waypoints">,
  point: GeoPoint,
): Waypoint | null {
  const { index } = nearestWaypoint(route, point);
  return route.waypoints[index + 1] ?? null;
}
