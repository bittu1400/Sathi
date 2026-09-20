import type { Metadata } from "next";
import { getRoute, getRoutes } from "@/lib/data";
import type { RouteDetail } from "@/lib/types";
import { PlanScreen } from "@/components/plan/PlanScreen";
import type { Destination } from "@/components/plan/DestinationSearch";

export const metadata: Metadata = {
  title: "Sathi — plan your route",
  description: "Tell Sathi where you want to go and what you want to see. It maps the three best routes.",
};

/**
 * Only treks with full data have real coordinates, and coordinates are never
 * invented (CLAUDE.md rule 6), so the others are left out until their route
 * files exist. Place search over the whole country lands with the routing key.
 */
function curatedDestinations(): Destination[] {
  return getRoutes().flatMap((summary) => {
    if (!summary.hasFullData) return [];
    const detail = getRoute(summary.id) as RouteDetail | null;
    const waypoints = detail?.waypoints ?? [];
    if (waypoints.length === 0) return [];
    const highest = waypoints.reduce((a, b) => (b.altM > a.altM ? b : a));
    return [
      {
        id: summary.id,
        routeId: summary.id,
        name: summary.name,
        detail: `${summary.region} · from ${summary.startPoint} · ${summary.days[0]}–${summary.days[1]} days`,
        lat: highest.lat,
        lng: highest.lng,
      },
    ];
  });
}

export default function HomePage() {
  // A basemap key is used by the map in the browser, so it is passed down
  // rather than kept server-side like the secrets in CLAUDE.md rule 5.
  return <PlanScreen destinations={curatedDestinations()} basemapKey={process.env.CARTO_BASEMAPS_API_KEY} />;
}
