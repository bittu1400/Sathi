import { RouteSummary, RouteDetail, Resource } from "./types";
import routesSummaryData from "@/data/routes/index.json";
import ebcData from "@/data/routes/ebc.json";
import resourcesData from "@/data/resources.json";

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
