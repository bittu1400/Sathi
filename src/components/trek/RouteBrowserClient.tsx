"use client";

import * as React from "react";
import { RouteSummary } from "@/lib/types";
import { RouteCard } from "./RouteCard";
import { RouteFilters, FilterState } from "./RouteFilters";
import { EmptyState } from "../ui/empty-state";

export function RouteBrowserClient({ routes }: { routes: RouteSummary[] }) {
  const [filters, setFilters] = React.useState<FilterState>({
    terrain: [],
    sortBy: "popular",
  });

  const filteredRoutes = React.useMemo(() => {
    return routes
      .filter((r) => {
        if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
        if (filters.daysRange === "short" && r.days[0] > 7) return false;
        if (filters.daysRange === "medium" && (r.days[1] < 8 || r.days[0] > 14)) return false;
        if (filters.daysRange === "long" && r.days[1] < 15) return false;
        if (
          filters.terrain.length > 0 &&
          !filters.terrain.some((t) => r.terrain.includes(t))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "shortest") return a.days[0] - b.days[0];
        if (filters.sortBy === "highest") return b.maxAltitudeM - a.maxAltitudeM;
        return 0;
      });
  }, [routes, filters]);

  return (
    <div className="space-y-6">
      <RouteFilters filters={filters} onChange={setFilters} />

      {filteredRoutes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Matching Trek Routes"
          description="Try clearing or adjusting your terrain, difficulty, or duration filters."
        />
      )}
    </div>
  );
}
