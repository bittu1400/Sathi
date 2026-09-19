import { RouteSummary, RouteDetail, Resource } from "./types";
import routesSummaryData from "@/data/routes/index.json";
import ebcData from "@/data/routes/ebc.json";
import resourcesData from "@/data/resources.json";
import routeLinesData from "@/data/route-lines.json";

/** Trail line for every route (routed along OSM paths, unverified). Built by scripts/build-route-lines.ts. */
export interface RouteLine {
  tilesUrl: string;
  bbox: RouteDetail["bbox"];
  line: GeoJSON.LineString;
  stops: { name: string; lat: number; lng: number }[];
}

export function getRoutes(): RouteSummary[] {
  return routesSummaryData as RouteSummary[];
}

export function getRoute(id: string): RouteDetail | RouteSummary | null {
  if (id === "ebc") {
    return ebcData as unknown as RouteDetail;
  }
  const summary = (routesSummaryData as RouteSummary[]).find((r) => r.id === id);
  return summary || null;
}

export function getResources(): Resource[] {
  return resourcesData as Resource[];
}

export function getRouteLines(): Record<string, RouteLine> {
  return routeLinesData as unknown as Record<string, RouteLine>;
}
