import { Waypoint } from "./types";

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function nearestWaypoints(
  lat: number,
  lng: number,
  waypoints: Waypoint[]
): { waypoint: Waypoint; distanceKm: number }[] {
  return waypoints
    .map((wp) => ({
      waypoint: wp,
      distanceKm: haversineDistanceKm(lat, lng, wp.lat, wp.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function estimateAltitude(
  lat: number,
  lng: number,
  waypoints: Waypoint[]
): number | null {
  if (!waypoints || waypoints.length === 0) return null;
  const sorted = nearestWaypoints(lat, lng, waypoints);
  const closest = sorted[0];
  if (!closest) return null;

  if (closest.distanceKm < 0.1 || sorted.length < 2) {
    return closest.waypoint.altM;
  }

  const second = sorted[1];
  if (!second || second.distanceKm > 10) {
    return closest.waypoint.altM;
  }

  // Inverse distance weighted average between nearest 2 waypoints
  const w1 = 1 / Math.max(closest.distanceKm, 0.01);
  const w2 = 1 / Math.max(second.distanceKm, 0.01);

  return Math.round(
    (closest.waypoint.altM * w1 + second.waypoint.altM * w2) / (w1 + w2)
  );
}
