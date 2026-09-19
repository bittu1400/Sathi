import type { RouteDetail } from "@/lib/types";
import type { WaypointTick } from "./ElevationProfile";

/**
 * Profile points in walking order. Distance is the stages' own trail distance;
 * acclimatization days (from = to) are side hikes and don't move you along the trail.
 */
export function profileTicks(route: RouteDetail): WaypointTick[] {
  const byId = (id: string) => route.waypoints.find((w) => w.id === id);
  return route.stages
    .filter((s) => s.fromId !== s.toId)
    .reduce<WaypointTick[]>((ticks, stage) => {
      const from = byId(stage.fromId);
      if (ticks.length === 0 && from) ticks.push({ id: from.id, name: from.name, altitudeM: from.altM, distanceKm: 0 });
      const to = byId(stage.toId);
      if (to) ticks.push({ id: to.id, name: to.name, altitudeM: to.altM, distanceKm: (ticks.at(-1)?.distanceKm ?? 0) + stage.distanceKm });
      return ticks;
    }, []);
}
